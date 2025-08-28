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
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Výpravčí je ve vývoji. Děkuji za trpělivost.</h2>';
                background.style.background = "url('/Pictures/Koluszki.png') center center/cover no-repeat";
                break;
            case 'ridic':
                pageTitle.textContent = 'Řidič';
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Řidič je ve vývoji.</h2>';
                background.style.background = "url('/Pictures/bus.png') center center/cover no-repeat";
                break;
            case 'prehled':
                pageTitle.textContent = 'Přehled';
                background.style.background = "url('/Pictures/1182.png') center center/cover no-repeat";
                initializeEmployeesTable(); // Teď se volá pouze pro nastavení HTML a listeneru
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
        const params = new URLSearchParams(hash.substring(1));
        accessToken = params.get('access_token');
        // Ulož accessToken do localStorage pro další načtení
        localStorage.setItem('discord_access_token', accessToken);
        // Odstraň hash z URL pro čistotu (bez reloadu)
        window.location.hash = '';
    } else {
        // Zkus načíst accessToken z localStorage
        accessToken = localStorage.getItem('discord_access_token');
    }

    if (accessToken) {
        fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        })
            .then(res => res.json())
            .then(user => {
                if (modal) modal.style.display = 'none';
                showDiscordProfile(user);
                // Ulož uživatele do localStorage a nastav do window.discordUser
                window.discordUser = user;
                localStorage.setItem('discord_user', JSON.stringify(user));
            })
            .catch(() => {
                if (modal) modal.style.display = 'flex';
            });
    } else {
        if (modal) modal.style.display = 'flex';
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
        sendDiscordWebhook(`✅ ${user.username} přišel do služby`);
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    document.getElementById('profile-leave').onclick = () => {
        db.ref('users/' + user.id).update({ working: false });
        sendDiscordWebhook(`❌ ${user.username} odešel ze služby`);
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

// Pomocná funkce pro odeslání zprávy na Discord webhook
function sendDiscordWebhook(content) {
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
    return fetch(`https://api1.aws.simrail.eu:8082/api/getAllTimetables?serverCode=${serverCode}&train=${trainNo}`)
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
        if (Array.isArray(timetableData) && timetableData.length > 0 && timetableData[0].timetable) {
            timetable = timetableData[0].timetable;
        }
    } catch {}

    // Načtení pozice vlaku
    let trainPosition = null;
    try {
        trainPosition = await fetchTrainPosition(train.ServerCode, train.id || train.TrainNoLocal);
    } catch {}

    // Získání aktuální a následující stanice
    const stops = getCurrentAndNextStop(timetable);

    // Aktuální čas (živě aktualizovaný)
    let timeBoxId = 'train-detail-time-box-' + Math.floor(Math.random() * 100000);
    function updateTrainDetailTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('cs-CZ', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const el = document.getElementById(timeBoxId);
        if (el) el.innerHTML = `<span class="train-detail-time-anim">${timeStr}</span>`;
    }

    // Stanice HTML s animací
    let stationsHtml = '';
    if (stops.length > 0) {
        stationsHtml = `
            <div class="train-detail-stations-anim" style="display:flex;flex-direction:column;gap:18px;margin-top:18px;">
                ${stops.map((stop, idx) => {
                    const delay = calculateDelay(stop);
                    const delayHtml = delay > 0
                        ? `<span style="color:#f04747;font-weight:bold;">+${delay} min</span>`
                        : `<span style="color:#43b581;font-weight:bold;">Včas</span>`;
                    return `
                        <div class="train-detail-station-card slide-in" style="background:rgba(44,47,51,0.92);border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.18);padding:14px 18px;">
                            <div style="font-size:1.18em;font-weight:bold;color:${idx === 0 ? '#43b581' : '#ffe066'};">
                                ${idx === 0 ? 'Aktuální stanice:' : 'Následující stanice:'} ${stop.nameForPerson}
                            </div>
                            <div style="color:#fff;">
                                ${stop.arrivalTime ? `Příjezd: <b>${stop.arrivalTime.split(' ')[1]}</b>` : ''}
                                ${stop.departureTime ? `Odjezd: <b>${stop.departureTime.split(' ')[1]}</b>` : ''}
                                ${delayHtml ? ` ${delayHtml}` : ''}
                            </div>
                            <div style="color:#aaa;font-size:0.98em;">
                                ${stop.platform ? `Nástupiště: ${stop.platform}` : ''} ${stop.track ? `Kolej: ${stop.track}` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        stationsHtml = `<div style="margin-top:18px;color:#aaa;">Jízdní řád není dostupný.</div>`;
    }

    // Modal HTML
    modal.innerHTML = `
        <div class="server-modal-content" style="max-width:540px;min-width:340px;position:relative;">
            <span class="server-modal-close">&times;</span>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
                <div style="font-size:1.6em;font-weight:bold;color:#ffe066;">${train.TrainNoLocal}</div>
                <div id="${timeBoxId}" style="font-size:1.25em;color:#43b581;font-weight:bold;"></div>
            </div>
            <div style="font-size:1.15em;font-weight:bold;color:#fff;margin-bottom:8px;">
                ${train.StartStation} <span style="color:#aaa;">→</span> ${train.EndStation}
            </div>
            ${stationsHtml}
            <div style="display:flex;gap:16px;justify-content:center;margin-top:32px;">
                <button id="end-ride-btn" class="profile-btn profile-btn-red">Ukončit jízdu</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => { modal.classList.add('active'); updateTrainDetailTime(); }, 10);
    const interval = setInterval(updateTrainDetailTime, 1000);

    // Zavření modalu
    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            clearInterval(interval);
            modal.remove();
        }, 300);
    };

    // Ukončení jízdy
    document.getElementById('end-ride-btn').onclick = () => {
        sendDiscordWebhook(`❌ ${user.username} ukončil jízdu vlaku ${train.TrainNoLocal}`);
        removeActivity(user);
        modal.classList.remove('active');
        setTimeout(() => {
            clearInterval(interval);
            modal.remove();
        }, 300);
    };
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
                // Filtrovat pouze podle vyhledávání
                if (filter) {
                    filtered = filtered.filter(train => train.TrainNoLocal && train.TrainNoLocal.toString().includes(filter.trim()));
                }
                if (filtered.length === 0) {
                    list.innerHTML = '<div class="servers-loading">Žádný vlak neodpovídá hledání.</div>';
                    return;
                }
                list.innerHTML = '<div class="train-bubbles">';
                filtered.forEach(train => {
                    const trainImg = getVehicleImage(train.Vehicles);
                    const isPlayer = train.Type === 'player' || (train.TrainData && train.TrainData.ControlledBySteamID);
                    const statusIcon = isPlayer
                        ? '<svg width="22" height="22" fill="#43b581" style="vertical-align:middle;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
                        : '<svg width="22" height="22" fill="#f04747" style="vertical-align:middle;" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>';
                    const route = `${train.StartStation} → ${train.EndStation}`;
                    list.innerHTML += `
                        <div class="train-bubble train-bubble-modern" style="cursor:pointer;" data-train-no="${train.TrainNoLocal}">
                            <div class="train-bubble-imgbox-modern">
                                <img src="${trainImg}" alt="Vlak" class="train-bubble-img-modern">
                                <span class="train-bubble-status-modern">${statusIcon}</span>
                            </div>
                            <div class="train-bubble-info-modern">
                                <span class="train-bubble-number-modern">${train.TrainNoLocal}</span>
                                <span class="train-bubble-route-modern">${route}</span>
                            </div>
                        </div>
                    `;
                });
                list.innerHTML += '</div>';

                // Event handler pro kliknutí na vlakovou kartu
                setTimeout(() => {
                    document.querySelectorAll('.train-bubble-modern').forEach(card => {
                        card.onclick = async () => {
                            const trainNo = card.getAttribute('data-train-no');
                            const train = trains.find(t => t.TrainNoLocal == trainNo);
                            if (!train) return;

                            // Modal pro převzetí vlaku
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

                            modal.querySelector('.server-modal-close').onclick = () => {
                                modal.classList.remove('active');
                                setTimeout(() => modal.remove(), 300);
                            };
                            document.getElementById('close-train-btn').onclick = () => {
                                modal.classList.remove('active');
                                setTimeout(() => modal.remove(), 300);
                            };

                            document.getElementById('take-train-btn').onclick = async () => {
                                const user = window.discordUser;
                                if (!user || !user.id) {
                                    alert("Musíš být přihlášený přes Discord!");
                                    return;
                                }
                                db.ref('users/' + user.id).once('value').then(async snap => {
                                    const userData = snap.val();
                                    if (!userData) {
                                        alert("Chyba uživatele.");
                                        return;
                                    }
                                    sendDiscordWebhook(`✅ ${userData.username} převzal vlak ${train.TrainNoLocal}`);
                                    saveActivity(userData, train);
                                    await showTrainDetailModal(userData, train);
                                    modal.classList.remove('active');
                                    setTimeout(() => modal.remove(), 300);
                                });
                            };
                        };
                    });
                }, 50);
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

// Úprava: tabulka Aktivita na stránce Přehled načítá data z /activity
function initializeEmployeesTable() {
    const tableContainerId = 'employees-table-container';
    const tableId = 'employees-table';
    const activityContainerId = 'activity-table-container';
    const activityTableId = 'activity-table';

    // HTML pro tabulku zaměstnanců a aktivitu vedle sebe
    const tableHtml = `
        <div class="tables-flex-container">
            <div id="${tableContainerId}" class="employee-table-container">
                <h2 style="color:#fff;text-align:center;">Zaměstnanci</h2>
                <table id="${tableId}" class="employee-table">
                    <thead>
                        <tr><th>Avatar</th><th>Jméno</th><th>Role</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <div id="${activityContainerId}" class="activity-table-container">
                <h2 style="color:#fff;text-align:center;">Aktivita</h2>
                <table id="${activityTableId}" class="activity-table">
                    <thead>
                        <tr><th>Zaměstnanec</th><th>Práce</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="2" style="text-align:center;">Žádná aktivita zatím není.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Změní obsah stránky "Přehled"
    if (pageContent) {
        pageContent.innerHTML = tableHtml;
    }

    // Získání elementu tabulky pro aktualizace
    const tableBody = document.querySelector(`#${tableId} tbody`);
    if (!tableBody) {
        console.error('Element tabulky pro zaměstnance nebyl nalezen.');
        return;
    }

    // Získání elementu tabulky pro aktivitu
    const activityBody = document.querySelector('#activity-table tbody');

    // Funkce pro načtení zaměstnanců
    function updateTable() {
        db.ref('users').once('value', snapshot => {
            const users = snapshot.val() || {};
            // Filtrujeme pouze zaměstnance ve službě
            const userList = Object.values(users).filter(u => u.working === true);
            tableBody.innerHTML = ''; // Vyčistí tabulku před novým vykreslením

            if (userList.length > 0) {
                userList.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <img src='https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png' alt='${user.username} avatar' style='width:32px;height:32px;border-radius:50%;background:#222;'>
                        </td>
                        <td>
                            ${user.username} <span style="font-size:0.8em;color:#43b581;">🟢 Ve službě</span>
                        </td>
                        <td>
                            ${user.role ? user.role : ''}
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan='3' style='text-align:center;'>Žádný zaměstnanec není ve službě.</td>`;
                tableBody.appendChild(tr);
            }
        });
    }

    // Funkce pro načtení aktivity
    function updateActivityTable() {
        db.ref('activity').once('value', snapshot => {
            const activities = snapshot.val() || {};
            activityBody.innerHTML = '';
            const activityList = Object.values(activities);
            if (activityList.length > 0) {
                activityList.forEach(act => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${act.username}</td>
                        <td>${act.trainNo} ${act.trainName ? '(' + act.trainName + ')' : ''}</td>
                    `;
                    activityBody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan='2' style='text-align:center;'>Žádná aktivita zatím není.</td>`;
                activityBody.appendChild(tr);
            }
        });
    }

    // První načtení
    updateTable();
    updateActivityTable();

    // Zruší předchozí interval pokud existuje
    if (employeesInterval) clearInterval(employeesInterval);

    // Aktualizace každých 30 sekund
    employeesInterval = setInterval(() => {
        updateTable();
        updateActivityTable();
    }, 30000);
}

// Spustit navigaci na výchozí stránku při načtení
setPage('prehled');

// Zajistí dostupnost funkce pro onclick v HTML
window.showServerModal = showServerModal;

// Oprava: tlačítko "Jízda" musí být klikatelné a musí fungovat správně.
// 1. Zajistíme, že funkce showServerModal existuje a otevře modal vlaků.
// 2. Opravíme navázání eventu na tlačítko "Jízda" (použijeme delegaci pro jistotu).

function showServerModal() {
    // Modal pro výběr serveru
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

    // Oprava: status online/offline podle IsActive
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
                        showTrainsModal({
                            ServerName: server.ServerName,
                            ServerCode: server.ServerCode,
                            ServerRegion: server.ServerRegion
                        });
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
window.showServerModal = showServerModal;

// Oprava navázání eventu na tlačítko "Jízda" (delegace pro jistotu)
document.addEventListener('click', function (e) {
    const btn = e.target.closest('#jizda-btn');
    if (btn) {
        e.preventDefault();
        showServerModal();
    }
});

// Přidej funkci getVehicleImage pro zobrazení obrázku vlaku podle Vehicles pole
function getVehicleImage(vehicles) {
    // Pokud není pole nebo je prázdné, vrať defaultní obrázek
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
        return '/Pictures/train_default.png';
    }
    const v = vehicles[0];
    // Přesné mapování na soubory v public\Pictures
    if (v.includes('E186')) return '/Pictures/e186-134.jpg';
    if (v.includes('ED250')) return '/Pictures/ed250-001.png';
    if (v.includes('EN57')) return '/Pictures/en57-009.png';
    if (v.includes('EN76')) return '/Pictures/en76-006.jpg';
    if (v.includes('EP08')) return '/Pictures/ep08-001.jpg';
    if (v.includes('ET22')) return '/Pictures/et22-243.png';
    if (v.includes('ET25')) return '/Pictures/et25-002.jpg';
    if (v.includes('EU07')) return '/Pictures/eu07-005.jpg';
    // Defaultní obrázek
    return '/Pictures/train_default.png';
}

// Při načtení stránky zkus obnovit Discord uživatele z localStorage
if (!window.discordUser) {
    try {
        const userStr = localStorage.getItem('discord_user');
        if (userStr) {
            window.discordUser = JSON.parse(userStr);
        }
    } catch {}
}


// Při načtení stránky zkus obnovit Discord uživatele z localStorage
if (!window.discordUser) {
    try {
        const userStr = localStorage.getItem('discord_user');
        if (userStr) {
            window.discordUser = JSON.parse(userStr);
        }
    } catch {}
}

