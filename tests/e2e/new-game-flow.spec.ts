import { test, expect } from '@playwright/test';

test.describe('New Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await expect(page.locator('text=ManagerX')).toBeVisible();
  });

  test('should complete new game creation flow', async ({ page }) => {
    // Step 1: Click New Game from main menu
    await page.click('text=Novo Jogo');
    
    // Should navigate to new game screen
    await expect(page.locator('text=Detalhes do Técnico')).toBeVisible();
    
    // Step 2: Enter manager details
    await page.fill('input[placeholder="Digite seu nome"]', 'Test Manager');
    
    // Select difficulty (optional - defaults should work)
    await page.click('text=Normal');
    
    // Click next
    await page.click('text=Próximo');
    
    // Step 3: Select league
    await expect(page.locator('text=AlbionX Premier League')).toBeVisible();
    await page.click('text=AlbionX Premier League');
    
    // Step 4: Select club
    await expect(page.locator('text=AlbionX FC')).toBeVisible();
    
    // Use search to find a specific club
    await page.fill('input[placeholder="Buscar clube..."]', 'AlbionX FC');
    await page.click('text=AlbionX FC');
    
    // Start the game
    await page.click('text=Iniciar Carreira');
    
    // Should navigate to calendar/game view
    await expect(page.locator('text=Calendário')).toBeVisible({ timeout: 10000 });
    
    // Verify we're in the game
    await expect(page.locator('text=AlbionX FC')).toBeVisible();
  });

  test('should validate required fields in new game', async ({ page }) => {
    await page.click('text=Novo Jogo');
    
    // Try to proceed without entering manager name
    await page.click('text=Próximo');
    
    // Button should be disabled
    const nextButton = page.locator('text=Próximo');
    await expect(nextButton).toBeDisabled();
    
    // Enter name and button should become enabled
    await page.fill('input[placeholder="Digite seu nome"]', 'Test Manager');
    await expect(nextButton).toBeEnabled();
  });

  test('should allow searching and filtering clubs', async ({ page }) => {
    // Navigate through new game flow to club selection
    await page.click('text=Novo Jogo');
    await page.fill('input[placeholder="Digite seu nome"]', 'Test Manager');
    await page.click('text=Próximo');
    await page.click('text=AlbionX Premier League');
    
    // Test search functionality
    await page.fill('input[placeholder="Buscar clube..."]', 'United');
    
    // Should filter clubs containing "United"
    await expect(page.locator('text=United AlbionX')).toBeVisible();
    
    // Clear search
    await page.fill('input[placeholder="Buscar clube..."]', '');
    
    // Should show all clubs again
    await expect(page.locator('text=AlbionX FC')).toBeVisible();
  });

  test('should show club reputation stars', async ({ page }) => {
    // Navigate to club selection
    await page.click('text=Novo Jogo');
    await page.fill('input[placeholder="Digite seu nome"]', 'Test Manager');
    await page.click('text=Próximo');
    await page.click('text=AlbionX Premier League');
    
    // Check that reputation stars are visible
    const clubCard = page.locator('text=AlbionX FC').locator('..');
    await expect(clubCard.locator('[data-testid="reputation-stars"]')).toBeVisible();
  });
});
