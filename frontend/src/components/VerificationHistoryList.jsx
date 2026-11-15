import React, { useState } from 'react';
import { Check, X, Edit3, ShieldCheck, Clock } from 'lucide-react';
import {
  formatVerificationTimestamp,
  formatRelativeTimestamp,
} from '../services/editorialService';

const ACTION_META = {
  verified: {
    label: 'Verified',
    badgeClass: 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]',
    Icon: Check,
  },
  edited_and_verified: {
    label: 'Edited & Verified',
    badgeClass: 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]',
    Icon: Edit3,
  },
  unverified: {
    label: 'Unverified',
    badgeClass: 'bg-[#FDF2F2] text-[#991B1B] border-[#DC2626]/50',
    Icon: X,
  },
  attestation_updated: {
    label: 'Attestation Updated',
    badgeClass: 'bg-[#FAFBF8] text-[#111410] border-[#111410]/40',
    Icon: ShieldCheck,
  },
};

export function getActionMeta(action) {
  return (
    ACTION_META[action] || {
      label: String(action || 'Updated').replace(/_/g, ' '),
      badgeClass: 'bg-[#FAFBF8] text-[#111410] border-[#111410]/40',
      Icon: Clock,
    }
  );
}

export default function VerificationHistoryList({
  entries = [],
  showWord = false,
  onSelectWord = null,
  compact = false,
  initialLimit = null,
  emptyMessage = 'No verification history recorded yet.',
}) {
  const [expanded, setExpanded] = useState(false);

  if (!entries || entries.length === 0) {
    return (
      <div className={`text-center font-mono text-[#62685E] italic ${compact ? 'py-2 text-[10px]' : 'py-6 text-xs'}`}>
        {emptyMessage}
      </div>
    );
  }

  const hasMore = initialLimit && entries.length > initialLimit && !expanded;
  const visibleEntries = hasMore ? entries.slice(0, initialLimit) : entries;

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {visibleEntries.map((entry, idx) => {
        const meta = getActionMeta(entry.action);
        const ActionIcon = meta.Icon;
        const formattedTime = formatVerificationTimestamp(entry.timestamp);
        const relativeTime = formatRelativeTimestamp(entry.timestamp);

        return (
          <div
            key={entry.id || `${entry.timestamp}-${idx}`}
            className={`bg-white border border-[#111410]/25 ${
              compact ? 'p-2 text-[10px]' : 'p-2.5 sm:p-3 text-xs'
            } font-mono transition`}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {showWord && entry.word && (
                  onSelectWord ? (
                    <button
                      type="button"
                      onClick={() => onSelectWord(entry.word)}
                      className="px-1.5 py-0.5 bg-[#111410] hover:bg-[#7BB33B] text-white font-black uppercase text-[10px] tracking-wide transition cursor-pointer"
                      title={`Open "${entry.word}" in reviewer`}
                    >
                      {entry.word}
                    </button>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-[#111410] text-white font-black uppercase text-[10px] tracking-wide">
                      {entry.word}
                    </span>
                  )
                )}

                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 border font-black uppercase ${
                    compact ? 'text-[9px]' : 'text-[10px]'
                  } ${meta.badgeClass}`}
                >
                  <ActionIcon className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                  <span>{meta.label}</span>
                </span>

                <span className="text-[#62685E] text-[10px]">
                  by <strong className="text-[#111410]">{entry.by || 'Admin'}</strong>
                </span>
              </div>

              <div
                className="flex items-center gap-1.5 text-[#62685E] text-[10px] shrink-0"
                title={entry.timestamp}
              >
                <Clock className="w-3 h-3 text-[#7BB33B]" />
                <span className="text-[#111410] font-bold">{formattedTime}</span>
                {relativeTime && (
                  <span className="text-[#62685E] hidden sm:inline">({relativeTime})</span>
                )}
              </div>
            </div>

            {entry.summary && (
              <div className={`text-[#111410] font-sans ${compact ? 'mt-1 text-[10px]' : 'mt-1.5 text-[11px]'}`}>
                {entry.summary}
              </div>
            )}

            {entry.notes && (
              <div
                className={`bg-[#FAFBF8] border-l-2 border-[#7BB33B] text-[#62685E] font-sans italic ${
                  compact ? 'mt-1 px-2 py-1 text-[10px]' : 'mt-1.5 px-2.5 py-1.5 text-[11px]'
                }`}
              >
                &ldquo;{entry.notes}&rdquo;
              </div>
            )}
          </div>
        );
      })}

      {initialLimit && entries.length > initialLimit && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full py-1 text-[10px] font-mono font-bold uppercase text-[#2F441E] bg-[#EDF5E5] hover:bg-[#DCEDD0] border border-[#7BB33B] transition"
        >
          {expanded
            ? 'Show fewer events'
            : `Show all ${entries.length} verification events`}
        </button>
      )}
    </div>
  );
}
