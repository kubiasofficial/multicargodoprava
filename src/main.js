
// SPA navigation (zatím jen přehled, ostatní stránky prázdné)
const pageTitle = document.querySelector('.page-title');
const pageContent = document.getElementById('page-content');
const navBtns = document.querySelectorAll('.nav-btn');


function setPage(page) {
  const background = document.getElementById('background');
  switch(page) {
    case 'strojvedouci':
      pageTitle.textContent = 'Strojvedoucí';
      pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Strojvedoucí zatím není hotová.</h2>';
      background.style.background = "url('/Pictures/1185.png') center center/cover no-repeat";
      break;
    case 'vypravci':
      pageTitle.textContent = 'Výpravčí';
      pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Výpravčí zatím není hotová.</h2>';
      background.style.background = "url('/Pictures/Koluszki.png') center center/cover no-repeat";
      break;
    case 'ridic':
      pageTitle.textContent = 'Řidič';
      pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Řidič zatím není hotová.</h2>';
      background.style.background = "url('/Pictures/bus.png') center center/cover no-repeat";
      break;
    case 'prehled':
      pageTitle.textContent = 'Přehled';
      pageContent.innerHTML = '';
      background.style.background = "url('/Pictures/1182.png') center center/cover no-repeat";
      break;
    default:
      pageTitle.textContent = 'Přehled';
      pageContent.innerHTML = '';
      background.style.background = "url('/Pictures/1182.png') center center/cover no-repeat";
  }
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setPage(btn.dataset.page);
  });
});


// Discord OAuth2 login logic
window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('discord-modal');
  // Získání access tokenu z URL fragmentu
  const hash = window.location.hash;
  let accessToken = null;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    accessToken = params.get('access_token');
  }

  if (accessToken) {
    // Načtení uživatelských dat z Discord API
    fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(res => res.json())
    .then(user => {
      // Skrytí modálního okna
      if (modal) modal.style.display = 'none';
      // Zobrazení profilu v panelu vlevo dole
      showDiscordProfile(user);
    })
    .catch(() => {
      if (modal) modal.style.display = 'flex';
    });
  } else {
    // Pokud není token, zobraz modal
    if (modal) modal.style.display = 'flex';
  }
});

function showDiscordProfile(user) {
  // Vytvoření/umístění do panelu vlevo dole
  let sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  let profileDiv = document.getElementById('discord-profile');
  if (!profileDiv) {
    profileDiv = document.createElement('div');
    profileDiv.id = 'discord-profile';
    profileDiv.style.position = 'absolute';
    profileDiv.style.left = '0';
    profileDiv.style.bottom = '24px';
    profileDiv.style.width = '100%';
    profileDiv.style.display = 'flex';
    profileDiv.style.alignItems = 'center';
    profileDiv.style.justifyContent = 'center';
    profileDiv.style.gap = '12px';
    profileDiv.style.background = 'rgba(44,47,51,0.7)';
    profileDiv.style.padding = '8px 0';
    sidebar.appendChild(profileDiv);
  }
  profileDiv.innerHTML = `<img src='https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png' alt='pfp' style='width:32px;height:32px;border-radius:50%;background:#222;'> <span style='color:#fff;font-weight:bold;'>${user.username}</span>`;
}

setPage();
