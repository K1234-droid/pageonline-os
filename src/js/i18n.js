const translations = {
    id: {
        powerText: 'Klik untuk Memulai',
        bootStatus: 'Sistem sedang memuat...',
        shutdown: 'Matikan',
        shuttingDown: 'Mematikan Daya...',
        welcome: 'Selamat datang di PageOnline OS',
        welcomeUser: 'Selamat Datang, {name}',
        apps: {
            settings: 'Pengaturan',
            browser: 'Browser',
            terminal: 'Terminal',
            files: 'File Saya',
            notepad: 'Catatan'
        },
        controls: {
            closeWindow: 'Tutup Jendela',
            closeAllWindows: 'Tutup Semua Jendela',
            minimizeAllWindows: 'Sembunyikan Semua Jendela',
            showAllWindows: 'Tampilkan Semua Jendela',
            openApp: 'Buka {name}',
            pinToDesktop: 'Sematkan ke Desktop',
            pinToTaskbar: 'Sematkan ke Taskbar',
            unpinFromTaskbar: 'Lepaskan dari Taskbar',
            unpinFromDesktop: 'Hapus',
            confirmDeleteTitle: 'Konfirmasi Hapus',
            confirmDeleteMsg: 'Apakah Anda yakin ingin menghapus {name} dari desktop?',
            cancel: 'Batal',
            delete: 'Hapus',
            openSelected: 'Buka Aplikasi Terpilih',
            deleteSelected: 'Hapus',
            confirmDeleteMultipleTitle: 'Konfirmasi Hapus Banyak',
            confirmDeleteMultipleMsg: 'Apakah Anda yakin ingin menghapus {count} pintasan?'
        },
        bootMessages: [
            'Memuat kernel...',
            'Menginisialisasi driver...',
            'Menyiapkan desktop...',
            'Mulai sistem...'
        ]
    },
    en: {
        powerText: 'Click to Start',
        bootStatus: 'System is loading...',
        shutdown: 'Shutdown',
        shuttingDown: 'Shutting Down...',
        welcome: 'Welcome to PageOnline OS',
        welcomeUser: 'Welcome, {name}',
        apps: {
            settings: 'Settings',
            browser: 'Browser',
            terminal: 'Terminal',
            files: 'My Files',
            notepad: 'Notepad'
        },
        controls: {
            closeWindow: 'Close Window',
            closeAllWindows: 'Close All Windows',
            minimizeAllWindows: 'Minimize All Windows',
            showAllWindows: 'Show All Windows',
            openApp: 'Open {name}',
            pinToDesktop: 'Pin to Desktop',
            pinToTaskbar: 'Pin to Taskbar',
            unpinFromTaskbar: 'Unpin from Taskbar',
            unpinFromDesktop: 'Delete',
            confirmDeleteTitle: 'Confirm Delete',
            confirmDeleteMsg: 'Are you sure you want to remove {name} from the desktop?',
            cancel: 'Cancel',
            delete: 'Delete',
            openSelected: 'Open Selected Apps',
            deleteSelected: 'Delete',
            confirmDeleteMultipleTitle: 'Confirm Delete Multiple',
            confirmDeleteMultipleMsg: 'Are you sure you want to remove {count} shortcuts?'
        },
        bootMessages: [
            'Loading kernel...',
            'Initializing drivers...',
            'Preparing desktop...',
            'Starting system...'
        ]
    }
};

export function t(key, lang = 'id') {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
        if (result[k]) {
            result = result[k];
        } else {
            return key;
        }
    }
    return result;
}

export function getBootMessages(lang = 'id') {
    return translations[lang].bootMessages;
}
