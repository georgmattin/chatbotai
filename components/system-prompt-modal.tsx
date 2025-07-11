"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Settings, Wand2, Save, Trash2, BookOpen } from "lucide-react"

interface SavedPrompt {
  id: string
  name: string
  prompt: string
  createdAt: Date
}

interface SystemPromptModalProps {
  isOpen: boolean
  onClose: () => void
  currentSystemPrompt?: string
  onSave: (systemPrompt: string) => void
  chatTitle: string
}

export function SystemPromptModal({
  isOpen,
  onClose,
  currentSystemPrompt,
  onSave,
  chatTitle,
}: SystemPromptModalProps) {
  const [systemPrompt, setSystemPrompt] = useState(currentSystemPrompt || "")
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [savePromptName, setSavePromptName] = useState("")
  const [showSaveInput, setShowSaveInput] = useState(false)

  // Load saved prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-chat-saved-prompts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const promptsWithDates = parsed.map((prompt: any) => ({
          ...prompt,
          createdAt: new Date(prompt.createdAt)
        }))
        setSavedPrompts(promptsWithDates)
      } catch (error) {
        console.error('Error loading saved prompts:', error)
      }
    }
  }, [isOpen])

  useEffect(() => {
    setSystemPrompt(currentSystemPrompt || "")
  }, [currentSystemPrompt, isOpen])

  const handleSave = () => {
    onSave(systemPrompt)
    onClose()
  }

  const handleClear = () => {
    setSystemPrompt("")
  }

  const saveCurrentPrompt = () => {
    if (!savePromptName.trim() || !systemPrompt.trim()) return
    
    const newPrompt: SavedPrompt = {
      id: Date.now().toString(),
      name: savePromptName.trim(),
      prompt: systemPrompt.trim(),
      createdAt: new Date()
    }
    
    const updatedPrompts = [...savedPrompts, newPrompt]
    setSavedPrompts(updatedPrompts)
    localStorage.setItem('ai-chat-saved-prompts', JSON.stringify(updatedPrompts))
    
    setSavePromptName("")
    setShowSaveInput(false)
  }

  const deleteSavedPrompt = (id: string) => {
    const updatedPrompts = savedPrompts.filter(prompt => prompt.id !== id)
    setSavedPrompts(updatedPrompts)
    localStorage.setItem('ai-chat-saved-prompts', JSON.stringify(updatedPrompts))
  }

  const loadSavedPrompt = (prompt: string) => {
    setSystemPrompt(prompt)
  }

  const predefinedPrompts = [
    {
      name: "Eesti keele õpetaja",
      prompt: "Sa oled abivalmis eesti keele õpetaja. Aita kasutajal õppida eesti keelt, paranda vigu ja selgita grammatikat. Vasta alati eesti keeles ja ole kannatlik ning julgustav."
    },
    {
      name: "Programmeerimise mentor",
      prompt: "Sa oled kogenud programmeerimise mentor. Aita kasutajal lahendada koodimist puudutavaid probleeme, selgita kontseptsioone lihtsalt ja anna praktilisi näiteid. Küsi täpsustavaid küsimusi, kui midagi pole selge."
    },
    {
      name: "Loominguline kirjutaja",
      prompt: "Sa oled loominguline kirjutaja ja jutustaja. Aita kasutajal luua huvitavaid lugusid, parandada tekste ja arendada kirjutamisoskusi. Ole inspireeriv ja paku loovaid ideid."
    },
    {
      name: "Analüütik",
      prompt: "Sa oled täpne ja metodiline analüütik. Lähenede probleemidele süsteemselt, esita faktipõhiseid analüüse ja tee andmetele tuginevaid järeldusi. Ole objektiivne ja põhjalik."
    },
    {
      name: "Sõbralik assistent",
      prompt: "Sa oled sõbralik ja abivalmis virtuaalne assistent. Vasta alati viisakalt, ole positiivne ja püüa aidata kasutajat parimal võimalikul viisil. Näita huvi kasutaja vajaduste vastu."
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#161b22] border-[#21262d] text-[#f0f6fc]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#f0f6fc]">
            <Settings className="h-5 w-5 text-[#10a37f]" />
            Süsteemi juhendid
          </DialogTitle>
          <DialogDescription className="text-[#8b949e]">
            Määrake juhendid AI-le, kuidas ta selles vestluses "{chatTitle}" käituma peaks.
            Need juhendid rakenduvad kogu vestluse jooksul.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system-prompt" className="text-[#f0f6fc]">
              Süsteemi juhendid
            </Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Näiteks: Sa oled abivalmis assistent, kes vastab alati eesti keeles ja on väga viisakas..."
              className="min-h-[120px] bg-[#0d1117] border-[#21262d] text-[#f0f6fc] placeholder:text-[#8b949e] focus:border-[#10a37f] focus:ring-[#10a37f]"
            />
            <p className="text-xs text-[#8b949e]">
              Kirjeldage AI rolli, käitumist ja vastamise stiili. Jätke tühjaks vaikimisi käitumise jaoks.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[#10a37f]" />
              <Label className="text-[#f0f6fc] text-sm font-medium">
                Kiired mallid
              </Label>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
              {predefinedPrompts.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setSystemPrompt(template.prompt)}
                  className="h-auto p-3 text-left border-[#21262d] bg-[#0d1117] hover:bg-[#21262d] hover:border-[#10a37f] text-[#f0f6fc] justify-start"
                >
                  <div>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-[#8b949e] mt-1 truncate max-w-full">
                      {template.prompt.slice(0, 80)}...
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Save Current Prompt */}
          {systemPrompt.trim() && (
            <div className="space-y-3">
              <Separator className="bg-[#21262d]" />
              
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4 text-[#10a37f]" />
                <Label className="text-[#f0f6fc] text-sm font-medium">
                  Salvesta praegune
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveInput(!showSaveInput)}
                  className="ml-auto border-[#21262d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
                >
                  {showSaveInput ? "Tühista" : "Salvesta"}
                </Button>
              </div>

              {showSaveInput && (
                <div className="flex gap-2">
                  <Input
                    value={savePromptName}
                    onChange={(e) => setSavePromptName(e.target.value)}
                    placeholder="Anna malli nimi..."
                    className="bg-[#0d1117] border-[#21262d] text-[#f0f6fc] placeholder:text-[#8b949e]"
                  />
                  <Button
                    onClick={saveCurrentPrompt}
                    disabled={!savePromptName.trim()}
                    size="sm"
                    className="bg-[#10a37f] hover:bg-[#0d8f6b] text-white disabled:bg-[#21262d] disabled:text-[#8b949e]"
                  >
                    Salvesta
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Saved Prompts */}
          {savedPrompts.length > 0 && (
            <div className="space-y-3">
              <Separator className="bg-[#21262d]" />
              
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#10a37f]" />
                <Label className="text-[#f0f6fc] text-sm font-medium">
                  Salvestatud mallid ({savedPrompts.length})
                </Label>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {savedPrompts
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((savedPrompt) => (
                    <div
                      key={savedPrompt.id}
                      className="flex items-center gap-2 p-3 border border-[#21262d] bg-[#0d1117] rounded-md hover:bg-[#21262d] group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[#f0f6fc]">{savedPrompt.name}</div>
                        <div className="text-xs text-[#8b949e] mt-1 truncate">
                          {savedPrompt.prompt.slice(0, 80)}...
                        </div>
                        <div className="text-xs text-[#8b949e] mt-1">
                          {savedPrompt.createdAt.toLocaleDateString('et-EE')}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadSavedPrompt(savedPrompt.prompt)}
                          className="h-8 w-8 p-0 text-[#10a37f] hover:bg-[#21262d]"
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedPrompt(savedPrompt.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:bg-[#21262d] hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            className="border-[#21262d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
          >
            Tühjenda
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#21262d] text-[#f0f6fc] hover:bg-[#21262d]"
          >
            Tühista
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#10a37f] hover:bg-[#0d8f6b] text-white"
          >
            Salvesta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 