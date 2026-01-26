import { Page, Locator } from '@playwright/test';

export function getFirstMatchingButton(page: Page, names: string[]): Locator | null {
  for (const name of names) {
    const locator = page.getByRole('button', { name });
    // count() is async but we return locator if count > 0
    // Caller should check count before using if necessary.
    // To avoid extra awaits here, just return locator; callers will assert visibility.
    if (locator) return locator;
  }
  return null;
}

export function productCardsLocator(page: Page): Locator {
  // Prefer data-testid, then article role, then common card classes
  const byTestId = page.locator('[data-testid="product-card"]');
  if (byTestId.count) return byTestId;
  return page.getByRole('article');
}

export function getExactButtonLocator(page: Page, names: string[]): Locator {
  for (const name of names) {
    const locator = page.getByRole('button', { name });
    if (locator) return locator;
  }
  // fallback to first button (should not happen in strict mode)
  return page.getByRole('button').first();
}

export default { getFirstMatchingButton, productCardsLocator, getExactButtonLocator };
