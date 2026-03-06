import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Configuración de la rifa (una sola fila)
 */
export const raffleConfig = mysqlTable("raffleConfig", {
  id: int("id").autoincrement().primaryKey(),
  raffleTitle: varchar("raffleTitle", { length: 255 }).default("Mi Rifa").notNull(),
  raffleDescription: text("raffleDescription"),
  numberPrice: decimal("numberPrice", { precision: 10, scale: 2 }).notNull(),
  drawDate: timestamp("drawDate").notNull(),
  drawTime: varchar("drawTime", { length: 5 }), // HH:mm format
  totalNumbers: int("totalNumbers").default(1000).notNull(),
  mercadoPagoLink: text("mercadoPagoLink"), // Link de pago de Mercado Pago
  drawStatus: mysqlEnum("drawStatus", ["pending", "completed", "extended"]).default("pending").notNull(),
  winnerNumber: int("winnerNumber"), // Número ganador
  winnerParticipantId: int("winnerParticipantId"), // ID del participante ganador
  drawnAt: timestamp("drawnAt"), // Fecha y hora del sorteo
  isWinnerPublished: boolean("isWinnerPublished").default(false).notNull(), // Si el ganador ha sido publicado
  isDrawManual: boolean("isDrawManual").default(true).notNull(), // Si el sorteo es manual (true) o automático (false)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RaffleConfig = typeof raffleConfig.$inferSelect;
export type InsertRaffleConfig = typeof raffleConfig.$inferInsert;

/**
 * Premios de la rifa
 */
export const prizes = mysqlTable("prizes", {
  id: int("id").autoincrement().primaryKey(),
  position: int("position").notNull(), // 1er premio, 2do premio, etc.
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"), // URL de la imagen del premio
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prize = typeof prizes.$inferSelect;
export type InsertPrize = typeof prizes.$inferInsert;

/**
 * Números de la rifa
 */
export const raffleNumbers = mysqlTable("raffleNumbers", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull().unique(), // 1 a 1000
  status: mysqlEnum("status", ["available", "reserved", "sold"]).default("available").notNull(),
  reservedAt: timestamp("reservedAt"),
  reservationExpiresAt: timestamp("reservationExpiresAt"),
  soldAt: timestamp("soldAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RaffleNumber = typeof raffleNumbers.$inferSelect;
export type InsertRaffleNumber = typeof raffleNumbers.$inferInsert;

/**
 * Participantes de la rifa
 */
export const participants = mysqlTable("participants", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;

/**
 * Transacciones de compra
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  raffleNumberId: int("raffleNumberId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Reservas temporales de números
 */
export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  raffleNumberId: int("raffleNumberId").notNull(),
  participantId: int("participantId"),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;
