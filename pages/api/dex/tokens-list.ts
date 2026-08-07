import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const filter = (req.query.filter as string) || 'trending';
  const chain = (req.query.chain as string) || '';

  try {
    let data: any[] = [];

    let topBoostsArr: any[] = [];
    let latestBoostsArr: any[] = [];

    // Globally fetch top boosts right away so they map everywhere
    try {
      const brTop = await fetch(
        'https://api.dexscreener.com/token-boosts/top/v1',
        { headers: { Accept: 'application/json' } },
      );
      if (brTop.ok) {
        topBoostsArr = await brTop.json();
        if (!Array.isArray(topBoostsArr)) topBoostsArr = [];
      }
    } catch (e) {}

    try {
      const brLatest = await fetch(
        'https://api.dexscreener.com/token-boosts/latest/v1',
        { headers: { Accept: 'application/json' } },
      );
      if (brLatest.ok) {
        latestBoostsArr = await brLatest.json();
        if (!Array.isArray(latestBoostsArr)) latestBoostsArr = [];
      }
    } catch (e) {}

    if (filter === 'new') {
      const r = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=new`,
        { headers: { Accept: 'application/json' } },
      );
      const j = await r.json();
      data = (j.pairs || []).sort(
        (a: any, b: any) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0),
      );
    } else if (filter === 'gainers') {
      const r = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=sol`,
        { headers: { Accept: 'application/json' } },
      );
      const j = await r.json();
      data = (j.pairs || []).sort(
        (a: any, b: any) =>
          (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0),
      );
    } else if (filter === 'losers') {
      const r = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=sol`,
        { headers: { Accept: 'application/json' } },
      );
      const j = await r.json();
      data = (j.pairs || []).sort(
        (a: any, b: any) =>
          (a.priceChange?.h24 || 0) - (b.priceChange?.h24 || 0),
      );
    } else if (filter === 'boosted') {
      const boostedMap = new Map<string, any>();

      if (Array.isArray(topBoostsArr)) {
        for (const b of topBoostsArr) {
          boostedMap.set(b.tokenAddress.toLowerCase(), b);
        }
      }
      if (Array.isArray(latestBoostsArr)) {
        for (const b of latestBoostsArr) {
          const existing = boostedMap.get(b.tokenAddress.toLowerCase());
          if (!existing || (b.totalAmount || 0) > (existing.totalAmount || 0)) {
            boostedMap.set(b.tokenAddress.toLowerCase(), b);
          }
        }
      }

      const allBoosted = Array.from(boostedMap.values())
        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
        .slice(0, 50);
      const pairs: any[] = [];
      const fetchBoostedPair = async (t: any) => {
        try {
          const pr = await fetch(
            `https://api.dexscreener.com/latest/dex/search?q=${t.tokenAddress}`,
            { headers: { Accept: 'application/json' } },
          );
          const pj = await pr.json();
          let pair =
            pj.pairs?.find((p: any) => p.chainId === t.chainId) ||
            pj.pairs?.[0];
          if (
            pair &&
            !pairs.some((existing) => existing.pairAddress === pair.pairAddress)
          ) {
            pairs.push(pair);
          }
        } catch {}
      };

      const batchSize = 10;
      for (let i = 0; i < allBoosted.length; i += batchSize) {
        const batch = allBoosted.slice(i, i + batchSize);
        await Promise.all(batch.map(fetchBoostedPair));
      }

      // Since fetching resolves asynchronously, sort again to ensure pairs stay in totalAmount order
      data = pairs.sort((a, b) => {
        const aBoost =
          boostedMap.get(a.baseToken?.address?.toLowerCase())?.totalAmount || 0;
        const bBoost =
          boostedMap.get(b.baseToken?.address?.toLowerCase())?.totalAmount || 0;
        return bBoost - aBoost;
      });
    } else {
      // Massive Discovery (Trending & Top)
      // DexScreener's default frontpage heavily features top boosted tokens and latest profiles

      const seedAddresses = new Set<string>();

      if (Array.isArray(topBoostsArr)) {
        for (const item of topBoostsArr) {
          if (item.tokenAddress) seedAddresses.add(item.tokenAddress);
        }
      }
      if (Array.isArray(latestBoostsArr)) {
        for (const item of latestBoostsArr) {
          if (item.tokenAddress) seedAddresses.add(item.tokenAddress);
        }
      }

      try {
        const prLatest = await fetch(
          'https://api.dexscreener.com/token-profiles/latest/v1',
          { headers: { Accept: 'application/json' } },
        ).catch(() => null);
        if (prLatest && prLatest.ok) {
          const prArr = await prLatest.json();
          if (Array.isArray(prArr)) {
            for (const item of prArr) {
              if (item.tokenAddress) seedAddresses.add(item.tokenAddress);
            }
          }
        }
      } catch (e) {}

      // Top off with some broad chains if we don't have many
      const queries = chain ? [chain] : ['sol', 'eth', 'base', 'bsc'];
      const results = await Promise.all(
        queries.map((q) =>
          fetch(`https://api.dexscreener.com/latest/dex/search?q=${q}`, {
            headers: { Accept: 'application/json' },
          })
            .then((r) => r.json())
            .then((j) => j.pairs || [])
            .catch(() => []),
        ),
      );

      const seen = new Set<string>();

      const seedArr = Array.from(seedAddresses);

      // Fetch individually since comma-separated addresses are rejected if too long
      // Limiting concurrent requests to avoid 429
      const fetchPair = async (address: string) => {
        try {
          const r = await fetch(
            `https://api.dexscreener.com/latest/dex/search?q=${address}`,
            { headers: { Accept: 'application/json' } },
          );
          const j = await r.json();
          const pair =
            j.pairs?.find((p: any) => p.chainId === chain || !chain) ||
            j.pairs?.[0];
          if (pair && !seen.has(pair.pairAddress)) {
            seen.add(pair.pairAddress);
            data.push(pair);
          }
        } catch {}
      };

      const batchSize = 10;
      for (let i = 0; i < seedArr.length; i += batchSize) {
        const batch = seedArr.slice(i, i + batchSize);
        await Promise.all(batch.map(fetchPair));
      }

      for (const arr of results) {
        for (const p of arr) {
          if (!seen.has(p.pairAddress) && (!chain || p.chainId === chain)) {
            seen.add(p.pairAddress);
            data.push(p);
          }
        }
      }
      if (filter === 'top') {
        data.sort(
          (a, b) => (b.marketCap || b.fdv || 0) - (a.marketCap || a.fdv || 0),
        );
      } else {
        // Trending default: DexScreener uses a proprietary mix. We sort by volume for safety,
        // but boosted tokens usually naturally float up or are handled by the UI.

        // Let's resolve boosts out of the seed array and map to sort by boosts first!
        const bMap: Record<string, number> = {};
        if (Array.isArray(topBoostsArr)) {
          for (const b of topBoostsArr) {
            if (b && b.tokenAddress) {
              bMap[b.tokenAddress.toLowerCase()] = b.totalAmount || 0;
            }
          }
        }
        if (Array.isArray(latestBoostsArr)) {
          for (const b of latestBoostsArr) {
            if (b && b.tokenAddress) {
              bMap[b.tokenAddress.toLowerCase()] = Math.max(
                bMap[b.tokenAddress.toLowerCase()] || 0,
                b.totalAmount || 0,
              );
            }
          }
        }



        data.sort((a, b) => {
          const aBoost = bMap[a.baseToken?.address?.toLowerCase()] || 0;
          const bBoost = bMap[b.baseToken?.address?.toLowerCase()] || 0;
          if (aBoost !== bBoost) return bBoost - aBoost;
          return (b.volume?.h24 || 0) - (a.volume?.h24 || 0);
        });


      }
    }

    // We need to fetch profiles for missing images using the token-profiles API
    const finalData = data.slice(0, 400);

    // 1. Fetch Latest Profiles (covers recently updated tokens)
    let profilesMap: Record<string, any> = {};
    try {
      const pr = await fetch(
        'https://api.dexscreener.com/token-profiles/latest/v1',
        { headers: { Accept: 'application/json' } },
      );
      const profiles = await pr.json();
      if (Array.isArray(profiles)) {
        for (const p of profiles) {
          profilesMap[p.tokenAddress.toLowerCase()] = p;
        }
      }
    } catch (e) {}

    // 2. Fetch Latest Boosts for all tokens
    let boostsMap: Record<string, number> = {};
    for (const b of topBoostsArr) {
      if (b && b.tokenAddress)
        boostsMap[b.tokenAddress.toLowerCase()] = b.totalAmount || 0;
    }
    for (const b of latestBoostsArr) {
      if (b && b.tokenAddress)
        boostsMap[b.tokenAddress.toLowerCase()] = Math.max(
          boostsMap[b.tokenAddress.toLowerCase()] || 0,
          b.totalAmount || 0,
        );
    }

    // Normalize to exact structure needed by tokens.tsx
    const normalized = finalData.map((p: any) => {
      const addr = p.baseToken?.address?.toLowerCase() || '';
      // Fallback: If no imageUrl, try profiles map, otherwise we use a generic placeholder icon logic in UI or a public avatar service
      let imageUrl = p.info?.imageUrl || profilesMap[addr]?.icon || null;

      // If we still don't have an image, we can try to use mobula or trustwallet asset repo as a dynamic fallback,
      // but for DEX screener parity, they often just show an initial when missing. However, to make it "more beautiful" as requested:
      if (!imageUrl && p.chainId === 'solana') {
        // Solana tokens often miss images in basic search
      }

      return {
        pairAddress: p.pairAddress,
        chainId: p.chainId,
        dexId: p.dexId,
        baseToken: {
          symbol: p.baseToken?.symbol,
          name: p.baseToken?.name,
          address: p.baseToken?.address,
        },
        quoteToken: { symbol: p.quoteToken?.symbol },
        priceUsd: p.priceUsd,
        priceNative: p.priceNative,
        priceChange: {
          m5: p.priceChange?.m5 || 0,
          h1: p.priceChange?.h1 || 0,
          h6: p.priceChange?.h6 || 0,
          h24: p.priceChange?.h24 || 0,
        },
        txns: {
          h24: { buys: p.txns?.h24?.buys || 0, sells: p.txns?.h24?.sells || 0 },
        },
        volume: { h24: p.volume?.h24 || 0 },
        liquidity: { usd: p.liquidity?.usd || 0 },
        fdv: p.fdv || 0,
        marketCap: p.marketCap || 0,
        pairCreatedAt: p.pairCreatedAt,
        url: p.url,
        info: { imageUrl },
        boosts: {
          active: p.boosts?.active || p.boostAmount || boostsMap[addr] || 0,
        },
      };
    });

    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=10');
    res.status(200).json({ success: true, data: normalized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
