import { setState, state } from './state.js';
import { t, getBootMessages } from './i18n.js';

export function initBoot() {
    const powerBtn = document.getElementById('power-button');
    const powerScreen = document.getElementById('power-screen');
    const bootScreen = document.getElementById('boot-screen');
    const desktopScreen = document.getElementById('desktop-screen');
    const powerText = document.getElementById('power-text');

    powerBtn.addEventListener('click', () => {
        if (state.powerStatus !== 'off') return;

        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                if (navigator.keyboard && navigator.keyboard.lock) {
                    navigator.keyboard.lock(['Escape']).catch(err => {
                        if (err.name === 'AbortError') return;
                        console.warn(`Keyboard lock failed: ${err}`);
                    });
                }
            }).catch(err => {
                // Ignore fullscreen errors if already fullscreen or user denied
                console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }
        startBoot();
    });

    function startBoot() {
        setState({ powerStatus: 'booting' });
        powerScreen.classList.remove('active');
        bootScreen.classList.add('active');

        runBootSequence();
    }

    async function runBootSequence() {
        await new Promise(r => setTimeout(r, 2000));

        bootScreen.style.opacity = '0';
        await new Promise(r => setTimeout(r, 600));
        bootScreen.classList.remove('active');
        bootScreen.style.opacity = '';

        await new Promise(r => setTimeout(r, 500));

        const welcomeScreen = document.getElementById('welcome-screen');
        const welcomeText = document.getElementById('welcome-user-text');
        if (welcomeText) {
            welcomeText.innerText = t('welcomeUser', state.language).replace('{name}', 'User');
        }

        welcomeScreen.classList.add('active');

        await new Promise(r => setTimeout(r, 3000));

        desktopScreen.classList.add('active');

        welcomeScreen.style.pointerEvents = 'none';
        welcomeScreen.style.opacity = '0';
        await new Promise(r => setTimeout(r, 800));
        welcomeScreen.classList.remove('active');
        welcomeScreen.style.opacity = '';
        welcomeScreen.style.pointerEvents = '';

        setState({ powerStatus: 'on' });
    }

    function completeBoot() {
    }

    return function updateUI(s) {
        powerText.innerText = t('powerText', s.language);

        const welcomeText = document.getElementById('welcome-user-text');
        if (welcomeText) {
            welcomeText.innerText = t('welcomeUser', s.language).replace('{name}', 'User');
        }

        const shutdownText = document.getElementById('shutdown-user-text');
        if (shutdownText) {
            shutdownText.innerText = t('shuttingDown', s.language);
        }
    };
}

export async function triggerShutdown() {
    const shutdownScreen = document.getElementById('shutdown-screen');
    const shutdownText = document.getElementById('shutdown-user-text');
    const desktopScreen = document.getElementById('desktop-screen');
    const state = (await import('./state.js')).state;
    const { t } = await import('./i18n.js');

    if (shutdownText) {
        shutdownText.innerText = t('shuttingDown', state.language);
    }

    setState({ powerStatus: 'shutting_down' });

    desktopScreen.style.transition = 'opacity 1s ease-in-out';
    desktopScreen.style.opacity = '0';
    shutdownScreen.classList.add('active');

    await new Promise(r => setTimeout(r, 3000));

    shutdownScreen.style.transition = 'none';
    shutdownScreen.style.opacity = '0';

    if (window._destroyDesktop) window._destroyDesktop();
    setState({ activeApps: [] });

    await new Promise(r => setTimeout(r, 500));

    location.reload();
}
