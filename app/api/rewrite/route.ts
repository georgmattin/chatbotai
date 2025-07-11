import { NextRequest, NextResponse } from 'next/server'

// Helper function to split text into logical chunks
function splitTextIntoChunks(text: string, maxChunkSize: number = 20000): string[] {
  const chunks: string[] = []
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/)
  
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size and we have content, start new chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }
  
  // Add the last chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  
  // If we still have chunks that are too large, split them by sentences
  const finalChunks: string[] = []
  for (const chunk of chunks) {
    if (chunk.length <= maxChunkSize) {
      finalChunks.push(chunk)
    } else {
      // Split by sentences
      const sentences = chunk.split(/(?<=[.!?])\s+/)
      let subChunk = ''
      
      for (const sentence of sentences) {
        if (subChunk.length + sentence.length > maxChunkSize && subChunk.length > 0) {
          finalChunks.push(subChunk.trim())
          subChunk = sentence
        } else {
          subChunk += (subChunk ? ' ' : '') + sentence
        }
      }
      
      if (subChunk) {
        finalChunks.push(subChunk.trim())
      }
    }
  }
  
  return finalChunks
}

// Helper function to handle chunked rewriting
async function handleChunkedRewrite(text: string, originalLength: number, apiKey: string, apiEndpoint: string) {
  try {
    const chunks = splitTextIntoChunks(text, 15000) // Smaller chunks for faster processing
    const rewrittenChunks: string[] = []
    
    console.log(`Processing ${chunks.length} chunks for text of ${originalLength} characters`)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const chunkLength = chunk.length
      
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunkLength} characters)...`)
      
      const chunkMessages = [
        {
          role: 'user',
          content: `Rewrite this text in English using different words while maintaining the same meaning and approximately the same length (${chunkLength} characters).

This is part ${i + 1} of ${chunks.length} parts of a larger text. Maintain consistency in tone and style.

TEXT TO REWRITE:
${chunk}

Requirements:
- Use completely different words but keep the same meaning
- Target length: approximately ${chunkLength} characters
- Maintain professional and consistent tone
- Do not summarize or shorten`
        }
      ]
      
              try {
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': apiKey,
            },
            body: JSON.stringify({
              messages: chunkMessages,
              max_tokens: Math.min(4000, Math.ceil(chunkLength * 1.5)), // GPT-4.1 uses max_tokens
              temperature: 0.7
            }),
          })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Chunk ${i + 1} failed:`, errorText)
          throw new Error(`Chunk ${i + 1} error: ${response.status} - ${errorText}`)
        }
        
        const data = await response.json()
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const rewrittenChunk = data.choices[0].message.content.trim()
          rewrittenChunks.push(rewrittenChunk)
          console.log(`✓ Chunk ${i + 1}/${chunks.length} completed: ${rewrittenChunk.length} characters`)
        } else {
          throw new Error(`Invalid response for chunk ${i + 1}`)
        }
        
      } catch (chunkError) {
        console.error(`Error processing chunk ${i + 1}:`, chunkError)
        // Continue with remaining chunks even if one fails
        rewrittenChunks.push(`[Error processing chunk ${i + 1}: ${chunk}]`)
      }
    }
    
    // Combine all chunks
    const finalRewrittenText = rewrittenChunks.join('\n\n')
    const newLength = finalRewrittenText.length
    const lengthDifference = newLength - originalLength
    const lengthRatio = newLength / originalLength
    
    // Check if the result is significantly shorter than expected
    let warning = null
    if (lengthRatio < 0.8) {
      warning = 'Hoiatus: Ümberkirjutatud tekst on märkimisväärselt lühem kui algne tekst. Chunked rewriting võib mõjutada pikkust.'
    } else if (lengthRatio < 0.9) {
      warning = 'Märkus: Ümberkirjutatud tekst on veidi lühem kui algne tekst.'
    }
    
    console.log(`Chunked rewrite completed: ${chunks.length} chunks, ${newLength} characters total`)
    
    return NextResponse.json({
      rewrittenText: finalRewrittenText,
      originalLength: originalLength,
      newLength: newLength,
      lengthDifference: lengthDifference,
      lengthRatio: lengthRatio,
      warning: warning,
      chunksProcessed: chunks.length,
      usage: { chunks: chunks.length, method: 'chunked' }
    })
    
  } catch (error) {
    console.error('Chunked rewrite error:', error)
    return NextResponse.json(
      { error: `Chunked rewrite error: ${error}` },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    // Get API settings from environment variables (using O1 model for better text rewriting)
    const apiKey = process.env.AZURE_OPENAI_O1_KEY
    const apiEndpoint = process.env.AZURE_OPENAI_O1_ENDPOINT

    console.log('Rewrite API Request received (O1 Model):')
    console.log('Endpoint:', apiEndpoint)
    console.log('API Key configured:', !!apiKey)
    console.log('Text length:', text?.length)

    if (!apiKey || !apiEndpoint) {
      return NextResponse.json(
        { error: 'Azure OpenAI O1 seaded puuduvad .env failist. Palun kontrollige AZURE_OPENAI_O1_KEY ja AZURE_OPENAI_O1_ENDPOINT muutujaid.' },
        { status: 500 }
      )
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Calculate the original character count for reference
    const originalLength = text.length

    // For texts longer than 20000 characters, use chunking strategy with GPT-4.1 (faster)
    if (originalLength > 20000) {
      const gpt4ApiKey = process.env.AZURE_OPENAI_KEY
      const gpt4Endpoint = process.env.AZURE_OPENAI_ENDPOINT
      
      if (!gpt4ApiKey || !gpt4Endpoint) {
        return NextResponse.json(
          { error: 'GPT-4.1 seaded puuduvad chunking\'u jaoks. Kontrollige AZURE_OPENAI_KEY ja AZURE_OPENAI_ENDPOINT.' },
          { status: 500 }
        )
      }
      
      return await handleChunkedRewrite(text, originalLength, gpt4ApiKey, gpt4Endpoint)
    }

    const messages = [
      {
        role: 'user',
        content: `Please rewrite the following text in English using completely different words and phrases while maintaining the exact same meaning and length.

⚠️ CRITICAL LENGTH REQUIREMENT ⚠️
The original text is ${originalLength} characters long. Your rewritten version MUST be at least ${Math.floor(originalLength * 0.95)} characters (preferably ${originalLength}+ characters).

DO NOT STOP EARLY. DO NOT SUMMARIZE. 

If you reach what feels like a natural ending but haven't reached ${Math.floor(originalLength * 0.95)} characters yet, you MUST continue writing by:
- Adding more detailed explanations
- Including additional relevant examples
- Expanding on concepts with more descriptive language
- Using longer, more elaborate sentence structures

REWRITING APPROACH:
- Use extensive synonyms and alternative expressions
- Transform simple sentences into compound/complex ones
- Add descriptive adjectives, adverbs, and explanatory phrases
- Include transitional words and connecting phrases
- Elaborate on every concept mentioned
- Maintain all original information while expanding the language

Remember: The goal is ${originalLength} characters minimum. Keep writing until you reach this target.

TEXT TO REWRITE (${originalLength} characters):
${text}`
      }
    ]

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: messages,
        max_completion_tokens: Math.min(32000, Math.ceil(originalLength * 3)) // Allow significantly more tokens for maintaining length
        // O1 model doesn't use temperature parameter
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
      let rewrittenText = data.choices[0].message.content
      let newLength = rewrittenText.length
      let lengthDifference = newLength - originalLength
      let lengthRatio = newLength / originalLength
      
      // If the result is too short, try once more with a more aggressive prompt
      if (lengthRatio < 0.8) {
        console.log('Text too short, attempting retry with more aggressive prompt...')
        
        const retryMessages = [
          {
            role: 'user',
            content: `The previous rewrite was too short (${newLength} characters vs ${originalLength} required). 
            
            Please expand the following text to be at least ${Math.floor(originalLength * 0.95)} characters long by:
            - Adding more descriptive adjectives and adverbs
            - Using longer phrases instead of single words
            - Including explanatory clauses and transitional sentences
            - Expanding every concept with more detail
            - Using compound and complex sentences
            - Adding clarifying phrases like "it should be noted that", "furthermore", "in particular"
            
            Do not summarize - always expand and elaborate.
            
            TEXT TO EXPAND (currently ${newLength} characters, needs to be ${Math.floor(originalLength * 0.95)}+ characters):
            ${rewrittenText}`
          }
        ]
        
        const retryResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify({
            messages: retryMessages,
            max_completion_tokens: Math.min(32000, Math.ceil(originalLength * 3))
            // O1 model doesn't use temperature parameter
          }),
        })
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json()
          if (retryData.choices && retryData.choices[0] && retryData.choices[0].message) {
            rewrittenText = retryData.choices[0].message.content
            newLength = rewrittenText.length
            lengthDifference = newLength - originalLength
            lengthRatio = newLength / originalLength
          }
        }
      }
      
      // Check if the result is significantly shorter than expected
      let warning = null
      if (lengthRatio < 0.8) {
        warning = 'Hoiatus: Ümberkirjutatud tekst on märkimisväärselt lühem kui algne tekst. Võimalik, et AI kokkupress sisu.'
      } else if (lengthRatio < 0.9) {
        warning = 'Märkus: Ümberkirjutatud tekst on veidi lühem kui algne tekst.'
      }
      
      return NextResponse.json({
        rewrittenText: rewrittenText,
        originalLength: originalLength,
        newLength: newLength,
        lengthDifference: lengthDifference,
        lengthRatio: lengthRatio,
        warning: warning,
        usage: data.usage || null
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Rewrite API Error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}

async function handleLongTextRewrite(text: string, originalLength: number, apiKey: string, apiEndpoint: string) {
  try {
    // Split text into chunks of approximately 8000 characters
    const chunkSize = 8000
    const chunks = []
    let startIndex = 0
    
    while (startIndex < text.length) {
      let endIndex = startIndex + chunkSize
      
      // Try to find a natural break point (sentence end, paragraph, etc.)
      if (endIndex < text.length) {
        // Look for paragraph breaks first
        const paragraphBreak = text.lastIndexOf('\n\n', endIndex)
        if (paragraphBreak > startIndex + chunkSize * 0.7) {
          endIndex = paragraphBreak + 2
        } else {
          // Look for sentence breaks
          const sentenceBreak = text.lastIndexOf('.', endIndex)
          if (sentenceBreak > startIndex + chunkSize * 0.7) {
            endIndex = sentenceBreak + 1
          }
        }
      }
      
      chunks.push(text.substring(startIndex, endIndex))
      startIndex = endIndex
    }

    console.log(`Processing ${chunks.length} chunks for text of ${originalLength} characters`)

    // Rewrite each chunk
    const rewrittenChunks = []
    let totalProcessed = 0

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const chunkLength = chunk.length
      
      const messages = [
        {
          role: 'system',
          content: `You are a professional text rewriter. You are rewriting part ${i + 1} of ${chunks.length} of a longer text. Your task is to rewrite this text chunk in English using different words and phrases while maintaining EXACTLY the same meaning and approximately the same length.

CRITICAL REQUIREMENTS:
- The rewritten chunk MUST be at least ${Math.floor(chunkLength * 0.95)} characters long (95% of original chunk)
- DO NOT summarize, condense, or shorten the content
- DO NOT remove any information or details
- EXPAND on ideas if needed to maintain length
- Use synonyms, alternative phrases, and different sentence structures
- Add explanatory phrases, adjectives, and descriptive language to reach the target length
- Maintain the exact same meaning and message throughout
- Ensure the rewritten text flows naturally and can be combined with other chunks
- DO NOT add introductory phrases like "Here is the rewritten text:" or similar

This is part of a larger document, so maintain consistency in style and tone.`
        },
        {
          role: 'user',
          content: `Please rewrite the following text chunk (${chunkLength} characters). Your rewritten version MUST be at least ${Math.floor(chunkLength * 0.95)} characters long:

${chunk}`
        }
      ]

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: messages,
          max_tokens: Math.min(16000, Math.ceil(chunkLength * 2)),
          temperature: 0.7
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error for chunk ${i + 1}: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        rewrittenChunks.push(data.choices[0].message.content)
        totalProcessed += chunkLength
        console.log(`Processed chunk ${i + 1}/${chunks.length} (${totalProcessed}/${originalLength} characters)`)
      } else {
        throw new Error(`Invalid response format for chunk ${i + 1}`)
      }
    }

    // Combine all rewritten chunks
    const rewrittenText = rewrittenChunks.join('')
    const newLength = rewrittenText.length
    const lengthDifference = newLength - originalLength
    const lengthRatio = newLength / originalLength
    
    // Check if the result is significantly shorter than expected
    let warning = null
    if (lengthRatio < 0.8) {
      warning = `Hoiatus: Ümberkirjutatud tekst on märkimisväärselt lühem kui algne tekst (${chunks.length} lõiku töödeldud).`
    } else if (lengthRatio < 0.9) {
      warning = `Märkus: Ümberkirjutatud tekst on veidi lühem kui algne tekst (${chunks.length} lõiku töödeldud).`
    }
    
    return NextResponse.json({
      rewrittenText: rewrittenText,
      originalLength: originalLength,
      newLength: newLength,
      lengthDifference: lengthDifference,
      lengthRatio: lengthRatio,
      warning: warning,
      chunksProcessed: chunks.length,
      usage: null // Usage data not available when processing chunks
    })

  } catch (error) {
    console.error('Long text rewrite error:', error)
    return NextResponse.json(
      { error: `Viga pika teksti ümberkirjutamisel: ${error}` },
      { status: 500 }
    )
  }
} 