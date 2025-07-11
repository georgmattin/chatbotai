import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface ImageGenerationRequest {
  prompt: string
  size: '1024x1024' | '1792x1024' | '1024x1792'
  style: 'vivid' | 'natural'
  quality: 'standard' | 'hd'
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, size, style, quality }: ImageGenerationRequest = await request.json()

    // Get API settings from environment variables
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT
    const deployment = process.env.DALL_E_DEPLOYMENT || 'dall-e-3'
    const apiVersion = process.env.OPENAI_API_VERSION || '2024-04-01-preview'

    console.log('Image generation request:')
    console.log('Endpoint:', endpoint)
    console.log('API Key configured:', !!apiKey)
    console.log('Prompt:', prompt)
    console.log('Size:', size)
    console.log('Style:', style)
    console.log('Quality:', quality)

    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { error: 'Azure OpenAI seaded puuduvad .env failist. Palun kontrollige AZURE_OPENAI_API_KEY ja AZURE_OPENAI_IMAGE_ENDPOINT muutujaid.' },
        { status: 500 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt on kohustuslik' },
        { status: 400 }
      )
    }

    // Construct the API URL
    const imageApiUrl = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`

    const response = await fetch(imageApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        prompt,
        size,
        style,
        quality,
        n: 1
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DALL-E API Error:', errorText)
      
      // Try to parse error response for revised prompt
      let revisedPrompt: string | null = null
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.code === 'content_policy_violation' && 
            errorData.error?.inner_error?.revised_prompt) {
          revisedPrompt = errorData.error.inner_error.revised_prompt
          console.log('Found revised prompt:', revisedPrompt)
        }
      } catch (parseError) {
        console.log('Could not parse error response for revised prompt')
      }

      // If we have a revised prompt, try again with it
      if (revisedPrompt) {
        console.log('Retrying with revised prompt...')
        
        try {
          const retryResponse = await fetch(imageApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': apiKey,
            },
            body: JSON.stringify({
              prompt: revisedPrompt,
              size,
              style,
              quality,
              n: 1
            }),
          })

          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            
            if (retryData.data && retryData.data[0] && retryData.data[0].url) {
              const imageUrl = retryData.data[0].url
              
              try {
                // Download and save the image locally
                const imageResponse = await fetch(imageUrl)
                const imageBuffer = await imageResponse.arrayBuffer()
                
                // Create images directory if it doesn't exist
                const imagesDir = join(process.cwd(), 'public', 'generated-images')
                try {
                  await mkdir(imagesDir, { recursive: true })
                } catch (error) {
                  // Directory might already exist, ignore error
                }
                
                // Generate filename
                const timestamp = Date.now()
                const filename = `generated-revised-${timestamp}.png`
                const filepath = join(imagesDir, filename)
                
                // Save the image
                await writeFile(filepath, Buffer.from(imageBuffer))
                
                // Return the local path with revised prompt info
                const localImageUrl = `/generated-images/${filename}`
                
                return NextResponse.json({
                  imageUrl: localImageUrl,
                  originalUrl: imageUrl,
                  prompt: `${prompt} (REVISED: ${revisedPrompt})`,
                  originalPrompt: prompt,
                  revisedPrompt: revisedPrompt,
                  size,
                  style,
                  quality,
                  timestamp,
                  wasRevised: true
                })
              } catch (saveError) {
                console.error('Error saving revised image:', saveError)
                // If saving fails, still return the original URL
                return NextResponse.json({
                  imageUrl: imageUrl,
                  originalUrl: imageUrl,
                  prompt: `${prompt} (REVISED: ${revisedPrompt})`,
                  originalPrompt: prompt,
                  revisedPrompt: revisedPrompt,
                  size,
                  style,
                  quality,
                  timestamp: Date.now(),
                  wasRevised: true,
                  saveError: 'Pildi salvestamine ebaõnnestus, kuvatud on originaal URL'
                })
              }
            }
          } else {
            const retryErrorText = await retryResponse.text()
            console.error('Retry also failed:', retryErrorText)
          }
        } catch (retryError) {
          console.error('Error during retry:', retryError)
        }
      }
      
      // If retry failed or no revised prompt, return original error
      return NextResponse.json(
        { 
          error: `DALL-E API Error: ${response.status} - ${errorText}${revisedPrompt ? ' (Retry with revised prompt also failed)' : ''}`,
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (data.data && data.data[0] && data.data[0].url) {
      const imageUrl = data.data[0].url
      
      try {
        // Download and save the image locally
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        
        // Create images directory if it doesn't exist
        const imagesDir = join(process.cwd(), 'public', 'generated-images')
        try {
          await mkdir(imagesDir, { recursive: true })
        } catch (error) {
          // Directory might already exist, ignore error
        }
        
        // Generate filename
        const timestamp = Date.now()
        const filename = `generated-${timestamp}.png`
        const filepath = join(imagesDir, filename)
        
        // Save the image
        await writeFile(filepath, Buffer.from(imageBuffer))
        
        // Return the local path
        const localImageUrl = `/generated-images/${filename}`
        
        return NextResponse.json({
          imageUrl: localImageUrl,
          originalUrl: imageUrl,
          prompt,
          size,
          style,
          quality,
          timestamp
        })
      } catch (saveError) {
        console.error('Error saving image:', saveError)
        // If saving fails, still return the original URL
        return NextResponse.json({
          imageUrl: imageUrl,
          originalUrl: imageUrl,
          prompt,
          size,
          style,
          quality,
          timestamp: Date.now(),
          saveError: 'Pildi salvestamine ebaõnnestus, kuvatud on originaal URL'
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Vigane vastuse formaat DALL-E API-st' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: `Sisemine serveri viga: ${error}` },
      { status: 500 }
    )
  }
} 