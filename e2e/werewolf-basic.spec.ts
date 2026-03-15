/**
 * Werewolf E2E Test — Basic Game: 2 Wolves vs 5 Villagers (7 players total)
 *
 * Simulates a full multiplayer game by running 7 browser contexts in one test.
 * Each context is an independent "player" with their own WebSocket session.
 *
 * Run:
 *   npm run test:e2e           — headless (fastest)
 *   npm run test:e2e:headed    — watch browsers open
 *   npm run test:e2e:ui        — Playwright UI mode (live progress in browser ← recommended)
 *   npm run test:e2e:report    — open HTML report after test finishes
 */

import { test, expect, BrowserContext, Page } from '@playwright/test';

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:9999/werewolf';
const TOTAL_PLAYERS = 7;
const WOLF_COUNT = 2;
const MAX_ROUNDS = 20;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Player {
  ctx: BrowserContext;
  page: Page;
  name: string;
  role: 'wolf' | 'villager' | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Wait until an h2 heading with matching text appears. */
async function waitForPhase(page: Page, headingText: string, timeout = 25_000) {
  await page.waitForSelector(`h2:has-text("${headingText}")`, { timeout });
}

/** Return the current h2 text (phase heading). */
async function getPhaseHeading(page: Page): Promise<string> {
  return (await page.locator('h2').first().textContent().catch(() => '')) ?? '';
}

/** True when the game-ended screen is visible. */
async function isGameEnded(page: Page): Promise<boolean> {
  const h2 = await getPhaseHeading(page);
  return h2.includes('Win');
}

/** Log a step both to console and as a Playwright annotation. */
function log(msg: string) {
  console.log(msg);
}

// ─── Test ─────────────────────────────────────────────────────────────────────

test.describe('Werewolf — Basic Game (2 Wolves vs 5 Villagers)', () => {
  test(`Full game with ${TOTAL_PLAYERS} players`, async ({ browser }) => {
    const players: Player[] = [];

    // ── Spin up one browser context per player ────────────────────────────
    for (let i = 0; i < TOTAL_PLAYERS; i++) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      // Suppress noisy HMR WebSocket errors in console
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('webpack-hmr')) return;
      });
      players.push({ ctx, page, name: `Player${i + 1}`, role: null });
    }

    const host = players[0];

    try {
      // ════════════════════════════════════════════════════════════════════
      // STEP 1 — Host creates room
      // ════════════════════════════════════════════════════════════════════
      await test.step('Host creates room', async () => {
        log('\n🏠 Step 1: Creating room...');
        await host.page.goto(BASE_URL);
        await host.page.getByRole('button', { name: 'Create Room' }).click();
        await host.page.getByPlaceholder('Enter your name...').fill(host.name);
        await host.page.getByRole('button', { name: 'Create Room' }).click();
        await host.page.waitForSelector('text=Room Code:', { timeout: 10_000 });
        log('  Room created successfully');
      });

      // ════════════════════════════════════════════════════════════════════
      // STEP 2 — Extract room code
      // ════════════════════════════════════════════════════════════════════
      let roomCode: string;

      await test.step('Extract room code', async () => {
        // The room code is a 6-char uppercase alphanumeric displayed prominently
        const code = await host.page.evaluate((): string => {
          const allDivs = Array.from(document.querySelectorAll('div'));
          const el = allDivs.find((d) =>
            d.children.length === 0 && /^[A-Z0-9]{6}$/.test(d.textContent?.trim() ?? '')
          );
          return el?.textContent?.trim() ?? '';
        });
        expect(code, 'Room code should be 6 uppercase chars').toMatch(/^[A-Z0-9]{6}$/);
        roomCode = code;
        log(`  Room code: ${roomCode}`);
        await host.page.screenshot({ path: `playwright-report/step1-room-created.png` });
      });

      // ════════════════════════════════════════════════════════════════════
      // STEP 3 — Other players join (in parallel)
      // ════════════════════════════════════════════════════════════════════
      await test.step(`${TOTAL_PLAYERS - 1} players join`, async () => {
        log(`\n👥 Step 3: Players 2–${TOTAL_PLAYERS} joining...`);
        await Promise.all(
          players.slice(1).map(async (player) => {
            await player.page.goto(BASE_URL);
            await player.page.getByRole('button', { name: 'Join Room' }).click();
            await player.page.getByPlaceholder('Enter your name...').fill(player.name);
            await player.page.getByPlaceholder('e.g. ABC123').fill(roomCode);
            await player.page.getByRole('button', { name: 'Join' }).click();
            await player.page.waitForSelector('text=Waiting for players...', {
              timeout: 15_000,
            });
            log(`  ${player.name} joined ✓`);
          })
        );
        log(`  All ${TOTAL_PLAYERS - 1} players joined ✓`);
      });

      // ════════════════════════════════════════════════════════════════════
      // STEP 4 — Host configures wolf count = 2
      // NOTE: update_settings triggers a broadcast, so after this the host's
      //       UI will reflect all 7 players who are now in roomSockets.
      // ════════════════════════════════════════════════════════════════════
      await test.step(`Set wolf count to ${WOLF_COUNT}`, async () => {
        log(`\n⚙️  Step 4: Setting ${WOLF_COUNT} wolves...`);
        // Open Settings panel
        await host.page.locator('button', { hasText: 'Settings' }).click();
        await host.page.waitForTimeout(500); // wait for panel to render

        // Use native value setter + input event to properly trigger React's onChange
        // (Playwright's fill/type can be blocked by React's controlled input mechanism)
        await host.page.evaluate((value) => {
          const input = document.querySelector('input[type="number"]') as HTMLInputElement;
          if (!input) return;
          // Use the native setter to bypass React's internal value tracking
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          nativeSetter?.call(input, String(value));
          // Fire both 'input' and 'change' events so React's synthetic events fire
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, WOLF_COUNT);

        // Verify the input value was set
        const inputVal = await host.page.locator('input[type="number"]').inputValue();
        log(`  Wolf count input value: ${inputVal}`);

        // Apply — sends update_settings → server broadcasts to all 7 players
        await host.page.locator('button', { hasText: 'Apply' }).click();
        log(`  Wolf count applied ✓`);

        // Now the host's view is updated via broadcast — verify all 7 players visible
        await host.page.waitForSelector(`text=Players (${TOTAL_PLAYERS})`, {
          timeout: 15_000,
        });
        log(`  All ${TOTAL_PLAYERS} players confirmed in lobby ✓`);
        await host.page.screenshot({ path: `playwright-report/step4-lobby-full.png` });
      });

      // ════════════════════════════════════════════════════════════════════
      // STEP 5 — Start game
      // ════════════════════════════════════════════════════════════════════
      await test.step('Host starts game', async () => {
        log('\n🎮 Step 5: Starting game...');
        await host.page.getByRole('button', { name: 'Start Game' }).click();
      });

      // ════════════════════════════════════════════════════════════════════
      // STEP 6 — Role reveal
      // ════════════════════════════════════════════════════════════════════
      await test.step('Role reveal phase', async () => {
        log('\n🎭 Step 6: Role reveal...');
        await Promise.all(
          players.map((p) => p.page.waitForSelector('text=Your Role', { timeout: 15_000 }))
        );

        // Debug: check the wolf count from the host's game state
        const hostGameInfo = await host.page.evaluate(() => {
          // React fiber inspection to get gameState would be complex;
          // instead read visible text that shows wolf count
          return document.body.innerText;
        });
        // The role_reveal page shows wolf pack info for wolves
        const wolfPackVisible = hostGameInfo.includes('Your pack');
        log(`  Host sees wolf pack info: ${wolfPackVisible}`);
        // Also check if wolfCount setting is visible
        const wolfCountMatch = hostGameInfo.match(/Wolf Count[^\d]*(\d+)/);
        if (wolfCountMatch) log(`  Wolf count in UI: ${wolfCountMatch[1]}`);
        // Screenshot each player's role card
        for (const player of players) {
          await player.page.screenshot({
            path: `playwright-report/role-${player.name}.png`,
          });
        }
        log('  All players see their role cards ✓');

        // Host proceeds to night
        await host.page.getByRole('button', { name: 'Proceed to Night' }).click();
        log('  Host proceeded to night ✓');
      });

      // ════════════════════════════════════════════════════════════════════
      // GAME LOOP
      // ════════════════════════════════════════════════════════════════════
      let round = 0;
      let gameEnded = false;

      while (!gameEnded && round < MAX_ROUNDS) {
        round++;

        // ── Night Phase ──────────────────────────────────────────────────
        await test.step(`Round ${round}: Night phase`, async () => {
          log(`\n🌙 === Round ${round}: Night Phase ===`);

          // Wait for all players to enter night phase
          await Promise.all(
            players.map((p) => waitForPhase(p.page, 'Night falls', 25_000).catch(() => null))
          );

          // On first round, detect each player's role from the UI.
          // "wolves voted" only appears in the wolf panel (after WebSocket state loads).
          // We poll all 7 pages IN PARALLEL (max ~10s total) to avoid timing issues.
          if (round === 1) {
            log('  Detecting roles in parallel (polling for wolf indicator)...');
            const roleResults = await Promise.all(
              players.map((player) =>
                player.page.evaluate(async (): Promise<boolean> => {
                  // "wolves voted" text only renders in the wolf night panel
                  for (let i = 0; i < 20; i++) {
                    if (document.body.innerText.includes('wolves voted')) return true;
                    await new Promise((r) => setTimeout(r, 500));
                  }
                  return false; // not a wolf after 10s
                })
              )
            );
            for (let i = 0; i < players.length; i++) {
              players[i].role = roleResults[i] ? 'wolf' : 'villager';
              log(`  ${players[i].name}: ${players[i].role} ${players[i].role === 'wolf' ? '🐺' : '🏡'}`);
            }
            const detectedWolves = players.filter((p) => p.role === 'wolf').length;
            log(`  Detected ${detectedWolves} wolves (expected ${WOLF_COUNT})`);
          }

          // Wolves vote for the first available villager
          const wolves = players.filter((p) => p.role === 'wolf');
          for (const wolf of wolves) {
            const hasVotePanel =
              (await wolf.page.locator('text=Choose a player to eliminate').count()) > 0;
            if (!hasVotePanel) {
              log(`  ${wolf.name} (wolf) has no vote panel — likely eliminated`);
              continue;
            }
            // Target: first enabled button in the wolf vote list
            const targetBtns = wolf.page.locator('button').filter({ hasText: '🏡' });
            const btnCount = await targetBtns.count();
            if (btnCount > 0) {
              // Find first enabled (not already voted)
              for (let i = 0; i < btnCount; i++) {
                const btn = targetBtns.nth(i);
                const disabled = await btn.getAttribute('disabled');
                if (disabled === null) {
                  const targetName = await btn.textContent();
                  await btn.click();
                  log(`  ${wolf.name} (wolf) voted for: ${targetName?.trim()}`);
                  break;
                }
              }
            }
          }

          // Give wolves a moment, then host force-resolves night
          await host.page.waitForTimeout(2_000);
          // Check if still in night phase before force-resolving
          const stillNight = (await host.page.locator('h2:has-text("Night falls")').count()) > 0;
          if (stillNight) {
            const forceBtn = host.page.locator('button', { hasText: 'End Night' });
            if ((await forceBtn.count()) > 0) {
              await forceBtn.click();
              log('  Host force-resolved night ✓');
            } else {
              log('  ⚠️ End Night button not found on host page');
              const h2 = await host.page.locator('h2').first().textContent();
              log(`  Host page shows: "${h2}"`);
            }
          } else {
            log('  Night auto-resolved (all wolves voted)');
          }

          await host.page.screenshot({
            path: `playwright-report/round${round}-after-night.png`,
          });
        });

        // Check if game ended right after night
        gameEnded = await isGameEnded(host.page);
        if (gameEnded) {
          log('  Game ended after night phase!');
          break;
        }

        // ── Day Discussion Phase ─────────────────────────────────────────
        await test.step(`Round ${round}: Day discussion`, async () => {
          log(`\n☀️  Round ${round}: Day Discussion`);
          await waitForPhase(host.page, 'Dawn breaks', 20_000);

          // Read elimination announcement
          const eliminated = await host.page
            .locator('strong')
            .filter({ hasText: /\w/ })
            .first()
            .textContent()
            .catch(() => null);
          if (eliminated) log(`  Last night: ${eliminated} was eliminated`);

          // Host immediately triggers vote (skip discussion timer)
          const startVoteBtn = host.page.getByRole('button', { name: 'Start Vote' });
          if ((await startVoteBtn.count()) > 0) {
            await startVoteBtn.click();
            log('  Host started vote ✓');
          }
        });

        // ── Day Vote Phase ───────────────────────────────────────────────
        await test.step(`Round ${round}: Day vote`, async () => {
          log(`\n🗳️  Round ${round}: Day Vote`);
          await waitForPhase(host.page, 'Vote', 15_000);

          // All alive players vote for first eligible candidate
          await Promise.all(
            players.map(async (player) => {
              // Check we're in vote phase
              const inVote =
                (await player.page.locator('h2:has-text("Vote")').count()) > 0;
              if (!inVote) return;

              // Find first enabled button that isn't a control button
              const allBtns = player.page.locator('button');
              const btnCount = await allBtns.count();

              for (let i = 0; i < btnCount; i++) {
                const btn = allBtns.nth(i);
                const disabled = await btn.getAttribute('disabled');
                if (disabled !== null) continue;

                const txt = (await btn.textContent()) ?? '';
                // Skip control buttons (End Early, Leave, etc.)
                if (
                  txt.includes('End Early') ||
                  txt.includes('Leave') ||
                  txt.includes('You)') ||
                  txt.trim() === ''
                )
                  continue;

                await btn.click().catch(() => {});
                log(`  ${player.name} voted`);
                break;
              }
            })
          );

          // Give auto-resolve a moment; if not resolved, host force-resolves
          await host.page.waitForTimeout(2_000);
          const forceDay = host.page.locator('button', { hasText: 'End Early' });
          if ((await forceDay.count()) > 0) {
            // Check still in vote phase (not auto-resolved yet)
            const stillVoting =
              (await host.page.locator('h2:has-text("Vote")').count()) > 0;
            if (stillVoting) {
              await forceDay.click();
              log('  Host force-resolved vote ✓');
            }
          }

          await host.page.screenshot({
            path: `playwright-report/round${round}-after-vote.png`,
          });
        });

        // Check if game ended after vote
        gameEnded = await isGameEnded(host.page);
        if (gameEnded) {
          log('  Game ended after vote!');
          break;
        }

        // ── Day Defend Phase (optional) ──────────────────────────────────
        await test.step(`Round ${round}: Defense phase (if any)`, async () => {
          const defensePhase = await host.page
            .waitForSelector('h2:has-text("Final Defense")', { timeout: 5_000 })
            .catch(() => null);

          if (!defensePhase) {
            log('  No defense phase this round');
            return;
          }

          log(`\n⚖️  Round ${round}: Defense Phase`);

          // Find the defender across all player tabs and have them skip
          let defenderHandled = false;
          for (const player of players) {
            const isDefender =
              (await player.page.locator('text=You are being voted out').count()) > 0;
            if (isDefender) {
              // Defender skips
              const skipBtn = player.page.locator('button', { hasText: 'Skip' }).first();
              if ((await skipBtn.count()) > 0) {
                await skipBtn.click();
                log(`  ${player.name} (defender) skipped defense`);
              }
              defenderHandled = true;
              break;
            }
          }

          // Fallback: host skips if defender didn't handle it
          if (!defenderHandled) {
            const hostSkip = host.page.locator('button', { hasText: 'Skip Defense' });
            if ((await hostSkip.count()) > 0) {
              await hostSkip.click();
              log('  Host skipped defense');
            }
          }
        });

        // Final game-ended check before next round
        gameEnded = await isGameEnded(host.page);
      }

      // ════════════════════════════════════════════════════════════════════
      // FINAL VERIFICATION
      // ════════════════════════════════════════════════════════════════════
      await test.step('Verify game ended with a winner', async () => {
        log('\n🏆 === Game Ended ===');
        expect(gameEnded, 'Game should have ended within max rounds').toBe(true);

        const winnerText = await getPhaseHeading(host.page);
        log(`  Winner banner: "${winnerText}"`);
        expect(winnerText).toMatch(/Win/);

        // Screenshot end screen for all players
        for (const player of players) {
          const heading = await getPhaseHeading(player.page).catch(() => '');
          log(`  ${player.name} sees: "${heading}"`);
          await player.page.screenshot({
            path: `playwright-report/end-${player.name}.png`,
          });
        }

        // Verify wolves are revealed (end screen shows wolf names)
        const wolvesPanel = await host.page.locator('text=The Wolves were:').count();
        expect(wolvesPanel, 'Wolf reveal panel should be visible').toBeGreaterThan(0);

        // Host ends game (cleanup)
        const endGameBtn = host.page.locator('button', { hasText: 'End Game' });
        if ((await endGameBtn.count()) > 0) {
          await endGameBtn.click();
          log('  Host clicked End Game — room closed ✓');
        }
      });
    } finally {
      // Always close all browser contexts
      log('\n🧹 Cleaning up browser contexts...');
      for (const player of players) {
        await player.ctx.close().catch(() => {});
      }
    }
  });
});
