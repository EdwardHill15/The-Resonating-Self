# The Resonating Self

Website rond de Resonance Theory of Consciousness: theorie, artikelen en de
Companion Suite (rekenapp, handleiding NL/EN, R-omgeving in de browser).

- **Schrijven** in RStudio, als Quarto-documenten (`.qmd`)
- **Beheer** in GitHub — `EdwardHill15/The-Resonating-Self`
- **Publicatie** via Netlify, die de lokaal gerenderde map `_site` oppakt

## Mapindeling

```
_quarto.yml                    projectconfiguratie + navigatie
styles.scss                    Total Health Design System als Quarto-thema
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
app/index.html                 de Companion Suite (één bestand, werkt offline)
downloads/                     PDF-handleiding, brontekst, losse bestanden
assets/                        afbeeldingen en figuren
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

Open het bestand in RStudio, schrijf, en gebruik **Render** (of `Ctrl+Shift+K`)
voor een preview van alleen dat artikel. `quarto preview` geeft de hele site met
live herladen.

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

## De suite bijwerken

`app/index.html` is één zelfstandig bestand: handleiding NL en EN, de rekenapp met
acht RTC-modules, en de R-omgeving met vier panelen (editor, console,
environment/history/files, plots/packages/Quarto-preview). Vervang het bestand en
commit; er is geen buildstap.
