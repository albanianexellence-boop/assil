const fetch = require('node-fetch');

(async () => {
  let topBoostsArr = [];
  try {
    const brTop = await fetch(
      'https://api.dexscreener.com/token-boosts/top/v1',
      { headers: { Accept: 'application/json' } },
    );
    if (brTop.ok) topBoostsArr = await brTop.json();
  } catch (e) {
    console.error(e);
  }

  const bMap = {};
  for (const b of topBoostsArr) {
    if (b && b.tokenAddress) {
      bMap[b.tokenAddress.toLowerCase()] = b.totalAmount || 0;
    }
  }

  if (Object.keys(bMap).length > 0) {
    const firstKey = Object.keys(bMap)[0];

    const r = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${firstKey}`,
      { headers: { Accept: 'application/json' } },
    );
    const j = await r.json();
    const p = j.pairs[0];

    console.log(`Searching for: ${firstKey}`);
    console.log(`Found baseToken.address: ${p?.baseToken?.address}`);
    console.log(
      `Found baseToken.address (lowercase): ${p?.baseToken?.address?.toLowerCase()}`,
    );
    console.log(
      `Matched boost amount in map: ${bMap[p?.baseToken?.address?.toLowerCase()]}`,
    );
  }
})();
