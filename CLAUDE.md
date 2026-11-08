# IslaPlan

App web (PC e telefono) con cui i clienti compongono un evento a casa e ricevono un preventivo indicativo. Il CRM che gestirà le richieste è un servizio futuro: **non costruirlo**.

- Repository: https://github.com/Grafone000/App-Eventi
- Piano approvato, con route, contratto dati, prezzi e milestone: `C:\Users\Mario\.claude\plans\c-users-mario-downloads-6baf2c930-stima-zazzy-church.md`

## File da leggere

- @rules.md: regole di prodotto, brand e stile, funzioni dell'app, architettura, dati, prezzi, sicurezza.
- @memory.md: cosa è stato fatto tra una sessione e l'altra e dove si è rimasti.
- `docs/known-issues.md`: cosa non funziona, non è verificato o è rimandato. Consultalo all'inizio di ogni milestone.
- `docs/crm-contract.md` e `docs/pricing-rules.md`: contratto CRM e regole di prezzo in dettaglio.

## Lingua

- Parla con l'utente in **italiano**.
- Usa l'**inglese** per codice, nomi tecnici, commit e tutti i testi dell'app.

## Stack

- Next.js (App Router), TypeScript, Tailwind
- Supabase: Postgres, Auth, Storage
- TipTap per il compositore email; `react-day-picker` e `date-fns` per il calendario
- Vitest e Testing Library per i test unitari, Playwright per gli E2E

## Comandi

```bash
npm run dev
npm run lint
npm run test
npx playwright test
npm run build
```

## Regole che valgono sempre

- **Dipendenze:** chiedi prima di aggiungere qualsiasi dipendenza non elencata nel piano.
- **Git:** commit e push solo quando l'utente lo chiede. Mai direttamente su `main`.
- **Segreti:** non leggere, non stampare e non chiedere in chat le chiavi di `.env.local`.
- **Perimetro:** non aggiungere funzionalità, pagine o astrazioni non richieste. Fermati e chiedi prima di cambiare database o eliminare qualcosa.

## Modo di lavorare

- Lavora per milestone, nell'ordine del piano. Ogni milestone ha un controllo "fatto quando".
- Prima di dire che una milestone è fatta, esegui lint, test e build e riporta l'esito reale.
- Tieni aggiornato `docs/known-issues.md`: ogni cosa che non funziona, non è verificata, è rimandata o è da ottimizzare va scritta lì appena emerge, e si toglie solo quando è risolta e verificata.
- A fine sessione aggiorna `memory.md`: stato attuale e una voce nello storico.
