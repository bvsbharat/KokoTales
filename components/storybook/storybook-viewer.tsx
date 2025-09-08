"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, Share2, RotateCcw, Home, Twitter, Facebook, Mail } from "lucide-react"
import { GeneratedStory } from "@/lib/types"
import { cn } from "@/lib/utils"
import { pdfGenerator } from "@/lib/export/pdf-generator"
import { shareService } from "@/lib/sharing/share-service"
import { toast } from "sonner"

interface StorybookViewerProps {
  story: GeneratedStory
  onHome: () => void
  onRegenerate?: () => void
}

export default function StorybookViewer({ story, onHome, onRegenerate }: StorybookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const nextPage = () => {
    if (currentPage < story.pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleDownload = async () => {
    try {
      await pdfGenerator.downloadPDF(story)
      toast.success("Storybook downloaded successfully!")
    } catch (error) {
      toast.error("Failed to download storybook")
    }
  }

  const handleShare = async () => {
    try {
      await shareService.shareStory(story)
      toast.success("Storybook shared successfully!")
      setShowShareMenu(false)
    } catch (error) {
      setShowShareMenu(true) // Show manual share options
    }
  }

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'email') => {
    try {
      switch (platform) {
        case 'twitter':
          shareService.shareToTwitter(story)
          break
        case 'facebook':
          shareService.shareToFacebook(story)
          break
        case 'email':
          shareService.shareViaEmail(story)
          break
      }
      toast.success(`Shared to ${platform}!`)
      setShowShareMenu(false)
    } catch (error) {
      toast.error(`Failed to share to ${platform}`)
    }
  }

  const currentStoryPage = story.pages[currentPage]

  return (
    <div className={cn(
      "bg-comic-yellow transition-all duration-300",
      isFullscreen ? "fixed inset-0 z-50" : "min-h-screen p-4"
    )}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {!isFullscreen && (
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6"
          >
            <h1 className="comic-title text-4xl mb-2">{story.title}</h1>
            <div className="flex justify-center items-center gap-4 mb-4">
              <span className="comic-text">Page {currentPage + 1} of {story.pages.length}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mb-6">
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
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                {/* Share Menu */}
                {showShareMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white border-4 border-black shadow-comic-lg z-10">
                    <div className="p-2 space-y-2 min-w-[150px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleSocialShare('twitter')}
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleSocialShare('facebook')}
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        Facebook
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleSocialShare('email')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </motion.header>
        )}

        {/* Storybook Pages */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "mx-auto",
                isFullscreen ? "max-w-full h-screen flex items-center" : "max-w-4xl"
              )}
            >
              <StoryPage
                page={currentStoryPage}
                storyStyle={story.config.style}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <Button
              onClick={prevPage}
              disabled={currentPage === 0}
              variant="secondary"
              size="icon"
              className="rounded-full shadow-comic-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button
              onClick={nextPage}
              disabled={currentPage === story.pages.length - 1}
              variant="secondary"
              size="icon"
              className="rounded-full shadow-comic-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Page Indicators */}
        {!isFullscreen && (
          <div className="flex justify-center mt-8 gap-2">
            {story.pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={cn(
                  "w-3 h-3 border-2 border-black transition-colors",
                  index === currentPage ? "bg-comic-blue" : "bg-white"
                )}
              />
            ))}
          </div>
        )}

        {/* Fullscreen Controls */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button onClick={toggleFullscreen} variant="secondary" size="sm">
              Exit Fullscreen
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface StoryPageProps {
  page: any // StoryPage type
  storyStyle: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

function StoryPage({ page, storyStyle, isFullscreen, onToggleFullscreen }: StoryPageProps) {
  const getPageLayout = () => {
    const panelCount = page.panels.length
    
    if (panelCount === 1) return "single"
    if (panelCount === 2) return "double"
    if (panelCount === 3) return "triple"
    if (panelCount === 4) return "quad"
    return "grid"
  }

  const layout = getPageLayout()

  return (
    <Card 
      className={cn(
        "comic-card cursor-pointer transition-all duration-300",
        isFullscreen ? "w-full max-h-screen" : "w-full max-w-4xl mx-auto"
      )}
      onClick={onToggleFullscreen}
    >
      <CardContent className="p-6">
        <div className={cn(
          "grid gap-4",
          layout === "single" && "grid-cols-1",
          layout === "double" && "grid-cols-1 md:grid-cols-2",
          layout === "triple" && "grid-cols-1 md:grid-cols-3",
          layout === "quad" && "grid-cols-2",
          layout === "grid" && "grid-cols-2 md:grid-cols-3"
        )}>
          {page.panels.map((panel: any, index: number) => (
            <StoryPanel
              key={panel.id}
              panel={panel}
              panelIndex={index}
              storyStyle={storyStyle}
              isFullscreen={isFullscreen}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface StoryPanelProps {
  panel: any // Panel type
  panelIndex: number
  storyStyle: string
  isFullscreen: boolean
}

function StoryPanel({ panel, panelIndex, storyStyle, isFullscreen }: StoryPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: panelIndex * 0.1 }}
      className="comic-panel relative"
    >
      {/* Panel Image */}
      <div className={cn(
        "aspect-[4/3] bg-gradient-to-br from-comic-blue to-comic-purple relative overflow-hidden",
        isFullscreen ? "min-h-[200px]" : "min-h-[150px]"
      )}>
        {panel.imageUrl ? (
          <img
            src={panel.imageUrl}
            alt={panel.description}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-comic-orange to-comic-red">
            <div className="text-center p-4">
              <div className="comic-text text-white text-sm mb-2">Panel {panelIndex + 1}</div>
              <div className="text-white text-xs">{panel.description}</div>
            </div>
          </div>
        )}
        
        {/* Panel Border */}
        <div className="absolute inset-0 border-4 border-black" />
      </div>

      {/* Panel Content */}
      <div className="p-3 space-y-2">
        {/* Narration */}
        {panel.narration && (
          <div className="comic-text text-xs bg-comic-yellow border-2 border-black p-2">
            {panel.narration}
          </div>
        )}

        {/* Dialogue */}
        {panel.dialogue && panel.dialogue.length > 0 && (
          <div className="space-y-1">
            {panel.dialogue.map((line: string, index: number) => (
              <div key={index} className="comic-speech-bubble text-xs">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}