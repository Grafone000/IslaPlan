# App Eventi: istruzioni di progetto

## Cosa stiamo costruendo

**Event Planner**: app web per PC e telefono con cui i clienti compongono un evento a casa, vedono un preventivo indicativo e versano un deposito.

Un secondo servizio, il **CRM**, gestirà in futuro le richieste. **Non costruire il CRM**: ogni richiesta, accettata o rifiutata, va salvata in una struttura versionata che il CRM possa usare senza rifacimenti.

- Repository: https://github.com/Grafone000/App-Eventi
- Piano approvato: `C:\Users\Mario\.claude\plans\c-users-mario-downloads-6baf2c930-stima-zazzy-church.md`. Riferimento completo per route, contratto dati, regole di prezzo e milestone.

## Funzioni dell'app

### Home

- Replica la bozza "Version D". Tutti i testi stanno in `src/content/home.ts`.
- Titolo in alto: "Bring the party home. We'll take care of the rest."
- Testi delle sezioni foto ispirati al testo principale. I suoi quattro paragrafi compaiono **copiati esattamente** sotto "Your event, your choices".
- Nelle tre sezioni foto, titolo e testo compaiono con fade e slide allo scroll, rispettando `prefers-reduced-motion`.
- Tutti i pulsanti "Book your event" portano al wizard.
- "Log in" porta alla pagina di accesso. Con l'accesso fatto, la barra mostra "My area" e "Log out".

### Account

- Una sola pagina per Log in e Create account. Dopo l'accesso si torna alla Home.
- Email e password con Supabase Auth, incluso il recupero password.
- Create account chiede nome, cognome, email, telefono e password.
- Lo scopo è non richiedere di nuovo i contatti: con l'accesso fatto lo step Contact viene saltato.
- Gli eventi prenotati da ospite si collegano all'account solo a email verificata.

### Wizard Event builder

Una domanda per step, con bozza salvata e navigazione indietro.

| # | Step | Tipo | Opzioni |
|---|---|---|---|
| 1 | Event type | Singola | Wedding, Birthday, Engagement, Wedding proposal, Hen Do/Stag Do, Baby showers, Graduation, Girls' night/Boys' night, Family/friends reunions, Other/Bespoke |
| 2 | Date & Time | Data, inizio, fine | Calendario con orari |
| 3 | Party size | Singola | From 10 to 20, From 20 to 40, From 40 to 60, From 60 to 80, Up to 100 |
| 4 | Food | Multipla, obbligatoria | Private chef, Lunch, Dinner, Afternoon tea, Canapes style |
| 5 | Drinks | Multipla, obbligatoria | Cocktails masterclass, Wine tasting, Private bartender, Private sommelier, Drinks all, Wine only, Cocktails/spirits only, I bring my own drinks |
| 6 | Entertainment | Multipla, saltabile | DJ, Live music, Activities \| share your preference |
| 7 | Decorations | Multipla, saltabile | Flowers, Balloons, Personalised/branded items, Other/Bespoke |
| 8 | Any additional information | Testo libero, facoltativo | |
| 9 | Budget | Singola | Under £1,000, £1,000-£2,500, £2,500-£5,000, £5,000-£10,000, Over £10,000 |
| 10 | Contact details | Modulo | Nome e cognome, email, telefono |

- Le scelte singole avanzano al tocco, le multiple con Continue.
- Private chef esclude Lunch e Dinner, e viceversa.
- Drinks all, Wine only, Cocktails/spirits only e I bring my own drinks si escludono a vicenda.
- Activities e Other/Bespoke mostrano un campo di testo.

### Preventivo e prenotazione

1. **Estimate:** mostra un intervallo indicativo calcolato con le regole dell'Excel, e chiede se il cliente lo accetta.
2. **Rifiuto:** il cliente torna a modificare l'evento con un supporto decisionale che mostra le voci che pesano di più, le modifiche che fanno risparmiare di più e la distanza dal budget. Può anche fermarsi: la richiesta resta salvata.
3. **Consulenza:** "Would you like a phone consultation?". Se sì, mostra email, telefono e costo di £0.10/min.
   - Telefono: link `tel:`. Al ritorno il cliente ritrova la stessa schermata.
   - Email: compositore interno con A, Oggetto, Corpo, testo formattato, link e allegati. L'invio passa da uno stub.
4. **Procedere:** con o senza consulenza, chiede se il cliente vuole procedere.
5. **Deposito:** se sì, chiede il 20% del valore medio su una pagina di pagamento con provider stub. Stripe arriverà dopo.
6. **Risposta negativa:** a "proceed" o al deposito mostra un breve messaggio cortese e salva la richiesta con il suo stato. Il "no" alla consulenza non chiude il flusso.
7. **Voci "On request":** non hanno importo. Se nessuna voce ha un prezzo, compreso ogni evento Other/Bespoke, non ci sono importo né deposito.

### Area riservata

- Eventi del cliente, divisi in Upcoming e Past.
- Dettaglio dell'evento con riepilogo e foto caricate dallo staff.
- Conversazione con l'organizzatore tramite il compositore email.
- "Create new event" per aprire un nuovo wizard.

## Lingua

- Parla con l'utente in **italiano**.
- Usa l'**inglese** per codice, nomi tecnici, commit e tutti i testi dell'app.

## Stack

- Next.js con App Router, TypeScript, Tailwind
- Supabase: Postgres, Auth, Storage
- TipTap per il compositore email
- `react-day-picker` e `date-fns` per il calendario
- Vitest e Testing Library per i test unitari, Playwright per gli E2E

Niente librerie di stato, form o validazione. **Chiedi prima di aggiungere qualsiasi dipendenza** non elencata nel piano.

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
