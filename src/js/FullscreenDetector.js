import { state, setState } from './state.js';
import { t } from './i18n.js';

export function initFullscreenDetector() {
    let overlay = document.getElementById('fullscreen-detector-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'fullscreen-detector-overlay';
        overlay.innerHTML = `
            <div class="welcome-container">
                <div class="welcome-user"><span id="fullscreen-detector-text"></span></div>
            </div>
        `;
        document.body.appendChild(overlay);

        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            zIndex: '999999',
            display: 'none',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            transition: 'opacity 0.5s ease-in-out'
        });
    }

    const detectorText = overlay.querySelector('#fullscreen-detector-text');

    function updateOverlay() {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

        if (!isFullscreen && state.powerStatus === 'on') {
            setState({ isFullscreenStable: false });
            detectorText.innerText = t('fullscreenReturn', state.language);
            overlay.style.display = 'flex';
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);
        } else {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (document.fullscreenElement) {
                    overlay.style.display = 'none';
                    setState({ isFullscreenStable: true });
                }
            }, 600);
        }
    }

    overlay.onclick = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                if (navigator.keyboard && navigator.keyboard.lock) {
                    navigator.keyboard.lock(['Escape']).catch(() => { });
                }
            }).catch(err => {
                console.warn(`Click to Fullscreen failed: ${err.message}`);
            });
        }
    };

    document.addEventListener('fullscreenchange', updateOverlay);
    document.addEventListener('webkitfullscreenchange', updateOverlay);
    document.addEventListener('mozfullscreenchange', updateOverlay);
    document.addEventListener('MSFullscreenChange', updateOverlay);

    updateOverlay();

    window._updateFullscreenDetectorUI = (s) => {
        if (detectorText) {
            detectorText.innerText = t('fullscreenReturn', s.language);
        }
    };
}
