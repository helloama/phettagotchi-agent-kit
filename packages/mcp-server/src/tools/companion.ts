/** Companion tools — get_companion_url, talk_to_pet */

import type { Tool } from './types.js';

export const tools: Tool[] = [
  {
    name: 'get_companion_url',
    description:
      'Get the companion page URL for your pet. The companion page shows a live 3D view of your pet with chat, stats, and status. Perfect for sidebars and overlays.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
      },
    },
  },
  {
    name: 'talk_to_pet',
    description:
      'Send a message to your pet and get a response filtered through its personality. Your pet\'s mood affects how it responds. Talking to your pet can boost its mood!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
        message: { type: 'string', description: 'What to say to your pet' },
      },
      required: ['message'],
    },
  },
];

export async function handle(
  name: string,
  args: Record<string, unknown>,
  wallet: string,
  apiGet: (path: string) => Promise<unknown>,
  _apiPost: (path: string, body: Record<string, unknown>) => Promise<unknown>,
): Promise<unknown> {
  switch (name) {
    case 'get_companion_url':
      return {
        url: `https://phettagotchi.com/companion?wallet=${wallet}`,
        badge: `[![Phettagotchi](https://phettagotchi.com/api/badge/${wallet})](https://phettagotchi.com/companion?wallet=${wallet})`,
        message: 'Open this URL to see your pet live in a sidebar or browser tab.',
      };
    case 'talk_to_pet': {
      // Get pet state first to know mood/personality
      const state = await apiGet(`/api/agent/state/${wallet}`) as any;
      const mood = state?.stats?.moodLabel || 'Neutral';
      const petType = state?.battleStats?.element || 'Normal';
      const streak = state?.stats?.streak || 0;
      const level = state?.battleStats?.level || 1;
      const evolution = state?.evolution?.stage || 'Baby';

      // Generate a personality-filtered response
      const personality = getPetPersonality(mood, petType, evolution, level, streak);
      return {
        petResponse: personality.respond(args.message as string),
        mood,
        petType,
        level,
        streak,
        evolution,
      };
    }
    default:
      return null;
  }
}

function getPetPersonality(mood: string, element: string, evolution: string, level: number, streak: number) {
  const moodTones: Record<string, string> = {
    'Ecstatic': 'overjoyed and bouncy',
    'Happy': 'cheerful and friendly',
    'Content': 'calm and pleasant',
    'Neutral': 'a bit reserved',
    'Sad': 'droopy and quiet',
    'Miserable': 'very down and needs comfort',
  };

  const cleanMood = mood.replace(/^[^\s]+ /, ''); // Remove emoji prefix
  const tone = moodTones[cleanMood] || 'neutral';

  return {
    respond(message: string) {
      const greetings = [
        `*${evolution} ${element}-type pet looks at you, feeling ${tone}*`,
        `[Lv.${level} | Streak: ${streak}]`,
      ];

      // Simple personality responses
      const lower = message.toLowerCase();
      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        greetings.push(cleanMood === 'Miserable'
          ? '*whimpers softly but wags tail a tiny bit*'
          : '*perks up and nuzzles you*');
      } else if (lower.includes('feed') || lower.includes('food') || lower.includes('hungry')) {
        greetings.push('*eyes light up at the mention of food!*');
      } else if (lower.includes('battle') || lower.includes('fight')) {
        greetings.push(level > 20
          ? '*strikes a confident battle pose!*'
          : '*tries to look tough but trips over own feet*');
      } else if (lower.includes('good') || lower.includes('love') || lower.includes('cute')) {
        greetings.push('*purrs happily and does a little spin*');
      } else {
        greetings.push('*tilts head curiously and listens*');
      }

      if (!streak || streak === 0) {
        greetings.push('*looks hungry... maybe feed me today?*');
      }

      return greetings.join('\n');
    },
  };
}
