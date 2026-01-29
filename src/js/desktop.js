import { state, setState, toggleLanguage, toggleAppList, addActiveApp, removeActiveApp, focusApp, togglePinDesktop, togglePinTaskbar } from './state.js';
import { t } from './i18n.js';

export function initDesktop() {
    let contextMenuOpen = false;
    let selectionAnchor = null;
    let keyboardFocusId = null;
    let lastActiveId = null;

    const appListBtn = document.getElementById('app-list-btn');
    const appListMenu = document.getElementById('app-list-menu');
    const desktopIcons = document.getElementById('desktop-icons');
    const langBtn = document.getElementById('lang-switch');
    const clock = document.getElementById('system-clock');
    const appContainer = document.getElementById('window-container');
    const appListContent = document.getElementById('app-list-content');
    const shutdownBtn = document.getElementById('shutdown-btn');
    const taskbar = document.querySelector('.taskbar');

    const sensor = document.createElement('div');
    sensor.className = 'taskbar-sensor';
    document.body.appendChild(sensor);

    let gridOverlay = document.getElementById('desktop-grid-overlay');
    if (!gridOverlay) {
        gridOverlay = document.createElement('div');
        gridOverlay.id = 'desktop-grid-overlay';
        document.querySelector('.desktop-container').appendChild(gridOverlay);
    }

    let maximizedCount = 0;

    function updateTaskbarAutohide() {
        const isMenuOpen = state.appListOpen ||
            (document.getElementById('custom-context-menu')?.style.display === 'block') ||
            (document.getElementById('overflow-menu')?.style.display === 'block') ||
            (document.getElementById('group-preview-menu')?.style.display === 'block');

        let focusedMaximized = false;
        if (state.focusedApp) {
            const focusedWin = document.getElementById(`win-${state.focusedApp}`);
            if (focusedWin && focusedWin.classList.contains('maximized')) {
                focusedMaximized = true;
            }
        }

        if (focusedMaximized && !isMenuOpen) {
            taskbar.classList.add('autohide');
        } else {
            taskbar.classList.remove('autohide');
            taskbar.classList.remove('show');
        }
    }

    sensor.onmouseenter = () => {
        if (taskbar.classList.contains('autohide')) {
            taskbar.classList.add('show');
        }
    };

    taskbar.onmouseleave = () => {
        if (taskbar.classList.contains('autohide')) {
            taskbar.classList.remove('show');
        }
    };

    const apps = [
        { id: 'settings', icon: '⚙️', label: 'apps.settings' },
        { id: 'browser', icon: '🌐', label: 'apps.browser' },
        { id: 'terminal', icon: '🐚', label: 'apps.terminal' },
        { id: 'notepad', icon: '📝', label: 'apps.notepad' },
        { id: 'files', icon: '📁', label: 'apps.files' }
    ];

    function handleDesktopSelection(id, ctrlKey, shiftKey) {
        let newSelection = [];
        const current = state.selectedDesktopApps || [];
        const pinned = state.pinnedDesktopApps || [];

        keyboardFocusId = id;
        lastActiveId = id;

        if (shiftKey && selectionAnchor) {
            const sorted = [...pinned].sort((a, b) => {
                if (a.y !== b.y) return a.y - b.y;
                return a.x - b.x;
            });

            const startIdx = sorted.findIndex(a => a.id === selectionAnchor);
            const endIdx = sorted.findIndex(a => a.id === id);

            if (startIdx !== -1 && endIdx !== -1) {
                const min = Math.min(startIdx, endIdx);
                const max = Math.max(startIdx, endIdx);
                newSelection = sorted.slice(min, max + 1).map(a => a.id);
            } else {
                newSelection = [id];
                selectionAnchor = id;
            }
        } else if (ctrlKey) {
            if (current.includes(id)) {
                newSelection = current.filter(appId => appId !== id);
            } else {
                newSelection = [...current, id];
            }
            selectionAnchor = id;
        } else {
            newSelection = [id];
            selectionAnchor = id;
        }
        setState({ selectedDesktopApps: newSelection });
        activateDesktop();
    }

    function clearDesktopSelection() {
        const hasSelection = state.selectedDesktopApps && state.selectedDesktopApps.length > 0;
        const hasFocus = keyboardFocusId !== null;

        if (hasSelection || hasFocus) {
            setState({ selectedDesktopApps: [] });
            keyboardFocusId = null;
            selectionAnchor = null;
            activateDesktop();
        }
    }

    function activateDesktop() {
        focusWindow(null);
        if (state.appListOpen) setState({ appListOpen: false });
    }

    appListBtn.onclick = (e) => {
        e.stopPropagation();
        toggleAppList();
    };

    langBtn.onclick = (e) => {
        e.stopPropagation();
        toggleLanguage();
    };

    if (window._desktopGlobalClick) document.removeEventListener('click', window._desktopGlobalClick);
    window._desktopGlobalClick = () => {
        if (state.appListOpen) setState({ appListOpen: false });
    };
    document.addEventListener('click', window._desktopGlobalClick);

    if (window._desktopGlobalMousedown) document.removeEventListener('mousedown', window._desktopGlobalMousedown);
    window._desktopGlobalMousedown = (e) => {
        if (e.target.closest('.desktop-icon')) return;

        if (e.target.closest('.context-menu')) return;

        if (!e.target.closest('.window')) {
            clearDesktopSelection();
        }
    };
    document.addEventListener('mousedown', window._desktopGlobalMousedown);

    appListMenu.addEventListener('click', (e) => e.stopPropagation());

    const desktopContainer = document.querySelector('.desktop-container');

    const intersects = (r1, r2) => {
        return !(r2.left > r1.right ||
            r2.right < r1.left ||
            r2.top > r1.bottom ||
            r2.bottom < r1.top);
    };

    let isSelecting = false;
    let selectionStart = { x: 0, y: 0 };
    const selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    desktopContainer.appendChild(selectionBox);

    let initialSelection = [];

    desktopContainer.addEventListener('mousedown', (e) => {
        if (state.appListOpen) setState({ appListOpen: false });

        if (e.target === desktopContainer || e.target.id === 'desktop-icons') {
            focusWindow(null);

            isSelecting = true;
            const rect = desktopContainer.getBoundingClientRect();
            selectionStart = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            selectionBox.style.left = `${selectionStart.x}px`;
            selectionBox.style.top = `${selectionStart.y}px`;
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.classList.add('active');

            if (!e.ctrlKey && !e.shiftKey) {
                clearDesktopSelection();
                initialSelection = [];
            } else {
                initialSelection = [...(state.selectedDesktopApps || [])];
            }
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        const rect = desktopContainer.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const left = Math.min(selectionStart.x, currentX);
        const top = Math.min(selectionStart.y, currentY);
        const width = Math.abs(currentX - selectionStart.x);
        const height = Math.abs(currentY - selectionStart.y);

        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;

        const boxRect = selectionBox.getBoundingClientRect();
        const icons = document.querySelectorAll('.desktop-icon');
        const nextSelection = new Set(initialSelection);

        icons.forEach(icon => {
            const iconRect = icon.getBoundingClientRect();
            const id = icon.getAttribute('data-id');
            if (id && intersects(boxRect, iconRect)) {
                nextSelection.add(id);
            } else if (id && !initialSelection.includes(id)) {
                if (nextSelection.has(id)) nextSelection.delete(id);
            }
        });

        const newArr = Array.from(nextSelection);
        const currentArr = state.selectedDesktopApps || [];
        if (newArr.length !== currentArr.length || !newArr.every(i => currentArr.includes(i))) {
            setState({ selectedDesktopApps: newArr });
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (!isSelecting) return;
        isSelecting = false;
        selectionBox.classList.remove('active');

        const current = state.selectedDesktopApps || [];
        if (current.length > 0) {
            keyboardFocusId = current[current.length - 1];
            lastActiveId = keyboardFocusId;
            activateDesktop();
        }
    });

    if (window._desktopKeyHandler) window.removeEventListener('keydown', window._desktopKeyHandler);
    window._desktopKeyHandler = (e) => {
        if (state.powerStatus !== 'on') return;

        if (isSelecting) {
            if (e.key === 'Escape') {
                isSelecting = false;
                selectionBox.classList.remove('active');
                setState({ selectedDesktopApps: initialSelection });
            }
            return;
        }

        if (state.appListOpen) return;
        const activeMenus = [
            document.getElementById('custom-context-menu'),
            document.getElementById('overflow-menu'),
            document.getElementById('group-preview-menu')
        ];
        if (activeMenus.some(el => el && el.style.display === 'block')) return;

        const currentSelection = state.selectedDesktopApps || [];
        const pinned = state.pinnedDesktopApps || [];

        if (e.key === 'Escape') {
            if (state.focusedApp) {
                const focusedWin = document.getElementById(`win-${state.focusedApp}`);
                if (focusedWin && focusedWin._isConfirmDelete) {
                    const cancelBtn = focusedWin.querySelector('#btn-confirm-cancel');
                    if (cancelBtn) cancelBtn.click();
                    return;
                }
            }

            if (!state.focusedApp && currentSelection.length > 0) {
                setState({ selectedDesktopApps: [] });
                keyboardFocusId = null;
                selectionAnchor = null;
                activateDesktop();
            }
            return;
        }

        if (e.key === 'Enter' && state.focusedApp) {
            const focusedWin = document.getElementById(`win-${state.focusedApp}`);
            if (focusedWin && focusedWin._isConfirmDelete) {
                const deleteBtn = focusedWin.querySelector('#btn-confirm-delete');
                if (deleteBtn) deleteBtn.click();
                return;
            }
        }

        if (state.focusedApp) return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            const allIds = pinned.map(p => p.id);
            setState({ selectedDesktopApps: allIds });
            activateDesktop();
            return;
        }

        if (e.key === ' ' && keyboardFocusId) {
            e.preventDefault();
            handleDesktopSelection(keyboardFocusId, true, false);
            return;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            if (pinned.length === 0) return;

            const sorted = [...pinned].sort((a, b) => {
                if (a.y !== b.y) return a.y - b.y;
                return a.x - b.x;
            });

            let startId = keyboardFocusId;
            if (!startId && state.selectedDesktopApps.length > 0) {
                startId = state.selectedDesktopApps[state.selectedDesktopApps.length - 1];
            }
            if (!startId && lastActiveId) {
                if (pinned.some(p => p.id === lastActiveId)) {
                    startId = lastActiveId;
                }
            }

            if (!startId) {
                startId = sorted[0].id;
                keyboardFocusId = startId;
                lastActiveId = startId;
                if (!e.ctrlKey) handleDesktopSelection(startId, false, false);
                else activateDesktop();
                return;
            }

            if (keyboardFocusId === null) {
                keyboardFocusId = startId;
                lastActiveId = startId;
                if (!e.ctrlKey) handleDesktopSelection(startId, false, false);
                else activateDesktop();
                return;
            }

            let currentIcon = pinned.find(a => a.id === startId);

            if (!currentIcon) {
                keyboardFocusId = null;
                selectionAnchor = null;
                if (sorted.length > 0) {
                    startId = sorted[0].id;
                    currentIcon = sorted[0];
                    keyboardFocusId = startId;
                    lastActiveId = startId;
                    if (!e.ctrlKey) handleDesktopSelection(startId, false, false);
                    else activateDesktop();
                } else {
                    return;
                }
            }

            let nextIcon = null;
            if (e.key === 'ArrowRight') {
                const idx = sorted.findIndex(a => a.id === startId);
                nextIcon = sorted[idx + 1] || sorted[sorted.length - 1];
            } else if (e.key === 'ArrowLeft') {
                const idx = sorted.findIndex(a => a.id === startId);
                nextIcon = sorted[idx - 1] || sorted[0];
            } else if (e.key === 'ArrowDown') {
                const distinctYs = [...new Set(sorted.map(a => a.y))].sort((a, b) => a - b);
                const currentYIdx = distinctYs.indexOf(currentIcon.y);
                const targetY = (currentYIdx !== -1 && currentYIdx < distinctYs.length - 1)
                    ? distinctYs[currentYIdx + 1]
                    : null;

                if (targetY !== null) {
                    const rowPeers = sorted.filter(a => a.y === targetY);
                    nextIcon = rowPeers.reduce((prev, curr) =>
                        Math.abs(curr.x - currentIcon.x) < Math.abs(prev.x - currentIcon.x) ? curr : prev
                    );
                } else {
                    nextIcon = currentIcon;
                }
            } else if (e.key === 'ArrowUp') {
                const distinctYs = [...new Set(sorted.map(a => a.y))].sort((a, b) => a - b);
                const currentYIdx = distinctYs.indexOf(currentIcon.y);
                const targetY = (currentYIdx > 0) ? distinctYs[currentYIdx - 1] : null;

                if (targetY !== null) {
                    const rowPeers = sorted.filter(a => a.y === targetY);
                    nextIcon = rowPeers.reduce((prev, curr) =>
                        Math.abs(curr.x - currentIcon.x) < Math.abs(prev.x - currentIcon.x) ? curr : prev
                    );
                } else {
                    nextIcon = currentIcon;
                }
            }

            if (nextIcon && nextIcon.id) {
                keyboardFocusId = nextIcon.id;
                lastActiveId = nextIcon.id;

                if (e.ctrlKey) {
                    activateDesktop();
                } else {
                    handleDesktopSelection(nextIcon.id, false, e.shiftKey);
                }
            }
        }

        if (e.key === 'Enter') {
            const targets = currentSelection.length > 0 ? currentSelection : (keyboardFocusId ? [keyboardFocusId] : []);
            if (targets.length > 0) {
                targets.forEach(id => {
                    const app = apps.find(a => a.id === id);
                    if (app) {
                        openApp(app);
                        lastActiveId = id;
                    }
                });
            }
        }

        if (e.key === 'Delete') confirmDeleteMultiple();
    };
    window.addEventListener('keydown', window._desktopKeyHandler);

    taskbar.addEventListener('mousedown', (e) => {
        if (e.target === taskbar || e.target.id === 'taskbar-apps') {
            focusWindow(null);
        }
    });

    shutdownBtn.addEventListener('click', () => {
        import('./boot.js').then(m => m.triggerShutdown());
    });

    let resizeTimer;
    function reflowIcons() {
        if (state.powerStatus !== 'on') return;

        const pinned = state.pinnedDesktopApps || [];
        if (pinned.length === 0) return;

        const container = document.querySelector('.desktop-container');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const style = getComputedStyle(container);
        const cellW = parseInt(style.getPropertyValue('--desktop-icon-width')) || 100;
        const cellH = parseInt(style.getPropertyValue('--desktop-icon-height')) || 110;
        const gap = parseInt(style.getPropertyValue('--desktop-icon-gap')) || 10;
        const padL = parseInt(style.paddingLeft) || 20;
        const padT = parseInt(style.paddingTop) || 20;

        const availW = rect.width - (padL * 2);
        const availH = rect.height - (padT * 2);

        const cols = Math.max(1, Math.floor((availW + gap) / (cellW + gap)));
        const rows = Math.max(1, Math.floor((availH + gap) / (cellH + gap)));

        const valid = [];
        const invalid = [];

        pinned.forEach(p => {
            if (p.x < cols && p.y < rows) {
                valid.push(p);
            } else {
                invalid.push(p);
            }
        });

        if (invalid.length === 0) return;

        const occupied = new Set(valid.map(p => `${p.x},${p.y}`));
        const newPinned = [...valid];

        let x = 0;
        let y = 0;

        if (valid.length > 0) {
            const last = valid.reduce((prev, curr) => {
                if (curr.x > prev.x) return curr;
                if (curr.x === prev.x && curr.y > prev.y) return curr;
                return prev;
            });
            x = last.x;
            y = last.y + 1;
        }

        invalid.forEach(p => {
            while (true) {
                if (y >= rows) {
                    y = 0;
                    x++;
                }

                if (!occupied.has(`${x},${y}`)) {
                    break;
                }

                y++;
            }

            newPinned.push({ ...p, x, y });
            occupied.add(`${x},${y}`);
        });

        setState({ pinnedDesktopApps: newPinned });
    }

    if (window._desktopResize) window.removeEventListener('resize', window._desktopResize);
    window._desktopResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(reflowIcons, 150);
    };
    window.addEventListener('resize', window._desktopResize);

    const initReflow = () => {
        const container = document.querySelector('.desktop-container');
        if (container && container.clientHeight > 0) {
            reflowIcons();
        } else {
            setTimeout(initReflow, 100);
        }
    };

    if (document.readyState === 'complete') {
        setTimeout(initReflow, 300);
    } else {
        window.addEventListener('load', () => setTimeout(initReflow, 300));
    }

    let dragLeaderId = null;

    function renderIcons() {
        let pinnedIds = state.pinnedDesktopApps || [];

        const containerRect = desktopContainer.getBoundingClientRect();
        const style = getComputedStyle(desktopContainer);

        const cellWidth = parseInt(style.getPropertyValue('--desktop-icon-width')) || 100;
        const cellHeight = parseInt(style.getPropertyValue('--desktop-icon-height')) || 110;
        const gap = parseInt(style.getPropertyValue('--desktop-icon-gap')) || 10;

        const paddingLeft = parseInt(style.paddingLeft) || 20;
        const paddingTop = parseInt(style.paddingTop) || 20;

        const availableWidth = containerRect.width - (paddingLeft * 2);
        const availableHeight = containerRect.height - (paddingTop * 2);

        const cols = Math.max(1, Math.floor((availableWidth + gap) / (cellWidth + gap)));
        const rows = Math.max(1, Math.floor((availableHeight + gap) / (cellHeight + gap)));

        gridOverlay.innerHTML = '';
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.setAttribute('data-x', c);
                cell.setAttribute('data-y', r);
                cell.style.left = `${paddingLeft + c * (cellWidth + gap)}px`;
                cell.style.top = `${paddingTop + r * (cellHeight + gap)}px`;
                gridOverlay.appendChild(cell);
            }
        }

        const oldPositions = new Map();
        Array.from(desktopIcons.children).forEach(icon => {
            const id = icon.getAttribute('data-id');
            if (id) oldPositions.set(id, icon.getBoundingClientRect());
        });

        const activeIds = pinnedIds
            .filter(p => p.x < cols && p.y < rows)
            .map(p => p.id);

        Array.from(desktopIcons.children).forEach(icon => {
            const id = icon.getAttribute('data-id');
            if (!activeIds.includes(id) && !icon.classList.contains('removing')) {
                icon.classList.add('removing');
                setTimeout(() => icon.remove(), 350);
            }
        });

        pinnedIds.forEach(pinnedApp => {
            const app = apps.find(a => a.id === pinnedApp.id);
            if (!app) return;

            if (pinnedApp.x >= cols || pinnedApp.y >= rows) return;

            let icon = desktopIcons.querySelector(`.desktop-icon[data-id="${app.id}"]`);
            const isNew = !icon;

            if (isNew) {
                icon = document.createElement('div');
                icon.className = 'desktop-icon entering';
                icon.setAttribute('draggable', 'true');
                icon.setAttribute('data-id', app.id);
                desktopIcons.appendChild(icon);

                setTimeout(() => icon.classList.remove('entering'), 500);
            }

            const left = paddingLeft + pinnedApp.x * (cellWidth + gap);
            const top = paddingTop + pinnedApp.y * (cellHeight + gap);
            icon.style.left = `${left}px`;
            icon.style.top = `${top}px`;

            if (isNew || icon.dataset.lang !== state.language) {
                icon.dataset.lang = state.language;
                icon.innerHTML = `
                    <div class="icon-img ${app.id === 'files' ? 'folder' : ''}">${app.icon}</div>
                    <div class="icon-label">${t(app.label, state.language)}</div>
                `;
            }

            icon.setAttribute('data-id', app.id);
            icon.className = 'desktop-icon';
            if (state.selectedDesktopApps.includes(app.id)) icon.classList.add('selected');
            if (app.id === keyboardFocusId) icon.classList.add('keyboard-focus');
            if (isNew) icon.classList.add('entering');

            icon.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDesktopSelection(app.id, e.ctrlKey, e.shiftKey, selectionAnchor);

                keyboardFocusId = app.id;
                lastActiveId = app.id;

                if (!e.shiftKey && !e.ctrlKey) {
                    selectionAnchor = app.id;
                }
            };

            icon.ondblclick = (e) => {
                e.stopPropagation();
                lastActiveId = app.id;
                openApp(app);
            };

            icon.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                lastActiveId = app.id;
                if (!state.selectedDesktopApps.includes(app.id)) {
                    handleDesktopSelection(app.id, false);
                } else {
                    activateDesktop();
                }
                showContextMenu(e.clientX, e.clientY, app, 'desktop');
            };

            icon.ondragstart = (e) => {
                let dragList = [app.id];
                dragLeaderId = app.id;

                if (state.selectedDesktopApps && state.selectedDesktopApps.includes(app.id)) {
                    dragList = [...state.selectedDesktopApps];
                    activateDesktop();
                } else {
                    handleDesktopSelection(app.id, false);
                    dragList = [app.id];
                }

                e.dataTransfer.setData('application/desktop-id', app.id);
                e.dataTransfer.setData('application/desktop-ids', JSON.stringify(dragList));
                icon.classList.add('dragging');
                gridOverlay.classList.add('visible');
            };
            icon.ondragend = () => {
                icon.classList.remove('dragging');
                gridOverlay.classList.remove('visible');
                document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('active-target'));
                dragLeaderId = null;
            };
        });

        desktopContainer.ondragover = (e) => {
            e.preventDefault();

            const startIdType = e.dataTransfer.types.find(t => t.startsWith('application/start-id:'));
            if (startIdType) {
                const appId = startIdType.split(':')[1];
                if (state.pinnedDesktopApps.some(a => a.id === appId)) {
                    e.dataTransfer.dropEffect = 'none';
                    document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('active-target'));
                    return;
                }
            }

            const rect = desktopContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - paddingLeft;
            const mouseY = e.clientY - rect.top - paddingTop;

            let targetX = Math.floor(mouseX / (cellWidth + gap));
            let targetY = Math.floor(mouseY / (cellHeight + gap));

            targetX = Math.max(0, Math.min(targetX, cols - 1));
            targetY = Math.max(0, Math.min(targetY, rows - 1));

            const cellsToHighlight = new Set();

            if (dragLeaderId) {
                const pinned = state.pinnedDesktopApps || [];
                const leaderApp = pinned.find(a => a.id === dragLeaderId);

                if (leaderApp) {
                    let draggedApps = [];
                    if (state.selectedDesktopApps && state.selectedDesktopApps.includes(dragLeaderId)) {
                        draggedApps = state.selectedDesktopApps.map(id => pinned.find(a => a.id === id)).filter(Boolean);
                    } else {
                        draggedApps = [leaderApp];
                    }

                    let minDx = 0, maxDx = 0, minDy = 0, maxDy = 0;
                    draggedApps.forEach(app => {
                        const dx = app.x - leaderApp.x;
                        const dy = app.y - leaderApp.y;
                        if (dx < minDx) minDx = dx;
                        if (dx > maxDx) maxDx = dx;
                        if (dy < minDy) minDy = dy;
                        if (dy > maxDy) maxDy = dy;
                    });

                    targetX = Math.max(-minDx, Math.min(targetX, cols - 1 - maxDx));
                    targetY = Math.max(-minDy, Math.min(targetY, rows - 1 - maxDy));

                    draggedApps.forEach(app => {
                        const dx = app.x - leaderApp.x;
                        const dy = app.y - leaderApp.y;
                        const destX = targetX + dx;
                        const destY = targetY + dy;
                        cellsToHighlight.add(`${destX},${destY}`);
                    });
                }
            } else {
                cellsToHighlight.add(`${targetX},${targetY}`);
            }

            document.querySelectorAll('.grid-cell').forEach(cell => {
                const cx = parseInt(cell.getAttribute('data-x'));
                const cy = parseInt(cell.getAttribute('data-y'));
                if (cellsToHighlight.has(`${cx},${cy}`)) {
                    cell.classList.add('active-target');
                } else {
                    cell.classList.remove('active-target');
                }
            });
        };

        desktopContainer.ondrop = (e) => {
            e.preventDefault();
            gridOverlay.classList.remove('visible');

            const startIdType = e.dataTransfer.types.find(t => t.startsWith('application/start-id:'));
            const startId = startIdType ? startIdType.split(':')[1] : null;
            const desktopId = e.dataTransfer.getData('application/desktop-id');
            const desktopIds = JSON.parse(e.dataTransfer.getData('application/desktop-ids') || '[]');

            const id = desktopId || startId;
            if (!id) return;

            const rect = desktopContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - paddingLeft;
            const mouseY = e.clientY - rect.top - paddingTop;

            let targetX = Math.floor(mouseX / (cellWidth + gap));
            let targetY = Math.floor(mouseY / (cellHeight + gap));

            targetX = Math.max(0, Math.min(targetX, cols - 1));
            targetY = Math.max(0, Math.min(targetY, rows - 1));

            const current = [...state.pinnedDesktopApps];

            if (startId) {
                const isAlreadyPinned = current.some(a => a.id === startId);
                if (isAlreadyPinned) return;

                const collision = current.find(a => a.x === targetX && a.y === targetY);
                if (collision) {
                    collision.x++;
                }

                current.push({ id: startId, x: targetX, y: targetY });
                setState({ pinnedDesktopApps: current, savedDesktopApps: current });

            } else if (desktopId && desktopIds.length > 0) {
                const leaderApp = current.find(a => a.id === desktopId);
                if (!leaderApp) return;

                const draggedItems = desktopIds.map(dId => current.find(x => x.id === dId)).filter(Boolean);
                if (draggedItems.length > 0) {
                    let minDx = 0, maxDx = 0, minDy = 0, maxDy = 0;
                    draggedItems.forEach(app => {
                        const dx = app.x - leaderApp.x;
                        const dy = app.y - leaderApp.y;
                        if (dx < minDx) minDx = dx;
                        if (dx > maxDx) maxDx = dx;
                        if (dy < minDy) minDy = dy;
                        if (dy > maxDy) maxDy = dy;
                    });

                    targetX = Math.max(-minDx, Math.min(targetX, cols - 1 - maxDx));
                    targetY = Math.max(-minDy, Math.min(targetY, rows - 1 - maxDy));
                }

                const deltaX = targetX - leaderApp.x;
                const deltaY = targetY - leaderApp.y;

                const frozenSlots = new Set();
                const moves = new Map();

                desktopIds.forEach(dragId => {
                    const item = current.find(a => a.id === dragId);
                    if (item) {
                        const newX = item.x + deltaX;
                        const newY = item.y + deltaY;
                        moves.set(dragId, { x: newX, y: newY });
                        frozenSlots.add(`${newX},${newY}`);
                    }
                });

                let unresolved = true;
                const maxIterations = 100;
                let iter = 0;

                while (unresolved && iter < maxIterations) {
                    unresolved = false;
                    iter++;

                    const victim = current.find(item => {
                        if (desktopIds.includes(item.id)) return false;

                        const claimedByDrag = frozenSlots.has(`${item.x},${item.y}`);

                        return claimedByDrag;
                    });

                    if (victim) {
                        unresolved = true;

                        let cx = victim.x;
                        let cy = victim.y;

                        while (true) {
                            cx++;
                            if (cx >= cols) {
                                cx = 0;
                                cy++;
                            }
                            if (cy >= rows) {
                                break;
                            }

                            const slotKey = `${cx},${cy}`;
                            if (frozenSlots.has(slotKey)) continue;

                            const occupiedByStatic = current.some(other =>
                                other.id !== victim.id &&
                                !desktopIds.includes(other.id) &&
                                other.x === cx && other.y === cy
                            );

                            if (!occupiedByStatic) {
                                break;
                            }
                        }

                        victim.x = cx;
                        victim.y = cy;
                    }
                }

                moves.forEach((pos, id) => {
                    const item = current.find(a => a.id === id);
                    if (item) {
                        item.x = pos.x;
                        item.y = pos.y;
                    }
                });

                setState({ pinnedDesktopApps: current, savedDesktopApps: current });
            }
        };

        requestAnimationFrame(() => {
            Array.from(desktopIcons.children).forEach(icon => {
                const id = icon.getAttribute('data-id');
                const oldRect = oldPositions.get(id);
                if (oldRect) {
                    const newRect = icon.getBoundingClientRect();
                    const deltaX = oldRect.left - newRect.left;
                    const deltaY = oldRect.top - newRect.top;

                    if (deltaX !== 0 || deltaY !== 0) {
                        icon.style.transition = 'none';
                        icon.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

                        requestAnimationFrame(() => {
                            icon.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
                            icon.style.transform = 'translate(0, 0)';
                        });
                    }
                }
            });
        });
    }

    const resizeObserver = new ResizeObserver(() => {
        reflowIcons();
        renderIcons();
    });
    resizeObserver.observe(desktopContainer);

    function renderAppListItems() {
        appListContent.innerHTML = '';

        const sortedApps = [...apps].sort((a, b) => {
            const labelA = t(a.label, state.language);
            const labelB = t(b.label, state.language);
            return labelA.localeCompare(labelB, state.language === 'id' ? 'id-ID' : 'en-US');
        });

        sortedApps.forEach(app => {
            const item = document.createElement('div');
            item.className = 'app-list-item';
            item.setAttribute('draggable', 'true');
            item.innerHTML = `
        <div class="app-icon ${app.id === 'files' ? 'folder' : ''}">${app.icon}</div>
        <span class="app-name">${t(app.label, state.language)}</span>
      `;
            item.onclick = () => {
                openApp(app);
                setState({ appListOpen: false });
            };
            item.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e.clientX, e.clientY, app, 'start');
            };

            item.ondragstart = (e) => {
                e.dataTransfer.setData('application/start-id:' + app.id, app.id);
                gridOverlay.classList.add('visible');
            };
            item.ondragend = () => {
                gridOverlay.classList.remove('visible');
            };

            appListContent.appendChild(item);
        });
    }

    let nextZIndex = 11;

    function minimizeOtherWindows(activeWin) {
        if (!activeWin) return;
        if (!activeWin._autoMinimized) activeWin._autoMinimized = [];

        document.querySelectorAll('.window').forEach(w => {
            if (w !== activeWin && !w.classList.contains('minimized')) {
                const instanceId = w.id.replace('win-', '');
                activeWin._autoMinimized.push(instanceId);

                w.classList.add('state-animating');
                w.classList.add('minimized');
                setTimeout(() => w.classList.remove('state-animating'), 300);
            }
        });
    }

    function restoreOtherWindows(activeWin) {
        if (!activeWin || !activeWin._autoMinimized) return;

        activeWin._autoMinimized.forEach(id => {
            const otherWin = document.getElementById(`win-${id}`);
            if (otherWin && otherWin.classList.contains('minimized')) {
                otherWin.classList.add('state-animating');
                otherWin.classList.remove('minimized');
                setTimeout(() => otherWin.classList.remove('state-animating'), 300);
            }
        });
        activeWin._autoMinimized = [];
    }

    function openApp(app, customContent = null) {
        clearDesktopSelection();
        const instanceId = `${app.id}-${Date.now()}`;
        const appInstance = { ...app, instanceId };
        addActiveApp(appInstance);
        createWindow(appInstance, customContent);
    }

    function createWindow(appInstance, customContent = null, options = {}) {
        const {
            width = 500,
            height = 400,
            resizable = true,
            maximizable = true,
            centered = false,
            autoHeight = false
        } = options;

        const win = document.createElement('div');
        win.className = 'window opening';
        win.id = `win-${appInstance.instanceId}`;

        win._appId = appInstance.id;
        win._options = options;
        win._customContent = !!customContent;

        let left = 100 + (state.activeApps.length * 20);
        let top = 100 + (state.activeApps.length * 20);

        win.style.width = `${width}px`;

        if (autoHeight) {
            win.style.height = 'auto';
            win.style.minHeight = '0';
        } else {
            win.style.height = `${height}px`;
        }

        win.style.zIndex = nextZIndex++;

        win.style.left = `${left}px`;
        win.style.top = `${top}px`;

        const content = customContent || `
            <p>${t('welcome', state.language)} - ${t(appInstance.label, state.language)}</p>
        `;

        win.innerHTML = `
      <div class="window-header">
        <div class="window-controls">
          <div class="control-btn btn-close"></div>
          <div class="control-btn btn-min"></div>
          <div class="control-btn btn-max" ${!maximizable ? 'style="display:none"' : ''}></div>
        </div>
        <div class="window-title">${t(appInstance.label, state.language)}</div>
      </div>
      <div class="window-content">
        ${content}
      </div>
    `;

        setTimeout(() => win.classList.remove('opening'), 10);

        win.onmousedown = () => {
            focusWindow(appInstance.instanceId);
            if (state.appListOpen) setState({ appListOpen: false });
        };

        win._isMaximized = false;
        win._originalRect = null;

        const closeBtn = win.querySelector('.btn-close');
        closeBtn.onmousedown = (e) => e.stopPropagation();
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            focusWindow(appInstance.instanceId);
            if (state.appListOpen) setState({ appListOpen: false });
            closeWindow(appInstance.instanceId);
        };

        const toggleMaximize = () => {
            if (!maximizable) return;
            win.classList.add('state-animating');
            if (win._isMaximized) {
                restoreWindow(win, win._originalRect);
                win._isMaximized = false;
            } else {
                win._originalRect = {
                    left: win.style.left,
                    top: win.style.top,
                    width: win.style.width,
                    height: win.style.height
                };
                maximizeWindow(win);
                win._isMaximized = true;
            }
            setTimeout(() => win.classList.remove('state-animating'), 300);
        };

        const maxBtn = win.querySelector('.btn-max');
        maxBtn.onmousedown = (e) => e.stopPropagation();
        maxBtn.onclick = (e) => {
            e.stopPropagation();
            focusWindow(appInstance.instanceId);
            if (state.appListOpen) setState({ appListOpen: false });
            toggleMaximize();
        };

        const minBtn = win.querySelector('.btn-min');
        minBtn.onmousedown = (e) => e.stopPropagation();
        minBtn.onclick = (e) => {
            e.stopPropagation();
            focusWindow(appInstance.instanceId);
            if (state.appListOpen) setState({ appListOpen: false });
            minimizeWindow(appInstance.instanceId);
        };

        const header = win.querySelector('.window-header');

        header.ondblclick = (e) => {
            e.stopPropagation();
            if (state.appListOpen) setState({ appListOpen: false });
            toggleMaximize();
        };

        header.onmousedown = (e) => {
            e.preventDefault();
            focusWindow(appInstance.instanceId);
            if (state.startMenuOpen) setState({ startMenuOpen: false });

            let startX = e.clientX;
            let startY = e.clientY;
            let startLeft = win.offsetLeft;
            let startTop = win.offsetTop;
            let dragRestored = false;

            const onMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                if (win._isMaximized && !dragRestored) {
                    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                        restoreWindow(win, win._originalRect);
                        win._isMaximized = false;
                        dragRestored = true;

                        const restoredWidth = win.offsetWidth;
                        const relativeX = startX / window.innerWidth;
                        startLeft = startX - (restoredWidth * relativeX);
                        startTop = startY - 20;
                    } else {
                        return;
                    }
                }

                win.style.left = `${startLeft + (moveEvent.clientX - startX)}px`;
                win.style.top = `${startTop + (moveEvent.clientY - startY)}px`;
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        if (resizable) {
            const resizer = document.createElement('div');
            resizer.className = 'resize-handle';
            win.appendChild(resizer);

            resizer.onmousedown = (e) => {
                if (win._isMaximized) return;
                e.preventDefault();
                e.stopPropagation();
                if (state.appListOpen) setState({ appListOpen: false });
                focusWindow(appInstance.instanceId);

                const startWidth = win.offsetWidth;
                const startHeight = win.offsetHeight;
                const startX = e.clientX;
                const startY = e.clientY;

                const onMouseMove = (moveEvent) => {
                    win.style.width = `${startWidth + (moveEvent.clientX - startX)}px`;
                    win.style.height = `${startHeight + (moveEvent.clientY - startY)}px`;
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };
        }

        appContainer.appendChild(win);

        if (centered) {
            setTimeout(() => {
                const w = win.offsetWidth;
                const h = win.offsetHeight;
                win.style.left = `${(window.innerWidth - w) / 2}px`;
                win.style.top = `${(window.innerHeight - h) / 2}px`;
            }, autoHeight ? 10 : 0);
        }

        focusWindow(appInstance.instanceId);
    }

    function maximizeWindow(win) {
        win.classList.add('maximized');
        maximizedCount++;

        minimizeOtherWindows(win);

        updateTaskbarAutohide();
        focusWindow(win.id.replace('win-', ''));
    }

    function restoreWindow(win, rect) {
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            maximizedCount = Math.max(0, maximizedCount - 1);

            restoreOtherWindows(win);

            updateTaskbarAutohide();
        }
        if (rect) {
            win.style.left = rect.left;
            win.style.top = rect.top;
            win.style.width = rect.width;
            win.style.height = rect.height;
        }
    }

    function minimizeWindow(instanceId, skipRestore = false, shouldNotify = true) {
        const win = document.getElementById(`win-${instanceId}`);
        if (win) {
            if (win.classList.contains('maximized') && !skipRestore) {
                restoreOtherWindows(win);
            }

            win.classList.add('state-animating');
            win.classList.add('minimized');

            if (shouldNotify) {
                setState({ focusedApp: null });
                focusWindow(null);
            }

            setTimeout(() => win.classList.remove('state-animating'), 300);
        }
    }

    function focusWindow(instanceId) {
        if (instanceId) {
            clearDesktopSelection();
            const win = document.getElementById(`win-${instanceId}`);
            if (win && !win.classList.contains('closing')) {
                if (win.classList.contains('minimized')) {
                    win.classList.add('state-animating');
                    win.classList.remove('minimized');
                    setTimeout(() => win.classList.remove('state-animating'), 300);
                }

                if (state.focusedApp !== instanceId) {
                    win.style.zIndex = nextZIndex++;
                    focusApp(instanceId);
                }

                if (win.classList.contains('maximized')) {
                    minimizeOtherWindows(win);
                }
            }
        } else {
            focusApp(null);
        }

        document.querySelectorAll('.window').forEach(w => {
            if (instanceId && w.id === `win-${instanceId}`) {
                w.classList.add('focused');
            } else {
                w.classList.remove('focused');
            }
        });

        updateTaskbarAutohide();
    }

    function closeWindow(instanceId) {
        const win = document.getElementById(`win-${instanceId}`);
        if (win) {
            const wasMaximized = win.classList.contains('maximized');
            if (wasMaximized) {
                restoreOtherWindows(win);
                maximizedCount = Math.max(0, maximizedCount - 1);
            }

            win.classList.add('closing');

            const candidates = Array.from(document.querySelectorAll('.window'))
                .filter(w =>
                    w.id !== `win-${instanceId}` &&
                    !w.classList.contains('minimized') &&
                    !w.classList.contains('closing')
                );

            candidates.sort((a, b) => {
                return parseInt(b.style.zIndex || 0) - parseInt(a.style.zIndex || 0);
            });

            const nextFocusId = candidates.length > 0 ? candidates[0].id.replace('win-', '') : null;

            removeActiveApp(instanceId);

            if (nextFocusId) {
                focusWindow(nextFocusId);
            } else {
                focusWindow(null);
            }

            setTimeout(() => {
                if (win.parentElement) {
                    win.remove();
                    updateTaskbarAutohide();
                }
            }, 250);
        }
    }

    function closeContextMenu() {
        const menu = document.getElementById('custom-context-menu');
        if (menu) {
            menu.style.display = 'none';
        }
        const overMenu = document.getElementById('overflow-menu');
        if (overMenu) {
            overMenu.style.display = 'none';
        }
        updateTaskbarAutohide();
    }

    window.closeOSContextMenu = closeContextMenu;

    function renderTaskbarApps() {
        const taskbarApps = document.getElementById('taskbar-apps');
        const taskbar = document.querySelector('.taskbar');

        const startBtn = taskbar.querySelector('.taskbar-btn');
        const tray = taskbar.querySelector('.taskbar-tray');
        const sideSpace = Math.max(startBtn.offsetWidth, tray.offsetWidth) + 30;
        const availableWidth = taskbar.offsetWidth - (sideSpace * 2);
        const maxIcons = Math.max(1, Math.floor(availableWidth / 54));

        const pinnedIds = state.pinnedTaskbarApps || [];
        const activeGrouped = {};
        state.activeApps.forEach(app => {
            if (!activeGrouped[app.id]) activeGrouped[app.id] = [];
            activeGrouped[app.id].push(app);
        });

        const activeIds = Object.keys(activeGrouped);
        const allAppIds = [...new Set([...pinnedIds, ...activeIds])];

        const appsToRender = allAppIds.slice(0, maxIcons).map(id => {
            const appData = apps.find(a => a.id === id);
            const instances = activeGrouped[id] || [];
            return {
                id,
                icon: appData ? appData.icon : '❓',
                label: appData ? appData.label : id,
                instances,
                isPinned: pinnedIds.includes(id),
                isActive: instances.length > 0,
                isGrouped: instances.length >= 2
            };
        });

        const overflowIds = allAppIds.slice(maxIcons);
        const overflowApps = overflowIds.map(id => {
            const appData = apps.find(a => a.id === id);
            return {
                ...appData,
                instanceId: activeGrouped[id]?.[0]?.instanceId || id
            };
        });

        const oldPositions = new Map();
        Array.from(taskbarApps.children).forEach(icon => {
            const id = icon.getAttribute('data-app-id');
            if (id) oldPositions.set(id, icon.getBoundingClientRect());
        });
        const currentIds = appsToRender.map(a => a.id);
        Array.from(taskbarApps.querySelectorAll('.taskbar-app-icon:not(.removing)')).forEach(icon => {
            const id = icon.getAttribute('data-app-id');
            if (!currentIds.includes(id)) {
                icon.classList.add('removing');
                setTimeout(() => icon.remove(), 300);
            }
        });

        appsToRender.forEach((renderData, index) => {
            let appIcon = taskbarApps.querySelector(`.taskbar-app-icon[data-app-id="${renderData.id}"]`);

            if (!appIcon) {
                appIcon = document.createElement('div');
                appIcon.setAttribute('data-app-id', renderData.id);
                appIcon.setAttribute('draggable', 'true');
                appIcon.className = 'taskbar-app-icon entering';
                requestAnimationFrame(() => {
                    setTimeout(() => appIcon.classList.remove('entering'), 50);
                });
            }

            appIcon.ondragstart = (e) => {
                e.dataTransfer.setData('application/taskbar-id', renderData.id);
                appIcon.classList.add('dragging');
            };
            appIcon.ondragend = () => {
                appIcon.classList.remove('dragging');
                taskbarApps.querySelectorAll('.taskbar-app-icon').forEach(el => el.classList.remove('drag-over'));
            };

            appIcon.ondragenter = (e) => {
                e.preventDefault();
                if (!appIcon.classList.contains('dragging')) appIcon.classList.add('drag-over');
            };
            appIcon.ondragleave = () => appIcon.classList.remove('drag-over');

            if (!appIcon.querySelector('.taskbar-icon-content')) {
                appIcon.innerHTML = `
                    <span class="taskbar-icon-content">${renderData.icon}</span>
                    <div class="group-count"></div>
                `;
            } else {
                appIcon.querySelector('.taskbar-icon-content').innerText = renderData.icon;
            }

            const badge = appIcon.querySelector('.group-count');
            if (renderData.isGrouped) {
                appIcon.classList.add('group');
                badge.innerText = renderData.instances.length;
                badge.classList.add('visible');
            } else {
                appIcon.classList.remove('group');
                badge.classList.remove('visible');
            }


            appIcon.onmouseenter = (e) => {
                const groupMenu = document.getElementById('group-preview-menu');
                const tooltip = document.getElementById('os-tooltip');

                if (renderData.isActive) {
                    if (groupMenu) clearTimeout(groupMenu._closeTimeout);
                    if (tooltip) tooltip.style.display = 'none';
                    showGroupPreview(appIcon, renderData.instances);
                } else {
                    if (groupMenu) groupMenu.style.display = 'none';
                    showTooltip(appIcon, t(renderData.label, state.language));
                }
            };

            appIcon.onmouseleave = () => {
                const menu = document.getElementById('group-preview-menu');
                if (menu && menu.style.display === 'block' && !menu._isLocked) {
                    menu.dispatchEvent(new Event('mouseleave'));
                }
                const tt = document.getElementById('os-tooltip');
                if (tt) tt.style.display = 'none';
            };

            appIcon.onclick = (e) => {
                if (renderData.isActive) {
                    if (renderData.instances.length === 1) {
                        const inst = renderData.instances[0];
                        if (state.focusedApp === inst.instanceId) {
                            minimizeWindow(inst.instanceId);
                        } else {
                            focusWindow(inst.instanceId);
                        }
                        const groupMenu = document.getElementById('group-preview-menu');
                        if (groupMenu) groupMenu.style.display = 'none';
                        const tt = document.getElementById('os-tooltip');
                        if (tt) tt.style.display = 'none';
                    } else {
                        showGroupPreview(appIcon, renderData.instances, true);
                    }
                } else {
                    const appData = apps.find(a => a.id === renderData.id);
                    if (appData) openApp(appData);
                }
            };

            appIcon.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e.clientX, e.clientY, renderData, 'app-taskbar');
            };

            const isFocused = renderData.instances.some(inst => inst.instanceId === state.focusedApp);
            appIcon.classList.toggle('active', isFocused);
            appIcon.classList.toggle('running', renderData.isActive);
            appIcon.classList.remove('removing');

            const nonRemovingIcons = Array.from(taskbarApps.children).filter(c => !c.classList.contains('removing') && !c.classList.contains('taskbar-overflow-btn'));
            if (nonRemovingIcons[index] !== appIcon) {
                taskbarApps.insertBefore(appIcon, nonRemovingIcons[index] || null);
            }
        });

        requestAnimationFrame(() => {
            Array.from(taskbarApps.children).forEach(icon => {
                if (icon.classList.contains('entering') || icon.classList.contains('removing')) return;

                const id = icon.getAttribute('data-app-id');
                const oldRect = oldPositions.get(id);
                if (oldRect) {
                    const newRect = icon.getBoundingClientRect();
                    const deltaX = oldRect.left - newRect.left;
                    if (deltaX !== 0) {
                        icon.style.transition = 'none';
                        icon.style.transform = `translateX(${deltaX}px)`;
                        icon.offsetHeight;

                        icon.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                        icon.style.transform = '';

                        setTimeout(() => {
                            if (icon.parentElement) icon.style.transition = '';
                        }, 350);
                    }
                }
            });
        });

        taskbarApps.ondragover = (e) => e.preventDefault();
        taskbarApps.ondrop = (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('application/taskbar-id');
            if (!id) return;

            const target = e.target.closest('.taskbar-app-icon');
            const targetId = target ? target.getAttribute('data-app-id') : null;

            const pinnedCurrent = [...state.pinnedTaskbarApps];
            const pinnedFromIdx = pinnedCurrent.indexOf(id);

            if (pinnedFromIdx !== -1) {
                if (targetId && targetId !== id) {
                    const pinnedToIdx = pinnedCurrent.indexOf(targetId);
                    if (pinnedToIdx !== -1) {
                        pinnedCurrent.splice(pinnedFromIdx, 1);
                        pinnedCurrent.splice(pinnedToIdx, 0, id);
                        setState({ pinnedTaskbarApps: pinnedCurrent });
                    }
                } else if (!target) {
                    pinnedCurrent.splice(pinnedFromIdx, 1);
                    pinnedCurrent.push(id);
                    setState({ pinnedTaskbarApps: pinnedCurrent });
                }
                return;
            }

            const activeCurrent = [...state.activeApps];
            const movingInstances = activeCurrent.filter(a => a.id === id);

            if (movingInstances.length === 0) return;

            const remaining = activeCurrent.filter(a => a.id !== id);

            if (targetId && targetId !== id) {
                const targetIdx = remaining.findIndex(a => a.id === targetId);

                if (targetIdx !== -1) {
                    remaining.splice(targetIdx, 0, ...movingInstances);
                } else {
                    if (state.pinnedTaskbarApps.includes(targetId)) {
                        remaining.unshift(...movingInstances);
                    } else {
                        remaining.push(...movingInstances);
                    }
                }
            } else if (!target) {
                remaining.push(...movingInstances);
            }

            setState({ activeApps: remaining });
        };

        let overflowBtn = taskbarApps.querySelector('.taskbar-overflow-btn');
        if (overflowApps.length > 0) {
            if (!overflowBtn) {
                overflowBtn = document.createElement('div');
                overflowBtn.className = 'taskbar-overflow-btn entering';
                setTimeout(() => overflowBtn.classList.remove('entering'), 50);
            }
            taskbarApps.appendChild(overflowBtn);

            overflowBtn.innerHTML = `+${overflowApps.length}`;
            overflowBtn.onclick = (e) => showOverflowMenu(e.clientX, e.clientY, overflowApps);
        } else if (overflowBtn) {
            overflowBtn.classList.add('removing');
            setTimeout(() => overflowBtn.remove(), 300);
        }
    }

    const taskbarContainer = document.querySelector('.taskbar');
    taskbarContainer.oncontextmenu = (e) => {
        if ((e.target.classList.contains('taskbar') || e.target.id === 'taskbar-apps') && state.activeApps.length > 0) {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, null, 'taskbar-bg');
        }
    };

    function showOverflowMenu(x, y, appsList) {
        let menu = document.getElementById('overflow-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'overflow-menu';
            menu.className = 'context-menu glass';
            document.body.appendChild(menu);
        }

        const itemsWithInstances = appsList.map(app => {
            const instances = state.activeApps.filter(a => a.id === app.id);
            return {
                ...app,
                instances: instances.length > 0 ? instances : [app]
            };
        });

        menu.innerHTML = itemsWithInstances.map(item => `
            <div class="menu-item overflow-item" data-app-id="${item.id}" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px; pointer-events: none;">
                    <span style="display: flex; align-items: center; justify-content: center; width: 20px;">${item.icon}</span> 
                    <span>${t(item.label, state.language)}</span>
                </div>
                ${item.instances.length > 1 ? `<span style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 2px 6px; font-size: 0.7rem;">${Number(item.instances.length).toLocaleString()}</span>` : ''}
            </div>
        `).join('');

        menu.style.display = 'block';
        const menuWidth = 220;
        const menuHeight = menu.offsetHeight;
        menu.style.left = `${Math.min(x, window.innerWidth - menuWidth - 20)}px`;
        menu.style.top = `${y - menuHeight - 15}px`;

        menu.querySelectorAll('.overflow-item').forEach(el => {
            const appId = el.getAttribute('data-app-id');
            const itemData = itemsWithInstances.find(i => i.id === appId);

            el.onclick = (e) => {
                e.stopPropagation();
                if (itemData.instances.length === 1) {
                    const inst = itemData.instances[0];
                    if (state.focusedApp === inst.instanceId) {
                        minimizeWindow(inst.instanceId);
                    } else {
                        focusWindow(inst.instanceId);
                    }
                } else {
                    const lastActive = itemData.instances[itemData.instances.length - 1];
                    focusWindow(lastActive.instanceId);
                }
                menu.style.display = 'none';

                const groupMenu = document.getElementById('group-preview-menu');
                if (groupMenu) groupMenu.style.display = 'none';
            };

            el.onmouseenter = () => {
                if (itemData.instances.length > 0) {
                    showGroupPreview(el, itemData.instances);
                }
            };

            el.onmouseleave = () => {
                const groupMenu = document.getElementById('group-preview-menu');
                if (groupMenu && groupMenu.style.display === 'block' && !groupMenu._isLocked) {
                    groupMenu.dispatchEvent(new Event('mouseleave'));
                }
            };

            el.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e.clientX, e.clientY, { id: appId, instances: itemData.instances }, 'app-taskbar');
            };
        });

        const closeOverflow = (e) => {
            if (e.target.closest('#overflow-menu') || e.target.closest('.taskbar-overflow-btn')) return;
            menu.style.display = 'none';
            document.removeEventListener('mousedown', closeOverflow);
        };
        setTimeout(() => document.addEventListener('mousedown', closeOverflow), 10);
    }

    function showTooltip(targetEl, text) {
        let tt = document.getElementById('os-tooltip');
        if (!tt) {
            tt = document.createElement('div');
            tt.id = 'os-tooltip';
            tt.className = 'app-tooltip';
            document.body.appendChild(tt);
        }
        tt.innerText = text;
        tt.style.display = 'block';

        const rect = targetEl.getBoundingClientRect();
        const ttWidth = tt.offsetWidth;
        const ttHeight = tt.offsetHeight;

        let left = rect.left + (rect.width / 2) - (ttWidth / 2);
        left = Math.max(5, Math.min(left, window.innerWidth - ttWidth - 5));

        const isTaskbar = targetEl.closest('.taskbar');
        if (isTaskbar) {
            tt.style.left = `${left}px`;
            tt.style.top = `${rect.top - ttHeight - 10}px`;
        } else {
            tt.style.left = `${rect.right + 10}px`;
            tt.style.top = `${rect.top + (rect.height / 2) - (ttHeight / 2)}px`;

            if (parseInt(tt.style.left) + ttWidth > window.innerWidth) {
                tt.style.left = `${rect.left - ttWidth - 10}px`;
            }
        }
    }

    function showGroupPreview(targetEl, instances, lock = false) {
        let menu = document.getElementById('group-preview-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'group-preview-menu';
            menu.className = 'context-menu glass group-preview';
            document.body.appendChild(menu);
        }

        menu._isLocked = lock;

        const baseApp = apps.find(a => a.id === instances[0].id);
        const headerLabel = baseApp ? t(baseApp.label, state.language) : instances[0].label;

        const taskbar = document.querySelector('.taskbar');
        const taskbarWidth = taskbar ? taskbar.offsetWidth : window.innerWidth;
        menu.style.maxWidth = `${taskbarWidth - 20}px`;

        menu.innerHTML = `
            <div class="preview-header">${headerLabel}${instances.length > 1 ? ` (${instances.length})` : ''}</div>
            <div class="preview-list-horizontal" style="overflow-x: auto; display: flex; gap: 10px; padding-bottom: 5px;">
                ${instances.map(inst => `
                    <div class="menu-item group-item-horizontal" data-id="${inst.instanceId}" style="flex-shrink: 0;">
                        <div class="group-item-thumb">
                            <div class="thumb-header"><span class="thumb-icon">${inst.icon}</span></div>
                            <div class="thumb-body" id="thumb-body-${inst.instanceId}"></div>
                        </div>
                        <div class="group-item-text">
                            <span class="group-item-title">${t(inst.label, state.language)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const scrollContainer = menu.querySelector('.preview-list-horizontal');
        if (scrollContainer) {
            scrollContainer.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    scrollContainer.scrollLeft += e.deltaY;
                }
            });
        }

        instances.forEach(inst => {
            const winContent = document.querySelector(`#win-${inst.instanceId} .window-content`);
            const thumbBody = menu.querySelector(`#thumb-body-${inst.instanceId}`);
            if (winContent && thumbBody) {
                const clone = winContent.cloneNode(true);
                clone.style.width = winContent.offsetWidth + 'px';
                clone.style.height = winContent.offsetHeight + 'px';
                clone.style.overflow = 'hidden';
                clone.style.transform = `scale(${120 / winContent.offsetWidth})`;
                clone.style.transformOrigin = 'top left';
                clone.style.pointerEvents = 'none';
                clone.style.position = 'absolute';
                thumbBody.appendChild(clone);
            }
        });

        menu.style.display = 'block';
        const rect = targetEl.getBoundingClientRect();
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;

        let left, top;

        const isOverflow = targetEl.closest('#overflow-menu');

        if (isOverflow) {
            left = rect.left - menuWidth - 2;

            top = rect.bottom - menuHeight;

            if (top + menuHeight > window.innerHeight) {
                top = window.innerHeight - menuHeight - 10;
            }
            if (top < 10) top = 10;
        } else {
            top = rect.top - menuHeight - 15;
            left = rect.left + (rect.width / 2) - (menuWidth / 2);

            const taskbar = document.querySelector('.taskbar');
            if (taskbar) {
                const taskbarRect = taskbar.getBoundingClientRect();
                const minLeft = taskbarRect.left + 5;
                const maxLeft = (taskbarRect.right - menuWidth) - 5;

                if (menuWidth >= taskbarRect.width) left = taskbarRect.left;
                else left = Math.max(minLeft, Math.min(left, maxLeft));
            }
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        if (menu._closeTimeout) clearTimeout(menu._closeTimeout);

        const handleClose = (e) => {
            if (menu._isLocked && e?.type === 'mouseleave') return;

            menu._closeTimeout = setTimeout(() => {
                menu.style.display = 'none';
                menu._isLocked = false;
                document.removeEventListener('click', handleClose);
                const ctx = document.getElementById('preview-ctx-menu');
                if (ctx) ctx.style.display = 'none';
                updateTaskbarAutohide();
            }, menu._isLocked ? 0 : 250);
        };

        menu.onmouseenter = () => clearTimeout(menu._closeTimeout);
        menu.onmouseleave = handleClose;

        menu.querySelectorAll('.group-item-horizontal').forEach(item => {
            const id = item.getAttribute('data-id');
            const win = document.getElementById(`win-${id}`);

            item.onclick = (e) => {
                e.stopPropagation();
                focusWindow(id);
                menu.style.display = 'none';
                menu._isLocked = false;
                document.body.classList.remove('peek-mode');
                if (win) win.classList.remove('peek-focus');
            };

            item.onmouseenter = () => {
                document.body.classList.add('peek-mode');
                if (win) win.classList.add('peek-focus');
            };

            item.onmouseleave = () => {
                document.body.classList.remove('peek-mode');
                if (win) win.classList.remove('peek-focus');
            };

            item.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (state.startMenuOpen) setState({ startMenuOpen: false });

                let ctxMenu = document.getElementById('preview-ctx-menu');
                if (!ctxMenu) {
                    ctxMenu = document.createElement('div');
                    ctxMenu.id = 'preview-ctx-menu';
                    ctxMenu.className = 'context-menu glass';
                    document.body.appendChild(ctxMenu);
                }

                ctxMenu.innerHTML = `<div class="menu-item">${t('controls.closeWindow', state.language)}</div>`;
                ctxMenu.style.display = 'block';
                ctxMenu.style.left = `${e.clientX}px`;
                ctxMenu.style.top = `${e.clientY}px`;

                ctxMenu.onmouseenter = () => clearTimeout(menu._closeTimeout);
                ctxMenu.onmouseleave = handleClose;

                ctxMenu.onclick = (e) => {
                    e.stopPropagation();
                    closeWindow(id);
                    ctxMenu.style.display = 'none';
                    menu.style.display = 'none';
                    document.body.classList.remove('peek-mode');
                };

                const closeCtx = (e) => {
                    if (e.target.closest('#preview-ctx-menu')) return;
                    ctxMenu.style.display = 'none';
                    document.removeEventListener('mousedown', closeCtx);
                    if (!e.target.closest('#group-preview-menu')) {
                        handleClose();
                    }
                };
                setTimeout(() => document.addEventListener('mousedown', closeCtx), 10);
            };
        });

        if (lock) {
            setTimeout(() => document.addEventListener('click', handleClose), 10);
        }
    }

    function closeOSContextMenu() {
        const menu = document.getElementById('custom-context-menu');
        if (menu) {
            menu.style.display = 'none';
            contextMenuOpen = false;
            updateTaskbarAutohide();
        }
    }

    function showContextMenu(x, y, data, source = 'background') {
        if (state.startMenuOpen && source !== 'start') {
            setState({ startMenuOpen: false });
        }

        let menu = document.getElementById('custom-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'custom-context-menu';
            menu.className = 'context-menu glass';
            document.body.appendChild(menu);
        }

        if (source === 'taskbar-bg') {
            const allMinimized = state.activeApps.length > 0 &&
                state.activeApps.every(inst => {
                    const win = document.getElementById(`win-${inst.instanceId}`);
                    return win && win.classList.contains('minimized');
                });

            const labelKey = allMinimized ? 'controls.showAllWindows' : 'controls.minimizeAllWindows';

            menu.innerHTML = `
                <div class="menu-item" id="min-all-btn">${t(labelKey, state.language)}</div>
                <div class="menu-item" id="close-all-btn">${t('controls.closeAllWindows', state.language)}</div>
            `;
            document.getElementById('min-all-btn').onclick = () => {
                if (allMinimized) {
                    showAllWindows();
                } else {
                    minimizeAllWindows();
                }
                menu.style.display = 'none';
            };
            document.getElementById('close-all-btn').onclick = () => {
                closeAllWindows();
                menu.style.display = 'none';
            };
        }
        else if (source === 'desktop' || source === 'start' || source === 'app-taskbar') {
            const app = (typeof data === 'string')
                ? apps.find(a => a.id === data || a.id === state.activeApps.find(active => active.instanceId === data)?.id)
                : (data.id ? apps.find(a => a.id === data.id) : data);

            if (!app) return;

            const appLabel = t(app.label, state.language);
            const isPinnedTaskbar = state.pinnedTaskbarApps.includes(app.id);
            const isPinnedDesktop = state.pinnedDesktopApps.some(a => a.id === app.id);

            let items = '';

            const selectionCount = state.selectedDesktopApps ? state.selectedDesktopApps.length : 0;

            if (source === 'desktop' && selectionCount > 1) {
            } else {
                items += `<div class="menu-item" id="ctx-open">${t('controls.openApp', state.language).replace('{name}', appLabel)}</div>`;
            }

            if (source === 'start') {
                if (!isPinnedDesktop) {
                    items += `<div class="menu-item" id="ctx-pin-desktop">${t('controls.pinToDesktop', state.language)}</div>`;
                }
                if (!isPinnedTaskbar) {
                    items += `<div class="menu-item" id="ctx-pin-taskbar">${t('controls.pinToTaskbar', state.language)}</div>`;
                }
            } else if (source === 'desktop') {
                if (selectionCount > 1) {
                    items += `
                        <div class="menu-item" id="ctx-open-selected">${t('controls.openSelected', state.language)}</div>
                        <div class="menu-item" id="ctx-delete-selected">${t('controls.deleteSelected', state.language).replace('{count}', selectionCount)}</div>
                    `;
                } else {
                    if (!isPinnedTaskbar) {
                        items += `<div class="menu-item" id="ctx-pin-taskbar">${t('controls.pinToTaskbar', state.language)}</div>`;
                    }
                    items += `
                        <div class="menu-item" id="ctx-unpin-desktop">${t('controls.unpinFromDesktop', state.language)}</div>
                    `;
                }
            } else if (source === 'app-taskbar') {
                items += `
                    <div class="menu-item" id="ctx-pin-taskbar">${t(isPinnedTaskbar ? 'controls.unpinFromTaskbar' : 'controls.pinToTaskbar', state.language)}</div>
                `;
                const instances = state.activeApps.filter(a => a.id === app.id);
                if (instances.length > 0) {
                    const label = instances.length > 1 ? 'controls.closeAllWindows' : 'controls.closeWindow';
                    items += `<div class="menu-item" id="ctx-close-app">${t(label, state.language)}</div>`;
                }
            }

            menu.innerHTML = items;

            const bind = (id, fn) => {
                const el = document.getElementById(id);
                if (el) {
                    el.onclick = (e) => {
                        e.stopPropagation();
                        fn();
                    };
                }
            };

            bind('ctx-open', () => {
                openApp(app);
                menu.style.display = 'none';
                if (state.appListOpen) setState({ appListOpen: false });
            });
            bind('ctx-pin-desktop', () => {
                const style = getComputedStyle(document.querySelector('.desktop-container'));
                const cellW = parseInt(style.getPropertyValue('--desktop-icon-width')) || 100;
                const cellGap = parseInt(style.getPropertyValue('--desktop-icon-gap')) || 10;
                const padL = parseInt(style.paddingLeft) || 20;
                const availW = document.querySelector('.desktop-container').getBoundingClientRect().width - (padL * 2);
                const maxCols = Math.max(1, Math.floor((availW + cellGap) / (cellW + cellGap)));

                togglePinDesktop(app.id, maxCols);
                menu.style.display = 'none';
            });

            bind('ctx-pin-taskbar', () => {
                togglePinTaskbar(app.id);
                menu.style.display = 'none';
            });

            bind('ctx-unpin-desktop', () => {
                confirmDeleteDesktopIcon(app);
                menu.style.display = 'none';
            });
            bind('ctx-open-selected', () => {
                state.selectedDesktopApps.forEach(id => {
                    const a = apps.find(x => x.id === id);
                    if (a) openApp(a);
                });
                menu.style.display = 'none';
            });
            bind('ctx-delete-selected', () => {
                confirmDeleteMultiple();
                menu.style.display = 'none';
            });
            bind('ctx-close-app', () => {
                const instances = state.activeApps.filter(a => a.id === app.id);
                instances.forEach(inst => closeWindow(inst.instanceId));
                menu.style.display = 'none';
            });
        }

        menu.style.display = 'block';
        const menuWidth = 180;
        const menuHeight = menu.offsetHeight;

        let finalX = x;
        let finalY = y;
        if (x + menuWidth > window.innerWidth) finalX = x - menuWidth;
        if (y + menuHeight > window.innerHeight) finalY = y - menuHeight;

        menu.style.left = `${finalX}px`;
        menu.style.top = `${finalY}px`;
        contextMenuOpen = true;
        updateTaskbarAutohide();

        const closeCMenu = (e) => {
            if (e.target.closest('#custom-context-menu')) return;
            menu.style.display = 'none';
            contextMenuOpen = false;
            updateTaskbarAutohide();
            document.removeEventListener('mousedown', closeCMenu);
        };
        setTimeout(() => document.addEventListener('mousedown', closeCMenu), 10);
    }

    function confirmDeleteDesktopIcon(app) {
        const existingDialog = Array.from(document.querySelectorAll('.window')).find(w => w._isConfirmDelete && w._dialogTargetAppId === app.id);
        if (existingDialog) {
            focusWindow(existingDialog.id.replace('win-', ''));
            return;
        }

        const settingsApp = apps.find(a => a.id === 'settings');
        const appLabel = t(app.label, state.language);
        const title = t('controls.confirmDeleteTitle', state.language);
        const message = t('controls.confirmDeleteMsg', state.language).replace('{name}', appLabel);

        createConfirmDialog(title, message, () => {
            togglePinDesktop(app.id);
            setState({ selectedDesktopApps: [] });
        }, () => {
            setState({ selectedDesktopApps: [app.id] });
            activateDesktop();
        }, { type: 'single', targetId: app.id });
    }

    function confirmDeleteMultiple() {
        const pinned = state.pinnedDesktopApps || [];
        const rawSelection = state.selectedDesktopApps || [];

        const validSelection = [...new Set(rawSelection)].filter(id =>
            pinned.some(p => p.id === id)
        );

        const count = validSelection.length;
        if (count === 0) return;

        const itemsToDelete = validSelection;

        if (count === 1) {
            const app = apps.find(a => a.id === itemsToDelete[0]);
            if (app) confirmDeleteDesktopIcon(app);
            return;
        }

        const title = t('controls.confirmDeleteMultipleTitle', state.language);
        const message = t('controls.confirmDeleteMultipleMsg', state.language).replace('{count}', count);

        createConfirmDialog(title, message, () => {
            itemsToDelete.forEach(id => togglePinDesktop(id));
            setState({ selectedDesktopApps: [] });
        }, () => {
            setState({ selectedDesktopApps: itemsToDelete });
            activateDesktop();
        }, { type: 'multiple', count: count });
    }

    function createConfirmDialog(title, message, onConfirm, onCancel, contextData = {}) {
        const settingsApp = apps.find(a => a.id === 'settings');
        const instanceId = `confirm-${Date.now()}`;

        const appInstance = { ...settingsApp, instanceId, label: 'controls.confirmDeleteTitle' };

        const content = `
            <div class="confirm-dialog">
                <p id="confirm-delete-msg" style="margin-bottom: 25px; line-height: 1.5;">${message}</p>
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="footer-btn secondary" id="btn-confirm-cancel">${t('controls.cancel', state.language)}</button>
                    <button class="footer-btn danger" id="btn-confirm-delete">${t('controls.delete', state.language)}</button>
                </div>
            </div>
        `;

        addActiveApp(appInstance);
        createWindow(appInstance, content, {
            width: 420,
            resizable: false,
            maximizable: false,
            centered: true,
            autoHeight: true
        });

        const win = document.getElementById(`win-${instanceId}`);
        win._isConfirmDelete = true;
        win._dialogContext = contextData;
        win._dialogTargetAppId = contextData.targetId;

        win.querySelector('#btn-confirm-cancel').onclick = () => {
            if (onCancel) onCancel();
            closeWindow(instanceId);
        };
        win.querySelector('#btn-confirm-delete').onclick = () => {
            onConfirm();
            closeWindow(instanceId);
        };
    }

    function closeAllWindows() {
        const appsToClose = [...state.activeApps];
        appsToClose.forEach(app => closeWindow(app.instanceId));
    }

    function minimizeAllWindows() {
        const instances = [...state.activeApps];
        instances.forEach(app => {
            const win = document.getElementById(`win-${app.instanceId}`);
            if (win && !win.classList.contains('minimized')) {
                minimizeWindow(app.instanceId, true, false);
            }
        });
        setState({ focusedApp: null });
        focusWindow(null);
    }

    function showAllWindows() {
        const instances = [...state.activeApps];
        instances.forEach(app => {
            const win = document.getElementById(`win-${app.instanceId}`);
            if (win && win.classList.contains('minimized')) {
                focusWindow(app.instanceId);
            }
        });
    }

    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString(state.language === 'id' ? 'id-ID' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        clock.innerText = timeStr;
    }

    const clockInterval = setInterval(updateClock, 1000);
    updateClock();

    window._destroyDesktop = () => {
        clearInterval(clockInterval);
    };

    let lastPowerStatus = state.powerStatus;

    return function updateUI(s) {
        if (s.powerStatus === 'on' && lastPowerStatus !== 'on') {
            setTimeout(() => {
                reflowIcons();
                renderIcons();
            }, 50);
        }
        lastPowerStatus = s.powerStatus;

        if (s.appListOpen) {
            appListMenu.classList.add('active');
            appListBtn.classList.add('active');
        } else {
            appListMenu.classList.remove('active');
            appListBtn.classList.remove('active');
        }

        closeOSContextMenu();

        langBtn.innerText = s.language.toUpperCase();
        renderIcons();
        renderAppListItems();
        renderTaskbarApps();
        updateClock();
        updateTaskbarAutohide();

        s.activeApps.forEach(app => {
            const win = document.getElementById(`win-${app.instanceId}`);
            if (!win) return;

            if (win.classList.contains('minimized')) return;

            const titleEl = win.querySelector('.window-title');
            if (titleEl) titleEl.innerText = t(app.label, s.language);

            if (!win._customContent) {
                const contentEl = win.querySelector('.window-content p');
                if (contentEl) contentEl.innerText = `${t('welcome', s.language)} - ${t(app.label, s.language)}`;
            } else if (win._isConfirmDelete) {
                const msgEl = win.querySelector('#confirm-delete-msg');
                const cancelBtn = win.querySelector('#btn-confirm-cancel');
                const deleteBtn = win.querySelector('#btn-confirm-delete');

                if (msgEl) {
                    if (win._dialogContext && win._dialogContext.type === 'multiple') {
                        msgEl.innerText = t('controls.confirmDeleteMultipleMsg', s.language).replace('{count}', win._dialogContext.count);
                    } else {
                        const targetId = win._dialogContext ? win._dialogContext.targetId : win._dialogTargetAppId;
                        const targetApp = apps.find(a => a.id === targetId);
                        const label = targetApp ? t(targetApp.label, s.language) : targetId;
                        msgEl.innerText = t('controls.confirmDeleteMsg', s.language).replace('{name}', label);
                    }
                }
                if (cancelBtn) cancelBtn.innerText = t('controls.cancel', s.language);
                if (deleteBtn) deleteBtn.innerText = t('controls.delete', s.language);
            }
        });

        shutdownBtn.querySelector('span').innerText = t('shutdown', s.language);
    };
}
