import { fuseItems } from '@/ai/flows/fuse-items-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await fuseItems(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in /api/fuse-items:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
