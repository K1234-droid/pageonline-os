const translations = {
    id: {
        powerText: 'Klik untuk Memulai',
        bootStatus: 'Sistem sedang memuat...',
        shutdown: 'Matikan',
        shuttingDown: 'Mematikan Daya...',
        fullscreenReturn: 'Klik di Mana Saja untuk Kembali ke Tampilan Penuh',
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
            confirmDeleteMultipleMsg: 'Apakah Anda yakin ingin menghapus {count} pintasan?',
            openSettings: 'Buka Pengaturan',
            changeClock: 'Ubah Tampilan Waktu dan Tanggal',
            changeWallpaper: 'Ubah Wallpaper',
            editProfile: 'Ubah'
        },
        bootMessages: [
            'Memuat kernel...',
            'Menginisialisasi driver...',
            'Menyiapkan desktop...',
            'Mulai sistem...'
        ],
        settings: {
            title: 'Pengaturan',
            searchPlaceholder: 'Cari pengaturan...',
            noResults: 'Tidak ditemukan hasil',
            menu: {
                home: 'Beranda',
                profile: 'Profil',
                general: 'Umum',
                appearance: 'Tampilan',
                system: 'Sistem',
                about: 'Tentang'
            },
            home: {
                welcome: 'Halo, {name}',
                subtitle: 'Kelola preferensi sistem Anda di sini.',
                quickActions: 'Tautan Cepat'
            },
            profile: {
                sectionTitle: 'Profil Pengguna',
                editAvatar: 'Ubah Foto',
                username: 'Nama Pengguna',
                save: 'Simpan Perubahan',
                cropper: {
                    title: 'Potong Foto Profil',
                    zoom: 'Perbesar',
                    save: 'Simpan',
                    cancel: 'Batal'
                }
            },
            general: {
                sectionTitle: 'Pengaturan Umum',
                language: 'Bahasa Sistem',
                langId: 'Bahasa Indonesia',
                langEn: 'English',
                clockFormat: 'Format Waktu',
                time12: '12 Jam (00:00 PM)',
                time24: '24 Jam (00:00)',
                dateDisplay: 'Tampilan Waktu & Tanggal',
                timeOnly: 'Hanya Jam',
                timeDMY: 'Jam & Tanggal (DD/MM/YYYY)',
                timeMDY: 'Jam & Tanggal (MM/DD/YYYY)',
                timeYMD: 'Jam & Tanggal (YYYY/MM/DD)'
            },
            appearance: {
                sectionTitle: 'Personalisasi',
                wallpaper: 'Wallpaper Desktop',
                upload: 'Unggah Gambar',
                default: 'Gunakan Default'
            },
            about: {
                sectionTitle: 'Tentang Website',
                description: 'PageOnline OS adalah simulasi sistem operasi berbasis web dengan desain yang modern.',
                version: 'Versi',
                update: 'Kunjungi GitHub'
            },
            system: {
                sectionTitle: 'Sistem',
                fullscreen: {
                    label: 'Selalu Tampilkan Layar Penuh',
                    description: 'Jika fitur ini dinonaktifkan, website akan menyesuaikan tampilannya sesuai dengan ukuran jendela browser.'
                }
            }
        }
    },
    en: {
        powerText: 'Click to Start',
        bootStatus: 'System is loading...',
        shutdown: 'Shutdown',
        shuttingDown: 'Shutting Down...',
        fullscreenReturn: 'Click Anywhere to Return to Full View',
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
            confirmDeleteMultipleMsg: 'Are you sure you want to remove {count} shortcuts?',
            openSettings: 'Open Settings',
            changeClock: 'Change the Time and Date Display',
            changeWallpaper: 'Change Wallpaper',
            editProfile: 'Edit'
        },
        bootMessages: [
            'Loading kernel...',
            'Initializing drivers...',
            'Preparing desktop...',
            'Starting system...'
        ],
        settings: {
            title: 'Settings',
            searchPlaceholder: 'Search settings...',
            noResults: 'No results found',
            menu: {
                home: 'Home',
                profile: 'Profile',
                general: 'General',
                appearance: 'Appearance',
                system: 'System',
                about: 'About'
            },
            home: {
                welcome: 'Hello, {name}',
                subtitle: 'Manage your system preferences here.',
                quickActions: 'Quick Links'
            },
            profile: {
                sectionTitle: 'User Profile',
                editAvatar: 'Change Photo',
                username: 'Username',
                save: 'Save Changes',
                cropper: {
                    title: 'Crop Profile Picture',
                    zoom: 'Zoom',
                    save: 'Save',
                    cancel: 'Cancel'
                }
            },
            general: {
                sectionTitle: 'General Settings',
                language: 'System Language',
                langId: 'Bahasa Indonesia',
                langEn: 'English',
                clockFormat: 'Time Format',
                time12: '12-Hour (00:00 PM)',
                time24: '24-Hour (00:00)',
                dateDisplay: 'Date & Time Display',
                timeOnly: 'Time Only',
                timeDMY: 'Time & Date (DD/MM/YYYY)',
                timeMDY: 'Time & Date (MM/DD/YYYY)',
                timeYMD: 'Time & Date (YYYY/MM/DD)'
            },
            appearance: {
                sectionTitle: 'Personalization',
                wallpaper: 'Desktop Wallpaper',
                upload: 'Upload Image',
                default: 'Use Default'
            },
            about: {
                sectionTitle: 'About Website',
                description: 'PageOnline OS is a web-based operating system simulation with a modern design.',
                version: 'Version',
                update: 'Visit GitHub'
            },
            system: {
                sectionTitle: 'System',
                fullscreen: {
                    label: 'Always Show Full Screen',
                    description: 'If this feature is disabled, the website will adjust it\'s appearance according to the size of the browser window.'
                }
            }
        }
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
