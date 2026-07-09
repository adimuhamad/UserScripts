// ==UserScript==
// @name         No Click YT Profile
// @namespace    NoClickProfileClearURLs
// @version      1.7
// @description  Prevents accidental profile clicks in YouTube comments and seamlessly cleans tracking parameters from URLs.
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
    // Centralized config for easy maintenance
    const CONFIG = {
        // Target parameters to strip from the URL
        PARAMS_TO_REMOVE: ["list", "index", "pp", "si"],
        
        // Target CSS selectors to identify the comment section
        COMMENT_SELECTORS: ["#comments", "ytd-comments", "ytd-comment-thread-renderer"],
        
        // Alert messages for user interaction
        MESSAGES: {
            CONFIRM_NAV: "You clicked a user profile in the comments.\n\nAre you sure you want to navigate away?"
        }
    };

    // --- 2. MODULE: URL CLEANER ---
    // Handles the detection and removal of unwanted URL parameters
    const UrlCleaner = {
        clean: () => {
            try {
                // Parse current URL
                const currentUrl = new URL(window.location.href);
                let isDirty = false;

                // Check and remove specified parameters
                CONFIG.PARAMS_TO_REMOVE.forEach((param) => {
                    if (currentUrl.searchParams.has(param)) {
                        currentUrl.searchParams.delete(param);
                        isDirty = true; // Flag if URL needs changing
                    }
                });

                // Apply changes if unwanted parameters were found
                if (isDirty) {
                    // Reloads the page with the clean URL and prevents back-button loops
                    window.location.replace(currentUrl.toString());
                    console.log("[Cleaner] URL parameters cleaned and page reloaded.");
                }
            } catch (e) {
                console.error("[Cleaner] Error processing URL:", e);
            }
        },
        
        init: () => {
            // Run initially on script load
            UrlCleaner.clean();
            
            // Listen for YouTube's specific SPA (Single Page Application) navigation events
            window.addEventListener("yt-navigate-finish", UrlCleaner.clean);
        }
    };

    // --- 3. MODULE: PROFILE GUARD ---
    // Intercepts and guards profile clicks within the comment section
    const ProfileGuard = {
        // Checks if the clicked element lives inside a comment container
        isInsideComments: (el) => CONFIG.COMMENT_SELECTORS.some(sel => el.closest(sel)),
        
        // Checks if the hyperlink destination is a user or channel profile
        isProfileLink: (anchor) => {
            const path = anchor.pathname;
            return path.startsWith("/@") || path.startsWith("/channel/") || path.startsWith("/user/");
        },
        
        // Main click event interceptor
        handleClick: (event) => {
            // Allow bypass if the user holds the Shift key
            if (event.shiftKey) return;

            // Find the closest anchor <a> tag from the clicked target
            const linkElement = event.target.closest("a");
            if (!linkElement || !linkElement.href) return;

            // Validate both conditions: Is it a profile link AND in the comments?
            if (ProfileGuard.isProfileLink(linkElement) && ProfileGuard.isInsideComments(linkElement)) {
                
                // Immediately halt YouTube's default click behavior
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                // Prompt user for confirmation before navigating
                if (confirm(CONFIG.MESSAGES.CONFIRM_NAV)) {
                    window.location.href = linkElement.href;
                }
            }
        },
        
        init: () => {
            // Use capture phase (true) to intercept the click BEFORE YouTube's own scripts do
            document.addEventListener("click", ProfileGuard.handleClick, true);
        }
    };

    // --- 4. INITIALIZATION ---
    // Boot up both modules
    UrlCleaner.init();
    ProfileGuard.init();

})();
