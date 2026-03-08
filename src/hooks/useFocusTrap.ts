import { useEffect, useRef } from 'react';

/**
 * Hook to trap focus within a container element.
 * @param isActive Whether the focus trap is active
 * @param onClose Optional callback to close the modal on Escape key
 */
export const useFocusTrap = (isActive: boolean, onClose?: () => void) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (onClose) onClose();
                return;
            }

            if (e.key === 'Tab') {
                const container = containerRef.current;
                if (!container) return;

                const focusableElements = container.querySelectorAll(
                    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );

                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Initial focus
        const container = containerRef.current;
        if (container) {
            const focusableElements = container.querySelectorAll(
                'input, button, [tabindex]'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            firstElement?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, onClose]);

    return containerRef;
};
