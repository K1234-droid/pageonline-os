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
        const welcomeAvatar = welcomeScreen.querySelector('.welcome-avatar');

        if (welcomeText) {
            welcomeText.innerText = t('welcomeUser', state.language).replace('{name}', state.username);
        }
        if (welcomeAvatar) {
            if (state.profilePicture) {
                welcomeAvatar.innerHTML = `<img src="${state.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                welcomeAvatar.innerText = state.username.charAt(0).toUpperCase();
            }
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
        const welcomeAvatar = document.querySelector('#welcome-screen .welcome-avatar');
        if (welcomeText) {
            welcomeText.innerText = t('welcomeUser', s.language).replace('{name}', s.username);
        }
        if (welcomeAvatar) {
            if (s.profilePicture) {
                welcomeAvatar.innerHTML = `<img src="${s.profilePicture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                welcomeAvatar.innerText = s.username.charAt(0).toUpperCase();
            }
        }

        const shutdownText = document.getElementById('shutdown-user-text');
        if (shutdownText) {
            shutdownText.innerText = t('shuttingDown', s.language);
        }

        const screens = [document.getElementById('welcome-screen'), document.getElementById('shutdown-screen')];
        screens.forEach(screen => {
            if (screen) {
                if (s.desktopWallpaper) {
                    screen.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), ${s.desktopWallpaper}`;
                    screen.style.backgroundSize = 'cover';
                    screen.style.backgroundPosition = 'center';
                    screen.style.backgroundRepeat = 'no-repeat';
                } else {
                    screen.style.background = '';
                    screen.style.backgroundSize = '';
                    screen.style.backgroundPosition = '';
                    screen.style.backgroundRepeat = '';
                }
            }
        });
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
