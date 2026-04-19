'use client';

import { useId } from 'react';

export function Logo({ size = 32 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  const goldId = `gemGold-${id}`;
  const violetId = `gemViolet-${id}`;
  const filterId = `gemFilter-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        {/* Gold gradient for left half */}
        <linearGradient
          id={goldId}
          x1="18"
          y1="12"
          x2="18"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FCD34D" />
          <stop offset="1" stopColor="#92400E" />
        </linearGradient>

        {/* Violet gradient for right half */}
        <linearGradient
          id={violetId}
          x1="46"
          y1="12"
          x2="46"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#C4B5FD" />
          <stop offset="1" stopColor="#4C1D95" />
        </linearGradient>

        {/* Amber glow drop shadow */}
        <filter
          id={filterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#F59E0B"
            floodOpacity="0.25"
          />
        </filter>
      </defs>

      {/* Gem body with glow */}
      <g filter={`url(#${filterId})`}>
        {/* Left half - gold */}
        <path
          d="M18,12 L32,12 L32,60 L6,32 Z"
          fill={`url(#${goldId})`}
        />
        {/* Right half - violet */}
        <path
          d="M32,12 L46,12 L58,32 L32,60 Z"
          fill={`url(#${violetId})`}
        />
      </g>

      {/* Outline */}
      <path
        d="M18,12 L46,12 L58,32 L32,60 L6,32 Z"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        strokeOpacity="0.15"
      />

      {/* Internal facet lines */}
      <g stroke="white" strokeWidth="0.8" strokeLinecap="round">
        <line x1="18" y1="12" x2="6" y2="32" opacity="0.2" />
        <line x1="46" y1="12" x2="58" y2="32" opacity="0.2" />
        <line x1="18" y1="12" x2="32" y2="32" opacity="0.25" />
        <line x1="46" y1="12" x2="32" y2="32" opacity="0.25" />
        <line x1="6" y1="32" x2="32" y2="60" opacity="0.2" />
        <line x1="58" y1="32" x2="32" y2="60" opacity="0.2" />
      </g>

      {/* Center dividing line */}
      <line
        x1="32"
        y1="12"
        x2="32"
        y2="60"
        stroke="white"
        strokeWidth="1.2"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />

      {/* Glowing dot at top center */}
      <circle cx="32" cy="12" r="5" fill="white" opacity="0.12" />
      <circle cx="32" cy="12" r="2" fill="white" opacity="0.9" />
    </svg>
  );
}
