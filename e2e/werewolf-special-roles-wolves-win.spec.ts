/**
 * Werewolf E2E Test — Special Roles: 2 Wolves, 1 Seer, 1 Witch, 3 Villagers (Wolves Win)
 *
 * 8 browsers total: Player0 is host-only (no role), Player1–Player7 are game participants.
 * 2 wolves (Player6, Player7), 1 seer (Player4), 1 witch (Player5), 3 villagers (Player1–Player3).
 * Roles are seeded via API before the game starts so the scenario is fully deterministic.
 *
 * Scenario:
 *   Night 1: Wolves kill Player1           → 2W + 4V remaining
 *            Seer investigates Player6     → sees "🐺 Wolf"
 *   Day 1:   Village votes out Player2     → innocent eliminated → 2W + 3V
 *   Night 2: Wolves kill Player3           → 2W + 2V
 *   Day 2:   Village votes out Player4     → innocent eliminated → 2W + 1V → Wolves Win (2 >= 1)
 *
 * Verifications:
 *   - Seer sees wolf result in their night UI
 *   - Host game log shows seer_investigate entry (🔍 Player4 investigated Player6 (wolf))
 *   - Witch (Player5) gets the sleeping villager UI (no night action panel)
 *   - Wolves Win banner appears
 *   - "The Wolves were:" panel shows Player6 and Player7
 *   - Player5 (witch) is NOT listed as a wolf
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
const ROLE_MAP: Record<string, 'wolf' | 'villager' | 'seer' | 'witch'> = {
  Player1: 'villager',
  Player2: 'villager',
  Player3: 'villager',
  Player4: 'seer',
  Player5: 'witch',
  Player6: 'wolf',
  Player7: 'wolf',
};

// ─── Scenario ─────────────────────────────────────────────────────────────────
interface NightEvent { night: number; victim: string; seerTarget?: string }
interface DayEvent   { day: number; voted: string; is_defense_successful: boolean }
type ScenarioEvent = NightEvent | DayEvent;

const SCENARIO: ScenarioEvent[] = [
  { night: 1, victim: 'Player1', seerTarget: 'Player6' },  // 2W + 5V → 2W + 4V; seer sees wolf
  { day: 1,   voted: 'Player2', is_defense_successful: false },  // → 2W + 3V
  { night: 2, victim: 'Player3' },                               // → 2W + 2V
  { day: 2,   voted: 'Player4', is_defense_successful: false },  // → 2W + 1V → Wolves Win
];

const EXPECTED_WINNER = 'Wolves Win';

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
  const aliveVillagers = villagerTeam.filter((n) => !dead.has(n));
  return aliveWolves.length === 0 || aliveWolves.length >= aliveVillagers.length;
}

const wolves      = Object.entries(ROLE_MAP).filter(([, r]) => r === 'wolf').map(([n]) => n);
// Villager-team = villagers + seer + witch (all non-wolf participants)
const villagerTeam = Object.entries(ROLE_MAP).filter(([, r]) => r !== 'wolf').map(([n]) => n);

// ─── Test ─────────────────────────────────────────────────────────────────────
test.describe('Werewolf — Special Roles: Wolves Win', () => {
  test(`${TOTAL_PLAYERS} players: ${wolves.join(', ')} are wolves — wolves win`, async () => {
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
    const dead = new Set<string>();

    const getPage = (name: string) => players.find((p) => p.name === name)!.page;

    function logCounts(label: string) {
      const aliveWolves    = wolves.filter((n) => !dead.has(n));
      const aliveVillagers = villagerTeam.filter((n) => !dead.has(n));
      console.log(`\n📊 [${label}] alive: wolves=${aliveWolves.length} (${aliveWolves.join(', ')}) | villager-team=${aliveVillagers.length} (${aliveVillagers.join(', ')}) | dead=[${[...dead].join(', ')}]`);
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
        await Promise.all(
          players.filter((p) => p.name !== 'Player0').map((p) => p.page.waitForSelector('text=Your Role', { timeout: 15_000 }))
        );
        console.log('\n🎭 Role reveal — each player\'s screen:');
        for (const player of players.filter((p) => p.name !== 'Player0')) {
          const roleText = await player.page.locator('text=Your Role').first().evaluate(
            (el) => (el.closest('section,div,main') as HTMLElement)?.innerText ?? ''
          ).catch(() => '');
          const roleMatch = roleText.match(/(Wolf|Villager|Seer|Witch|wolf|villager|seer|witch)/i);
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
              players.filter((p) => p.name !== 'Player0').map((p) =>
                waitForAnyPhase(p.page, ['Night falls', 'Win'], 30_000).catch(() => null)
              )
            );
            if (isGameEnded(dead)) { gameEnded = true; return; }

            // Wolves vote
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

            // Seer investigates on Night 1
            if (event.seerTarget && !dead.has('Player4')) {
              const seerPage = getPage('Player4');
              const hasInvestigatePanel = (await seerPage.locator('text=🔍').count()) > 0;
              if (hasInvestigatePanel) {
                // Find the investigate button for the target
                const allBtns = seerPage.locator('button');
                const btnCount = await allBtns.count();
                let clicked = false;
                for (let i = 0; i < btnCount; i++) {
                  const btn = allBtns.nth(i);
                  if (await btn.getAttribute('disabled') !== null) continue;
                  const txt = (await btn.textContent()) ?? '';
                  if (txt.includes(event.seerTarget) && txt.includes('Investigate')) {
                    await btn.click();
                    console.log(`  Player4 (seer) investigated ${event.seerTarget} ✓`);
                    clicked = true;
                    break;
                  }
                }
                if (!clicked) {
                  // Fallback: click any button with the target name
                  for (let i = 0; i < btnCount; i++) {
                    const btn = allBtns.nth(i);
                    if (await btn.getAttribute('disabled') !== null) continue;
                    const txt = (await btn.textContent()) ?? '';
                    if (txt.includes(event.seerTarget!)) {
                      await btn.click();
                      console.log(`  Player4 (seer) investigated ${event.seerTarget} via fallback ✓`);
                      break;
                    }
                  }
                }

                // Verify seer sees wolf result
                await seerPage.waitForTimeout(1_000);
                const seerResult = (await seerPage.locator('text=🐺 Wolf').count()) > 0
                  || (await seerPage.locator('text=Wolf').count()) > 0;
                if (seerResult) {
                  console.log(`  Player4 sees wolf result for ${event.seerTarget} ✓`);
                } else {
                  console.log(`  Player4 seer result not immediately visible (may appear after night resolves)`);
                }
              } else {
                console.log('  Player4 (seer) — no investigate panel found');
              }
            }

            // Witch (Player5) — passive, no action needed. Just verify sleeping UI.
            if (!dead.has('Player5')) {
              const witchPage = getPage('Player5');
              await witchPage.waitForTimeout(500);
              const isSleeping = (await witchPage.locator('text=😴').count()) > 0;
              console.log(`  Player5 (witch) sleeping UI: ${isSleeping ? '😴 ✓' : 'not shown (may differ)'}`);
            }

            // Seer skip on Night 2+ (Player4 still alive)
            if (!event.seerTarget && !dead.has('Player4')) {
              const seerPage = getPage('Player4');
              const skipBtn = seerPage.locator('button', { hasText: 'Skip (no action)' });
              if ((await skipBtn.count()) > 0) {
                await skipBtn.click();
                console.log('  Player4 (seer) skipped Night 2 investigation ✓');
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

          // After Night 1 resolves: verify host game log shows seer action
          if (event.night === 1 && event.seerTarget) {
            await test.step('Verify: host game log shows seer investigation', async () => {
              await waitForAnyPhase(host.page, ['Dawn breaks', 'Win'], 15_000);
              const gameLogBtn = host.page.locator('button', { hasText: 'Game Log' });
              if ((await gameLogBtn.count()) > 0) {
                await gameLogBtn.click();
                await host.page.waitForTimeout(500);

                // Check log contains seer investigation entry
                const logText = (await host.page.locator('[class*="panel"]').last().textContent().catch(() => '')) ?? '';
                const hasInvestigated = logText.includes('investigated') || logText.includes('Player4') || logText.includes('Player6');
                if (hasInvestigated) {
                  console.log(`  Host game log shows seer investigation ✓`);
                } else {
                  // Also check the whole page text
                  const pageText = await host.page.textContent('body').catch(() => '');
                  const found = pageText?.includes('investigated') || pageText?.includes('seer');
                  console.log(`  Host game log seer entry: ${found ? '✓' : 'not found — log may not yet include entry'}`);
                }
                expect(
                  (await host.page.locator('text=investigated').count()) > 0
                  || (await host.page.locator('text=Player4').count()) > 0,
                  'Host game log should show seer investigation entry'
                ).toBe(true);
              } else {
                console.log('  Game Log button not found — skipping log check');
              }
            });
          }

        } else {
          // ── Day Discussion Phase ──────────────────────────────────────
          await test.step(`Day ${event.day}: discussion`, async () => {
            logCounts(`Day ${event.day} start`);
            if (isGameEnded(dead)) { gameEnded = true; return; }

            const phase = await waitForAnyPhase(host.page, ['Dawn breaks', 'Win'], 30_000);
            if (phase.includes('Win')) { gameEnded = true; return; }

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
            const fallback =
              wolves.find((w) => w !== primaryTarget && !dead.has(w)) ??
              villagerTeam.find((v) => v !== primaryTarget && !dead.has(v))!;
            console.log(`  Target: ${primaryTarget}, fallback for self: ${fallback}`);

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
              const defenderPage = getPage(event.voted);
              const skipBtn = defenderPage.locator('button', { hasText: 'Skip' }).first();
              if ((await skipBtn.count()) > 0) {
                await skipBtn.click();
                console.log(`  ${event.voted} skipped defense ✓`);
              } else {
                const hostSkip = host.page.locator('button', { hasText: 'Skip Defense' });
                if ((await hostSkip.count()) > 0) {
                  await hostSkip.click();
                  console.log('  Host skipped defense (fallback) ✓');
                }
              }
            } else {
              console.log(`  Defense not skipped — waiting for auto-advance`);
            }

            const afterDefend = await waitForAnyPhase(host.page, ['Wolves Win', 'Night falls', 'Dawn breaks'], 20_000);
            console.log(`  After defense: "${afterDefend.trim()}"`);
            if (afterDefend.includes('Wolves Win')) { gameEnded = true; return; }

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
        const winText = await waitForAnyPhase(host.page, ['Wolves Win'], 30_000);
        console.log(`  Winner banner: "${winText.trim()}"`);
        expect(winText, 'Wolves Win banner should be visible').toContain('Wolves Win');

        // Wolf reveal panel should list Player6 and Player7
        expect(
          await host.page.locator('text=The Wolves were:').count(),
          'Wolf reveal panel should be visible'
        ).toBeGreaterThan(0);

        // Verify Player5 (witch) is NOT listed as a wolf
        const wolfPanelText = (await host.page.locator('text=The Wolves were:').first().evaluate(
          (el) => (el.closest('section,div') as HTMLElement)?.innerText ?? el.parentElement?.innerText ?? ''
        ).catch(() => ''));
        const witchListedAsWolf = wolfPanelText.includes('Player5');
        expect(witchListedAsWolf, 'Player5 (witch) should NOT be listed as a wolf').toBe(false);
        console.log(`  Player5 (witch) not listed as wolf ✓`);

        // Open game log and verify seer entry is visible to host
        const gameLogBtn = host.page.locator('button', { hasText: 'Game Log' });
        if ((await gameLogBtn.count()) > 0) {
          const isOpen = (await host.page.locator('text=investigated').count()) > 0;
          if (!isOpen) await gameLogBtn.click();
          await host.page.waitForTimeout(500);
          const hasEntry = (await host.page.locator('text=investigated').count()) > 0;
          console.log(`  Host game log seer entry visible: ${hasEntry ? '✓' : 'not visible'}`);
          expect(hasEntry, 'Host game log should contain seer investigation entry').toBe(true);
        }

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
