import { expect, test, type Page } from '@playwright/test';

async function loadTeleportation(page: Page) {
  await page.goto('/');
  await page.getByText('Algorithms', { exact: true }).click();
  await page.getByRole('button', { name: /Guided teleportation/ }).click();
  await expect(page.getByTestId('teleportation-fidelity')).toHaveText('100.000000%');
}

const timeline = (page: Page) => page.getByRole('region', { name: 'Execution timeline' });
const slider = (page: Page) => timeline(page).getByRole('slider');

test('live teleportation follows one trajectory through discrete measurement frames', async ({ page }) => {
  await loadTeleportation(page);
  const records = await page.getByTestId('classical-outcomes').textContent();
  await slider(page).fill('5');
  await expect(timeline(page)).toContainText('Pre-measurement: q0');
  await expect(page.getByTestId('classical-outcomes')).toHaveText('c0 = —, c1 = —');
  await timeline(page).getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByTestId('measurement-outcome')).toContainText('Post-measurement: q0');
  await expect(page.getByTestId('measurement-outcome')).toContainText('p = 0.5000');
  await slider(page).fill('9');
  await expect(page.getByTestId('classical-outcomes')).toHaveText(records!);
  await expect(page.getByTestId('teleportation-fidelity')).toHaveText('100.000000%');
  await expect(page.locator('.canvas-wrapper')).toHaveAttribute('data-active-column', '8');
  await slider(page).fill('8');
  await expect(page.locator('.canvas-wrapper')).toHaveAttribute('data-active-column', '7');
  await timeline(page).getByRole('button', { name: 'Play', exact: true }).click();
  await expect(slider(page)).toHaveValue('9');
  await expect(page.getByTestId('classical-outcomes')).toHaveText(records!);
});

test('refreshes angles automatically and recovers the input on all four branches', async ({ page }) => {
  await loadTeleportation(page);
  const guide = page.getByRole('region', { name: 'Guided teleportation', exact: true });
  await guide.getByLabel('θ', { exact: true }).fill('1.7');
  await guide.getByLabel('φ', { exact: true }).fill('-0.8');
  await expect(page.getByTestId('teleportation-fidelity')).toHaveText('100.000000%');
  await expect(guide).toContainText('Input state: (0.691, -0.711, -0.129)');
  const branches = new Set<string>();
  for (let i = 0; i < 24 && branches.size < 4; i++) {
    branches.add((await page.getByTestId('classical-outcomes').textContent())!);
    await page.getByRole('button', { name: 'Re-run trajectory', exact: true }).click();
    await expect(page.getByTestId('teleportation-fidelity')).toHaveText('100.000000%');
  }
  expect(branches.size).toBe(4);
  await page.getByRole('region', { name: 'Reduced Bloch sphere' }).getByRole('combobox').selectOption('2');
  await expect(page.getByRole('region', { name: 'Reduced Bloch sphere' })).toContainText('r = (0.691, -0.711, -0.129)');
  await page.screenshot({ path: '/tmp/jqapi-125-teleportation.png', fullPage: true });
});

test('imports and saves the implicit v2 format losslessly', async ({ page }) => {
  await loadTeleportation(page);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save JSON' }).click();
  const download = await downloadEvent;
  const path = await download.path();
  if (!path) throw new Error('Missing circuit download');
  await page.getByRole('button', { name: 'Clear circuit' }).click();
  await page.locator('input[type="file"]').setInputFiles(path);
  await expect(slider(page)).toHaveAttribute('max', '9');
  await expect(page.getByRole('alert')).toHaveCount(0);
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save JSON' }).click();
  const second = await saved;
  const read = async (file: typeof download) => {
    const stream = await file.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    return JSON.parse(Buffer.concat(chunks).toString());
  };
  expect(await read(second)).toEqual(await read(download));
});

test('refreshes after rapid edits, undo and reset without Run', async ({ page }) => {
  await loadTeleportation(page);
  await page.getByRole('button', { name: 'Clear circuit' }).click();
  await expect(slider(page)).toHaveAttribute('max', '0');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(slider(page)).toHaveAttribute('max', '9');
  await page.getByLabel('Qubits:', { exact: true }).fill('4');
  await page.getByLabel('Qubits:', { exact: true }).fill('3');
  await expect(page.locator('.bar-row')).toHaveCount(8);
  await expect(page.getByRole('region', { name: 'Live state', exact: true })).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
