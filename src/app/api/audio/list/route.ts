/**
 * @overview
 * Audio files listing API endpoint.
 * Dynamically scans audio folders and returns available tracks.
 * Used by settings UI to populate music selection dropdowns.
 */

import { readdirSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

/**
 * Scan audio folder and return list of music files.
 * GET /api/audio/list?folder=background_music
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const folder = searchParams.get('folder') || 'background_music';

        // Validate folder name to prevent path traversal
        const validFolders = ['background_music', 'menu_music', 'ambience'];
        if (!validFolders.includes(folder)) {
            return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
        }

        const audioPath = join(process.cwd(), 'public', 'asset', 'sound', folder);
        const files = readdirSync(audioPath);

        // Filter for audio files and sort alphabetically
        const audioFiles = files
            .filter(file => /\.(mp3|wav|ogg|m4a)$/i.test(file))
            .sort();

        return NextResponse.json({
            folder,
            files: audioFiles,
            count: audioFiles.length,
        });
    } catch (error) {
        console.error('[Audio API] Error listing files:', error);
        return NextResponse.json(
            { error: 'Failed to list audio files' },
            { status: 500 }
        );
    }
}
