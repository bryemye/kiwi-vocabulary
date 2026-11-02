import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Check, 
  X, 
  Keyboard, 
  Sparkles,
  FileCheck,
  Edit3,
  Search
} from 'lucide-react';
import { exportUpdatedLexiconJson, countVerifiedWords } from '../services/editorialService';
import EditorialReviewModal from './EditorialReviewModal';

export default function AdminReviewBar({ 
  isAdminMode, 
  onToggleAdminMode, 
  words = [], 
  roots = [],
  onUpdateWordReview
}) {
  const [exportNotice, setExportNotice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWordToEdit, setSelectedWordToEdit] = useState('');

  if (!isAdminMode) return null;

  const verifiedCount = countVerifiedWords(words);
  const totalCount = words.length || 0;
  const verifiedPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
  const unreviewedCount = totalCount - verifiedCount;

  const handleExport = () => {
    const result = exportUpdatedLexiconJson(roots, words);
    setExportNotice(`Exported sat_vocab_seed.json with ${result.totalVerified} verified word attestations!`);
    setTimeout(() => {
      setExportNotice(null);
    }, 4500);
  };

  const handleOpenReviewModal = (wordName = null) => {
    setSelectedWordToEdit(wordName || 'intermittent');
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-[#111410] text-white border-b-2 border-[#111410] px-4 py-2 text-xs font-mono transition-all z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          
          {/* Left: Status & Certified Counts */}
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#7BB33B] text-[#111410] font-black uppercase tracking-wider border border-white">
              <ShieldCheck className="w-3.5 h-3.5 text-[#111410]" />
              <span>EDITORIAL REVIEW MODE</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-300">
              <span>
                Verified: <strong className="text-white">{verifiedCount}</strong> / {totalCount}
              </span>
              <span className="text-[#7BB33B] font-bold">({verifiedPercent}%)</span>
            </div>

            {/* Quick Word Select Dropdown */}
            {words.length > 0 && (
              <div className="flex items-center space-x-1">
                <select
                  value={selectedWordToEdit || 'intermittent'}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setSelectedWordToEdit(chosen);
                    handleOpenReviewModal(chosen);
                  }}
                  className="bg-black/60 border border-white/30 text-white text-[11px] font-mono px-2 py-0.5 rounded-none focus:outline-none focus:ring-1 focus:ring-[#7BB33B] cursor-pointer"
                  title="Select a vocabulary word to review"
                >
                  <option value="" disabled>-- Select word to edit --</option>
                  {words.map(w => (
                    <option key={w.word} value={w.word} className="bg-[#111410] text-white">
                      {w.word} {w.review?.verified ? '✓' : '(unreviewed)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {exportNotice && (
              <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] font-bold border border-[#7BB33B] animate-fade-in text-[11px]">
                <FileCheck className="w-3 h-3 text-[#7BB33B]" />
                <span>{exportNotice}</span>
              </div>
            )}
          </div>

          {/* Right: Actions, Editor Button, and Export */}
          <div className="flex items-center space-x-2 flex-wrap">
            {/* Primary Action: Open Full Lexicon Reviewer Modal */}
            <button
              onClick={() => handleOpenReviewModal(selectedWordToEdit || 'intermittent')}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#7BB33B] hover:bg-[#84C341] text-white font-bold uppercase transition active:translate-x-[1px] active:translate-y-[1px] border border-white shadow-[2px_2px_0px_0px_#FFFFFF]"
              title="Open full interactive Lexicon Reviewer panel to edit and verify entries"
            >
              <Edit3 className="w-3.5 h-3.5 text-white" />
              <span>Review / Edit Words</span>
              {unreviewedCount > 0 && (
                <span className="ml-1 px-1 py-0.2 bg-[#111410] text-white text-[9px] rounded font-black">
                  {unreviewedCount} unreviewed
                </span>
              )}
            </button>

            {/* Export Updated Lexicon JSON button */}
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-[#FAFBF8] text-[#111410] font-bold uppercase transition active:translate-x-[1px] active:translate-y-[1px] border border-white shadow-[2px_2px_0px_0px_#7BB33B]"
              title="Download full dataset with verified flags & notes matching sat_vocab_seed.json"
            >
              <Download className="w-3.5 h-3.5 text-[#7BB33B]" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <div className="hidden lg:flex items-center space-x-1 text-gray-400 text-[10px]" title="Keyboard shortcut">
              <Keyboard className="w-3 h-3" />
              <span><code className="bg-white/10 px-1 py-0.5 rounded text-white font-bold">Ctrl+Shift+E</code></span>
            </div>

            {/* Close / Exit Review Mode */}
            <button
              onClick={onToggleAdminMode}
              className="p-1 hover:bg-white/10 text-gray-300 hover:text-white transition"
              title="Exit Reviewer Mode (Ctrl+Shift+E)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Global Interactive Editorial Reviewer Modal */}
      <EditorialReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        words={words}
        roots={roots}
        initialWord={selectedWordToEdit || 'intermittent'}
        onSaveReview={onUpdateWordReview}
      />
    </>
  );
}
