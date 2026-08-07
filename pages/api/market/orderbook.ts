import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const symbol = (req.query.symbol as string) || 'ETHUSDT';

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=8`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) throw new Error(`Binance API error: ${response.status}`);

    const data = await response.json();

    const format = (entries: string[][]) =>
      entries.map(([price, size]) => {
        const p = parseFloat(price);
        const s = parseFloat(size);
        return {
          price: p.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          size: s.toFixed(4),
          total: (p * s).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        };
      });

    res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=1');
    res.status(200).json({
      success: true,
      data: {
        asks: format(data.asks.slice(0, 5)),
        bids: format(data.bids.slice(0, 5)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
