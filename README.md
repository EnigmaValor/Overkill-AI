# Advanced Password Manager

En kraftfuld React-komponent til passwordhåndtering med avancerede sikkerhedsfunktioner.

## Funktioner

- **Password Strength Checker**: Real-time evaluering af password styrke
- **Password Generator**: Generer sikre passwords med tilpasselige indstillinger
- **Shamir Secret Sharing**: Simulering af hemmelig deling for ekstra sikkerhed
- **Password Encryption**: Kryptering af passwords med brugerdefineret nøgle
- **Responsive Design**: Flot og moderne UI med Tailwind CSS

## Installation

```bash
npm install
```

## Kør udviklings-server

```bash
npm run dev
```

## Build til produktion

```bash
npm run build
```

## Funktioner i detaljer

### Password Strength Checker
- Real-time evaluering af password styrke
- Visuel indikator med farver (rød/gul/grøn)
- Detaljerede krav (længde, store/små bogstaver, tal, specialtegn)
- Mulighed for at vise/skjule password

### Password Generator
- Justerbar længde (6-30 tegn)
- Valgmuligheder for tegntyper:
  - Store bogstaver (A-Z)
  - Små bogstaver (a-z)
  - Tal (0-9)
  - Specialtegn (!@#$...)

### Shamir Secret Sharing
- Simulering af Shamir's Secret Sharing algoritme
- Konfigurerbar threshold (k) og total antal shares (n)
- Generering af shares til sikker opbevaring

### Password Encryption
- Simpel kryptering med brugerdefineret nøgle
- Base64 encoding af resultat
- Copy-funktionalitet til clipboard

## Sikkerhedsnotater

Dette værktøj simulerer avancerede password-sikkerhedsfunktioner. Til produktionsbrug bør du implementere ordentlige kryptografiske biblioteker og følge bedste praksis for sikkerhed.

## Teknologier

- React 18
- TypeScript
- Tailwind CSS
- Vite