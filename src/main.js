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
                    <div style="display:flex;justify-content:center;margin-top:48px;">
                        <button id="stanice-btn" class="stanice-btn">Do stanice</button>
                    </div>
                `;
                background.style.background = "url('/Pictures/Koluszki.png') center center/cover no-repeat";
                setTimeout(() => {
                    const btn = document.getElementById('stanice-btn');
                    if (btn) {
                        btn.onclick = () => {
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
                                pageContent.innerHTML = `
                                    <div class="tables-vertical-container">
                                        <div class="employee-table-container">
                                            <h2>Zaměstnanci ve službě</h2>
                                            <table class="employee-table" id="employee-table">
                                                <thead>
                                                    <tr>
                                                        <th>Uživatel</th>
                                                        <th>Role</th>
                                                    </tr>
                                                </thead>
                                                <tbody></tbody>
                                            </table>
                                        </div>
                                        <div class="activity-table-container">
                                            <h2>Aktivní jízdy</h2>
                                            <table class="activity-table" id="activity-table">
                                                <thead>
                                                    <tr>
                                                        <th>Uživatel</th>
                                                        <th>Vlak</th>
                                                        <th>Čas</th>
                                                    </tr>
                                                </thead>
                                                <tbody></tbody>
                                            </table>
                                        </div>
                                    </div>
                                `;
                                                // Živá aktualizace zaměstnanců ve službě
                                                if (window.employeesListener) window.employeesListener.off();
                                                window.employeesListener = db.ref('users').orderByChild('working').equalTo(true);
                                                window.employeesListener.on('value', snap => {
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
                                                // Živá aktualizace aktivních jízd
                                                if (window.activityListener) window.activityListener.off();
                                                window.activityListener = db.ref('activity');
                                                window.activityListener.on('value', snap => {
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
                localStorage.setItem('discord_access_token', accessToken);
                window.location.hash = '';
        } else {
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
                                window.discordUser = user;
                                localStorage.setItem('discord_user', JSON.stringify(user));
                        })
                        .catch(() => {
                                if (modal) modal.style.display = 'flex';
                        });
        } else {
                if (modal) modal.style.display = 'flex';
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
            <div id=\"train-detail-content\">
                ${stationsHtml}
                <div style=\"display:flex;gap:16px;justify-content:center;margin-top:32px;\">
                    <button id=\"end-ride-btn\" class=\"profile-btn train-modal-btn-simrail\" type=\"button\">Ukončit jízdu</button>
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
                        // Zde můžeš otevřít další modal pro výběr stanice nebo jinou akci
                        alert(`Vybral jsi server: ${server.ServerName}`);
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

// Přidej globálně funkci getDelayHtml, aby byla dostupná i mimo showTrainDetailModal
// ...existing code...

// Přidej globální styl pro tabulky a boxy
(function addCustomTableStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .tables-vertical-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 32px;
        }
        .employee-table-container, .activity-table-container {
            background: rgba(44,47,51,0.92);
            border-radius: 18px;
            box-shadow: 0 8px 32px #23272a99;
            padding: 32px 28px;
            max-width: 600px;
            width: 100%;
        }
        .employee-table th, .activity-table th {
            font-size: 1.1em;
            color: #ffe066;
            background: #23272a;
            padding: 12px 0;
        }
        .employee-table td, .activity-table td {
            font-size: 1em;
            color: #fff;
            padding: 10px 0;
        }
        .employee-table tr, .activity-table tr {
            transition: background 0.2s;
        }
        .employee-table tr:hover, .activity-table tr:hover {
            background: #2c2f33;
        }
        .employee-table, .activity-table {
            border-collapse: separate;
            border-spacing: 0;
        }
        .employee-table-container h2, .activity-table-container h2 {
            font-size: 2em;
            color: #fff;
            text-align: center;
            margin-bottom: 18px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
})();

// Oprava navázání eventu na tlačítko "Jízda" (delegace pro jistotu)
document.addEventListener('click', function (e) {
    const btn = e.target.closest('#jizda-btn');
    if (btn) {
        e.preventDefault();
        showServerModal();
    }
});

// Základní funkce pro zobrazení modalu s výběrem serveru
// ...existing code...
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

// Přidej globálně funkci getDelayHtml, aby byla dostupná i mimo showTrainDetailModal
function getDelayHtml(delay) {
    if (delay > 0) {
        return `<span class="delay-blink" style="background:#f04747;color:#fff;padding:2px 10px;border-radius:6px;font-weight:bold;margin-left:8px;">+${delay} min</span>`;
    } else {
        return `<span style="background:#43b581;color:#fff;padding:2px 10px;border-radius:6px;font-weight:bold;margin-left:8px;">Včas</span>`;
    }
}

// Přidej globální styl pro tabulky a boxy
(function addCustomTableStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .tables-vertical-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 32px;
        }
        .employee-table-container, .activity-table-container {
            background: rgba(44,47,51,0.92);
            border-radius: 18px;
            box-shadow: 0 8px 32px #23272a99;
            padding: 32px 28px;
            max-width: 600px;
            width: 100%;
        }
        .employee-table th, .activity-table th {
            font-size: 1.1em;
            color: #ffe066;
            background: #23272a;
            padding: 12px 0;
        }
        .employee-table td, .activity-table td {
            font-size: 1em;
            color: #fff;
            padding: 10px 0;
        }
        .employee-table tr, .activity-table tr {
            transition: background 0.2s;
        }
        .employee-table tr:hover, .activity-table tr:hover {
            background: #2c2f33;
        }
        .employee-table, .activity-table {
            border-collapse: separate;
            border-spacing: 0;
        }
        .employee-table-container h2, .activity-table-container h2 {
            font-size: 2em;
            color: #fff;
            text-align: center;
            margin-bottom: 18px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
})();

// Oprava navázání eventu na tlačítko "Jízda" (delegace pro jistotu)
document.addEventListener('click', function (e) {
    const btn = e.target.closest('#jizda-btn');
    if (btn) {
        e.preventDefault();
        showServerModal();
    }
});



