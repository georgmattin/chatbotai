"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MessageSquare, MoreHorizontal, Trash2, Edit, Image, MessageCircle, Upload, Video, FileText } from "lucide-react"

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

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onNewImageChat: () => void
  onNewBatchChat: () => void
  onNewVideoChat: () => void
  onNewRewriteChat: () => void
  onDeleteChat: (chatId: string) => void
}

export function ChatSidebar({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onNewImageChat,
  onNewBatchChat,
  onNewVideoChat,
  onNewRewriteChat,
  onDeleteChat,
}: ChatSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="p-4 border-b border-[#21262d] space-y-2">
        <Button
          onClick={onNewChat}
          className="w-full gap-2 bg-[#10a37f] hover:bg-[#0d8f6b] text-white border-[#10a37f]"
        >
          <MessageCircle className="h-4 w-4" />
          Uus vestlus
        </Button>
        <Button
          onClick={onNewImageChat}
          className="w-full gap-2 bg-[#6f42c1] hover:bg-[#5a359a] text-white border-[#6f42c1]"
        >
          <Image className="h-4 w-4" />
          Pildi genereerimine
        </Button>
        <Button
          onClick={onNewBatchChat}
          className="w-full gap-2 bg-[#dc7633] hover:bg-[#c0632a] text-white border-[#dc7633]"
        >
          <Upload className="h-4 w-4" />
          Batch genereerimine
        </Button>
        <Button
          onClick={onNewVideoChat}
          className="w-full gap-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white border-[#e74c3c]"
        >
          <Video className="h-4 w-4" />
          Video genereerimine
        </Button>
        <Button
          onClick={onNewRewriteChat}
          className="w-full gap-2 bg-[#3498db] hover:bg-[#2980b9] text-white border-[#3498db]"
        >
          <FileText className="h-4 w-4" />
          Teksti ümberkirjutamine
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 p-2 custom-scrollbar">
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative rounded-lg p-3 cursor-pointer transition-colors hover:bg-[#21262d] ${
                currentChatId === chat.id ? "bg-[#21262d]" : ""
              }`}
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="flex items-start gap-3">
                {chat.type === 'image' ? (
                  <Image className="h-4 w-4 mt-0.5 text-[#6f42c1]" />
                ) : chat.type === 'batch' ? (
                  <Upload className="h-4 w-4 mt-0.5 text-[#dc7633]" />
                ) : chat.type === 'video' ? (
                  <Video className="h-4 w-4 mt-0.5 text-[#e74c3c]" />
                ) : chat.type === 'rewrite' ? (
                  <FileText className="h-4 w-4 mt-0.5 text-[#3498db]" />
                ) : (
                  <MessageSquare className="h-4 w-4 mt-0.5 text-[#8b949e]" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-[#f0f6fc]">{chat.title}</p>
                  <p className="text-xs text-[#8b949e]">
                    {chat.type === 'image' 
                      ? `${chat.messages.length} pilti` 
                      : chat.type === 'batch' 
                      ? 'Batch töötlus'
                      : chat.type === 'video'
                      ? `${chat.messages.length} videot`
                      : chat.type === 'rewrite'
                      ? 'Teksti ümberkirjutamine'
                      : `${chat.messages.length} sõnumit`}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#161b22] text-[#8b949e]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#161b22] border-[#21262d]">
                    <DropdownMenuItem className="text-[#f0f6fc] hover:bg-[#21262d]">
                      <Edit className="h-4 w-4 mr-2" />
                      Nimeta ümber
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-[#f85149] hover:bg-[#21262d]"
                      onClick={() => onDeleteChat(chat.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Kustuta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-[#21262d]">
        <div className="text-xs text-[#8b949e] text-center">
          AI Vestlusrakendus v1.0
          <br />
          <span className="text-[#6b7280]">Seaded: .env fail</span>
        </div>
      </div>
    </div>
  )
}
