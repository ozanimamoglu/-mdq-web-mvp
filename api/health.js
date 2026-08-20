module.exports = async function handler(req, res) {
  const present = !!process.env.OPENAI_API_KEY;

  res.status(200).json({
    ok: true,
    openaiKeyPresent: present,
    vercelEnv: process.env.VERCEL_ENV || null,
    nodeEnv: process.env.NODE_ENV || null,
    runtime: "node",
    timestamp: new Date().toISOString()
  });
};
