"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { StoryConfig, Character, GeneratedStory } from "@/lib/types"
import { storyGenerator } from "@/lib/ai-services/story-generator"
import ApiKeyModal from "@/components/ui/api-key-modal"

interface StoryGeneratorProps {
  config: StoryConfig
  characters: Character[]
  onStoryGenerated: (story: GeneratedStory) => void
  onBack: () => void
}

export default function StoryGeneratorComponent({ 
  config, 
  characters, 
  onStoryGenerated, 
  onBack 
}: StoryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    if (!isGenerating && !error && !generatedStory && !showApiKeyModal) {
      setShowApiKeyModal(true)
    }
  }, [])

  const handleApiKeySubmit = (submittedApiKey: string) => {
    setApiKey(submittedApiKey)
    setShowApiKeyModal(false)
    handleStartGeneration(submittedApiKey)
  }

  const handleStartGeneration = async (apiKeyToUse: string) => {
    setIsGenerating(true)
    setError(null)
    setProgress(0)
    setCurrentStep("Initializing AI story creation...")

    try {
      const story = await storyGenerator.generateCompleteStory(
        apiKeyToUse,
        config,
        characters,
        (message, progressValue) => {
          setCurrentStep(message)
          setProgress(progressValue)
        }
      )

      setGeneratedStory(story)
      setIsGenerating(false)
      onStoryGenerated(story)
      
    } catch (err: any) {
      console.error('[STORY_GENERATION] Error:', err)
      setError(err.message || "Failed to generate story")
      setIsGenerating(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setGeneratedStory(null)
    if (apiKey) {
      handleStartGeneration(apiKey)
    } else {
      setShowApiKeyModal(true)
    }
  }

  const handleCloseApiKeyModal = () => {
    setShowApiKeyModal(false)
    onBack()
  }

  return (
    <div className="min-h-screen bg-comic-yellow p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="comic-title text-5xl mb-4">
            Creating Your Story
          </h1>
          <p className="comic-text text-lg">
            AI is crafting your personalized storybook!
          </p>
        </motion.header>

        {/* Generation Progress */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="animate-bounce-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-center">
                {isGenerating ? (
                  <>
                    <div className="animate-spin w-6 h-6 border-4 border-black border-t-comic-blue rounded-full" />
                    Generating...
                  </>
                ) : error ? (
                  <>
                    <AlertTriangle className="w-6 h-6 text-comic-red" />
                    Generation Failed
                  </>
                ) : (
                  "Story Ready!"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-4 border-2 border-black" />
                <p className="comic-text text-center text-sm">{Math.round(progress)}%</p>
              </div>

              {/* Current Step */}
              <div className="text-center">
                <p className="comic-text text-lg">{currentStep}</p>
              </div>

              {/* Story Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold">Theme</div>
                  <div className="capitalize">{config.theme}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">Style</div>
                  <div className="capitalize">{config.style.replace('_', ' ')}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">Characters</div>
                  <div>{characters.length}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">Setting</div>
                  <div>{config.setting || "Adventure Land"}</div>
                </div>
              </div>

              {/* Character Preview */}
              <div>
                <h3 className="font-bold text-center mb-3">Your Characters</h3>
                <div className="flex justify-center gap-2 flex-wrap">
                  {characters.map((char) => (
                    <div key={char.id} className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-comic-blue to-comic-purple border-4 border-black flex items-center justify-center mb-1">
                        {char.uploadedImage ? (
                          <img
                            src={char.uploadedImage}
                            alt={char.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-xs">{char.name[0]}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold">{char.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-comic-red text-white border-4 border-black p-4 text-center">
                  <p className="font-bold mb-2">Oops! Something went wrong:</p>
                  <p className="text-sm mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleRetry} variant="secondary" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <Button onClick={onBack} variant="outline" size="sm">
                      Go Back
                    </Button>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {generatedStory && !isGenerating && (
                <div className="bg-comic-green text-white border-4 border-black p-4 text-center">
                  <p className="font-bold text-lg">🎉 Your Story is Ready!</p>
                  <p className="text-sm">Get ready to read "{generatedStory.title}"</p>
                </div>
              )}

              {/* Back Button */}
              {!isGenerating && !generatedStory && (
                <div className="text-center pt-4">
                  <Button onClick={onBack} variant="outline">
                    Back to Characters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={handleCloseApiKeyModal}
          onSubmit={handleApiKeySubmit}
          isLoading={isGenerating}
        />
      </div>
    </div>
  )
}