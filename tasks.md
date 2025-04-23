# AI-Guided Memories Implementation Plan

## Requirements Analysis
- Core Requirements:
  - [ ] Reuse existing chat artifact creation functionality for memories
  - [ ] Keep existing authentication flow
  - [ ] Allow users to create AI-guided memories
  - [ ] Enable editing memories like text artifacts
  - [ ] Show memory list for returning users
  - [ ] Open a document automatically when starting a new memory
  - [ ] Implement AI chat guidance for memory creation (1 chat per memory)

- Technical Constraints:
  - [ ] Use existing artifact text functionality (no new schema)
  - [ ] Chat should only help create memories, not invent stories or false information
  - [ ] Chat should only create text artifacts, not other types
  - [ ] Keep implementation simple for MVP

## Component Analysis
- Affected Components:
  - Navigation/Routing
    - Changes needed: Add routes for memories list and creation
    - Dependencies: Next.js routing
  
  - User Interface
    - Changes needed: Create memories list view and memory creation flow
    - Dependencies: Existing Chat and Artifact components
  
  - Chat/AI Logic
    - Changes needed: Configure chat to provide memory guidance
    - Dependencies: Existing chat functionality
  
  - Artifact Handling
    - Changes needed: None (reusing existing text artifact)
    - Dependencies: Existing artifact creation system

## Design Decisions
- UI/UX:
  - [ ] Design memories list view (similar to chat history)
  - [ ] Design quick start buttons for new memories
  - [ ] Reuse existing text artifact UI for memory content

- Implementation:
  - [ ] Reuse existing text artifact for memory content storage
  - [ ] Implement special chat prompt for memory guidance
  - [ ] Store "memory" type in document metadata

## Implementation Strategy
1. Phase 1: Memory Routes and Navigation
   - [ ] Create `/memories` route for memory list
   - [ ] Create `/memories/new` route for starting new memory
   - [ ] Create `/memories/[id]` route for viewing/editing existing memory

2. Phase 2: Memory Creation Flow
   - [ ] Implement memory list interface
   - [ ] Add "Create New Memory" button/flow
   - [ ] Configure chat to provide memory guidance prompts

3. Phase 3: Integration and Polish
   - [ ] Connect memory creation with text artifact
   - [ ] Ensure authentication and user data flow
   - [ ] Add memory-specific quick start buttons/prompts

## Testing Strategy
- Manual Tests:
  - [ ] Verify memory creation flow from login
  - [ ] Test memory list display for returning users
  - [ ] Validate AI guidance during memory creation
  - [ ] Check persistence of memories between sessions

## File Changes Required

1. Create new route files:
   - `/app/(chat)/memories/page.tsx` - Memory list view
   - `/app/(chat)/memories/[id]/page.tsx` - View/edit memory

2. Modify existing components:
   - `components/artifact.tsx` - Add memory type support (if needed)
   - `components/chat.tsx` - Add memory guidance mode

3. Add memory-specific components:
   - `components/memory-list.tsx` - Display saved memories
   - `components/memory-creation.tsx` - Memory creation flow

## Detailed Implementation Plan

### Phase 1: Memory Routes and Navigation

1. **Create Basic Memory List Page**
   - Create `/app/(chat)/memories/page.tsx`
   - Implement a simple page that lists user's memories
   - Reuse styling from sidebar-history.tsx for consistency
   - Add "New Memory" button at the top
   
   ```tsx
   // app/(chat)/memories/page.tsx
   'use client';
   
   import { useRouter } from 'next/navigation';
   import { useEffect, useState } from 'react';
   import { Button } from '@/components/ui/button';
   import { auth } from '@/app/(auth)/auth';
   import { getDocumentsByUserId } from '@/lib/db/queries';
   import { Document } from '@/lib/db/schema';
   
   export default function MemoriesPage() {
     const router = useRouter();
     const [memories, setMemories] = useState<Document[]>([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       async function loadMemories() {
         // Fetch only documents with kind='text' and filter by metadata if needed
         const docs = await getDocumentsByUserId();
         // Filter for memory-type docs
         setMemories(docs);
         setLoading(false);
       }
       
       loadMemories();
     }, []);
     
     return (
       <div className="container mx-auto p-4">
         <h1 className="text-2xl font-bold mb-4">Your Memories</h1>
         <Button 
           onClick={() => router.push('/memories/new')}
           className="mb-6"
         >
           Create New Memory
         </Button>
         
         {loading ? (
           <p>Loading your memories...</p>
         ) : memories.length === 0 ? (
           <div className="text-center p-6">
             <p>You don't have any memories yet.</p>
             <p>Create your first memory to get started!</p>
           </div>
         ) : (
           <div className="grid gap-4">
             {memories.map((memory) => (
               <div 
                 key={memory.id}
                 className="border p-4 rounded cursor-pointer hover:bg-gray-100"
                 onClick={() => router.push(`/memories/${memory.id}`)}
               >
                 <h3 className="font-medium">{memory.title}</h3>
                 <p className="text-sm text-gray-500">
                   {new Date(memory.createdAt).toLocaleDateString()}
                 </p>
               </div>
             ))}
           </div>
         )}
       </div>
     );
   }
   ```

2. **Create Memory Creation Route**
   - Create `/app/(chat)/memories/new/page.tsx`
   - This page will initialize a new chat with memory guidance mode
   - Then redirect to the memory editing interface
   
   ```tsx
   // app/(chat)/memories/new/page.tsx
   'use client';
   
   import { useRouter } from 'next/navigation';
   import { useEffect } from 'react';
   import { generateUUID } from '@/lib/utils';
   
   export default function NewMemoryPage() {
     const router = useRouter();
     
     useEffect(() => {
       // Create a new memory session and redirect to it
       const newChatId = generateUUID();
       router.push(`/memories/${newChatId}`);
     }, [router]);
     
     return (
       <div className="flex items-center justify-center min-h-screen">
         <p>Creating your new memory...</p>
       </div>
     );
   }
   ```

3. **Create Individual Memory View/Edit Page**
   - Create `/app/(chat)/memories/[id]/page.tsx`
   - Reuse the chat component but with memory-specific configuration
   - Display the artifact editor prominently
   
   ```tsx
   // app/(chat)/memories/[id]/page.tsx
   
   import { cookies } from 'next/headers';
   import { notFound } from 'next/navigation';
   import { auth } from '@/app/(auth)/auth';
   import { Chat } from '@/components/chat';
   import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
   import { DataStreamHandler } from '@/components/data-stream-handler';
   import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
   
   export default async function MemoryPage(props: { params: { id: string } }) {
     const { id } = props.params;
     const chat = await getChatById({ id });
     
     // If the chat doesn't exist, create a new one with memory guidance mode
     if (!chat) {
       // This would likely be handled in the server action
       notFound();
     }
     
     const session = await auth();
     
     if (chat.visibility === 'private') {
       if (!session || !session.user) {
         return notFound();
       }
       
       if (session.user.id !== chat.userId) {
         return notFound();
       }
     }
     
     const messagesFromDb = await getMessagesByChatId({ id });
     const cookieStore = await cookies();
     const chatModelFromCookie = cookieStore.get('chat-model');
     
     return (
       <>
         <Chat
           id={chat.id}
           initialMessages={[]}
           selectedChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
           selectedVisibilityType={chat.visibility}
           isReadonly={session?.user?.id !== chat.userId}
           // Add memory mode flag
           isMemoryMode={true}
         />
         <DataStreamHandler id={id} />
       </>
     );
   }
   ```

4. **Update Navigation Components**
   - Add memory navigation link in the sidebar
   - Ensure proper routing between memory views

### Phase 2: Memory Creation Flow

1. **Modify Chat Component for Memory Mode**
   - Update `components/chat.tsx` to accept a memory mode prop
   - Add special handling for memory creation flow
   
   ```tsx
   // components/chat.tsx - Update existing component
   
   export function Chat({
     id,
     initialMessages,
     selectedChatModel,
     selectedVisibilityType,
     isReadonly,
     isMemoryMode = false, // Add new prop
   }: {
     id: string;
     initialMessages: Array<UIMessage>;
     selectedChatModel: string;
     selectedVisibilityType: VisibilityType;
     isReadonly: boolean;
     isMemoryMode?: boolean; // Add new prop type
   }) {
     // Existing code...
     
     // Memory mode initialization
     useEffect(() => {
       if (isMemoryMode && messages.length === 0 && status !== 'loading') {
         // Auto-create text artifact for memory
         // This could also be done via a server action when creating the chat
         
         // Add initial greeting message to guide memory creation
         append({
           role: 'system',
           content: 'I\'m here to help you create a detailed memory. I\'ll ask questions to help you recall and document your experience.',
         });
         
         // Auto-open artifact editor and set it to memory type
         // Use existing artifact functionality
       }
     }, [isMemoryMode, messages.length, status, append]);
     
     // Rest of component remains the same
   }
   ```

2. **Create Memory-Specific Initial Messages**
   - Define a set of guiding message templates for memory creation
   - Implement memory-specific system prompts
   
   ```tsx
   // lib/ai/memory-prompts.ts
   
   export const MEMORY_SYSTEM_PROMPT = `
   You are an AI memory assistant. Your goal is to help the user document their memories.
   Follow these guidelines:
   1. Ask specific questions to help the user recall details
   2. Focus on sensory details, emotions, and key moments
   3. Keep your responses focused on guiding memory creation
   4. Do not invent details or suggest false information
   5. Help structure the memory with appropriate sections
   6. Guide the user to expand on important moments
   
   The text artifact will be used to store the user's memory.
   `;
   
   export const MEMORY_INITIAL_QUESTIONS = [
     "What memory would you like to document today?",
     "When did this memory take place?",
     "Where were you when this happened?",
     "Who was there with you?",
     "What emotions do you associate with this memory?"
   ];
   
   export const MEMORY_FOLLOW_UP_PROMPTS = [
     "Can you describe any sensory details you remember?",
     "What was the most memorable moment?",
     "How did this experience affect you?",
     "Is there anything about this memory that stands out?",
     "Would you like to add any additional context or background?"
   ];
   ```

3. **Create Memory Creation Action**
   - Define a server action to create new memory-specific chats
   - Ensure memory artifact is automatically created
   
   ```tsx
   // app/(chat)/memories/actions.ts
   'use server';
   
   import { auth } from '@/app/(auth)/auth';
   import { createChat, createMessage } from '@/lib/db/queries';
   import { generateUUID } from '@/lib/utils';
   import { MEMORY_SYSTEM_PROMPT } from '@/lib/ai/memory-prompts';
   import { Document } from '@/lib/db/schema';
   
   export async function createNewMemory(): Promise<{ id: string; success: boolean }> {
     const session = await auth();
     
     if (!session || !session.user) {
       return { id: '', success: false };
     }
     
     const id = generateUUID();
     
     // Create a new chat for this memory
     await createChat({
       id,
       title: 'New Memory',
       userId: session.user.id,
       visibility: 'private',
     });
     
     // Add initial system message with memory guidance
     await createMessage({
       id: generateUUID(),
       chatId: id,
       role: 'system',
       content: MEMORY_SYSTEM_PROMPT,
       userId: session.user.id,
     });
     
     // Create the initial text artifact connected to this chat
     // This would use existing document creation functions
     
     return { id, success: true };
   }
   ```

### Phase 3: Integration and Polish

1. **Update Navigation and Sidebar**
   - Add memories section to app sidebar
   - Create memory-specific navigation components
   
   ```tsx
   // components/app-sidebar.tsx - Add memories link
   
   // Import existing sidebar components
   import { Button } from '@/components/ui/button';
   import Link from 'next/link';
   
   // Add memories section to existing sidebar
   <div className="flex flex-col gap-2">
     <Button variant="ghost" asChild className="justify-start">
       <Link href="/memories">
         <BookIcon className="mr-2 h-4 w-4" />
         <span>Memories</span>
       </Link>
     </Button>
   </div>
   ```

2. **Create Memory Quick-Start Options**
   - Add memory-specific quick start buttons with suggested memory topics
   - Implement UI for different memory templates
   
   ```tsx
   // components/memory-quick-start.tsx
   
   import { Button } from '@/components/ui/button';
   import { useRouter } from 'next/navigation';
   import { useState } from 'react';
   import { createNewMemory } from '@/app/(chat)/memories/actions';
   
   const MEMORY_TEMPLATES = [
     {
       title: 'Childhood Memory',
       prompt: 'Document a cherished childhood memory with all the details you can recall.',
       icon: '👶',
     },
     {
       title: 'Travel Experience',
       prompt: 'Write about a memorable travel experience that left an impression on you.',
       icon: '✈️',
     },
     {
       title: 'Special Occasion',
       prompt: 'Document a special celebration or important life event.',
       icon: '🎉',
     },
     {
       title: 'Personal Achievement',
       prompt: 'Record a personal achievement and how it made you feel.',
       icon: '🏆',
     },
   ];
   
   export function MemoryQuickStart() {
     const router = useRouter();
     const [loading, setLoading] = useState(false);
     
     async function startNewMemory(template: typeof MEMORY_TEMPLATES[0]) {
       setLoading(true);
       const { id, success } = await createNewMemory();
       
       if (success) {
         router.push(`/memories/${id}?template=${encodeURIComponent(template.title)}`);
       } else {
         // Handle error
         setLoading(false);
       }
     }
     
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
         {MEMORY_TEMPLATES.map((template) => (
           <Button
             key={template.title}
             variant="outline"
             className="h-auto p-4 flex flex-col items-center"
             onClick={() => startNewMemory(template)}
             disabled={loading}
           >
             <span className="text-3xl mb-2">{template.icon}</span>
             <span className="font-medium mb-1">{template.title}</span>
             <span className="text-sm text-gray-500 text-center">
               {template.prompt}
             </span>
           </Button>
         ))}
       </div>
     );
   }
   ```

3. **Handling Memory-Specific Artifact Behavior**
   - Ensure text artifact correctly stores memory content
   - Add memory-specific extensions to artifact component if needed
   
   ```tsx
   // components/memory-metadata.ts (new file for memory artifact metadata)
   
   export interface MemoryMetadata {
     memoryType: 'childhood' | 'travel' | 'occasion' | 'achievement' | 'general';
     topics: string[]; // Key topics in this memory
     period: string; // When this memory occurred
     location?: string; // Where this memory took place
     people?: string[]; // People involved in this memory
   }
   
   // This would be used with the existing artifact system to add memory-specific metadata
   ```

4. **Post-Creation Memory Enhancement**
   - Add memory-specific toolbar options
   - Implement enhancement prompts for memories
   
   ```tsx
   // Extend the existing artifact toolbar with memory-specific options
   
   const memoryToolbarItems = [
     {
       icon: <EnhanceIcon />,
       description: 'Enhance with more details',
       onClick: ({ appendMessage }) => {
         appendMessage({
           role: 'user',
           content: 'Please help me enhance this memory with more sensory details and emotions.',
         });
       },
     },
     {
       icon: <StructureIcon />,
       description: 'Improve structure',
       onClick: ({ appendMessage }) => {
         appendMessage({
           role: 'user',
           content: 'Can you suggest a better structure for this memory? Help me organize it into clear sections.',
         });
       },
     },
   ];
   
   // These would be integrated with the existing artifact toolbar system
   ```

## Creative Considerations

### UI/UX Design Elements

1. **Memory Visual Treatment**
   - Consider adding visual elements that distinguish memories from regular chats
   - Use warm, nostalgic color accents for memory interfaces
   - Implement subtle background patterns or textures that evoke memory/nostalgia

2. **Memory Timeline Visualization**
   - For users with multiple memories, consider a timeline view option
   - Organize memories chronologically by the event date, not creation date
   - Allow filtering memories by time period, location, or people involved

3. **Prompt Enhancement**
   - Design memory-specific prompt templates with thoughtful questions
   - Include sensory-focused prompts (what did you see/hear/smell/feel?)
   - Create emotion-focused prompts to capture the emotional context

### User Experience Flow

1. **Onboarding for First-Time Memory Creation**
   - Add a brief tutorial explaining how memory documentation works
   - Show examples of well-documented memories as inspiration
   - Guide users through the prompt-response flow for best results

2. **Empty State Design**
   - Create engaging and encouraging empty state for users with no memories
   - Use warm, inviting copy that encourages memory creation
   - Consider adding sample memory topics as inspiration

3. **Memory Privacy Considerations**
   - Emphasize the private nature of memories 
   - Include clear visual indicators of privacy status
   - Consider adding optional password protection for sensitive memories

### Future Enhancement Possibilities

1. **Memory Collection and Organization**
   - Group related memories into collections/albums
   - Add tagging system for better organization and discovery
   - Create themed memory collections (childhood, travel, milestones)

2. **Rich Media Support**
   - Plan for future support of image attachments within memories
   - Consider audio recording option for voice memories
   - Explore timeline/map visualization for travel memories

3. **Export and Sharing Options**
   - Create beautiful export formats for memories (PDF, print-ready)
   - Add selective sharing capabilities for specific memories
   - Consider collaborative memory creation for shared experiences

These creative considerations will help make the memory feature more engaging and emotionally resonant while maintaining the MVP scope for initial implementation.