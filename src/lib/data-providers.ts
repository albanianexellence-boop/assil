export interface OhlcvBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeData {
  type: 'Buy' | 'Sell';
  age: string;
  usd: number;
  tokenAmount: number;
  nativeAmount: number;
  priceUsd: number;
  maker: string;
  txHash: string;
}

export interface ProviderResult<T> {
  success: boolean;
  data: T;
  error?: string;
  provider: string;
}

// Chain Mappings
const NETWORK_MAP: Record<string, Record<string, string>> = {
  geckoterminal: {
    ethereum: 'eth',
    bsc: 'bsc',
    solana: 'solana',
    base: 'base',
    arbitrum: 'arbitrum',
    polygon: 'polygon_pos',
    avalanche: 'avax',
    optimism: 'optimism',
  },
  birdeye: {
    ethereum: 'ethereum',
    solana: 'solana',
    base: 'base',
    arbitrum: 'arbitrum',
  },
};

// --- GeckoTerminal Provider (Mirror 1: V2) ---
async function fetchGeckoTerminalV2(
  chainId: string,
  pairAddress: string,
  resolution: string,
): Promise<ProviderResult<OhlcvBar[]>> {
  const network = NETWORK_MAP.geckoterminal[chainId] || chainId;
  const resMap: Record<string, { timeframe: string; aggregate: number }> = {
    '1': { timeframe: 'minute', aggregate: 1 },
    '5': { timeframe: 'minute', aggregate: 5 },
    '15': { timeframe: 'minute', aggregate: 15 },
    '60': { timeframe: 'hour', aggregate: 1 },
    '240': { timeframe: 'hour', aggregate: 4 },
    D: { timeframe: 'day', aggregate: 1 },
  };
  const conf = resMap[resolution] || { timeframe: 'minute', aggregate: 15 };
  const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pairAddress}/ohlcv/${conf.timeframe}?aggregate=${conf.aggregate}&limit=300&currency=usd`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!res.ok)
      return {
        success: false,
        data: [],
        error: `GeckoV2 Status ${res.status}`,
        provider: 'GeckoV2',
      };

    const text = await res.text();
    if (!text.trim().startsWith('{'))
      return {
        success: false,
        data: [],
        error: 'GeckoV2 Non-JSON',
        provider: 'GeckoV2',
      };
    const json = JSON.parse(text);

    const raw = json.data?.attributes?.ohlcv_list || [];
    if (!raw.length)
      return {
        success: false,
        data: [],
        error: 'GeckoV2 Empty',
        provider: 'GeckoV2',
      };
    const bars = [...raw].reverse().map((c: any) => ({
      time: Math.floor(c[0]),
      open: parseFloat(String(c[1])),
      high: parseFloat(String(c[2])),
      low: parseFloat(String(c[3])),
      close: parseFloat(String(c[4])),
      volume: parseFloat(String(c[5])),
    }));
    return { success: true, data: bars, provider: 'GeckoV2' };
  } catch (e: any) {
    return { success: false, data: [], error: e.message, provider: 'GeckoV2' };
  }
}

// --- GeckoTerminal Provider (Mirror 2: Alternative Root) ---
async function fetchGeckoTerminalAlt(
  chainId: string,
  pairAddress: string,
  resolution: string,
): Promise<ProviderResult<OhlcvBar[]>> {
  const network = NETWORK_MAP.geckoterminal[chainId] || chainId;
  const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pairAddress}/ohlcv/minute?aggregate=15&limit=300&currency=usd`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PostmanRuntime/7.26.8' },
    });
    if (!res.ok)
      return {
        success: false,
        data: [],
        error: `GeckoAlt Error ${res.status}`,
        provider: 'GeckoAlt',
      };
    const text = await res.text();
    if (!text.trim().startsWith('{'))
      return {
        success: false,
        data: [],
        error: 'GeckoAlt Non-JSON',
        provider: 'GeckoAlt',
      };
    const json = JSON.parse(text);
    const raw = json.data?.attributes?.ohlcv_list || [];
    const bars = [...raw].reverse().map((c: any) => ({
      time: Math.floor(c[0]),
      open: parseFloat(String(c[1])),
      high: parseFloat(String(c[2])),
      low: parseFloat(String(c[3])),
      close: parseFloat(String(c[4])),
      volume: parseFloat(String(c[5])),
    }));
    return { success: true, data: bars, provider: 'GeckoAlt' };
  } catch (e: any) {
    return { success: false, data: [], error: e.message, provider: 'GeckoAlt' };
  }
}

// --- Moralis Provider ---
async function fetchMoralisOhlcv(
  chainId: string,
  pairAddress: string,
  resolution: string,
): Promise<ProviderResult<OhlcvBar[]>> {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey)
    return {
      success: false,
      data: [],
      provider: 'Moralis',
      error: 'No API Key',
    };

  // Map chainId to Moralis chain hex or name (simple mapping for now)
  const chainMap: Record<string, string> = {
    solana: 'solana',
    ethereum: 'eth',
    bsc: 'bsc',
    base: 'base',
  };
  const chain = chainMap[chainId] || chainId;
  const url = `https://deep-api.moralis.io/api/v2.1/token/${chain}/${pairAddress}/ohlcv?timeframe=1h&currency=usd&limit=100`;

  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
    });
    if (!res.ok)
      return {
        success: false,
        data: [],
        error: `Moralis Status ${res.status}`,
        provider: 'Moralis',
      };
    const text = await res.text();
    if (!text.trim().startsWith('{'))
      return {
        success: false,
        data: [],
        error: 'Moralis Non-JSON',
        provider: 'Moralis',
      };
    const json = JSON.parse(text);
    const raw = json.result || [];
    const bars = raw.map((b: any) => ({
      time: Math.floor(new Date(b.timestamp).getTime() / 1000),
      open: parseFloat(b.open),
      high: parseFloat(b.high),
      low: parseFloat(b.low),
      close: parseFloat(b.close),
      volume: parseFloat(b.volume || '0'),
    }));
    return { success: true, data: bars, provider: 'Moralis' };
  } catch (e: any) {
    return { success: false, data: [], error: e.message, provider: 'Moralis' };
  }
}

// --- Mobula Provider ---
async function fetchMobulaOhlcv(
  chainId: string,
  pairAddress: string,
  resolution: string,
): Promise<ProviderResult<OhlcvBar[]>> {
  const networkMap: Record<string, string> = {
    solana: 'Solana',
    ethereum: 'Ethereum',
    bsc: 'Binance Smart Chain',
    base: 'Base',
  };
  const network = networkMap[chainId] || chainId;
  const intervalMap: Record<string, string> = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '60': '1h',
    '240': '4h',
    D: '1d',
  };
  const interval = intervalMap[resolution] || '15m';
  const url = `https://api.mobula.fi/api/1/market/pair/ohlcv?address=${pairAddress}&asset=${pairAddress}&network=${network}&interval=${interval}`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok)
      return {
        success: false,
        data: [],
        error: `Mobula Status ${res.status}`,
        provider: 'Mobula',
      };
    const text = await res.text();
    if (!text.trim().startsWith('{'))
      return {
        success: false,
        data: [],
        error: 'Mobula Non-JSON',
        provider: 'Mobula',
      };
    const json = JSON.parse(text);
    const raw = json.data || [];
    const bars = raw.map((c: any) => ({
      time: Math.floor(c[0] / 1000),
      open: parseFloat(String(c[1])),
      high: parseFloat(String(c[2])),
      low: parseFloat(String(c[3])),
      close: parseFloat(String(c[4])),
      volume: parseFloat(String(c[5])),
    }));
    return { success: true, data: bars, provider: 'Mobula' };
  } catch (e: any) {
    return { success: false, data: [], error: e.message, provider: 'Mobula' };
  }
}

// --- Birdeye Provider (Solana Only) ---
async function fetchBirdeyeOhlcv(
  chainId: string,
  pairAddress: string,
  resolution: string,
): Promise<ProviderResult<OhlcvBar[]>> {
  if (chainId !== 'solana')
    return { success: false, data: [], provider: 'Birdeye' };
  const typeMap: Record<string, string> = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '60': '1h',
    D: '1d',
  };
  const type = typeMap[resolution] || '15m';
  const url = `https://public-api.birdeye.so/public/ohlcv?address=${pairAddress}&type=${type}`;

  try {
    const res = await fetch(url, {
      headers: { 'x-chain': 'solana', Accept: 'application/json' },
    });
    if (!res.ok)
      return {
        success: false,
        data: [],
        error: `Birdeye Status ${res.status}`,
        provider: 'Birdeye',
      };
    const text = await res.text();
    if (!text.trim().startsWith('{'))
      return {
        success: false,
        data: [],
        error: 'Birdeye Non-JSON',
        provider: 'Birdeye',
      };
    const json = JSON.parse(text);
    const raw = json.data?.items || [];
    const bars = raw.map((b: any) => ({
      time: b.unixTime,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
      volume: b.v,
    }));
    return { success: true, data: bars, provider: 'Birdeye' };
  } catch (e: any) {
    return { success: false, data: [], error: e.message, provider: 'Birdeye' };
  }
}

// --- Fallback Orchestrator ---
export async function getOhlcv(
  chainId: string,
  pairAddress: string,
  resolution: string,
): Promise<ProviderResult<OhlcvBar[]>> {
  const providers = [
    fetchGeckoTerminalV2,
    fetchGeckoTerminalAlt,
    fetchMoralisOhlcv,
    fetchMobulaOhlcv,
    fetchBirdeyeOhlcv,
  ];
  let lastError = '';
  for (const p of providers) {
    try {
      console.log(`[DataProviders] Trying ${p.name}...`);
      const result = await p(chainId, pairAddress, resolution);
      if (result.success && result.data.length > 0) {
        console.log(`[DataProviders] ✅ Success with ${result.provider}`);
        return result;
      }
      console.warn(`[DataProviders] ❌ ${p.name} failed: ${result.error}`);
      lastError = result.error || 'No data';
    } catch (e: any) {
      console.error(`[DataProviders] 💥 ${p.name} error:`, e.message);
      lastError = e.message;
    }
  }
  return { success: false, data: [], error: lastError, provider: 'All' };
}

export async function getTrades(
  chainId: string,
  pairAddress: string,
): Promise<ProviderResult<TradeData[]>> {
  const providers = [fetchGeckoTerminalTrades];
  for (const p of providers) {
    try {
      const result = await p(chainId, pairAddress);
      if (result.success && result.data.length > 0) return result;
    } catch {}
  }
  return {
    success: false,
    data: [],
    error: 'All providers failed',
    provider: 'All',
  };
}

async function fetchGeckoTerminalTrades(
  chainId: string,
  pairAddress: string,
): Promise<ProviderResult<TradeData[]>> {
  const network = NETWORK_MAP.geckoterminal[chainId] || chainId;
  const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pairAddress}/trades?trade_volume_in_usd_greater_than=0`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (!res.ok)
      return {
        success: false,
        data: [],
        error: `Status ${res.status}`,
        provider: 'GeckoTerminal',
      };

    let text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Fallback 1: Attempt to query by token instead of pair if the pair pool route returned invalid data / HTML proxy block
      const fallbackUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${pairAddress}/trades?trade_volume_in_usd_greater_than=0`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      if (!fallbackRes.ok) throw new Error('Fallback failed');
      text = await fallbackRes.text();
      try {
        json = JSON.parse(text);
      } catch (err) {
        throw new Error('Fallback returned invalid JSON');
      }
    }

    const trades = (json?.data || []).map((t: any) => {
      const a = t.attributes || {};
      const d = new Date(a.block_timestamp || Date.now());
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      const age =
        diffSec < 60
          ? `${diffSec}s`
          : diffSec < 3600
            ? `${Math.floor(diffSec / 60)}m`
            : `${Math.floor(diffSec / 3600)}h`;

      return {
        type: a.kind === 'buy' ? 'Buy' : 'Sell',
        age,
        usd: parseFloat(a.volume_in_usd || '0'),
        tokenAmount: parseFloat(
          a.from_token_amount || a.to_token_amount || '0',
        ),
        nativeAmount: parseFloat(
          a.to_token_amount || a.from_token_amount || '0',
        ),
        priceUsd: parseFloat(a.price_from_in_usd || a.price_to_in_usd || '0'),
        maker: a.tx_from_address || '',
        txHash: a.tx_hash || '',
      };
    });
    return { success: true, data: trades, provider: 'GeckoTerminal' };
  } catch (e: any) {
    return {
      success: false,
      data: [],
      error: e.message,
      provider: 'GeckoTerminal',
    };
  }
}
