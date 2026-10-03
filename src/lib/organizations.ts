import type { Innovation, MatchResponse } from "./contracts";

export type Organization = {
  id: string;
  name: string;
  description: string;
  symbol: string;
  innovationIds: string[];
  origin: "SYNTHETIC";
};

// Invented fixtures for the local UX preview, never a directory of real providers.
export const demoOrganizations: Organization[] = [
  {
    id: "demo-blisko-siebie",
    name: "Fundacja Blisko Siebie",
    description:
      "Przykładowa organizacja wspierająca relacje sąsiedzkie i wspólne działania mieszkańców.",
    symbol: "♡",
    origin: "SYNTHETIC",
    innovationIds: [
      "demo-sasiedzki-stol",
      "demo-krag-opiekunow",
      "demo-ogrod-pokolen",
      "demo-rodzic-w-sieci",
    ],
  },
  {
    id: "demo-dobre-sasiedztwo",
    name: "Stowarzyszenie Dobre Sąsiedztwo",
    description:
      "Przykładowy zespół łączący wolontariuszy i osoby szukające wsparcia w lokalnej społeczności.",
    symbol: "⌂",
    origin: "SYNTHETIC",
    innovationIds: [
      "demo-sasiedzki-stol",
      "demo-mlodzi-razem",
      "demo-jezyk-sasiedztwa",
      "demo-punkt-napraw",
      "demo-ogrod-pokolen",
    ],
  },
  {
    id: "demo-otwarte-mozliwosci",
    name: "Centrum Otwartych Możliwości",
    description:
      "Przykładowe centrum dostępności, edukacji i wsparcia w codziennych wyzwaniach.",
    symbol: "✧",
    origin: "SYNTHETIC",
    innovationIds: [
      "demo-sasiedzki-stol",
      "demo-cyfrowy-duet",
      "demo-dostepny-urzad",
      "demo-powrot-do-pracy",
      "demo-spacer-bez-barier",
      "demo-prosty-list",
      "demo-krag-opiekunow",
    ],
  },
];

export function organizationOptions(
  result: MatchResponse,
  records: Innovation[],
  organizations: Organization[],
) {
  if (result.status === "no_match") return [];
  return organizations
    .flatMap((organization) => {
      const match = [...result.matches]
        .sort((a, b) => a.rank - b.rank)
        .find(
          (m) =>
            organization.innovationIds.includes(m.innovationId) &&
            records.some(
              (r) =>
                r.id === m.innovationId &&
                r.origin === "SYNTHETIC" &&
                r.publicationStatus === "PUBLISHED",
            ),
        );
      const innovation = records.find((r) => r.id === match?.innovationId);
      return match && innovation ? [{ organization, match, innovation }] : [];
    })
    .sort((a, b) => a.match.rank - b.match.rank)
    .slice(0, 3);
}
