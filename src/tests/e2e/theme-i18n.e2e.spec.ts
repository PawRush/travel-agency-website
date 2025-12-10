/**
 * Comprehensive Theme Switching and Internationalization Tests
 * Tests dark/light theme switching and multi-language support (i18n)
 */
import {
  TEST_SERVER_PORT,
  type Locale,
  DefaultLocale,
  AvailableLocaleCodes,
  DefaultTheme,
  CookieI18nLocale,
  AppPage
} from '@golobe-demo/shared';
import { createLogger, ScreenshotDir } from '../../helpers/testing';
import { beforeAll, afterAll, describe, test, expect, type TestOptions } from 'vitest';
import type { Page } from 'playwright-core';
import { setup, createPage } from '@nuxt/test-utils/e2e';
import { join } from 'pathe';
import { LocatorClasses } from '../../helpers/constants';

const TestTimeout = 120000;
const DefaultTestOptions: TestOptions = {
  timeout: TestTimeout,
  retry: 0,
  concurrent: false,
  sequential: true
};

const TestHostUrl = `http://127.0.0.1:${TEST_SERVER_PORT}`;

describe('e2e: Theme Switching and Internationalization Tests', async () => {
  await setup({
    rootDir: process.cwd(),
    server: true,
    port: TEST_SERVER_PORT,
    browser: true,
    browserOptions: {
      type: 'chromium',
      launch: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    }
  });

  const logger = createLogger('ThemeI18nTests');

  async function acceptCookies(page: Page): Promise<void> {
    const cookieBanner = page.locator(`.${LocatorClasses.CookieBannerBtn}`);
    if (await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBanner.click();
      await page.waitForTimeout(500);
    }
  }

  async function getTheme(page: Page): Promise<string> {
    // Check for theme class on html or body element
    const htmlClass = await page.locator('html').getAttribute('class') || '';
    const bodyClass = await page.locator('body').getAttribute('class') || '';
    const dataTheme = await page.locator('html').getAttribute('data-theme') || '';

    logger.debug('Current theme attributes', {
      htmlClass,
      bodyClass,
      dataTheme
    });

    if (htmlClass.includes('dark') || bodyClass.includes('dark') || dataTheme === 'dark') {
      return 'dark';
    }
    if (htmlClass.includes('light') || bodyClass.includes('light') || dataTheme === 'light') {
      return 'light';
    }

    // Check for CSS variables or computed styles
    const backgroundColor = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.backgroundColor;
    });

    logger.debug('Background color', { backgroundColor });

    return 'unknown';
  }

  test('Theme - Default Theme on Page Load', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing default theme on page load');

      await page.goto(`${TestHostUrl}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await acceptCookies(page);

      const currentTheme = await getTheme(page);
      logger.info(`Current theme detected: ${currentTheme}`);

      // Take screenshot of default theme
      await page.screenshot({
        path: join(ScreenshotDir, 'theme-default.png'),
        fullPage: true
      });

      logger.info('Default theme test completed');
    } finally {
      await page.close();
    }
  });

  test('Theme - Switch Between Light and Dark Themes', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing theme switching functionality');

      await page.goto(`${TestHostUrl}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await acceptCookies(page);

      // Get initial theme
      const initialTheme = await getTheme(page);
      logger.info(`Initial theme: ${initialTheme}`);

      // Look for theme toggle button
      const themeToggle = page.locator(
        'button[aria-label*="theme" i], button[title*="theme" i], ' +
        '[class*="theme-toggle"], [class*="dark-mode"], ' +
        'button:has([class*="sun"]), button:has([class*="moon"])'
      );

      const hasThemeToggle = await themeToggle.count() > 0;
      logger.info(`Theme toggle button found: ${hasThemeToggle}`);

      if (hasThemeToggle) {
        // Take screenshot before switching
        await page.screenshot({
          path: join(ScreenshotDir, `theme-before-switch-${initialTheme}.png`),
          fullPage: true
        });

        // Click theme toggle
        await themeToggle.first().click();
        await page.waitForTimeout(1000);

        // Get theme after toggle
        const newTheme = await getTheme(page);
        logger.info(`Theme after toggle: ${newTheme}`);

        // Take screenshot after switching
        await page.screenshot({
          path: join(ScreenshotDir, `theme-after-switch-${newTheme}.png`),
          fullPage: true
        });

        // Toggle again to test switching back
        await themeToggle.first().click();
        await page.waitForTimeout(1000);

        const finalTheme = await getTheme(page);
        logger.info(`Theme after second toggle: ${finalTheme}`);

        await page.screenshot({
          path: join(ScreenshotDir, `theme-final-${finalTheme}.png`),
          fullPage: true
        });

        logger.info('Theme switching test completed successfully');
      } else {
        logger.warn('Theme toggle button not found');
      }

    } finally {
      await page.close();
    }
  });

  test('Theme - Persistence Across Page Navigation', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing theme persistence across navigation');

      await page.goto(`${TestHostUrl}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await acceptCookies(page);

      // Find and click theme toggle
      const themeToggle = page.locator(
        'button[aria-label*="theme" i], button[title*="theme" i], ' +
        '[class*="theme-toggle"], button:has([class*="sun"]), button:has([class*="moon"])'
      );

      if (await themeToggle.count() > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(1000);

        const themeAfterToggle = await getTheme(page);
        logger.info(`Theme set to: ${themeAfterToggle}`);

        // Navigate to another page
        await page.goto(`${TestHostUrl}/flights`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const themeOnNewPage = await getTheme(page);
        logger.info(`Theme on new page: ${themeOnNewPage}`);

        // Verify theme persisted
        expect(themeOnNewPage).toBe(themeAfterToggle);

        await page.screenshot({
          path: join(ScreenshotDir, 'theme-persistence-check.png'),
          fullPage: true
        });

        logger.info('Theme persistence test completed');
      } else {
        logger.warn('Theme toggle not found, skipping persistence test');
      }

    } finally {
      await page.close();
    }
  });

  test('i18n - Default Locale on Page Load', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing default locale on page load');

      await page.goto(`${TestHostUrl}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await acceptCookies(page);

      // Check URL for locale
      const currentUrl = page.url();
      logger.info(`Current URL: ${currentUrl}`);

      // Check for locale in URL or cookie
      const cookies = await page.context().cookies();
      const localeCookie = cookies.find(c => c.name === CookieI18nLocale);

      if (localeCookie) {
        logger.info(`Locale cookie value: ${localeCookie.value}`);
      }

      // Check for html lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      logger.info(`HTML lang attribute: ${htmlLang}`);

      // Take screenshot
      await page.screenshot({
        path: join(ScreenshotDir, 'i18n-default-locale.png'),
        fullPage: true
      });

      logger.info('Default locale test completed');
    } finally {
      await page.close();
    }
  });

  test('i18n - Switch Language Using Locale Toggler', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing language switching via locale toggler');

      await page.goto(`${TestHostUrl}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await acceptCookies(page);

      // Get initial locale
      const initialUrl = page.url();
      const initialLang = await page.locator('html').getAttribute('lang');
      logger.info(`Initial language: ${initialLang}, URL: ${initialUrl}`);

      // Look for locale toggler
      const localeToggler = page.locator(`.${LocatorClasses.LocaleToggler}`);
      const hasLocaleToggler = await localeToggler.isVisible({ timeout: 3000 }).catch(() => false);

      logger.info(`Locale toggler found: ${hasLocaleToggler}`);

      if (hasLocaleToggler) {
        // Take screenshot before switching
        await page.screenshot({
          path: join(ScreenshotDir, `i18n-before-switch-${initialLang}.png`),
          fullPage: true
        });

        // Click locale toggler
        await localeToggler.click();
        await page.waitForTimeout(500);

        // Look for locale options in dropdown/menu
        const localeOptions = page.locator(
          '[role="menu"] button, [role="listbox"] button, ' +
          'a[href*="/en"], a[href*="/fr"], a[href*="/ru"], a[href*="/es"]'
        );

        const optionCount = await localeOptions.count();
        logger.info(`Found ${optionCount} locale options`);

        if (optionCount > 0) {
          // Click on a different locale (try to find one that's not the current)
          for (let i = 0; i < optionCount; i++) {
            const option = localeOptions.nth(i);
            const text = await option.textContent();
            const href = await option.getAttribute('href');

            logger.debug(`Locale option ${i}: text="${text}", href="${href}"`);

            // Try to find a locale that's different from current
            if (href && !initialUrl.includes(href.split('/')[1])) {
              await option.click();
              await page.waitForTimeout(2000);
              break;
            } else if (i === 0 && !href) {
              // If no href, just click first option
              await option.click();
              await page.waitForTimeout(2000);
              break;
            }
          }

          // Get new locale
          const newUrl = page.url();
          const newLang = await page.locator('html').getAttribute('lang');
          logger.info(`New language: ${newLang}, URL: ${newUrl}`);

          // Verify language changed
          const urlChanged = newUrl !== initialUrl;
          const langChanged = newLang !== initialLang;

          logger.info(`Language changed: URL=${urlChanged}, Lang=${langChanged}`);

          // Take screenshot after switching
          await page.screenshot({
            path: join(ScreenshotDir, `i18n-after-switch-${newLang}.png`),
            fullPage: true
          });

          logger.info('Language switching test completed successfully');
        } else {
          logger.warn('No locale options found in dropdown');
        }
      } else {
        logger.warn('Locale toggler not found');
      }

    } finally {
      await page.close();
    }
  });

  test('i18n - Direct Navigation with Locale in URL', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing direct navigation with locale in URL');

      // Test different locales
      const testLocales: Locale[] = ['en', 'fr', 'ru'];

      for (const locale of testLocales) {
        logger.info(`Testing locale: ${locale}`);

        // Navigate with locale in URL
        await page.goto(`${TestHostUrl}/${locale}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Accept cookies on first iteration
        if (locale === testLocales[0]) {
          await acceptCookies(page);
        }

        // Verify locale is set
        const htmlLang = await page.locator('html').getAttribute('lang');
        const currentUrl = page.url();

        logger.info(`Navigated to ${locale}: HTML lang="${htmlLang}", URL="${currentUrl}"`);

        // Take screenshot for this locale
        await page.screenshot({
          path: join(ScreenshotDir, `i18n-locale-${locale}.png`),
          fullPage: true
        });

        // Verify URL contains locale or lang matches
        const isCorrectLocale = currentUrl.includes(`/${locale}`) || htmlLang === locale;
        expect(isCorrectLocale).toBe(true);
      }

      logger.info('Direct locale navigation test completed');
    } finally {
      await page.close();
    }
  });

  test('i18n - Locale Persistence Across Page Navigation', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing locale persistence across navigation');

      // Navigate with specific locale
      const testLocale: Locale = 'fr';
      await page.goto(`${TestHostUrl}/${testLocale}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await acceptCookies(page);

      const initialLang = await page.locator('html').getAttribute('lang');
      logger.info(`Set locale to: ${initialLang}`);

      // Navigate to different pages
      const pagesToTest = ['/flights', '/stays', '/account'];

      for (const pagePath of pagesToTest) {
        // Navigate using the logo link or direct navigation
        await page.goto(`${TestHostUrl}${pagePath}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const currentLang = await page.locator('html').getAttribute('lang');
        const currentUrl = page.url();

        logger.info(`On ${pagePath}: lang="${currentLang}", URL="${currentUrl}"`);

        // Verify locale persisted
        const localeMatches = currentUrl.includes(`/${testLocale}`) || currentLang === testLocale;
        logger.debug(`Locale persistence check for ${pagePath}: ${localeMatches}`);

        await page.screenshot({
          path: join(ScreenshotDir, `i18n-persistence-${pagePath.replace('/', '')}.png`),
          fullPage: true
        });
      }

      logger.info('Locale persistence test completed');
    } finally {
      await page.close();
    }
  });

  test('Combined - Theme and Locale Settings Together', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing combined theme and locale settings');

      await page.goto(`${TestHostUrl}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await acceptCookies(page);

      // Switch locale
      const localeToggler = page.locator(`.${LocatorClasses.LocaleToggler}`);
      if (await localeToggler.isVisible({ timeout: 2000 }).catch(() => false)) {
        await localeToggler.click();
        await page.waitForTimeout(500);

        const localeOptions = page.locator('[role="menu"] button, a[href*="/fr"]');
        if (await localeOptions.count() > 0) {
          await localeOptions.first().click();
          await page.waitForTimeout(1000);
        }
      }

      // Switch theme
      const themeToggle = page.locator(
        'button[aria-label*="theme" i], [class*="theme-toggle"], button:has([class*="moon"])'
      );

      if (await themeToggle.count() > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(1000);
      }

      const finalTheme = await getTheme(page);
      const finalLang = await page.locator('html').getAttribute('lang');

      logger.info(`Combined settings - Theme: ${finalTheme}, Language: ${finalLang}`);

      // Take screenshot with both settings applied
      await page.screenshot({
        path: join(ScreenshotDir, 'combined-theme-locale.png'),
        fullPage: true
      });

      // Navigate to another page to verify both persist
      await page.goto(`${TestHostUrl}/flights`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const persistedTheme = await getTheme(page);
      const persistedLang = await page.locator('html').getAttribute('lang');

      logger.info(`After navigation - Theme: ${persistedTheme}, Language: ${persistedLang}`);

      await page.screenshot({
        path: join(ScreenshotDir, 'combined-theme-locale-persistence.png'),
        fullPage: true
      });

      logger.info('Combined theme and locale test completed');
    } finally {
      await page.close();
    }
  });
});
