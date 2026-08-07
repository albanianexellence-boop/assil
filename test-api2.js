const fetch = require('node-fetch');

(async () => {
  let data = [];
  const seedAddresses = new Set();

  let topBoostsArr = [];
  try {
    const brTop = await fetch(
      'https://api.dexscreener.com/token-boosts/top/v1',
      { headers: { Accept: 'application/json' } },
    );
    if (brTop.ok) topBoostsArr = await brTop.json();
  } catch (e) {}

  if (Array.isArray(topBoostsArr)) {
    for (const item of topBoostsArr) {
      if (item.tokenAddress) seedAddresses.add(item.tokenAddress);
    }
  }

  const seedArr = Array.from(seedAddresses);
  const chunkSize = 30;
  const chunks = [];
  for (let i = 0; i < seedArr.length; i += chunkSize) {
    chunks.push(seedArr.slice(i, i + chunkSize));
  }

  const seen = new Set();
  for (const chunk of chunks) {
    if (chunk.length > 0) {
      try {
        const r = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${chunk.join(',')}`,
          { headers: { Accept: 'application/json' } },
        );
        const j = await r.json();
        for (const p of j.pairs || []) {
          if (!seen.has(p.pairAddress)) {
            seen.add(p.pairAddress);
            data.push(p);
          }
        }
      } catch {}
    }
  }

  const bMap = {};
  for (const b of topBoostsArr) {
    if (b && b.tokenAddress) {
      bMap[b.tokenAddress.toLowerCase()] = b.totalAmount || 0;
    }
  }

  data.sort((a, b) => {
    const aBoost = bMap[a.baseToken?.address?.toLowerCase()] || 0;
    const bBoost = bMap[b.baseToken?.address?.toLowerCase()] || 0;
    if (aBoost !== bBoost) return bBoost - aBoost;
    return (b.volume?.h24 || 0) - (a.volume?.h24 || 0);
  });

  console.log(`Top 3 Pairs Sorted:`);
  for (let i = 0; i < 3; i++) {
    console.log(
      `${data[i]?.baseToken?.symbol} (${data[i]?.baseToken?.address}) -> Boost mapped: ${bMap[data[i]?.baseToken?.address?.toLowerCase()] || 0}`,
    );
  }
})();
