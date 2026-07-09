# Bostadskalkyl

Bostadskalkyl är en helt statisk, mobile-first webbapp för att räkna på köp och försäljning av bostäder i Sverige. All data stannar i webbläsaren och appen kan hostas gratis på GitHub Pages.

## Funktioner

- fungerar offline efter första laddningen
- ingen backend, inget konto och ingen serverlagring
- flera kalkyler i `localStorage`
- snabbvy + stegvis formelförklaring för varje nyckeltal
- redigerbara antaganden (kontantinsats, lagfart, pantbrev, mäklarregel)
- prisreglage, kontantinsatsreglage och läge för att utforska möjliga prisnivåer
- dela aktivt scenario via komprimerad URL-hash
- export/import av `calc.json`
- mobilförst layout utan horisontell scroll
- rena beräkningsfunktioner i separata moduler

## Projektstruktur

- `/index.html`
- `/style.css`
- `/app.js`
- `/state.js`
- `/calculations.js`
- `/storage.js`
- `/ui.js`
- `/constants.js`
- `/utils.js`
- `/manifest.json`
- `/sw.js`
- `/.github/workflows/deploy.yml`

## Lokal utveckling

```bash
npm install
npm run lint
npm test
npm run build
```

Öppna sedan `index.html` via en lokal server, till exempel:

```bash
python -m http.server
```

## Delning

Aktiv kalkyl serialiseras så här:

1. state → JSON
2. JSON → LZ-string
3. komprimerad byte-array → Base64URL
4. Base64URL → `location.hash`

När någon öppnar länken importeras samma scenario automatiskt i webbläsaren.

## Deployment

Workflowen i `.github/workflows/deploy.yml` kör lint, tester och statisk validering innan sajten publiceras till GitHub Pages.
