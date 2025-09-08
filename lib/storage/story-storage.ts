import { GeneratedStory } from "@/lib/types";

const STORY_STORAGE_KEY = 'memorytales_stories';
const MAX_STORIES = 10; // Limit to prevent localStorage overflow
const MAX_STORAGE_SIZE_MB = 50; // Maximum 50MB for stories

export interface StoredStory {
  id: string;
  title: string;
  createdAt: Date;
  config: GeneratedStory['config'];
  characterCount: number;
  pageCount: number;
  thumbnailImage?: string; // Base64 encoded thumbnail
  storageSize: number; // Size in bytes
}

export interface FullStoredStory extends StoredStory {
  story: GeneratedStory;
}

class StoryStorage {
  private getStoredStoryMetas(): StoredStory[] {
    try {
      const stored = localStorage.getItem(STORY_STORAGE_KEY + '_meta');
      if (!stored) return [];
      
      const stories = JSON.parse(stored) as StoredStory[];
      return stories.map(story => ({
        ...story,
        createdAt: new Date(story.createdAt)
      }));
    } catch (error) {
      console.error('[STORY_STORAGE] Error loading story metadata:', error);
      return [];
    }
  }

  private saveStoredStoryMetas(stories: StoredStory[]): void {
    try {
      // Sort by creation date (newest first) and limit count
      const sortedStories = stories
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_STORIES);

      localStorage.setItem(STORY_STORAGE_KEY + '_meta', JSON.stringify(sortedStories));
      console.log(`[STORY_STORAGE] Saved metadata for ${sortedStories.length} stories`);
    } catch (error) {
      console.error('[STORY_STORAGE] Error saving story metadata:', error);
      this.cleanupOldStories();
    }
  }

  private getStorageUsage(): number {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORY_STORAGE_KEY)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
          }
        }
      }
      return totalSize;
    } catch (error) {
      console.error('[STORY_STORAGE] Error calculating storage usage:', error);
      return 0;
    }
  }

  private cleanupOldStories(): void {
    try {
      console.log('[STORY_STORAGE] Starting cleanup of old stories...');
      const stories = this.getStoredStoryMetas();
      
      // Sort by date and keep only the most recent ones
      const recentStories = stories
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, Math.floor(MAX_STORIES / 2)); // Keep half of the max
      
      // Remove old story data from localStorage
      const oldStoryIds = stories
        .filter(s => !recentStories.find(rs => rs.id === s.id))
        .map(s => s.id);
      
      oldStoryIds.forEach(storyId => {
        localStorage.removeItem(`${STORY_STORAGE_KEY}_${storyId}`);
      });
      
      // Update metadata
      this.saveStoredStoryMetas(recentStories);
      
      console.log(`[STORY_STORAGE] Cleaned up ${oldStoryIds.length} old stories`);
    } catch (error) {
      console.error('[STORY_STORAGE] Error during cleanup:', error);
      // Last resort: clear all stories
      this.clearAllStories();
    }
  }

  private generateThumbnail(story: GeneratedStory): string | undefined {
    try {
      // Use the first panel image as thumbnail if available
      for (const page of story.pages) {
        for (const panel of page.panels) {
          if (panel.imageUrl) {
            return panel.imageUrl;
          }
        }
      }
      return undefined;
    } catch (error) {
      console.error('[STORY_STORAGE] Error generating thumbnail:', error);
      return undefined;
    }
  }

  saveStory(story: GeneratedStory): boolean {
    try {
      console.log('[STORY_STORAGE] Saving story:', story.title);
      
      // Check if we have enough space
      const currentUsage = this.getStorageUsage();
      const maxSizeBytes = MAX_STORAGE_SIZE_MB * 1024 * 1024;
      
      if (currentUsage > maxSizeBytes * 0.8) { // If we're using 80% of max
        console.warn('[STORY_STORAGE] Storage nearly full, cleaning up...');
        this.cleanupOldStories();
      }
      
      // Generate story metadata
      const storageSize = new Blob([JSON.stringify(story)]).size;
      const thumbnail = this.generateThumbnail(story);
      
      const storyMeta: StoredStory = {
        id: story.id,
        title: story.title,
        createdAt: story.createdAt,
        config: story.config,
        characterCount: story.characters.length,
        pageCount: story.pages.length,
        thumbnailImage: thumbnail,
        storageSize: storageSize
      };
      
      // Save the full story data
      localStorage.setItem(`${STORY_STORAGE_KEY}_${story.id}`, JSON.stringify(story));
      
      // Update metadata
      const existingMetas = this.getStoredStoryMetas();
      const existingIndex = existingMetas.findIndex(s => s.id === story.id);
      
      if (existingIndex >= 0) {
        existingMetas[existingIndex] = storyMeta;
      } else {
        existingMetas.push(storyMeta);
      }
      
      this.saveStoredStoryMetas(existingMetas);
      
      console.log(`[STORY_STORAGE] Story saved successfully (${(storageSize / 1024).toFixed(1)} KB)`);
      return true;
      
    } catch (error) {
      console.error('[STORY_STORAGE] Error saving story:', error);
      
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('[STORY_STORAGE] Storage quota exceeded, attempting cleanup...');
        this.cleanupOldStories();
        
        // Try one more time after cleanup
        try {
          localStorage.setItem(`${STORY_STORAGE_KEY}_${story.id}`, JSON.stringify(story));
          return true;
        } catch (retryError) {
          console.error('[STORY_STORAGE] Failed to save even after cleanup');
          return false;
        }
      }
      
      return false;
    }
  }

  loadStory(storyId: string): GeneratedStory | null {
    try {
      const stored = localStorage.getItem(`${STORY_STORAGE_KEY}_${storyId}`);
      if (!stored) {
        console.warn(`[STORY_STORAGE] Story not found: ${storyId}`);
        return null;
      }
      
      const story = JSON.parse(stored) as GeneratedStory;
      // Convert date string back to Date object
      story.createdAt = new Date(story.createdAt);
      
      console.log(`[STORY_STORAGE] Loaded story: ${story.title}`);
      return story;
      
    } catch (error) {
      console.error(`[STORY_STORAGE] Error loading story ${storyId}:`, error);
      return null;
    }
  }

  getAllStoredStories(): StoredStory[] {
    return this.getStoredStoryMetas()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  deleteStory(storyId: string): boolean {
    try {
      // Remove story data
      localStorage.removeItem(`${STORY_STORAGE_KEY}_${storyId}`);
      
      // Update metadata
      const metas = this.getStoredStoryMetas();
      const updatedMetas = metas.filter(s => s.id !== storyId);
      this.saveStoredStoryMetas(updatedMetas);
      
      console.log(`[STORY_STORAGE] Deleted story: ${storyId}`);
      return true;
      
    } catch (error) {
      console.error(`[STORY_STORAGE] Error deleting story ${storyId}:`, error);
      return false;
    }
  }

  clearAllStories(): void {
    try {
      // Remove all story-related keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORY_STORAGE_KEY)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`[STORY_STORAGE] Cleared ${keysToRemove.length} story entries`);
    } catch (error) {
      console.error('[STORY_STORAGE] Error clearing stories:', error);
    }
  }

  getStorageInfo(): { 
    storyCount: number;
    totalSize: string;
    usagePercent: number;
    availableSpace: string;
  } {
    try {
      const stories = this.getStoredStoryMetas();
      const totalSizeBytes = this.getStorageUsage();
      const maxSizeBytes = MAX_STORAGE_SIZE_MB * 1024 * 1024;
      const usagePercent = Math.round((totalSizeBytes / maxSizeBytes) * 100);
      const availableBytes = maxSizeBytes - totalSizeBytes;
      
      return {
        storyCount: stories.length,
        totalSize: `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        usagePercent: usagePercent,
        availableSpace: `${(availableBytes / (1024 * 1024)).toFixed(2)} MB`
      };
    } catch (error) {
      return { 
        storyCount: 0, 
        totalSize: '0 MB', 
        usagePercent: 0,
        availableSpace: `${MAX_STORAGE_SIZE_MB} MB`
      };
    }
  }

  // Check if we have enough space for a new story
  canStoreNewStory(estimatedSizeMB: number = 5): boolean {
    const info = this.getStorageInfo();
    const availableMB = parseFloat(info.availableSpace.replace(' MB', ''));
    return availableMB >= estimatedSizeMB;
  }
}

export const storyStorage = new StoryStorage();