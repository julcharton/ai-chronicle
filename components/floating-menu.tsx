'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BoldIcon,
  ItalicIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
} from 'lucide-react';

interface FloatingMenuProps {
  isVisible: boolean;
  selection: {
    range: Range | null;
    isCollapsed: boolean;
  };
  onFormatText: (formatType: string) => void;
}

export function FloatingMenu({
  isVisible,
  selection,
  onFormatText,
}: FloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [menuPlacement, setMenuPlacement] = useState<'above' | 'below'>(
    'above',
  );

  // Calculate position based on current selection and update it when selection changes
  // Using useLayoutEffect to calculate position before browser paint
  useLayoutEffect(() => {
    if (!isVisible || !selection.range || selection.isCollapsed) {
      return;
    }

    // Get the selection boundaries
    const selectionRect = selection.range.getBoundingClientRect();

    // Get editor container position - assuming it's the parent of the editor
    // We'll use this to calculate position relative to the editor container
    const editorContainer = document.querySelector('.markdown-editor');
    const containerRect = editorContainer?.getBoundingClientRect() || {
      top: 0,
      left: 0,
    };

    // Calculate initial position centered above the selection
    const selectionCenter = selectionRect.left + selectionRect.width / 2;

    // Wait for next frame to ensure menu ref is available with correct dimensions
    requestAnimationFrame(() => {
      if (!menuRef.current) return;

      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;

      // Default position (above selection)
      let topPosition = selectionRect.top - menuHeight - 8;
      let leftPosition = selectionCenter;

      // Check if menu would go offscreen at the top
      if (topPosition < 8) {
        // Position below selection instead
        topPosition = selectionRect.bottom + 8;
        setMenuPlacement('below');
      } else {
        setMenuPlacement('above');
      }

      // Calculate position relative to viewport edges to keep menu visible
      // Check right edge
      if (leftPosition + menuWidth / 2 > window.innerWidth - 8) {
        leftPosition = window.innerWidth - menuWidth - 8;
      }

      // Check left edge
      if (leftPosition - menuWidth / 2 < 8) {
        leftPosition = menuWidth / 2 + 8;
      }

      // Convert to position relative to the editor container
      const relativeTop = topPosition - containerRect.top;
      const relativeLeft = leftPosition - containerRect.left;

      setPosition({
        top: relativeTop,
        left: relativeLeft,
      });
    });
  }, [isVisible, selection]);

  // Format buttons configuration
  const formatButtons = [
    { icon: <BoldIcon size={16} />, label: 'Bold', action: 'bold' },
    { icon: <ItalicIcon size={16} />, label: 'Italic', action: 'italic' },
    { icon: <Heading1 size={16} />, label: 'Heading 1', action: 'h1' },
    { icon: <Heading2 size={16} />, label: 'Heading 2', action: 'h2' },
    { icon: <Heading3 size={16} />, label: 'Heading 3', action: 'h3' },
    {
      icon: <AlignLeft size={16} />,
      label: 'Normal Text',
      action: 'paragraph',
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && !selection.isCollapsed && (
        <motion.div
          ref={menuRef}
          className={cn(
            'absolute z-50 flex bg-background rounded-2xl shadow-xl p-2 border gap-1',
            menuPlacement === 'below'
              ? 'transform -translate-x-1/2'
              : 'transform -translate-x-1/2',
          )}
          initial={{ opacity: 0, y: menuPlacement === 'above' ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: menuPlacement === 'above' ? 10 : -10 }}
          transition={{ duration: 0.15 }}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {formatButtons.map((button) => (
            <button
              type="button"
              key={button.action}
              onClick={() => onFormatText(button.action)}
              className={cn(
                'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800',
                'text-foreground',
              )}
              aria-label={button.label}
              title={button.label}
            >
              {button.icon}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
