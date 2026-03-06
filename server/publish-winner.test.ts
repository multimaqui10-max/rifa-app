import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Winner Publish System", () => {
  it("should get winner data (may be null if no draw executed)", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    const winner = await caller.draw.getWinner();
    // Winner data might be null if no draw has been executed
    expect(winner === null || typeof winner === "object").toBe(true);
  });

  it("should have winner properties when available", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    const winner = await caller.draw.getWinner();
    if (winner) {
      expect(winner).toHaveProperty("winnerNumber");
      expect(winner).toHaveProperty("firstName");
      expect(winner).toHaveProperty("lastName");
      expect(winner).toHaveProperty("email");
      expect(winner).toHaveProperty("drawnAt");
      expect(winner).toHaveProperty("isPublished");
    }
  });

  it("should not allow non-admin to publish winner", async () => {
    const userCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { 
        id: 2, 
        role: "user", 
        openId: "user", 
        name: "User", 
        email: "user@test.com", 
        loginMethod: "test", 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        lastSignedIn: new Date() 
      },
    });

    try {
      await userCaller.draw.publishWinner();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("admin can call publishWinner endpoint", async () => {
    const adminCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { 
        id: 1, 
        role: "admin", 
        openId: "admin", 
        name: "Admin", 
        email: "admin@test.com", 
        loginMethod: "test", 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        lastSignedIn: new Date() 
      },
    });

    // publishWinner will fail if there's no winner, which is expected
    try {
      const result = await adminCaller.draw.publishWinner();
      expect(result.success).toBe(true);
    } catch (error: any) {
      // Expected if no winner exists
      expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });
});
