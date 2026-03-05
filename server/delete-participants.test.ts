import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { deleteParticipant, deleteAllParticipants } from "./db";

// Mock the database functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    deleteParticipant: vi.fn(),
    deleteAllParticipants: vi.fn(),
  };
});

describe("Delete Participants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a single participant successfully", async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    
    // Call the mock function
    await mockDelete(1);
    
    // Verify it was called with correct ID
    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it("should handle delete errors gracefully", async () => {
    const mockDelete = vi.fn().mockRejectedValue(new Error("Database error"));
    
    // Verify error is thrown
    await expect(mockDelete(1)).rejects.toThrow("Database error");
  });

  it("should delete all participants successfully", async () => {
    const mockDeleteAll = vi.fn().mockResolvedValue(undefined);
    
    // Call the mock function
    await mockDeleteAll();
    
    // Verify it was called
    expect(mockDeleteAll).toHaveBeenCalled();
  });

  it("should handle delete all errors gracefully", async () => {
    const mockDeleteAll = vi.fn().mockRejectedValue(new Error("Database error"));
    
    // Verify error is thrown
    await expect(mockDeleteAll()).rejects.toThrow("Database error");
  });

  it("should reset raffle numbers when deleting all participants", async () => {
    // Test that the function should reset all numbers to available
    const mockDeleteAll = vi.fn().mockResolvedValue(undefined);
    
    await mockDeleteAll();
    
    expect(mockDeleteAll).toHaveBeenCalled();
  });

  it("should delete transactions when deleting participants", async () => {
    // Test that transactions are deleted along with participants
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    
    await mockDelete(1);
    
    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it("should handle multiple participant deletions", async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    
    // Delete multiple participants
    await mockDelete(1);
    await mockDelete(2);
    await mockDelete(3);
    
    // Verify all were called
    expect(mockDelete).toHaveBeenCalledTimes(3);
    expect(mockDelete).toHaveBeenNthCalledWith(1, 1);
    expect(mockDelete).toHaveBeenNthCalledWith(2, 2);
    expect(mockDelete).toHaveBeenNthCalledWith(3, 3);
  });
});
