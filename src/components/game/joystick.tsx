"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface JoystickProps {
  onMove: (direction: "north" | "south" | "east" | "west" | null) => void;
  size?: number;
}

/**
 * Mobile joystick component for directional movement control.
 *
 * @remarks
 * Uses touch events to track finger position and emit movement directions.
 * The joystick is rendered as a circular pad with an inner knob that follows touch input.
 * Dead zone prevents accidental movements when touch is near center.
 *
 * @param {function} onMove - Callback fired with direction ('north', 'south', 'east', 'west') or null when idle.
 * @param {number} size - Size of the joystick in pixels (default: 120).
 *
 * @example
 * const [direction, setDirection] = useState(null);
 * return <Joystick onMove={setDirection} size={140} />;
 */
export function Joystick({ onMove, size = 120 }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchX, setTouchX] = useState(0);
  const [touchY, setTouchY] = useState(0);
  const [isPressed, setIsPressed] = useState(false);

  const radius = size / 2;
  const innerRadius = size / 6;
  const deadZone = size / 8;

  const getDirection = useCallback((x: number, y: number) => {
    if (Math.sqrt(x * x + y * y) < deadZone) {
      return null;
    }

    const angle = Math.atan2(y, x);
    const deg = (angle * 180) / Math.PI;

    if (deg > -45 && deg < 45) return "east";
    if (deg >= 45 && deg < 135) return "south";
    if (deg >= 135 || deg < -135) return "west";
    if (deg >= -135 && deg < -45) return "north";

    return null;
  }, [deadZone]);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (!isPressed || !containerRef.current) return;

      const touch = (e as TouchEvent).touches?.[0] || (e as React.TouchEvent).touches[0];
      if (!touch) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left - radius;
      const y = touch.clientY - rect.top - radius;

      // Constrain to circle
      const distance = Math.sqrt(x * x + y * y);
      if (distance > radius) {
        const ratio = radius / distance;
        setTouchX(x * ratio);
        setTouchY(y * ratio);
      } else {
        setTouchX(x);
        setTouchY(y);
      }

      const direction = getDirection(x, y);
      onMove(direction);
    },
    [isPressed, radius, getDirection, onMove]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    setTouchX(0);
    setTouchY(0);
    onMove(null);
  }, [onMove]);

  useEffect(() => {
    if (isPressed) {
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isPressed, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className="relative bg-accent/20 rounded-full cursor-grab active:cursor-grabbing transition-opacity"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `2px solid rgb(var(--color-accent) / 0.5)`,
        userSelect: "none",
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      aria-label="Movement joystick"
    >
      {/* Inner knob */}
      <div
        className="absolute bg-accent rounded-full transition-transform"
        style={{
          width: `${innerRadius * 2}px`,
          height: `${innerRadius * 2}px`,
          left: `50%`,
          top: `50%`,
          transform: `translate(calc(-50% + ${touchX}px), calc(-50% + ${touchY}px))`,
        }}
      />
    </div>
  );
}
