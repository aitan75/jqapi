import { expect, test, type Page } from '@playwright/test';

const theoreticalResults = (page: Page) => page.locator('.results > .results-grid');

async function dropPaletteGate(page: Page, title: string, position: { x: number; y: number }) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Circuit canvas is not visible');
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await page.getByTitle(title).dispatchEvent('dragstart', { dataTransfer });
  await canvas.dispatchEvent('dragover', { dataTransfer, clientX: box.x + position.x, clientY: box.y + position.y });
  await canvas.dispatchEvent('drop', { dataTransfer, clientX: box.x + position.x, clientY: box.y + position.y });
}

test('draws and simulates a Bell circuit', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await page.getByText('Gates', { exact: true }).click();
  await page.getByText('Single qubit', { exact: true }).click();
  await dropPaletteGate(page, 'Drag or select H', { x: 86, y: 30 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Circuit canvas is not visible');
  await page.mouse.move(box.x + 86, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 146, box.y + 30);
  await page.mouse.up();
  await expect(page.locator('.canvas-inner')).toHaveAttribute('data-pan', '0,0');
  await page.getByText('Two qubits', { exact: true }).click();
  await dropPaletteGate(page, 'Drag or select CNOT control', { x: 206, y: 30 });
  await dropPaletteGate(page, 'Drag or select CNOT target', { x: 206, y: 90 });
  await page.getByRole('button', { name: /run simulation/i }).click();
  await expect(page.getByText('State Vector & Outcome Probabilities')).toBeVisible();
  await expect(theoreticalResults(page).getByText('|00⟩')).toBeVisible();
  await expect(theoreticalResults(page).getByText('|11⟩')).toBeVisible();
});

test('opens erase on click and removes a gate on double click', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await page.getByText('Gates', { exact: true }).click();
  await page.getByText('Single qubit', { exact: true }).click();
  await dropPaletteGate(page, 'Drag or select H', { x: 86, y: 30 });
  await canvas.click({ position: { x: 86, y: 30 } });
  const eraseMenu = page.locator('.gate-menu button');
  await expect(eraseMenu).toBeVisible();
  await eraseMenu.click();
  await expect(eraseMenu).toBeHidden();
  await canvas.click({ position: { x: 86, y: 30 } });
  await canvas.dblclick({ position: { x: 86, y: 30 } });
  await page.getByRole('button', { name: /run simulation/i }).click();
  await expect(theoreticalResults(page).getByText('100.0%')).toBeVisible();
});

test('highlights the valid canvas cell while dragging a palette gate', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Gates', { exact: true }).click();
  await page.getByText('Single qubit', { exact: true }).click();
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Circuit canvas is not visible');
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

  await page.getByTitle('Drag or select H').dispatchEvent('dragstart', { dataTransfer });
  await canvas.dispatchEvent('dragover', { dataTransfer, clientX: box.x + 86, clientY: box.y + 30 });
  await expect(page.locator('.canvas-wrapper')).toHaveAttribute('data-drop-target', '0:0');

  await canvas.dispatchEvent('dragleave', { relatedTarget: null });
  await expect(page.locator('.canvas-wrapper')).not.toHaveAttribute('data-drop-target');
});

test('does not place a selected gate with a canvas click', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Gates', { exact: true }).click();
  await page.getByText('Single qubit', { exact: true }).click();
  await page.getByTitle('Drag or select H').click();
  await page.locator('canvas').click({ position: { x: 86, y: 30 } });
  await page.getByRole('button', { name: /run simulation/i }).click();
  await expect(theoreticalResults(page).getByText('100.0%')).toBeVisible();
});

test('removes a gate dropped outside the grid', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Gates', { exact: true }).click();
  await page.getByText('Single qubit', { exact: true }).click();
  await dropPaletteGate(page, 'Drag or select H', { x: 86, y: 30 });
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Circuit canvas is not visible');

  await page.mouse.move(box.x + 86, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + 30);
  await page.mouse.up();
  await page.getByRole('button', { name: /run simulation/i }).click();
  await expect(theoreticalResults(page).getByText('100.0%')).toBeVisible();
});

test('shows amplitude magnitude, phase, and a Bloch indicator on hover', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Qubits:').fill('1');
  await page.getByText('Gates', { exact: true }).click();
  await page.getByText('Single qubit', { exact: true }).click();
  await dropPaletteGate(page, 'Drag or select H', { x: 86, y: 30 });
  await page.getByRole('button', { name: /run simulation/i }).click();

  const row = page.locator('.bar-row').first();
  await row.hover();
  const tooltip = row.locator('.amplitude-tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('|cᵢ|');
  await expect(tooltip).toContainText('r⃗ = (');
});

test('groups gates and presets in localized menus', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Gates', { exact: true })).toBeVisible();
  await expect(page.getByText('Algorithms', { exact: true })).toBeVisible();
  await page.getByText('Gates', { exact: true }).click();
  await expect(page.getByText('Single qubit', { exact: true })).toBeVisible();
  await page.getByLabel('Language').selectOption('it');
  await expect(page.getByText('Porte', { exact: true })).toBeVisible();
  await expect(page.getByText('Algoritmi', { exact: true })).toBeVisible();
});

test('places the editor menu beside the circuit and shows system time', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.editor-layout > .sidebar')).toBeVisible();
  await expect(page.locator('.editor-layout > .workspace')).toBeVisible();
  await expect(page.getByText('Quantum Circuit Simulator')).toBeVisible();
  await expect(page.getByText(/System time:/)).toBeVisible();
  await expect(page.locator('.gate-group').nth(1)).not.toHaveAttribute('open', '');
});

test('starts with closed menus and no selected gate', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.editor-menu').first()).not.toHaveAttribute('open', '');
  await page.getByText('Gates', { exact: true }).click();
  await expect(page.locator('.gate-btn.selected')).toHaveCount(0);
});
