import { integer, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Tabel users - support email/password & OAuth
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  password: text("password"), // null jika login via Google
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  subscriptionActive: boolean("subscription_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tabel accounts - untuk OAuth providers (Google, dll)
export const accounts = pgTable("accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'oauth' | 'credentials'
  provider: text("provider").notNull(), // 'google' | 'credentials'
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tabel sessions
export const sessions = pgTable("sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionToken: text("session_token").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tabel verificationTokens
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

// Tabel uji coba koneksi database melalui ORM Drizzle
export const testKoneksi = pgTable("test_koneksi", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  pesan: text("pesan").notNull(),
  dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
    .notNull()
    .defaultNow(),
});