import { provideQuestHint } from '@/ai/flows/provide-quest-hint';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await provideQuestHint(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in /api/provide-quest-hint:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
