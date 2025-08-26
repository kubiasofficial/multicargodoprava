
// SPA navigation (zatím jen přehled, ostatní stránky prázdné)
const pageTitle = document.querySelector('.page-title');
const pageContent = document.getElementById('page-content');
const navBtns = document.querySelectorAll('.nav-btn');

function setPage(page) {
  switch(page) {
    case 'strojvedouci':
      pageTitle.textContent = 'Strojvedoucí';
      pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Strojvedoucí zatím není hotová.</h2>';
      break;
    case 'vypravci':
      pageTitle.textContent = 'Výpravčí';
      pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Výpravčí zatím není hotová.</h2>';
      break;
    case 'ridic':
      pageTitle.textContent = 'Řidič';
      pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Řidič zatím není hotová.</h2>';
      break;
    default:
      pageTitle.textContent = 'Přehled';
      pageContent.innerHTML = '';
  }
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setPage(btn.dataset.page);
  });
});

setPage();
