// shared.js — sidebar + theme toggle + auth guard
function initPage() {
  // 1. Auth Guard: Redirect to login if no token is found, 
  // unless we are already on a public page (login, register, forgot-password).
  const publicPages = ['login.html', 'register.html', 'forgot-password.html', 'index.html', 'login', 'register', 'forgot-password', ''];
  const pathParts = window.location.pathname.split('/');
  const currentPage = pathParts.pop() || 'index.html';
  const token = localStorage.getItem('token');

  // Check if we are on a public page
  const isPublicPage = publicPages.includes(currentPage) || 
                       (window.location.pathname === '/') ||
                       (window.location.pathname.endsWith('/landing-login-register-page/'));

  if (!token && !isPublicPage) {
    // If we are in a subdirectory, we need to go up one level to reach the landing page
    const isSubdir = window.location.pathname.includes('/standard-user/') || 
                     window.location.pathname.includes('/it-admin/') || 
                     window.location.pathname.includes('/facility-admin/') || 
                     window.location.pathname.includes('/security-admin/');
    
    const loginPath = isSubdir ? '../landing-login-register-page/login.html' : 'landing-login-register-page/login.html';
    window.location.href = loginPath;
    return;
  }

  // 2. Sidebar & Theme Logic
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const main      = document.getElementById('main');
  const overlay   = document.getElementById('overlay');
  const themebtn  = document.getElementById('themeToggle');
  const logoutBtn = document.querySelector('a[href="login.html"], .logout-link');

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = '../landing-login-register-page/login.html';
    });
  }

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

  // Display user info if available
  const profileIcon = document.querySelector('.profile-icon');
  const userGreeting = document.getElementById('user-greeting');
  const fullName = localStorage.getItem('full_name');

  if (fullName) {
    // 1. Update Profile Icon (Initials)
    if (profileIcon) {
      const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
      profileIcon.textContent = initials.substring(0, 2);
      profileIcon.title = fullName;
    }

    // 2. Update Dashboard Greeting
    if (userGreeting) {
      const firstName = fullName.split(' ')[0];
      const currentSub = userGreeting.textContent;
      
      if (window.location.pathname.includes('user-dashboard.html')) {
        userGreeting.textContent = `Hello, ${firstName}! What would you like to do today?`;
      } else {
        // For Admins, prepend the greeting
        userGreeting.textContent = `Hello, ${firstName}! ${currentSub}`;
      }
    }
  }
}
document.addEventListener('DOMContentLoaded', initPage);
