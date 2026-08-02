import { NextApiRequest, NextApiResponse } from 'next';

const MORALIS_KEY = process.env.MORALIS_API_KEY || '';

// ---- EVM via Moralis deep-index ----
async function fetchEvmHolders(tokenAddress: string, chainId: string) {
  const chainMap: Record<string, string> = {
    ethereum: '0x1',
    eth: '0x1',
    bsc: '0x38',
    polygon: '0x89',
    arbitrum: '0xa4b1',
    optimism: '0xa',
    avalanche: '0xa86a',
    base: '0x2105',
  };
  const chain = chainMap[chainId.toLowerCase()] || '0x1';
  const res = await fetch(
    `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/owners?chain=${chain}&limit=100&order=DESC`,
    {
      headers: { accept: 'application/json', 'X-API-Key': MORALIS_KEY },
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!res.ok) throw new Error(`Moralis EVM error: ${res.status}`);
  const data = await res.json();
  return (data.result || []).map((h: any, i: number) => ({
    rank: i + 1,
    address: h.owner_address,
    amount: parseFloat(h.balance_formatted || '0'),
    percentage: parseFloat(h.percentage_relative_to_total_supply || '0'),
    usdValue: parseFloat(h.usd_value || '0'),
  }));
}

// ---- Solana: race multiple free RPC endpoints ----
const SOLANA_RPCS = [
  'https://mainnet.helius-rpc.com/?api-key=d10298fe-1021-43ce-8eb1-44dc6881f967',
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.g.alchemy.com/v2/demo',
];

async function rpcCall(
  url: string,
  method: string,
  params: any[],
): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'RPC error');
    return json.result;
  } finally {
    clearTimeout(timeout);
  }
}

// Race multiple RPC endpoints — first valid response wins
async function rpcRace(method: string, params: any[]): Promise<any> {
  const attempts = SOLANA_RPCS.map((url) =>
    rpcCall(url, method, params).catch(() => null),
  );
  // Try all in parallel, but return first non-null result
  return new Promise((resolve, reject) => {
    let settled = 0;
    attempts.forEach((p) =>
      p.then((result) => {
        if (result !== null) resolve(result);
        else {
          settled++;
          if (settled === attempts.length) resolve(null);
        }
      }),
    );
    // Fallback timeout safety net
    setTimeout(() => resolve(null), 9000);
  });
}

async function fetchSolanaHolders(tokenAddress: string) {
  // Fetch supply & largest accounts in parallel from any working RPC
  const [supplyResult, largestResult] = await Promise.all([
    rpcRace('getTokenSupply', [tokenAddress]),
    rpcRace('getTokenLargestAccounts', [tokenAddress]),
  ]);

  const totalSupply = parseFloat(supplyResult?.value?.uiAmount || '0');
  const accounts: any[] = largestResult?.value || [];

  if (accounts.length === 0) {
    return { holders: [], noData: true };
  }

  // Resolve owners for the top accounts (best-effort, non-blocking)
  const ownerMap: Record<string, string> = {};
  const topAccounts = accounts.slice(0, 20);

  await Promise.allSettled(
    topAccounts.map(async (acc: any) => {
      const rpcUrl = 'https://mainnet.helius-rpc.com/?api-key=d10298fe-1021-43ce-8eb1-44dc6881f967';
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 4000);
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getAccountInfo',
            params: [acc.address, { encoding: 'jsonParsed' }],
          }),
          signal: controller.signal,
        });
        const json = await res.json();
        const owner = json?.result?.value?.data?.parsed?.info?.owner;
        if (owner) ownerMap[acc.address] = owner;
      } catch {
        /* best-effort */
      }
    }),
  );

  const holders = accounts.map((h: any, i: number) => {
    const amount = parseFloat(h.uiAmount || '0');
    const pct = totalSupply > 0 ? (amount / totalSupply) * 100 : 0;
    return {
      rank: i + 1,
      address: ownerMap[h.address] || h.address,
      tokenAccount: h.address,
      amount,
      percentage: parseFloat(pct.toFixed(2)),
      usdValue: 0,
    };
  });

  return { holders, noData: false };
}

// ---- Handler ----
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { chainId, tokenAddress, priceUsd } = req.query as Record<
    string,
    string
  >;
  if (!chainId || !tokenAddress) {
    return res.status(400).json({ success: false, error: 'Missing params' });
  }

  try {
    const price = parseFloat(priceUsd || '0');

    if (chainId.toLowerCase() === 'solana') {
      const { holders, noData } = await fetchSolanaHolders(tokenAddress);
      if (noData) {
        // Return a special flag so the UI can show a Solscan link
        return res.status(200).json({
          success: false,
          data: [],
          total: 0,
          solscanUrl: `https://solscan.io/token/${tokenAddress}#holders`,
          error:
            'Holder data not available via public RPC for this token. View on Solscan.',
        });
      }
      const enriched =
        price > 0
          ? holders.map((h) => ({ ...h, usdValue: h.amount * price }))
          : holders;
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
      return res
        .status(200)
        .json({ success: true, data: enriched, total: enriched.length });
    } else {
      const holders = await fetchEvmHolders(tokenAddress, chainId);
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
      return res
        .status(200)
        .json({ success: true, data: holders, total: holders.length });
    }
  } catch (err: any) {
    return res
      .status(200)
      .json({ success: false, data: [], total: 0, error: err.message });
  }
}
