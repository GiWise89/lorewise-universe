# APK canonico del Famiglio del Nexus

Il solo client Android da compilare è `famiglio-nexus-webview-android`.

- mostra esclusivamente `/famiglio`;
- usa la stessa interfaccia responsive della versione web mobile;
- in debug apre `http://192.168.1.7:3016/famiglio`;
- non contiene un secondo database o una seconda logica del Famiglio;
- non pubblica nulla durante build, lint o test.

La cartella `famiglio-nexus-android` resta come archivio del prototipo precedente
e non è una sorgente di release. Questa scelta elimina la divergenza fra Room,
WorkManager e lo stato realmente usato dalla WebView.
