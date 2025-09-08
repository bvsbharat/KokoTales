import { Character } from "@/lib/types";

const CHARACTER_STORAGE_KEY = 'memorytales_characters';
const MAX_CHARACTERS = 50; // Limit to prevent localStorage overflow

export interface StoredCharacter extends Character {
  lastUsed: Date;
  usageCount: number;
}

class CharacterStorage {
  private getStoredCharacters(): StoredCharacter[] {
    try {
      const stored = localStorage.getItem(CHARACTER_STORAGE_KEY);
      if (!stored) return [];
      
      const characters = JSON.parse(stored) as StoredCharacter[];
      return characters.map(char => ({
        ...char,
        lastUsed: new Date(char.lastUsed)
      }));
    } catch (error) {
      console.error('[CHARACTER_STORAGE] Error loading characters:', error);
      return [];
    }
  }

  private saveStoredCharacters(characters: StoredCharacter[]): void {
    try {
      // Sort by usage count and last used, keep only the most recent/popular
      const sortedCharacters = characters
        .sort((a, b) => {
          // Primary sort by usage count (descending)
          if (a.usageCount !== b.usageCount) {
            return b.usageCount - a.usageCount;
          }
          // Secondary sort by last used (most recent first)
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        })
        .slice(0, MAX_CHARACTERS);

      localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(sortedCharacters));
      console.log(`[CHARACTER_STORAGE] Saved ${sortedCharacters.length} characters`);
    } catch (error) {
      console.error('[CHARACTER_STORAGE] Error saving characters:', error);
      // If storage is full, try to clean up old characters
      this.cleanupOldCharacters();
    }
  }

  private cleanupOldCharacters(): void {
    try {
      const characters = this.getStoredCharacters();
      // Keep only the most recently used characters (reduce to 30)
      const recentCharacters = characters
        .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        .slice(0, 30);
      
      localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(recentCharacters));
      console.log(`[CHARACTER_STORAGE] Cleaned up to ${recentCharacters.length} characters`);
    } catch (error) {
      console.error('[CHARACTER_STORAGE] Error during cleanup:', error);
      // As last resort, clear all characters
      localStorage.removeItem(CHARACTER_STORAGE_KEY);
    }
  }

  saveCharacters(characters: Character[]): void {
    console.log('[CHARACTER_STORAGE] Saving characters:', characters.map(c => c.name));
    
    const existing = this.getStoredCharacters();
    const now = new Date();
    
    const updatedCharacters: StoredCharacter[] = [...existing];
    
    characters.forEach(newChar => {
      // Skip characters without generated designs
      if (!newChar.generatedDesignImage && !newChar.base64Image) {
        return;
      }

      const existingIndex = updatedCharacters.findIndex(c => 
        c.name.toLowerCase() === newChar.name.toLowerCase() ||
        c.id === newChar.id
      );

      if (existingIndex >= 0) {
        // Update existing character
        updatedCharacters[existingIndex] = {
          ...updatedCharacters[existingIndex],
          ...newChar,
          lastUsed: now,
          usageCount: updatedCharacters[existingIndex].usageCount + 1,
        };
      } else {
        // Add new character
        updatedCharacters.push({
          ...newChar,
          lastUsed: now,
          usageCount: 1,
        });
      }
    });

    this.saveStoredCharacters(updatedCharacters);
  }

  getStoredCharacterByName(name: string): StoredCharacter | null {
    const characters = this.getStoredCharacters();
    return characters.find(c => 
      c.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  getAllStoredCharacters(): StoredCharacter[] {
    return this.getStoredCharacters();
  }

  getPopularCharacters(limit: number = 10): StoredCharacter[] {
    return this.getStoredCharacters()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  getRecentCharacters(limit: number = 10): StoredCharacter[] {
    return this.getStoredCharacters()
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, limit);
  }

  // Load characters for use in story generation
  loadCharactersForStory(characterNames: string[]): Character[] {
    console.log('[CHARACTER_STORAGE] Loading characters for story:', characterNames);
    
    const stored = this.getStoredCharacters();
    const loadedCharacters: Character[] = [];
    
    characterNames.forEach(name => {
      const storedChar = stored.find(c => 
        c.name.toLowerCase() === name.toLowerCase()
      );
      
      if (storedChar) {
        console.log(`[CHARACTER_STORAGE] Found stored character: ${storedChar.name}`);
        loadedCharacters.push({
          id: storedChar.id,
          name: storedChar.name,
          description: storedChar.description,
          generatedDescription: storedChar.generatedDescription,
          generatedDesignImage: storedChar.generatedDesignImage,
          base64Image: storedChar.base64Image,
          mimeType: storedChar.mimeType,
          designApproved: storedChar.designApproved,
          generatedArtwork: storedChar.generatedArtwork
        });
        
        // Update usage stats
        storedChar.lastUsed = new Date();
        storedChar.usageCount++;
      } else {
        console.log(`[CHARACTER_STORAGE] Character not found in storage: ${name}`);
        // Create a new character entry
        loadedCharacters.push({
          id: `char-${Math.random().toString(36).substr(2, 9)}`,
          name: name,
        });
      }
    });
    
    // Save updated usage stats
    this.saveStoredCharacters(stored);
    
    return loadedCharacters;
  }

  clearAllCharacters(): void {
    localStorage.removeItem(CHARACTER_STORAGE_KEY);
    console.log('[CHARACTER_STORAGE] Cleared all stored characters');
  }

  getStorageInfo(): { count: number, totalSize: string } {
    try {
      const stored = localStorage.getItem(CHARACTER_STORAGE_KEY);
      const characters = this.getStoredCharacters();
      const sizeInBytes = stored ? new Blob([stored]).size : 0;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      
      return {
        count: characters.length,
        totalSize: `${sizeInMB} MB`
      };
    } catch (error) {
      return { count: 0, totalSize: '0 MB' };
    }
  }
}

export const characterStorage = new CharacterStorage();