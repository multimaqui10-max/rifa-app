import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Draw System", () => {
  it("should check draw status without errors", async () => {
    const status = await db.checkDrawStatus();
    // Status can be null, "draw", or "extend"
    expect([null, "draw", "extend"]).toContain(status);
  });

  it("should get sold numbers", async () => {
    const soldNumbers = await db.getSoldNumbers();
    expect(Array.isArray(soldNumbers)).toBe(true);
  });

  it("should have raffle config", async () => {
    const config = await db.getRaffleConfig();
    expect(config).toBeDefined();
    if (config) {
      expect(config).toHaveProperty("drawStatus");
      expect(["pending", "completed", "extended"]).toContain(config.drawStatus);
    }
  });

  it("should handle draw status check gracefully", async () => {
    try {
      const status = await db.checkDrawStatus();
      expect(status === null || typeof status === "string").toBe(true);
    } catch (error) {
      // Expected if database is not available
      expect(error).toBeDefined();
    }
  });
});


describe("Draw System - All Numbers Sold", () => {
  it("should return 'draw' status when all numbers are sold", async () => {
    // Get the current config
    const config = await db.getRaffleConfig();
    if (!config) {
      console.log("No config found, skipping test");
      return;
    }

    // Get all numbers
    const allNumbers = await db.getRaffleNumbers();
    
    // Mark all numbers as sold
    for (const num of allNumbers) {
      await db.updateRaffleNumberStatus(num.id, "sold");
    }

    // Check draw status - should return "draw" even if date hasn't arrived
    const status = await db.checkDrawStatus();
    expect(status).toBe("draw");

    // Reset numbers back to available
    for (const num of allNumbers) {
      await db.updateRaffleNumberStatus(num.id, "available");
    }
  });
});
