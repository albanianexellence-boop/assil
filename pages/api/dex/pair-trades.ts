import { NextApiRequest, NextApiResponse } from 'next';
import { getTrades } from '../../../src/lib/data-providers';

// Caching removed for 1s refresh requirement

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { chainId, pairAddress } = req.query as Record<string, string>;
  if (!chainId || !pairAddress)
    return res.status(400).json({ success: false, error: 'Missing params' });

  // 1. Caching disabled for real-time updates

  try {
    // 2. Try fetching with fallback logic from library
    const result = await getTrades(chainId, pairAddress);

    if (result.success && result.data.length > 0) {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.status(200).json(result);
    }

    // 3. No stale cache fallback (caching disabled)

    res.status(200).json({
      success: false,
      data: [],
      error: result.error || 'No data available',
    });
  } catch (err: any) {
    // Critical error fallback removed
    res.status(200).json({ success: false, data: [], error: err.message });
  }
}
