import { NextRequest, NextResponse } from 'next/server'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      systemPrompt, 
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      stopSequences,
      pastMessagesLimit
    } = await request.json()

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

    // Prepare messages array with optional system prompt
    let apiMessages = [...messages]
    if (systemPrompt && systemPrompt.trim()) {
      // Add system prompt as the first message
      apiMessages = [
        { role: 'system', content: systemPrompt.trim() },
        ...messages
      ]
    }

    // Limit past messages if specified
    if (pastMessagesLimit && pastMessagesLimit > 0 && apiMessages.length > pastMessagesLimit) {
      // Keep system message (if any) and limit the rest
      const systemMessage = apiMessages.find(msg => msg.role === 'system')
      const otherMessages = apiMessages.filter(msg => msg.role !== 'system')
      const limitedMessages = otherMessages.slice(-pastMessagesLimit)
      apiMessages = systemMessage ? [systemMessage, ...limitedMessages] : limitedMessages
    }

    // Prepare API request body with all parameters
    const requestBody: any = {
      messages: apiMessages
    }

    // Add optional parameters if provided
    if (temperature !== undefined && temperature !== null) {
      requestBody.temperature = Math.max(0, Math.min(1, temperature))
    }
    
    if (maxTokens !== undefined && maxTokens !== null && maxTokens > 0) {
      requestBody.max_tokens = Math.min(16384, Math.max(1, maxTokens))
    }
    
    if (topP !== undefined && topP !== null) {
      requestBody.top_p = Math.max(0, Math.min(1, topP))
    }
    
    if (frequencyPenalty !== undefined && frequencyPenalty !== null) {
      requestBody.frequency_penalty = Math.max(-2, Math.min(2, frequencyPenalty))
    }
    
    if (presencePenalty !== undefined && presencePenalty !== null) {
      requestBody.presence_penalty = Math.max(-2, Math.min(2, presencePenalty))
    }
    
    if (stopSequences && Array.isArray(stopSequences) && stopSequences.length > 0) {
      const validStops = stopSequences.filter(stop => stop && stop.trim()).slice(0, 4)
      if (validStops.length > 0) {
        requestBody.stop = validStops
      }
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
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