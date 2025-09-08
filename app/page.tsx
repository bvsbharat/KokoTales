"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { BookOpen, Sparkles, Users, Palette, Camera } from "lucide-react"
import CharacterSelector from "@/components/character/character-selector"
import CharacterDesignViewer from "@/components/character/character-design-viewer"
import StoryGeneratorComponent from "@/components/story/story-generator"
import StorybookViewer from "@/components/storybook/storybook-viewer"
import { StoryConfig, Character, GenerationState, GeneratedStory, StoryTheme, StoryStyle } from "@/lib/types"

export default function HomePage() {
  const [step, setStep] = useState<GenerationState>(GenerationState.INPUT)
  const [config, setConfig] = useState<StoryConfig>({
    prompt: '',
    theme: 'funny',
    style: 'comic',
    characters: [],
    setting: '',
    characterCount: 2
  })
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([])
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null)

  const themes = [
    { value: 'funny', label: 'Funny & Hilarious', emoji: '😂' },
    { value: 'adventurous', label: 'Action & Adventure', emoji: '🏃‍♀️' },
    { value: 'educational', label: 'Learning & Discovery', emoji: '🧠' },
    { value: 'magical', label: 'Magical & Fantasy', emoji: '✨' },
    { value: 'mystery', label: 'Mystery & Detective', emoji: '🔍' }
  ]

  const styles = [
    { value: 'comic', label: 'Comic Book', desc: 'Bold panels with speech bubbles' },
    { value: 'picture_book', label: 'Picture Book', desc: 'Classic illustrated story format' },
    { value: 'fairy_tale', label: 'Fairy Tale', desc: 'Enchanted storybook style' },
    { value: 'graphic_novel', label: 'Graphic Novel', desc: 'Modern visual storytelling' },
    { value: 'pop_up', label: 'Pop-up Style', desc: 'Interactive 3D elements' }
  ]

  const handleCreateStory = () => {
    setStep(GenerationState.CHARACTER_SETUP)
  }

  const handleCharactersReady = (characters: Character[]) => {
    setSelectedCharacters(characters)
    setStep(GenerationState.CHARACTER_DESIGN)
  }

  const handleCharacterDesignsApproved = (approvedCharacters: Character[]) => {
    setSelectedCharacters(approvedCharacters)
    setStep(GenerationState.GENERATING)
  }

  const handleBackToCharacterSetup = () => {
    setStep(GenerationState.CHARACTER_SETUP)
  }

  const handleBackToInput = () => {
    setStep(GenerationState.INPUT)
  }

  const handleStoryGenerated = (story: GeneratedStory) => {
    setGeneratedStory(story)
    setStep(GenerationState.COMPLETED)
  }

  const handleBackToCharacters = () => {
    setStep(GenerationState.CHARACTER_SETUP)
  }

  const handleStartOver = () => {
    setStep(GenerationState.INPUT)
    setConfig({
      prompt: '',
      theme: 'funny',
      style: 'comic',
      characters: [],
      setting: '',
      characterCount: 2
    })
    setSelectedCharacters([])
    setGeneratedStory(null)
  }

  return (
    <div className="min-h-screen bg-comic-yellow p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6 md:mb-8"
        >
          <h1 className="comic-title text-4xl md:text-6xl mb-2 md:mb-4">
            KokoTales
          </h1>
          <p className="comic-subtitle text-lg md:text-xl mb-2">
            AI-Powered Interactive Storytelling
          </p>
          <p className="comic-text text-sm md:text-base px-4">
            Create personalized illustrated storybooks with magical AI characters
          </p>
        </motion.header>

        {step === GenerationState.INPUT && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Story Prompt Card */}
            <Card className="animate-bounce-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-8 h-8" />
                  What's Your Story Idea?
                </CardTitle>
                <CardDescription>
                  Tell us about the amazing story you want to create!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Once upon a time, there was a brave little dragon who loved to bake cookies..."
                  value={config.prompt}
                  onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                  rows={4}
                  className="text-lg"
                />
              </CardContent>
            </Card>

            {/* Configuration Grid */}
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Theme Selection */}
              <Card className="animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    Story Theme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={config.theme}
                    onValueChange={(value: StoryTheme) => setConfig({ ...config, theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          <span className="flex items-center gap-2">
                            <span>{theme.emoji}</span>
                            {theme.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Style Selection */}
              <Card className="animate-bounce-in" style={{ animationDelay: '0.3s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-6 h-6" />
                    Book Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={config.style}
                    onValueChange={(value: StoryStyle) => setConfig({ ...config, style: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-bold">{style.label}</div>
                            <div className="text-xs text-muted-foreground">{style.desc}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Character & Setting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5" />
                    Characters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={config.characterCount.toString()}
                    onValueChange={(value) => setConfig({ ...config, characterCount: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Character</SelectItem>
                      <SelectItem value="2">2 Characters</SelectItem>
                      <SelectItem value="3">3 Characters</SelectItem>
                      <SelectItem value="4">4 Characters</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2 md:col-span-2 animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                <CardHeader>
                  <CardTitle className="text-lg">Story Setting</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="e.g., Enchanted forest, Space station, Underwater city..."
                    value={config.setting}
                    onChange={(e) => setConfig({ ...config, setting: e.target.value })}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Create Story Button */}
            <motion.div
              className="text-center pt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleCreateStory}
                size="xl"
                disabled={!config.prompt.trim()}
                className="px-8 md:px-12 py-4 md:py-6 text-base md:text-lg"
              >
                <Camera className="w-6 h-6 mr-2" />
                Create My Story
              </Button>
            </motion.div>
          </motion.div>
        )}

        {step === GenerationState.CHARACTER_SETUP && (
          <div className="max-w-4xl mx-auto">
            <CharacterSelector
              characterCount={config.characterCount}
              onCharactersReady={handleCharactersReady}
              onBack={handleBackToInput}
            />
          </div>
        )}

        {step === GenerationState.CHARACTER_DESIGN && (
          <CharacterDesignViewer
            characters={selectedCharacters}
            storyStyle={config.style}
            onCharactersApproved={handleCharacterDesignsApproved}
            onBack={handleBackToCharacterSetup}
          />
        )}

        {step === GenerationState.GENERATING && (
          <StoryGeneratorComponent
            config={config}
            characters={selectedCharacters}
            onStoryGenerated={handleStoryGenerated}
            onBack={handleBackToCharacters}
          />
        )}

        {step === GenerationState.COMPLETED && generatedStory && (
          <StorybookViewer
            story={generatedStory}
            onHome={handleStartOver}
            onRegenerate={() => setStep(GenerationState.GENERATING)}
          />
        )}
      </div>
    </div>
  )
}