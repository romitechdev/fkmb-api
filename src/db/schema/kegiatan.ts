import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { departemen } from './departemen';

export const kegiatan = pgTable('kegiatan', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    location: varchar('location', { length: 255 }),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    type: varchar('type', { length: 50 }), // rapat, event, pelatihan, dll
    status: varchar('status', { length: 20 }).default('upcoming').notNull(), // upcoming, ongoing, completed, cancelled
    departemenId: uuid('departemen_id').references(() => departemen.id),
    createdBy: uuid('created_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kegiatanRelations = relations(kegiatan, ({ one }) => ({
    departemen: one(departemen, {
        fields: [kegiatan.departemenId],
        references: [departemen.id],
    }),
    createdByUser: one(users, {
        fields: [kegiatan.createdBy],
        references: [users.id],
    }),
}));

export type Kegiatan = typeof kegiatan.$inferSelect;
export type NewKegiatan = typeof kegiatan.$inferInsert;
