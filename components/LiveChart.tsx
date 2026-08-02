import React from 'react';

interface Props {
  chainId: string;
  pairAddress: string;
  resolution?: string;
  height?: string;
}

export const LiveChart: React.FC<Props> = ({
  chainId,
  pairAddress,
  height,
}) => {
  // Map our internal chain names to DEXScreener's URL format if needed
  // Most match (solana, bsc, ethereum, etc.)
  const chartChain = chainId.toLowerCase();
  const embedUrl = `https://dexscreener.com/${chartChain}/${pairAddress}?embed=1&theme=dark&trades=0&info=0`;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height || '500px',
        background: '#0b0e11',
        overflow: 'hidden',
        border: '1px solid #21262d',
        borderRadius: '8px',
      }}
    >
      <iframe
        src={embedUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="DEXScreener Chart"
        allow="clipboard-write"
        allowFullScreen
      />

      {/* Subtle overlay to hide DexScreener header branding if desired, 
          but usually the embed parameter handles this well */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: '#0b0e11',
          pointerEvents: 'none',
          zIndex: 5,
          display: 'none', // Set to block if you want to mask the bottom bar
        }}
      />
    </div>
  );
};
