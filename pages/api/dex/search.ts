import { NextApiRequest, NextApiResponse } from 'next';

// DEXScreener public search API – no key required
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const q = (req.query.q as string) || 'ETH';

  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) throw new Error(`DEXScreener error: ${response.status}`);
    const data = await response.json();

    const pairs = (data.pairs || []).slice(0, 50).map((p: any) => ({
      pairAddress: p.pairAddress,
      baseToken: {
        symbol: p.baseToken?.symbol,
        name: p.baseToken?.name,
        address: p.baseToken?.address,
      },
      quoteToken: { symbol: p.quoteToken?.symbol },
      chainId: p.chainId,
      dexId: p.dexId,
      priceUsd: p.priceUsd,
      priceNative: p.priceNative,
      priceChange: p.priceChange,
      txns: p.txns,
      volume: p.volume,
      liquidity: p.liquidity,
      fdv: p.fdv,
      marketCap: p.marketCap,
      pairCreatedAt: p.pairCreatedAt,
      url: p.url,
      info: { imageUrl: p.info?.imageUrl },
    }));

    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=3');
    res.status(200).json({ success: true, data: pairs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
