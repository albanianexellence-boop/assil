import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const symbol = (req.query.symbol as string) || 'ETHUSDT';
  const interval = (req.query.interval as string) || '1h';
  const limit = (req.query.limit as string) || '30';

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) throw new Error(`Binance API error: ${response.status}`);

    const data = await response.json();

    const candles = data.map((k: any[]) => ({
      openTime: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6],
    }));

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=10');
    res.status(200).json({ success: true, data: candles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
