"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  Download,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { GeneratedStory } from "@/lib/types";
import { storyGenerator } from "@/lib/ai-services/story-generator";
import { toast } from "sonner";

interface CoverVideoGeneratorProps {
  story: GeneratedStory;
  onVideoGenerated?: (videoUrl: string) => void;
}

interface VideoState {
  status: "idle" | "generating" | "completed" | "error";
  progress: number;
  message: string;
  videoUrl?: string;
  requestId?: string;
}

export default function CoverVideoGenerator({
  story,
  onVideoGenerated,
}: CoverVideoGeneratorProps) {
  const [videoState, setVideoState] = useState<VideoState>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGenerateVideo = async () => {
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
      const result = await storyGenerator.generateCoverVideo(
        story,
        (message: string, progress: number) => {
          setVideoState(prev => ({
            ...prev,
            progress,
            message,
          }));
        }
      );

      setVideoState({
        status: "completed",
        progress: 100,
        message: "Cover video generated successfully!",
        videoUrl: result.videoUrl,
        requestId: result.requestId,
      });

      onVideoGenerated?.(result.videoUrl);
      toast.success("Cover video generated successfully!");
    } catch (error: any) {
      console.error("Error generating video:", error);
      setVideoState({
        status: "error",
        progress: 0,
        message: error.message || "Failed to generate video",
      });
      toast.error("Failed to generate cover video");
    }
  };

  const handleDownloadVideo = async () => {
    if (!videoState.videoUrl) return;

    try {
      const response = await fetch(videoState.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${story.title}-cover-video.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Video downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download video");
    }
  };

  const handleRetry = () => {
    setVideoState({
      status: "idle",
      progress: 0,
      message: "",
    });
  };

  const togglePlay = () => {
    const video = document.getElementById("cover-video") as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Video className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-800">
              Animated Cover Video
            </h3>
          </div>
          <p className="text-gray-600 text-sm">
            Generate an animated video of your story's cover image
          </p>
        </div>

        <AnimatePresence mode="wait">
          {videoState.status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6">
                {story.coverImage ? (
                  <img
                    src={story.coverImage}
                    alt="Story cover"
                    className="w-48 h-64 object-cover rounded-lg mx-auto shadow-lg"
                  />
                ) : (
                  <div className="w-48 h-64 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                    <span className="text-gray-500">No cover image</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleGenerateVideo}
                disabled={!story.coverImage}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium"
              >
                <Video className="w-5 h-5 mr-2" />
                Generate Animated Cover
              </Button>
              {!story.coverImage && (
                <p className="text-red-500 text-sm mt-2">
                  Cover image required for video generation
                </p>
              )}
            </motion.div>
          )}

          {videoState.status === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Creating Your Video...
                </h4>
                <p className="text-gray-600 text-sm mb-4">{videoState.message}</p>
                <Progress value={videoState.progress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-gray-500 mt-2">
                  {videoState.progress}% complete
                </p>
              </div>
              <p className="text-xs text-gray-500">
                This may take a few minutes. Please don't close this window.
              </p>
            </motion.div>
          )}

          {videoState.status === "completed" && videoState.videoUrl && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h4 className="text-lg font-semibold text-gray-800">
                    Video Generated Successfully!
                  </h4>
                </div>
                
                <div className="relative w-full max-w-md mx-auto mb-4">
                  <video
                    id="cover-video"
                    src={videoState.videoUrl}
                    className="w-full rounded-lg shadow-lg"
                    controls
                    loop
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    poster={story.coverImage}
                  />
                  <Button
                    onClick={togglePlay}
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={handleDownloadVideo}
                  variant="outline"
                  className="px-6 py-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </Button>
                <Button
                  onClick={handleRetry}
                  variant="secondary"
                  className="px-6 py-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New
                </Button>
              </div>
            </motion.div>
          )}

          {videoState.status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Video Generation Failed
                </h4>
                <p className="text-red-600 text-sm mb-4">{videoState.message}</p>
              </div>
              <Button
                onClick={handleRetry}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
