/* Mollie roept dit adres aan zodra de status van een betaling verandert.
   Bij een geslaagde betaling gaat er een e-mail naar de praktijk met de
   afspraakgegevens uit de metadata van de betaling.

   Belangrijk: vertrouw nooit de POST-inhoud, maar vraag de status altijd op
   bij Mollie met het meegestuurde id. Dat doet deze functie.                */

const MAIL_TO = process.env.MAIL_TO || "totalegezondheidbv@gmail.com";

export default async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  if (!process.env.MOLLIE_API_KEY) return new Response("ok", { status: 200 });

  let id = "";
  try {
    const form = await req.formData();
    id = String(form.get("id") || "");
  } catch {
    try { id = (await req.json()).id || ""; } catch {}
  }
  if (!id) return new Response("ok", { status: 200 });

  try {
    const res = await fetch(`https://api.mollie.com/v2/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` }
    });
    const p = await res.json();
    console.log("payment", id, p.status);

    if (p.status !== "paid") return new Response("ok", { status: 200 });

    if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
      const m = p.metadata || {};
      const rows = [
        ["Type", m.type], ["Naam", m.name], ["E-mail", m.email], ["Telefoon", m.phone],
        ["Datum", m.day], ["Tijd", m.slot], ["Vorm", m.mode], ["Bedrag", p.amount && p.amount.value + " " + p.amount.currency],
        ["Toelichting", m.note]
      ].filter(([, v]) => v).map(([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5d7280;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 0;color:#1c2a33">${String(v).replace(/[<>&]/g, "")}</td></tr>`
      ).join("");

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM,
          to: [MAIL_TO],
          subject: `Betaalde afspraak — ${m.name || "onbekend"} (${m.day || ""} ${m.slot || ""})`,
          html: `<div style="font-family:Carlito,Calibri,Arial,sans-serif;color:#1c2a33;max-width:620px">
            <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#007fa8;margin:0 0 6px">Betaling ontvangen</p>
            <h2 style="font-family:Georgia,serif;font-weight:400;font-size:22px;margin:0 0 18px;color:#00335c">Nieuwe afspraak, betaald</h2>
            <table style="border-collapse:collapse;font-size:15px;line-height:1.55">${rows}</table>
            <p style="margin:22px 0 0;font-size:13px;color:#5d7280">Mollie-betaling ${id}. Zet de afspraak in je agenda en stuur de cliënt de gesprekslink.</p>
          </div>`
        })
      });
    }
  } catch (e) {
    console.error("webhook:", e);
  }
  return new Response("ok", { status: 200 });
};
