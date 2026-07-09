# Bostadskalkyl – Kravspecifikation v2.0

## 1. Produktvision

Bostadskalkyl är en mobil-först, statisk webbapplikation som hjälper användaren att snabbt förstå ekonomin vid köp och försäljning av bostad.

Applikationen ska svara på frågor som:

* Har jag råd att köpa denna bostad?
* Hur mycket kontantinsats behöver jag?
* Hur mycket pengar får jag loss efter försäljning?
* Hur dyr bostad kan jag köpa?
* Hur påverkas kalkylen om priset ändras?
* Hur räknades siffrorna fram?

Applikationen ska prioritera:

1. Enkelhet
2. Transparens
3. Mobil användning
4. Lokal datahantering
5. Delbarhet

---

## 2. Tekniska begränsningar

### Arkitektur

Applikationen ska vara:

* 100 % statisk
* Ingen backend
* Ingen databas
* Ingen användarinloggning
* Ingen extern lagring av användardata

### Teknik:

* HTML5
* CSS3
* Vanilla JavaScript
* GitHub Pages hosting
* GitHub Actions deployment

---

## 3. Mobile First

### Primär plattform

Mobiltelefon.

### Designmål:

* iPhone
* Android
* 360–430 px bredd

Desktop är sekundär.

### UX-princip

En användare ska kunna:

1. Öppna sidan
2. Ange några få siffror
3. Få svar inom 10 sekunder

---

## 4. Datahantering

### LocalStorage

Alla användarens kalkyler sparas lokalt.

Exempel:

```json
{
  "version": 2,
  "calculations": [
    {
      "id": "villa-2026",
      "name": "Villa 2026",
      "updated": "2026-07-09",
      "data": {}
    }
  ]
}
```

### Kalkylhantering

Användaren ska kunna:

* skapa ny kalkyl
* döpa kalkyl
* byta namn
* duplicera kalkyl
* ta bort kalkyl
* välja aktiv kalkyl

Exempel:

```
Mina kalkyler
🏠 Villa Stockholm
🏡 Radhus
🏢 Lägenhet
```

---

## 5. URL-delning

En kalkyl ska kunna delas via URL.

### Flöde:

```
State
↓
JSON
↓
komprimering
↓
Base64URL
↓
URL hash
```

Exempel:

```
bostadskalkyl.se/#ABC123...
```

### Vid öppning:

Visa:

```
Delad kalkyl
Villa Stockholm
[Spara som min kalkyl]
[Fortsätt utan att spara]
```

---

## 6. Nuvarande bostad

### Obligatoriska värden

Användaren anger:

#### Marknadsvärde

Exempel:

```
5 500 000 kr
```

### Bolån

Stöd för flera lånedelar.

Exempel:

```
Bolån
Lån 1
1 200 000
Lån 2
900 000
Lån 3
650 000
Totalt:
2 750 000
```

### Valfria historiska värden

För pedagogik:

* inköpspris
* ursprungligt lån
* inköpsdatum
* renoveringar
* amorterat belopp

Dessa används inte för huvudkalkylen.

---

## 7. Försäljning

### Input:

* förväntat försäljningspris
* mäklararvode
* eventuell skatt
* övriga kostnader

### Beräkning:

```
Försäljningspris
-
Bolån
-
Försäljningskostnader
=
Tillgängligt kapital
```

---

## 8. Ny bostad

### Input:

* bostadspris
* kontantinsats %
* befintliga pantbrev
* renoveringsbudget
* övriga kostnader

---

## 9. Svenska bostadskostnader

Applikationen ska stödja:

### Kontantinsats

Standard:

```
15 %
```

Men användaren ska kunna ändra:

```
10 %
15 %
20 %
30 %
```

med slider.

### Lagfart

Automatisk beräkning.

Visas:

```
Köpesumma:
6 000 000
Lagfart:
90 825 kr
```

### Pantbrev

Automatisk beräkning.

Exempel:

```
Behov av nya pantbrev:
6 000 000
-
befintliga pantbrev
=
nya pantbrev
```

---

## 10. Interaktiv pris-slider

Inspirerad av Hemnet.

Bostadspris ska kunna ändras med slider.

Exempel:

```
Ny bostad
6 200 000 kr
4 M ───────●──── 8 M
```

Alla värden uppdateras direkt:

* kontantinsats
* lån
* lagfart
* pantbrev
* kvarvarande kapital

---

## 11. Interaktiv kontantinsats-slider

Exempel:

```
Kontantinsats
15 %
10 % ─────●──── 50 %
```

Resultat uppdateras:

```
15 %
Kontantinsats:
900 000
Lån:
5 100 000
30 %
Kontantinsats:
1 800 000
Lån:
4 200 000
```

---

## 12. Transparent beräkningsmotor

Alla resultat ska kunna förklaras.

Varje beräkning ska ha:

* resultat
* formel
* inputvärden
* uträkning

### Exempel:

Eget kapital

Visning:

```
Eget kapital
2 650 000 kr
ⓘ
```

Detalj:

```
Formel:
Försäljningspris
-
Bolån
-
Kostnader

5 500 000
-
2 750 000
-
100 000
=
2 650 000 kr
```

---

## 13. Kalkylobjekt

Alla beräkningar ska returnera:

```json
{
  "value": 2650000,
  "explanation": {
    "formula": "Försäljning - lån - kostnader",
    "inputs": []
  }
}
```

UI ska automatiskt kunna skapa informationskort.

---

## 14. Resultatvy

### Primärt resultat:

```
Kan du köpa?
✅ JA
Du får:
420 000 kr över
```

eller:

```
❌ NEJ
Du saknar:
250 000 kr
```

---

## 15. "Vad händer om?"

Appen ska stödja simulering.

Exempel:

```
Om bostaden kostar:
6 000 000
↓
6 500 000
↓
7 000 000
```

Visa:

* marginal
* kapitalbehov
* lån

---

## 16. Pedagogiskt läge

Användaren ska kunna förstå:

* varför eget kapital förändras
* hur amortering påverkat
* hur kontantinsats påverkar lån
* hur lagfart påverkar affären

---

## 17. Import / Export

### Export:

```
bostadskalkyl.json
```

### Import:

```
Ladda kalkyl
```

---

## 18. Kodstruktur

### Rekommenderad:

```
src/
├── state.js
├── storage.js
├── calculator.js
├── formulas.js
├── url-share.js
├── ui.js
├── format.js
├── index.html
└── style.css
```

---

## 19. Testkrav

### Funktionella tester

Testa:

* flera lån
* inga lån
* negativ marginal
* hög bostadspris
* låg kontantinsats
* delad URL
* trasig URL
* tom LocalStorage

---

## 20. CI/CD

### GitHub Actions:

```
Push main
↓
Lint
↓
Test
↓
Deploy GitHub Pages
```

---

## 21. Framtida funktioner

### Version 3:

* PWA-installation
* offline mode
* räntescenario
* amorteringsplan
* månadskostnad
* PDF-export
* flera ägare
* jämförelse mellan bostäder

---

## Produktprincip

Bostadskalkyl ska inte bara ge ett svar. Den ska visa användaren varför svaret blev så.

Det är den största skillnaden mot vanliga bostadskalkylatorer. Den ska kännas som en kombination av Hemnets snabbhet, ett Excelarks transparens och en pedagogisk ekonomilärare – men fortfarande vara en liten, snabb statisk mobilapp.
