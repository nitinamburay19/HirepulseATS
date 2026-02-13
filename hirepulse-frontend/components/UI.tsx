import React from 'react';
import { Loader2 } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-white rounded-[1.25rem] md:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center bg-slate-50/50">
        {title && <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-4 md:p-6">
      {children}
    </div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading, className = '', ...props }) => {
  const baseStyle = "relative inline-flex items-center justify-center px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-[1.5rem] md:rounded-[2rem]";
  
  const variants = {
    primary: "bg-indigo-900 text-white hover:bg-indigo-800 focus:ring-indigo-900 shadow-lg shadow-indigo-900/20",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600 shadow-lg shadow-rose-600/20",
    ghost: "bg-transparent text-indigo-600 hover:bg-indigo-50"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 md:ml-4">{label}</label>
    <input 
      className={`bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-[1.25rem] md:rounded-[2rem] focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 md:p-4 placeholder-slate-400 transition-all ${className}`} 
      {...props} 
    />
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate' }> = ({ children, color = 'slate' }) => {
  const colors = {
    indigo: "bg-indigo-100 text-indigo-800",
    emerald: "bg-emerald-100 text-emerald-800",
    rose: "bg-rose-100 text-rose-800",
    amber: "bg-amber-100 text-amber-800",
    slate: "bg-slate-100 text-slate-800",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

export const SyncIndicator: React.FC<{ isSyncing: boolean }> = ({ isSyncing }) => {
  if (!isSyncing) return null;
  return (
    <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
      </span>
      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Syncing Artifacts</span>
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[1.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-[zoomIn_0.2s_ease-out]">
        <div className="sticky top-0 bg-white/90 backdrop-blur z-10 px-4 md:px-8 py-4 md:py-6 border-b border-slate-100 flex justify-between items-center gap-2">
          <h2 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800 pr-2">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <span className="text-xl font-bold text-slate-400">×</span>
          </button>
        </div>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
