# MemoryTales.ai 📚✨

An AI-powered interactive storytelling application that creates personalized illustrated storybooks with magical AI characters.

Live demo link : https://koko-tales.vercel.app/

## Features

🎨 **Comic Book Style UI** - Vibrant neo-brutalist design with comic book aesthetics
🤖 **AI Story Generation** - Powered by Google Gemini for creative storytelling
👥 **Character Personalization** - Upload photos to create personalized cartoon characters
📖 **Multiple Story Formats** - Comic books, picture books, fairy tales, graphic novels
🎭 **Interactive Character Selection** - 4-card swipe interface for character management
🎬 **Animated Cover Videos** - Generate dynamic animated videos from story cover images
📱 **Responsive Design** - Optimized for mobile and desktop experiences
💫 **Real-time Generation** - Live progress tracking during story creation

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom comic book theme
- **AI Integration**: Google Gemini API
- **Video Generation**: FAL AI (Veo3 Image-to-Video)
- **Animation**: Framer Motion
- **UI Components**: Radix UI primitives
- **File Upload**: React Dropzone

## Getting Started

### Prerequisites

- Node.js 18+ 
- Google Gemini API key
- FAL AI API key (for video generation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MemoryTales.ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys to `.env.local`:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   FAL_KEY=your_fal_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
MemoryTales.ai/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles with comic theme
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main application page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── character/        # Character selection components
│   ├── story/           # Story generation components
│   └── storybook/       # Storybook viewer components
├── lib/                  # Utilities and services
│   ├── ai-services/     # AI integration services
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Utility functions
└── public/              # Static assets
```

## Usage Guide

### 1. Story Creation
- Enter your story idea in the prompt field
- Select theme (funny, adventurous, educational, magical, mystery)
- Choose book style (comic book, picture book, fairy tale, etc.)
- Set number of characters and story setting

### 2. Character Personalization
- Upload photos to create personalized cartoon characters
- AI will generate cartoon versions maintaining facial features
- Name your characters and proceed to story generation

### 3. Story Generation
- Watch real-time progress as AI creates your story
- Characters are illustrated in your chosen style
- Story panels are generated with dialogue and narration

### 4. Storybook Viewing
- Navigate through your completed storybook
- View in fullscreen mode
- Share or download your creation

### 5. Animated Cover Video Generation
- Generate dynamic animated videos from your story's cover image
- AI creates contextual animations based on story theme and characters
- Download videos in MP4 format for sharing
- Real-time progress tracking during video creation

## API Integration

The app integrates with multiple AI services:

### Google Gemini API
- **Story Structure Generation**: Creating plot, characters, and panels
- **Character Description**: Generating detailed character profiles
- **Image Generation**: Creating cartoon-style illustrations (placeholder implementation)

### FAL AI (Veo3 Image-to-Video)
- **Cover Video Generation**: Converting static cover images into animated videos
- **Dynamic Animation**: Context-aware animations based on story themes
- **High-Quality Output**: 720p/1080p video generation with audio support

## Customization

### Themes
The comic book theme can be customized in `tailwind.config.ts`:
- Color palette
- Typography
- Shadow effects
- Animations

### Story Styles
Add new story styles in the main page configuration:
- Comic book
- Picture book  
- Fairy tale
- Graphic novel
- Pop-up style

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Story Themes**: Update the themes array in `app/page.tsx`
2. **Custom UI Components**: Add to `components/ui/`
3. **AI Enhancements**: Modify services in `lib/ai-services/`
4. **Styling Changes**: Update `app/globals.css` and Tailwind config

## Video Generation Workflow

The animated cover video feature transforms static story cover images into dynamic, contextual animations using AI.

### How It Works

1. **Story Analysis**: The system analyzes your story's theme, characters, and content
2. **Animation Prompt Generation**: Creates contextual animation prompts based on:
   - Story theme (adventure, fantasy, mystery, etc.)
   - Main characters and their roles
   - Art style and visual elements
3. **Video Processing**: Uses FAL AI's Veo3 model to generate 8-second animated videos
4. **Real-time Updates**: Provides live progress tracking during generation
5. **Download & Share**: Allows users to download MP4 files for sharing

### Video Generation Components

```
components/storybook/
├── cover-video-generator.tsx    # Main video generation UI component
└── storybook-viewer.tsx        # Integrated storybook viewer

lib/ai-services/
├── video-generator.ts          # Core video generation service
└── story-generator.ts          # Story analysis and prompt creation

hooks/
└── use-video-generation.ts     # React hook for video state management

app/api/
└── generate-video/             # API endpoints for video processing
```

### Animation Themes

The system creates different animation styles based on story themes:

- **Adventure**: Heroic poses with wind effects and magical particles
- **Fantasy**: Magical elements with glowing particles and ethereal effects
- **Mystery**: Subtle shadows and mysterious fog effects
- **Friendship**: Warm expressions with floating hearts or butterflies
- **Default**: Natural movements with environmental elements

### Configuration Options

```typescript
interface VideoGenerationOptions {
  duration?: "8s";              // Video length
  resolution?: "720p" | "1080p"; // Output quality
  generateAudio?: boolean;       // Include audio generation
}
```

## Production Considerations

### Image Generation
Current implementation uses placeholder SVGs. For production:
- Integrate with image generation APIs (DALL-E, Midjourney, Stable Diffusion)
- Implement proper image storage and CDN
- Add image optimization and caching

### Video Generation
- FAL AI integration provides production-ready video generation
- Supports high-quality output (720p/1080p)
- Built-in progress tracking and error handling
- Automatic retry mechanisms for failed generations

### Performance
- Implement lazy loading for story panels
- Add request caching for AI calls
- Optimize bundle size with code splitting
- Video generation runs asynchronously to prevent UI blocking

### Security
- Rate limiting for API calls
- Input validation and sanitization
- Proper error handling and logging
- Secure API key management for FAL AI integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Google Gemini AI for story generation
- Radix UI for accessible components
- Tailwind CSS for styling system
- Framer Motion for animations