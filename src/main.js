
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

setPage();
