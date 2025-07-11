"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, Download, FileText, Image as ImageIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface BatchResult {
  id: string
  prompt: string
  success: boolean
  imageUrl?: string
  filename?: string
  error?: string
  timestamp: number
}

interface BatchResponse {
  success: boolean
  totalProcessed: number
  successCount: number
  errorCount: number
  results: BatchResult[]
  csvFile: string
  batchId: number
  batchFolder: string
}

interface CSVPrompt {
  id: string
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  style?: 'vivid' | 'natural'
  quality?: 'standard' | 'hd'
}

export function BatchImageGenerator() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [prompts, setPrompts] = useState<CSVPrompt[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [results, setResults] = useState<BatchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Global settings
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024')
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid')
  const [quality, setQuality] = useState<'standard' | 'hd'>('hd')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Palun valige CSV fail')
      return
    }

    setCsvFile(file)
    setError(null)
    setResults(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        setError('CSV fail on tühi')
        return
      }

      // Parse CSV more robustly - handle quoted fields properly
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Handle escaped quotes
              current += '"'
              i++ // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        
        // Add the last field
        result.push(current.trim())
        return result
      }

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
      const promptIndex = headers.findIndex(h => h.includes('prompt'))
      const idIndex = headers.findIndex(h => h.includes('id'))
      const sizeIndex = headers.findIndex(h => h.includes('size'))
      const styleIndex = headers.findIndex(h => h.includes('style'))
      const qualityIndex = headers.findIndex(h => h.includes('quality'))

      console.log('CSV Headers:', headers)
      console.log('Indexes:', { promptIndex, idIndex, sizeIndex, styleIndex, qualityIndex })

      if (promptIndex === -1) {
        setError('CSV fail peab sisaldama "prompt" veergu')
        return
      }

      const parsedPrompts: CSVPrompt[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const columns = parseCSVLine(lines[i])
        
        console.log(`Row ${i}:`, columns)
        
        if (columns.length <= promptIndex) continue
        
        const prompt = columns[promptIndex]
        if (!prompt) continue

        parsedPrompts.push({
          id: idIndex >= 0 && columns[idIndex] ? columns[idIndex] : `row-${i}`,
          prompt: prompt,
          size: sizeIndex >= 0 && columns[sizeIndex] && ['1024x1024', '1792x1024', '1024x1792'].includes(columns[sizeIndex]) ? columns[sizeIndex] as any : undefined,
          style: styleIndex >= 0 && columns[styleIndex] && ['vivid', 'natural'].includes(columns[styleIndex]) ? columns[styleIndex] as any : undefined,
          quality: qualityIndex >= 0 && columns[qualityIndex] && ['standard', 'hd'].includes(columns[qualityIndex]) ? columns[qualityIndex] as any : undefined,
        })
      }

      if (parsedPrompts.length === 0) {
        setError('CSV failis ei leitud kehtivaid prompte')
        return
      }

      setPrompts(parsedPrompts)
      console.log('Parsed prompts:', parsedPrompts)
      
    } catch (err) {
      setError(`Viga CSV faili lugemisel: ${err}`)
    }
  }

  const startBatchGeneration = async () => {
    if (prompts.length === 0) return

    setProcessing(true)
    setProgress(0)
    setCurrentPrompt("")
    setError(null)
    setResults(null)

    // Simulate progress updates since we can't get real-time updates from the API
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          return prev + (90 / prompts.length) // Gradually increase to 90%
        }
        return prev
      })
    }, 1000)

    try {
      setCurrentPrompt("Alustame batch genereerimist...")
      
      const response = await fetch('/api/batch-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompts,
          globalSettings: {
            size,
            style,
            quality
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      setResults(data)
      setProgress(100)
      setCurrentPrompt("Valmis!")

    } catch (error) {
      console.error('Batch generation error:', error)
      setError(`Viga batch generatsioonis: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      clearInterval(progressInterval)
      setProcessing(false)
      setTimeout(() => setCurrentPrompt(""), 3000) // Clear after 3 seconds
    }
  }

  const downloadResults = () => {
    if (!results?.csvFile) return
    
    const link = document.createElement('a')
    link.href = results.csvFile
    link.download = `batch-results-${results.batchId}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const reset = () => {
    setCsvFile(null)
    setPrompts([])
    setResults(null)
    setError(null)
    setProgress(0)
    setCurrentPrompt("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="h-full bg-[#0d1117] flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[#6f42c1]" />
            <h1 className="text-2xl font-bold text-[#f0f6fc] mb-2">Batch Pildi Genereerimine</h1>
            <p className="text-[#8b949e] mb-2">
              Laadige üles CSV fail promptidega ja genereerige automaatselt kõik pildid
            </p>
            <div className="text-xs text-[#6f42c1] bg-[#0a1930] border border-[#6f42c1] rounded-lg p-3 max-w-2xl mx-auto">
              <strong>🔄 Auto-Retry:</strong> Kui Azure blokeerib prompts'i sisu poliitika tõttu, 
              kasutame automaatselt Azure'i soovitatud muudetud prompti uue pildi genereerimiseks.
            </div>
          </div>

          {/* CSV Format Info */}
          <Card className="bg-[#0a1930] border-[#21262d] p-4">
            <h3 className="text-[#f0f6fc] font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV Faili Formaat
            </h3>
                         <div className="text-sm text-[#8b949e] space-y-2">
               <p><strong>Kohustuslikud veerud:</strong></p>
               <ul className="list-disc list-inside ml-4 space-y-1">
                 <li><code>id</code> - Unikaalne identifikaator (või rida number)</li>
                 <li><code>prompt</code> - Pildi kirjeldus (kasutage jutumärke kui sisaldab komasid)</li>
               </ul>
               <p><strong>Valikulised veerud:</strong></p>
               <ul className="list-disc list-inside ml-4 space-y-1">
                 <li><code>size</code> - 1024x1024, 1792x1024, või 1024x1792</li>
                 <li><code>style</code> - vivid või natural</li>
                 <li><code>quality</code> - standard või hd</li>
               </ul>
               <div className="bg-[#21262d] p-3 rounded mt-3">
                 <p className="text-xs text-[#f0f6fc] font-medium mb-1">Näide:</p>
                 <code className="text-xs text-[#8b949e] block">
                   id,prompt,size,style,quality<br/>
                   1,"Beautiful sunset over mountains",1024x1024,vivid,hd<br/>
                   2,"Modern city at night",1792x1024,natural,standard
                 </code>
               </div>
               <p className="text-xs text-[#6b7280] mt-2">
                 Kui valikulised veerud puuduvad, kasutatakse globaalseid seadeid. 
                 Näidis fail: <code>public/sample-prompts.csv</code>
               </p>
             </div>
          </Card>

          {/* File Upload */}
          <Card className="bg-[#0a1930] border-[#21262d] p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-[#f0f6fc] mb-2 block">CSV Fail</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="border-[#30363d] text-[#f0f6fc] hover:bg-[#21262d]"
                    disabled={processing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Vali CSV Fail
                  </Button>
                  {csvFile && (
                    <span className="text-sm text-[#8b949e]">
                      {csvFile.name} ({prompts.length} prompti)
                    </span>
                  )}
                </div>
              </div>

              {/* Global Settings */}
              {prompts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#21262d]">
                  <div>
                    <Label className="text-[#f0f6fc] mb-2 block">Globaalne Suurus</Label>
                    <Select value={size} onValueChange={(value: '1024x1024' | '1792x1024' | '1024x1792') => setSize(value)}>
                      <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#21262d] border-[#30363d]">
                        <SelectItem value="1024x1024" className="text-[#f0f6fc]">1024×1024</SelectItem>
                        <SelectItem value="1792x1024" className="text-[#f0f6fc]">1792×1024</SelectItem>
                        <SelectItem value="1024x1792" className="text-[#f0f6fc]">1024×1792</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#f0f6fc] mb-2 block">Globaalne Stiil</Label>
                    <Select value={style} onValueChange={(value: 'vivid' | 'natural') => setStyle(value)}>
                      <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#21262d] border-[#30363d]">
                        <SelectItem value="vivid" className="text-[#f0f6fc]">Vivid</SelectItem>
                        <SelectItem value="natural" className="text-[#f0f6fc]">Natural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#f0f6fc] mb-2 block">Globaalne Kvaliteet</Label>
                    <Select value={quality} onValueChange={(value: 'standard' | 'hd') => setQuality(value)}>
                      <SelectTrigger className="bg-[#21262d] border-[#30363d] text-[#f0f6fc]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#21262d] border-[#30363d]">
                        <SelectItem value="standard" className="text-[#f0f6fc]">Standard</SelectItem>
                        <SelectItem value="hd" className="text-[#f0f6fc]">HD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={startBatchGeneration}
                  disabled={prompts.length === 0 || processing}
                  className="bg-[#6f42c1] hover:bg-[#5a359a] text-white"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Genereerin...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Alusta Batch Generatsiooni
                    </>
                  )}
                </Button>

                {(csvFile || results) && (
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="border-[#30363d] text-[#f0f6fc] hover:bg-[#21262d]"
                    disabled={processing}
                  >
                    Lähtesta
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Progress */}
          {processing && (
            <Card className="bg-[#0a1930] border-[#21262d] p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#f0f6fc] font-semibold">Genereerimise Progress</h3>
                  <span className="text-sm text-[#8b949e]">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                {currentPrompt && (
                  <p className="text-sm text-[#8b949e]">
                    Praegu: {currentPrompt.slice(0, 80)}...
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Alert className="border-[#f85149] bg-[#0a1930]">
              <AlertCircle className="h-4 w-4 text-[#f85149]" />
              <AlertDescription className="text-[#f85149]">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results && (
            <Card className="bg-[#0a1930] border-[#21262d] p-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[#f0f6fc] font-semibold">Batch Tulemused</h3>
                    <Button
                      onClick={downloadResults}
                      size="sm"
                      className="bg-[#10a37f] hover:bg-[#0d8f6b] text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Laadi CSV alla
                    </Button>
                  </div>
                  
                  {results.batchFolder && (
                    <div className="bg-[#21262d] rounded-lg p-3">
                      <div className="text-sm text-[#8b949e]">
                        <strong className="text-[#f0f6fc]">Batch kaust:</strong> 
                        <code className="ml-2 text-[#6f42c1]">generated-images/{results.batchFolder}/</code>
                      </div>
                      <div className="text-xs text-[#6b7280] mt-1">
                        Kõik selle batch'i pildid ja CSV fail asuvad selles kaustas
                      </div>
                    </div>
                  )}
                </div>

                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                   <div className="bg-[#21262d] rounded-lg p-4">
                     <div className="text-2xl font-bold text-[#f0f6fc]">{results.totalProcessed}</div>
                     <div className="text-sm text-[#8b949e]">Kokku töödeldud</div>
                   </div>
                   <div className="bg-[#21262d] rounded-lg p-4">
                     <div className="text-2xl font-bold text-[#4ade80]">{results.successCount}</div>
                     <div className="text-sm text-[#8b949e]">Õnnestunud</div>
                   </div>
                   <div className="bg-[#21262d] rounded-lg p-4">
                     <div className="text-2xl font-bold text-[#f87171]">{results.errorCount}</div>
                     <div className="text-sm text-[#8b949e]">Ebaõnnestunud</div>
                   </div>
                   <div className="bg-[#21262d] rounded-lg p-4">
                     <div className="text-2xl font-bold text-[#6f42c1]">
                       {results.results.filter(r => r.prompt.includes('(REVISED:')).length}
                     </div>
                     <div className="text-sm text-[#8b949e]">Muudetud promptid</div>
                   </div>
                 </div>

                {/* Results List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.results.map((result, index) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg"
                    >
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-[#4ade80] flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-[#f87171] flex-shrink-0" />
                      )}
                      
                                             <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium text-[#f0f6fc] truncate">
                           {result.id}: {result.prompt.slice(0, 60)}...
                           {result.prompt.includes('(REVISED:') && (
                             <span className="ml-2 px-2 py-0.5 bg-[#6f42c1] text-white text-xs rounded">
                               REVISED
                             </span>
                           )}
                         </div>
                         {result.success ? (
                           <div className="text-xs text-[#8b949e]">
                             Salvestatud: {result.filename}
                             {result.prompt.includes('(REVISED:') && (
                               <div className="text-xs text-[#6f42c1] mt-1">
                                 ⚠️ Kasutati Azure'i soovitatud muudetud prompti
                               </div>
                             )}
                           </div>
                         ) : (
                           <div className="text-xs text-[#f87171]">
                             {result.error}
                           </div>
                         )}
                       </div>

                      {result.success && result.imageUrl && (
                        <img
                          src={result.imageUrl}
                          alt={result.prompt}
                          className="w-12 h-12 object-cover rounded border border-[#30363d]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* CSV Preview */}
          {prompts.length > 0 && !results && (
            <Card className="bg-[#0a1930] border-[#21262d] p-6">
              <h3 className="text-[#f0f6fc] font-semibold mb-4">CSV Eelvaade ({prompts.length} prompti)</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {prompts.slice(0, 10).map((prompt, index) => (
                  <div key={prompt.id} className="text-sm text-[#8b949e] p-2 bg-[#21262d] rounded">
                    <strong className="text-[#f0f6fc]">{prompt.id}:</strong> {prompt.prompt.slice(0, 100)}...
                    {(prompt.size || prompt.style || prompt.quality) && (
                      <div className="text-xs text-[#6b7280] mt-1">
                        Seaded: {prompt.size || 'globaalne'}, {prompt.style || 'globaalne'}, {prompt.quality || 'globaalne'}
                      </div>
                    )}
                  </div>
                ))}
                {prompts.length > 10 && (
                  <div className="text-xs text-[#6b7280] text-center py-2">
                    ... ja veel {prompts.length - 10} prompti
                  </div>
                )}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
} 