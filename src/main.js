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

    // První načtení
    updateTable();

    // Zruší předchozí interval pokud existuje
    if (employeesInterval) clearInterval(employeesInterval);

    // Aktualizace každých 30 sekund
    employeesInterval = setInterval(updateTable, 30000);
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
                        <button id="jizda-btn" class="jizda-btn"></button>
                    </div>
                `;
                // Přidáme event na tlačítko Jízda
                setTimeout(() => {
                    const btn = document.getElementById('jizda-btn');
                    if (btn) btn.onclick = showServerModal;
                }, 50);
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
            })
            .catch(() => {
                if (modal) modal.style.display = 'flex';
            });
    } else {
        if (modal) modal.style.display = 'flex';
    }
});

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
            // Modal pro příchod/odchod z práce, role se vybírá v panelu vpravo nahoře
            const modal = document.getElementById('work-modal');
            modal.classList.add('active');
            // Skryjeme výběr role v modalu pokud existuje
            const roleSelect = document.getElementById('role-select');
            if (roleSelect) roleSelect.parentElement.style.display = 'none';

            // Změna stránky podle role po zavření modalu
            const closeBtn = document.getElementById('work-modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.classList.remove('active');
                };
            }
            const arrivalBtn = document.getElementById('work-arrival');
            if (arrivalBtn) {
                arrivalBtn.onclick = () => {
                    modal.classList.remove('active');
                    db.ref('users/' + user.id).update({ working: true });
                    const now = new Date();
                    const timeString = now.toLocaleString('cs-CZ');
                    fetch('https://discordapp.com/api/webhooks/1409855386642812979/7v9D_DcBwHVbyHxyEa6M5camAMlFWBF4NXSQvPns8vMm1jpp-GczCjhDqc7Hdq_7B1nK', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            embeds: [{
                                title: 'Příchod do práce',
                                description: `Uživatel **${user.username}** přišel do práce.`,
                                color: 0x43b581,
                                thumbnail: {
                                    url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined
                                },
                                footer: {
                                    text: `Čas: ${timeString}`
                                }
                            }]
                        })
                    });
                };
            }
            const leaveBtn = document.getElementById('work-leave');
            if (leaveBtn) {
                leaveBtn.onclick = () => {
                    modal.classList.remove('active');
                    db.ref('users/' + user.id).update({ working: false });
                    const now = new Date();
                    const timeString = now.toLocaleString('cs-CZ');
                    fetch('https://discordapp.com/api/webhooks/1409855386642812979/7v9D_DcBwHVbyHxyEa6M5camAMlFWBF4NXSQvPns8vMm1jpp-GczCjhDqc7Hdq_7B1nK', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            embeds: [{
                                title: 'Odchod z práce',
                                description: `Uživatel **${user.username}** odešel z práce.`,
                                color: 0xf04747,
                                thumbnail: {
                                    url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined
                                },
                                footer: {
                                    text: `Čas: ${timeString}`
                                }
                            }]
                        })
                    });
                };
            }
        }
    } else {
        console.warn('profile-clickable nenalezen, event handler nenavázán!');
    }
}

function showServerModal() {
    // Pokud modal už existuje, smažeme ho
    let oldModal = document.getElementById('server-modal');
    if (oldModal) oldModal.remove();

    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.id = 'server-modal';
    modal.className = 'server-modal';
    modal.innerHTML = `
        <div class="server-modal-content">
            <span class="server-modal-close">&times;</span>
            <h2 style="text-align:center;margin-bottom:24px;">Výběr serveru SimRail</h2>
            <div id="servers-list" class="servers-list">
                <div class="servers-loading">Načítám servery...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Animace zobrazení
    setTimeout(() => { modal.classList.add('active'); }, 10);

    // Zavření modalu
    modal.querySelector('.server-modal-close').onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    // Načtení serverů z API
    fetch('https://panel.simrail.eu:8084/servers-open')
        .then(res => res.json())
        .then(data => {
            const servers = data.data || [];
            const list = document.getElementById('servers-list');
            if (servers.length === 0) {
                list.innerHTML = '<div class="servers-loading">Žádné servery nejsou dostupné.</div>';
                return;
            }
            list.innerHTML = '';
            servers.forEach(server => {
                const status = server.IsActive ? 'Online' : 'Offline';
                const statusColor = server.IsActive ? '#43b581' : '#f04747';
                let playersHtml = '';
                if (typeof server.PlayerCount !== 'undefined') {
                    playersHtml = `
                        <span class="server-players">
                            <svg width="20" height="20" style="vertical-align:middle;margin-right:4px;" fill="#43b581" viewBox="0 0 24 24"><path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>
                            ${server.PlayerCount} hráčů
                        </span>
                    `;
                }
                // Přidáme onclick na server-card
                list.innerHTML += `
                    <div class="server-card" style="animation: fadeInUp 0.5s;" data-server-id="${server.id}">
                        <div class="server-header">
                            <span class="server-name">${server.ServerName}</span>
                            <span class="server-region">${server.ServerRegion}</span>
                        </div>
                        <div class="server-info">
                            <span class="server-status" style="color:${statusColor};font-weight:bold;">
                                ${status}
                            </span>
                            ${playersHtml}
                        </div>
                    </div>
                `;
            });
            // Event handler pro výběr serveru
            document.querySelectorAll('.server-card').forEach(card => {
                card.onclick = () => {
                    const serverId = card.getAttribute('data-server-id');
                    const server = servers.find(s => s.id === serverId);
                    if (server) {
                        document.getElementById('server-modal').remove();
                        showTrainsModal(server);
                    }
                };
            });
        })
        .catch(() => {
            document.getElementById('servers-list').innerHTML = '<div class="servers-loading">Nepodařilo se načíst servery.</div>';
        });
}

// Mapování typů vozidel na obrázky
const vehicleImages = {
    'eu07': 'https://wiki.simrail.eu/vehicle/eu07-005.jpg',
    'ep08': 'https://wiki.simrail.eu/vehicle/ep08-001.jpg',
    'et22': 'https://wiki.simrail.eu/vehicle/et22-243.png',
    'et25': 'https://wiki.simrail.eu/vehicle/et25-002.jpg',
    'e186': 'https://wiki.simrail.eu/vehicle/e186-134.jpg',
    'ed250': 'https://wiki.simrail.eu/vehicle/ed250-001.png',
    'en57': 'https://wiki.simrail.eu/vehicle/en57-009.png',
    'en76': 'https://wiki.simrail.eu/vehicle/en76-006.jpg'
};
const defaultTrainImage = 'https://wiki.simrail.eu/vehicle/eu07-005.jpg'; // fallback

function getVehicleImage(vehiclesArr) {
    if (!vehiclesArr || vehiclesArr.length === 0) return defaultTrainImage;
    // Vezmeme první vozidlo, např. "EN57/EN57-1000"
    const firstVehicle = vehiclesArr[0].toLowerCase();
    // Najdeme typ (např. "en57")
    const typeMatch = firstVehicle.match(/([a-z0-9]+)/);
    if (typeMatch) {
        const type = typeMatch[1];
        if (vehicleImages[type]) return vehicleImages[type];
    }
    return defaultTrainImage;
}

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
                <div id="server-time-box" class="server-time-box" style="min-width:170px;text-align:right;"></div>
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

    // Zobrazení času serveru a časové zóny
    let serverTimeInterval = null;
    function updateServerTime() {
        // Získání časové zóny
        fetch(`https://api1.aws.simrail.eu:8082/api/getTimeZone?serverCode=${server.ServerCode}`)
            .then(res => res.json())
            .then(timezone => {
                // Získání času
                fetch(`https://api1.aws.simrail.eu:8082/api/getTime?serverCode=${server.ServerCode}`)
                    .then(res => res.json())
                    .then(unixTime => {
                        const date = new Date(Number(unixTime));
                        // Formátování času
                        const hours = date.getUTCHours() + Number(timezone);
                        const minutes = date.getUTCMinutes();
                        const seconds = date.getUTCSeconds();
                        // Ošetření přetečení hodin
                        const displayHours = ((hours % 24) + 24) % 24;
                        const timeStr = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        const tzStr = `UTC${timezone >= 0 ? '+' : ''}${timezone}`;
                        document.getElementById('server-time-box').innerHTML = `
                            <span style="font-size:1.08em;color:#43b581;font-weight:bold;">${timeStr}</span>
                            <span style="font-size:0.95em;color:#aaa;margin-left:6px;">(${tzStr})</span>
                        `;
                    })
                    .catch(() => {
                        document.getElementById('server-time-box').innerHTML = `<span style="color:#f04747;">Chyba času</span>`;
                    });
            })
            .catch(() => {
                document.getElementById('server-time-box').innerHTML = `<span style="color:#f04747;">Chyba zóny</span>`;
            });
    }
    updateServerTime();
    serverTimeInterval = setInterval(updateServerTime, 5000);

    // Vyčistit interval při zavření modalu
    modal.addEventListener('transitionend', () => {
        if (!modal.classList.contains('active') && serverTimeInterval) {
            clearInterval(serverTimeInterval);
        }
    });

    // Načtení vlaků z API
    fetch(`https://panel.simrail.eu:8084/trains-open?serverCode=${server.ServerCode}`)
        .then(res => res.json())
        .then(data => {
            const trains = data.data || [];
            const list = document.getElementById('trains-list');
            const searchInput = document.getElementById('train-search');
            if (trains.length === 0) {
                list.innerHTML = '<div class="servers-loading">Žádné vlaky nejsou dostupné.</div>';
                return;
            }

            // Funkce pro vykreslení vlaků podle filtru
            function renderTrains(filter = '') {
                const filtered = filter
                    ? trains.filter(train => train.TrainNoLocal && train.TrainNoLocal.toString().includes(filter.trim()))
                    : trains;
                if (filtered.length === 0) {
                    list.innerHTML = '<div class="servers-loading">Žádný vlak neodpovídá hledání.</div>';
                    return;
                }
                list.innerHTML = '';
                filtered.forEach(train => {
                    const trainImg = getVehicleImage(train.Vehicles);
                    const isPlayer = train.Type === 'player' || (train.TrainData && train.TrainData.ControlledBySteamID);
                    const status = isPlayer ? 'Hráč' : 'Bot';
                    const statusColor = isPlayer ? '#43b581' : '#f04747';
                    const statusIcon = isPlayer
                        ? '<svg width="20" height="20" fill="#43b581" style="vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
                        : '<svg width="20" height="20" fill="#f04747" style="vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>';
                    const route = `${train.StartStation} → ${train.EndStation}`;
                    const vehicles = train.Vehicles ? train.Vehicles.join(', ') : '';
                    list.innerHTML += `
                        <div class="train-card" style="animation: fadeInUp 0.5s;">
                            <div class="train-header">
                                <img src="${trainImg}" alt="Vlak" class="train-image-lg">
                                <div class="train-info">
                                    <div class="train-number">${train.TrainNoLocal}</div>
                                    <div class="train-name">${train.TrainName}</div>
                                    <div class="train-route">${route}</div>
                                    <div class="train-vehicles">${vehicles}</div>
                                </div>
                                <span class="train-status" style="color:${statusColor};font-weight:bold;display:flex;align-items:center;gap:6px;">
                                    ${statusIcon}${status}
                                </span>
                            </div>
                        </div>
                    `;
                });
            }

            renderTrains();

            // Event handler pro vyhledávání
            searchInput.oninput = (e) => {
                renderTrains(e.target.value);
            };
        })
        .catch(() => {
            document.getElementById('trains-list').innerHTML = '<div class="servers-loading">Nepodařilo se načíst vlaky.</div>';
        });
}

// Spustit navigaci na výchozí stránku při načtení
setPage('prehled');