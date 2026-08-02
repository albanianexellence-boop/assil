import type { NextApiRequest, NextApiResponse } from 'next';

const cache = new Map<string, { ts: number; data: any }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { chainId, tokenAddress } = req.query as Record<string, string>;
  if (!chainId || !tokenAddress) {
    return res.status(400).json({ success: false, error: 'Missing params' });
  }

  const cacheKey = `${chainId}:${tokenAddress}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 3 * 60_000) {
    return res.status(200).json({ success: true, data: cached.data });
  }

  try {
    // Map chainId to DEX Screener chain slug
    const chainSlug: Record<string, string> = {
      solana: 'solana',
      ethereum: 'ethereum',
      eth: 'ethereum',
      bsc: 'bsc',
      polygon: 'polygon',
      arbitrum: 'arbitrum',
      avalanche: 'avalanche',
      base: 'base',
      optimism: 'optimism',
      fantom: 'fantom',
    };
    const chain = chainSlug[chainId.toLowerCase()] || chainId;

    // 1. Token profile
    const profileUrl = `https://api.dexscreener.com/token-profiles/latest/v1`;
    let profile = null;
    try {
      const pRes = await fetch(profileUrl, {
        signal: AbortSignal.timeout(5000),
      });
      const profiles: any[] = await pRes.json();
      profile =
        profiles.find(
          (p: any) =>
            p.chainId?.toLowerCase() === chain.toLowerCase() &&
            p.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase(),
        ) || null;
    } catch {
      /* ignore */
    }

    // 2. Boost data
    const boostUrl = `https://api.dexscreener.com/token-boosts/latest/v1`;
    let boostAmount = 0;
    try {
      const bRes = await fetch(boostUrl, { signal: AbortSignal.timeout(5000) });
      const boosts: any[] = await bRes.json();
      const boostEntry = boosts.find(
        (b: any) =>
          b.chainId?.toLowerCase() === chain.toLowerCase() &&
          b.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase(),
      );
      boostAmount = boostEntry?.totalAmount || boostEntry?.amount || 0;
    } catch {
      /* ignore */
    }

    const data = {
      profile,
      boostAmount,
    };

    cache.set(cacheKey, { ts: Date.now(), data });
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    return res
      .status(200)
      .json({ success: true, data: { profile: null, boostAmount: 0 } });
  }
}
