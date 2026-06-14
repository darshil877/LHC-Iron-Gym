/* =========================================================
   FORGE — main.js
   Separate folder: src/js/
   Pure vanilla JavaScript (no dependencies)
   ========================================================= */

(function () {
  'use strict';

  // WhatsApp number (Indian +91). Change to the owner's real number.
  const WA_NUMBER = '919876543210';

  /* ============ 1. NAVBAR ============ */
  const navbar = document.getElementById('navbar');
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  const onScroll = () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ============ 2. SCROLL REVEAL ============ */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ============ 3. GYM TIMING — live clock + status ============ */
  const clockEl = document.getElementById('liveClock');
const labelEl = document.getElementById('clockLabel');
const pillEl = document.getElementById('statusPill');
const statusText = document.getElementById('statusText');

// 1. Updated structure to support multiple windows per day and closed days
const HOURS = {
  1: { label: 'Monday',    windows: [{ open: '06:00', close: '11:30' }, { open: '16:00', close: '21:30' }] },
  2: { label: 'Tuesday',   windows: [{ open: '06:00', close: '11:30' }, { open: '16:00', close: '21:30' }] },
  3: { label: 'Wednesday', windows: [{ open: '06:00', close: '11:30' }, { open: '16:00', close: '21:30' }] },
  4: { label: 'Thursday',  windows: [{ open: '06:00', close: '11:30' }, { open: '16:00', close: '21:30' }] },
  5: { label: 'Friday',    windows: [{ open: '06:00', close: '11:30' }, { open: '16:00', close: '21:30' }] },
  6: { label: 'Saturday',  windows: [{ open: '06:00', close: '11:30' }, { open: '16:00', close: '21:30' }] },
  0: { label: 'Sunday',    windows: [] } // Empty array means completely closed
};

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function format12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function tick() {
  if (!clockEl) return;
  const now = new Date();
  const day = now.getDay();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}`;

  const today = HOURS[day];
  const nowMins = now.getHours() * 60 + now.getMinutes();
  
  // 2. Check if the current time falls inside ANY of today's windows
  let activeWindow = null;
  if (today.windows) {
    activeWindow = today.windows.find(w => {
      return nowMins >= toMinutes(w.open) && nowMins < toMinutes(w.close);
    });
  }

  if (activeWindow) {
    // BUSINESS IS OPEN
    pillEl.classList.remove('closed');
    statusText.textContent = 'Open Now';
    labelEl.textContent = `${today.label} · Closes ${format12(activeWindow.close)}`;
  } else {
    // BUSINESS IS CLOSED - Find when it opens next
    pillEl.classList.add('closed');
    statusText.textContent = 'Closed';

    let nextOpenTime = null;
    let daysAhead = 0;
    let targetDayIndex = day;

    // Look through today and subsequent days until we find an opening time
    while (!nextOpenTime && daysAhead < 7) {
      const targetDay = HOURS[targetDayIndex];
      
      if (targetDay.windows && targetDay.windows.length > 0) {
        if (daysAhead === 0) {
          // If checking today, find the first window that hasn't started yet
          const futureWindow = targetDay.windows.find(w => toMinutes(w.open) > nowMins);
          if (futureWindow) {
            nextOpenTime = futureWindow.open;
          }
        } else {
          // If checking a future day, take its very first opening window
          nextOpenTime = targetDay.windows[0].open;
        }
      }

      if (!nextOpenTime) {
        daysAhead++;
        targetDayIndex = (targetDayIndex + 1) % 7;
      }
    }

    // 3. Format the display label for the next open event
    if (nextOpenTime) {
      const nextLabel = daysAhead === 0 ? 'today' : daysAhead === 1 ? 'tomorrow' : HOURS[targetDayIndex].label;
      labelEl.textContent = `Opens ${nextLabel} at ${format12(nextOpenTime)}`;
    } else {
      labelEl.textContent = 'Closed indefinitely';
    }
  }
}

tick();
setInterval(tick, 30000);

  /* ============ 4. PRICING TOGGLE ============ */
  const billingToggle = document.getElementById('billingToggle');
  const lblMonthly = document.getElementById('lblMonthly');
  const lblAnnual = document.getElementById('lblAnnual');
  const amounts = document.querySelectorAll('.amount');

  // Explicitly target ONLY the period suffix inside the featured/forge card
  const featuredPeriods = document.querySelectorAll('.plan.featured .per');

  function formatINR(n) {
    return n.toLocaleString('en-IN');
  }

  if (billingToggle) {
    billingToggle.addEventListener('click', () => {
      const isAnnual = billingToggle.classList.toggle('annual');
      lblMonthly.classList.toggle('active', !isAnnual);
      lblAnnual.classList.toggle('active', isAnnual);

      // 1. All amounts change based on their data attributes
      amounts.forEach((el) => {
        const monthly = parseInt(el.dataset.monthly, 10);
        const annual = parseInt(el.dataset.annual, 10);
        el.textContent = formatINR(isAnnual ? annual : monthly);
      });

      // 2. Only the Forge/Featured card suffix changes between /6-mo and /3-mo
      featuredPeriods.forEach((el) => {
        const monthlyPeriod = el.dataset.monthly;
        const annualPeriod = el.dataset.annual;
        el.textContent = isAnnual ? annualPeriod : monthlyPeriod;
      });
    });
  }

  /* ============ 5. CALORIE CALCULATOR ============ */
  const cAge = document.getElementById('cAge');
  const cHeight = document.getElementById('cHeight');
  const cWeight = document.getElementById('cWeight');
  const cActivity = document.getElementById('cActivity');
  const gBtns = document.querySelectorAll('.g-btn');
  const gpBtns = document.querySelectorAll('.gp-btn');

  const resBMR = document.getElementById('resBMR');
  const resTDEE = document.getElementById('resTDEE');
  const resTarget = document.getElementById('resTarget');
  const resTargetSub = document.getElementById('resTargetSub');
  const mProtein = document.getElementById('mProtein');
  const mCarbs = document.getElementById('mCarbs');
  const mFats = document.getElementById('mFats');

  let gender = 'male';
  let goalDelta = 0;

  gBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      gBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      gender = btn.dataset.gender;
      calc();
    });
  });

  gpBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      gpBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      goalDelta = parseInt(btn.dataset.goal, 10);
      calc();
    });
  });

  [cAge, cHeight, cWeight, cActivity].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  function calc() {
    if (!cAge || !cHeight || !cWeight || !cActivity) return;
    const age = parseInt(cAge.value, 10);
    const height = parseInt(cHeight.value, 10);
    const weight = parseInt(cWeight.value, 10);
    const activity = parseFloat(cActivity.value);

    if (!age || !height || !weight || isNaN(activity)) return;

    // Mifflin-St Jeor equation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'male' ? 5 : -161;

    const tdee = Math.round(bmr * activity);
    const target = Math.max(1200, tdee + goalDelta);

    resBMR.textContent = Math.round(bmr).toLocaleString();
    resTDEE.textContent = tdee.toLocaleString();
    resTarget.textContent = target.toLocaleString();

    if (goalDelta < 0) resTargetSub.textContent = 'kcal / day · fat loss';
    else if (goalDelta > 0) resTargetSub.textContent = 'kcal / day · muscle gain';
    else resTargetSub.textContent = 'kcal / day · maintenance';

    const proteinG = Math.round(weight * 2);
    const fatsG = Math.round((target * 0.25) / 9);
    const carbsG = Math.round((target - proteinG * 4 - fatsG * 9) / 4);

    mProtein.textContent = proteinG;
    mFats.textContent = fatsG;
    mCarbs.textContent = Math.max(0, carbsG);
  }

  calc();

  /* ============ 6. TOUR ARROWS ============ */
  const tourTrack = document.getElementById('tourTrack');
  const tourPrev = document.getElementById('tourPrev');
  const tourNext = document.getElementById('tourNext');

  function tourScroll(dir) {
    const card = tourTrack.querySelector('.tour-card');
    if (!card) return;
    const cardWidth = card.offsetWidth + 20;
    tourTrack.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  }
  if (tourPrev) tourPrev.addEventListener('click', () => tourScroll(-1));
  if (tourNext) tourNext.addEventListener('click', () => tourScroll(1));

  /* ============ 7. COACH CARDS TAP ============ */
  document.querySelectorAll('.coach').forEach((card) => {
    card.addEventListener('click', () => {
      if (window.innerWidth < 1024) card.classList.toggle('active');
    });
  });


  /* ============ 8. CONTACT FORM → WhatsApp ============ */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fName').value.trim();
      const phone = document.getElementById('fPhone').value.trim();
      const goal = document.getElementById('fGoal').value;
      const msg = `Hi FORGE, I'm ${name}. My number is ${phone}. I'm interested in: ${goal}.`;
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    });
  }

  /* ============ 9. NEWSLETTER ============ */
  const nlForm = document.getElementById('newsletterForm');
  const nlOk = document.getElementById('newsletterOk');
  if (nlForm) {
    nlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      nlForm.style.display = 'none';
      if (nlOk) nlOk.hidden = false;
    });
  }

  /* ============ 10. SMOOTH SCROLL ============ */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 70;
      const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ============ 11. Hide floating WA near contact ============ */
  const floatWa = document.querySelector('.float-wa');
  const contactSection = document.getElementById('contact');
  if (floatWa && contactSection) {
    const floatObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        floatWa.style.opacity = entry.isIntersecting ? '0' : '1';
        floatWa.style.pointerEvents = entry.isIntersecting ? 'none' : 'auto';
      });
    }, { threshold: 0.3 });
    floatObs.observe(contactSection);
  }
})();
