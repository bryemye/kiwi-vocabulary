import React, { useMemo } from 'react';
import { extractExtraOrigins } from '../services/studySessionService';

const PRIMARY_ORIGINS = ['ALL', 'Latin', 'Greek'];

/**
 * Compact Origin filter control showing ALL | Latin | Greek + More Origins dropdown.
 */
export default function OriginFilterControl({
  selectedOrigin = 'ALL',
  onChange,
  roots = [],
  variant = 'bordered', // 'soft' | 'bordered'
  label = 'Origin:',
  uppercaseButtons = false,
}) {
  const extraOrigins = useMemo(() => extractExtraOrigins(roots), [roots]);

  const isPrimarySelected = PRIMARY_ORIGINS.some(
    (orig) => orig.toLowerCase() === String(selectedOrigin || 'ALL').toLowerCase()
  );
  const selectedExtraValue = isPrimarySelected ? '' : selectedOrigin;

  const isSoft = variant === 'soft';

  return (
    <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
      {label && (
        <span
          className={
            isSoft
              ? 'text-[10px] font-bold uppercase text-stone-400 mr-1 hidden sm:inline'
              : 'font-black uppercase text-[10px] text-[#62685E] mr-1 hidden sm:inline'
          }
        >
          {label}
        </span>
      )}

      {PRIMARY_ORIGINS.map((lang) => {
        const isActive =
          String(selectedOrigin || 'ALL').toLowerCase() === lang.toLowerCase();
        const displayLabel =
          lang === 'ALL' ? 'ALL' : uppercaseButtons ? lang.toUpperCase() : lang;

        return (
          <button
            key={lang}
            type="button"
            onClick={() => onChange && onChange(lang)}
            className={
              isSoft
                ? `px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                    isActive
                      ? 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]/40 shadow-soft-xs'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`
                : `px-2.5 py-1 border font-bold transition ${
                    uppercaseButtons ? 'uppercase' : ''
                  } ${
                    isActive
                      ? 'bg-[#111410] text-white border-[#111410]'
                      : 'bg-white text-[#111410] border-[#111410]/30 hover:border-[#111410]'
                  }`
            }
          >
            {displayLabel}
          </button>
        );
      })}

      {extraOrigins.length > 0 && (
        <select
          aria-label="More origins"
          value={selectedExtraValue}
          onChange={(e) => {
            const val = e.target.value;
            if (onChange) {
              onChange(val || 'ALL');
            }
          }}
          className={
            isSoft
              ? `px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer focus:outline-none ${
                  selectedExtraValue
                    ? 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]/40 shadow-soft-xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`
              : `px-2 py-1 border font-bold transition cursor-pointer focus:outline-none ${
                  uppercaseButtons ? 'uppercase' : ''
                } ${
                  selectedExtraValue
                    ? 'bg-[#7BB33B] text-white border-[#111410]'
                    : 'bg-white text-[#111410] border-[#111410]/30 hover:border-[#111410]'
                }`
          }
        >
          <option value="">More Origins ▾</option>
          {extraOrigins.map((orig) => (
            <option key={orig.value} value={orig.value} className="bg-white text-[#111410]">
              {orig.label} ({orig.count})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
