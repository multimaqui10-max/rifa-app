import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
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
    updateData.reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  
  return await db.update(raffleNumbers).set(updateData).where(eq(raffleNumbers.id, id));
}

// ===== PARTICIPANTS =====

export async function createParticipant(data: typeof participants.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(participants).values(data);
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
