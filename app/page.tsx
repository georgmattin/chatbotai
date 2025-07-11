"use client"

import { useState, useEffect } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatArea } from "@/components/chat-area"
import { ChatInput } from "@/components/chat-input"
import { ImageGenerator } from "@/components/image-generator"
import { BatchImageGenerator } from "@/components/batch-image-generator"
import { VideoGenerator } from "@/components/video-generator"
import { TextRewriter } from "@/components/text-rewriter"
// Settings now come from .env file
import { Button } from "@/components/ui/button"
import { Menu, Plus } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  type?: 'chat' | 'image' | 'batch' | 'video' | 'rewrite'
}

interface GeneratedImage {
  id: string
  imageUrl: string
  originalUrl: string
  prompt: string
  size: string
  style: string
  quality: string
  timestamp: number
  saveError?: string
}

interface GeneratedVideo {
  id: string
  videoUrl: string
  originalUrl: string
  prompt: string
  aspectRatio: string
  duration: number
  model: string
  temperature: number
  timestamp: number
  mimeType?: string
  operationName?: string
  saveError?: string
}

// Settings are now loaded from .env file on server

export default function ChatApp() {
  const [chats, setChats] = useState<Chat[]>([])

  const [currentChatId, setCurrentChatId] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(false) // Default closed on mobile
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('ai-chat-conversations')
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats)
        console.log('Loaded chats from localStorage:', parsedChats.length, 'conversations')
        // Convert date strings back to Date objects
        const chatsWithDates = parsedChats.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        setChats(chatsWithDates)
        if (chatsWithDates.length > 0) {
          setCurrentChatId(chatsWithDates[0].id)
        }
      } catch (error) {
        console.error('Error loading chats:', error)
        // If error, create initial chat
        createInitialChat()
      }
    } else {
      console.log('No saved chats found, creating initial chat')
      // No saved chats, create initial chat
      createInitialChat()
    }
  }, [])

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      console.log('Saving chats to localStorage:', chats.length, 'conversations')
      localStorage.setItem('ai-chat-conversations', JSON.stringify(chats))
    }
  }, [chats])

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const createInitialChat = () => {
    const initialChat: Chat = {
      id: "1",
      title: "Tere! Kuidas saan aidata?",
      messages: [
        {
          id: "1",
          content: "Tere! Kuidas saan teid aidata?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      type: 'chat',
    }
    setChats([initialChat])
    setCurrentChatId(initialChat.id)
  }

  const currentChat = chats.find((chat) => chat.id === currentChatId) || chats[0]

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Uus vestlus",
      messages: [],
      createdAt: new Date(),
      type: 'chat',
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    if (isMobile) setSidebarOpen(false)
  }

  const createNewImageChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Pildi genereerimine",
      messages: [],
      createdAt: new Date(),
      type: 'image',
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    if (isMobile) setSidebarOpen(false)
  }

  const createNewBatchChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Batch Pildi Genereerimine",
      messages: [],
      createdAt: new Date(),
      type: 'batch',
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    if (isMobile) setSidebarOpen(false)
  }

  const createNewVideoChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Video genereerimine",
      messages: [],
      createdAt: new Date(),
      type: 'video',
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    if (isMobile) setSidebarOpen(false)
  }

  const createNewRewriteChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Teksti ümberkirjutamine",
      messages: [],
      createdAt: new Date(),
      type: 'rewrite',
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    if (isMobile) setSidebarOpen(false)
  }

  const handleImageGenerated = (image: GeneratedImage) => {
    if (!currentChat) return

    // Convert image to message format for display
    const imageMessage: Message = {
      id: image.id,
      content: image.saveError || `![Generated Image](${image.imageUrl})

**Prompt:** ${image.prompt}
**Seaded:** ${image.size}, ${image.style}, ${image.quality}`,
      role: "assistant",
      timestamp: new Date(image.timestamp),
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, imageMessage],
              title: chat.messages.length === 0 ? `Pilt: ${image.prompt.slice(0, 30)}...` : chat.title,
            }
          : chat,
      ),
    )
  }

  const handleVideoGenerated = (video: GeneratedVideo) => {
    if (!currentChat) return

    // Convert video to message format for display
    const videoMessage: Message = {
      id: video.id,
      content: video.saveError || `${video.videoUrl ? `<video controls style="width: 100%; border-radius: 8px;">
  <source src="${video.videoUrl}" type="${video.mimeType || 'video/mp4'}" />
  Your browser does not support the video tag.
</video>` : '❌ Video genereerimine ebaõnnestus'}

**Prompt:** ${video.prompt}
**Seaded:** ${video.aspectRatio}, ${video.duration}s, ${video.model}, Loovus: ${video.temperature}
**Mudel:** Google Veo ${video.model}`,
      role: "assistant",
      timestamp: new Date(video.timestamp),
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, videoMessage],
              title: chat.messages.length === 0 ? `Video: ${video.prompt.slice(0, 30)}...` : chat.title,
            }
          : chat,
      ),
    )
  }

  const handleRewriteGenerated = (originalText: string, rewrittenText: string, stats: any) => {
    if (!currentChat) return

    // Add original text as user message
    const originalMessage: Message = {
      id: Date.now().toString(),
      content: `**Algne tekst (${stats.originalLength} tähemärki):**

${originalText}`,
      role: "user",
      timestamp: new Date(),
    }

    // Add rewritten text as assistant message
    const rewriteMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `**Ümberkirjutatud tekst (${stats.newLength} tähemärki):**

${rewrittenText}

---

**Statistika:**
- Algne pikkus: ${stats.originalLength.toLocaleString()} tähemärki
- Uus pikkus: ${stats.newLength.toLocaleString()} tähemärki
- Erinevus: ${stats.lengthDifference >= 0 ? '+' : ''}${stats.lengthDifference} tähemärki
- Säilitatud: ${(stats.lengthRatio * 100).toFixed(1)}%${stats.chunksProcessed ? `\n- Töödeldud osade arv: ${stats.chunksProcessed}` : ''}${stats.warning ? `\n\n⚠️ ${stats.warning}` : ''}`,
      role: "assistant",
      timestamp: new Date(),
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, originalMessage, rewriteMessage],
              title: chat.messages.length === 0 ? `Ümberkirjutus: ${originalText.slice(0, 30)}...` : chat.title,
            }
          : chat,
      ),
    )
  }

  const sendMessage = async (content: string) => {
    if (!currentChat || !content.trim() || currentChat.type === 'image' || currentChat.type === 'batch' || currentChat.type === 'video' || currentChat.type === 'rewrite') return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    // Update chat with user message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              title: chat.messages.length === 0 ? content.slice(0, 30) + "..." : chat.title,
            }
          : chat,
      ),
    )

    setIsLoading(true)

    try {
      // No need to check settings as they come from .env file on server

      // Prepare messages for API
      const apiMessages = currentChat.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Add the new user message to the API messages
      apiMessages.push({
        role: "user" as const,
        content: content
      })

      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.content,
        role: "assistant",
        timestamp: new Date(),
      }

      setChats((prev) =>
        prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, aiMessage] } : chat)),
      )
    } catch (error) {
      console.error('Error calling API:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ **Viga API kutsel:**

${error instanceof Error ? error.message : String(error)}

**Võimalikud lahendused:**
- Kontrollige .env faili Azure OpenAI seadeid
- Veenduge, et Azure ressurss on aktiivne
- Kontrollige internetiühendust

**Kontrollimiseks .env failis:**
- \`AZURE_OPENAI_KEY\` - teie API võti
- \`AZURE_OPENAI_ENDPOINT\` - täielik endpoint URL
- \`AZURE_OPENAI_DEPLOYMENT\` - mudeli deployment nimi`,
        role: "assistant",
        timestamp: new Date(),
      }

      setChats((prev) =>
        prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat)),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const deleteChat = (chatId: string) => {
    const newChats = chats.filter((chat) => chat.id !== chatId)
    setChats(newChats)
    
    if (currentChatId === chatId) {
      if (newChats.length > 0) {
        setCurrentChatId(newChats[0].id)
      } else {
        // If no chats left, create a new one
        createNewChat()
      }
    }
    
    // Update localStorage
    localStorage.setItem('ai-chat-conversations', JSON.stringify(newChats))
  }

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
    if (isMobile) setSidebarOpen(false)
  }

  const clearAllData = () => {
    localStorage.removeItem('ai-chat-conversations')
    setChats([])
    setCurrentChatId("")
    createInitialChat()
  }

  return (
    <div className="flex h-screen bg-[#0d1117] text-white relative">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} ${
          isMobile ? "fixed left-0 top-0 h-full z-50" : "relative"
        } transition-all duration-300 overflow-hidden border-r border-[#21262d]`}
      >
        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={createNewChat}
          onNewImageChat={createNewImageChat}
          onNewBatchChat={createNewBatchChat}
          onNewVideoChat={createNewVideoChat}
          onNewRewriteChat={createNewRewriteChat}
          onDeleteChat={deleteChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-[#21262d] p-3 md:p-4 flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-[#21262d] text-[#f0f6fc] flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-base md:text-lg text-[#f0f6fc] truncate">
              {currentChat?.title || "AI Vestlusrakendus"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={createNewChat}
              size="sm"
              className="gap-1 md:gap-2 bg-[#10a37f] hover:bg-[#0d8f6b] text-white text-xs md:text-sm px-2 md:px-3"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Uus vestlus</span>
              <span className="sm:hidden">Uus</span>
            </Button>
            <Button
              onClick={createNewImageChat}
              size="sm"
              className="gap-1 md:gap-2 bg-[#6f42c1] hover:bg-[#5a359a] text-white text-xs md:text-sm px-2 md:px-3"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Uus pilt</span>
              <span className="md:hidden">Pilt</span>
            </Button>
            <Button
              onClick={createNewBatchChat}
              size="sm"
              className="gap-1 md:gap-2 bg-[#dc7633] hover:bg-[#c0632a] text-white text-xs md:text-sm px-2 md:px-3"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden lg:inline">Batch</span>
              <span className="lg:hidden">B</span>
            </Button>
            <Button
              onClick={createNewVideoChat}
              size="sm"
              className="gap-1 md:gap-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs md:text-sm px-2 md:px-3"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden lg:inline">Video</span>
              <span className="lg:hidden">V</span>
            </Button>
            <Button
              onClick={createNewRewriteChat}
              size="sm"
              className="gap-1 md:gap-2 bg-[#3498db] hover:bg-[#2980b9] text-white text-xs md:text-sm px-2 md:px-3"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden lg:inline">Rewrite</span>
              <span className="lg:hidden">R</span>
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 min-h-0">
          {currentChat?.type === 'image' ? (
            <ImageGenerator
              images={currentChat?.messages.map(msg => ({
                id: msg.id,
                imageUrl: msg.content.match(/!\[.*?\]\((.*?)\)/)?.[1] || '',
                originalUrl: msg.content.match(/!\[.*?\]\((.*?)\)/)?.[1] || '',
                prompt: msg.content.match(/\*\*Prompt:\*\* (.*?)(?:\n|$)/)?.[1] || '',
                size: msg.content.match(/\*\*Seaded:\*\* ([^,]+)/)?.[1] || '1024x1024',
                style: msg.content.match(/\*\*Seaded:\*\* [^,]+, ([^,]+)/)?.[1] || 'vivid',
                quality: msg.content.match(/\*\*Seaded:\*\* [^,]+, [^,]+, (.+)/)?.[1] || 'hd',
                timestamp: msg.timestamp.getTime(),
                saveError: msg.content.includes('❌') ? msg.content : undefined
              })).filter(img => img.imageUrl || img.saveError) || []}
              onImageGenerated={handleImageGenerated}
              isLoading={isLoading}
            />
          ) : currentChat?.type === 'batch' ? (
            <BatchImageGenerator />
          ) : currentChat?.type === 'video' ? (
            <VideoGenerator
              videos={currentChat?.messages.map(msg => ({
                id: msg.id,
                videoUrl: msg.content.match(/<source src="(.*?)" type=/)?.[1] || '',
                originalUrl: msg.content.match(/<source src="(.*?)" type=/)?.[1] || '',
                prompt: msg.content.match(/\*\*Prompt:\*\* (.*?)(?:\n|$)/)?.[1] || '',
                aspectRatio: msg.content.match(/\*\*Seaded:\*\* ([^,]+)/)?.[1] || '16:9',
                duration: parseInt(msg.content.match(/\*\*Seaded:\*\* [^,]+, (\d+)s/)?.[1] || '8'),
                model: msg.content.match(/\*\*Seaded:\*\* [^,]+, [^,]+, ([^,]+)/)?.[1] || 'veo-3.0',
                temperature: parseFloat(msg.content.match(/Loovus: ([0-9.]+)/)?.[1] || '0.7'),
                timestamp: msg.timestamp.getTime(),
                mimeType: msg.content.match(/type="(.*?)"/)?.[1] || 'video/mp4',
                saveError: msg.content.includes('❌') ? msg.content : undefined
              })).filter(video => video.videoUrl || video.saveError) || []}
              onVideoGenerated={handleVideoGenerated}
              isLoading={isLoading}
            />
          ) : currentChat?.type === 'rewrite' ? (
            <TextRewriter
              onRewriteGenerated={handleRewriteGenerated}
            />
          ) : (
            <ChatArea messages={currentChat?.messages || []} isLoading={isLoading} />
          )}
        </div>

        {/* Input Area */}
        {currentChat?.type === 'chat' && (
          <div className="border-t border-[#21262d] p-3 md:p-4 bg-[#0d1117]">
            <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
          </div>
        )}
      </div>

      {/* Settings Modal */}
              {/* Settings now managed through .env file */}
    </div>
  )
}
