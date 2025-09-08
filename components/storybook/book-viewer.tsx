"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  RotateCcw,
  Home,
  Twitter,
  Facebook,
  Mail,
  Maximize,
  Minimize,
  Video,
} from "lucide-react";
import { GeneratedStory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { pdfGenerator } from "@/lib/export/pdf-generator";
import { shareService } from "@/lib/sharing/share-service";
import { toast } from "sonner";
import CoverVideoGenerator from "./cover-video-generator";

interface BookViewerProps {
  story: GeneratedStory;
  onHome: () => void;
  onRegenerate?: () => void;
}

interface BookPage {
  type: "cover" | "story";
  coverImage?: string;
  title?: string;
  config?: any;
  id?: string;
  pageNumber?: number;
  panels?: any[];
}

export default function BookViewer({
  story,
  onHome,
  onRegenerate,
}: BookViewerProps) {
  // Create book pages: cover + story pages
  const allPages: BookPage[] = [
    // Cover page
    {
      type: "cover",
      coverImage: story.coverImage,
      title: story.title,
      config: story.config,
    },
    // Story pages - each panel becomes a full page
    ...story.pages.flatMap((page) =>
      page.panels.map((panel) => ({
        type: "story" as const,
        id: panel.id,
        imageUrl: panel.imageUrl,
        description: panel.description,
        dialogue: panel.dialogue,
        narration: panel.narration,
        characters: panel.characters,
      }))
    ),
  ];

  const [currentSpread, setCurrentSpread] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // Page aspect ratio (width / height). Default assumes 2:3 portrait pages => spread is 4:3
  const [pageAspect, setPageAspect] = useState(2 / 3);

  const nextSpread = () => {
    if (isAnimating) return;
    const maxSpread = Math.ceil(allPages.length / 2) - 1;
    if (currentSpread < maxSpread) {
      setIsAnimating(true);
      setCurrentSpread(currentSpread + 1);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const prevSpread = () => {
    if (isAnimating) return;
    if (currentSpread > 0) {
      setIsAnimating(true);
      setCurrentSpread(currentSpread - 1);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Detect the aspect ratio of the first available image to match layout precisely
  useEffect(() => {
    // find first story image (fallback to cover)
    const firstImageUrl =
      story.pages
        ?.flatMap((p) => p.panels)
        .map((p) => p.imageUrl)
        .find(Boolean) || story.coverImage;

    if (!firstImageUrl) return;

    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        const ratio = img.naturalWidth / img.naturalHeight;
        // Clamp to sane bounds to avoid extreme layouts
        const clamped = Math.max(0.45, Math.min(0.8, ratio));
        setPageAspect(clamped);
      }
    };
    img.src = firstImageUrl;
  }, [story]);

  // Get the current pages to display (left and right)
  const getSpreadPages = () => {
    const leftIndex = currentSpread * 2;
    const rightIndex = leftIndex + 1;

    return {
      leftPage: allPages[leftIndex] || null,
      rightPage: allPages[rightIndex] || null,
      spreadNumber: currentSpread + 1,
      totalSpreads: Math.ceil(allPages.length / 2),
    };
  };

  const { leftPage, rightPage, spreadNumber, totalSpreads } = getSpreadPages();

  const handleDownload = async () => {
    try {
      await pdfGenerator.downloadPDF(story);
      toast.success("Storybook downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download storybook");
    }
  };

  const handleShare = async () => {
    try {
      await shareService.shareStory(story);
      toast.success("Storybook shared successfully!");
      setShowShareMenu(false);
    } catch (error) {
      setShowShareMenu(true);
    }
  };

  const handleSocialShare = (platform: "twitter" | "facebook" | "email") => {
    try {
      switch (platform) {
        case "twitter":
          shareService.shareToTwitter(story);
          break;
        case "facebook":
          shareService.shareToFacebook(story);
          break;
        case "email":
          shareService.shareViaEmail(story);
          break;
      }
      toast.success(`Shared to ${platform}!`);
      setShowShareMenu(false);
    } catch (error) {
      toast.error(`Failed to share to ${platform}`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSpread();
      if (e.key === "ArrowLeft") prevSpread();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSpread, isFullscreen]);

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 overflow-hidden" : "min-h-screen p-2"
      )}
    >
      <div
        className={cn(
          "mx-auto h-full",
          isFullscreen ? "flex items-center justify-center" : "max-w-7xl"
        )}
      >
        {/* Header - only show when not in fullscreen */}
        {!isFullscreen && (
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-4"
          >
            <h1 className="text-3xl font-bold text-amber-900 mb-2">
              {story.title}
            </h1>
            <div className="flex justify-center items-center gap-4 mb-4">
              <span className="text-amber-800">
                Spread {spreadNumber} of {totalSpreads} • {allPages.length}{" "}
                Pages Total
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-2 mb-4">
              <Button onClick={onHome} variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                New Story
              </Button>
              {onRegenerate && (
                <Button onClick={onRegenerate} variant="secondary" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              )}
              <div className="relative">
                <Button variant="secondary" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>

                {showShareMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white border-2 border-amber-300 shadow-xl z-20 rounded-lg">
                    <div className="p-2 space-y-2 min-w-[150px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-amber-50"
                        onClick={() => handleSocialShare("twitter")}
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-amber-50"
                        onClick={() => handleSocialShare("facebook")}
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        Facebook
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-amber-50"
                        onClick={() => handleSocialShare("email")}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowVideoGenerator(true)}
                disabled={!story.coverImage}
              >
                <Video className="w-4 h-4 mr-2" />
                Generate Video
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Maximize className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </motion.header>
        )}

        {/* Book Spread */}
        <div
          className={cn(
            "relative mx-auto",
            isFullscreen ? "w-full h-full max-w-none" : "w-full max-w-6xl",
            "flex items-center justify-center"
          )}
        >
          {/* Book Container */}
          <div
            className={cn(
              "relative bg-white comic-panel p-2",
              isFullscreen
                ? "w-full h-full max-h-screen"
                : "w-full max-h-[80vh]",
              "overflow-hidden"
            )}
            style={{
              perspective: 1500,
              // Spread aspect is two pages side-by-side
              aspectRatio: isFullscreen ? undefined : 2 * pageAspect,
            }}
          >
            {/* Book Spine (center line) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-black transform -translate-x-1/2 z-10 shadow-lg" />

            {/* Left and Right Page Container */}
            <div className="flex h-full">
              {/* Left Page */}
              <div className="w-1/2 h-full relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`left-${currentSpread}`}
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="w-full h-full"
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "right center",
                      willChange: "transform, opacity",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <BookPageComponent
                      page={leftPage}
                      story={story}
                      isLeft={true}
                      isFullscreen={isFullscreen}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Page */}
              <div className="w-1/2 h-full relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`right-${currentSpread}`}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="w-full h-full"
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "left center",
                      willChange: "transform, opacity",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <BookPageComponent
                      page={rightPage}
                      story={story}
                      isLeft={false}
                      isFullscreen={isFullscreen}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation Buttons */}
            <Button
              onClick={prevSpread}
              disabled={currentSpread === 0 || isAnimating}
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <Button
              onClick={nextSpread}
              disabled={currentSpread >= totalSpreads - 1 || isAnimating}
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Page Indicators */}
        {!isFullscreen && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalSpreads }, (_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentSpread(index);
                    setTimeout(() => setIsAnimating(false), 600);
                  }
                }}
                className={cn(
                  "w-3 h-3 border-2 border-amber-700 transition-all duration-200 rounded-full",
                  index === currentSpread
                    ? "bg-amber-600 scale-125"
                    : "bg-amber-200 hover:bg-amber-300"
                )}
              />
            ))}
          </div>
        )}

        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <Button
            onClick={toggleFullscreen}
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 z-20"
          >
            <Minimize className="w-4 h-4 mr-2" />
            Exit Fullscreen
          </Button>
        )}

        {/* Video Generator Modal */}
        {showVideoGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Generate Cover Video</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVideoGenerator(false)}
                >
                  ×
                </Button>
              </div>
              <div className="p-6">
                <CoverVideoGenerator
                  story={story}
                  onVideoGenerated={(videoUrl) => {
                    console.log("Video generated:", videoUrl);
                    toast.success("Cover video is ready!");
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Book Page Component
interface BookPageComponentProps {
  page: BookPage | null;
  story: GeneratedStory;
  isLeft: boolean;
  isFullscreen: boolean;
}

function BookPageComponent({
  page,
  story,
  isLeft,
  isFullscreen,
}: BookPageComponentProps) {
  if (!page) {
    return (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center">
        <div className="text-amber-400 text-center">
          <div className="text-6xl mb-4">📖</div>
          <div className="text-lg">End of Story</div>
        </div>
      </div>
    );
  }

  if (page.type === "cover") {
    return (
      <div className="w-full h-full relative bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center p-8">
        {story.coverVideo ? (
          <video
            src={story.coverVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain rounded-lg shadow-lg p-2 bg-white/20"
            poster={page.coverImage}
          />
        ) : page.coverImage ? (
          <img
            src={page.coverImage}
            alt={`Cover of ${page.title}`}
            className="w-full h-full object-contain rounded-lg shadow-lg p-2 bg-white/20"
          />
        ) : (
          <div className="text-center">
            <div className="text-4xl md:text-6xl font-bold text-amber-900 mb-4 leading-tight">
              {page.title}
            </div>
            <div className="text-xl text-amber-700 mb-2">
              A {page.config?.theme} {page.config?.style} story
            </div>
            <div className="text-lg text-amber-600">
              For ages {page.config?.targetAge || "6-8"}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Story page - full image display
  return (
    <div className="w-full h-full relative bg-white">
      {(page as any).imageUrl ? (
        <img
          src={(page as any).imageUrl}
          alt={(page as any).description || "Story page"}
          className="w-full h-full object-cover object-top block"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-300 flex items-center justify-center p-8">
          <div className="text-center text-white">
            <div className="text-2xl font-bold mb-4">Story Panel</div>
            <div className="text-lg opacity-90 max-w-md">
              {(page as any).description}
            </div>
            {(page as any).narration && (
              <div className="mt-4 text-base italic bg-white/20 rounded-lg p-3">
                {(page as any).narration}
              </div>
            )}
            {(page as any).dialogue && (page as any).dialogue.length > 0 && (
              <div className="mt-4 space-y-2">
                {(page as any).dialogue.map((line: string, index: number) => (
                  <div
                    key={index}
                    className="bg-white/30 rounded-full px-4 py-2 text-sm"
                  >
                    "{line}"
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
