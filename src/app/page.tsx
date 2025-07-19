'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const NekoCat = dynamic(() => import('@/components/NekoCat'), {
  ssr: false,
});

const CatControls = dynamic(() => import('@/components/CatControls'), {
  ssr: false,
});

type ControlMode = 'follow' | 'sleep' | 'stop';

// Social media icons as SVG components
const GitHubIcon = () => (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const TwitchIcon = () => (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FaZeIcon = () => (
  <img
    src="/Faze_Clan.svg"
    alt="FaZe Clan"
    className="w-full h-full filter brightness-0 invert opacity-75 hover:opacity-100 transition-opacity duration-200"
  />
);

export default function Home() {
  const [controlMode, setControlMode] = useState<ControlMode>('follow');

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* FaZe-themed gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-black to-red-950">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-red-700/15 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center text-white px-6 py-12">
        <div className="text-left space-y-4 md:space-y-6 max-w-4xl w-full">
          {/* Main title */}
          <h1 className="font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight">
            Neriousy
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-200 font-light">
            Filip Hejmowski
          </h2>

          <p className="text-gray-300 text-base sm:text-lg md:text-xl font-light max-w-2xl mt-4 md:mt-6 leading-relaxed">
            I try to build things — and when they break, I throw AI at them
            until they work. Sometimes it even feels like I know what I'm doing.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl font-light space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4 mt-4">
            <span>Software Developer</span>
            <span className="hidden sm:inline">•</span>
            <span>AI Explorer</span>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
              <span>Counter Strike Tryhard</span>
              <span className="text-red-400 font-medium">#FazeUp</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8">
                <FaZeIcon />
              </div>
            </div>
          </div>
          {/* Social media icons */}
          <div className="flex items-center justify-start space-x-8 sm:space-x-10 md:space-x-12 mt-8 md:mt-12">
            <a
              href="https://github.com/neriousy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-all duration-200 transform hover:scale-125"
              aria-label="GitHub"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                <GitHubIcon />
              </div>
            </a>
            <a
              href="https://www.twitch.tv/xneriousy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-purple-400 transition-all duration-200 transform hover:scale-125"
              aria-label="Twitch"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                <TwitchIcon />
              </div>
            </a>
            <a
              href="https://x.com/Neriousy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-400 transition-all duration-200 transform hover:scale-125"
              aria-label="Twitter"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                <TwitterIcon />
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Cat components */}
      <NekoCat controlMode={controlMode} />
      <CatControls currentMode={controlMode} onModeChange={setControlMode} />
    </div>
  );
}
