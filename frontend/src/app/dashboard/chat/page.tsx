/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Send, User, Trash2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("phishguard_chat_history")
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch {
        console.error("Failed to parse chat history")
      }
    } else {
      // Initial greeting
      setMessages([
        {
          id: "init",
          role: "assistant",
          content: "Hello! I am the PhishGuard AI Assistant. How can I help you understand phishing tactics or our detection model today?",
          timestamp: Date.now()
        }
      ])
    }
  }, [])

  // Save to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("phishguard_chat_history", JSON.stringify(messages))
    }
  }, [messages])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleClearHistory = () => {
    const initMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Chat history cleared. How can I help you today?",
      timestamp: Date.now()
    }
    setMessages([initMessage])
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!inputValue.trim() || isLoading) return
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now()
    }

    const newMessages = [...messages, newUserMessage]
    setMessages(newMessages)
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: newMessages })
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "I'm sorry, I couldn't process that request.",
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error(error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I am currently experiencing connection issues. Please try again later.",
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Security Assistant
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Ask questions about phishing, security, and analysis results.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearHistory} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      <div className="flex-1 glass-card rounded-xl border border-border/50 flex flex-col overflow-hidden relative shadow-sm">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center border-2 border-background shadow-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-tr from-blue-600 to-primary text-white"}`}>
                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div 
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}
              >
                <div 
                  className={`px-4 py-3 rounded-2xl ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-muted/50 border border-border/50 rounded-tl-sm text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-primary text-white flex items-center justify-center border-2 border-background shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted/50 border border-border/50 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/50 border-t border-border/50">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 relative max-w-4xl mx-auto"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about phishing, model scores, or security..."
              className="w-full min-h-[52px] max-h-32 resize-none rounded-xl border border-input bg-background/80 px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 scrollbar-thin"
              rows={1}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-1.5 h-10 w-10 rounded-lg transition-all"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">PhishGuard AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </div>
    </div>
  )
}