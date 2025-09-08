export type StoryTheme = "funny" | "adventurous" | "educational" | "magical" | "mystery"
export type StoryStyle = "comic" | "picture_book" | "fairy_tale" | "graphic_novel" | "pop_up"
export type AgeGroup = "3-5" | "6-8" | "9-12" | "13+"

export interface StoryConfig {
  prompt: string
  theme: StoryTheme
  style: StoryStyle
  characters: string[]
  setting: string
  characterCount: number
  pageCount?: number
  targetAge?: AgeGroup
}

export interface Character {
  id: string
  name: string
  description?: string
  // User uploaded reference image
  uploadedImage?: string
  base64Image?: string
  mimeType?: string
  // AI generated character design
  generatedDescription?: string
  generatedDesignImage?: string // The actual character design for consistency
  designApproved?: boolean // User approval status
  // Legacy field for backward compatibility
  generatedArtwork?: string
}

export interface Panel {
  id: string
  title?: string
  description: string
  characters: string[]
  imageUrl?: string
  dialogue?: string[]
  narration?: string
}

export interface StoryPage {
  id: string
  panels: Panel[]
  pageNumber: number
}

export interface GeneratedStory {
  id: string
  config: StoryConfig
  characters: Character[]
  pages: StoryPage[]
  title: string
  createdAt: Date
  coverImage?: string // Base64 encoded cover image
  coverVideo?: string // URL to the generated cover video
  coverVideoRequestId?: string // FAL request ID for video generation
}

export enum GenerationState {
  INPUT = 'input',
  CHARACTER_SETUP = 'character_setup',
  CHARACTER_DESIGN = 'character_design',
  GENERATING = 'generating', 
  COMPLETED = 'completed'
}