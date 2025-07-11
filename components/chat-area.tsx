"use client"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, User, Loader2, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatAreaProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatArea({ messages, isLoading }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      }, 100)
    }
  }, [messages, isLoading])

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[#0d1117]">
        <div className="text-center max-w-md">
          <Bot className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-[#10a37f]" />
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-[#f0f6fc]">Tere tulemast!</h2>
          <p className="text-sm md:text-base text-[#8b949e]">
            Alustage vestlust, kirjutades sõnumi allpool olevasse tekstivälja.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#0d1117] flex flex-col">
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto custom-scrollbar" style={{ height: "100%" }}>
        <div className="p-2 md:p-4">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 md:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-6 w-6 md:h-8 md:w-8 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-[#10a37f] text-white">
                      <Bot className="h-3 w-3 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <Card
                  className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 border-0 relative group ${
                    message.role === "user"
                      ? "bg-[#10a37f] text-white ml-6 md:ml-12"
                      : "bg-[#0a1930] text-white mr-6 md:mr-12"
                  }`}
                >
                  {/* Copy Button - Only for AI messages */}
                  {message.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="absolute top-2 right-2 h-6 w-6 md:h-8 md:w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                    </Button>
                  )}

                  <div className="prose prose-sm max-w-none text-white leading-relaxed text-sm md:text-base">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "")
                          return !inline && match ? (
                            <div className="relative">
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md !bg-[#0d1117] !text-xs md:!text-sm overflow-x-auto"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(String(children), `${message.id}-code-${Math.random()}`)}
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                              >
                                {copiedMessageId === `${message.id}-code-${Math.random()}` ? (
                                  <Check className="h-3 w-3 text-green-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <code className="bg-[#21262d] px-1 py-0.5 rounded text-xs md:text-sm" {...props}>
                              {children}
                            </code>
                          )
                        },
                        ul({ children }) {
                          return (
                            <ul className="list-disc list-inside space-y-1 text-white text-sm md:text-base">
                              {children}
                            </ul>
                          )
                        },
                        ol({ children }) {
                          return (
                            <ol className="list-decimal list-inside space-y-1 text-white text-sm md:text-base">
                              {children}
                            </ol>
                          )
                        },
                        li({ children }) {
                          return <li className="text-white text-sm md:text-base">{children}</li>
                        },
                        p({ children }) {
                          return <p className="text-white mb-2 last:mb-0 text-sm md:text-base">{children}</p>
                        },
                        h1({ children }) {
                          return <h1 className="text-white text-lg md:text-xl font-bold mb-2">{children}</h1>
                        },
                        h2({ children }) {
                          return <h2 className="text-white text-base md:text-lg font-bold mb-2">{children}</h2>
                        },
                        h3({ children }) {
                          return <h3 className="text-white text-sm md:text-base font-bold mb-2">{children}</h3>
                        },
                        strong({ children }) {
                          return <strong className="text-white font-bold">{children}</strong>
                        },
                        em({ children }) {
                          return <em className="text-white italic">{children}</em>
                        },
                        blockquote({ children }) {
                          return (
                            <blockquote className="border-l-4 border-[#10a37f] pl-4 text-white/90 italic text-sm md:text-base">
                              {children}
                            </blockquote>
                          )
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <div
                    className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-white/70" : "text-[#8b949e]"}`}
                  >
                    {message.timestamp.toLocaleTimeString("et-EE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </Card>

                {message.role === "user" && (
                  <Avatar className="h-6 w-6 md:h-8 md:w-8 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-[#21262d] text-[#f0f6fc]">
                      <User className="h-3 w-3 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 md:gap-4 justify-start">
                <Avatar className="h-6 w-6 md:h-8 md:w-8 mt-1 flex-shrink-0">
                  <AvatarFallback className="bg-[#10a37f] text-white">
                    <Bot className="h-3 w-3 md:h-4 md:w-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="max-w-[85%] md:max-w-[80%] p-3 md:p-4 bg-[#0a1930] text-white mr-6 md:mr-12 border-0">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-[#10a37f]" />
                    <span className="text-xs md:text-sm text-[#8b949e]">Mõtlen...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
