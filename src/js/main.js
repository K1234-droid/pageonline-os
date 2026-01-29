import { subscribe, state, setState } from './state.js';
import { initBoot } from './boot.js';
import { initDesktop } from './desktop.js';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
            console.log('Dev mode: Unregistering Service Worker', registration);
            registration.unregister();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const bootUpdate = initBoot();
    const updateUI = initDesktop();

    window.addEventListener('resize', () => {
        updateUI(state);
    });

    let escTimer = null;
    const clearEscTimer = () => {
        if (escTimer) {
            clearTimeout(escTimer);
            escTimer = null;
        }
    };

    window.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            clearEscTimer();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            if (navigator.keyboard && navigator.keyboard.lock) {
                navigator.keyboard.lock(['Escape']).catch(console.warn);
            }
        } else {
            clearEscTimer();
        }
    });

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            const activeElement = document.activeElement;
            const isInput = activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable;

            if (!isInput) {
                e.preventDefault();
            }
        }

        if (e.key === 'Escape') {
            if (state.powerStatus !== 'off') {
                e.preventDefault();
                e.stopImmediatePropagation();

                if (state.startMenuOpen) {
                    setState({ startMenuOpen: false });
                }

                if (window.closeOSContextMenu) {
                    window.closeOSContextMenu();
                }

                if (!escTimer) {
                    escTimer = setTimeout(() => {
                        if (document.fullscreenElement) {
                            document.exitFullscreen().catch(err => console.warn(err));
                        }
                    }, 3000);
                }
            }
            else {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(err => console.warn(err));
                }
            }
        }
    });

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (state.startMenuOpen) {
            setState({ startMenuOpen: false });
        }
    });

    subscribe((state) => {
        document.documentElement.setAttribute('lang', state.language);

        bootUpdate(state);
        updateUI(state);
    });

    document.documentElement.setAttribute('lang', state.language);
    bootUpdate(state);
    updateUI(state);
});
