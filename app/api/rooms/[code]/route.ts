import { NextResponse } from 'next/server';
import type { getRoom as GR, getPlayers as GP } from '@/lib/werewolf/room-manager';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRoom, getPlayers } = require('@/lib/werewolf/room-manager') as { getRoom: typeof GR; getPlayers: typeof GP };
    const room = getRoom(code.toUpperCase());
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    const players = getPlayers(room.id);
    return NextResponse.json({ room, players });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
