import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Define enums
export const visibilityEnum = pgEnum('visibility', [
  'public',
  'private',
  'family',
]);

export const mediaTypeEnum = pgEnum('media_type', ['image', 'audio', 'video']);

export const relationshipTypeEnum = pgEnum('relationship_type', [
  'parent',
  'child',
  'spouse',
  'sibling',
  'grandparent',
  'grandchild',
  'aunt_uncle',
  'niece_nephew',
  'cousin',
  'other',
]);

export const permissionTypeEnum = pgEnum('permission_type', [
  'view',
  'edit',
  'delete',
  'manage',
]);

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const memory = pgTable('Memory', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  source: text('source'),
  blocks: jsonb('blocks').notNull(), // Editor.js structured content
  tags: jsonb('tags').notNull().$type<string[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Memory = InferSelectModel<typeof memory>;

export const memoryPermission = pgTable('MemoryPermission', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  memoryId: uuid('memory_id')
    .notNull()
    .references(() => memory.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  permissionType: permissionTypeEnum('permission_type').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type MemoryPermission = InferSelectModel<typeof memoryPermission>;

export const media = pgTable('Media', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  memoryId: uuid('memory_id')
    .notNull()
    .references(() => memory.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  type: mediaTypeEnum('type').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Media = InferSelectModel<typeof media>;

export const familyLink = pgTable('FamilyLink', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  fromUserId: uuid('from_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  toUserId: uuid('to_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type FamilyLink = InferSelectModel<typeof familyLink>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;
