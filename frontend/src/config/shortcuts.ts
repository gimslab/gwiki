export interface ShortcutConfig {
    editPage: string;
    newPage: string;
    focusSearch: string;
    deletePage: string;
    goHome: string;
}

export const defaultShortcuts: ShortcutConfig = {
    editPage: 'e',
    newPage: 'c',
    focusSearch: '/',
    deletePage: '#',
    goHome: 'Ctrl+Home',
};
