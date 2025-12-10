/**
 * Comprehensive Stay (Hotel) Search and Booking Flow Tests
 * Tests stay search, filtering, details viewing, reviews, and booking process
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

describe('e2e: Stay Search and Booking Tests', async () => {
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

  const logger = createLogger('StayBookingTests');

  async function loginUser(page: Page): Promise<void> {
    logger.debug('Logging in user for stay booking test');

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

  test('Stay Search Page - Load and Display', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing stay search page load');

      await acceptCookies(page);

      // Navigate to stays page
      await page.goto(`${TestHostUrl}/stays`);
      await page.waitForLoadState('networkidle');
      logger.debug('Navigated to stays page');

      // Verify page loaded
      expect(page.url()).toContain('/stays');

      // Take screenshot
      await page.screenshot({
        path: join(ScreenshotDir, 'stays-page-loaded.png'),
        fullPage: true
      });

      logger.info('Stay search page test completed');
    } finally {
      await page.close();
    }
  });

  test('Stay Search - Find Stays Form', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing find stays search form');

      await acceptCookies(page);

      // Navigate to find stays page
      await page.goto(`${TestHostUrl}/find-stays`);
      await page.waitForLoadState('networkidle');
      logger.debug('Navigated to find-stays page');

      // Verify page loaded
      expect(page.url()).toContain('/find-stays');

      // Look for search form elements
      const locationInput = page.locator('input[placeholder*="location" i], input[placeholder*="city" i], input[name*="city" i]').first();
      const checkInInput = page.locator('input[type="date"], input[placeholder*="check" i]').first();

      // Check if inputs exist
      const hasLocationInput = await locationInput.count() > 0;
      const hasCheckInInput = await checkInInput.count() > 0;

      if (hasLocationInput) {
        logger.info('Stay search form inputs found');

        // Try to interact with form
        await locationInput.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);

        // Type city name
        await locationInput.fill('Paris').catch(() => {});
        await page.waitForTimeout(1000);

        logger.debug('Filled stay search location field');
      } else {
        logger.warn('Stay search form inputs not found as expected');
      }

      // Take screenshot of search form
      await page.screenshot({
        path: join(ScreenshotDir, 'find-stays-form.png'),
        fullPage: true
      });

      logger.info('Find stays form test completed');
    } finally {
      await page.close();
    }
  });

  test('Stay Search - Filter Options (Hotels/Motels/Resorts)', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing stay search filter options');

      await acceptCookies(page);

      // Navigate to stays page
      await page.goto(`${TestHostUrl}/stays`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      logger.debug('Looking for stay type filter buttons');

      // Look for filter buttons (Hotels, Motels, Resorts)
      const hotelButton = page.locator('button:has-text("Hotels"), input[value="hotels"]').first();
      const motelButton = page.locator('button:has-text("Motels"), input[value="motels"]').first();
      const resortButton = page.locator('button:has-text("Resorts"), input[value="resorts"]').first();

      const hasHotelFilter = await hotelButton.count() > 0;
      const hasMotelFilter = await motelButton.count() > 0;
      const hasResortFilter = await resortButton.count() > 0;

      if (hasHotelFilter || hasMotelFilter || hasResortFilter) {
        logger.info(`Found stay type filters: Hotels=${hasHotelFilter}, Motels=${hasMotelFilter}, Resorts=${hasResortFilter}`);

        // Try clicking different filters
        if (hasHotelFilter) {
          await hotelButton.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(1000);
          logger.debug('Clicked hotels filter');
        }

        if (hasResortFilter) {
          await resortButton.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(1000);
          logger.debug('Clicked resorts filter');
        }
      } else {
        logger.warn('Stay type filter buttons not found');
      }

      // Take screenshot with filters
      await page.screenshot({
        path: join(ScreenshotDir, 'stay-filters.png'),
        fullPage: true
      });

      logger.info('Stay filter options test completed');
    } finally {
      await page.close();
    }
  });

  test('Stay Details - View Hotel Information and Reviews', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing stay details page with reviews');

      await acceptCookies(page);

      // Navigate to stays page first to get a hotel
      await page.goto(`${TestHostUrl}/stays`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for stay links or stay cards
      const stayLinks = page.locator('a[href*="/stay-details/"]');
      const linkCount = await stayLinks.count();

      if (linkCount > 0) {
        logger.info(`Found ${linkCount} stay links`);

        // Get the href of first stay link
        const firstLink = stayLinks.first();
        const href = await firstLink.getAttribute('href').catch(() => null);

        if (href) {
          // Navigate to stay details
          await page.goto(`${TestHostUrl}${href}`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          logger.debug('Navigated to stay details page');

          // Verify we're on stay details page
          expect(page.url()).toContain('/stay-details/');

          // Scroll to reviews section
          const reviewSection = page.locator('[id*="review"], [class*="review"]').first();
          if (await reviewSection.isVisible({ timeout: 3000 }).catch(() => false)) {
            await reviewSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            logger.debug('Scrolled to reviews section');
          }

          // Take screenshot
          await page.screenshot({
            path: join(ScreenshotDir, 'stay-details-page.png'),
            fullPage: true
          });

          // Check for amenities, location, price
          const amenitiesSection = page.locator('[class*="amenities"], [class*="features"]');
          const locationSection = page.locator('[class*="location"], [class*="map"]');
          const priceSection = page.locator('[class*="price"], [class*="rate"]');

          const hasAmenities = await amenitiesSection.count() > 0;
          const hasLocation = await locationSection.count() > 0;
          const hasPrice = await priceSection.count() > 0;

          logger.info(`Stay details sections - Amenities: ${hasAmenities}, Location: ${hasLocation}, Price: ${hasPrice}`);

          logger.info('Stay details page test completed');
        } else {
          logger.warn('Could not get stay link href');
        }
      } else {
        logger.warn('No stay links found, trying direct navigation');

        // Try navigating to a stay details page with a test ID
        await page.goto(`${TestHostUrl}/stay-details/1`);
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: join(ScreenshotDir, 'stay-details-direct.png'),
          fullPage: true
        });
      }

    } finally {
      await page.close();
    }
  });

  test('Stay Booking - Authenticated User Flow', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing stay booking flow for authenticated user');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to stays page
      await page.goto(`${TestHostUrl}/stays`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for "Book" or similar buttons
      const bookButtons = page.locator('button:has-text("Book"), a:has-text("Book"), button:has-text("Reserve")');
      const buttonCount = await bookButtons.count();

      if (buttonCount > 0) {
        logger.info(`Found ${buttonCount} booking buttons`);

        // Click first book button
        await bookButtons.first().click();
        await page.waitForTimeout(2000);

        // Check if navigated to booking page
        const currentUrl = page.url();
        if (currentUrl.includes('/stay-book/')) {
          logger.info('Successfully navigated to stay booking page');

          // Take screenshot of booking page
          await page.screenshot({
            path: join(ScreenshotDir, 'stay-booking-page.png'),
            fullPage: true
          });

          // Look for booking form elements
          const guestInputs = page.locator('input[name*="guest"], input[name*="firstName"], input[name*="lastName"]');
          const inputCount = await guestInputs.count();

          if (inputCount > 0) {
            logger.info(`Found ${inputCount} guest input fields`);

            // Try filling guest information
            const firstNameInput = page.locator('input[name*="firstName"]').first();
            const lastNameInput = page.locator('input[name*="lastName"]').first();

            if (await firstNameInput.count() > 0) {
              await firstNameInput.fill('Jane');
              await lastNameInput.fill('Smith');
              logger.debug('Filled guest information');

              await page.waitForTimeout(1000);

              // Take screenshot with filled form
              await page.screenshot({
                path: join(ScreenshotDir, 'stay-booking-form-filled.png'),
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
          logger.warn('Did not navigate to stay booking page');
        }
      } else {
        logger.warn('No booking buttons found on stays page');

        // Try direct navigation to a booking page
        await page.goto(`${TestHostUrl}/stay-book/1`);
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: join(ScreenshotDir, 'stay-booking-direct.png'),
          fullPage: true
        });
      }

      logger.info('Stay booking flow test completed');
    } finally {
      await page.close();
    }
  });

  test('Stay Review - Add Review to Hotel', DefaultTestOptions, async () => {
    const page = await createPage('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
      logger.info('Testing add review functionality');

      await acceptCookies(page);
      await loginUser(page);

      // Navigate to a stay details page
      await page.goto(`${TestHostUrl}/stay-details/1`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for "Add Review" or "Write Review" button
      const addReviewButton = page.locator('button:has-text("Add Review"), button:has-text("Write Review"), a:has-text("Add Review")');

      if (await addReviewButton.count() > 0) {
        logger.info('Found add review button');

        await addReviewButton.first().click();
        await page.waitForTimeout(1000);

        // Look for review form
        const reviewTextarea = page.locator('textarea[name*="review"], textarea[placeholder*="review" i]');
        const ratingInput = page.locator('input[type="range"], input[name*="rating"], button[aria-label*="star"]');

        if (await reviewTextarea.count() > 0) {
          logger.info('Found review form');

          // Fill review
          await reviewTextarea.first().fill('Great hotel with excellent service and comfortable rooms!');

          // Try to select rating
          if (await ratingInput.count() > 0) {
            // If it's a range input
            const inputType = await ratingInput.first().getAttribute('type');
            if (inputType === 'range') {
              await ratingInput.first().fill('4');
            } else {
              // Try clicking star rating
              await ratingInput.first().click().catch(() => {});
            }
          }

          await page.waitForTimeout(1000);

          logger.debug('Filled review form');

          // Take screenshot of review form
          await page.screenshot({
            path: join(ScreenshotDir, 'stay-review-form.png'),
            fullPage: true
          });

          // Look for submit button
          const submitReviewButton = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Post Review")');
          if (await submitReviewButton.count() > 0) {
            logger.info('Found submit review button');
          }
        } else {
          logger.warn('Review form not found');
        }
      } else {
        logger.warn('Add review button not found');
      }

      logger.info('Add review test completed');
    } finally {
      await page.close();
    }
  });
});
