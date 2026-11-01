# App Eventi: istruzioni di progetto

## Cosa stiamo costruendo

**Event Planner**: app web per PC e telefono con cui i clienti compongono un evento a casa, vedono un preventivo indicativo e versano un deposito.

Un secondo servizio, il **CRM**, gestirà in futuro le richieste. **Non costruire il CRM**: ogni richiesta, accettata o rifiutata, va salvata in una struttura versionata che il CRM possa usare senza rifacimenti.

- Repository: https://github.com/Grafone000/App-Eventi
- Piano approvato: `C:\Users\Mario\.claude\plans\c-users-mario-downloads-6baf2c930-stima-zazzy-church.md`. Riferimento completo per route, contratto dati, regole di prezzo e milestone.

## Lingua

- Parla con l'utente in **italiano**.
- Usa l'**inglese** per codice, nomi tecnici, commit e tutti i testi dell'app.

## Stack

- Next.js con App Router, TypeScript, Tailwind
- Supabase: Postgres, Auth, Storage
- TipTap per il compositore email
- Vitest e Testing Library per i test unitari, Playwright per gli E2E

Niente librerie di stato, date, form o validazione. **Chiedi prima di aggiungere qualsiasi dipendenza** non elencata nel piano.

## Regole architetturali

- Schermate e `src/domain/` importano le integrazioni solo da `src/integrations/index.ts`.
- `src/domain/` è puro: niente React, niente browser, niente Supabase.
- `src/integrations/contracts.ts` definisce le interfacce. Email, pagamento e CRM restano **stub** finché non viene chiesto altro.
- I testi modificabili stanno in `src/content/`, mai nei componenti.
- Email di contatto, telefono, tariffa e percentuale di deposito stanno in `src/config/business.ts`.
- Il design viene dalla bozza "Version D", palette **Ondari**. Ogni pagina riusa gli stessi token e componenti.
- Ogni schermata deve funzionare a 375 px e a 1440 px, con aree toccabili di almeno 44 px.

## Dati e contratto CRM

- Gli id delle opzioni sono stabili: si cambiano le etichette, mai gli id.
- Gli importi sono interi in pence.
- Le transizioni di stato stanno in una sola tabella in `src/domain/request.ts`.
- Una modifica che rompe il contratto incrementa `schemaVersion` e aggiorna `docs/crm-contract.md`.
- Il server ricalcola sempre il preventivo: non fidarti degli importi inviati dal browser.

## Sicurezza

- Non salvare né loggare mai dati di carta. I valori del modulo restano nel componente del provider di pagamento.
- La chiave `SUPABASE_SERVICE_ROLE_KEY` si usa solo sul server e non ha mai il prefisso `NEXT_PUBLIC_`.
- RLS attiva su ogni tabella. I bucket Storage sono privati e i file si leggono con URL firmati.
- Le chiavi stanno in `.env.local`, che è ignorato da git. Non leggerlo, non stamparlo e non chiedere le chiavi in chat. `.env.example` contiene solo i nomi delle variabili.

## Prezzi

- La fonte è `6baf2c930_stima_prezzi_eventi.xlsx`, trascritta in `src/domain/pricing/table.v1.ts`.
- Ogni regola e ambiguità è documentata in `docs/pricing-rules.md`.
- Il preventivo è sempre presentato come indicativo.
- I prezzi dell'Excel non sono validati: è un blocco per l'uscita online.
- Caso di riferimento: Wedding, 40-60, Dinner, Wine only, DJ, Flowers dà £3,360-£9,000, valore medio £6,180, deposito £1,236.

## Modo di lavorare

- Lavora per milestone, nell'ordine del piano. Ogni milestone ha un controllo "fatto quando".
- Non aggiungere funzionalità, pagine o astrazioni non richieste.
- Fermati e chiedi prima di aggiungere dipendenze, cambiare database o eliminare qualcosa.
- Fai commit e push solo quando l'utente lo chiede. Mai direttamente su `main`.
- Prima di dire che una milestone è fatta, esegui lint, test e build e riporta l'esito reale.

## Comandi

Disponibili dopo il M0, quando esisterà `package.json`:

```bash
npm run dev
npm run lint
npm run test
npx playwright test
npm run build
```
