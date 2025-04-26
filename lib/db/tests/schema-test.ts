/**
 * Database schema validation test script
 *
 * This script tests the database schema by performing basic CRUD operations
 * and validating relationships between memories and chats.
 */

import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import {
  saveDocument,
  getDocumentById,
  createMemoryChat,
  getChatsByMemoryId,
  updateMemory,
} from '../queries';
import type { MemoryMetadata } from '@/lib/types';

async function runSchemaTest() {
  console.log('Starting database schema test...');

  try {
    // Test user ID (this should be an existing user in your test database)
    const testUserId = '00000000-0000-0000-0000-000000000000';

    // Step 1: Create a memory document
    console.log('Testing memory creation...');
    const memoryId = uuidv4();
    const memoryTitle = `Test Memory ${Date.now()}`;
    const memoryContent = 'This is a test memory content';
    const metadata: MemoryMetadata = {
      tags: ['test', 'validation'],
      isPublic: false,
      summary: 'Test memory summary',
      aiGenerated: false,
    };

    const createdMemory = await saveDocument({
      id: memoryId,
      title: memoryTitle,
      content: memoryContent,
      kind: 'text',
      userId: testUserId,
      metadata,
    });

    console.log('Memory created:', createdMemory[0].id);

    // Step 2: Verify memory was created correctly
    const retrievedMemory = await getDocumentById({ id: memoryId });
    console.log('Memory retrieved:', retrievedMemory?.id);

    if (!retrievedMemory) {
      throw new Error('Failed to retrieve created memory');
    }

    if (retrievedMemory.title !== memoryTitle) {
      throw new Error('Memory title does not match');
    }

    // Step 3: Update memory
    console.log('Testing memory update...');
    const updatedTitle = `Updated Memory ${Date.now()}`;
    const updatedMemory = await updateMemory({
      id: memoryId,
      title: updatedTitle,
      metadata: {
        ...metadata,
        tags: [...(metadata.tags || []), 'updated'],
      },
    });

    console.log('Memory updated:', updatedMemory[0].id);

    // Step 4: Create a chat linked to the memory
    console.log('Testing memory-chat relationship...');
    const chatId = uuidv4();
    const chatTitle = `Test Chat for Memory ${Date.now()}`;

    const createdChat = await createMemoryChat({
      id: chatId,
      title: chatTitle,
      userId: testUserId,
      memoryId,
    });

    console.log('Chat created:', createdChat[0].id);

    // Step 5: Verify chat-memory relationship
    const memoryChats = await getChatsByMemoryId({ memoryId });
    console.log('Number of chats for memory:', memoryChats.length);

    if (memoryChats.length === 0) {
      throw new Error('No chats found for memory');
    }

    if (memoryChats[0].id !== chatId) {
      throw new Error('Chat ID does not match');
    }

    console.log('All tests passed!');
    return { success: true };
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error };
  }
}

// Uncomment to run the test
runSchemaTest().then(console.log).catch(console.error);

export default runSchemaTest;
