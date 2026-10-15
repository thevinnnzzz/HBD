document.addEventListener("DOMContentLoaded", () => {
  const blowBtn = document.getElementById('blow-btn');
  const body = document.getElementById('bday-body');
  const bdayAudio = document.getElementById('bday-audio');

  /* ── MOBILE CAKE SCALE ── */
  function scaleCake() {
    if (window.innerWidth < 600) {
      const scaler = document.getElementById('cake-scaler');
      const cake   = scaler ? scaler.querySelector('.cake') : null;
      if (!cake) return;
      const available = window.innerWidth * 0.9;
      const scale = Math.min(available / 300, 1);
      cake.style.setProperty('--cake-scale', scale);
      cake.style.transform = `scale(${scale})`;
      // Keep the scaler height in sync so it doesn't collapse
      scaler.style.height = Math.round(300 * scale) + 'px';
    }
  }
  scaleCake();
  window.addEventListener('resize', scaleCake);

  /* ── STARS ── */
  const starsEl = document.getElementById('stars');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 3 + 1;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      top:${Math.random()*100}vh; left:${Math.random()*100}vw;
      --d:${(Math.random()*3+2).toFixed(1)}s;
      --delay:${(Math.random()*4).toFixed(1)}s;
    `;
    starsEl.appendChild(s);
  }


  /* ── NURSE CHECK GATE ── */
  const gate = document.getElementById('gate');
  const gateCard = document.getElementById('gate-card');
  const gateProgress = document.getElementById('gate-progress');
  const gateQuestion = document.getElementById('gate-question');
  const gateOptions = document.getElementById('gate-options');
  const gateFeedback = document.getElementById('gate-feedback');

  const questions = [
    {
      q: "What is the normal resting heart rate range for a healthy adult?",
      options: ["60–100 beats per minute", "100–140 beats per minute", "30–50 beats per minute", "120–160 beats per minute"],
      answer: 0,
      rationale: "Normal adult resting heart rate is 60–100 bpm."
    },
    {
      q: "Which step of the nursing process always comes first?",
      options: ["Assessment", "Planning", "Implementation", "Evaluation"],
      answer: 0,
      rationale: "ADPIE starts with Assessment: gather data before anything else."
    },
    {
      q: "How long should you scrub your hands with soap and water?",
      options: ["At least 20 seconds", "About 5 seconds", "Just until the soap foams", "10 seconds, tops"],
      answer: 0,
      rationale: "Hand hygiene is a nurse's best infection-control tool: at least 20 seconds!"
    }
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let current = 0;
  let locked = false;

  function showQuestion() {
    const item = questions[current];
    locked = false;
    gateProgress.textContent = `Question ${current + 1} of ${questions.length}`;
    gateQuestion.textContent = item.q;
    gateFeedback.textContent = '';
    gateFeedback.className = 'gate-feedback';
    gateOptions.innerHTML = '';

    shuffle(item.options.map((text, i) => ({ text, correct: i === item.answer })))
      .forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gate-option';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => answer(btn, opt.correct, item));
        gateOptions.appendChild(btn);
      });
  }

  function answer(btn, isCorrect, item) {
    if (locked) return;

    if (!isCorrect) {
      locked = true;
      btn.classList.add('wrong');
      gateFeedback.textContent = "❌ Oops, wrong answer! Back to question 1, Nurse Bea.";
      gateFeedback.className = 'gate-feedback bad';
      gateCard.classList.remove('shake');
      void gateCard.offsetWidth; // restart the shake animation
      gateCard.classList.add('shake');

      // Wrong answer = start over from the first question
      current = 0;
      setTimeout(showQuestion, 1800);
      return;
    }

    locked = true;
    btn.classList.add('correct');
    gateFeedback.textContent = "✅ Correct! " + item.rationale;
    gateFeedback.className = 'gate-feedback good';
    current++;

    setTimeout(() => {
      if (current < questions.length) {
        showQuestion();
      } else {
        unlockSurprise();
      }
    }, 1800);
  }

  function unlockSurprise() {
    gateProgress.textContent = 'License verified ✔';
    gateQuestion.textContent = "Welcome to the profession, Bea, RN! 🎓";
    gateOptions.innerHTML = '';
    gateFeedback.textContent = "Your birthday surprise is unlocking...";
    gateFeedback.className = 'gate-feedback good';
    setTimeout(() => {
      gate.classList.add('hide');
      setTimeout(() => gate.remove(), 900);
    }, 1800);
  }

  if (gate) showQuestion();


  /* ── LETTER OPEN / CLOSE ── */
  const letterBtn = document.getElementById('letter-btn');
  const letter = document.getElementById('letter');
  const letterClose = document.getElementById('letter-close');
  if (letterBtn && letter && letterClose) {
    letterBtn.addEventListener('click', () => {
      letter.classList.add('open');
      triggerHearts();
    });
    letterClose.addEventListener('click', () => letter.classList.remove('open'));
    letter.addEventListener('click', (e) => {
      if (e.target === letter) letter.classList.remove('open');
    });
  }

  /* ── BUTTON CLICK / TAP ── */
  function handleBlow() {
    if (body.classList.contains('blown')) return;
    body.classList.add('blown');

    // Play the music
    if (bdayAudio) {
      bdayAudio.currentTime = 0;
      bdayAudio.play().catch(error => {
        console.log("Audio failed to play:", error);
      });
    }

    // Staggered animation sequence
    triggerRingBurst();
    setTimeout(triggerConfetti, 200);
    setTimeout(triggerBalloons, 400);
    setTimeout(triggerFlowers, 600);
    setTimeout(triggerHearts, 800);
    setTimeout(() => triggerSparkles(30), 300);

    // Reveal the "Open my message" button after the celebration starts
    setTimeout(() => body.classList.add('letter-ready'), 3000);
  }

  blowBtn.addEventListener('click', handleBlow);
  blowBtn.addEventListener('touchstart', (e) => { e.preventDefault(); handleBlow(); }, { passive: false });

  /* ── CONFETTI (original + enhanced) ── */
  function triggerConfetti() {
    const colors = ['#bcaa99', '#f2f7f2', '#8e5572', '#bbbe64', '#ffcb6a', '#ff8fab', '#ffd166', '#4dd0c8'];

    for (let i = 0; i < 180; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');

      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
      confetti.style.animationDelay = Math.random() * 3 + 's';

      const sizeScale = Math.random() * 0.5 + 0.5;
      confetti.style.width = (10 * sizeScale) + 'px';
      confetti.style.height = (20 * sizeScale) + 'px';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

      body.appendChild(confetti);
      setTimeout(() => { confetti.remove(); }, 6000);
    }
  }

  /* ── FLOWERS (original) ── */
  function triggerFlowers() {
    const flowerEmojis = ['🌸', '🌺', '🌼', '🌻', '🌹', '🌷', '💐'];

    for (let i = 0; i < 40; i++) {
      const flower = document.createElement('div');
      flower.classList.add('flower');

      flower.innerText = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
      flower.style.left = Math.random() * 95 + 'vw';
      flower.style.top = Math.random() * 95 + 'vh';

      const sizeScale = Math.random() * 1.5 + 1.0;
      flower.style.fontSize = (25 * sizeScale) + 'px';
      flower.style.animationDelay = Math.random() * 2 + 's';

      body.appendChild(flower);
      setTimeout(() => { flower.remove(); }, 6000);
    }
  }

  /* ── BALLOONS (new) ── */
  function triggerBalloons() {
    const emojis = ['🎈', '🎈', '🩺', '💉', '💊', '🏥', '🎀', '🎁'];
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div');
      el.className = 'balloon';
      const dur = (Math.random() * 4 + 5).toFixed(1);
      const delay = (Math.random() * 4).toFixed(2);
      el.style.cssText = `
        left:${Math.random() * 96}vw;
        animation-duration:${dur}s;
        animation-delay:${delay}s;
        font-size:${Math.random() * 30 + 28}px;
      `;
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      body.appendChild(el);
      setTimeout(() => el.remove(), (parseFloat(dur) + parseFloat(delay)) * 1000 + 400);
    }
  }

  /* ── HEARTS (new) ── */
  function triggerHearts() {
    const emojis = ['❤️', '💖', '💗', '💝', '💕', '🩷'];
    for (let i = 0; i < 25; i++) {
      const el = document.createElement('div');
      el.className = 'heart';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const dur = (Math.random() * 2 + 1.5).toFixed(1);
      const delay = (Math.random() * 3).toFixed(2);
      el.style.cssText = `
        left:${Math.random() * 96}vw;
        bottom:${Math.random() * 40}vh;
        --hd:${dur}s;
        --hs:${Math.random() * 24 + 18}px;
        animation-delay:${delay}s;
      `;
      body.appendChild(el);
      setTimeout(() => el.remove(), (parseFloat(dur) + parseFloat(delay)) * 1000 + 300);
    }
  }

  /* ── SPARKLES (new) ── */
  function triggerSparkles(n) {
    const shapes = ['✦', '✧', '★', '✩', '✶', '✷'];
    const colors = ['#ffd166', '#ff8fab', '#bbbe64', '#fff', '#ffcb6a'];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'sparkle';
      const dur = (Math.random() * 1.5 + 1).toFixed(1);
      const delay = (Math.random() * 2).toFixed(2);
      el.style.cssText = `
        left:${Math.random() * 100}vw;
        top:${Math.random() * 100}vh;
        color:${colors[Math.floor(Math.random() * colors.length)]};
        font-size:${Math.random() * 24 + 14}px;
        --sd:${dur}s;
        animation-delay:${delay}s;
      `;
      el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      body.appendChild(el);
      setTimeout(() => el.remove(), (parseFloat(dur) + parseFloat(delay)) * 1000 + 200);
    }
  }

  /* ── RING BURST (new) ── */
  function triggerRingBurst() {
    const ringColors = ['#ffd166', '#ff8fab', '#bbbe64', '#e5e7e5', '#ffcb6a'];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      el.className = 'ring-burst';
      const size = 60;
      el.style.cssText = `
        left:calc(50vw - ${size / 2}px);
        top:calc(50vh - ${size / 2}px);
        width:${size}px; height:${size}px;
        animation-delay:${i * 0.15}s;
        border-color:${ringColors[i]};
      `;
      body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  }
});
