"use client";
import { useRef, useState } from "react";
export function MessageDraft({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Tekst skopiowany. Możesz wkleić go do wiadomości.");
    } catch {
      input.current?.focus();
      input.current?.select();
      setStatus("Zaznaczyliśmy tekst. Naciśnij Ctrl+C lub skopiuj go ręcznie.");
    }
  }
  return (
    <section className="message-draft card">
      <div className="section-title">
        <div>
          <p className="eyebrow">Łatwiej zacząć rozmowę</p>
          <h2>Nie wiesz, co powiedzieć?</h2>
        </div>
        <span aria-hidden="true" className="message-symbol">
          ☏
        </span>
      </div>
      <p>
        Przygotowaliśmy szkic. Zmień go po swojemu i skopiuj. Niczego nie
        wysyłamy automatycznie.
      </p>
      <label htmlFor="message-draft">
        Twój tekst do rozmowy lub wiadomości
      </label>
      <textarea
        id="message-draft"
        ref={input}
        rows={5}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStatus("");
        }}
      />
      <div className="actions">
        <button onClick={copy}>
          Kopiuj tekst <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className="help" role="status">
        {status}
      </p>
      <p className="help">
        Edycja tego szkicu nie jest zapisywana po odświeżeniu. Skopiuj tekst,
        jeśli chcesz go zachować.
      </p>
    </section>
  );
}
