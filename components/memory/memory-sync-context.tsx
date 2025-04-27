'use client';

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { debounce } from 'lodash';

interface MemorySyncContextType {
  // Scroll synchronization
  isSyncEnabled: boolean;
  toggleSync: () => void;
  setIsSyncEnabled: (enabled: boolean) => void;
  editorScrollRef: React.RefObject<HTMLDivElement>;
  chatScrollRef: React.RefObject<HTMLDivElement>;
  registerEditorScroll: (position: number, maxScroll: number) => void;
  registerChatScroll: (position: number, maxScroll: number) => void;

  // Content mapping
  addContentMapping: (editorPos: number, chatId: string) => void;
  highlightedChatId: string | null;
  highlightedEditorPosition: number | null;
}

const MemorySyncContext = createContext<MemorySyncContextType | undefined>(
  undefined,
);

interface MemorySyncProviderProps {
  children: React.ReactNode;
}

export function MemorySyncProvider({ children }: MemorySyncProviderProps) {
  // Refs for scroll containers
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync state
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const isScrollingRef = useRef(false);
  const [highlightedChatId, setHighlightedChatId] = useState<string | null>(
    null,
  );
  const [highlightedEditorPosition, setHighlightedEditorPosition] = useState<
    number | null
  >(null);

  // Scroll position tracking
  const [editorScrollPosition, setEditorScrollPosition] = useState(0);
  const [editorMaxScroll, setEditorMaxScroll] = useState(0);
  const [chatScrollPosition, setChatScrollPosition] = useState(0);
  const [chatMaxScroll, setChatMaxScroll] = useState(0);

  // Content mapping between editor positions and chat message IDs
  const contentMappingRef = useRef<
    Array<{ editorPos: number; chatId: string }>
  >([]);

  const toggleSync = useCallback(() => {
    setIsSyncEnabled((prev) => !prev);
  }, []);

  const setIsSyncEnabledDirectly = useCallback((value: boolean) => {
    setIsSyncEnabled(value);
  }, []);

  // Reset scrolling lock with debounce
  const resetScrollLock = useCallback(
    debounce(() => {
      isScrollingRef.current = false;
    }, 150),
    [],
  );

  // Register scroll positions
  const registerEditorScroll = useCallback(
    (position: number, maxScroll: number) => {
      setEditorScrollPosition(position);
      setEditorMaxScroll(maxScroll);

      if (isSyncEnabled && !isScrollingRef.current) {
        isScrollingRef.current = true;

        // Find best matching chat position from the mapping
        const scrollPercentage = maxScroll > 0 ? position / maxScroll : 0;
        if (chatScrollRef.current && chatMaxScroll > 0) {
          const targetScroll = Math.min(
            scrollPercentage * chatMaxScroll,
            chatMaxScroll,
          );
          chatScrollRef.current.scrollTop = targetScroll;

          // Find closest mapped content to highlight
          const mapping = findClosestMapping(position);
          if (mapping) {
            setHighlightedChatId(mapping.chatId);
          }
        }

        resetScrollLock();
      }
    },
    [isSyncEnabled, chatMaxScroll, resetScrollLock],
  );

  const registerChatScroll = useCallback(
    (position: number, maxScroll: number) => {
      setChatScrollPosition(position);
      setChatMaxScroll(maxScroll);

      if (isSyncEnabled && !isScrollingRef.current) {
        isScrollingRef.current = true;

        // Find best matching editor position from the mapping
        const scrollPercentage = maxScroll > 0 ? position / maxScroll : 0;
        if (editorScrollRef.current && editorMaxScroll > 0) {
          const targetScroll = Math.min(
            scrollPercentage * editorMaxScroll,
            editorMaxScroll,
          );
          editorScrollRef.current.scrollTop = targetScroll;

          // Find closest mapped content to highlight
          const mapping = findClosestChat(position, maxScroll);
          if (mapping) {
            setHighlightedEditorPosition(mapping.editorPos);
          }
        }

        resetScrollLock();
      }
    },
    [isSyncEnabled, editorMaxScroll, resetScrollLock],
  );

  // Clean up the debounced function
  useEffect(() => {
    return () => {
      resetScrollLock.cancel();
    };
  }, [resetScrollLock]);

  // Add a new mapping between editor position and chat message
  const addContentMapping = useCallback((editorPos: number, chatId: string) => {
    contentMappingRef.current.push({ editorPos, chatId });
    // Sort mappings by editor position
    contentMappingRef.current.sort((a, b) => a.editorPos - b.editorPos);
  }, []);

  // Find the closest mapped content to the current editor position
  const findClosestMapping = useCallback((editorPos: number) => {
    if (contentMappingRef.current.length === 0) return null;

    // Simple binary search-like approach to find the closest mapping
    let closest = contentMappingRef.current[0];
    let closestDistance = Math.abs(editorPos - closest.editorPos);

    for (const mapping of contentMappingRef.current) {
      const distance = Math.abs(editorPos - mapping.editorPos);
      if (distance < closestDistance) {
        closest = mapping;
        closestDistance = distance;
      }
    }

    return closest;
  }, []);

  // Find the closest editor position from chat scroll position
  const findClosestChat = useCallback(
    (chatPos: number, maxChatScroll: number) => {
      if (contentMappingRef.current.length === 0) return null;

      // Convert chat position to percentage
      const percentage = chatPos / maxChatScroll;

      // Use percentage to find approximate editor position
      const approximateEditorPos = percentage * editorMaxScroll;

      // Find closest mapping to this approximation
      return findClosestMapping(approximateEditorPos);
    },
    [editorMaxScroll, findClosestMapping],
  );

  const value = {
    isSyncEnabled,
    toggleSync,
    setIsSyncEnabled: setIsSyncEnabledDirectly,
    editorScrollRef,
    chatScrollRef,
    registerEditorScroll,
    registerChatScroll,
    addContentMapping,
    highlightedChatId,
    highlightedEditorPosition,
  };

  return (
    <MemorySyncContext.Provider value={value}>
      {children}
    </MemorySyncContext.Provider>
  );
}

export function useMemorySync() {
  const context = useContext(MemorySyncContext);
  if (context === undefined) {
    throw new Error('useMemorySync must be used within a MemorySyncProvider');
  }
  return context;
}
