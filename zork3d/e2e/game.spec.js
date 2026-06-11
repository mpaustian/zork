// End-to-end tests: boot the real game in a real browser, play it, win it.
import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5199';

async function boot(page) {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.hud')).toBeAttached();
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForFunction(() => window.__game?.started === true);
  await page.waitForTimeout(600); // let the first frame + narration land
}

// Run an engine-level action through the full game wiring.
async function act(page, fn) {
  await page.evaluate(fn);
  await page.waitForTimeout(120);
}

function state(page) {
  return page.evaluate(() => ({
    room: window.__game.engine.state.room,
    mode: window.__game.engine.state.mode,
    score: window.__game.engine.state.score,
    inventory: window.__game.engine.state.inventory,
    deaths: window.__game.engine.state.deaths,
  }));
}

test('boots: title screen, renders non-black pixels, opening narration', async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByText('ZORK', { exact: false }).first()).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForFunction(() => window.__game?.started === true);
  await page.waitForTimeout(800);

  // The canvas must actually be rendering something.
  const brightness = await page.evaluate(() => {
    const c = document.getElementById('game-canvas');
    const gl = c.getContext('webgl2');
    const px = new Uint8Array(4 * 64 * 64);
    gl.readPixels(c.width / 2 - 32, c.height / 2 - 32, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += px[i] + px[i + 1] + px[i + 2];
    return sum / (px.length / 4 * 3);
  });
  expect(brightness).toBeGreaterThan(8);

  // Opening narration mentions the white house.
  await expect(page.locator('#narrator-transcript')).toContainText(/white house/i, { timeout: 10000 });
});

test('walking into a portal moves rooms; blocked exits narrate', async ({ page }) => {
  await boot(page);
  await act(page, () => window.__game.portalEntered('north'));
  expect((await state(page)).room).toBe('north_of_house');
  // Back south, then try the boarded house from behind: window must block.
  await act(page, () => window.__game.portalEntered('east'));
  expect((await state(page)).room).toBe('east_of_house');
  await act(page, () => window.__game.portalEntered('west'));
  expect((await state(page)).room).toBe('east_of_house'); // still here
  await expect(page.locator('#narrator-transcript')).toContainText(/window is closed/i);
});

test('verb coin appears when clicking an object', async ({ page }) => {
  await boot(page);
  await act(page, () => window.__game.objectClicked('mailbox', 'scenery', 640, 360));
  await expect(page.locator('.hud-verbcoin__label')).toHaveText('Small Mailbox');
  // Choose "use" -> leaflet acquired
  await act(page, () => window.__game.doVerb('use', 'mailbox'));
  expect((await state(page)).inventory).toContain('leaflet');
});

test('troll combat via the real QTE button', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.__game;
    const e = g.engine;
    e.state.inventory.push('brass_lantern', 'elvish_sword');
    e.state.lampOn = true;
    g.debugTeleport('troll_room', { light: true });
  });
  await act(page, () => window.__game.doVerb('attack', 'troll'));
  expect((await state(page)).mode).toBe('combat');
  // Win: click the QTE prompt every round (5 rounds: 3 strikes, 2 dodges).
  for (let i = 0; i < 5; i++) {
    await page.locator('.hud-combat__qte').click({ timeout: 4000 });
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);
  const s = await state(page);
  expect(s.mode).toBe('play');
  const won = await page.evaluate(() => window.__game.engine.flag('troll_defeated'));
  expect(won).toBe(true);
});

test('death by tree + the Grim Rewind restores play', async ({ page }) => {
  await boot(page);
  await act(page, () => window.__game.portalEntered('west')); // forest
  expect((await state(page)).room).toBe('forest_path');
  await act(page, () => window.__game.doVerb('use', 'great_tree')); // climb, no rope
  expect((await state(page)).mode).toBe('dead');
  await expect(page.getByText(/gravity/i)).toBeVisible({ timeout: 5000 });
  // Skip through the vignette, then wait for the rewind to finish.
  await page.mouse.click(640, 360);
  await page.waitForFunction(() => window.__game.engine.state.mode === 'play', null, { timeout: 20000 });
  const s = await state(page);
  expect(s.room).toBe('forest_path');
  expect(s.deaths).toContain('fall');
});

test('grue darkness: overlay appears without light', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.__game.debugTeleport('cellar'));
  await act(page, () => window.__game.portalEntered('north')); // dark move -> warning
  await expect(page.locator('#narrator-transcript')).toContainText(/pitch black/i);
});

test('FULL PLAYTHROUGH: five treasures, win screen', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page);
  const go = (dir) => act(page, `window.__game.portalEntered('${dir}')`);
  const verb = (v, o) => act(page, `window.__game.doVerb('${v}', '${o}')`);
  const useOn = (i, t) => act(page, `window.__game.engine.useItemOn('${i}','${t}'); window.__game.afterAction()`);
  const lamp = () => act(page, `window.__game.useItemOnSelf('brass_lantern')`);

  // Into the house
  await go('north'); await go('east');
  await verb('use', 'window');
  await go('west'); // kitchen
  await go('west'); // living room
  await verb('take', 'brass_lantern');
  await verb('take', 'elvish_sword');
  await lamp();
  await go('east'); await go('up'); // attic
  await verb('take', 'rope');
  await go('down'); await go('west'); // living room
  await verb('use', 'oriental_rug');
  await verb('use', 'trap_door');
  // The egg
  await go('east'); await go('east'); await go('north'); await go('west'); await go('west'); // forest
  await useOn('rope', 'great_tree');
  expect((await state(page)).inventory).toContain('jewel_encrusted_egg');
  // Underground
  await go('east'); await go('north'); await go('east'); // behind house... (forest->west_of_house->north_of_house->east_of_house)
  await go('west'); await go('west'); await go('down'); // cellar
  await go('east'); // gallery
  await verb('take', 'painting');
  await go('west'); await go('north'); // troll room
  await verb('attack', 'troll');
  for (let i = 0; i < 5; i++) {
    await page.locator('.hud-combat__qte').click({ timeout: 4000 });
    await page.waitForTimeout(250);
  }
  await page.waitForFunction(() => window.__game.engine.flag('troll_defeated'), null, { timeout: 10000 });
  // Maze: coins + page
  await go('east'); await go('north');
  await verb('take', 'bag_of_coins');
  await go('south'); await go('south');
  await verb('take', 'tattered_page');
  await go('south'); await go('east'); await go('north'); // round room
  // Loud room: lights out, grab, lights on
  await go('west');
  await lamp();
  await verb('take', 'platinum_bar');
  await lamp();
  expect((await state(page)).inventory).toContain('platinum_bar');
  // Cyclops: show him some literature
  await go('east'); await go('north');
  await useOn('tattered_page', 'cyclops');
  await go('up');
  await verb('take', 'silver_chalice');
  await go('down'); await go('east'); // through the hole, home
  expect((await state(page)).room).toBe('living_room');
  await verb('use', 'trophy_case');

  const s = await state(page);
  expect(s.mode).toBe('won');
  expect(s.score).toBe(250);
  await expect(page.getByText(/legend, behind glass/i)).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.hud-win__rank')).toHaveText(/greatest underground adventurer/i);
});

test('screenshot tour of every room (visual artifacts)', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);
  const rooms = await page.evaluate(() => Object.keys(window.__game.engine.constructor ? {} : {}));
  const allRooms = ['west_of_house', 'north_of_house', 'south_of_house', 'east_of_house', 'forest_path',
    'kitchen', 'living_room', 'attic', 'cellar', 'gallery', 'troll_room', 'maze_entrance', 'maze_2',
    'maze_3', 'maze_dead_end', 'round_room', 'narrow_passage', 'loud_room', 'cyclops_room', 'treasure_room'];
  void rooms;
  for (const room of allRooms) {
    await page.evaluate((r) => window.__game.debugTeleport(r, { light: true }), room);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `e2e/screens/${room}.png` });
  }
});
