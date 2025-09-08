"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  User,
  Camera,
} from "lucide-react";
import { Character } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";

interface CharacterSelectorProps {
  characterCount: number;
  onCharactersReady: (characters: Character[]) => void;
  onBack: () => void;
}

export default function CharacterSelector({
  characterCount,
  onCharactersReady,
  onBack,
}: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<Character[]>(() =>
    Array.from({ length: characterCount }, (_, i) => ({
      id: `char-${i + 1}`,
      name: "",
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateCharacter = (index: number, updates: Partial<Character>) => {
    setCharacters((prev) =>
      prev.map((char, i) => (i === index ? { ...char, ...updates } : char))
    );
  };

  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateCharacter(index, {
        uploadedImage: result,
        base64Image: result.split(",")[1],
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const nextCharacter = () => {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevCharacter = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isComplete = characters.every((char) => char.name.trim() !== "");

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8 mt-8"
        >
          <h1 className="comic-title text-5xl mb-4 mt-4o">
            Create Your Characters
          </h1>
          <p className="comic-text text-lg">
            Upload photos or let AI create amazing cartoon characters
          </p>
        </motion.header>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            {characters.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-4 h-4 border-2 border-black transition-colors",
                  index === currentIndex ? "bg-comic-blue" : "bg-white"
                )}
              />
            ))}
          </div>
        </div>

        {/* Character Cards Layout */}
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <AnimatePresence mode="wait">
              {characters.map((character, index) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isActive={index === currentIndex}
                  onClick={() => setCurrentIndex(index)}
                  onUpdate={(updates) => updateCharacter(index, updates)}
                  onImageUpload={(file) => handleImageUpload(index, file)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mb-8">
          <Button onClick={onBack} variant="outline" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Story
          </Button>

          <div className="flex gap-4">
            <Button
              onClick={prevCharacter}
              disabled={currentIndex === 0}
              variant="secondary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={nextCharacter}
              disabled={currentIndex === characters.length - 1}
              variant="secondary"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={() => onCharactersReady(characters)}
            disabled={!isComplete}
            size="lg"
          >
            Create Story
            <Check className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CharacterCardProps {
  character: Character;
  isActive: boolean;
  onClick: () => void;
  onUpdate: (updates: Partial<Character>) => void;
  onImageUpload: (file: File) => void;
}

function CharacterCard({
  character,
  isActive,
  onClick,
  onUpdate,
  onImageUpload,
}: CharacterCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onImageUpload(acceptedFiles[0]);
      }
    },
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: isActive ? 1.05 : 1,
        y: isActive ? -10 : 0,
      }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      <Card
        className={cn(
          "comic-panel h-80 cursor-pointer transition-all duration-300",
          isActive && "ring-4 ring-comic-blue shadow-comic-lg"
        )}
      >
        <CardContent className="p-6 h-full flex flex-col">
          {/* Image Upload Area */}
          <div
            {...getRootProps()}
            className={cn(
              "border-4 border-dashed border-gray-400 rounded-none flex flex-col items-center justify-center mb-4 transition-colors relative overflow-hidden",
              isDragActive && "border-comic-blue bg-comic-yellow",
              character.uploadedImage && "border-solid border-black"
            )}
            style={{ height: "200px", width: "100%" }}
          >
            <input {...getInputProps()} />

            {character.uploadedImage ? (
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat bg-gray-50"
                style={{
                  backgroundImage: `url(${character.uploadedImage})`,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({
                      uploadedImage: undefined,
                      base64Image: undefined,
                    });
                  }}
                  className="absolute top-2 right-2 bg-comic-red text-white border-2 border-black p-1 hover:bg-red-600 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                {isDragActive ? (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-comic-blue" />
                    <p className="text-sm font-bold">Drop photo here!</p>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-xs font-bold text-center">
                      Drop photo or click to upload
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Character Name Input */}
          <Input
            value={character.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter character name (e.g., Princess Luna, Captain Max, Brave Knight)"
            className="text-center font-bold"
            onClick={(e) => e.stopPropagation()}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
