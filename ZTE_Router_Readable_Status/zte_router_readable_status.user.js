// ==UserScript==
// @name         ZTE Router Readable Status
// @namespace    ZTEF672YBeautifier
// @version      8.0
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

    const THEME = { primary: '#2980b9', success: '#27ae60', warning: '#f39c12', danger: '#e74c3c', neutral: '#95a5a6', accent: '#8e44ad', panelBg: '#ffffff', panelBorder: '#d0d0d0' };

    const CONFIG = {
        pages: [
            {
                id: 'network_status', autoExpand: true,
                check: () => document.getElementById('lan_info') || document.getElementById('WLANStatus') || document.getElementById('Wlan_ClientStat'),
                rules: [ { prefix: 'InBytes', type: 'bytes' }, { prefix: 'TotalBytesCount', type: 'bytes' }, { prefix: 'InPkts', type: 'packets' }, { prefix: 'TotalPacketsCount', type: 'packets' }, { prefix: 'InUnicast', type: 'packets' }, { prefix: 'InMulticast', type: 'packets' }, { prefix: 'RSSI', type: 'rssi' }, { prefix: 'NOISE', type: 'rssi' }, { prefix: 'TxRate', type: 'rate' }, { prefix: 'RxRate', type: 'rate' } ]
            },
            {
                id: 'home_page', autoExpand: false,
                check: () => document.getElementById('home_adev_area'),
                rules: [ { prefix: 'OnlineDuration', type: 'duration', style: 'primary' } ]
            },
            {
                id: 'network_lan', autoExpand: false,
                check: () => document.getElementById('DHCPHostInfo'),
                rules: [ { prefix: 'ExpiredTime', type: 'duration', style: 'primary' } ]
            },
            {
                id: 'topology_page', autoExpand: false,
                check: () => document.getElementById('master-area'),
                rules: [ { prefix: 'OnlineDuration_', type: 'duration', style: 'primary' }, { prefix: 'Rssi_', type: 'rssi' } ]
            }
        ]
    };

    const COPY_PREFIXES = ['IPAddress', 'MACAddress', 'Bssid', 'Gua1', 'cIPAddress', 'IPV6Address', 'IPAddr', 'MACAddr', 'IP_', 'MAC_', 'cGateWay', 'cDNS', 'cWorkIFMac'];

    const Storage = {
        get: () => { try { const d = JSON.parse(localStorage.getItem('zte_names') || '{}'); for(let k in d) if(typeof d[k] === 'string') d[k] = { custom: d[k], real: 'Unknown' }; return d; } catch(e) { return {}; } },
        set: d => localStorage.setItem('zte_names', JSON.stringify(d)),
        update: (mac, custom, real) => { const d = Storage.get(); d[mac] = d[mac] || {}; if(custom !== undefined) d[mac].custom = custom; if(real !== undefined) d[mac].real = real; Storage.set(d); },
        remove: mac => { const d = Storage.get(); delete d[mac]; Storage.set(d); }
    };

    const Utils = {
        toBytes: b => (!b || isNaN(b)) ? '0 B' : (b / Math.pow(1024, Math.floor(Math.log(b) / Math.log(1024)))).toFixed(2) + ' ' + ['B','KB','MB','GB','TB'][Math.floor(Math.log(b) / Math.log(1024))],
        toPackets: p => isNaN(p) ? '0' : p >= 1e9 ? (p/1e9).toFixed(2)+' B' : p >= 1e6 ? (p/1e6).toFixed(2)+' M' : p >= 1e3 ? (p/1e3).toFixed(2)+' k' : p.toString(),
        toRate: r => isNaN(parseInt(r)) ? r : (parseInt(r)/1000).toFixed(0)+' Mbps',
        toRSSI: r => { const v = parseInt(r); return isNaN(v) ? r : `<span class="${v > -60 ? 'signal-excellent' : v > -75 ? 'signal-good' : v > -85 ? 'signal-weak' : 'signal-bad'}">${v} dBm <small>(${v > -60 ? 'Excellent' : v > -75 ? 'Good' : v > -85 ? 'Weak' : 'Poor'})</small></span>`; },
        toTime: t => { let s=0, m; if(t.includes('h')){ m=t.match(/(\d+)\s*h\s*(\d+)\s*min\s*(\d+)\s*s/i); if(!m) return t; s = parseInt(m[1])*3600 + parseInt(m[2])*60 + parseInt(m[3]); } else { m=t.match(/(\d+)\s*s/i); if(!m) return t; s = parseInt(m[1]); } const d=Math.floor(s/86400), h=Math.floor((s%86400)/3600), mn=Math.floor((s%3600)/60), sc=s%60; return d>0 ? `${d}d ${h}h ${mn}m ${sc}s` : `${h}h ${mn}m ${sc}s`; },
        copy: t => navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(t) : new Promise((res, rej) => { const ta = document.createElement("textarea"); ta.value = t; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;"; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy') ? res() : rej(); } catch(e) { rej(e); } ta.remove(); })
    };

    const triggerRefresh = () => { const sy = window.scrollY || document.documentElement.scrollTop; document.querySelectorAll('input.Btn_refresh').forEach(b => b.click()); setTimeout(() => window.scrollTo(0, sy), 1500); };
    const reorderDOM = () => { const i = document.getElementById('lan_info'), d = document.getElementById('LANDevs'); if(i && d && i.nextSibling !== d) i.parentNode.insertBefore(d, i.nextSibling); };

    const syncUnknownNames = () => {
        let up = false;
        document.querySelectorAll('span[id^="HostName:"]:not(.zte-name-txt), span[id^="HostName_"]:not(.zte-name-txt)').forEach(el => {
            const isUs = el.id.includes('_'), mId = isUs ? el.id.replace('HostName_', 'MAC_') : el.id.replace('HostName:', 'MACAddress:');
            const mEl = document.getElementById(mId) || document.getElementById(mId.replace('MACAddress', 'MACAddr'));
            if(!mEl) return;
            const mac = mEl.innerText.trim(), d = Storage.get()[mac], real = el.dataset.realName;
            if(d && d.real === 'Unknown' && real && real !== 'Unknown') { Storage.update(mac, d.custom, real); up = true; }
        });
        alert(up ? "Synced successfully!" : "No new real names found to sync."); if(up) buildManageModal();
    };

    const showInputModal = (mac, def, real) => {
        let m = document.getElementById('zte-input-backdrop');
        if(!m) { document.body.insertAdjacentHTML('beforeend', `<div id="zte-input-backdrop" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:10002;display:none;justify-content:center;align-items:center;"><div style="background:#fff;padding:20px;border-radius:8px;width:320px;box-shadow:0 4px 15px rgba(0,0,0,0.2);color:#313131;text-align:left;"><h3 style="margin-top:0;border-bottom:1px solid #eee;padding-bottom:10px;">Set Custom Name</h3><p style="font-size:12px;color:#666;margin-bottom:15px;line-height:1.5;"><strong>MAC:</strong> <span class="zte-mod-copy" id="zte-input-mac" style="font-family:monospace;" title="Click to Copy"></span><br><strong>Real Name:</strong> <span id="zte-input-real"></span></p><input type="text" id="zte-input-field" placeholder="Enter custom name..." style="width:100%;padding:8px;margin-bottom:15px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;"><div style="text-align:right;display:flex;justify-content:flex-end;gap:10px;"><button id="zte-input-cancel" class="zte-btn">Cancel</button><button id="zte-input-save" class="zte-btn active">Save</button></div></div></div>`); m = document.getElementById('zte-input-backdrop'); document.getElementById('zte-input-cancel').onclick = () => m.style.display = 'none'; }
        document.getElementById('zte-input-mac').innerText = mac; document.getElementById('zte-input-real').innerText = real || 'Unknown';
        const f = document.getElementById('zte-input-field'); f.value = def || ''; m.style.display = 'flex'; f.focus();
        document.getElementById('zte-input-save').onclick = () => { const v = f.value.trim(); v ? Storage.update(mac, v, real) : Storage.remove(mac); m.style.display = 'none'; triggerRefresh(); processPage(); if(document.getElementById('zte-manage-backdrop')?.style.display === 'flex') buildManageModal(); };
    };

    const buildManageModal = () => {
        let m = document.getElementById('zte-manage-backdrop');
        if(!m) { document.body.insertAdjacentHTML('beforeend', `<div id="zte-manage-backdrop" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:10001;display:none;justify-content:center;align-items:center;"><div style="background:#fff;padding:20px;border-radius:8px;width:550px;max-height:60vh;overflow-y:auto;box-shadow:0 5px 15px rgba(0,0,0,0.3);color:#313131;"><div id="zte-modal-content"></div></div></div>`); m = document.getElementById('zte-manage-backdrop'); m.onclick = e => { if(e.target === m) m.style.display = 'none'; }; }
        const data = Storage.get(), entries = Object.entries(data);
        let html = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;display:flex;align-items:baseline;">Manage Custom Names <span style="font-size:12px;color:#888;font-weight:normal;margin-left:8px;">(${entries.length} data)</span></h3><button id="zte-btn-sync-unknown" class="zte-btn" title="Sync unknown real names from current dashboard">🔄 Sync Unknown</button></div><table style="width:100%;border-collapse:collapse;margin-bottom:15px;text-align:left;"><tr style="background:#f7f7f7;"><th style="padding:8px;border-bottom:1px solid #ccc;">MAC Address</th><th style="padding:8px;border-bottom:1px solid #ccc;">Real Name</th><th style="padding:8px;border-bottom:1px solid #ccc;">Custom Name</th><th style="padding:8px;border-bottom:1px solid #ccc;">Actions</th></tr>`;
        if(!entries.length) html += `<tr><td colspan="4" style="padding:15px;text-align:center;">No custom names saved yet.</td></tr>`;
        else entries.forEach(([mac, item]) => { html += `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-size:11px;"><span class="zte-mod-copy" title="Click to Copy">${mac}</span></td><td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#555;">${item.real || 'Unknown'}</td><td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;"><strong>${item.custom}</strong></td><td style="padding:8px;border-bottom:1px solid #eee;"><button class="zte-btn zte-edit-name" data-mac="${mac}" data-real="${item.real || ''}" data-custom="${item.custom}" style="padding:2px 6px;" title="Edit">✏️</button><button class="zte-btn zte-del-name" data-mac="${mac}" style="padding:2px 6px;margin-left:4px;" title="Delete">❌</button></td></tr>`; });
        html += `</table><div style="text-align:right;"><button id="zte-close-modal-btn" class="zte-btn active">Close</button></div>`;
        document.getElementById('zte-modal-content').innerHTML = html; m.style.display = 'flex';
        document.getElementById('zte-close-modal-btn').onclick = () => m.style.display = 'none'; document.getElementById('zte-btn-sync-unknown').onclick = syncUnknownNames;
        m.querySelectorAll('.zte-edit-name').forEach(b => b.onclick = e => showInputModal(e.target.dataset.mac, e.target.dataset.custom, e.target.dataset.real));
        m.querySelectorAll('.zte-del-name').forEach(b => b.onclick = e => { if(confirm("Are you sure you want to delete this custom name?")) { Storage.remove(e.target.dataset.mac); buildManageModal(); triggerRefresh(); processPage(); } });
    };

    const injectUI = () => {
        if(document.getElementById('zte-mod-styles')) return;
        document.body.classList.add('zte-privacy-active', 'zte-hide-clutter');
        document.head.insertAdjacentHTML('beforeend', `<style id="zte-mod-styles">.zte-mod-primary{color:${THEME.primary}!important;font-weight:bold;}.zte-mod-rate{color:${THEME.accent}!important;}.zte-mod-copy{cursor:pointer;transition:color .2s;display:inline-block;}.zte-mod-copy:hover{color:${THEME.primary}!important;}.zte-copy-tooltip{position:absolute;background:${THEME.success};color:#fff;padding:4px 8px;border-radius:2px;font-size:11px;font-weight:bold;pointer-events:none;z-index:20000;box-shadow:0 1px 3px rgba(0,0,0,.3);}body.zte-hide-clutter .zte-zero-bytes{display:none!important;}.buttongroup{display:none!important;}body.zte-privacy-active .zte-mod-copy{filter:blur(5px);opacity:.7;user-select:none;transition:all .3s;}body.zte-privacy-active .zte-mod-copy:hover{filter:blur(0px);opacity:1;}.status-good{color:${THEME.success}!important;font-weight:bold;}.status-warn{color:${THEME.warning}!important;font-weight:bold;}.status-bad{color:${THEME.neutral}!important;font-weight:bold;}.status-error{color:${THEME.danger}!important;font-weight:bold;}.signal-excellent{color:${THEME.success};font-weight:bold;}.signal-good,.signal-weak{color:${THEME.warning};font-weight:bold;}.signal-bad{color:${THEME.danger};font-weight:bold;}#zte-control-panel{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${THEME.panelBg};border:1px solid ${THEME.panelBorder};padding:6px;border-radius:6px;box-shadow:0 4px 15px rgba(0,0,0,.15);z-index:9999;display:flex;gap:6px;align-items:center;}.zte-btn{background:#f7f7f7;border:1px solid #d0d0d0;padding:4px 8px;font-size:11px;border-radius:4px;cursor:pointer;font-weight:bold;color:#313131;transition:.2s;white-space:nowrap;}.zte-btn:hover{background:#e0e0e0;}.zte-btn.active{background:${THEME.primary};color:white;border-color:${THEME.primary};}.zte-name-ctrls{display:inline-flex;align-items:center;gap:4px;margin-left:8px;user-select:none;}.zte-name-btn{cursor:pointer;font-size:12px;opacity:.5;transition:.2s;}.zte-name-btn:hover{opacity:1;transform:scale(1.1);}.zte-name-btn.active-eye{opacity:1;text-shadow:0 0 5px ${THEME.warning};}</style>`);
        document.body.insertAdjacentHTML('beforeend', `<div id="zte-control-panel"><button id="zte-btn-refresh" class="zte-btn" title="Refresh All Data">🔄 Refresh</button><button id="zte-btn-privacy" class="zte-btn active" title="Toggle IP & MAC Address Visibility">👁️ Show Data</button><button id="zte-btn-hide-zero" class="zte-btn active" title="Toggle 0 Bytes Traffic Visibility">👁️ Show Clutter</button><button id="zte-btn-manage" class="zte-btn" title="Manage Custom Client Names">📝 Manage Names</button><button id="zte-btn-sort" class="zte-btn" title="Sort LAN & WLAN by data consumption">🔃 Sort Data</button></div>`);
        const bindToggle = (id, cls, tOn, tOff) => { document.getElementById(id).addEventListener('click', e => { const a = document.body.classList.toggle(cls); e.target.classList.toggle('active', a); e.target.innerText = a ? tOn : tOff; }); };
        bindToggle('zte-btn-privacy', 'zte-privacy-active', '👁️ Show Data', '🙈 Privacy'); bindToggle('zte-btn-hide-zero', 'zte-hide-clutter', '👁️ Show Clutter', '🧹 Hide Clutter');
        document.getElementById('zte-btn-manage').addEventListener('click', () => { const m = document.getElementById('zte-manage-backdrop'); m && m.style.display === 'flex' ? m.style.display = 'none' : buildManageModal(); });
        document.getElementById('zte-btn-refresh').addEventListener('click', e => { const b = e.target, o = b.innerText; b.innerText = "⏳ Loading..."; triggerRefresh(); setTimeout(() => b.innerText = o, 1000); });
        document.getElementById('zte-btn-sort').addEventListener('click', e => { sortContainer('#lan_info_container .form_content', 'div[id^="template_lan_info_"]', 'InBytes'); sortContainer('#WLANStatus_container', 'div[id^="template_WLANStatus_"]', 'TotalBytesCount'); const o = e.target.innerText; e.target.innerText = "✔️ Done!"; setTimeout(() => e.target.innerText = o, 1500); });
    };

    const sortContainer = (sel, itemSel, dp) => {
        const c = document.querySelector(sel); if(!c) return; const i = Array.from(c.querySelectorAll(itemSel)); if(!i.length) return;
        c.style.display = 'flex'; c.style.flexDirection = 'column'; c.style.width = '100%';
        i.map(el => { const s = el.querySelector(`span[id^="${dp}:"]`); let v = 0; if(s){ const p = (s.dataset.originalRaw || s.innerText).split('/'); if(p.length >= 2) v = (parseInt(p[0].replace(/,/g, ''))||0) + (parseInt(p[1].replace(/,/g, ''))||0); } return { el, v }; }).sort((a, b) => b.v - a.v).forEach((item, idx) => item.el.style.order = idx);
    };

    // --- MAIN RENDER LOOP ---
    const processPage = () => {
        injectUI(); reorderDOM(); 
        
        COPY_PREFIXES.forEach(prefix => document.querySelectorAll(`span[id^="${prefix}"]`).forEach(el => {
            if(!el.classList.contains('zte-mod-copy') && el.innerText.trim() !== '') { el.classList.add('zte-mod-copy'); el.title = "Click to Copy"; }
        }));

        const pCfg = CONFIG.pages.find(p => p.check()), pnl = document.getElementById('zte-control-panel');
        if(!pCfg) { 
            if(pnl) pnl.style.display = 'none'; 
            ['zte-manage-backdrop', 'zte-input-backdrop'].forEach(id => { const m = document.getElementById(id); if(m) m.style.display = 'none'; }); 
            return; 
        }
        
        if(pnl) {
            pnl.style.display = 'flex';
            const hideRef = pCfg.id === 'topology_page';
            const hideSortClutter = pCfg.id === 'topology_page' || pCfg.id === 'network_lan' || pCfg.id === 'home_page';
            
            const btnSort = document.getElementById('zte-btn-sort'), btnHide = document.getElementById('zte-btn-hide-zero'), btnRef = document.getElementById('zte-btn-refresh');
            if(btnRef) btnRef.style.display = hideRef ? 'none' : 'inline-block';
            if(btnSort) btnSort.style.display = hideSortClutter ? 'none' : 'inline-block';
            if(btnHide) btnHide.style.display = hideSortClutter ? 'none' : 'inline-block';
        }

        if(pCfg.autoExpand) document.querySelectorAll('.collapBarWithDataTrans:not(.collapsibleBarExp)').forEach(b => { if(!b.dataset.click) { b.dataset.click = "1"; b.click(); setTimeout(() => { if(!b.classList.contains('collapsibleBarExp')) delete b.dataset.click; }, 1500); } });

        document.querySelectorAll(['span[id^="Status"]', 'span[id^="cConnStatus"]', 'span[id^="RealRF"]', 'span[id^="Enable"]', 'span[id^="cIsNAT"]', 'span[id^="cConnError"]'].join(',')).forEach(el => {
            const t = el.innerText.toLowerCase().trim(); el.className = el.className.replace(/status-(good|warn|bad|error)/g, '');
            if(['connected', 'up', 'on', 'full duplex'].some(k => t.includes(k))) el.classList.add('status-good'); else if(['connecting'].some(k => t.includes(k))) el.classList.add('status-warn'); else if(['nolink', 'disconnected', 'off', 'down', 'none', 'error_none'].some(k => t.includes(k))) el.classList.add('status-bad');
        });

        document.querySelectorAll('span[id^="HostName:"]:not(.zte-name-txt), span[id^="HostName_"]:not(.zte-name-txt)').forEach(el => {
            const isUs = el.id.includes('_');
            let mId = isUs ? el.id.replace('HostName_', 'MAC_') : el.id.replace('HostName:', 'MACAddress:');
            if(!document.getElementById(mId) && !isUs) mId = el.id.replace('HostName:', 'MACAddr:');
            
            const mEl = document.getElementById(mId); if(!mEl) return;
            const mac = mEl.innerText.trim(); if(!mac) return;

            const cTxt = el.innerText.trim(), sData = Storage.get()[mac] || {}, sCust = sData.custom;
            if(!el.querySelector('.zte-name-ctrls')) {
                if(cTxt && cTxt !== sCust) el.dataset.realName = cTxt;
                el.innerHTML = ''; el.style.display = 'inline-flex'; el.style.alignItems = 'center';
                const nTxt = document.createElement('span'); nTxt.className = 'zte-name-txt'; nTxt.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
                const ctrls = document.createElement('span'); ctrls.className = 'zte-name-ctrls'; ctrls.innerHTML = `<span class="zte-name-btn edit-btn" title="Edit Custom Name">✏️</span><span class="zte-name-btn real-btn" title="Toggle Real Name">👁️</span>`;
                el.appendChild(nTxt); el.appendChild(ctrls);
            }

            const nTxt = el.querySelector('.zte-name-txt'), rBtn = el.querySelector('.real-btn'), eBtn = el.querySelector('.edit-btn'), real = el.dataset.realName || sData.real || "";
            if(real && !sData.real) Storage.update(mac, sCust, real);

            const isR = rBtn.dataset.active === '1', dTxt = isR ? real : (sCust || real);
            if(nTxt.innerText !== dTxt) { nTxt.innerText = dTxt; nTxt.title = dTxt; }

            eBtn.onclick = () => showInputModal(mac, sCust, real);
            rBtn.onclick = function() { const a = this.dataset.active === '1'; this.dataset.active = a ? '0' : '1'; this.classList.toggle('active-eye', !a); nTxt.innerText = this.dataset.active === '1' ? real : (sCust || real); };
        });

        document.querySelectorAll('div[class*="-dev"][title*="MAC:"]').forEach(el => {
            if(!el.dataset.origTitle) el.dataset.origTitle = el.title;
            const m = el.dataset.origTitle.match(/MAC:\s*([a-fA-F0-9:]+)/);
            if(m) { const mac = m[1].toLowerCase(), d = Storage.get()[mac]; el.title = (d && d.custom) ? el.dataset.origTitle.replace(/Device:\s*[^\n]+/, 'Device: ' + d.custom) : el.dataset.origTitle; }
        });

        (pCfg.rules || []).forEach(r => {
            document.querySelectorAll(`span[id^="${r.prefix}"]`).forEach(el => {
                const raw = el.innerText; if(el.dataset.proc === raw) return;
                if(raw.includes('/')) {
                    const aRaw = /[a-zA-Z]/.test(raw) ? el.dataset.originalRaw : raw, pts = aRaw.split('/');
                    const v1 = parseFloat(pts[0].replace(/,/g, '')), v2 = parseFloat(pts[1].replace(/,/g, ''));
                    if(!isNaN(v1) && !isNaN(v2)) {
                        if(r.type === 'bytes') { const p = el.closest('div[id^="template_"]'); if(p) (v1 + v2) === 0 ? p.classList.add('zte-zero-bytes') : p.classList.remove('zte-zero-bytes'); }
                        const f1 = r.type === 'bytes' ? Utils.toBytes(v1) : r.type === 'packets' ? Utils.toPackets(v1) : v1;
                        const f2 = r.type === 'bytes' ? Utils.toBytes(v2) : r.type === 'packets' ? Utils.toPackets(v2) : v2;
                        const nTxt = `${f1} / ${f2}`;
                        if(el.innerText !== nTxt) { el.dataset.originalRaw = aRaw; el.innerText = el.dataset.proc = nTxt; el.title = "Raw: " + aRaw; el.classList.add('zte-mod-primary'); }
                    }
                } else {
                    let f = raw, aRaw = raw;
                    if(r.type === 'duration' && (!raw.includes('d') || raw.includes('s'))) f = Utils.toTime(raw);
                    else if(r.type === 'rate' && !raw.includes('Mbps')) f = Utils.toRate(aRaw = /[a-zA-Z]/.test(raw) ? (el.dataset.originalRaw || raw) : raw);
                    if(r.type === 'rssi' && !raw.includes('dBm')) { const h = Utils.toRSSI(raw); if(el.innerHTML !== h) el.innerHTML = h, el.dataset.proc = el.innerText; }
                    else if(el.innerText !== f) { if(r.type === 'rate') el.dataset.originalRaw = aRaw; el.innerText = el.dataset.proc = f; if(r.type === 'duration') el.title = "Raw: " + raw; el.classList.add(r.type === 'rate' ? 'zte-mod-rate' : (r.style ? `zte-mod-${r.style}` : '')); }
                }
            });
        });
    };

    const showTooltip = (x, y, msg) => { const tt = document.createElement('div'); tt.className = 'zte-copy-tooltip'; tt.innerText = msg; tt.style.left = (x - 30) + 'px'; tt.style.top = (y - 30) + 'px'; document.body.appendChild(tt); setTimeout(() => tt.remove(), 1500); };
    
    // Auto-Inject Trigger for Modal Data (Topology Page)
    document.addEventListener('click', e => { 
        if(e.target?.classList.contains('zte-mod-copy')) { 
            const txt = e.target.innerText.trim(); 
            if(txt) { 
                Utils.copy(txt).then(() => { showTooltip(e.pageX, e.pageY, "Copied!"); e.target.style.color = THEME.success; setTimeout(() => e.target.style.color = "", 1500); }).catch(() => showTooltip(e.pageX, e.pageY, "Failed!")); 
            } 
        }
        
        if(e.target?.classList.contains('more-lan-dev-online') || e.target?.classList.contains('more-wlan-dev-online')) {
            setTimeout(processPage, 150);
        }
    });

    let tOut; new MutationObserver(() => { clearTimeout(tOut); tOut = setTimeout(processPage, 150); }).observe(document.getElementById('page_content') || document.body, { childList: true, subtree: true, characterData: true });
    processPage();
})();
