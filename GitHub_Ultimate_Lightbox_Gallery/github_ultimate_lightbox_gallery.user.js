// ==UserScript==
// @name         GitHub Ultimate Lightbox Gallery
// @namespace    GithubImageViewerOverlay
// @version      7.4
// @description  A minimalist lightbox gallery for GitHub repositories that allows full-screen viewing, zooming, and navigation of documentation images.
// @author       MochAdiMR
// @match        https://github.com/*
// @icon         https://github.githubassets.com/pinned-octocat.svg
// @grant        GM_xmlhttpRequest
// @connect      *
// @supportURL   https://buymeacoffee.com/mochadimr
// @homepageURL  https://github.com/adimuhamad/
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Configuration parameters for filtering elements (Whitelist Logic)
    const enableFilter = true;
    const includeExtensions = ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'IMG'];
    const includeDomains = ['gitlab.com', 'github.com'];

    let albumImages = [], currentIndex = 0;
    let scale = 1, translateX = 0, translateY = 0;
    let isDragging = false, wasDragged = false;
    let startX = 0, startY = 0, downX = 0, downY = 0;
    let gifFrames = [], gifPlaying = false, currentGifFrame = 0, gifTimeout = null, gifDecoderId = 0;

    // FontAwesome 6.7.2 exact SVG path vector assets
    const icoExpand = '<svg viewBox="0 0 448 512"><path d="M32 32C14 32 0 46 0 64v96a32 32 0 1 0 64 0V96h64a32 32 0 1 0 0-64zm32 320a32 32 0 1 0-64 0v96c0 18 14 32 32 32h96a32 32 0 1 0 0-64H64zM320 32a32 32 0 1 0 0 64h64v64a32 32 0 1 0 64 0V64c0-18-14-32-32-32zm128 320a32 32 0 1 0-64 0v64h-64a32 32 0 1 0 0 64h96c18 0 32-14 32-32z"/></svg>';
    const icoCompress = '<svg viewBox="0 0 448 512"><path d="M160 64a32 32 0 1 0-64 0v64H32a32 32 0 1 0 0 64h96c18 0 32-14 32-32zM32 320a32 32 0 1 0 0 64h64v64a32 32 0 1 0 64 0v-96c0-18-14-32-32-32zM352 64a32 32 0 1 0-64 0v96c0 18 14 32 32 32h96a32 32 0 1 0 0-64h-64zm-32 256c-18 0-32 14-32 32v96a32 32 0 1 0 64 0v-64h64a32 32 0 1 0 0-64z"/></svg>';
    const icoKeyboard = '<svg viewBox="0 0 576 512"><path d="M64 64C29 64 0 93 0 128v256c0 35 29 64 64 64h448c35 0 64-29 64-64V128c0-35-29-64-64-64zm16 64h32q15 1 16 16v32q-1 15-16 16H80q-15-1-16-16v-32q1-15 16-16M64 240q1-15 16-16h32q15 1 16 16v32q-1 15-16 16H80q-15-1-16-16zm112-112h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16v-32q1-15 16-16m-16 112q1-15 16-16h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16zm16 80h224q15 1 16 16v32q-1 15-16 16H176q-15-1-16-16v-32q1-15 16-16m80-176q1-15 16-16h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16zm16 80h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16v-32q1-15 16-16m80-80q1-15 16-16h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16zm16 80h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16v-32q1-15 16-16m80-80q1-15 16-16h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16zm16 80h32q15 1 16 16v32q-1 15-16 16h-32q-15-1-16-16v-32q1-15 16-16"/></svg>';
    const icoEye = '<svg viewBox="0 0 576 512"><path d="M288 32c-81 0-145 37-193 81-46 43-78 95-93 131q-4 12 0 24c15 36 47 88 93 131 48 44 112 81 193 81s146-37 193-81c46-43 78-95 93-131q5-12 0-24c-15-36-47-88-93-131-47-44-112-81-193-81M144 256a144 144 0 1 1 288 0 144 144 0 1 1-288 0m144-64a64 64 0 0 1-96 56q-1 16 3 33a96 96 0 1 0 85-121q8 15 8 32"/></svg>';
    const icoEyeSlash = '<svg viewBox="0 0 576 512"><path d="M41-25c-9-9-25-9-34 0S-2 0 7 9l528 528c9 10 25 10 34 0s9-24 0-34l-97-96 9-7c46-44 78-96 93-131q5-12 0-25c-15-36-47-88-93-131-48-44-112-81-193-81-57 0-106 18-146 44zm164 164q36-26 83-27a144 144 0 0 1 117 228l-34-35a96 96 0 0 0-108-142l-24 10zm120 256a143 143 0 0 1-181-139q0-19 5-37l-80-80c-32 37-55 76-66 105q-6 12 0 24c14 36 46 88 93 131 47 44 111 81 192 81q56-1 102-21z"/></svg>';
    const icoBullseye = '<svg viewBox="0 0 576 512"><path d="M288-16c18 0 32 14 32 32v18c98 14 176 92 190 190h18a32 32 0 1 1 0 64h-18c-14 98-92 176-190 190v18a32 32 0 1 1-64 0v-18c-98-14-176-92-190-190H48a32 32 0 1 1 0-64h18c14-98 92-176 190-190V16c0-18 14-32 32-32M131 288c13 63 62 112 125 125v-13a32 32 0 1 1 64 0v13c63-13 112-62 125-125h-13a32 32 0 1 1 0-64h13c-13-63-62-112-125-125v13a32 32 0 1 1-64 0V99c-63 13-112 62-125 125h13a32 32 0 1 1 0 64zm157-80a48 48 0 1 1 0 96 48 48 0 1 1 0-96"/></svg>';
    const icoXmark = '<svg viewBox="0 0 384 512"><path d="M55 73a32 32 0 0 0-45 46l137 137L10 393a32 32 0 0 0 45 46l138-138 137 138a32 32 0 0 0 45-46L238 256l137-137a32 32 0 0 0-45-46L193 211z"/></svg>';
    const icoAngleLeft = '<svg viewBox="0 0 320 512"><path d="M9 233a32 32 0 0 0 0 46l192 192a32 32 0 0 0 46-46L77 256 247 87a32 32 0 0 0-46-46z"/></svg>';
    const icoAngleRight = '<svg viewBox="0 0 320 512"><path d="M311 233c13 13 13 33 0 46L119 471a32 32 0 0 1-45-46l169-169L74 87a32 32 0 0 1 45-46z"/></svg>';
    const icoPlay = '<svg viewBox="0 0 448 512"><path d="M91 37a40 40 0 0 0-59 35v368a40 40 0 0 0 59 35l336-184a40 40 0 0 0 0-70z"/></svg>';
    const icoPause = '<svg viewBox="0 0 384 512"><path d="M48 32C22 32 0 54 0 80v352c0 27 22 48 48 48h64c27 0 48-21 48-48V80c0-26-21-48-48-48zm224 0c-26 0-48 22-48 48v352c0 27 22 48 48 48h64c27 0 48-21 48-48V80c0-26-21-48-48-48z"/></svg>';

    // Inject core style sheets layout definitions
    const style = document.createElement('style');
    style.innerHTML = `.gh-lb-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; background: rgba(10,12,16,0.97); z-index: 999999; opacity: 0; pointer-events: none; transition: opacity 0.3s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #c9d1d9; user-select: none; } .gh-lb-overlay.active { pointer-events: auto; opacity: 1; } .gh-lb-topbar, .gh-lb-thumbs-window, .gh-lb-gif-bar { transition: opacity 0.25s, visibility 0.25s; opacity: 1; visibility: visible; position: absolute; left: 0; width: 100%; z-index: 1000002; } .gh-lb-topbar { top: 0; display: flex; justify-content: space-between; align-items: center; padding: 6px 14px; background: rgba(0,0,0,0.85); box-sizing: border-box; } .gh-lb-thumbs-window { bottom: 0; background: rgba(13,17,23,0.95); border-top: 1px solid #30363d; padding: 5px 0; display: flex; justify-content: center; } .gh-lb-overlay.zoomed-mode .gh-lb-topbar, .gh-lb-overlay.zoomed-mode .gh-lb-thumbs-window, .gh-lb-overlay.zoomed-mode .gh-lb-gif-bar, .gh-lb-overlay.ui-hidden .gh-lb-topbar, .gh-lb-overlay.ui-hidden .gh-lb-thumbs-window, .gh-lb-overlay.ui-hidden .gh-lb-gif-bar { opacity: 0; visibility: hidden; pointer-events: none; } .gh-lb-meta { display: flex; flex-direction: column; max-width: 40%; } #gh-lb-caption { font-size: 13px; font-weight: 600; color: #f0f6fc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .gh-lb-tech-info { font-size: 11px; color: #8b949e; display: flex; gap: 6px; margin-top: 1px; } .gh-lb-tech-info span { background: #21262d; padding: 0px 4px; border-radius: 4px; border: 1px solid #30363d; } .gh-lb-controls { display: flex; align-items: center; gap: 8px; } .gh-lb-counter { font-size: 12px; color: #8b949e; margin-right: 4px; } .gh-lb-main-view { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 1000000; display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding-top: 38px; padding-bottom: 50px; transition: padding 0.2s ease; touch-action: none; } .gh-lb-overlay.gif-active-mode:not(.zoomed-mode):not(.ui-hidden) .gh-lb-main-view { padding-bottom: 95px; } .gh-lb-overlay.zoomed-mode .gh-lb-main-view, .gh-lb-overlay.ui-hidden .gh-lb-main-view { padding: 0; } .gh-lb-img-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; transition: transform 0.1s ease-out; } .gh-lb-main-view img, .gh-lb-main-view canvas { width: 100%; height: 100%; object-fit: contain; cursor: zoom-in; } .gh-lb-btn svg { width: 12px; height: 12px; fill: currentColor; display: inline-block; vertical-align: middle; } .gh-lb-nav svg { width: 15px; height: 15px; } .gh-lb-btn { background: rgba(33, 38, 45, 0.8); color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px; padding: 0 10px; height: 26px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; } .gh-lb-btn:hover, #gh-lb-unhide-btn:hover { background: #30363d; color: #58a6ff; border-color: #8b949e; } #gh-lb-close-btn { width: 26px; padding: 0; } #gh-lb-close-btn svg { width: 11px; height: 11px; } .gh-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; border-radius: 50%; z-index: 1000001; padding: 0; } .gh-lb-prev { left: 14px; } .gh-lb-next { right: 14px; } .gh-lb-gif-bar { bottom: 60px; left: 50%; transform: translateX(-50%); background: rgba(22,27,34,0.92); border: 1px solid #30363d; padding: 5px 12px; border-radius: 30px; display: none; align-items: center; gap: 10px; width: 280px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); } .gh-lb-gif-bar input[type=range] { flex-grow: 1; accent-color: #58a6ff; cursor: pointer; height: 4px; } .gh-lb-thumbs-container { display: flex; gap: 5px; overflow-x: auto; max-width: 95%; padding: 2px; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; } .gh-lb-thumbs-container::-webkit-scrollbar { height: 3px; } .gh-lb-thumbs-container::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; } .gh-lb-thumb { height: 34px; width: 50px; border-radius: 4px; border: 2px solid #30363d; cursor: pointer; opacity: 0.4; transition: 0.2s; flex-shrink: 0; box-sizing: border-box; } .gh-lb-thumb:hover, .gh-lb-thumb.active { opacity: 1; border-color: #58a6ff; } #gh-lb-unhide-btn { position: absolute; top: 6px; right: 14px; z-index: 1000007; display: none; } .gh-lb-overlay.ui-hidden #gh-lb-unhide-btn { display: flex; } .gh-lb-help-modal { position: absolute; top: 50px; right: 20px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; width: 220px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); display: none; z-index: 1000006; font-size: 12px; } .gh-lb-help-modal.active { display: block; } .gh-lb-help-row { display: flex; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px dashed #21262d; padding-bottom: 4px; } .gh-lb-key { background: #30363d; border: 1px solid #8b949e; border-radius: 3px; padding: 1px 5px; font-weight: bold; font-family: monospace; color: #f0f6fc; } @media (max-width: 768px){.gh-lb-topbar{flex-wrap:wrap;padding:10px;gap:8px}.gh-lb-meta{max-width:85%}.gh-lb-controls{width:100%;flex-wrap:wrap;justify-content:flex-start;gap:6px;margin-top:4px}#gh-lb-close-btn{position:absolute;top:10px;right:10px;width:32px;height:32px}#gh-lb-help-btn{display:none!important}.gh-lb-nav{width:44px;height:44px}}`;
    document.head.appendChild(style);

    // Compressed unified single-line DOM string implementation
    const overlay = document.createElement('div');
    overlay.className = 'gh-lb-overlay';
    overlay.innerHTML = `<div class="gh-lb-main-view"><button class="gh-lb-btn gh-lb-nav gh-lb-prev">' + icoAngleLeft + '</button><div class="gh-lb-img-container"><img id="gh-lb-target-img" src="" draggable="false"><canvas id="gh-lb-canvas" style="display:none;" draggable="false"></canvas></div><button class="gh-lb-btn gh-lb-nav gh-lb-next">' + icoAngleRight + '</button><div class="gh-lb-gif-bar"><button class="gh-lb-btn" id="gh-lb-gif-play" style="border-radius:50%;width:24px;height:24px;padding:0;justify-content:center;">' + icoPlay + '</button><input type="range" id="gh-lb-gif-seek" min="0" value="0"></div></div><div class="gh-lb-topbar"><div class="gh-lb-meta"><div id="gh-lb-caption">Loading...</div><div class="gh-lb-tech-info"><span id="gh-lb-dims">-</span><span id="gh-lb-format">IMG</span><span id="gh-lb-size">-</span></div></div><div class="gh-lb-controls"><div class="gh-lb-counter">0 / 0</div><button class="gh-lb-btn" id="gh-lb-goto-btn">' + icoBullseye + ' Go to</button><button class="gh-lb-btn" id="gh-lb-toggle-ui-btn">' + icoEyeSlash + ' Hide UI</button><button class="gh-lb-btn" id="gh-lb-fs-btn">' + icoExpand + ' Expand</button><button class="gh-lb-btn" id="gh-lb-help-btn">' + icoKeyboard + ' Shortcuts</button><button class="gh-lb-btn" id="gh-lb-close-btn">' + icoXmark + '</button></div></div><div class="gh-lb-thumbs-window"><div class="gh-lb-thumbs-container"></div></div><button class="gh-lb-btn" id="gh-lb-unhide-btn">' + icoEye + ' Show UI</button><div class="gh-lb-help-modal" id="gh-lb-help-modal"><div style="font-weight:bold;margin-bottom:10px;color:#58a6ff;text-align:center;">Keyboard Shortcuts</div><div class="gh-lb-help-row"><span>Next Image</span><span class="gh-lb-key">→</span></div><div class="gh-lb-help-row"><span>Prev Image</span><span class="gh-lb-key">←</span></div><div class="gh-lb-help-row"><span>Fullscreen</span><span class="gh-lb-key">F</span></div><div class="gh-lb-help-row"><span>Go to Location</span><span class="gh-lb-key">G</span></div><div class="gh-lb-help-row"><span>Toggle Menu Bar</span><span class="gh-lb-key">H</span></div><div class="gh-lb-help-row"><span>Close Gallery</span><span class="gh-lb-key">ESC</span></div></div>`;
    document.body.appendChild(overlay);

    const lbImg = document.getElementById('gh-lb-target-img');
    const lbCanvas = document.getElementById('gh-lb-canvas');
    const imgContainer = overlay.querySelector('.gh-lb-img-container');
    const thumbContainer = overlay.querySelector('.gh-lb-thumbs-container');
    const helpModal = document.getElementById('gh-lb-help-modal');
    const gifBar = overlay.querySelector('.gh-lb-gif-bar');
    const gifPlayBtn = document.getElementById('gh-lb-gif-play');
    const gifSeek = document.getElementById('gh-lb-gif-seek');
    const unhideBtn = document.getElementById('gh-lb-unhide-btn');

    // Block cascading clicks from controls to background overlay
    overlay.querySelector('.gh-lb-topbar').addEventListener('click', (e) => e.stopPropagation());
    overlay.querySelector('.gh-lb-thumbs-window').addEventListener('click', (e) => e.stopPropagation());
    helpModal.addEventListener('click', (e) => e.stopPropagation());
    gifBar.addEventListener('click', (e) => e.stopPropagation());
    gifSeek.addEventListener('click', (e) => e.stopPropagation());
    gifSeek.addEventListener('pointerdown', (e) => e.stopPropagation());
    gifSeek.addEventListener('pointerup', (e) => e.stopPropagation());
    unhideBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleUIVisibility(); });

    // Evaluates filter criteria based on rules setup (Strict Whitelist Logic)
    function shouldExclude(img) {
        if (!enableFilter) return false;
        try {
            const url = img.src;
            
            // Retrieve the original hostname, for example 'avatars.githubusercontent.com'
            const urlObj = new URL(url);
            const hostname = urlObj.hostname; 
            
            // Check the list of domains STRICTLY (must exactly match those in the array)
            const isDomainAllowed = includeDomains.includes(hostname);
            if (!isDomainAllowed) return true;

            // Check the extension list
            const ext = getCleanExtension(url);
            const isExtAllowed = includeExtensions.includes(ext);
            if (!isExtAllowed) return true;

            // If it passes all whitelist criteria, do not exclude
            return false;
        } catch(e) { return false; }
    }

    // Normalizes file extension across different formats and camo urls
    function getCleanExtension(url) {
        let ext = 'IMG';
        try {
            let targetUrl = url.split(/[?#]/)[0];
            if (url.includes('camo.githubusercontent.com')) {
                const segments = targetUrl.split('/');
                const lastHex = segments[segments.length - 1];
                if (/^[0-9a-fA-F]+$/.test(lastHex)) {
                    let decoded = '';
                    for (let i = 0; i < lastHex.length; i += 2) { decoded += String.fromCharCode(parseInt(lastHex.substr(i, 2), 16)); }
                    targetUrl = decoded.split(/[?#]/)[0];
                }
            }
            const foundExt = targetUrl.split('.').pop().toUpperCase();
            if (foundExt && foundExt.length < 5) ext = foundExt;
        } catch(e){}
        return ext;
    }

    // Resolves file name cleanly and filters out formatting formats
    function extractSmartTitle(img) {
        let title = img.alt || img.title || "";
        if (!title) {
            let src = img.getAttribute('data-canonical-src') || img.src;
            try {
                let cleanUrl = src.split(/[?#]/)[0];
                title = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
            } catch(e) { title = "Untitled Image"; }
        }
        return decodeURIComponent(title).replace(/\.[a-zA-Z0-9]+$/, '').trim() || "Untitled Image";
    }

    // Preloads neighboring images into browser memory cache
    function preloadAdjacentImages() {
        if (albumImages.length <= 1) return;
        const nextIdx = (currentIndex + 1) % albumImages.length;
        const prevIdx = (currentIndex - 1 + albumImages.length) % albumImages.length;
        [nextIdx, prevIdx].forEach(idx => {
            const cacheImg = new Image();
            cacheImg.src = albumImages[idx].src;
        });
    }

    function updateLightbox() {
        if (albumImages.length === 0) return;
        resetZoomAndDrag();
        stopGifPlayer();
        helpModal.classList.remove('active');

        const currentTarget = albumImages[currentIndex];
        const detectedExt = getCleanExtension(currentTarget.src);

        overlay.querySelector('.gh-lb-counter').textContent = `${currentIndex + 1} / ${albumImages.length}`;
        document.getElementById('gh-lb-caption').textContent = extractSmartTitle(currentTarget);

        lbImg.style.display = 'block';
        lbCanvas.style.display = 'none';
        gifBar.style.display = 'none';
        overlay.classList.remove('gif-active-mode');
        lbImg.src = currentTarget.src;

        if (detectedExt === 'GIF') {
            initGifPlayer(currentTarget.src);
        }

        const activeLoader = (detectedExt === 'GIF' && lbCanvas.style.display === 'block') ? lbCanvas : lbImg;
        const checkDims = () => {
            document.getElementById('gh-lb-dims').textContent = `${activeLoader.naturalWidth || activeLoader.width || 0} x ${activeLoader.naturalHeight || activeLoader.height || 0} px`;
            document.getElementById('gh-lb-format').textContent = detectedExt;
        };
        if (detectedExt === 'GIF') setTimeout(checkDims, 600); else lbImg.onload = checkDims;

        document.getElementById('gh-lb-size').textContent = '...';
        fetch(currentTarget.src, { method: 'HEAD' }).then(res => {
            const bytes = res.headers.get('content-length');
            if (bytes) {
                const kb = bytes / 1024;
                document.getElementById('gh-lb-size').textContent = kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : kb.toFixed(0) + " KB";
            } else { document.getElementById('gh-lb-size').textContent = '-'; }
        }).catch(() => document.getElementById('gh-lb-size').textContent = '-');

        overlay.querySelector('.gh-lb-prev').style.display = albumImages.length <= 1 ? 'none' : 'flex';
        overlay.querySelector('.gh-lb-next').style.display = albumImages.length <= 1 ? 'none' : 'flex';

        updateThumbnails();
        preloadAdjacentImages();
    }

    function fetchGifViaGM(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET", url: url, responseType: "arraybuffer",
                onload: (res) => { if (res.status >= 200 && res.status < 300) resolve(res.response); else reject(new Error()); },
                onerror: () => reject(new Error())
            });
        });
    }

    // Processes sequential custom loops for advanced GIF seekbars
    async function initGifPlayer(url) {
        const currentId = ++gifDecoderId;
        gifFrames = []; gifSeek.value = 0;
        const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
        try {
            if (isFirefox || !window.ImageDecoder) throw new Error();
            const arrayBuffer = await fetchGifViaGM(url);
            const decoder = new ImageDecoder({ data: arrayBuffer, type: 'image/gif' });
            await decoder.tracks.ready;
            const frameCount = decoder.tracks.selectedTrack.frameCount;
            if (frameCount === 0) throw new Error();

            const testResult = await decoder.decode({ frameIndex: 0 });
            const testCtx = lbCanvas.getContext('2d');
            testCtx.drawImage(testResult.image, 0, 0);
            testCtx.clearRect(0, 0, lbCanvas.width, lbCanvas.height);

            if (currentId !== gifDecoderId) return;
            overlay.classList.add('gif-active-mode');
            lbImg.style.display = 'none'; lbCanvas.style.display = 'block'; gifBar.style.display = 'flex';
            gifSeek.max = frameCount - 1;

            for (let i = 0; i < frameCount; i++) {
                if (currentId !== gifDecoderId) return;
                const result = await decoder.decode({ frameIndex: i });
                gifFrames.push({ bitmap: result.image, duration: result.image.duration / 1000 });
                if (i === 0) renderGifFrame(0);
            }
            gifPlaying = true; gifPlayBtn.innerHTML = icoPause; playGifLoop();
        } catch (e) {
            overlay.classList.remove('gif-active-mode');
            lbImg.style.display = 'block'; lbCanvas.style.display = 'none'; gifBar.style.display = 'none';
            lbImg.src = url;
        }
    }

    function renderGifFrame(idx) {
        if (!gifFrames[idx]) return;
        lbCanvas.width = gifFrames[idx].bitmap.width; lbCanvas.height = gifFrames[idx].bitmap.height;
        const ctx = lbCanvas.getContext('2d');
        ctx.clearRect(0, 0, lbCanvas.width, lbCanvas.height);
        ctx.drawImage(gifFrames[idx].bitmap, 0, 0);
        gifSeek.value = idx; currentGifFrame = idx;
    }

    function playGifLoop() {
        if (!gifPlaying || gifFrames.length === 0) return;
        renderGifFrame(currentGifFrame);
        const delay = gifFrames[currentGifFrame].duration || 100;
        gifTimeout = setTimeout(() => { currentGifFrame = (currentGifFrame + 1) % gifFrames.length; playGifLoop(); }, delay);
    }

    function stopGifPlayer() {
        gifPlaying = false; if (gifTimeout) clearTimeout(gifTimeout);
        gifFrames.forEach(f => f.bitmap.close && f.bitmap.close()); gifFrames = [];
    }

    gifPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); gifPlaying = !gifPlaying; gifPlayBtn.innerHTML = gifPlaying ? icoPause : icoPlay; if (gifPlaying) playGifLoop(); else if (gifTimeout) clearTimeout(gifTimeout); });
    gifSeek.addEventListener('input', (e) => { gifPlaying = false; gifPlayBtn.innerHTML = icoPlay; if (gifTimeout) clearTimeout(gifTimeout); renderGifFrame(parseInt(e.target.value)); });

    function applyTransform() {
        imgContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        if (scale > 1) overlay.classList.add('zoomed-mode'); else overlay.classList.remove('zoomed-mode');
    }

    function resetZoomAndDrag() { scale = 1; translateX = 0; translateY = 0; imgContainer.style.cursor = 'zoom-in'; applyTransform(); }

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

    overlay.addEventListener('wheel', (e) => {
        if (!overlay.classList.contains('active')) return;
        e.preventDefault(); scale = e.deltaY < 0 ? Math.min(scale + 0.15, 6) : Math.max(scale - 0.15, 1);
        if (scale === 1) { translateX = 0; translateY = 0; }
        imgContainer.style.cursor = scale > 1 ? 'grab' : 'zoom-in'; applyTransform();
    }, { passive: false });

    // Creates dynamic list arrays and renders first frame static snapshot for GIFs
    function buildThumbnails() {
        thumbContainer.innerHTML = '';
        albumImages.forEach((img, index) => {
            const ext = getCleanExtension(img.src);
            let thumb;

            if (ext === 'GIF') {
                thumb = document.createElement('canvas');
                thumb.className = 'gh-lb-thumb';
                thumb.width = 50;
                thumb.height = 34;
                const ctx = thumb.getContext('2d');
                const tempImg = new Image();
                tempImg.src = img.src;
                tempImg.onload = () => {
                    const imgRatio = tempImg.naturalWidth / tempImg.naturalHeight;
                    const canvasRatio = thumb.width / thumb.height;
                    let sx, sy, sw, sh;
                    if (imgRatio > canvasRatio) {
                        sh = tempImg.naturalHeight; sw = sh * canvasRatio; sy = 0; sx = (tempImg.naturalWidth - sw) / 2;
                    } else {
                        sw = tempImg.naturalWidth; sh = sw / canvasRatio; sx = 0; sy = (tempImg.naturalHeight - sh) / 2;
                    }
                    ctx.drawImage(tempImg, sx, sy, sw, sh, 0, 0, thumb.width, thumb.height);
                };
            } else {
                thumb = document.createElement('img');
                thumb.src = img.src;
                thumb.className = 'gh-lb-thumb';
                thumb.style.objectFit = 'cover';
            }

            thumb.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = index; updateLightbox(); });
            thumbContainer.appendChild(thumb);
        });
    }

    function updateThumbnails() {
        const thumbs = thumbContainer.querySelectorAll('.gh-lb-thumb');
        thumbs.forEach((t, idx) => {
            if (idx === currentIndex) { t.classList.add('active'); t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }
            else { t.classList.remove('active'); }
        });
    }

    function toggleUIVisibility() {
        const isHidden = overlay.classList.toggle('ui-hidden');
        document.getElementById('gh-lb-toggle-ui-btn').innerHTML = isHidden ? icoEye + ' Show UI' : icoEyeSlash + ' Hide UI';
    }

    function goToImageLocation(e) {
        if(e) e.stopPropagation();
        if (albumImages[currentIndex]) {
            albumImages[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            albumImages[currentIndex].style.outline = "4px solid #58a6ff";
            setTimeout(() => { albumImages[currentIndex].style.outline = ""; }, 1500);
        }
        closeLightbox();
    }

    function toggleFullscreen(e) {
        if(e) e.stopPropagation();
        const fsBtn = document.getElementById('gh-lb-fs-btn');
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
        if (helpModal.classList.contains('active')) { helpModal.classList.remove('active'); return; }
        if (overlay.classList.contains('ui-hidden')) { toggleUIVisibility(); return; }
        overlay.classList.remove('active'); overlay.classList.remove('ui-hidden');
        document.getElementById('gh-lb-toggle-ui-btn').innerHTML = icoEyeSlash + ' Hide UI';
        document.body.style.overflow = ''; if (document.fullscreenElement) document.exitFullscreen();
        stopGifPlayer(); lbImg.src = '';
    }

    // Capture click events inside markdown container anchors with internal URL regex filtering
    document.addEventListener('click', function(event) {
        const repoUrlRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?(?:\?|#|$)/;
        if (!repoUrlRegex.test(window.location.href)) {
            return;
        }

        const targetImg = event.target.closest('.markdown-body img');
        if (targetImg && !shouldExclude(targetImg)) {
            event.preventDefault(); event.stopPropagation();
            const container = targetImg.closest('.markdown-body');
            albumImages = Array.from(container.querySelectorAll('img')).filter(img => img.offsetWidth > 32 && img.offsetHeight > 32 && !shouldExclude(img));
            currentIndex = albumImages.indexOf(targetImg);
            if (currentIndex === -1) currentIndex = 0;
            openLightbox(); buildThumbnails(); updateLightbox();
        }
    }, true);

    document.getElementById('gh-lb-close-btn').addEventListener('click', (e) => { e.stopPropagation(); overlay.classList.remove('ui-hidden'); closeLightbox(); });
    document.getElementById('gh-lb-goto-btn').addEventListener('click', goToImageLocation);
    document.getElementById('gh-lb-toggle-ui-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleUIVisibility(); });
    document.getElementById('gh-lb-fs-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('gh-lb-help-btn').addEventListener('click', (e) => { e.stopPropagation(); helpModal.classList.toggle('active'); });

    // Strict boundary validation to prevent cross-bubbling overlay closure leaks
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('gh-lb-main-view') || e.target.classList.contains('gh-lb-img-container')) {
            closeLightbox();
        }
    });

    overlay.querySelector('.gh-lb-prev').addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + albumImages.length) % albumImages.length; updateLightbox(); });
    overlay.querySelector('.gh-lb-next').addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % albumImages.length; updateLightbox(); });

    document.addEventListener('keydown', function(event) {
        if (!overlay.classList.contains('active')) return;
        if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); return; }
        const key = event.key.toLowerCase();
        if (event.key === 'Escape') { overlay.classList.remove('ui-hidden'); closeLightbox(); }
        else if (key === 'h') { toggleUIVisibility(); }
        else if (key === 'g') { goToImageLocation(event); }
        else if (key === 'f') { toggleFullscreen(event); }
        else if (event.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % albumImages.length; updateLightbox(); }
        else if (event.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + albumImages.length) % albumImages.length; updateLightbox(); }
    });
})();
