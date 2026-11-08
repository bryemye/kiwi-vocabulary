import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  loadStoredTrajectory,
  saveTrajectory,
  createCelestialWaypoint,
} from '../services/celestialTrajectory';

const CelestialTrajectoryContext = createContext(null);

export function CelestialTrajectoryProvider({ children }) {
  const [trajectory, setTrajectory] = useState(loadStoredTrajectory);
  const [isRibbonVisible, setIsRibbonVisible] = useState(true);
  const [isFlightLogOpen, setIsFlightLogOpen] = useState(false);
  const [slingshotTargetId, setSlingshotTargetId] = useState(null);

  // Navigator callback reference registered by App.jsx
  const navigatorRef = useRef(null);

  // Keep localStorage in sync
  useEffect(() => {
    saveTrajectory(trajectory);
  }, [trajectory]);

  const registerNavigator = useCallback((fn) => {
    navigatorRef.current = fn;
  }, []);

  /**
   * Record a new waypoint into the flight path
   */
  const recordWaypoint = useCallback((waypointData) => {
    setTrajectory((prev) => {
      const last = prev[prev.length - 1];
      // Deduplicate: avoid recording identical sequential state
      if (
        last &&
        last.type === waypointData.type &&
        last.title === waypointData.title &&
        last.system === waypointData.system &&
        last.state?.tab === waypointData.state?.tab &&
        last.state?.app === waypointData.state?.app &&
        last.state?.rootId === waypointData.state?.rootId &&
        last.state?.morphemeToken === waypointData.state?.morphemeToken &&
        last.state?.poemId === waypointData.state?.poemId
      ) {
        return prev;
      }

      const waypoint = createCelestialWaypoint(waypointData);
      return [...prev, waypoint];
    });
  }, []);

  /**
   * Fast-travel / Slingshot back to a specific waypoint
   */
  const fastTravel = useCallback((waypointId) => {
    setTrajectory((currentTrajectory) => {
      const targetIndex = currentTrajectory.findIndex((w) => w.id === waypointId);
      if (targetIndex === -1) return currentTrajectory;

      const target = currentTrajectory[targetIndex];

      // Trigger slingshot animation marker
      setSlingshotTargetId(waypointId);
      setTimeout(() => setSlingshotTargetId(null), 800);

      // Execute navigation in App
      if (navigatorRef.current && target.state) {
        navigatorRef.current(target.state, target);
      }

      // Record a new jump node or advance the flight path
      const jumpWaypoint = createCelestialWaypoint({
        type: target.type,
        title: target.title,
        subtitle: `SLINGSHOT TRANSIT → ${target.title}`,
        system: target.system,
        depth: target.depth,
        language: target.language,
        state: target.state,
      });

      return [...currentTrajectory, jumpWaypoint];
    });
  }, []);

  /**
   * Step back to the immediate previous waypoint
   */
  const stepBack = useCallback(() => {
    setTrajectory((currentTrajectory) => {
      if (currentTrajectory.length < 2) return currentTrajectory;
      // The previous distinct state is index length - 2
      const previousWaypoint = currentTrajectory[currentTrajectory.length - 2];
      if (previousWaypoint) {
        fastTravel(previousWaypoint.id);
      }
      return currentTrajectory;
    });
  }, [fastTravel]);

  /**
   * Clear the entire flight path
   */
  const clearTrajectory = useCallback(() => {
    setTrajectory([]);
  }, []);

  const currentWaypoint = trajectory.length > 0 ? trajectory[trajectory.length - 1] : null;

  return (
    <CelestialTrajectoryContext.Provider
      value={{
        trajectory,
        currentWaypoint,
        recordWaypoint,
        fastTravel,
        stepBack,
        clearTrajectory,
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
