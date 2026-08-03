import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" })

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString("base64")

    const prompt = `You are a highly accurate OCR system for cybersecurity. 
Please extract the exact text from this image. 
If it is an email screenshot, extract the subject, sender, and the full body text.
Format the output cleanly so it can be passed into a spam detection engine.
Do not invent any text. If there is no text, reply with "No text found."`

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type
      }
    }

    const maxRetries = 3;
    let extractedText = "";
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent([prompt, imagePart])
        const response = await result.response
        extractedText = response.text()
        break; // Success, break the loop
      } catch (error: unknown) {
        const err = error as { message?: string, status?: number };
        const isRateLimitOrUnavailable = err?.message?.includes("429") || err?.message?.includes("503") || err?.status === 429 || err?.status === 503;
        
        if (isRateLimitOrUnavailable && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`[Gemini API] Rate limited or unavailable (429/503). Retrying in ${waitTime}ms (Attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(res => setTimeout(res, waitTime));
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json({ extractedText: extractedText.trim() })
  } catch (error: unknown) {
    const err = error as { message?: string, status?: number };
    console.error("Gemini Vision OCR Error:", err?.message || error)
    
    const isRateLimitOrUnavailable = err?.message?.includes("429") || err?.message?.includes("503") || err?.status === 429 || err?.status === 503;
    
    if (isRateLimitOrUnavailable) {
       return NextResponse.json(
         { error: "Gemini Vision is temporarily unavailable due to high demand. Please try again in a few minutes." },
         { status: 503 }
       )
    }

    return NextResponse.json(
      { error: "Failed to process image. Please try again." },
      { status: 500 }
    )
  }
}
