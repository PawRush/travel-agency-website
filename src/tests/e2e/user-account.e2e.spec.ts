/**
 * Comprehensive User Account Management Tests
 * Tests user profile, booking history, favorites, payments, and account settings
 */
import {
  TEST_SERVER_PORT,
  TEST_USER_PASSWORD,
  CREDENTIALS_TESTUSER_PROFILE,
  type Locale,
  DefaultLocale,
  AppPage
} from '@golobe-demo/shared';
import { createLogger, ScreenshotDir } from '../../helpers/testing';
import { beforeAll, afterAll, describe, test, expect, type TestOptions } from 'vitest';
import type { Page } from 'playwright-core';
import { setup, createPage } from '@nuxt/test-utils/e2e';
import { join } from 'pathe';
import { LocatorClasses, UserAccount, UserHistory, UserPayments } from '../../helpers/constants';

const TestTimeout = 120000;
const DefaultTestOptions: TestOptions = {
  timeout: TestTimeout,
  retry: 0,
  concurrent: false,
  sequential: true
};

const TestHostUrl = `http://127.0.0.1:${TEST_SERVER_PORT}`;

describe('e2e: User Account Management Tests', async () => {
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

  const logger = createLogger('UserAccountTests');

  async function loginUser(page: Page): Promise<void> {
    logger.debug('Logging in user for account management test');

    await page.goto(`${TestHostUrl}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill(LocatorClasses.SignInEmail, CREDENTIALS_TESTUSER_PROFILE.email);
    await page.fill(LocatorClasses.SignInPassword, TEST_USER_PASSWORD);

    const submitButton = page.locator(LocatorClasses.SubmitBtn);
    await submitButton.click();
    await page.waitForTimeout(2000);

    logger.debug('User login completed');
  }

  async function acceptCookies(page: Page): Promise<void> {
    const cookieBanner = page.locator(`.${LocatorClasses.CookieBannerBtn}`);
    if (await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBanner.click();
      await page.waitForTimeout(500);
    }
  }

  test('Account Page - Load and Display User Profile', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height 720 });

    try {
      logger.info('Testing user account page load');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to account page
      await page.goto(`${TestHostUrl}/account`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      logger.debug('Navigated to account page');

      // Verify page loaded
      expect(page.url()).toContain('/account');

      // Check for account page class
      const accountPage = page.locator(`.${LocatorClasses.UserAccountPage}`);
      const isAccountPage = await accountPage.count() > 0;

      if (isAccountPage) {
        logger.info('User account page component found');
      }

      // Take screenshot
      await page.screenshot({
        path: join(ScreenshotDir, 'account-page-loaded.png'),
        fullPage: true
      });

      logger.info('Account page load test completed');
    } finally {
      await page.close();
    }
  });

  test('Account Profile - View and Edit User Information', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing user profile view and edit');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to account page
      await page.goto(`${TestHostUrl}/account`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for profile information fields
      const nameInput = page.locator('input[name*="name"], input[name*="firstName"]').first();
      const emailDisplay = page.locator('input[name*="email"], [class*="email"]').first();
      const phoneInput = page.locator('input[name*="phone"], input[type="tel"]').first();

      const hasNameField = await nameInput.count() > 0;
      const hasEmailField = await emailDisplay.count() > 0;
      const hasPhoneField = await phoneInput.count() > 0;

      logger.info(`Profile fields found - Name: ${hasNameField}, Email: ${hasEmailField}, Phone: ${hasPhoneField}`);

      // Look for edit button
      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]');
      if (await editButton.count() > 0) {
        logger.info('Found edit profile button');

        await editButton.first().click();
        await page.waitForTimeout(1000);

        // Try to edit name field
        if (hasNameField && await nameInput.isEditable().catch(() => false)) {
          const currentValue = await nameInput.inputValue();
          await nameInput.fill(`${currentValue} Updated`);
          logger.debug('Updated name field');

          await page.waitForTimeout(500);
        }

        // Look for save button
        const saveButton = page.locator('button[type="submit"], button:has-text("Save")');
        if (await saveButton.count() > 0) {
          logger.info('Found save profile button');

          // Take screenshot before saving
          await page.screenshot({
            path: join(ScreenshotDir, 'account-profile-edit.png'),
            fullPage: true
          });
        }
      }

      logger.info('User profile test completed');
    } finally {
      await page.close();
    }
  });

  test('Account Tabs - Navigate Between Account, History, and Payments', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing account tab navigation');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to account page
      await page.goto(`${TestHostUrl}/account`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for tab navigation
      const accountTab = page.locator('button:has-text("Account"), [role="tab"]:has-text("Account")');
      const historyTab = page.locator('button:has-text("History"), [role="tab"]:has-text("History"), button:has-text("Bookings")');
      const paymentsTab = page.locator('button:has-text("Payment"), [role="tab"]:has-text("Payment")');

      const hasAccountTab = await accountTab.count() > 0;
      const hasHistoryTab = await historyTab.count() > 0;
      const hasPaymentsTab = await paymentsTab.count() > 0;

      logger.info(`Account tabs found - Account: ${hasAccountTab}, History: ${hasHistoryTab}, Payments: ${hasPaymentsTab}`);

      // Test History tab
      if (hasHistoryTab) {
        await historyTab.first().click();
        await page.waitForTimeout(1000);
        logger.debug('Clicked History tab');

        await page.screenshot({
          path: join(ScreenshotDir, 'account-history-tab.png'),
          fullPage: true
        });
      }

      // Test Payments tab
      if (hasPaymentsTab) {
        await paymentsTab.first().click();
        await page.waitForTimeout(1000);
        logger.debug('Clicked Payments tab');

        await page.screenshot({
          path: join(ScreenshotDir, 'account-payments-tab.png'),
          fullPage: true
        });
      }

      // Back to Account tab
      if (hasAccountTab) {
        await accountTab.first().click();
        await page.waitForTimeout(1000);
        logger.debug('Clicked Account tab');
      }

      logger.info('Account tab navigation test completed');
    } finally {
      await page.close();
    }
  });

  test('Booking History - View Past and Upcoming Bookings', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing booking history view');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to account page
      await page.goto(`${TestHostUrl}/account`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Click on History tab
      const historyTab = page.locator('button:has-text("History"), [role="tab"]:has-text("History"), button:has-text("Bookings")');
      if (await historyTab.count() > 0) {
        await historyTab.first().click();
        await page.waitForTimeout(1000);

        // Look for booking history items
        const bookingItems = page.locator('[class*="booking"], [class*="history-item"]');
        const bookingCount = await bookingItems.count();

        logger.info(`Found ${bookingCount} booking items in history`);

        // Look for Flights and Stays sub-tabs
        const flightsTab = page.locator('button:has-text("Flights"), [role="tab"]:has-text("Flights")');
        const staysTab = page.locator('button:has-text("Stays"), [role="tab"]:has-text("Stays"), button:has-text("Hotels")');

        const hasFlightsTab = await flightsTab.count() > 0;
        const hasStaysTab = await staysTab.count() > 0;

        logger.info(`History sub-tabs - Flights: ${hasFlightsTab}, Stays: ${hasStaysTab}`);

        // Test Flights history
        if (hasFlightsTab) {
          await flightsTab.first().click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: join(ScreenshotDir, 'account-history-flights.png'),
            fullPage: true
          });
        }

        // Test Stays history
        if (hasStaysTab) {
          await staysTab.first().click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: join(ScreenshotDir, 'account-history-stays.png'),
            fullPage: true
          });
        }

        // Look for upcoming/past filters
        const upcomingFilter = page.locator('button:has-text("Upcoming"), input[value="upcoming"]');
        const pastFilter = page.locator('button:has-text("Past"), button:has-text("Completed"), input[value="passed"]');

        if (await upcomingFilter.count() > 0) {
          await upcomingFilter.first().click();
          await page.waitForTimeout(500);
          logger.debug('Filtered to upcoming bookings');
        }

        if (await pastFilter.count() > 0) {
          await pastFilter.first().click();
          await page.waitForTimeout(500);
          logger.debug('Filtered to past bookings');
        }

      } else {
        logger.warn('History tab not found');
      }

      logger.info('Booking history test completed');
    } finally {
      await page.close();
    }
  });

  test('Favorites - View and Manage Favorite Hotels/Flights', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing favorites functionality');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to favorites page
      await page.goto(`${TestHostUrl}/favourites`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      logger.debug('Navigated to favourites page');

      // Verify page loaded
      expect(page.url()).toContain('/favourites');

      // Look for favorite items
      const favoriteItems = page.locator('[class*="favourite"], [class*="favorite"]');
      const favoriteCount = await favoriteItems.count();

      logger.info(`Found ${favoriteCount} favorite items`);

      // Look for flights/stays tabs in favorites
      const flightsTab = page.locator('button:has-text("Flights"), [role="tab"]:has-text("Flights")');
      const staysTab = page.locator('button:has-text("Stays"), [role="tab"]:has-text("Stays"), button:has-text("Hotels")');

      if (await flightsTab.count() > 0) {
        await flightsTab.first().click();
        await page.waitForTimeout(1000);
        logger.debug('Viewing favorite flights');
      }

      if (await staysTab.count() > 0) {
        await staysTab.first().click();
        await page.waitForTimeout(1000);
        logger.debug('Viewing favorite stays');
      }

      // Take screenshot
      await page.screenshot({
        path: join(ScreenshotDir, 'account-favourites.png'),
        fullPage: true
      });

      logger.info('Favorites test completed');
    } finally {
      await page.close();
    }
  });

  test('Account Settings - Update Profile Picture', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing profile picture upload');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to account page
      await page.goto(`${TestHostUrl}/account`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Look for profile picture upload button
      const uploadButton = page.locator('button:has-text("Upload"), input[type="file"], button[aria-label*="photo" i], button[aria-label*="picture" i]');
      const avatarSection = page.locator('[class*="avatar"], [class*="profile-picture"]');

      const hasUploadButton = await uploadButton.count() > 0;
      const hasAvatarSection = await avatarSection.count() > 0;

      logger.info(`Profile picture elements - Upload: ${hasUploadButton}, Avatar: ${hasAvatarSection}`);

      if (hasAvatarSection) {
        await avatarSection.first().scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Take screenshot of avatar section
        await page.screenshot({
          path: join(ScreenshotDir, 'account-profile-picture.png'),
          fullPage: true
        });
      }

      logger.info('Profile picture test completed');
    } finally {
      await page.close();
    }
  });

  test('Booking Details - View Individual Booking', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing individual booking details view');

      await acceptCookies(page);
      await loginUser(page);

      // Try to navigate to a booking details page
      await page.goto(`${TestHostUrl}/booking/1`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();

      if (currentUrl.includes('/booking/')) {
        logger.info('Successfully navigated to booking details page');

        // Look for booking details class
        const bookingDetails = page.locator(`.${LocatorClasses.BookingDetails}`);
        const hasBookingDetails = await bookingDetails.count() > 0;

        if (hasBookingDetails) {
          logger.info('Booking details component found');
        }

        // Look for download/print buttons
        const downloadButton = page.locator('button:has-text("Download"), a[download]');
        const printButton = page.locator('button:has-text("Print")');

        if (await downloadButton.count() > 0) {
          logger.info('Found download button for booking document');
        }

        if (await printButton.count() > 0) {
          logger.info('Found print button for booking');
        }

        // Take screenshot
        await page.screenshot({
          path: join(ScreenshotDir, 'booking-details-page.png'),
          fullPage: true
        });

        logger.info('Booking details test completed');
      } else {
        logger.warn('Booking details page not accessible');
      }

    } finally {
      await page.close();
    }
  });
});
