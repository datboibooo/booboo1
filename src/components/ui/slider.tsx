"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: SliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const percentage = ((value[0] - min) / (max - min)) * 100;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const clickPercentage = (e.clientX - rect.left) / rect.width;
    const newValue = Math.round((clickPercentage * (max - min) + min) / step) * step;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onValueChange([clampedValue]);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || e.buttons !== 1) return;
    handleTrackClick(e);
  };

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-2 w-full cursor-pointer rounded-full bg-[--background-tertiary]",
        className
      )}
      onClick={handleTrackClick}
      onMouseMove={handleDrag}
    >
      {/* Filled track */}
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-[--accent]"
        style={{ width: `${percentage}%` }}
      />

      {/* Thumb */}
      <div
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[--accent] bg-[--background] shadow-md cursor-grab active:cursor-grabbing"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
}
