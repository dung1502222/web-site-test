/* ============================================================================
   IRL landing page — vanilla JS only. No build step, no dependencies.
   Sections:
     1. Mobile nav toggle
     2. Sticky nav scroll shadow
     3. Scroll-reveal animations (IntersectionObserver)
     4. Parallax on background blobs
     5. Waitlist form (client-side only — see comment before wiring a backend)
     6. Hero demo card ("Not this week" / "I'd be up for this")
     7. Friday chat demo (suggest another time / confirm)
     8. Rooms — spread cards ("Not this time" / "I'm interested")
     9. Footer year
============================================================================ */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------------------
     1. MOBILE NAV TOGGLE
  -------------------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function closeNav() {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu after tapping a link (mobile), and on resize back to desktop.
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* --------------------------------------------------------------------
     2. STICKY NAV SCROLL SHADOW
  -------------------------------------------------------------------- */
  var siteNav = document.getElementById('siteNav');
  function updateNavShadow() {
    if (window.scrollY > 8) {
      siteNav.classList.add('is-scrolled');
    } else {
      siteNav.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', updateNavShadow, { passive: true });
  updateNavShadow();

  /* --------------------------------------------------------------------
     3. SCROLL-REVEAL ANIMATIONS
     Any element with class="reveal" fades/slides in once it enters
     the viewport. Uses IntersectionObserver — no scroll-jank libraries.
  -------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    // No motion preferred (or no browser support): just show everything.
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // animate once, then stop watching
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* --------------------------------------------------------------------
     4. PARALLAX ON BACKGROUND BLOBS
     Elements with [data-parallax="0.1"] drift vertically as the page
     scrolls, layered on top of their own floating CSS keyframe animation.
     Throttled with requestAnimationFrame to stay smooth.
  -------------------------------------------------------------------- */
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  var ticking = false;

  function applyParallax() {
    var scrollY = window.scrollY;
    parallaxEls.forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      el.style.transform = 'translateY(' + (scrollY * speed * -1) + 'px)';
    });
    ticking = false;
  }

  if (!prefersReducedMotion && parallaxEls.length) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  /* --------------------------------------------------------------------
     5. WAITLIST FORM (client-side only, no backend yet)
     Validates the email format and shows a success state in place of
     the form. Nothing is sent anywhere yet.

     >>> WIRE-UP POINT <<<
     To connect a real backend later (e.g. Mailchimp, Formspree, or your
     own API), replace the body of `submitToWaitlist()` below with an
     actual fetch() call, e.g.:

       function submitToWaitlist(email) {
         return fetch('https://your-api.example.com/waitlist', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email: email })
         }).then(function (res) {
           if (!res.ok) throw new Error('Request failed');
         });
       }

     and make the submit handler `await` it before showing success.
  -------------------------------------------------------------------- */
  var waitlistForm = document.getElementById('waitlistForm');
  var waitlistEmail = document.getElementById('waitlistEmail');
  var waitlistError = document.getElementById('waitlistError');
  var waitlistSuccess = document.getElementById('waitlistSuccess');
  var waitlistSubmit = document.getElementById('waitlistSubmit');

  // Simple, good-enough email pattern for client-side validation.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function submitToWaitlist(email) {
    // Placeholder "network" call — swap for a real API per the comment above.
    return new Promise(function (resolve) {
      setTimeout(resolve, 600);
    });
  }

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = waitlistEmail.value.trim();

      if (!EMAIL_RE.test(email)) {
        waitlistError.textContent = 'Please enter a valid email address.';
        waitlistEmail.focus();
        return;
      }

      waitlistError.textContent = '';
      waitlistSubmit.disabled = true;
      waitlistSubmit.textContent = 'Submitting…';

      submitToWaitlist(email).then(function () {
        waitlistForm.classList.add('is-hidden');
        waitlistSuccess.classList.add('is-active');
      }).catch(function () {
        waitlistError.textContent = 'Something went wrong. Please try again.';
        waitlistSubmit.disabled = false;
        waitlistSubmit.textContent = 'Apply for the Founding Cohort';
      });
    });
  }

  /* --------------------------------------------------------------------
     6. HERO DEMO CARD
     A tiny taste of the product right in the hero, told as three stacked
     "screens" inside the same card (see .hero__screens in style.css, which
     layers them so the card's height never changes when switching between
     them): browsing (cycle samples with "Not this week" / pick one with
     "I'd be up for this") -> matched (mutual curiosity, straight into
     locking in a time) -> confirmed. Once you've matched there's no way
     back to browsing — same as the real product, you don't keep matching
     with other people. Nothing here is submitted anywhere.
  -------------------------------------------------------------------- */
  var heroDemoName = document.getElementById('heroDemoName');
  var heroDemoTag = document.getElementById('heroDemoTag');
  var heroDemoPlan = document.getElementById('heroDemoPlan');
  var heroDemoQuote = document.getElementById('heroDemoQuote');
  var heroMatchPhoto = document.getElementById('heroMatchPhoto');
  var heroScreenProfile = document.getElementById('heroScreenProfile');
  var heroScreenMatched = document.getElementById('heroScreenMatched');
  var heroScreenConfirmed = document.getElementById('heroScreenConfirmed');
  var heroConfirmTime = document.getElementById('heroConfirmTime');
  var heroConfirmPlace = document.getElementById('heroConfirmPlace');
  var heroConfirmedTime = document.getElementById('heroConfirmedTime');
  var heroConfirmedPlace = document.getElementById('heroConfirmedPlace');
  var heroNotThisWeek = document.getElementById('heroNotThisWeek');
  var heroUpForThis = document.getElementById('heroUpForThis');
  var heroConfirmBtn = document.getElementById('heroConfirmBtn');

  if (heroDemoName && heroNotThisWeek && heroUpForThis) {
    var heroScreens = [heroScreenProfile, heroScreenMatched, heroScreenConfirmed];
    function showHeroScreen(target) {
      heroScreens.forEach(function (screen) {
        if (screen) screen.classList.toggle('is-active', screen === target);
      });
    }

    // Each sample is built around one specific weekend activity (not just
    // a generic "coffee date") — its own stock photo (Unsplash, free
    // license), and its own time/place that carries through to the
    // matched and confirmed screens once you pick it.
    var heroSamples = [
      {
        name: 'Hà, 24', tag: 'Research · morning runs · tiny cafés',
        plan: 'Morning run · Sunday, Sala',
        quote: '“Best conversations happen mid-run, not over dinner.”',
        photo: 'https://images.unsplash.com/photo-1542719018-ee28cbdc71ee?auto=format&fit=crop&crop=faces&w=600&q=75',
        confirmTime: 'Sun · 6:30 AM',
        confirmPlace: 'Riverside path, Sala'
      },
      {
        name: 'Mai, 26', tag: 'Marketing · galleries · badminton',
        plan: 'Art exhibition · Saturday afternoon',
        quote: '“I read every placard. Slow museum dates only.”',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&crop=faces&w=600&q=75',
        confirmTime: 'Sat · 3:00 PM',
        confirmPlace: 'Fine Arts Museum, District 1'
      },
      {
        name: 'An, 25', tag: 'Product · board games · playlists',
        plan: 'Board games · Sunday evening',
        quote: '“Fair warning: I’m competitive at board games.”',
        photo: 'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&crop=faces&w=600&q=75',
        confirmTime: 'Sun · 7:00 PM',
        confirmPlace: 'Board game café, District 3'
      }
    ];
    var heroSampleIndex = 0;

    function heroRenderSample(i) {
      var sample = heroSamples[i];
      heroDemoName.textContent = sample.name;
      heroDemoTag.textContent = sample.tag;
      heroDemoPlan.textContent = sample.plan;
      heroDemoQuote.textContent = sample.quote;
      if (heroMatchPhoto) heroMatchPhoto.style.backgroundImage = 'url("' + sample.photo + '")';
      if (heroConfirmTime) heroConfirmTime.textContent = sample.confirmTime;
      if (heroConfirmPlace) heroConfirmPlace.textContent = sample.confirmPlace;
      if (heroConfirmedTime) heroConfirmedTime.textContent = sample.confirmTime;
      if (heroConfirmedPlace) heroConfirmedPlace.textContent = sample.confirmPlace;
    }

    heroNotThisWeek.addEventListener('click', function () {
      heroSampleIndex = (heroSampleIndex + 1) % heroSamples.length;
      heroRenderSample(heroSampleIndex);
    });
    heroUpForThis.addEventListener('click', function () {
      showHeroScreen(heroScreenMatched);
    });
    if (heroConfirmBtn) {
      heroConfirmBtn.addEventListener('click', function () {
        showHeroScreen(heroScreenConfirmed);
      });
    }
  }

  /* --------------------------------------------------------------------
     7. FRIDAY CHAT DEMO
     A small illustrative chat: "Another time" tweaks the suggested slot,
     "Confirm" swaps the time-card for a confirmed state. Purely a demo of
     the product's Friday "commit to a real plan" step — nothing is sent.
  -------------------------------------------------------------------- */
  var chatTimeCard = document.getElementById('chatTimeCard');
  var chatTimeText = document.getElementById('chatTimeText');
  var chatConfirmed = document.getElementById('chatConfirmed');
  var chatSuggestLater = document.getElementById('chatSuggestLater');
  var chatConfirm = document.getElementById('chatConfirm');

  if (chatTimeCard && chatSuggestLater && chatConfirm) {
    chatSuggestLater.addEventListener('click', function () {
      chatTimeText.textContent = 'How about Sunday · 10:30 AM instead?';
    });
    chatConfirm.addEventListener('click', function () {
      chatTimeCard.hidden = true;
      chatConfirmed.hidden = false;
    });
  }

  /* --------------------------------------------------------------------
     8. ROOMS — spread cards
     Room cards (see .room-card in index.html) are laid out side by side
     rather than stacked, so each one responds independently: "Not this
     time" fades that card out; "I'm interested" flashes a "You're in"
     badge and leaves it in place. Once every card has been passed on, an
     empty state offers to bring them all back. Nothing here is submitted
     anywhere — it's illustrating the product's own Rooms feature.
  -------------------------------------------------------------------- */
  var roomsStack = document.getElementById('roomsStack');

  if (roomsStack) {
    var roomCards = Array.prototype.slice.call(roomsStack.querySelectorAll('.room-card'));
    var roomsEmpty = document.getElementById('roomsEmpty');
    var roomsReset = document.getElementById('roomsReset');

    function updateRoomsEmptyState() {
      var anyVisible = roomCards.some(function (card) { return !card.hidden; });
      if (roomsEmpty) roomsEmpty.hidden = anyVisible;
    }

    roomsStack.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-room-action]');
      if (!btn) return;
      var card = btn.closest('.room-card');
      var action = btn.getAttribute('data-room-action');

      if (action === 'join') {
        card.classList.add('is-joined');
      } else if (action === 'pass') {
        card.classList.add('is-leaving-pass');
        setTimeout(function () {
          card.hidden = true;
          updateRoomsEmptyState();
        }, 380);
      }
    });

    if (roomsReset) {
      roomsReset.addEventListener('click', function () {
        roomCards.forEach(function (card) {
          card.hidden = false;
          card.classList.remove('is-leaving-pass', 'is-joined');
        });
        updateRoomsEmptyState();
      });
    }

    updateRoomsEmptyState();
  }

  /* --------------------------------------------------------------------
     9. FOOTER YEAR
  -------------------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
