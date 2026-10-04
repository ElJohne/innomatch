export function shortSentence(text: string, maximum = 180) {
  const first =
    text
      .trim()
      .match(/^.*?[.!?](?:\s|$)/)?.[0]
      ?.trim() || text.trim();
  if (first.length <= maximum) return first;
  return `${first.slice(0, maximum - 1).replace(/\s+\S*$/, "")}…`;
}
