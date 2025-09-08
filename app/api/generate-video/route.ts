import { NextRequest, NextResponse } from "next/server";
import { videoGenerator } from "@/lib/ai-services/video-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story, options } = body;

    if (!story) {
      return NextResponse.json(
        { error: "Story data is required" },
        { status: 400 }
      );
    }

    if (!story.coverImage) {
      return NextResponse.json(
        { error: "Story must have a cover image to generate video" },
        { status: 400 }
      );
    }

    // Generate the video using the video generator service
    const result = await videoGenerator.generateCoverVideo(story, options);

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      requestId: result.requestId,
    });
  } catch (error: any) {
    console.error("Error in video generation API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate video" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Check the status of the video generation
    const status = await videoGenerator.checkVideoStatus(requestId);

    return NextResponse.json({
      success: true,
      status: status.status,
      logs: 'logs' in status ? status.logs : [],
    });
  } catch (error: any) {
    console.error("Error checking video status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check video status" },
      { status: 500 }
    );
  }
}
