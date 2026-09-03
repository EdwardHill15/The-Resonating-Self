/* Maakt een iDEAL-betaling aan bij Mollie en stuurt de bezoeker door naar zijn bank.

   iDEAL is één betaalmethode die alle Nederlandse banken afhandelt: ING,
   Rabobank, ABN AMRO, SNS, ASN, bunq, Knab, Regiobank, Revolut, Triodos en
   Van Lanschot. De bank wordt op de betaalpagina van Mollie gekozen; er zijn
   geen losse koppelingen per bank nodig.

   Aanroep vanuit de site (POST, JSON):
     { type: "intake" | "session", name, email, day, slot, mode, note }

   Antwoord: { checkoutUrl } — daar naartoe navigeren.

   Omgevingsvariabelen (Netlify -> Site configuration -> Environment variables):
     MOLLIE_API_KEY   live_... of test_... van mollie.com
     SITE_URL         https://the-resonating-self.netlify.app                  */

const PRICES = {
  intake:  { amount: "100.00", label: "Intakegesprek 60 minuten" },
  session: { amount: "100.00", label: "Vervolgsessie 60 minuten" }
};

export default async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }

  const price = PRICES[body.type];
  if (!price) return new Response(JSON.stringify({ error: "onbekend type" }), { status: 400 });

  if (!process.env.MOLLIE_API_KEY) {
    return new Response(JSON.stringify({ error: "MOLLIE_API_KEY ontbreekt" }), {
      status: 503, headers: { "Content-Type": "application/json" }
    });
  }

  const site = process.env.SITE_URL || "https://the-resonating-self.netlify.app";
  const when = [body.day, body.slot].filter(Boolean).join(" ");
  const description = [price.label, when, body.mode].filter(Boolean).join(" · ").slice(0, 255);

  try {
    const res = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: price.amount },
        description,
        redirectUrl: `${site}/betaling-gelukt`,
        cancelUrl: `${site}/afspraak`,
        webhookUrl: `${site}/.netlify/functions/payment-webhook`,
        method: "ideal",
        locale: "nl_NL",
        metadata: {
          type: body.type,
          name: String(body.name || "").slice(0, 120),
          email: String(body.email || "").slice(0, 160),
          phone: String(body.phone || "").slice(0, 40),
          day: body.day || "",
          slot: body.slot || "",
          mode: body.mode || "",
          note: String(body.note || "").slice(0, 500)
        }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Mollie:", res.status, JSON.stringify(data));
      return new Response(JSON.stringify({ error: data.detail || "betaling mislukt" }), {
        status: 502, headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      checkoutUrl: data._links.checkout.href,
      paymentId: data.id
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Mollie:", e);
    return new Response(JSON.stringify({ error: "betaling mislukt" }), {
      status: 502, headers: { "Content-Type": "application/json" }
    });
  }
};
