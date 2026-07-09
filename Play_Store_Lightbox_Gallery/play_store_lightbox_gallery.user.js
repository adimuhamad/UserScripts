// ==UserScript==
// @name         Play Store Lightbox Gallery
// @namespace    PlayStoreImageViewer
// @version      4.7
// @description  A minimalist lightbox gallery for Google Play Store with multi-image panorama viewing, dynamic resolution, gap controls, and saved settings.
// @author       MochAdiMR
// @match        https://play.google.com/store/apps/details*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=play.google.com
// @grant        none
// @connect      none
// @supportURL   https://buymeacoffee.com/mochadimr
// @homepageURL  https://github.com/adimuhamad/
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    let albumImages = [], currentIndex = 0;
    let scale = 1, translateX = 0, translateY = 0;
    let isDragging = false, wasDragged = false;
    let startX = 0, startY = 0, downX = 0, downY = 0;

    // FontAwesome SVG Assets
    const icoExpand = '<svg viewBox="0 0 448 512"><path d="M32 32C14 32 0 46 0 64v96a32 32 0 1 0 64 0V96h64a32 32 0 1 0 0-64zm32 320a32 32 0 1 0-64 0v96c0 18 14 32 32 32h96a32 32 0 1 0 0-64H64zM320 32a32 32 0 1 0 0 64h64v64a32 32 0 1 0 64 0V64c0-18-14-32-32-32zm128 320a32 32 0 1 0-64 0v64h-64a32 32 0 1 0 0 64h96c18 0 32-14 32-32z"/></svg>';
    const icoCompress = '<svg viewBox="0 0 448 512"><path d="M160 64a32 32 0 1 0-64 0v64H32a32 32 0 1 0 0 64h96c18 0 32-14 32-32zM32 320a32 32 0 1 0 0 64h64v64a32 32 0 1 0 64 0v-96c0-18-14-32-32-32zM352 64a32 32 0 1 0-64 0v96c0 18 14 32 32 32h96a32 32 0 1 0 0-64h-64zm-32 256c-18 0-32 14-32 32v96a32 32 0 1 0 64 0v-64h64a32 32 0 1 0 0-64z"/></svg>';
    const icoKeyboard = '<svg viewBox="0 0 576 512"><path d="M64 64C29 64 0 93 0 128v256c0 35 29 64 64 64h448c35 0 64-29 64-64V128c0-35-29-64-64-64zm16 64h32q15 1 16 16v32q-1 15-16 16H80q-15-1-16-16v-32q1-15 16-16M64 240q1-15 16-16h32q15 1 16 16v32q-1 15-16 16H80q-15-1-16-16zm112-112h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16v-32q1-15 16-16m-16 112q1-15 16-16h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16zm16 80h224q15 1 16 16v32q-1 15-16 16H176q-15-1-16-16v-32q1-15 16-16m80-176q1-15 16-16h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16zm16 80h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16v-32q1-15 16-16m80-80q1-15 16-16h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16zm16 80h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16v-32q1-15 16-16m80-80q1-15 16-16h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16zm16 80h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16v-32q1-15 16-16"/></svg>';
    const icoEye = '<svg viewBox="0 0 576 512"><path d="M288 32c-81 0-145 37-193 81-46 43-78 95-93 131q-4 12 0 24c15 36 47 88 93 131 48 44 112 81 193 81s146-37 193-81c46-43 78-95 93-131q5-12 0-24c-15-36-47-88-93-131-47-44-112-81-193-81M144 256a144 144 0 1 1 288 0 144 144 0 1 1-288 0m144-64a64 64 0 0 1-96 56q-1 16 3 33a96 96 0 1 0 85-121q8 15 8 32"/></svg>';
    const icoEyeSlash = '<svg viewBox="0 0 576 512"><path d="M41-25c-9-9-25-9-34 0S-2 0 7 9l528 528c9 10 25 10 34 0s9-24 0-34l-97-96 9-7c46-44 78-96 93-131q5-12 0-25c-15-36-47-88-93-131-48-44-112-81-193-81-57 0-106 18-146 44zm164 164q36-26 83-27a144 144 0 0 1 117 228l-34-35a96 96 0 0 0-108-142l-24 10zm120 256a143 143 0 0 1-181-139q0-19 5-37l-80-80c-32 37-55 76-66 105q-6 12 0 24c14 36 46 88 93 131 47 44 111 81 192 81q56-1 102-21z"/></svg>';
    const icoXmark = '<svg viewBox="0 0 384 512"><path d="M55 73a32 32 0 0 0-45 46l137 137L10 393a32 32 0 0 0 45 46l138-138 137 138a32 32 0 0 0 45-46L238 256l137-137a32 32 0 0 0-45-46L193 211z"/></svg>';
    const icoAngleLeft = '<svg viewBox="0 0 320 512"><path d="M9 233a32 32 0 0 0 0 46l192 192a32 32 0 0 0 46-46L77 256 247 87a32 32 0 0 0-46-46z"/></svg>';
    const icoAngleRight = '<svg viewBox="0 0 320 512"><path d="M311 233c13 13 13 33 0 46L119 471a32 32 0 0 1-45-46l169-169L74 87a32 32 0 0 1 45-46z"/></svg>';
    const icoGear = '<svg viewBox="0 0 512 512"><path d="M195 10c3-15 16-26 31-26h60c15 0 28 11 31 26l15 70q21 9 39 22l68-22q24-7 38 14l30 52c7 13 5 30-7 40l-53 47a188 188 0 0 1 0 46l53 47c12 10 14 27 7 40l-30 52q-14 20-38 14l-68-22q-18 13-39 23l-14 69c-3 15-17 26-32 26h-59c-16 0-29-11-32-25l-14-70q-21-9-39-23l-68 22c-15 5-31-1-38-14L6 366c-8-13-5-30 6-40l54-47a188 188 0 0 1 0-46l-54-47a32 32 0 0 1-6-40l30-52c7-13 23-19 38-14l67 22q19-14 40-23zm61 326a80 80 0 1 0 0-160 80 80 0 1 0 0 160"/></svg>';

    // Inject Stylesheet
    const style = document.createElement('style');
    style.innerHTML = `.gp-lb-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; background: rgba(10,12,16,0.97); z-index: 999999; opacity: 0; pointer-events: none; transition: opacity 0.3s; font-family: "Google Sans", Roboto, Arial, sans-serif; color: #c9d1d9; user-select: none; } .gp-lb-overlay.active { pointer-events: auto; opacity: 1; } .gp-lb-topbar, .gp-lb-thumbs-window { transition: opacity 0.25s, visibility 0.25s; opacity: 1; visibility: visible; position: absolute; left: 0; width: 100%; z-index: 1000002; } .gp-lb-topbar { top: 0; display: flex; justify-content: space-between; align-items: center; padding: 5px 12px; background: rgba(0,0,0,0.88); box-sizing: border-box; } .gp-lb-thumbs-window { bottom: 0; background: rgba(13,17,23,0.95); border-top: 1px solid #30363d; padding: 4px 0; display: flex; justify-content: center; } .gp-lb-overlay.zoomed-mode .gp-lb-topbar, .gp-lb-overlay.zoomed-mode .gp-lb-thumbs-window, .gp-lb-overlay.ui-hidden .gp-lb-topbar, .gp-lb-overlay.ui-hidden .gp-lb-thumbs-window { opacity: 0; visibility: hidden; pointer-events: none; } .gp-lb-meta { display: flex; flex-direction: column; max-width: 50%; } #gp-lb-caption { font-size: 13px; font-weight: 500; color: #fff; line-height: 1.2; } .gp-lb-tech-info { font-size: 11px; color: #8b949e; display: flex; gap: 6px; margin-top: 3px; } .gp-lb-tech-info span { background: #21262d; padding: 0px 4px; border-radius: 4px; border: 1px solid #30363d; } .gp-lb-controls { display: flex; align-items: center; gap: 6px; } .gp-lb-main-view { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 1000000; display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding-top: 38px; padding-bottom: 54px; transition: padding 0.2s ease; touch-action: none; } .gp-lb-overlay.zoomed-mode .gp-lb-main-view, .gp-lb-overlay.ui-hidden .gp-lb-main-view { padding: 0; } .gp-lb-img-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; gap: 0px; transition: transform 0.1s ease-out; } .gp-lb-img-container img { max-width: 100%; height: 100%; object-fit: contain; cursor: zoom-in; margin: 0; padding: 0; display: block; } .gp-lb-btn svg { width: 11px; height: 11px; fill: currentColor; display: inline-block; vertical-align: middle; } .gp-lb-nav svg { width: 15px; height: 15px; } .gp-lb-btn { background: rgba(255, 255, 255, 0.1); color: #fff; border: none; border-radius: 4px; padding: 0 8px; height: 24px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; box-sizing: border-box; transition: background 0.2s; } .gp-lb-btn:hover, #gp-lb-unhide-btn:hover { background: rgba(255, 255, 255, 0.2); } #gp-lb-close-btn { width: 24px; padding: 0; background: rgba(255,0,0,0.2); } #gp-lb-close-btn:hover { background: rgba(255,0,0,0.5); } #gp-lb-close-btn svg { width: 10px; height: 10px; } .gp-lb-select { background: #202124; color: #fff; border: 1px solid #3c4043; border-radius: 4px; padding: 0 4px; height: 24px; font-size: 11px; cursor: pointer; outline: none; box-sizing: border-box; } .gp-lb-select:hover { border-color: #8b949e; background: #2d2e30; } .gp-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; border-radius: 50%; z-index: 1000001; padding: 0; background: rgba(0,0,0,0.5); } .gp-lb-nav:hover { background: rgba(0,0,0,0.8); } .gp-lb-prev { left: 12px; } .gp-lb-next { right: 12px; } .gp-lb-thumbs-container { display: flex; gap: 6px; overflow-x: auto; max-width: 95%; padding: 2px; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; } .gp-lb-thumbs-container::-webkit-scrollbar { height: 3px; } .gp-lb-thumbs-container::-webkit-scrollbar-thumb { background: #5f6368; border-radius: 2px; } .gp-lb-thumb { height: 38px; min-width: 24px; max-width: 70px; border-radius: 4px; border: 2px solid transparent; cursor: pointer; opacity: 0.5; transition: 0.2s; flex-shrink: 0; box-sizing: border-box; object-fit: contain; background: #000; } .gp-lb-thumb:hover, .gp-lb-thumb.active { opacity: 1; border-color: #01875f; } #gp-lb-unhide-btn { position: absolute; top: 6px; right: 12px; z-index: 1000007; display: none; } .gp-lb-overlay.ui-hidden #gp-lb-unhide-btn { display: flex; } .gp-lb-modal { position: absolute; top: 45px; right: 20px; background: #202124; border: 1px solid #3c4043; border-radius: 8px; padding: 12px; width: 220px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); display: none; z-index: 1000006; font-size: 12px; } .gp-lb-modal.active { display: block; } .gp-lb-modal-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px dashed #3c4043; padding-bottom: 6px; } .gp-lb-modal-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; } .gp-lb-key { background: #3c4043; border-radius: 4px; padding: 1px 5px; font-weight: bold; font-family: monospace; color: #fff; }`;
    document.head.appendChild(style);

    // Build DOM
    const overlay = document.createElement('div');
    overlay.className = 'gp-lb-overlay';
    overlay.innerHTML = `<div class="gp-lb-main-view"><button class="gp-lb-btn gp-lb-nav gp-lb-prev">${icoAngleLeft}</button><div class="gp-lb-img-container"></div><button class="gp-lb-btn gp-lb-nav gp-lb-next">${icoAngleRight}</button></div><div class="gp-lb-topbar"><div class="gp-lb-meta"><div id="gp-lb-caption">Loading...</div><div class="gp-lb-tech-info"><span id="gp-lb-dims">-</span><span id="gp-lb-format">-</span><span id="gp-lb-size">-</span></div></div><div class="gp-lb-controls"><button class="gp-lb-btn" id="gp-lb-toggle-ui-btn">${icoEyeSlash} Hide UI</button><button class="gp-lb-btn" id="gp-lb-fs-btn">${icoExpand} Expand</button><button class="gp-lb-btn" id="gp-lb-settings-btn">${icoGear} Settings</button><button class="gp-lb-btn" id="gp-lb-help-btn">${icoKeyboard} Shortcuts</button><button class="gp-lb-btn" id="gp-lb-close-btn">${icoXmark}</button></div></div><div class="gp-lb-thumbs-window"><div class="gp-lb-thumbs-container"></div></div><button class="gp-lb-btn" id="gp-lb-unhide-btn">${icoEye} Show UI</button><div class="gp-lb-modal" id="gp-lb-help-modal"><div style="font-weight:bold;margin-bottom:10px;color:#01875f;text-align:center;">Keyboard Shortcuts</div><div class="gp-lb-modal-row"><span>Next Image</span><span class="gp-lb-key">→</span></div><div class="gp-lb-modal-row"><span>Prev Image</span><span class="gp-lb-key">←</span></div><div class="gp-lb-modal-row"><span>Fullscreen</span><span class="gp-lb-key">F</span></div><div class="gp-lb-modal-row"><span>Toggle UI</span><span class="gp-lb-key">H</span></div><div class="gp-lb-modal-row"><span>Close Gallery</span><span class="gp-lb-key">ESC</span></div></div><div class="gp-lb-modal" id="gp-lb-settings-modal"><div style="font-weight:bold;margin-bottom:12px;color:#01875f;text-align:center;">Gallery Settings</div><div class="gp-lb-modal-row"><span>View Layout</span><select id="gp-lb-view-count" class="gp-lb-select"><option value="1">1 Image</option><option value="2">2 Images</option><option value="3">3 Images</option></select></div><div class="gp-lb-modal-row"><span>Resolution</span><select id="gp-lb-res-toggle" class="gp-lb-select"><option value="high">High Res</option><option value="med">Med Res</option><option value="low">Low Res</option></select></div><div class="gp-lb-modal-row"><span>Image Gap</span><select id="gp-lb-gap-toggle" class="gp-lb-select"><option value="none">No Gap</option><option value="default">With Gap</option></select></div></div>`;
    document.body.appendChild(overlay);

    const imgContainer = overlay.querySelector('.gp-lb-img-container');
    const thumbContainer = overlay.querySelector('.gp-lb-thumbs-container');
    const helpModal = document.getElementById('gp-lb-help-modal');
    const settingsModal = document.getElementById('gp-lb-settings-modal');
    const unhideBtn = document.getElementById('gp-lb-unhide-btn');
    const viewCountSelect = document.getElementById('gp-lb-view-count');
    const resToggleSelect = document.getElementById('gp-lb-res-toggle');
    const gapToggleSelect = document.getElementById('gp-lb-gap-toggle');

    // Retrieve settings from localStorage or set defaults
    const savedViewCount = localStorage.getItem('gp_lb_view_count') || '1';
    const savedResToggle = localStorage.getItem('gp_lb_res_toggle') || 'high';
    const savedGapToggle = localStorage.getItem('gp_lb_gap_toggle') || 'none';

    viewCountSelect.value = savedViewCount;
    resToggleSelect.value = savedResToggle;
    gapToggleSelect.value = savedGapToggle;

    // Save user preferences and apply changes
    function saveSettings() {
        localStorage.setItem('gp_lb_view_count', viewCountSelect.value);
        localStorage.setItem('gp_lb_res_toggle', resToggleSelect.value);
        localStorage.setItem('gp_lb_gap_toggle', gapToggleSelect.value);
        updateLightbox();
    }

    viewCountSelect.addEventListener('change', saveSettings);
    resToggleSelect.addEventListener('change', saveSettings);
    gapToggleSelect.addEventListener('change', saveSettings);

    // Prevent propagation for UI overlays
    overlay.querySelector('.gp-lb-topbar').addEventListener('click', (e) => e.stopPropagation());
    overlay.querySelector('.gp-lb-thumbs-window').addEventListener('click', (e) => e.stopPropagation());
    helpModal.addEventListener('click', (e) => e.stopPropagation());
    settingsModal.addEventListener('click', (e) => e.stopPropagation());
    unhideBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleUIVisibility(); });

    // Format URL for dynamic resolution based on Googleusercontent API
    function getDynamicResUrl(url, resLevel) {
        if (!url) return "";
        let base = url.split('=')[0];
        if (resLevel === 'high') return base + '=h1920-rw';
        if (resLevel === 'med') return base + '=h960-rw';
        return url;
    }

    // Main render function
    function updateLightbox() {
        if (albumImages.length === 0) return;
        resetZoomAndDrag();

        imgContainer.innerHTML = '';
        const maxPhotosToShow = parseInt(viewCountSelect.value) || 1;
        const resMode = resToggleSelect.value;
        const gapMode = gapToggleSelect.value;

        // Apply structural gap setting dynamically
        imgContainer.style.gap = gapMode === 'default' ? '8px' : '0px';

        document.getElementById('gp-lb-caption').textContent = `Screenshot ${currentIndex + 1} (${currentIndex + 1} / ${albumImages.length})`;
        document.getElementById('gp-lb-dims').textContent = '-';
        document.getElementById('gp-lb-format').textContent = '-';
        document.getElementById('gp-lb-size').textContent = '...';

        for (let i = 0; i < maxPhotosToShow; i++) {
            let targetIdx = (currentIndex + i) % albumImages.length;
            // Break loop if we are looping back to the initial image (prevents duplicating images if count > array size)
            if (i > 0 && targetIdx === currentIndex) break;

            const baseSource = albumImages[targetIdx];
            const imgEl = document.createElement('img');
            imgEl.draggable = false;

            imgEl.src = getDynamicResUrl(baseSource, resMode);
            imgEl.style.width = maxPhotosToShow === 1 ? '100%' : 'auto';

            // Extract technical information strictly from the first actively viewed image
            if (i === 0) {
                imgEl.onload = () => {
                    document.getElementById('gp-lb-dims').textContent = `${imgEl.naturalWidth}x${imgEl.naturalHeight}`;
                    let detectedFormat = "WEBP";
                    if (imgEl.src.toLowerCase().includes('.png')) detectedFormat = "PNG";
                    else if (imgEl.src.toLowerCase().includes('.jpg') || imgEl.src.toLowerCase().includes('.jpeg')) detectedFormat = "JPG";
                    document.getElementById('gp-lb-format').textContent = detectedFormat;
                };

                // Fetch file size asynchronously via HTTP HEAD request
                fetch(imgEl.src, { method: 'HEAD' }).then(res => {
                    const bytes = res.headers.get('content-length');
                    const contentType = res.headers.get('content-type');

                    if (contentType && contentType.includes('webp')) document.getElementById('gp-lb-format').textContent = "WEBP";

                    if (bytes) {
                        const mb = bytes / (1024 * 1024);
                        if (mb >= 1) {
                            document.getElementById('gp-lb-size').textContent = mb.toFixed(2) + " MB";
                        } else {
                            document.getElementById('gp-lb-size').textContent = (bytes / 1024).toFixed(0) + " KB";
                        }
                    } else {
                        document.getElementById('gp-lb-size').textContent = '-';
                    }
                }).catch(() => {
                    document.getElementById('gp-lb-size').textContent = '-';
                });
            }

            imgContainer.appendChild(imgEl);
        }

        overlay.querySelector('.gp-lb-prev').style.display = albumImages.length <= 1 ? 'none' : 'flex';
        overlay.querySelector('.gp-lb-next').style.display = albumImages.length <= 1 ? 'none' : 'flex';

        updateThumbnails();
    }

    function applyTransform() {
        imgContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        if (scale > 1) overlay.classList.add('zoomed-mode'); else overlay.classList.remove('zoomed-mode');
    }

    function resetZoomAndDrag() { scale = 1; translateX = 0; translateY = 0; imgContainer.style.cursor = 'zoom-in'; applyTransform(); }

    // Pointer events for zooming and dragging
    imgContainer.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation(); downX = e.clientX; downY = e.clientY; wasDragged = false;
        if (scale > 1) { isDragging = true; startX = e.clientX - translateX; startY = e.clientY - translateY; imgContainer.style.cursor = 'grabbing'; imgContainer.setPointerCapture(e.pointerId); }
    });
    imgContainer.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        if (Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5) wasDragged = true;
        translateX = e.clientX - startX; translateY = e.clientY - startY; applyTransform();
    });
    imgContainer.addEventListener('pointerup', (e) => { if (isDragging) { isDragging = false; imgContainer.style.cursor = 'grab'; imgContainer.releasePointerCapture(e.pointerId); } });
    imgContainer.addEventListener('click', (e) => { e.stopPropagation(); if (wasDragged) { wasDragged = false; return; } if (scale === 1) { scale = 2.5; imgContainer.style.cursor = 'grab'; } else { resetZoomAndDrag(); } applyTransform(); });

    // Wheel event for scaling zoom
    overlay.addEventListener('wheel', (e) => {
        if (!overlay.classList.contains('active')) return;
        e.preventDefault(); scale = e.deltaY < 0 ? Math.min(scale + 0.15, 6) : Math.max(scale - 0.15, 1);
        if (scale === 1) { translateX = 0; translateY = 0; }
        imgContainer.style.cursor = scale > 1 ? 'grab' : 'zoom-in'; applyTransform();
    }, { passive: false });

    function buildThumbnails() {
        thumbContainer.innerHTML = '';
        albumImages.forEach((sourceUrl, index) => {
            const thumb = document.createElement('img');
            thumb.src = sourceUrl;
            thumb.className = 'gp-lb-thumb';
            thumb.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = index; updateLightbox(); });
            thumbContainer.appendChild(thumb);
        });
    }

    function updateThumbnails() {
        const thumbs = thumbContainer.querySelectorAll('.gp-lb-thumb');
        thumbs.forEach((t, idx) => {
            if (idx === currentIndex) { t.classList.add('active'); t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }
            else { t.classList.remove('active'); }
        });
    }

    function toggleUIVisibility() {
        const isHidden = overlay.classList.toggle('ui-hidden');
        document.getElementById('gp-lb-toggle-ui-btn').innerHTML = isHidden ? icoEye + ' Show UI' : icoEyeSlash + ' Hide UI';
    }

    function toggleFullscreen(e) {
        if(e) e.stopPropagation();
        const fsBtn = document.getElementById('gp-lb-fs-btn');
        if (!document.fullscreenElement) {
            overlay.requestFullscreen();
            fsBtn.innerHTML = icoCompress + ' Collapse';
        } else {
            document.exitFullscreen();
            fsBtn.innerHTML = icoExpand + ' Expand';
        }
    }

    function openLightbox() { overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }

    function closeLightbox() {
        helpModal.classList.remove('active');
        settingsModal.classList.remove('active');

        if (overlay.classList.contains('ui-hidden')) { toggleUIVisibility(); return; }
        overlay.classList.remove('active'); overlay.classList.remove('ui-hidden');
        document.getElementById('gp-lb-toggle-ui-btn').innerHTML = icoEyeSlash + ' Hide UI';
        document.body.style.overflow = ''; if (document.fullscreenElement) document.exitFullscreen();
        imgContainer.innerHTML = '';
    }

    // Intercept clicks on screenshot elements inside the list container
    document.addEventListener('click', function(event) {
        const targetImg = event.target.closest('div[role="list"] img[itemprop="image"]');

        if (targetImg) {
            event.preventDefault();
            event.stopPropagation();

            const container = targetImg.closest('div[role="list"]');
            const rawImages = Array.from(container.querySelectorAll('img[itemprop="image"]'));

            albumImages = rawImages.map(img => img.src || img.getAttribute('data-src') || "");

            currentIndex = rawImages.indexOf(targetImg);
            if (currentIndex === -1) currentIndex = 0;

            openLightbox();
            buildThumbnails();
            updateLightbox();
        }
    }, true);

    document.getElementById('gp-lb-close-btn').addEventListener('click', (e) => { e.stopPropagation(); overlay.classList.remove('ui-hidden'); closeLightbox(); });
    document.getElementById('gp-lb-toggle-ui-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleUIVisibility(); });
    document.getElementById('gp-lb-fs-btn').addEventListener('click', toggleFullscreen);

    // Toggle Modals Logic securely
    document.getElementById('gp-lb-settings-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        settingsModal.classList.toggle('active');
        helpModal.classList.remove('active');
    });
    document.getElementById('gp-lb-help-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        helpModal.classList.toggle('active');
        settingsModal.classList.remove('active');
    });

    // Close Modals or exit lightbox when clicking the overlay background
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('gp-lb-main-view') || e.target.classList.contains('gp-lb-img-container')) {
            closeLightbox();
        } else {
            helpModal.classList.remove('active');
            settingsModal.classList.remove('active');
        }
    });

    overlay.querySelector('.gp-lb-prev').addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + albumImages.length) % albumImages.length; updateLightbox(); });
    overlay.querySelector('.gp-lb-next').addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % albumImages.length; updateLightbox(); });

    document.addEventListener('keydown', function(event) {
        if (!overlay.classList.contains('active')) return;
        if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); return; }
        const key = event.key.toLowerCase();

        if (event.key === 'Escape') {
            if (settingsModal.classList.contains('active') || helpModal.classList.contains('active')) {
                settingsModal.classList.remove('active'); helpModal.classList.remove('active'); return;
            }
            overlay.classList.remove('ui-hidden'); closeLightbox();
        }
        else if (key === 'h') { toggleUIVisibility(); }
        else if (key === 'f') { toggleFullscreen(event); }
        else if (event.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % albumImages.length; updateLightbox(); }
        else if (event.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + albumImages.length) % albumImages.length; updateLightbox(); }
    });
})();
