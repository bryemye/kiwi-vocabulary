import React, { useRef, useEffect, useState } from 'react';
import {
  Compass,
  Sparkles,
  Sun,
  CircleDot,
  RotateCcw,
  Layers,
  ChevronRight,
  Minimize2,
  Maximize2,
  Trash2,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useCelestialTrajectory } from '../context/CelestialTrajectoryContext';
import { getNodePalette } from '../services/celestialTrajectory';

export default function CelestialTrajectoryRibbon() {
  const {
    trajectory,
    activeWaypointId,
    currentWaypoint,
    fastTravel,
    stepBack,
    clearTrajectory,
    isRibbonVisible,
    setIsRibbonVisible,
    setIsFlightLogOpen,
    slingshotTargetId
  } = useCelestialTrajectory();

  const activeIndex = trajectory.findIndex(
    (w) => w.id === (activeWaypointId || currentWaypoint?.id)
  );
  const canStepBack = activeIndex > 0;

  const scrollContainerRef = useRef(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Auto-scroll to latest node whenever trajectory changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [trajectory.length]);

  if (!isRibbonVisible) {
    // Minimized Floating Node Pill - Sleek & Modern
    return (
      <aside
        aria-label="Navigation Trajectory Pill"
        className="fixed bottom-5 right-5 z-40 bg-white/95 backdrop-blur-md text-[#111410] border border-stone-200 shadow-soft-lg hover:shadow-soft-xl rounded-full px-3.5 py-1.5 flex items-center space-x-2 text-xs font-mono transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="relative w-2.5 h-2.5">
          <div className="w-2.5 h-2.5 bg-[#7BB33B] rounded-full animate-ping absolute inset-0 opacity-75" />
          <div className="w-2.5 h-2.5 bg-[#7BB33B] rounded-full relative" />
        </div>
        <span className="text-[#2F441E] font-bold tracking-wide uppercase text-[11px]">
          Trajectory: {currentWaypoint ? currentWaypoint.title : 'Ready'}
        </span>
        <span className="text-[#62685E] text-[10px]">({trajectory.length})</span>
        <button
          onClick={() => setIsRibbonVisible(true)}
          className="ml-1.5 px-2 py-0.5 bg-[#EDF5E5] hover:bg-[#7BB33B] hover:text-white text-[#2F441E] font-bold uppercase tracking-wider text-[10px] rounded-full border border-[#7BB33B]/40 transition"
          title="Expand Trajectory Ribbon"
        >
          Expand
        </button>
      </aside>
    );
  }

  // Node scale badge & icon helper
  const renderScaleIcon = (type, isLive) => {
    switch (type) {
      case 'SECTOR':
        return <Layers className={`w-3.5 h-3.5 ${isLive ? 'text-[#7BB33B]' : 'text-[#111410]'}`} />;
      case 'PRIMARY_STAR':
        return <Sun className={`w-3.5 h-3.5 ${isLive ? 'text-[#7BB33B] animate-spin' : 'text-[#42281D]'}`} style={{ animationDuration: '18s' }} />;
      case 'SATELLITE':
        return <CircleDot className={`w-3.5 h-3.5 ${isLive ? 'text-[#7BB33B]' : 'text-[#62685E]'}`} />;
      case 'ANOMALY':
        return <Sparkles className={`w-3.5 h-3.5 ${isLive ? 'text-[#7BB33B]' : 'text-[#42281D]'}`} />;
      case 'STAR_SYSTEM':
      default:
        return <Compass className={`w-3.5 h-3.5 ${isLive ? 'text-[#7BB33B]' : 'text-[#111410]'}`} />;
    }
  };

  const formatElapsedTime = (timestamp) => {
    const diffSecs = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <section 
      aria-label="Navigation Trajectory Ribbon"
      className="bg-white/95 backdrop-blur-md border-b border-stone-200 select-none relative z-30 transition-all duration-200 shadow-soft-xs"
    >
      {/* Top Telemetry Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between border-b border-stone-100 text-[11px] font-mono font-bold uppercase">
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
          {/* Live Node Beacon */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7BB33B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7BB33B]" />
            </span>
            <span className="text-[#111410] font-black tracking-widest text-[10px]">
              TRAJECTORY RIBBON
            </span>
          </div>

          {/* Current Node Info */}
          <div className="hidden md:flex items-center space-x-1.5 text-[#62685E] text-[10px] truncate">
            <span className="text-stone-300">|</span>
            <span className="text-[#7BB33B] font-bold">●</span>
            <span className="truncate text-[#111410] font-black uppercase">
              {currentWaypoint ? currentWaypoint.title : 'READY'}
            </span>
            {currentWaypoint && (
              <>
                <span className="text-stone-300">|</span>
                <span className="text-[#42281D] truncate">
                  LEVEL {currentWaypoint.depth}: {currentWaypoint.subtitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Global Trajectory Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Retrace / Step Back */}
          <button
            onClick={stepBack}
            disabled={!canStepBack}
            className={`flex items-center space-x-1 px-2 py-0.5 border border-[#111410] text-[10px] font-black uppercase tracking-wider transition ${
              canStepBack
                ? 'bg-[#EFE8DF] hover:bg-[#EDF5E5] text-[#111410] active:translate-y-0.5'
                : 'bg-[#FAFBF8] text-[#111410]/30 border-[#111410]/20 cursor-not-allowed'
            }`}
            title="Retrace to previous node"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">RETRACE</span>
          </button>

          {/* Full Trajectory Log */}
          <button
            onClick={() => setIsFlightLogOpen(true)}
            className="flex items-center space-x-1 px-2 py-0.5 bg-white hover:bg-[#EDF5E5] border border-[#111410] text-[#111410] text-[10px] font-black uppercase tracking-wider transition shadow-[1px_1px_0px_0px_#111410] active:translate-y-0.5"
            title="Open Trajectory Log"
          >
            <Compass className="w-2.5 h-2.5 text-[#7BB33B]" />
            <span>NODES ({trajectory.length})</span>
          </button>

          {/* Clear Trail */}
          {trajectory.length > 0 && (
            <button
              onClick={clearTrajectory}
              className="p-1 text-[#62685E] hover:text-[#991B1B] hover:bg-[#FDF2F2] border border-transparent hover:border-[#991B1B]/30 transition"
              title="Clear trajectory"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Minimize Ribbon */}
          <button
            onClick={() => setIsRibbonVisible(false)}
            className="p-1 text-[#62685E] hover:text-[#111410] hover:bg-[#EFE8DF] transition"
            title="Minimize ribbon"
          >
            <Minimize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Main Trajectory Ribbon Track */}
      <div
        ref={scrollContainerRef}
        className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 overflow-x-auto overflow-y-visible flex items-center space-x-0 scrollbar-thin scrollbar-thumb-[#111410] scrollbar-track-[#FAFBF8]"
      >
        {trajectory.length === 0 ? (
          <div className="py-1 text-xs font-mono text-[#62685E] italic flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '12s' }} />
            <span>Awaiting navigation... Move between views, roots, or words to chart your trajectory.</span>
          </div>
        ) : (
          trajectory.map((waypoint, index) => {
            const isLive = currentWaypoint
              ? waypoint.id === currentWaypoint.id
              : index === trajectory.length - 1;
            const indexFromEnd = isLive ? 0 : Math.max(1, trajectory.length - 1 - index);
            const palette = getNodePalette(indexFromEnd);
            const isSlingshotTarget = slingshotTargetId === waypoint.id;
            const isHovered = hoveredNodeId === waypoint.id;

            return (
              <React.Fragment key={waypoint.id || index}>
                {/* Node Item */}
                <div
                  className="relative shrink-0 group flex items-center"
                  onMouseEnter={() => setHoveredNodeId(waypoint.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Expanding Pulsar Halo Ring on Live Node */}
                  {isLive && (
                    <div className="absolute inset-0 -m-1 rounded-sm border-2 border-[#7BB33B] animate-celestial-pulsar pointer-events-none" />
                  )}

                  {/* Jump transit ripple */}
                  {isSlingshotTarget && (
                    <div className="absolute inset-0 -m-2 rounded-sm bg-[#7BB33B]/40 animate-ping pointer-events-none" />
                  )}

                  {/* Trajectory Node Button */}
                  <button
                    onClick={() => {
                      if (!isLive) {
                        fastTravel(waypoint.id);
                      }
                    }}
                    className={`relative flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-bold border-2 transition-all cursor-pointer ${
                      isLive
                        ? 'bg-[#EDF5E5] border-[#111410] text-[#111410] shadow-[2px_2px_0px_0px_#7BB33B]'
                        : 'bg-white hover:bg-[#FAFBF8] border-[#111410] text-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:shadow-[3px_3px_0px_0px_#7BB33B] hover:-translate-y-0.5'
                    }`}
                    style={{
                      borderColor: isLive ? '#111410' : palette.border,
                    }}
                    title={isLive ? 'Current Node' : `Click to Jump to ${waypoint.title}`}
                  >
                    {/* Subtle Orbital Ring on Root Nodes */}
                    {waypoint.type === 'PRIMARY_STAR' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-[#7BB33B] animate-celestial-orbit pointer-events-none" />
                    )}

                    {/* Scale Icon */}
                    <span className="shrink-0">
                      {renderScaleIcon(waypoint.type, isLive)}
                    </span>

                    {/* Title */}
                    <span className="whitespace-nowrap font-extrabold uppercase tracking-tight text-[11px]">
                      {waypoint.title}
                    </span>

                    {/* Depth Badge */}
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded-none font-black uppercase ${
                        isLive
                          ? 'bg-[#7BB33B] text-white'
                          : 'bg-[#EFE8DF] text-[#42281D]'
                      }`}
                    >
                      L{waypoint.depth}
                    </span>
                  </button>

                  {/* Hover Telemetry HUD Popover Card */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-[#111410] text-[#FAFBF8] border-2 border-[#7BB33B] shadow-[4px_4px_0px_0px_#42281D] p-2.5 font-mono text-left pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between border-b border-[#FAFBF8]/20 pb-1 mb-1.5 text-[9px] font-bold text-[#84C341]">
                        <span>NODE TELEMETRY</span>
                        <span>{formatElapsedTime(waypoint.timestamp)}</span>
                      </div>

                      <div className="text-[12px] font-extrabold text-white mb-0.5 uppercase flex items-center space-x-1">
                        <span>{waypoint.title}</span>
                      </div>

                      <div className="text-[10px] text-[#EFE8DF] font-bold mb-1">
                        {waypoint.subtitle}
                      </div>

                      <div className="space-y-0.5 text-[9px] text-[#A6AEA1]">
                        <div className="flex justify-between">
                          <span className="text-[#62685E]">SECTION:</span>
                          <span className="text-[#FAFBF8] font-bold">{waypoint.system}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#62685E]">DEPTH:</span>
                          <span className="text-[#84C341] font-bold">LEVEL {waypoint.depth}</span>
                        </div>
                      </div>

                      {!isLive && (
                        <div className="mt-2 pt-1 border-t border-[#FAFBF8]/20 flex items-center justify-center space-x-1 text-[10px] text-[#84C341] font-black tracking-wider">
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>CLICK TO RETRACE TO NODE</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connecting Curved Arc SVG between nodes */}
                {index < trajectory.length - 1 && (
                  <div className="flex items-center px-0.5 shrink-0 pointer-events-none">
                    <svg
                      className="w-5 sm:w-7 h-4 shrink-0 overflow-visible"
                      viewBox="0 0 28 16"
                      fill="none"
                    >
                      {/* Base trajectory arc */}
                      <path
                        d="M 0 8 C 8 2, 20 14, 28 8"
                        stroke="#111410"
                        strokeWidth="1.75"
                        strokeDasharray={index === trajectory.length - 2 ? "3 3" : "none"}
                        className={index === trajectory.length - 2 ? "animate-transit-dash" : ""}
                      />
                      {/* Small trajectory marker dot */}
                      <circle
                        cx="14"
                        cy="8"
                        r="1.5"
                        fill={index === trajectory.length - 2 ? "#7BB33B" : "#42281D"}
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </section>
  );
}
