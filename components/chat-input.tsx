"use client"

import type React from "react"

import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="relative flex items-end gap-2 p-3 md:p-4 border border-[#21262d] rounded-lg bg-[#161b22]">
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 hover:bg-[#21262d] text-[#8b949e] h-8 w-8 md:h-10 md:w-10"
          disabled={disabled}
        >
          <Paperclip className="h-3 w-3 md:h-4 md:w-4" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Kirjutage oma sõnum siia..."
          className="min-h-[40px] md:min-h-[44px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent text-[#f0f6fc] placeholder:text-[#8b949e] text-sm md:text-base"
          disabled={disabled}
        />

        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="mb-2 bg-[#10a37f] hover:bg-[#0d8f6b] text-white disabled:bg-[#21262d] disabled:text-[#8b949e] h-8 w-8 md:h-10 md:w-10"
        >
          <Send className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>

      <div className="text-xs text-[#8b949e] text-center mt-2">
        <span className="hidden md:inline">Vajutage Enter saatmiseks, Shift+Enter uue rea jaoks</span>
        <span className="md:hidden">Enter - saada, Shift+Enter - uus rida</span>
      </div>
    </div>
  )
}
