import { eq, and, gte, lte, desc, asc, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, raffleConfig, prizes, raffleNumbers, participants, transactions, reservations } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== RAFFLE CONFIG =====

export async function getRaffleConfig() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(raffleConfig).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateRaffleConfig(data: Partial<typeof raffleConfig.$inferInsert> & { numberPrice?: string | number }) {
  const db = await getDb();
  if (!db) return null;
  
  // Convertir numberPrice a string si es número
  const processedData: any = { ...data };
  if (typeof processedData.numberPrice === 'number') {
    processedData.numberPrice = String(processedData.numberPrice);
  }
  
  const config = await getRaffleConfig();
  if (!config) {
    return await db.insert(raffleConfig).values(processedData as any);
  }
  
  return await db.update(raffleConfig).set(processedData).where(eq(raffleConfig.id, config.id));
}

// ===== PRIZES =====

export async function getPrizes() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(prizes).orderBy(asc(prizes.position));
}

export async function createPrize(data: typeof prizes.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(prizes).values(data);
}

export async function updatePrize(id: number, data: Partial<typeof prizes.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.update(prizes).set(data).where(eq(prizes.id, id));
}

export async function deletePrize(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.delete(prizes).where(eq(prizes.id, id));
}

// ===== RAFFLE NUMBERS =====

export async function getRaffleNumbers(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return await db.select().from(raffleNumbers).where(eq(raffleNumbers.status, status as any)).orderBy(asc(raffleNumbers.number));
  }
  
  return await db.select().from(raffleNumbers).orderBy(asc(raffleNumbers.number));
}

export async function getRaffleNumberById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(raffleNumbers).where(eq(raffleNumbers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getRaffleNumberByNumber(number: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(raffleNumbers).where(eq(raffleNumbers.number, number)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateRaffleNumberStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return null;
  
  const updateData: any = { status };
  if (status === "sold") {
    updateData.soldAt = new Date();
  } else if (status === "reserved") {
    updateData.reservedAt = new Date();
    updateData.reservationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  
  return await db.update(raffleNumbers).set(updateData).where(eq(raffleNumbers.id, id));
}

// ===== PARTICIPANTS =====

export async function createParticipant(data: typeof participants.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(participants).values(data);
  if (!result) return null;
  
  // Get the created participant by email (assuming email is unique or recent)
  const participants_list = await db.select().from(participants)
    .where(eq(participants.email, data.email))
    .orderBy(desc(participants.createdAt))
    .limit(1);
  
  return participants_list.length > 0 ? participants_list[0] : null;
}

export async function getParticipants() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(participants).orderBy(desc(participants.createdAt));
}

export async function getParticipantById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(participants).where(eq(participants.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== TRANSACTIONS =====

export async function createTransaction(data: typeof transactions.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(transactions).values(data);
}

export async function getTransactionByStripeId(stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(transactions).where(eq(transactions.stripePaymentIntentId, stripePaymentIntentId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateTransactionStatus(id: number, status: string, completedAt?: Date) {
  const db = await getDb();
  if (!db) return null;
  
  const updateData: any = { status };
  if (completedAt) {
    updateData.completedAt = completedAt;
  }
  
  return await db.update(transactions).set(updateData).where(eq(transactions.id, id));
}

export async function getTransactions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

export async function getTransactionsByParticipant(participantId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(transactions).where(eq(transactions.participantId, participantId)).orderBy(desc(transactions.createdAt));
}

// ===== RESERVATIONS =====

export async function createReservation(data: typeof reservations.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(reservations).values(data);
}

export async function getReservationByNumberAndSession(raffleNumberId: number, sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(reservations).where(
    and(
      eq(reservations.raffleNumberId, raffleNumberId),
      eq(reservations.sessionId, sessionId)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function deleteReservation(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.delete(reservations).where(eq(reservations.id, id));
}

export async function deleteExpiredReservations() {
  const db = await getDb();
  if (!db) return null;
  
  return await db.delete(reservations).where(lte(reservations.expiresAt, new Date()));
}

export async function getReservationsBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(reservations).where(eq(reservations.sessionId, sessionId));
}

export async function getAllReservations() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(reservations);
}

export async function getParticipantsWithNumbers() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all participants with their associated raffle numbers
  const participantsList = await db.select().from(participants).orderBy(desc(participants.createdAt));
  
  // For each participant, find their raffle number
  const result = await Promise.all(
    participantsList.map(async (participant) => {
      // Get the raffle number for this participant
      const txn = await db.select().from(transactions)
        .where(eq(transactions.participantId, participant.id))
        .limit(1);
      
      if (txn.length > 0 && txn[0].raffleNumberId) {
        const raffleNum = await db.select().from(raffleNumbers)
          .where(eq(raffleNumbers.id, txn[0].raffleNumberId))
          .limit(1);
        
        return {
          ...participant,
          raffleNumberId: txn[0].raffleNumberId,
          raffleNumber: raffleNum.length > 0 ? raffleNum[0].number : null,
          status: raffleNum.length > 0 ? raffleNum[0].status : null,
        };
      }
      
      // If no transaction, try to get from reservations (pending purchases)
      const reservation = await db.select().from(reservations)
        .where(eq(reservations.participantId, participant.id))
        .limit(1);
      
      if (reservation.length > 0 && reservation[0].raffleNumberId) {
        const raffleNum = await db.select().from(raffleNumbers)
          .where(eq(raffleNumbers.id, reservation[0].raffleNumberId))
          .limit(1);
        
        return {
          ...participant,
          raffleNumberId: reservation[0].raffleNumberId,
          raffleNumber: raffleNum.length > 0 ? raffleNum[0].number : null,
          status: raffleNum.length > 0 ? raffleNum[0].status : null,
        };
      }
      
      return {
        ...participant,
        raffleNumberId: null,
        raffleNumber: null,
        status: null,
      };
    })
  );
  
  return result;
}


export async function updateReservationParticipant(reservationId: number, participantId: number) {
  const db = await getDb();
  if (!db) return null;

  await db.update(reservations)
    .set({ participantId })
    .where(eq(reservations.id, reservationId));

  return await db.select().from(reservations).where(eq(reservations.id, reservationId)).limit(1);
}


// Función para limpiar reservas expiradas (más de 24 horas)
export async function cleanupExpiredReservations() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot cleanup reservations: database not available");
    return;
  }

  try {
    // Calcular timestamp de hace 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Obtener reservas expiradas
    const expiredReservations = await db
      .select()
      .from(reservations)
      .where(lt(reservations.createdAt, twentyFourHoursAgo));

    if (expiredReservations.length === 0) {
      console.log("[Database] No expired reservations to clean up");
      return;
    }

    // Liberar los números de las reservas expiradas
    for (const reservation of expiredReservations) {
      // Actualizar el estado del número a 'available'
      await db.update(raffleNumbers)
        .set({ status: 'available' })
        .where(eq(raffleNumbers.id, reservation.raffleNumberId));

      // Eliminar la reserva
      await db.delete(reservations)
        .where(eq(reservations.id, reservation.id));
    }

    console.log(`[Database] Cleaned up ${expiredReservations.length} expired reservations`);
  } catch (error) {
    console.error("[Database] Failed to cleanup expired reservations:", error);
  }
}


/**
 * Delete a single participant and their associated data
 */
export async function deleteParticipant(participantId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Delete participant and cascade will handle related data
    await db.delete(participants)
      .where(eq(participants.id, participantId));

    console.log(`[Database] Deleted participant ${participantId}`);
  } catch (error) {
    console.error("[Database] Failed to delete participant:", error);
    throw error;
  }
}

/**
 * Delete all participants and reset the raffle
 */
export async function deleteAllParticipants(): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Delete all reservations first
    await db.delete(reservations);

    // Reset all raffle numbers to available
    await db.update(raffleNumbers)
      .set({ status: 'available' });

    // Delete all transactions
    await db.delete(transactions);

    // Delete all participants
    await db.delete(participants);

    // Reset the raffle config for a new draw
    await resetRaffleConfig();

    console.log("[Database] Deleted all participants and reset raffle");
  } catch (error) {
    console.error("[Database] Failed to delete all participants:", error);
    throw error;
  }
}


/**
 * Adjust the total number of raffle numbers
 * If newTotal > current, adds new numbers
 * If newTotal < current, removes the highest numbered items
 */
export async function adjustTotalNumbers(newTotal: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Get current count
    const currentNumbers = await db.select().from(raffleNumbers);
    const currentTotal = currentNumbers.length;

    if (newTotal === currentTotal) {
      console.log("[Database] Total numbers unchanged");
      return;
    }

    if (newTotal < 1) {
      throw new Error("Total numbers must be at least 1");
    }

    if (newTotal > currentTotal) {
      // Add new numbers
      const numbersToAdd = newTotal - currentTotal;
      const startNumber = currentTotal + 1;
      
      const newNumbers = Array.from({ length: numbersToAdd }, (_, i) => ({
        number: startNumber + i,
        status: "available" as const,
      }));

      await db.insert(raffleNumbers).values(newNumbers);
      console.log(`[Database] Added ${numbersToAdd} new raffle numbers`);
    } else {
      // Remove numbers from the end
      const numbersToRemove = currentTotal - newTotal;
      const numbersToDelete = currentNumbers
        .sort((a, b) => b.number - a.number)
        .slice(0, numbersToRemove);

      for (const num of numbersToDelete) {
        // Check if number has transactions or reservations
        const hasTransactions = await db.select()
          .from(transactions)
          .where(eq(transactions.raffleNumberId, num.id))
          .limit(1);

        const hasReservations = await db.select()
          .from(reservations)
          .where(eq(reservations.raffleNumberId, num.id))
          .limit(1);

        if (hasTransactions.length > 0 || hasReservations.length > 0) {
          throw new Error(`Cannot remove number ${num.number}: it has associated transactions or reservations`);
        }

        await db.delete(raffleNumbers).where(eq(raffleNumbers.id, num.id));
      }

      console.log(`[Database] Removed ${numbersToRemove} raffle numbers`);
    }

    // Update config
    const config = await getRaffleConfig();
    if (config) {
      await db.update(raffleConfig)
        .set({ totalNumbers: newTotal })
        .where(eq(raffleConfig.id, config.id));
    }
  } catch (error) {
    console.error("[Database] Failed to adjust total numbers:", error);
    throw error;
  }
}


/**
 * Verifica si se debe ejecutar el sorteo o extender el plazo
 * Retorna: "draw" (ejecutar sorteo), "extend" (extender 30 días), o null (no hacer nada)
 */
export async function checkDrawStatus(): Promise<"draw" | "extend" | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const config = await getRaffleConfig();
    if (!config) return null;

    // Si ya fue sorteado, no hacer nada
    if (config.drawStatus === "completed") return null;

    // Si ya fue extendido, no hacer nada más
    if (config.drawStatus === "extended") return null;

    // Contar números vendidos
    const soldNumbers = await db
      .select()
      .from(raffleNumbers)
      .where(eq(raffleNumbers.status, "sold"));

    const soldPercentage = (soldNumbers.length / config.totalNumbers) * 100;

    // Si se vendieron TODOS los números, ejecutar sorteo inmediatamente sin esperar fecha
    if (soldNumbers.length === config.totalNumbers) {
      console.log("[Database] All numbers sold! Ready to draw immediately.");
      return "draw";
    }

    // Verificar si llegó la fecha de sorteo
    const now = new Date();
    if (now < config.drawDate) return null;

    // Si se vendió >= 50%, ejecutar sorteo
    if (soldPercentage >= 50) {
      return "draw";
    }

    // Si se vendió < 50%, extender 30 días
    return "extend";
  } catch (error) {
    console.error("[Database] Failed to check draw status:", error);
    return null;
  }
}

/**
 * Ejecuta el sorteo: elige un número ganador aleatorio de los vendidos
 */
export async function executeDraw(): Promise<{ winnerNumber: number; winnerParticipantId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const config = await getRaffleConfig();
    if (!config) return null;

    // Obtener todos los números vendidos
    const soldNumbers = await db
      .select()
      .from(raffleNumbers)
      .where(eq(raffleNumbers.status, "sold"));

    if (soldNumbers.length === 0) {
      console.log("[Database] No sold numbers to draw from");
      return null;
    }

    // Seleccionar uno aleatorio
    const randomIndex = Math.floor(Math.random() * soldNumbers.length);
    const winnerRaffleNumber = soldNumbers[randomIndex];

    // Obtener el participante que compró este número
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.raffleNumberId, winnerRaffleNumber.id))
      .limit(1);

    if (!transaction || transaction.length === 0) {
      console.log("[Database] No transaction found for winner number");
      return null;
    }

    const winnerParticipantId = transaction[0].participantId;

    // Actualizar la configuración con el ganador
    await db.update(raffleConfig)
      .set({
        drawStatus: "completed",
        winnerNumber: winnerRaffleNumber.number,
        winnerParticipantId,
        drawnAt: new Date(),
      })
      .where(eq(raffleConfig.id, config.id));

    console.log(`[Database] Draw executed: Winner is number ${winnerRaffleNumber.number}, participant ${winnerParticipantId}`);

    return {
      winnerNumber: winnerRaffleNumber.number,
      winnerParticipantId,
    };
  } catch (error) {
    console.error("[Database] Failed to execute draw:", error);
    throw error;
  }
}

/**
 * Extiende el plazo de la rifa por 30 días
 */
export async function extendRafflePeriod(): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const config = await getRaffleConfig();
    if (!config) return null;

    // Calcular nueva fecha (30 días después)
    const newDrawDate = new Date(config.drawDate);
    newDrawDate.setDate(newDrawDate.getDate() + 30);

    // Actualizar configuración
    await db.update(raffleConfig)
      .set({
        drawDate: newDrawDate,
        drawStatus: "extended",
      })
      .where(eq(raffleConfig.id, config.id));

    console.log(`[Database] Raffle extended until ${newDrawDate.toISOString()}`);

    return newDrawDate;
  } catch (error) {
    console.error("[Database] Failed to extend raffle period:", error);
    throw error;
  }
}


/**
 * Obtiene todos los números vendidos
 */
export async function getSoldNumbers() {
  const db = await getDb();
  if (!db) return [];

  try {
    const soldNumbers = await db
      .select()
      .from(raffleNumbers)
      .where(eq(raffleNumbers.status, "sold"));

    return soldNumbers;
  } catch (error) {
    console.error("[Database] Failed to get sold numbers:", error);
    return [];
  }
}


/**
 * Publica el ganador de la rifa
 */
export async function publishWinner(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const config = await getRaffleConfig();
    if (!config || !config.winnerNumber) {
      console.log("[Database] No winner to publish");
      return false;
    }

    // Actualizar configuración para marcar ganador como publicado
    await db.update(raffleConfig)
      .set({ isWinnerPublished: true })
      .where(eq(raffleConfig.id, config.id));

    console.log(`[Database] Winner published: Number ${config.winnerNumber}`);
    return true;
  } catch (error) {
    console.error("[Database] Failed to publish winner:", error);
    throw error;
  }
}

/**
 * Obtiene los datos del ganador incluyendo participante
 */
export async function getWinnerData() {
  const db = await getDb();
  if (!db) return null;

  try {
    const config = await getRaffleConfig();
    if (!config || !config.winnerParticipantId) {
      return null;
    }

    // Obtener datos del participante ganador
    const winner = await db
      .select()
      .from(participants)
      .where(eq(participants.id, config.winnerParticipantId))
      .limit(1);

    if (!winner || winner.length === 0) {
      return null;
    }

    return {
      winnerNumber: config.winnerNumber,
      firstName: winner[0].firstName,
      lastName: winner[0].lastName,
      email: winner[0].email,
      isPublished: config.isWinnerPublished,
      drawnAt: config.drawnAt,
    };
  } catch (error) {
    console.error("[Database] Failed to get winner data:", error);
    return null;
  }
}

export async function resetRaffleConfig(): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Reset the raffle config to allow a new draw
    await db.update(raffleConfig)
      .set({
        drawStatus: 'pending',
        winnerNumber: null,
        winnerParticipantId: null,
        drawnAt: null,
        isWinnerPublished: false,
      });

    console.log("[Database] Reset raffle config for new draw");
  } catch (error) {
    console.error("[Database] Failed to reset raffle config:", error);
    throw error;
  }
}
