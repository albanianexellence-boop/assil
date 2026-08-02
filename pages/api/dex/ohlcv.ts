import { NextApiRequest, NextApiResponse } from 'next';
import { getOhlcv } from '../../../src/lib/data-providers';

// Simple in-memory cache for OHLCV data
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 30 * 1000; // 30 seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    chainId,
    pairAddress,
    resolution = '15',
  } = req.query as Record<string, string>;

  if (!chainId || !pairAddress) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing chainId or pairAddress' });
  }

  const cacheKey = `${chainId}-${pairAddress}-${resolution}`;
  const cached = cache[cacheKey];

  // 1. Check fresh cache
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res
      .status(200)
      .json({ success: true, data: cached.data, provider: 'Cache' });
  }

  try {
    // 2. Try fetching with fallback logic from library
    const result = await getOhlcv(chainId, pairAddress, resolution);

    if (result.success && result.data.length > 0) {
      // Update cache
      cache[cacheKey] = { data: result.data, timestamp: Date.now() };
      res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=10');
      return res.status(200).json(result);
    }

    // 3. If all fails but we have stale cache, return it
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached.data,
        error: 'All providers failed, showing stale cache',
        provider: 'StaleCache',
      });
    }

    res.status(200).json({
      success: false,
      data: [],
      error: result.error || 'No data available',
    });
  } catch (err: any) {
    console.error('OHLCV Route Error:', err);
    if (cached)
      return res.status(200).json({
        success: true,
        data: cached.data,
        error: 'Critical error, showing stale cache',
      });
    res.status(200).json({ success: false, data: [], error: err.message });
  }
}
