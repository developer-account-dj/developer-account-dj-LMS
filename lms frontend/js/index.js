document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const body = document.body;
  
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  function toggleMenu() {
    navMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    body.classList.toggle('no-scroll');
    
    // Change icon
    const icon = menuToggle.querySelector('i');
    if (navMenu.classList.contains('active')) {
      icon.classList.replace('fa-bars', 'fa-times');
    } else {
      icon.classList.replace('fa-times', 'fa-bars');
    }
  }

  // Toggle menu when button is clicked
  menuToggle.addEventListener('click', toggleMenu);
  
  // Close menu when overlay is clicked
  overlay.addEventListener('click', toggleMenu);
  
  // Close menu when clicking on nav links
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', toggleMenu);
  });

  // Close menu when window is resized to desktop size
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      navMenu.classList.remove('active');
      overlay.classList.remove('active');
      body.classList.remove('no-scroll');
      const icon = menuToggle.querySelector('i');
      icon.classList.replace('fa-times', 'fa-bars');
    }
  });
});