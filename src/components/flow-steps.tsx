export function FlowSteps({ current }: { current: number }) {
  return (
    <nav className="flow-steps" aria-label="Etapy szukania wsparcia">
      <ol>
        {[
          "Opisz potrzebę",
          "Potwierdź opis",
          "Sprawdź propozycje",
          "Zaplanuj działanie",
        ].map((label, i) => (
          <li
            key={label}
            aria-current={current === i + 1 ? "step" : undefined}
            className={current > i + 1 ? "done" : ""}
          >
            <span aria-hidden="true">{current > i + 1 ? "✓" : i + 1}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
