import React, { useId } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useHarmonicWheel } from './useHarmonicWheel';

function polarToXY(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * HarmonicWheel: Dreamlike circular mastery wheel (Variation B).
 *
 * - Quiet breathing center mist holds latent/resting roots as subtle motes.
 * - Up to 12 harmonic orbs emerge radially onto delicate orbital rings.
 * - Each orb renders an inner circle expanding toward its outer rim (area-true √%).
 */
export default function HarmonicWheel({
  model,
  selectedNodeId,
  hoveredNodeId,
  onHoverNode,
  onSelectNode,
  onZoomOut,
}) {
  const uid = useId().replace(/:/g, '');
  const {
    nodes = [],
    latentCount = 0,
    centerPct = 0,
    centerLabel = 'OVERALL',
    depth = 0,
  } = model || {};

  const { renderNodes, motes } = useHarmonicWheel(nodes, latentCount);

  const size = 440;
  const cx = size / 2;
  const cy = size / 2;
  const hubRadius = 54;
  const maxOrbitRadius = 142;

  const activeCount = nodes.length;
  // Slightly scale orb radius based on count so 3 orbs feel generous and 12 stay spacious
  const baseOrbRadius = activeCount <= 4 ? 30 : activeCount <= 8 ? 25 : 21;

  const handleKeyDown = (e, node, idx) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectNode && onSelectNode(node);
    } else if (e.key === 'Escape' && depth > 0) {
      e.preventDefault();
      onZoomOut && onZoomOut();
    } else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && nodes.length > 0) {
      e.preventDefault();
      const next = nodes[(idx + 1) % nodes.length];
      onHoverNode && onHoverNode(next);
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && nodes.length > 0) {
      e.preventDefault();
      const prev = nodes[(idx - 1 + nodes.length) % nodes.length];
      onHoverNode && onHoverNode(prev);
    }
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto select-none">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`Harmonic mastery wheel showing ${activeCount} partitions at ${centerPct}% mastery`}
      >
        <defs>
          <radialGradient id={`core-mist-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7BB33B" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#7BB33B" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#7BB33B" stopOpacity="0" />
          </radialGradient>
          <filter id={`orb-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={`mist-blur-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {/* Quiet concentric orbital guides */}
        <circle
          cx={cx}
          cy={cy}
          r={maxOrbitRadius}
          fill="none"
          stroke="#111410"
          strokeOpacity="0.10"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        <circle
          cx={cx}
          cy={cy}
          r={112}
          fill="none"
          stroke="#111410"
          strokeOpacity="0.06"
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cy}
          r={hubRadius + 18}
          fill="none"
          stroke="#7BB33B"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="2 5"
        />

        {/* Breathing Center Atmosphere */}
        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={cx}
            cy={cy}
            r={hubRadius + 24}
            fill={`url(#core-mist-${uid})`}
            filter={`url(#mist-blur-${uid})`}
          />
          {motes.map((m) => (
            <circle
              key={m.id}
              cx={cx + m.x}
              cy={cy + m.y}
              r={m.r}
              fill="#7BB33B"
              fillOpacity={m.opacity}
            />
          ))}
        </g>

        {/* Emerging Harmonic Orbs */}
        {renderNodes.map((node) => {
          const p = node._presence;
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isFocus = isSelected || isHovered;
          const isEmpty = Boolean(node.isEmpty);

          // Emerge smoothly from hub toward orbital ring
          const targetOrbit =
            node.kind === 'OVERFLOW'
              ? maxOrbitRadius - 8
              : 108 + node._fillRatio * (maxOrbitRadius - 108) + node._driftOffset;
          const currentR = hubRadius * 0.45 + p * (targetOrbit - hubRadius * 0.45);
          const pos = polarToXY(cx, cy, currentR, node._angle);

          const orbR =
            (node.kind === 'OVERFLOW' ? baseOrbRadius * 0.88 : baseOrbRadius) *
            (0.45 + 0.55 * p) *
            (isFocus ? 1.09 : 1);

          // Expanding inner circle radius (area-true: R * sqrt(pct))
          const innerR = Math.max(0, orbR * Math.sqrt(node._fillRatio));
          const color = node.accentColor || '#7BB33B';
          const opacity = (isEmpty ? 0.34 : 1) * p;

          // Position label just outside the orb radially so labels never collide
          const labelAnchorPos = polarToXY(cx, cy, currentR + orbR + 15, node._angle);
          const displayLabel =
            node.kind === 'ROOT'
              ? node.label
              : node.shortLabel || node.label;

          return (
            <g
              key={node.id}
              style={{
                opacity,
                cursor: node._isExiting || isEmpty ? 'default' : 'pointer',
              }}
              tabIndex={node._isExiting || isEmpty ? -1 : 0}
              role="button"
              aria-label={`${node.label}: ${node.percentage}% mastery`}
              onMouseEnter={() => !node._isExiting && onHoverNode && onHoverNode(node)}
              onMouseLeave={() => onHoverNode && onHoverNode(null)}
              onFocus={() => !node._isExiting && onHoverNode && onHoverNode(node)}
              onClick={() => !node._isExiting && !isEmpty && onSelectNode && onSelectNode(node)}
              onKeyDown={(e) => {
                const idx = nodes.findIndex((n) => n.id === node.id);
                handleKeyDown(e, node, Math.max(0, idx));
              }}
            >
              {/* Delicate filament connecting orb back to center haze */}
              <line
                x1={cx}
                y1={cy}
                x2={pos.x}
                y2={pos.y}
                stroke={color}
                strokeWidth={isFocus ? 1.5 : 0.9}
                strokeOpacity={isFocus ? 0.48 : 0.2}
                strokeDasharray={node.kind === 'OVERFLOW' ? '3 3' : '2 4'}
              />

              {/* Soft outer aura */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={orbR * (isFocus ? 1.48 : 1.28)}
                fill={color}
                fillOpacity={isFocus ? 0.22 : 0.1}
                filter={`url(#orb-glow-${uid})`}
              />

              {/* Outer Target Circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={orbR}
                fill="#FAFBF8"
                fillOpacity="0.92"
                stroke={isFocus ? '#111410' : color}
                strokeWidth={isSelected ? 2.5 : isFocus ? 2 : 1.5}
                strokeDasharray={isEmpty || node.kind === 'OVERFLOW' ? '3 3' : undefined}
              />

              {/* Expanding Inner Circle (fills toward outer rim as mastery grows) */}
              {innerR > 0.5 && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={innerR}
                  fill={color}
                  fillOpacity={node._fillRatio >= 0.99 ? 0.82 : 0.5}
                />
              )}

              {/* Subtle center percentage or icon inside orb */}
              <text
                x={pos.x}
                y={pos.y + 3.5}
                textAnchor="middle"
                fontSize={orbR >= 26 ? '10.5' : '9.5'}
                fontWeight="800"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fill="#111410"
                style={{ pointerEvents: 'none' }}
              >
                {node.kind === 'OVERFLOW' ? node.label : `${node.percentage}%`}
              </text>

              {/* Radial outer label */}
              {p > 0.6 && node.kind !== 'OVERFLOW' && (
                <text
                  x={labelAnchorPos.x}
                  y={labelAnchorPos.y}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isFocus ? '800' : '600'}
                  fill={isFocus ? '#111410' : '#62685E'}
                  style={{ pointerEvents: 'none' }}
                >
                  {displayLabel.length > 15 ? `${displayLabel.slice(0, 14)}…` : displayLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* Center Hub (Overall Metric / Zoom Out trigger) */}
        <g
          onClick={() => depth > 0 && onZoomOut && onZoomOut()}
          style={{ cursor: depth > 0 ? 'pointer' : 'default' }}
          role={depth > 0 ? 'button' : undefined}
          tabIndex={depth > 0 ? 0 : undefined}
          aria-label={depth > 0 ? 'Zoom out to parent wheel' : `Overall ${centerPct}% mastery`}
          onKeyDown={(e) => {
            if (depth > 0 && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onZoomOut && onZoomOut();
            }
          }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={hubRadius}
            fill="#FFFFFF"
            fillOpacity="0.94"
            stroke="#111410"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
          <circle
            cx={cx}
            cy={cy}
            r={Math.max(0, (hubRadius - 4) * Math.sqrt(Math.max(0, Math.min(1, centerPct / 100))))}
            fill="#7BB33B"
            fillOpacity="0.18"
          />
          <text
            x={cx}
            y={depth > 0 ? cy - 2 : cy + 3}
            textAnchor="middle"
            fontSize="22"
            fontWeight="800"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fill="#111410"
          >
            {centerPct}%
          </text>
          <text
            x={cx}
            y={depth > 0 ? cy + 13 : cy + 18}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.08em"
            fill="#62685E"
          >
            {centerLabel}
          </text>
        </g>
      </svg>

      {/* Subtle Zoom-Out Pill below center when drilled in */}
      {depth > 0 && (
        <div className="flex justify-center -mt-2">
          <button
            type="button"
            onClick={onZoomOut}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 hover:bg-[#EDF5E5] border border-[#111410]/20 text-xs font-medium text-[#2F441E] shadow-soft-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zoom out</span>
          </button>
        </div>
      )}
    </div>
  );
}
