export function FlowSteps({ current }: { current: number }) {
  return (
    <nav className="flow-steps" aria-label="Etapy szukania wsparcia">
      <ol>
        {["Opisz potrzebę", "Wybierz pomoc", "Zrób pierwszy krok"].map(
          (label, i) => (
            <li
              key={label}
              aria-current={Math.min(current, 3) === i + 1 ? "step" : undefined}
              className={Math.min(current, 3) > i + 1 ? "done" : ""}
            >
              <span aria-hidden="true">{current > i + 1 ? "✓" : i + 1}</span>
              <span>{label}</span>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
