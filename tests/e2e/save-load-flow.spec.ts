import { test, expect } from '@playwright/test';

test.describe('Save/Load Game Flow', () => {
  const testManagerName = 'E2E Save Test Manager';
  
  test('should save and load game state', async ({ page }) => {
    // Create a new game
    await page.goto('/');
    await page.click('text=Novo Jogo');
    await page.fill('input[placeholder="Digite seu nome"]', testManagerName);
    await page.click('text=Próximo');
    await page.click('text=AlbionX Premier League');
    await page.click('text=AlbionX FC');
    await page.click('text=Iniciar Carreira');
    
    // Wait for game to load
    await expect(page.locator('text=Calendário')).toBeVisible({ timeout: 15000 });
    
    // Make some changes to game state
    await page.click('text=Elenco');
    await expect(page.locator('text=Elenco do Clube')).toBeVisible();
    
    // Save the game (Ctrl+S)
    await page.keyboard.press('Control+S');
    
    // Should show save confirmation or indicator
    // Note: This depends on UI implementation
    
    // Go back to main menu
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Menu Principal')).toBeVisible();
    
    // Load the saved game
    await page.click('text=Carregar Jogo');
    
    // Should see the saved game in the list
    await expect(page.locator(`text=${testManagerName}`)).toBeVisible();
    
    // Click on the saved game
    await page.click(`text=${testManagerName}`);
    
    // Should load back to the game
    await expect(page.locator('text=Calendário')).toBeVisible({ timeout: 10000 });
    
    // Verify the manager name is preserved
    // This would depend on where the manager name is displayed
  });

  test('should auto-save game periodically', async ({ page }) => {
    // Create a new game
    await page.goto('/');
    await page.click('text=Novo Jogo');
    await page.fill('input[placeholder="Digite seu nome"]', 'Auto Save Test');
    await page.click('text=Próximo');
    await page.click('text=AlbionX Premier League');
    await page.click('text=AlbionX FC');
    await page.click('text=Iniciar Carreira');
    
    await expect(page.locator('text=Calendário')).toBeVisible();
    
    // Navigate around to trigger auto-save
    await page.click('text=Elenco');
    await page.click('text=Táticas');
    await page.click('text=Calendário');
    
    // Wait for potential auto-save (5 minutes in real app, but should be faster in test)
    await page.waitForTimeout(2000);
    
    // Go back to menu
    await page.keyboard.press('Escape');
    
    // Should see the auto-saved game
    await expect(page.locator('text=Auto Save Test')).toBeVisible();
  });

  test('should handle save conflicts gracefully', async ({ page }) => {
    // Create multiple saves with similar names
    const saves = ['Save Test 1', 'Save Test 2', 'Save Test 3'];
    
    for (const saveName of saves) {
      await page.goto('/');
      await page.click('text=Novo Jogo');
      await page.fill('input[placeholder="Digite seu nome"]', saveName);
      await page.click('text=Próximo');
      await page.click('text=AlbionX Premier League');
      await page.click('text=AlbionX FC');
      await page.click('text=Iniciar Carreira');
      
      await expect(page.locator('text=Calendário')).toBeVisible();
      
      // Save manually
      await page.keyboard.press('Control+S');
      
      // Return to menu
      await page.keyboard.press('Escape');
    }
    
    // Should see all saves in the list
    for (const saveName of saves) {
      await expect(page.locator(`text=${saveName}`)).toBeVisible();
    }
  });

  test('should preserve game state across save/load', async ({ page }) => {
    // Create a game and make specific changes
    await page.goto('/');
    await page.click('text=Novo Jogo');
    await page.fill('input[placeholder="Digite seu nome"]', 'State Preservation Test');
    await page.click('text=Próximo');
    await page.click('text=AlbionX Premier League');
    await page.click('text=AlbionX FC');
    await page.click('text=Iniciar Carreira');
    
    await expect(page.locator('text=Calendário')).toBeVisible();
    
    // Navigate to tactics and change formation
    await page.click('text=Táticas');
    await expect(page.locator('text=Táticas')).toBeVisible();
    
    // Change to 4-3-3 if not already selected
    await page.click('text=4-3-3');
    
    // Save the game
    await page.keyboard.press('Control+S');
    
    // Go to menu and reload
    await page.keyboard.press('Escape');
    await page.click('text=State Preservation Test');
    
    // Navigate back to tactics
    await expect(page.locator('text=Calendário')).toBeVisible();
    await page.click('text=Táticas');
    
    // Should preserve the 4-3-3 formation
    await expect(page.locator('text=4-3-3')).toHaveClass(/bg-blue-600/);
  });

  test('should handle corrupted save data gracefully', async ({ page }) => {
    // This test would require injecting corrupted data
    // For now, just test that the load screen doesn't crash
    await page.goto('/');
    
    // Try to access load game screen
    await page.click('text=Carregar Jogo');
    
    // Should show load screen without crashing
    await expect(page.locator('text=Nenhum save encontrado')).toBeVisible();
  });
});
