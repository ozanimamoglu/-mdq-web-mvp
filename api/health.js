module.exports = async function handler(req, res) {
  const relevantKeys = Object.keys(process.env)
    .filter((k) => k.includes("OPENAI") || k.includes("TEST"))
    .sort();

  res.status(200).json({
    ok: true,
    openaiKeyPresent: !!process.env.OPENAI_API_KEY,
    testVarPresent: !!process.env.TEST_VAR,
    testVarMatchesExpected: process.env.TEST_VAR === "hello123",
    relevantEnvKeys: relevantKeys,
    vercelEnv: process.env.VERCEL_ENV || null,
    nodeEnv: process.env.NODE_ENV || null,
    runtime: "node",
    timestamp: new Date().toISOString()
  });
};
