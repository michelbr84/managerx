import { test, expect } from '@playwright/test';

test.describe('Match Simulation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a game state - this would ideally use a test fixture
    await page.goto('/');
    
    // Quick setup: create new game
    await page.click('text=Novo Jogo');
    await page.fill('input[placeholder="Digite seu nome"]', 'E2E Test Manager');
    await page.click('text=Próximo');
    await page.click('text=AlbionX Premier League');
    await page.fill('input[placeholder="Buscar clube..."]', 'AlbionX FC');
    await page.click('text=AlbionX FC');
    await page.click('text=Iniciar Carreira');
    
    // Wait for game to load
    await expect(page.locator('text=Calendário')).toBeVisible({ timeout: 15000 });
  });

  test('should simulate first match of the season', async ({ page }) => {
    // Navigate to calendar
    await page.click('text=Calendário');
    await expect(page.locator('text=Calendário')).toBeVisible();
    
    // Find and click on the first match
    const firstMatch = page.locator('[data-testid="match-event"]').first();
    if (await firstMatch.isVisible()) {
      await firstMatch.click();
    } else {
      // Alternative: look for "Jogar" button
      await page.click('text=Jogar');
    }
    
    // Should navigate to match screen
    await expect(page.locator('text=vs')).toBeVisible({ timeout: 10000 });
    
    // Start the simulation
    await page.click('text=Continuar');
    
    // Wait for simulation to begin
    await expect(page.locator('text=Pausar')).toBeVisible();
    
    // Let the match run for a bit
    await page.waitForTimeout(3000);
    
    // Should show some events
    await expect(page.locator('text=Eventos da Partida')).toBeVisible();
    
    // Fast forward to end
    await page.click('text=Simular até o Fim');
    
    // Should show final result
    await expect(page.locator('text=Fim de Jogo')).toBeVisible({ timeout: 15000 });
    
    // Verify match statistics are displayed
    await expect(page.locator('text=Posse')).toBeVisible();
    await expect(page.locator('text=Finalizações')).toBeVisible();
    await expect(page.locator('text=xG')).toBeVisible();
  });

  test('should allow match speed control', async ({ page }) => {
    // Navigate to match (assuming we're in a game)
    await page.click('text=Calendário');
    
    // Start a match
    const matchButton = page.locator('text=Jogar').first();
    if (await matchButton.isVisible()) {
      await matchButton.click();
    }
    
    // Should be on match screen
    await expect(page.locator('text=vs')).toBeVisible();
    
    // Start simulation
    await page.click('text=Continuar');
    
    // Test speed controls
    await page.click('text=2x');
    await expect(page.locator('text=2x')).toHaveClass(/bg-blue-600/);
    
    await page.click('text=4x');
    await expect(page.locator('text=4x')).toHaveClass(/bg-blue-600/);
    
    // Pause the match
    await page.click('text=Pausar');
    await expect(page.locator('text=Continuar')).toBeVisible();
  });

  test('should display match events in real-time', async ({ page }) => {
    // Start a match
    await page.click('text=Calendário');
    const matchButton = page.locator('text=Jogar').first();
    if (await matchButton.isVisible()) {
      await matchButton.click();
    }
    
    await expect(page.locator('text=vs')).toBeVisible();
    await page.click('text=Continuar');
    
    // Set high speed to generate events quickly
    await page.click('text=8x');
    
    // Wait for events to appear
    await page.waitForTimeout(5000);
    
    // Should have some events
    const eventsContainer = page.locator('[data-testid="match-events"]');
    if (await eventsContainer.isVisible()) {
      const eventCount = await eventsContainer.locator('div').count();
      expect(eventCount).toBeGreaterThan(0);
    }
    
    // Events should have timestamps
    await expect(page.locator('text=/\\d+\'/')).toBeVisible(); // Regex for minute markers
  });

  test('should show realistic match statistics', async ({ page }) => {
    // Complete a match simulation
    await page.click('text=Calendário');
    const matchButton = page.locator('text=Jogar').first();
    if (await matchButton.isVisible()) {
      await matchButton.click();
    }
    
    await expect(page.locator('text=vs')).toBeVisible();
    await page.click('text=Simular até o Fim');
    
    // Wait for match to complete
    await expect(page.locator('text=Fim de Jogo')).toBeVisible({ timeout: 20000 });
    
    // Check that statistics are realistic
    const possessionHome = await page.locator('[data-testid="possession-home"]').textContent();
    const possessionAway = await page.locator('[data-testid="possession-away"]').textContent();
    
    if (possessionHome && possessionAway) {
      const homePercent = parseInt(possessionHome.replace('%', ''));
      const awayPercent = parseInt(possessionAway.replace('%', ''));
      
      // Possession should add up to ~100%
      expect(homePercent + awayPercent).toBeCloseTo(100, 10);
      
      // Each team should have some possession
      expect(homePercent).toBeGreaterThan(20);
      expect(homePercent).toBeLessThan(80);
    }
  });
});
