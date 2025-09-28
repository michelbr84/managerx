import { test, expect } from '@playwright/test';

test.describe('Navigation and Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a game state
    await page.goto('/');
    await page.click('text=Novo Jogo');
    await page.fill('input[placeholder="Digite seu nome"]', 'Navigation Test');
    await page.click('text=Próximo');
    await page.click('text=AlbionX Premier League');
    await page.click('text=AlbionX FC');
    await page.click('text=Iniciar Carreira');
    
    await expect(page.locator('text=Calendário')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate between screens using sidebar', async ({ page }) => {
    const screens = [
      { name: 'Calendário', selector: 'text=Calendário' },
      { name: 'Elenco', selector: 'text=Elenco' },
      { name: 'Táticas', selector: 'text=Táticas' },
      { name: 'Mensagens', selector: 'text=Mensagens' },
      { name: 'Scouting', selector: 'text=Scouting' },
    ];

    for (const screen of screens) {
      await page.click(screen.selector);
      
      // Should show the corresponding screen title
      await expect(page.locator(`text=${screen.name}`)).toBeVisible();
      
      // Should highlight the active navigation item
      const navItem = page.locator(`nav >> text=${screen.name}`);
      await expect(navItem).toHaveClass(/bg-blue-600/);
    }
  });

  test('should work with keyboard shortcuts', async ({ page }) => {
    // Test calendar shortcut (C)
    await page.keyboard.press('c');
    await expect(page.locator('text=Calendário')).toBeVisible();
    
    // Test squad shortcut (E)
    await page.keyboard.press('e');
    await expect(page.locator('text=Elenco do Clube')).toBeVisible();
    
    // Test tactics shortcut (T)
    await page.keyboard.press('t');
    await expect(page.locator('text=Táticas')).toBeVisible();
    
    // Test inbox shortcut (I)
    await page.keyboard.press('i');
    await expect(page.locator('text=Mensagens')).toBeVisible();
    
    // Test scouting shortcut (S)
    await page.keyboard.press('s');
    await expect(page.locator('text=Relatórios de Scouting')).toBeVisible();
    
    // Test menu shortcut (Escape)
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Menu Principal')).toBeVisible();
  });

  test('should toggle sidebar collapse', async ({ page }) => {
    // Sidebar should be expanded by default
    await expect(page.locator('text=ManagerX')).toBeVisible();
    await expect(page.locator('text=Gerenciador de Futebol')).toBeVisible();
    
    // Click collapse button
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Sidebar should be collapsed (text should be hidden)
    await expect(page.locator('text=Gerenciador de Futebol')).not.toBeVisible();
    
    // Click expand button
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Sidebar should be expanded again
    await expect(page.locator('text=ManagerX')).toBeVisible();
  });

  test('should toggle club assistant', async ({ page }) => {
    // Assistant should be visible by default
    await expect(page.locator('text=Assistente do Clube')).toBeVisible();
    
    // Click toggle button
    await page.click('[data-testid="assistant-toggle"]');
    
    // Assistant should be hidden
    await expect(page.locator('text=Assistente do Clube')).not.toBeVisible();
    
    // Click toggle again
    await page.click('[data-testid="assistant-toggle"]');
    
    // Assistant should be visible again
    await expect(page.locator('text=Assistente do Clube')).toBeVisible();
  });

  test('should show tooltips on hover', async ({ page }) => {
    // Hover over sidebar toggle
    await page.hover('[data-testid="sidebar-toggle"]');
    
    // Should show tooltip
    await expect(page.locator('text=Recolher')).toBeVisible();
    
    // Hover over assistant toggle
    await page.hover('[data-testid="assistant-toggle"]');
    
    // Should show tooltip
    await expect(page.locator('text=Fechar Assistente')).toBeVisible();
  });

  test('should maintain navigation state during simulation', async ({ page }) => {
    // Start on calendar
    await page.click('text=Calendário');
    
    // Start a match
    const matchButton = page.locator('text=Jogar').first();
    if (await matchButton.isVisible()) {
      await matchButton.click();
    }
    
    // Should be on match screen
    await expect(page.locator('text=vs')).toBeVisible();
    
    // Navigation should still work during match
    await page.click('text=Elenco');
    await expect(page.locator('text=Elenco do Clube')).toBeVisible();
    
    // Can navigate back to match
    await page.click('text=Partida');
    await expect(page.locator('text=vs')).toBeVisible();
  });

  test('should handle rapid navigation without errors', async ({ page }) => {
    // Rapidly navigate between screens
    const shortcuts = ['c', 'e', 't', 'i', 's', 'c', 'e', 't'];
    
    for (const shortcut of shortcuts) {
      await page.keyboard.press(shortcut);
      await page.waitForTimeout(100); // Small delay
    }
    
    // Should end up on the last screen (tactics)
    await expect(page.locator('text=Táticas')).toBeVisible();
    
    // App should still be responsive
    await page.click('text=Calendário');
    await expect(page.locator('text=Calendário')).toBeVisible();
  });
});
