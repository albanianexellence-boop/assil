import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const symbol = (req.query.symbol as string) || 'ETHUSDT';

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=20`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) throw new Error(`Binance API error: ${response.status}`);

    const data = await response.json();

    const trades = data.map((t: any) => {
      const d = new Date(t.time);
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        price: parseFloat(t.price).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        size: parseFloat(t.qty).toFixed(4),
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
        buy: !t.isBuyerMaker,
      };
    });

    res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=1');
    res.status(200).json({ success: true, data: trades });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
