import { geminiService } from "./gemini-service";
import { StoryConfig, Character, GeneratedStory, StoryPage, Panel } from "@/lib/types";
import { generateId } from "@/lib/utils";

export class StoryGenerator {
    async generateCompleteStory(
        config: StoryConfig,
        characters: Character[],
        onProgress?: (message: string, progress: number) => void
    ): Promise<GeneratedStory> {
        try {
            onProgress?.("Preparing characters...", 10);

            // Step 1: Generate character descriptions for those without uploaded images
            const charactersWithDescriptions = await this.enhanceCharacters(characters, onProgress);

            onProgress?.("Creating story structure...", 30);

            // Step 2: Generate the main story content
            const storyData = await geminiService.generateStory(config, charactersWithDescriptions);

            onProgress?.("Using approved character designs...", 50);

            // Characters should already have approved designs at this point
            const charactersWithDesigns = charactersWithDescriptions.filter(char => char.generatedDesignImage);
            
            if (charactersWithDesigns.length !== charactersWithDescriptions.length) {
                console.warn('[STORY_GENERATOR] Some characters missing approved designs, this should not happen');
            }

            onProgress?.("Creating panel illustrations...", 60);

            // Step 3: Generate panel illustrations using character design references
            const pagesWithIllustrations = await this.generatePanelArt(
                storyData.pages,
                charactersWithDesigns,
                config.style,
                onProgress
            );

            onProgress?.("Finalizing storybook...", 100);

            // Step 4: Compile final story
            const finalStory: GeneratedStory = {
                id: generateId(),
                config,
                characters: charactersWithDesigns,
                pages: pagesWithIllustrations,
                title: storyData.title,
                createdAt: new Date()
            };

            return finalStory;

        } catch (error: any) {
            console.error('[STORY_GENERATOR] Error generating story:', error);
            throw new Error(`Failed to generate story: ${error.message}`);
        }
    }

    private async enhanceCharacters(
        characters: Character[],
        onProgress?: (message: string, progress: number) => void
    ): Promise<Character[]> {
        // Characters with uploaded images keep their original info
        // Characters without images get AI-generated descriptions
        const charactersNeedingDescriptions = characters.filter(char => !char.base64Image);
        
        if (charactersNeedingDescriptions.length === 0) {
            return characters;
        }

        onProgress?.(`Describing ${charactersNeedingDescriptions.length} characters...`, 15);
        
        const enhancedCharacters = await geminiService.generateCharacterDescriptions(charactersNeedingDescriptions);
        
        // Merge back with original characters
        return characters.map(char => {
            const enhanced = enhancedCharacters.find(e => e.id === char.id);
            return enhanced || char;
        });
    }

    private async generateCharacterArt(
        characters: Character[],
        style: string,
        onProgress?: (message: string, progress: number) => void
    ): Promise<Character[]> {
        const charactersWithArt: Character[] = [];

        for (let i = 0; i < characters.length; i++) {
            const character = characters[i];
            onProgress?.(`Drawing ${character.name}...`, 50 + (i / characters.length) * 15);

            try {
                const artworkUrl = await geminiService.generateCartoonCharacterImage(character, style);
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
        panel: Panel,
        characters: Character[],
        style: string
    ): Promise<Panel> {
        try {
            const illustration = await geminiService.generatePanelIllustration(panel, characters, style);
            return {
                ...panel,
                imageUrl: illustration
            };
        } catch (error) {
            console.error(`[STORY_GENERATOR] Failed to regenerate panel ${panel.id}:`, error);
            throw error;
        }
    }
}

export const storyGenerator = new StoryGenerator();