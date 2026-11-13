# IslaPlan: regole del progetto

Regole di prodotto, brand, stile e architettura. `CLAUDE.md` le importa: valgono in ogni sessione. Il piano approvato (`C:\Users\Mario\.claude\plans\c-users-mario-downloads-6baf2c930-stima-zazzy-church.md`) resta il riferimento completo per route, contratto dati, regole di prezzo e milestone.

## 1. Brand e stile

### Identità

- Nome: **IslaPlan**. Prodotto: app web per PC e telefono con cui i clienti compongono un evento a casa e ricevono un preventivo indicativo.
- Tono: scritte semplici ed eleganti, in inglese.
- Ispirazione visiva: il sito di Zara. Foto a tutto schermo con il testo sopra, molto bianco, poca decorazione, piccole etichette in maiuscolo.
- Si prende lo stile, mai il marchio: niente logo, nomi, foto o font di Zara.

### Palette e font

- Palette **bianca e verde salvia**. I token stanno in `src/app/globals.css` (`@theme` di Tailwind 4): non usare colori fuori dai token.
- Font:
  - **Jost** per il testo.
  - **Bodoni Moda** per titoli e corsivi.
  - **Nanum Pen Script** per il nome IslaPlan scritto a mano, al posto di Kendraw (licenza non acquistata).
- Ogni pagina riusa gli stessi token e componenti.

### Movimento

- Wizard e preventivo si sfogliano come una rivista.
- Area riservata: sfondo di marmo, ogni evento è una rivista posata sul tavolo.

### Responsive e accessibilità

- Ogni schermata deve funzionare a **375 px** e a **1440 px**.
- Aree toccabili di almeno **44 px**.

## 2. Funzioni dell'app

### Home

Tutti i testi stanno in `src/content/home.ts`.

Impaginazione da lookbook, come la home di Zara (`src/components/home/HomeSlides.tsx`):

- Una schermata alla volta: ogni sezione è una slide alta quanto lo schermo, con la foto a tutto schermo e il testo sopra la foto. Lo scorrimento si ferma su ogni slide.
- La slide che esce resta ferma e si rimpicciolisce al 65% circa verso il centro, lasciando una cornice bianca, mentre la successiva le scorre sopra. Con "riduci movimento" non si rimpicciolisce.
- Barra di scorrimento nascosta. Frecce, Pagina su/giù e Spazio passano da una slide all'altra.
- Le ancore (`#top`, `#coordinate`, `#story`, `#events`, `#book`) portano sempre alla slide giusta.

1. **Prima foto**, a tutto schermo: "IslaPlan" grande in basso a destra, che scompare con una dissolvenza scorrendo. In alto a destra tre linee aprono il menu, con Book your event, What we do, Log in oppure My area e Log out.
2. **Seconda foto**, al centro: "YOU CELEBRATE / WE COORDINATE". Sotto, in Bodoni corsivo, "• Plan your event" a sinistra porta al pulsante finale, "• See what we do" a destra porta alla lista degli eventi.
3. **Terza foto**: la foto è sempre centrale, a tutto schermo. Il testo "Bring the party home. We’ll take care of the rest." con i suoi quattro paragrafi **copiati esattamente** sta sopra la foto, a sinistra, con una velatura scura per leggerlo. Sotto, a destra, il nome "IslaPlan" scritto a mano.
4. **Lista degli eventi**, senza foto, su due colonne anche da telefono, su una slide piena verde salvia.
5. **Pulsante finale**: "Let’s start planning" a destra sopra una foto a tutto schermo, con sotto "Tell us what you’re celebrating, get an estimate, our team is here to shape the rest.". Il piccolo footer sta in fondo a questa slide.

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
| 1 | Tell us, what are you planning? | Singola | Wedding, Birthday, Engagement, Wedding proposal, Hen Do/Stag Do, Baby showers, Graduation, Girls' night/Boys' night, Family/friends reunions, Other/Bespoke |
| 2 | Date & Time | Data, inizio, fine | Calendario con orari; si prenota da un mese dopo oggi |
| 3 | Party size | Singola | From 10 to 20, From 20 to 40, From 40 to 60, From 60 to 80, Up to 100 |
| 4 | Food | Multipla, obbligatoria | Brunch, Lunch, Dinner, Canapés, Afternoon tea, Private chef, I bring my own food |
| 4a | Menu | Singola, una pagina per voce | Menu impaginati come quelli di un ristorante: 3 per Brunch, Lunch, Canapés e Afternoon tea; 5 chef per Private chef |
| 5 | Drinks | Multipla, obbligatoria | Private bartender, Private sommelier, Drinks all, Wine only, Cocktails/spirits only, I bring my own drinks |
| 5a | Dettagli drink | Una pagina per voce | Cocktails/spirits only: 1-4 cocktail a persona. Drinks all: 1-4 cocktail più 1 o ½ bottiglia a persona, poi vino o champagne e la bottiglia. Wine only: bottiglie di champagne e vino, ognuna con bicchieri e quantità |
| 6 | Entertainment | Multipla, saltabile | DJ, Live music, Activities \| share your preference |
| 7 | Decorations | Multipla, saltabile | Flowers, Balloons, Personalised/branded items, Other/Bespoke |
| 8 | Any additional information | Testo libero, facoltativo | |
| 9 | Budget | Slider | Da £500 a £20,000 a passi di £50; il massimo vale "£20,000 or more" |
| 10 | Contact details | Modulo | Nome e cognome, email, telefono |

Comportamento:

- Le scelte singole avanzano al tocco; le multiple, il budget e le pagine delle bottiglie con Continue.
- Esclusioni:
  - Private chef esclude Lunch e Dinner, e viceversa.
  - Drinks all esclude Wine only e Cocktails/spirits only.
  - I bring my own drinks esclude Drinks all, Wine only e Cocktails/spirits only.
  - Wine only e Cocktails/spirits only si possono scegliere insieme.
- Dopo Continue, Food apre una pagina menu per ogni voce scelta che ha menu, e Drinks una pagina quantità per ogni voce che ha opzioni, nell'ordine del catalogo. Dinner e I bring my own food non hanno menu.
- La casella scelta si allarga, senza cambiare pagina, per:
  - Private bartender, Private sommelier, DJ e Live music: orario di inizio e fine, dentro l'orario dell'evento.
  - DJ e Live music non possono sovrapporsi: il secondo parte dove finisce il primo, e se il primo occupa tutto l'evento il tempo si divide a metà.
  - I bring my own food e I bring my own drinks: testo facoltativo, si può proseguire anche vuoto.
  - Activities: testo con l'idea del cliente.
- Other/Bespoke mostra un campo di testo.
- Wine only: per ogni bottiglia il cliente sceglie come servirla (5 bicchieri da 150 ml, 4 da 175 ml, 3 da 250 ml) e quante bottiglie. Si possono scegliere più bottiglie, champagne e vino insieme.
- La lista dei vini è **provvisoria**: nomi e prezzi inventati, con due foto segnaposto, in attesa della lista reale.
- Menu, piatti, chef, opzioni dei drink e bottiglie stanno in `src/domain/catalog.ts`, con id stabili.

### Preventivo

Rivista di tre pagine: copertina IslaPlan creata per l'evento, descrizione dettagliata dell'evento, preventivo con le domande. Al primo arrivo si parte dalla copertina, ai ritorni direttamente dal preventivo.

1. **Estimate:** mostra un intervallo indicativo e chiede se il cliente lo accetta.
2. **Rifiuto:** il cliente torna a modificare l'evento con un supporto decisionale che mostra le voci che pesano di più, le modifiche che fanno risparmiare di più e la distanza dal budget. Può anche fermarsi: la richiesta resta salvata.
3. **Consulenza:** "Would you like a phone consultation?". Se sì, mostra email e telefono, senza il costo della chiamata.
   - Telefono: link `tel:`. Al ritorno il cliente ritrova la stessa schermata.
   - Email: compositore interno (TipTap) con A, Oggetto, Corpo, testo formattato, link e allegati. L'invio passa da uno stub.
4. **Procedere:** con o senza consulenza, chiede se il cliente vuole procedere. Se sì, mostra un ringraziamento: lo staff lo contatterà. **Non si chiede il deposito.**
5. **Risposta negativa:** a "proceed" mostra un breve messaggio cortese e salva la richiesta con il suo stato. Il "no" alla consulenza non chiude il flusso.
6. **Voci "On request":** non hanno importo. Se nessuna voce ha un prezzo non c'è importo.
7. **Deposito:** pagina e API restano solo per le richieste salvate prima, ancora in attesa di deposito.

### Area riservata

- Sfondo di marmo. Ogni evento è una rivista posata sul tavolo: più eventi, più riviste.
- Ogni rivista porta tipo di evento, data e stato, con l'etichetta Upcoming o Past. Aprendola si vede l'evento, con riepilogo, foto caricate dallo staff e conversazione con l'organizzatore.
- "Create new event" apre un nuovo wizard.

### CRM (non costruire)

Un secondo servizio, il CRM, gestirà in futuro le richieste. Ogni richiesta, accettata o rifiutata, va salvata in una struttura versionata che il CRM possa usare senza rifacimenti.

## 3. Architettura

- Le schermate importano le integrazioni solo da `src/integrations/index.ts`, che contiene solo codice sicuro per il browser. Le route API usano `src/integrations/server.ts`.
- `src/domain/` è puro: niente React, niente browser, niente Supabase.
- `src/integrations/contracts.ts` definisce le interfacce. Email, pagamento e CRM restano **stub** finché non viene chiesto altro.
- I testi modificabili stanno in `src/content/`, mai nei componenti.
- Email di contatto, telefono e percentuale di deposito stanno in `src/config/business.ts`.
- Niente librerie di stato, form o validazione.

## 4. Dati e contratto CRM

- Gli id delle opzioni sono stabili: si cambiano le etichette, mai gli id.
- Gli importi sono interi in pence.
- Le transizioni di stato stanno in una sola tabella in `src/domain/request.ts`.
- Una modifica che rompe il contratto incrementa `schemaVersion` e aggiorna `docs/crm-contract.md`. Le richieste vecchie si convertono con `upgradeRequest`.
- Il server ricalcola sempre il preventivo: non fidarti degli importi inviati dal browser.

## 5. Prezzi

- La fonte è `6baf2c930_stima_prezzi_eventi.xlsx`, trascritta in `src/domain/pricing/table.v3.ts` (`pricing-v3`).
- Il preventivo usa la fascia di ospiti: somma dei minimi × ospiti minimi, somma dei massimi × ospiti massimi.
- Differenze dall'Excel, decise dal cliente:
  - Brunch costa come Lunch finché non avrà prezzi suoi.
  - I bring my own food non costa nulla e non compare nel preventivo.
  - Flowers e Balloons costano £15 a persona ciascuno, per ogni tipo di evento.
  - Le bottiglie si pagano a bottiglia: Wine only conta solo le bottiglie scelte; Drinks all conta i cocktail al prezzo di Cocktails/spirits only più le bottiglie, 1 o ½ a persona arrotondate per eccesso, sugli ospiti minimi e massimi.
- Menu, numero di cocktail, bicchieri, orari e note non cambiano il prezzo.
- Ogni regola e ambiguità è documentata in `docs/pricing-rules.md`.
- Il preventivo è sempre presentato come indicativo.
- I prezzi dell'Excel e dei vini non sono validati: è un blocco per l'uscita online.
- **Caso di riferimento:** Wedding, From 40 to 60, Dinner, Wine only con 10 bottiglie di House Red, DJ, Flowers dà £3,200-£7,360, valore medio £5,280.

## 6. Sicurezza

- Non salvare né loggare mai dati di carta. I valori del modulo restano nel componente del provider di pagamento.
- La chiave `SUPABASE_SERVICE_ROLE_KEY` si usa solo sul server e non ha mai il prefisso `NEXT_PUBLIC_`.
- RLS attiva su ogni tabella. I bucket Storage sono privati e i file si leggono con URL firmati.
- Le chiavi stanno in `.env.local`, che è ignorato da git. Non leggerlo, non stamparlo e non chiedere le chiavi in chat. `.env.example` contiene solo i nomi delle variabili.
