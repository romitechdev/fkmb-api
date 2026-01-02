import { pgTable, uuid, varchar, text, timestamp, date, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { departemen } from './departemen';

export const kepengurusan = pgTable('kepengurusan', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    departemenId: uuid('departemen_id').references(() => departemen.id).notNull(),
    jabatan: varchar('jabatan', { length: 100 }).notNull(),
    periode: varchar('periode', { length: 20 }).notNull(), // e.g., "2024/2025"
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    isActive: boolean('is_active').default(true).notNull(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kepengurusanRelations = relations(kepengurusan, ({ one }) => ({
    user: one(users, {
        fields: [kepengurusan.userId],
        references: [users.id],
    }),
    departemen: one(departemen, {
        fields: [kepengurusan.departemenId],
        references: [departemen.id],
    }),
}));

export type Kepengurusan = typeof kepengurusan.$inferSelect;
export type NewKepengurusan = typeof kepengurusan.$inferInsert;
