"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Users,
  Palette,
  Camera,
  FileText,
  Baby,
  History,
  Clock,
  Trash2,
} from "lucide-react";
import CuteBookIcon from "@/components/ui/cute-book-icon";
import CharacterSelector from "@/components/character/character-selector";
import CharacterDesignViewer from "@/components/character/character-design-viewer";
import StoryGeneratorComponent from "@/components/story/story-generator";
import BookViewer from "@/components/storybook/book-viewer";
import {
  StoryConfig,
  Character,
  GenerationState,
  GeneratedStory,
  StoryTheme,
  StoryStyle,
  AgeGroup,
} from "@/lib/types";
import { storyStorage } from "@/lib/storage/story-storage";

export default function HomePage() {
  const [step, setStep] = useState<GenerationState>(GenerationState.INPUT);
  const [config, setConfig] = useState<StoryConfig>({
    prompt: "",
    theme: "funny",
    style: "comic",
    characters: [],
    setting: "",
    characterCount: 2,
    pageCount: 5,
    targetAge: "6-8",
  });
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(
    null
  );
  const [storedStories, setStoredStories] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load stored stories on component mount
  useEffect(() => {
    const stories = storyStorage.getAllStoredStories();
    setStoredStories(stories);
  }, []);

  // Load a story from history
  const handleLoadStory = (storyId: string) => {
    const story = storyStorage.loadStory(storyId);
    if (story) {
      setGeneratedStory(story);
      setStep(GenerationState.COMPLETED);
      setShowHistory(false);
    }
  };

  // Delete a story from history
  const handleDeleteStory = (storyId: string) => {
    storyStorage.deleteStory(storyId);
    const updatedStories = storyStorage.getAllStoredStories();
    setStoredStories(updatedStories);
  };

  // Close history menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHistory && !(event.target as Element)?.closest(".history-menu")) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showHistory]);

  const themes = [
    { value: "funny", label: "Funny & Hilarious", emoji: "😂" },
    { value: "adventurous", label: "Action & Adventure", emoji: "🏃‍♀️" },
    { value: "educational", label: "Learning & Discovery", emoji: "🧠" },
    { value: "magical", label: "Magical & Fantasy", emoji: "✨" },
    { value: "mystery", label: "Mystery & Detective", emoji: "🔍" },
  ];

  const styles = [
    {
      value: "comic",
      label: "Comic Book",
      desc: "Bold panels with speech bubbles",
    },
    {
      value: "picture_book",
      label: "Picture Book",
      desc: "Classic illustrated story format",
    },
    {
      value: "fairy_tale",
      label: "Fairy Tale",
      desc: "Enchanted storybook style",
    },
    {
      value: "graphic_novel",
      label: "Graphic Novel",
      desc: "Modern visual storytelling",
    },
    { value: "pop_up", label: "Pop-up Style", desc: "Interactive 3D elements" },
  ];

  const ageGroups = [
    {
      value: "3-5",
      label: "Ages 3-5",
      desc: "Preschool - Simple stories with basic concepts",
    },
    {
      value: "6-8",
      label: "Ages 6-8",
      desc: "Early readers - Elementary vocabulary",
    },
    {
      value: "9-12",
      label: "Ages 9-12",
      desc: "Middle grade - More complex adventures",
    },
    {
      value: "13+",
      label: "Ages 13+",
      desc: "Young adult - Advanced themes and vocabulary",
    },
  ];

  const pageCountOptions = [
    { value: 3, label: "3 Pages", desc: "Quick story" },
    { value: 4, label: "4 Pages", desc: "Short story" },
    { value: 5, label: "5 Pages", desc: "Standard story" },
    { value: 6, label: "6 Pages", desc: "Extended story" },
    { value: 8, label: "8 Pages", desc: "Long story" },
    { value: 10, label: "10 Pages", desc: "Epic adventure" },
  ];

  const handleCreateStory = () => {
    setStep(GenerationState.CHARACTER_SETUP);
  };

  const handleCharactersReady = (characters: Character[]) => {
    setSelectedCharacters(characters);
    setStep(GenerationState.CHARACTER_DESIGN);
  };

  const handleCharacterDesignsApproved = (approvedCharacters: Character[]) => {
    setSelectedCharacters(approvedCharacters);
    setStep(GenerationState.GENERATING);
  };

  const handleBackToCharacterSetup = () => {
    setStep(GenerationState.CHARACTER_SETUP);
  };

  const handleBackToInput = () => {
    setStep(GenerationState.INPUT);
  };

  const handleStoryGenerated = (story: GeneratedStory) => {
    setGeneratedStory(story);
    setStep(GenerationState.COMPLETED);
  };

  const handleBackToCharacters = () => {
    setStep(GenerationState.CHARACTER_SETUP);
  };

  const handleStartOver = () => {
    setStep(GenerationState.INPUT);
    setConfig({
      prompt: "",
      theme: "funny",
      style: "comic",
      characters: [],
      setting: "",
      characterCount: 2,
      pageCount: 5,
      targetAge: "6-8",
    });
    setSelectedCharacters([]);
    setGeneratedStory(null);
  };

  return (
    <div className="min-h-screen bg-comic-yellow p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4 md:mb-6"
          role="banner"
          aria-label="MemoryTales.ai header"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div
                className="comic-panel bg-white px-3 py-2 md:px-4 md:py-2 flex items-center gap-2"
                aria-label="Brand logo"
                tabIndex={0}
              >
                <CuteBookIcon
                  className="w-8 h-8 md:w-10 md:h-10"
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <h1 className="comic-title normal-case text-xl md:text-3xl leading-none">
                    MemoryTales.ai
                  </h1>
                  <p className="comic-subtitle text-[10px] md:text-xs leading-none opacity-70 mt-1 normal-case">
                    Create your personalized storybooks
                  </p>
                </div>
              </div>

              {/* History Menu */}
              {storedStories.length > 0 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 comic-panel"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden md:inline">History</span>
                    <span className="text-xs bg-comic-blue text-white rounded-full px-2 py-0.5 ml-1">
                      {storedStories.length}
                    </span>
                  </Button>

                  {/* History Dropdown */}
                  {showHistory && (
                    <div className="history-menu absolute top-full left-0 mt-2 w-80 max-w-[90vw] bg-white border-4 border-black shadow-comic-lg z-50 rounded-lg overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="comic-title text-lg">Story History</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHistory(false)}
                            className="text-xs"
                          >
                            Close
                          </Button>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {storedStories.map((story) => (
                            <div
                              key={story.id}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              {/* Thumbnail */}
                              <div className="w-12 h-12 bg-gradient-to-br from-comic-blue to-comic-purple rounded-lg flex items-center justify-center overflow-hidden">
                                {story.thumbnailImage ? (
                                  <img
                                    src={story.thumbnailImage}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <CuteBookIcon className="w-6 h-6 text-white" />
                                )}
                              </div>

                              {/* Story Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="comic-text text-sm font-bold truncate">
                                  {story.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      story.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                  <span>•</span>
                                  <span>{story.pageCount} pages</span>
                                  <span>•</span>
                                  <span>{story.config.targetAge}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleLoadStory(story.id)}
                                  className="text-xs px-2"
                                >
                                  Open
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteStory(story.id)}
                                  className="text-xs px-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {step === GenerationState.INPUT && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Story Prompt Card */}
            <Card className="animate-bounce-in comic-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                  onChange={(e) =>
                    setConfig({ ...config, prompt: e.target.value })
                  }
                  rows={4}
                  className="text-lg"
                />

                {/* Characters and Story Setting */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Characters */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Users className="w-4 h-4" />
                      Characters
                    </label>
                    <Select
                      value={config.characterCount.toString()}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          characterCount: parseInt(value),
                        })
                      }
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
                  </div>

                  {/* Story Setting */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Story Setting</label>
                    <Input
                      placeholder="e.g., Enchanted forest, Space station, Underwater city..."
                      value={config.setting}
                      onChange={(e) =>
                        setConfig({ ...config, setting: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story Configuration - Compact Single Container */}
            <Card
              className="animate-bounce-in comic-panel"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Story Configuration
                </CardTitle>
                <CardDescription>Customize your story settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* Theme Selection */}
                  <div className="space-y-2 lg:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      Story Theme
                    </label>
                    <Select
                      value={config.theme}
                      onValueChange={(value: StoryTheme) =>
                        setConfig({ ...config, theme: value })
                      }
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
                  </div>

                  {/* Style Selection */}
                  <div className="space-y-2 lg:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Palette className="w-4 h-4 text-purple-500" />
                      Book Style
                    </label>
                    <Select
                      value={config.style}
                      onValueChange={(value: StoryStyle) =>
                        setConfig({ ...config, style: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            <div>
                              <div className="font-bold">{style.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {style.desc}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Group Selection */}
                  <div className="space-y-2 lg:col-span-1">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Baby className="w-4 h-4 text-blue-500" />
                      Age Group
                    </label>
                    <Select
                      value={config.targetAge}
                      onValueChange={(value: AgeGroup) =>
                        setConfig({ ...config, targetAge: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ageGroups.map((age) => (
                          <SelectItem key={age.value} value={age.value}>
                            <div>
                              <div className="font-bold">{age.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {age.desc}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page Count Selection */}
                  <div className="space-y-2 lg:col-span-1">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="w-4 h-4 text-green-500" />
                      Story Length
                    </label>
                    <Select
                      value={config.pageCount?.toString()}
                      onValueChange={(value) =>
                        setConfig({ ...config, pageCount: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pageCountOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            <div>
                              <div className="font-bold">{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.desc}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                <Sparkles className="w-6 h-6 mr-2" />
                Create My Story
              </Button>
            </motion.div>
          </motion.div>
        )}

        {step === GenerationState.CHARACTER_SETUP && (
          <CharacterSelector
            characterCount={config.characterCount}
            onCharactersReady={handleCharactersReady}
            onBack={handleBackToInput}
          />
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
          <BookViewer
            story={generatedStory}
            onHome={handleStartOver}
            onRegenerate={() => setStep(GenerationState.GENERATING)}
          />
        )}
      </div>
    </div>
  );
}
