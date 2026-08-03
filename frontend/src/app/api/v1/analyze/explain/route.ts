import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    const { subject, body, prediction, confidence_score, top_signals } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    // We can use gemini-1.5-flash for speed
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are an expert cybersecurity AI. Your job is to analyze emails and explain phishing risks in a structured JSON format."
    })

    const prompt = `
    Analyze this email based on the ML engine's prediction.

    Email Subject: ${subject}
    Email Body: ${body}

    ML Engine Prediction: ${prediction} (Score: ${confidence_score})
    ML Top Signals: ${top_signals?.join(", ") || "None"}

    Provide a highly detailed explanation of WHY this email was flagged (or not flagged).
    Identify specific social engineering tactics, urgency markers, suspicious links, and provide a recommended action.

    Return EXACTLY a JSON object with the following schema, and no markdown formatting:
    {
      "riskLevel": "Low" | "Medium" | "High" | "Critical",
      "reasons": ["string"],
      "suspiciousLinks": ["string"],
      "socialEngineering": ["string"],
      "recommendedAction": "string"
    }
    `

    const maxRetries = 3;
    let text = "";
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        text = response.text()
        break; // Success
      } catch (error: unknown) {
        const err = error as { message?: string, status?: number };
        const isRateLimitOrUnavailable = err?.message?.includes("429") || err?.message?.includes("503") || err?.status === 429 || err?.status === 503;
        
        if (isRateLimitOrUnavailable && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`[Gemini API Explain] Rate limited or unavailable (429/503). Retrying in ${waitTime}ms (Attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(res => setTimeout(res, waitTime));
          continue;
        }
        throw error;
      }
    }
    
    // Clean up potential markdown formatting from Gemini
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const explanation = JSON.parse(cleanJson)

    return NextResponse.json(explanation)
  } catch (error: unknown) {
    const err = error as { message?: string, status?: number };
    console.error("Gemini Explain Error:", err?.message || error)
    
    const isRateLimitOrUnavailable = err?.message?.includes("429") || err?.message?.includes("503") || err?.status === 429 || err?.status === 503;
    
    if (isRateLimitOrUnavailable) {
       return NextResponse.json(
         { error: "Gemini AI is temporarily unavailable due to high demand. Please try again in a few minutes." },
         { status: 503 }
       )
    }

    return NextResponse.json(
      { error: "Failed to generate AI explanation" },
      { status: 500 }
    )
  }
}
