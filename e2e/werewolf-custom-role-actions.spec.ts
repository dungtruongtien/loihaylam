/**
 * Werewolf E2E Test — Custom Role Actions
 *
 * Verifies Feature 2: Custom Role Actions
 *
 * Setup:
 *   - 5 browsers: Player0 (host), Player1–Player4 (game participants)
 *   - 1 wolf (Player4), 3 villagers (Player1–Player3), 1 custom role "Spy" (Player1)
 *   - Custom role "Spy" has two actions: "Observe", "Sabotage"
 *
 * What is tested:
 *   1. Host can add a custom role with actions in Lobby
 *   2. After game starts, Player1 (Spy) sees action buttons
 *   3. Player1 fires "Observe" action — toast confirms "logged to host"
 *   4. Player1 fires "Sabotage" action
 *   5. Host opens Game Log — both custom_action entries appear
 *
 * Run:
 *   npm run test:e2e                         — all tests headless
 *   npx playwright test werewolf-custom-role-actions --headed
 */

import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

const BASE_URL      = 'http://localhost:9999/werewolf';
const API_BASE      = 'http://localhost:9999';
const TOTAL_PLAYERS = 5;   // Player0 (host) + Player1–Player4

const CUSTOM_ROLE_NAME    = 'Spy';
const CUSTOM_ROLE_DESC    = 'Watches from the shadows';
const CUSTOM_ROLE_ACTIONS = 'Observe, Sabotage';   // comma-separated, as typed in the input

// Seed: Player1 gets the custom role, Player4 is wolf, rest are villagers
const ROLE_MAP: Record<string, string> = {
  Player1: CUSTOM_ROLE_NAME,
  Player2: 'villager',
  Player3: 'villager',
  Player4: 'wolf',
};

interface Player { browser: Browser; ctx: BrowserContext; page: Page; name: string }

async function waitForText(page: Page, text: string, timeout = 20_000) {
  await page.waitForSelector(`text=${text}`, { timeout });
}

// ─── Test ─────────────────────────────────────────────────────────────────────
test.describe('Werewolf — Custom Role Actions', () => {
  test('host adds custom role with actions; player fires actions; host sees them in game log', async () => {
    const players: Player[] = [];

    for (let i = 0; i < TOTAL_PLAYERS; i++) {
      const b   = await chromium.launch({ args: ['--incognito'] });
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
      const page = await ctx.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('webpack-hmr')) return;
        if (msg.type() === 'log') console.log(`  [${`Player${i}`}] ${msg.text()}`);
      });
      players.push({ browser: b, ctx, page, name: `Player${i}` });
    }

    const host = players[0];
    const spy  = players[1];   // Player1 — gets the Spy role
    let roomCode!: string;

    try {
      // ══════════════════════════════════════════════════════════════════
      // STEP 1 — Host creates room
      // ══════════════════════════════════════════════════════════════════
      await test.step('Host creates room', async () => {
        await host.page.goto(BASE_URL);
        await host.page.getByRole('button', { name: 'Create Room' }).click();
        await host.page.getByPlaceholder('Enter your name...').fill(host.name);
        await host.page.getByRole('button', { name: 'Create Room' }).click();
        await waitForText(host.page, 'Room Code:');
        console.log('  Room created ✓');
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 2 — Extract room code
      // ══════════════════════════════════════════════════════════════════
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
      await test.step('Players Player1–Player4 join', async () => {
        await Promise.all(
          players.slice(1).map(async (player) => {
            await player.page.goto(BASE_URL);
            await player.page.getByRole('button', { name: 'Join Room' }).click();
            await player.page.getByPlaceholder('Enter your name...').fill(player.name);
            await player.page.getByPlaceholder('e.g. ABC123').fill(roomCode);
            await player.page.getByRole('button', { name: 'Join' }).click();
            await waitForText(player.page, 'Waiting for players...');
            console.log(`  ${player.name} joined ✓`);
          })
        );
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 4 — Host adds custom role "Spy" with actions via Lobby UI
      // ══════════════════════════════════════════════════════════════════
      await test.step(`Host adds custom role "${CUSTOM_ROLE_NAME}" with actions: ${CUSTOM_ROLE_ACTIONS}`, async () => {
        // Open Role Config panel
        await host.page.locator('button', { hasText: 'Role Config' }).click();
        await host.page.waitForTimeout(500);

        // Fill in role name
        await host.page.getByPlaceholder('Role name').fill(CUSTOM_ROLE_NAME);
        // Fill in role description
        await host.page.getByPlaceholder('Short description').fill(CUSTOM_ROLE_DESC);
        // Fill in actions
        await host.page.getByPlaceholder(/actions/i).fill(CUSTOM_ROLE_ACTIONS);

        // Click Add Custom Role
        await host.page.getByRole('button', { name: /add custom role/i }).click();
        await host.page.waitForTimeout(500);

        // Verify the role appears in the list with its actions
        const roleConfig = host.page.locator(`text=${CUSTOM_ROLE_NAME}`).first();
        await expect(roleConfig).toBeVisible({ timeout: 5_000 });

        // Verify actions are shown (first action from the comma-separated list)
        const actionsLabel = host.page.locator('text=Actions: Observe, Sabotage');
        await expect(actionsLabel).toBeVisible({ timeout: 5_000 });

        console.log(`  Custom role "${CUSTOM_ROLE_NAME}" with actions added ✓`);
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 5 — Seed roles deterministically
      // ══════════════════════════════════════════════════════════════════
      await test.step('Seed roles via API', async () => {
        const res = await fetch(`${API_BASE}/api/rooms/${roomCode}/seed-roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roles: ROLE_MAP }),
        });
        const json = await res.json() as { ok?: boolean; error?: string };
        expect(json.ok, `seed-roles failed: ${json.error}`).toBe(true);

        // Also seed the role_config so the server knows "Spy" has actions
        const configRes = await fetch(`${API_BASE}/api/rooms/${roomCode}`);
        const { room } = await configRes.json() as { room: { roleConfig: unknown } };
        console.log('  Role config on server:', JSON.stringify(room?.roleConfig));

        console.log('  Roles seeded ✓');
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 6 — Host starts game
      // ══════════════════════════════════════════════════════════════════
      await test.step('Host starts game', async () => {
        await host.page.getByRole('button', { name: 'Start Game' }).click();
        console.log('  Game started ✓');
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 7 — Role reveal
      // ══════════════════════════════════════════════════════════════════
      await test.step('Role reveal — verify Spy sees their role, host proceeds to night', async () => {
        // All non-host players should see the role reveal screen
        await Promise.all(
          players.slice(1).map((p) => waitForText(p.page, 'Your Role', 15_000))
        );

        // Player1 (Spy) should see the Spy role card
        const spyRoleCard = spy.page.locator(`text=${CUSTOM_ROLE_NAME}`).first();
        await expect(spyRoleCard).toBeVisible({ timeout: 5_000 });
        console.log(`  ${spy.name} sees role "${CUSTOM_ROLE_NAME}" ✓`);

        // Host proceeds to night
        await host.page.getByRole('button', { name: 'Proceed to Night' }).click();
        console.log('  Host proceeded to night ✓');
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 8 — Spy fires custom actions during night phase
      // ══════════════════════════════════════════════════════════════════
      await test.step(`${spy.name} (${CUSTOM_ROLE_NAME}) fires custom actions during night`, async () => {
        // Wait for night phase on spy's screen
        await spy.page.waitForSelector('text=Night falls', { timeout: 20_000 });
        console.log(`  ${spy.name} is in night phase ✓`);

        // The "Your Actions" panel should be visible
        const actionsPanel = spy.page.locator('text=Your Actions');
        await expect(actionsPanel).toBeVisible({ timeout: 5_000 });
        console.log(`  "Your Actions" panel visible ✓`);

        // Click "Observe" action
        const observeBtn = spy.page.getByRole('button', { name: 'Observe' });
        await expect(observeBtn).toBeVisible({ timeout: 5_000 });
        await observeBtn.click();
        console.log(`  Clicked "Observe" ✓`);

        // Toast should confirm
        const observeToast = spy.page.locator('text="Observe" logged to host');
        await expect(observeToast).toBeVisible({ timeout: 5_000 });
        console.log(`  Toast confirmed "Observe logged to host" ✓`);

        // Wait for toast to disappear, then click "Sabotage"
        await spy.page.waitForTimeout(3_000);

        const sabotageBtn = spy.page.getByRole('button', { name: 'Sabotage' });
        await expect(sabotageBtn).toBeVisible({ timeout: 5_000 });
        await sabotageBtn.click();
        console.log(`  Clicked "Sabotage" ✓`);

        const sabotageToast = spy.page.locator('text="Sabotage" logged to host');
        await expect(sabotageToast).toBeVisible({ timeout: 5_000 });
        console.log(`  Toast confirmed "Sabotage logged to host" ✓`);
      });

      // ══════════════════════════════════════════════════════════════════
      // STEP 9 — Host verifies Game Log contains both custom actions
      // ══════════════════════════════════════════════════════════════════
      await test.step('Host sees both custom actions in Game Log', async () => {
        // Open the game log
        const gameLogBtn = host.page.locator('button', { hasText: 'Game Log' });
        await expect(gameLogBtn).toBeVisible({ timeout: 10_000 });
        await gameLogBtn.click();
        await host.page.waitForTimeout(300);

        // Both actions appear formatted as "⚡ Player1 used action: Observe / Sabotage"
        const observeEntry = host.page.locator('text=used action: Observe').first();
        await expect(observeEntry).toBeVisible({ timeout: 5_000 });
        console.log(`  "used action: Observe" entry visible in Game Log ✓`);

        const sabotageEntry = host.page.locator('text=used action: Sabotage').first();
        await expect(sabotageEntry).toBeVisible({ timeout: 5_000 });
        console.log(`  "used action: Sabotage" entry visible in Game Log ✓`);

        // Verify actor name is present (Player1) somewhere in the log
        const logText = await host.page.locator('.panel').last().textContent().catch(() => '');
        expect(logText, `Game log should mention ${spy.name}`).toContain(spy.name);
        console.log(`  Actor "${spy.name}" visible in Game Log ✓`);
      });

    } finally {
      for (const player of players) {
        await player.ctx.close().catch(() => {});
        await player.browser.close().catch(() => {});
      }
    }
  });
});
