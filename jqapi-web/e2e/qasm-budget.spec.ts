import { expect, test, type Page } from '@playwright/test';

async function importQasm(page: Page, source: string) {
  await page.getByLabel('Import QASM', { exact: true }).setInputFiles({ name: 'circuit.qasm', mimeType: 'text/plain', buffer: Buffer.from(source) });
}

const bell = 'OPENQASM 2.0; include "qelib1.inc"; qreg q[2]; h q[0]; cx q[0],q[1];';
const results = (page: Page) => page.locator('.results > .results-grid');

test('Italian QASM errors keep English diagnostics behind an explicit disclosure', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Language').selectOption('it');
  await page.getByLabel('Importa QASM', { exact: true }).setInputFiles({
    name: 'invalid.qasm', mimeType: 'text/plain', buffer: Buffer.from(`${bell} unsupported q[0];`),
  });
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('OpenQASM non valido o non supportato');
  await expect(alert.locator('[lang="en"]')).toBeHidden();
  await alert.getByText('Dettagli tecnici (in inglese)').click();
  await expect(alert.locator('[lang="en"]')).toBeVisible();
  await expect(alert.locator('[lang="en"]')).toContainText('unsupported');
  await alert.getByRole('button', { name: 'Chiudi' }).click();
  await expect(alert).toHaveCount(0);
});

test('shot warnings follow the circuit and distinguish the observable budget', async ({ page }) => {
  await page.goto('/');
  await importQasm(page, 'OPENQASM 2.0; include "qelib1.inc"; qreg q[8]; h q; cx q[0],q[7];');
  await expect(page.locator('#shot-budget')).toContainText('7,812 shots');
  await page.getByLabel('Shots', { exact: true }).fill('8000');
  await expect(page.getByLabel('Shots', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#shot-budget')).toContainText('exceed the counts work budget');
  await page.getByRole('button', { name: /clear circuit/i }).click();
  await expect(page.locator('#shot-budget')).toContainText('10,000 shots');
  await expect(page.getByLabel('Shots', { exact: true })).toHaveAttribute('aria-invalid', 'false');
  await page.locator('.observable-panel textarea').fill('ZIIIIIII');
  await expect(page.locator('#shot-budget')).toContainText('Counts and the exact value can still be evaluated');
  await page.getByLabel('Language').selectOption('it');
  await expect(page.locator('#shot-budget')).toContainText('I conteggi e il valore esatto possono ancora essere valutati');
});

test('imports, runs and exports QASM; rejected imports retain the editable circuit', async ({ page }) => {
  await page.goto('/');
  await importQasm(page, bell);
  await expect(results(page).getByText('50.0%')).toHaveCount(2);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export QASM', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('jqapi-circuit.qasm');
  await importQasm(page, `${bell} unsupported q[0];`);
  await expect(page.getByRole('alert')).toContainText('Unsupported or invalid OpenQASM');
  await expect(results(page).getByText('50.0%')).toHaveCount(2);
  await importQasm(page, 'OPENQASM 2.0; qreg q[9];');
  await expect(page.getByRole('alert')).toContainText('limits');
  await expect(results(page).getByText('50.0%')).toHaveCount(2);
  await page.getByRole('button', { name: /run simulation/i }).click();
  await expect(page.locator('div.results')).toContainText('1000');
  await page.getByRole('button', { name: /clear circuit/i }).click();
  await expect(results(page).getByText('100.0%')).toBeVisible();
});

test('rejects unsupported classical imports without overwriting the existing canvas', async ({ page }) => {
  await page.goto('/');
  await importQasm(page, bell);
  await expect(results(page).getByText('50.0%')).toHaveCount(2);
  await importQasm(page, `${bell} creg c[2]; measure q[0] -> c[1];`);
  await expect(page.getByRole('alert')).toContainText('measure q[i] into c[i]');
  await expect(results(page).getByText('50.0%')).toHaveCount(2);
});

test('cancel interrupts an unresponsive worker and the next operation succeeds', async ({ page }) => {
  await page.route('**/engine.worker.ts*', (route) => route.fulfill({ contentType: 'application/javascript', body: 'self.onmessage = () => {};' }));
  const workerLoaded = page.waitForResponse((response) => response.url().includes('/engine.worker.ts'));
  await page.goto('/');
  await workerLoaded;
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('cancelled');
  await page.unroute('**/engine.worker.ts*');
  await importQasm(page, bell);
  await expect(results(page).getByText('50.0%')).toHaveCount(2);
});

test('editing cancels a pending QASM import before it can replace newer work', async ({ page }) => {
  await page.goto('/');
  await expect(results(page).getByText('100.0%')).toBeVisible();
  await page.route('**/engine.worker.ts*', (route) => route.fulfill({ contentType: 'application/javascript', body: 'self.onmessage = () => {};' }));
  const workerLoaded = page.waitForResponse((response) => response.url().includes('/engine.worker.ts'));
  await importQasm(page, bell);
  await workerLoaded;
  await expect(page.getByRole('button', { name: 'Import QASM', exact: true })).toBeDisabled();
  await page.unroute('**/engine.worker.ts*');
  await page.getByRole('button', { name: '+ step', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Import QASM', exact: true })).toBeEnabled();
  await expect(results(page).getByText('100.0%')).toBeVisible();
  await expect(results(page).getByText('50.0%')).toHaveCount(0);
});

test('a worker deadline leaves the editor available for another import', async ({ page }) => {
  await page.route('**/engine.worker.ts*', (route) => route.fulfill({ contentType: 'application/javascript', body: 'self.onmessage = () => {};' }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('execution time limit', { timeout: 10_000 });
  await page.unroute('**/engine.worker.ts*');
  await importQasm(page, bell);
  await expect(results(page).getByText('50.0%')).toHaveCount(2);
});
