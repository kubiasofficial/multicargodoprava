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

function initializeEmployeesTable() {
    const tableContainerId = 'employees-table-container';
    const tableId = 'employees-table';

    // Vytvoří HTML strukturu pro tabulku
    const tableHtml = `
        <h2 style="color:#fff;text-align:center;">Zaměstnanci</h2>
        <div id="${tableContainerId}" class="employee-table-container">
            <table id="${tableId}" class="employee-table">
                <thead>
                    <tr><th>Avatar</th><th>Jméno</th><th>Role</th></tr>
                </thead>
                <tbody></tbody>
            </table>
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
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Strojvedoucí je ve vývoji.</h2>';
                background.style.background = "url('/Pictures/1185.png') center center/cover no-repeat";
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
    }

    const clickable = document.getElementById('profile-clickable');
    if (clickable) {
        clickable.onclick = () => {
            // Přidáme výběr role do modálního okna
            const modal = document.getElementById('work-modal');
            modal.classList.add('active');
            let roleSelect = document.getElementById('role-select');
            if (!roleSelect) {
                // Přidáme select do modalu pokud tam není
                const modalContent = modal.querySelector('.modal-content') || modal;
                const selectHtml = `
                    <div style="margin-bottom:16px;">
                        <label for="role-select" style="color:#fff;font-weight:bold;">Vyberte roli:</label>
                        <select id="role-select" style="margin-left:12px;padding:6px 12px;border-radius:6px;">
                            <option value="">--Vyberte--</option>
                            <option value="Strojvedoucí">Strojvedoucí</option>
                            <option value="Výpravčí">Výpravčí</option>
                            <option value="Řidič">Řidič</option>
                        </select>
                    </div>
                `;
                modalContent.insertAdjacentHTML('afterbegin', selectHtml);
                roleSelect = document.getElementById('role-select');
            }
            // Nastavíme aktuální roli uživatele pokud existuje
            db.ref('users/' + user.id).once('value').then(snap => {
                if (snap.val() && snap.val().role) {
                    roleSelect.value = snap.val().role;
                }
            });

            // Uložíme roli při změně
            roleSelect.onchange = () => {
                selectedRole = roleSelect.value;
                db.ref('users/' + user.id).update({ role: selectedRole });
            };

            // Změna stránky podle role po zavření modalu
            const closeBtn = document.getElementById('work-modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.classList.remove('active');
                    if (selectedRole === 'Strojvedoucí') setPage('strojvedouci');
                    else if (selectedRole === 'Výpravčí') setPage('vypravci');
                    else if (selectedRole === 'Řidič') setPage('ridic');
                };
            }
            const arrivalBtn = document.getElementById('work-arrival');
            if (arrivalBtn) {
                arrivalBtn.onclick = () => {
                    modal.classList.remove('active');
                    db.ref('users/' + user.id).update({ working: true, role: roleSelect.value });
                    selectedRole = roleSelect.value;
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
                    // Změna stránky podle role
                    if (selectedRole === 'Strojvedoucí') setPage('strojvedouci');
                    else if (selectedRole === 'Výpravčí') setPage('vypravci');
                    else if (selectedRole === 'Řidič') setPage('ridic');
                };
            }
            const leaveBtn = document.getElementById('work-leave');
            if (leaveBtn) {
                leaveBtn.onclick = () => {
                    modal.classList.remove('active');
                    db.ref('users/' + user.id).update({ working: false, role: roleSelect.value });
                    selectedRole = roleSelect.value;
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

// Spustit navigaci na výchozí stránku při načtení
setPage('prehled');