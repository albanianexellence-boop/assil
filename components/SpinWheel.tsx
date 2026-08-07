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
    const spins = Math.floor(Math.random() * 5) + 5;
    const degreesPerSlice = 360 / PRIZES.length;
    const stopAngle = 360 - newPrizeIndex * degreesPerSlice;
    const finalRotation = rotation + 360 * spins + stopAngle - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setPrizeIndex(newPrizeIndex);
      setSpinning(false);
      setHasSpun(true);
      setClaimedPrize(PRIZES[newPrizeIndex]);
    }, 4500);
  };

  return (
    <div
      className="page-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '32px 20px',
        color: 'white',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1
          style={{
            fontSize: '2.6rem',
            fontWeight: 900,
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #00d97e 0%, #4f8ef7 50%, #a371f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
          }}
        >
          Spin to Claim!
        </h1>
        <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>
          Give the wheel a spin — your prize awaits
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          marginBottom: '36px',
        }}
      >
        {/* Outer glow ring */}
        <div
          className={spinning ? 'wheel-glow' : ''}
          style={{
            position: 'absolute',
            inset: '-12px',
            borderRadius: '50%',
            background: 'transparent',
            border: '2px solid rgba(163,113,247,0.3)',
            boxShadow: '0 0 20px rgba(163,113,247,0.2), inset 0 0 20px rgba(0,0,0,0.4)',
            transition: 'box-shadow 0.4s ease',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Pointer */}
        <div
          style={{
            position: 'absolute',
            top: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: '28px solid #ffffff',
            }}
          />
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ffffff',
              margin: '-4px auto 0',
              boxShadow: '0 0 8px rgba(255,255,255,0.6)',
            }}
          />
        </div>

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
            boxShadow: '0 0 40px rgba(0,0,0,0.6), 0 0 80px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1,
            border: '3px solid rgba(255,255,255,0.15)',
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
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-105px)`,
                  color: 'white',
                  fontWeight: 800,
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                }}
              >
                {prize}
              </div>
            );
          })}

          {/* Center circle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#0b0e11',
              border: '3px solid rgba(255,255,255,0.2)',
              boxShadow: '0 0 12px rgba(0,0,0,0.8)',
              zIndex: 5,
            }}
          />
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || prizeIndex !== null}
        style={{
          padding: '14px 52px',
          fontSize: '16px',
          fontWeight: 800,
          color: spinning || prizeIndex !== null ? '#484f58' : '#000',
          background: spinning || prizeIndex !== null
            ? 'rgba(255,255,255,0.06)'
            : 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
          border: `1px solid ${spinning || prizeIndex !== null ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
          borderRadius: '50px',
          cursor: spinning || prizeIndex !== null ? 'not-allowed' : 'pointer',
          boxShadow: spinning || prizeIndex !== null
            ? 'none'
            : '0 8px 32px rgba(221,36,118,0.45)',
          transition: 'all 0.3s ease',
          letterSpacing: '0.05em',
        }}
        onMouseOver={(e) => {
          if (!spinning && prizeIndex === null) {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(221,36,118,0.55)';
          }
        }}
        onMouseOut={(e) => {
          if (!spinning && prizeIndex === null) {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(221,36,118,0.45)';
          }
        }}
      >
        {spinning
          ? '✨ Spinning…'
          : prizeIndex !== null
          ? '🎉 Prize Claimed!'
          : 'SPIN'}
      </button>

      {/* Prize reveal */}
      {prizeIndex !== null && (
        <div
          className="bounce-in"
          style={{
            marginTop: '28px',
            padding: '16px 28px',
            borderRadius: '16px',
            background: 'rgba(0,217,126,0.08)',
            border: '1px solid rgba(0,217,126,0.3)',
            boxShadow: '0 0 24px rgba(0,217,126,0.15)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            You won
          </div>
          <strong style={{ color: '#00d97e', fontSize: '22px', fontWeight: 900, letterSpacing: '-0.3px' }}>
            {PRIZES[prizeIndex]}
          </strong>
        </div>
      )}
    </div>
  );
};
