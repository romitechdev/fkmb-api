import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { kegiatan } from './kegiatan';
import { absensiToken } from './absensi-token';

export const statusAbsensi = pgEnum('status_absensi', ['hadir', 'izin', 'sakit', 'alpha']);

export const absensi = pgTable('absensi', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    kegiatanId: uuid('kegiatan_id').references(() => kegiatan.id).notNull(),
    tokenId: uuid('token_id').references(() => absensiToken.id, { onDelete: 'set null' }),
    tokenLabel: varchar('token_label', { length: 255 }), // Keterangan pertemuan dari token
    status: statusAbsensi('status').default('hadir').notNull(),
    checkInTime: timestamp('check_in_time').defaultNow().notNull(),
    note: text('note'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const absensiRelations = relations(absensi, ({ one }) => ({
    user: one(users, {
        fields: [absensi.userId],
        references: [users.id],
    }),
    kegiatan: one(kegiatan, {
        fields: [absensi.kegiatanId],
        references: [kegiatan.id],
    }),
    token: one(absensiToken, {
        fields: [absensi.tokenId],
        references: [absensiToken.id],
    }),
}));

export type Absensi = typeof absensi.$inferSelect;
export type NewAbsensi = typeof absensi.$inferInsert;

