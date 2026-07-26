// Cloudflare Pages Function — creates a Razorpay order.
// Route: POST /api/create-order
// Env vars (Cloudflare dashboard): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
export async function onRequestPost(context) {
  const { request, env } = context;

  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    // Signals the frontend to fall back to demo mode.
    return new Response("Razorpay keys not configured", { status: 501 });
  }

  try {
    const { amount, course, name, email, phone } = await request.json();

    const rupees = parseInt(amount, 10);
    if (!rupees || rupees < 1) {
      return new Response("Invalid amount", { status: 400 });
    }

    const auth = btoa(`${keyId}:${keySecret}`);

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: rupees * 100, // paise
        currency: "INR",
        receipt: "vf_" + Date.now(),
        notes: { course: course || "", name: name || "", email: email || "", phone: phone || "" },
      }),
    });

    if (!rzpRes.ok) {
      console.error("Razorpay order error:", rzpRes.status, await rzpRes.text());
      return new Response("Could not create order", { status: 502 });
    }

    const order = await rzpRes.json();

    return new Response(
      JSON.stringify({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId, // public key id is safe to expose to the client
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-order error:", err);
    return new Response("Could not create order", { status: 500 });
  }
}
