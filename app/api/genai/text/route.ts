import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    // NOTE: The SDK returns an object with a .text property for the content
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.0-flash-001',
      contents: prompt,
    })

    return NextResponse.json({ text: response.text })
  } catch (err: any) {
    console.error('[API][GENAI][TEXT] Error:', err)

    // Normalize transient errors with 503 to encourage client retries
    const message = err?.message || 'Unknown server error'
    const status = /unavailable|ECONNRESET|ENOTFOUND|TLS|certificate/i.test(message)
      ? 503
      : 500

    return NextResponse.json({ error: message }, { status })
  }
}
