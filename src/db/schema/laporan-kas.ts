import { pgTable, uuid, varchar, text, timestamp, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { kas } from './kas';
import { users } from './users';

export const laporanKas = pgTable('laporan_kas', {
    id: uuid('id').primaryKey().defaultRandom(),
    kasId: uuid('kas_id').references(() => kas.id).notNull(),
    periode: varchar('periode', { length: 50 }).notNull(), // e.g., "Januari 2024" or "Q1 2024"
    totalPemasukan: decimal('total_pemasukan', { precision: 15, scale: 2 }).default('0').notNull(),
    totalPengeluaran: decimal('total_pengeluaran', { precision: 15, scale: 2 }).default('0').notNull(),
    saldoAwal: decimal('saldo_awal', { precision: 15, scale: 2 }).default('0').notNull(),
    saldoAkhir: decimal('saldo_akhir', { precision: 15, scale: 2 }).default('0').notNull(),
    fileUrl: text('file_url'), // Generated PDF report
    generatedBy: uuid('generated_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const laporanKasRelations = relations(laporanKas, ({ one }) => ({
    kas: one(kas, {
        fields: [laporanKas.kasId],
        references: [kas.id],
    }),
    generatedByUser: one(users, {
        fields: [laporanKas.generatedBy],
        references: [users.id],
    }),
}));

export type LaporanKas = typeof laporanKas.$inferSelect;
export type NewLaporanKas = typeof laporanKas.$inferInsert;
