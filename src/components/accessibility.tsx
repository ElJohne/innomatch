"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
const themes = [
  { id: "default", label: "Standardowy kontrast" },
  { id: "white-black", label: "Biały tekst na czarnym tle" },
  { id: "yellow-black", label: "Żółty tekst na czarnym tle" },
  { id: "black-yellow", label: "Czarny tekst na żółtym tle" },
];
export function Accessibility() {
  const [scale, setScale] = useState(100);
  const [contrast, setContrast] = useState("default");
  const [message, setMessage] = useState("");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`;
    document.documentElement.dataset.contrast = contrast;
  }, [scale, contrast]);
  useEffect(
    () => () => {
      if (utterance.current) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
      }
      window.speechSynthesis?.cancel();
    },
    [pathname],
  );
  function stop() {
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
    }
    window.speechSynthesis?.cancel();
    setMessage("Odczyt zatrzymany.");
  }
  function read() {
    if (!("speechSynthesis" in window)) {
      setMessage("Ta przeglądarka nie obsługuje odczytu strony.");
      return;
    }
    stop();
    const speech = new SpeechSynthesisUtterance(
      document.querySelector("main")?.innerText || "",
    );
    utterance.current = speech;
    speech.lang = "pl-PL";
    const polish = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("pl"));
    if (polish) speech.voice = polish;
    speech.onstart = () =>
      setMessage(
        "Czytamy treść strony. Możesz zatrzymać odczyt przyciskiem Stop.",
      );
    speech.onend = () => setMessage("Odczyt zakończony.");
    speech.onerror = () =>
      setMessage(
        "Odczyt niedostępny. Sprawdź, czy przeglądarka ma polski głos.",
      );
    setMessage("Uruchamiamy odczyt…");
    window.speechSynthesis.speak(speech);
  }
  return (
    <section className="accessibility-bar" aria-label="Dostępność">
      <div className="accessibility-controls">
        <div className="accessibility-group" role="group" aria-label="Kontrast">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`contrast-swatch swatch-${theme.id}`}
              title={theme.label}
              aria-label={theme.label}
              aria-pressed={contrast === theme.id}
              onClick={() => setContrast(theme.id)}
            >
              <span aria-hidden="true">A</span>
            </button>
          ))}
        </div>
        <div
          className="accessibility-group text-sizes"
          role="group"
          aria-label="Rozmiar tekstu"
        >
          {[100, 125, 150, 200].map((size, index) => (
            <button
              key={size}
              aria-label={`Rozmiar tekstu ${size}%`}
              title={`Rozmiar tekstu ${size}%`}
              aria-pressed={scale === size}
              onClick={() => setScale(size)}
            >
              A{"+".repeat(index)}
            </button>
          ))}
        </div>
        <div
          className="accessibility-group speech-controls"
          role="group"
          aria-label="Odczyt głosowy"
        >
          <button onClick={read}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M11 5 6 9H3v6h3l5 4zM15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14" />
            </svg>
            Czytaj
          </button>
          <button onClick={stop} aria-label="Zatrzymaj odczyt">
            <span aria-hidden="true">■</span> Stop
          </button>
        </div>
      </div>
      <p className="speech-status" role="status">
        {message}
      </p>
    </section>
  );
}
