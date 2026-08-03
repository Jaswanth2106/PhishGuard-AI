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
If it is an email screenshot, extract the subject and the full body text separately.
Format the output as a clean JSON object with two keys: "subject" and "body".
If you cannot identify a subject, leave it empty.
Do not invent any text. If there is no text, return {"subject": "", "body": ""}.
IMPORTANT: Return ONLY the JSON object, with no markdown code blocks or extra text.`

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

    // Clean up potential markdown formatting from Gemini
    console.log("Raw Gemini Response:", extractedText)
    const cleanJson = extractedText.replace(/```json/g, '').replace(/```/g, '').trim()
    
    let subject = ""
    let body = ""
    try {
      const parsed = JSON.parse(cleanJson)
      subject = parsed.subject || ""
      body = parsed.body || ""
    } catch (e) {
      // Fallback if not valid JSON
      body = extractedText.trim()
    }

    return NextResponse.json({ subject, body, extractedText: body })
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
