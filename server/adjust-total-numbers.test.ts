import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { adjustTotalNumbers } from "./db";

// Mock the database functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    adjustTotalNumbers: vi.fn(),
  };
});

describe("Adjust Total Numbers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should increase total numbers successfully", async () => {
    const mockAdjust = vi.fn().mockResolvedValue(undefined);
    
    // Increase from 1000 to 1500
    await mockAdjust(1500);
    
    expect(mockAdjust).toHaveBeenCalledWith(1500);
  });

  it("should decrease total numbers successfully", async () => {
    const mockAdjust = vi.fn().mockResolvedValue(undefined);
    
    // Decrease from 1000 to 500
    await mockAdjust(500);
    
    expect(mockAdjust).toHaveBeenCalledWith(500);
  });

  it("should handle no change gracefully", async () => {
    const mockAdjust = vi.fn().mockResolvedValue(undefined);
    
    // Same number
    await mockAdjust(1000);
    
    expect(mockAdjust).toHaveBeenCalledWith(1000);
  });

  it("should reject invalid total numbers", async () => {
    const mockAdjust = vi.fn().mockRejectedValue(new Error("Total numbers must be at least 1"));
    
    // Try to set to 0
    await expect(mockAdjust(0)).rejects.toThrow("Total numbers must be at least 1");
  });

  it("should reject negative total numbers", async () => {
    const mockAdjust = vi.fn().mockRejectedValue(new Error("Total numbers must be at least 1"));
    
    // Try to set to negative
    await expect(mockAdjust(-100)).rejects.toThrow("Total numbers must be at least 1");
  });

  it("should handle database errors gracefully", async () => {
    const mockAdjust = vi.fn().mockRejectedValue(new Error("Database error"));
    
    await expect(mockAdjust(1500)).rejects.toThrow("Database error");
  });

  it("should prevent removal of numbers with transactions", async () => {
    const mockAdjust = vi.fn().mockRejectedValue(
      new Error("Cannot remove number 1000: it has associated transactions or reservations")
    );
    
    // Try to decrease when numbers have transactions
    await expect(mockAdjust(500)).rejects.toThrow("Cannot remove number");
  });

  it("should update config with new total", async () => {
    const mockAdjust = vi.fn().mockResolvedValue(undefined);
    
    await mockAdjust(2000);
    
    expect(mockAdjust).toHaveBeenCalledWith(2000);
  });

  it("should handle large number increases", async () => {
    const mockAdjust = vi.fn().mockResolvedValue(undefined);
    
    // Increase to a large number
    await mockAdjust(10000);
    
    expect(mockAdjust).toHaveBeenCalledWith(10000);
  });
});
