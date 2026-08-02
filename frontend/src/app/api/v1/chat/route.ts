import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] }
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
      console.log("GEMINI_API_KEY is MISSING in backend");
      return NextResponse.json({ error: "GEMINI_API_KEY is missing." }, { status: 500 })
    }
    
    console.log("GEMINI_API_KEY is FOUND.");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    // We will use gemini-3.6-flash as the model.
    console.log("Model name: gemini-3.6-flash");
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: "You are the PhishGuard AI Assistant, a helpful cybersecurity expert specializing in phishing detection and email security.",
    })

    // Convert OpenAI message format to Gemini format
    const geminiHistory = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }))

    // Pop the last message to send as the new user prompt
    const userMessage = geminiHistory.pop()
    
    if (!userMessage) {
       return NextResponse.json({ error: "No user message found" }, { status: 400 })
    }

    // Gemini requires history to start with a 'user' message. If it starts with 'model' (e.g. initial greeting), remove it.
    if (geminiHistory.length > 0 && geminiHistory[0].role === "model") {
      geminiHistory.shift();
    }

    const chat = model.startChat({
      history: geminiHistory,
    })

    const result = await chat.sendMessage(userMessage.parts[0].text)
    const responseText = result.response.text()

    return NextResponse.json({ reply: responseText })

  } catch (error: unknown) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process chat request", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
