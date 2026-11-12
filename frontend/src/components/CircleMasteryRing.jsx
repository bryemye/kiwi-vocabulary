import React from 'react';

/**
 * CircleMasteryRing: Precision SVG radial mastery gauge.
 * 
 * Displays an outlined circle track that fills in with Kiwi green
 * as the student gains expertise.
 */
export default function CircleMasteryRing({
  percentage = 0,
  size = 56,
  strokeWidth = 5,
  trackColor = '#EFE8DF',
  strokeColor = '#7BB33B',
  completeColor = '#2F441E',
  borderOutline = true,
  children,
  className = '',
  title,
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage || 0)));
  const isComplete = clamped >= 100;

  const center = size / 2;
  const radius = center - strokeWidth - (borderOutline ? 2 : 0);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const activeColor = isComplete ? completeColor : strokeColor;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={title || `${clamped}% Mastery`}
      aria-label={`${clamped}% mastery`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] transform"
      >
        {/* Outer decorative ink border */}
        {borderOutline && (
          <circle
            cx={center}
            cy={center}
            r={center - 1}
            fill="none"
            stroke="#111410"
            strokeWidth="1.5"
          />
        )}

        {/* Background Track (Outlined circle channel) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Filled Expertise Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Inner boundary ring for neo-brutalist depth */}
        {borderOutline && radius > strokeWidth && (
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 - 1}
            fill="none"
            stroke="#111410"
            strokeWidth="1"
            strokeOpacity="0.2"
          />
        )}
      </svg>

      {/* Center content or slot */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}
