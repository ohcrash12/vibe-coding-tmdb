module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "TMDB_API_KEY is not configured" });
  }

  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 500);
  const params = new URLSearchParams({
    api_key: apiKey,
    language: "ko-KR",
    region: "KR",
    page: String(page),
  });

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?${params}`
    );
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch now playing movies",
      });
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ error: "Upstream request failed" });
  }
};
