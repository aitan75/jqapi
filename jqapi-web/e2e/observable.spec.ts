import { expect, test, type Page } from '@playwright/test';

const observable = (page: Page) => page.getByLabel('Observable ⟨H⟩');
const panel = (page: Page) => page.locator('.observable-panel');
const run = (page: Page) => page.getByRole('button', { name: /run simulation/i }).click();

async function loadBellPreset(page: Page) {
  await page.getByText('Algorithms', { exact: true }).click();
  await page.getByRole('button', { name: /Bell State \|Φ⁺⟩/ }).click();
}

async function loadSpec(page: Page, spec: object) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'circuit.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(spec)),
  });
}

test('computes exact and sampled Bell correlations inside Run', async ({ page }) => {
  await page.goto('/');
  await loadBellPreset(page);
  await observable(page).fill('ZZ\n0.5 XX\n-1 YY\nII');
  await run(page);

  // ⟨ZZ⟩ + 0.5⟨XX⟩ − ⟨YY⟩ + ⟨II⟩ = 1 + 0.5 + 1 + 1 on |Φ⁺⟩; eigenstates give SE = 0.
  await expect(panel(page).getByTestId('exact-expectation')).toHaveText('3.5000');
  await expect(panel(page).getByTestId('sampled-expectation')).toHaveText('3.5000');
  await expect(panel(page).getByTestId('total-shots')).toHaveText('3000');
  const rows = panel(page).getByRole('table').locator('tbody tr');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(2)).toContainText('YY');
  await expect(rows.nth(2)).toContainText('-1.0000');
  await expect(rows.nth(3)).toContainText('II');
  await expect(rows.nth(3).locator('td').last()).toHaveText('0');
});

test('shows parse errors inline without blocking the circuit run', async ({ page }) => {
  await page.goto('/');
  await loadBellPreset(page);
  await observable(page).fill('ZZ\nZQ');
  await expect(panel(page).getByRole('status')).toHaveText('Line 2: labels may contain only I, X, Y and Z.');
  await expect(observable(page)).toHaveAttribute('aria-invalid', 'true');
  await run(page);
  await expect(page.getByText('State Vector & Outcome Probabilities')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(panel(page).getByRole('table')).toHaveCount(0);

  await observable(page).fill('ZZZ');
  await expect(panel(page).getByRole('status')).toHaveText('Line 1: the label must have 2 letters, one per qubit.');
});

test('explains that exact values need a unitary circuit but still samples it', async ({ page }) => {
  await page.goto('/');
  await loadSpec(page, { version: 1, numQubits: 1, levels: [
    { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
    { gates: [{ kind: 'MEASUREMENT', targets: [0], controls: [], params: {} }] },
  ] });
  await observable(page).fill('Z');
  await run(page);
  await expect(panel(page)).toContainText('The exact value is not available for circuits with measurement, reset or classical conditions.');
  await expect(panel(page).getByTestId('sampled-expectation')).toHaveText('-1.0000');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('keeps the exact value when only the sampled estimate exceeds the work budget', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Qubits:').fill('8');
  await page.getByLabel('Shots').fill('10000');
  await observable(page).fill('ZIIIIIII\n'.repeat(512));
  await run(page);
  await expect(panel(page).getByTestId('exact-expectation')).toHaveText('512.0000');
  await expect(panel(page)).toContainText('The circuit exceeds the supported simulation limits.');
  await expect(panel(page).getByTestId('sampled-expectation')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('needs two shots for the sampled estimate', async ({ page }) => {
  await page.goto('/');
  await loadBellPreset(page);
  await page.getByLabel('Shots').fill('1');
  await observable(page).fill('ZZ');
  await run(page);
  await expect(panel(page).getByTestId('exact-expectation')).toHaveText('1.0000');
  await expect(panel(page)).toContainText('The sampled estimate needs at least 2 shots.');
});

test('clears observable results when the circuit or observable changes', async ({ page }) => {
  await page.goto('/');
  await loadBellPreset(page);
  await observable(page).fill('ZZ');
  await run(page);
  await expect(panel(page).getByTestId('exact-expectation')).toBeVisible();
  await page.getByRole('button', { name: '+ step' }).click();
  await expect(panel(page).getByTestId('exact-expectation')).toHaveCount(0);

  await run(page);
  await expect(panel(page).getByTestId('exact-expectation')).toBeVisible();
  await observable(page).fill('XX');
  await expect(panel(page).getByTestId('exact-expectation')).toHaveCount(0);
});

test('adds nothing to a run when the observable is empty, in both languages', async ({ page }) => {
  await page.goto('/');
  await loadBellPreset(page);
  await run(page);
  await expect(page.getByText('State Vector & Outcome Probabilities')).toBeVisible();
  await expect(panel(page).getByRole('table')).toHaveCount(0);
  await expect(panel(page).getByRole('status')).toHaveCount(0);
  await page.getByLabel('Language').selectOption('it');
  await expect(page.getByLabel('Osservabile ⟨H⟩')).toBeVisible();
});
