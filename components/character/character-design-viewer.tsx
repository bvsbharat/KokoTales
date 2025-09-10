"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Check, X, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Character } from "@/lib/types";
import { geminiService } from "@/lib/ai-services/gemini-service";
import ApiKeyModal from "@/components/ui/api-key-modal";

interface CharacterDesignViewerProps {
  characters: Character[];
  storyStyle: string;
  onCharactersApproved: (approvedCharacters: Character[]) => void;
  onBack: () => void;
}

export default function CharacterDesignViewer({
  characters,
  storyStyle,
  onCharactersApproved,
  onBack,
}: CharacterDesignViewerProps) {
  const [designCharacters, setDesignCharacters] =
    useState<Character[]>(characters);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCharacterId, setGeneratingCharacterId] = useState<
    string | null
  >(null);
  const [progress, setProgress] = useState(0);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    setShowApiKeyModal(true);
  }, []);

  const handleApiKeySubmit = (submittedApiKey: string) => {
    setApiKey(submittedApiKey);
    setShowApiKeyModal(false);
    generateInitialDesigns(submittedApiKey);
  };

  const handleCloseApiKeyModal = () => {
    setShowApiKeyModal(false);
    onBack();
  };

  const generateInitialDesigns = async (apiKeyToUse: string) => {
    setIsGenerating(true);
    const updatedCharacters = [...designCharacters];

    for (let i = 0; i < updatedCharacters.length; i++) {
      const character = updatedCharacters[i];
      setGeneratingCharacterId(character.id);
      setProgress((i / updatedCharacters.length) * 100);

      try {
        const designImage = await geminiService.generateCharacterDesign(
          apiKeyToUse,
          character,
          storyStyle
        );
        updatedCharacters[i] = {
          ...character,
          generatedDesignImage: designImage,
          designApproved: false,
        };
        setDesignCharacters([...updatedCharacters]);
      } catch (error) {
        console.error(
          `Failed to generate design for ${character.name}:`,
          error
        );
        // Keep character without design for manual retry
      }
    }

    setProgress(100);
    setGeneratingCharacterId(null);
    setIsGenerating(false);
  };

  const regenerateCharacterDesign = async (characterId: string) => {
    const character = designCharacters.find((c) => c.id === characterId);
    if (!character || !apiKey) return;

    setGeneratingCharacterId(characterId);
    try {
      const designImage = await geminiService.generateCharacterDesign(
        apiKey,
        character,
        storyStyle
      );
      const updatedCharacters = designCharacters.map((c) =>
        c.id === characterId
          ? { ...c, generatedDesignImage: designImage, designApproved: false }
          : c
      );
      setDesignCharacters(updatedCharacters);
    } catch (error) {
      console.error(
        `Failed to regenerate design for ${character.name}:`,
        error
      );
    } finally {
      setGeneratingCharacterId(null);
    }
  };

  const approveCharacter = (characterId: string) => {
    const updatedCharacters = designCharacters.map((c) =>
      c.id === characterId ? { ...c, designApproved: true } : c
    );
    setDesignCharacters(updatedCharacters);
  };

  const rejectCharacter = (characterId: string) => {
    const updatedCharacters = designCharacters.map((c) =>
      c.id === characterId ? { ...c, designApproved: false } : c
    );
    setDesignCharacters(updatedCharacters);
  };

  const allCharactersApproved = designCharacters.every(
    (c) => c.designApproved && c.generatedDesignImage
  );
  const currentCharacter = designCharacters[currentCharacterIndex];

  const handleProceedToStory = () => {
    if (allCharactersApproved) {
      onCharactersApproved(designCharacters);
    }
  };

  const nextCharacter = () => {
    if (currentCharacterIndex < designCharacters.length - 1) {
      setCurrentCharacterIndex(currentCharacterIndex + 1);
    }
  };

  const prevCharacter = () => {
    if (currentCharacterIndex > 0) {
      setCurrentCharacterIndex(currentCharacterIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-comic-yellow p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <div className="mb-4">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Characters
            </Button>
          </div>
          <div className="text-center">
            <h1 className="comic-title text-4xl md:text-5xl mb-4">
              Character Designs
            </h1>
          </div>
        </motion.header>

        {/* Progress Bar */}
        {isGenerating && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <Card className="animate-bounce-in comic-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generating Characters...</span>
                  <span className="text-sm font-normal">
                    {Math.floor((progress / 100) * designCharacters.length) + 1} of {designCharacters.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Loading Placeholder */}
                  <div className="text-center">
                    <div className="w-full h-96 bg-gray-200 border-4 border-black flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-black border-t-comic-blue rounded-full mx-auto mb-4" />
                        <p className="comic-text">Generating design...</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-2">Progress</h3>
                      <p className="comic-text">Creating amazing character designs for your story...</p>
                    </div>

                    <div className="space-y-3">
                      <Progress
                        value={progress}
                        className="h-4 border-2 border-black"
                      />
                      <p className="text-sm text-gray-600">
                        {Math.round(progress)}% Complete
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Placeholder */}
            <div className="flex justify-between items-center">
              <div className="w-24 h-10 bg-gray-200 border-2 border-black"></div>
              <div className="flex gap-2">
                {designCharacters.map((_, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full border-2 border-black bg-gray-300"
                  />
                ))}
              </div>
              <div className="w-24 h-10 bg-gray-200 border-2 border-black"></div>
            </div>

            {/* Action Buttons Placeholder */}
            <div className="flex justify-center gap-4 pt-4">
              <div className="w-32 h-10 bg-gray-200 border-2 border-black"></div>
              <div className="w-48 h-12 bg-gray-200 border-2 border-black"></div>
            </div>
          </motion.div>
        )}

        {/* Character Design Display */}
        {!isGenerating && currentCharacter && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <Card className="animate-bounce-in comic-panel">
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
                        <div className="w-full h-96 border-4 border-black bg-gray-50 flex items-center justify-center overflow-hidden">
                          <img
                            src={currentCharacter.generatedDesignImage}
                            alt={`${currentCharacter.name} design`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              console.error('Failed to load character design image:', e);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-96 bg-gray-200 border-4 border-black flex items-center justify-center">
                          <div className="text-center">
                            <X className="w-12 h-12 text-comic-red mx-auto mb-2" />
                            <p className="comic-text">
                              Design generation failed
                            </p>
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
                      <h3 className="font-bold text-lg mb-2">
                        Character Details
                      </h3>
                      <p className="comic-text">
                        {currentCharacter.description ||
                          currentCharacter.generatedDescription}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold">Actions:</h4>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveCharacter(currentCharacter.id)}
                          variant={
                            currentCharacter.designApproved
                              ? "default"
                              : "outline"
                          }
                          disabled={
                            !currentCharacter.generatedDesignImage ||
                            generatingCharacterId === currentCharacter.id
                          }
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>

                        <Button
                          onClick={() => rejectCharacter(currentCharacter.id)}
                          variant={
                            !currentCharacter.designApproved
                              ? "default"
                              : "outline"
                          }
                          disabled={
                            generatingCharacterId === currentCharacter.id
                          }
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>

                      <Button
                        onClick={() =>
                          regenerateCharacterDesign(currentCharacter.id)
                        }
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
                        ? "bg-comic-blue"
                        : designCharacters[index].designApproved
                        ? "bg-comic-green"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {allCharactersApproved ? (
                <Button
                  onClick={handleProceedToStory}
                  size="lg"
                  className="px-6 py-3"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Story
                </Button>
              ) : (
                <Button
                  onClick={nextCharacter}
                  variant="outline"
                  disabled={currentCharacterIndex === designCharacters.length - 1}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

          </motion.div>
        )}

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={handleCloseApiKeyModal}
          onSubmit={handleApiKeySubmit}
          isLoading={isGenerating}
        />
      </div>
    </div>
  );
}
