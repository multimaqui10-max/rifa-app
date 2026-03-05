import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== RAFFLE CONFIG =====
  raffle: router({
    getConfig: publicProcedure.query(async () => {
      const config = await db.getRaffleConfig();
      const prizes = await db.getPrizes();
      return {
        config,
        prizes,
      };
    }),

    updateConfig: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(
        z.object({
          raffleTitle: z.string().optional(),
          raffleDescription: z.string().optional(),
          numberPrice: z.union([z.string(), z.number()]).optional(),
          drawDate: z.date().optional(),
          drawTime: z.string().optional(),
          mercadoPagoLink: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Convertir numberPrice a string si es número
        const processedInput = { ...input };
        if (typeof processedInput.numberPrice === 'number') {
          processedInput.numberPrice = processedInput.numberPrice.toString();
        }
        return await db.updateRaffleConfig(processedInput as any);
      }),

    // ===== PRIZES =====
    getPrizes: publicProcedure.query(async () => {
      return await db.getPrizes();
    }),

    createPrize: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(
        z.object({
          position: z.number(),
          title: z.string(),
          description: z.string().optional(),
          value: z.union([z.string(), z.number()]).optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const value = typeof input.value === 'number' ? String(input.value) : input.value;
        return await db.createPrize({
          position: input.position,
          title: input.title,
          description: input.description,
          value: value as any,
          imageUrl: input.imageUrl,
        });
      }),

    updatePrize: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(
        z.object({
          id: z.number(),
          position: z.number().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          value: z.union([z.string(), z.number()]).optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const value = typeof data.value === 'number' ? String(data.value) : data.value;
        return await db.updatePrize(id, { ...data, value } as any);
      }),

    deletePrize: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePrize(input.id);
      }),

    // ===== RAFFLE NUMBERS =====
    getNumbers: publicProcedure
      .input(
        z.object({
          status: z.enum(["available", "reserved", "sold"]).optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getRaffleNumbers(input.status);
      }),

    // ===== PARTICIPANTS & TRANSACTIONS =====
    getParticipants: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .query(async () => {
        return await db.getParticipants();
      }),

    getParticipantsWithNumbers: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .query(async () => {
        return await db.getParticipantsWithNumbers();
      }),

    markNumberAsSoldManual: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(
        z.object({
          raffleNumberId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateRaffleNumberStatus(input.raffleNumberId, "sold");
        return { success: true };
      }),

    getTransactions: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .query(async () => {
        return await db.getTransactions();
      }),

    // ===== RESERVATION FLOW =====
    reserveNumber: publicProcedure
      .input(
        z.object({
          raffleNumberId: z.number(),
          sessionId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // Clean up expired reservations
        await db.deleteExpiredReservations();

        const raffleNumber = await db.getRaffleNumberById(input.raffleNumberId);
        if (!raffleNumber) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Número no encontrado" });
        }

        if (raffleNumber.status !== "available") {
          throw new TRPCError({ code: "CONFLICT", message: "Este número no está disponible" });
        }

        // Check if already reserved by this session
        const existingReservation = await db.getReservationByNumberAndSession(
          input.raffleNumberId,
          input.sessionId
        );

        if (existingReservation) {
          return { success: true, reservation: existingReservation };
        }

        // Create reservation
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        const reservation = await db.createReservation({
          raffleNumberId: input.raffleNumberId,
          sessionId: input.sessionId,
          expiresAt,
        });

        // Update number status to reserved
        await db.updateRaffleNumberStatus(input.raffleNumberId, "reserved");

        return { success: true, reservation };
      }),

    cancelReservation: publicProcedure
      .input(
        z.object({
          raffleNumberId: z.number(),
          sessionId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const reservation = await db.getReservationByNumberAndSession(
          input.raffleNumberId,
          input.sessionId
        );

        if (!reservation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reserva no encontrada" });
        }

        // Delete reservation
        await db.deleteReservation(reservation.id);

        // Update number status back to available
        const raffleNumber = await db.getRaffleNumberById(input.raffleNumberId);
        if (raffleNumber && raffleNumber.status === "reserved") {
          // Check if this is the session that reserved it
          const isReservedByThisSession = await db.getReservationByNumberAndSession(
            input.raffleNumberId,
            input.sessionId
          );
          if (!isReservedByThisSession) {
            await db.updateRaffleNumberStatus(input.raffleNumberId, "available");
          }
        }

        return { success: true };
      }),

    // ===== PURCHASE FLOW =====
    createParticipant: publicProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email(),
          phone: z.string().min(1),
          raffleNumberId: z.number(),
          sessionId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // Verify reservation exists
        const reservation = await db.getReservationByNumberAndSession(
          input.raffleNumberId,
          input.sessionId
        );

        if (!reservation) {
          throw new TRPCError({ code: "CONFLICT", message: "Número no está reservado" });
        }

        // Create participant
        const participant = await db.createParticipant({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
        });

        // Update reservation with participantId
        if (participant && participant.id) {
          await db.updateReservationParticipant(reservation.id, participant.id);
        }

        return { success: true, participant };
      }),

    completeTransaction: publicProcedure
      .input(
        z.object({
          participantId: z.number(),
          raffleNumberId: z.number(),
          sessionId: z.string(),
          amount: z.string(),
          currency: z.string().default("USD"),
        })
      )
      .mutation(async ({ input }) => {
        // Verify reservation
        const reservation = await db.getReservationByNumberAndSession(
          input.raffleNumberId,
          input.sessionId
        );

        if (!reservation) {
          throw new TRPCError({ code: "CONFLICT", message: "Número no está reservado" });
        }

        // Create transaction
        const transaction = await db.createTransaction({
          participantId: input.participantId,
          raffleNumberId: input.raffleNumberId,
          amount: input.amount as any,
          currency: input.currency,
          status: "completed",
          completedAt: new Date(),
        });

        // Mark number as sold
        await db.updateRaffleNumberStatus(input.raffleNumberId, "sold");

        // Delete reservation
        await db.deleteReservation(reservation.id);

        return { success: true, transaction };
      }),

    // ===== ADMIN FUNCTIONS =====
    markNumberAsSold: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(
        z.object({
          raffleNumberId: z.number(),
          participantData: z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().email(),
            phone: z.string(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        // Create participant
        const participantResult = await db.createParticipant(input.participantData);
        
        if (!participantResult) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear el participante" });
        }

        // Get the participant ID from the result
        const participants = await db.getParticipants();
        const participant = participants[participants.length - 1];

        if (!participant) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo obtener el participante" });
        }

        // Create transaction
        const config = await db.getRaffleConfig();
        const transaction = await db.createTransaction({
          participantId: participant.id,
          raffleNumberId: input.raffleNumberId,
          amount: config?.numberPrice || "0",
          currency: "USD",
          status: "completed",
          completedAt: new Date(),
        });

        // Mark number as sold
        await db.updateRaffleNumberStatus(input.raffleNumberId, "sold");

        return { success: true, participant, transaction };
      }),

    releaseNumber: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(z.object({ raffleNumberId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateRaffleNumberStatus(input.raffleNumberId, "available");
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
