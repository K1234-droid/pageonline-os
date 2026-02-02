import { t } from './i18n.js';
import { state } from './state.js';

export function initCropper(win, imageSrc, onSave, onCancel) {
    const content = win.querySelector('.window-content');

    content.innerHTML = `
        <div class="cropper-layout" style="display: flex; flex-direction: column; height: 100%; padding: 0; gap: 0;">
            <div class="cropper-canvas-container" style="flex: 1; position: relative; overflow: hidden; background: #000; display: flex; justify-content: center; align-items: center; user-select: none; cursor: grab;">
                <canvas id="cropper-canvas" style="display: block;"></canvas>
                <div class="cropper-frame" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 250px; height: 250px; border: 2px solid rgba(255, 255, 255, 0.5); border-radius: 50%; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65); pointer-events: none;"></div>
            </div>
            <div class="cropper-controls">
                <div class="zoom-control" style="display: flex; align-items: center; gap: 10px; flex: 1;">
                     <label for="crop-zoom" style="font-size: 0.9rem; white-space: nowrap; min-width: 60px;">${t('settings.profile.cropper.zoom', state.language)}</label>
                     <input type="range" id="crop-zoom" name="crop-zoom" min="0.1" max="3" step="0.05" value="1" aria-label="${t('settings.profile.cropper.zoom', state.language)}" style="flex: 1; cursor: pointer;">
                </div>
                <div class="action-buttons" style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="footer-btn secondary" id="btn-crop-cancel">${t('settings.profile.cropper.cancel', state.language)}</button>
                    <button class="footer-btn primary" id="btn-crop-save">${t('settings.profile.cropper.save', state.language)}</button>
                </div>
            </div>
        </div>
    `;

    const canvas = content.querySelector('#cropper-canvas');
    const ctx = canvas.getContext('2d');
    const zoomSlider = content.querySelector('#crop-zoom');
    const container = content.querySelector('.cropper-canvas-container');

    let img = new Image();
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialPinchDistance = 0;
    let initialScale = 1;

    const frameSize = 250;

    function clampOffsets() {
        if (!img.width) return;
        const maxOffsetX = Math.max(0, (img.width * scale - frameSize) / 2);
        const maxOffsetY = Math.max(0, (img.height * scale - frameSize) / 2);
        offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
        offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));
    }

    function render() {
        if (!img.width) return;

        const cw = container.clientWidth;
        const ch = container.clientHeight;

        canvas.width = cw;
        canvas.height = ch;

        ctx.clearRect(0, 0, cw, ch);

        const centerX = cw / 2;
        const centerY = ch / 2;

        ctx.save();
        ctx.translate(centerX + offsetX, centerY + offsetY);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
    }

    img.onload = () => {
        const minScale = Math.max(frameSize / img.width, frameSize / img.height);
        scale = minScale;
        zoomSlider.min = minScale;
        zoomSlider.max = minScale * 5;
        zoomSlider.value = scale;
        clampOffsets();
        render();
    };
    img.src = imageSrc;

    zoomSlider.oninput = (e) => {
        scale = parseFloat(e.target.value);
        clampOffsets();
        render();
    };

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        clampOffsets();
        render();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(parseFloat(zoomSlider.min), Math.min(parseFloat(zoomSlider.max), scale + delta));

        if (newScale !== scale) {
            scale = newScale;
            zoomSlider.value = scale;
            clampOffsets();
            render();
        }
    }, { passive: false });

    function getPinchDistance(touches) {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX - offsetX;
            startY = e.touches[0].clientY - offsetY;
            container.style.cursor = 'grabbing';
        } else if (e.touches.length === 2) {
            isDragging = false;
            initialPinchDistance = getPinchDistance(e.touches);
            initialScale = scale;
        }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging) {
            e.preventDefault();
            offsetX = e.touches[0].clientX - startX;
            offsetY = e.touches[0].clientY - startY;
            clampOffsets();
            render();
        } else if (e.touches.length === 2 && initialPinchDistance > 0) {
            e.preventDefault();
            const currentDistance = getPinchDistance(e.touches);
            const ratio = currentDistance / initialPinchDistance;
            const newScale = Math.max(parseFloat(zoomSlider.min), Math.min(parseFloat(zoomSlider.max), initialScale * ratio));

            if (newScale !== scale) {
                scale = newScale;
                zoomSlider.value = scale;
                clampOffsets();
                render();
            }
        }
    }, { passive: false });

    container.addEventListener('touchend', () => {
        isDragging = false;
        initialPinchDistance = 0;
        container.style.cursor = 'grab';
    }, { passive: true });

    container.addEventListener('touchcancel', () => {
        isDragging = false;
        initialPinchDistance = 0;
        container.style.cursor = 'grab';
    }, { passive: true });

    content.querySelector('#btn-crop-save').onclick = () => {
        const finalSize = 400;
        const pc = document.createElement('canvas');
        pc.width = finalSize;
        pc.height = finalSize;
        const pctx = pc.getContext('2d');

        const outputScale = finalSize / frameSize;

        pctx.translate(finalSize / 2, finalSize / 2);
        pctx.scale(outputScale, outputScale);

        pctx.translate(offsetX, offsetY);
        pctx.scale(scale, scale);

        pctx.drawImage(img, -img.width / 2, -img.height / 2);

        onSave(pc.toDataURL('image/jpeg', 0.9));
    };

    content.querySelector('#btn-crop-cancel').onclick = () => {
        if (onCancel) onCancel();
    };

    const resizeObserver = new ResizeObserver(() => render());
    resizeObserver.observe(container);

    win._updateCropperUI = (s) => {
        const zoomLabel = content.querySelector('.zoom-control label');
        if (zoomLabel) zoomLabel.innerText = t('settings.profile.cropper.zoom', s.language);

        const cancelBtn = content.querySelector('#btn-crop-cancel');
        if (cancelBtn) cancelBtn.innerText = t('settings.profile.cropper.cancel', s.language);

        const saveBtn = content.querySelector('#btn-crop-save');
        if (saveBtn) saveBtn.innerText = t('settings.profile.cropper.save', s.language);

        const headerTitle = win.querySelector('.window-title');
        if (headerTitle) {
            headerTitle.innerText = t('settings.profile.cropper.title', s.language);
        }
    };
}
