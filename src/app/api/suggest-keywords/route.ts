import { suggestKeywords } from '@/ai/flows/suggest-keywords';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await suggestKeywords(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in /api/suggest-keywords:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
