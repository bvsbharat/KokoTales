import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StoryConfig, Character, Panel, StoryPage } from "@/lib/types";

// Helper function to create Gemini client with API key
function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

// Helper function to try API call with fallback
async function callGeminiWithFallback<T>(
  apiKey: string,
  apiCall: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  const client = createGeminiClient(apiKey);
  return await apiCall(client);
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
    private async callWithFallback<T>(apiKey: string, apiCall: () => Promise<T>): Promise<T> {
        try {
            return await apiCall();
        } catch (error: any) {
            console.error('[GEMINI] API call failed:', error.message);
            throw new Error(`AI service failed: ${error.message}`);
        }
    }

    async generateCharacterDescriptions(apiKey: string, characters: Character[], config?: StoryConfig): Promise<Character[]> {
        console.log('[GEMINI] Generating character descriptions...');
        console.log(`[GEMINI] Describing characters: ${characters.map(c => c.name).join(', ')}`);
        
        const targetAge = config?.targetAge || '6-8';
        console.log(`[GEMINI] Character descriptions for age: ${targetAge}`);
        
        const ageAppropriate = {
            '3-5': 'very simple, safe, and familiar concepts. Focus on basic emotions like happy, sad, friendly. Avoid complex traits.',
            '6-8': 'elementary concepts with some personality depth. Characters can have hobbies, likes/dislikes, and simple goals.',
            '9-12': 'more developed personalities with interests, skills, and character growth potential. Can handle some complexity.',
            '13+': 'complex personality traits, motivations, and character development. Can include depth and nuance.'
        };

        const prompt = `
Generate creative cartoon character descriptions for a children's storybook targeted at ${targetAge} year olds. For each character, create:
1. A detailed physical appearance description suitable for cartoon illustration
2. A unique personality that will make them engaging in the story (${ageAppropriate[targetAge]})
3. A clear role they could play in adventures appropriate for ${targetAge} year olds

Characters to describe:
${characters.map(char => `- ${char.name}`).join('\n')}

AGE-APPROPRIATE GUIDELINES for ${targetAge}:
- Character traits and personalities should be ${ageAppropriate[targetAge]}
- Make each character unique, memorable, and child-friendly for ${targetAge} year olds
- Focus on visual details that an illustrator could use to create consistent cartoon representations
- Ensure all character elements are completely appropriate for the ${targetAge} age group

Return as JSON array with objects containing: name, description, personality, appearance, role.
        `;

        return this.callWithFallback(apiKey, async () => {
            const response = await callGeminiWithFallback(apiKey, async (client) => 
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

    async generateCharacterDesign(apiKey: string, character: Character, style: string): Promise<string> {
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

        return this.callWithFallback(apiKey, async () => {
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

                    const response = await callGeminiWithFallback(apiKey, async (client) =>
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

    async generateCartoonCharacterImage(apiKey: string, character: Character, style: string): Promise<string> {
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

        return this.callWithFallback(apiKey, async () => {
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

                    const response = await callGeminiWithFallback(apiKey, async (client) =>
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

    async generateStory(apiKey: string, config: StoryConfig, characters: Character[]): Promise<{
        title: string;
        pages: StoryPage[];
    }> {
        console.log('[GEMINI] Generating complete story...');
        console.log(`[GEMINI] Story theme: ${config.theme}, style: ${config.style}`);
        console.log(`[GEMINI] Characters: ${characters.map(c => c.name).join(', ')}`);

        const pageCount = config.pageCount || 5;
        const targetAge = config.targetAge || '6-8';
        
        console.log(`[GEMINI] Target age: ${targetAge}, Page count: ${pageCount}`);
        
        // Age-appropriate content guidelines
        const ageGuidelines = {
            '3-5': {
                vocabulary: 'very simple words and short sentences',
                complexity: 'basic concepts and simple storylines',
                themes: 'everyday activities, friendship, and basic emotions',
                dialogue: 'short, simple phrases that preschoolers can understand'
            },
            '6-8': {
                vocabulary: 'elementary reading level with some challenging words',
                complexity: 'clear storylines with simple problem-solving',
                themes: 'adventures, learning new things, overcoming small challenges',
                dialogue: 'conversational but age-appropriate language'
            },
            '9-12': {
                vocabulary: 'intermediate vocabulary with more complex sentence structures',
                complexity: 'multi-layered plots with character development',
                themes: 'more complex adventures, personal growth, friendship challenges',
                dialogue: 'natural conversations with some sophisticated language'
            },
            '13+': {
                vocabulary: 'advanced vocabulary and complex sentence structures',
                complexity: 'sophisticated plots with deeper themes and character arcs',
                themes: 'coming-of-age, identity, complex relationships, moral dilemmas',
                dialogue: 'realistic teen/young adult conversations'
            }
        };

        const currentAgeGroup = ageGuidelines[targetAge];

        const system_prompt = `
You are an expert children's storybook creator. Create a complete, engaging ${config.theme} story in ${config.style} format for ages ${targetAge}.

STORY REQUIREMENTS:
- Create EXACTLY ${pageCount} pages of story content
- Each page must have EXACTLY 2-3 panels for optimal pacing
- Each panel must have clear visual descriptions suitable for illustration
- Include age-appropriate dialogue and narration for ${targetAge} year olds
- Ensure story has beginning, middle, and satisfying conclusion
- Use all characters meaningfully throughout the story

AGE-APPROPRIATE CONTENT for ${targetAge} year olds:
- Vocabulary: ${currentAgeGroup.vocabulary}
- Story complexity: ${currentAgeGroup.complexity}  
- Themes: ${currentAgeGroup.themes}
- Dialogue style: ${currentAgeGroup.dialogue}

STORY DETAILS:
Prompt: ${config.prompt}
Setting: ${config.setting}
Theme: ${config.theme}
Style: ${config.style}
Target Age: ${targetAge} years old
Number of Pages: ${pageCount}

Characters:
${characters.map(char => `- ${char.name}: ${char.description || char.generatedDescription}`).join('\n')}

PANEL STRUCTURE:
- Each panel needs an id (e.g., "panel-1", "panel-2")
- Detailed description of the visual scene for illustration
- List of character names present in the panel
- Dialogue array (if any characters speak) - appropriate for ${targetAge} year olds
- Narration text (if needed for storytelling) - written for ${targetAge} reading level

STORY FLOW for ${pageCount} pages:
- Page 1: Introduction and setup
- Middle pages: Development, adventure, and conflict appropriate for ${targetAge}
- Final page: Resolution and satisfying conclusion
- Maintain character consistency across all pages
- Create visual variety in panel descriptions
- Ensure pacing works well across exactly ${pageCount} pages

Return as structured JSON with title, characters array, and pages array.
        `;

        return this.callWithFallback(apiKey, async () => {
            const response = await callGeminiWithFallback(apiKey, async (client) =>
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

    async generateCoverImage(apiKey: string, story: { title: string, config: any, characters: Character[] }): Promise<string> {
        console.log(`[GEMINI] Generating cover image for: ${story.title}`);

        const characterList = story.characters.map(char => char.name).join(', ');
        const targetAge = story.config.targetAge || '6-8';

        const textParts = [
            { text: `IMPORTANT: You MUST generate an image. This is required.

Create a stunning book cover illustration for a children's storybook.

BOOK DETAILS:
Title: "${story.title}"
Style: ${story.config.style}
Theme: ${story.config.theme}
Characters: ${characterList}
Target Age: ${targetAge} years old
Setting: ${story.config.setting}

COVER REQUIREMENTS:
- Create a beautiful, eye-catching book cover that captures the essence of the story
- Full page illustration with integrated title text
- Show main characters in an engaging scene that represents the story
- Professional children's book cover design
- Bright, vibrant colors appropriate for ${targetAge} year olds
- The title "${story.title}" should be prominently displayed with beautiful typography
- Include visual elements that hint at the ${story.config.theme} theme
- Set in ${story.config.setting}
- ${story.config.style} book art style
- Portrait orientation suitable for book cover
- High-quality illustration that would attract young readers

GENERATE A STUNNING BOOK COVER NOW.` }
        ];

        // Add character reference images if available
        const imageParts: any[] = [];
        story.characters.forEach(char => {
            if (char.generatedDesignImage) {
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

        return this.callWithFallback(apiKey, async () => {
            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    console.log(`[GEMINI] Attempt ${attempt}/2 - Calling Gemini API for cover generation...`);

                    const response = await callGeminiWithFallback(apiKey, async (client) =>
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

                    console.log('[GEMINI] Received cover image response from Gemini API');
                    
                    if (response.candidates?.[0]?.content?.parts) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                const { data, mimeType } = part.inlineData;
                                if (data) {
                                    console.log(`[GEMINI] Generated cover image: ${mimeType}, size: ${Math.round(data.length / 1024)}KB`);
                                    return `data:${mimeType};base64,${data}`;
                                }
                            }
                        }
                    }

                    const errorMsg = `Cover image generation failed: No image data in response (attempt ${attempt}/2)`;
                    console.error(`[GEMINI] ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    
                    if (attempt < 2) {
                        console.log('[GEMINI] Retrying cover generation...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                } catch (error) {
                    const errorMsg = `Cover generation attempt ${attempt}/2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(`[GEMINI] ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    
                    if (attempt < 2) {
                        console.log('[GEMINI] Retrying after error...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            console.error('[GEMINI] All cover generation attempts failed');
            throw lastError || new Error("Cover generation failed after 2 attempts");
        });
    }

    async generatePanelIllustration(apiKey: string, panel: Panel, characters: Character[], storyStyle: string): Promise<string> {
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

Style: A full-page dynamic colorful ${storyStyle} illustration. Create a complete scene that fills the entire page with integrated text elements.

Panel Scene: ${panel.description}

Characters in this Panel:
${characterDescriptions}

TEXT TO INCLUDE IN IMAGE:
${textContent || 'No dialogue or narration for this panel'}

CRITICAL REQUIREMENTS:
- Create a FULL PAGE illustration that fills the entire image space
- Use the provided character reference images to maintain consistency
- Include speech bubbles, dialogue boxes, and narration text WITHIN the image
- Match character appearances exactly to the reference images
- Render all text clearly and legibly as part of the illustration
- Use appropriate ${storyStyle} style speech bubbles and text formatting
- Text should be well-positioned and integrated with the scene
- Make the illustration detailed and engaging, suitable for a full page
- Use full aspect ratio to create an immersive story panel

Art Requirements:
- ${storyStyle} book illustration style with integrated text
- Bright, vibrant colors suitable for children
- Clear, bold outlines and professional children's book quality
- Character consistency with reference images
- Text rendered natively in the image (speech bubbles, narration boxes)
- High contrast for easy reading
- Full-page composition with rich background details
- Professional storybook page quality

GENERATE A FULL-PAGE STORY ILLUSTRATION WITH INTEGRATED TEXT NOW.` }
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

        return this.callWithFallback(apiKey, async () => {
            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    console.log(`[GEMINI] Attempt ${attempt}/2 - Calling Gemini API for panel illustration...`);

                    const response = await callGeminiWithFallback(apiKey, async (client) =>
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
                        
                        const retryResponse = await callGeminiWithFallback(apiKey, async (client) =>
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