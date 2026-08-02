import React, { useState } from 'react';
import { useAtom } from 'jotai';
import {
  hasSpunWheelAtom,
  claimedPrizeAtom,
} from '../src/atoms/game-flow-atom';

const PRIZES = [
  '100 Coins',
  '50 Coins',
  '200 Coins',
  '10 Coins',
  '500 Coins',
  'Try Again',
  'Token X',
  'Jackpot',
];
const COLORS = [
  '#FF5733',
  '#33FF57',
  '#3357FF',
  '#F333FF',
  '#33FFF5',
  '#FFB533',
  '#FF3333',
  '#8D33FF',
];

export const SpinWheel = () => {
  const [, setHasSpun] = useAtom(hasSpunWheelAtom);
  const [, setClaimedPrize] = useAtom(claimedPrizeAtom);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizeIndex, setPrizeIndex] = useState<number | null>(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);

    const newPrizeIndex = Math.floor(Math.random() * PRIZES.length);
    const spins = Math.floor(Math.random() * 5) + 5; // 5 to 10 full rotations
    // Calculate new rotation:
    // Each slice is 360 / size = 45 deg.
    // The top is 0 deg. Offset the wheel so the chosen sector stops exactly at the top.
    const degreesPerSlice = 360 / PRIZES.length;
    // We want the chosen index to be at the top minus half a slice to center it, but let's just do a simple mapping.
    const stopAngle = 360 - newPrizeIndex * degreesPerSlice;

    // Add multiple spins to make it exciting
    const finalRotation = rotation + 360 * spins + stopAngle - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setPrizeIndex(newPrizeIndex);
      setSpinning(false);
      setHasSpun(true);
      setClaimedPrize(PRIZES[newPrizeIndex]);
    }, 4500); // Wait for CSS transition (4s) + offset
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'white',
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          background: 'linear-gradient(90deg, #ff00cc, #3333ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Spin to Claim!
      </h1>

      <div
        style={{
          position: 'relative',
          width: '300px',
          height: '300px',
          marginBottom: '2rem',
        }}
      >
        {/* Pointer */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '30px solid white',
            zIndex: 10,
          }}
        />

        {/* The Wheel */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            transition: 'transform 4s cubic-bezier(0.175, 0.885, 0.32, 1)',
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(
              ${COLORS[0]} 0deg 45deg,
              ${COLORS[1]} 45deg 90deg,
              ${COLORS[2]} 90deg 135deg,
              ${COLORS[3]} 135deg 180deg,
              ${COLORS[4]} 180deg 225deg,
              ${COLORS[5]} 225deg 270deg,
              ${COLORS[6]} 270deg 315deg,
              ${COLORS[7]} 315deg 360deg
            )`,
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {PRIZES.map((prize, idx) => {
            const angle = idx * (360 / PRIZES.length) + 360 / PRIZES.length / 2;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-100px)`,
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px black',
                  fontSize: '14px',
                }}
              >
                {prize}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning || prizeIndex !== null}
        style={{
          padding: '1rem 3rem',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'white',
          background: spinning
            ? '#555'
            : 'linear-gradient(45deg, #FF512F, #DD2476)',
          border: 'none',
          borderRadius: '50px',
          cursor: spinning || prizeIndex !== null ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          if (!spinning && prizeIndex === null)
            e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          if (!spinning && prizeIndex === null)
            e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {spinning
          ? 'Spinning...'
          : prizeIndex !== null
            ? 'Prize Claimed!'
            : 'SPIN'}
      </button>

      {prizeIndex !== null && (
        <div
          style={{
            marginTop: '2rem',
            fontSize: '1.5rem',
            animation: 'fadeIn 1s ease-in',
          }}
        >
          You won:{' '}
          <strong style={{ color: '#4ade80' }}>{PRIZES[prizeIndex]}</strong>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
