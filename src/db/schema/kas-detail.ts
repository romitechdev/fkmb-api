import { pgTable, uuid, varchar, text, timestamp, date, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { kas } from './kas';
import { users } from './users';

export const jenisTransaksi = pgEnum('jenis_transaksi', ['pemasukan', 'pengeluaran']);

export const kasDetail = pgTable('kas_detail', {
    id: uuid('id').primaryKey().defaultRandom(),
    kasId: uuid('kas_id').references(() => kas.id).notNull(),
    tanggal: date('tanggal').notNull(),
    jenis: jenisTransaksi('jenis').notNull(),
    kategori: varchar('kategori', { length: 100 }),
    description: text('description').notNull(),
    jumlah: decimal('jumlah', { precision: 15, scale: 2 }).notNull(),
    bukti: text('bukti'), // URL to receipt image
    createdBy: uuid('created_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kasDetailRelations = relations(kasDetail, ({ one }) => ({
    kas: one(kas, {
        fields: [kasDetail.kasId],
        references: [kas.id],
    }),
    createdByUser: one(users, {
        fields: [kasDetail.createdBy],
        references: [users.id],
    }),
}));

export type KasDetail = typeof kasDetail.$inferSelect;
export type NewKasDetail = typeof kasDetail.$inferInsert;
