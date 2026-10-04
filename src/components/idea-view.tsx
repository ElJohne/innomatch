import {
  ideaLabels,
  ideaStageLabels,
  type IdeaCard,
} from "@/lib/contracts/idea";
import { CanvasView } from "./idea-canvas";
export function IdeaView({
  card,
  compact = false,
}: {
  card: IdeaCard;
  compact?: boolean;
}) {
  if (compact)
    return (
      <div className="stack">
        <h3>{card.title}</h3>
        <p>{card.essence.split(/(?<=[.!?])\s/)[0].slice(0, 220)}</p>
        <details>
          <summary>Pełna karta i Canvas</summary>
          <IdeaView card={card} />
        </details>
      </div>
    );
  return (
    <div className="stack">
      {Object.entries(ideaLabels).map(([key, label]) => (
        <div key={key}>
          <h3>{label}</h3>
          <p className="message-body">{card[key as keyof typeof ideaLabels]}</p>
        </div>
      ))}
      <div>
        <h3>Odbiorcy</h3>
        <ul>
          {card.targetGroups.map((group, i) => (
            <li key={i}>{group}</li>
          ))}
        </ul>
        <p>
          Etap: {ideaStageLabels[card.stage]}. Informacja zadeklarowana przez
          autora, bez weryfikacji ROPS.
        </p>
      </div>
      {card.canvas && <CanvasView value={card.canvas} />}
    </div>
  );
}
