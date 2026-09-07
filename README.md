# LoreWise Universe

Portale creativo di GiWise Studio dedicato ad arte originale protetta, LoreWise Codex, giochi, guide, commissioni, Universe Pass, Community e Famiglio del Nexus.

Il repository contiene il sito Next.js/Vinext e la sua infrastruttura locale di verifica. La pubblicazione online, gli invii promozionali e l'attivazione di pagamenti reali non sono impliciti in una build riuscita.

## Requisiti

- Node.js 22.13 o successivo.
- Dipendenze installate tramite `npm.cmd ci` su Windows.
- Variabili locali in `.env.local`, mai nel repository o negli artefatti generati.

## Avvio locale

```powershell
npm.cmd run dev
```

Per la preview dedicata al Famiglio:

```powershell
npm.cmd run preview:famiglio
```

## Verifica completa

```powershell
npm.cmd run verify
```

Il comando costruisce il sito, esegue tutti i test, lint, database, sicurezza, workspace, consegne, pagine, navigazione, asset, pacchetto pubblico, Shop, VIP, Famiglio e Codex. Un controllo fallito blocca la preparazione della preview.

Comandi mirati:

- `npm.cmd run test:all`: tutti i file `tests/*.test.mjs`.
- `npm.cmd run audit:secrets`: verifica che non siano presenti credenziali nei file del progetto.
- `npm.cmd run audit:workspace`: controlla che artefatti e sorgenti privati non siano tracciati.
- `npm.cmd run build:netlify`: build Next.js e rimozione delle copie `.env` dagli artefatti.

## Confini del progetto

La mappa completa di sorgenti web, progetti Android, materiali privati e output rigenerabili è in [docs/WORKSPACE_STRUCTURE.md](./docs/WORKSPACE_STRUCTURE.md).

Le decisioni storiche e i gate di lancio rimangono in [ROADMAP_LOREWISE_UNIVERSE.md](./ROADMAP_LOREWISE_UNIVERSE.md). Le istruzioni operative specifiche sono raccolte in `docs/`.

## Regole di sicurezza e pubblicazione

- Le opere pubbliche usano soltanto anteprime ridotte e protette; gli originali restano privati.
- LoreWise ID protegge account, ordini, diritti, download e aree amministrative.
- Campagne e comunicazioni restano bozze fino ad `Approva e programma` autorizzato dal proprietario.
- Pagamenti e pubblicazione rimangono separati dai controlli locali.

## Crediti di terze parti

- UI Sound Effects by lolurio, licenza CC BY 4.0. Testo completo in [docs/licenses/lolurio-cozy-ui-sfx-license.txt](./docs/licenses/lolurio-cozy-ui-sfx-license.txt).
