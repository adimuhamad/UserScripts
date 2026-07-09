// ==UserScript==
// @name         No Click YT Profile
// @namespace    NoClickProfileClearURLs
// @version      2.0
// @description  Prevents accidental profile clicks with a custom modal UI and cleans tracking parameters from URLs.
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

    // Configuration
    const CONFIG = {
        PARAMS_TO_REMOVE: ["list", "index", "pp", "si"],
        
        // Imported comprehensive selectors
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
            CONFIRM_NAV: "You clicked a user profile in the comments.\nAre you sure you want to navigate away?"
        }
    };

    // Custom Modal UI
    const ModalUI = {
        element: null,
        targetUrl: "",
        
        init: () => {
            // Prevent duplicate modals
            if (document.getElementById("no-click-yt-modal")) return;

            // Overlay wrapper
            const overlay = document.createElement("div");
            overlay.id = "no-click-yt-modal";
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.7); display: none; align-items: center;
                justify-content: center; z-index: 999999; backdrop-filter: blur(2px);
                font-family: 'Roboto', Arial, sans-serif;
            `;

            // Modal dialog box
            const box = document.createElement("div");
            box.style.cssText = `
                background: #212121; color: #fff; padding: 24px; border-radius: 12px;
                max-width: 350px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.5);
                border: 1px solid #3d3d3d;
            `;

            // Message text
            const message = document.createElement("p");
            message.innerText = CONFIG.MESSAGES.CONFIRM_NAV;
            message.style.cssText = "margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #f1f1f1;";

            // Buttons container
            const btnContainer = document.createElement("div");
            btnContainer.style.cssText = "display: flex; gap: 12px; justify-content: center;";

            // Cancel button
            const btnCancel = document.createElement("button");
            btnCancel.innerText = "Cancel";
            btnCancel.style.cssText = `
                background: transparent; color: #f1f1f1; border: none; padding: 10px 20px;
                border-radius: 18px; cursor: pointer; font-weight: 600; font-size: 14px;
            `;
            btnCancel.onmouseover = () => btnCancel.style.background = "#3d3d3d";
            btnCancel.onmouseout = () => btnCancel.style.background = "transparent";
            btnCancel.onclick = () => ModalUI.hide();

            // Leave/Confirm button
            const btnConfirm = document.createElement("button");
            btnConfirm.innerText = "Leave";
            btnConfirm.style.cssText = `
                background: #3ea6ff; color: #0f0f0f; border: none; padding: 10px 20px;
                border-radius: 18px; cursor: pointer; font-weight: 600; font-size: 14px;
            `;
            btnConfirm.onmouseover = () => btnConfirm.style.background = "#65b8ff";
            btnConfirm.onmouseout = () => btnConfirm.style.background = "#3ea6ff";
            btnConfirm.onclick = () => { window.location.href = ModalUI.targetUrl; };

            // Assemble modal
            btnContainer.append(btnCancel, btnConfirm);
            box.append(message, btnContainer);
            overlay.append(box);

            // Inject safely into the DOM once body is available
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

    // URL Cleaner
    const UrlCleaner = {
        clean: () => {
            try {
                const currentUrl = new URL(window.location.href);
                let isDirty = false;

                CONFIG.PARAMS_TO_REMOVE.forEach((param) => {
                    if (currentUrl.searchParams.has(param)) {
                        currentUrl.searchParams.delete(param);
                        isDirty = true;
                    }
                });

                if (isDirty) {
                    // Force a reload with the clean URL to prevent back-button loops
                    window.location.replace(currentUrl.toString());
                }
            } catch (e) {
                console.error("URL Cleaner Error:", e);
            }
        },
        
        init: () => {
            UrlCleaner.clean();
            window.addEventListener("yt-navigate-finish", UrlCleaner.clean);
        }
    };

    // Profile Guard
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
                // Intercept click and show custom UI
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                ModalUI.show(linkElement.href);
            }
        },
        
        init: () => {
            // Observe the DOM until the main comments section appears
            const observer = new MutationObserver((mutations, obs) => {
                const commentSection = document.querySelector(CONFIG.SEL.TARGET);
                
                if (commentSection) {
                    // Found the comment section! Attach scoped listener and stop observing
                    commentSection.addEventListener("click", ProfileGuard.handleClick, true);
                    obs.disconnect();
                }
            });

            // Start observing safely
            if (document.documentElement) {
                observer.observe(document.documentElement, { childList: true, subtree: true });
            }
        }
    };

    // Initialize all modules
    ModalUI.init();
    UrlCleaner.init();
    ProfileGuard.init();

})();
