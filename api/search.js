const { neon } = require("@neondatabase/serverless");

function normalizeSearchQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({
      error: "GET only"
    });
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.status(500).json({
      error: "DATABASE_URL is not configured."
    });
    return;
  }

  const query = normalizeSearchQuery(req.query?.q);

  if (!query || query.length < 2) {
    res.status(200).json({
      results: []
    });
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT
        id,
        make,
        model,
        year,
        generation,
        variant,
        engine,
        display_name,
        cache_key,
        similarity(search_text, ${query}) AS score
      FROM vehicles
      WHERE
        search_text % ${query}
        OR search_text ILIKE ${"%" + query + "%"}
      ORDER BY
        similarity(search_text, ${query}) DESC,
        year DESC NULLS LAST
      LIMIT 8
    `;

    res.status(200).json({
      results: rows.map(row => ({
        id: row.id,
        make: row.make,
        model: row.model,
        year: row.year,
        generation: row.generation,
        variant: row.variant,
        engine: row.engine,
        displayName: row.display_name,
        cacheKey: row.cache_key,
        score: Number(row.score || 0)
      }))
    });
  } catch (err) {
    console.error("SEARCH_ERROR", err);

    res.status(500).json({
      error: "Vehicle search failed."
    });
  }
};
