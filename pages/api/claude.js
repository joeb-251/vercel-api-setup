import { AnthropicStream, StreamingTextResponse } from 'ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { prompt, sessionId, context } = await req.json();
    
    console.log(`API: /claude called with sessionId: ${sessionId}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is missing');
      return new Response(JSON.stringify({ error: 'API configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestBody = {
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0.7,
      system: "You are an experienced tech manager coach. Your goal is to provide practical, actionable objectives that can be accomplished within a 90-day timeframe. Make your advice specific, measurable, and tailored to the user's context. Format your response in markdown with clear headings and bullet points.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };
    
    console.log('API request body:', JSON.stringify(requestBody));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-api-key': apiKey,
        'anthropic-version': '2023-12-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Claude API error:', error);
      console.error('Status code:', response.status);
      console.error('Status text:', response.statusText);
      return new Response(JSON.stringify({ 
        error: 'Error calling Claude API', 
        details: error,
        status: response.status 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    console.log(`API: /claude received response, length: ${data.content[0].text.length} characters`);
    
    return new Response(JSON.stringify({ 
      response: data.content[0].text,
      model: data.model,
      sessionId 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in Claude API route:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}