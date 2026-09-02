# The Resonating Self

Website rond de Resonance Theory of Consciousness: theorie, artikelen en de
Companion Suite (rekenapp, handleiding NL/EN, R-omgeving in de browser).

- **Schrijven** in RStudio, als Quarto-documenten (`.qmd`)
- **Beheer** in GitHub — `EdwardHill15/The-Resonating-Self`
- **Publicatie** via Netlify, die de lokaal gerenderde map `_site` oppakt

## Mapindeling

```
_quarto.yml                    projectconfiguratie + navigatie
styles.scss                    Bootstrap-variabelen (kleuren, radii, fonts)
brand.css                      webfonts + brand-styling (hero, kaarten, code)
brand.js                       NL | EN-schakelaar in de navigatiebalk
index.qmd                      homepage
theory.qmd                     RTC-theorie
suite.qmd                      de Companion Suite, in een iframe
blog.qmd                       overzicht van alle posts (grid, 3 kolommen)
research.qmd                   overzicht, alleen categorie "RTC"
publications.qmd               downloads
about.qmd  contact.qmd         over / contactformulier (Netlify Forms)
posts/
  _metadata.yml                geldt voor alle posts
  _template.qmd                startpunt voor een nieuw artikel
  JJJJ-MM-DD-slug/index.qmd    één map per artikel
en/                            de Engelse site — zelfde structuur, eigen posts
app/index.html                 de Companion Suite (één bestand, werkt offline)
downloads/                     PDF-handleiding, brontekst, losse bestanden
assets/                        afbeeldingen en figuren
assets/fonts/                  Carlito + Oranienbaum (.ttf)
_site/                         gerenderde site — gaat mee in de commit
_freeze/                       opgeslagen chunk-uitvoer — gaat mee in de commit
```

## Eenmalig opzetten

1. Installeer [Quarto](https://quarto.org/docs/get-started/) en R (4.4 of nieuwer).
2. `git clone https://github.com/EdwardHill15/The-Resonating-Self.git`
3. Open `The-Resonating-Self.Rproj` in RStudio.
4. Installeer de R-pakketten die de chunks gebruiken:
   `install.packages(c("rmarkdown","knitr","ggplot2","dplyr","deSolve","pracma"))`
5. Koppel de repository in Netlify. Publish directory: `_site`, build command: leeg.

## Een nieuw artikel schrijven

```bash
mkdir -p posts/2026-09-14-mijn-artikel
cp posts/_template.qmd posts/2026-09-14-mijn-artikel/index.qmd
```

Open het bestand in RStudio en schrijf. Gebruik voor de preview
`quarto preview` in de terminal — dat geeft de hele site met live herladen.

Vermijd **Render** / `Ctrl+Shift+K` op één artikel: dat schrijft een `index.html`
naast de `index.qmd`, en zulke losse bestanden verschijnen als dubbele post in
het overzicht. Staan ze er al, ruim ze dan op:

```bash
find posts en/posts -name index.html -delete
find posts en/posts -name 'index_files' -type d -exec rm -rf {} +
git rm -r --cached posts en/posts
git add posts en/posts
```

De listings zijn aan de projectroot geankerd — `/posts/*/index.qmd` voor de
Nederlandse pagina's, `/en/posts/*/index.qmd` voor de Engelse. Daardoor kan de
Nederlandse blog geen Engelse posts oppakken en omgekeerd, en wordt losse HTML
naast een `.qmd` niet meegeteld. `.gitignore` houdt die bovendien uit de
repository.

Als het klaar is: haal `draft: true` uit de kop, dan:

```bash
quarto render
git add .
git commit -m "Nieuw artikel: mijn artikel"
git push
```

Netlify publiceert binnen een minuut. Categorieën bepalen waar het stuk landt:
`RTC` komt ook op *Onderzoek*, de rest alleen in de blog.

## Waarom `_site` in de repository staat

De R-chunks hebben pakketten en data nodig die niet op een buildserver hoeven te
staan. Lokaal renderen houdt de uitvoer reproduceerbaar op één machine en de
deploy simpel: Netlify publiceert wat er staat. `freeze: auto` zorgt ervoor dat
een chunk alleen opnieuw draait als het bronbestand veranderd is.

De workflow `.github/workflows/check-render.yml` waarschuwt bij een push als er
`.qmd`-bestanden nieuwer zijn dan `_site`. Wie toch op de server wil renderen,
start hem handmatig met **Run workflow → full_render: true**.

## Tweetaligheid

De site rendert in één keer, met twee talen naast elkaar:

- Nederlands staat in de root: `index.qmd`, `theory.qmd`, `posts/…`
- Engels staat in `en/`: `en/index.qmd`, `en/theory.qmd`, `en/posts/…`

`brand.js` zet rechts in de navigatiebalk een **NL | EN**-schakelaar die naar de
tegenhanger van de huidige pagina wijst, en vertaalt de navigatielabels zodra je
binnen `/en/` bent. Er is dus één navbar in `_quarto.yml` en geen tweede render
of Quarto-profiel nodig.

Nieuw artikel in beide talen? Maak `posts/JJJJ-MM-DD-slug/index.qmd` én
`en/posts/JJJJ-MM-DD-slug/index.qmd`. Alleen Nederlands is ook goed — de
Engelse blog toont dan simpelweg minder stukken.

## Vormgeving

`styles.scss` zet alleen Bootstrap-variabelen. Alles wat `@font-face` of een
`url()` nodig heeft staat in `brand.css`, omdat Quarto de SCSS naar `site_libs/`
compileert en relatieve paden daar breken. Wie de vormgeving aanpast, doet dat
dus in `brand.css`; de fonts (Carlito, Oranienbaum) staan in `assets/fonts/` en
gaan mee in de commit.

## Formulieren aanzetten

Netlify detecteert formulieren niet automatisch bij nieuwe sites. Eenmalig:
*Site configuration → Forms → Form detection → **Enable***, en daarna één keer
opnieuw deployen — detectie gebeurt tijdens de deploy. Onder **Forms** horen dan
`contact` en `contact-en` te staan. Zolang dit uit staat, geeft het versturen
van het formulier een 404.

Na verzending komt de bezoeker op `bedankt.qmd` (NL) of `en/thanks.qmd` (EN).

## Meldingen bij een nieuw bericht

De functie `netlify/functions/submission-created.mjs` wordt door Netlify
automatisch aangeroepen zodra iemand een formulier verstuurt. Hij mailt de
inhoud van de inzending naar **totalegezondheidbv@gmail.com** via Resend.

Zet hiervoor in Netlify → *Site configuration → Environment variables*:

| Variabele | Waarde |
|---|---|
| `RESEND_API_KEY` | API-key van [resend.com](https://resend.com) (gratis tot 3000 mails/maand) |
| `MAIL_FROM` | een verifieerd afzenderadres, bv. `site@jouwdomein.nl` |
| `MAIL_TO` | `totalegezondheidbv@gmail.com` (staat al als standaard in de code) |

Ontbreken de eerste twee, dan doet de functie niets en breekt er niets: de
inzending staat altijd in het dashboard onder **Forms**.

Bij Resend moet je het afzenderadres eenmalig verifiëren. Heb je geen eigen
domein, gebruik dan `onboarding@resend.dev` als `MAIL_FROM` om te testen.

Zonder Resend-account kan het ook helemaal zonder code:
*Site configuration → Forms → Form notifications → Add notification → Email*,
en vul `totalegezondheidbv@gmail.com` in. Doe dat voor **beide** formulieren,
`contact` en `contact-en`.

## De suite bijwerken

`app/index.html` is één zelfstandig bestand: handleiding NL en EN, de rekenapp met
acht RTC-modules, en de R-omgeving met vier panelen (editor, console,
environment/history/files, plots/packages/Quarto-preview). Vervang het bestand en
commit; er is geen buildstap.
