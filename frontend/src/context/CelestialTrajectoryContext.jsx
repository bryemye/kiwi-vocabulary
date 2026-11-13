import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  loadStoredTrajectory,
  saveTrajectory,
  createCelestialWaypoint,
} from '../services/celestialTrajectory';

const CelestialTrajectoryContext = createContext(null);

function isSameWaypoint(a, b) {
  if (!a || !b) return false;
  return (
    a.type === b.type &&
    a.title === b.title &&
    a.system === b.system &&
    a.state?.tab === b.state?.tab &&
    a.state?.app === b.state?.app &&
    a.state?.rootId === b.state?.rootId &&
    a.state?.morphemeToken === b.state?.morphemeToken &&
    a.state?.morphemeType === b.state?.morphemeType &&
    a.state?.poemId === b.state?.poemId &&
    a.state?.wordName === b.state?.wordName &&
    a.state?.subsetPracticeInfo?.title === b.state?.subsetPracticeInfo?.title
  );
}

export function CelestialTrajectoryProvider({ children }) {
  const [trajectory, setTrajectory] = useState(loadStoredTrajectory);
  const [activeWaypointId, setActiveWaypointId] = useState(() => {
    const initial = loadStoredTrajectory();
    return initial.length > 0 ? initial[initial.length - 1].id : null;
  });
  const [isRibbonVisible, setIsRibbonVisible] = useState(false);
  const [isFlightLogOpen, setIsFlightLogOpen] = useState(false);
  const [slingshotTargetId, setSlingshotTargetId] = useState(null);

  // Navigator callback reference registered by App.jsx
  const navigatorRef = useRef(null);
  const trajectoryRef = useRef(trajectory);
  const activeWaypointIdRef = useRef(activeWaypointId);
  const isSuppressingRecordRef = useRef(false);
  const suppressTimerRef = useRef(null);

  useEffect(() => {
    trajectoryRef.current = trajectory;
  }, [trajectory]);

  useEffect(() => {
    activeWaypointIdRef.current = activeWaypointId;
  }, [activeWaypointId]);

  useEffect(() => {
    return () => {
      if (suppressTimerRef.current) {
        clearTimeout(suppressTimerRef.current);
      }
    };
  }, []);

  // Keep localStorage in sync
  useEffect(() => {
    saveTrajectory(trajectory);
  }, [trajectory]);

  const registerNavigator = useCallback((fn) => {
    navigatorRef.current = fn;
  }, []);

  const suppressRecordingBriefly = useCallback(() => {
    isSuppressingRecordRef.current = true;
    if (suppressTimerRef.current) {
      clearTimeout(suppressTimerRef.current);
    }
    suppressTimerRef.current = setTimeout(() => {
      isSuppressingRecordRef.current = false;
      suppressTimerRef.current = null;
    }, 120);
  }, []);

  /**
   * Record a new waypoint into the flight path
   */
  const recordWaypoint = useCallback((waypointData) => {
    if (isSuppressingRecordRef.current) return;

    const currentList = trajectoryRef.current;
    const activeNode =
      currentList.find((w) => w.id === activeWaypointIdRef.current) ||
      currentList[currentList.length - 1];

    // Deduplicate: avoid recording identical state to the active waypoint
    if (isSameWaypoint(activeNode, waypointData)) {
      return;
    }

    const waypoint = createCelestialWaypoint(waypointData);
    const next = [...currentList, waypoint];
    const bounded = next.length > 30 ? next.slice(-30) : next;

    trajectoryRef.current = bounded;
    activeWaypointIdRef.current = waypoint.id;
    setTrajectory(bounded);
    setActiveWaypointId(waypoint.id);
  }, []);

  /**
   * Fast-travel / Slingshot to a saved waypoint without appending to the ribbon
   */
  const fastTravel = useCallback((waypointId) => {
    const currentList = trajectoryRef.current;
    const target = currentList.find((w) => w.id === waypointId);
    if (!target) return;

    // Move active marker to the clicked waypoint without mutating the ribbon
    activeWaypointIdRef.current = target.id;
    setActiveWaypointId(target.id);

    // Trigger slingshot animation marker
    setSlingshotTargetId(waypointId);
    setTimeout(() => setSlingshotTargetId(null), 800);

    // Prevent destination view effects from re-recording this navigation
    suppressRecordingBriefly();

    // Execute navigation in App
    if (navigatorRef.current && target.state) {
      navigatorRef.current(target.state, target);
    }
  }, [suppressRecordingBriefly]);

  /**
   * Step back to the immediate previous waypoint relative to the active waypoint
   */
  const stepBack = useCallback(() => {
    const currentList = trajectoryRef.current;
    if (currentList.length < 2) return;

    const activeIndex = currentList.findIndex((w) => w.id === activeWaypointIdRef.current);
    const targetIndex = activeIndex > 0 ? activeIndex - 1 : activeIndex === -1 ? currentList.length - 2 : -1;
    if (targetIndex < 0) return;

    const previousWaypoint = currentList[targetIndex];
    if (previousWaypoint) {
      fastTravel(previousWaypoint.id);
    }
  }, [fastTravel]);

  /**
   * Clear the entire flight path
   */
  const clearTrajectory = useCallback(() => {
    trajectoryRef.current = [];
    activeWaypointIdRef.current = null;
    setTrajectory([]);
    setActiveWaypointId(null);
  }, []);

  const currentWaypoint =
    trajectory.find((w) => w.id === activeWaypointId) ||
    (trajectory.length > 0 ? trajectory[trajectory.length - 1] : null);

  return (
    <CelestialTrajectoryContext.Provider
      value={{
        trajectory,
        activeWaypointId,
        currentWaypoint,
        recordWaypoint,
        fastTravel,
        stepBack,
        clearTrajectory,
        suppressRecordingBriefly,
        isRibbonVisible,
        setIsRibbonVisible,
        isFlightLogOpen,
        setIsFlightLogOpen,
        slingshotTargetId,
        registerNavigator,
      }}
    >
      {children}
    </CelestialTrajectoryContext.Provider>
  );
}

export function useCelestialTrajectory() {
  const context = useContext(CelestialTrajectoryContext);
  if (!context) {
    throw new Error('useCelestialTrajectory must be used within a CelestialTrajectoryProvider');
  }
  return context;
}
