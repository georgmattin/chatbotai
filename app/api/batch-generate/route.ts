import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface BatchGenerationRequest {
  prompts: Array<{
    id: string
    prompt: string
    size?: '1024x1024' | '1792x1024' | '1024x1792'
    style?: 'vivid' | 'natural'
    quality?: 'standard' | 'hd'
  }>
  globalSettings: {
    size: '1024x1024' | '1792x1024' | '1024x1792'
    style: 'vivid' | 'natural'
    quality: 'standard' | 'hd'
  }
}

interface BatchResult {
  id: string
  prompt: string
  success: boolean
  imageUrl?: string
  filename?: string
  error?: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const { prompts, globalSettings }: BatchGenerationRequest = await request.json()

    // Get API settings from environment variables
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT
    const deployment = process.env.DALL_E_DEPLOYMENT || 'dall-e-3'
    const apiVersion = process.env.OPENAI_API_VERSION || '2024-04-01-preview'

    console.log('Batch image generation request:')
    console.log('Endpoint:', endpoint)
    console.log('API Key configured:', !!apiKey)
    console.log('Total prompts:', prompts.length)

    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { error: 'Azure OpenAI seaded puuduvad .env failist.' },
        { status: 500 }
      )
    }

    if (!prompts || prompts.length === 0) {
      return NextResponse.json(
        { error: 'Prompts array on kohustuslik ja ei tohi olla tühi' },
        { status: 400 }
      )
    }

    // Create batch-specific directory
    const batchId = Date.now()
    const batchFolderName = `batch-${batchId}`
    const imagesDir = join(process.cwd(), 'public', 'generated-images')
    const batchDir = join(imagesDir, batchFolderName)
    
    try {
      await mkdir(batchDir, { recursive: true })
      console.log(`Created batch directory: ${batchDir}`)
    } catch (error) {
      console.error('Error creating batch directory:', error)
      return NextResponse.json(
        { error: `Viga batch kausta loomisel: ${error}` },
        { status: 500 }
      )
    }

    // Construct the API URL
    const imageApiUrl = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`

    const results: BatchResult[] = []

    // Process each prompt sequentially to avoid rate limiting
    for (let i = 0; i < prompts.length; i++) {
      const promptData = prompts[i]
      const currentSettings = {
        size: promptData.size || globalSettings.size,
        style: promptData.style || globalSettings.style,
        quality: promptData.quality || globalSettings.quality
      }

      console.log(`Processing ${i + 1}/${prompts.length}: ${promptData.prompt.slice(0, 50)}...`)

      try {
        const requestBody = {
          prompt: promptData.prompt,
          size: currentSettings.size,
          style: currentSettings.style,
          quality: currentSettings.quality,
          n: 1
        }

        console.log(`Request body for prompt ${i + 1}:`, JSON.stringify(requestBody, null, 2))

        const response = await fetch(imageApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`DALL-E API Error for prompt ${i + 1}:`, errorText)
          
          // Try to parse error response for revised prompt
          let revisedPrompt: string | null = null
          try {
            const errorData = JSON.parse(errorText)
            if (errorData.error?.code === 'content_policy_violation' && 
                errorData.error?.inner_error?.revised_prompt) {
              revisedPrompt = errorData.error.inner_error.revised_prompt
              console.log(`Found revised prompt for ${i + 1}: ${revisedPrompt}`)
            }
          } catch (parseError) {
            console.log('Could not parse error response for revised prompt')
          }

          // If we have a revised prompt, try again with it
          if (revisedPrompt) {
            console.log(`Retrying with revised prompt for ${i + 1}...`)
            
            try {
              const retryRequestBody = {
                ...requestBody,
                prompt: revisedPrompt
              }

              console.log(`Retry request body for prompt ${i + 1}:`, JSON.stringify(retryRequestBody, null, 2))

              const retryResponse = await fetch(imageApiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'api-key': apiKey,
                },
                body: JSON.stringify(retryRequestBody),
              })

              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                
                if (retryData.data && retryData.data[0] && retryData.data[0].url) {
                  const imageUrl = retryData.data[0].url
                  
                  try {
                    // Download and save the image locally
                    const imageResponse = await fetch(imageUrl)
                    const imageBuffer = await imageResponse.arrayBuffer()
                    
                                         // Generate filename with batch info
                     const timestamp = Date.now()
                     const filename = `image-${i + 1}-revised-${timestamp}.png`
                     const filepath = join(batchDir, filename)
                    
                    // Save the image
                    await writeFile(filepath, Buffer.from(imageBuffer))
                    
                                         // Return the local path
                     const localImageUrl = `/generated-images/${batchFolderName}/${filename}`
                    
                    results.push({
                      id: promptData.id,
                      prompt: `${promptData.prompt} (REVISED: ${revisedPrompt})`,
                      success: true,
                      imageUrl: localImageUrl,
                      filename: filename,
                      timestamp
                    })
                    
                    console.log(`Successfully generated image with revised prompt for ${i + 1}`)
                    continue // Skip to next prompt
                    
                  } catch (saveError) {
                    console.error(`Error saving revised image for prompt ${i + 1}:`, saveError)
                  }
                }
              } else {
                const retryErrorText = await retryResponse.text()
                console.error(`Retry also failed for prompt ${i + 1}:`, retryErrorText)
              }
            } catch (retryError) {
              console.error(`Error during retry for prompt ${i + 1}:`, retryError)
            }
          }
          
          // If retry failed or no revised prompt, record the original error
          results.push({
            id: promptData.id,
            prompt: promptData.prompt,
            success: false,
            error: `API Error: ${response.status} - ${errorText}${revisedPrompt ? ' (Retry with revised prompt also failed)' : ''}`,
            timestamp: Date.now()
          })
          continue
        }

        const data = await response.json()
        
        if (data.data && data.data[0] && data.data[0].url) {
          const imageUrl = data.data[0].url
          
          try {
            // Download and save the image locally
            const imageResponse = await fetch(imageUrl)
            const imageBuffer = await imageResponse.arrayBuffer()
            
            // Generate filename with batch info
            const timestamp = Date.now()
            const filename = `image-${i + 1}-${timestamp}.png`
            const filepath = join(batchDir, filename)
            
            // Save the image
            await writeFile(filepath, Buffer.from(imageBuffer))
            
            // Return the local path
            const localImageUrl = `/generated-images/${batchFolderName}/${filename}`
            
            results.push({
              id: promptData.id,
              prompt: promptData.prompt,
              success: true,
              imageUrl: localImageUrl,
              filename: filename,
              timestamp
            })
            
          } catch (saveError) {
            console.error(`Error saving image for prompt ${i + 1}:`, saveError)
            results.push({
              id: promptData.id,
              prompt: promptData.prompt,
              success: false,
              error: `Pildi salvestamine ebaõnnestus: ${saveError}`,
              timestamp: Date.now()
            })
          }
        } else {
          results.push({
            id: promptData.id,
            prompt: promptData.prompt,
            success: false,
            error: 'Vigane vastuse formaat DALL-E API-st',
            timestamp: Date.now()
          })
        }

        // Add a small delay between requests to avoid rate limiting
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        }

      } catch (error) {
        console.error(`Error generating image for prompt ${i + 1}:`, error)
        results.push({
          id: promptData.id,
          prompt: promptData.prompt,
          success: false,
          error: `Sisemine viga: ${error}`,
          timestamp: Date.now()
        })
      }
    }

    // Generate CSV with results
    const csvHeader = 'id,original_prompt,final_prompt,success,filename,imageUrl,error,timestamp,was_revised\n'
    const csvRows = results.map(result => {
      const isRevised = result.prompt.includes('(REVISED:')
      const originalPrompt = isRevised ? result.prompt.split(' (REVISED:')[0] : result.prompt
      const finalPrompt = isRevised ? result.prompt.match(/\(REVISED: (.*)\)$/)?.[1] || result.prompt : result.prompt
      
      const csvSafeOriginal = `"${originalPrompt.replace(/"/g, '""')}"` // Escape quotes in CSV
      const csvSafeFinal = `"${finalPrompt.replace(/"/g, '""')}"` // Escape quotes in CSV
      const csvSafeError = result.error ? `"${result.error.replace(/"/g, '""')}"` : ''
      
      return `${result.id},${csvSafeOriginal},${csvSafeFinal},${result.success},${result.filename || ''},${result.imageUrl || ''},${csvSafeError},${result.timestamp},${isRevised}`
    }).join('\n')
    
    const csvContent = csvHeader + csvRows
    const csvFilename = `batch-results-${batchId}.csv`
    const csvFilepath = join(batchDir, csvFilename)
    
    await writeFile(csvFilepath, csvContent, 'utf-8')

    return NextResponse.json({
      success: true,
      totalProcessed: prompts.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
      results,
      csvFile: `/generated-images/${batchFolderName}/${csvFilename}`,
      batchId,
      batchFolder: batchFolderName
    })

  } catch (error) {
    console.error('Batch generation error:', error)
    return NextResponse.json(
      { error: `Sisemine serveri viga: ${error}` },
      { status: 500 }
    )
  }
} 