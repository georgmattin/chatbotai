"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Download, Copy, Check, Image as ImageIcon } from "lucide-react"

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

interface ImageGeneratorProps {
  images: GeneratedImage[]
  onImageGenerated: (image: GeneratedImage) => void
  isLoading?: boolean
}

export function ImageGenerator({ images, onImageGenerated, isLoading }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024')
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid')
  const [quality, setQuality] = useState<'standard' | 'hd'>('hd')
  const [generating, setGenerating] = useState(false)
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return

    setGenerating(true)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          style,
          quality
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      const generatedImage: GeneratedImage = {
        id: Date.now().toString(),
        imageUrl: data.imageUrl,
        originalUrl: data.originalUrl,
        prompt: data.prompt,
        size: data.size,
        style: data.style,
        quality: data.quality,
        timestamp: data.timestamp,
        saveError: data.saveError
      }

      onImageGenerated(generatedImage)
      setPrompt("") // Clear prompt after successful generation

    } catch (error) {
      console.error('Error generating image:', error)
      // Create error "image" to show in chat
      const errorImage: GeneratedImage = {
        id: Date.now().toString(),
        imageUrl: "",
        originalUrl: "",
        prompt: prompt.trim(),
        size,
        style,
        quality,
        timestamp: Date.now(),
        saveError: `❌ **Viga pildi genereerimisel:**

${error instanceof Error ? error.message : String(error)}

**Võimalikud lahendused:**
- Kontrollige .env faili Azure OpenAI seadeid
- Veenduge, et DALL-E 3 ressurss on aktiivne
- Kontrollige internetiühendust`
      }
      onImageGenerated(errorImage)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, imageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedImageId(imageId)
      setTimeout(() => setCopiedImageId(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  if (images.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[#0d1117]">
        <div className="text-center max-w-md">
          <ImageIcon className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-[#10a37f]" />
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-[#f0f6fc]">Pildi Genereerimine</h2>
          <p className="text-sm md:text-base text-[#8b949e] mb-6">
            Kirjeldage pilt, mida soovite genereerida, valige seaded ja vajutage "Genereeri".
          </p>
          
          {/* Generation Form */}
          <Card className="bg-[#0a1930] border-[#21262d] p-6 text-left">
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-[#f0f6fc] mb-2 block">
                  Pildi kirjeldus
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Kirjeldage detailselt, millist pilti soovite genereerida..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-[#21262d] border-[#30363d] text-[#f0f6fc] placeholder-[#8b949e] min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="size" className="text-[#f0f6fc] mb-2 block">
                    Kuvasuhe / Resolutsioon
                  </Label>
                  <Select value={size} onValueChange={(value: '1024x1024' | '1792x1024' | '1024x1792') => setSize(value)}>
                    <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#21262d] border-[#30363d]">
                      <SelectItem value="1024x1024" className="text-[#f0f6fc]">Ruut (1024×1024)</SelectItem>
                      <SelectItem value="1792x1024" className="text-[#f0f6fc]">Horisontaal (1792×1024)</SelectItem>
                      <SelectItem value="1024x1792" className="text-[#f0f6fc]">Vertikaalne (1024×1792)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="style" className="text-[#f0f6fc] mb-2 block">
                    Stiil
                  </Label>
                  <Select value={style} onValueChange={(value: 'vivid' | 'natural') => setStyle(value)}>
                    <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#21262d] border-[#30363d]">
                      <SelectItem value="vivid" className="text-[#f0f6fc]">Vivid (erksamad värvid)</SelectItem>
                      <SelectItem value="natural" className="text-[#f0f6fc]">Natural (loomulikumad värvid)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quality" className="text-[#f0f6fc] mb-2 block">
                    Kvaliteet
                  </Label>
                  <Select value={quality} onValueChange={(value: 'standard' | 'hd') => setQuality(value)}>
                    <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#21262d] border-[#30363d]">
                      <SelectItem value="standard" className="text-[#f0f6fc]">Standard</SelectItem>
                      <SelectItem value="hd" className="text-[#f0f6fc]">HD (kõrgem kvaliteet)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="w-full bg-[#10a37f] hover:bg-[#0d8f6b] text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Genereerin...
                  </>
                ) : (
                  "Genereeri Pilt"
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#0d1117] flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2 md:p-4">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {images.map((image) => (
              <div key={image.id} className="flex justify-center">
                <Card className="max-w-[90%] md:max-w-[80%] p-4 md:p-6 bg-[#0a1930] border-[#21262d] relative group">
                  {image.saveError && !image.imageUrl ? (
                    // Error display
                    <div className="text-[#f85149] text-sm md:text-base">
                      <pre className="whitespace-pre-wrap font-sans">{image.saveError}</pre>
                    </div>
                  ) : (
                    <>
                      {/* Image */}
                      <div className="mb-4">
                        <img
                          src={image.imageUrl}
                          alt={image.prompt}
                          className="w-full h-auto rounded-lg shadow-lg"
                          loading="lazy"
                        />
                      </div>

                      {/* Image Actions */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(image.prompt, image.id)}
                          className="hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                        >
                          {copiedImageId === image.id ? (
                            <Check className="h-4 w-4 mr-2 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Kopeeri prompt
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadImage(image.imageUrl, image.prompt)}
                          className="hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Laadi alla
                        </Button>
                      </div>

                      {/* Image Details */}
                      <div className="space-y-2 text-sm text-[#8b949e]">
                        <div>
                          <strong className="text-[#f0f6fc]">Prompt:</strong> {image.prompt}
                          {image.prompt.includes('(REVISED:') && (
                            <span className="ml-2 px-2 py-0.5 bg-[#6f42c1] text-white text-xs rounded">
                              MUUDETUD
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4">
                          <span><strong className="text-[#f0f6fc]">Suurus:</strong> {image.size}</span>
                          <span><strong className="text-[#f0f6fc]">Stiil:</strong> {image.style}</span>
                          <span><strong className="text-[#f0f6fc]">Kvaliteet:</strong> {image.quality}</span>
                        </div>
                        {image.prompt.includes('(REVISED:') && (
                          <div className="text-[#6f42c1] text-xs bg-[#21262d] p-2 rounded">
                            ⚠️ Azure muutis originaal prompti sisu poliitika tõttu
                          </div>
                        )}
                        {image.saveError && (
                          <div className="text-[#f85149] text-xs">
                            ⚠️ {image.saveError}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs mt-2 opacity-70 text-[#8b949e]">
                    {new Date(image.timestamp).toLocaleTimeString("et-EE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </Card>
              </div>
            ))}

            {generating && (
              <div className="flex justify-center">
                <Card className="max-w-[90%] md:max-w-[80%] p-4 md:p-6 bg-[#0a1930] border-[#21262d]">
                  <div className="flex items-center justify-center gap-3 text-[#8b949e]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Genereerin pilti...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Input Form */}
      <div className="border-t border-[#21262d] bg-[#0d1117] p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-[#0a1930] border-[#21262d] p-4">
            <div className="space-y-4">
              <div>
                <Textarea
                  placeholder="Kirjeldage pilti, mida soovite genereerida..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-[#21262d] border-[#30363d] text-[#f0f6fc] placeholder-[#8b949e] min-h-[80px]"
                />
              </div>

              <div className="flex flex-wrap gap-2 md:gap-4">
                <Select value={size} onValueChange={(value: '1024x1024' | '1792x1024' | '1024x1792') => setSize(value)}>
                  <SelectTrigger className="w-auto bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#21262d] border-[#30363d]">
                    <SelectItem value="1024x1024" className="text-[#f0f6fc]">1024×1024</SelectItem>
                    <SelectItem value="1792x1024" className="text-[#f0f6fc]">1792×1024</SelectItem>
                    <SelectItem value="1024x1792" className="text-[#f0f6fc]">1024×1792</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={style} onValueChange={(value: 'vivid' | 'natural') => setStyle(value)}>
                  <SelectTrigger className="w-auto bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#21262d] border-[#30363d]">
                    <SelectItem value="vivid" className="text-[#f0f6fc]">Vivid</SelectItem>
                    <SelectItem value="natural" className="text-[#f0f6fc]">Natural</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={quality} onValueChange={(value: 'standard' | 'hd') => setQuality(value)}>
                  <SelectTrigger className="w-auto bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#21262d] border-[#30363d]">
                    <SelectItem value="standard" className="text-[#f0f6fc]">Standard</SelectItem>
                    <SelectItem value="hd" className="text-[#f0f6fc]">HD</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  className="ml-auto bg-[#10a37f] hover:bg-[#0d8f6b] text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Genereerin...
                    </>
                  ) : (
                    "Genereeri"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 