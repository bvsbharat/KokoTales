// Legacy component - redirects to BookViewer
import BookViewer from "./book-viewer";
import { GeneratedStory } from "@/lib/types";

interface StorybookViewerProps {
  story: GeneratedStory;
  onHome: () => void;
  onRegenerate?: () => void;
}

export default function StorybookViewer(props: StorybookViewerProps) {
  return <BookViewer {...props} />;
}