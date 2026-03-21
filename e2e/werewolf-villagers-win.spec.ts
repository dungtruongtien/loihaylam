/**
 * Werewolf E2E Test — Villagers Win
 *
 * 8 browsers total: Player0 is host-only (no role), Player1–Player7 are game participants.
 * 2 wolves (Player6, Player7), 5 villagers (Player1–Player5).
 * Roles are seeded via API before the game starts so the scenario is fully deterministic.
 *
 * Scenario:
 *   Night 1: Wolves kill Player1         → 2W + 4V
 *   Day 1:   Village votes out Player6   → Wolf eliminated → 1W + 4V
 *   Night 2: Wolf kills Player2          → 1W + 3V
 *   Day 2:   Village votes out Player7   → Wolf eliminated → 0W + 3V → Villagers Win!
 *
 * Run:
 *   npm run test:e2e           — headless (fastest)
 *   npm run test:e2e:headed    — watch browsers open
 *   npm run test:e2e:ui        — Playwright UI mode (live progress)
 */

import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL      = 'http://localhost:9999/werewolf';
const TOTAL_PLAYERS = 8;  // Player0 (host) + Player1–Player7 (game participants)
const WOLF_COUNT    = 2;

// ─── Role Map ─────────────────────────────────────────────────────────────────
// Player0 is host-only — no role. Player1–Player7 are seeded before game start.
const ROLE_MAP: Record<string, 'wolf' | 'villager'> = {
  Player1: 'villager',
  Player2: 'villager',
  Player3: 'villager',
  Player4: 'villager',
  Player5: 'villager',
  Player6: 'wolf',
  Player7: 'wolf',
};

// ─── Scenario ─────────────────────────────────────────────────────────────────
// Edit this to change the game flow. Names must match ROLE_MAP keys.
interface NightEvent { night: number; victim: string }
interface DayEvent   { day: number; voted: string; is_defense_successful: boolean }
type ScenarioEvent = NightEvent | DayEvent;

const SCENARIO: ScenarioEvent[] = [
  { night: 1, victim: 'Player1' },              // 2W + 5V → 2W + 4V
  { day: 1,   voted: 'Player6', is_defense_successful: false },  // → 1W + 4V
  { night: 2, victim: 'Player2' },              // → 1W + 3V
  { day: 2,   voted: 'Player7', is_defense_successful: false },  // → 0W + 3V → Villagers Win
];

const EXPECTED_WINNER = 'Villagers Win';

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface Player { browser: Browser; ctx: BrowserContext; page: Page; name: string }


async function waitForAnyPhase(page: Page, headings: string[], timeout = 30_000): Promise<string> {
  const deadline = Date.now() + timeout;
  let lastSeen = '';
  while (Date.now() < deadline) {
    const h2 = (await page.locator('h2').first().textContent().catch(() => '')) ?? '';
    if (h2 !== lastSeen) { console.log(`  [phase] "${h2.trim()}"`); lastSeen = h2; }
    for (const h of headings) { if (h2.includes(h)) return h2; }
    await page.waitForTimeout(500);
  }
  const final = (await page.locator('h2').first().textContent().catch(() => '')) ?? '';
  console.log(`  [phase] timeout. Last: "${final.trim()}". Expected: ${headings.join(', ')}`);
  return final;
}


function isGameEnded(dead: Set<string>): boolean {
  const aliveWolves    = wolves.filter((n) => !dead.has(n));
  const aliveVillagers = villagers.filter((n) => !dead.has(n));
  return aliveWolves.length === 0 || aliveWolves.length >= aliveVillagers.length;
}

const wolves    = Object.entries(ROLE_MAP).filter(([, r]) => r === 'wolf').map(([n]) => n);
const villagers = Object.entries(ROLE_MAP).filter(([, r]) => r === 'villager').map(([n]) => n);

// ─── Test ─────────────────────────────────────────────────────────────────────
test.describe('Werewolf — Villagers Win', () => {
  test(`${TOTAL_PLAYERS} players: ${wolves.join(', ')} are wolves — villagers win`, async () => {
    const players: Player[] = [];

    for (let i = 0; i < TOTAL_PLAYERS; i++) {
      const b   = await chromium.launch({ args: ['--incognito'] });
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
      const page = await ctx.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('webpack-hmr')) return;
      });
      players.push({ browser: b, ctx, page, name: `Player${i}` });
    }

    const host = players[0];
    const dead = new Set<string>(); // tracks dead player names

    const getPage = (name: string) => players.find((p) => p.name === name)!.page;

    function logCounts(label: string) {
      const aliveWolves    = wolves.filter((n) => !dead.has(n));
      const aliveVillagers = villagers.filter((n) => !dead.has(n));
      console.log(`\n📊 [${label}] alive: wolves=${aliveWolves.length} (${aliveWolves.join(', ')}) | villagers=${aliveVillagers.length} (${aliveVillagers.join(', ')}) | dead=[${[...dead].join(', ')}]`);
    }

    try {
      // ══════════════════════════════════════════════════════════════════
      // STEP 1 — Host creates room
      // ══════════════════════════════════════════════════════════════════
      await test.step('Host creates room', async () => {
        await host.page.goto(BASE_URL);
        await host.page.getByRole('button', { name: 'Create Room' }).click();
        await host.page.getByPlaceholder('Enter your name...').fill(host.name);
        await host.page.getByRole('button', { name: 'Create Room' }).click();
        await host.page.waitForSelector('text=Room Code:', { timeout: 10_000 });
        console.log('  Room created ✓');
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 2 — Extract room code
      // ══════════════════════════════════════════════════════════════════
      let roomCode!: string;
      await test.step('Extract room code', async () => {
        const code = await host.page.evaluate((): string => {
          const el = Array.from(document.querySelectorAll('div')).find(
            (d) => d.children.length === 0 && /^[A-Z0-9]{6}$/.test(d.textContent?.trim() ?? '')
          );
          return el?.textContent?.trim() ?? '';
        });
        expect(code).toMatch(/^[A-Z0-9]{6}$/);
        roomCode = code;
        console.log(`  Room code: ${roomCode}`);
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 3 — Other players join
      // ══════════════════════════════════════════════════════════════════
      await test.step(`Players Player1–Player7 join`, async () => {
        await Promise.all(
          players.slice(1).map(async (player) => {
            await player.page.goto(BASE_URL);
            await player.page.getByRole('button', { name: 'Join Room' }).click();
            await player.page.getByPlaceholder('Enter your name...').fill(player.name);
            await player.page.getByPlaceholder('e.g. ABC123').fill(roomCode);
            await player.page.getByRole('button', { name: 'Join' }).click();
            await player.page.waitForSelector('text=Waiting for players...', { timeout: 15_000 });
            console.log(`  ${player.name} joined ✓`);
          })
        );
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 4 — Configure: 2 wolves, 30s discussion
      // ══════════════════════════════════════════════════════════════════
      await test.step(`Set wolf count=${WOLF_COUNT}, discussion=30s`, async () => {
        await host.page.locator('button', { hasText: 'Settings' }).click();
        await host.page.waitForTimeout(500);

        const wolfInput = host.page.locator('input[type="number"]');
        await wolfInput.click();
        await host.page.evaluate((val: string) => {
          const el = document.querySelector('input[type="number"]') as HTMLInputElement;
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, String(WOLF_COUNT));
        expect(await wolfInput.inputValue()).toBe(String(WOLF_COUNT));

        await host.page.locator('select').selectOption('30');
        await host.page.locator('button', { hasText: 'Apply' }).click();
        await host.page.waitForSelector(`text=Players (${TOTAL_PLAYERS})`, { timeout: 15_000 });
        console.log('  Settings applied ✓');
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 5 — Seed roles (deterministic assignment)
      // ══════════════════════════════════════════════════════════════════
      await test.step('Seed roles via API', async () => {
        const res = await fetch(`${BASE_URL.replace('/werewolf', '')}/api/rooms/${roomCode}/seed-roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roles: ROLE_MAP }),
        });
        const json = await res.json() as { ok?: boolean; error?: string };
        expect(json.ok, `seed-roles failed: ${json.error}`).toBe(true);

        // Verify roles were actually written to the server
        const verify = await fetch(`${BASE_URL.replace('/werewolf', '')}/api/rooms/${roomCode}`);
        const { players: serverPlayers } = await verify.json() as { players: { name: string; role: string }[] };
        console.log('\n🔍 Server roles after seeding:');
        for (const sp of serverPlayers) {
          const expected = ROLE_MAP[sp.name] ?? '?';
          const match = sp.role === expected ? '✓' : `✗ expected ${expected}`;
          console.log(`  ${sp.name}: ${sp.role} ${match}`);
        }
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 6 — Start game
      // ══════════════════════════════════════════════════════════════════
      await test.step('Host starts game', async () => {
        await host.page.getByRole('button', { name: 'Start Game' }).click();
        console.log('  Game started ✓');
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 7 — Role reveal
      // ══════════════════════════════════════════════════════════════════
      await test.step('Role reveal → proceed to night', async () => {
        // Player0 is host-only — skip role reveal wait for them
        await Promise.all(
          players.filter((p) => p.name !== 'Player0').map((p) => p.page.waitForSelector('text=Your Role', { timeout: 15_000 }))
        );
        // Log what role each player sees on their own screen
        console.log('\n🎭 Role reveal — each player\'s screen:');
        for (const player of players.filter((p) => p.name !== 'Player0')) {
          const roleText = await player.page.locator('text=Your Role').first().evaluate(
            (el) => (el.closest('section,div,main') as HTMLElement)?.innerText ?? ''
          ).catch(() => '');
          const roleMatch = roleText.match(/(Wolf|Villager|wolf|villager)/i);
          console.log(`  ${player.name} sees: ${roleMatch?.[0] ?? '(unknown)'}`);
        }
        await host.page.getByRole('button', { name: 'Proceed to Night' }).click();
        console.log('  Host proceeded to night ✓');
        logCounts('after role reveal');
      });

      // ══════════════════════════════════════════════════════════════════
      // GAME LOOP — driven by SCENARIO
      // ══════════════════════════════════════════════════════════════════
      let gameEnded = false;

      // Pre-index night victims so day events can mark them dead without DOM scraping
      const nightVictimByDay: Record<number, string> = {};
      for (const e of SCENARIO) {
        if ('night' in e) nightVictimByDay[e.night] = e.victim;
      }

      for (const event of SCENARIO) {
        if (gameEnded) break;

        if ('night' in event) {
          // ── Night Phase ───────────────────────────────────────────────
          await test.step(`Night ${event.night}: wolves kill ${event.victim}`, async () => {
            logCounts(`Night ${event.night} start`);
            console.log(`\n🌙 Night ${event.night}: killing ${event.victim}`);

            await Promise.all(
              players.filter((p) => p.name !== 'Player0').map((p) => waitForAnyPhase(p.page, ['Night falls', 'Win'], 30_000).catch(() => null))
            );
            if (isGameEnded(dead)) { gameEnded = true; return; }

            // Each alive wolf votes to kill the victim
            for (const wolfName of wolves) {
              if (dead.has(wolfName)) continue;
              const wolfPage = getPage(wolfName);
              const hasPanel = (await wolfPage.locator('text=Choose a player to eliminate').count()) > 0;
              if (!hasPanel) { console.log(`  ${wolfName} — no vote panel, skipping`); continue; }

              const allBtns = wolfPage.locator('button');
              const btnCount = await allBtns.count();
              for (let i = 0; i < btnCount; i++) {
                const btn = allBtns.nth(i);
                if (await btn.getAttribute('disabled') !== null) continue;
                const txt = (await btn.textContent()) ?? '';
                if (txt.includes(event.victim) && txt.includes('🏡')) {
                  await btn.click();
                  console.log(`  ${wolfName} voted to kill ${event.victim} ✓`);
                  break;
                }
              }
            }

            await host.page.waitForTimeout(2_000);
            const stillNight = (await host.page.locator('h2:has-text("Night falls")').count()) > 0;
            if (stillNight) {
              const forceBtn = host.page.locator('button', { hasText: 'End Night' });
              if ((await forceBtn.count()) > 0) {
                await forceBtn.click();
                console.log('  Host force-ended night ✓');
              }
            } else {
              console.log('  Night auto-resolved ✓');
            }
          });

        } else {
          // ── Day Discussion Phase ──────────────────────────────────────
          await test.step(`Day ${event.day}: discussion`, async () => {
            logCounts(`Day ${event.day} start`);
            if (isGameEnded(dead)) { gameEnded = true; return; }

            const phase = await waitForAnyPhase(host.page, ['Dawn breaks', 'Win'], 30_000);
            if (phase.includes('Win')) { gameEnded = true; return; }

            // Mark night victim as dead (use scenario map — avoids fragile DOM scraping)
            const nightVictim = nightVictimByDay[event.day];
            if (nightVictim) {
              dead.add(nightVictim);
              console.log(`  ${nightVictim} was killed last night — marked dead`);
            }

            const startVoteBtn = host.page.locator('button', { hasText: 'Start Vote' });
            if ((await startVoteBtn.count()) > 0) {
              await startVoteBtn.click();
              console.log('  Host started vote ✓');
            }
          });

          if (gameEnded) break;

          // ── Day Vote Phase ────────────────────────────────────────────
          await test.step(`Day ${event.day}: vote → ${event.voted}`, async () => {
            console.log(`\n🗳️  Day ${event.day}: voting out ${event.voted}`);

            const votePhase = await waitForAnyPhase(host.page, ['Vote', 'Win'], 45_000);
            if (votePhase.includes('Win')) { gameEnded = true; return; }

            const primaryTarget = event.voted;
            // Fallback for the target themselves (can't self-vote): other alive wolf, else first alive villager
            const fallback =
              wolves.find((w) => w !== primaryTarget && !dead.has(w)) ??
              villagers.find((v) => !dead.has(v))!;
            console.log(`  Target: ${primaryTarget}, fallback for self: ${fallback}`);

            // Exclude Player0 (host-only, no role) and dead players
            const alivePlayers = players.filter((p) => p.name !== 'Player0' && !dead.has(p.name));
            await Promise.all(
              alivePlayers.map(async (player) => {
                const inVote = await player.page
                  .waitForSelector('h2:has-text("Vote")', { timeout: 10_000 })
                  .then(() => true).catch(() => false);
                if (!inVote) return;

                const targetName = player.name === primaryTarget ? fallback : primaryTarget;
                const allBtns = player.page.locator('button');
                const btnCount = await allBtns.count();
                for (let i = 0; i < btnCount; i++) {
                  const btn = allBtns.nth(i);
                  if (await btn.getAttribute('disabled') !== null) continue;
                  const txt = (await btn.textContent()) ?? '';
                  if (
                    txt.includes(targetName) &&
                    !txt.includes('(You)') &&
                    !txt.includes('End Early') &&
                    !txt.includes('Leave') &&
                    txt.trim() !== ''
                  ) {
                    await btn.click().catch(() => {});
                    console.log(`  ${player.name} voted for ${targetName}`);
                    break;
                  }
                }
              })
            );

            await host.page.waitForTimeout(2_000);
            const forceDay = host.page.locator('button', { hasText: 'End Early' });
            if ((await forceDay.count()) > 0 && (await host.page.locator('h2:has-text("Vote")').count()) > 0) {
              await forceDay.click();
              console.log('  Host force-ended vote ✓');
              await host.page
                .waitForSelector('h2:has-text("Vote")', { state: 'hidden', timeout: 15_000 })
                .catch(() => {});
            }
          });

          if (gameEnded) break;

          // ── Defense Phase ─────────────────────────────────────────────
          await test.step(`Day ${event.day}: defense (${event.voted} defends, success=${event.is_defense_successful})`, async () => {
            console.log(`\n⚖️  Day ${event.day}: defense for ${event.voted}`);

            const afterVote = await waitForAnyPhase(
              host.page, ['Final Defense', 'Night falls', 'Dawn breaks', 'Win'], 30_000
            );
            if (afterVote.includes('Win')) { gameEnded = true; return; }
            if (!afterVote.includes('Final Defense')) {
              console.log(`  No defense phase (phase: "${afterVote.trim()}")`);
              return;
            }

            if (!event.is_defense_successful) {
              // Defender skips → wolf is eliminated
              const defenderPage = getPage(event.voted);
              const skipBtn = defenderPage.locator('button', { hasText: 'Skip' }).first();
              if ((await skipBtn.count()) > 0) {
                await skipBtn.click();
                console.log(`  ${event.voted} skipped defense ✓`);
              } else {
                // Fallback: host skip button
                const hostSkip = host.page.locator('button', { hasText: 'Skip Defense' });
                if ((await hostSkip.count()) > 0) {
                  await hostSkip.click();
                  console.log('  Host skipped defense (fallback) ✓');
                }
              }
            } else {
              console.log(`  Defense not skipped — waiting for auto-advance`);
            }

            // Wait for UI to show either Villagers Win banner or next phase
            const afterDefend = await waitForAnyPhase(host.page, ['Villagers Win', 'Night falls', 'Dawn breaks'], 20_000);
            console.log(`  After defense: "${afterDefend.trim()}"`);
            if (afterDefend.includes('Villagers Win')) { gameEnded = true; return; }

            // Mark the voted-out player dead
            dead.add(event.voted);
            console.log(`  ${event.voted} eliminated → marked dead`);
            logCounts(`Day ${event.day} after defense`);
          });
        }
      }

      // ══════════════════════════════════════════════════════════════════
      // FINAL VERIFICATION
      // ══════════════════════════════════════════════════════════════════

      await test.step(`Verify: ${EXPECTED_WINNER}`, async () => {
        console.log('\n🏆 Waiting for winner banner...');
        const winText = await waitForAnyPhase(host.page, ['Villagers Win'], 30_000);
        console.log(`  Winner banner: "${winText.trim()}"`);
        expect(winText, 'Villagers Win banner should be visible').toContain('Villagers Win');

        expect(
          await host.page.locator('text=The Wolves were:').count(),
          'Wolf reveal panel should be visible'
        ).toBeGreaterThan(0);

        const endGameBtn = host.page.locator('button', { hasText: 'End Game' });
        if ((await endGameBtn.count()) > 0) {
          await endGameBtn.click();
          console.log('  Host ended game ✓');
        }
      });

    } finally {
      for (const player of players) {
        await player.ctx.close().catch(() => {});
        await player.browser.close().catch(() => {});
      }
    }
  });
});
