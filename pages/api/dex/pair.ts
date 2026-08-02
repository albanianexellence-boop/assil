import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { chainId, pairAddress } = req.query as Record<string, string>;
  if (!chainId || !pairAddress)
    return res.status(400).json({ success: false, error: 'Missing params' });

  try {
    let pair = null;

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      Accept: 'application/json',
    };

    // Attempt 1: Fetch by chainId and pairAddress (Assuming pairAddress is truly a Pair)
    let apiRes = await fetch(
      `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddress}`,
      { headers }
    );
    let text = await apiRes.text();

    try {
      const json = JSON.parse(text);
      pair = json.pair || json.pairs?.[0] || null;
    } catch (e) {
      console.warn('Attempt 1 failed to parse. Assuming token address or rate limit.');
    }

    // Attempt 2: Tokens endpoint (Dexscreener specific for token addresses)
    if (!pair) {
      try {
        apiRes = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${pairAddress}`,
          { headers }
        );
        text = await apiRes.text();
        const json = JSON.parse(text);
        pair =
          (json.pairs || []).find((p: any) => p.chainId === chainId) ||
          json.pairs?.[0] ||
          null;
      } catch (e) {
        console.warn('Attempt 2 failed to parse.', text.substring(0, 50));
      }
    }

    // Attempt 3: Fallback to token search if it failed
    if (!pair) {
      try {
        apiRes = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${pairAddress}`,
          { headers }
        );
        text = await apiRes.text();
        const json = JSON.parse(text);
        // Filter to make sure we find the exact desired chain
        pair =
          (json.pairs || []).find(
            (p: any) =>
              p.chainId === chainId &&
              (p.pairAddress.toLowerCase() === pairAddress.toLowerCase() ||
                p.baseToken?.address.toLowerCase() ===
                  pairAddress.toLowerCase()),
          ) ||
          json.pairs?.[0] ||
          null;
      } catch (e) {
        console.warn('Attempt 3 failed to parse.', text.substring(0, 50));
      }
    }

    if (!pair) {
      return res
        .status(404)
        .json({ success: false, error: 'Pair not found or API rate limited' });
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ success: true, data: pair });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
