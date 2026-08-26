module.exports = async function handler(req, res) {
  const relevantKeys = Object.keys(process.env)
    .filter(
      (k) =>
        k.includes("OPENAI") ||
        k.includes("TEST") ||
        k.includes("DATABASE") ||
        k.includes("POSTGRES") ||
        k.includes("PGHOST")
    )
    .sort();

  res.status(200).json({
    ok: true,

    openaiKeyPresent:
      !!process.env.OPENAI_API_KEY,

    databaseUrlPresent:
      !!process.env.DATABASE_URL,

    databaseUrlUnpooledPresent:
      !!process.env.DATABASE_URL_UNPOOLED,

    postgresUrlPresent:
      !!process.env.POSTGRES_URL,

    postgresUrlNonPoolingPresent:
      !!process.env.POSTGRES_URL_NON_POOLING,

    pgHostPresent:
      !!process.env.PGHOST,

    testVarPresent:
      !!process.env.TEST_VAR,

    testVarMatchesExpected:
      process.env.TEST_VAR === "hello123",

    relevantEnvKeys:
      relevantKeys,

    vercelEnv:
      process.env.VERCEL_ENV || null,

    nodeEnv:
      process.env.NODE_ENV || null,

    runtime:
      "node",

    timestamp:
      new Date().toISOString()
  });
};
