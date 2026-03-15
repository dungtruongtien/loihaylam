import { NextResponse } from 'next/server';
import type { joinRoom as JR } from '@/lib/werewolf/room-manager';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { playerName } = body;
    if (!playerName?.trim()) {
      return NextResponse.json({ error: 'Player name required' }, { status: 400 });
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { joinRoom } = require('@/lib/werewolf/room-manager') as { joinRoom: typeof JR };
    const result = joinRoom({ roomCode: code, playerName: playerName.trim() });
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
