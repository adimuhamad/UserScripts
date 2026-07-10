// ==UserScript==
// @name         No Click YT Profile
// @namespace    NoClickProfileClearURLs
// @version      2.3
// @description  Prevents accidental profile clicks in YouTube comments and seamlessly handles navigation and URL tracking parameters.
// @author       MochAdiMR
// @match        https://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @license      MIT
// @supportURL   https://buymeacoffee.com/mochadimr
// @homepageURL  https://github.com/adimuhamad/
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";

    // --- 1. CONFIGURATION ---
    const CONFIG = {
        // Toggle URL Cleaner feature (true = active, false = disabled)
        ENABLE_URL_CLEANER: true,
        
        // Target parameters to strip from the URL (Reverted to v1.5 structure)
        URL_PARAMS_TO_REMOVE: ["list", "index", "pp", "si"],
        
        SEL: {
            CONTAINER: "ytd-comment-view-model",
            TEXT: "#content-text",
            AUTHOR: "#author-text span",
            HEADER: "ytd-comments-header-renderer #additional-section",
            THREAD: "ytd-comment-thread-renderer",
            REPLIES: "#replies",
            TARGET: "ytd-comments"
        },
        
        MESSAGES: {
            CONFIRM_NAV: "You clicked a user profile,<br>Are you want to navigate away?"
        }
    };

    // --- 2. MODULE: CUSTOM MODAL UI ---
    const ModalUI = {
        element: null,
        targetUrl: "",
        
        init: () => {
            if (document.getElementById("no-click-yt-modal")) return;

            const style = document.createElement("style");
            style.textContent = `#no-click-yt-modal{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgb(0 0 0 / .6);display:none;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(2px);font-family:"Roboto",Arial,sans-serif}.no-click-box{background:var(--yt-spec-raised-background,#212121);color:var(--yt-spec-text-primary,#fff);padding:24px;border-radius:12px;max-width:350px;text-align:center;box-shadow:0 4px 24px rgb(0 0 0 / .25);border:1px solid var(--yt-spec-10-percent-layer,#3d3d3d)}.no-click-msg{margin:0 0 24px 0;font-size:15px;line-height:1.5}.no-click-btn-container{display:flex;gap:12px;justify-content:center}.no-click-btn{border:none;padding:10px 20px;border-radius:18px;cursor:pointer;font-weight:600;font-size:14px;transition:background 0.2s,opacity 0.2s}.no-click-btn-cancel{background:#fff0;color:var(--yt-spec-text-primary,#fff)}.no-click-btn-cancel:hover{background:var(--yt-spec-10-percent-layer,rgb(255 255 255 / .1))}.no-click-btn-confirm{background:var(--yt-spec-call-to-action,#3ea6ff);color:var(--yt-spec-text-primary-inverse,#0f0f0f)}.no-click-btn-confirm:hover{opacity:.85}`;
            document.head.appendChild(style);

            const overlay = document.createElement("div");
            overlay.id = "no-click-yt-modal";
            overlay.innerHTML = `<div class="no-click-box"><p class="no-click-msg">${CONFIG.MESSAGES.CONFIRM_NAV}</p><div class="no-click-btn-container"><button id="no-click-btn-cancel" class="no-click-btn no-click-btn-cancel">Cancel</button><button id="no-click-btn-confirm" class="no-click-btn no-click-btn-confirm">Leave</button></div></div>`;

            overlay.querySelector("#no-click-btn-cancel").addEventListener("click", ModalUI.hide);
            overlay.querySelector("#no-click-btn-confirm").addEventListener("click", () => {
                window.location.href = ModalUI.targetUrl;
            });

            const appendInterval = setInterval(() => {
                if (document.body) {
                    document.body.appendChild(overlay);
                    ModalUI.element = overlay;
                    clearInterval(appendInterval);
                }
            }, 100);
        },
        
        show: (url) => {
            ModalUI.targetUrl = url;
            if (ModalUI.element) ModalUI.element.style.display = "flex";
        },
        
        hide: () => {
            if (ModalUI.element) ModalUI.element.style.display = "none";
        }
    };

    // --- 3. MODULE: PROFILE GUARD ---
    const ProfileGuard = {
        isProfileLink: (anchor) => {
            const path = anchor.pathname;
            return path.startsWith("/@") || path.startsWith("/channel/") || path.startsWith("/user/");
        },
        
        handleClick: (event) => {
            if (event.shiftKey) return;

            const linkElement = event.target.closest("a");
            if (!linkElement || !linkElement.href) return;

            if (ProfileGuard.isProfileLink(linkElement)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                ModalUI.show(linkElement.href);
            }
        },
        
        init: () => {
            const observer = new MutationObserver((mutations, obs) => {
                const commentSection = document.querySelector(CONFIG.SEL.TARGET);
                
                if (commentSection) {
                    commentSection.addEventListener("click", ProfileGuard.handleClick, true);
                    obs.disconnect(); 
                }
            });

            if (document.documentElement) {
                observer.observe(document.documentElement, { childList: true, subtree: true });
            }
        }
    };

    // --- 4. MODULE: URL CLEANER ---
    const UrlCleaner = {
        clean: () => {
            try {
                const currentUrl = new URL(window.location.href);
                let isDirty = false;

                CONFIG.URL_PARAMS_TO_REMOVE.forEach((param) => {
                    if (currentUrl.searchParams.has(param)) {
                        currentUrl.searchParams.delete(param);
                        isDirty = true;
                    }
                });

                if (isDirty) {
                    window.location.replace(currentUrl.toString());
                }
            } catch (e) {
                // Errors suppressed to keep console clean
            }
        },
        
        init: () => {
            if (!CONFIG.ENABLE_URL_CLEANER) return;

            UrlCleaner.clean();
            window.addEventListener("yt-navigate-finish", UrlCleaner.clean);
        }
    };

    // --- 5. INITIALIZATION ---
    // Execution order restored: Cleaner is prioritized first like in v1.5
    UrlCleaner.init();
    ModalUI.init();
    ProfileGuard.init();

})();
