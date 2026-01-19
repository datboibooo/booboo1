"use client";

import * as React from "react";

export function OceanBackground() {
  return (
    <>
      {/* Light rays from surface */}
      <div className="light-rays" aria-hidden="true" />

      {/* Caustic light patterns */}
      <div className="caustics" aria-hidden="true" />

      {/* Ocean wave layers */}
      <div className="ocean-waves" aria-hidden="true">
        <div className="ocean-wave ocean-wave-1" />
        <div className="ocean-wave ocean-wave-2" />
        <div className="ocean-wave ocean-wave-3" />
      </div>

      {/* Floating particles/bubbles */}
      <div className="ocean-particles" aria-hidden="true">
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
      </div>

      {/* Depth fog at bottom */}
      <div className="ocean-depth" aria-hidden="true" />
    </>
  );
}
