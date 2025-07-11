"use client"

import { CardContent } from "@/components/ui/card"

import { CardDescription } from "@/components/ui/card"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { Card } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Save, RotateCcw } from "lucide-react"

interface Settings {
  apiKey: string
  apiEndpoint: string
  deployment: string
}

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

export function SettingsModal({ open, onOpenChange, settings, onSettingsChange }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    onSettingsChange(localSettings)
    onOpenChange(false)
  }

  const handleReset = () => {
    const defaultSettings: Settings = {
      apiKey: "",
      apiEndpoint: "",
      deployment: "",
    }
    setLocalSettings(defaultSettings)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl bg-[#161b22] border-[#21262d] text-[#f0f6fc] mx-4">
        <DialogHeader>
          <DialogTitle className="text-[#f0f6fc] text-lg md:text-xl">Seaded</DialogTitle>
        </DialogHeader>

        <Card className="bg-[#0d1117] border-[#21262d]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#f0f6fc] text-base md:text-lg">Azure OpenAI Konfiguratsioon</CardTitle>
            <CardDescription className="text-[#8b949e] text-sm">
              Seadistage oma Azure OpenAI ressursi andmed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-[#f0f6fc] text-sm">
                Azure OpenAI API Võti
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={localSettings.apiKey}
                  onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                  placeholder="Azure portaalist Keys and Endpoint sektsioonis"
                  className="bg-[#21262d] border-[#21262d] text-[#f0f6fc] placeholder:text-[#8b949e] pr-10 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-[#8b949e]"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiEndpoint" className="text-[#f0f6fc] text-sm">
                Azure OpenAI Lõpp-punkt
              </Label>
              <Input
                id="apiEndpoint"
                value={localSettings.apiEndpoint}
                onChange={(e) => setLocalSettings({ ...localSettings, apiEndpoint: e.target.value })}
                placeholder="https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-12-01-preview"
                className="bg-[#21262d] border-[#21262d] text-[#f0f6fc] placeholder:text-[#8b949e] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deployment" className="text-[#f0f6fc] text-sm">
                Deployment Nimi
              </Label>
              <Input
                id="deployment"
                value={localSettings.deployment}
                onChange={(e) => setLocalSettings({ ...localSettings, deployment: e.target.value })}
                placeholder="gpt-35-turbo või gpt-4"
                className="bg-[#21262d] border-[#21262d] text-[#f0f6fc] placeholder:text-[#8b949e] text-sm"
              />
            </div>

            <div className="p-3 bg-[#21262d] rounded-lg">
              <p className="text-[#8b949e] text-xs">
                <strong>Juhised:</strong><br/>
                1. Minge Azure portaali → OpenAI ressurss<br/>
                2. Keys and Endpoint sektsioonis leidke API võti<br/>
                3. Kopeerige täielik endpoint URL koos deployment nimega<br/>
                4. Sisestage deployment nimi (nt. gpt-35-turbo)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 border-[#21262d] text-[#f0f6fc] hover:bg-[#21262d] text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Lähtesta
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#21262d] text-[#f0f6fc] hover:bg-[#21262d] text-sm flex-1 sm:flex-none"
            >
              Tühista
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2 bg-[#10a37f] hover:bg-[#0d8f6b] text-white text-sm flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4" />
              Salvesta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
