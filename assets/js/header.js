(() => {
  // Activate nav link based on scroll position (Bootstrap scrollspy is enabled via data attributes)
  const navLinks = document.querySelectorAll('#sq-nav .nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
})();


