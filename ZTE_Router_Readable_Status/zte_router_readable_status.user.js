// ==UserScript==
// @name         ZTE Router Readable Status
// @namespace    ZTEF672YBeautifier
// @version      7.5
// @description  A complete UI makeover for ZTE Routers: smart sorting, custom client names, privacy mode, clutter hider, and enhanced data readability.
// @author       MochAdiMR
// @match        http://192.168.1.1/*
// @icon         https://1000logos.net/wp-content/uploads/2018/09/ZTE-Logo-1985.png
// @grant        none
// @license      MIT
// @supportURL   https://buymeacoffee.com/mochadimr
// @homepageURL  https://github.com/adimuhamad/
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION & THEME ---
    const THEME = { primary: '#2980b9', success: '#27ae60', warning: '#f39c12', danger: '#e74c3c', neutral: '#95a5a6', accent: '#8e44ad', panelBg: '#ffffff', panelBorder: '#d0d0d0' };

    const CONFIG = {
        pages: [
            {
                id: 'network_status', autoExpand: true,
                check: () => document.getElementById('lan_info') || document.getElementById('WLANStatus') || document.getElementById('Wlan_ClientStat'),
                rules: [
                    { prefix: 'InBytes', type: 'bytes' }, { prefix: 'TotalBytesCount', type: 'bytes' },
                    { prefix: 'InPkts', type: 'packets' }, { prefix: 'TotalPacketsCount', type: 'packets' },
                    { prefix: 'InUnicast', type: 'packets' }, { prefix: 'InMulticast', type: 'packets' },
                    { prefix: 'RSSI', type: 'rssi' }, { prefix: 'NOISE', type: 'rssi' },
                    { prefix: 'TxRate', type: 'rate' }, { prefix: 'RxRate', type: 'rate' },
                    { prefix: 'IPAddress', action: 'copy' }, { prefix: 'MACAddress', action: 'copy' },
                    { prefix: 'Bssid', action: 'copy' }, { prefix: 'Gua1', action: 'copy' },
                    { prefix: 'cIPAddress', action: 'copy' }, { prefix: 'IPV6Address', action: 'copy' }
                ]
            }
        ]
    };

    // --- STORAGE MANAGER ---
    const Storage = {
        get: () => { try { const d = JSON.parse(localStorage.getItem('zte_names') || '{}'); for(let k in d) { if(typeof d[k] === 'string') d[k] = { custom: d[k], real: 'Unknown' }; } return d; } catch(e) { return {}; } },
        set: (d) => localStorage.setItem('zte_names', JSON.stringify(d)),
        update: (mac, custom, real) => { const d = Storage.get(); if (!d[mac]) d[mac] = {}; if (custom !== undefined) d[mac].custom = custom; if (real !== undefined) d[mac].real = real; Storage.set(d); },
        remove: (mac) => { const d = Storage.get(); delete d[mac]; Storage.set(d); }
    };

    // --- UTILITIES ---
    const Utils = {
        toBytes: (b) => { if (!b || isNaN(b)) return '0 B'; const i = Math.floor(Math.log(b) / Math.log(1024)); return parseFloat((b / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i]; },
        toPackets: (p) => { if (isNaN(p)) return '0'; if (p >= 1e9) return (p / 1e9).toFixed(2) + ' B'; if (p >= 1e6) return (p / 1e6).toFixed(2) + ' M'; if (p >= 1e3) return (p / 1e3).toFixed(2) + ' k'; return p.toString(); },
        toRate: (r) => isNaN(parseInt(r)) ? r : (parseInt(r) / 1000).toFixed(0) + ' Mbps',
        toRSSI: (r) => { const v = parseInt(r); if (isNaN(v)) return r; const [cls, lbl] = v > -60 ? ['signal-excellent', 'Excellent'] : v > -75 ? ['signal-good', 'Good'] : v > -85 ? ['signal-weak', 'Weak'] : ['signal-bad', 'Poor']; return `<span class="${cls}">${v} dBm <small>(${lbl})</small></span>`; },
        copy: (txt) => { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt); return new Promise((res, rej) => { const ta = document.createElement("textarea"); ta.value = txt; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;"; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } ta.remove(); }); }
    };

    // --- SMART REFRESH (With Scroll Memory) ---
    const triggerRefresh = () => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        document.querySelectorAll('input.Btn_refresh').forEach(b => b.click());
        setTimeout(() => window.scrollTo(0, scrollY), 1500); // Tunggu 1.5 detik baru kembalikan posisi scroll
    };

    // --- DOM REORDERING ---
    const reorderDOM = () => {
        const lanInfo = document.getElementById('lan_info');
        const lanDevs = document.getElementById('LANDevs');
        if (lanInfo && lanDevs && lanInfo.nextSibling !== lanDevs) {
            lanInfo.parentNode.insertBefore(lanDevs, lanInfo.nextSibling);
        }
    };

    // --- SYNC UNKNOWN REAL NAMES ---
    const syncUnknownNames = () => {
        let updated = false;
        document.querySelectorAll('span[id^="HostName:"]').forEach(el => {
            const macId = el.id.replace('HostName', 'MACAddress'), macEl = document.getElementById(macId);
            if (!macEl) return;
            const mac = macEl.innerText.trim(), stored = Storage.get()[mac], realName = el.dataset.realName;
            if (stored && stored.real === 'Unknown' && realName && realName !== 'Unknown') { Storage.update(mac, stored.custom, realName); updated = true; }
        });
        alert(updated ? "Synced successfully!" : "No new real names found to sync.");
        if(updated) buildManageModal();
    };

    // --- MODAL UIs (Minified HTML Strings) ---
    const showInputModal = (mac, defaultName, realName) => {
        let m = document.getElementById('zte-input-modal');
        if(!m) {
            document.body.insertAdjacentHTML('beforeend', `<div id="zte-input-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10002;display:none;justify-content:center;align-items:center;"><div style="background:#fff;padding:20px;border-radius:8px;width:320px;box-shadow:0 4px 15px rgba(0,0,0,0.2);color:#313131;text-align:left;"><h3 style="margin-top:0;border-bottom:1px solid #eee;padding-bottom:10px;">Set Custom Name</h3><p style="font-size:12px;color:#666;margin-bottom:15px;line-height:1.5;"><strong>MAC:</strong> <span class="zte-mod-copy" id="zte-input-mac" style="font-family:monospace;" title="Click to Copy"></span><br><strong>Real Name:</strong> <span id="zte-input-real"></span></p><input type="text" id="zte-input-field" placeholder="Enter custom name..." style="width:100%;padding:8px;margin-bottom:15px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;"><div style="text-align:right;display:flex;justify-content:flex-end;gap:10px;"><button id="zte-input-cancel" class="zte-btn">Cancel</button><button id="zte-input-save" class="zte-btn active">Save</button></div></div></div>`);
            m = document.getElementById('zte-input-modal');
            document.getElementById('zte-input-cancel').onclick = () => m.style.display = 'none';
        }
        document.getElementById('zte-input-mac').innerText = mac; document.getElementById('zte-input-real').innerText = realName || 'Unknown';
        const field = document.getElementById('zte-input-field'); field.value = defaultName || ''; m.style.display = 'flex'; field.focus();
        document.getElementById('zte-input-save').onclick = () => {
            const val = field.value.trim(); val ? Storage.update(mac, val, realName) : Storage.remove(mac); m.style.display = 'none';
            triggerRefresh(); if (document.getElementById('zte-name-modal')?.style.display === 'block') buildManageModal();
        };
    };

    const buildManageModal = () => {
        let m = document.getElementById('zte-name-modal');
        if (!m) {
            document.body.insertAdjacentHTML('beforeend', `<div id="zte-name-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:#fff;padding:20px;border:1px solid #ccc;z-index:10001;display:none;box-shadow:0 5px 15px rgba(0,0,0,0.3);border-radius:8px;width:550px;max-height:80vh;overflow-y:auto;color:#313131;"><div id="zte-modal-content"></div></div>`);
            m = document.getElementById('zte-name-modal');
        }
        const data = Storage.get(), entries = Object.entries(data);
        let html = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;">Manage Custom Names</h3><button id="zte-btn-sync-unknown" class="zte-btn" title="Sync unknown real names">🔄 Sync</button></div><table style="width:100%;border-collapse:collapse;margin-bottom:15px;text-align:left;"><tr style="background:#f7f7f7;"><th style="padding:8px;border-bottom:1px solid #ccc;">MAC Address</th><th style="padding:8px;border-bottom:1px solid #ccc;">Real Name</th><th style="padding:8px;border-bottom:1px solid #ccc;">Custom Name</th><th style="padding:8px;border-bottom:1px solid #ccc;">Actions</th></tr>`;
        if(!entries.length) html += `<tr><td colspan="4" style="padding:15px;text-align:center;">No custom names saved yet.</td></tr>`;
        else entries.forEach(([mac, item]) => { html += `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-size:11px;"><span class="zte-mod-copy" title="Click to Copy">${mac}</span></td><td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#555;">${item.real || 'Unknown'}</td><td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;"><strong>${item.custom}</strong></td><td style="padding:8px;border-bottom:1px solid #eee;"><button class="zte-btn zte-edit-name" data-mac="${mac}" data-real="${item.real || ''}" data-custom="${item.custom}" style="padding:2px 6px;" title="Edit">✏️</button><button class="zte-btn zte-del-name" data-mac="${mac}" style="padding:2px 6px;margin-left:4px;" title="Delete">❌</button></td></tr>`; });
        html += `</table><div style="text-align:right;"><button id="zte-close-modal-btn" class="zte-btn active">Close</button></div>`;
        document.getElementById('zte-modal-content').innerHTML = html; m.style.display = 'block';
        
        document.getElementById('zte-close-modal-btn').onclick = () => m.style.display = 'none';
        document.getElementById('zte-btn-sync-unknown').onclick = syncUnknownNames;
        m.querySelectorAll('.zte-edit-name').forEach(b => b.onclick = (e) => showInputModal(e.target.dataset.mac, e.target.dataset.custom, e.target.dataset.real));
        m.querySelectorAll('.zte-del-name').forEach(b => b.onclick = (e) => { if(confirm("Are you sure you want to delete this custom name?")) { Storage.remove(e.target.dataset.mac); buildManageModal(); triggerRefresh(); } });
    };

    // --- INJECT UI & STYLES (Minified) ---
    const injectUI = () => {
        if (document.getElementById('zte-mod-styles')) return;
        document.body.classList.add('zte-privacy-active', 'zte-hide-clutter');
        document.head.insertAdjacentHTML('beforeend', `<style id="zte-mod-styles">.zte-mod-primary{color:${THEME.primary}!important;font-weight:bold;}.zte-mod-rate{color:${THEME.accent}!important;}.zte-mod-copy{cursor:pointer;transition:color .2s;display:inline-block;}.zte-mod-copy:hover{color:${THEME.primary}!important;}.zte-copy-tooltip{position:absolute;background:${THEME.success};color:#fff;padding:4px 8px;border-radius:2px;font-size:11px;font-weight:bold;pointer-events:none;z-index:10000;box-shadow:0 1px 3px rgba(0,0,0,.3);}body.zte-hide-clutter .zte-zero-bytes{display:none!important;}.buttongroup{display:none!important;}body.zte-privacy-active .zte-mod-copy{filter:blur(5px);opacity:.7;user-select:none;transition:all .3s;}body.zte-privacy-active .zte-mod-copy:hover{filter:blur(0px);opacity:1;}.status-good{color:${THEME.success}!important;font-weight:bold;}.status-warn{color:${THEME.warning}!important;font-weight:bold;}.status-bad{color:${THEME.neutral}!important;font-weight:bold;}.status-error{color:${THEME.danger}!important;font-weight:bold;}.signal-excellent{color:${THEME.success};font-weight:bold;}.signal-good,.signal-weak{color:${THEME.warning};font-weight:bold;}.signal-bad{color:${THEME.danger};font-weight:bold;}#zte-control-panel{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${THEME.panelBg};border:1px solid ${THEME.panelBorder};padding:6px;border-radius:6px;box-shadow:0 4px 15px rgba(0,0,0,.15);z-index:9999;display:flex;gap:6px;align-items:center;}.zte-btn{background:#f7f7f7;border:1px solid #d0d0d0;padding:4px 8px;font-size:11px;border-radius:4px;cursor:pointer;font-weight:bold;color:#313131;transition:.2s;white-space:nowrap;}.zte-btn:hover{background:#e0e0e0;}.zte-btn.active{background:${THEME.primary};color:white;border-color:${THEME.primary};}.zte-name-ctrls{display:inline-flex;align-items:center;gap:4px;margin-left:8px;user-select:none;}.zte-name-btn{cursor:pointer;font-size:12px;opacity:.5;transition:.2s;}.zte-name-btn:hover{opacity:1;transform:scale(1.1);}.zte-name-btn.active-eye{opacity:1;text-shadow:0 0 5px ${THEME.warning};}</style>`);
        document.body.insertAdjacentHTML('beforeend', `<div id="zte-control-panel"><button id="zte-btn-refresh" class="zte-btn" title="Refresh All Data">🔄 Refresh</button><button id="zte-btn-privacy" class="zte-btn active" title="Toggle IP & MAC Address Visibility">👁️ Show Data</button><button id="zte-btn-hide-zero" class="zte-btn active" title="Toggle 0 Bytes Traffic Visibility">👁️ Show Clutter</button><button id="zte-btn-manage" class="zte-btn" title="Manage Custom Client Names">📝 Manage Names</button><button id="zte-btn-sort" class="zte-btn" title="Sort LAN & WLAN by data consumption">🔃 Sort Data</button></div>`);

        const bindToggle = (id, cls, txtActive, txtInactive) => { document.getElementById(id).addEventListener('click', (e) => { const act = document.body.classList.toggle(cls); e.target.classList.toggle('active', act); e.target.innerText = act ? txtActive : txtInactive; }); };
        bindToggle('zte-btn-privacy', 'zte-privacy-active', '👁️ Show Data', '🙈 Privacy');
        bindToggle('zte-btn-hide-zero', 'zte-hide-clutter', '👁️ Show Clutter', '🧹 Hide Clutter');
        
        document.getElementById('zte-btn-manage').addEventListener('click', buildManageModal);
        document.getElementById('zte-btn-refresh').addEventListener('click', (e) => { const btn = e.target, orig = btn.innerText; btn.innerText = "⏳ Loading..."; triggerRefresh(); setTimeout(() => btn.innerText = orig, 1000); });
        document.getElementById('zte-btn-sort').addEventListener('click', (e) => { sortContainer('#lan_info_container .form_content', 'div[id^="template_lan_info_"]', 'InBytes'); sortContainer('#WLANStatus_container', 'div[id^="template_WLANStatus_"]', 'TotalBytesCount'); const orig = e.target.innerText; e.target.innerText = "✔️ Done!"; setTimeout(() => e.target.innerText = orig, 1500); });
    };

    const fixZebra = (container) => container && Array.from(container.querySelectorAll('.colorTblRow')).forEach((r, i) => r.classList.toggle('colorRow', i % 2 === 0));

    const sortContainer = (sel, itemSel, dataPrefix) => {
        const c = document.querySelector(sel); if (!c) return; const items = Array.from(c.querySelectorAll(itemSel)); if (!items.length) return;
        c.style.display = 'flex'; c.style.flexDirection = 'column'; c.style.width = '100%';
        const itemsWithVal = items.map(el => {
            const s = el.querySelector(`span[id^="${dataPrefix}:"]`); let val = 0;
            if (s) { const pts = (s.dataset.originalRaw || s.innerText).split('/'); val = pts.length >= 2 ? (parseInt(pts[0].replace(/,/g, '')) || 0) + (parseInt(pts[1].replace(/,/g, '')) || 0) : 0; }
            return { el, val };
        });
        itemsWithVal.sort((a, b) => b.val - a.val); itemsWithVal.forEach((item, index) => item.el.style.order = index);
        const btnGrp = c.querySelector('.buttongroup'); if (btnGrp) btnGrp.style.order = items.length;
    };

    // --- MAIN RENDER LOOP ---
    const processPage = () => {
        injectUI();
        reorderDOM(); // Reorder LANDevs below lan_info
        
        const pCfg = CONFIG.pages.find(p => p.check()), pnl = document.getElementById('zte-control-panel');
        if (!pCfg) { if (pnl) pnl.style.display = 'none'; return; }
        if (pnl) pnl.style.display = 'flex';

        if (pCfg.autoExpand) { document.querySelectorAll('.collapBarWithDataTrans:not(.collapsibleBarExp)').forEach(b => { if (!b.dataset.click) { b.dataset.click = "1"; b.click(); setTimeout(() => { if (!b.classList.contains('collapsibleBarExp')) delete b.dataset.click; }, 1500); } }); }

        document.querySelectorAll(['span[id^="Status"]', 'span[id^="cConnStatus"]', 'span[id^="RealRF"]', 'span[id^="Enable"]', 'span[id^="cIsNAT"]', 'span[id^="cConnError"]'].join(',')).forEach(el => {
            const t = el.innerText.toLowerCase().trim(); el.className = el.className.replace(/status-(good|warn|bad|error)/g, '');
            if (['connected', 'up', 'on', 'full duplex'].some(k => t.includes(k))) el.classList.add('status-good'); else if (['connecting'].some(k => t.includes(k))) el.classList.add('status-warn'); else if (['nolink', 'disconnected', 'off', 'down', 'none', 'error_none'].some(k => t.includes(k))) el.classList.add('status-bad');
        });

        // Custom Client Names Injection
        document.querySelectorAll('span[id^="HostName:"]').forEach(el => {
            const macId = el.id.replace('HostName', 'MACAddress'), macEl = document.getElementById(macId); if (!macEl) return;
            const mac = macEl.innerText.trim(); if (!mac) return;

            const currentTxt = el.innerText.trim(), storedData = Storage.get()[mac] || {}, storedCustom = storedData.custom;
            
            if (!el.querySelector('.zte-name-ctrls')) {
                if (currentTxt && currentTxt !== storedCustom) el.dataset.realName = currentTxt;
                el.innerHTML = ''; el.style.display = 'inline-flex'; el.style.alignItems = 'center';
                const nameTxtSpan = document.createElement('span'); nameTxtSpan.className = 'zte-name-txt'; nameTxtSpan.style.overflow = 'hidden'; nameTxtSpan.style.textOverflow = 'ellipsis'; nameTxtSpan.style.whiteSpace = 'nowrap';
                const ctrls = document.createElement('span'); ctrls.className = 'zte-name-ctrls'; ctrls.innerHTML = `<span class="zte-name-btn edit-btn" title="Edit Custom Name">✏️</span><span class="zte-name-btn real-btn" title="Toggle Real Name">👁️</span>`;
                el.appendChild(nameTxtSpan); el.appendChild(ctrls);
            }

            const nameTxtSpan = el.querySelector('.zte-name-txt'), realBtn = el.querySelector('.real-btn'), editBtn = el.querySelector('.edit-btn');
            const realName = el.dataset.realName || storedData.real || "";
            
            if (realName && !storedData.real) Storage.update(mac, storedCustom, realName);

            const isShowingReal = realBtn.dataset.active === '1', displayTxt = isShowingReal ? realName : (storedCustom || realName);
            if (nameTxtSpan.innerText !== displayTxt) { nameTxtSpan.innerText = displayTxt; nameTxtSpan.title = displayTxt; }

            editBtn.onclick = () => showInputModal(mac, storedCustom, realName);
            realBtn.onclick = function() { const act = this.dataset.active === '1'; this.dataset.active = act ? '0' : '1'; this.classList.toggle('active-eye', !act); nameTxtSpan.innerText = this.dataset.active === '1' ? realName : (storedCustom || realName); };
        });

        pCfg.rules.forEach(r => {
            document.querySelectorAll(`span[id^="${r.prefix}"]`).forEach(el => {
                if (r.action === 'copy') { if (!el.classList.contains('zte-mod-copy') && el.innerText.trim() !== '') el.classList.add('zte-mod-copy'), el.title = "Click to Copy"; return; }
                const raw = el.innerText; if (el.dataset.proc === raw) return;

                if (raw.includes('/')) {
                    const actRaw = /[a-zA-Z]/.test(raw) ? el.dataset.originalRaw : raw, pts = actRaw.split('/');
                    const v1 = parseFloat(pts[0].replace(/,/g, '')), v2 = parseFloat(pts[1].replace(/,/g, ''));
                    if (!isNaN(v1) && !isNaN(v2)) {
                        if (r.type === 'bytes') { const p = el.closest('div[id^="template_"]'); if (p) (v1 + v2) === 0 ? p.classList.add('zte-zero-bytes') : p.classList.remove('zte-zero-bytes'); }
                        const f1 = r.type === 'bytes' ? Utils.toBytes(v1) : r.type === 'packets' ? Utils.toPackets(v1) : v1;
                        const f2 = r.type === 'bytes' ? Utils.toBytes(v2) : r.type === 'packets' ? Utils.toPackets(v2) : v2;
                        const newTxt = `${f1} / ${f2}`;
                        if (el.innerText !== newTxt) { el.dataset.originalRaw = actRaw; el.innerText = el.dataset.proc = newTxt; el.title = "Raw: " + actRaw; el.classList.add('zte-mod-primary'); }
                    }
                } else {
                    let fmt = raw, actRaw = raw;
                    if (r.type === 'rate' && !raw.includes('Mbps')) fmt = Utils.toRate(actRaw = /[a-zA-Z]/.test(raw) ? (el.dataset.originalRaw || raw) : raw);
                    if (r.type === 'rssi' && !raw.includes('dBm')) { const h = Utils.toRSSI(raw); if (el.innerHTML !== h) el.innerHTML = h, el.dataset.proc = el.innerText; }
                    else if (el.innerText !== fmt) { if (r.type === 'rate') el.dataset.originalRaw = actRaw; el.innerText = el.dataset.proc = fmt; el.classList.add(r.type === 'rate' ? 'zte-mod-rate' : (r.style ? 'zte-mod-' + r.style : '')); }
                }
            });
        });
    };

    const showTooltip = (x, y, msg) => { const tt = document.createElement('div'); tt.className = 'zte-copy-tooltip'; tt.innerText = msg; tt.style.left = (x - 30) + 'px'; tt.style.top = (y - 30) + 'px'; document.body.appendChild(tt); setTimeout(() => tt.remove(), 1500); };
    document.addEventListener('click', (e) => { if (e.target?.classList.contains('zte-mod-copy')) { const txt = e.target.innerText.trim(); if (txt) { Utils.copy(txt).then(() => { showTooltip(e.pageX, e.pageY, "Copied!"); e.target.style.color = THEME.success; setTimeout(() => e.target.style.color = "", 1500); }).catch(() => showTooltip(e.pageX, e.pageY, "Failed!")); } } });

    let tOut; new MutationObserver(() => { clearTimeout(tOut); tOut = setTimeout(processPage, 150); }).observe(document.getElementById('page_content') || document.body, { childList: true, subtree: true, characterData: true });
    processPage();
})();
