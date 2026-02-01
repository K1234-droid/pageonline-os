import { state, setState, toggleLanguage, addActiveApp, removeActiveApp } from './state.js';
import { t } from './i18n.js';
import { version } from '../../package.json';
import { initCropper } from './cropper.js';

export function initSettings(win) {
    const instanceId = win.id.replace('win-', '');
    const content = win.querySelector('.window-content');

    let activeSection = 'home';
    let renderedSection = '';

    const icons = {
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>',
        appearance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    };

    const searchableItems = [
        { id: 'username', label: 'settings.profile.username', section: 'profile', selector: '#username-input', icon: icons.profile },
        { id: 'avatar', label: 'settings.profile.editAvatar', section: 'profile', selector: '.btn-edit-avatar', icon: icons.profile },
        { id: 'language', label: 'settings.general.language', section: 'general', selector: '.settings-group:nth-of-type(1)', icon: icons.general },
        { id: 'clock', label: 'settings.general.clockFormat', section: 'general', selector: '.settings-group:nth-of-type(2)', icon: icons.general },
        { id: 'date', label: 'settings.general.dateDisplay', section: 'general', selector: '.settings-group:nth-of-type(3)', icon: icons.general },
        { id: 'wallpaper', label: 'settings.appearance.wallpaper', section: 'appearance', selector: '.wallpaper-preview-container', icon: icons.appearance },
        { id: 'fullscreen', label: 'settings.system.fullscreen.label', section: 'system', selector: '.switch-container', icon: icons.system },
        { id: 'about', label: 'settings.about.sectionTitle', section: 'about', selector: '.about-content', icon: icons.about }
    ];

    function compressImage(base64Str, maxWidth = 1920, maxHeight = 1080, quality = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        });
    }

    function render(skipAnimation = false) {
        const settingsContent = content.querySelector('.settings-content');
        const settingsSidebar = content.querySelector('.settings-sidebar');

        const shouldPreserveScroll = settingsContent && activeSection === renderedSection;
        const scrollTop = shouldPreserveScroll ? settingsContent.scrollTop : 0;
        const sidebarScrollTop = settingsSidebar ? settingsSidebar.scrollTop : 0;
        const sidebarScrollLeft = settingsSidebar ? settingsSidebar.scrollLeft : 0;

        content.innerHTML = `
            <div class="settings-layout">
                <div class="settings-sidebar">
                    <div class="settings-sidebar-items">
                        ${renderSidebarItem('home', t('settings.menu.home', state.language), icons.home)}
                        ${renderSidebarItem('profile', t('settings.menu.profile', state.language), icons.profile)}
                        ${renderSidebarItem('general', t('settings.menu.general', state.language), icons.general)}
                        ${renderSidebarItem('appearance', t('settings.menu.appearance', state.language), icons.appearance)}
                        ${renderSidebarItem('system', t('settings.menu.system', state.language), icons.system)}
                        ${renderSidebarItem('about', t('settings.menu.about', state.language), icons.about)}
                    </div>
                </div>
                <div class="settings-content app-scrollbar">
                    ${renderSection(skipAnimation)}
                </div>
            </div>
        `;
        setupEvents();

        const newSettingsContent = content.querySelector('.settings-content');
        const newSettingsSidebar = content.querySelector('.settings-sidebar');
        if (newSettingsContent) {
            newSettingsContent.scrollTop = scrollTop;
        }
        if (newSettingsSidebar) {
            newSettingsSidebar.scrollTop = sidebarScrollTop;
            newSettingsSidebar.scrollLeft = sidebarScrollLeft;
        }

        renderedSection = activeSection;
    }

    function renderSidebarItem(id, label, icon) {
        return `
            <div class="settings-nav-item ${activeSection === id ? 'active' : ''}" data-section="${id}">
                <span class="nav-icon">${icon}</span>
                <span class="nav-label">${label}</span>
            </div>
        `;
    }

    function renderSection(skipAnimation = false) {
        const animClass = skipAnimation ? 'no-anim' : '';
        switch (activeSection) {
            case 'home':
                return `
                    <div class="settings-section ${animClass}">
                        <h1 class="section-title">${t('settings.home.welcome', state.language).replace('{name}', state.username)}</h1>
                        <p class="section-subtitle">${t('settings.home.subtitle', state.language)}</p>
                        
                        <div class="settings-search-container">
                            <div class="settings-search-bar">
                                <span class="search-icon">${icons.search}</span>
                                <label for="settings-search" class="sr-only">${t('settings.searchPlaceholder', state.language)}</label>
                                <input type="text" id="settings-search" name="settings_search_${Math.random().toString(36).substring(7)}" placeholder="${t('settings.searchPlaceholder', state.language)}" class="settings-search-input" autocomplete="off" spellcheck="false" maxlength="50">
                            </div>
                            <div id="search-results-dropdown" class="settings-search-results"></div>
                        </div>

                        <div class="settings-grid">
                            <div class="grid-item" data-section="profile">
                                <span class="grid-icon">${icons.profile}</span>
                                <span class="grid-label">${t('settings.menu.profile', state.language)}</span>
                            </div>
                            <div class="grid-item" data-section="appearance">
                                <span class="grid-icon">${icons.appearance}</span>
                                <span class="grid-label">${t('settings.menu.appearance', state.language)}</span>
                            </div>
                            <div class="grid-item" data-section="general">
                                <span class="grid-icon">${icons.general}</span>
                                <span class="grid-label">${t('settings.menu.general', state.language)}</span>
                            </div>
                            <div class="grid-item" data-section="system">
                                <span class="grid-icon">${icons.system}</span>
                                <span class="grid-label">${t('settings.menu.system', state.language)}</span>
                            </div>
                        </div>
                    </div>
                `;
            case 'profile':
                return `
                    <div class="settings-section ${animClass}">
                        <h2 class="section-title">${t('settings.profile.sectionTitle', state.language)}</h2>
                        <div class="profile-editor">
                            <div class="profile-avatar-container">
                                <div class="profile-avatar ${state.profilePicture ? 'has-custom' : ''}">
                                    ${state.profilePicture ? `
                                        <img src="${state.profilePicture}" alt="Avatar">
                                        <button class="btn-delete-avatar">
                                            ${icons.close}
                                        </button>
                                    ` : state.username.charAt(0).toUpperCase()}
                                </div>
                                <button class="footer-btn primary btn-edit-avatar">${t('settings.profile.editAvatar', state.language)}</button>
                                <label for="avatar-input" class="sr-only">${t('settings.profile.editAvatar', state.language)}</label>
                                <input type="file" id="avatar-input" name="avatar_file_${Math.random().toString(36).substring(7)}" style="display:none" accept="image/*" autocomplete="off">
                            </div>
                            <div class="profile-form">
                                <label for="username-input">${t('settings.profile.username', state.language)}</label>
                                <input type="text" id="username-input" name="username_${Math.random().toString(36).substring(7)}" value="${state.username}" class="settings-input" autocomplete="off" spellcheck="false" maxlength="20">
                                <button class="footer-btn primary btn-save-profile" style="margin-top: 20px;">${t('settings.profile.save', state.language)}</button>
                            </div>
                        </div>
                    </div>
                `;
            case 'general':
                return `
                    <div class="settings-section ${animClass}">
                        <h2 class="section-title">${t('settings.general.sectionTitle', state.language)}</h2>
                        <div class="settings-group">
                            <label>${t('settings.general.language', state.language)}</label>
                            <div class="settings-radio-group">
                                <div class="radio-item ${state.language === 'id' ? 'active' : ''}" data-lang="id">
                                    <span class="radio-circle"></span>
                                    <span>${t('settings.general.langId', state.language)}</span>
                                </div>
                                <div class="radio-item ${state.language === 'en' ? 'active' : ''}" data-lang="en">
                                    <span class="radio-circle"></span>
                                    <span>${t('settings.general.langEn', state.language)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <label>${t('settings.general.clockFormat', state.language)}</label>
                            <div class="settings-radio-group">
                                <div class="radio-item ${state.clockFormat === '12h' ? 'active' : ''}" data-clock="12h">
                                    <span class="radio-circle"></span>
                                    <span>${t('settings.general.time12', state.language)}</span>
                                </div>
                                <div class="radio-item ${state.clockFormat === '24h' ? 'active' : ''}" data-clock="24h">
                                    <span class="radio-circle"></span>
                                    <span>${t('settings.general.time24', state.language)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <label>${t('settings.general.dateDisplay', state.language)}</label>
                            <div class="settings-radio-group">
                                <div class="radio-item ${state.dateDisplay === 'time-only' ? 'active' : ''}" data-date="time-only">
                                    <span class="radio-circle"></span>
                                    <span>${t('settings.general.timeOnly', state.language)}</span>
                                </div>
                                <div class="radio-item ${state.dateDisplay === 'dmy' ? 'active' : ''}" data-date="dmy">
                                    <span class="radio-circle"></span>
                                    <span>${t('settings.general.timeDMY', state.language)}</span>
                                </div>
                                <div class="radio-item ${state.dateDisplay === 'mdy' ? 'active' : ''}" data-date="mdy">
                                    <span class="radio-circle"></span>
                                    <span>${t('settings.general.timeMDY', state.language)}</span>
                                </div>
                                <div class="radio-item ${state.dateDisplay === 'ymd' ? 'active' : ''}" data-date="ymd">
                                    <span class="radio-circle"></span>
                                    <span>${t('settings.general.timeYMD', state.language)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 'appearance':
                return `
                    <div class="settings-section ${animClass}">
                        <h2 class="section-title">${t('settings.appearance.sectionTitle', state.language)}</h2>
                        
                        <div class="settings-group">
                            <label>${t('settings.appearance.wallpaper', state.language)}</label>
                            <div class="wallpaper-preview-container">
                                <div class="wallpaper-preview" style="background: ${state.desktopWallpaper || 'linear-gradient(135deg, #1e293b 0%, #831843 100%)'}; background-size: cover;"></div>
                                <div class="wallpaper-actions">
                                    <button class="footer-btn primary btn-upload-wallpaper">${t('settings.appearance.upload', state.language)}</button>
                                    <button class="footer-btn primary btn-default-wallpaper">${t('settings.appearance.default', state.language)}</button>
                                    <label for="wallpaper-input" class="sr-only">${t('settings.appearance.upload', state.language)}</label>
                                    <input type="file" id="wallpaper-input" name="wallpaper_file_${Math.random().toString(36).substring(7)}" style="display:none" accept="image/*" autocomplete="off">
                                </div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <label>${t('settings.appearance.visuals', state.language)}</label>
                            <div class="settings-switch-group">
                                <div class="switch-item" id="animations-switch-item">
                                    <div class="switch-content">
                                        <span class="switch-label">${t('settings.appearance.animations', state.language)}</span>
                                    </div>
                                    <label class="switch-container">
                                        <input type="checkbox" id="animations-toggle" ${state.enableAnimations ? 'checked' : ''}>
                                        <span class="switch-slider"></span>
                                    </label>
                                </div>
                                <div class="switch-item" id="blur-switch-item">
                                    <div class="switch-content">
                                        <span class="switch-label">${t('settings.appearance.blur', state.language)}</span>
                                    </div>
                                    <label class="switch-container">
                                        <input type="checkbox" id="blur-toggle" ${state.enableBlur ? 'checked' : ''}>
                                        <span class="switch-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 'system':
                return `
                    <div class="settings-section ${animClass}">
                        <h2 class="section-title">${t('settings.system.sectionTitle', state.language)}</h2>
                        <div class="settings-group">
                            <div class="switch-item">
                                <div class="switch-content">
                                    <span class="switch-label">${t('settings.system.fullscreen.label', state.language)}</span>
                                    <span class="switch-description">${t('settings.system.fullscreen.description', state.language)}</span>
                                </div>
                                <label class="switch-container">
                                    <input type="checkbox" id="fullscreen-toggle" ${state.alwaysShowFullscreen ? 'checked' : ''}>
                                    <span class="switch-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
            case 'about':
                return `
                    <div class="settings-section ${animClass}">
                        <h2 class="section-title">${t('settings.about.sectionTitle', state.language)}</h2>
                        <div class="about-content">
                            <div class="os-logo-mini">PageOnline <span>OS</span></div>
                            <p>${t('settings.about.description', state.language)}</p>
                            <div class="about-info">
                                <div class="info-row">
                                    <span>${t('settings.about.version', state.language)}</span>
                                    <span>${version}</span>
                                </div>
                            </div>
                            <a href="https://github.com/K1234-droid/pageonline-os" target="_blank" class="footer-btn primary" style="text-decoration: none; margin-top: 20px; display: inline-flex;">${t('settings.about.update', state.language)}</a>
                        </div>
                    </div>
                `;
        }
    }

    function setupEvents() {
        content.querySelectorAll('input[type="text"]').forEach(input => {
            input.onkeydown = (e) => {
                if (e.key === 'Escape') {
                    input.blur();
                }
            };
        });

        content.querySelectorAll('.settings-nav-item').forEach(item => {
            item.onclick = () => {
                activeSection = item.dataset.section;
                render();
            };
        });

        const sidebar = content.querySelector('.settings-sidebar');
        const sidebarItems = content.querySelector('.settings-sidebar-items');
        if (sidebar && sidebarItems) {
            sidebar.addEventListener('wheel', (e) => {
                const isHorizontal = getComputedStyle(sidebarItems).flexDirection === 'row';
                if (isHorizontal && e.deltaY !== 0) {
                    e.preventDefault();
                    sidebar.scrollLeft += e.deltaY;
                }
            });
        }

        content.querySelectorAll('.grid-item').forEach(item => {
            item.onclick = () => {
                activeSection = item.dataset.section;
                render();
            };
        });

        content.querySelectorAll('.radio-item[data-lang]').forEach(item => {
            item.onclick = () => {
                setState({ language: item.dataset.lang });
                render(true);
            };
        });

        const updateRadioUI = (selector, dataAttr, value) => {
            content.querySelectorAll(selector).forEach(item => {
                if (item.getAttribute(dataAttr) === value) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        };

        content.querySelectorAll('.radio-item[data-clock]').forEach(item => {
            item.onclick = () => {
                const val = item.dataset.clock;
                setState({ clockFormat: val });
                updateRadioUI('.radio-item[data-clock]', 'data-clock', val);
            };
        });

        content.querySelectorAll('.radio-item[data-date]').forEach(item => {
            item.onclick = () => {
                const val = item.dataset.date;
                setState({ dateDisplay: val });
                updateRadioUI('.radio-item[data-date]', 'data-date', val);
            };
        });

        const searchInput = content.querySelector('#settings-search');
        const resultsDropdown = content.querySelector('#search-results-dropdown');
        let selectedIndex = -1;

        if (searchInput && resultsDropdown) {
            const handleSearch = (query) => {
                query = query.toLowerCase().trim();
                if (!query) {
                    resultsDropdown.classList.remove('active');
                    resultsDropdown.innerHTML = '';
                    selectedIndex = -1;
                    return;
                }

                const results = searchableItems
                    .filter(item => t(item.label, state.language).toLowerCase().includes(query))
                    .slice(0, 5);

                if (results.length > 0) {
                    resultsDropdown.innerHTML = results.map((item, idx) => `
                        <div class="search-result-item" data-id="${item.id}" data-index="${idx}">
                            <div class="result-icon">${item.icon}</div>
                            <div class="result-info">
                                <span class="result-label">${t(item.label, state.language)}</span>
                                <span class="result-path">${t(`settings.menu.${item.section}`, state.language)}</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    resultsDropdown.innerHTML = `<div class="no-results-message">${t('settings.noResults', state.language)}</div>`;
                }

                resultsDropdown.classList.add('active');
                selectedIndex = -1;
            };

            searchInput.oninput = (e) => handleSearch(e.target.value);

            searchInput.onkeydown = (e) => {
                const items = resultsDropdown.querySelectorAll('.search-result-item');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                    updateSelection();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    updateSelection();
                } else if (e.key === 'Enter') {
                    if (selectedIndex >= 0 && items[selectedIndex]) {
                        items[selectedIndex].click();
                    } else if (items.length > 0) {
                        items[0].click();
                    }
                } else if (e.key === 'Escape') {
                    resultsDropdown.classList.remove('active');
                    searchInput.blur();
                }
            };

            const updateSelection = () => {
                resultsDropdown.querySelectorAll('.search-result-item').forEach((item, idx) => {
                    item.classList.toggle('selected', idx === selectedIndex);
                    if (idx === selectedIndex) {
                        item.scrollIntoView({ block: 'nearest' });
                    }
                });
            };

            resultsDropdown.onclick = (e) => {
                const item = e.target.closest('.search-result-item');
                if (item) {
                    const found = searchableItems.find(si => si.id === item.dataset.id);
                    if (found) {
                        resultsDropdown.classList.remove('active');
                        searchInput.value = '';
                        win._navigateTo(found.section, found.selector);
                    }
                }
            };

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
                    resultsDropdown.classList.remove('active');
                }
            });
        }

        const usernameInput = content.querySelector('#username-input');
        const saveProfileBtn = content.querySelector('.btn-save-profile');

        const saveUsername = () => {
            const newName = usernameInput.value.trim() || 'User';
            setState({ username: newName });
            render(true);
        };

        if (saveProfileBtn) {
            saveProfileBtn.onclick = saveUsername;
        }

        if (usernameInput) {
            usernameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveUsername();
                }
            });
        }

        const deleteAvatarBtn = content.querySelector('.btn-delete-avatar');
        if (deleteAvatarBtn) {
            deleteAvatarBtn.onclick = (e) => {
                e.stopPropagation();

                const existingCropper = state.activeApps.find(a => a.id === 'settings' && a._isCropper);
                if (existingCropper) {
                    if (window.focusOSWindow) window.focusOSWindow(existingCropper.instanceId);
                    return;
                }

                setState({ profilePicture: null });
                render(true);
            };
        }

        const editAvatarBtn = content.querySelector('.btn-edit-avatar');
        const avatarInput = content.querySelector('#avatar-input');
        if (editAvatarBtn && avatarInput) {
            editAvatarBtn.onclick = () => {
                const existingCropper = state.activeApps.find(a => a.id === 'settings' && a._isCropper);
                if (existingCropper) {
                    if (window.focusOSWindow) window.focusOSWindow(existingCropper.instanceId);
                    return;
                }
                avatarInput.click();
            };
            avatarInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {

                    const reader = new FileReader();
                    reader.onload = async (re) => {
                        const img = re.target.result;

                        const cropperInstanceId = `cropper-${Date.now()}`;
                        const appInstance = {
                            id: 'settings',
                            instanceId: cropperInstanceId,
                            icon: '⚙️',
                            label: 'settings.profile.cropper.title',
                            isDialog: true,
                            _isCropper: true
                        };

                        if (window.createOSWindow) {
                            const openCropper = () => {
                                addActiveApp(appInstance);
                                window.createOSWindow(appInstance, '<div class="cropper-loader"></div>', {
                                    width: 400,
                                    height: 400,
                                    resizable: false,
                                    maximizable: false,
                                    centered: true
                                });

                                const cropperWin = document.getElementById(`win-${cropperInstanceId}`);
                                if (cropperWin) {
                                    cropperWin.classList.add('cropper-window');
                                    initCropper(cropperWin, img, (croppedResult) => {
                                        setState({ profilePicture: croppedResult });
                                        removeActiveApp(cropperInstanceId);
                                        if (window.closeOSWindow) window.closeOSWindow(cropperInstanceId);
                                        render(true);
                                    }, () => {
                                        removeActiveApp(cropperInstanceId);
                                        if (window.closeOSWindow) window.closeOSWindow(cropperInstanceId);
                                    });
                                }
                            };

                            if (state.isFullscreenStable) {
                                openCropper();
                            } else {
                                const unsubscribe = (await import('./state.js')).subscribe((s) => {
                                    if (s.isFullscreenStable) {
                                        unsubscribe();
                                        openCropper();
                                    }
                                });
                            }
                        }
                    };
                    reader.readAsDataURL(file);
                    avatarInput.value = '';
                }
            };
        }

        const uploadWallpaperBtn = content.querySelector('.btn-upload-wallpaper');
        const defaultWallpaperBtn = content.querySelector('.btn-default-wallpaper');
        const wallpaperInput = content.querySelector('#wallpaper-input');

        if (uploadWallpaperBtn && wallpaperInput) {
            uploadWallpaperBtn.onclick = () => wallpaperInput.click();
            wallpaperInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (re) => {
                        const compressed = await compressImage(re.target.result, 1920, 1080, 0.7);
                        const bgValue = `url(${compressed})`;
                        setState({ desktopWallpaper: bgValue });
                        const wallpaper = document.querySelector('.desktop-wallpaper');
                        if (wallpaper) {
                            wallpaper.style.background = bgValue;
                            wallpaper.style.backgroundSize = 'cover';
                            wallpaper.style.backgroundPosition = 'center';
                            wallpaper.style.backgroundRepeat = 'no-repeat';
                        }
                        render(true);
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        if (defaultWallpaperBtn) {
            defaultWallpaperBtn.onclick = () => {
                setState({ desktopWallpaper: null });
                const wallpaper = document.querySelector('.desktop-wallpaper');
                if (wallpaper) wallpaper.style.background = '';
                render(true);
            };
        }

        const switchItem = content.querySelector('.switch-item');
        const fullscreenToggle = content.querySelector('#fullscreen-toggle');
        if (switchItem && fullscreenToggle) {
            switchItem.onclick = (e) => {
                if (e.target !== fullscreenToggle) {
                    fullscreenToggle.click();
                }
            };

            fullscreenToggle.onclick = (e) => e.stopPropagation();

            fullscreenToggle.onchange = (e) => {
                const isChecked = e.target.checked;
                setState({ alwaysShowFullscreen: isChecked });

                if (!isChecked && document.fullscreenElement) {
                    document.exitFullscreen().catch(err => console.warn(err));
                }
            };
        }

        const animationsSwitchItem = content.querySelector('#animations-switch-item');
        const animationsToggle = content.querySelector('#animations-toggle');
        if (animationsSwitchItem && animationsToggle) {
            animationsSwitchItem.onclick = (e) => {
                if (e.target !== animationsToggle) {
                    animationsToggle.click();
                }
            };
            animationsToggle.onclick = (e) => e.stopPropagation();
            animationsToggle.onchange = (e) => setState({ enableAnimations: e.target.checked });
        }

        const blurSwitchItem = content.querySelector('#blur-switch-item');
        const blurToggle = content.querySelector('#blur-toggle');
        if (blurSwitchItem && blurToggle) {
            blurSwitchItem.onclick = (e) => {
                if (e.target !== blurToggle) {
                    blurToggle.click();
                }
            };
            blurToggle.onclick = (e) => e.stopPropagation();
            blurToggle.onchange = (e) => setState({ enableBlur: e.target.checked });
        }
    }

    let lastLanguage = state.language;
    let lastUsername = state.username;
    let lastClock = state.clockFormat;
    let lastDateImg = state.dateDisplay;
    let lastPfp = state.profilePicture;
    let lastWall = state.desktopWallpaper;
    let lastFullscreen = state.alwaysShowFullscreen;
    let lastAnimations = state.enableAnimations;
    let lastBlur = state.enableBlur;

    win._updateSettingsUI = (s) => {
        const cropper = state.activeApps.find(a => a.id === 'settings' && a._isCropper);
        if (cropper) {
            const cropperWin = document.getElementById(`win-${cropper.instanceId}`);
            if (cropperWin && cropperWin._updateCropperUI) {
                cropperWin._updateCropperUI(s);
            }
        }

        if (s.language !== lastLanguage ||
            s.username !== lastUsername ||
            s.clockFormat !== lastClock ||
            s.dateDisplay !== lastDateImg ||
            s.profilePicture !== lastPfp ||
            s.desktopWallpaper !== lastWall ||
            s.alwaysShowFullscreen !== lastFullscreen ||
            s.enableAnimations !== lastAnimations ||
            s.enableBlur !== lastBlur) {

            lastLanguage = s.language;
            lastUsername = s.username;
            lastClock = s.clockFormat;
            lastDateImg = s.dateDisplay;
            lastPfp = s.profilePicture;
            lastWall = s.desktopWallpaper;
            lastFullscreen = s.alwaysShowFullscreen;
            lastAnimations = s.enableAnimations;
            lastBlur = s.enableBlur;

            render(true);
        }
    };

    win._navigateTo = (sectionId, scrollTargetSelector) => {
        if (sectionId && sectionId !== activeSection) {
            activeSection = sectionId;
            render(true);
        }

        if (scrollTargetSelector) {
            setTimeout(() => {
                const target = content.querySelector(scrollTargetSelector);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.classList.add('highlight-flash');
                    setTimeout(() => target.classList.remove('highlight-flash'), 1000);
                }
            }, 50);
        }
    };


    render();
}
