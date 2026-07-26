// Cloudflare Worker entry point (Workers Static Assets model).
// Serves the static site via the ASSETS binding and handles the payment API
// at /api/*. Used when deploying via `npx wrangler deploy` (Workers Builds).
//
// Env vars (Cloudflare dashboard): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/create-order") {
      return createOrder(request, env);
    }
    if (request.method === "POST" && url.pathname === "/api/verify-payment") {
      return verifyPayment(request, env);
    }

    // Everything else → static assets (index.html, css, js, images, legal pages)
    return env.ASSETS.fetch(request);
  },
};

async function createOrder(request, env) {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
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
        amount: rupees * 100,
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
    return Response.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error("create-order error:", err);
    return new Response("Could not create order", { status: 500 });
  }
}

async function verifyPayment(request, env) {
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return new Response("Razorpay keys not configured", { status: 501 });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response("Missing payment fields", { status: 400 });
    }

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(keySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
    );
    const expected = [...new Uint8Array(sigBuf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expected.length !== razorpay_signature.length) {
      return new Response("Invalid signature", { status: 400 });
    }
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ razorpay_signature.charCodeAt(i);
    }
    if (diff !== 0) {
      return new Response("Invalid signature", { status: 400 });
    }

    return Response.json({ status: "verified", paymentId: razorpay_payment_id });
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response("Verification failed", { status: 500 });
  }
}
