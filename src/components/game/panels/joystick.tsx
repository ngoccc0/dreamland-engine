"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface JoystickProps {
  onMove: (direction: "north" | "south" | "east" | "west" | null) => void;
  onInteract?: () => void;
  interactIcon?: React.ReactNode;
  size?: number;
  className?: string;
}

/**
 * Mobile joystick component with smart center button for context-aware interaction.
 *
 * @remarks
 * Uses touch events to track finger position and emit movement directions.
 * When the joystick is tapped without dragging far (within deadzone), the onInteract callback fires.
 * This allows a single control element to handle both movement AND context-sensitive actions.
 *
 * **Features:**
 * - Directional movement when dragging outside deadzone
 * - Tap-to-interact when pressed lightly (max drag < deadzone)
 * - Optional context-aware icon display in center knob
 * - Haptic feedback ready (caller handles vibration)
 *
 * @param {function} onMove - Callback with direction or null
 * @param {function} onInteract - Optional callback for center tap action
 * @param {React.ReactNode} interactIcon - Optional icon/element to show in center knob
 * @param {number} size - Size in pixels (default: 120)
 * @param {string} className - Optional CSS classes
 *
 * @example
 * <Joystick
 *   onMove={(dir) => handleMove(dir)}
 *   onInteract={() => handleAction()}
 *   interactIcon={<Icon />}
 *   size={140}
 * />
 */
export function Joystick({
  onMove,
  onInteract,
  interactIcon,
  size = 120,
  className,
}: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchX, setTouchX] = useState(0);
  const [touchY, setTouchY] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track max distance to differentiate tap from drag
  const maxDragDistanceRef = useRef(0);

  const radius = size / 2;
  const innerRadius = size / 5;
  const deadZone = size / 6;

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
    maxDragDistanceRef.current = 0; // Reset drag tracking
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (!isPressed || !containerRef.current) return;

      if (e.cancelable) e.preventDefault();

      const touch = (e as TouchEvent).touches?.[0] || (e as React.TouchEvent).touches[0];
      if (!touch) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left - radius;
      const y = touch.clientY - rect.top - radius;

      const distance = Math.sqrt(x * x + y * y);

      // Track max distance for tap detection
      if (distance > maxDragDistanceRef.current) {
        maxDragDistanceRef.current = distance;
      }

      // Constrain to circle
      if (distance > radius) {
        const ratio = radius / distance;
        setTouchX(x * ratio);
        setTouchY(y * ratio);
      } else {
        setTouchX(x);
        setTouchY(y);
      }

      // Only trigger move if outside deadzone
      if (distance > deadZone) {
        setIsDragging(true);
        const direction = getDirection(x, y);
        onMove(direction);
      } else {
        onMove(null);
      }
    },
    [isPressed, radius, getDirection, onMove, deadZone]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();

      setIsPressed(false);
      setTouchX(0);
      setTouchY(0);
      onMove(null);

      // Smart button logic: if didn't drag far, treat as tap
      if (maxDragDistanceRef.current < deadZone && onInteract) {
        onInteract();
      }

      setIsDragging(false);
      maxDragDistanceRef.current = 0;
    },
    [onMove, onInteract, deadZone]
  );

  useEffect(() => {
    if (isPressed) {
      // Use non-passive listener to allow preventing default
      document.addEventListener("touchmove", handleTouchMove as any, { passive: false });
      document.addEventListener("touchend", handleTouchEnd as any);

      return () => {
        document.removeEventListener("touchmove", handleTouchMove as any);
        document.removeEventListener("touchend", handleTouchEnd as any);
      };
    }
  }, [isPressed, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-full select-none touch-none transition-all duration-200",
        isPressed
          ? "opacity-100 backdrop-blur-sm"
          : "opacity-50 hover:opacity-90 backdrop-blur-[2px]",
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(200,200,200,0.1) 0%, rgba(var(--color-accent) / 0.15) 100%)`,
        border: `2px solid rgba(var(--color-accent) / 0.3)`,
        boxShadow: isPressed ? "0 0 20px rgba(var(--color-accent) / 0.3)" : "none",
      }}
      onTouchStart={handleTouchStart}
      aria-label="Movement joystick with interaction"
    >
      {/* Visual Guides */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="absolute top-2 w-1 h-1 bg-foreground rounded-full" />
        <div className="absolute bottom-2 w-1 h-1 bg-foreground rounded-full" />
        <div className="absolute left-2 w-1 h-1 bg-foreground rounded-full" />
        <div className="absolute right-2 w-1 h-1 bg-foreground rounded-full" />
      </div>

      {/* Inner knob */}
      <div
        className={cn(
          "absolute rounded-full flex items-center justify-center shadow-md transition-transform",
          isPressed ? "bg-accent text-accent-foreground" : "bg-accent/80 text-foreground"
        )}
        style={{
          width: `${innerRadius * 2}px`,
          height: `${innerRadius * 2}px`,
          left: `50%`,
          top: `50%`,
          transform: `translate3d(calc(-50% + ${touchX}px), calc(-50% + ${touchY}px), 0) scale(${isPressed ? 0.9 : 1
            })`,
        }}
      >
        {/* Smart action icon - show only when not dragging */}
        {!isDragging && interactIcon && (
          <div className="animate-in fade-in zoom-in duration-200 drop-shadow-sm">
            {interactIcon}
          </div>
        )}
      </div>
    </div>
  );
}
