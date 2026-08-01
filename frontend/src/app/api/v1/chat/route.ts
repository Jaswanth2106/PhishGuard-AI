import { NextResponse } from "next/server"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] }
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    const userText = lastMessage.content.toLowerCase()

    let reply = "I'm the PhishGuard AI Assistant. I can help you understand phishing tactics or explain our analysis results."

    // Predefined responses based on keywords
    if (userText.includes("phishing") && userText.includes("what")) {
      reply = "Phishing is a cybercrime in which a target is contacted by email, telephone or text message by someone posing as a legitimate institution to lure individuals into providing sensitive data such as personally identifiable information, banking and credit card details, and passwords."
    } else if (userText.includes("how does") || userText.includes("model") || userText.includes("svm")) {
      reply = "PhishGuard uses a Linear Support Vector Machine (SVM) trained on thousands of legitimate and phishing emails. It analyzes the text using TF-IDF (Term Frequency-Inverse Document Frequency) to identify words and character patterns highly correlated with spam or malicious intent."
    } else if (userText.includes("score") || userText.includes("confidence")) {
      reply = "The confidence score is a normalized probability between 0% and 100%. A score above 50% generally leans towards phishing, while a score closer to 100% means the model is highly certain the email is malicious based on the presence of strong signals like urgency keywords or suspicious URLs."
    } else if (userText.includes("hello") || userText.includes("hi") || userText.includes("hey")) {
      reply = "Hello! How can I help you secure your inbox today?"
    } else if (userText.includes("help")) {
      reply = "I can explain what phishing is, how our detection model works, or how to interpret the confidence scores. Try asking: 'How does the model work?'"
    }

    // Simulate network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 800))

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
