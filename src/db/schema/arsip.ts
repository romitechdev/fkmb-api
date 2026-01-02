import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { departemen } from './departemen';
import { users } from './users';

export const arsip = pgTable('arsip', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }),
    fileUrl: text('file_url').notNull(),
    fileType: varchar('file_type', { length: 50 }),
    fileSize: integer('file_size'),
    departemenId: uuid('departemen_id').references(() => departemen.id),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const arsipRelations = relations(arsip, ({ one }) => ({
    departemen: one(departemen, {
        fields: [arsip.departemenId],
        references: [departemen.id],
    }),
    uploadedByUser: one(users, {
        fields: [arsip.uploadedBy],
        references: [users.id],
    }),
}));

export type Arsip = typeof arsip.$inferSelect;
export type NewArsip = typeof arsip.$inferInsert;
