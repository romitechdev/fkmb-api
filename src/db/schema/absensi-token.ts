import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { kegiatan } from './kegiatan';

export const absensiToken = pgTable('absensi_token', {
    id: uuid('id').primaryKey().defaultRandom(),
    kegiatanId: uuid('kegiatan_id').references(() => kegiatan.id).notNull(),
    token: varchar('token', { length: 255 }).unique().notNull(),
    label: varchar('label', { length: 255 }), // Label/keterangan pertemuan: "Rapat 1", "Day 1", dll
    qrCode: text('qr_code'), // Base64 QR image
    expiresAt: timestamp('expires_at').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const absensiTokenRelations = relations(absensiToken, ({ one }) => ({
    kegiatan: one(kegiatan, {
        fields: [absensiToken.kegiatanId],
        references: [kegiatan.id],
    }),
}));

export type AbsensiToken = typeof absensiToken.$inferSelect;
export type NewAbsensiToken = typeof absensiToken.$inferInsert;

