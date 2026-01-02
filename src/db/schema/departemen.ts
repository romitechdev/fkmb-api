import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const departemen = pgTable('departemen', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    logo: text('logo'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Departemen = typeof departemen.$inferSelect;
export type NewDepartemen = typeof departemen.$inferInsert;

