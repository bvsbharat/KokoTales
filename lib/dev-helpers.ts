// Development helpers and test data
import { StoryConfig, Character, GeneratedStory, StoryPage } from "./types";

export const createMockCharacter = (name: string, id?: string): Character => ({
  id: id || `char-${Math.random().toString(36).substr(2, 9)}`,
  name,
  description: `A friendly character named ${name}`,
  generatedDescription: `${name} is a colorful cartoon character with bright, expressive features and a cheerful personality.`,
});

export const createMockStory = (config: StoryConfig, characters: Character[]): GeneratedStory => {
  const mockPages: StoryPage[] = [
    {
      id: 'page-1',
      pageNumber: 1,
      panels: [
        {
          id: 'panel-1-1',
          description: 'The adventure begins in a magical forest',
          characters: characters.slice(0, 2).map(c => c.name),
          imageUrl: `data:image/svg+xml,<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="%234ECDC4"/>
            <rect x="20" y="20" width="360" height="260" fill="white" stroke="black" stroke-width="3"/>
            <text x="200" y="150" text-anchor="middle" fill="black" font-size="16" font-weight="bold">Panel 1</text>
          </svg>`,
          narration: 'Once upon a time, in a magical land...',
          dialogue: ['Hello!', 'What an adventure this will be!']
        },
        {
          id: 'panel-1-2',
          description: 'Our heroes meet for the first time',
          characters: characters.map(c => c.name),
          imageUrl: `data:image/svg+xml,<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="%23FF6B6B"/>
            <rect x="20" y="20" width="360" height="260" fill="white" stroke="black" stroke-width="3"/>
            <text x="200" y="150" text-anchor="middle" fill="black" font-size="16" font-weight="bold">Panel 2</text>
          </svg>`,
          narration: 'The characters meet and become friends',
          dialogue: ['Nice to meet you!', 'Let\'s go on an adventure!']
        }
      ]
    },
    {
      id: 'page-2',
      pageNumber: 2,
      panels: [
        {
          id: 'panel-2-1',
          description: 'The characters face their first challenge',
          characters: characters.map(c => c.name),
          imageUrl: `data:image/svg+xml,<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="%2345B7D1"/>
            <rect x="20" y="20" width="360" height="260" fill="white" stroke="black" stroke-width="3"/>
            <text x="200" y="150" text-anchor="middle" fill="black" font-size="16" font-weight="bold">Panel 3</text>
          </svg>`,
          narration: 'A challenge appears before our heroes',
          dialogue: ['We can do this together!', 'Yes, teamwork makes everything possible!']
        }
      ]
    }
  ];

  return {
    id: `story-${Date.now()}`,
    config,
    characters: characters.map(char => ({
      ...char,
      generatedArtwork: `data:image/svg+xml,<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="90" fill="%23FFD700" stroke="black" stroke-width="4"/>
        <text x="100" y="110" text-anchor="middle" fill="black" font-size="20" font-weight="bold">${char.name}</text>
      </svg>`
    })),
    pages: mockPages,
    title: `The Adventures of ${characters[0]?.name || 'Our Heroes'}`,
    createdAt: new Date()
  };
};

export const createTestStoryConfig = (): StoryConfig => ({
  prompt: 'A magical adventure where friends discover they have special powers and must save their enchanted world from an ancient curse.',
  theme: 'magical',
  style: 'comic',
  characters: [],
  setting: 'Enchanted Forest Kingdom',
  characterCount: 2,
  pageCount: 5,
  targetAge: '6-8'
});

// Development mode check
export const isDevelopment = process.env.NODE_ENV === 'development';

// Mock API delay for testing loading states
export const mockDelay = (ms: number = 2000) => new Promise(resolve => setTimeout(resolve, ms));