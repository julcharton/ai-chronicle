# Database Schema Documentation

This document provides an overview of the database schema for the AI Chronicle application.

## Tables Overview

### User
Stores user account information.
- `id` (UUID): Primary key
- `email` (varchar(64)): User's email address
- `password` (varchar(64)): Optional password for authentication

### Chat
Represents a conversation between a user and the AI.
- `id` (UUID): Primary key
- `createdAt` (timestamp): When the chat was created
- `title` (text): Title of the chat
- `userId` (UUID): Foreign key reference to the User table
- `visibility` (varchar): 'public' or 'private' setting for the chat

### Message
Stores individual messages within a chat.
- `id` (UUID): Primary key
- `chatId` (UUID): Foreign key reference to the Chat table
- `role` (varchar): Either 'user' or 'assistant'
- `parts` (JSON): The content of the message in a structured format
- `attachments` (JSON): Any attached files or resources
- `createdAt` (timestamp): When the message was created

### Vote
Stores user votes (thumbs up/down) on assistant messages.
- `chatId` (UUID): Part of composite primary key, reference to Chat table
- `messageId` (UUID): Part of composite primary key, reference to Message table
- `isUpvoted` (boolean): Whether the message was upvoted (true) or downvoted (false)

### Document
Stores documents that can be referenced or analyzed.
- `id` (UUID): Part of composite primary key
- `createdAt` (timestamp): Part of composite primary key
- `title` (text): Title of the document
- `content` (text): The document's content
- `kind` (varchar): Type of document ('text', 'code', 'image', 'sheet')
- `userId` (UUID): Foreign key reference to the User table

### Suggestion
Stores suggestions for improving documents.
- `id` (UUID): Primary key
- `documentId` (UUID): Part of foreign key reference to the Document table
- `documentCreatedAt` (timestamp): Part of foreign key reference to the Document table
- `originalText` (text): The text being corrected
- `suggestedText` (text): The proposed correction
- `description` (text): Optional explanation for the suggestion
- `isResolved` (boolean): Whether the suggestion has been addressed
- `userId` (UUID): Foreign key reference to the User table
- `createdAt` (timestamp): When the suggestion was created

## Schema Cleanup

As part of database optimization, we have:

1. Removed deprecated tables (`Message_v2` and `Vote_v2` have been renamed to `Message` and `Vote`)
2. Consolidated the schema to use a single message format with the `parts` field
3. Ensured all foreign key relationships are properly defined

## Working with the Database

### Migrations

The project uses Drizzle ORM for database management. To work with migrations:

- Generate a new migration: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- View the database: `npm run db:studio`

### Database Configuration

Database connection is configured using the following environment variables:
- `POSTGRES_URL`: Connection string for the PostgreSQL database

See the project's main README for more information on setting up the database. 