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
  Crosshair,
  Sliders,
  AlertTriangle,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { logStudyAttempt } from '../services/api';

/**
 * Coordinate Plane SVG Plotter with Swiss Drafting Grid Aesthetic
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
  const padding = 38;

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
      const sanitized = fnStr
        .replace(/\^/g, '**')
        .replace(/Math\.abs/g, 'abs')
        .replace(/abs\(([^)]+)\)/g, 'Math.abs($1)')
        .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
        .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)')
        .replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');

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
    <div className="relative w-full bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4 select-none">
      {/* Title & Legend Header */}
      <div className="flex items-center justify-between mb-3 px-1 border-b-2 border-[#111410] pb-2 font-mono">
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 border border-[#111410] ${isFormulaValid ? 'bg-[#7BB33B]' : 'bg-[#C29B78]'}`} />
          <span className="text-xs font-bold uppercase text-[#111410]">
            {config.displayEquation || 'Drafting Grid'}
          </span>
        </div>
        <div className="text-[11px] font-mono font-bold uppercase text-[#42281D] flex items-center space-x-2">
          <Crosshair className="w-3.5 h-3.5 text-[#111410]" />
          <span>
            {hoverCoord 
              ? `X: ${hoverCoord.mathX} · Y: ${hoverCoord.mathY}${hoverCoord.curveY !== null ? ` [f(x)=${hoverCoord.curveY}]` : ''}`
              : 'HOVER TO PROBE GRID'}
          </span>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto cursor-crosshair bg-[#FAFBF8] border-2 border-[#111410]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <marker id="arrow-x" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#111410" />
          </marker>
          <marker id="arrow-y" viewBox="0 0 10 10" refX="5" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 1.5 8 L 5 0 L 8.5 8 z" fill="#111410" />
          </marker>
          <clipPath id="plot-area">
            <rect x={padding} y={padding} width={plotWidth} height={plotHeight} />
          </clipPath>
        </defs>

        {/* Drafting Grid Lines */}
        {xTicks.map((x) => (
          <line
            key={`grid-x-${x}`}
            x1={toSvgX(x)}
            y1={padding}
            x2={toSvgX(x)}
            y2={height - padding}
            stroke="#EFE8DF"
            strokeWidth={x % 2 === 0 ? "1.5" : "1"}
          />
        ))}

        {yTicks.map((y) => (
          <line
            key={`grid-y-${y}`}
            x1={padding}
            y1={toSvgY(y)}
            x2={width - padding}
            y2={toSvgY(y)}
            stroke="#EFE8DF"
            strokeWidth={y % 2 === 0 ? "1.5" : "1"}
          />
        ))}

        {/* Primary Axes: X and Y (Jet Black, Crisp 2.5px) */}
        <line
          x1={padding - 10}
          y1={originY}
          x2={width - padding + 14}
          y2={originY}
          stroke="#111410"
          strokeWidth="2.5"
          markerEnd="url(#arrow-x)"
        />
        <text
          x={width - padding + 16}
          y={originY + 4}
          fill="#111410"
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
          stroke="#111410"
          strokeWidth="2.5"
          markerEnd="url(#arrow-y)"
        />
        <text
          x={originX - 4}
          y={padding - 18}
          fill="#111410"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
        >
          y
        </text>

        {/* Origin '0' */}
        <text
          x={originX - 12}
          y={originY + 14}
          fill="#42281D"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
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
              stroke="#111410"
              strokeWidth="2"
            />
            {x % 2 === 0 && (
              <text
                x={toSvgX(x)}
                y={originY + 14}
                fill="#111410"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
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
              stroke="#111410"
              strokeWidth="2"
            />
            {y % 2 === 0 && (
              <text
                x={originX - 7}
                y={toSvgY(y) + 3}
                fill="#111410"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                {y}
              </text>
            )}
          </g>
        ))}

        {/* Curves & Functions (Clipped) */}
        <g clipPath="url(#plot-area)">
          {/* Active Formula Curve: Vivid Kiwi Green #7BB33B with 3px stroke */}
          {activeFormula && isFormulaValid && (
            <path
              d={generatePath(activeFormula)}
              fill="none"
              stroke="#7BB33B"
              strokeWidth="3.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          )}

          {/* System second line if present: Deep Bark Brown */}
          {config.type === 'system' && config.lines && config.lines.length > 1 && (
            <path
              d={generatePath(config.lines[1].fn)}
              fill="none"
              stroke="#42281D"
              strokeWidth="3"
              strokeDasharray="4,2"
              strokeLinecap="square"
            />
          )}

          {/* Key Points: Solid square points with black borders */}
          {config.keyPoints && config.keyPoints.map((pt, idx) => {
            const px = toSvgX(pt.x);
            const py = toSvgY(pt.y);
            return (
              <g key={`keypoint-${idx}`}>
                {/* Solid Square Point */}
                <rect
                  x={px - 5}
                  y={py - 5}
                  width="10"
                  height="10"
                  fill="#84C341"
                  stroke="#111410"
                  strokeWidth="2"
                />
                {/* Geometric Label Callout */}
                {pt.label && (
                  <g>
                    <rect
                      x={px + 8}
                      y={py - 18}
                      width={pt.label.length * 6.5 + 10}
                      height="18"
                      fill="#FFFFFF"
                      stroke="#111410"
                      strokeWidth="1.5"
                    />
                    <text
                      x={px + 12}
                      y={py - 5}
                      fill="#111410"
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
                stroke="#111410"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1={padding}
                y1={hoverCoord.svgY}
                x2={width - padding}
                y2={hoverCoord.svgY}
                stroke="#111410"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <rect
                x={hoverCoord.svgX - 3}
                y={hoverCoord.svgY - 3}
                width="6"
                height="6"
                fill="#7BB33B"
                stroke="#111410"
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
        question_id: currentQ.id,
        is_correct: correct,
        seconds_spent: secondsSpent,
      });

      if (correct) {
        confetti({
          particleCount: 60,
          spread: 70,
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
        <LineChart className="w-16 h-16 mx-auto text-[#42281D] mb-4" />
        <h3 className="text-xl font-bold font-mono text-[#111410] uppercase">No Math Questions Loaded</h3>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-[#111410]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 bg-[#7BB33B] border-2 border-[#111410] flex items-center justify-center text-white text-xs font-mono font-bold">
              02
            </span>
            <h2 className="text-xl font-black text-[#111410] tracking-tight uppercase font-mono">
              Math Coordinate Lab
            </h2>
          </div>
          <p className="text-xs font-mono text-[#62685E] mt-1 uppercase">
            Interactive Swiss Drafting Plane & Function Synthesizer
          </p>
        </div>

        {/* Question Selector & Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            className="p-2 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition"
            title="Previous Question"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-1">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 font-mono text-xs font-black uppercase border-2 border-[#111410] transition ${
                  currentIndex === idx
                    ? 'bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-white text-[#111410] hover:bg-[#FAFBF8]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button
            onClick={handleNext}
            className="p-2 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition"
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
          <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-6">
            <div className="flex items-center justify-between mb-4 border-b-2 border-[#111410] pb-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                Digital SAT · Math Spec
              </span>
              <span className="text-xs font-mono font-bold text-[#42281D]">
                QUESTION {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Baseline Formula Callout */}
            {currentQ.graph_config?.displayEquation && (
              <div className="mb-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-[#EFE8DF] border-2 border-[#111410] text-[#42281D] text-xs font-mono font-bold shadow-[2px_2px_0px_0px_#111410]">
                <Sparkles className="w-3.5 h-3.5 text-[#7BB33B]" />
                <span>EQ: <strong>{currentQ.graph_config.displayEquation}</strong></span>
              </div>
            )}

            {/* Prompt text */}
            <h3 className="text-base sm:text-lg font-bold text-[#111410] leading-snug mb-6 font-sans">
              {currentQ.prompt}
            </h3>

            {/* Choices list A, B, C, D */}
            <div className="space-y-3">
              {Object.entries(currentQ.choices || {}).map(([key, text]) => {
                const isSelected = selectedChoice === key;
                let choiceStyle = 'bg-white border-2 border-[#111410] text-[#111410] hover:bg-[#FAFBF8] shadow-[2px_2px_0px_0px_#111410]';

                if (submitted) {
                  if (key === currentQ.correct_answer) {
                    choiceStyle = 'bg-[#7BB33B] text-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410]';
                  } else if (isSelected && !isCorrect) {
                    choiceStyle = 'bg-[#FDF2F2] text-[#991B1B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]';
                  } else {
                    choiceStyle = 'bg-[#FAFBF8] border-2 border-[#111410]/40 text-[#62685E] opacity-60';
                  }
                } else if (isSelected) {
                  choiceStyle = 'bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]';
                }

                return (
                  <div
                    key={key}
                    onClick={() => !submitted && setSelectedChoice(key)}
                    className={`flex items-start space-x-3.5 p-3.5 text-sm transition-all duration-150 ${
                      !submitted ? 'cursor-pointer active:translate-x-[1px] active:translate-y-[1px]' : ''
                    } ${choiceStyle}`}
                  >
                    <div
                      className={`w-7 h-7 flex items-center justify-center font-black font-mono text-xs shrink-0 border-2 border-[#111410] ${
                        isSelected || (submitted && key === currentQ.correct_answer)
                          ? 'bg-[#111410] text-white'
                          : 'bg-[#FAFBF8] text-[#111410]'
                      }`}
                    >
                      {key}
                    </div>
                    <div className="flex-1 pt-0.5 font-mono font-bold text-xs">{text}</div>
                    {submitted && key === currentQ.correct_answer && (
                      <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                    )}
                    {submitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-[#991B1B] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t-2 border-[#111410]">
              <div className="text-xs font-mono font-bold uppercase text-[#62685E]">
                {!submitted ? 'Select choice to submit.' : (isCorrect ? 'Status: Correct' : 'Status: Incorrect')}
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
                    onClick={handleNext}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-[#111410] hover:bg-[#42281D] text-white font-mono font-black text-xs uppercase border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] transition active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Solution & Explanation */}
          {submitted && (
            <div className={`p-5 border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] animate-fade-in ${
              isCorrect ? 'bg-[#EDF5E5] text-[#2F441E]' : 'bg-[#FAFBF8] text-[#111410]'
            }`}>
              <div className="flex items-center space-x-2 font-mono font-black text-xs uppercase mb-2">
                {isCorrect ? (
                  <span className="text-[#2F441E] flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#7BB33B]" />
                    <span>Mathematical Rationale</span>
                  </span>
                ) : (
                  <span className="text-[#42281D] flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4 text-[#42281D]" />
                    <span>Step-by-Step Solution</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-serif leading-relaxed text-[#111410]">{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Formula Bar + Coordinate Grid */}
        <div className="lg:col-span-6 space-y-4">
          {/* TERMINAL-STYLED INTERACTIVE FORMULA CONTROL BAR */}
          <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4">
            <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-[#111410] font-mono">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#7BB33B]" />
                <span className="text-xs font-black uppercase text-[#111410]">
                  Interactive Formula Terminal
                </span>
              </div>
              <div>
                {isFormulaValid ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-[#2F441E] bg-[#EDF5E5] px-2 py-0.5 border border-[#111410]">
                    <Check className="w-3 h-3 text-[#7BB33B]" />
                    <span>VALID CURVE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-[#991B1B] bg-[#FDF2F2] px-2 py-0.5 border border-[#111410]">
                    <AlertTriangle className="w-3 h-3 text-[#991B1B]" />
                    <span>SYNTAX ERROR</span>
                  </span>
                )}
              </div>
            </div>

            {/* Input field & Angular Reset button */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-3 text-xs font-mono font-black text-[#111410] select-none">
                  f(x) =
                </span>
                <input
                  type="text"
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  placeholder="e.g. (x - 2)^2 - 4"
                  className="w-full bg-[#FAFBF8] text-[#111410] font-mono font-bold text-xs pl-14 pr-3 py-2.5 border-2 border-[#111410] focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#111410]"
                  spellCheck="false"
                />
              </div>

              {/* Angular Reset Button */}
              <button
                type="button"
                onClick={handleResetFormula}
                disabled={!isModified}
                className={`flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-mono font-black uppercase border-2 border-[#111410] transition ${
                  isModified
                    ? 'bg-[#EFE8DF] hover:bg-[#FAFBF8] text-[#42281D] shadow-[2px_2px_0px_0px_#111410] active:translate-x-[1px] active:translate-y-[1px]'
                    : 'bg-[#FAFBF8] text-[#A8AAA6] border-[#D1D5DB] cursor-not-allowed'
                }`}
                title="Reset to prompt's baseline equation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            <div className="mt-2 text-[10px] font-mono font-bold text-[#62685E] uppercase flex items-center justify-between">
              <span>
                {isModified ? (
                  <span className="text-[#42281D]">
                    [MODIFIED] Edit coefficients to explore transformations. Click <strong>Reset</strong> to solve.
                  </span>
                ) : (
                  <span>[BASELINE] Edit coefficients above to observe graph changes in real-time.</span>
                )}
              </span>
            </div>
          </div>

          {/* Coordinate Plane Drafting Grid */}
          <CoordinatePlane 
            config={currentQ.graph_config} 
            activeFormula={customFormula}
            isFormulaValid={isFormulaValid}
          />

          {/* Swiss Drafting Legend */}
          <div className="p-3 bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[11px] font-mono font-bold uppercase text-[#111410] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-1 bg-[#7BB33B] inline-block" />
              <span>VIVID KIWI FUNCTION</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#84C341] border border-[#111410] inline-block" />
              <span>SQUARE CRITICAL POINT</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#FAFBF8] border border-[#111410] inline-block" />
              <span>1.0 UNIT DRAFTING GRID</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
