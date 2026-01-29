
import React from 'react';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const DebateHeader: React.FC<Props> = ({ currentView, onNavigate }) => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onNavigate('home')}
      >
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          <i className="fas fa-scale-balanced text-white text-xl"></i>
        </div>
        <h1 className="text-2xl font-serif tracking-tight text-white group-hover:text-blue-400 transition-colors">
          Dialectica
        </h1>
      </div>

      <nav className="flex items-center gap-2">
        <NavButton 
          active={currentView === 'home'} 
          onClick={() => onNavigate('home')}
          icon="fa-house"
          label="Lobby"
        />
        <NavButton 
          active={currentView === 'arena'} 
          onClick={() => onNavigate('arena')}
          icon="fa-comments"
          label="Arena"
        />
        <NavButton 
          active={currentView === 'live'} 
          onClick={() => onNavigate('live')}
          icon="fa-microphone"
          label="Live"
        />
        <NavButton 
          active={currentView === 'stats'} 
          onClick={() => onNavigate('stats')}
          icon="fa-chart-line"
          label="Analytics"
        />
      </nav>
    </header>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
      active 
        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    <i className={`fas ${icon} text-sm`}></i>
    <span className="text-sm font-medium hidden md:inline">{label}</span>
  </button>
);
