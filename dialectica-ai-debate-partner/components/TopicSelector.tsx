
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Topic, DebateSide } from '../types';

interface Props {
  topics: Topic[];
  onStart: (topic: Topic, side: DebateSide, mode: 'arena' | 'live') => void;
  onAddTopic: (topic: Topic) => void;
}

export const TopicSelector: React.FC<Props> = ({ topics, onStart, onAddTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [side, setSide] = useState<DebateSide>('PRO');
  const [isCreating, setIsCreating] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateCustom = async () => {
    if (!customTitle.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Refine this debate topic: "${customTitle}". 
      Provide a formal debate description and categorize it as one of: Ethics, Technology, Politics, Science, Culture.
      Frame the description as a rigorous "Should..." or "Is..." question.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              category: { 
                type: Type.STRING, 
                description: "Must be one of: Ethics, Technology, Politics, Science, Culture" 
              }
            },
            required: ['description', 'category']
          }
        }
      });

      const data = JSON.parse(response.text);
      const newTopic: Topic = {
        id: Math.random().toString(36).substr(2, 9),
        title: customTitle,
        description: data.description,
        category: data.category as any
      };

      onAddTopic(newTopic);
      setSelectedTopic(newTopic);
      setIsCreating(false);
      setCustomTitle('');
    } catch (error) {
      console.error("Failed to generate topic details:", error);
      // Fallback
      const fallback: Topic = {
        id: Math.random().toString(36).substr(2, 9),
        title: customTitle,
        description: `A debate regarding ${customTitle}.`,
        category: 'Culture'
      };
      onAddTopic(fallback);
      setSelectedTopic(fallback);
      setIsCreating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-serif font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          Enter the Arena
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Choose your battlefield. Engage in high-stakes reasoning with our advanced linguistic models.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Custom Card */}
        <div 
          onClick={() => setIsCreating(true)}
          className="cursor-pointer group p-6 rounded-2xl border border-dashed border-slate-700 hover:border-blue-500 bg-slate-800/20 flex flex-col items-center justify-center transition-all min-h-[160px]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
            <i className="fas fa-plus text-xl"></i>
          </div>
          <span className="font-bold text-slate-400 group-hover:text-blue-400">Custom Topic</span>
          <span className="text-xs text-slate-500 mt-1 italic">Define your own battlefield</span>
        </div>

        {topics.map((topic) => (
          <div 
            key={topic.id}
            onClick={() => setSelectedTopic(topic)}
            className={`cursor-pointer group p-6 rounded-2xl transition-all duration-300 border ${
              selectedTopic?.id === topic.id 
                ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300">
                {topic.category}
              </span>
              {selectedTopic?.id === topic.id && <i className="fas fa-circle-check text-blue-400"></i>}
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{topic.title}</h3>
            <p className="text-slate-400 text-sm line-clamp-3">{topic.description}</p>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg p-8 rounded-3xl border border-blue-500/30 animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif font-bold">New Debate Topic</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Topic Title</label>
                <input 
                  autoFocus
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. The ethics of lab-grown meat"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button 
                onClick={handleCreateCustom}
                disabled={!customTitle.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-wand-magic-sparkles animate-pulse"></i>
                    AI Refinement...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sparkles"></i>
                    Initialize with AI
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-500 uppercase tracking-tighter">
                Gemini will generate a formal prompt and category
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedTopic && !isCreating && (
        <div className="mt-12 p-8 glass rounded-3xl border border-blue-500/30 animate-slideUp">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-bold uppercase tracking-widest text-blue-400">Selected Subject</h4>
                <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 text-[10px] font-bold">
                  {selectedTopic.category}
                </span>
              </div>
              <h3 className="text-3xl font-serif font-bold">{selectedTopic.title}</h3>
              <p className="text-slate-400 mt-2 italic">"{selectedTopic.description}"</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-700">
                <button 
                  onClick={() => setSide('PRO')}
                  className={`flex-1 px-8 py-3 rounded-lg font-bold transition-all ${
                    side === 'PRO' ? 'bg-green-600 text-white shadow-lg shadow-green-900/40' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  PRO
                </button>
                <button 
                  onClick={() => setSide('CON')}
                  className={`flex-1 px-8 py-3 rounded-lg font-bold transition-all ${
                    side === 'CON' ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  CON
                </button>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => onStart(selectedTopic, side, 'arena')}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-keyboard"></i>
                  Text Arena
                </button>
                <button 
                  onClick={() => onStart(selectedTopic, side, 'live')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-microphone"></i>
                  Live Voice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
