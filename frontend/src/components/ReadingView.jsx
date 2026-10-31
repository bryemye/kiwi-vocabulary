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
  Sparkles,
  Type,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logStudyAttempt } from '../services/api';

export default function ReadingView({ passages, onAttemptLogged }) {
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Highlighting state: array of highlighted text snippets
  const [highlights, setHighlights] = useState([]);
  const [selectionTooltip, setSelectionTooltip] = useState(null); // { text, x, y }

  // Question interaction state
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [eliminatedChoices, setEliminatedChoices] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [fontSize, setFontSize] = useState('base'); // 'sm' | 'base' | 'lg'

  const passageRef = useRef(null);

  const passage = passages[currentPassageIndex] || null;
  const questions = passage?.questions || [];
  const currentQ = questions[currentQuestionIndex] || null;

  // Reset question state on question change
  useEffect(() => {
    setSelectedChoice(null);
    setEliminatedChoices(new Set());
    setSubmitted(false);
    setIsCorrect(false);
    setStartTime(Date.now());
  }, [currentQuestionIndex, currentPassageIndex]);

  // Handle text selection for yellow highlighting
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !passageRef.current) {
      setSelectionTooltip(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 2) {
      setSelectionTooltip(null);
      return;
    }

    // Verify selection is within the passage container
    const range = selection.getRangeAt(0);
    if (!passageRef.current.contains(range.commonAncestorContainer)) {
      setSelectionTooltip(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = passageRef.current.getBoundingClientRect();

    setSelectionTooltip({
      text: selectedText,
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 42,
    });
  };

  const applyHighlight = () => {
    if (!selectionTooltip) return;
    const newHighlight = {
      id: Date.now(),
      text: selectionTooltip.text,
    };
    setHighlights((prev) => [...prev, newHighlight]);
    setSelectionTooltip(null);
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  };

  const clearHighlights = () => {
    setHighlights([]);
    setSelectionTooltip(null);
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
        question: currentQ.id,
        is_correct: correct,
        seconds_spent: secondsSpent,
      });

      if (correct) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#10b981', '#f59e0b']
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

  // Render text with highlights
  const renderHighlightedParagraph = (paragraphText) => {
    if (!highlights || highlights.length === 0) {
      return paragraphText;
    }

    // Sort highlights by length descending to match larger spans first
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    let parts = [paragraphText];

    sortedHighlights.forEach((hl) => {
      const newParts = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          const splitParts = part.split(hl.text);
          for (let i = 0; i < splitParts.length; i++) {
            newParts.push(splitParts[i]);
            if (i < splitParts.length - 1) {
              newParts.push(
                <mark
                  key={`${hl.id}-${i}`}
                  className="bg-amber-300 text-slate-950 font-medium px-0.5 rounded shadow-sm selection:bg-amber-400"
                >
                  {hl.text}
                </mark>
              );
            }
          }
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts;
  };

  if (!passage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <BookOpenCheck className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-200">No Reading Passages Available</h3>
      </div>
    );
  }

  // Split passage body into paragraphs
  const paragraphs = passage.body.split('\n\n');

  const fontSizeClass = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose'
  }[fontSize];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BookOpen className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Reading & Text Annotation Lab</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Dual-pane Digital SAT simulation with live text highlighter and option elimination.
          </p>
        </div>

        {/* Toolbar: Text Size & Clear Highlights */}
        <div className="flex items-center space-x-3">
          {highlights.length > 0 && (
            <button
              onClick={clearHighlights}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 border border-slate-700 transition"
              title="Remove all active highlights"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Clear Highlights ({highlights.length})</span>
            </button>
          )}

          <div className="flex items-center space-x-1 p-1 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="px-2 text-slate-400 font-mono">Font:</span>
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded font-medium ${fontSize === 'sm' ? 'bg-sky-500 text-white' : 'hover:text-white'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-2 py-1 rounded font-medium ${fontSize === 'base' ? 'bg-sky-500 text-white' : 'hover:text-white'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded font-medium ${fontSize === 'lg' ? 'bg-sky-500 text-white' : 'hover:text-white'}`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Pane: Reading Passage & Highlighting */}
        <div className="lg:col-span-7">
          <div 
            ref={passageRef}
            onMouseUp={handleMouseUp}
            className="relative bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl overflow-y-auto max-h-[750px]"
          >
            {/* Passage Header */}
            <div className="border-b border-slate-800 pb-4 mb-6">
              <span className="text-xs uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block mb-2">
                SAT Reading · Literature & Science
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif">
                {passage.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1 italic">
                Source: {passage.author_or_source}
              </p>
            </div>

            {/* Passage Text with Highlighting */}
            <div className={`space-y-5 text-slate-200 font-serif ${fontSizeClass}`}>
              {paragraphs.map((pText, idx) => (
                <div key={idx} className="relative pl-7 group">
                  <span className="absolute left-0 top-0 text-slate-400 group-hover:text-sky-400 text-xs font-mono select-none transition">
                    [{idx + 1}]
                  </span>
                  <p>{renderHighlightedParagraph(pText)}</p>
                </div>
              ))}
            </div>

            {/* Floating Highlight Tooltip upon text selection */}
            {selectionTooltip && (
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.max(10, Math.min(selectionTooltip.x - 60, 480))}px`,
                  top: `${Math.max(10, selectionTooltip.y)}px`,
                }}
                className="z-30 flex items-center space-x-1.5 p-1 bg-slate-950 border border-amber-400/80 rounded-xl shadow-2xl animate-fade-in"
              >
                <button
                  onClick={applyHighlight}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition shadow"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Highlight Text</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Tip: Select any passage text to trigger the highlighter.</span>
            <span>{highlights.length} active annotations</span>
          </div>
        </div>

        {/* Right Pane: Question, Choice Elimination & Submission */}
        <div className="lg:col-span-5 space-y-6">
          {currentQ ? (
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
              {/* Question Navigation Bar */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handlePrevQ}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Previous Question"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-1">
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-6 h-6 rounded-md text-xs font-mono font-semibold transition ${
                          currentQuestionIndex === idx
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleNextQ}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Next Question"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Prompt */}
              <h3 className="text-base font-semibold text-white leading-relaxed mb-6">
                {currentQ.prompt}
              </h3>

              {/* Choices with Elimination Strikethrough Mode */}
              <div className="space-y-3">
                {Object.entries(currentQ.choices || {}).map(([key, text]) => {
                  const isSelected = selectedChoice === key;
                  const isEliminated = eliminatedChoices.has(key);

                  let choiceStyle = 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700';

                  if (isEliminated) {
                    choiceStyle = 'bg-slate-950/30 border-slate-900/60 text-slate-400 opacity-50';
                  } else if (submitted) {
                    if (key === currentQ.correct_answer) {
                      choiceStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-500/10';
                    } else if (isSelected && !isCorrect) {
                      choiceStyle = 'bg-rose-500/15 border-rose-500 text-rose-200';
                    } else {
                      choiceStyle = 'bg-slate-950/40 border-slate-900 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    choiceStyle = 'bg-sky-500/15 border-sky-500 text-sky-200 shadow-sm shadow-sky-500/10';
                  }

                  return (
                    <div
                      key={key}
                      onClick={() => !submitted && !isEliminated && setSelectedChoice(key)}
                      className={`group flex items-start space-x-3 p-3.5 rounded-xl border text-sm transition-all duration-150 relative ${
                        !submitted && !isEliminated ? 'cursor-pointer active:scale-[0.99]' : ''
                      } ${choiceStyle}`}
                    >
                      {/* Letter badge */}
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 transition ${
                          isSelected || (submitted && key === currentQ.correct_answer)
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {key}
                      </div>

                      {/* Choice Text */}
                      <div className={`flex-1 pt-0.5 font-medium leading-snug ${isEliminated ? 'line-through text-slate-400' : ''}`}>
                        {text}
                      </div>

                      {/* Elimination Strikethrough Toggle Button */}
                      {!submitted && (
                        <button
                          type="button"
                          onClick={(e) => toggleElimination(key, e)}
                          className={`p-1.5 rounded-md text-xs font-mono transition shrink-0 ${
                            isEliminated
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                          title={isEliminated ? 'Restore Choice' : 'Eliminate Choice'}
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {submitted && key === currentQ.correct_answer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit & Next Button */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  {!submitted ? 'Eliminate or select your choice.' : (isCorrect ? 'Correct!' : 'Incorrect.')}
                </div>
                <div className="flex items-center space-x-3">
                  {!submitted ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedChoice || submitting}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-sky-500/20 transition active:scale-95"
                    >
                      {submitting ? 'Verifying...' : 'Submit Choice'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQ}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition active:scale-95"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Solution & Explanation */}
              {submitted && (
                <div className={`mt-5 p-4 rounded-xl border text-sm leading-relaxed animate-fade-in ${
                  isCorrect 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
                    : 'bg-slate-950/80 border-amber-500/30 text-slate-300'
                }`}>
                  <div className="flex items-center space-x-2 font-bold mb-1.5 text-xs uppercase tracking-wider text-amber-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Passage Rationale</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm font-sans">{currentQ.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center text-slate-400">
              No questions linked to this passage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
