# IslaPlan: memoria tra le sessioni

Diario di lavoro: cosa è stato fatto, cosa è stato deciso, dove si è rimasti. `CLAUDE.md` lo importa, quindi si legge a inizio sessione.

Come aggiornarlo:

- A fine sessione aggiungi una voce in cima a **Storico**, con data assoluta (AAAA-MM-GG).
- Tieni aggiornata **Stato attuale**.
- Scrivi decisioni e contesto che non si ricavano da codice o git. Problemi aperti e cose non verificate vanno in `docs/known-issues.md`, non qui.
- Tieni il file breve: quando lo storico cresce, riassumi le voci vecchie in una riga.

## Stato attuale

- Branch di lavoro: `chore/project-setup`, allineato a `origin`.
- Contratto: `SCHEMA_VERSION = 3`, `DRAFT_VERSION = 3`, prezzi `pricing-v3`.
- Ultimo controllo completo superato: tsc, lint, 334 test unitari, 126 E2E, build.
- Deploy: Vercel collegato a GitHub `Grafone000/IslaPlan` (prima `App-Eventi`, rinominato il 2026-11-08); ogni push su `chore/project-setup` pubblica da solo.
  - URL probabile: https://app-eventi-mario-f5ea.vercel.app (protetto da Vercel Authentication).
  - `app-eventi.vercel.app` è di un altro utente, non nostro.
- Per renderlo pubblico restano da fare, lato utente: togliere Vercel Authentication in Deployment Protection, impostare `NEXT_PUBLIC_SITE_URL`, impostare Site URL e Redirect URLs in Supabase, rifare il deploy.

## Prossimi passi

- Attendere il dominio reale o la richiesta di aiuto per le impostazioni di Vercel e Supabase.
- Blocchi per l'uscita online: vedi `docs/known-issues.md` (prezzi, lista vini, pagamento ed email reali, privacy, produzione Supabase).

## Storico

### 2026-11-08: Home a slide stile Zara (non ancora in commit)

- Fonte: screenshot e HTML condensato della home Zara UK passati dall'utente.
- Home riscritta come slide a tutto schermo (`HomeSlides.tsx`): una schermata alla volta, scroll snap, la slide uscente si rimpicciolisce al 65% con cornice bianca, scrollbar nascosta, tasti freccia/pagina.
- Terza foto a tutto schermo con il testo sopra (decisione dell'utente: "la foto è sempre centrale, il testo è sopra la foto").
- Lista eventi su slide verde salvia, due colonne anche da telefono. Footer dentro l'ultima slide.
- Restano invariati testi, posizioni dei testi, menu a tre linee in alto a destra e font del progetto.
- Il repository non ha un file di configurazione Prettier: formattare con `--single-quote --print-width 100`.
- Controlli: lint, tsc, 334 test unitari e build superati; E2E 129 su 130, il test del budget slider è fallito una volta per instabilità ed è passato rilanciato da solo.
- Il server di sviluppo è ora in `.claude/launch.json` come `dev` (porta 3000).

### 2026-11-08: riorganizzazione delle istruzioni

- `CLAUDE.md` ridotto all'essenziale secondo le best practice di Claude Code; importa `rules.md` e `memory.md`.
- Nuovo `rules.md`: brand, stile, funzioni, architettura, dati, prezzi, sicurezza.
- Nuovo `memory.md`: questo file.

### 2026-11-06: redesign IslaPlan (`b804afc`)

- Nuovo brand IslaPlan, stile Zara bianco e verde salvia, passaggi di pagina a rivista.
- Party size a fasce; menu impaginati come al ristorante.
- Bottiglie a prezzo per bottiglia in Wine only e Drinks all (`pricing-v3`, schema v3, `upgradeRequest` per v1 e v2).
- Il preventivo è una rivista di tre pagine e non chiede più il deposito; `proceed` imposta `decisions.proceed`.
- Area riservata con sfondo di marmo e una rivista per evento (Upcoming/Past).
- Commit e push su richiesta dell'utente; avviata la pubblicazione su Vercel.

### 2026-11-03: menu, drink e orari (`cff792c`)

- Menu, pacchetti drink, orari dei servizi e slider.

### 2026-11-01 / 2026-11-02: milestone M0-M10

- Scaffold Next.js, catalogo, modello richieste e contratto CRM, motore prezzi.
- Home, schema Supabase e API, wizard con bozza e calendario, preventivo con revisione guidata e consulenza.
- Compositore email, pagamento deposito con stub, area riservata con foto e messaggi, rifinitura e accessibilità.
