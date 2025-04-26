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
  index,
  unique,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

// Create a dedicated Memory table
export const memory = pgTable(
  'Memory',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    title: text('title').notNull(),
    content: text('content'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    metadata: json('metadata').$type<{
      tags?: string[];
      isPublic?: boolean;
      summary?: string;
      source?: string;
      aiGenerated?: boolean;
    }>(),
  },
  (table) => ({
    userIdx: index('memory_user_idx').on(table.userId),
  }),
);

export type Memory = InferSelectModel<typeof memory>;

export const chat = pgTable(
  'Chat',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    visibility: varchar('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('private'),
    memoryId: uuid('memoryId').references(() => memory.id),
  },
  (table) => ({
    memoryIdx: index('memory_idx').on(table.memoryId),
    userIdx: index('chat_user_idx').on(table.userId),
  }),
);

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
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    updatedAt: timestamp('updatedAt').notNull(),
    metadata: json('metadata'),
  },
  (table) => ({
    userIdx: index('document_user_idx').on(table.userId),
    kindIdx: index('document_kind_idx').on(table.kind),
    createdAtIdx: index('document_createdAt_idx').on(table.createdAt),
  }),
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId')
      .notNull()
      .references(() => document.id),
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
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export type MemoryChat = Chat & {
  memoryId: string;
};
