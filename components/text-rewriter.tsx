"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, Download, Copy, RotateCcw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TextRewriterProps {
  onRewriteGenerated?: (originalText: string, rewrittenText: string, stats: any) => void
}

export function TextRewriter({ onRewriteGenerated }: TextRewriterProps) {
  const [originalText, setOriginalText] = useState("")
  const [rewrittenText, setRewrittenText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<{
    originalLength: number
    newLength: number
    lengthDifference: number
    lengthRatio: number
    warning?: string
    chunksProcessed?: number
    usage?: any
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (text.length > 100000) {
          toast({
            title: "Fail liiga suur",
            description: "Palun laadige üles fail, mis on väiksem kui 100,000 tähemärki.",
            variant: "destructive",
          })
          return
        }
        setOriginalText(text)
        setRewrittenText("")
        setStats(null)
        toast({
          title: "Fail laaditud",
          description: `Laaditud ${text.length} tähemärki teksti.`,
        })
      }
      reader.readAsText(file)
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRewrite = async () => {
    if (!originalText.trim()) {
      toast({
        title: "Puuduv tekst",
        description: "Palun sisestage või laadige üles tekst ümberkirjutamiseks.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Tekkis viga teksti ümberkirjutamisel')
      }

      clearInterval(progressInterval)
      setProgress(100)

      setRewrittenText(data.rewrittenText)
      setStats({
        originalLength: data.originalLength,
        newLength: data.newLength,
        lengthDifference: data.lengthDifference,
        lengthRatio: data.lengthRatio,
        warning: data.warning,
        chunksProcessed: data.chunksProcessed,
        usage: data.usage
      })

      if (onRewriteGenerated) {
        onRewriteGenerated(originalText, data.rewrittenText, {
          originalLength: data.originalLength,
          newLength: data.newLength,
          lengthDifference: data.lengthDifference,
          lengthRatio: data.lengthRatio,
          warning: data.warning,
          chunksProcessed: data.chunksProcessed,
          usage: data.usage
        })
      }

      // Show warning if text is too short
      if (data.warning) {
        toast({
          title: "Tekst ümber kirjutatud",
          description: `${data.warning} ${data.newLength} tähemärki (${data.lengthDifference >= 0 ? '+' : ''}${data.lengthDifference} erinevus).`,
          variant: "destructive",
        })
      } else {
              toast({
        title: "Tekst ümber kirjutatud",
        description: `Ümberkirjutatud ${data.newLength} tähemärki (${data.lengthDifference >= 0 ? '+' : ''}${data.lengthDifference} erinevus)${data.chunksProcessed ? ` - Töödeldud ${data.chunksProcessed} osa` : ''}.`,
      })
      }
    } catch (error) {
      console.error('Rewrite error:', error)
      toast({
        title: "Viga ümberkirjutamisel",
        description: error instanceof Error ? error.message : "Tekkis viga teksti ümberkirjutamisel.",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsLoading(false)
      setProgress(0)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Kopeeritud",
        description: `${type} tekst kopeeritud lõikepuhvrisse.`,
      })
    } catch (error) {
      toast({
        title: "Kopeerimine ebaõnnestus",
        description: "Ei saanud teksti lõikepuhvrisse kopeerida.",
        variant: "destructive",
      })
    }
  }

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Fail allalaaditud",
      description: `${filename} allalaaditud.`,
    })
  }

  const resetAll = () => {
    setOriginalText("")
    setRewrittenText("")
    setStats(null)
    toast({
      title: "Lähtestatud",
      description: "Kõik andmed kustutatud.",
    })
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
                <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#f0f6fc]">Teksti Ümberkirjutaja</h1>
            <p className="text-[#8b949e]">
              Laadige üles tekst kuni 100,000 tähemärki ja saage AI-põhine ümberkirjutus
            </p>
            {originalText.length > 20000 && (
              <p className="text-sm text-[#f39c12] bg-[#f39c12]/10 border border-[#f39c12]/20 rounded px-3 py-2 inline-block">
                💡 Pikk tekst ({originalText.length.toLocaleString()} tähemärki) töödeldakse osade kaupa paremate tulemuste saamiseks
              </p>
            )}
          </div>

      {/* File Upload */}
      <Card className="bg-[#0d1117] border-[#21262d]">
        <CardHeader>
          <CardTitle className="text-[#f0f6fc] flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Teksti Üleslaadimine
          </CardTitle>
          <CardDescription className="text-[#8b949e]">
            Laadige üles tekstifail või sisestage tekst käsitsi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-[#21262d] text-[#f0f6fc] hover:bg-[#21262d]"
            >
              <FileText className="h-4 w-4 mr-2" />
              Laadi fail
            </Button>
            <Button
              onClick={resetAll}
              variant="outline"
              className="border-[#21262d] text-[#8b949e] hover:bg-[#21262d]"
              disabled={!originalText && !rewrittenText}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Lähtesta
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Textarea
            placeholder="Või sisestage tekst siia..."
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            className="min-h-[200px] bg-[#0d1117] border-[#21262d] text-[#f0f6fc] placeholder:text-[#8b949e]"
            maxLength={100000}
          />
          
          <div className="flex justify-between items-center text-sm text-[#8b949e]">
            <span>{originalText.length.toLocaleString()} / 100,000 tähemärki</span>
            {originalText.length > 0 && (
              <Button
                onClick={() => copyToClipboard(originalText, "Algne")}
                variant="ghost"
                size="sm"
                className="text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <Copy className="h-3 w-3 mr-1" />
                Kopeeri
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button
          onClick={handleRewrite}
          disabled={!originalText.trim() || isLoading}
          className="bg-[#238636] hover:bg-[#2ea043] text-white px-8 py-3 text-lg"
        >
          {isLoading ? (
            <>
              <RotateCcw className="h-5 w-5 mr-2 animate-spin" />
              Ümberkirjutamine...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Kirjuta Ümber
            </>
          )}
        </Button>
      </div>

      {/* Progress */}
      {isLoading && (
        <Card className="bg-[#0d1117] border-[#21262d]">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[#8b949e]">
                <span>
                  {originalText.length > 20000 
                    ? `Ümberkirjutamine osade kaupa (${Math.ceil(originalText.length / 15000)} osa)...` 
                    : 'Ümberkirjutamine käib...'}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="bg-[#21262d]" />
              {originalText.length > 20000 && (
                <p className="text-xs text-[#8b949e] text-center">
                  Osade töötlemine võib võtta kuni {Math.ceil(originalText.length / 15000) * 10} sekundit
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {rewrittenText && stats && (
        <div className="space-y-6">
          {/* Statistics */}
          <Card className="bg-[#0d1117] border-[#21262d]">
            <CardHeader>
              <CardTitle className="text-[#f0f6fc]">Statistika</CardTitle>
              {stats.warning && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-[#f85149]/10 border border-[#f85149]/20 rounded">
                  <AlertCircle className="h-4 w-4 text-[#f85149]" />
                  <span className="text-sm text-[#f85149]">{stats.warning}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-2 gap-4 ${stats.chunksProcessed && stats.chunksProcessed > 1 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#f0f6fc]">
                    {stats.originalLength.toLocaleString()}
                  </div>
                  <div className="text-sm text-[#8b949e]">Algne pikkus</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats.lengthRatio < 0.8 ? 'text-red-400' : stats.lengthRatio < 0.9 ? 'text-yellow-400' : 'text-[#f0f6fc]'}`}>
                    {stats.newLength.toLocaleString()}
                  </div>
                  <div className="text-sm text-[#8b949e]">Uus pikkus</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats.lengthDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.lengthDifference >= 0 ? '+' : ''}{stats.lengthDifference}
                  </div>
                  <div className="text-sm text-[#8b949e]">Erinevus</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats.lengthRatio < 0.8 ? 'text-red-400' : stats.lengthRatio < 0.9 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {(stats.lengthRatio * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-[#8b949e]">Säilitatud</div>
                </div>
                {stats.chunksProcessed && stats.chunksProcessed > 1 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#3498db]">
                      {stats.chunksProcessed}
                    </div>
                    <div className="text-sm text-[#8b949e]">Osa</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rewritten Text */}
          <Card className="bg-[#0d1117] border-[#21262d]">
            <CardHeader>
              <CardTitle className="text-[#f0f6fc] flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ümberkirjutatud Tekst
              </CardTitle>
              <CardDescription className="text-[#8b949e]">
                AI poolt ümberkirjutatud tekst
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={rewrittenText}
                readOnly
                className="min-h-[300px] bg-[#0d1117] border-[#21262d] text-[#f0f6fc]"
              />
              
              <div className="flex gap-3 justify-between">
                <div className="flex gap-3">
                  {stats && stats.lengthRatio < 0.9 && (
                    <Button
                      onClick={handleRewrite}
                      disabled={isLoading}
                      variant="outline"
                      className="border-[#f85149] text-[#f85149] hover:bg-[#f85149]/10"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Proovi uuesti
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => copyToClipboard(rewrittenText, "Ümberkirjutatud")}
                    variant="outline"
                    className="border-[#21262d] text-[#f0f6fc] hover:bg-[#21262d]"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Kopeeri
                  </Button>
                  <Button
                    onClick={() => downloadText(rewrittenText, "umberkirjutatud_tekst.txt")}
                    variant="outline"
                    className="border-[#21262d] text-[#f0f6fc] hover:bg-[#21262d]"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Laadi alla
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Information */}
      <Card className="bg-[#0d1117] border-[#21262d]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#f85149] mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#f0f6fc]">Oluline teave</p>
              <p className="text-sm text-[#8b949e]">
                See tööriist on mõeldud sisu loomiseks ja plagiaadi vältimiseks. 
                Palun kasutage vastutustundlikult ja kontrollige alati ümberkirjutatud sisu enne kasutamist.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 