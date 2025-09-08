import { fal } from "@fal-ai/client";
import { GeneratedStory } from "@/lib/types";

// Configure FAL client with API key
fal.config({
  credentials: process.env.FAL_KEY || ""
});

export interface VideoGenerationOptions {
  duration?: "8s";
  resolution?: "720p" | "1080p";
  generateAudio?: boolean;
}

export interface VideoGenerationResult {
  videoUrl: string;
  requestId: string;
}

export class VideoGenerator {
  /**
   * Generate an animated video from the story's cover image
   * @param story - The complete generated story
   * @param options - Video generation options
   * @returns Promise with video URL and request ID
   */
  async generateCoverVideo(
    story: GeneratedStory,
    options: VideoGenerationOptions = {}
  ): Promise<VideoGenerationResult> {
    if (!story.coverImage) {
      throw new Error("Story must have a cover image to generate video");
    }

    if (!process.env.FAL_KEY) {
      throw new Error("FAL_KEY environment variable is required for video generation");
    }

    try {
      // Create animation prompt based on story content
      const animationPrompt = this.createAnimationPrompt(story);
      
      console.log('[VIDEO_GENERATOR] Generating cover video with prompt:', animationPrompt);

      const result = await fal.subscribe("fal-ai/veo3/fast/image-to-video", {
        input: {
          prompt: animationPrompt,
          image_url: story.coverImage,
          duration: options.duration || "8s",
          resolution: options.resolution || "720p",
          generate_audio: options.generateAudio ?? true
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('[VIDEO_GENERATOR] Video generation completed:', result.requestId);

      return {
        videoUrl: result.data.video.url,
        requestId: result.requestId
      };
    } catch (error: any) {
      console.error('[VIDEO_GENERATOR] Error generating video:', error);
      throw new Error(`Failed to generate cover video: ${error.message}`);
    }
  }

  /**
   * Generate animation prompt based on story content and characters
   * @param story - The generated story
   * @returns Animation prompt string
   */
  private createAnimationPrompt(story: GeneratedStory): string {
    const { title, config, characters, pages } = story;
    
    // Extract key story elements
    const mainCharacters = characters.slice(0, 2).map(c => c.name).join(" and ");
    const storyTheme = config.theme || "adventure";
    const artStyle = config.style || "cartoon";
    
    // Get story summary from first few pages
    const storySummary = pages.slice(0, 2)
      .flatMap(page => page.panels)
      .map(panel => panel.narration || panel.dialogue)
      .filter(Boolean)
      .join(" ")
      .substring(0, 200);

    // Create dynamic animation prompt
    const basePrompt = `Animate this ${artStyle} style book cover featuring ${mainCharacters}. `;
    
    let actionPrompt = "";
    let stylePrompt = "";
    let ambiance = "";

    // Determine animation style based on story theme
    switch (storyTheme.toLowerCase()) {
      case "adventure":
        actionPrompt = "Characters should have subtle heroic poses with gentle wind effects on hair and clothing. Add soft sparkles or magical particles floating around.";
        ambiance = "Epic and inspiring atmosphere with warm, golden lighting.";
        break;
      case "friendship":
        actionPrompt = "Characters should have warm, welcoming expressions with gentle swaying motions. Add soft, floating heart particles or butterflies.";
        ambiance = "Warm and cozy atmosphere with soft, pastel lighting.";
        break;
      case "mystery":
        actionPrompt = "Characters should have curious, investigative poses with subtle shadows moving. Add mysterious fog or mist effects.";
        ambiance = "Intriguing and mysterious atmosphere with dramatic lighting and shadows.";
        break;
      case "fantasy":
        actionPrompt = "Characters should have magical poses with enchanted elements floating around. Add glowing magical particles and ethereal effects.";
        ambiance = "Magical and enchanting atmosphere with mystical, colorful lighting.";
        break;
      default:
        actionPrompt = "Characters should have gentle, natural movements with subtle environmental effects like leaves or petals floating by.";
        ambiance = "Pleasant and engaging atmosphere with natural, warm lighting.";
    }

    stylePrompt = `Maintain the ${artStyle} art style throughout the animation. `;
    
    // Add camera motion for dynamic feel
    const cameraMotion = "Subtle camera zoom-in effect to create depth and engagement. ";

    return `${basePrompt}${actionPrompt} ${stylePrompt}${cameraMotion}${ambiance} The animation should bring the cover to life while maintaining the book's magical storytelling essence. Story context: ${storySummary}`;
  }

  /**
   * Check the status of a video generation request
   * @param requestId - The request ID from video generation
   * @returns Promise with current status
   */
  async checkVideoStatus(requestId: string) {
    try {
      const status = await fal.queue.status("fal-ai/veo3/fast/image-to-video", {
        requestId,
        logs: true,
      });
      
      return status;
    } catch (error: any) {
      console.error('[VIDEO_GENERATOR] Error checking video status:', error);
      throw new Error(`Failed to check video status: ${error.message}`);
    }
  }

  /**
   * Get the result of a completed video generation
   * @param requestId - The request ID from video generation
   * @returns Promise with video result
   */
  async getVideoResult(requestId: string): Promise<VideoGenerationResult> {
    try {
      const result = await fal.queue.result("fal-ai/veo3/fast/image-to-video", {
        requestId
      });
      
      return {
        videoUrl: result.data.video.url,
        requestId
      };
    } catch (error: any) {
      console.error('[VIDEO_GENERATOR] Error getting video result:', error);
      throw new Error(`Failed to get video result: ${error.message}`);
    }
  }

  /**
   * Upload an image file to FAL storage for video generation
   * @param file - The image file to upload
   * @returns Promise with uploaded file URL
   */
  async uploadImageForVideo(file: File): Promise<string> {
    try {
      const url = await fal.storage.upload(file);
      return url;
    } catch (error: any) {
      console.error('[VIDEO_GENERATOR] Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }
}

export const videoGenerator = new VideoGenerator();
