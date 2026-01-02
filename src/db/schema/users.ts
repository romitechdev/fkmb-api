import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roles } from './roles';
import { departemen } from './departemen';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    nim: varchar('nim', { length: 20 }),
    phone: varchar('phone', { length: 20 }),
    fakultas: varchar('fakultas', { length: 100 }),
    prodi: varchar('prodi', { length: 100 }),
    angkatan: varchar('angkatan', { length: 10 }),
    avatar: text('avatar'),
    roleId: uuid('role_id').references(() => roles.id),
    departemenId: uuid('departemen_id').references(() => departemen.id),
    isActive: boolean('is_active').default(true).notNull(),
    refreshToken: text('refresh_token'),
    resetToken: text('reset_token'),
    resetTokenExpiry: timestamp('reset_token_expiry'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id],
    }),
    departemen: one(departemen, {
        fields: [users.departemenId],
        references: [departemen.id],
    }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
