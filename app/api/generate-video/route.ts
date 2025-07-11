import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface VideoGenerationRequest {
  prompt: string
  aspectRatio: '16:9' | '9:16'
  duration?: number
  model?: 'veo-2.0' | 'veo-3.0'
  temperature?: number
}

interface OperationResponse {
  name: string
  metadata?: {
    '@type': string
    createTime: string
    target: string
    verb: string
    requestedCancellation?: boolean
    apiVersion: string
  }
  done?: boolean
  error?: {
    code: number
    message: string
    details: any[]
  }
  response?: {
    '@type': string
    generatedSamples: Array<{
      videoUri: string
      mimeType: string
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio, duration = 8, model = 'veo-3.0', temperature = 0.7 }: VideoGenerationRequest = await request.json()

    // Get API settings from environment variables
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY

    console.log('Video generation request:')
    console.log('Project ID:', projectId)
    console.log('Location:', location)
    console.log('Model:', model)
    console.log('Prompt:', prompt)
    console.log('Aspect Ratio:', aspectRatio)
    console.log('Duration:', duration)

    if (!projectId || !serviceAccountKey) {
      return NextResponse.json(
        { error: 'Google Cloud seaded puuduvad .env failist. Palun kontrollige GOOGLE_CLOUD_PROJECT_ID ja GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY muutujaid.' },
        { status: 500 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Video kirjeldus on kohustuslik' },
        { status: 400 }
      )
    }

    // Parse service account key
    const credentials = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString())

    // Get access token
    const { GoogleAuth } = require('google-auth-library')
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })

    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    if (!accessToken.token) {
      return NextResponse.json(
        { error: 'Google Cloud autentimine ebaõnnestus' },
        { status: 500 }
      )
    }

    // Determine the model endpoint
    const modelName = model === 'veo-3.0' ? 'veo-3.0-generate-preview' : 'veo-2.0-generate-001'
    const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:predictLongRunning`

    // Prepare request body for Vertex AI Veo
    const requestBody = {
      instances: [
        {
          prompt: prompt,
          video_config: {
            aspect_ratio: aspectRatio,
            duration: `${duration}s`
          }
        }
      ],
      parameters: {
        temperature: temperature,
        seed: Math.floor(Math.random() * 1000000)
      }
    }

    console.log('Making request to Vertex AI:', apiUrl)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    // Make the long-running operation request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vertex AI Veo API Error:', response.status, errorText)
      return NextResponse.json(
        { error: `Vertex AI Veo API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const operationData: OperationResponse = await response.json()
    console.log('Operation started:', operationData.name)

    // Poll for completion
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0
    let completed = false
    let finalResult: OperationResponse | null = null

    while (attempts < maxAttempts && !completed) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      try {
        const pollUrl = `https://${location}-aiplatform.googleapis.com/v1/${operationData.name}`
        const pollResponse = await fetch(pollUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
          },
        })

        if (pollResponse.ok) {
          const pollData: OperationResponse = await pollResponse.json()
          console.log(`Poll attempt ${attempts}:`, pollData.done ? 'COMPLETED' : 'IN_PROGRESS')

          if (pollData.done) {
            completed = true
            finalResult = pollData
          }
        } else {
          console.error(`Poll attempt ${attempts} failed:`, pollResponse.status)
        }
      } catch (pollError) {
        console.error(`Poll attempt ${attempts} error:`, pollError)
      }
    }

    if (!completed || !finalResult) {
      return NextResponse.json(
        { 
          error: 'Video genereerimine võttis liiga kaua aega. Palun proovige hiljem uuesti.',
          operationName: operationData.name
        },
        { status: 408 }
      )
    }

    if (finalResult.error) {
      return NextResponse.json(
        { error: `Video genereerimine ebaõnnestus: ${finalResult.error.message}` },
        { status: 500 }
      )
    }

    if (!finalResult.response?.generatedSamples?.[0]?.videoUri) {
      return NextResponse.json(
        { error: 'Video URL puudub vastuses' },
        { status: 500 }
      )
    }

    const videoUri = finalResult.response.generatedSamples[0].videoUri
    const mimeType = finalResult.response.generatedSamples[0].mimeType || 'video/mp4'

    console.log('Video generated successfully:', videoUri)

    try {
      // Download and save the video locally
      const videoResponse = await fetch(videoUri, {
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
        },
      })

      if (videoResponse.ok) {
        const videoBuffer = await videoResponse.arrayBuffer()
        
        // Create videos directory if it doesn't exist
        const videosDir = join(process.cwd(), 'public', 'generated-videos')
        try {
          await mkdir(videosDir, { recursive: true })
        } catch (error) {
          // Directory might already exist, ignore error
        }
        
        // Generate filename
        const timestamp = Date.now()
        const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const filename = `generated-video-${timestamp}.${fileExtension}`
        const filepath = join(videosDir, filename)
        
        // Save the video
        await writeFile(filepath, Buffer.from(videoBuffer))
        
        // Return the local path
        const localVideoUrl = `/generated-videos/${filename}`
        
        return NextResponse.json({
          videoUrl: localVideoUrl,
          originalUrl: videoUri,
          prompt: prompt,
          aspectRatio,
          duration,
          model,
          temperature,
          timestamp,
          mimeType,
          operationName: operationData.name
        })
      } else {
        console.error('Error downloading video:', videoResponse.status)
        // If download fails, return the original URI
        return NextResponse.json({
          videoUrl: videoUri,
          originalUrl: videoUri,
          prompt: prompt,
          aspectRatio,
          duration,
          model,
          temperature,
          timestamp: Date.now(),
          mimeType,
          operationName: operationData.name,
          saveError: 'Video salvestamine ebaõnnestus, kuvatud on originaal URL'
        })
      }
    } catch (saveError) {
      console.error('Error saving video:', saveError)
      // If saving fails, still return the original URL
      return NextResponse.json({
        videoUrl: videoUri,
        originalUrl: videoUri,
        prompt: prompt,
        aspectRatio,
        duration,
        model,
        temperature,
        timestamp: Date.now(),
        mimeType,
        operationName: operationData.name,
        saveError: 'Video salvestamine ebaõnnestus, kuvatud on originaal URL'
      })
    }

  } catch (error) {
    console.error('Error in video generation:', error)
    return NextResponse.json(
      { error: `Video genereerimine ebaõnnestus: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
} 