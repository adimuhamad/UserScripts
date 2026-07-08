// ==UserScript==
// @name         GitHub Release Filename Wrap
// @namespace    Github Filename Word-wrap
// @version      2.3
// @description  Word-wrap feature in GitHub Releases so that long file names are fully visible on mobile displays.
// @author       MochAdiMR
// @match        https://github.com/*/*/releases/*
// @icon         https://github.githubassets.com/pinned-octocat.svg
// @grant        GM_addStyle
// @license      MIT
// @supportURL   https://buymeacoffee.com/mochadimr
// @homepageURL  https://github.com/adimuhamad/
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Combines the old selector (Box-row) and the new React component target from GitHub
    const css = `
        /* Target main file name (Link) */
        .Box-row a.Truncate,
        [data-testid="download-button"] span,
        a[href*="/releases/download/"] {
            max-width: none !important;
            height: auto !important;
            display: inline-block !important;
        }

        /* Modify text wrapping to support tight word wrapping on mobile */
        .Box-row a.Truncate .Truncate-text,
        a[href*="/releases/download/"] span {
            white-space: normal !important;
            overflow: visible !important;
            word-break: break-all !important;
            overflow-wrap: anywhere !important;
            line-height: 1.4 !important;
            padding-bottom: 4px;
        }

        /* Keep secondary truncate elements (such as file/label sizes) tidy */
        .Box-row span.Truncate,
        .release-asset-size {
            max-width: 100% !important;
            display: inline-block !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            vertical-align: bottom !important;
        }
    `;

    // Directly execute using the built-in function that was granted above
    GM_addStyle(css);

})();
