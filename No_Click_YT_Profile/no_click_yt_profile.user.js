// ==UserScript==
// @name         No Click Profile & ClearURLs
// @namespace    No Click Profile & ClearURLs
// @version      1.5
// @description  pencegah klik profil di kolom komentar dan pembersih parameter URL
// @author       MochAdiMR
// @match        https://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @license      MIT
// @compatible   chrome
// @compatible   firefox
// @compatible   edge
// @compatible   opera
// @compatible   safari
// @supportURL   https://buymeacoffee.com/mochadimr
// @homepageURL  https://github.com/adimuhamad/
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";

    // --- 1. CONFIGURATION ---
    const CONFIG = {
        // Parameter URL yang akan dihapus
        URL_PARAMS_TO_REMOVE: ["list", "index", "pp", "si"],

        // Selector untuk mendeteksi area komentar (bisa ditambah jika YouTube update struktur)
        COMMENT_SECTION_SELECTORS: ["#comments", "ytd-comments", "ytd-comment-thread-renderer"],

        // Pesan konfirmasi
        MESSAGES: {
            CONFIRM_NAV: "Anda mengklik profil pengguna di komentar.\n\nApakah Anda yakin ingin pindah halaman?"
        }
    };

    // --- 2. MODULE: URL CLEANER ---
    const UrlCleaner = {
        /**
         * Membersihkan parameter URL yang tidak diinginkan
         */
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
                    // Gunakan replace() agar user tidak bisa menekan tombol Back ke URL kotor
                    window.location.replace(currentUrl.toString());
                    console.log("[Cleaner] URL parameters cleaned.");
                }
            } catch (e) {
                console.error("[Cleaner] Error processing URL:", e);
            }
        },

        init: () => {
            // Jalankan saat script dimuat
            UrlCleaner.clean();

            // Jalankan setiap kali YouTube selesai navigasi (SPA navigation)
            window.addEventListener("yt-navigate-finish", UrlCleaner.clean);
        }
    };

    // --- 3. MODULE: PROFILE GUARD ---
    const ProfileGuard = {
        /**
         * Mengecek apakah elemen berada di dalam area komentar
         */
        isInsideComments: (element) => {
            return CONFIG.COMMENT_SECTION_SELECTORS.some(selector => element.closest(selector));
        },

        /**
         * Mengecek apakah link mengarah ke profil user/channel
         */
        isProfileLink: (anchor) => {
            const path = anchor.pathname;
            return path.startsWith("/@") || path.startsWith("/channel/") || path.startsWith("/user/");
        },

        /**
         * Handler utama untuk event klik
         */
        handleClick: (event) => {
            // 1. Bypass jika tombol Shift ditekan
            if (event.shiftKey) return;

            // 2. Cari elemen <a> terdekat dari target klik
            const linkElement = event.target.closest("a");
            if (!linkElement || !linkElement.href) return;

            // 3. Validasi: Apakah ini link profil DAN ada di dalam komentar?
            if (ProfileGuard.isProfileLink(linkElement) && ProfileGuard.isInsideComments(linkElement)) {

                // Hentikan eksekusi event bawaan YouTube segera
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                // Tampilkan konfirmasi
                const userConfirmed = confirm(CONFIG.MESSAGES.CONFIRM_NAV);

                if (userConfirmed) {
                    window.location.href = linkElement.href;
                }
            }
        },

        init: () => {
            // Menggunakan capture: true agar event ditangkap SEBELUM sampai ke script YouTube
            document.addEventListener("click", ProfileGuard.handleClick, true);
        }
    };

    // --- 4. INITIALIZATION ---
    // Menjalankan kedua modul
    UrlCleaner.init();
    ProfileGuard.init();

})();
