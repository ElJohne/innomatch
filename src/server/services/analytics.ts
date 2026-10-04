import "server-only";
import {
  analyticsQuery,
  audienceGroups,
  searchStatusLabels,
  type NeedAnalytics,
} from "@/lib/contracts/analytics";
import type { Actor } from "@/lib/contracts/communication";
import { config } from "@/server/config";
import { sqlClient } from "@/server/db/client";
import { HttpError } from "@/server/http";
import { fixtureNeedMetrics } from "./repository";

type Bucket = { kind: string; label: string; count: number };
const dayMs = 86400000;
const normalizedGroups = audienceGroups.map((group) => group.toLowerCase());
export async function needAnalytics(
  actor: Actor,
  query: unknown,
): Promise<NeedAnalytics> {
  if (actor.staff?.role !== "ADMIN")
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Statystyki są dostępne tylko dla administratora.",
    );
  const { days: value } = analyticsQuery.parse(query);
  const days = Number(value),
    now = new Date();
  const today = now.toISOString().slice(0, 10);
  const from = new Date(
    Date.parse(`${today}T00:00:00Z`) - (days - 1) * dayMs,
  ).toISOString();
  const through = now.toISOString();
  let buckets: Bucket[];
  if (config().DATA_PROVIDER === "fixtures") {
    const counts = new Map<string, Bucket>();
    const add = (kind: string, label: string) => {
      const key = `${kind}:${label}`,
        row = counts.get(key) ?? { kind, label, count: 0 };
      row.count++;
      counts.set(key, row);
    };
    for (const row of fixtureNeedMetrics()) {
      if (row.createdAt < from || row.createdAt > through) continue;
      add("total", "total");
      if (row.hasMunicipality) add("municipality", "municipality");
      add("day", row.createdAt.slice(0, 10));
      add(
        "status",
        row.status === null
          ? "pending"
          : Object.hasOwn(searchStatusLabels, row.status)
            ? row.status
            : "unknown",
      );
      const groups = new Set(
        row.targetGroups
          .filter((g) => g.trim())
          .map((g) => {
            const normalized = g.trim().toLowerCase();
            return normalizedGroups.includes(normalized) ? normalized : "other";
          }),
      );
      if (!groups.size) groups.add("unspecified");
      groups.forEach((group) => add("audience", group));
    }
    buckets = [...counts.values()];
  } else {
    // A single SQL statement gives a consistent snapshot and returns counts only.
    buckets = await sqlClient()<Bucket[]>`
      with selected as materialized (
        select to_char(created_at at time zone 'UTC', 'YYYY-MM-DD') as day,
          case when match is null then 'pending'
            when match->>'status' in ('matched','partial','no_match','unavailable') then match->>'status'
            else 'unknown' end as status,
          case when jsonb_typeof(input->'targetGroups')='array' then input->'targetGroups' else '[]'::jsonb end as groups,
          length(trim(coalesce(input->>'municipality',''))) > 0 as has_municipality
        from needs where created_at >= ${from}::timestamptz and created_at <= ${through}::timestamptz
      )
      select 'total' as kind, 'total' as label, count(*)::int as count from selected
      union all select 'municipality', 'municipality', count(*)::int from selected where has_municipality
      union all select 'day', day, count(*)::int from selected group by day
      union all select 'status', status, count(*)::int from selected group by status
      union all select 'audience', coalesce(a.label,'unspecified'), count(*)::int
        from selected s left join lateral (
          select distinct case when lower(trim(g.value)) = any(${normalizedGroups}::text[])
            then lower(trim(g.value)) else 'other' end as label
          from jsonb_array_elements_text(s.groups) g(value) where length(trim(g.value)) > 0
        ) a on true group by coalesce(a.label,'unspecified')
    `;
  }
  const count = (kind: string, label: string) =>
    buckets.find((row) => row.kind === kind && row.label === label)?.count ?? 0;
  return {
    generatedAt: through,
    period: { days, from, through, timeZone: "UTC" },
    source: config().DATA_PROVIDER,
    total: count("total", "total"),
    withMunicipality: count("municipality", "municipality"),
    daily: Array.from({ length: days }, (_, index) => {
      const label = new Date(Date.parse(from) + index * dayMs)
        .toISOString()
        .slice(0, 10);
      return { label, count: count("day", label) };
    }),
    audiences: [
      ...audienceGroups.map((label, index) => ({
        label,
        count: count("audience", normalizedGroups[index]),
      })),
      { label: "Inne grupy", count: count("audience", "other") },
      { label: "Nie wskazano grupy", count: count("audience", "unspecified") },
    ],
    searchStatuses: (
      Object.keys(searchStatusLabels) as (keyof typeof searchStatusLabels)[]
    ).map((status) => ({ status, count: count("status", status) })),
  };
}
