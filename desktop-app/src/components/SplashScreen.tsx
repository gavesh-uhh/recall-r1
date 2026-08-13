import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Database } from 'lucide-react';
import logoImage from '../assets/logo1.png';

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
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center select-none transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none invisible' : 'opacity-100 visible'
      }`}
    >
      <div className="absolute h-96 w-96 rounded-full bg-[#fdad00]/10 blur-3xl animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm w-full px-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full bg-[#fdad00]/20 animate-ping" />

          <div className="flex items-center justify-center">
            <img
              src={logoImage}
              alt="Recall logo"
              className="h-32 w-32"
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-[#fdad00]">
              Recall
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#3b2a00] text-[#fdad00] border border-[#fdad00]">
              R1
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400">Error Memory & Solution Hub</p>
        </div>

        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#fdad00] via-[#ffca3a] to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <span className="flex items-center space-x-1.5 truncate pr-2">
              <Activity className="h-3.5 w-3.5 text-[#fdad00] animate-spin" />
              <span className="truncate">{statusText}</span>
            </span>
            <span className="text-[#fdad00] font-bold">{progress}%</span>
          </div>
        </div>

       
      </div>
    </div>
  );
};
