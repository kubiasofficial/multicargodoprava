// Moderní panel vlaků s tmavým režimem, vyhledáváním a obrázky
function showModernTrainPanel(trains) {
    // Pokud modal už existuje, smažeme ho
    let oldModal = document.getElementById('modern-train-panel');
    if (oldModal) oldModal.remove();
    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.id = 'modern-train-panel';
    modal.className = 'server-modal';
    modal.style.background = 'rgba(24,26,32,0.98)';
    modal.innerHTML = `
        <div class="server-modal-content" style="max-width:1200px;min-width:340px;position:relative;background:rgba(44,47,51,0.98);border-radius:24px;box-shadow:0 8px 32px #23272a99;padding:38px 38px 32px 38px;">
            <span class="server-modal-close" id="modern-train-panel-close" style="font-size:2em;top:18px;right:24px;position:absolute;cursor:pointer;color:#ffe066;">&times;</span>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
                <h2 style="font-size:2.2em;font-weight:bold;color:#ffe066;text-shadow:0 2px 12px #23272a;margin:0;">Vlaky</h2>
                <div>
                    <button id="darkmode-toggle" class="profile-btn" style="font-size:1em;padding:8px 18px;border-radius:8px;background:#23272a;color:#ffe066;">Tmavý režim</button>
                </div>
            </div>
            <div style="margin-bottom:18px;">
                <input type="text" id="train-search-modern" class="train-search" placeholder="Vyhledat podle čísla vlaku..." style="width:100%;padding:10px 16px;font-size:1.1em;border-radius:8px;border:1px solid #43b581;background:#23272a;color:#fff;">
            </div>
            <div id="modern-train-list" class="modern-train-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;"></div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => { modal.classList.add('active'); }, 10);
    document.getElementById('modern-train-panel-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    // Tmavý režim toggle
    let darkMode = true;
    document.getElementById('darkmode-toggle').onclick = () => {
        darkMode = !darkMode;
        modal.querySelector('.server-modal-content').style.background = darkMode ? 'rgba(44,47,51,0.98)' : '#fff';
        modal.style.background = darkMode ? 'rgba(24,26,32,0.98)' : '#f5f5f5';
        document.getElementById('darkmode-toggle').textContent = darkMode ? 'Tmavý režim' : 'Světlý režim';
        // Změna barvy inputu
        document.getElementById('train-search-modern').style.background = darkMode ? '#23272a' : '#fff';
        document.getElementById('train-search-modern').style.color = darkMode ? '#fff' : '#23272a';
        renderTrainsModern(document.getElementById('train-search-modern').value);
    };
    // Render vlakových karet
    function renderTrainsModern(filter = '') {
        let filtered = trains;
        if (filter.trim()) {
            const f = filter.trim().toLowerCase();
            filtered = trains.filter(train =>
                (train.trainNoLocal || train.trainNo || '').toString().toLowerCase().includes(f)
            );
        }
        const list = document.getElementById('modern-train-list');
        if (filtered.length === 0) {
            list.innerHTML = '<div style="color:#aaa;text-align:center;padding:18px 0;font-size:1.1em;">Žádné vlaky neodpovídají hledání.</div>';
            return;
        }
        list.innerHTML = '';
        filtered.forEach(train => {
            // Získání obrázku vlaku
            const trainImgSrc = getVehicleImage(train.Vehicles);
            // Ikony (použijeme obrázky z /Pictures)
            let typeIcon = '';
            if (trainImgSrc && trainImgSrc !== '/Pictures/train_default.png') {
                typeIcon = `<img src="${trainImgSrc}" alt="Vlak" style="width:48px;height:48px;border-radius:12px;box-shadow:0 2px 8px #23272a;">`;
            } else {
                typeIcon = `<img src="/Pictures/train_default.png" alt="Vlak" style="width:48px;height:48px;border-radius:12px;box-shadow:0 2px 8px #23272a;">`;
            }
            // Moderní karta vlaku
            const card = document.createElement('div');
            card.className = 'modern-train-card';
            card.style = `background:${darkMode ? 'rgba(44,47,51,0.98)' : '#fff'};border-radius:18px;box-shadow:0 4px 24px #23272a99;padding:18px 18px 14px 18px;display:flex;align-items:center;gap:18px;transition:box-shadow 0.2s;`;
            card.innerHTML = `
                <div style="flex-shrink:0;">${typeIcon}</div>
                <div style="flex:1;">
                    <div style="font-size:1.5em;font-weight:bold;color:${darkMode ? '#ffe066' : '#23272a'};margin-bottom:4px;">${train.trainNoLocal || train.trainNo || '-'}</div>
                    <div style="font-size:1.1em;color:${darkMode ? '#43b581' : '#23272a'};font-weight:bold;">${train.trainName || train.TrainName || '-'}</div>
                    <div style="font-size:1em;color:${darkMode ? '#fff' : '#23272a'};margin-top:6px;">${train.type || train.Type || '-'}</div>
                    <div style="font-size:0.95em;color:${darkMode ? '#aaa' : '#666'};margin-top:2px;">${train.startStation || train.StartStation || '-'}</div>
                    <div style="font-size:0.95em;color:${darkMode ? '#aaa' : '#666'};margin-top:2px;">${train.endStation || train.EndStation || '-'}</div>
                </div>
                <div style="flex-shrink:0;text-align:right;">
                    <div style="font-size:1.1em;color:${darkMode ? '#ffe066' : '#23272a'};font-weight:bold;">${train.stop?.departureTime ? train.stop.departureTime.substring(11,16) : '-'}</div>
                    <div style="font-size:1em;color:${darkMode ? '#43b581' : '#23272a'};">${train.stop?.track || '-'}</div>
                </div>
            `;
            list.appendChild(card);
        });
    }
    renderTrainsModern();
    document.getElementById('train-search-modern').oninput = (e) => {
        renderTrainsModern(e.target.value);
    };
}
window.showTrainDetailModal = function(e, trainRaw) {
    const train = typeof trainRaw === 'string' ? JSON.parse(trainRaw) : trainRaw;
    let oldModal = document.getElementById('train-detail-modal');
    if (oldModal) oldModal.remove();
    const modal = document.createElement('div');
    modal.id = 'train-detail-modal';
    modal.className = 'server-modal';
    // Základní data
    const trainNo = train.trainNoLocal || train.trainNo || train.TrainNoLocal || train.TrainNo || '-';
    const trainName = train.trainName || train.TrainName || '';
    const speed = train.speed || train.Speed || '-';
    const maxSpeed = train.maxSpeed || train.MaxSpeed || '-';
    // Oprava cesty k obrázku: použij getVehicleImage pokud je Vehicles, jinak fallback
    let image = '/Pictures/train_default.png';
    if (Array.isArray(train.vehicles) && train.vehicles.length > 0) {
        image = getVehicleImage(train.vehicles.map(v => v.name || v.type || v));
    } else if (train.image || train.ImageURL || train.imageUrl) {
        image = train.image || train.ImageURL || train.imageUrl;
        if (!image.startsWith('/Pictures/')) image = '/Pictures/' + image.replace(/^.*[\\\/]/, '');
    }
        // Najdi aktuální stop v timetable
        let timetable = Array.isArray(train.timetable) ? train.timetable : [];
        let currentIdx = timetable.findIndex(stop => stop.isCurrent || stop.isHere);
        if (currentIdx === -1) currentIdx = timetable.findIndex(stop => stop.hasArrived === false);
        const currentStop = timetable[currentIdx] || {};
        const prevStop = timetable[currentIdx-1] || {};
        const nextStop = timetable[currentIdx+1] || {};
        // Zpoždění
        let delay = 0;
        if (currentStop.arrivalTime) {
            const planned = new Date(currentStop.arrivalTime);
            const now = new Date();
            delay = Math.floor((now - planned) / 60000);
        }
        // Vygeneruj jízdní řád s vyznačením aktuální stanice
        let timetableHtml = `<table class="train-timetable-table" style="width:100%;margin-top:18px;">
            <thead><tr><th>Stanice</th><th>Příjezd</th><th>Odjezd</th><th>Kolej</th></tr></thead><tbody>`;
        timetable.forEach((stop, idx) => {
            const isCurrent = idx === currentIdx;
            timetableHtml += `<tr${isCurrent ? ' style="background:#ffe066;color:#23272a;font-weight:bold;"' : ''}>
                <td>${stop.nameForPerson || '-'}</td>
                <td>${stop.arrivalTime ? stop.arrivalTime.substring(11,16) : '-'}</td>
                <td>${stop.departureTime ? stop.departureTime.substring(11,16) : '-'}</td>
                <td>${stop.track || stop.platform || '-'}</td>
            </tr>`;
        });
        timetableHtml += `</tbody></table>`;
        // Modal HTML
        modal.innerHTML = `
            <div class="server-modal-content" style="max-width:600px;">
                <span class="server-modal-close">&times;</span>
                <div style="display:flex;align-items:center;gap:32px;">
                    <div class="train-modal-img-bubble"><img src="${image}" alt="train" style="width:56px;height:56px;object-fit:cover;border-radius:50%;"></div>
                    <div>
                        <div style="font-size:2em;font-weight:bold;color:#ffe066;text-shadow:0 2px 12px #23272a;">${trainNo}</div>
                        <div style="font-size:1.15em;color:#43b581;font-weight:bold;">${trainName}</div>
                    </div>
                </div>
                <div style="margin-top:18px;display:flex;gap:32px;justify-content:space-between;">
                    <div>
                        <div><b>Příjezd:</b> ${currentStop.arrivalTime ? currentStop.arrivalTime.substring(11,16) : '-'} ${delay !== 0 ? (delay > 0 ? `<span class='delay-blink'>+${delay} min</span>` : `<span class='delay-ok'>${-delay} min dříve</span>`) : '<span class=delay-ok>Včas</span>'}</div>
                        <div><b>Odjezd:</b> ${currentStop.departureTime ? currentStop.departureTime.substring(11,16) : '-'}</div>
                        <div><b>Kolej:</b> ${currentStop.track || currentStop.platform || '-'}</div>
                    </div>
                    <div>
                        <div><b>Předchozí stanice:</b> ${prevStop.nameForPerson || '-'}</div>
                        <div><b>Další stanice:</b> ${nextStop.nameForPerson || '-'}</div>
                    </div>
                </div>
                <div style="margin-top:18px;display:flex;gap:32px;justify-content:space-between;">
                    <div><b>Rychlost:</b> ${speed} km/h</div>
                    <div><b>Max. rychlost:</b> ${maxSpeed} km/h</div>
                    <div><b>Vzdálenost:</b> ${currentStop.distance || '-'}</div>
                </div>
                <div style="margin-top:18px;">
                    <b>Sekvence vozů:</b>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
                        ${(Array.isArray(train.vehicles) ? train.vehicles.map(v => `<img src='${v.image || 'public/Pictures/train_default.jpg'}' alt='vůz' style='width:38px;height:28px;border-radius:6px;background:#23272a;'>`).join('') : '')}
                    </div>
                </div>
                <div style="margin-top:24px;">
                    <b>Jízdní řád:</b>
                    ${timetableHtml}
                </div>
            </div>
        `;
    document.body.appendChild(modal);
    setTimeout(() => { modal.classList.add('active'); }, 10);
    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
};
// Funkce pro zobrazení modalu s výběrem serveru a následně vlaků
function showServerModal() {
    let oldModal = document.getElementById('server-select-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'server-select-modal';
    modal.className = 'server-modal';
    modal.innerHTML = `
        <div class="server-modal-content" style="max-width:500px;">
            <span class="server-modal-close">&times;</span>
            <h2 style="text-align:center;margin-bottom:24px;">Výběr serveru</h2>
            <div id="servers-list" class="servers-list">
                <div class="servers-loading">Načítám servery...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => { modal.classList.add('active'); }, 10);

    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    // Načtení serverů z API
    fetch('https://panel.simrail.eu:8084/servers-open')
        .then(res => res.json())
        .then(data => {
            const servers = Array.isArray(data.data) ? data.data : [];
            const list = document.getElementById('servers-list');
            if (servers.length === 0) {
                list.innerHTML = '<div class="servers-loading">Žádné servery nejsou dostupné.</div>';
                return;
            }
            list.innerHTML = '';
            servers.forEach(server => {
                const div = document.createElement('div');
                div.className = 'server-card';
                div.innerHTML = `
                    <div class="server-header">
                        <span>${server.ServerName}</span>
                        <span class="server-region">${server.ServerRegion}</span>
                    </div>
                    <div class="server-info">
                        <span class="server-status" style="color:${server.IsActive ? '#43b581' : '#f04747'};font-weight:bold;">
                            ${server.IsActive ? 'Online' : 'Offline'}
                        </span>
                    </div>
                `;
                if (server.IsActive) {
                    div.style.cursor = 'pointer';
                    div.onclick = () => {
                        modal.classList.remove('active');
                        setTimeout(() => modal.remove(), 300);
                        showTrainsModal(server);
                    };
                } else {
                    div.style.opacity = '0.6';
                    div.style.cursor = 'not-allowed';
                }
                list.appendChild(div);
            });
        })
        .catch(() => {
            document.getElementById('servers-list').innerHTML = '<div class="servers-loading">Nepodařilo se načíst servery.</div>';
        });
}
// Firebase inicializace
const firebaseConfig = {
    apiKey: "ATasYBexZoBfDYNqIu2r5RM9v8sNV6cV1dJU",
    authDomain: "multicargodoprava-fe1d5.firebaseapp.com",
    databaseURL: "https://multicargodoprava-fe1d5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "multicargodoprava-fe1d5",
    storageBucket: "multicargodoprava-fe1d5.appspot.com",
    messagingSenderId: "353118042486",
    appId: "1:353118042486:web:abdf8ba27613d27ddde257"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Firebase Authentication
if (!firebase.auth) {
    alert('Chybí Firebase Auth SDK! Přidejte <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script> do index.html.');
}
const auth = firebase.auth();

// DOM elementy
const pageTitle = document.querySelector('.page-title');
const pageContent = document.getElementById('page-content');
const navBtns = document.querySelectorAll('.nav-btn');

/**
 * Dynamicky generuje HTML pro stránku s přehledem a vytváří real-time listener.
 * Tato funkce se volá pouze JEDNOU při načtení stránky a poté se automaticky aktualizuje.
 */
let employeesListener = null;
let employeesInterval = null;
let selectedRole = null;
let currentUserRole = null;

// Pomocná funkce pro zobrazení navigace podle role
function updateNavigationByRole(role) {
    navBtns.forEach(btn => {
        const page = btn.dataset.page;
        if (page === 'prehled') {
            btn.style.display = 'flex';
        } else if (
            (role === 'Strojvedoucí' && page === 'strojvedouci') ||
            (role === 'Výpravčí' && page === 'vypravci') ||
            (role === 'Řidič' && page === 'ridic')
        ) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });
}

// Přidáme panel pro výběr role vpravo nahoře
function showRolePanel(user) {
    let rolePanel = document.getElementById('role-panel');
    if (!rolePanel) {
        rolePanel = document.createElement('div');
        rolePanel.id = 'role-panel';
        rolePanel.style.position = 'fixed';
        rolePanel.style.top = '70px';
        rolePanel.style.right = '32px';
        rolePanel.style.background = 'rgba(44,47,51,0.95)';
        rolePanel.style.padding = '12px 24px';
        rolePanel.style.borderRadius = '16px';
        rolePanel.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
        rolePanel.style.zIndex = '1002';
        rolePanel.style.display = 'none';
        rolePanel.innerHTML = `
            <label for="role-panel-select" style="color:#fff;font-weight:bold;font-size:1.1em;margin-right:12px;">Role:</label>
            <select id="role-panel-select" style="background:#23272a;color:#fff;border:1px solid #43b581;border-radius:6px;padding:6px 12px;font-size:1em;">
                <option value="Strojvedoucí">Strojvedoucí</option>
                <option value="Výpravčí">Výpravčí</option>
                <option value="Řidič">Řidič</option>
            </select>
        `;
        document.body.appendChild(rolePanel);
    }

    // Získáme aktuální roli uživatele
    db.ref('users/' + user.id).once('value').then(snap => {
        if (snap.val() && snap.val().role) {
            document.getElementById('role-panel-select').value = snap.val().role;
            currentUserRole = snap.val().role;
            updateNavigationByRole(currentUserRole);
        }
    });

    // Zobrazíme panel pouze pokud je uživatel ve službě
    db.ref('users/' + user.id).on('value', snap => {
        const val = snap.val();
        if (val && val.working === true) {
            rolePanel.style.display = 'flex';
            currentUserRole = val.role;
            updateNavigationByRole(currentUserRole);
        } else {
            rolePanel.style.display = 'none';
            currentUserRole = val ? val.role : null;
            updateNavigationByRole(currentUserRole);
        }
    });

    // Změna role v panelu
    document.getElementById('role-panel-select').onchange = (e) => {
        const newRole = e.target.value;
        selectedRole = newRole;
        currentUserRole = newRole;
        db.ref('users/' + user.id).update({ role: newRole });
        updateNavigationByRole(newRole);
        // Přepnutí stránky podle role
        if (newRole === 'Strojvedoucí') setPage('strojvedouci');
        else if (newRole === 'Výpravčí') setPage('vypravci');
        else if (newRole === 'Řidič') setPage('ridic');
    };
}



// SPA navigation (nyní jen přepíná obsah a pozadí)
function setPage(page) {
    const background = document.getElementById('background');
    // Fade out
    pageContent.classList.remove('fade-in');
    pageContent.classList.add('fade-out');
    setTimeout(() => {
        switch (page) {
            case 'strojvedouci':
                pageTitle.textContent = 'Strojvedoucí';
                background.style.background = "url('/Pictures/1185.png') center center/cover no-repeat";
                pageContent.innerHTML = `
                    <h2 style="color:#fff;text-align:center;">Stránka Strojvedoucí</h2>
                    <div style="display:flex;justify-content:center;margin-top:48px;">
                        <button id="jizda-btn" class="jizda-btn">Jízda</button>
                    </div>
                `;
                // Oprava: navázání eventu na tlačítko po vykreslení
                setTimeout(() => {
                    const btn = document.getElementById('jizda-btn');
                    if (btn) {
                        btn.onclick = () => {
                            showServerModal();
                        };
                    }
                }, 150); // delší zpoždění pro jistotu
                break;
            case 'vypravci':
                pageTitle.textContent = 'Výpravčí';
                pageContent.innerHTML = `
                    <h2 style="color:#fff;text-align:center;">Stránka Výpravčí je stále ve vývoji. Děkuji za trpělivost.</h2>
                    <div style="display:flex;justify-content:center;margin-top:48px;gap:24px;">
                        <button id="stanice-btn" class="stanice-btn">Do stanice</button>
                    </div>
                `;
                background.style.background = "url('/Pictures/Koluszki.png') center center/cover no-repeat";
                setTimeout(() => {
                    const staniceBtn = document.getElementById('stanice-btn');
                    if (staniceBtn) {
                        staniceBtn.onclick = () => {
                            showStationServerModal();
                        };
                    }
                }, 150);
                break;
            case 'ridic':
                pageTitle.textContent = 'Řidič';
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Řidič je ve vývoji.</h2>';
                background.style.background = "url('/Pictures/bus.png') center center/cover no-repeat";
                break;
            case 'prehled':
                pageTitle.textContent = 'Přehled';
                background.style.background = "url('/Pictures/1182.png') center center/cover no-repeat";
                // Pozdrav podle denní doby
                let greeting = '';
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 11) greeting = 'Dobré ráno!';
                else if (hour >= 11 && hour < 18) greeting = 'Hezké odpoledne!';
                else greeting = 'Dobrý večer!';
                pageContent.innerHTML = `
                  <div style="text-align:center;margin-bottom:24px;font-size:2.2em;font-weight:bold;color:#ffe066;text-shadow:0 2px 12px #23272a;">${greeting}</div>
                  <div id="overview-tables-container" style="display:flex;flex-direction:row;justify-content:center;align-items:flex-start;gap:48px;margin-top:48px;">
                    <div class="tables-vertical-container" style="flex:1;min-width:340px;">
                      <div class="employee-table-container">
                        <h2>Zaměstnanci ve službě</h2>
                        <table class="employee-table" id="employee-table">
                          <thead><tr><th style="text-align:left;">Uživatel</th><th style="text-align:left;">Role</th></tr></thead>
                          <tbody></tbody>
                        </table>
                      </div>
                      <div class="activity-table-container">
                        <h2>Aktivní jízdy</h2>
                        <table class="activity-table" id="activity-table">
                          <thead><tr><th style="text-align:left;">Uživatel</th><th style="text-align:left;">Číslo vlaku</th><th style="text-align:left;">Počáteční stanice</th><th style="text-align:left;">Konečná stanice</th></tr></thead>
                          <tbody></tbody>
                        </table>
                      </div>
                    </div>
                    <div class="tables-vertical-container" style="flex:1;min-width:340px;">
                      <div class="employee-table-container">
                        <h2>Řidiči</h2>
                        <table class="employee-table" id="driver-table">
                          <thead><tr><th style="text-align:left;">Řidič</th><th style="text-align:left;">Mapa</th><th style="text-align:left;">Linka</th></tr></thead>
                          <tbody><tr><td colspan="3" style="text-align:center;color:#ffe066;font-size:1.15em;">V přípravě</td></tr></tbody>
                        </table>
                      </div>
                      <div class="employee-table-container">
                        <h2>Výpravčí</h2>
                        <table class="employee-table" id="dispatcher-table">
                          <thead><tr><th style="text-align:left;">Výpravčí</th><th style="text-align:left;">Server</th><th style="text-align:left;">Stanice</th></tr></thead>
                          <tbody></tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                `;
                // Spusť živé aktualizace všech tabulek
                initializeEmployeesTable();
                initializeDriverTable();
                initializeDispatcherTable();
                break;
            default:
                pageTitle.textContent = 'Přehled';
                background.style.background = "url('/Pictures/1182.png') center center/cover no-repeat";
                initializeEmployeesTable();
                break;
        }
        // Fade in
        pageContent.classList.remove('fade-out');
        pageContent.classList.add('fade-in');
    }, 300);
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setPage(btn.dataset.page);
    });
});

// Discord OAuth2 login logic
window.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('discord-modal');
        const hash = window.location.hash;
        let accessToken = null;
        if (hash && hash.includes('access_token')) {
            // Discord někdy vrací hash ve formátu #token_type=Bearer&access_token=...
            let accessTokenMatch = hash.match(/access_token=([^&]+)/);
            if (accessTokenMatch && accessTokenMatch[1]) {
                accessToken = accessTokenMatch[1];
                localStorage.setItem('discord_access_token', accessToken);
                window.location.hash = '';
            }
        }
        // Fallback: pokud není accessToken, zkus z localStorage
        if (!accessToken) {
            accessToken = localStorage.getItem('discord_access_token');
        }

        function showDiscordModal() {
            if (modal) modal.style.display = 'flex';
        }
        function hideDiscordModal() {
            if (modal) modal.style.display = 'none';
        }

        if (accessToken) {
            fetch('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            })
            .then(res => {
                if (!res.ok) throw new Error('Unauthorized');
                return res.json();
            })
            .then(user => {
                hideDiscordModal();
                showDiscordProfile(user);
                window.discordUser = user;
                localStorage.setItem('discord_user', JSON.stringify(user));
            })
            .catch(() => {
                showDiscordModal();
                localStorage.removeItem('discord_access_token');
            });
        } else {
            showDiscordModal();
        }

        // Pokud jsme na stránce Přehled, zobraz tabulky hned po načtení
        if (document.querySelector('.page-title')?.textContent === 'Přehled') {
                setTimeout(() => {
                        // Zaměstnanci ve službě
                        db.ref('users').orderByChild('working').equalTo(true).once('value').then(snap => {
                            const tbody = document.querySelector('#employee-table tbody');
                            if (tbody) {
                                tbody.innerHTML = '';
                                snap.forEach(child => {
                                    const val = child.val();
                                    const tr = document.createElement('tr');
                                    tr.innerHTML = `
                                        <td>${val.username || child.key}</td>
                                        <td>${val.role || '-'}</td>
                                    `;
                                    tbody.appendChild(tr);
                                });
                            }
                        });
                        // Aktivní jízdy
                        db.ref('activity').once('value').then(snap => {
                            const tbody = document.querySelector('#activity-table tbody');
                            if (tbody) {
                                tbody.innerHTML = '';
                                snap.forEach(child => {
                                    const val = child.val();
                                    const tr = document.createElement('tr');
                                    tr.innerHTML = `
                                        <td>${val.username || child.key}</td>
                                        <td>${val.trainNo || '-'}</td>
                                        <td>${val.time ? new Date(val.time).toLocaleTimeString('cs-CZ') : '-'}</td>
                                    `;
                                    tbody.appendChild(tr);
                                });
                            }
                        });
                }, 400);
        }
});

// Vždy při načtení stránky zkus obnovit Discord uživatele z localStorage
(function restoreDiscordUser() {
    try {
        const userStr = localStorage.getItem('discord_user');
        if (userStr) {
            window.discordUser = JSON.parse(userStr);
        }
    } catch {}
})();

function showProfileModal(user) {
    // Pokud modal už existuje, smažeme ho
    let oldModal = document.getElementById('profile-modal');
    if (oldModal) oldModal.remove();

    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'server-modal';
    modal.innerHTML = `
        <div class="server-modal-content" style="min-width:340px;max-width:95vw;">
            <span class="server-modal-close">&times;</span>
            <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
                <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="pfp" style="width:64px;height:64px;border-radius:50%;background:#222;">
                <div>
                    <div style="font-size:1.2em;font-weight:bold;color:#43b581;">${user.username}</div>
                    <div style="font-size:1em;color:#aaa;">ID: ${user.id}</div>
                </div>
            </div>
            <div style="display:flex;gap:16px;justify-content:center;margin-bottom:18px;">
                <button id="profile-arrival" class="profile-btn profile-btn-green">Příchod</button>
                <button id="profile-leave" class="profile-btn profile-btn-red">Odchod</button>
            </div>
            <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:18px;">
                <label for="profile-role-select" style="color:#fff;font-weight:bold;">Role:</label>
                <select id="profile-role-select" style="background:#23272a;color:#fff;border:1px solid #43b581;border-radius:6px;padding:6px 12px;font-size:1em;">
                    <option value="Strojvedoucí">Strojvedoucí</option>
                    <option value="Výpravčí">Výpravčí</option>
                    <option value="Řidič">Řidič</option>
                </select>
            </div>
            <div style="text-align:center;color:#aaa;font-size:0.98em;">
                <span>Další informace budou zde...</span>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => { modal.classList.add('active'); }, 10);

    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    // Nastavení role v selectu
    const roleSelect = document.getElementById('profile-role-select');
    if (roleSelect) {
        db.ref('users/' + user.id).once('value').then(snap => {
            if (snap.val() && snap.val().role) {
                roleSelect.value = snap.val().role;
            }
        });
        roleSelect.onchange = (e) => {
            db.ref('users/' + user.id).update({ role: e.target.value });
        };
    }

    // Tlačítka příchod/odchod
    document.getElementById('profile-arrival').onclick = () => {
        db.ref('users/' + user.id).update({ working: true });
        sendDiscordWebhookArrival(`✅ ${user.username} přišel do služby`);
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    document.getElementById('profile-leave').onclick = () => {
        db.ref('users/' + user.id).update({ working: false });
        sendDiscordWebhookArrival(`❌ ${user.username} odešel ze služby`);
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
}

function showDiscordProfile(user) {
    let container = document.getElementById('discord-profile-container');
    if (!container) {
        console.error('Chyba: Element pro profil nebyl nalezen.');
        return;
    }
    let profileDiv = document.getElementById('discord-profile');
    if (!profileDiv) {
        profileDiv = document.createElement('div');
        profileDiv.id = 'discord-profile';
        container.appendChild(profileDiv);
    }

    if (!user || !user.id || !user.username) {
        profileDiv.innerHTML = `
            <div id="profile-clickable" style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                <span style='color:#fff;font-weight:bold;'>Nepřihlášený uživatel</span>
            </div>
        `;
    } else {
        profileDiv.innerHTML = `
            <div id="profile-clickable" style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                <img src='https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png' alt='pfp' style='width:32px;height:32px;border-radius:50%;background:#222;'>
                <span style='color:#fff;font-weight:bold;'>${user.username}</span>
            </div>
        `;
    }

    if (user && user.id && user.username) {
        db.ref('users/' + user.id).update({
            username: user.username,
            avatar: user.avatar,
            id: user.id
        });
        window.discordUser = user;
        localStorage.setItem('discord_user', JSON.stringify(user));
        showRolePanel(user);
        // Načteme roli a nastavíme navigaci
        db.ref('users/' + user.id).once('value').then(snap => {
            if (snap.val() && snap.val().role) {
                currentUserRole = snap.val().role;
                updateNavigationByRole(currentUserRole);
            }
        });
    }

    const clickable = document.getElementById('profile-clickable');
    if (clickable) {
        clickable.onclick = () => {
            showProfileModal(user);
        };
    } else {
        console.warn('profile-clickable nenalezen, event handler nenavázán!');
    }
}

// Pomocné funkce pro odeslání zprávy na Discord webhook
function sendDiscordWebhookArrival(content) {
    fetch("https://discordapp.com/api/webhooks/1409855386642812979/7v9D_DcBwHVbyHxyEa6M5camAMlFWBF4NXSQvPns8vMm1jpp-GczCjhDqc7Hdq_7B1nK", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });
}
function sendDiscordWebhookTrain(content) {
    fetch("https://discordapp.com/api/webhooks/1410402512787472527/aIXjeKX6Oqb9el4KLDPDspXEmlqdkTrwwSUsXSMJgcbmHqKfqSveJo05FNmc18WwoevJ", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });
}

// Uložení aktivity do Firebase
function saveActivity(user, train) {
    db.ref('activity/' + user.id).set({
        username: user.username,
        trainNo: train.TrainNoLocal,
        trainName: train.TrainName || "",
        time: Date.now()
    });
}

// Odstranění aktivity z Firebase
function removeActivity(user) {
    db.ref('activity/' + user.id).remove();
}

// Pomocná funkce pro načtení jízdního řádu vlaku
function fetchTrainTimetable(serverCode, trainNo) {
    // Volání na vlastní backend proxy místo přímo na SimRail API
    return fetch(`/api/simrail-timetable?serverCode=${serverCode}&train=${trainNo}`)
        .then(res => res.json())
        .catch(() => []);
}

// Pomocná funkce pro načtení pozice vlaku
function fetchTrainPosition(serverCode, trainId) {
    return fetch(`https://panel.simrail.eu:8084/train-positions-open?serverCode=${serverCode}`)
        .then(res => res.json())
        .then(data => {
            if (!data || !data.data) return null;
            return data.data.find(pos => pos.id === trainId) || null;
        })
        .catch(() => null);
}

// Pomocná funkce pro zjištění aktuální a následující stanice + spočítané zpoždění
function getCurrentAndNextStop(timetable) {
    if (!Array.isArray(timetable) || timetable.length === 0) return [];
    const now = new Date();
    let currentIdx = -1;
    for (let i = 0; i < timetable.length; i++) {
        const stop = timetable[i];
        const timeStr = stop.departureTime || stop.arrivalTime;
        if (timeStr) {
            const time = new Date(timeStr);
            if (time > now) {
                currentIdx = i - 1;
                break;
            }
        }
    }
    if (currentIdx < 0) currentIdx = 0;
    const stops = [];
    if (timetable[currentIdx]) stops.push(timetable[currentIdx]);
    if (timetable[currentIdx + 1]) stops.push(timetable[currentIdx + 1]);
    return stops;
}

// Pomocná funkce pro výpočet zpoždění podle jízdního řádu a aktuálního času
function calculateDelay(stop) {
    // Použij odjezd, pokud existuje, jinak příjezd
    const timeStr = stop.departureTime || stop.arrivalTime;
    if (!timeStr) return 0;
    const planned = new Date(timeStr);
    const now = new Date();
    const diffMs = now - planned;
    const diffMin = Math.floor(diffMs / 60000);
    return diffMin > 0 ? diffMin : 0;
}

const timelineSvg = `
    <svg width="32" height="80" viewBox="0 0 32 80" style="margin-right:12px;">
        <circle cx="16" cy="12" r="8" fill="#ffb300"/>
        <rect x="14" y="20" width="4" height="20" fill="#ffb300"/>
        <circle cx="16" cy="40" r="8" fill="#ffb300"/>
        <rect x="14" y="48" width="4" height="20" fill="#ffb300"/>
        <circle cx="16" cy="68" r="8" fill="#ffb300"/>
    </svg>
`;

// Zobrazení detailního modalu vlaku včetně aktuální a následující stanice + spočítané zpoždění
async function showTrainDetailModal(user, train) {
    // Pokud modal už existuje, smažeme ho
    let oldModal = document.getElementById('train-detail-modal');
    if (oldModal) oldModal.remove();

    // Vytvoř modal
    const modal = document.createElement('div');
    modal.id = 'train-detail-modal';
    modal.className = 'server-modal';

    // Načtení jízdního řádu
    let timetable = [];
    try {
        const timetableData = await fetchTrainTimetable(train.ServerCode, train.TrainNoLocal);
        if (Array.isArray(timetableData) && timetableData.length > 0) {
            // Najdi správný vlak podle čísla vlaku
            let timetableObj = timetableData.find(obj => obj.trainNoLocal == train.TrainNoLocal);
            if (!timetableObj && timetableData.length === 1) {
                timetableObj = timetableData[0];
            }
            if (timetableObj && Array.isArray(timetableObj.timetable)) {
                timetable = timetableObj.timetable;
            }
        }
    } catch {}

    // Načtení pozice vlaku
    let trainPosition = null;
    try {
        trainPosition = await fetchTrainPosition(train.ServerCode, train.id || train.TrainNoLocal);
    } catch {}

    // Pomocná funkce pro výpočet vzdálenosti mezi dvěma GPS body (Haversine formula)
    function getDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2-lat1) * Math.PI/180;
        const dLon = (lon2-lon1) * Math.PI/180;
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Získání aktuální a následující stanice
    const stops = getCurrentAndNextStop(timetable);

    // Vylepšená funkce pro výpočet zpoždění podle polohy
    function calculateDelayWithPosition(stop, nextStopIdx) {
        // Časové zpoždění (původní)
        const timeStr = stop.departureTime || stop.arrivalTime;
        if (!timeStr) return 0;
        const planned = new Date(timeStr);
        const now = new Date();
        let diffMin = Math.floor((now - planned) / 60000);

        // Pokud máme pozici vlaku a následující stanici, zkus vypočítat reálné zpoždění
        if (trainPosition && stops[nextStopIdx]) {
            const nextStop = stops[nextStopIdx];
            // Pokud máme GPS souřadnice stanice (musíš je doplnit do dat, nebo použít mileage)
            // Pokud máme mileage, použij rozdíl mileage
            if (typeof nextStop.mileage === 'number' && typeof stop.mileage === 'number') {
                const kmToGo = Math.abs(nextStop.mileage - stop.mileage);
                const velocity = trainPosition.Velocity || 0;
                if (velocity > 0) {
                    const timeToGoMin = (kmToGo / velocity) * 60;
                    const plannedArrival = new Date(nextStop.arrivalTime || nextStop.departureTime);
                    const predictedArrival = new Date(now.getTime() + timeToGoMin * 60000);
                    const realDelay = Math.floor((predictedArrival - plannedArrival) / 60000);
                    // Pokud reálné zpoždění je větší než časové, použij reálné
                    if (realDelay > diffMin) return realDelay;
                }
            }
        }
        return diffMin > 0 ? diffMin : 0;
    }

    const timelineSvg = `
        <svg width="32" height="80" viewBox="0 0 32 80" style="margin-right:12px;">
            <circle cx="16" cy="12" r="8" fill="#ffb300"/>
            <rect x="14" y="20" width="4" height="20" fill="#ffb300"/>
            <circle cx="16" cy="40" r="8" fill="#ffb300"/>
            <rect x="14" y="48" width="4" height="20" fill="#ffb300"/>
            <circle cx="16" cy="68" r="8" fill="#ffb300"/>
        </svg>
    `;

    // Získání URL obrázku vlaku z pole Vehicles
    const trainImgSrc = getVehicleImage(train.Vehicles);

    // Vylepšený jízdní řád vlaku jako tabulka
    let stationsHtml = '';
    if (stops.length > 0) {
        stationsHtml = `
            <div style="margin-top:18px;">
                <table class="train-timetable-table">
                    <thead>
                        <tr>
                            <th>Stanice</th>
                            <th>Příjezd</th>
                            <th>Odjezd</th>
                            <th>Nástupiště</th>
                            <th>Kolej</th>
                            <th>Zpoždění</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stops.map((stop, idx) => {
                            const delay = calculateDelayWithPosition(stop, idx+1);
                            const delayHtml = delay > 0
                                ? `<span class=\"delay-blink\">+${delay} min</span>`
                                : `<span class=\"delay-ok\">Včas</span>`;
                            const isCurrent = idx === 0;
                            return `
                                <tr style="${isCurrent ? 'background:#e6ffe6;color:#23272a;font-weight:bold;' : ''}">
                                    <td style="border-radius:8px 0 0 8px;">
                                        ${isCurrent ? '<span class=\"station-icon\" title=\"Aktuální stanice\">●</span>' : ''}
                                        ${stop.nameForPerson}
                                    </td>
                                    <td>${stop.arrivalTime ? stop.arrivalTime.split(' ')[1] : '-'}</td>
                                    <td>${stop.departureTime ? stop.departureTime.split(' ')[1] : '-'}</td>
                                    <td>${stop.platform || '-'}</td>
                                    <td>${stop.track || '-'}</td>
                                    <td style="border-radius:0 8px 8px 0;">${delayHtml}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        stationsHtml = `<div style=\"margin-top:18px;color:#aaa;\">Jízdní řád není dostupný.</div>`;
    }

    // Modal HTML (moderní styl)
    modal.innerHTML = `
        <div class=\"server-modal-content train-modal-simrail\" style=\"max-width:600px;min-width:340px;position:relative;background:rgba(44,47,51,0.98);border-radius:18px;box-shadow:0 8px 32px #23272a99;padding:32px 28px;\">
            <span class=\"server-modal-close\" id=\"train-modal-close\" style=\"font-size:1.8em;top:18px;right:24px;position:absolute;cursor:pointer;color:#ffe066;\">&times;</span>
            <span id=\"train-modal-minimize\" style=\"font-size:1.8em;top:18px;right:54px;position:absolute;cursor:pointer;color:#ffe066;\" title=\"Minimalizovat\">_</span>
            <div style=\"display:flex;align-items:center;gap:18px;margin-bottom:18px;\">
                <div class=\"train-modal-img-bubble\">
                    <img src=\"${trainImgSrc}\" alt=\"Vlak\">
                </div>
                <div style=\"font-size:2.3em;font-weight:bold;color:#ffe066;background:#23272a;padding:10px 22px;border-radius:16px;box-shadow:0 2px 12px #23272a;\">
                    ${train.TrainNoLocal}
                </div>
                <div id=\"train-modal-time\" style=\"font-size:1.15em;color:#43b581;font-weight:bold;margin-left:auto;\"></div>
            </div>
            <div style="margin-bottom:12px;">
                <b>Typ:</b> ${train.type || train.Type || '-'}<br>
                <b>Rychlost:</b> ${train.speed || train.Speed || '-'} km/h<br>
                <b>Max. rychlost:</b> ${train.maxSpeed || train.MaxSpeed || '-'} km/h<br>
                <b>Vzdálenost:</b> ${train.distance || train.Distance ? (train.distance || train.Distance) + ' km' : '-'}<br>
                <b>Sekvence vozů:</b> ${Array.isArray(train.Vehicles) ? train.Vehicles.map(v => (typeof v === 'object' ? (v.name || v.type || v.id || '-') : v)).join(', ') : '-'}<br>
                <b>Předchozí stanice:</b> ${stops[1]?.nameForPerson || '-'}<br>
                <b>Aktuální stanice:</b> ${stops[0]?.nameForPerson || '-'}<br>
                <b>Další stanice:</b> ${stops[2]?.nameForPerson || '-'}
            </div>
            <div id="train-detail-content">
                ${stationsHtml}
                <div style="display:flex;gap:16px;justify-content:center;margin-top:32px;">
                    <button id="end-ride-btn" class="profile-btn train-modal-btn-simrail" type="button">Ukončit jízdu</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    let minimized = false; // Proměnná pro stav modalu
    let widget = null;     // Widget element

    // Pomocná proměnná pro blokaci navigace
    let navigationBlocked = false;

    // Oprava globální navigace - zablokuj pouze když je modal maximalizovaný
    document.addEventListener('click', function navBlocker(e) {
        if (navigationBlocked) {
            // Povolit pouze klik na modal nebo jeho potomky
            const modalEl = document.getElementById('train-detail-modal');
            if (modalEl && modalEl.contains(e.target)) return;
            // Jinak zablokuj navigaci
            if (e.target.classList.contains('nav-btn') || e.target.closest('.nav-btn')) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    }, true);

    setTimeout(() => {
        modal.classList.add('active');
        // Blikající animace pro zpoždění
        const style = document.createElement('style');
        style.innerHTML = `
            .delay-blink {
                animation: blink-delay 1s infinite;
            }
            @keyframes blink-delay {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Funkce pro čas v modalu
        function updateTrainDetailTime() {
            const el = document.getElementById('train-modal-time');
            if (el) {
                const now = new Date();
                el.textContent = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
            // Aktualizace času i ve widgetu
            if (widget) {
                const widgetTime = widget.querySelector('.train-widget-time');
                if (widgetTime) {
                    const now = new Date();
                    widgetTime.textContent = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
            }
        }
        updateTrainDetailTime();
        const interval = setInterval(updateTrainDetailTime, 1000);

        // Pomocná funkce pro zpoždění (aktuální stopa)
        function getCurrentDelay() {
            if (Array.isArray(stops) && stops.length > 0) {
                const delay = calculateDelayWithPosition(stops[0], 1);
                return delay;
            }
            return 0;
        }

        // Funkce pro blokaci navigace
        function blockNavigation(block) {
            navigationBlocked = block;
        }

        // Oprava globální navigace - zablokuj při minimalizaci
        document.addEventListener('click', function navBlocker(e) {
            if (navigationBlocked) {
                // Povolit pouze klik na widget
                const widgetEl = document.getElementById('train-minimized-widget');
                if (widgetEl && widgetEl.contains(e.target)) return;
                // Jinak zablokuj navigaci
                if (e.target.classList.contains('nav-btn') || e.target.closest('.nav-btn')) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        }, true);

        // Funkce pro zobrazení widgetu vpravo dole
        function showTrainWidget() {
            if (widget) return;
            widget = document.createElement('div');
            widget.id = 'train-minimized-widget';
            widget.style.position = 'fixed';
            widget.style.right = '32px';
            widget.style.bottom = '32px';
            widget.style.zIndex = '9999';
            widget.style.background = 'rgba(44,47,51,0.97)';
            widget.style.borderRadius = '16px';
            widget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
            widget.style.display = 'flex';
            widget.style.alignItems = 'center';
            widget.style.gap = '16px';
            widget.style.padding = '12px 24px';
            widget.style.cursor = 'pointer';
            widget.style.transition = 'box-shadow 0.2s';

            // Sestav trasu
            const route = `${train.StartStation} → ${train.EndStation}`;
            const delay = getCurrentDelay();
            const delayHtml = getDelayHtml(delay);

            widget.innerHTML = `
                <div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;">
                    <div style="width:48px;height:48px;border-radius:50%;background:#222;box-shadow:0 2px 8px #23272a33;display:flex;align-items:center;justify-content:center;">
                        <img src="${trainImgSrc}" alt="Vlak" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
                    </div>
                </div>
                <div style="flex:1;">
                    <div style="font-size:1.25em;font-weight:bold;color:#ffe066;">${train.TrainNoLocal}</div>
                    <div style="font-size:1em;color:#fff;">${route}</div>
                    <div style="font-size:0.98em;color:#aaa;">${user.username}</div>
                </div>
                <div>
                    <span class="train-widget-time" style="font-size:1.08em;color:#43b581;font-weight:bold;display:block;"></span>
                    ${delayHtml}
                </div>
            `;

            // Kliknutí na widget obnoví modal
            widget.onclick = function () {
                if (widget) {
                    widget.remove();
                    widget = null;
                }
                minimized = false;
                modal.style.display = '';
                const content = document.getElementById('train-detail-content');
                const modalContent = modal.querySelector('.server-modal-content');
                content.style.display = '';
                modalContent.style.width = '';
                modalContent.style.minWidth = '';
                modalContent.style.maxWidth = '';
                blockNavigation(true);
            };

            document.body.appendChild(widget);
            updateTrainDetailTime();
        }

        // Skrytí widgetu
        function hideTrainWidget() {
            if (widget) {
                widget.remove();
                widget = null;
            }
        }

        document.getElementById('train-modal-minimize').onclick = function () {
            minimized = !minimized;
            const content = document.getElementById('train-detail-content');
            const modalContent = modal.querySelector('.server-modal-content');
            if (minimized) {
                // Skryj modal z prostředku
                modal.style.display = 'none';
                showTrainWidget();
                blockNavigation(false); // Povolit navigaci při minimalizaci
            } else {
                // Zobraz modal zpět
                modal.style.display = '';
                hideTrainWidget();
                blockNavigation(true); // Zablokovat navigaci při maximalizaci
            }
        };
        document.getElementById('train-modal-close').onclick = function () {
            modal.classList.remove('active');
            setTimeout(() => {
                clearInterval(interval);
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                if (style.parentNode) style.parentNode.removeChild(style);
                hideTrainWidget();
                blockNavigation(false);
            }, 300);
        };
        document.getElementById('end-ride-btn').onclick = function () {
            sendDiscordWebhookTrain(`❌ ${user.username} ukončil jízdu vlaku ${train.TrainNoLocal}`);
            removeActivity(user); // Tím se uživatel odstraní z tabulky Aktivita
            modal.classList.remove('active');
            setTimeout(() => {
                clearInterval(interval);
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                if (style.parentNode) style.parentNode.removeChild(style);
                hideTrainWidget();
                blockNavigation(false);
            }, 300);
        };

        // Po otevření modalu zablokuj navigaci
        blockNavigation(true);
    }, 20);
}

// Změna: kliknutí na vlakovou kartu otevře modal s "Převzít" a "Zavřít"
function showTrainsModal(server) {
    // Pokud modal už existuje, smažeme ho
    let oldModal = document.getElementById('trains-modal');
    if (oldModal) oldModal.remove();

    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.id = 'trains-modal';
    modal.className = 'server-modal';
    modal.innerHTML = `
        <div class="server-modal-content">
            <span class="server-modal-close">&times;</span>
            <h2 style="text-align:center;margin-bottom:24px;">Vlaky na serveru ${server.ServerName}</h2>
            <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
                <input type="text" id="train-search" class="train-search" placeholder="Vyhledat podle čísla vlaku..." style="flex:1;">
                <div id="local-time-box" class="server-time-box" style="min-width:170px;text-align:right;"></div>
            </div>
            <div id="trains-list" class="trains-list">
                <div class="servers-loading">Načítám vlaky...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => { modal.classList.add('active'); }, 10);

    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    // Zobrazení aktuálního času podle regionu serveru
    const regionTimezones = {
        'Europe': 'Europe/Prague',
        'Asia': 'Asia/Shanghai',
        'America': 'America/New_York',
        'Australia': 'Australia/Sydney',
        'Africa': 'Africa/Johannesburg'
    };
    const tz = regionTimezones[server.ServerRegion] || 'Europe/Prague';

    function updateLocalTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('cs-CZ', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: tz
        });
        document.getElementById('local-time-box').innerHTML = `
            <span style="font-size:1.08em;color:#43b581;font-weight:bold;">${timeStr}</span>
            <span style="font-size:0.95em;color:#aaa;margin-left:6px;">(${tz.replace('_', ' ')})</span>
        `;
    }
    updateLocalTime();
    const localTimeInterval = setInterval(updateLocalTime, 5000);

    modal.addEventListener('transitionend', () => {
        if (!modal.classList.contains('active') && localTimeInterval) {
            clearInterval(localTimeInterval);
        }
    });

    // Načtení vlaků z API
    fetch(`https://panel.simrail.eu:8084/trains-open?serverCode=${server.ServerCode}`)
        .then(res => {
            // Ověř, že odpověď je OK
            if (!res.ok) {
                throw new Error("API odpovědělo chybou: " + res.status);
            }
            return res.json();
        })
        .then(data => {
            // Ověř, že data jsou správná
            if (!data || !data.result || !Array.isArray(data.data)) {
                document.getElementById('trains-list').innerHTML = '<div class="servers-loading">Chybná odpověď API.</div>';
                return;
            }
            const trains = data.data;
            const list = document.getElementById('trains-list');
            const searchInput = document.getElementById('train-search');
            if (trains.length === 0) {
                list.innerHTML = '<div class="servers-loading">Žádné vlaky nejsou dostupné.</div>';
                return;
            }

            async function renderTrains(filter = '') {
                let filtered = trains;
                if (filter) {
                    filtered = filtered.filter(train => train.TrainNoLocal && train.TrainNoLocal.toString().includes(filter.trim()));
                }
                if (filtered.length === 0) {
                    list.innerHTML = '<div class="servers-loading">Žádný vlak neodpovídá hledání.</div>';
                    return;
                }
                // Moderní grid layout pro výběr vlaku
                list.innerHTML = `
                    <div class="train-grid-select">
                    </div>
                `;
                const grid = list.querySelector('.train-grid-select');
                filtered.forEach(train => {
                    const trainImg = getVehicleImage(train.Vehicles);
                    const isPlayer = train.Type === 'player' || (train.TrainData && train.TrainData.ControlledBySteamID);
                    const statusIcon = isPlayer
                        ? '<span title="Hráč" style="font-size:1.3em;margin-right:8px;vertical-align:middle;">🧑‍💻</span>'
                        : '<span title="Bot" style="font-size:1.3em;margin-right:8px;vertical-align:middle;">🤖</span>';
                    const route = `${train.StartStation} → ${train.EndStation}`;
                    grid.innerHTML += `
                        <div class="train-card-wide" data-train-no="${train.TrainNoLocal}">
                            <div class="train-card-img-wide">
                                <img src="${trainImg}" alt="Vlak">
                            </div>
                            <div class="train-card-info-wide">
                                <div class="train-card-row-wide">
                                    ${statusIcon}
                                    <span class="train-card-number-wide">${train.TrainNoLocal}</span>
                                </div>
                                <div class="train-card-route-wide">${route}</div>
                            </div>
                        </div>
                    `;
                });
                // Event handler pro kliknutí na vlakovou kartu
                grid.querySelectorAll('.train-card-wide').forEach(card => {
                    card.addEventListener('click', function () {
                        const trainNo = card.getAttribute('data-train-no');
                        const train = trains.find(t => t.TrainNoLocal == trainNo);
                        if (!train) return;
                        let oldModal = document.getElementById('take-train-modal');
                        if (oldModal) oldModal.remove();
                        const modal = document.createElement('div');
                        modal.id = 'take-train-modal';
                        modal.className = 'server-modal';
                        modal.innerHTML = `
                            <div class="server-modal-content" style="max-width:400px;">
                                <span class="server-modal-close">&times;</span>
                                <h2 style="text-align:center;margin-bottom:18px;">Vlak ${train.TrainNoLocal}</h2>
                                <div style="text-align:center;margin-bottom:18px;">
                                    <span style="font-size:1.1em;color:#fff;">${train.StartStation} → ${train.EndStation}</span>
                                </div>
                                <div style="display:flex;gap:16px;justify-content:center;">
                                    <button id="take-train-btn" class="profile-btn profile-btn-green">Převzít</button>
                                    <button id="close-train-btn" class="profile-btn profile-btn-red">Zavřít</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        setTimeout(() => { modal.classList.add('active'); }, 10);
                        modal.addEventListener('click', async function (e) {
                            if (e.target.id === 'close-train-btn' || e.target.classList.contains('server-modal-close')) {
                                modal.classList.remove('active');
                                setTimeout(() => modal.remove(), 300);
                            }
                            if (e.target.id === 'take-train-btn') {
                                const user = window.discordUser;
                                if (!user || !user.id) {
                                    alert("Musíš být prostě přihlášený přes Discord!");
                                    return;
                                }
                                sendDiscordWebhookTrain(`✅ ${user.username} převzal vlak ${train.TrainNoLocal}`);
                                saveActivity(user, train);
                                modal.classList.remove('active');
                                setTimeout(() => {
                                    if (document.body.contains(modal)) modal.remove();
                                    showTrainDetailModal(user, train);
                                }, 350);
                            }
                        });
                    });
                });
                // Event handler pro kliknutí na vlakovou kartu
                grid.querySelectorAll('.train-card-select').forEach(card => {
                    card.addEventListener('click', function () {
                        const trainNo = card.getAttribute('data-train-no');
                        const train = trains.find(t => t.TrainNoLocal == trainNo);
                        if (!train) return;
                        let oldModal = document.getElementById('take-train-modal');
                        if (oldModal) oldModal.remove();
                        const modal = document.createElement('div');
                        modal.id = 'take-train-modal';
                        modal.className = 'server-modal';
                        modal.innerHTML = `
                            <div class="server-modal-content" style="max-width:400px;">
                                <span class="server-modal-close">&times;</span>
                                <h2 style="text-align:center;margin-bottom:18px;">Vlak ${train.TrainNoLocal}</h2>
                                <div style="text-align:center;margin-bottom:18px;">
                                    <span style="font-size:1.1em;color:#fff;">${train.StartStation} → ${train.EndStation}</span>
                                </div>
                                <div style="display:flex;gap:16px;justify-content:center;">
                                    <button id="take-train-btn" class="profile-btn profile-btn-green">Převzít</button>
                                    <button id="close-train-btn" class="profile-btn profile-btn-red">Zavřít</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        setTimeout(() => { modal.classList.add('active'); }, 10);
                        modal.addEventListener('click', async function (e) {
                            if (e.target.id === 'close-train-btn' || e.target.classList.contains('server-modal-close')) {
                                modal.classList.remove('active');
                                setTimeout(() => modal.remove(), 300);
                            }
                            if (e.target.id === 'take-train-btn') {
                                const user = window.discordUser;
                                if (!user || !user.id) {
                                    alert("Musíš být prostě přihlášený přes Discord!");
                                    return;
                                }
                                sendDiscordWebhookTrain(`✅ ${user.username} převzal vlak ${train.TrainNoLocal}`);
                                saveActivity(user, train);
                                modal.classList.remove('active');
                                setTimeout(() => {
                                    if (document.body.contains(modal)) modal.remove();
                                    showTrainDetailModal(user, train);
                                }, 350);
                            }
                        });
                    });
                });
            }

            renderTrains();

            searchInput.oninput = (e) => {
                renderTrains(e.target.value);
            };
        })
        .catch((err) => {
            document.getElementById('trains-list').innerHTML = `<div class="servers-loading">Nepodařilo se načíst vlaky.<br>${err.message}</div>`;
        });
}

// Modal pro výběr serveru pro výpravčího (Do stanice)
function showStationServerModal() {
    let oldModal = document.getElementById('station-server-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'station-server-modal';
    modal.className = 'server-modal';
    modal.innerHTML = `
        <div class="server-modal-content" style="max-width:500px;">
            <span class="server-modal-close">&times;</span>
            <h2 style="text-align:center;margin-bottom:24px;">Výběr serveru pro stanici</h2>
            <div id="station-servers-list" class="servers-list">
                <div class="servers-loading">Načítám servery...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => { modal.classList.add('active'); }, 10);

    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    fetch('https://panel.simrail.eu:8084/servers-open')
        .then(res => res.json())
        .then(data => {
            const servers = Array.isArray(data.data) ? data.data : [];
            const list = document.getElementById('station-servers-list');
            if (servers.length === 0) {
                list.innerHTML = '<div class="servers-loading">Žádné servery nejsou dostupné.</div>';
                return;
            }
            list.innerHTML = '';
            servers.forEach(server => {
                const isOnline = !!server.IsActive;
                const statusColor = isOnline ? '#43b581' : '#f04747';
                const statusText = isOnline ? 'Online' : 'Offline';
                const div = document.createElement('div');
                div.className = 'server-card';
                div.innerHTML = `
                    <div class="server-header">
                        <span>${server.ServerName}</span>
                        <span class="server-region">${server.ServerRegion}</span>
                    </div>
                    <div class="server-info">
                        <span class="server-status" style="color:${statusColor};font-weight:bold;">
                            ${statusText}
                        </span>
                    </div>
                `;
                if (isOnline) {
                    div.style.cursor = 'pointer';
                    div.onclick = () => {
                        modal.classList.remove('active');
                        setTimeout(() => modal.remove(), 300);
                        // Po výběru serveru zobrazit modal se stanicemi
                        showStationListModal(server.ServerCode);
                    };
                } else {
                    div.style.opacity = '0.6';
                    div.style.cursor = 'not-allowed';
                }
                list.appendChild(div);
            });
        })
        .catch(() => {
            document.getElementById('station-servers-list').innerHTML = '<div class="servers-loading">Nepodařilo se načíst servery.</div>';
        });
}

// Modal pro výběr stanice na serveru
function showStationListModal(serverCode) {
    let oldModal = document.getElementById('station-list-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'station-list-modal';
    modal.className = 'server-modal';
    modal.innerHTML = `
        <div class="server-modal-content" style="max-width:700px;">
            <span class="server-modal-close">&times;</span>
            <h2 style="text-align:center;margin-bottom:24px;">Výběr stanice</h2>
            <input id="station-search" type="text" placeholder="Hledat stanici..." style="width:100%;margin-bottom:18px;padding:10px 16px;font-size:1.1em;border-radius:8px;border:1px solid #43b581;background:#23272a;color:#fff;">
            <div id="stations-list" class="servers-list">
                <div class="servers-loading">Načítám stanice...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => { modal.classList.add('active'); }, 10);
    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    fetch(`https://panel.simrail.eu:8084/stations-open?serverCode=${serverCode}`)
        .then(res => res.json())
        .then(data => {
            const stations = Array.isArray(data.data) ? data.data : [];
            const list = document.getElementById('stations-list');
            const searchInput = document.getElementById('station-search');
            function renderStations(filter = '') {
                let filtered = stations;
                if (filter.trim()) {
                    const f = filter.trim().toLowerCase();
                    filtered = stations.filter(station =>
                        station.Name.toLowerCase().includes(f) ||
                        (station.Prefix && station.Prefix.toLowerCase().includes(f))
                    );
                }
                if (filtered.length === 0) {
                    list.innerHTML = '<div class="servers-loading">Žádné stanice neodpovídají hledání.</div>';
                    return;
                }
                list.innerHTML = '';
                filtered.forEach(station => {
                    const isOccupied = Array.isArray(station.DispatchedBy) && station.DispatchedBy.length > 0;
                    const div = document.createElement('div');
                    div.className = 'server-card';
                    div.style.border = isOccupied ? '2px solid #f04747' : '2px solid #43b581';
                    div.style.background = `url('${station.MainImageURL}') center center/cover no-repeat`;
                    div.style.position = 'relative';
                    div.innerHTML = `
                        <div style="position:absolute;top:12px;left:16px;z-index:2;text-align:left;">
                            <span style="font-size:1.25em;font-weight:bold;color:#fff;text-shadow:0 2px 8px #23272a;">${station.Name}</span>
                        </div>
                        <div style="position:absolute;bottom:12px;left:16px;z-index:2;text-align:left;">
                            <span style="font-size:1.08em;font-weight:bold;color:${isOccupied ? '#f04747' : '#43b581'};text-shadow:0 2px 8px #23272a;">
                                ${isOccupied ? 'Obsazeno' : 'Volná'}
                            </span>
                        </div>
                        <div style="position:absolute;bottom:12px;right:16px;z-index:2;text-align:right;">
                            <span style="font-size:1.08em;color:#ffe066;font-weight:bold;text-shadow:0 2px 8px #23272a;">Obtížnost: ${station.DifficultyLevel}</span>
                        </div>
                    `;
                    div.onclick = () => {
                        modal.classList.remove('active');
                        setTimeout(() => modal.remove(), 300);
                        showStationTakeoverModal(station, serverCode, isOccupied);
                    };
                    list.appendChild(div);
                });
            }
            renderStations();
            searchInput.addEventListener('input', e => {
                renderStations(e.target.value);
            });
        })
        .catch(() => {
            document.getElementById('stations-list').innerHTML = '<div class="servers-loading">Nepodařilo se načíst stanice.</div>';
        });
}

// Modal pro převzetí stanice
function showStationTakeoverModal(station, serverCode, isOccupied = false) {
    let oldModal = document.getElementById('station-takeover-modal');
    if (oldModal) oldModal.remove();
    const modal = document.createElement('div');
    modal.id = 'station-takeover-modal';
    modal.className = 'server-modal';
    modal.innerHTML = `
        <div class="server-modal-content" style="max-width:420px;">
            <span class="server-modal-close">&times;</span>
            <h2 style="text-align:center;margin-bottom:24px;">${isOccupied ? 'Stanice je obsazena' : 'Převzít stanici'}: ${station.Name}</h2>
            <div style="text-align:center;margin-bottom:18px;color:${isOccupied ? '#f04747' : '#43b581'};font-weight:bold;">
                ${isOccupied ? 'Stanici aktuálně někdo obsluhuje. Pokud ji převezmete, může dojít k odpojení původního výpravčího.' : 'Stanice je volná.'}
            </div>
            <div style="display:flex;gap:18px;justify-content:center;">
                <button id="station-takeover-btn" class="profile-btn profile-btn-green" style="font-size:1.15em;">Převzít</button>
                <button id="station-cancel-btn" class="profile-btn profile-btn-red" style="font-size:1.15em;">Zavřít</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => { modal.classList.add('active'); }, 10);
    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    document.getElementById('station-cancel-btn').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    document.getElementById('station-takeover-btn').onclick = async () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
        // Odeslat zprávu na Discord webhook
        let username = window.currentUser?.username;
        if (!username && window.localStorage) {
            const userStr = localStorage.getItem('discord_user');
            if (userStr) {
                try {
                    const userObj = JSON.parse(userStr);
                    username = userObj.username;
                } catch (e) {}
            }
            if (!username) {
                username = localStorage.getItem('discord_username') || 'Neznámý uživatel';
            }
        }
        fetch('https://discord.com/api/webhooks/1410994456626466940/7VL6CZeo7ST5GFDkeYo-pLXy_RmVpvwVF-MhEp7ECJq2KWh2Z9IQSLO7F9S6OgTiYFkL', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `:train2: **${username}** převzal stanici **${station.Name}** (${station.Prefix})` })
        });
        // Přidání výpravčího do stavu
    // addDispatcher(window.discordUser); (odstraněno)
        showDispatcherPanel(station, serverCode);
    };
}

// Panel výpravčího
function showDispatcherPanel(station, serverCode) {
    let oldPanel = document.getElementById('dispatcher-panel');
    if (oldPanel) oldPanel.remove();
    const panel = document.createElement('div');
    panel.id = 'dispatcher-panel';
    panel.style.position = 'fixed';
    panel.style.top = '0';
    panel.style.left = '0';
    panel.style.width = '100vw';
    panel.style.height = '100vh';
    panel.style.background = 'rgba(24,26,32,0.98)';
    panel.style.zIndex = '10002';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.justifyContent = 'center';
    panel.style.alignItems = 'center';
    panel.style.animation = 'modalFadeIn 0.4s';
    panel.innerHTML = `
    <div style="position:relative;max-width:1200px;width:98vw;max-height:90vh;overflow-y:auto;background:rgba(44,47,51,0.98);border-radius:24px;box-shadow:0 8px 40px #23272a99;padding:38px 38px 32px 38px;">
            <span id="dispatcher-minimize" style="position:absolute;top:18px;right:54px;font-size:2.2em;color:#fff;cursor:pointer;z-index:2;transition:color 0.2s;">&#8211;</span>
            <span id="dispatcher-close" style="position:absolute;top:18px;right:18px;font-size:2.2em;color:#fff;cursor:pointer;z-index:2;transition:color 0.2s;">&times;</span>
            <div style="text-align:center;margin-bottom:18px;">
                <span style="font-size:2.2em;font-weight:bold;color:#ffe066;text-shadow:0 2px 12px #23272a;">${station.Name}</span>
            </div>
            <div style="text-align:center;margin-bottom:18px;">
                <span id="dispatcher-time" style="font-size:1.5em;color:#fff;font-weight:bold;letter-spacing:2px;text-shadow:0 2px 8px #23272a;"></span>
            </div>
            <div style="display:flex;flex-direction:column;gap:38px;justify-content:center;align-items:center;">
                <div style="width:100%;max-width:1100px;">
                    <h3 style="color:#43b581;text-align:center;margin-bottom:12px;font-size:1.3em;">Odjezdy</h3>
                    <div id="dispatcher-departures" class="train-timetable-table" style="border-radius:16px;overflow:hidden;"></div>
                </div>
                <div style="width:100%;max-width:1100px;">
                    <h3 style="color:#ffe066;text-align:center;margin-bottom:12px;font-size:1.3em;">Příjezdy</h3>
                    <div id="dispatcher-arrivals" class="train-timetable-table" style="border-radius:16px;overflow:hidden;"></div>
                </div>
            </div>
            <div style="display:flex;justify-content:flex-end;align-items:center;margin-top:32px;gap:18px;">
                <button id="dispatcher-end" class="profile-btn profile-btn-red" style="font-size:1.15em;">Ukončit směnu</button>
            </div>
        </div>
        <div id="dispatcher-minimized" style="display:none;position:fixed;bottom:32px;right:32px;z-index:10003;">
            <button id="dispatcher-restore" class="profile-btn profile-btn-green" style="font-size:1.15em;padding:12px 32px;">Obnovit panel výpravčího</button>
        </div>
    `;
    document.body.appendChild(panel);

    // Animace fade-in
    setTimeout(() => { panel.style.opacity = '1'; }, 10);

    // Živý čas
    function updateTime() {
        const el = document.getElementById('dispatcher-time');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    }
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Minimalizace
    document.getElementById('dispatcher-minimize').onclick = () => {
        panel.querySelector('div').style.display = 'none';
        document.getElementById('dispatcher-minimized').style.display = 'block';
    };
    document.getElementById('dispatcher-restore').onclick = () => {
        panel.querySelector('div').style.display = 'block';
        document.getElementById('dispatcher-minimized').style.display = 'none';
    };
    // Stránkování - globální stav
    window.dispatcherPages = { departures: 1, arrivals: 1 };

    // Ukončení směny
    document.getElementById('dispatcher-close').onclick = endShift;
    document.getElementById('dispatcher-end').onclick = endShift;
    // Načtení a auto-refresh dat pro tabulky odjezdů/příjezdů přes proxy EDR
    let dispatcherData = { departures: [], arrivals: [] };
    let dispatcherRefreshInterval = null;
    function fetchDispatcherData() {
        fetch(`/api/simrail-timetable?serverCode=${serverCode}&edr=true`)
            .then(res => res.json())
            .then(data => {
                const departures = [];
                const arrivals = [];
                const now = new Date();
                data.forEach(train => {
                    if (Array.isArray(train.timetable)) {
                        train.timetable.forEach((stop, idx) => {
                            if (stop.nameForPerson === station.Name) {
                                // Odjezd: pokud má departureTime a vlak je ještě na stanici
                                if (stop.departureTime && (!stop.hasLeft || new Date(stop.departureTime) >= now)) {
                                    // Další stanice za mnou
                                    const nextStop = train.timetable[idx+1];
                                    // Stanice předemnou
                                    const prevStop = train.timetable[idx-1];
                                    departures.push({
                                        train,
                                        stop,
                                        track: stop.track || stop.platform || stop.Track || stop.Platform || '-',
                                        nextStation: nextStop ? nextStop.nameForPerson : '-',
                                        prevStation: prevStop ? prevStop.nameForPerson : '-',
                                    });
                                }
                                // Příjezd: pokud má arrivalTime a vlak ještě nepřijel
                                if (stop.arrivalTime && (!stop.hasArrived || new Date(stop.arrivalTime) >= now)) {
                                    const nextStop = train.timetable[idx+1];
                                    const prevStop = train.timetable[idx-1];
                                    arrivals.push({
                                        train,
                                        stop,
                                        track: stop.track || stop.platform || '-',
                                        nextStation: nextStop ? nextStop.nameForPerson : '-',
                                        prevStation: prevStop ? prevStop.nameForPerson : '-',
                                    });
                                }
                            }
                        });
                    }
                });
                // Seřadit podle času
                const sortByTime = (a, b) => {
                    const ta = new Date(a.stop.departureTime || a.stop.arrivalTime);
                    const tb = new Date(b.stop.departureTime || b.stop.arrivalTime);
                    return ta - tb;
                };
                dispatcherData.departures = departures.filter(d => {
                    const t = new Date(d.stop.departureTime || d.stop.arrivalTime);
                    // Vlak zůstává v tabulce dokud neodjede a čas odjezdu je >= aktuální čas
                    return !d.stop.hasLeft && t >= now;
                }).sort(sortByTime);
                dispatcherData.arrivals = arrivals.filter(a => {
                    const t = new Date(a.stop.arrivalTime || a.stop.departureTime);
                    // Vlak zůstává v tabulce dokud nepřijede a čas příjezdu je >= aktuální čas
                    return !a.stop.hasArrived && t >= now;
                }).sort(sortByTime);
                // Zobraz dvě samostatné tabulky pro odjezd a příjezd
                renderDispatcherTable('dispatcher-departures', dispatcherData.departures, 'Odjezd');
                renderDispatcherTable('dispatcher-arrivals', dispatcherData.arrivals, 'Příjezd');
            });
    }
    // Funkce pro stránkování lze upravit později, nyní zobrazujeme vše
    // Načti data do tabulky hned po otevření panelu
    fetchDispatcherData();
    // Nová funkce: samostatné tabulky pro odjezdy a příjezdy s ručním potvrzením odjezdu
    function renderDispatcherTable(containerId, items, movementType) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!Array.isArray(items) || items.length === 0) {
            container.innerHTML = '<div style="color:#aaa;text-align:center;padding:18px 0;font-size:1.1em;">Žádné spoje</div>';
            return;
        }
        // Seřadit podle času
        const sortedItems = items.slice().sort((a, b) => {
            const ta = new Date(movementType === 'Odjezd' ? a.stop.departureTime : a.stop.arrivalTime);
            const tb = new Date(movementType === 'Odjezd' ? b.stop.departureTime : b.stop.arrivalTime);
            return ta - tb;
        });
        // Stránkování
        const perPage = 8;
        if (!container._page) container._page = 1;
        const totalPages = Math.max(1, Math.ceil(sortedItems.length / perPage));
        if (container._page > totalPages) container._page = totalPages;
        const start = (container._page - 1) * perPage;
        const visibleItems = sortedItems.slice(start, start + perPage);
        let html = `<div class="train-timetable-table-container"><table class="train-timetable-table" style="min-width:900px;width:100%;">`;
        html += `<thead><tr>`;
        html += `<th class="${movementType === 'Odjezd' ? 'edr-odjezdy' : 'edr-prijezdy'}">Vlak</th>`;
        html += `<th class="${movementType === 'Odjezd' ? 'edr-odjezdy' : 'edr-prijezdy'}">Čas</th>`;
        html += `<th class="${movementType === 'Odjezd' ? 'edr-odjezdy' : 'edr-prijezdy'}">Stanice</th>`;
        html += `<th class="${movementType === 'Odjezd' ? 'edr-odjezdy' : 'edr-prijezdy'}">Kolej</th>`;
        if (movementType === 'Příjezd') {
            html += `<th class="edr-prijezdy">Další stanice</th>`;
            html += `<th class="edr-prijezdy">Předchozí stanice</th>`;
        }
        html += `</tr></thead><tbody>`;
        visibleItems.forEach(({train, stop, track, nextStation, prevStation}, idx) => {
            const trainNo = train.trainNoLocal || train.trainNo || train.TrainNoLocal || train.TrainNo || '-';
            const trainName = train.trainName || train.TrainName || '';
            const endStation = train.endStation || train.EndStation || (Array.isArray(train.timetable) ? (train.timetable.length > 0 ? train.timetable[train.timetable.length-1].nameForPerson : '-') : '-');
            const startStation = train.startStation || train.StartStation || (Array.isArray(train.timetable) ? (train.timetable.length > 0 ? train.timetable[0].nameForPerson : '-') : '-');
            const timeStr = movementType === 'Odjezd' ? stop.departureTime : stop.arrivalTime;
            const zebra = idx % 2 === 0 ? 'edr-zebra1' : 'edr-zebra2';
            html += `<tr class="${zebra}">`;
            html += `<td class="edr-vlak" onclick="window.showTrainDetailModal && window.showTrainDetailModal(null, ${JSON.stringify(train).replace(/"/g,'&quot;')} )">${trainNo} <span class="edr-vlakname">${trainName}</span></td>`;
            html += `<td class="edr-cas">${timeStr ? timeStr.substring(11,16) : '-'}</td>`;
            html += `<td class="edr-stanice">${movementType === 'Odjezd' ? endStation : startStation}</td>`;
            html += `<td class="edr-kolej">${track && track !== '-' ? track : '-'}</td>`;
            if (movementType === 'Příjezd') {
                html += `<td class="edr-dalsistanice">${nextStation || '-'}</td>`;
                html += `<td class="edr-predchozistanice">${prevStation || '-'}</td>`;
            }
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
        // Pagination controls
        if (totalPages > 1) {
            html += `<div class=\"dispatcher-pagination\" style=\"text-align:center;margin:12px 0;\">`;
            html += `<button class=\"profile-btn\" style=\"margin-right:8px;\" ${container._page === 1 ? 'disabled' : ''}>◀</button>`;
            html += `<span style=\"color:#ffe066;font-weight:bold;margin:0 8px;\">Stránka ${container._page} / ${totalPages}</span>`;
            html += `<button class=\"profile-btn\" style=\"margin-left:8px;\" ${container._page === totalPages ? 'disabled' : ''}>▶</button>`;
            html += `</div>`;
        }
        container.innerHTML = html;
        // Event handler pro potvrzení odjezdu
        if (movementType === 'Odjezd') {
            container.querySelectorAll('.confirm-departure-btn').forEach(btn => {
                btn.onclick = function() {
                    const trainNo = btn.getAttribute('data-trainno');
                    btn.disabled = true;
                    btn.textContent = 'Odjezd potvrzen';
                    sendDiscordWebhookTrain(`✅ Odjezd vlaku ${trainNo} ze stanice byl ručně potvrzen výpravčím.`);
                };
            });
        }
        // Event handler pro stránkování
        const pagBtns = container.querySelectorAll('.dispatcher-pagination button');
        if (pagBtns.length === 2) {
            pagBtns[0].onclick = () => {
                if (container._page > 1) {
                    container._page--;
                    renderDispatcherTable(containerId, items, movementType);
                }
            };
            pagBtns[1].onclick = () => {
                if (container._page < totalPages) {
                    container._page++;
                    renderDispatcherTable(containerId, items, movementType);
                }
            };
        }
        // Moderní styl pro tabulku a stránkování
        const style = document.createElement('style');
        style.innerHTML = `
            @media (max-width: 900px) {
                .dispatcher-table th, .dispatcher-table td { font-size: 0.95em; padding: 5px 4px; }
            }
            @media (max-width: 600px) {
                .dispatcher-table th, .dispatcher-table td { font-size: 0.85em; padding: 3px 2px; }
            }
            .dispatcher-table-modern { border-radius: 18px; box-shadow: 0 4px 32px #23272a99; background: rgba(44,47,51,0.98); }
            .dispatcher-table thead th { position: sticky; top: 0; background: #23272a; z-index: 2; }
            .dispatcher-table tr:hover { background: #23272a; }
            .dispatcher-pagination { margin-top: 8px; }
            .dispatcher-pagination button { font-size: 1.1em; font-weight: bold; border-radius: 8px; padding: 8px 18px; background: linear-gradient(90deg,#43b581 80%,#ffe066 100%); color: #23272a; border: none; box-shadow: 0 2px 8px #43b581; cursor: pointer; transition: box-shadow 0.2s, background 0.2s; }
            .dispatcher-pagination button:disabled { background: #23272a; color: #aaa; cursor: not-allowed; box-shadow: none; }
            .dispatcher-pagination span { font-size: 1.1em; }
        `;
        document.head.appendChild(style);
    }

    // Nová funkce: sloučená tabulka příjezdů/odjezdů
    function renderDispatcherUnifiedTable(containerId, departures, arrivals) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const allItems = [];
        departures.forEach(item => allItems.push({ ...item, movement: 'Odjezd' }));
        arrivals.forEach(item => allItems.push({ ...item, movement: 'Příjezd' }));
        if (allItems.length === 0) {
            container.innerHTML = '<div style="color:#aaa;text-align:center;padding:18px 0;font-size:1.1em;">Žádné spoje</div>';
            return;
        }
        // Seřadit podle času (odjezd/příjezd) a zobrazit jen prvních 8 vlaků
        allItems.sort((a, b) => {
            const ta = new Date(a.movement === 'Odjezd' ? a.stop.departureTime : a.stop.arrivalTime);
            const tb = new Date(b.movement === 'Odjezd' ? b.stop.departureTime : b.stop.arrivalTime);
            return ta - tb;
        });
        const visibleItems = allItems.slice(0, 8);
        let html = `<div class="train-timetable-table-container"><table class="train-timetable-table" style="min-width:900px;width:100%;">`;
        html += `<thead><tr>`;
        html += `<th style="color:${movementType === 'Odjezd' ? '#43b581' : '#ffe066'};background:#23272a;">Vlak</th>`;
        html += `<th style="color:${movementType === 'Odjezd' ? '#43b581' : '#ffe066'};background:#23272a;">Čas</th>`;
        html += `<th style="color:${movementType === 'Odjezd' ? '#43b581' : '#ffe066'};background:#23272a;">Stanice</th>`;
        html += `<th style="color:${movementType === 'Odjezd' ? '#43b581' : '#ffe066'};background:#23272a;">Kolej</th>`;
        if (movementType === 'Příjezd') {
            html += `<th style="color:#ffe066;background:#23272a;">Další stanice</th>`;
            html += `<th style="color:#ffe066;background:#23272a;">Předchozí stanice</th>`;
        }
        html += `</tr></thead><tbody>`;
        visibleItems.forEach(({train, stop, track, nextStation, prevStation}, idx) => {
            const trainNo = train.trainNoLocal || train.trainNo || train.TrainNoLocal || train.TrainNo || '-';
            const trainName = train.trainName || train.TrainName || '';
            const endStation = train.endStation || train.EndStation || (Array.isArray(train.timetable) ? (train.timetable.length > 0 ? train.timetable[train.timetable.length-1].nameForPerson : '-') : '-');
            const startStation = train.startStation || train.StartStation || (Array.isArray(train.timetable) ? (train.timetable.length > 0 ? train.timetable[0].nameForPerson : '-') : '-');
            const timeStr = movementType === 'Odjezd' ? stop.departureTime : stop.arrivalTime;
            const zebra = idx % 2 === 0 ? 'background:#23272a;' : 'background:#23272a99;';
            html += `<tr style="${zebra}transition:background 0.2s;" onmouseover="this.style.background='#23272a66';" onmouseout="this.style.background='${zebra.replace('background:','')}';">`;
            html += `<td style="color:#fff;font-weight:bold;padding:14px 16px;cursor:pointer;" onclick="window.showTrainDetailModal && window.showTrainDetailModal(null, ${JSON.stringify(train).replace(/"/g,'&quot;')} )">${trainNo} <span style="color:#aaa;font-weight:normal;">${trainName}</span></td>`;
            html += `<td style="color:#fff;padding:14px 16px;">${timeStr ? timeStr.substring(11,16) : '-'}</td>`;
            html += `<td style="color:#fff;padding:14px 16px;">${movementType === 'Odjezd' ? endStation : startStation}</td>`;
            html += `<td style="color:#ffe066;font-weight:bold;padding:14px 16px;">${track && track !== '-' ? track : '-'}</td>`;
            if (movementType === 'Příjezd') {
                html += `<td style="color:#43b581;font-weight:bold;padding:14px 16px;">${nextStation || '-'}</td>`;
                html += `<td style="color:#43b581;font-weight:bold;padding:14px 16px;">${prevStation || '-'}</td>`;
            }
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }

    // Přidání/odebrání výpravčího při příchodu/odchodu ze služby
    document.addEventListener('DOMContentLoaded', () => {
        const user = window.discordUser;
        if (!user || !user.id) return;

        // Při příchodu do služby
        document.getElementById('profile-arrival').onclick = () => {
            db.ref('users/' + user.id).update({ working: true });
            sendDiscordWebhookArrival(`✅ ${user.username} přišel do služby`);
            // addDispatcher(user); (odstraněno)
        };

        // Při odchodu ze služby
        document.getElementById('profile-leave').onclick = () => {
            db.ref('users/' + user.id).update({ working: false });
            sendDiscordWebhookArrival(`❌ ${user.username} odešel ze služby`);
            // removeDispatcher(user.id); (odstraněno)
        };
    });

    // Oprava: při odchodu ze služby odstranění výpravčího ze stavu
    function endShift() {
        panel.style.animation = 'modalFadeOut 0.4s';
        setTimeout(() => {
            panel.remove();
            clearInterval(timeInterval);
        }, 350);
        // Odeslat zprávu na Discord webhook
        let username = window.currentUser?.username;
        if (!username && window.localStorage) {
            const userStr = localStorage.getItem('discord_user');
            if (userStr) {
                try {
                    const userObj = JSON.parse(userStr);
                    username = userObj.username;
                } catch (e) {}
            }
            if (!username) {
                username = localStorage.getItem('discord_username') || 'Neznámý uživatel';
            }
        }
        fetch('https://discord.com/api/webhooks/1410994456626466940/7VL6CZeo7ST5GFDkeYo-pLXy_RmVpvwVF-MhEp7ECJq2KWh2Z9IQSLO7F9S6OgTiYFkL', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `:wave: **${username}** opustil stanici **${station.Name}** (${station.Prefix})` })
        });
        // Odstranění výpravčího ze stavu
    // removeDispatcher(window.discordUser.id); (odstraněno)
    }
} 