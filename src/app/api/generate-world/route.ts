
import { generateWorldSetup } from '@/ai/flows/generate-world-setup';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for the POST request to generate a new game world.
 * This function is called by the frontend when a user submits their world idea.
 * It securely calls the server-side Genkit flow `generateWorldSetup`.
 *
 * @param {NextRequest} req - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js response object.
 * It returns the generated world setup data on success, or an error message on failure.
 */
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
