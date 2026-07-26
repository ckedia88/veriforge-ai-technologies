const crypto = require("crypto");

// Verifies the Razorpay payment signature server-side.
// Requires env var: RAZORPAY_KEY_SECRET
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return { statusCode: 501, body: "Razorpay keys not configured" };
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      JSON.parse(event.body || "{}");

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { statusCode: 400, body: "Missing payment fields" };
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const valid =
      expected.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

    if (!valid) {
      return { statusCode: 400, body: "Invalid signature" };
    }

    // Payment verified. (Optional: record enrollment / email a receipt here.)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "verified", paymentId: razorpay_payment_id }),
    };
  } catch (err) {
    console.error("verify-payment error:", err);
    return { statusCode: 500, body: "Verification failed" };
  }
};
