import React from 'react';

const CakeTrackLogo: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-40 pointer-events-none select-none animate-fade-in-up">
      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-soft border border-brand-100/50 hover:shadow-glow transition-shadow duration-500 group">
        <div className="relative w-9 h-9 transform group-hover:-translate-x-1 transition-transform duration-300">
          {/* Sleek Truck SVG */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            {/* Motion Lines */}
            <path
              d="M1 12H5M1 16H3"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100"
            />
            
            {/* Truck Body - Sleek Aerodynamic Shape with Gradient Fill */}
            <path
              d="M7 10C7 8.89543 7.89543 8 9 8H19L23.5 11.5C24.4 12.2 25 13.3 25 14.5V19C25 19.55 24.55 20 24 20H23C23 21.6569 21.6569 23 20 23C18.3431 23 17 21.6569 17 20H13C13 21.6569 11.6569 23 10 23C8.34315 23 7 21.6569 7 20V10Z"
              className="fill-brand-400 group-hover:fill-brand-500 transition-colors duration-300"
            />
            
            {/* Window - Lighter Tone */}
            <path
              d="M19 9V13H23.5L19.5 9.5H19Z"
              className="fill-brand-100"
            />
            
            {/* Wheels - Pastel Pink Accent for 'Cake' vibe (Subtle sophistication) */}
            <circle cx="10" cy="20" r="2" className="fill-white" />
            <circle cx="20" cy="20" r="2" className="fill-white" />
            <circle cx="10" cy="20" r="1" className="fill-rose-300" />
            <circle cx="20" cy="20" r="1" className="fill-rose-300" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xs font-bold text-slate-800 tracking-wide font-sans group-hover:text-brand-600 transition-colors">CakeTrack</span>
          <span className="text-[0.6rem] text-slate-400 font-medium tracking-wider uppercase">Express</span>
        </div>
      </div>
    </div>
  );
};

export default CakeTrackLogo;