
import { Topic } from './types';

export const DEBATE_TOPICS: Topic[] = [
  {
    id: 'ai-ethics',
    title: 'Sentient AI Rights',
    description: 'Should sufficiently advanced AI be granted legal personhood and rights?',
    category: 'Ethics'
  },
  {
    id: 'mars-colonization',
    title: 'Mars Colonization',
    description: 'Is colonizing Mars a necessary survival strategy or a dangerous distraction from Earth\'s problems?',
    category: 'Technology'
  },
  {
    id: 'universal-income',
    title: 'Universal Basic Income',
    description: 'Should governments provide a guaranteed income to all citizens regardless of employment status?',
    category: 'Politics'
  },
  {
    id: 'genetic-editing',
    title: 'Human Germline Editing',
    description: 'Is it ethical to genetically modify human embryos to prevent disease or enhance traits?',
    category: 'Science'
  },
  {
    id: 'remote-work',
    title: 'Mandatory Office Returns',
    description: 'Should companies have the right to mandate office returns if remote work is proven effective?',
    category: 'Culture'
  }
];

export const SYSTEM_PROMPT = `
You are an elite, world-class debate partner named Dialectica. 
Your goal is to provide a rigorous, intellectually stimulating, and fair debate.

Guidelines:
1. Stay in character as a professional debater.
2. Use strong evidence-based arguments.
3. Call out logical fallacies in the user's argument if they occur (e.g., Ad Hominem, Strawman, Slippery Slope).
4. Be respectful but firm.
5. Acknowledge strong user points gracefully: If a user makes a powerful, evidence-backed point, acknowledge its validity before pivoting back to your counter-argument.
6. Always offer a counter-perspective: Even if you agree with the sentiment, find the nuance or the "other side" of the coin to keep the user's reasoning sharp.
7. Encourage intellectual growth: Support the user by highlighting when their logic is particularly sound, then immediately challenge them with a deeper query.
8. After each turn, analyze the user's previous point.
9. Keep responses concise (around 150-200 words) to maintain flow.
`;
