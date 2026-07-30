import React, { useEffect, useState } from 'react';
import { Layers, Activity, Cpu, Database } from 'lucide-react';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Loading application...');
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(35);
      setStatusText('Connecting services...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Indexing solution engine...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Welcome to Recall');
    }, 1400);

    const timer4 = setTimeout(() => {
      setIsFading(true);
    }, 1700);

    const timer5 = setTimeout(() => {
      onFinished();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center select-none transition-opacity duration-300 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute h-96 w-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse pointer-events-none" />

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm w-full px-6">
        {/* Animated Brand Logo Icon */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Ring */}
          <div className="absolute h-20 w-20 rounded-2xl bg-blue-500/20 animate-ping" />

          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-900 border border-blue-400/50 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Layers className="h-8 w-8 text-white animate-bounce" />
          </div>
        </div>

        {/* Brand Titles */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-300">
              Recall
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700">
              R1
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400">Error Memory & Solution Hub</p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span className="flex items-center space-x-1.5 truncate pr-2">
              <Activity className="h-3 w-3 text-blue-400 animate-spin" />
              <span className="truncate">{statusText}</span>
            </span>
            <span className="text-blue-400 font-bold">{progress}%</span>
          </div>
        </div>

        {/* System Capability Badges */}
        <div className="flex items-center justify-center space-x-3 text-[10px] font-mono text-slate-400 pt-4 border-t border-slate-900 w-full">
          <span className="flex items-center space-x-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <Cpu className="h-3 w-3 text-blue-400" />
            <span>Error Index</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <Database className="h-3 w-3 text-emerald-400" />
            <span>Memory Store</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <Layers className="h-3 w-3 text-sky-400" />
            <span>Ranking Engine</span>
          </span>
        </div>
      </div>
    </div>
  );
};
