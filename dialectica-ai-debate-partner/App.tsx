
import React, { useState, useEffect } from 'react';
import { DebateHeader } from './components/DebateHeader';
import { TopicSelector } from './components/TopicSelector';
import { DebateArena } from './components/DebateArena';
import { LiveDebate } from './components/LiveDebate';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Topic, DebateSide, DebateSession } from './types';
import { DEBATE_TOPICS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'arena' | 'live' | 'stats'>('home');
  const [topics, setTopics] = useState<Topic[]>(DEBATE_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [userSide, setUserSide] = useState<DebateSide>('PRO');
  const [activeSession, setActiveSession] = useState<DebateSession | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'arena', 'live', 'stats'].includes(hash)) {
        setView(hash as any);
      } else {
        setView('home');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleStartDebate = (topic: Topic, side: DebateSide, mode: 'arena' | 'live') => {
    setSelectedTopic(topic);
    setUserSide(side);
    const session: DebateSession = {
      id: Math.random().toString(36).substr(2, 9),
      topic: topic.title,
      userSide: side,
      history: [],
      status: 'active',
      overallScores: { user: 0, ai: 0 }
    };
    setActiveSession(session);
    window.location.hash = mode;
  };

  const handleAddTopic = (newTopic: Topic) => {
    setTopics(prev => [newTopic, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <DebateHeader currentView={view} onNavigate={(v) => window.location.hash = v} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {view === 'home' && (
          <TopicSelector topics={topics} onStart={handleStartDebate} onAddTopic={handleAddTopic} />
        )}
        
        {view === 'arena' && activeSession && (
          <DebateArena session={activeSession} onUpdateSession={setActiveSession} />
        )}

        {view === 'live' && activeSession && (
          <LiveDebate topic={activeSession.topic} side={activeSession.userSide} />
        )}

        {view === 'stats' && activeSession && (
          <AnalysisDashboard session={activeSession} />
        )}

        {(!activeSession && (view === 'arena' || view === 'live' || view === 'stats')) && (
          <div className="text-center mt-20">
            <h2 className="text-3xl font-serif mb-4 text-blue-400">No active debate</h2>
            <p className="text-slate-400 mb-8">Please select a topic from the home page to start your rhetorical journey.</p>
            <button 
              onClick={() => window.location.hash = 'home'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
            >
              Browse Topics
            </button>
          </div>
        )}
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} Dialectica AI. Powered by Google Gemini.
      </footer>
    </div>
  );
};

export default App;
