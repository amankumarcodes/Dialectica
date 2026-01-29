
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { DebateSide } from '../types';

interface Props {
  topic: string;
  side: DebateSide;
}

export const LiveDebate: React.FC<Props> = ({ topic, side }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Audio helpers
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    if (isActive) return;
    setIsConnecting(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: createBlob(inputData) });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsActive(true);
            setIsConnecting(false);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setTranscription(prev => [...prev.slice(-4), `AI: ${msg.serverContent!.outputTranscription!.text}`]);
            }
            if (msg.serverContent?.inputTranscription) {
              setTranscription(prev => [...prev.slice(-4), `You: ${msg.serverContent!.inputTranscription!.text}`]);
            }

            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              const startTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(startTime);
              nextStartTimeRef.current = startTime + buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e) => console.error("Live API Error:", e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are a professional debate partner. Topic: ${topic}. User side: ${side}. You take the OPPOSITE side. Be rigorous, speak naturally, and challenge the user's logic immediately.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center gap-8 py-12">
      <div className="text-center">
        <h2 className="text-4xl font-serif font-bold mb-2">Vocal Rhetoric</h2>
        <p className="text-slate-400">Speak naturally. Gemini will respond in real-time.</p>
      </div>

      <div className="relative">
        {/* Visualizer Circle */}
        <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
          isActive 
            ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)] bg-blue-500/10' 
            : 'border-slate-800 bg-slate-900'
        }`}>
          {isActive ? (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className="w-2 bg-blue-400 rounded-full animate-pulse" 
                  style={{ height: `${Math.random() * 60 + 20}px`, animationDelay: `${i * 0.1}s` }}
                ></div>
              ))}
            </div>
          ) : (
            <i className="fas fa-microphone-slash text-6xl text-slate-700"></i>
          )}
        </div>

        {/* Pulsing rings when active */}
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping [animation-duration:3s]"></div>
            <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping [animation-delay:1.5s] [animation-duration:3s]"></div>
          </>
        )}
      </div>

      <div className="w-full glass p-6 rounded-3xl min-h-[200px] flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Live Transcription</h4>
        {transcription.length === 0 ? (
          <p className="text-slate-600 italic text-center mt-8">Start the session to see live conversation...</p>
        ) : (
          transcription.map((t, i) => (
            <div key={i} className={`text-sm ${t.startsWith('You') ? 'text-blue-400' : 'text-slate-300'}`}>
              <span className="font-bold mr-2">{t.split(':')[0]}:</span>
              <span>{t.split(':').slice(1).join(':')}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-4">
        {!isActive ? (
          <button 
            onClick={startSession}
            disabled={isConnecting}
            className="px-12 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-900/40 transition-all flex items-center gap-3"
          >
            {isConnecting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-power-off"></i>}
            {isConnecting ? 'Connecting...' : 'Connect to Voice'}
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-lg shadow-xl shadow-red-900/40 transition-all flex items-center gap-3"
          >
            <i className="fas fa-stop"></i>
            End Session
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 p-4 rounded-xl text-center max-w-sm">
        <p className="text-xs text-slate-400">
          <i className="fas fa-info-circle mr-2"></i>
          Ensure your microphone is accessible. For best results, use headphones to prevent echo.
        </p>
      </div>
    </div>
  );
};
