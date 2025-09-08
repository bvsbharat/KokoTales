# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the MemoryTales.ai application.

## Development Commands

- **Development server**: `npm run dev` - Starts Next.js dev server on localhost:3000
- **Build**: `npm run build` - Creates production build
- **Start**: `npm run start` - Starts production server
- **Lint**: `npm run lint` - Runs ESLint

## Environment Setup

This app requires Google Gemini API access:
- Copy `.env.example` to `.env.local`
- Set `NEXT_PUBLIC_GEMINI_API_KEY` with your Google Gemini API key
- Optionally set `NEXT_PUBLIC_GEMINI_API_KEY_FALLBACK` for rate limit fallback
- The key is accessed via `process.env.NEXT_PUBLIC_GEMINI_API_KEY` in the code

## Architecture Overview

MemoryTales.ai is a Next.js-based AI storytelling application that creates personalized illustrated storybooks using Google's Gemini API.

### Application Flow
1. **Story Input** (`GenerationState.INPUT`) - User configures story parameters
2. **Character Setup** (`GenerationState.CHARACTER_SETUP`) - Users upload photos and create characters
3. **Generation** (`GenerationState.GENERATING`) - AI creates the complete storybook
4. **Viewing** (`GenerationState.COMPLETED`) - Display and interact with the finished storybook

### Key Components Structure
- **app/page.tsx** - Main application with state management and flow control
- **components/character/** - Character selection and management UI
- **components/story/** - Story generation progress and controls
- **components/storybook/** - Storybook viewing and interaction
- **lib/ai-services/** - AI integration services (Gemini API)
- **lib/export/** - PDF generation and export functionality
- **lib/sharing/** - Social media sharing services

### Data Flow & State Management
The application uses React state with TypeScript for type safety:
- `StoryConfig` - User story configuration and preferences
- `Character[]` - Character data with uploaded images and AI descriptions
- `GeneratedStory` - Complete story with pages, panels, and illustrations
- `GenerationState` - Application flow state machine

### AI Service Integration
The `geminiService.ts` handles AI operations:
- `generateCharacterDescriptions()` - Creates character profiles from names
- `generateStory()` - Creates structured story content with pages and panels
- `generateCartoonCharacterImage()` - Creates character illustrations (placeholder implementation)
- `generatePanelIllustration()` - Creates story panel artwork (placeholder implementation)

### Tech Stack
- Next.js 14 with TypeScript and App Router
- Tailwind CSS with custom comic book design system
- Google Gemini API (@google/genai) for AI generation
- Framer Motion for animations
- Radix UI for accessible components
- React Dropzone for file uploads

## Design System

### Comic Book Theme
The app uses a vibrant neo-brutalist design with:
- **Colors**: Comic yellow background (#FFD700), bold contrasts
- **Typography**: Bold fonts with text shadows and uppercase styling
- **Shadows**: Sharp drop shadows (shadow-comic classes)
- **Borders**: Thick black borders on all elements
- **Animations**: Bounce effects and smooth transitions

### Responsive Design
- Mobile-first approach with responsive breakpoints
- Touch-friendly interface for character selection
- Optimized layouts for different screen sizes
- Reduced shadows and borders on mobile for performance

## Important Implementation Details

### Character System
- Users can upload photos for personalized characters
- AI generates cartoon descriptions for characters without photos
- 4-card selection interface with drag-and-drop functionality
- Character consistency maintained across story panels

### Story Generation
- Structured JSON responses from Gemini API ensure reliability
- Real-time progress tracking during generation
- Error handling with retry capabilities
- Support for multiple story themes and book styles

### Export & Sharing
- PDF generation for storybook downloads
- Social media sharing (Twitter, Facebook, Email)
- Web Share API integration for mobile devices
- Copy-to-clipboard fallback for older browsers

### Development Helpers
- Mock data generators for testing (`lib/dev-helpers.ts`)
- Placeholder implementations for image generation
- Development mode utilities and test configurations

## Production Considerations

### Image Generation
Current implementation uses SVG placeholders. For production:
- Integrate with image generation APIs (DALL-E, Midjourney, Stable Diffusion)
- Implement proper image storage and CDN delivery
- Add image optimization and caching layers

### API Optimization
- Implement request caching for repeated AI calls
- Add rate limiting and usage monitoring
- Consider batch processing for multiple panels

### Performance
- Implement lazy loading for story panels and images
- Add service worker for offline functionality
- Optimize bundle size with dynamic imports

### Security
- Input validation and sanitization for all user content
- Rate limiting on API endpoints
- Proper error handling without exposing sensitive information

## Common Tasks

### Adding New Story Themes
1. Update the themes array in `app/page.tsx`
2. Add corresponding prompts in `geminiService.ts`
3. Test generation with new theme

### Customizing UI Components
1. Modify base components in `components/ui/`
2. Update global styles in `app/globals.css`
3. Adjust Tailwind config for new colors/animations

### Enhancing AI Generation
1. Modify schemas and prompts in `lib/ai-services/gemini-service.ts`
2. Test with various story configurations
3. Update error handling for new failure modes

### Adding Export Formats
1. Create new generator in `lib/export/`
2. Add UI controls in storybook viewer
3. Test with different story types and lengths