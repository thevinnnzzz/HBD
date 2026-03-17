document.addEventListener("DOMContentLoaded", () => {
  const candle = document.querySelector('.candle');
  const body = document.getElementById('bday-body');

  // Trigger the blowout sequence when the candle is clicked
  candle.addEventListener('click', () => {
    if (!body.classList.contains('blown')) {
      body.classList.add('blown');
      triggerConfetti();
    }
  });

  // Function to create falling confetti
  function triggerConfetti() {
    // Colors matching your cake theme
    const colors = ['#bcaa99', '#f2f7f2', '#8e5572', '#bbbe64', '#ffcb6a'];
    
    for (let i = 0; i < 150; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      
      // Randomize position, color, and animation duration for a natural look
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = Math.random() * 3 + 2 + 's'; // Between 2 and 5 seconds
      confetti.style.animationDelay = Math.random() * 3 + 's'; // Stagger the start times
      
      // Randomize size slightly
      const sizeScale = Math.random() * 0.5 + 0.5;
      confetti.style.width = (10 * sizeScale) + 'px';
      confetti.style.height = (20 * sizeScale) + 'px';

      body.appendChild(confetti);
      
      // Clean up confetti elements after they fall to save memory
      setTimeout(() => {
        confetti.remove();
      }, 6000); 
    }
  }
});