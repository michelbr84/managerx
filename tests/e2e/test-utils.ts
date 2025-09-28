// E2E test utilities and helpers

import { Page, expect } from '@playwright/test';

/**
 * Helper to create a new game quickly in E2E tests
 */
export async function createNewGame(
  page: Page, 
  managerName: string = 'E2E Test Manager',
  clubName: string = 'AlbionX FC'
): Promise<void> {
  await page.goto('/');
  await page.click('text=Novo Jogo');
  await page.fill('input[placeholder="Digite seu nome"]', managerName);
  await page.click('text=Próximo');
  await page.click('text=AlbionX Premier League');
  
  if (clubName !== 'AlbionX FC') {
    await page.fill('input[placeholder="Buscar clube..."]', clubName);
  }
  
  await page.click(`text=${clubName}`);
  await page.click('text=Iniciar Carreira');
  
  // Wait for game to load
  await expect(page.locator('text=Calendário')).toBeVisible({ timeout: 15000 });
}

/**
 * Helper to navigate to a specific screen
 */
export async function navigateToScreen(page: Page, screenName: string): Promise<void> {
  const shortcuts: Record<string, string> = {
    'Calendário': 'c',
    'Elenco': 'e',
    'Táticas': 't',
    'Mensagens': 'i',
    'Scouting': 's',
  };

  if (shortcuts[screenName]) {
    await page.keyboard.press(shortcuts[screenName]);
  } else {
    await page.click(`text=${screenName}`);
  }
  
  await expect(page.locator(`text=${screenName}`)).toBeVisible();
}

/**
 * Helper to save game and verify success
 */
export async function saveGame(page: Page): Promise<void> {
  await page.keyboard.press('Control+S');
  
  // Wait for save to complete (might show a toast or indicator)
  await page.waitForTimeout(1000);
}

/**
 * Helper to wait for match simulation to complete
 */
export async function waitForMatchCompletion(page: Page, timeout: number = 30000): Promise<void> {
  await expect(page.locator('text=Fim de Jogo')).toBeVisible({ timeout });
}

/**
 * Helper to start a match simulation
 */
export async function startMatchSimulation(page: Page): Promise<void> {
  await navigateToScreen(page, 'Calendário');
  
  // Find and click first available match
  const matchButton = page.locator('text=Jogar').first();
  if (await matchButton.isVisible()) {
    await matchButton.click();
  } else {
    // Alternative: click on match event
    const matchEvent = page.locator('[data-testid="match-event"]').first();
    await matchEvent.click();
  }
  
  await expect(page.locator('text=vs')).toBeVisible();
}

/**
 * Helper to verify screen elements are responsive
 */
export async function verifyScreenResponsiveness(page: Page, screenName: string): Promise<void> {
  await navigateToScreen(page, screenName);
  
  // Check that main content is visible
  await expect(page.locator('main')).toBeVisible();
  
  // Check that navigation is still accessible
  await expect(page.locator('nav')).toBeVisible();
  
  // Check that assistant toggle is available
  await expect(page.locator('[data-testid="assistant-toggle"]')).toBeVisible();
}

/**
 * Helper to test keyboard navigation
 */
export async function testKeyboardNavigation(page: Page): Promise<void> {
  const shortcuts = [
    { key: 'c', screen: 'Calendário' },
    { key: 'e', screen: 'Elenco' },
    { key: 't', screen: 'Táticas' },
    { key: 'i', screen: 'Mensagens' },
    { key: 's', screen: 'Scouting' },
  ];

  for (const { key, screen } of shortcuts) {
    await page.keyboard.press(key);
    await expect(page.locator(`text=${screen}`)).toBeVisible();
  }
}

/**
 * Helper to check for JavaScript errors
 */
export async function checkForJSErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Helper to measure page load performance
 */
export async function measurePageLoadPerformance(page: Page, url: string): Promise<{
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
}> {
  const startTime = Date.now();
  
  await page.goto(url);
  
  const loadTime = Date.now() - startTime;
  
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
    };
  });

  // Get First Contentful Paint if available
  const fcp = await page.evaluate(() => {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  });

  return {
    loadTime,
    domContentLoaded: performanceMetrics.domContentLoaded,
    firstContentfulPaint: fcp,
  };
}

/**
 * Helper to retry flaky operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Helper to wait for element with retry logic
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<void> {
  const { timeout = 5000, retries = 3 } = options;
  
  await retryOperation(async () => {
    await expect(page.locator(selector)).toBeVisible({ timeout });
  }, retries);
}
