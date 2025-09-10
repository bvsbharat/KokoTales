import { geminiService } from "./gemini-service";
import { videoGenerator } from "./video-generator";
import { StoryConfig, Character, GeneratedStory, StoryPage, Panel } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { characterStorage } from "@/lib/storage/character-storage";
import { storyStorage } from "@/lib/storage/story-storage";

export class StoryGenerator {
    async generateCompleteStory(
        apiKey: string,
        config: StoryConfig,
        characters: Character[],
        onProgress?: (message: string, progress: number) => void
    ): Promise<GeneratedStory> {
        try {
            onProgress?.("Preparing characters...", 5);

            // Step 1: Load existing characters from storage or enhance new ones
            const charactersWithDescriptions = await this.loadAndEnhanceCharacters(apiKey, characters, config, onProgress);

            onProgress?.("Creating story structure...", 25);

            // Step 2: Generate the main story content
            const storyData = await geminiService.generateStory(apiKey, config, charactersWithDescriptions);

            onProgress?.("Using approved character designs...", 35);

            // Characters should already have approved designs at this point
            const charactersWithDesigns = charactersWithDescriptions.filter(char => char.generatedDesignImage || char.base64Image);
            
            if (charactersWithDesigns.length !== charactersWithDescriptions.length) {
                console.warn('[STORY_GENERATOR] Some characters missing approved designs, this should not happen');
            }

            onProgress?.("Creating panel illustrations...", 45);

            // Step 3: Generate panel illustrations using character design references
            const pagesWithIllustrations = await this.generatePanelArt(
                apiKey,
                storyData.pages,
                charactersWithDesigns,
                config.style,
                onProgress
            );

            onProgress?.("Generating cover image...", 85);

            // Step 4: Generate cover image
            let coverImage: string | undefined;
            try {
                coverImage = await geminiService.generateCoverImage(apiKey, {
                    title: storyData.title,
                    config,
                    characters: charactersWithDesigns
                });
            } catch (error) {
                console.warn('[STORY_GENERATOR] Failed to generate cover image:', error);
                // Continue without cover image
            }

            onProgress?.("Finalizing storybook...", 85);

            // Step 5: Compile final story
            const finalStory: GeneratedStory = {
                id: generateId(),
                config,
                characters: charactersWithDesigns,
                pages: pagesWithIllustrations,
                title: storyData.title,
                createdAt: new Date(),
                coverImage
            };

            // Step 6: Save characters and story to storage
            onProgress?.("Saving to library...", 90);
            
            try {
                // Save characters for future use
                characterStorage.saveCharacters(charactersWithDesigns);
                
                // Save the complete story
                const saved = storyStorage.saveStory(finalStory);
                if (saved) {
                    console.log('[STORY_GENERATOR] Story saved to library successfully');
                } else {
                    console.warn('[STORY_GENERATOR] Failed to save story to library (storage full?)');
                }
            } catch (error) {
                console.error('[STORY_GENERATOR] Error saving to storage:', error);
                // Don't fail the story generation if storage fails
            }

            // Step 7: Automatically generate cover video if cover image exists
            if (coverImage) {
                try {
                    onProgress?.("Creating animated cover video...", 95);
                    
                    const videoResult = await videoGenerator.generateCoverVideo(finalStory, {
                        duration: "8s",
                        resolution: "720p",
                        generateAudio: true
                    });

                    console.log('[STORY_GENERATOR] Cover video generated automatically:', videoResult.requestId);
                    
                    // Add video URL to the final story object
                    finalStory.coverVideo = videoResult.videoUrl;
                    finalStory.coverVideoRequestId = videoResult.requestId;
                    
                    // Update saved story with video information
                    try {
                        storyStorage.saveStory(finalStory);
                    } catch (error) {
                        console.warn('[STORY_GENERATOR] Failed to update story with video info:', error);
                    }
                    
                    onProgress?.("Story and video complete!", 100);
                } catch (error) {
                    console.warn('[STORY_GENERATOR] Failed to generate cover video automatically:', error);
                    // Don't fail the story generation if video generation fails
                    onProgress?.("Story complete! (Video generation failed)", 100);
                }
            } else {
                onProgress?.("Story complete!", 100);
            }

            return finalStory;

        } catch (error: any) {
            console.error('[STORY_GENERATOR] Error generating story:', error);
            throw new Error(`Failed to generate story: ${error.message}`);
        }
    }

    private async loadAndEnhanceCharacters(
        apiKey: string,
        characters: Character[],
        config: StoryConfig,
        onProgress?: (message: string, progress: number) => void
    ): Promise<Character[]> {
        onProgress?.("Loading saved characters...", 10);
        
        // Try to load characters from storage first
        const characterNames = characters.map(c => c.name);
        const loadedCharacters = characterStorage.loadCharactersForStory(characterNames);
        
        // Merge loaded characters with provided ones
        const mergedCharacters = characters.map(providedChar => {
            const storedChar = loadedCharacters.find(loaded => 
                loaded.name.toLowerCase() === providedChar.name.toLowerCase()
            );
            
            if (storedChar && (storedChar.generatedDesignImage || storedChar.base64Image)) {
                console.log(`[STORY_GENERATOR] Using stored character: ${storedChar.name}`);
                return {
                    ...providedChar,
                    ...storedChar,
                    // Keep the original ID from provided character
                    id: providedChar.id
                };
            }
            
            return providedChar;
        });

        // Generate descriptions for characters that still need them
        const charactersNeedingDescriptions = mergedCharacters.filter(char => 
            !char.description && !char.generatedDescription && !char.base64Image
        );
        
        if (charactersNeedingDescriptions.length > 0) {
            onProgress?.(`Describing ${charactersNeedingDescriptions.length} new characters...`, 15);
            
            const enhancedCharacters = await geminiService.generateCharacterDescriptions(apiKey, charactersNeedingDescriptions, config);
            
            // Merge back with original characters
            return mergedCharacters.map(char => {
                const enhanced = enhancedCharacters.find(e => e.id === char.id);
                return enhanced || char;
            });
        }

        return mergedCharacters;
    }

    private async enhanceCharacters(
        apiKey: string,
        characters: Character[],
        config: StoryConfig,
        onProgress?: (message: string, progress: number) => void
    ): Promise<Character[]> {
        // Characters with uploaded images keep their original info
        // Characters without images get AI-generated descriptions
        const charactersNeedingDescriptions = characters.filter(char => !char.base64Image);
        
        if (charactersNeedingDescriptions.length === 0) {
            return characters;
        }

        onProgress?.(`Describing ${charactersNeedingDescriptions.length} characters...`, 15);
        
        const enhancedCharacters = await geminiService.generateCharacterDescriptions(apiKey, charactersNeedingDescriptions, config);
        
        // Merge back with original characters
        return characters.map(char => {
            const enhanced = enhancedCharacters.find(e => e.id === char.id);
            return enhanced || char;
        });
    }

    private async generateCharacterArt(
        apiKey: string,
        characters: Character[],
        style: string,
        onProgress?: (message: string, progress: number) => void
    ): Promise<Character[]> {
        const charactersWithArt: Character[] = [];

        for (let i = 0; i < characters.length; i++) {
            const character = characters[i];
            onProgress?.(`Drawing ${character.name}...`, 50 + (i / characters.length) * 15);

            try {
                const artworkUrl = await geminiService.generateCartoonCharacterImage(apiKey, character, style);
                charactersWithArt.push({
                    ...character,
                    generatedArtwork: artworkUrl
                });
            } catch (error) {
                console.warn(`[STORY_GENERATOR] Failed to generate art for ${character.name}:`, error);
                charactersWithArt.push(character); // Keep character without artwork
            }
        }

        return charactersWithArt;
    }

    private async generatePanelArt(
        apiKey: string,
        pages: StoryPage[],
        characters: Character[],
        style: string,
        onProgress?: (message: string, progress: number) => void
    ): Promise<StoryPage[]> {
        const pagesWithArt: StoryPage[] = [];
        let totalPanels = pages.reduce((acc, page) => acc + page.panels.length, 0);
        let currentPanel = 0;

        for (const page of pages) {
            const panelsWithArt = [];

            for (const panel of page.panels) {
                currentPanel++;
                const progressPercent = 60 + (currentPanel / totalPanels) * 35;
                onProgress?.(`Illustrating page ${page.pageNumber}, panel ${panel.id}...`, progressPercent);

                try {
                    const illustration = await geminiService.generatePanelIllustration(
                        apiKey,
                        panel,
                        characters,
                        style
                    );
                    panelsWithArt.push({
                        ...panel,
                        imageUrl: illustration
                    });
                } catch (error) {
                    console.warn(`[STORY_GENERATOR] Failed to generate illustration for panel ${panel.id}:`, error);
                    panelsWithArt.push(panel); // Keep panel without illustration
                }
            }

            pagesWithArt.push({
                ...page,
                panels: panelsWithArt
            });
        }

        return pagesWithArt;
    }

    // Helper method to regenerate failed panels
    async regeneratePanel(
        apiKey: string,
        panel: Panel,
        characters: Character[],
        style: string
    ): Promise<Panel> {
        try {
            const illustration = await geminiService.generatePanelIllustration(apiKey, panel, characters, style);
            return {
                ...panel,
                imageUrl: illustration
            };
        } catch (error) {
            console.error(`[STORY_GENERATOR] Failed to regenerate panel ${panel.id}:`, error);
            throw error;
        }
    }

    // Generate animated cover video for completed story
    async generateCoverVideo(
        story: GeneratedStory,
        onProgress?: (message: string, progress: number) => void
    ): Promise<{ videoUrl: string; requestId: string }> {
        try {
            if (!story.coverImage) {
                throw new Error("Story must have a cover image to generate video");
            }

            onProgress?.("Creating cover animation...", 10);
            
            const videoResult = await videoGenerator.generateCoverVideo(story, {
                duration: "8s",
                resolution: "720p",
                generateAudio: true
            });

            onProgress?.("Cover video generated!", 100);
            
            console.log('[STORY_GENERATOR] Cover video generated successfully:', videoResult.requestId);
            return videoResult;

        } catch (error: any) {
            console.error('[STORY_GENERATOR] Error generating cover video:', error);
            throw new Error(`Failed to generate cover video: ${error.message}`);
        }
    }

    // Check video generation status
    async checkVideoStatus(requestId: string) {
        return await videoGenerator.checkVideoStatus(requestId);
    }

    // Get completed video result
    async getVideoResult(requestId: string) {
        return await videoGenerator.getVideoResult(requestId);
    }
}

export const storyGenerator = new StoryGenerator();