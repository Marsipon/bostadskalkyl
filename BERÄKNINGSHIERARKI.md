# Beräkningshierarki

Denna hierarki visar dataflödet från inmatning till visualisering. Det hjälper till att förstå beroenden och hur ändringar sprids genom systemet.

```
┌─────────────────────────────────────────────────────────────┐
│                     INMATNING (User Input)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Köpeskilling                                              │
│  • Försäljningspris                                          │
│  • Kontantinsats (%)                                         │
│  • Mäklararvode (%)                                          │
│  • Lagfart (%)                                               │
│  • Pantbrev (%)                                              │
│                                                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   GRUNDVÄRDEN (Base Values)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Kontantinsats (kr)                                        │
│  • Mäklararvode (kr)                                         │
│  • Lagfart (kr)                                              │
│  • Pantbrev (kr)                                             │
│                                                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              BERÄKNADE VÄRDEN (Calculated Values)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Lånebeloppet = Köpeskilling - Kontantinsats              │
│  • Total kostnad = Mäklararvode + Lagfart + Pantbrev        │
│  • Kapitalvinstskatt = Försäljningspris - Baskostnad        │
│  • Eget kapital = Försäljning - Lån - Kostnader             │
│  • Belåningsgrad = Lån / Köpeskilling                        │
│  • Kontantinsats % = (Kontantinsats / Köpeskilling) * 100   │
│                                                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESULTAT (Results)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Max bostadspris                                           │
│  • Min försäljningspris                                      │
│  • Eget kapital kvar                                         │
│  • Kontantinsatsbehov                                        │
│  • Långivningskapacitet                                      │
│                                                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               VISUALISERING (Visualization)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Pengaflöde (Money Flow Diagram)                           │
│  • Kostnadsfördelning (Cost Breakdown)                       │
│  • Distribution (Down Payment vs. Loan)                      │
│  • Skuldinventering (Loan Breakdown)                         │
│                                                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               FÖRKLARINGAR (Explanations)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Stegvis formelförklaring för varje resultat              │
│  • Länk till källdokumentation                               │
│  • Varför-sektioner                                          │
│  • Interaktiv drill-down på varje tal                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Beroendekarta

### Köpescenario
```
Köpeskilling
  ├─ Kontantinsats (%) → Kontantinsats (kr)
  ├─ Lånebeloppet
  │   ├─ Mäklararvode (%) → Mäklararvode (kr)
  │   ├─ Lagfart (%) → Lagfart (kr)
  │   └─ Pantbrev (%) → Pantbrev (kr)
  ├─ Belåningsgrad
  └─ Max lånebelopp
```

### Försäljningscenario
```
Försäljningspris
  ├─ Kapitalvinstskatt
  ├─ Mäklararvode
  ├─ Existing lån
  └─ Eget kapital kvar
```

## Designprincip: Single Responsibility

Varje beräkningsfunktion har ett ansvar:
- `calculateBase()` – Beräknar alla grundvärden
- `calculateResults()` – Beräknar alla resultatvärden
- `calculateExplanations()` – Genererar förklaringar
- `calculateConstraints()` – Kontrollerar begränsningar

Det gör det enkelt att:
1. Testa varje del för sig
2. Förstå dataflödet
3. Lägga till nya beräkningar
4. Felsöka problem
