import { cleanupExpiredReservations, checkDrawStatus, executeDraw, extendRafflePeriod } from "./db";

/**
 * Background job to clean up expired reservations
 * Runs every hour to release numbers that have been reserved for more than 24 hours
 */
export async function startBackgroundJobs() {
  console.log("[Jobs] Starting background jobs...");

  // Run cleanup immediately on startup
  try {
    await cleanupExpiredReservations();
  } catch (error) {
    console.error("[Jobs] Failed to run initial cleanup:", error);
  }

  // Schedule cleanup to run every hour
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

  setInterval(async () => {
    try {
      console.log("[Jobs] Running scheduled cleanup of expired reservations...");
      await cleanupExpiredReservations();
    } catch (error) {
      console.error("[Jobs] Failed to cleanup expired reservations:", error);
    }
  }, CLEANUP_INTERVAL);

  // Schedule draw check to run every 6 hours
  const DRAW_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

  setInterval(async () => {
    try {
      console.log("[Jobs] Checking if draw should be executed...");
      const status = await checkDrawStatus();
      
      if (status === "draw") {
        console.log("[Jobs] Executing draw...");
        await executeDraw();
      } else if (status === "extend") {
        console.log("[Jobs] Extending raffle period...");
        await extendRafflePeriod();
      }
    } catch (error) {
      console.error("[Jobs] Failed to check draw status:", error);
    }
  }, DRAW_CHECK_INTERVAL);

  console.log("[Jobs] Background jobs started. Cleanup will run every hour, draw check every 6 hours.");
}
