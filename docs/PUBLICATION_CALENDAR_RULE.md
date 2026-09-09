# Regola di pubblicazione del calendario LoreWise

Ogni nuovo contenuto reso pubblico nel sito deve avere, nello stesso aggiornamento, una voce in `data/site-publication-news.json`. La regola vale per giochi, opere e collezioni d’arte, Codex, Famigli, commissioni, Universe Pass, mondi e Community.

Il calendario è destinato agli utenti: correzioni di codice, sprite, test, database, manutenzione, refactoring, modifiche tecniche e attività interne non devono mai diventare notizie.

La programmazione pubblica parte dal 9 settembre 2026. Le novità preparate in agosto vengono presentate gradualmente nei mesi successivi, senza creare un falso archivio precedente al lancio del calendario.

La voce deve indicare una data reale, un titolo e una descrizione utili al visitatore, il collegamento alla pagina disponibile e un’immagine autentica del contenuto. I testi non devono mostrare procedure editoriali o dettagli tecnici. Se un’immagine autentica esiste già nel progetto va usata; una nuova illustrazione coerente può essere creata soltanto quando manca un visual adatto.

Il comando `npm run audit:calendar` controlla completezza, unicità, date, percorsi e immagini. Il controllo viene eseguito automaticamente prima delle build locali e Netlify: un registro incompleto impedisce la pubblicazione.
