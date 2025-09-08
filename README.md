# MemoryTales.ai 📚✨

An AI-powered interactive storytelling application that creates personalized illustrated storybooks with magical AI characters.

Live demo link : https://koko-tales.vercel.app/

## Features

🎨 **Comic Book Style UI** - Vibrant neo-brutalist design with comic book aesthetics
🤖 **AI Story Generation** - Powered by Google Gemini for creative storytelling
👥 **Character Personalization** - Upload photos to create personalized cartoon characters
📖 **Multiple Story Formats** - Comic books, picture books, fairy tales, graphic novels
🎭 **Interactive Character Selection** - 4-card swipe interface for character management
📱 **Responsive Design** - Optimized for mobile and desktop experiences
💫 **Real-time Generation** - Live progress tracking during story creation

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom comic book theme
- **AI Integration**: Google Gemini API
- **Animation**: Framer Motion
- **UI Components**: Radix UI primitives
- **File Upload**: React Dropzone

## Getting Started

### Prerequisites

- Node.js 18+ 
- Google Gemini API key

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
   
   Add your Google Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
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

## API Integration

The app integrates with Google Gemini API for:
- **Story Structure Generation**: Creating plot, characters, and panels
- **Character Description**: Generating detailed character profiles
- **Image Generation**: Creating cartoon-style illustrations (placeholder implementation)

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

## Production Considerations

### Image Generation
Current implementation uses placeholder SVGs. For production:
- Integrate with image generation APIs (DALL-E, Midjourney, Stable Diffusion)
- Implement proper image storage and CDN
- Add image optimization and caching

### Performance
- Implement lazy loading for story panels
- Add request caching for AI calls
- Optimize bundle size with code splitting

### Security
- Rate limiting for API calls
- Input validation and sanitization
- Proper error handling and logging

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