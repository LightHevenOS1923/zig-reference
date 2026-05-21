// Mobile navigation toggle
window.toggleNav = function() {
  const links = document.getElementById('navLinks');
  links.classList.toggle('open');
};

// Close nav on link click (mobile)
document.querySelectorAll('.nav-links a').forEach(function(a) {
  a.addEventListener('click', function() {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Animated stats counters on scroll
(function() {
  var counted = false;
  var stats = document.querySelectorAll('.stat-number');

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight - 100 && rect.bottom > 0;
  }

  function animateCounters() {
    if (counted) return;
    if (!document.getElementById('stats')) return;
    if (!isInViewport(document.getElementById('stats'))) return;

    counted = true;
    stats.forEach(function(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var isFloat = target % 1 !== 0;
      var duration = 1500;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = target * eased;

        if (isFloat) {
          el.textContent = current.toFixed(2);
        } else {
          el.textContent = Math.floor(current);
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    });
  }

  window.addEventListener('scroll', animateCounters);
  window.addEventListener('load', animateCounters);
  // Initial check
  setTimeout(animateCounters, 500);
})();

// IntersectionObserver for staggered animations
(function() {
  if (!window.IntersectionObserver) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card').forEach(function(card) {
    card.style.animationPlayState = 'paused';
    observer.observe(card);
  });
})();

// Navbar background on scroll
(function() {
  var nav = document.querySelector('nav');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      nav.style.background = 'rgba(10,10,26,0.92)';
    } else {
      nav.style.background = 'rgba(10,10,26,0.85)';
    }
  });
})();

// Console greeting
console.log('%c Zig 0.16.0 Bilingual Reference ', 'background:#f7a41d;color:#0a0a1a;font-size:16px;font-weight:bold;padding:8px 12px;border-radius:4px;');
console.log('%c English + Arabic | 354 Sections | مرجع ثنائي اللغة', 'color:#8888aa;font-size:12px;');
