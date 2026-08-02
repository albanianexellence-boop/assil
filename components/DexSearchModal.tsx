import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';
import { createPortal } from 'react-dom';

const CHAIN_COLOR: Record<string, string> = {
  ethereum: '#627eea',
  bsc: '#f0b94d',
  solana: '#9945ff',
  base: '#0052ff',
  arbitrum: '#12aaff',
  polygon: '#8247e5',
  avalanche: '#e84142',
  optimism: '#ff0420',
};

interface DexSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}



export default function DexSearchModal({
  isOpen,
  onClose,
}: DexSearchModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [boostedTokens, setBoostedTokens] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [boostedType, setBoostedType] = useState<'latest' | 'top'>('latest');

  const inputRef = useRef<HTMLInputElement>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('dex_search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, [isOpen]);

  const addToHistory = (pair: any) => {
    const newHist = [
      pair,
      ...history.filter((t) => t.pairAddress !== pair.pairAddress),
    ].slice(0, 10);
    setHistory(newHist);
    localStorage.setItem('dex_search_history', JSON.stringify(newHist));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('dex_search_history');
  };

  // Fetch initial data (Boosted + Updates)
  useEffect(() => {
    if (isOpen && boostedTokens.length === 0) {
      fetch('https://api.dexscreener.com/token-boosts/latest/v1')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setBoostedTokens(data.slice(0, 15));
        })
        .catch(() => {});

      // For recent updates, we fetch the latest profiles, then fetch the full pairs
      fetch('https://api.dexscreener.com/token-profiles/latest/v1')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Get up to 10 addresses to have a safe URL length
            const addrs = data
              .slice(0, 10)
              .map((d: any) => d.tokenAddress)
              .join(',');
            if (addrs) {
              fetch(`https://api.dexscreener.com/latest/dex/tokens/${addrs}`)
                .then((r) => r.json())
                .then((pairData) => {
                  if (pairData.pairs && Array.isArray(pairData.pairs)) {
                    // Deduplicate pairs by baseToken address just to have diverse options
                    const uniquePairs: any[] = [];
                    const seen = new Set();
                    for (const p of pairData.pairs) {
                      if (
                        p.baseToken?.address &&
                        !seen.has(p.baseToken.address)
                      ) {
                        seen.add(p.baseToken.address);
                        uniquePairs.push(p);
                      }
                    }
                    setRecentUpdates(uniquePairs.slice(0, 12));
                  }
                })
                .catch(() => {});
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, boostedTokens.length]);

  // Debounced search logic
  useEffect(() => {
    if (!query) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.pairs || []);
        })
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[800px] bg-[#11161d] border border-[#21262d] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ 
          maxHeight: '80vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#21262d] bg-[#1c2128]">
          <Search size={20} className="text-[#a0a5ad] mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search matching pairs"
            className="flex-1 bg-transparent text-[#e6edf3] placeholder-[#7d8590] outline-none text-[16px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            className="text-[#a0a5ad] hover:text-white px-2 py-1 text-sm font-semibold transition"
          >
            Cancel
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {query ? (
            <div className="flex flex-col gap-2">
              {/* SEARCH RESULTS */}
              {isSearching ? (
                <div className="text-center py-8 text-[#7d8590]">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                results.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#21262d] cursor-pointer"
                    onClick={() => {
                      addToHistory(p);
                      onClose();
                      router.push(`/tokens/${p.chainId}/${p.pairAddress}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#21262d] rounded-full flex items-center justify-center shrink-0 overflow-hidden relative">
                        {p.info?.imageUrl ? (
                          <img
                            src={p.info.imageUrl}
                            alt={p.baseToken?.symbol}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold">
                            {p.baseToken?.symbol?.charAt(0) || '?'}
                          </span>
                        )}
                        <img
                          src={`/chains/${p.chainId}.png`}
                          className="absolute bottom-[-1px] right-[-1px] w-4 h-4 rounded-full border border-[#11161d]"
                          alt={p.chainId}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-[15px]">
                          {p.baseToken?.symbol}{' '}
                          <span className="text-[#a0a5ad] font-normal">
                            / {p.quoteToken?.symbol}
                          </span>
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          {p.chainId && (
                            <div
                              className="flex items-center gap-1 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                              style={{
                                background: CHAIN_COLOR[p.chainId] || '#21262d',
                              }}
                            >
                              <img
                                src={`/chains/${p.chainId}.png`}
                                alt={p.chainId}
                                className="w-3 h-3 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    'none';
                                }}
                              />
                              {p.chainId}
                            </div>
                          )}
                          {p.dexId && (
                            <div className="flex items-center gap-1 bg-[#1c2128] border border-[#30363d] text-[#a0a5ad] text-[10px] font-semibold px-2 py-0.5 rounded capitalize">
                              <img
                                src={`https://dd.dexscreener.com/ds-data/dexes/${p.dexId}.png`}
                                alt={p.dexId}
                                className="w-3 h-3 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    'none';
                                }}
                              />
                              {p.dexId}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-white text-[15px]">
                        $
                        {parseFloat(p.priceUsd || '0').toLocaleString(
                          undefined,
                          { maximumFractionDigits: 6 },
                        )}
                      </span>
                      <span
                        className={`text-[12px] ${p.priceChange?.h24 >= 0 ? 'text-[#00c58a]' : 'text-[#ff4976]'}`}
                      >
                        {p.priceChange?.h24 >= 0 ? '+' : ''}
                        {p.priceChange?.h24?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#7d8590]">
                  No pairs found for "{query}"
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* DYNAMIC HISTORY */}
              {history.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[#a0a5ad] text-[13px] font-semibold tracking-wider uppercase flex items-center gap-2">
                      <span className="text-[16px]">🕒</span> History
                    </h3>
                    <button
                      onClick={clearHistory}
                      className="text-[#7d8590] text-xs hover:text-white transition"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          onClose();
                          router.push(`/tokens/${p.chainId}/${p.pairAddress}`);
                        }}
                        className="px-3 py-1.5 rounded-md bg-[#1c2128] border border-[#21262d] text-white text-[13px] font-medium flex items-center gap-2 cursor-pointer hover:bg-[#252a33] transition"
                      >
                        <img
                          src={
                            p.info?.imageUrl ||
                            `https://dd.dexscreener.com/ds-data/tokens/${p.chainId}/${p.baseToken?.address.toLowerCase()}.png`
                          }
                          className="w-4 h-4 rounded-full bg-gray-700 object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2321262d"/></svg>';
                          }}
                          alt={p.baseToken?.symbol}
                        />
                        {p.baseToken?.symbol || 'Unknown'}
                        <img
                          src={`/chains/${p.chainId}.png`}
                          className="w-[12px] h-[12px] rounded-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.style.display = 'none')
                          }
                          alt=""
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BOOSTED HORIZONTAL LIST */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-white text-[14px] font-bold flex items-center gap-1 uppercase tracking-wider">
                    ⚡ Boosted
                  </h3>
                  <div className="ml-2 flex items-center bg-[#1c2128] rounded-md p-1 border border-[#21262d]">
                    <button
                      className={`px-3 py-1 text-xs font-semibold rounded ${boostedType === 'latest' ? 'bg-[#2d333b] text-white' : 'text-[#a0a5ad] hover:text-white transition'}`}
                      onClick={() => setBoostedType('latest')}
                    >
                      Latest
                    </button>
                    <button
                      className={`px-3 py-1 text-xs font-semibold rounded ${boostedType === 'top' ? 'bg-[#2d333b] text-white' : 'text-[#a0a5ad] hover:text-white transition'}`}
                      onClick={() => setBoostedType('top')}
                    >
                      Top
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {boostedTokens.map((b, i) => {
                    const iconUrl = b.icon?.startsWith('http')
                      ? b.icon
                      : `https://cdn.dexscreener.com/cms/images/${b.icon}`;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          onClose();
                          router.push(`/tokens/${b.chainId}/${b.tokenAddress}`);
                        }}
                        className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c2128] border border-[#21262d] text-white text-[13px] font-medium cursor-pointer hover:bg-[#252a33] transition"
                      >
                        {b.icon ? (
                          <img
                            src={iconUrl}
                            className="w-[18px] h-[18px] rounded-full object-cover"
                            alt="boost"
                          />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full bg-[#ffd500]"></div>
                        )}
                        <span className="truncate max-w-[80px]">
                          {b.description
                            ? b.description.split('\n')[0]
                            : 'TOKEN'}
                        </span>
                        <span className="text-[#ffd500] flex items-center text-[12px] font-bold ml-1">
                          ⚡ {b.amount || b.totalAmount || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECENTLY UPDATED GRID (DYNAMIC PAIRS) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-[15px] font-bold">
                    Recently Updated Token Info
                  </h3>
                  <a
                    href="#"
                    className="text-[#a0a5ad] text-[13px] hover:text-white flex items-center gap-1 transition"
                  >
                    👀 Claim your spot here ›
                  </a>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentUpdates.length > 0
                    ? recentUpdates.map((t, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            addToHistory(t);
                            onClose();
                            router.push(
                              `/tokens/${t.chainId}/${t.pairAddress}`,
                            );
                          }}
                          className="flex p-3 rounded-lg bg-[#1c2128] border border-[#21262d] hover:bg-[#252a33] cursor-pointer transition"
                        >
                          <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden relative bg-[#11161d] border border-[#21262d]">
                            {t.info?.imageUrl ? (
                              <img
                                src={t.info.imageUrl}
                                className="w-full h-full object-cover"
                                alt="token"
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-white font-bold">
                                {t.baseToken?.symbol?.charAt(0) || '?'}
                              </span>
                            )}
                            <img
                              src={`/chains/${t.chainId}.png`}
                              className="absolute bottom-[-1px] right-[-1px] w-[14px] h-[14px] rounded-full border border-[#11161d] bg-[#11161d]"
                              onError={(e) =>
                                (e.currentTarget.style.display = 'none')
                              }
                              alt=""
                            />
                          </div>
                          <div className="ml-3 flex flex-col justify-center w-full min-w-0">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-white text-[13px] font-bold truncate pr-1">
                                {t.baseToken?.symbol || 'Unknown Token'}
                              </span>
                              <span
                                className={`text-[11px] font-semibold whitespace-nowrap ${Number(t.priceChange?.h24) >= 0 ? 'text-[#00c58a]' : 'text-[#ff4976]'}`}
                              >
                                {Number(t.priceChange?.h24) >= 0 ? '+' : ''}
                                {Number(t.priceChange?.h24 || 0).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 w-full">
                              <span className="text-[#a0a5ad] text-[12px] truncate max-w-[55%]">
                                $
                                {parseFloat(t.priceUsd || '0').toLocaleString(
                                  undefined,
                                  {
                                    maximumFractionDigits:
                                      t.priceUsd < 0.01 ? 6 : 4,
                                  },
                                )}
                              </span>
                              <div className="flex items-center gap-[4px] shrink-0">
                                {t.info?.socials?.some(
                                  (l: any) => l.type === 'twitter',
                                ) && (
                                  <span className="text-[#a0a5ad] text-[10px]">
                                    𝕏
                                  </span>
                                )}
                                {t.info?.socials?.some(
                                  (l: any) => l.type === 'telegram',
                                ) && (
                                  <span className="text-[#419bd7] text-[10px]">
                                    TG
                                  </span>
                                )}
                                {t.info?.socials?.some(
                                  (l: any) => l.type === 'discord',
                                ) && (
                                  <span className="text-[#5865f2] text-[10px]">
                                    DC
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    : // SKELETON LOADER IF EMPTY
                      Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex p-3 rounded-lg bg-[#1c2128] border border-[#21262d] animate-pulse"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#21262d] shrink-0"></div>
                          <div className="ml-3 flex flex-col justify-center w-full min-w-0 gap-2">
                            <div className="h-3 bg-[#21262d] rounded w-full"></div>
                            <div className="h-3 bg-[#21262d] rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
