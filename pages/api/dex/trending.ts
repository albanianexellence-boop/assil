import { NextApiRequest, NextApiResponse } from 'next';

// DEXScreener trending/boosted tokens
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Get top boosted tokens (the "trending" display)
    const [boostedRes, profilesRes] = await Promise.all([
      fetch('https://api.dexscreener.com/token-boosts/top/v1', {
        headers: { Accept: 'application/json' },
      }),
      fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
        headers: { Accept: 'application/json' },
      }),
    ]);

    const boosted = boostedRes.ok ? await boostedRes.json() : [];
    const profiles = profilesRes.ok ? await profilesRes.json() : [];

    // For each boosted token, get pair data
    const topAddresses = (Array.isArray(boosted) ? boosted : [])
      .slice(0, 20)
      .map((t: any) => ({ chainId: t.chainId, address: t.tokenAddress }));

    // fetch pair data for a sample
    const pairsData: any[] = [];
    const chunks = topAddresses.slice(0, 10);
    for (const token of chunks) {
      try {
        const r = await fetch(
          `https://api.dexscreener.com/token-pairs/v1/${token.chainId}/${token.address}`,
          { headers: { Accept: 'application/json' } },
        );
        if (r.ok) {
          const d = await r.json();
          const pairs = Array.isArray(d) ? d : d.pairs || [];
          if (pairs[0]) pairsData.push(pairs[0]);
        }
      } catch {}
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
    res.status(200).json({
      success: true,
      data: pairsData,
      profiles: profiles.slice?.(0, 20) || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
