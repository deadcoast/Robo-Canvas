// Screen reader announcement utility
export const announceToScreenReader = (message: string) => {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = message;
  }
};

// Keyboard navigation helpers
export const handleToolbarKeyNav = (
  e: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onSelect: (index: number) => void
) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      onSelect((currentIndex - 1 + totalItems) % totalItems);
      break;
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      onSelect((currentIndex + 1) % totalItems);
      break;
    case 'Home':
      e.preventDefault();
      onSelect(0);
      break;
    case 'End':
      e.preventDefault();
      onSelect(totalItems - 1);
      break;
  }
};

// Focus trap for modals
export const createFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  const focusableElements = containerRef.current?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (!focusableElements?.length) {
    return;
  }

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  return (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }
  
      if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            }
      else if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
    };
};