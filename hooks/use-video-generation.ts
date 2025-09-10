"use client";

import { useState, useCallback } from "react";
import { GeneratedStory } from "@/lib/types";
import { toast } from "sonner";

interface VideoState {
  status: "idle" | "generating" | "completed" | "error";
  progress: number;
  message: string;
  videoUrl?: string;
  requestId?: string;
}

interface UseVideoGenerationReturn {
  videoState: VideoState;
  generateVideo: (story: GeneratedStory) => Promise<void>;
  resetVideo: () => void;
  isGenerating: boolean;
}

export const useVideoGeneration = (): UseVideoGenerationReturn => {
  const [videoState, setVideoState] = useState<VideoState>({
    status: "idle",
    progress: 0,
    message: "",
  });

  const generateVideo = useCallback(async (story: GeneratedStory) => {
    if (!story.coverImage) {
      toast.error("Story must have a cover image to generate video");
      return;
    }

    setVideoState({
      status: "generating",
      progress: 0,
      message: "Initializing video generation...",
    });

    try {
      // Start video generation
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          story,
          options: {
            duration: "8s",
            resolution: "720p",
            generateAudio: true,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start video generation");
      }

      const result = await response.json();
      
      // Poll for completion
      await pollVideoStatus(result.requestId);
      
    } catch (error: any) {
      console.error("Error generating video:", error);
      setVideoState({
        status: "error",
        progress: 0,
        message: error.message || "Failed to generate video",
      });
      toast.error("Failed to generate cover video");
    }
  }, []);

  const pollVideoStatus = async (requestId: string) => {
    const maxAttempts = 120; // 10 minutes max (5s intervals)
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/generate-video?requestId=${requestId}`);
        
        if (!response.ok) {
          throw new Error("Failed to check video status");
        }

        const statusData = await response.json();
        
        // Update progress based on status
        const progressMap: Record<string, number> = {
          "IN_QUEUE": 10,
          "IN_PROGRESS": 50,
          "COMPLETED": 100,
        };

        const progress = progressMap[statusData.status] || 0;
        
        setVideoState(prev => ({
          ...prev,
          progress,
          message: getStatusMessage(statusData.status),
        }));

        if (statusData.status === "COMPLETED") {
          // Get the final result
          const resultResponse = await fetch(`/api/generate-video/result?requestId=${requestId}`);
          const resultData = await resultResponse.json();
          
          setVideoState({
            status: "completed",
            progress: 100,
            message: "Cover video generated successfully!",
            videoUrl: resultData.videoUrl,
            requestId,
          });
          
          toast.success("Cover video generated successfully!");
          return;
        }

        if (statusData.status === "FAILED") {
          throw new Error("Video generation failed");
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error("Video generation timed out");
        }

        // Continue polling
        setTimeout(poll, 5000);
        
      } catch (error: any) {
        console.error("Error polling video status:", error);
        setVideoState({
          status: "error",
          progress: 0,
          message: error.message || "Failed to generate video",
        });
        toast.error("Video generation failed");
      }
    };

    poll();
  };

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case "IN_QUEUE":
        return "Video generation queued...";
      case "IN_PROGRESS":
        return "Creating your animated cover video...";
      case "COMPLETED":
        return "Video generation completed!";
      case "FAILED":
        return "Video generation failed";
      default:
        return "Processing...";
    }
  };

  const resetVideo = useCallback(() => {
    setVideoState({
      status: "idle",
      progress: 0,
      message: "",
    });
  }, []);

  return {
    videoState,
    generateVideo,
    resetVideo,
    isGenerating: videoState.status === "generating",
  };
};
