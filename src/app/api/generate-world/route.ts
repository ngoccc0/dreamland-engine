
import { generateWorldSetup } from '@/ai/flows/generate-world-setup';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userInput, language } = await req.json();

    if (!userInput || !language) {
      return NextResponse.json({ error: 'Missing userInput or language' }, { status: 400 });
    }

    // The AI flow is now safely called on the server side.
    const result = await generateWorldSetup({ userInput, language });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/generate-world:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}
