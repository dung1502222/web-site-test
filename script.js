/* ============================================================================
   IRL landing page — vanilla JS only. No build step, no dependencies.
   Sections:
     1. Mobile nav toggle
     2. Sticky nav scroll shadow
     3. Scroll-reveal animations (IntersectionObserver)
     4. Parallax on background blobs
     5. Waitlist form (client-side only — see comment before wiring a backend)
     6. Testimonial swiper (scroll-snap track + prev/next + dots)
     7. Hero demo card ("Not this week" / "I'd be up for this")
     8. Friday chat demo (suggest another time / confirm)
     9. Rooms swipe deck ("Not this time" / "I'm interested")
     10. Footer year
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
      waitlistSubmit.textContent = 'Joining…';

      submitToWaitlist(email).then(function () {
        waitlistForm.classList.add('is-hidden');
        waitlistSuccess.classList.add('is-active');
      }).catch(function () {
        waitlistError.textContent = 'Something went wrong. Please try again.';
        waitlistSubmit.disabled = false;
        waitlistSubmit.textContent = 'Join the Waitlist';
      });
    });
  }

  /* --------------------------------------------------------------------
     6. TESTIMONIAL SWIPER (infinite loop)
     A native horizontally-scrolling, scroll-snapping track (so touch/
     trackpad swipe works for free) plus prev/next buttons and dot
     indicators. To make it loop seamlessly in both directions — including
     when the user drags/swipes by hand, not just via the buttons — a copy
     of the last couple of slides is cloned in front of the first slide,
     and a copy of the first couple cloned after the last slide. Once a
     scroll settles on one of those clones, we silently (no animation) snap
     back to the equivalent real slide, so it looks endless.
  -------------------------------------------------------------------- */
  var testiTrack = document.getElementById('testiTrack');

  if (testiTrack) {
    var testiReal = Array.prototype.slice.call(testiTrack.children);
    var testiTotal = testiReal.length;
    var testiCloneCount = Math.min(2, testiTotal);

    // Clone the last `testiCloneCount` slides in front (in the right order)…
    for (var f = 0; f < testiCloneCount; f++) {
      var frontClone = testiReal[testiTotal - 1 - f].cloneNode(true);
      frontClone.classList.add('testi-clone');
      frontClone.setAttribute('aria-hidden', 'true');
      testiTrack.insertBefore(frontClone, testiTrack.firstChild);
    }
    // …and the first `testiCloneCount` slides after the last one.
    for (var b = 0; b < testiCloneCount; b++) {
      var backClone = testiReal[b].cloneNode(true);
      backClone.classList.add('testi-clone');
      backClone.setAttribute('aria-hidden', 'true');
      testiTrack.appendChild(backClone);
    }

    var testiAll = Array.prototype.slice.call(testiTrack.children); // real + clones
    var testiDots = Array.prototype.slice.call(document.querySelectorAll('#testiDots .testi-dot'));
    var testiPrev = document.getElementById('testiPrev');
    var testiNext = document.getElementById('testiNext');
    var testiCurrent = 0; // real slide index, 0..testiTotal-1

    function testiGoTo(realIndex, instant) {
      testiCurrent = ((realIndex % testiTotal) + testiTotal) % testiTotal;
      var target = testiAll[testiCloneCount + testiCurrent];
      target.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      testiUpdateDots();
    }

    // Size/highlight dots by distance from the active slide: active is
    // biggest, its immediate neighbors medium, everything else smallest.
    function testiUpdateDots() {
      testiDots.forEach(function (dot, i) {
        var dist = Math.abs(i - testiCurrent);
        dot.classList.remove('is-active', 'is-near');
        if (dist === 0) dot.classList.add('is-active');
        else if (dist === 1) dot.classList.add('is-near');
      });
    }

    if (testiPrev) testiPrev.addEventListener('click', function () { testiGoTo(testiCurrent - 1); });
    if (testiNext) testiNext.addEventListener('click', function () { testiGoTo(testiCurrent + 1); });
    testiDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { testiGoTo(i); });
    });

    // Which slide (real or clone) is currently closest to the track's center.
    function testiNearestAllIndex() {
      var trackCenter = testiTrack.scrollLeft + testiTrack.clientWidth / 2;
      var closest = 0;
      var closestDist = Infinity;
      testiAll.forEach(function (slide, i) {
        var slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        var dist = Math.abs(slideCenter - trackCenter);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    }

    // After the user stops scrolling/dragging: if they landed on a cloned
    // slide, jump (instantly, invisibly) to the matching real slide so the
    // track always has real content to keep scrolling into either way.
    function testiHandleSettle() {
      var idx = testiNearestAllIndex();
      if (idx < testiCloneCount) {
        testiCurrent = testiTotal - testiCloneCount + idx;
        testiAll[testiCloneCount + testiCurrent].scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      } else if (idx >= testiCloneCount + testiTotal) {
        testiCurrent = idx - testiCloneCount - testiTotal;
        testiAll[testiCloneCount + testiCurrent].scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      } else {
        testiCurrent = idx - testiCloneCount;
      }
      testiUpdateDots();
    }

    // Debounce: react once scrolling has actually stopped, not on every frame.
    var testiScrollTimer = null;
    testiTrack.addEventListener('scroll', function () {
      if (testiScrollTimer) clearTimeout(testiScrollTimer);
      testiScrollTimer = setTimeout(testiHandleSettle, 120);
    }, { passive: true });

    testiGoTo(0, true); // start on the first real slide (past the front clones)
  }

  /* --------------------------------------------------------------------
     7. HERO DEMO CARD
     A tiny taste of the product right in the hero: "Not this week" cycles
     through a couple of sample introductions; "I'd be up for this" reveals
     the mutual-curiosity note. Nothing here is submitted anywhere — it's
     just illustrating the product's own "Wednesday: mutual curiosity" step.
  -------------------------------------------------------------------- */
  var heroDemoName = document.getElementById('heroDemoName');
  var heroDemoTag = document.getElementById('heroDemoTag');
  var heroDemoPlan = document.getElementById('heroDemoPlan');
  var heroDemoQuote = document.getElementById('heroDemoQuote');
  var heroMatchPhoto = document.getElementById('heroMatchPhoto');
  var heroMutualNote = document.getElementById('heroMutualNote');
  var heroNotThisWeek = document.getElementById('heroNotThisWeek');
  var heroUpForThis = document.getElementById('heroUpForThis');

  if (heroDemoName && heroNotThisWeek && heroUpForThis) {
    // Each sample pairs a bit of copy with its own stock photo (Unsplash,
    // free license) so the card actually changes when you click through.
    var heroSamples = [
      {
        name: 'Hà, 24', tag: 'Research · films · tiny cafés',
        plan: 'Gallery · Saturday afternoon',
        quote: '“My ideal Sunday starts with good coffee and nowhere urgent to be.”',
        photo: 'https://images.unsplash.com/photo-1542719018-ee28cbdc71ee?auto=format&fit=crop&crop=faces&w=600&q=75'
      },
      {
        name: 'Mai, 26', tag: 'Marketing · food · badminton',
        plan: 'Coffee · Sunday afternoon',
        quote: '“Give me a good flat white and I’ll talk to anyone.”',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&crop=faces&w=600&q=75'
      },
      {
        name: 'An, 25', tag: 'Product · cameras · playlists',
        plan: 'Photo walk · Saturday morning',
        quote: '“I like dates that could just as easily be a solo afternoon.”',
        photo: 'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&crop=faces&w=600&q=75'
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
    }

    heroNotThisWeek.addEventListener('click', function () {
      heroSampleIndex = (heroSampleIndex + 1) % heroSamples.length;
      heroRenderSample(heroSampleIndex);
      heroMutualNote.hidden = true;
    });
    heroUpForThis.addEventListener('click', function () {
      heroMutualNote.hidden = false;
    });
  }

  /* --------------------------------------------------------------------
     8. FRIDAY CHAT DEMO
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
     9. ROOMS SWIPE DECK
     A stack of Room cards (see .room-card in index.html). "Not this time"
     drops the top card away and reveals the next one underneath; "I'm
     interested" briefly flashes a "You're in" badge on the card before it
     lifts off the same way. Once the deck runs out, an empty state offers
     to reshuffle back to the start. Nothing here is submitted anywhere —
     it's illustrating the product's own Rooms feature.
  -------------------------------------------------------------------- */
  var roomsStack = document.getElementById('roomsStack');

  if (roomsStack) {
    var roomCards = Array.prototype.slice.call(roomsStack.querySelectorAll('.room-card'));
    var roomsEmpty = document.getElementById('roomsEmpty');
    var roomsReset = document.getElementById('roomsReset');
    var roomQueue = roomCards.slice();

    // Re-assign each remaining card's position in the stack (0 = on top);
    // .room-card's CSS reads --stack to offset/scale/fade cards behind it.
    function layoutRoomStack() {
      roomQueue.forEach(function (card, i) {
        card.style.setProperty('--stack', i);
        card.classList.toggle('is-top', i === 0);
      });
      if (roomsEmpty) roomsEmpty.hidden = roomQueue.length > 0;
    }

    function removeTopCard(card, delay) {
      setTimeout(function () {
        roomQueue.shift();
        card.hidden = true;
        card.classList.remove('is-leaving-pass', 'is-leaving-join', 'is-joined');
        layoutRoomStack();
      }, delay);
    }

    function actOnTopCard(action) {
      if (!roomQueue.length) return;
      var card = roomQueue[0];
      if (action === 'join') {
        card.classList.add('is-joined');
        setTimeout(function () { card.classList.add('is-leaving-join'); }, 550);
        removeTopCard(card, 550 + 420); // let the badge show, then fly off
      } else if (action === 'pass') {
        card.classList.add('is-leaving-pass');
        removeTopCard(card, 420);
      }
    }

    roomsStack.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-room-action]');
      if (!btn) return;
      var card = btn.closest('.room-card');
      if (card !== roomQueue[0]) return; // ignore clicks on cards further back
      actOnTopCard(btn.getAttribute('data-room-action'));
    });

    if (roomsReset) {
      roomsReset.addEventListener('click', function () {
        roomCards.forEach(function (card) {
          card.hidden = false;
          card.classList.remove('is-leaving-pass', 'is-leaving-join', 'is-joined');
        });
        roomQueue = roomCards.slice();
        layoutRoomStack();
      });
    }

    layoutRoomStack();
  }

  /* --------------------------------------------------------------------
     10. FOOTER YEAR
  -------------------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
