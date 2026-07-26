// TEMPORARY diagnostic endpoint — reports only whether Razorpay env vars are
// present and their NAMES. It never returns any secret values. Safe to expose
// briefly for debugging; delete after the payment config is confirmed working.
exports.handler = async () => {
  const razNames = Object.keys(process.env)
    .filter((k) => k.toUpperCase().includes("RAZOR"))
    .sort();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hasKeyId: Boolean(process.env.RAZORPAY_KEY_ID),
      hasKeySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
      keyIdPrefix: (process.env.RAZORPAY_KEY_ID || "").slice(0, 8), // e.g. "rzp_test"
      razorpayVarNames: razNames, // names only, no values
      nodeVersion: process.version,
    }),
  };
};
