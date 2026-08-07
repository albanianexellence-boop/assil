import { NextApiRequest, NextApiResponse } from 'next';

const SYMBOLS = [
  'ETHUSDT',
  'BTCUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'ARBUSDT',
  'OPUSDT',
  'MATICUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'UNIUSDT',
  'DOTUSDT',
  'ADAUSDT',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const symbolsParam = SYMBOLS.map((s) => `"${s}"`).join(',');
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${encodeURIComponent(SYMBOLS.map((s) => `"${s}"`).join(','))}]`;

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(SYMBOLS))}`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize
    const prices = data.map((item: any) => ({
      symbol: item.symbol.replace('USDT', '/USDT'),
      price: parseFloat(item.lastPrice),
      change: parseFloat(item.priceChangePercent),
      volume: parseFloat(item.quoteVolume),
      high: parseFloat(item.highPrice),
      low: parseFloat(item.lowPrice),
    }));

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=5');
    res.status(200).json({ success: true, data: prices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
