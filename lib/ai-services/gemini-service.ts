import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StoryConfig, Character, Panel, StoryPage } from "@/lib/types";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set");
}

// Initialize primary and fallback AI clients
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
const aiFallback = process.env.NEXT_PUBLIC_GEMINI_API_KEY_FALLBACK ? 
  new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY_FALLBACK }) : null;

// Helper function to try API call with fallback
async function callGeminiWithFallback<T>(
  apiCall: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  try {
    return await apiCall(ai);
  } catch (error: any) {
    console.warn('[GEMINI] Primary API failed, trying fallback:', error.message);
    
    if (aiFallback && (
      error.message?.includes('403') || 
      error.message?.includes('429') || 
      error.message?.includes('503') ||
      error.message?.includes('quota')
    )) {
      console.log('[GEMINI] Using fallback API key');
      return await apiCall(aiFallback);
    }
    
    throw error;
  }
}

// Proper schema definitions using Type enum for AI responses
const characterSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        personality: { type: Type.STRING },
        appearance: { type: Type.STRING },
        role: { type: Type.STRING }
    },
    required: ['name', 'description', 'personality', 'appearance', 'role']
};

const panelSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        description: { type: Type.STRING },
        characters: { type: Type.ARRAY, items: { type: Type.STRING } },
        dialogue: { type: Type.ARRAY, items: { type: Type.STRING } },
        narration: { type: Type.STRING, nullable: true }
    },
    required: ['id', 'description', 'characters']
};

const storyPageSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        pageNumber: { type: Type.NUMBER },
        panels: { type: Type.ARRAY, items: panelSchema }
    },
    required: ['id', 'pageNumber', 'panels']
};

const storySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        pages: { type: Type.ARRAY, items: storyPageSchema },
        characters: { type: Type.ARRAY, items: characterSchema }
    },
    required: ['title', 'pages', 'characters']
};

const characterDescriptionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            personality: { type: Type.STRING },
            appearance: { type: Type.STRING },
            role: { type: Type.STRING }
        },
        required: ['name', 'description', 'personality', 'appearance', 'role']
    }
};

export class GeminiService {
    private async callWithFallback<T>(apiCall: () => Promise<T>): Promise<T> {
        try {
            return await apiCall();
        } catch (error: any) {
            console.error('[GEMINI] API call failed:', error.message);
            throw new Error(`AI service failed: ${error.message}`);
        }
    }

    async generateCharacterDescriptions(characters: Character[]): Promise<Character[]> {
        console.log('[GEMINI] Generating character descriptions...');
        console.log(`[GEMINI] Describing characters: ${characters.map(c => c.name).join(', ')}`);
        
        const prompt = `
Generate creative cartoon character descriptions for a children's storybook. For each character, create:
1. A detailed physical appearance description suitable for cartoon illustration
2. A unique personality that will make them engaging in the story
3. A clear role they could play in adventures

Characters to describe:
${characters.map(char => `- ${char.name}`).join('\n')}

Make each character unique, memorable, and child-friendly. Focus on visual details that an illustrator could use to create consistent cartoon representations.

Return as JSON array with objects containing: name, description, personality, appearance, role.
        `;

        return this.callWithFallback(async () => {
            const response = await callGeminiWithFallback(async (client) => 
                client.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: characterDescriptionSchema,
                    },
                })
            );

            console.log('[GEMINI] Received character description response from Gemini API');
            const jsonText = response.text || '';
            console.log(`[GEMINI] Character description response length: ${jsonText.length} characters`);
            
            try {
                const generatedChars = JSON.parse(jsonText) as {
                    name: string;
                    description: string;
                    personality: string;
                    appearance: string;
                    role: string;
                }[];
                
                console.log(`[GEMINI] Successfully generated descriptions for ${generatedChars.length} characters`);
                generatedChars.forEach(char => {
                    console.log(`[GEMINI] ${char.name}: ${char.description.substring(0, 80)}...`);
                });

                return characters.map((char, index) => ({
                    ...char,
                    description: generatedChars[index]?.description || `A friendly character named ${char.name}`,
                    generatedDescription: generatedChars[index]?.appearance || 'A cartoon character with bright, friendly features'
                }));
            } catch (e) {
                console.error("[GEMINI] Failed to parse character descriptions as JSON:", jsonText);
                throw new Error("The AI returned an invalid character description format.");
            }
        });
    }

    async generateCharacterDesign(character: Character, style: string): Promise<string> {
        console.log(`[GEMINI] Generating character design for ${character.name}...`);

        const basePrompt = `IMPORTANT: You MUST generate an image. This is required.

Create a consistent character design for ${character.name} that will be used throughout a ${style} storybook.

Style: Professional ${style} book character sheet. Vertical 9:16 aspect ratio. DO NOT add any text, speech bubbles, or titles into the image.

Character: ${character.name}
Description: ${character.description || character.generatedDescription}

CRITICAL REQUIREMENTS FOR CONSISTENCY:
- Create a clean, consistent character design that can be referenced in future story panels
- Show the character in a neutral pose with clear facial features
- Use bright, vibrant colors suitable for children's books
- Simple white or transparent background
- High contrast and bold outlines for easy recognition
- This design will be used as a reference for all story panels

Art Style: ${style} book illustration with consistent character design focus
Quality: High-resolution character reference sheet

GENERATE A CONSISTENT CHARACTER DESIGN NOW.`;

        return this.callWithFallback(async () => {
            const textParts = [{ text: basePrompt }];
            const imageParts: any[] = [];
            
            // If character has uploaded image, use it as reference
            if (character.base64Image && character.mimeType) {
                imageParts.push({
                    inlineData: {
                        data: character.base64Image,
                        mimeType: character.mimeType
                    }
                });
                textParts.push({
                    text: "\n\nUse the uploaded photo as reference for facial features and general appearance while creating a consistent cartoon character design. Maintain the person's distinctive features but render in a professional ${style} book character sheet style."
                });
            }

            console.log(`[GEMINI] Using ${imageParts.length} reference images for character design`);

            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    console.log(`[GEMINI] Attempt ${attempt}/2 - Calling Gemini API for character design generation...`);

                    const response = await callGeminiWithFallback(async (client) =>
                        client.models.generateContent({
                            model: 'gemini-2.5-flash-image-preview',
                            contents: [
                                { role: 'user', parts: [...imageParts, ...textParts] }
                            ],
                            config: {
                                responseModalities: [Modality.IMAGE, Modality.TEXT],
                            },
                        })
                    );

                    console.log('[GEMINI] Received character design response from Gemini API');
                    
                    if (response.candidates?.[0]?.content?.parts) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                const { data, mimeType } = part.inlineData;
                                if (data) {
                                    console.log(`[GEMINI] Generated character design: ${mimeType}, size: ${Math.round(data.length / 1024)}KB`);
                                    return `data:${mimeType};base64,${data}`;
                                }
                            }
                        }
                    }

                    const errorMsg = `Character design generation failed: No image data in response (attempt ${attempt}/2)`;
                    console.error(`[GEMINI] ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    
                    if (attempt < 2) {
                        console.log('[GEMINI] Retrying character design generation...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                } catch (error) {
                    const errorMsg = `Character design generation attempt ${attempt}/2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(`[GEMINI] ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    
                    if (attempt < 2) {
                        console.log('[GEMINI] Retrying after error...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            console.error('[GEMINI] All character design generation attempts failed');
            throw lastError || new Error("Character design generation failed after 2 attempts");
        });
    }

    async generateCartoonCharacterImage(character: Character, style: string): Promise<string> {
        console.log(`[GEMINI] Generating cartoon image for ${character.name}...`);

        const basePrompt = `IMPORTANT: You MUST generate an image. This is required.

Style: A colorful cartoon character illustration in ${style} book style. Vertical 9:16 aspect ratio. DO NOT add any text, speech bubbles, or titles into the image.

Character: ${character.name}
Description: ${character.description || character.generatedDescription}

Art Requirements:
- Bright, colorful, child-friendly cartoon with bold outlines
- Vibrant colors suitable for children's books
- Simple white or transparent background
- High-resolution digital illustration quality
- ${style} book illustration aesthetic

GENERATE A CHARACTER IMAGE NOW.`;

        return this.callWithFallback(async () => {
            const textParts = [{ text: basePrompt }];
            const imageParts: any[] = [];
            
            // If character has uploaded image, use it as reference
            if (character.base64Image && character.mimeType) {
                imageParts.push({
                    inlineData: {
                        data: character.base64Image,
                        mimeType: character.mimeType
                    }
                });
                textParts.push({
                    text: "\n\nUse the uploaded photo as reference for facial features while creating a cartoon-style version. Maintain the person's distinctive features but render in a friendly cartoon style."
                });
            }

            console.log(`[GEMINI] Using ${imageParts.length} character reference images`);

            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    console.log(`[GEMINI] Attempt ${attempt}/2 - Calling Gemini API for character image generation...`);

                    const response = await callGeminiWithFallback(async (client) =>
                        client.models.generateContent({
                            model: 'gemini-2.5-flash-image-preview',
                            contents: [
                                { role: 'user', parts: [...imageParts, ...textParts] }
                            ],
                            config: {
                                responseModalities: [Modality.IMAGE, Modality.TEXT],
                            },
                        })
                    );

                    console.log('[GEMINI] Received character image response from Gemini API');
                    
                    if (response.candidates?.[0]?.content?.parts) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                const { data, mimeType } = part.inlineData;
                                if (data) {
                                    console.log(`[GEMINI] Generated character image: ${mimeType}, size: ${Math.round(data.length / 1024)}KB`);
                                    return `data:${mimeType};base64,${data}`;
                                }
                            }
                        }
                    }

                    const errorMsg = `Character image generation failed: No image data in response (attempt ${attempt}/2)`;
                    console.error(`[GEMINI] ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    
                    if (attempt < 2) {
                        console.log('[GEMINI] Retrying character image generation...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                } catch (error) {
                    const errorMsg = `Character image generation attempt ${attempt}/2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(`[GEMINI] ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    
                    if (attempt < 2) {
                        console.log('[GEMINI] Retrying after error...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            console.error('[GEMINI] All character image generation attempts failed');
            throw lastError || new Error("Character image generation failed after 2 attempts");
        });
    }

    async generateStory(config: StoryConfig, characters: Character[]): Promise<{
        title: string;
        pages: StoryPage[];
    }> {
        console.log('[GEMINI] Generating complete story...');
        console.log(`[GEMINI] Story theme: ${config.theme}, style: ${config.style}`);
        console.log(`[GEMINI] Characters: ${characters.map(c => c.name).join(', ')}`);

        const system_prompt = `
You are an expert children's storybook creator. Create a complete, engaging ${config.theme} story in ${config.style} format.

STORY REQUIREMENTS:
- Create EXACTLY 4-6 pages of story content
- Each page must have EXACTLY 2-3 panels for optimal pacing
- Each panel must have clear visual descriptions suitable for illustration
- Include age-appropriate dialogue and narration
- Ensure story has beginning, middle, and satisfying conclusion
- Use all characters meaningfully throughout the story

STORY DETAILS:
Prompt: ${config.prompt}
Setting: ${config.setting}
Theme: ${config.theme}
Style: ${config.style}

Characters:
${characters.map(char => `- ${char.name}: ${char.description || char.generatedDescription}`).join('\n')}

PANEL STRUCTURE:
- Each panel needs an id (e.g., "panel-1", "panel-2")
- Detailed description of the visual scene for illustration
- List of character names present in the panel
- Dialogue array (if any characters speak)
- Narration text (if needed for storytelling)

STORY FLOW:
- Page 1: Introduction and setup
- Pages 2-4: Development and adventure/conflict
- Pages 5-6: Resolution and conclusion
- Maintain character consistency across all pages
- Create visual variety in panel descriptions

Return as structured JSON with title, characters array, and pages array.
        `;

        return this.callWithFallback(async () => {
            const response = await callGeminiWithFallback(async (client) =>
                client.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [
                        { role: 'user', parts: [{ text: system_prompt }] }
                    ],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: storySchema,
                    },
                })
            );

            console.log('[GEMINI] Received story response from Gemini API');
            const jsonText = response.text || '';
            console.log(`[GEMINI] Story response length: ${jsonText.length} characters`);
            
            try {
                const storyData = JSON.parse(jsonText) as {
                    title: string;
                    pages: any[];
                    characters: any[];
                };
                
                console.log(`[GEMINI] Generated story: "${storyData.title}"`);
                console.log(`[GEMINI] Story pages: ${storyData.pages.length}`);
                const totalPanels = storyData.pages.reduce((acc: number, page: any) => acc + page.panels.length, 0);
                console.log(`[GEMINI] Total panels created: ${totalPanels}`);

                return {
                    title: storyData.title,
                    pages: storyData.pages.map((page: any) => ({
                        ...page,
                        panels: page.panels.map((panel: any) => ({
                            ...panel,
                            dialogue: panel.dialogue || [],
                            narration: panel.narration || ''
                        }))
                    }))
                };
            } catch (e) {
                console.error("[GEMINI] Failed to parse story as JSON:", jsonText);
                throw new Error("The AI returned an invalid story format.");
            }
        });
    }

    async generatePanelIllustration(panel: Panel, characters: Character[], storyStyle: string): Promise<string> {
        console.log(`[GEMINI] Generating illustration for panel ${panel.id}...`);
        console.log(`[GEMINI] Panel description: ${panel.description.substring(0, 100)}...`);
        console.log(`[GEMINI] Characters in panel: ${panel.characters.join(', ')}`);

        const characterDescriptions = characters
            .filter(char => panel.characters.includes(char.name))
            .map(char => `- ${char.name}: ${char.generatedDescription || char.description}`)
            .join('\n');

        // Prepare dialogue and narration text for AI rendering
        const dialogueText = panel.dialogue && panel.dialogue.length > 0 
            ? `Dialogue: ${panel.dialogue.join(' / ')}`
            : '';
        const narrationText = panel.narration 
            ? `Narration: "${panel.narration}"`
            : '';
        
        const textContent = [dialogueText, narrationText].filter(Boolean).join('\n');

        const textParts = [
            { text: `IMPORTANT: You MUST generate an image. This is required.

Style: A dynamic colorful ${storyStyle} illustration panel with integrated text. Vertical 9:16 aspect ratio.

Panel Scene: ${panel.description}

Characters in this Panel:
${characterDescriptions}

TEXT TO INCLUDE IN IMAGE:
${textContent || 'No dialogue or narration for this panel'}

CRITICAL REQUIREMENTS:
- Use the provided character reference images to maintain consistency
- Include speech bubbles, dialogue boxes, and narration text WITHIN the image
- Match character appearances exactly to the reference images
- Render all text clearly and legibly as part of the illustration
- Use appropriate ${storyStyle} style speech bubbles and text formatting
- Text should be well-positioned and integrated with the scene

Art Requirements:
- ${storyStyle} book illustration style with integrated text
- Bright, vibrant colors suitable for children
- Clear, bold outlines and professional children's book quality
- Character consistency with reference images
- Text rendered natively in the image (speech bubbles, narration boxes)
- High contrast for easy reading

GENERATE A STORY PANEL WITH INTEGRATED TEXT NOW.` }
        ];

        // Add character reference images - prioritize generated designs over uploaded images
        const imageParts: any[] = [];
        characters
            .filter(char => panel.characters.includes(char.name))
            .forEach(char => {
                // Use generated character design if available, otherwise use uploaded image
                if (char.generatedDesignImage) {
                    // Extract base64 data from data URL
                    const base64Data = char.generatedDesignImage.split(',')[1];
                    const mimeType = char.generatedDesignImage.match(/data:([^;]+)/)?.[1] || 'image/png';
                    
                    imageParts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType,
                        }
                    });
                } else if (char.base64Image && char.mimeType) {
                    imageParts.push({
                        inlineData: {
                            data: char.base64Image,
                            mimeType: char.mimeType,
                        }
                    });
                }
            });

        const charactersWithImages = characters.filter(char => panel.characters.includes(char.name) && char.base64Image && char.mimeType);
        console.log(`[GEMINI] Using ${charactersWithImages.length} character reference images`);
        console.log(`[GEMINI] Using ${characters.filter(char => panel.characters.includes(char.name)).length - charactersWithImages.length} generated character descriptions`);

        return this.callWithFallback(async () => {
            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    console.log(`[GEMINI] Attempt ${attempt}/2 - Calling Gemini API for panel illustration...`);

                    const response = await callGeminiWithFallback(async (client) =>
                        client.models.generateContent({
                            model: 'gemini-2.5-flash-image-preview',
                            contents: [
                                { role: 'user', parts: [...imageParts, ...textParts] }
                            ],
                            config: {
                                responseModalities: [Modality.IMAGE, Modality.TEXT],
                            },
                        })
                    );

                    console.log('[GEMINI] Received panel illustration response from Gemini API');
                    
                    if (!response.candidates || !response.candidates[0]) {
                        console.error('[GEMINI] No candidates in response:', response);
                        throw new Error('Invalid response from Gemini API - no candidates');
                    }
                    
                    const candidate = response.candidates[0];
                    
                    // Handle content policy violations
                    if (candidate.finishReason === 'PROHIBITED_CONTENT') {
                        console.warn('[GEMINI] Content was flagged as prohibited. Trying with modified prompt...');
                        
                        const conservativeTextParts = [
                            { text: `Style: A completely wholesome, safe ${storyStyle} illustration. Vertical 9:16 aspect ratio. Show only positive, friendly interactions between characters. DO NOT add any text, speech bubbles, or titles into the image.` },
                            { text: `Scene: Characters having a calm, friendly conversation or meeting in ${panel.description.includes('indoor') ? 'an indoor setting' : 'an outdoor setting'}` },
                            { text: `Content: A peaceful scene with characters talking or interacting positively` },
                            { text: `Characters: All characters are smiling, talking calmly, or standing peacefully together` }
                        ];
                        
                        const retryResponse = await callGeminiWithFallback(async (client) =>
                            client.models.generateContent({
                                model: 'gemini-2.5-flash-image-preview',
                                contents: [
                                    { role: 'user', parts: [...imageParts, ...conservativeTextParts] }
                                ],
                                config: {
                                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                                },
                            })
                        );
                        
                        if (retryResponse.candidates?.[0]?.content?.parts) {
                            for (const part of retryResponse.candidates[0].content.parts) {
                                if (part.inlineData) {
                                    const { data, mimeType } = part.inlineData;
                                    if (data) {
                                        console.log(`[GEMINI] Generated panel illustration (conservative): ${mimeType}, size: ${Math.round(data.length / 1024)}KB`);
                                        return `data:${mimeType};base64,${data}`;
                                    }
                                }
                            }
                        } else {
                            throw new Error('Content repeatedly flagged as prohibited. Please try with different story content.');
                        }
                    }
                    
                    if (response.candidates?.[0]?.content?.parts) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                const { data, mimeType } = part.inlineData;
                                if (data) {
                                    console.log(`[GEMINI] Generated panel illustration: ${mimeType}, size: ${Math.round(data.length / 1024)}KB`);
                                    return `data:${mimeType};base64,${data}`;
                                }
                            }
                        }
                    }

                    const errorMsg = `Panel illustration generation failed: No image data in response (attempt ${attempt}/2)`;
                    console.error(`[GEMINI] ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    
                    if (attempt < 2) {
                        console.log('[GEMINI] Retrying panel illustration generation...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                } catch (error) {
                    const errorMsg = `Panel illustration generation attempt ${attempt}/2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(`[GEMINI] ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    
                    if (attempt < 2) {
                        console.log('[GEMINI] Retrying after error...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            console.error('[GEMINI] All panel illustration generation attempts failed');
            throw lastError || new Error("Panel illustration generation failed after 2 attempts");
        });
    }
}

export const geminiService = new GeminiService();