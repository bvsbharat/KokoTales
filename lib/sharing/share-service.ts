import { GeneratedStory } from "@/lib/types";

export class ShareService {
  async shareStory(story: GeneratedStory) {
    const shareData = {
      title: story.title,
      text: `Check out my personalized storybook: "${story.title}"! Created with MemoryTales.ai AI.`,
      url: window.location.origin
    };

    try {
      // Try native Web Share API first (mobile devices)
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      // Fallback to copying link to clipboard
      await this.copyToClipboard(`${shareData.text} ${shareData.url}`);
      
      // You could also show a share modal here with social media options
      this.showShareModal(story);
      
    } catch (error) {
      console.error('[SHARE_SERVICE] Error sharing:', error);
      throw new Error('Failed to share story');
    }
  }

  private async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  private showShareModal(story: GeneratedStory) {
    // This could open a custom share modal with social media options
    // For now, we'll just show a success message
    const event = new CustomEvent('story-shared', { 
      detail: { story, method: 'clipboard' } 
    });
    window.dispatchEvent(event);
  }

  generateShareText(story: GeneratedStory): string {
    return `🎨 Just created an amazing personalized storybook: "${story.title}"! 

📚 Features ${story.characters.length} custom characters
🎭 ${story.config.theme.charAt(0).toUpperCase() + story.config.theme.slice(1)} theme
📖 ${story.pages.length} pages of AI-generated adventure

Created with MemoryTales.ai - AI-Powered Interactive Storytelling ✨

#MemoryTales #AIStorybook #PersonalizedStories #ChildrensBooks`;
  }

  // Social media specific sharing methods
  shareToTwitter(story: GeneratedStory) {
    const text = encodeURIComponent(this.generateShareText(story));
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  }

  shareToFacebook(story: GeneratedStory) {
    const url = encodeURIComponent(window.location.origin);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(shareUrl, '_blank');
  }

  shareToLinkedIn(story: GeneratedStory) {
    const url = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent(story.title);
    const summary = encodeURIComponent(`Check out my personalized AI-generated storybook!`);
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
    window.open(shareUrl, '_blank');
  }

  async shareViaEmail(story: GeneratedStory) {
    const subject = encodeURIComponent(`Check out my storybook: ${story.title}`);
    const body = encodeURIComponent(`
Hi!

I just created an amazing personalized storybook called "${story.title}" using MemoryTales.ai!

It features ${story.characters.length} custom characters and ${story.pages.length} pages of ${story.config.theme} adventures.

You can create your own at: ${window.location.origin}

Enjoy!
    `);
    
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  }
}

export const shareService = new ShareService();