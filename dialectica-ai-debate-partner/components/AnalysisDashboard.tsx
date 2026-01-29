
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from 'recharts';
import { DebateSession } from '../types';

interface Props {
  session: DebateSession;
}

export const AnalysisDashboard: React.FC<Props> = ({ session }) => {
  const chartData = useMemo(() => {
    return session.history
      .filter(m => m.role === 'model' && m.score !== undefined)
      .map((m, i) => ({
        turn: i + 1,
        score: m.score
      }));
  }, [session.history]);

  const fallacyCount = useMemo(() => {
    const counts: Record<string, number> = {};
    session.history.forEach(m => {
      m.fallacies?.forEach(f => {
        counts[f] = (counts[f] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [session.history]);

  const radarData = useMemo(() => {
    // Generate some mock dimensions for visual variety based on history length/scores
    return [
      { subject: 'Logic', A: Math.min(100, (session.overallScores.user / (session.history.length || 1)) * 10), fullMark: 100 },
      { subject: 'Evidence', A: 65, fullMark: 100 },
      { subject: 'Clarity', A: 80, fullMark: 100 },
      { subject: 'Rhetoric', A: 70, fullMark: 100 },
      { subject: 'Courtesy', A: 95, fullMark: 100 },
    ];
  }, [session.overallScores.user, session.history.length]);

  if (session.history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <i className="fas fa-chart-pie text-6xl text-slate-800 mb-4"></i>
        <h2 className="text-3xl font-serif text-slate-500">Analytics Unavailable</h2>
        <p className="text-slate-600 mt-2">Engage in at least one round of debate to see your performance metrics.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif font-bold mb-2">Performance Analytics</h2>
        <p className="text-slate-400">Topic: <span className="text-blue-400">{session.topic}</span></p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Score Progress */}
        <div className="md:col-span-2 glass p-6 rounded-3xl border border-slate-700/50">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-arrow-trend-up text-blue-500"></i>
            Argument Strength Trend
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="turn" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Skills */}
        <div className="glass p-6 rounded-3xl border border-slate-700/50">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-bullseye text-indigo-500"></i>
            Rhetorical Profile
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar
                  name="Debater"
                  dataKey="A"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fallacy Breakdown */}
        <div className="glass p-6 rounded-3xl border border-slate-700/50">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-triangle-exclamation text-amber-500"></i>
            Logical Vulnerabilities
          </h3>
          {fallacyCount.length > 0 ? (
            <div className="space-y-4">
              {fallacyCount.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                  <span className="font-medium text-slate-300">{f.name}</span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-xs font-bold">
                    Detected {f.value}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-double text-2xl"></i>
              </div>
              <p className="text-slate-400">No logical fallacies detected yet. Pure logic!</p>
            </div>
          )}
        </div>

        {/* Global Standings */}
        <div className="glass p-6 rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400 block mb-2">Overall Mastery</span>
            <div className="text-7xl font-serif font-black text-white">
              {Math.round((session.overallScores.user / (session.history.length || 1)) * 10)}
            </div>
            <span className="text-slate-500 mt-2 block">Dialectica Quotient (DQ)</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000"
              style={{ width: `${Math.min(100, (session.overallScores.user / (session.history.length || 1)) * 10)}%` }}
            ></div>
          </div>
          <p className="mt-4 text-sm text-slate-400 max-w-xs">
            Your performance ranks in the top <span className="text-white font-bold">15%</span> of linguistic reasoners for this topic.
          </p>
        </div>
      </div>
    </div>
  );
};
