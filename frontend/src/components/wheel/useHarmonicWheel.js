import { useEffect, useRef, useState } from 'react';

function shortestAngleDiff(target, current) {
  return ((target - current + 540) % 360) - 180;
}

/**
 * Animates Harmonic Wheel nodes with smooth polar interpolation so orbs
 * emerge radially from the center haze and dissolve gently back inward.
 */
export function useHarmonicWheel(nodes = [], latentCount = 0) {
  const [frame, setFrame] = useState({ renderNodes: [], motes: [], time: 0 });
  const statesRef = useRef(new Map());
  const nodesRef = useRef(nodes);
  const latentRef = useRef(latentCount);
  const timeRef = useRef(0);

  nodesRef.current = nodes;
  latentRef.current = latentCount;

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = null;

    const step = () => {
      const targetNodes = nodesRef.current || [];
      const n = Math.max(targetNodes.length, 1);
      const sliceDeg = 360 / n;
      const states = statesRef.current;

      if (!prefersReduced) {
        timeRef.current += 0.015;
      }
      const t = timeRef.current;

      const activeIds = new Set();

      targetNodes.forEach((node, index) => {
        activeIds.add(node.id);
        const targetAngle = index * sliceDeg;
        const targetFill = Math.max(0, Math.min(1, (node.percentage || 0) / 100));

        if (!states.has(node.id)) {
          states.set(node.id, {
            node,
            angle: targetAngle,
            presence: prefersReduced ? 1 : 0.02,
            fillRatio: prefersReduced ? targetFill : 0,
            index,
          });
        } else {
          const st = states.get(node.id);
          st.node = node;
          st.index = index;
          if (prefersReduced) {
            st.angle = targetAngle;
            st.presence = 1;
            st.fillRatio = targetFill;
          } else {
            st.angle += shortestAngleDiff(targetAngle, st.angle) * 0.14;
            st.presence += (1 - st.presence) * 0.11;
            st.fillRatio += (targetFill - st.fillRatio) * 0.14;
          }
        }
      });

      // Fade/dissolve exiting orbs softly back into the center mist
      for (const [id, st] of states.entries()) {
        if (!activeIds.has(id)) {
          if (prefersReduced) {
            states.delete(id);
          } else {
            st.presence += (0 - st.presence) * 0.12;
            if (st.presence < 0.02) {
              states.delete(id);
            }
          }
        }
      }

      const renderNodes = Array.from(states.values()).map((st) => ({
        ...st.node,
        _angle: st.angle,
        _presence: st.presence,
        _fillRatio: st.fillRatio,
        _isExiting: !activeIds.has(st.node.id),
        _driftOffset: prefersReduced ? 0 : Math.sin(t * 0.85 + st.index * 1.37) * 2.2,
      }));

      // Build latent motes suspended in the breathing center haze
      const cappedLatent = Math.min(latentRef.current || 0, 36);
      const motes = [];
      for (let i = 0; i < cappedLatent; i++) {
        const baseAng = i * 2.39996 + t * (0.1 + (i % 3) * 0.035);
        const r = 10 + Math.sqrt(i + 1) * 7.2 + (prefersReduced ? 0 : Math.sin(t + i) * 2);
        const opacity = 0.22 + (prefersReduced ? 0.1 : 0.18 * Math.sin(t * 1.2 + i));
        motes.push({
          id: i,
          x: Math.cos(baseAng) * r,
          y: Math.sin(baseAng) * r,
          r: 1.8 + (i % 3) * 0.65,
          opacity,
        });
      }

      setFrame({ renderNodes, motes, time: t });
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return frame;
}
