"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Loader2, Download, Copy, Check, Video as VideoIcon } from "lucide-react"

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

interface VideoGeneratorProps {
  videos: GeneratedVideo[]
  onVideoGenerated: (video: GeneratedVideo) => void
  isLoading?: boolean
}

export function VideoGenerator({ videos, onVideoGenerated, isLoading }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9')
  const [duration, setDuration] = useState([8])
  const [model, setModel] = useState<'veo-2.0' | 'veo-3.0'>('veo-3.0')
  const [temperature, setTemperature] = useState([0.7])
  const [generating, setGenerating] = useState(false)
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return

    setGenerating(true)

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          duration: duration[0],
          model,
          temperature: temperature[0]
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      const generatedVideo: GeneratedVideo = {
        id: Date.now().toString(),
        videoUrl: data.videoUrl,
        originalUrl: data.originalUrl,
        prompt: data.prompt,
        aspectRatio: data.aspectRatio,
        duration: data.duration,
        model: data.model,
        temperature: data.temperature,
        timestamp: data.timestamp,
        mimeType: data.mimeType,
        operationName: data.operationName,
        saveError: data.saveError
      }

      onVideoGenerated(generatedVideo)
      setPrompt("") // Clear prompt after successful generation

    } catch (error) {
      console.error('Error generating video:', error)
      // Create error "video" to show in chat
      const errorVideo: GeneratedVideo = {
        id: Date.now().toString(),
        videoUrl: "",
        originalUrl: "",
        prompt: prompt.trim(),
        aspectRatio,
        duration: duration[0],
        model,
        temperature: temperature[0],
        timestamp: Date.now(),
        saveError: `❌ **Viga video genereerimisel:**

${error instanceof Error ? error.message : String(error)}

**Võimalikud lahendused:**
- Kontrollige .env faili Google Cloud seadeid
- Veenduge, et Vertex AI API on lubatud
- Kontrollige Google Cloud Service Account õigusi
- Kontrollige internetiühendust

**Vajalikud Google Cloud seaded:**
- GOOGLE_CLOUD_PROJECT_ID
- GOOGLE_CLOUD_LOCATION
- GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY (Base64 encoded JSON key)`
      }
      onVideoGenerated(errorVideo)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, videoId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedVideoId(videoId)
      setTimeout(() => setCopiedVideoId(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const downloadVideo = async (videoUrl: string, prompt: string) => {
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `generated-video-${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading video:', error)
    }
  }

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[#0d1117]">
        <div className="text-center max-w-md">
          <VideoIcon className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-[#10a37f]" />
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-[#f0f6fc]">Video Genereerimine</h2>
          <p className="text-sm md:text-base text-[#8b949e] mb-6">
            Kirjeldage video, mida soovite genereerida Google Veo abil, valige seaded ja vajutage "Genereeri".
          </p>
          
          {/* Generation Form */}
          <Card className="bg-[#0a1930] border-[#21262d] p-6 text-left">
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-[#f0f6fc] mb-2 block">
                  Video kirjeldus
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Kirjeldage detailselt, millist videot soovite genereerida..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-[#21262d] border-[#30363d] text-[#f0f6fc] placeholder-[#8b949e] min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aspectRatio" className="text-[#f0f6fc] mb-2 block">
                    Kuvasuhe
                  </Label>
                  <Select value={aspectRatio} onValueChange={(value: '16:9' | '9:16') => setAspectRatio(value)}>
                    <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#21262d] border-[#30363d]">
                      <SelectItem value="16:9" className="text-[#f0f6fc]">Horisontaal (16:9)</SelectItem>
                      <SelectItem value="9:16" className="text-[#f0f6fc]">Vertikaalne (9:16)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="model" className="text-[#f0f6fc] mb-2 block">
                    Mudel
                  </Label>
                  <Select value={model} onValueChange={(value: 'veo-2.0' | 'veo-3.0') => setModel(value)}>
                    <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#21262d] border-[#30363d]">
                      <SelectItem value="veo-3.0" className="text-[#f0f6fc]">Veo 3.0 (Preview, Audio)</SelectItem>
                      <SelectItem value="veo-2.0" className="text-[#f0f6fc]">Veo 2.0 (GA, Video ainult)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-[#f0f6fc] mb-2 block">
                    Kestus: {duration[0]} sekundit
                  </Label>
                  <Slider
                    id="duration"
                    min={model === 'veo-3.0' ? 8 : 5}
                    max={8}
                    step={1}
                    value={duration}
                    onValueChange={setDuration}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[#8b949e] mt-1">
                    <span>{model === 'veo-3.0' ? '8s' : '5s'}</span>
                    <span>8s</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="temperature" className="text-[#f0f6fc] mb-2 block">
                    Loovus: {temperature[0]}
                  </Label>
                  <Slider
                    id="temperature"
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    value={temperature}
                    onValueChange={setTemperature}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[#8b949e] mt-1">
                    <span>0.1 (vähem loov)</span>
                    <span>1.0 (rohkem loov)</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="w-full bg-[#10a37f] hover:bg-[#0d8f6b] text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Video genereerimine... (võib võtta kuni 5 minutit)
                  </>
                ) : (
                  <>
                    <VideoIcon className="h-4 w-4 mr-2" />
                    Genereeri Video
                  </>
                )}
              </Button>

              {generating && (
                <div className="text-xs text-[#8b949e] text-center space-y-1">
                  <p>⏳ Video genereerimine Google Veo abil...</p>
                  <p>🔄 Operatsioon töötab taustal ja võib võtta 2-5 minutit</p>
                  <p>📱 Saate jätkata teisi toiminguid</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#0d1117] flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Generation Form (Always visible when there are videos) */}
          <Card className="bg-[#0a1930] border-[#21262d] p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-[#f0f6fc] mb-2 block">
                  Video kirjeldus
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Kirjeldage detailselt, millist videot soovite genereerida..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-[#21262d] border-[#30363d] text-[#f0f6fc] placeholder-[#8b949e] min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-[#f0f6fc] mb-2 block">Kuvasuhe</Label>
                  <Select value={aspectRatio} onValueChange={(value: '16:9' | '9:16') => setAspectRatio(value)}>
                    <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#21262d] border-[#30363d]">
                      <SelectItem value="16:9" className="text-[#f0f6fc]">16:9</SelectItem>
                      <SelectItem value="9:16" className="text-[#f0f6fc]">9:16</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#f0f6fc] mb-2 block">Mudel</Label>
                  <Select value={model} onValueChange={(value: 'veo-2.0' | 'veo-3.0') => setModel(value)}>
                    <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#21262d] border-[#30363d]">
                      <SelectItem value="veo-3.0" className="text-[#f0f6fc]">Veo 3.0</SelectItem>
                      <SelectItem value="veo-2.0" className="text-[#f0f6fc]">Veo 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#f0f6fc] mb-2 block">Kestus: {duration[0]}s</Label>
                  <Slider
                    min={model === 'veo-3.0' ? 8 : 5}
                    max={8}
                    step={1}
                    value={duration}
                    onValueChange={setDuration}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-[#f0f6fc] mb-2 block">Loovus: {temperature[0]}</Label>
                  <Slider
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    value={temperature}
                    onValueChange={setTemperature}
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="w-full bg-[#10a37f] hover:bg-[#0d8f6b] text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Video genereerimine...
                  </>
                ) : (
                  <>
                    <VideoIcon className="h-4 w-4 mr-2" />
                    Genereeri Video
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Generated Videos */}
          {videos.map((video) => (
            <Card key={video.id} className="bg-[#0a1930] border-[#21262d] p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-[#f0f6fc] font-medium mb-1">Genereeritud Video</h3>
                    <p className="text-sm text-[#8b949e]">
                      {new Date(video.timestamp).toLocaleString("et-EE")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(video.prompt, video.id)}
                      className="h-8 w-8 hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                    >
                      {copiedVideoId === video.id ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {video.videoUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadVideo(video.videoUrl, video.prompt)}
                        className="h-8 w-8 hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {video.videoUrl && !video.saveError ? (
                  <div className="relative">
                    <video
                      className="w-full rounded-lg"
                      controls
                      poster="/placeholder.jpg"
                    >
                      <source src={video.videoUrl} type={video.mimeType || "video/mp4"} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : video.saveError ? (
                  <div className="bg-[#21262d] border border-[#f85149] rounded-lg p-4">
                    <div className="prose prose-sm max-w-none text-white leading-relaxed text-sm">
                      {video.saveError.split('\n').map((line, index) => (
                        <p key={index} className="text-[#f0f6fc] mb-2 last:mb-0">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#21262d] rounded-lg p-4 text-center">
                    <VideoIcon className="h-12 w-12 mx-auto mb-2 text-[#8b949e]" />
                    <p className="text-[#8b949e]">Video genereerimine ebaõnnestus</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <Label className="text-[#8b949e] text-xs">PROMPT:</Label>
                    <p className="text-[#f0f6fc] text-sm mt-1">{video.prompt}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <Label className="text-[#8b949e]">Kuvasuhe:</Label>
                      <p className="text-[#f0f6fc]">{video.aspectRatio}</p>
                    </div>
                    <div>
                      <Label className="text-[#8b949e]">Kestus:</Label>
                      <p className="text-[#f0f6fc]">{video.duration}s</p>
                    </div>
                    <div>
                      <Label className="text-[#8b949e]">Mudel:</Label>
                      <p className="text-[#f0f6fc]">{video.model}</p>
                    </div>
                    <div>
                      <Label className="text-[#8b949e]">Loovus:</Label>
                      <p className="text-[#f0f6fc]">{video.temperature}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 