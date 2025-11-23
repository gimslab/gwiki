import { useEffect } from 'react';

export const useKeyboardShortcut = (targetKey: string, callback: () => void) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if the user is typing in an input, textarea, or contenteditable element
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const keys = targetKey.split('+');
            const mainKey = keys[keys.length - 1];
            const modifiers = keys.slice(0, -1);

            const isCtrl = modifiers.includes('Ctrl');
            const isAlt = modifiers.includes('Alt');
            const isShift = modifiers.includes('Shift');
            const isMeta = modifiers.includes('Meta');

            if (
                event.key === mainKey &&
                event.ctrlKey === isCtrl &&
                event.altKey === isAlt &&
                event.shiftKey === isShift &&
                event.metaKey === isMeta
            ) {
                event.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [targetKey, callback]);
};
