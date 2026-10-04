import { z } from "zod";

// A text-first working adaptation of all three ROPS/InnoAGH Canvas boards.
// The idea card already holds the problem, solution, audience and maturity.
export const canvasFields = {
  problemContext: {
    label: "Skala i częstotliwość problemu",
    hint: "Jak mocno problem utrudnia życie, jak często występuje i ilu osób dotyczy? Oddziel obserwacje od przypuszczeń.",
  },
  supporters: {
    label: "Kto może wesprzeć zmianę?",
    hint: "Wymień grupy lub instytucje i ich możliwy wkład. Zaznacz, z kim współpraca jest już uzgodniona.",
  },
  barriers: {
    label: "Co może utrudnić zmianę?",
    hint: "Opisz obawy, sprzeczne interesy i przeszkody, które trzeba omówić.",
  },
  accessibility: {
    label: "Zrozumiałość i dostępność rozwiązania",
    hint: "Jak odbiorca dowie się, co zrobić? Jakie bariery czasu, kosztów lub obsługi trzeba usunąć?",
  },
  fixedCosts: {
    label: "Koszty stałe",
    hint: "Co trzeba zapewnić niezależnie od liczby uczestników? Podaj znane koszty albo zaznacz, co wymaga wyceny.",
  },
  variableCosts: {
    label: "Koszty zależne od skali",
    hint: "Co dochodzi przy każdej kolejnej osobie lub działaniu, np. materiały, dojazd, czas specjalisty?",
  },
  payer: {
    label: "Kto finansuje, a kto decyduje?",
    hint: "Odbiorcy są już opisani w karcie. Wskaż możliwego płatnika i osoby lub instytucje, których zgoda jest potrzebna.",
  },
  emotionalValue: {
    label: "Wartość dla samopoczucia odbiorców",
    hint: "Jakiej zmiany oczekujesz, np. większej samodzielności lub poczucia przynależności? Nie przedstawiaj oczekiwań jako wyników.",
  },
  practicalValue: {
    label: "Praktyczna korzyść",
    hint: "Co konkretnie stanie się łatwiejsze, tańsze lub bardziej dostępne? Jak ma się to do wysiłku i kosztu udziału?",
  },
  funding: {
    label: "Finansowanie i jego rozwój",
    hint: "Skąd mogą pochodzić środki teraz i przy większej skali? Zaznacz: pomysł, rozmowy lub potwierdzenie. Nie zakładaj przyznania grantu.",
  },
  channels: {
    label: "Jak dotrzesz do odbiorców?",
    hint: "Opisz kontakt bezpośredni, dotarcie przez instytucje i dodatkowe kanały. Uwzględnij osoby poza internetem.",
  },
  partners: {
    label: "Partnerzy i ich role",
    hint: "Kto może ograniczyć koszty, pomóc dotrzeć do ludzi lub poprawić rozwiązanie? Przy każdej roli podaj status współpracy.",
  },
  impact: {
    label: "Wpływ i sposób sprawdzenia",
    hint: "Co może zmienić się dla osoby, społeczności i środowiska? Co sprawdzisz podczas pilotażu, a jakie wyniki masz już potwierdzone?",
  },
} as const;
export type CanvasKey = keyof typeof canvasFields;
export const canvasSections = [
  {
    title: "Problem i rozwiązanie",
    keys: [
      "problemContext",
      "supporters",
      "barriers",
      "accessibility",
      "fixedCosts",
      "variableCosts",
    ],
  },
  {
    title: "Odbiorcy, wartość i finansowanie",
    keys: ["payer", "emotionalValue", "practicalValue", "funding"],
  },
  {
    title: "Dotarcie, partnerzy i wpływ",
    keys: ["channels", "partners", "impact"],
  },
] as const satisfies ReadonlyArray<{
  title: string;
  keys: ReadonlyArray<CanvasKey>;
}>;
export const ideaCanvas = z
  .object(
    Object.fromEntries(
      Object.keys(canvasFields).map((key) => [
        key,
        z.string().trim().max(1000),
      ]),
    ) as Record<CanvasKey, z.ZodString>,
  )
  .strict();
export type IdeaCanvas = z.infer<typeof ideaCanvas>;
export function emptyCanvas(): IdeaCanvas {
  return Object.fromEntries(
    Object.keys(canvasFields).map((key) => [key, ""]),
  ) as IdeaCanvas;
}
export const canvasSourceUrl =
  "https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf";
