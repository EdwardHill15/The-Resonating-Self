# Totale Gezondheid (The Resonating Self)

Website van de praktijk Totale Gezondheid: psychologische begeleiding,
psychodiagnostiek en bewegingstherapie op grondslag van The Resonating Self,
de Resonance Theory of Consciousness. Bevat de theorie, artikelen en de
Companion Suite (rekenapp, handleiding NL/EN, R-omgeving in de browser).

- **Schrijven** in RStudio, als Quarto-documenten (`.qmd`)
- **Beheer** in GitHub, repository `EdwardHill15/The-Resonating-Self`
- **Publicatie** via Netlify, die de lokaal gerenderde map `_site` oppakt

## Mapindeling

```
_quarto.yml                    projectconfiguratie + navigatie
styles.scss                    Bootstrap-variabelen (kleuren, radii, fonts)
brand.css                      webfonts + brand-styling (hero, kaarten, code)
brand.js                       NL | EN-schakelaar in de navigatiebalk
index.qmd                      homepage: Totale Gezondheid, met The Resonating Self als theorie
theory.qmd                     RTC-theorie
therapy.qmd                    MBMR — bilaterale bewegingstherapie
stm.qmd                        STM — (Her-)Synchroniserende Therapie Methode
psychodiagnostiek.qmd          MMPI-2 Casusanalyse in een iframe, afgeschermd (zie hieronder)
afspraak.qmd                   agenda + beeldbellen + iDEAL-betaling
betaling-gelukt.qmd            landingspagina na een geslaagde betaling
booking.js                     de afspraakwidget (Cal.com-embed + Mollie)
suite.qmd                      de Companion Suite, in een iframe
blog.qmd                       overzicht van alle posts (grid, 3 kolommen)
research.qmd                   overzicht, alleen categorie "RTC"
publications.qmd               downloads
about.qmd  contact.qmd         over / contactformulier (Netlify Forms)
netlify/functions/psychodiag-app/   functie + app-bestand, NIET in _site (zie "Psychodiagnostiek")
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

### De herofoto vervangen

`netlify.toml` geeft alles onder `/assets/*` een cache van een heel jaar
("immutable"), voor snelle laadtijden. Vervang je `assets/hero-photo.jpg` door
een nieuwe foto met dezelfde bestandsnaam, dan blijven browsers en Netlify's
eigen CDN bij bezoekers die de site al kenden gewoon de oude foto tonen: die
hebben de oude inhoud onder die naam al als "nooit meer wijzigend" in cache
staan. Verhoog daarom bij elke nieuwe herofoto het versienummer achter de
bestandsnaam in `brand.css`:

```css
url("assets/hero-photo.jpg?v=3") center/cover no-repeat;
```

Elk nieuw versienummer is voor elke cache een nooit eerder geziene URL, dus
wordt de nieuwe foto meteen bij iedereen opgehaald. Het bestand zelf mag
gewoon `hero-photo.jpg` blijven heten; alleen het getal achter `?v=` hoeft
omhoog.

## Formulieren aanzetten

Netlify detecteert formulieren niet automatisch bij nieuwe sites. Eenmalig:
*Site configuration → Forms → Form detection → **Enable***, en daarna één keer
opnieuw deployen — detectie gebeurt tijdens de deploy. Onder **Forms** horen dan
`contact` en `contact-en` te staan. Zolang dit uit staat, geeft het versturen
van het formulier een 404.

Na verzending komt de bezoeker op `bedankt.qmd` (NL) of `en/thanks.qmd` (EN).

## Afspraken, beeldbellen en betalen

De pagina `afspraak.qmd` (Engels: `en/booking.qmd`) bevat vier afspraaktypen,
een agenda en de iDEAL-betaling. Drie diensten moeten eenmalig worden ingesteld.

### 1. Cal.com — de agenda

1. Maak een gratis account op [cal.com](https://cal.com) en koppel je Google- of
   Outlook-agenda; Cal.com leest daaruit je vrije momenten.
2. Maak vier event types aan met precies deze URL-slugs:

   | Slug | Duur | Prijs |
   |---|---|---|
   | `kennismaking-20` | 20 min | gratis |
   | `intake-60` | 60 min | € 100 (betaling loopt via de site) |
   | `sessie-60` | 60 min | € 100 (betaling loopt via de site) |
   | `terugbelverzoek` | 15 min | gratis |

3. Zet bij elk type onder *Location* je videodienst: **Google Meet** of **Zoom**.
   Cal.com maakt dan per boeking een gesprekslink en zet die in de
   agenda-uitnodiging en de bevestigingsmail. Voor een telefonisch gesprek kies je
   *Attendee phone number*.
4. Vul je gebruikersnaam bovenaan `booking.js` in:
   `var CAL_USER = "jouw-cal-naam";`

### 2. Mollie — iDEAL

iDEAL is één betaalmethode die alle Nederlandse banken afhandelt (ING, Rabobank,
ABN AMRO, SNS, ASN, bunq, Knab, Regiobank, Revolut, Triodos, Van Lanschot). De
cliënt kiest zijn bank op de betaalpagina van Mollie; losse koppelingen per bank
bestaan niet en zijn ook niet nodig.

1. Maak een account op [mollie.com](https://www.mollie.com/nl) en zet iDEAL aan.
   Geen abonnement; ongeveer € 0,29 per transactie.
2. Zet in Netlify → *Site configuration → Environment variables*:

   | Variabele | Waarde |
   |---|---|
   | `MOLLIE_API_KEY` | `test_...` om te proberen, `live_...` zodra het werkt |
   | `SITE_URL` | `https://the-resonating-self.netlify.app` |

3. Test eerst met de testsleutel: je doorloopt dan de hele flow zonder dat er
   geld wordt overgemaakt.

Zonder `MOLLIE_API_KEY` blijft de pagina werken; de betaalknop meldt dan netjes
dat de koppeling nog niet is ingesteld.

### 3. Wat er automatisch gebeurt

- `netlify/functions/create-payment.mjs` maakt de iDEAL-betaling en stuurt de
  cliënt naar zijn bank.
- `netlify/functions/payment-webhook.mjs` wordt door Mollie aangeroepen zodra er
  betaald is, controleert de status bij Mollie zelf, en mailt de afspraakgegevens
  naar de praktijk (via dezelfde Resend-koppeling als het contactformulier).
- Na betaling landt de cliënt op `betaling-gelukt.qmd`.

### AVG bij een psychologiepraktijk

Cal.com en Mollie verwerken persoonsgegevens namens jou; sluit bij beide een
verwerkersovereenkomst (Cal.com: *Settings → Legal*; Mollie: standaard in de
voorwaarden). Google Meet vraagt om een Google Workspace-abonnement met
verwerkersovereenkomst als je er klinische gesprekken via voert — een gratis
Gmail-account biedt die niet. Het formulier vraagt uitdrukkelijk géén medische
details; dat is bewust.

## Psychodiagnostiek (afgeschermd)

De pagina `psychodiagnostiek.qmd` (Engels: `en/psychodiagnostiek.qmd`) toont in
een iframe de MMPI-2 Casusanalyse: het instrument waarmee NVM-, SCL-90- en
UCL-scores worden vertaald naar de aard en het niveau van avidya en dukkha.
Die app bevat cliëntgegevens en is dus met een wachtwoord afgeschermd, alleen
voor de behandelaar. Bezoekers van de site zien op die pagina uitsluitend een
inlogscherm.

### Hoe de afscherming werkt

- Het bestand `netlify/functions/psychodiag-app/psychodiagnostiek.html` (de
  app zelf) staat **niet** in `_site` en wordt dus nooit als los, publiek
  bestand geserveerd. Het gaat wel gewoon mee in de git-commit; de bescherming
  zit 'm niet in geheimhouding van het bestand, maar in hoe het wordt
  uitgeleverd.
- Elk verzoek naar `/app/psychodiagnostiek/…` wordt door `netlify.toml`
  doorgestuurd naar de functie
  `netlify/functions/psychodiag-app/psychodiag-app.mjs`. Doordat het
  app-bestand in dezelfde map staat, bundelt Netlify het automatisch mee met
  die functie (het "één map per functie"-patroon); `included_files` in
  netlify.toml is daar nog een extra vangnet bovenop. De functie levert het
  bestand pas uit na een geslaagde login; zonder geldig sessiecookie krijgt
  iedereen alleen het inlogscherm.
- Een geslaagde login zet een ondertekend cookie (HttpOnly, Secure, 8 uur
  geldig, alleen voor het pad `/app/psychodiagnostiek`). Wordt het cookie
  aangepast of is het verlopen, dan verschijnt opnieuw het inlogscherm.
- Staan de onderstaande omgevingsvariabelen niet ingesteld, dan weigert de
  functie de app te tonen (nooit stilzwijgend openzetten): bij twijfel dicht.

Zet in Netlify → *Site configuration → Environment variables*:

| Variabele | Waarde |
|---|---|
| `PSYCHODIAG_PASSWORD` | het wachtwoord waarmee jij inlogt |
| `PSYCHODIAG_SECRET` | een willekeurige, lange tekenreeks (bijvoorbeeld een gegenereerd wachtwoord van 40+ tekens); dient alleen om het sessiecookie te ondertekenen, is zelf geen wachtwoord |

Zolang deze twee ontbreken toont de pagina een duidelijke "nog niet actief"
melding in plaats van de app, aan iedereen, ook aan jou.

### Wat dit niet doet

De MMPI-2-app zelf doet geen netwerkverzoeken en slaat niets op een server op
(alles blijft in de browser). De wachtwoordbeveiliging voorkomt dat willekeurige
sitebezoekers de app te zien krijgen of gebruiken; ze vervangt geen
apparaatbeveiliging. Gebruik voor cliëntgegevens dus geen gedeelde of publieke
computer, en log uit (of sluit het tabblad) op een apparaat dat anderen
gebruiken.

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
