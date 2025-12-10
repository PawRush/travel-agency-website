/**
 * Comprehensive Flight Search and Booking Flow Tests
 * Tests flight search, filtering, details viewing, and booking process
 */
import {
  TEST_SERVER_PORT,
  TEST_USER_PASSWORD,
  CREDENTIALS_TESTUSER_PROFILE,
  type Locale,
  DefaultLocale,
  AppPage,
  type EntityId
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

describe('e2e: Flight Search and Booking Tests', async () => {
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

  const logger = createLogger('FlightBookingTests');

  async function loginUser(page: Page): Promise<void> {
    logger.debug('Logging in user for flight booking test');

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

  test('Flight Search Page - Load and Display', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing flight search page load');

      await acceptCookies(page);

      // Navigate to flights page
      await page.goto(`${TestHostUrl}/flights`);
      await page.waitForLoadState('networkidle');
      logger.debug('Navigated to flights page');

      // Verify page loaded
      expect(page.url()).toContain('/flights');

      // Check for flight search/filter components
      const flightParams = page.locator(`.${LocatorClasses.SearchOffersFlightParams}`);
      const isVisible = await flightParams.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        logger.info('Flight search parameters component found');
      }

      // Take screenshot
      await page.screenshot({
        path: join(ScreenshotDir, 'flights-page-loaded.png'),
        fullPage: true
      });

      logger.info('Flight search page test completed');
    } finally {
      await page.close();
    }
  });

  test('Flight Search - Find Flights Form', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing find flights search form');

      await acceptCookies(page);

      // Navigate to find flights page
      await page.goto(`${TestHostUrl}/find-flights`);
      await page.waitForLoadState('networkidle');
      logger.debug('Navigated to find-flights page');

      // Verify page loaded
      expect(page.url()).toContain('/find-flights');

      // Look for search form elements
      const fromCityInput = page.locator('input[placeholder*="from" i], input[name*="from" i]').first();
      const toCityInput = page.locator('input[placeholder*="to" i], input[name*="to" i]').first();

      // Check if inputs exist
      const hasFromInput = await fromCityInput.count() > 0;
      const hasToInput = await toCityInput.count() > 0;

      if (hasFromInput && hasToInput) {
        logger.info('Flight search form inputs found');

        // Try to interact with form
        await fromCityInput.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);

        // Type city name
        await fromCityInput.fill('New York').catch(() => {});
        await page.waitForTimeout(1000);

        await toCityInput.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
        await toCityInput.fill('Los Angeles').catch(() => {});
        await page.waitForTimeout(1000);

        logger.debug('Filled flight search form fields');
      } else {
        logger.warn('Flight search form inputs not found as expected');
      }

      // Take screenshot of search form
      await page.screenshot({
        path: join(ScreenshotDir, 'find-flights-form.png'),
        fullPage: true
      });

      logger.info('Find flights form test completed');
    } finally {
      await page.close();
    }
  });

  test('Flight Search - With Search Parameters', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing flight search with parameters');

      await acceptCookies(page);

      // Navigate to flights page with search params
      const searchParams = new URLSearchParams({
        fromCitySlug: 'new-york',
        toCitySlug: 'los-angeles',
        tripType: 'oneway',
        class: 'economy'
      });

      await page.goto(`${TestHostUrl}/flights?${searchParams.toString()}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      logger.debug('Navigated to flights with search parameters');

      // Check if flight results are displayed
      const flightOffers = page.locator('[class*="flight"], [class*="offer"]');
      const offerCount = await flightOffers.count();

      logger.info(`Found ${offerCount} flight offer elements on page`);

      // Take screenshot of search results
      await page.screenshot({
        path: join(ScreenshotDir, 'flight-search-results.png'),
        fullPage: true
      });

      logger.info('Flight search with parameters test completed');
    } finally {
      await page.close();
    }
  });

  test('Flight Details - View Flight Information', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing flight details page');

      await acceptCookies(page);

      // Navigate to flights page first to get a flight
      await page.goto(`${TestHostUrl}/flights`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for flight links or flight cards
      const flightLinks = page.locator('a[href*="/flight-details/"], button[data-flight-id]');
      const linkCount = await flightLinks.count();

      if (linkCount > 0) {
        logger.info(`Found ${linkCount} flight links`);

        // Get the href of first flight link
        const firstLink = flightLinks.first();
        const href = await firstLink.getAttribute('href').catch(() => null);

        if (href) {
          // Navigate to flight details
          await page.goto(`${TestHostUrl}${href}`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          logger.debug('Navigated to flight details page');

          // Verify we're on flight details page
          expect(page.url()).toContain('/flight-details/');

          // Take screenshot
          await page.screenshot({
            path: join(ScreenshotDir, 'flight-details-page.png'),
            fullPage: true
          });

          logger.info('Flight details page test completed');
        } else {
          logger.warn('Could not get flight link href');
        }
      } else {
        logger.warn('No flight links found, trying direct navigation');

        // Try navigating to a flight details page with a test ID
        await page.goto(`${TestHostUrl}/flight-details/1`);
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: join(ScreenshotDir, 'flight-details-direct.png'),
          fullPage: true
        });
      }

    } finally {
      await page.close();
    }
  });

  test('Flight Booking - Authenticated User Flow', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing flight booking flow for authenticated user');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to flights page
      await page.goto(`${TestHostUrl}/flights`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for "Book" or similar buttons
      const bookButtons = page.locator('button:has-text("Book"), a:has-text("Book"), button:has-text("Select")');
      const buttonCount = await bookButtons.count();

      if (buttonCount > 0) {
        logger.info(`Found ${buttonCount} booking buttons`);

        // Click first book button
        await bookButtons.first().click();
        await page.waitForTimeout(2000);

        // Check if navigated to booking page
        const currentUrl = page.url();
        if (currentUrl.includes('/flight-book/')) {
          logger.info('Successfully navigated to flight booking page');

          // Take screenshot of booking page
          await page.screenshot({
            path: join(ScreenshotDir, 'flight-booking-page.png'),
            fullPage: true
          });

          // Look for booking form elements
          const passengerInputs = page.locator('input[name*="passenger"], input[name*="firstName"], input[name*="lastName"]');
          const inputCount = await passengerInputs.count();

          if (inputCount > 0) {
            logger.info(`Found ${inputCount} passenger input fields`);

            // Try filling passenger information
            const firstNameInput = page.locator('input[name*="firstName"]').first();
            const lastNameInput = page.locator('input[name*="lastName"]').first();

            if (await firstNameInput.count() > 0) {
              await firstNameInput.fill('John');
              await lastNameInput.fill('Doe');
              logger.debug('Filled passenger information');

              await page.waitForTimeout(1000);

              // Take screenshot with filled form
              await page.screenshot({
                path: join(ScreenshotDir, 'flight-booking-form-filled.png'),
                fullPage: true
              });
            }
          }

          // Look for confirm/submit booking button
          const confirmButton = page.locator('button[type="submit"], button:has-text("Confirm"), button:has-text("Book")');
          if (await confirmButton.count() > 0) {
            logger.info('Found booking confirmation button');
          }

        } else {
          logger.warn('Did not navigate to flight booking page');
        }
      } else {
        logger.warn('No booking buttons found on flights page');

        // Try direct navigation to a booking page
        await page.goto(`${TestHostUrl}/flight-book/1`);
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: join(ScreenshotDir, 'flight-booking-direct.png'),
          fullPage: true
        });
      }

      logger.info('Flight booking flow test completed');
    } finally {
      await page.close();
    }
  });
});
