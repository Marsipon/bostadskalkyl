# Bidra till Bostadskalkyl

Tack för ditt intresse i att bidra! Vi välkomnar contributions från alla.

## Hur du kan bidra

### Felrapporter
Om du hittar en bugg:

1. Gå till [Issues](https://github.com/Marsipon/bostadskalkyl/issues)
2. Kontrollera att problemet inte redan är rapporterat
3. Skapa en ny issue med:
   - Beskrivning av problemet
   - Steg för att reproducera
   - Förväntat resultat
   - Faktiskt resultat
   - Miljö (telefon/webbläsare/OS)

### Funktionsförslag
Har du en idé för en ny funktion?

1. Öppna en [Discussion](https://github.com/Marsipon/bostadskalkyl/discussions)
2. Beskriv funktionen
3. Förklara varför det skulle vara värdefullt
4. Vi diskuterar det tillsammans

### Kodändringar

#### Setup
```bash
git clone https://github.com/Marsipon/bostadskalkyl.git
cd bostadskalkyl
npm install
npm run build
```

#### Utveckling
```bash
# Öppna en lokal server
python -m http.server

# I ett annat terminal-fönster, kör linter & tester på ändringar
npm run lint && npm test
```

#### Innan du skickar en Pull Request

1. **Läs designprinciperna** – Se [DESIGNPRINCIPER.md](DESIGNPRINCIPER.md)
2. **Förstå arkitekturen** – Se [BERÄKNINGSHIERARKI.md](BERÄKNINGSHIERARKI.md)
3. **Testa dina ändringar**
   - `npm run lint` – Kontrollera kodstil
   - `npm test` – Kör testsviten
   - Testa på flera enheter, speciellt iOS
4. **Dokumentera** – Uppdatera README eller relevanta dokumentfiler
5. **Skriv ett tydligt PR-meddelande** – Förklara varför denna ändring är viktig

#### Kodstandard
- Vi använder ESLint för kodstil
- Koden ska kunna förklaras
- Test för nya funktioner är obligatoriskt
- Behåll JavaScript ES6-moduler

#### Beräkningar
- Lägg beräkningar i `calculations.js`
- Varje beräkning ska ha en motsvarande förklaring
- Använd `createExplanation()` för att dokumentera formler
- Test alla beräkningar för edge cases

## Licensöversättning

Genom att bidra godkänner du att din kod licensieras under MIT-licensen.

## Vi uppskattar speciellt

- Bug-rapporter med reproduceringssteg
- Förbättringar av dokumentationen
- Testfallen för edge cases
- Tillgänglighetsförbättringar (a11y)
- Mobila optimeringar
- Förtydligande av svåra formler

## Projekt-roadmap

Se [ROADMAP.md](ROADMAP.md) för vad vi arbetar på nästa.

## Frågor?

Gör gärna en [Discussion](https://github.com/Marsipon/bostadskalkyl/discussions) eller öppna en issue.

---

**Tack för ditt bidrag! 🙏**
