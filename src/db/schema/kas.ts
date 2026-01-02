import { pgTable, uuid, varchar, text, timestamp, decimal, boolean } from 'drizzle-orm/pg-core';

export const kas = pgTable('kas', {
    id: uuid('id').primaryKey().defaultRandom(),
    periode: varchar('periode', { length: 20 }).notNull(), // e.g., "2024/2025"
    saldoAwal: decimal('saldo_awal', { precision: 15, scale: 2 }).default('0').notNull(),
    saldoAkhir: decimal('saldo_akhir', { precision: 15, scale: 2 }).default('0').notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Kas = typeof kas.$inferSelect;
export type NewKas = typeof kas.$inferInsert;

