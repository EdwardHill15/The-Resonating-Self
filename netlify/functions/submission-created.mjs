/* Wordt door Netlify automatisch aangeroepen zodra iemand een formulier op de
   site verstuurt (event: submission-created). Mailt de inhoud van de inzending
   naar total-health@kpnmail.nl via Resend.

   Ontbreekt RESEND_API_KEY of MAIL_FROM, dan doet de functie niets en breekt er
   niets: de inzending staat altijd in het Netlify-dashboard onder Forms.

   Omgevingsvariabelen (Netlify -> Site configuration -> Environment variables):
     RESEND_API_KEY   van resend.com
     MAIL_FROM        verifieerd afzenderadres, bv. site@jouwdomein.nl
     MAIL_TO          standaard total-health@kpnmail.nl                        */

const MAIL_TO = process.env.MAIL_TO || "total-health@kpnmail.nl";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async (req) => {
  let payload = {};
  try {
    const body = await req.json();
    payload = body.payload || body || {};
  } catch {
    return new Response("bad payload", { status: 400 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    console.log("submission-created: RESEND_API_KEY of MAIL_FROM ontbreekt — overgeslagen");
    return new Response("skipped", { status: 200 });
  }

  const data = payload.data || {};
  const form = payload.form_name || data["form-name"] || "contact";
  const naam = data.naam || data.name || "onbekend";
  const mail = data.email || "";
  const onderwerp = data.onderwerp || data.subject || "geen onderwerp";
  const bericht = data.bericht || data.message || "";
  const taal = form.endsWith("-en") ? "EN" : "NL";

  const rows = Object.entries(data)
    .filter(([k]) => k !== "form-name")
    .map(([k, v]) => `<tr>
        <td style="padding:6px 14px 6px 0;color:#5d7280;vertical-align:top;white-space:nowrap">${esc(k)}</td>
        <td style="padding:6px 0;color:#1c2a33">${esc(v).replace(/\n/g, "<br>")}</td>
      </tr>`)
    .join("");

  const html = `<div style="font-family:Carlito,Calibri,Arial,sans-serif;color:#1c2a33;max-width:620px">
    <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#007fa8;margin:0 0 6px">
      The Resonating Self · formulier ${esc(form)} (${taal})
    </p>
    <h2 style="font-family:Georgia,serif;font-weight:400;font-size:22px;margin:0 0 18px;color:#00335c">
      Nieuw bericht van ${esc(naam)}
    </h2>
    <table style="border-collapse:collapse;font-size:15px;line-height:1.55">${rows}</table>
    <p style="margin:22px 0 0;font-size:13px;color:#5d7280">
      Inzending ook te vinden in het Netlify-dashboard onder Forms.
    </p>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [MAIL_TO],
        reply_to: /.+@.+\..+/.test(mail) ? mail : undefined,
        subject: `[${taal}] ${onderwerp} — ${naam}`,
        html,
        text: `${naam} <${mail}>\nOnderwerp: ${onderwerp}\n\n${bericht}`
      })
    });
    if (!res.ok) console.error("Resend:", res.status, await res.text());
    else console.log("submission-created:", form, "e-mail verstuurd naar", MAIL_TO);
    return new Response(res.ok ? "sent" : "failed", { status: 200 });
  } catch (e) {
    console.error("Resend:", e);
    return new Response("failed", { status: 200 });
  }
};
