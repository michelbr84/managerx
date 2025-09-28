import { test, expect } from '@playwright/test';

test.describe('UI Responsiveness and Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Quick game setup
    await page.click('text=Novo Jogo');
    await page.fill('input[placeholder="Digite seu nome"]', 'Performance Test');
    await page.click('text=Próximo');
    await page.click('text=AlbionX Premier League');
    await page.click('text=AlbionX FC');
    await page.click('text=Iniciar Carreira');
    
    await expect(page.locator('text=Calendário')).toBeVisible({ timeout: 15000 });
  });

  test('should load screens quickly', async ({ page }) => {
    const screens = ['Elenco', 'Táticas', 'Mensagens', 'Scouting'];
    
    for (const screen of screens) {
      const startTime = Date.now();
      
      await page.click(`text=${screen}`);
      await expect(page.locator(`text=${screen}`)).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      console.log(`${screen} loaded in ${loadTime}ms`);
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(2000); // 2 seconds max
    }
  });

  test('should handle large squad lists efficiently', async ({ page }) => {
    await page.click('text=Elenco');
    await expect(page.locator('text=Elenco do Clube')).toBeVisible();
    
    // Should display squad table quickly
    await expect(page.locator('table')).toBeVisible();
    
    // Test sorting functionality
    await page.click('text=Idade');
    await page.waitForTimeout(100);
    
    // Should re-sort without significant delay
    await expect(page.locator('table tbody tr')).toBeVisible();
    
    // Test filtering
    await page.fill('input[placeholder="Buscar jogador..."]', 'Silva');
    await page.waitForTimeout(500);
    
    // Filter should apply quickly
    // Note: This assumes there's a player with "Silva" in the name
  });

  test('should render tactical field smoothly', async ({ page }) => {
    await page.click('text=Táticas');
    await expect(page.locator('text=Táticas')).toBeVisible();
    
    // Should show tactical field
    await expect(page.locator('[data-testid="tactical-field"]')).toBeVisible();
    
    // Test formation changes
    await page.click('text=4-3-3');
    
    // Should update field layout without lag
    await page.waitForTimeout(500);
    
    // Player positions should be visible
    await expect(page.locator('[data-testid="player-position"]')).toBeVisible();
    
    // Test rapid formation changes
    await page.click('text=3-5-2');
    await page.waitForTimeout(100);
    await page.click('text=4-4-2');
    await page.waitForTimeout(100);
    
    // Should handle rapid changes without errors
    await expect(page.locator('text=4-4-2')).toHaveClass(/bg-blue-600/);
  });

  test('should handle match simulation without blocking UI', async ({ page }) => {
    await page.click('text=Calendário');
    
    // Start a match
    const matchButton = page.locator('text=Jogar').first();
    if (await matchButton.isVisible()) {
      await matchButton.click();
    }
    
    await expect(page.locator('text=vs')).toBeVisible();
    
    // Start simulation at high speed
    await page.click('text=Continuar');
    await page.click('text=8x');
    
    // UI should remain responsive during simulation
    await page.click('text=4x'); // Should be able to change speed
    await expect(page.locator('text=4x')).toHaveClass(/bg-blue-600/);
    
    await page.click('text=Pausar'); // Should be able to pause
    await expect(page.locator('text=Continuar')).toBeVisible();
    
    // Should be able to navigate away during simulation
    await page.click('text=Elenco');
    await expect(page.locator('text=Elenco do Clube')).toBeVisible();
    
    // Should be able to navigate back
    await page.click('text=Partida');
    await expect(page.locator('text=vs')).toBeVisible();
  });

  test('should handle window resizing gracefully', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('text=Calendário')).toBeVisible();
    
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect(page.locator('text=Calendário')).toBeVisible();
    
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('text=Calendário')).toBeVisible();
    
    // UI should adapt to different sizes
    // Sidebar might collapse on smaller screens
  });

  test('should show loading states appropriately', async ({ page }) => {
    // Test loading states during navigation
    await page.click('text=Elenco');
    
    // Should show content quickly (loading states might be too fast to catch)
    await expect(page.locator('text=Elenco do Clube')).toBeVisible({ timeout: 5000 });
    
    // Test search loading (if implemented)
    await page.fill('input[placeholder="Buscar jogador..."]', 'test');
    
    // Should handle search without showing loading spinners for too long
    await page.waitForTimeout(1000);
  });

  test('should handle rapid user interactions', async ({ page }) => {
    // Rapid clicking on different elements
    await page.click('text=Elenco');
    await page.click('text=Táticas');
    await page.click('text=Calendário');
    await page.click('text=Mensagens');
    await page.click('text=Scouting');
    
    // Should end up on scouting screen
    await expect(page.locator('text=Relatórios de Scouting')).toBeVisible();
    
    // Rapid keyboard shortcuts
    await page.keyboard.press('c');
    await page.keyboard.press('e');
    await page.keyboard.press('t');
    await page.keyboard.press('i');
    
    // Should end up on inbox
    await expect(page.locator('text=Mensagens')).toBeVisible();
  });

  test('should maintain assistant state during navigation', async ({ page }) => {
    // Assistant should be visible by default
    await expect(page.locator('text=Assistente do Clube')).toBeVisible();
    
    // Navigate to different screens
    await page.click('text=Elenco');
    await expect(page.locator('text=Assistente do Clube')).toBeVisible();
    
    await page.click('text=Táticas');
    await expect(page.locator('text=Assistente do Clube')).toBeVisible();
    
    // Close assistant
    await page.click('[data-testid="assistant-toggle"]');
    await expect(page.locator('text=Assistente do Clube')).not.toBeVisible();
    
    // Navigate to another screen - should stay closed
    await page.click('text=Calendário');
    await expect(page.locator('text=Assistente do Clube')).not.toBeVisible();
    
    // Open assistant again
    await page.click('[data-testid="assistant-toggle"]');
    await expect(page.locator('text=Assistente do Clube')).toBeVisible();
  });
});
