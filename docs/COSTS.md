# Utrzymanie

Aplikacja działa jako jeden serwer Node.js z PostgreSQL. Konfiguracja wdrożenia wykorzystuje istniejący klaster k3s, dysk bazy 5 GiB oraz osobne wolumeny na wydania i kopie zapasowe.

| Pozycja | Sposób kalkulacji |
| --- | --- |
| Serwer | Miesięczna stawka infrastruktury, transfer i przestrzeń dyskowa. |
| Baza i kopie | Przestrzeń danych, retencja kopii i przechowywanie poza serwerem. |
| OpenAI / Azure OpenAI | Zużycie tokenów według wybranych modeli i taryfy konta. |
| Obsługa techniczna | Godziny utrzymania × stawka. |
| Moderacja i konsultacje | Liczba spraw × średni czas obsługi × stawka. |

Koszt AI:

```text
(input_tokens × input_rate
 + output_tokens × output_rate
 + embedding_tokens × embedding_rate) / rate_unit
```

Jednostka rozliczenia wynika z taryfy modelu. Indeksowanie katalogu rozlicza się oddzielnie od obsługi potrzeb, pomysłów i planów. Niezmienione rekordy nie są ponownie indeksowane; zapisane wyniki wyszukiwania korzystają z cache. Użycie operacji aplikacji jest rejestrowane w `ai_usage`.

Do kalkulacji miesięcznej służą scenariusze: 100, 1000 i 10 000 wyszukiwań, uzupełnione o liczbę pomysłów, planów i godzin obsługi. Konkretna kwota zależy od stawek infrastruktury, modeli i zespołu.