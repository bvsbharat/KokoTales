import { NextRequest, NextResponse } from "next/server";
import { videoGenerator } from "@/lib/ai-services/video-generator";

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

    // Get the video result
    const result = await videoGenerator.getVideoResult(requestId);

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      requestId: result.requestId,
    });
  } catch (error: any) {
    console.error("Error getting video result:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get video result" },
      { status: 500 }
    );
  }
}
