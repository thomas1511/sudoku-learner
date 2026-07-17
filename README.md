# 🧩 Sudoku Lab

Een Nederlandse single-page app om **sudoku-oplostechnieken** te leren en het
herkennen van de **snelste zet** te trainen.

- **Techniektraining** — kies een techniek (locked candidates, naked/hidden
  subsets, X-Wing, Swordfish, XY/XYZ-Wing, kleuren, skyscraper, unique
  rectangle …), los een gegenereerd voorbeeld op en loop met de stapcoach door
  elke zet: *wat zie je, waarom, wat doe je, wat komt daarna*.
- **Snelste zet** — een herkenningsquiz: benoem de snelste volgende techniek en
  onthul stapsgewijs het antwoord, een tip en de gemarkeerde patroon­cellen.

Elke techniek wordt op eindeloos veel gevalideerde, willekeurige varianten van
hetzelfde patroon geoefend. Voortgang wordt lokaal bewaard.

## Ontwikkelen

```bash
npm install
npm run dev      # dev-server met hot reload
npm run build    # geoptimaliseerde build in dist/
npm run preview  # bekijk de productiebuild lokaal
```

De app is opgebouwd met [Vite](https://vitejs.dev) en heeft geen runtime-
dependencies. De code is opgesplitst volgens *separation of concerns* — zie
[`CLAUDE.md`](./CLAUDE.md) voor de architectuur.

## Deployen op Netlify

Deployen gaat automatisch via GitHub Actions
(`.github/workflows/deploy.yml`): elke push bouwt de app en zet die op Netlify.
Pushes naar de default branch gaan naar **productie**; andere branches en pull
requests krijgen een **preview** (met een link als PR-comment).

### Eenmalige instelling

Voeg twee **repository**-secrets toe in GitHub
(Settings → Secrets and variables → Actions → *New repository secret*):

- `NETLIFY_AUTH_TOKEN` — een token via Netlify → User settings → Applications →
  *New access token*.
- `NETLIFY_SITE_ID` — de **API ID** van je Netlify-site
  (Netlify → Site configuration → General → *Site details*).

Daarna deployt elke commit automatisch. `netlify.toml` regelt de SPA-routing,
caching en security-headers, zodat de repo direct in Netlify koppelen ook werkt.
