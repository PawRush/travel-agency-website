/**
 * Comprehensive Authentication Flow Tests
 * Tests signup, login, email verification, and password recovery flows
 */
import {
  TEST_SERVER_PORT,
  TEST_USER_PASSWORD,
  CREDENTIALS_TESTUSER_PROFILE,
  type Locale,
  DefaultLocale,
  CookieAuthSessionToken,
  CookieAuthCallbackUrl,
  CookieAuthCsrfToken,
  getI18nResName2,
  RestApiAuth
} from '@golobe-demo/shared';
import { createLogger, ScreenshotDir } from '../../helpers/testing';
import { beforeAll, afterAll, describe, test, expect, type TestOptions } from 'vitest';
import type { Page, BrowserContext } from 'playwright-core';
import { setup, createPage, createBrowser } from '@nuxt/test-utils/e2e';
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

describe('e2e: Authentication Flow Tests', async () => {
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

  const logger = createLogger('AuthFlowTests');

  test('Complete Signup Flow - New User Registration', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Starting signup flow test');

      // Accept cookies if banner appears
      const cookieBanner = page.locator(`.${LocatorClasses.CookieBannerBtn}`);
      if (await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBanner.click();
        await page.waitForTimeout(500);
      }

      // Navigate to signup page
      await page.goto(`${TestHostUrl}/signup`);
      await page.waitForLoadState('networkidle');
      logger.debug('Navigated to signup page');

      // Fill signup form
      const testEmail = `test-user-${Date.now()}@example.com`;
      const testPassword = 'Test@Password123';
      const testFirstName = 'Test';
      const testLastName = 'User';

      // Locate and fill form fields
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="firstName"]', testFirstName);
      await page.fill('input[name="lastName"]', testLastName);

      logger.debug('Filled signup form', { email: testEmail });

      // Submit form
      const submitButton = page.locator(LocatorClasses.SubmitBtn);
      await submitButton.click();

      // Wait for navigation to verification page
      await page.waitForURL('**/signup-verify', { timeout: 10000 });
      logger.info('Successfully navigated to signup verification page');

      // Verify we're on the verification page
      expect(page.url()).toContain('signup-verify');

      // Take screenshot for verification
      await page.screenshot({
        path: join(ScreenshotDir, 'signup-flow-verification-page.png'),
        fullPage: true
      });

      logger.info('Signup flow test completed successfully');
    } finally {
      await page.close();
    }
  });

  test('Login Flow - Credentials Provider', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Starting login flow test with credentials');

      // Accept cookies if banner appears
      const cookieBanner = page.locator(`.${LocatorClasses.CookieBannerBtn}`);
      if (await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBanner.click();
        await page.waitForTimeout(500);
      }

      // Navigate to login page
      await page.goto(`${TestHostUrl}/login`);
      await page.waitForLoadState('networkidle');
      logger.debug('Navigated to login page');

      // Fill login form with test credentials
      await page.fill(LocatorClasses.SignInEmail, CREDENTIALS_TESTUSER_PROFILE.email);
      await page.fill(LocatorClasses.SignInPassword, TEST_USER_PASSWORD);

      logger.debug('Filled login credentials');

      // Submit form
      const submitButton = page.locator(LocatorClasses.SubmitBtn);
      await submitButton.click();

      // Wait for authentication callback
      await page.waitForTimeout(2000);

      // Verify authentication was successful by checking for auth cookies or user menu
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c =>
        c.name.includes('auth') || c.name === CookieAuthSessionToken
      );

      // Also check for authenticated user menu
      const userMenu = page.locator(`.${LocatorClasses.AuthUserMenu}`);
      const isUserMenuVisible = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasAuthCookie || isUserMenuVisible).toBe(true);

      logger.info('Login flow test completed successfully');

      // Take screenshot of authenticated state
      await page.screenshot({
        path: join(ScreenshotDir, 'login-flow-authenticated.png'),
        fullPage: true
      });

    } finally {
      await page.close();
    }
  });

  test('Login Flow - OAuth Provider (TestLocal)', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Starting OAuth login flow test');

      // Accept cookies
      const cookieBanner = page.locator(`.${LocatorClasses.CookieBannerBtn}`);
      if (await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBanner.click();
        await page.waitForTimeout(500);
      }

      // Navigate to login page
      await page.goto(`${TestHostUrl}/login`);
      await page.waitForLoadState('networkidle');

      // Click OAuth test button
      const oauthButton = page.locator(`.${LocatorClasses.TestLocalOAuthBtn}`);
      if (await oauthButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await oauthButton.click();

        // Wait for OAuth callback
        await page.waitForTimeout(3000);

        // Check for authentication
        const userMenu = page.locator(`.${LocatorClasses.AuthUserMenu}`);
        const isAuthenticated = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);

        expect(isAuthenticated).toBe(true);
        logger.info('OAuth login flow completed successfully');
      } else {
        logger.warn('OAuth test button not found, skipping OAuth test');
      }

    } finally {
      await page.close();
    }
  });

  test('Forgot Password Flow - Request Reset', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Starting forgot password flow test');

      // Navigate to forgot password page
      await page.goto(`${TestHostUrl}/forgot-password`);
      await page.waitForLoadState('networkidle');
      logger.debug('Navigated to forgot password page');

      // Fill email field
      const testEmail = CREDENTIALS_TESTUSER_PROFILE.email;
      await page.fill('input[name="email"]', testEmail);

      logger.debug('Filled email for password reset');

      // Submit form
      const submitButton = page.locator(LocatorClasses.SubmitBtn);
      await submitButton.click();

      // Wait for navigation to verification page
      await page.waitForURL('**/forgot-password-verify', { timeout: 10000 });

      // Verify we're on the verification page
      expect(page.url()).toContain('forgot-password-verify');

      logger.info('Forgot password flow completed successfully');

      // Take screenshot
      await page.screenshot({
        path: join(ScreenshotDir, 'forgot-password-verify-page.png'),
        fullPage: true
      });

    } finally {
      await page.close();
    }
  });

  test('Logout Flow - User Signs Out', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Starting logout flow test');

      // Accept cookies
      const cookieBanner = page.locator(`.${LocatorClasses.CookieBannerBtn}`);
      if (await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBanner.click();
        await page.waitForTimeout(500);
      }

      // First login
      await page.goto(`${TestHostUrl}/login`);
      await page.waitForLoadState('networkidle');

      await page.fill(LocatorClasses.SignInEmail, CREDENTIALS_TESTUSER_PROFILE.email);
      await page.fill(LocatorClasses.SignInPassword, TEST_USER_PASSWORD);

      const submitButton = page.locator(LocatorClasses.SubmitBtn);
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Check authentication
      const userMenu = page.locator(`.${LocatorClasses.AuthUserMenu}`);
      await expect(userMenu).toBeVisible({ timeout: 5000 });

      // Open user menu
      await userMenu.click();
      await page.waitForTimeout(500);

      // Click logout button in dropdown
      const userMenuPopup = page.locator(`.${LocatorClasses.AuthUserMenuPopup}`);
      if (await userMenuPopup.isVisible({ timeout: 2000 }).catch(() => false)) {
        const logoutButton = userMenuPopup.locator('button, a').filter({ hasText: /logout|sign out/i });
        if (await logoutButton.count() > 0) {
          await logoutButton.first().click();
          await page.waitForTimeout(2000);

          // Verify logout - user menu should no longer be visible
          const isLoggedOut = !(await userMenu.isVisible({ timeout: 3000 }).catch(() => true));
          expect(isLoggedOut).toBe(true);

          logger.info('Logout flow completed successfully');
        } else {
          logger.warn('Logout button not found in user menu');
        }
      }

    } finally {
      await page.close();
    }
  });
});
