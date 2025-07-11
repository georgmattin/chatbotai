"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Settings2, RotateCcw, HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ChatSettings {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  pastMessagesLimit?: number
}

interface ChatSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentSettings?: ChatSettings
  onSave: (settings: ChatSettings) => void
  chatTitle: string
}

const defaultSettings: ChatSettings = {
  temperature: 0.7,
  maxTokens: 800,
  topP: 0.95,
  frequencyPenalty: 0,
  presencePenalty: 0,
  stopSequences: [],
  pastMessagesLimit: 20
}

export function ChatSettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  chatTitle,
}: ChatSettingsModalProps) {
  const [settings, setSettings] = useState<ChatSettings>({
    ...defaultSettings,
    ...currentSettings,
  })
  const [stopSequencesText, setStopSequencesText] = useState("")

  useEffect(() => {
    const merged = { ...defaultSettings, ...currentSettings }
    setSettings(merged)
    setStopSequencesText(merged.stopSequences?.join('\n') || "")
  }, [currentSettings, isOpen])

  const handleSave = () => {
    const stopSequences = stopSequencesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 4) // Max 4 stop sequences

    onSave({
      ...settings,
      stopSequences: stopSequences.length > 0 ? stopSequences : undefined,
    })
    onClose()
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setStopSequencesText("")
  }

  const updateSetting = (key: keyof ChatSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto bg-[#161b22] border-[#21262d] text-[#f0f6fc]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#f0f6fc]">
              <Settings2 className="h-5 w-5 text-[#10a37f]" />
              API Sätted - {chatTitle}
            </DialogTitle>
            <DialogDescription className="text-[#8b949e]">
              Muutke AI käitumist selle vestluse jaoks. Need sätted rakenduvad ainult selles vestluses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-[#f0f6fc] font-medium">Temperature</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-[#8b949e]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Kontrollib loovust. 0 = konservatiivsem, 1 = loovam</p>
                  </TooltipContent>
                </Tooltip>
                <div className="ml-auto">
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature || 0.7}
                    onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                    className="w-20 h-8 bg-[#0d1117] border-[#21262d] text-[#f0f6fc]"
                  />
                </div>
              </div>
              <Slider
                value={[settings.temperature || 0.7]}
                onValueChange={([value]) => updateSetting('temperature', value)}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <Separator className="bg-[#21262d]" />

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-[#f0f6fc] font-medium">Max Response</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-[#8b949e]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maksimaalse vastuse pikkus (tokenites)</p>
                  </TooltipContent>
                </Tooltip>
                <div className="ml-auto">
                  <Input
                    type="number"
                    min="1"
                    max="16384"
                    value={settings.maxTokens || 800}
                    onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                    className="w-20 h-8 bg-[#0d1117] border-[#21262d] text-[#f0f6fc]"
                  />
                </div>
              </div>
              <Slider
                value={[settings.maxTokens || 800]}
                onValueChange={([value]) => updateSetting('maxTokens', value)}
                max={16384}
                min={1}
                step={50}
                className="w-full"
              />
            </div>

            <Separator className="bg-[#21262d]" />

            {/* Top P */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-[#f0f6fc] font-medium">Top P</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-[#8b949e]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Kumulatiivne tõenäosuse künnis sõnade valimiseks</p>
                  </TooltipContent>
                </Tooltip>
                <div className="ml-auto">
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.topP || 0.95}
                    onChange={(e) => updateSetting('topP', parseFloat(e.target.value))}
                    className="w-20 h-8 bg-[#0d1117] border-[#21262d] text-[#f0f6fc]"
                  />
                </div>
              </div>
              <Slider
                value={[settings.topP || 0.95]}
                onValueChange={([value]) => updateSetting('topP', value)}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>

            <Separator className="bg-[#21262d]" />

            {/* Frequency Penalty */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-[#f0f6fc] font-medium">Frequency Penalty</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-[#8b949e]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vähendab korduvate sõnade kasutamist</p>
                  </TooltipContent>
                </Tooltip>
                <div className="ml-auto">
                  <Input
                    type="number"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={settings.frequencyPenalty || 0}
                    onChange={(e) => updateSetting('frequencyPenalty', parseFloat(e.target.value))}
                    className="w-20 h-8 bg-[#0d1117] border-[#21262d] text-[#f0f6fc]"
                  />
                </div>
              </div>
              <Slider
                value={[settings.frequencyPenalty || 0]}
                onValueChange={([value]) => updateSetting('frequencyPenalty', value)}
                max={2}
                min={-2}
                step={0.1}
                className="w-full"
              />
            </div>

            <Separator className="bg-[#21262d]" />

            {/* Presence Penalty */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-[#f0f6fc] font-medium">Presence Penalty</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-[#8b949e]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Soodustab uute teemade kasutamist</p>
                  </TooltipContent>
                </Tooltip>
                <div className="ml-auto">
                  <Input
                    type="number"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={settings.presencePenalty || 0}
                    onChange={(e) => updateSetting('presencePenalty', parseFloat(e.target.value))}
                    className="w-20 h-8 bg-[#0d1117] border-[#21262d] text-[#f0f6fc]"
                  />
                </div>
              </div>
              <Slider
                value={[settings.presencePenalty || 0]}
                onValueChange={([value]) => updateSetting('presencePenalty', value)}
                max={2}
                min={-2}
                step={0.1}
                className="w-full"
              />
            </div>

            <Separator className="bg-[#21262d]" />

            {/* Past Messages Limit */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-[#f0f6fc] font-medium">Past Messages Included</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-[#8b949e]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mitu viimast sõnumit ajaloo kontekstis kaasatakse</p>
                  </TooltipContent>
                </Tooltip>
                <div className="ml-auto">
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.pastMessagesLimit || 20}
                    onChange={(e) => updateSetting('pastMessagesLimit', parseInt(e.target.value))}
                    className="w-20 h-8 bg-[#0d1117] border-[#21262d] text-[#f0f6fc]"
                  />
                </div>
              </div>
              <Slider
                value={[settings.pastMessagesLimit || 20]}
                onValueChange={([value]) => updateSetting('pastMessagesLimit', value)}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <Separator className="bg-[#21262d]" />

            {/* Stop Sequences */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-[#f0f6fc] font-medium">Stop Sequence</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-[#8b949e]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tekstid, mille kohtamisel AI vastamise peatab (maksimaalselt 4, iga real üks)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                value={stopSequencesText}
                onChange={(e) => setStopSequencesText(e.target.value)}
                placeholder="Näiteks:&#10;STOP&#10;###&#10;[END]"
                className="min-h-[80px] bg-[#0d1117] border-[#21262d] text-[#f0f6fc] placeholder:text-[#8b949e]"
              />
              <p className="text-xs text-[#8b949e]">
                Sisestage iga stop sequence eraldi reale. Maksimaalselt 4 erinevat.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 border-[#21262d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
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
    </TooltipProvider>
  )
} 