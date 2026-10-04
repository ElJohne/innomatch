import {
  canvasFields,
  canvasSections,
  canvasSourceUrl,
  type CanvasKey,
  type IdeaCanvas,
} from "@/lib/contracts/canvas";

export function CanvasCredit() {
  return (
    <p className="help">
      Uproszczony arkusz pracy Pomocnego Punktu na podstawie trzech plansz{" "}
      <a href={canvasSourceUrl} target="_blank" rel="noreferrer">
        Social Innovation Canvas — ROPS / InnoAGH ↗
      </a>{" "}
      (wersja 1.0, 5 maja 2026), inspirowanych The New Global School. Opis
      problemu, rozwiązanie, odbiorcy i etap pochodzą z Twojej karty. To robocze
      opracowanie, nie formularz wniosku.
    </p>
  );
}
export function CanvasFields({
  value,
  onChange,
}: {
  value: IdeaCanvas;
  onChange: (key: CanvasKey, value: string) => void;
}) {
  const completed = Object.values(value).filter((text) => text.trim()).length;
  return (
    <section className="canvas-editor stack" aria-labelledby="canvas-title">
      <h2 id="canvas-title">Canvas Twojego pomysłu</h2>
      <p>
        Rozwijaj pomysł po kawałku. Wszystkie pola są opcjonalne; możesz zapisać
        pracę i wrócić później.
      </p>
      <p className="help">
        Uzupełnione pola: {completed} z {Object.keys(canvasFields).length}. To
        stan notatek, nie ocena gotowości pomysłu.
      </p>
      {canvasSections.map((section, index) => (
        <details
          key={section.title}
          open={index === 0}
          className="canvas-section"
        >
          <summary>
            {index + 1}. {section.title}
          </summary>
          <div className="stack">
            {section.keys.map((key) => (
              <div key={key}>
                <label htmlFor={`canvas-${key}`}>
                  {canvasFields[key].label}
                </label>
                <p id={`canvas-${key}-help`} className="help">
                  {canvasFields[key].hint}
                </p>
                <textarea
                  id={`canvas-${key}`}
                  aria-describedby={`canvas-${key}-help`}
                  rows={3}
                  maxLength={1000}
                  value={value[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </details>
      ))}
      <CanvasCredit />
    </section>
  );
}
export function CanvasView({ value }: { value: IdeaCanvas }) {
  return (
    <section className="stack canvas-view">
      <h2>Canvas pomysłu</h2>
      {canvasSections.map((section) => (
        <section className="canvas-section" key={section.title}>
          <h3>{section.title}</h3>
          <dl>
            {section.keys.map((key) => (
              <div key={key} className="canvas-answer">
                <dt>{canvasFields[key].label}</dt>
                <dd className="message-body">
                  {value[key] || "Do uzupełnienia"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <CanvasCredit />
    </section>
  );
}
