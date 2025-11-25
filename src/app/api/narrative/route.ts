import { generateNarrative } from '@/ai/flows/generate-narrative-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await generateNarrative(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in /api/narrative:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
