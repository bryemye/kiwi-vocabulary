import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpenCheck, 
  Highlighter, 
  Eraser, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle,
  Strikethrough,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logStudyAttempt } from '../services/api';

export default function ReadingView({ passages, onAttemptLogged }) {
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const passage = passages[currentPassageIndex] || null;
  const questions = passage?.questions || [];
  const currentQ = questions[currentQuestionIndex] || null;

  // Highlighting state: array of { id, start, end, text }
  const [highlights, setHighlights] = useState([]);
  const [selectionTooltip, setSelectionTooltip] = useState(null); // { start, end, text, x, y }

  // Question interaction state
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [eliminatedChoices, setEliminatedChoices] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [fontSize, setFontSize] = useState('base'); // 'sm' | 'base' | 'lg'

  const containerRef = useRef(null);

  // Exact storage key: passage_highlights_${passage.id}
  useEffect(() => {
    if (passage?.id) {
      try {
        const storageKey = `passage_highlights_${passage.id}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setHighlights(parsed);
          } else {
            setHighlights([]);
          }
        } else {
          setHighlights([]);
        }
      } catch (err) {
        console.error('Failed to load highlights from localStorage:', err);
        setHighlights([]);
      }
    } else {
      setHighlights([]);
    }
  }, [passage?.id]);

  // Reset question state ONLY on question or passage change (preserves highlights)
  useEffect(() => {
    setSelectedChoice(null);
    setEliminatedChoices(new Set());
    setSubmitted(false);
    setIsCorrect(false);
    setStartTime(Date.now());
  }, [currentQuestionIndex, currentPassageIndex]);

  // Range-cloned character offset calculation resilient to split DOM text nodes
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current || !passage) {
      setSelectionTooltip(null);
      return;
    }

    const range = selection.getRangeAt(0);

    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setSelectionTooltip(null);
      return;
    }

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(containerRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + range.toString().length;

    if (end <= start) {
      setSelectionTooltip(null);
      return;
    }

    const rawText = passage.body;
    const selectedText = rawText.slice(start, end);
    if (!selectedText.trim()) {
      setSelectionTooltip(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setSelectionTooltip({
      start,
      end,
      text: selectedText,
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 46,
    });
  };

  const applyHighlight = () => {
    if (!selectionTooltip || !passage?.id) return;

    const newHighlight = {
      id: `${Date.now()}_${selectionTooltip.start}`,
      start: selectionTooltip.start,
      end: selectionTooltip.end,
      text: selectionTooltip.text,
    };

    const nextHighlights = [...highlights, newHighlight];
    setHighlights(nextHighlights);

    try {
      localStorage.setItem(`passage_highlights_${passage.id}`, JSON.stringify(nextHighlights));
    } catch (err) {
      console.error('Failed to save highlights:', err);
    }

    setSelectionTooltip(null);
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  };

  const removeHighlight = (id) => {
    if (!passage?.id) return;
    const nextHighlights = highlights.filter((h) => h.id !== id);
    setHighlights(nextHighlights);
    try {
      localStorage.setItem(`passage_highlights_${passage.id}`, JSON.stringify(nextHighlights));
    } catch (err) {
      console.error('Failed to update highlights:', err);
    }
  };

  const clearHighlights = () => {
    setHighlights([]);
    setSelectionTooltip(null);
    if (passage?.id) {
      localStorage.removeItem(`passage_highlights_${passage.id}`);
    }
  };

  const toggleElimination = (choiceKey, e) => {
    e.stopPropagation();
    if (submitted) return;
    setEliminatedChoices((prev) => {
      const next = new Set(prev);
      if (next.has(choiceKey)) {
        next.delete(choiceKey);
      } else {
        next.add(choiceKey);
        if (selectedChoice === choiceKey) {
          setSelectedChoice(null);
        }
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedChoice || submitted || submitting || !currentQ) return;
    setSubmitting(true);

    const correct = selectedChoice === currentQ.correct_answer;
    setIsCorrect(correct);
    setSubmitted(true);

    const secondsSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      await logStudyAttempt({
        item_type: 'QUESTION',
        question_id: currentQ.id,
        is_correct: correct,
        seconds_spent: secondsSpent,
      });

      if (correct) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#7BB33B', '#84C341', '#42281D']
        });
      }

      if (onAttemptLogged) {
        onAttemptLogged();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQ = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrevQ = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      setCurrentQuestionIndex(questions.length - 1);
    }
  };

  /**
   * Render text with translucent Kiwi-lime wash (rgba(132, 195, 65, 0.35)) and underline
   */
  const renderPassageWithHighlights = () => {
    if (!passage || !passage.body) return null;
    const rawText = passage.body;

    const validHighlights = highlights
      .filter((h) => typeof h.start === 'number' && typeof h.end === 'number' && h.start < h.end && h.start >= 0 && h.end <= rawText.length)
      .sort((a, b) => a.start - b.start || a.end - b.end);

    const mergedSpans = [];
    for (const span of validHighlights) {
      if (mergedSpans.length === 0) {
        mergedSpans.push({ ...span });
      } else {
        const prev = mergedSpans[mergedSpans.length - 1];
        if (span.start <= prev.end) {
          prev.end = Math.max(prev.end, span.end);
          prev.text = rawText.slice(prev.start, prev.end);
        } else {
          mergedSpans.push({ ...span });
        }
      }
    }

    const elements = [];
    let cursor = 0;

    mergedSpans.forEach((span, idx) => {
      if (span.start > cursor) {
        elements.push(
          <React.Fragment key={`txt-${cursor}`}>
            {rawText.slice(cursor, span.start)}
          </React.Fragment>
        );
      }
      elements.push(
        <mark
          key={span.id || `mark-${span.start}-${idx}`}
          className="bg-[#84C341]/35 border-b-2 border-[#7BB33B] text-[#111410] font-medium px-0.5 cursor-pointer hover:bg-[#84C341]/50 transition"
          onClick={() => removeHighlight(span.id)}
          title="Click to remove Kiwi highlight"
        >
          {rawText.slice(span.start, span.end)}
        </mark>
      );
      cursor = span.end;
    });

    if (cursor < rawText.length) {
      elements.push(
        <React.Fragment key={`txt-end-${cursor}`}>
          {rawText.slice(cursor)}
        </React.Fragment>
      );
    }

    return elements;
  };

  if (!passage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <BookOpenCheck className="w-16 h-16 mx-auto text-[#42281D] mb-4" />
        <h3 className="text-xl font-bold font-mono text-[#111410] uppercase">No Reading Passages Available</h3>
      </div>
    );
  }

  const fontSizeClass = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
  }[fontSize];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-[#111410]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 bg-[#7BB33B] border-2 border-[#111410] flex items-center justify-center text-white text-xs font-mono font-bold">
              03
            </span>
            <h2 className="text-xl font-black text-[#111410] tracking-tight uppercase font-mono">
              Reading & Annotation Studio
            </h2>
          </div>
          <p className="text-xs font-mono text-[#62685E] mt-1 uppercase">
            Publication-Grade Split Grid with Kiwi-Lime Wash Highlighting
          </p>
        </div>

        {/* Toolbar: Text Size & Clear Highlights Button */}
        <div className="flex items-center space-x-3">
          {highlights.length > 0 && (
            <button
              onClick={clearHighlights}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EDF5E5] hover:bg-[#FAFBF8] text-xs font-mono font-bold text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition"
              title="Clear all saved highlights for this passage"
            >
              <Eraser className="w-3.5 h-3.5 text-[#7BB33B]" />
              <span>CLEAR HIGHLIGHTS ({highlights.length})</span>
            </button>
          )}

          <div className="flex items-center space-x-1 p-1 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-bold text-[#111410]">
            <span className="px-2 text-[#62685E]">FONT:</span>
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-0.5 border ${fontSize === 'sm' ? 'bg-[#111410] text-white border-[#111410]' : 'border-transparent hover:border-[#111410]'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-2 py-0.5 border ${fontSize === 'base' ? 'bg-[#111410] text-white border-[#111410]' : 'border-transparent hover:border-[#111410]'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-0.5 border ${fontSize === 'lg' ? 'bg-[#111410] text-white border-[#111410]' : 'border-transparent hover:border-[#111410]'}`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Split Layout with Crisp Vertical Dividing Rule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Pane: Reading Passage Container */}
        <div className="lg:col-span-7">
          <div className="relative bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-6 sm:p-8 overflow-y-auto max-h-[750px]">
            {/* Passage Header */}
            <div className="border-b-2 border-[#111410] pb-4 mb-6">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] inline-block mb-2">
                Digital SAT · Science & Neuroscience
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#111410] tracking-tight font-serif">
                {passage.title}
              </h1>
              <p className="text-xs font-mono text-[#62685E] mt-1 uppercase">
                SOURCE: {passage.author_or_source}
              </p>
            </div>

            {/* Container Element with full text content */}
            <div 
              ref={containerRef}
              onMouseUp={handleMouseUp}
              className={`relative whitespace-pre-wrap font-serif select-text text-[#111410] ${fontSizeClass}`}
            >
              {renderPassageWithHighlights()}
            </div>

            {/* Floating Highlight Action Tooltip upon selection */}
            {selectionTooltip && (
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.max(10, Math.min(selectionTooltip.x - 60, 480))}px`,
                  top: `${Math.max(10, selectionTooltip.y)}px`,
                }}
                className="z-30 flex items-center space-x-1.5 p-1 bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] animate-fade-in"
              >
                <button
                  onClick={applyHighlight}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#84C341] hover:bg-[#7BB33B] text-white border border-[#111410] text-xs font-mono font-black uppercase transition"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Highlight (Kiwi)</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono font-bold text-[#62685E] uppercase px-1">
            <span>Select text to wash with Kiwi Lime. Click highlighted text to remove.</span>
            <span className="text-[#2F441E] bg-[#EDF5E5] px-2 py-0.5 border border-[#111410]">
              {highlights.length} PERSISTENT HIGHLIGHTS
            </span>
          </div>
        </div>

        {/* Right Pane: Question, Choice Elimination & Submission */}
        <div className="lg:col-span-5 space-y-6">
          {currentQ ? (
            <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-6">
              {/* Question Navigation Bar */}
              <div className="flex items-center justify-between mb-5 border-b-2 border-[#111410] pb-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                  QUESTION {currentQuestionIndex + 1} / {questions.length}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={handlePrevQ}
                    className="p-1 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] transition"
                    title="Previous Question"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-1">
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-7 h-7 text-xs font-mono font-black uppercase border-2 border-[#111410] transition ${
                          currentQuestionIndex === idx
                            ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                            : 'bg-white text-[#111410] hover:bg-[#FAFBF8]'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleNextQ}
                    className="p-1 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] transition"
                    title="Next Question"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Prompt */}
              <h3 className="text-base font-bold text-[#111410] leading-snug mb-6 font-sans">
                {currentQ.prompt}
              </h3>

              {/* Choices with Elimination Strikethrough Mode */}
              <div className="space-y-3">
                {Object.entries(currentQ.choices || {}).map(([key, text]) => {
                  const isSelected = selectedChoice === key;
                  const isEliminated = eliminatedChoices.has(key);

                  let choiceStyle = 'bg-white border-2 border-[#111410] text-[#111410] hover:bg-[#FAFBF8] shadow-[2px_2px_0px_0px_#111410]';

                  if (isEliminated) {
                    choiceStyle = 'bg-[#FAFBF8] border-2 border-[#111410]/30 text-[#A8AAA6] opacity-50';
                  } else if (submitted) {
                    if (key === currentQ.correct_answer) {
                      choiceStyle = 'bg-[#7BB33B] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410]';
                    } else if (isSelected && !isCorrect) {
                      choiceStyle = 'bg-[#FDF2F2] text-[#991B1B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]';
                    } else {
                      choiceStyle = 'bg-[#FAFBF8] border-2 border-[#111410]/40 text-[#62685E] opacity-60';
                    }
                  } else if (isSelected) {
                    choiceStyle = 'bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]';
                  }

                  return (
                    <div
                      key={key}
                      onClick={() => !submitted && !isEliminated && setSelectedChoice(key)}
                      className={`group flex items-start space-x-3 p-3.5 border-2 text-sm transition-all duration-150 relative ${
                        !submitted && !isEliminated ? 'cursor-pointer active:translate-x-[1px] active:translate-y-[1px]' : ''
                      } ${choiceStyle}`}
                    >
                      {/* Monospaced Square Chip */}
                      <div
                        className={`w-7 h-7 flex items-center justify-center font-black font-mono text-xs shrink-0 border-2 border-[#111410] ${
                          isSelected || (submitted && key === currentQ.correct_answer)
                            ? 'bg-[#111410] text-white'
                            : 'bg-[#FAFBF8] text-[#111410]'
                        }`}
                      >
                        {key}
                      </div>

                      {/* Choice Text */}
                      <div className={`flex-1 pt-0.5 font-mono font-bold text-xs leading-snug ${isEliminated ? 'line-through text-[#A8AAA6]' : ''}`}>
                        {text}
                      </div>

                      {/* Elimination Strikethrough Toggle Button */}
                      {!submitted && (
                        <button
                          type="button"
                          onClick={(e) => toggleElimination(key, e)}
                          className={`p-1 text-xs font-mono border border-[#111410] transition shrink-0 ${
                            isEliminated
                              ? 'bg-[#42281D] text-white'
                              : 'bg-[#FAFBF8] text-[#111410] hover:bg-[#EFE8DF]'
                          }`}
                          title={isEliminated ? 'Restore Choice' : 'Eliminate Choice'}
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {submitted && key === currentQ.correct_answer && (
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit & Next Button */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t-2 border-[#111410]">
                <div className="text-xs font-mono font-bold uppercase text-[#62685E]">
                  {!submitted ? 'Eliminate or select choice.' : (isCorrect ? 'Status: Correct' : 'Status: Incorrect')}
                </div>
                <div className="flex items-center space-x-3">
                  {!submitted ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedChoice || submitting}
                      className="px-6 py-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-white font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#111410] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Verifying...' : 'Submit Choice'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQ}
                      className="flex items-center space-x-2 px-6 py-2.5 bg-[#111410] hover:bg-[#42281D] text-white font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] transition active:translate-x-[2px] active:translate-y-[2px]"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Passage Rationale */}
              {submitted && (
                <div className={`mt-5 p-4 border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] animate-fade-in ${
                  isCorrect ? 'bg-[#EDF5E5] text-[#2F441E]' : 'bg-[#FAFBF8] text-[#111410]'
                }`}>
                  <div className="flex items-center space-x-2 font-mono font-black text-xs uppercase mb-1.5 text-[#42281D]">
                    <HelpCircle className="w-3.5 h-3.5 text-[#7BB33B]" />
                    <span>Passage Rationale</span>
                  </div>
                  <p className="text-sm font-serif leading-relaxed text-[#111410]">{currentQ.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-8 text-center font-mono text-xs uppercase text-[#62685E]">
              No questions linked to this passage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
