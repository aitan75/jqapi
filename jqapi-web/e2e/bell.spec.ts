import { expect, test } from '@playwright/test';

test('draws and simulates a Bell circuit', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await page.getByTitle('Drag or select H').click();
  await canvas.click({ position: { x: 86, y: 30 } });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Circuit canvas is not visible');
  await page.mouse.move(box.x + 86, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 146, box.y + 30);
  await page.mouse.up();
  await expect(page.locator('.canvas-inner')).toHaveAttribute('data-pan', '0,0');
  await page.getByTitle('Drag or select CNOT ctrl').click();
  await canvas.click({ position: { x: 206, y: 30 } });
  await page.getByTitle('Drag or select CNOT tgt').click();
  await canvas.click({ position: { x: 206, y: 90 } });
  await page.getByRole('button', { name: /run simulation/i }).click();
  await expect(page.getByText('State Vector & Outcome Probabilities')).toBeVisible();
  await expect(page.getByText('|00⟩')).toBeVisible();
  await expect(page.getByText('|11⟩')).toBeVisible();
});

test('opens erase on click and removes a gate on double click', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await page.getByTitle('Drag or select H').click();
  await canvas.click({ position: { x: 86, y: 30 } });
  await canvas.click({ position: { x: 86, y: 30 } });
  const eraseMenu = page.locator('.gate-menu button');
  await expect(eraseMenu).toBeVisible();
  await eraseMenu.click();
  await expect(eraseMenu).toBeHidden();
  await canvas.click({ position: { x: 86, y: 30 } });
  await canvas.dblclick({ position: { x: 86, y: 30 } });
  await page.getByRole('button', { name: /run simulation/i }).click();
  await expect(page.getByText('100.0%')).toBeVisible();
});

test('groups gates and presets in localized menus', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Gates', { exact: true })).toBeVisible();
  await expect(page.getByText('Single qubit', { exact: true })).toBeVisible();
  await expect(page.getByText('Algorithms', { exact: true })).toBeVisible();
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
