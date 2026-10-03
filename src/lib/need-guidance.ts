// Shared immediate signals, not a medical diagnosis or comprehensive triage.
// Contacts remain available even when no signal is detected or AI is unavailable.
export function plain(text: string) {
  return text
    .toLocaleLowerCase("pl")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");
}
export function urgentSignal(text: string): boolean {
  return plain(text)
    .split(/[.!?\n]+/)
    .some((sentence) => {
      // Explicit education/history/negation in the same clause must not suppress
      // a separate sentence describing a current danger.
      if (
        /\b(szkoleni\w*|warsztat\w*|cwiczeni\w*|scenariusz\w*|symulacj\w*|film\w*|cytat\w*|wczoraj|dawniej|kiedys|rok temu)\b/.test(
          sentence,
        )
      )
        return false;
      if (/\b(co zrobic gdy|co robic gdy|gdyby|jesli ktos)\b/.test(sentence))
        return false;
      return (
        (/\bnie oddycha\b/.test(sentence) &&
          !/\b(nieprawda|nie jest prawda|nie chodzi o|nikt)\b/.test(
            sentence,
          )) ||
        ((/\b(stracil\w* przytomnosc|nieprzytomn\w*)\b/.test(sentence) ||
          (/\bnie reaguje\b/.test(sentence) &&
            /\b(tata|mama|maz|zona|czlowiek|osoba|babcia|dziadek|dziecko|syn|corka)\b/.test(
              sentence,
            ))) &&
          !/\b(nie jest|nikt nie|nie chodzi)\b/.test(sentence)) ||
        (/\b(gazem (jedzie|smierdzi)|czuc gaz|czuje gaz|zapach gazu|ulatnia sie gaz)\b/.test(
          sentence,
        ) &&
          !/\b(nie czuc|nie czuje|nie ma|bez zapachu)\b/.test(sentence)) ||
        (/\b(pozar|pali sie)\b/.test(sentence) &&
          /\b(teraz|wybuchl|mieszkani\w*|dom\w*|ludzie|dym)\b/.test(sentence) &&
          !/\b(nie ma|nie pali|zapobiega\w*|ochrona przed)\b/.test(sentence)) ||
        (/\b(grozi nozem|mnie bije|mnie zabije|zabije mnie|dobija sie do drzwi)\b/.test(
          sentence,
        ) &&
          !/\b(nie grozi|nie bije|nie chodzi o)\b/.test(sentence)) ||
        (/\b(buzia|twarz|usta)\b/.test(sentence) &&
          /\b(uciekl\w*|krzyw\w*|opadl\w*)\b/.test(sentence) &&
          /\b(teraz|nagle|belkocze|mowic|kubek)\b/.test(sentence)) ||
        (/\b(odebrac sobie zycie|zabic sie)\b/.test(sentence) &&
          /\b(chce|teraz|zamierzam)\b/.test(sentence) &&
          !/\b(nie chce|nie zamierzam)\b/.test(sentence)) ||
        (/\b(tabletki|tablet\w*)\b/.test(sentence) &&
          /\b(wszystkie|garsc|pozegnanie|cale opakowanie)\b/.test(sentence) &&
          /\b(zaraz|zamierzam)\b/.test(sentence) &&
          /\b(wezme|polkn\w*)\b/.test(sentence))
      );
    });
}
export function supportSignal(text: string) {
  return /\b(wszystkim.*zawadzam|nikomu.*przeszkadzac|nie wiem po co (wstawac|zyc)|pods[lł]uchuje|wie co mysle)\b/.test(
    plain(text),
  );
}
export function fallbackQuestions(text: string) {
  const t = plain(text);
  if (/nie dziala|dzialalo/.test(t))
    return ["Co dokładnie nie działa i do czego tego używasz?"];
  if (/papier|dokument/.test(t))
    return [
      "Z jakiej instytucji jest ten dokument i czego dotyczy? Nie podawaj numeru PESEL ani innych danych osobowych.",
    ];
  if (/samot|pusto|z ludzmi/.test(t))
    return ["Jaki kontakt z innymi byłby dla Ciebie możliwy i wygodny?"];
  return ["Co się wydarzyło lub w czym najbardziej potrzebujesz pomocy?"];
}

// Only content-free requests need a question before search; length alone is not
// evidence of ambiguity (e.g. "Jestem samotny" is already a useful need).
export function lacksNeedTopic(text: string) {
  return /^(pomocy|pomoc|help|abc|nie wiem|nie dziala|potrzebuje pomocy)[.!?\s]*$/.test(
    plain(text).trim(),
  );
}
