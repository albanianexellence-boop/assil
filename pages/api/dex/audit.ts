import type { NextApiRequest, NextApiResponse } from 'next';

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
export interface AuditItem {
  label: string;
  value: string; // 'Yes' | 'No' | 'Unknown' | numeric string
  risk: 'safe' | 'danger' | 'warning' | 'info';
  tooltip?: string;
}

export interface AuditResult {
  overallRisk: 'safe' | 'warning' | 'danger' | 'unknown';
  summary: string; // e.g. "No issues" | "1 issue" | "3 issues"
  items: AuditItem[];
  source: string; // e.g. "Solana RPC" | "GoPlus"
}

/* ──────────────────────────────────────────────
   Solana – parse mint account data
   Layout:  44 bytes
   0:4   mintAuthorityOption (le u32)
   4:36  mintAuthority (pubkey, 32 bytes)
   36:44 supply (le u64)
   44    decimals
   45    isInitialized
   46:50 freezeAuthorityOption (le u32)
   50:82 freezeAuthority (pubkey, 32 bytes)
────────────────────────────────────────────── */
async function fetchSolanaAudit(tokenAddress: string): Promise<AuditResult> {
  const endpoints = [
    'https://mainnet.helius-rpc.com/?api-key=d10298fe-1021-43ce-8eb1-44dc6881f967',
    'https://api.mainnet-beta.solana.com',
  ];

  let data: any = null;
  for (const rpc of endpoints) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [tokenAddress, { encoding: 'base64' }],
        }),
        signal: AbortSignal.timeout(4000),
      });
      const json = await res.json();
      if (json?.result?.value) {
        data = json.result.value;
        break;
      }
    } catch {
      /* try next */
    }
  }

  if (!data) {
    return {
      overallRisk: 'unknown',
      summary: 'Unable to fetch',
      items: [],
      source: 'Solana RPC',
    };
  }

  // Decode base64 account data
  const rawBytes = Buffer.from(data.data[0], 'base64');

  // mintAuthorityOption — 0 = no authority (not mintable)
  const mintAuthorityOption = rawBytes.readUInt32LE(0);
  const isMintable = mintAuthorityOption !== 0;

  // freezeAuthorityOption — starting at byte 46
  let isFreezable = false;
  if (rawBytes.length >= 50) {
    const freezeAuthorityOption = rawBytes.readUInt32LE(46);
    isFreezable = freezeAuthorityOption !== 0;
  }

  const issues = (isMintable ? 1 : 0) + (isFreezable ? 1 : 0);
  const overallRisk: AuditResult['overallRisk'] =
    issues === 0 ? 'safe' : issues === 1 ? 'warning' : 'danger';

  return {
    overallRisk,
    summary:
      issues === 0 ? 'No issues' : `${issues} issue${issues > 1 ? 's' : ''}`,
    source: 'Solana RPC',
    items: [
      {
        label: 'Mintable',
        value: isMintable ? 'Yes' : 'No',
        risk: isMintable ? 'danger' : 'safe',
        tooltip: 'Whether new tokens can be minted. Dangerous if Yes.',
      },
      {
        label: 'Freezable',
        value: isFreezable ? 'Yes' : 'No',
        risk: isFreezable ? 'warning' : 'safe',
        tooltip: 'Whether token accounts can be frozen by the authority.',
      },
    ],
  };
}

/* ──────────────────────────────────────────────
   EVM – GoPlus Security API (free, no key needed)
────────────────────────────────────────────── */
const CHAIN_ID_MAP: Record<string, string> = {
  ethereum: '1',
  eth: '1',
  bsc: '56',
  binance: '56',
  polygon: '137',
  matic: '137',
  arbitrum: '42161',
  arbi: '42161',
  avalanche: '43114',
  avax: '43114',
  base: '8453',
  optimism: '10',
  fantom: '250',
  ftm: '250',
};

async function fetchEvmAudit(
  chainId: string,
  tokenAddress: string,
): Promise<AuditResult> {
  const numericalChainId = CHAIN_ID_MAP[chainId.toLowerCase()] || '1';
  const url = `https://api.gopluslabs.io/api/v1/token_security/${numericalChainId}?contract_addresses=${tokenAddress}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const json = await res.json();
    const t =
      json?.result?.[tokenAddress.toLowerCase()] ??
      json?.result?.[tokenAddress];
    if (!t) throw new Error('No GoPlus data');

    const flag = (val: string | undefined) => val === '1';

    const rows: AuditItem[] = [
      {
        label: 'Honeypot',
        value: flag(t.is_honeypot) ? 'Yes' : 'No',
        risk: flag(t.is_honeypot) ? 'danger' : 'safe',
        tooltip: 'Cannot sell after buy.',
      },
      {
        label: 'Mintable',
        value: flag(t.is_mintable) ? 'Yes' : 'No',
        risk: flag(t.is_mintable) ? 'danger' : 'safe',
        tooltip: 'Owner can mint new tokens.',
      },
      {
        label: 'Proxy Contract',
        value: flag(t.is_proxy) ? 'Yes' : 'No',
        risk: flag(t.is_proxy) ? 'warning' : 'safe',
        tooltip: 'Contract is upgradeable via proxy.',
      },
      {
        label: 'Blacklist',
        value: flag(t.is_blacklisted) ? 'Yes' : 'No',
        risk: flag(t.is_blacklisted) ? 'warning' : 'safe',
        tooltip: 'Contract contains a blacklist.',
      },
      {
        label: 'Trading Cooldown',
        value: flag(t.trading_cooldown) ? 'Yes' : 'No',
        risk: flag(t.trading_cooldown) ? 'warning' : 'safe',
        tooltip: 'Trading has a cooldown.',
      },
      {
        label: 'Tax Modifiable',
        value: flag(t.slippage_modifiable) ? 'Yes' : 'No',
        risk: flag(t.slippage_modifiable) ? 'warning' : 'safe',
        tooltip: 'Owner can change tax/slippage.',
      },
      {
        label: 'Buy Tax',
        value:
          t.buy_tax != null
            ? `${(parseFloat(t.buy_tax) * 100).toFixed(1)}%`
            : 'N/A',
        risk: parseFloat(t.buy_tax || '0') > 0.1 ? 'warning' : 'safe',
      },
      {
        label: 'Sell Tax',
        value:
          t.sell_tax != null
            ? `${(parseFloat(t.sell_tax) * 100).toFixed(1)}%`
            : 'N/A',
        risk: parseFloat(t.sell_tax || '0') > 0.1 ? 'warning' : 'safe',
      },
    ];

    const issues = rows.filter(
      (r) => r.risk === 'danger' || r.risk === 'warning',
    ).length;
    const hasHoneypot = flag(t.is_honeypot);
    const overallRisk: AuditResult['overallRisk'] = hasHoneypot
      ? 'danger'
      : issues === 0
        ? 'safe'
        : issues <= 2
          ? 'warning'
          : 'danger';

    return {
      overallRisk,
      summary:
        issues === 0 ? 'No issues' : `${issues} issue${issues > 1 ? 's' : ''}`,
      source: 'GoPlus',
      items: rows,
    };
  } catch (e: any) {
    return {
      overallRisk: 'unknown',
      summary: 'Unable to fetch',
      items: [],
      source: 'GoPlus',
    };
  }
}

/* ──────────────────────────────────────────────
   Handler
────────────────────────────────────────────── */
const cache = new Map<string, { ts: number; data: AuditResult }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { chainId, tokenAddress } = req.query as Record<string, string>;
  if (!chainId || !tokenAddress) {
    return res
      .status(400)
      .json({ success: false, error: 'chainId and tokenAddress required' });
  }

  const key = `${chainId}:${tokenAddress}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 5 * 60_000) {
    return res.status(200).json({ success: true, data: cached.data });
  }

  try {
    let result: AuditResult;
    if (chainId.toLowerCase() === 'solana') {
      result = await fetchSolanaAudit(tokenAddress);
    } else {
      result = await fetchEvmAudit(chainId, tokenAddress);
    }

    cache.set(key, { ts: Date.now(), data: result });
    return res.status(200).json({ success: true, data: result });
  } catch (e: any) {
    return res
      .status(200)
      .json({
        success: true,
        data: {
          overallRisk: 'unknown',
          summary: 'Unable to fetch',
          items: [],
          source: 'Unknown',
        },
      });
  }
}
