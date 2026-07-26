// Creates a Razorpay order server-side by calling Razorpay's REST API directly
// with the built-in fetch (Node 18+ on Netlify). No npm dependencies required.
// Requires env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // Signals the frontend to fall back to demo mode.
    return { statusCode: 501, body: "Razorpay keys not configured" };
  }

  try {
    const { amount, course, name, email, phone } = JSON.parse(event.body || "{}");

    const rupees = parseInt(amount, 10);
    if (!rupees || rupees < 1) {
      return { statusCode: 400, body: "Invalid amount" };
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

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
      const detail = await rzpRes.text();
      console.error("Razorpay order error:", rzpRes.status, detail);
      return { statusCode: 502, body: "Could not create order" };
    }

    const order = await rzpRes.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId, // public key id is safe to expose to the client
      }),
    };
  } catch (err) {
    console.error("create-order error:", err);
    return { statusCode: 500, body: "Could not create order" };
  }
};
