import React, { useState, useMemo } from 'react';
import {
  X,
  Compass,
  RotateCcw,
  Sparkles,
  Layers,
  Sun,
  CircleDot,
  Search,
  Trash2,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useCelestialTrajectory } from '../context/CelestialTrajectoryContext';

export default function CelestialFlightLogModal() {
  const {
    trajectory,
    isFlightLogOpen,
    setIsFlightLogOpen,
    fastTravel,
    clearTrajectory
  } = useCelestialTrajectory();

  const [searchTerm, setSearchTerm] = useState('');

  // Close modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFlightLogOpen) {
        setIsFlightLogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlightLogOpen, setIsFlightLogOpen]);

  // Compute trajectory statistics
  const stats = useMemo(() => {
    const totalWaypoints = trajectory.length;
    const systemsSet = new Set(trajectory.map((w) => w.system));
    const rootsCount = trajectory.filter((w) => w.type === 'PRIMARY_STAR').length;
    const satellitesCount = trajectory.filter((w) => w.type === 'SATELLITE').length;
    const maxDepth = trajectory.reduce((max, w) => Math.max(max, w.depth || 0), 0);

    return {
      totalWaypoints,
      systemsCount: systemsSet.size,
      rootsCount,
      satellitesCount,
      maxDepth,
    };
  }, [trajectory]);

  // Filtered trajectory
  const filteredTrajectory = useMemo(() => {
    if (!searchTerm.trim()) return trajectory;
    const q = searchTerm.toLowerCase();
    return trajectory.filter(
      (w) =>
        w.title?.toLowerCase().includes(q) ||
        w.subtitle?.toLowerCase().includes(q) ||
        w.system?.toLowerCase().includes(q)
    );
  }, [trajectory, searchTerm]);

  if (!isFlightLogOpen) return null;

  const renderTypeIcon = (type) => {
    switch (type) {
      case 'SECTOR':
        return <Layers className="w-4 h-4 text-[#111410]" />;
      case 'PRIMARY_STAR':
        return <Sun className="w-4 h-4 text-[#42281D]" />;
      case 'SATELLITE':
        return <CircleDot className="w-4 h-4 text-[#7BB33B]" />;
      case 'ANOMALY':
        return <Sparkles className="w-4 h-4 text-[#84C341]" />;
      case 'STAR_SYSTEM':
      default:
        return <Compass className="w-4 h-4 text-[#111410]" />;
    }
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="trajectory-log-title"
        className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[6px_6px_0px_0px_#111410] w-full max-w-3xl max-h-[90vh] flex flex-col font-mono text-[#111410]"
      >
        {/* Modal Top Bar */}
        <div className="bg-[#111410] text-[#FAFBF8] px-4 py-3 flex items-center justify-between border-b-2 border-[#111410]">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-[#7BB33B] animate-spin" style={{ animationDuration: '24s' }} />
            <div>
              <h2 id="trajectory-log-title" className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                NAVIGATION TRAJECTORY LOG
              </h2>
              <p className="text-[10px] text-[#A6AEA1] tracking-tight">
                CHRONOLOGICAL TRAJECTORY OF VISITED NODES & SECTIONS
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFlightLogOpen(false)}
            className="p-1 hover:bg-[#FAFBF8]/20 text-[#FAFBF8] transition"
            title="Close log (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Statistics Deck */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-[#EDF5E5] border-b-2 border-[#111410] text-xs">
          <div className="bg-white p-2 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
            <span className="block text-[10px] text-[#62685E] font-bold">TOTAL NODES</span>
            <span className="text-lg font-black text-[#111410]">{stats.totalWaypoints}</span>
          </div>
          <div className="bg-white p-2 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
            <span className="block text-[10px] text-[#62685E] font-bold">SYSTEMS VISITED</span>
            <span className="text-lg font-black text-[#111410]">{stats.systemsCount}</span>
          </div>
          <div className="bg-white p-2 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
            <span className="block text-[10px] text-[#62685E] font-bold">ROOT NODES</span>
            <span className="text-lg font-black text-[#42281D]">{stats.rootsCount}</span>
          </div>
          <div className="bg-white p-2 border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410]">
            <span className="block text-[10px] text-[#62685E] font-bold">MAX DEPTH LEVEL</span>
            <span className="text-lg font-black text-[#7BB33B]">LEVEL {stats.maxDepth}</span>
          </div>
        </div>

        {/* Search & Actions Toolbar */}
        <div className="p-3 sm:p-4 border-b-2 border-[#111410] bg-white flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#62685E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter visited nodes, titles, or sections..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAFBF8] border-2 border-[#111410] focus:outline-none focus:border-[#7BB33B] font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#62685E] hover:text-[#111410]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {trajectory.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all recorded trajectory history for this session?')) {
                    clearTrajectory();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-[#991B1B] bg-[#FDF2F2] hover:bg-[#FDE8E8] border-2 border-[#991B1B] transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR TRAJECTORY</span>
              </button>
            )}
          </div>
        </div>

        {/* Trajectory Waypoints List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredTrajectory.length === 0 ? (
            <div className="py-12 text-center text-[#62685E] text-xs">
              <Compass className="w-8 h-8 mx-auto mb-2 opacity-40 animate-spin" style={{ animationDuration: '30s' }} />
              <p className="font-bold">No trajectory nodes recorded yet.</p>
              <p className="text-[11px] mt-1 text-[#62685E]">
                Navigate between views, study flashcards, or inspect roots to build your trajectory.
              </p>
            </div>
          ) : (
            filteredTrajectory.slice().reverse().map((waypoint, revIndex) => {
              const originalIndex = filteredTrajectory.length - 1 - revIndex;
              const isLatest = originalIndex === trajectory.length - 1;

              return (
                <div
                  key={waypoint.id || originalIndex}
                  className={`p-3 border-2 border-[#111410] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isLatest
                      ? 'bg-[#EDF5E5] shadow-[3px_3px_0px_0px_#7BB33B]'
                      : 'bg-white hover:bg-[#FAFBF8] shadow-[2px_2px_0px_0px_#111410]'
                  }`}
                >
                  {/* Waypoint Details */}
                  <div className="flex items-start space-x-3 overflow-hidden">
                    <div className="p-2 border-2 border-[#111410] bg-[#FAFBF8] shrink-0 mt-0.5">
                      {renderTypeIcon(waypoint.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-extrabold text-sm uppercase text-[#111410]">
                          {waypoint.title}
                        </span>
                        {isLatest && (
                          <span className="text-[9px] bg-[#7BB33B] text-white px-1.5 py-0.2 font-black uppercase tracking-wider">
                            CURRENT NODE
                          </span>
                        )}
                        <span className="text-[10px] bg-[#EFE8DF] text-[#42281D] px-1.5 py-0.2 font-bold uppercase">
                          LEVEL {waypoint.depth}
                        </span>
                      </div>

                      <p className="text-xs text-[#42281D] font-bold mt-0.5">
                        {waypoint.subtitle}
                      </p>

                      <div className="flex items-center space-x-3 text-[10px] text-[#62685E] mt-1">
                        <span>SECTION: <strong className="text-[#111410]">{waypoint.system}</strong></span>
                        <span>•</span>
                        <span>{formatTimestamp(waypoint.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slingshot / Jump Action Button */}
                  <div className="shrink-0 self-end sm:self-center">
                    {isLatest ? (
                      <span className="px-3 py-1 bg-[#7BB33B]/20 text-[#2F441E] border border-[#7BB33B] text-xs font-black uppercase">
                        ACTIVE NODE
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          fastTravel(waypoint.id);
                          setIsFlightLogOpen(false);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAFBF8] hover:bg-[#7BB33B] hover:text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] hover:shadow-[2px_2px_0px_0px_#111410] text-xs font-black uppercase tracking-wider transition active:translate-y-0.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>JUMP TO NODE</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#EFE8DF] border-t-2 border-[#111410] flex items-center justify-between text-xs text-[#42281D] font-bold">
          <div className="flex items-center space-x-2">
            <span>KIWI TRAJECTORY & NAVIGATION SUITE</span>
          </div>
          <button
            onClick={() => setIsFlightLogOpen(false)}
            className="px-4 py-1 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] text-xs font-black uppercase shadow-[2px_2px_0px_0px_#111410]"
          >
            CLOSE LOG
          </button>
        </div>
      </div>
    </div>
  );
}
