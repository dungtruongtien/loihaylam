import { NextResponse } from 'next/server';
import type { getRoom as GR } from '@/lib/werewolf/room-manager';

export const runtime = 'nodejs';

/**
 * POST /api/rooms/:code/seed-roles
 * Test-only endpoint: pre-assigns roles to players by name before the game starts.
 * Body: { roles: Record<playerName, 'wolf' | 'villager'> }
 */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { roles } = await request.json() as { roles: Record<string, string> };
    if (!roles || typeof roles !== 'object') {
      return NextResponse.json({ error: 'roles object required' }, { status: 400 });
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRoom } = require('@/lib/werewolf/room-manager') as { getRoom: typeof GR };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getDb } = require('@/lib/db') as { getDb: () => import('better-sqlite3').Database };
    const room = getRoom(code.toUpperCase());
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    const db = getDb();
    const assign = db.prepare('UPDATE players SET role=? WHERE room_id=? AND name=?');
    for (const [name, role] of Object.entries(roles)) {
      assign.run(role, room.id, name);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
