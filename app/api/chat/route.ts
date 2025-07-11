import { NextRequest, NextResponse } from 'next/server'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    // Get API settings from environment variables
    const apiKey = process.env.AZURE_OPENAI_KEY
    const apiEndpoint = process.env.AZURE_OPENAI_ENDPOINT
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT

    console.log('API Request received:')
    console.log('Endpoint:', apiEndpoint)
    console.log('API Key configured:', !!apiKey)
    console.log('Messages count:', messages?.length)

    if (!apiKey || !apiEndpoint) {
      return NextResponse.json(
        { error: 'Azure OpenAI seaded puuduvad .env failist. Palun kontrollige AZURE_OPENAI_KEY ja AZURE_OPENAI_ENDPOINT muutujaid.' },
        { status: 500 }
      )
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: messages
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: `API Error: ${response.status} - ${errorText}`,
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return NextResponse.json({
        content: data.choices[0].message.content,
        usage: data.usage || null
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
} 