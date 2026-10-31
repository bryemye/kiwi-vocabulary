import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LineChart, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  RotateCcw,
  Sparkles,
  Target,
  Maximize2,
  Crosshair,
  Sliders,
  AlertTriangle,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logStudyAttempt } from '../services/api';

/**
 * Coordinate Plane SVG Plotter with Live Interactive Expression Evaluator
 */
function CoordinatePlane({ config, activeFormula, isFormulaValid }) {
  const svgRef = useRef(null);
  const [hoverCoord, setHoverCoord] = useState(null);

  if (!config) return null;

  const domain = config.domain || [-6, 6];
  const range = config.range || [-6, 6];
  const gridStep = config.gridStep || 1;

  const width = 500;
  const height = 450;
  const padding = 36;

  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  // Coordinate transforms
  const toSvgX = (x) => padding + ((x - domain[0]) / (domain[1] - domain[0])) * plotWidth;
  const toSvgY = (y) => height - padding - ((y - range[0]) / (range[1] - range[0])) * plotHeight;

  const toMathX = (svgX) => domain[0] + ((svgX - padding) / plotWidth) * (domain[1] - domain[0]);
  const toMathY = (svgY) => range[0] + ((height - padding - svgY) / plotHeight) * (range[1] - range[0]);

  // Safe function evaluator with robust syntax handling
  const evalFn = (fnStr, x) => {
    try {
      if (!fnStr || typeof fnStr !== 'string' || !fnStr.trim()) return NaN;
      // Normalize common algebraic shorthand
      const sanitized = fnStr
        .replace(/\^/g, '**')
        .replace(/Math\.abs/g, 'abs')
        .replace(/abs\(([^)]+)\)/g, 'Math.abs($1)')
        .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
        .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)')
        .replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');

      // Security disallow unsafe browser identifiers
      if (/(window|document|eval|Function|fetch|prototype|__proto__|import)/i.test(sanitized)) {
        return NaN;
      }

      const f = new Function('x', 'Math', `with(Math) { return (${sanitized}); }`);
      const val = f(x, Math);
      return typeof val === 'number' && isFinite(val) ? val : NaN;
    } catch (e) {
      return NaN;
    }
  };

  // Generate SVG path for a function string
  const generatePath = (fnStr) => {
    if (!fnStr) return '';
    const points = [];
    const step = (domain[1] - domain[0]) / 250;
    for (let x = domain[0]; x <= domain[1]; x += step) {
      const y = evalFn(fnStr, x);
      if (!isNaN(y) && isFinite(y)) {
        // Clamp slightly beyond range for clean edge clipping
        if (y >= range[0] - 2 && y <= range[1] + 2) {
          points.push(`${toSvgX(x)},${toSvgY(y)}`);
        }
      }
    }
    if (points.length === 0) return '';
    return 'M ' + points.join(' L ');
  };

  // Generate grid ticks
  const xTicks = [];
  for (let x = Math.ceil(domain[0]); x <= Math.floor(domain[1]); x += gridStep) {
    if (x !== 0) xTicks.push(x);
  }

  const yTicks = [];
  for (let y = Math.ceil(range[0]); y <= Math.floor(range[1]); y += gridStep) {
    if (y !== 0) yTicks.push(y);
  }

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const svgY = ((e.clientY - rect.top) / rect.height) * height;

    if (svgX >= padding && svgX <= width - padding && svgY >= padding && svgY <= height - padding) {
      const mathX = Number(toMathX(svgX).toFixed(1));
      const mathY = Number(toMathY(svgY).toFixed(1));
      
      // Calculate curve's corresponding Y value at this mathX
      const curveY = activeFormula ? evalFn(activeFormula, mathX) : NaN;
      const formattedCurveY = !isNaN(curveY) && isFinite(curveY) ? Number(curveY.toFixed(2)) : null;

      setHoverCoord({ svgX, svgY, mathX, mathY, curveY: formattedCurveY });
    } else {
      setHoverCoord(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
  };

  const originX = toSvgX(0);
  const originY = toSvgY(0);

  return (
    <div className="relative w-full bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-xl overflow-hidden select-none">
      {/* Title & Legend Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isFormulaValid ? 'bg-sky-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-mono font-semibold text-sky-300">
            {config.displayEquation || 'Graph Visualization'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
          <Crosshair className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {hoverCoord 
              ? `Cursor: (${hoverCoord.mathX}, ${hoverCoord.mathY})${hoverCoord.curveY !== null ? ` · f(x)=${hoverCoord.curveY}` : ''}`
              : 'Hover to inspect coordinates'}
          </span>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Arrowheads for axes */}
          <marker id="arrow-x" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
          </marker>
          <marker id="arrow-y" viewBox="0 0 10 10" refX="5" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 1.5 8 L 5 0 L 8.5 8 z" fill="#64748b" />
          </marker>
          {/* Clip path to bound curves within grid */}
          <clipPath id="plot-area">
            <rect x={padding} y={padding} width={plotWidth} height={plotHeight} />
          </clipPath>
        </defs>

        {/* Background plot rect */}
        <rect
          x={padding}
          y={padding}
          width={plotWidth}
          height={plotHeight}
          fill="#090d16"
          rx="6"
        />

        {/* Gridlines */}
        {xTicks.map((x) => (
          <line
            key={`grid-x-${x}`}
            x1={toSvgX(x)}
            y1={padding}
            x2={toSvgX(x)}
            y2={height - padding}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray={x % 2 === 0 ? "none" : "2,2"}
          />
        ))}

        {yTicks.map((y) => (
          <line
            key={`grid-y-${y}`}
            x1={padding}
            y1={toSvgY(y)}
            x2={width - padding}
            y2={toSvgY(y)}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray={y % 2 === 0 ? "none" : "2,2"}
          />
        ))}

        {/* Primary Axes: X and Y */}
        <line
          x1={padding - 10}
          y1={originY}
          x2={width - padding + 14}
          y2={originY}
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow-x)"
        />
        <text
          x={width - padding + 16}
          y={originY + 4}
          fill="#94a3b8"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
        >
          x
        </text>

        <line
          x1={originX}
          y1={height - padding + 10}
          x2={originX}
          y2={padding - 14}
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow-y)"
        />
        <text
          x={originX - 4}
          y={padding - 18}
          fill="#94a3b8"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
        >
          y
        </text>

        {/* Origin '0' */}
        <text
          x={originX - 10}
          y={originY + 14}
          fill="#64748b"
          fontSize="10"
          fontFamily="monospace"
        >
          0
        </text>

        {/* Axis Number Ticks */}
        {xTicks.map((x) => (
          <g key={`tick-x-${x}`}>
            <line
              x1={toSvgX(x)}
              y1={originY - 3}
              x2={toSvgX(x)}
              y2={originY + 3}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {x % 2 === 0 && (
              <text
                x={toSvgX(x)}
                y={originY + 14}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {x}
              </text>
            )}
          </g>
        ))}

        {yTicks.map((y) => (
          <g key={`tick-y-${y}`}>
            <line
              x1={originX - 3}
              y1={toSvgY(y)}
              x2={originX + 3}
              y2={toSvgY(y)}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {y % 2 === 0 && (
              <text
                x={originX - 8}
                y={toSvgY(y) + 3}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                {y}
              </text>
            )}
          </g>
        ))}

        {/* Curves & Functions (Clipped) */}
        <g clipPath="url(#plot-area)">
          {/* Active Formula Curve (Controlled in real-time by formula input) */}
          {activeFormula && isFormulaValid && (
            <path
              d={generatePath(activeFormula)}
              fill="none"
              stroke={config.color || '#38bdf8'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* If system of equations, render second line if present */}
          {config.type === 'system' && config.lines && config.lines.length > 1 && (
            <path
              d={generatePath(config.lines[1].fn)}
              fill="none"
              stroke={config.lines[1].color || '#f43f5e'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Key Points */}
          {config.keyPoints && config.keyPoints.map((pt, idx) => {
            const px = toSvgX(pt.x);
            const py = toSvgY(pt.y);
            const ptColor = pt.color || '#10b981';
            return (
              <g key={`keypoint-${idx}`}>
                <circle cx={px} cy={py} r="8" fill={ptColor} opacity="0.25" className="animate-ping" />
                <circle cx={px} cy={py} r="5" fill={ptColor} stroke="#ffffff" strokeWidth="1.5" />
                {pt.label && (
                  <g>
                    <rect
                      x={px + 8}
                      y={py - 18}
                      width={pt.label.length * 6.5 + 8}
                      height="18"
                      rx="4"
                      fill="#0f172a"
                      stroke={ptColor}
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <text
                      x={px + 12}
                      y={py - 5}
                      fill="#f8fafc"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {pt.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Interactive Crosshair when hovering */}
          {hoverCoord && (
            <g>
              <line
                x1={hoverCoord.svgX}
                y1={padding}
                x2={hoverCoord.svgX}
                y2={height - padding}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.7"
              />
              <line
                x1={padding}
                y1={hoverCoord.svgY}
                x2={width - padding}
                y2={hoverCoord.svgY}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.7"
              />
              <circle
                cx={hoverCoord.svgX}
                cy={hoverCoord.svgY}
                r="4"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

export default function MathView({ questions, onAttemptLogged }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const currentQ = questions[currentIndex] || null;

  // Extract the baseline formula from graph_config
  const baselineFormula = useMemo(() => {
    if (!currentQ?.graph_config) return '';
    if (currentQ.graph_config.fn) return currentQ.graph_config.fn;
    if (currentQ.graph_config.lines && currentQ.graph_config.lines.length > 0) {
      return currentQ.graph_config.lines[0].fn;
    }
    return '';
  }, [currentQ]);

  // Interactive formula editor state
  const [customFormula, setCustomFormula] = useState(baselineFormula);

  // Sync formula when current question changes
  useEffect(() => {
    setCustomFormula(baselineFormula);
  }, [baselineFormula, currentIndex]);

  // Check validity of formula without throwing
  const isFormulaValid = useMemo(() => {
    if (!customFormula || !customFormula.trim()) return false;
    try {
      const sanitized = customFormula
        .replace(/\^/g, '**')
        .replace(/Math\.abs/g, 'abs')
        .replace(/abs\(([^)]+)\)/g, 'Math.abs($1)')
        .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
        .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)');

      if (/(window|document|eval|Function|fetch|prototype|__proto__|import)/i.test(sanitized)) {
        return false;
      }

      const f = new Function('x', 'Math', `with(Math) { return (${sanitized}); }`);
      const val = f(1, Math);
      return typeof val === 'number' && !isNaN(val);
    } catch (e) {
      return false;
    }
  }, [customFormula]);

  const isModified = customFormula.trim() !== baselineFormula.trim();

  const handleResetFormula = () => {
    setCustomFormula(baselineFormula);
  };

  useEffect(() => {
    setSelectedChoice(null);
    setSubmitted(false);
    setIsCorrect(false);
    setStartTime(Date.now());
  }, [currentIndex]);

  const handleSubmit = async () => {
    if (!selectedChoice || submitted || submitting) return;
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
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#10b981', '#a855f7']
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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(questions.length - 1);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <LineChart className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-200">No Math Questions Loaded</h3>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <LineChart className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Math Coordinate & Function Lab</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Analyze curves, coordinate intercepts, and test dynamic coefficient shifts on the interactive plane.
          </p>
        </div>

        {/* Question Selector & Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Previous Question"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-1">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition ${
                  currentIndex === idx
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Next Question"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Question Prompt, Formula expression, Choices */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
            {/* Section badge & question numbering */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Digital SAT · Math Practice
              </span>
              <span className="text-xs font-mono text-slate-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Formula Expression Highlight Pill */}
            {currentQ.graph_config?.displayEquation && (
              <div className="mb-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-sm font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Original Equation: <strong>{currentQ.graph_config.displayEquation}</strong></span>
              </div>
            )}

            {/* Prompt text */}
            <h3 className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed mb-6">
              {currentQ.prompt}
            </h3>

            {/* Choices list A, B, C, D */}
            <div className="space-y-3">
              {Object.entries(currentQ.choices || {}).map(([key, text]) => {
                const isSelected = selectedChoice === key;
                let choiceStyle = 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/40';

                if (submitted) {
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
                    onClick={() => !submitted && setSelectedChoice(key)}
                    className={`flex items-start space-x-3.5 p-4 rounded-xl border text-sm transition-all duration-150 ${
                      !submitted ? 'cursor-pointer active:scale-[0.99]' : ''
                    } ${choiceStyle}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 transition ${
                        isSelected || (submitted && key === currentQ.correct_answer)
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {key}
                    </div>
                    <div className="flex-1 pt-0.5 font-medium">{text}</div>
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

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {!submitted ? 'Select an answer above and submit.' : (isCorrect ? 'Correct response!' : 'Incorrect response.')}
              </div>
              <div className="flex items-center space-x-3">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedChoice || submitting}
                    className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-sky-500/20 transition active:scale-95"
                  >
                    {submitting ? 'Verifying...' : 'Submit Answer'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition active:scale-95"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Explanation Banner (when submitted) */}
          {submitted && (
            <div className={`p-5 rounded-2xl border text-sm leading-relaxed animate-fade-in ${
              isCorrect 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
                : 'bg-slate-900 border-amber-500/30 text-slate-300'
            }`}>
              <div className="flex items-center space-x-2 font-bold mb-2">
                {isCorrect ? (
                  <span className="text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Detailed Solution</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>Step-by-Step Explanation</span>
                  </span>
                )}
              </div>
              <p className="text-slate-300 font-sans">{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Formula Bar + Coordinate Grid */}
        <div className="lg:col-span-6 space-y-3">
          {/* INTERACTIVE FORMULA CONTROL BAR */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Live Function Expression
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {isFormulaValid ? (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Check className="w-3 h-3" />
                    <span>Valid Curve</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Syntax Error</span>
                  </span>
                )}
              </div>
            </div>

            {/* Input field & Reset button */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-3 text-sm font-mono font-bold text-sky-400 select-none">
                  f(x) =
                </span>
                <input
                  type="text"
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  placeholder="e.g. (x - 2)^2 - 4 or -0.5 * x + 3"
                  className="w-full bg-slate-950 text-slate-100 font-mono text-sm pl-16 pr-3 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  spellCheck="false"
                />
              </div>

              {/* Reset to Original Equation Button */}
              <button
                type="button"
                onClick={handleResetFormula}
                disabled={!isModified}
                className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition ${
                  isModified
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-500 border-slate-700/50 cursor-not-allowed'
                }`}
                title="Reset to prompt's baseline equation"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isModified ? 'animate-spin-once' : ''}`} />
                <span className="hidden sm:inline">Reset Baseline</span>
              </button>
            </div>

            {/* Micro hint explaining student experimentation */}
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                {isModified ? (
                  <span className="text-amber-300">
                    Exploring modified equation. Click <strong>Reset Baseline</strong> when ready to solve.
                  </span>
                ) : (
                  <span>Edit coefficients above to observe geometric transformations in real time.</span>
                )}
              </span>
            </div>
          </div>

          {/* Coordinate Plane Component */}
          <CoordinatePlane 
            config={currentQ.graph_config} 
            activeFormula={customFormula}
            isFormulaValid={isFormulaValid}
          />

          {/* Helpful Math Legend */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-0.5 bg-sky-400 rounded-full inline-block" />
              <span>Interactive Function Curve</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-500/30" />
              <span>Baseline Key Points</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
              <span>Grid Step: 1.0 unit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
