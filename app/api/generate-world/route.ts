
import { generateWorldSetup } from '@/ai/flows/generate-world-setup';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @description API route handler for the POST request to generate a new game world.
 * This function is called by the frontend when a user submits their world idea.
 * It securely calls the server-side Genkit flow `generateWorldSetup`.
 *
 * @param {NextRequest} req - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js response object.
 * It returns the generated world setup data on success, or an error message on failure.
 */
export async function POST(req: NextRequest) {
  try {
    // First try to parse the request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Invalid request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Request must be valid JSON' },
        { status: 400 }
      );
    }

    const { userInput, language } = body;

    // Validate input
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Invalid userInput', details: 'userInput must be a non-empty string' },
        { status: 400 }
      );
    }
    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { error: 'Invalid language', details: 'language must be a non-empty string' },
        { status: 400 }
      );
    }

    try {
      // Try to generate the world
      const result = await generateWorldSetup({ userInput, language });
      return NextResponse.json(result);
    } catch (genError: any) {
      console.error('World generation error:', genError);
      // Return a more specific error for AI generation failures
      return NextResponse.json({
        error: 'World generation failed',
        details: genError.message || 'Unknown AI error',
        stack: process.env.NODE_ENV === 'development' ? genError.stack : undefined
      }, { status: 500 });
    }
  } catch (error: any) {
    // Catch any other unexpected errors
    console.error('Unexpected error in /api/generate-world:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message || 'An unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
