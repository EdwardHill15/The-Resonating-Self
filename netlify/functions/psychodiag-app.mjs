/* Beveiligde toegang tot de MMPI-2 Casusanalyse-app (Psychodiagnostiek).

   Het bestand netlify/protected/psychodiagnostiek.html staat NIET in _site en
   wordt dus nooit als los, publiek bestand door Netlify geserveerd. Deze
   functie is de enige manier om er bij te komen: ze bundelt het bestand via
   included_files (zie netlify.toml), en levert het pas uit nadat het juiste
   wachtwoord is ingevoerd. Een geslaagde login zet een ondertekend, verlopend
   cookie; zonder geldig cookie krijgt iedere bezoeker alleen het inlogscherm
   te zien: nooit de inhoud van de app, en dus nooit cliëntgegevens.

   De publieke pagina's psychodiagnostiek.qmd / en/psychodiagnostiek.qmd tonen
   deze app in een iframe op /app/psychodiagnostiek/; netlify.toml stuurt dat
   pad naar deze functie door.

   Omgevingsvariabelen (Netlify -> Site configuration -> Environment variables):
     PSYCHODIAG_PASSWORD   het wachtwoord voor de behandelaar
     PSYCHODIAG_SECRET     willekeurige lange tekenreeks, alleen voor het
                            ondertekenen van het sessiecookie (geen wachtwoord)

   Zonder deze twee variabelen weigert de functie de app te tonen; bij twijfel
   dicht, nooit open.                                                        */

import { readFileSync } from "node:fs";
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";

const COOKIE_NAME = "pd_session";
const COOKIE_PATH = "/app/psychodiagnostiek";
const SESSION_SECONDS = 8 * 60 * 60; // 8 uur

const PROTECTED_FILE = path.join(
  process.cwd(),
  "netlify/protected/psychodiagnostiek.html"
);

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(secret, payload) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function makeToken(secret) {
  const payload = b64url(JSON.stringify({ exp: Date.now() + SESSION_SECONDS * 1000 }));
  return `${payload}.${sign(secret, payload)}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  const expected = sign(secret, payload);
  const a = Buffer.from(sig || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

function readCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  const match = raw.split(/;\s*/).find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function htmlResponse(body, { status = 200, setCookie } = {}) {
  const headers = new Headers({
    "content-type": "text/html; charset=utf-8",
    "cache-control": "private, no-store",
    "x-robots-tag": "noindex, nofollow, noarchive"
  });
  if (setCookie) headers.append("set-cookie", setCookie);
  return new Response(body, { status, headers });
}

function loginPage({ error = false } = {}) {
  return `<!doctype html>
<html lang="nl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Psychodiagnostiek: inloggen</title>
<style>
  @font-face{font-family:"Oranienbaum";src:url("/assets/fonts/Oranienbaum-Regular.ttf") format("truetype");font-display:swap}
  @font-face{font-family:"Carlito";src:url("/assets/fonts/Carlito-Regular.ttf") format("truetype");font-display:swap}
  @font-face{font-family:"Carlito";src:url("/assets/fonts/Carlito-Bold.ttf") format("truetype");font-weight:700;font-display:swap}
  :root{--blue-700:#00549c;--blue-900:#00335c;--teal-500:#0099c8;--ink:#1c2a33;--muted:#5d7280;--border:#d9e3ea;--sky:#f1f7fb}
  *{box-sizing:border-box}
  body{
    margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:var(--sky);font-family:"Carlito",Calibri,Arial,sans-serif;color:var(--ink);padding:2rem 1rem;
  }
  .card{
    width:100%;max-width:26rem;background:#fff;border:1px solid var(--border);border-radius:14px;
    padding:2.1rem 2rem;box-shadow:0 8px 28px rgba(0,51,92,.08);
  }
  .eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--teal-500);margin:0 0 .6rem}
  h1{font-family:"Oranienbaum",Georgia,serif;font-weight:400;font-size:1.5rem;margin:0 0 .5rem;color:var(--blue-900)}
  p{color:var(--muted);font-size:.95rem;line-height:1.5;margin:0 0 1.4rem}
  label{display:block;font-size:.85rem;font-weight:700;margin:0 0 .4rem}
  input[type=password]{
    width:100%;padding:.65rem .8rem;border:1px solid var(--border);border-radius:10px;
    font-size:1rem;margin:0 0 1rem;font-family:inherit;
  }
  input[type=password]:focus{outline:2px solid var(--teal-500);outline-offset:1px}
  button{
    width:100%;padding:.7rem 1rem;border:0;border-radius:999px;background:var(--blue-700);
    color:#fff;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;
  }
  button:hover{background:var(--blue-900)}
  .err{
    background:#fdecec;border:1px solid #f3b9b9;color:#8a1f1f;border-radius:8px;
    padding:.6rem .8rem;font-size:.88rem;margin:0 0 1rem;
  }
  .note{margin-top:1.3rem;font-size:.78rem;color:var(--muted);line-height:1.5}
</style>
</head><body>
  <div class="card">
    <div class="eyebrow">Psychodiagnostiek · afgeschermd</div>
    <h1>Alleen voor de behandelaar</h1>
    <p>Deze omgeving bevat cliëntgegevens en is niet openbaar. Voer het wachtwoord in om verder te gaan.</p>
    ${error ? '<div class="err">Dat wachtwoord klopt niet. Probeer het opnieuw.</div>' : ""}
    <form method="post">
      <label for="pw">Wachtwoord</label>
      <input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
      <button type="submit">Inloggen</button>
    </form>
    <p class="note">De sessie blijft 8 uur geldig op dit apparaat. Gebruik geen gedeelde of publieke computer voor cliëntgegevens.</p>
  </div>
</body></html>`;
}

function notConfiguredPage() {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8">
<meta name="robots" content="noindex, nofollow"><title>Psychodiagnostiek</title>
<style>body{font-family:Calibri,Arial,sans-serif;color:#1c2a33;max-width:34rem;margin:4rem auto;padding:0 1.5rem;line-height:1.6}</style>
</head><body>
<h1>Psychodiagnostiek is nog niet actief</h1>
<p>PSYCHODIAG_PASSWORD en/of PSYCHODIAG_SECRET staan nog niet ingesteld in de
Netlify-omgevingsvariabelen. Zolang dat zo is, blijft deze omgeving voor
iedereen ontoegankelijk, ook voor de behandelaar. Zie README.md, sectie
"Psychodiagnostiek (afgeschermd)".</p>
</body></html>`;
}

export default async (req) => {
  const password = process.env.PSYCHODIAG_PASSWORD;
  const secret = process.env.PSYCHODIAG_SECRET;

  if (!password || !secret) {
    return htmlResponse(notConfiguredPage(), { status: 503 });
  }

  if (req.method === "POST") {
    let entered = "";
    try {
      const form = await req.formData();
      entered = String(form.get("password") || "");
    } catch {
      return htmlResponse(loginPage({ error: true }), { status: 400 });
    }

    const a = Buffer.from(entered);
    const b = Buffer.from(password);
    const ok = a.length === b.length && timingSafeEqual(a, b);

    if (!ok) return htmlResponse(loginPage({ error: true }), { status: 401 });

    const token = makeToken(secret);
    const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=${COOKIE_PATH}; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
    const app = readFileSync(PROTECTED_FILE, "utf8");
    return htmlResponse(app, { setCookie: cookie });
  }

  const cookieToken = readCookie(req, COOKIE_NAME);
  if (verifyToken(cookieToken, secret)) {
    const app = readFileSync(PROTECTED_FILE, "utf8");
    return htmlResponse(app);
  }

  return htmlResponse(loginPage());
};
