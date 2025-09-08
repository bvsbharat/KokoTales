"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Check, X, ArrowLeft, ArrowRight } from "lucide-react"
import { Character } from "@/lib/types"
import { geminiService } from "@/lib/ai-services/gemini-service"

interface CharacterDesignViewerProps {
  characters: Character[]
  storyStyle: string
  onCharactersApproved: (approvedCharacters: Character[]) => void
  onBack: () => void
}

export default function CharacterDesignViewer({
  characters,
  storyStyle,
  onCharactersApproved,
  onBack
}: CharacterDesignViewerProps) {
  const [designCharacters, setDesignCharacters] = useState<Character[]>(characters)
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingCharacterId, setGeneratingCharacterId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    generateInitialDesigns()
  }, [])

  const generateInitialDesigns = async () => {
    setIsGenerating(true)
    const updatedCharacters = [...designCharacters]

    for (let i = 0; i < updatedCharacters.length; i++) {
      const character = updatedCharacters[i]
      setGeneratingCharacterId(character.id)
      setProgress((i / updatedCharacters.length) * 100)

      try {
        const designImage = await geminiService.generateCharacterDesign(character, storyStyle)
        updatedCharacters[i] = {
          ...character,
          generatedDesignImage: designImage,
          designApproved: false
        }
        setDesignCharacters([...updatedCharacters])
      } catch (error) {
        console.error(`Failed to generate design for ${character.name}:`, error)
        // Keep character without design for manual retry
      }
    }

    setProgress(100)
    setGeneratingCharacterId(null)
    setIsGenerating(false)
  }

  const regenerateCharacterDesign = async (characterId: string) => {
    const character = designCharacters.find(c => c.id === characterId)
    if (!character) return

    setGeneratingCharacterId(characterId)
    try {
      const designImage = await geminiService.generateCharacterDesign(character, storyStyle)
      const updatedCharacters = designCharacters.map(c =>
        c.id === characterId
          ? { ...c, generatedDesignImage: designImage, designApproved: false }
          : c
      )
      setDesignCharacters(updatedCharacters)
    } catch (error) {
      console.error(`Failed to regenerate design for ${character.name}:`, error)
    } finally {
      setGeneratingCharacterId(null)
    }
  }

  const approveCharacter = (characterId: string) => {
    const updatedCharacters = designCharacters.map(c =>
      c.id === characterId ? { ...c, designApproved: true } : c
    )
    setDesignCharacters(updatedCharacters)
  }

  const rejectCharacter = (characterId: string) => {
    const updatedCharacters = designCharacters.map(c =>
      c.id === characterId ? { ...c, designApproved: false } : c
    )
    setDesignCharacters(updatedCharacters)
  }

  const allCharactersApproved = designCharacters.every(c => c.designApproved && c.generatedDesignImage)
  const currentCharacter = designCharacters[currentCharacterIndex]

  const handleProceedToStory = () => {
    if (allCharactersApproved) {
      onCharactersApproved(designCharacters)
    }
  }

  const nextCharacter = () => {
    if (currentCharacterIndex < designCharacters.length - 1) {
      setCurrentCharacterIndex(currentCharacterIndex + 1)
    }
  }

  const prevCharacter = () => {
    if (currentCharacterIndex > 0) {
      setCurrentCharacterIndex(currentCharacterIndex - 1)
    }
  }

  return (
    <div className="min-h-screen bg-comic-yellow p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h1 className="comic-title text-4xl md:text-5xl mb-4">
            Character Designs
          </h1>
          <p className="comic-text text-lg">
            Review and approve your character designs before creating the story
          </p>
        </motion.header>

        {/* Progress Bar */}
        {isGenerating && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="animate-spin w-8 h-8 border-4 border-black border-t-comic-blue rounded-full mx-auto mb-2" />
                  <p className="comic-text">Generating character designs...</p>
                </div>
                <Progress value={progress} className="h-4 border-2 border-black" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Character Design Display */}
        {!isGenerating && currentCharacter && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <Card className="animate-bounce-in">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentCharacter.name}</span>
                  <span className="text-sm font-normal">
                    {currentCharacterIndex + 1} of {designCharacters.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Character Design Image */}
                  <div className="text-center">
                    <div className="relative">
                      {generatingCharacterId === currentCharacter.id ? (
                        <div className="w-full h-96 bg-gray-200 border-4 border-black flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-black border-t-comic-blue rounded-full mx-auto mb-4" />
                            <p className="comic-text">Generating design...</p>
                          </div>
                        </div>
                      ) : currentCharacter.generatedDesignImage ? (
                        <img
                          src={currentCharacter.generatedDesignImage}
                          alt={`${currentCharacter.name} design`}
                          className="w-full h-96 object-cover border-4 border-black"
                        />
                      ) : (
                        <div className="w-full h-96 bg-gray-200 border-4 border-black flex items-center justify-center">
                          <div className="text-center">
                            <X className="w-12 h-12 text-comic-red mx-auto mb-2" />
                            <p className="comic-text">Design generation failed</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Approval Status */}
                      {currentCharacter.designApproved && (
                        <div className="absolute top-2 right-2 bg-comic-green text-white p-2 border-2 border-black">
                          <Check className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Character Info & Controls */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-2">Character Details</h3>
                      <p className="comic-text">{currentCharacter.description || currentCharacter.generatedDescription}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold">Actions:</h4>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveCharacter(currentCharacter.id)}
                          variant={currentCharacter.designApproved ? "default" : "outline"}
                          disabled={!currentCharacter.generatedDesignImage || generatingCharacterId === currentCharacter.id}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>

                        <Button
                          onClick={() => rejectCharacter(currentCharacter.id)}
                          variant={!currentCharacter.designApproved ? "default" : "outline"}
                          disabled={generatingCharacterId === currentCharacter.id}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>

                      <Button
                        onClick={() => regenerateCharacterDesign(currentCharacter.id)}
                        variant="secondary"
                        disabled={generatingCharacterId === currentCharacter.id}
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Design
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                onClick={prevCharacter}
                variant="outline"
                disabled={currentCharacterIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {designCharacters.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCharacterIndex(index)}
                    className={`w-3 h-3 rounded-full border-2 border-black ${
                      index === currentCharacterIndex
                        ? 'bg-comic-blue'
                        : designCharacters[index].designApproved
                        ? 'bg-comic-green'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextCharacter}
                variant="outline"
                disabled={currentCharacterIndex === designCharacters.length - 1}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <Button onClick={onBack} variant="outline">
                Back to Characters
              </Button>
              
              <Button
                onClick={handleProceedToStory}
                disabled={!allCharactersApproved}
                size="lg"
                className="px-8 py-3"
              >
                {allCharactersApproved ? 'Create Story' : `Approve All Characters (${designCharacters.filter(c => c.designApproved).length}/${designCharacters.length})`}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}