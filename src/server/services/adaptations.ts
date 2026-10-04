import "server-only";
import { createHash, randomUUID } from "node:crypto";
import {
  adaptationDraft,
  generatedAdaptationDraft,
  adaptationInput,
  adaptationEdit,
  type AdaptationPlan,
  type AdaptationInput,
} from "@/lib/contracts/adaptation";
import type { Innovation, Need } from "@/lib/contracts";
import { config } from "@/server/config";
import { sqlClient } from "@/server/db/client";
import { HttpError } from "@/server/http";
import { createLiveAiProvider } from "@/server/ai/provider";
import { catalogVersion } from "./catalog";
import { getNeed, listInnovations, consumeLimit } from "./repository";
type Row = {
  id: string;
  owner_id: string;
  request_key: string;
  input_hash: string;
  state: string;
  attempt_id: string;
  record: AdaptationPlan | null;
  updated_at: Date;
};
const root = globalThis as unknown as { miPlans?: Map<string, Row> };
function fixtures() {
  const c = config();
  if (c.DATA_PROVIDER === "fixtures" && c.DEMO_DATA_ENABLED !== "true")
    throw new Error("FIXTURES_DISABLED");
  return c.DATA_PROVIDER === "fixtures";
}
const memory = () => (root.miPlans ??= new Map());
const missing = () =>
  new HttpError(
    404,
    "NOT_FOUND",
    "Plan jest niedostępny w tej sesji albo jego materiał źródłowy został zmieniony lub ukryty.",
  );
const conflict = () =>
  new HttpError(
    409,
    "CONFLICT",
    "Plan zmienił się w międzyczasie. Zachowaj swoje zmiany i odśwież stronę.",
  );
function validateSources(
  draft: AdaptationPlan["draft"],
  innovation: Innovation,
) {
  if (
    draft.sourceIds.some(
      (id) => !innovation.sources.some((s) => s.id === id),
    ) ||
    new Set(draft.sourceIds).size !== draft.sourceIds.length
  )
    throw new Error("INVALID_PLAN_SOURCES");
}
export async function getPlan(id: string, ownerId: string) {
  const row = fixtures()
    ? memory().get(id)
    : (
        await sqlClient()<
          Row[]
        >`select * from adaptations where id=${id} and owner_id=${ownerId}`
      )[0];
  if (!row || row.owner_id !== ownerId || row.state !== "ready" || !row.record)
    return null;
  const innovation = (await listInnovations()).find(
    (r) => r.id === row.record!.innovationId,
  );
  if (!innovation || catalogVersion(innovation) !== row.record.sourceVersion)
    return null;
  return structuredClone(row.record);
}
export async function listPlans(ownerId: string) {
  const rows = fixtures()
    ? [...memory().values()].filter(
        (r) => r.owner_id === ownerId && r.state === "ready",
      )
    : await sqlClient()<
        Row[]
      >`select * from adaptations where owner_id=${ownerId} and state='ready' order by updated_at desc limit 100`;
  const innovations = await listInnovations();
  return rows.flatMap((row) => {
    const p = row.record;
    const r =
      p &&
      innovations.find(
        (r) => r.id === p.innovationId && catalogVersion(r) === p.sourceVersion,
      );
    return p && r ? [{ id: p.id, title: r.title, revision: p.revision }] : [];
  });
}
function demoDraft(input: AdaptationInput, need: Need, r: Innovation) {
  return adaptationDraft.parse({
    firstStep: {
      action:
        "Omów z koordynatorem zakres małej próby i warunki zastosowania rozwiązania.",
      responsible:
        "Rola do wyznaczenia: osoba koordynująca po stronie instytucji.",
      resources: input.constraints.resources.slice(0, 600),
      completion:
        "Zapisano uzgodniony zakres próby, osobę odpowiedzialną i pytania wymagające wyjaśnienia. To proponowane kryterium, nie osiągnięty wynik.",
    },
    summary: `Szkic demonstracyjny zastosowania „${r.title}” w instytucji: ${input.constraints.institution}.`,
    serviceDescription: `Propozycja do rozmowy: dostosować sposób udostępnienia rozwiązania do wskazanej grupy i zasobów. Zakres zgłoszony przez autora: ${input.constraints.scope}.`,
    fitAndGaps: `Tematyka źródła: ${r.problem.slice(0, 500)}. Potrzeba autora: ${need.description.slice(0, 350)}. Zbieżność tematu nie potwierdza skuteczności; dopasowanie wymaga oceny eksperta.`,
    steps: [
      "Omów potrzebę i ograniczenia z koordynatorem.",
      "Sprawdź warunki zastosowania i dostępność zasobów.",
      "Uzgodnij niewielki pilotaż i sposób zbierania anonimowych uwag.",
    ],
    requiredRoles: [
      "Osoba koordynująca po stronie instytucji — do wyznaczenia.",
      "Ekspert znający rozwiązanie — do uzgodnienia, bez deklaracji dostępności.",
    ],
    requiredResources: [
      input.constraints.resources.slice(0, 600),
      ...r.requirements.slice(0, 3),
    ],
    pilot: {
      scope: input.constraints.scope,
      activities: [
        "Uzgodnienie zakresu i zasad udziału.",
        "Próba usługi z dobrowolnymi uczestnikami i omówienie uwag.",
      ],
      proposedMetrics: [
        "Liczba osób, które dobrowolnie skorzystały z próby — bez ustalonego z góry celu.",
        "Anonimowe opinie o przydatności i barierach; sposób pomiaru do uzgodnienia.",
      ],
    },
    risks: [
      "Zasoby i zakres mogą nie odpowiadać warunkom oryginalnej innowacji.",
      "Pilotaż wymaga sprawdzenia dostępności i zasad ochrony uczestników.",
    ],
    openQuestions: [
      "Które elementy rozwiązania można zmienić bez utraty jego sensu?",
      "Kto zapewni zasoby i jak ocenimy wynik pilotażu?",
    ],
    assumptions: [
      "To deterministyczny przykład, bez wywołania AI i bez oceny skuteczności.",
      `Termin podany przez autora: ${input.constraints.timeline || "nieustalony"}.`,
      `Budżet podany przez autora: ${input.constraints.budget || "nieustalony; koszty trzeba oszacować"}.`,
    ],
    sourceIds: r.sources.map((s) => s.id),
  });
}
export async function createPlan(ownerId: string, value: unknown) {
  const input = adaptationInput.parse(value);
  const need = await getNeed(input.needId, ownerId);
  const innovation = (await listInnovations()).find(
    (r) => r.id === input.innovationId,
  );
  if (!need || !innovation) throw missing();
  const inputHash = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  const demo = fixtures(),
    attempt = randomUUID();
  const row: Row = {
    id: randomUUID(),
    owner_id: ownerId,
    request_key: input.requestKey,
    input_hash: inputHash,
    state: "generating",
    attempt_id: attempt,
    record: null,
    updated_at: new Date(),
  };
  let claimed = false;
  let previous: Row | undefined;
  if (demo) {
    previous = [...memory().values()].find(
      (r) => r.owner_id === ownerId && r.request_key === input.requestKey,
    );
    if (!previous) {
      if (memory().size >= 1000) throw new Error("DEMO_CAPACITY");
      memory().set(row.id, row);
      claimed = true;
    }
  } else {
    const inserted =
      await sqlClient()`insert into adaptations (id,owner_id,need_id,innovation_id,request_key,input_hash,state,attempt_id) values (${row.id},${ownerId},${input.needId},${input.innovationId},${input.requestKey},${inputHash},'generating',${attempt}) on conflict (owner_id,request_key) do nothing returning id`;
    claimed = inserted.length > 0;
    if (!claimed)
      [previous] = await sqlClient()<
        Row[]
      >`select * from adaptations where owner_id=${ownerId} and request_key=${input.requestKey}`;
  }
  if (previous) {
    if (previous.input_hash !== inputHash) throw conflict();
    if (previous.state === "ready") {
      const saved = await getPlan(previous.id, ownerId);
      if (!saved) throw missing();
      return saved;
    }
    row.id = previous.id;
    if (
      previous.state === "failed" ||
      previous.updated_at.getTime() < Date.now() - 300000
    ) {
      if (demo) {
        memory().set(row.id, row);
        claimed = true;
      } else
        claimed =
          (
            await sqlClient()`update adaptations set state='generating', attempt_id=${attempt}, updated_at=now() where id=${row.id} and (state='failed' or (state='generating' and updated_at < now() - interval '5 minutes')) returning id`
          ).length > 0;
    }
  }
  if (!claimed)
    throw new HttpError(
      409,
      "GENERATING",
      "Plan jest właśnie przygotowywany. Spróbuj ponownie za chwilę; nie zmieniaj formularza.",
    );
  try {
    if (
      !(await consumeLimit(
        `adaptations:${ownerId}:${new Date().toISOString().slice(0, 10)}`,
        10,
      ))
    )
      throw new HttpError(
        429,
        "RATE_LIMIT",
        "Osiągnięto dzienny limit przygotowania planów.",
      );
    const c = config();
    const draft =
      c.AI_PROVIDER === "mock"
        ? demoDraft(input, need, innovation)
        : await createLiveAiProvider().generateStructured(
            "Przygotuj krótki szkic adaptacji innowacji do formy usługi dla instytucji, maksymalnie 350 słów. Używaj prostych zdań. firstStep.action to jedno konkretne działanie, maksymalnie 150 znaków, bez wstępu i wyjaśnień. Pozostałe elementy firstStep po jednym krótkim zdaniu, listy po 2–3 krótkie pozycje. Nie powtarzaj w każdym polu ostrzeżeń o AI ani konieczności weryfikacji. Wszystkie pola są propozycjami wymagającymi oceny, a nie zatwierdzonym planem. W firstStep podaj jedno konkretne działanie, rolę odpowiedzialną (bez wymyślania osoby lub zobowiązania instytucji), zasoby na start i obserwowalne kryterium wykonania tego kroku. Odróżnij wykonanie kroku od skuteczności całej innowacji. Niewyznaczone role oznacz jako do uzgodnienia. Oddziel fakty źródłowe od propozycji i założeń. Uwzględnij zasoby, zasięg, terminy i budżet podane przez autora; nie wymyślaj kwot, terminów, partnerów, kontaktów ani skuteczności. Brak informacji zapisz jako pytanie lub założenie. Zaproponuj mały dobrowolny pilotaż i mierniki bez fikcyjnych wyników. W sourceIds użyj wyłącznie ID źródeł przekazanej innowacji. Żadnego HTML ani nowych URL.",
            {
              need: {
                description: need.description,
                constraints: need.constraints,
                targetGroups: need.targetGroups,
                clarifications: need.clarifications ?? [],
              },
              institution: input.constraints,
              innovation,
            },
            generatedAdaptationDraft,
          );
    validateSources(draft, innovation);
    const current = (await listInnovations()).find(
      (r) => r.id === innovation.id,
    );
    if (!current || catalogVersion(current) !== catalogVersion(innovation))
      throw conflict();
    const plan: AdaptationPlan = {
      id: row.id,
      needId: input.needId,
      innovationId: innovation.id,
      constraints: input.constraints,
      draft,
      revision: 1,
      editedByOwner: false,
      sourceVersion: catalogVersion(innovation),
      mode: c.AI_PROVIDER,
      promptVersion: "adaptation-v2",
      createdAt: new Date().toISOString(),
    };
    if (demo) {
      row.record = plan;
      row.state = "ready";
    } else if (
      !(
        await sqlClient()`update adaptations set record=${sqlClient().json(plan)}, state='ready',updated_at=now() where id=${row.id} and attempt_id=${attempt} and state='generating' returning id`
      ).length
    )
      throw conflict();
    return plan;
  } catch (error) {
    if (demo) row.state = "failed";
    else
      await sqlClient()`update adaptations set state='failed',updated_at=now() where id=${row.id} and attempt_id=${attempt} and state='generating'`;
    throw error;
  }
}
export async function editPlan(id: string, ownerId: string, value: unknown) {
  const input = adaptationEdit.parse(value),
    plan = await getPlan(id, ownerId);
  if (!plan) throw missing();
  if (plan.revision !== input.expectedRevision) throw conflict();
  const innovation = (await listInnovations()).find(
    (r) => r.id === plan.innovationId,
  );
  if (!innovation || catalogVersion(innovation) !== plan.sourceVersion)
    throw missing();
  validateSources(input.draft, innovation);
  const next = {
    ...plan,
    draft: input.draft,
    revision: plan.revision + 1,
    editedByOwner: true,
  };
  if (fixtures()) {
    const row = memory().get(id)!;
    if (row.record?.revision !== input.expectedRevision) throw conflict();
    row.record = next;
    row.updated_at = new Date();
  } else if (
    !(
      await sqlClient()`update adaptations set record=${sqlClient().json(next)},updated_at=now() where id=${id} and owner_id=${ownerId} and state='ready' and (record->>'revision')::int=${input.expectedRevision} returning id`
    ).length
  )
    throw conflict();
  return next;
}
