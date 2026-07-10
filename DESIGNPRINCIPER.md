# Designprinciper

Dessa principer styr utvecklingen av Bostadskalkyl. De är inte funktioner utan riktlinjer för hur appen ska fungera och kännas.

## 1. Alla beräkningar ska kunna förklaras

Varje resultat måste kunna spåras tillbaka till användarens ingångar. Det finns aldrig ett "magiskt svar" – istället visar vi exakt hur vi kom fram till det.

En användare ska kunna klicka på vilket tal som helst och se formeln, variablerna och källan för varje del av beräkningen.

## 2. Användaren ska aldrig behöva skriva in ett värde som kan beräknas

Om något kan beräknas från något annat, beräknar vi det. Vi ber inte användaren om onödig input.

Exempel: Om vi vet försäljningspriset och köpeskillingen kan vi beräkna långivningsbeloppet – vi frågar aldrig om det direkt.

## 3. Appen ska fungera helt offline

All data sparas lokalt i webbläsaren. Det finns ingen backend, ingen server, ingen cloud.

Det betyder:
- Snabb laddning
- Ingen datainsamling
- Ingen begränsning på antal kalkyler
- Åtkomst även utan internetanslutning

## 4. Appen ska kunna användas med en hand

Designen måste fungera på små telefoner. Alla knappar och interaktiva element måste kunna nås och aktiveras med en tumme från en hand.

- Touch-targets: minst 44×44 px
- Lagring av state automatiska
- Ingen scrollning fram och tillbaka mellan flikar
- Ingen horisontell scroll

## 5. En kalkyl ska kunna delas med en enda URL

Istället för att tipsa en vän om värden kan man dela länken direkt. Länken kodifierar hela kalkylen.

Det är ett sätt att ge tips utan att behöva upprepa siffrorna.

## 6. Det ska aldrig krävas fler än 3–5 obligatoriska inmatningar

Komplexitet döljs bakom antaganden och förklaringar, inte bakom tvingande formulär.

Användaren behöver inte förstå alla parametrar för att starta. Vi ber om det minsta antalet värden för att ge ett svar.

## 7. Pedagogik före funktionalitet

Om något är användbart men förvirrande tar vi bort det eller förklarar det bättre.

Vi bygger ett utbildningsverktyg, inte bara en räknesnurra.

## 8. Transparens är säkerhet

Folk litar på vad de förstår. Vi visar alltid:
- Vilka antaganden vi använder
- Hur vi räknar
- Varför vi räknar så
- Var siffrorna kommer från

Det bygger förtroende.
