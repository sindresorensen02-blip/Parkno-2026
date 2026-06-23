import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Svg, { Line, Text as SvgText, TSpan } from 'react-native-svg';

/**
 * PriceHealthGauge — a 180° segmented arc that sweeps lit ticks up to the
 * score, recolours to the live zone, and eases between values whenever the
 * price changes. Honours Reduce Motion (snaps instead of animating).
 */
const TICKS = 44;
const W = 260;
const H = 152;
const CX = W / 2;
const CY = 140;
const R = 112;

export default function PriceHealthGauge({ value, color, soft, label, note }) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);
  const reduceRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then((on) => {
      reduceRef.current = !!on;
    });
  }, []);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const from = fromRef.current;
    const to = value;
    if (reduceRef.current) {
      fromRef.current = to;
      setShown(to);
      return;
    }
    const start = Date.now();
    const dur = 720;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const litCount = (shown / 100) * TICKS;
  const litFloor = Math.floor(litCount);

  return (
    <View accessibilityRole="image" accessibilityLabel={`Prishelse ${Math.round(value)} av 100. ${label}.`}>
      <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        {Array.from({ length: TICKS }).map((_, i) => {
          const a = Math.PI + (i / (TICKS - 1)) * Math.PI; // 180° → 360°
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          const lit = i < litFloor;
          const edge = i === litFloor && litCount % 1 > 0;
          return (
            <Line
              key={i}
              x1={CX + cos * (R - 16)}
              y1={CY + sin * (R - 16)}
              x2={CX + cos * R}
              y2={CY + sin * R}
              stroke={lit || edge ? color : 'rgba(255,255,255,0.13)'}
              strokeOpacity={edge ? litCount % 1 : 1}
              strokeWidth={lit || edge ? 6 : 5}
              strokeLinecap="round"
            />
          );
        })}
        <SvgText x={CX} y={CY - 30} textAnchor="middle" fill="#fff"
          fontSize="38" fontWeight="800">
          {Math.round(shown)}
          <TSpan fontSize="15" fontWeight="600" fill="rgba(255,255,255,0.5)"> /100</TSpan>
        </SvgText>
        <SvgText x={CX} y={CY - 8} textAnchor="middle" fill={color}
          fontSize="13" fontWeight="700">
          {String(label || '').toUpperCase()}
        </SvgText>
        {note ? (
          <SvgText x={CX} y={CY + 10} textAnchor="middle"
            fill="rgba(255,255,255,0.55)" fontSize="11" fontWeight="500">
            {note}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}
