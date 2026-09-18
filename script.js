document.addEventListener("DOMContentLoaded", () => {
  const body = document.getElementById("bday-body");
  const puzzleScreen = document.getElementById("puzzle-screen");
  const board = document.getElementById("chess-board");
  const puzzleStatus = document.getElementById("puzzle-status");
  const moveCounter = document.getElementById("move-counter");
  const lineDisplay = document.getElementById("line-display");
  const resetPuzzle = document.getElementById("reset-puzzle");
  const bdayAudio = document.getElementById("bday-audio");
  const blowBtn = document.getElementById("blow-btn");
  const scaler = document.getElementById("cake-scaler");

  /* =========================================================
     STARS
     ========================================================= */
  const starsEl = document.getElementById("stars");

  for (let i = 0; i < 120; i++) {
    const star = document.createElement("div");
    star.className = "star";

    const size = Math.random() * 3 + 1;

    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top: ${Math.random() * 100}vh;
      left: ${Math.random() * 100}vw;
      --d: ${(Math.random() * 3 + 2).toFixed(1)}s;
      --delay: ${(Math.random() * 4).toFixed(1)}s;
    `;

    starsEl.appendChild(star);
  }

  /* =========================================================
     MOBILE CAKE SCALE
     ========================================================= */
  function scaleCake() {
    if (!scaler) return;

    const cake = scaler.querySelector(".cake");
    if (!cake) return;

    if (window.innerWidth < 600) {
      const available = Math.min(window.innerWidth * 0.9, 300);
      const scale = available / 300;

      cake.style.setProperty("--cake-scale", scale);
      cake.style.transform = `scale(${scale})`;
      scaler.style.height = `${Math.round(330 * scale)}px`;
    } else {
      cake.style.removeProperty("--cake-scale");
      cake.style.transform = "none";
      scaler.style.height = "330px";
    }
  }

  scaleCake();
  window.addEventListener("resize", scaleCake);

  /* =========================================================
     CHESS PUZZLE - MATE IN 3

     Position based on the documented line:
       1. Qc4+ Kd2
       2. Qc1+ Kxc1
       3. Nb3#

     White:
       King  a1
       Queen a2
       Knights c5, e3

     Black:
       King  c3
       Rook  e2
       Queen h2

     Black's replies are preset and happen automatically after
     each correct White move.
     ========================================================= */

  const initialPieces = {
    a1: { type: "K", color: "white", symbol: "♔" },
    a2: { type: "Q", color: "white", symbol: "♕" },
    c5: { type: "N", color: "white", symbol: "♘" },
    e3: { type: "N", color: "white", symbol: "♘" },
    c3: { type: "K", color: "black", symbol: "♚" },
    e2: { type: "R", color: "black", symbol: "♜" },
    h2: { type: "Q", color: "black", symbol: "♛" }
  };

  const solution = [
    { from: "a2", to: "c4", notation: "Qc4+", reply: { from: "c3", to: "d2", notation: "Kd2" } },
    { from: "c4", to: "c1", notation: "Qc1+", reply: { from: "d2", to: "c1", notation: "Kxc1" } },
    { from: "c5", to: "b3", notation: "Nb3#", reply: null }
  ];

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  let pieces = clonePieces(initialPieces);
  let selectedSquare = null;
  let whiteMoveIndex = 0;
  let waitingForBlack = false;
  let solved = false;

  function clonePieces(source) {
    return Object.fromEntries(
      Object.entries(source).map(([square, piece]) => [square, { ...piece }])
    );
  }

  function createBoard() {
    board.innerHTML = "";

    for (let rank = 8; rank >= 1; rank--) {
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const file = files[fileIndex];
        const squareName = `${file}${rank}`;
        const square = document.createElement("button");

        square.type = "button";
        square.className = `square ${(fileIndex + rank) % 2 === 0 ? "light" : "dark"}`;
        square.dataset.square = squareName;
        square.setAttribute("aria-label", `Chess square ${squareName}`);

        square.addEventListener("click", () => handleSquareClick(squareName));
        board.appendChild(square);
      }
    }

    renderPieces();
  }

  function renderPieces() {
    board.querySelectorAll(".square").forEach(square => {
      square.innerHTML = "";
      const piece = pieces[square.dataset.square];

      if (!piece) return;

      const pieceEl = document.createElement("span");
      pieceEl.className = "piece";
      pieceEl.textContent = piece.symbol;
      square.appendChild(pieceEl);
    });
  }

  function getSquare(squareName) {
    return board.querySelector(`[data-square="${squareName}"]`);
  }

  function clearHighlights() {
    board.querySelectorAll(".square").forEach(square => {
      square.classList.remove("selected", "last-move", "correct-target");
    });
  }

  function highlightLastMove(from, to, solvedTarget = false) {
    clearHighlights();
    getSquare(from)?.classList.add("last-move");
    getSquare(to)?.classList.add(solvedTarget ? "correct-target" : "last-move");
  }

  function handleSquareClick(squareName) {
    if (solved || waitingForBlack) return;

    const piece = pieces[squareName];

    if (!selectedSquare) {
      if (!piece || piece.color !== "white") {
        setStatus("Select one of the white pieces first. ♔", "error");
        return;
      }

      selectedSquare = squareName;
      clearHighlights();
      getSquare(squareName).classList.add("selected");
      setStatus(`Piece selected. Now choose its destination.`, "normal");
      return;
    }

    if (squareName === selectedSquare) {
      selectedSquare = null;
      clearHighlights();
      setStatus("Selection cleared. Choose a white piece.", "normal");
      return;
    }

    if (piece && piece.color === "white") {
      selectedSquare = squareName;
      clearHighlights();
      getSquare(squareName).classList.add("selected");
      setStatus("Piece changed. Now choose its destination.", "normal");
      return;
    }

    const move = solution[whiteMoveIndex];

    if (selectedSquare === move.from && squareName === move.to) {
      playWhiteMove(move);
    } else {
      selectedSquare = null;
      clearHighlights();
      setStatus("Not quite. 😄 Try a different move.", "error");
    }
  }

  function playWhiteMove(move) {
    const movingPiece = pieces[move.from];
    if (!movingPiece) return;

    delete pieces[move.from];
    pieces[move.to] = movingPiece;
    selectedSquare = null;

    renderPieces();
    highlightLastMove(move.from, move.to, move.notation.endsWith("#"));
    addMoveToLine(whiteMoveIndex, move.notation, true);

    if (move.reply) {
      waitingForBlack = true;
      moveCounter.textContent = `Black reply after ${move.notation}`;
      setStatus(`Correct! Black replies automatically: <strong>${move.reply.notation}</strong> ...`, "success");

      setTimeout(() => {
        playBlackMove(move.reply);
      }, 750);
    } else {
      solved = true;
      moveCounter.textContent = "Mate in 3 complete!";
      setStatus("♕ <strong>CHECKMATE!</strong> Nicely done, Karen. Birthday unlocked! 🎉", "success");
      getSquare(move.to)?.classList.add("correct-target");

      // Start the song directly from the final user tap so mobile
      // browsers are less likely to block the audio.
      startBirthdayAudio();

      setTimeout(() => unlockBirthday(), 900);
    }
  }

  function playBlackMove(move) {
    const movingPiece = pieces[move.from];
    if (!movingPiece) return;

    delete pieces[move.from];
    pieces[move.to] = movingPiece;

    renderPieces();
    highlightLastMove(move.from, move.to);
    addReplyToLine(whiteMoveIndex, move.notation);

    whiteMoveIndex += 1;
    waitingForBlack = false;

    if (whiteMoveIndex < solution.length) {
      moveCounter.textContent = `White move ${whiteMoveIndex + 1} of 3`;
      setStatus(`Black played <strong>${move.notation}</strong>. Your move. ♟️`, "normal");
    }
  }

  function addMoveToLine(index, notation, isDone) {
    const spans = lineDisplay.querySelectorAll("span");
    const moveSpan = spans[index * 2];
    if (!moveSpan) return;

    moveSpan.textContent = `${index + 1}. ${notation}`;
    moveSpan.classList.remove("move-empty");
    moveSpan.classList.add(isDone ? "done" : "active");
  }

  function addReplyToLine(index, notation) {
    const spans = lineDisplay.querySelectorAll("span");
    const replySpan = spans[index * 2 + 1];
    if (!replySpan) return;

    replySpan.textContent = `… ${notation}`;
    replySpan.classList.remove("move-empty");
    replySpan.classList.add("done");
  }

  function setStatus(message, type = "normal") {
    puzzleStatus.className = `puzzle-status ${type === "normal" ? "" : type}`.trim();
    puzzleStatus.innerHTML = message;
  }

  function resetBoard() {
    pieces = clonePieces(initialPieces);
    selectedSquare = null;
    whiteMoveIndex = 0;
    waitingForBlack = false;
    solved = false;

    createBoard();
    clearHighlights();
    moveCounter.textContent = "White move 1 of 3";
    setStatus("Find the first move. Tap a white piece, then tap its destination.", "normal");

    lineDisplay.innerHTML = `
      <span class="move-empty">1. —</span>
      <span class="move-empty">… —</span>
      <span class="move-empty">2. —</span>
      <span class="move-empty">… —</span>
      <span class="move-empty">3. —</span>
    `;
  }

  resetPuzzle.addEventListener("click", resetBoard);
  createBoard();

  /* =========================================================
     UNLOCK BIRTHDAY
     ========================================================= */
  function startBirthdayAudio() {
    if (!bdayAudio) return;

    bdayAudio.currentTime = 0;
    bdayAudio.play().catch(() => {
      console.log("Audio playback was blocked by the browser.");
    });
  }

  function unlockBirthday() {
    body.classList.add("unlocked");
    puzzleScreen.setAttribute("aria-hidden", "true");
    document.getElementById("birthday-screen").setAttribute("aria-hidden", "false");

    triggerRingBurst();
    setTimeout(triggerConfetti, 150);
    setTimeout(triggerBalloons, 350);
    setTimeout(triggerFlowers, 550);
    setTimeout(() => triggerSparkles(35), 250);
  }

  /* =========================================================
     CANDLE CELEBRATION
     ========================================================= */
  function handleBlow() {
    if (!body.classList.contains("unlocked")) return;
    if (body.classList.contains("blown")) return;

    body.classList.add("blown");

    /* Do not restart the birthday song here. It starts when the
       puzzle is solved, as requested. */
    triggerRingBurst();
    setTimeout(triggerConfetti, 100);
    setTimeout(triggerBalloons, 300);
    setTimeout(triggerFlowers, 500);
    setTimeout(triggerHearts, 700);
    setTimeout(() => triggerSparkles(45), 250);
  }

  blowBtn.addEventListener("click", handleBlow);

  /* =========================================================
     CELEBRATION EFFECTS
     ========================================================= */
  function triggerConfetti() {
    const colors = [
      "#bcaa99", "#f2f7f2", "#8e5572",
      "#bbbe64", "#ffcb6a", "#ff8fab", "#ffd166"
    ];

    for (let i = 0; i < 180; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";

      const sizeScale = Math.random() * 0.5 + 0.5;
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
      confetti.style.animationDelay = `${Math.random() * 2}s`;
      confetti.style.width = `${10 * sizeScale}px`;
      confetti.style.height = `${20 * sizeScale}px`;
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

      body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 6000);
    }
  }

  function triggerFlowers() {
    const flowers = ["🌸", "🌺", "🌼", "🌻", "🌹", "🌷", "💐"];

    for (let i = 0; i < 35; i++) {
      const flower = document.createElement("div");
      flower.className = "flower";
      flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
      flower.style.left = `${Math.random() * 95}vw`;
      flower.style.top = `${Math.random() * 95}vh`;
      flower.style.fontSize = `${Math.random() * 30 + 25}px`;
      flower.style.animationDelay = `${Math.random() * 2}s`;

      body.appendChild(flower);
      setTimeout(() => flower.remove(), 6000);
    }
  }

  function triggerBalloons() {
    const emojis = ["🎈", "🎈", "🎈", "🎀", "🎊", "🎁"];

    for (let i = 0; i < 18; i++) {
      const balloon = document.createElement("div");
      balloon.className = "balloon";

      const duration = (Math.random() * 4 + 5).toFixed(1);
      const delay = (Math.random() * 4).toFixed(2);

      balloon.style.cssText = `
        left: ${Math.random() * 96}vw;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        font-size: ${Math.random() * 30 + 28}px;
      `;

      balloon.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      body.appendChild(balloon);
      setTimeout(
        () => balloon.remove(),
        (parseFloat(duration) + parseFloat(delay)) * 1000 + 500
      );
    }
  }

  function triggerHearts() {
    const emojis = ["❤️", "💖", "💗", "💝", "💕", "🩷"];

    for (let i = 0; i < 25; i++) {
      const heart = document.createElement("div");
      heart.className = "heart";
      heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const duration = (Math.random() * 2 + 1.5).toFixed(1);
      const delay = (Math.random() * 3).toFixed(2);

      heart.style.cssText = `
        left: ${Math.random() * 96}vw;
        bottom: ${Math.random() * 40}vh;
        --hd: ${duration}s;
        --hs: ${Math.random() * 24 + 18}px;
        animation-delay: ${delay}s;
      `;

      body.appendChild(heart);
      setTimeout(
        () => heart.remove(),
        (parseFloat(duration) + parseFloat(delay)) * 1000 + 400
      );
    }
  }

  function triggerSparkles(count) {
    const shapes = ["✦", "✧", "★", "✩", "✶", "✷"];
    const sparkleColors = ["#ffd166", "#ff8fab", "#bbbe64", "#fff", "#ffcb6a"];

    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement("div");
      sparkle.className = "sparkle";

      const duration = (Math.random() * 1.5 + 1).toFixed(1);
      const delay = (Math.random() * 2).toFixed(2);

      sparkle.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: ${Math.random() * 100}vh;
        color: ${sparkleColors[Math.floor(Math.random() * sparkleColors.length)]};
        font-size: ${Math.random() * 24 + 14}px;
        --sd: ${duration}s;
        animation-delay: ${delay}s;
      `;

      sparkle.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      body.appendChild(sparkle);
      setTimeout(
        () => sparkle.remove(),
        (parseFloat(duration) + parseFloat(delay)) * 1000 + 300
      );
    }
  }

  function triggerRingBurst() {
    const ringColors = ["#ffd166", "#ff8fab", "#bbbe64", "#e5e7e5", "#ffcb6a"];

    for (let i = 0; i < 5; i++) {
      const ring = document.createElement("div");
      ring.className = "ring-burst";

      const size = 60;

      ring.style.cssText = `
        left: calc(50vw - ${size / 2}px);
        top: calc(50vh - ${size / 2}px);
        width: ${size}px;
        height: ${size}px;
        animation-delay: ${i * 0.15}s;
        border-color: ${ringColors[i]};
      `;

      body.appendChild(ring);
      setTimeout(() => ring.remove(), 2200);
    }
  }
});
