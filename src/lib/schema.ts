import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'moderator', 'author', 'school', 'teacher', 'student']);

export const registrationKeys = pgTable('registration_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  keyCode: varchar('key_code', { length: 255 }).unique().notNull(),
  role: userRoleEnum('role').notNull(),
  description: text('description'),
  maxUses: integer('max_uses').default(1),
  currentUses: integer('current_uses').default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
  role: userRoleEnum('role').notNull(),
  registrationKeyId: uuid('registration_key_id'),
  schoolId: uuid('school_id'),
  teacherId: uuid('teacher_id'), // New: для связи ученика с учителем
  organizationInfo: jsonb('organization_info').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  address: text('address'),
  websiteUrl: varchar('website_url', { length: 255 }),
  logoUrl: text('logo_url'),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true),
  adminId: uuid('admin_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  ownerId: uuid('owner_id').notNull(),
  schoolId: uuid('school_id'),
  isPublic: boolean('is_public').default(false),
  visibility: varchar('visibility', { length: 50 }).default('private'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  registrationKey: one(registrationKeys, {
    fields: [users.registrationKeyId],
    references: [registrationKeys.id],
  }),
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  teacher: one(users, {
    fields: [users.teacherId],
    references: [users.id],
    relationName: 'teacher_students'
  }),
  students: many(users, {
    relationName: 'teacher_students'
  }),
  ownedBooks: many(books),
}));

export const registrationKeysRelations = relations(registrationKeys, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [registrationKeys.createdBy],
    references: [users.id],
  }),
  usedByUsers: many(users),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  admin: one(users, {
    fields: [schools.adminId],
    references: [users.id],
  }),
  users: many(users),
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  owner: one(users, {
    fields: [books.ownerId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [books.schoolId],
    references: [schools.id],
  }),
}));

export type UserRole = 'admin' | 'moderator' | 'author' | 'school' | 'teacher' | 'student';
export type User = typeof users.$inferSelect;
export type RegistrationKey = typeof registrationKeys.$inferSelect;
export type School = typeof schools.$inferSelect;