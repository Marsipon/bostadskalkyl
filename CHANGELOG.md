# Changelog

Alla noterbara förändringar i projektet dokumenteras här.

Formatet baseras på [Keep a Changelog](https://keepachangelog.com/) och projektet följer [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Design principles documentation (DESIGNPRINCIPER.md)
- Calculation hierarchy documentation (BERÄKNINGSHIERARKI.md)
- Contributing guide (CONTRIBUTING.md)
- Roadmap (ROADMAP.md)
- Security policy (SECURITY.md)
- CSS styles for clickable result numbers
- CSS styles for explanation modals
- Breadcrumb navigation styles
- Mobile-optimized safe area support for notched devices

### Changed
- Updated viewport meta tag to prevent iOS zoom on input focus
- Enhanced input styling for mobile (font-size 16px prevents zoom)
- Improved button touch targets with `touch-action: manipulation`
- Enhanced safe area inset support for notched phones

### Fixed
- iOS Safari automatic zoom when focusing on input fields
- Input font size now stays at 16px to prevent zoom

## [1.0.0] - 2026-07-10

### Added
- Initial release
- Mobile-first housing calculator
- Offline-first with localStorage
- Multiple calculations support
- URL sharing via compressed hash
- Price slider exploration
- Down payment slider
- Assumption editing (down payment %, fees, etc.)
- Export/import functionality (bostadskalkyl.json)
- Visual breakdowns and money flow diagrams
- Detailed explanations for each calculation
- Service Worker for offline support
- PWA manifest for installability
- Responsive design for all screen sizes
- ESLint configuration
- Test framework setup

---

## Versions

### Version Format
`[X.Y.Z]` - YYYY-MM-DD

- **MAJOR** (X) – Breaking changes to calculation logic or data format
- **MINOR** (Y) – New features, backwards compatible
- **PATCH** (Z) – Bug fixes, documentation, no logic changes

### Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` with all changes
3. Create git tag: `git tag vX.Y.Z`
4. Push tag: `git push --tags`
5. GitHub Actions automatically builds and deploys to GitHub Pages

---

## Planning Next Features

Kommande versioner planeras att innehålla:

- **v1.1.0** – Clickable result numbers with formula breakdown
- **v1.2.0** – Goal mode (work backwards from savings)
- **v1.3.0** – Explanation engine with educational content
- **v1.4.0** – Advanced loan analysis and comparison
- **v2.0.0** – Multi-calculation comparison and analytics

Se [ROADMAP.md](ROADMAP.md) för mer detaljer.
