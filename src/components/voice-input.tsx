"use client";
import { useEffect, useRef, useState } from "react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const recognition = useRef<Recognition | null>(null);
  const callback = useRef(onText);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    callback.current = onText;
  }, [onText]);
  useEffect(
    () => () => {
      const current = recognition.current;
      if (current) {
        current.onresult = null;
        current.onerror = null;
        current.onend = null;
        current.abort();
      }
    },
    [],
  );
  function toggle() {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    const api = window as Window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = api.SpeechRecognition || api.webkitSpeechRecognition;
    if (!Constructor) {
      setStatus(
        "Ta przeglądarka nie obsługuje dyktowania. Wpisz opis lub użyj mikrofonu na klawiaturze telefonu.",
      );
      return;
    }
    const current = new Constructor();
    recognition.current = current;
    current.lang = "pl-PL";
    current.continuous = true;
    current.interimResults = false;
    current.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal)
          callback.current(event.results[i][0].transcript);
      }
    };
    current.onerror = ({ error }) =>
      setStatus(
        error === "not-allowed" || error === "service-not-allowed"
          ? "Nie udzielono dostępu do mikrofonu. Zezwól na dostęp w ustawieniach przeglądarki lub wpisz opis."
          : "Nie udało się rozpoznać mowy. Spróbuj ponownie lub wpisz opis.",
      );
    current.onend = () => {
      recognition.current = null;
      setListening(false);
      setStatus((previous) =>
        previous.startsWith("Słuchamy")
          ? "Dyktowanie zakończone. Sprawdź i popraw tekst przed wysłaniem."
          : previous,
      );
    };
    try {
      current.start();
      setListening(true);
      setStatus("Słuchamy… Mów po polsku. Naciśnij Stop, gdy skończysz.");
    } catch {
      recognition.current = null;
      setListening(false);
      setStatus(
        "Nie można uruchomić mikrofonu. Spróbuj ponownie lub wpisz opis.",
      );
    }
  }
  return (
    <div className="voice-input">
      <button
        type="button"
        className="secondary"
        aria-pressed={listening}
        onClick={toggle}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
        </svg>
        {listening ? "Stop — zakończ dyktowanie" : "Powiedz głosem"}
      </button>
      <p className="help voice-status" role="status">
        {status}
      </p>
    </div>
  );
}
