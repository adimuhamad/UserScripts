// ==UserScript==
// @name         YouTube Comment Filter
// @namespace    YT Comment Filter (Improved)
// @version      7.1
// @description  Automatically hide YouTube comments based on username, specific keywords, and spam text patterns. Features Dual-Mode Observer, Live Sync, and Data Export/Import.
// @author       MochAdiMR (Refactored)
// @match        https://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @license      MIT
// @supportURL   https://buymeacoffee.com/mochadimr
// @homepageURL  https://github.com/adimuhamad/
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    // --- Configuration & Selectors ---
    const CONFIG = {
        USERS: "yt_filter_custom_words", KEYWORDS: "yt_filter_custom_content_keywords", MODE: "yt_filter_observer_mode",
        DEF_USERS: ["vip"], DEF_KEYS: ["pulauwin"], DEF_MODE: "efficient",
        SEL: { CONTAINER: "ytd-comment-view-model", TEXT: "#content-text", AUTHOR: "#author-text span", HEADER: "ytd-comments-header-renderer #additional-section", THREAD: "ytd-comment-thread-renderer", REPLIES: "#replies", TARGET: "ytd-comments" },
        REGEX_NON_LATIN: /[^\u0000-\u007F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u0250-\u02AF\u02B0-\u02FF\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u0530-\u058F\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u07C0-\u07FF\u0800-\u083F\u0840-\u085F\u0860-\u087F\u08A0-\u08FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u10A0-\u10FF\u1100-\u11FF\u1200-\u125F\u1280-\u12BF\u13A0-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1900-\u194F\u1950-\u197F\u1980-\u19DF\u19E0-\u19FF\u1A00-\u1A1F\u1A20-\u1A5F\u1A80-\u1AFF\u1B00-\u1B7F\u1B80-\u1BBF\u1BC0-\u1BFF\u1C00-\u1C4F\u1C50-\u1C7F\u1C90-\u1CBF\u1CC0-\u1CCF\u1CD0-\u1CFF\u1E00-\u1EFF\u1F00-\u1FFF\u2000-\u206F\u2070-\u20CF\u20D0-\u20FF\u2150-\u218F\u2C60-\u2C7F\u2C80-\u2CFF\u2D00-\u2D2F\u2D30-\u2D7F\u2D80-\u2DDF\u2DE0-\u2DFF\u2E00-\u2E7F\u2E80-\u2EFF\u2F00-\u2FDF\u2FF0-\u2FFF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u3100-\u312F\u3130-\u318F\u3190-\u319F\u31A0-\u31BF\u31C0-\u31EF\u31F0-\u31FF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uA4D0-\uA4FF\uA500-\uA63F\uA640-\uA69F\uA6A0-\uA6FF\uA700-\uA71F\uA720-\uA7FF\uA800-\uA82F\uA830-\uA83F\uA840-\uA87F\uA880-\uA8DF\uA8E0-\uA8FF\uA900-\uA92F\uA930-\uA95F\uA960-\uA97F\uA980-\uA9DF\uA9E0-\uA9FF\uAA00-\uAA3F\uAA40-\uAA6F\uAA70-\uAAAB\uAAAC-\uAAAF\uAAB0-\uAABF\uAAC0-\uAADF\uAAE0-\uAAEF\uAAF0-\uAAFF\uAB00-\uAB2F\uAB30-\uAB6F\uAB70-\uABBF\uABC0-\uABFF\uAC00-\uD7AF\uD7B0-\uD7FF\uF900-\uFAFF\uFB00-\uFB4F\uFB50-\uFDFF\uFE00-\uFE0F\uFE10-\uFE1F\uFE20-\uFE2F\uFE30-\uFE4F\uFE50-\uFE6F\uFE70-\uFEFF]/
    };

    const State = { isShowingHidden: false, userRegex: null, contentRegex: null, mode: "efficient" };

    const Utils = {
        debounce: (f, w) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), w); }; },
        throttle: (f, l) => { let wait = false; return (...a) => { if (!wait) { f(...a); wait = true; setTimeout(() => wait = false, l); } }; },
        leet: (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/a/gi, "[a4@]").replace(/i/gi, "[i1l]").replace(/e/gi, "[e3]").replace(/o/gi, "[o0]").replace(/s/gi, "[s5$]").replace(/t/gi, "[t7+]").replace(/g/gi, "[g9]")
    };

    function loadSettings() {
        State.mode = GM_getValue(CONFIG.MODE, CONFIG.DEF_MODE);
        const loadRe = (k, def) => {
            const all = [...new Set([...def, ...(GM_getValue(k, "").split(",").map(w => w.trim()).filter(Boolean))])];
            // Match with word boundaries and evaluate leet-speak patterns
            return all.length ? new RegExp("(?:^|\\s|\\W)(" + all.map(Utils.leet).join("|") + ")(?:\\s|\\W|$)", "i") : null;
        };
        State.userRegex = loadRe(CONFIG.USERS, CONFIG.DEF_USERS);
        State.contentRegex = loadRe(CONFIG.KEYWORDS, CONFIG.DEF_KEYS);
    }

    const Filter = {
        // Evaluate all comments against spam patterns and toggle visibility
        process: () => {
            const comments = document.querySelectorAll(CONFIG.SEL.CONTAINER);
            let hidden = 0;
            comments.forEach(c => {
                const text = c.querySelector(CONFIG.SEL.TEXT)?.innerText || "";
                const user = c.querySelector(CONFIG.SEL.AUTHOR)?.innerText || "";
                const isSpam = CONFIG.REGEX_NON_LATIN.test(text) || State.userRegex?.test(user) || State.contentRegex?.test(text);

                c.classList.toggle("yt-hidden", isSpam);
                c.style.display = isSpam && !State.isShowingHidden ? "none" : "";

                // Hide replies if parent comment is flagged
                if (c.id === "comment") {
                    const replies = c.closest(CONFIG.SEL.THREAD)?.querySelector(CONFIG.SEL.REPLIES);
                    if (replies) replies.style.display = isSpam && !State.isShowingHidden ? "none" : "";
                }
                if (isSpam) hidden++;
            });
            UI.updateBtn(hidden, comments.length);
        }
    };

    const UI = {
        injectCSS: () => {
            // Minified CSS Styles
            GM_addStyle(`:root{--ytf-bg:#ffffff;--ytf-txt:#0f0f0f;--ytf-txt-sec:#606060;--ytf-border:#e5e5e5;--ytf-btn-bg:#f2f2f2;--ytf-input:#f9f9f9;--ytf-prim:#3ea6ff;--ytf-danger:#ff4e45}html[dark],html[dark="true"],ytd-app[dark]{--ytf-bg:#212121;--ytf-txt:#f1f1f1;--ytf-txt-sec:#aaaaaa;--ytf-border:#3e3e3e;--ytf-btn-bg:#303030;--ytf-input:#121212}@media (prefers-color-scheme: dark){:root:not([dark="false"]){--ytf-bg:#212121;--ytf-txt:#f1f1f1;--ytf-txt-sec:#aaaaaa;--ytf-border:#3e3e3e;--ytf-btn-bg:#303030;--ytf-input:#121212}}.ytf-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;font-family:Roboto,Arial,sans-serif}.ytf-modal{background:var(--ytf-bg);color:var(--ytf-txt);border-radius:12px;padding:24px;width:480px;max-width:90vw;max-height:85vh;overflow-y:auto;box-shadow:0 10px 25px rgba(0,0,0,0.5)}.ytf-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.ytf-header h2{margin:0;font-size:20px;font-weight:500}.ytf-close{background:none;border:none;cursor:pointer;padding:4px;fill:var(--ytf-txt)}.ytf-label{display:block;margin-bottom:8px;font-size:13px;font-weight:500}.ytf-textarea{width:100%;height:80px;background:var(--ytf-input);color:var(--ytf-txt);border:1px solid var(--ytf-border);border-radius:8px;padding:10px;margin-bottom:16px;font-family:monospace;font-size:13px;resize:vertical;box-sizing:border-box;outline:none}.ytf-textarea:focus{border-color:var(--ytf-prim)}.ytf-actions{display:flex;justify-content:space-between;align-items:center;margin-top:12px}.ytf-actions-group{display:flex;gap:8px}.ytf-btn{padding:8px 16px;border-radius:18px;cursor:pointer;font-weight:500;border:none;font-size:14px}.ytf-btn-small{font-size:12px;padding:6px 12px}.ytf-btn-out{background:transparent;color:var(--ytf-txt);border:1px solid var(--ytf-border)}.ytf-btn-out:hover{background:var(--ytf-btn-bg)}.ytf-btn-danger{background:transparent;color:var(--ytf-danger);border:1px solid var(--ytf-danger)}.ytf-btn-danger:hover{background:var(--ytf-danger);color:#fff}.ytf-btn-prim{background:var(--ytf-prim);color:#0f0f0f;font-weight:600}.yt-hidden{display:none}body.show-hidden .yt-hidden{display:block!important;opacity:0.6;border:1px dashed rgba(255,0,0,0.5);border-radius:8px;margin-bottom:8px!important}#ytf-toggle{display:inline-flex;align-items:center;cursor:pointer;font-family:Roboto,Arial,sans-serif;font-size:14px;font-weight:500;color:var(--ytf-txt);fill:var(--ytf-txt);margin-left:32px;position:relative;bottom:3px}`);
        },
        showModal: (html, bindEvents) => {
            document.getElementById('ytf-wrap')?.remove();
            const wrap = document.createElement("div");
            wrap.id = "ytf-wrap"; wrap.className = "ytf-overlay";
            // Minified UI Modal Template
            wrap.innerHTML = `<div class="ytf-modal"><div class="ytf-header"><h2 id="ytf-title"></h2><button id="ytf-close" class="ytf-close"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div><div id="ytf-body">${html}</div></div>`;
            document.body.appendChild(wrap);
            const close = () => wrap.remove();
            document.getElementById('ytf-close').onclick = close;
            document.addEventListener('keydown', function esc(e) { if(e.key === "Escape"){ close(); document.removeEventListener('keydown', esc); } });
            bindEvents(close);
        },
        openSettings: () => {
            // Minified Settings Interface
            UI.showModal(`<label class="ytf-label">Blocked Usernames</label><textarea id="ytf-users" class="ytf-textarea" placeholder="Example: login, browser">${GM_getValue(CONFIG.USERS, "")}</textarea><label class="ytf-label">Blocked Keywords (Content)</label><textarea id="ytf-keys" class="ytf-textarea" placeholder="Example: pulauwin">${GM_getValue(CONFIG.KEYWORDS, "")}</textarea><div class="ytf-actions"><div class="ytf-actions-group"><button id="ytf-exp" class="ytf-btn ytf-btn-out ytf-btn-small">Export</button><button id="ytf-imp" class="ytf-btn ytf-btn-out ytf-btn-small">Import</button></div><div class="ytf-actions-group"><button id="ytf-rst" class="ytf-btn ytf-btn-danger">Reset Filters</button><button id="ytf-sv" class="ytf-btn ytf-btn-prim">Save Changes</button></div></div>`, (close) => {
                document.getElementById('ytf-title').innerText = "Filter Configuration";
                document.getElementById('ytf-users').focus();

                // Button Events
                document.getElementById('ytf-exp').onclick = () => { prompt("Please copy your configuration data:", JSON.stringify({ u: GM_getValue(CONFIG.USERS, ""), k: GM_getValue(CONFIG.KEYWORDS, "") })); };
                document.getElementById('ytf-imp').onclick = () => { const data = prompt("Paste your JSON format data here:"); if(data) try { const p = JSON.parse(data); if(p.u !== undefined) document.getElementById('ytf-users').value = p.u; if(p.k !== undefined) document.getElementById('ytf-keys').value = p.k; alert("✅ Data successfully imported! Click 'Save Changes' to apply."); } catch(e) { alert("❌ Invalid JSON Data Format!"); } };
                document.getElementById('ytf-rst').onclick = () => UI.openConfirm("Reset All Filters?", "This will delete all custom usernames and keywords.<br>Are you sure?", "Yes, Reset", () => { GM_setValue(CONFIG.USERS, ""); GM_setValue(CONFIG.KEYWORDS, ""); loadSettings(); Filter.process(); close(); });
                document.getElementById('ytf-sv').onclick = () => { GM_setValue(CONFIG.USERS, document.getElementById('ytf-users').value); GM_setValue(CONFIG.KEYWORDS, document.getElementById('ytf-keys').value); loadSettings(); Filter.process(); close(); };
            });
        },
        openConfirm: (title, msg, btnText, onConfirm) => {
            // Minified Confirm Dialog Interface
            UI.showModal(`<p style="color:var(--ytf-txt-sec);line-height:1.6;font-size:14px;margin:0 0 16px 0;">${msg}</p><div class="ytf-actions" style="justify-content:flex-end;"><div class="ytf-actions-group"><button id="ytf-c-no" class="ytf-btn ytf-btn-out">Cancel</button><button id="ytf-c-yes" class="ytf-btn ytf-btn-prim">${btnText}</button></div></div>`, (close) => {
                document.getElementById('ytf-title').innerText = title;
                document.getElementById('ytf-c-no').onclick = close;
                document.getElementById('ytf-c-yes').onclick = () => { onConfirm(); close(); };
            });
        },
        createBtn: () => {
            const target = document.querySelector(CONFIG.SEL.HEADER);
            if (document.getElementById("ytf-toggle") || !target) return;
            // Minified Button SVG Injection
            target.insertAdjacentHTML('afterend', `<span id="ytf-toggle"><svg id="ytf-on" style="width:24px;height:24px;fill:currentColor;margin-right:4px" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.04 0-5.5-2.46-5.5-5.5S8.96 6.5 12 6.5s5.5 2.46 5.5 5.5-2.46 5.5-5.5 5.5zm0-9c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z"/></svg><svg id="ytf-off" style="width:24px;height:24px;fill:currentColor;margin-right:4px;display:none" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L21.73 23 23 21.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.93 1.57 3.5 3.5 3.5.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-3.04 0-5.5-2.46-5.5-5.5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.93-1.57-3.5-3.5-3.5l-.16.02z"/></svg><span>Hidden </span><strong id="ytf-status" style="margin:0 4px">ON</strong><span id="ytf-info">(0/0)</span></span>`);
            document.getElementById("ytf-toggle").onclick = () => {
                State.isShowingHidden = !State.isShowingHidden;
                document.body.classList.toggle("show-hidden", State.isShowingHidden);
                Filter.process();
            };
        },
        updateBtn: (h, t) => {
            if (!document.getElementById("ytf-toggle")) return;
            document.getElementById("ytf-status").innerText = State.isShowingHidden ? "OFF" : "ON";
            document.getElementById("ytf-info").style.display = State.isShowingHidden ? "none" : "inline";
            document.getElementById("ytf-info").innerText = `(${h}/${t})`;
            document.getElementById("ytf-on").style.display = State.isShowingHidden ? "none" : "block";
            document.getElementById("ytf-off").style.display = State.isShowingHidden ? "block" : "none";
        }
    };

    const Observer = {
        obs: null,
        start: () => {
            // Targeted observer: Only monitor the comments section to save CPU resources
            const target = document.querySelector(CONFIG.SEL.TARGET);
            if (target) {
                if (Observer.obs) Observer.obs.disconnect();
                const fn = State.mode === "fast" ? Utils.throttle(Filter.process, 1000) : Utils.debounce(Filter.process, 500);
                Observer.obs = new MutationObserver(fn);
                Observer.obs.observe(target, { childList: true, subtree: true });
            } else {
                // Keep checking if the comments section hasn't loaded yet
                setTimeout(Observer.start, 2000);
            }
        }
    };

    const init = () => {
        loadSettings(); UI.injectCSS();

        // Register Script Manager Menus
        GM_registerMenuCommand("⚙️ Configure Filter Settings", UI.openSettings);
        GM_registerMenuCommand("🔁 Switch Observer Mode", () => {
            const currentMode = State.mode.toUpperCase();
            const targetMode = currentMode === "EFFICIENT" ? "FAST" : "EFFICIENT";
            const desc = targetMode === "FAST"
                ? "Comments will disappear instantly, but browser CPU usage may increase slightly."
                : "Saves battery and CPU usage. Comments disappear after scroll stops.";

            UI.openConfirm("Switch Observer Mode?", `Current Mode: <b>${currentMode}</b><br><br>Do you want to switch to <b>${targetMode}</b> mode?<br>${desc}`, `Switch to ${targetMode}`, () => {
                GM_setValue(CONFIG.MODE, targetMode.toLowerCase());
                loadSettings(); Observer.start();
            });
        });
        GM_registerMenuCommand("👁️‍🗨️ Toggle Button Check", UI.createBtn);

        // Enable Cross-Tab Live Sync if supported by the script manager
        if (typeof GM_addValueChangeListener === "function") {
            const reloadProcess = () => { loadSettings(); Filter.process(); };
            GM_addValueChangeListener(CONFIG.USERS, reloadProcess);
            GM_addValueChangeListener(CONFIG.KEYWORDS, reloadProcess);
            GM_addValueChangeListener(CONFIG.MODE, () => { loadSettings(); Observer.start(); });
        }

        // Wait for page elements to load, then inject components
        const i = setInterval(() => { if (document.querySelector(CONFIG.SEL.HEADER)) { UI.createBtn(); clearInterval(i); } }, 2000);
        Observer.start(); setTimeout(Filter.process, 2000);
    };
    init();
})();
