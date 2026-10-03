import {
  ideaLabels,
  ideaStageLabels,
  type IdeaCard,
} from "@/lib/contracts/idea";
export function IdeaView({ card }: { card: IdeaCard }) {
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
    </div>
  );
}
