# Säkerhetspolicy

## Säkerhetsprincipler

Bostadskalkyl tar säkerhet på allvar. Här är hur vi skyddar dina data:

### 1. Ingen datainsamling
- All data stannar på din enhet
- Vi samlar inte in personlig information
- Vi har ingen backend, ingen databas, ingen loggning
- Inte ens IP-adresser eller besöksstatistik

### 2. Transparent kodöversättning
- Koden är öppen och granskas av gemenskapen
- Du kan läsa exakt hur vi beräknar siffror
- Du kan se att vi inte skickar något på nätet

### 3. HTTPS överallt
- GitHub Pages använder tvingande HTTPS
- All kommunikation är krypterad
- Ingen man-in-the-middle-attack är möjlig

### 4. Ingen externa beroenden
- Vi använder minimala beroenden
- Allt är auditable
- Inga dolda tracking-skript

---

## Rapportering av säkerhetsbuggar

Om du hittar en säkerhetssårbarhet:

### ⚠️ Gör INTE

- Öppna en offentlig issue
- Diskutera problemet i sociala medier
- Skicka kod som exploaterar sårbarheten

### ✅ Gör

1. Kontakta oss privat via [GitHub Security Advisory](https://github.com/Marsipon/bostadskalkyl/security/advisories)
2. Beskriv sårbarheten tydligt
3. Inklud steg för att reproducera
4. Ge oss tid att fixa det innan du offentliggör det

### Tidslinje
- **Dag 0** – Du rapporterar sårbarheten
- **Dag 1-2** – Vi bekräftar mottagandet
- **Dag 2-14** – Vi arbetar på en fix
- **Dag 14+** – Vi publicerar en fix och bekräftar dig

---

## Säkerhetsbester för användare

### Data på din enhet
- Vi sparar beräkningar i `localStorage`
- Det är enkrypterat av din webbläsare
- Endast du kan läsa det från din enhet

### Del av kalkyler
- När du delar en länk kodar vi värdena i URL-hashen
- Hashen är komprimerad med LZ-string
- Länken är en data-URI – den körs helt lokalt, ingen server-request

### Export
- Du kan exportera kalkyler som JSON
- Filen lagras BARA på din enhet
- Vi läser aldrig av den

---

## Kända limitationer

### Webbläsare-säkerhet
- `localStorage` kan läsas av JavaScript på samma domain
- Om din enhet är komprometterad kan data läsas
- Därför: **dela aldrig känsliga kalkyler via osäkra nätverk**

### Delade URL:er
- En URL som innehåller alla värden kan sparas/logggas av:
  - Din webbläsarhistorik
  - Din WiFi-router
  - Din ISP
  - Länk-delare tjänster

**Rekommendation:** Dela känsliga kalkyler över krypterad kommunikation (Signal, Telegram, etc.)

---

## Framtida säkerhetsförbättringar

- [ ] Web Crypto API för lokal kryptering av localStorage
- [ ] Content Security Policy (CSP)-headers
- [ ] Subresource Integrity (SRI) för alla externa resources
- [ ] Regelbundna säkerhetgranskningar

---

## Transparans-rapport

### Vilka data samlas in?
- **Ingen**. Vi kör helt offline.

### Använder vi cookies?
- **Nej**. Bara localStorage.

### Använder vi tracking?
- **Nej**. Ingen Google Analytics, Facebook Pixel, eller liknande.

### Använder vi CDNs?
- **Ja** – GitHub Pages använder Fastly CDN
  - Det är endast en cache, den körs inte JavaScript
  - Kan inte läsa dina data

### Skickar vi något till servrar?
- **Nej**. 100% offline.

---

## Kontakt

För säkerhetsfrågor, använd [GitHub Security Advisory](https://github.com/Marsipon/bostadskalkyl/security/advisories).

För andra frågor: öppna en [Discussion](https://github.com/Marsipon/bostadskalkyl/discussions)

---

**Senast uppdaterad:** 2025-07-10
