// Cloudflare Pages Function — verifies the Razorpay payment signature.
// Route: POST /api/verify-payment
// Env var (Cloudflare dashboard): RAZORPAY_KEY_SECRET
export async function onRequestPost(context) {
  const { request, env } = context;

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

    // Constant-time comparison
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

    // Payment verified. (Optional: record enrollment / email a receipt here.)
    return new Response(
      JSON.stringify({ status: "verified", paymentId: razorpay_payment_id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response("Verification failed", { status: 500 });
  }
}
