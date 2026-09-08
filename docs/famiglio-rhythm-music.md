# Ritmo del Legame — preview locale

- Brano: **Fields of Hope**, Soma Animus, dal pacchetto locale `tamagochi asset/Hearth and Horizon - RPG Town Music Pack.zip`.
- Il README incluso autorizza uso personale/commerciale nei giochi e adattamenti; vieta rivendita o redistribuzione come asset indipendente. Non aggiungere download della traccia nell'interfaccia.
- Adattamento: primi 40 secondi, PCM16 mono, dissolvenza finale di 400 ms. Script riproducibile: `scripts/prepare-famiglio-rhythm-track.mjs`.
- File del gioco: `public/famiglio/rebuild/audio/minigames/fields-of-hope-rhythm-v1.wav`.
- Griglia stimata dall'inviluppo audio: 110 BPM, offset 150 ms, quattro battiti iniziali di preparazione. Velocità 1–1.2 (110–132 BPM). Da confermare percettivamente su smartphone; Bluetooth può aggiungere latenza.
- Clock della partita e input derivano da `audio.currentTime`: pause, buffering e accelerazione non usano un timer separato dalla musica.
- Un solo bersaglio centrale; niente corsie o trappole cacca. Finestra di 150 ms sui due lati del battito, PERFETTO entro 90 ms. Nessuna pubblicazione eseguita.
