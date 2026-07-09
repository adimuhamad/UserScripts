// ==UserScript==
// @name         GitHub Release Filename Wrap
// @namespace    GithubFilenameWordWrap
// @version      2.4
// @description  Word-wrap feature in GitHub Releases so that long file names are fully visible on mobile displays.
// @author       MochAdiMR
// @match        https://github.com/*/*/releases/*
// @icon         https://github.githubassets.com/pinned-octocat.svg
// @grant        GM_addStyle
// @connect      none
// @license      MIT
// @supportURL   https://buymeacoffee.com/mochadimr
// @homepageURL  https://github.com/adimuhamad/
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Combines the old selector (Box-row)
    // and the new React component target from GitHub
    const css = `.Box-row a.Truncate,[data-testid="download-button"] span,a[href*="/releases/download/"]{max-width:none!important;height:auto!important;display:inline-block!important}.Box-row a.Truncate .Truncate-text,a[href*="/releases/download/"] span{white-space:normal!important;overflow:visible!important;word-break:break-all!important;overflow-wrap:anywhere!important;line-height:1.4!important;padding-bottom:4px}.Box-row span.Truncate,.release-asset-size{max-width:100%!important;display:inline-block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;vertical-align:bottom!important}`;

    // Directly execute using the built-in function
    GM_addStyle(css);

})();
