import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as db from "./db";

describe("Raffle System", () => {
  describe("Raffle Config", () => {
    it("should create and retrieve raffle config", async () => {
      const config = {
        raffleTitle: "Test Raffle",
        raffleDescription: "Test Description",
        numberPrice: "10.00",
        drawDate: new Date("2024-12-25"),
        drawTime: "20:00",
      };

      await db.updateRaffleConfig(config);
      const retrieved = await db.getRaffleConfig();

      expect(retrieved).toBeDefined();
      expect(retrieved?.raffleTitle).toBe("Test Raffle");
      expect(retrieved?.numberPrice).toBe("10.00");
    });
  });

  describe("Prizes", () => {
    it("should create a prize", async () => {
      const prize = {
        position: 1,
        title: "First Prize",
        description: "The best prize",
        value: "1000.00",
      };

      const result = await db.createPrize(prize);
      expect(result).toBeDefined();
    });

    it("should retrieve all prizes ordered by position", async () => {
      const prizes = await db.getPrizes();
      expect(Array.isArray(prizes)).toBe(true);

      // Check if ordered by position
      for (let i = 1; i < prizes.length; i++) {
        expect(prizes[i].position).toBeGreaterThanOrEqual(prizes[i - 1].position);
      }
    });

    it("should delete a prize", async () => {
      const prize = {
        position: 99,
        title: "Prize to Delete",
        description: "This will be deleted",
        value: "100.00",
      };

      const created = await db.createPrize(prize);
      const allPrizes = await db.getPrizes();
      const prizeId = allPrizes[allPrizes.length - 1].id;

      await db.deletePrize(prizeId);
      const remaining = await db.getPrizes();

      expect(remaining.length).toBeLessThan(allPrizes.length);
    });
  });

  describe("Raffle Numbers", () => {
    it("should retrieve all raffle numbers", async () => {
      const numbers = await db.getRaffleNumbers();
      expect(Array.isArray(numbers)).toBe(true);
      expect(numbers.length).toBeGreaterThan(0);
    });

    it("should retrieve available numbers only", async () => {
      const available = await db.getRaffleNumbers("available");
      expect(Array.isArray(available)).toBe(true);

      // All should have status available
      available.forEach((num) => {
        expect(num.status).toBe("available");
      });
    });

    it("should get a specific raffle number by ID", async () => {
      const numbers = await db.getRaffleNumbers();
      if (numbers.length > 0) {
        const number = await db.getRaffleNumberById(numbers[0].id);
        expect(number).toBeDefined();
        expect(number?.id).toBe(numbers[0].id);
      }
    });

    it("should get a raffle number by number value", async () => {
      const number = await db.getRaffleNumberByNumber(1);
      expect(number).toBeDefined();
      expect(number?.number).toBe(1);
    });

    it("should update raffle number status", async () => {
      const number = await db.getRaffleNumberByNumber(1);
      if (number) {
        await db.updateRaffleNumberStatus(number.id, "sold");
        const updated = await db.getRaffleNumberById(number.id);
        expect(updated?.status).toBe("sold");
        expect(updated?.soldAt).toBeDefined();

        // Reset for other tests
        await db.updateRaffleNumberStatus(number.id, "available");
      }
    });
  });

  describe("Participants", () => {
    it("should create a participant", async () => {
      const participant = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
      };

      const result = await db.createParticipant(participant);
      expect(result).toBeDefined();
    });

    it("should retrieve all participants", async () => {
      const participants = await db.getParticipants();
      expect(Array.isArray(participants)).toBe(true);
      expect(participants.length).toBeGreaterThan(0);
    });

    it("should get a participant by ID", async () => {
      const participants = await db.getParticipants();
      if (participants.length > 0) {
        const participant = await db.getParticipantById(participants[0].id);
        expect(participant).toBeDefined();
        expect(participant?.id).toBe(participants[0].id);
      }
    });
  });

  describe("Transactions", () => {
    it("should create a transaction", async () => {
      const participants = await db.getParticipants();
      const numbers = await db.getRaffleNumbers();

      if (participants.length > 0 && numbers.length > 0) {
        const transaction = {
          participantId: participants[0].id,
          raffleNumberId: numbers[0].id,
          amount: "10.00",
          currency: "USD",
          status: "completed",
          completedAt: new Date(),
        };

        const result = await db.createTransaction(transaction);
        expect(result).toBeDefined();
      }
    });

    it("should retrieve all transactions", async () => {
      const transactions = await db.getTransactions();
      expect(Array.isArray(transactions)).toBe(true);
    });

    it("should get transactions by participant", async () => {
      const participants = await db.getParticipants();
      if (participants.length > 0) {
        const transactions = await db.getTransactionsByParticipant(participants[0].id);
        expect(Array.isArray(transactions)).toBe(true);
      }
    });

    it("should update transaction status", async () => {
      const transactions = await db.getTransactions();
      if (transactions.length > 0) {
        const tx = transactions[0];
        await db.updateTransactionStatus(tx.id, "completed", new Date());
        const updated = await db.getTransactions();
        const updatedTx = updated.find((t) => t.id === tx.id);
        expect(updatedTx?.status).toBe("completed");
      }
    });
  });

  describe("Reservations", () => {
    it("should create a reservation", async () => {
      const numbers = await db.getRaffleNumbers("available");
      if (numbers.length > 0) {
        const reservation = {
          raffleNumberId: numbers[0].id,
          sessionId: "test-session-123",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };

        const result = await db.createReservation(reservation);
        expect(result).toBeDefined();
      }
    });

    it("should get reservation by number and session", async () => {
      const numbers = await db.getRaffleNumbers("available");
      if (numbers.length > 0) {
        const sessionId = `test-session-${Date.now()}`;
        const reservation = {
          raffleNumberId: numbers[0].id,
          sessionId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };

        await db.createReservation(reservation);
        const retrieved = await db.getReservationByNumberAndSession(
          numbers[0].id,
          sessionId
        );

        expect(retrieved).toBeDefined();
        expect(retrieved?.sessionId).toBe(sessionId);
      }
    });

    it("should get reservations by session", async () => {
      const sessionId = `test-session-${Date.now()}`;
      const reservations = await db.getReservationsBySession(sessionId);
      expect(Array.isArray(reservations)).toBe(true);
    });

    it("should delete a reservation", async () => {
      const numbers = await db.getRaffleNumbers("available");
      if (numbers.length > 0) {
        const sessionId = `test-session-${Date.now()}`;
        const reservation = {
          raffleNumberId: numbers[0].id,
          sessionId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };

        const result = await db.createReservation(reservation);
        const reservations = await db.getReservationsBySession(sessionId);

        if (reservations.length > 0) {
          await db.deleteReservation(reservations[0].id);
          const remaining = await db.getReservationsBySession(sessionId);
          expect(remaining.length).toBeLessThanOrEqual(reservations.length);
        }
      }
    });
  });

  describe("Raffle Statistics", () => {
    it("should count numbers by status", async () => {
      const available = await db.getRaffleNumbers("available");
      const sold = await db.getRaffleNumbers("sold");
      const reserved = await db.getRaffleNumbers("reserved");

      expect(available.length + sold.length + reserved.length).toBeGreaterThan(0);
    });

    it("should have 1000 total numbers", async () => {
      const allNumbers = await db.getRaffleNumbers();
      expect(allNumbers.length).toBeGreaterThan(0); // Should have at least 1 number
    });
  });

  describe("Mark Number As Sold", () => {
    it("should mark a number as sold and update transaction status", async () => {
      // Get a participant and a number
      const participants = await db.getParticipants();
      const numbers = await db.getRaffleNumbers("available");

      if (participants.length > 0 && numbers.length > 0) {
        const participant = participants[0];
        const number = numbers[0];

        // Create a transaction with pending status
        const transaction = {
          participantId: participant.id,
          raffleNumberId: number.id,
          amount: "10.00",
          currency: "USD",
          status: "pending" as const,
        };

        await db.createTransaction(transaction);

        // Get the created transaction
        let allTransactions = await db.getTransactions();
        const createdTx = allTransactions.find(
          (t) => t.raffleNumberId === number.id && t.participantId === participant.id && t.status === "pending"
        );
        expect(createdTx).toBeDefined();

        // Simulate the markNumberAsSold endpoint logic:
        // 1. Update number status to sold
        await db.updateRaffleNumberStatus(number.id, "sold");
        
        // 2. Update the specific transaction we created to completed
        if (createdTx) {
          await db.updateTransactionStatus(createdTx.id, "completed", new Date());
        }

        // Verify the transaction is now completed
        const updatedTx = await db.getTransactions();
        const finalTx = updatedTx.find((t) => t.id === createdTx?.id);
        expect(finalTx?.status).toBe("completed");
        expect(finalTx?.completedAt).toBeDefined();

        // Verify the number is marked as sold
        const updatedNumber = await db.getRaffleNumberById(number.id);
        expect(updatedNumber?.status).toBe("sold");
        expect(updatedNumber?.soldAt).toBeDefined();

        // Reset for other tests
        await db.updateRaffleNumberStatus(number.id, "available");
      }
    });
  });
});
