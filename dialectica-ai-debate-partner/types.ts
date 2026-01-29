
export type DebateSide = 'PRO' | 'CON';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  fallacies?: string[];
  score?: number; // 0-10 score for this specific turn
}

export interface DebateSession {
  id: string;
  topic: string;
  userSide: DebateSide;
  history: Message[];
  status: 'active' | 'finished';
  overallScores: {
    user: number;
    ai: number;
  };
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: 'Ethics' | 'Technology' | 'Politics' | 'Science' | 'Culture';
}
