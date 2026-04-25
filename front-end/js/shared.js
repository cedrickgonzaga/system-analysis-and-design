// shared.js — sidebar + theme toggle
function initPage() {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const main      = document.getElementById('main');
  const overlay   = document.getElementById('overlay');
  const themebtn  = document.getElementById('themeToggle');

  let sidebarOpen = true;

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    sidebar && sidebar.classList.toggle('closed', !sidebarOpen);
    main   && main.classList.toggle('expanded', !sidebarOpen);
    overlay && overlay.classList.toggle('visible', !sidebarOpen ? false : false);
  }

  hamburger && hamburger.addEventListener('click', toggleSidebar);
  overlay   && overlay.addEventListener('click', toggleSidebar);

  // theme
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.body.classList.add('light');
  themebtn && themebtn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
}
document.addEventListener('DOMContentLoaded', initPage);
