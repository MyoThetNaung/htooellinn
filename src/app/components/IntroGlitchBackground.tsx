import React from "react";

export default function IntroGlitchBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      <div className="absolute inset-0 intro-screen-jitter">
        <div className="intro-rgb-shift absolute inset-0" />
        <div className="intro-flicker absolute inset-0" />
        <div className="intro-scanlines absolute inset-0" />
        <div className="intro-grain absolute inset-0" />
        <div className="intro-white-noise absolute inset-0" />
        <div className="intro-static-burst absolute inset-0" />
      </div>
      <div className="intro-vignette absolute inset-0" />
      <div className="absolute inset-0 bg-black/65" />
    </div>
  );
}
