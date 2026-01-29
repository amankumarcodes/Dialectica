
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { DebateSession, Message } from '../types';
import { SYSTEM_PROMPT } from '../constants';

interface Props {
  session: DebateSession;
  onUpdateSession: (session: DebateSession) => void;
}

export const DebateArena: React.FC<Props> = ({ session, onUpdateSession }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [session.history, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const newHistory = [...session.history, userMsg];
    onUpdateSession({ ...session, history: newHistory });
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        TOPIC: ${session.topic}
        MY POSITION: ${session.userSide === 'PRO' ? 'CON' : 'PRO'} (Countering User)
        USER POSITION: ${session.userSide}
        
        ${SYSTEM_PROMPT}

        Respond to the user's latest point: "${input}"
        
        Provide your response in JSON format with these fields:
        1. responseText (string): Your counter-argument.
        2. logicalFallaciesFound (array of strings): Any fallacies found in user's text.
        3. userArgumentScore (number 1-10): How strong was the user's argument?
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              responseText: { type: Type.STRING },
              logicalFallaciesFound: { type: Type.ARRAY, items: { type: Type.STRING } },
              userArgumentScore: { type: Type.NUMBER }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.responseText,
        timestamp: Date.now(),
        fallacies: data.logicalFallaciesFound,
        score: data.userArgumentScore
      };

      const updatedHistory = [...newHistory, modelMsg];
      
      // Update overall scores
      const totalUserScore = updatedHistory
        .filter(m => m.role === 'model')
        .reduce((acc, m) => acc + (m.score || 0), 0);
      
      onUpdateSession({
        ...session,
        history: updatedHistory,
        overallScores: {
          ...session.overallScores,
          user: totalUserScore
        }
      });

    } catch (error) {
      console.error("Debate error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto glass rounded-3xl overflow-hidden shadow-2xl">
      {/* Status Bar */}
      <div className="bg-slate-900/80 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${session.userSide === 'PRO' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
            You: {session.userSide}
          </div>
          <span className="text-slate-500">vs</span>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${session.userSide === 'CON' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
            AI: {session.userSide === 'PRO' ? 'CON' : 'PRO'}
          </div>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <span className="text-slate-400">Rounds: <span className="text-white">{Math.floor(session.history.length / 2)}</span></span>
          <span className="text-slate-400">Total Logic Score: <span className="text-blue-400">{session.overallScores.user}</span></span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        {session.history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <i className="fas fa-gavel text-6xl text-slate-700 mb-4"></i>
            <h3 className="text-2xl font-serif text-slate-400">The floor is yours.</h3>
            <p className="text-slate-500 max-w-sm mt-2">Open the debate by presenting your primary thesis on <span className="text-blue-400">{session.topic}</span>.</p>
          </div>
        )}
        
        {session.history.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-5 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-slate-800 border border-slate-700 text-slate-100'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                  {msg.role === 'user' ? 'Proponent' : 'Opponent'}
                </span>
                {msg.role === 'model' && msg.score !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    msg.score > 7 ? 'bg-green-500/20 text-green-400' : 
                    msg.score > 4 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    Argument Strength: {msg.score}/10
                  </span>
                )}
              </div>
              
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              
              {msg.fallacies && msg.fallacies.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-triangle-exclamation text-amber-500 text-xs"></i>
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Fallacies Detected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.fallacies.map((f, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-200 text-[10px] rounded border border-amber-500/30">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700">
        <div className="relative flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your argument here... (Press Enter to send)"
            className="flex-grow bg-slate-800 text-white rounded-2xl p-4 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[60px] max-h-[200px] border border-slate-700"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`absolute bottom-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              !input.trim() || isTyping 
                ? 'bg-slate-700 text-slate-500' 
                : 'bg-blue-600 text-white hover:scale-105 shadow-lg shadow-blue-900/20'
            }`}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
        <div className="mt-2 text-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Logic & Rhetoric Processing Active
          </span>
        </div>
      </div>
    </div>
  );
};
