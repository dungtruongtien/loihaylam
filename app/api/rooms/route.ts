import { NextResponse } from 'next/server';
// Dynamic import to avoid bundling native modules in Edge runtime
import type { createRoom as CR } from '@/lib/werewolf/room-manager';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hostName, wolfCount, discussionSeconds } = body;
    if (!hostName?.trim()) {
      return NextResponse.json({ error: 'Host name required' }, { status: 400 });
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createRoom } = require('@/lib/werewolf/room-manager') as { createRoom: typeof CR };
    const result = createRoom({ hostName: hostName.trim(), wolfCount, discussionSeconds });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
