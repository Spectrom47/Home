interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
}

export function initStarfield() {
  const canvas = document.getElementById("starfield") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  let stars: Star[] = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars(count: number) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2,
        alpha: Math.random(),
        speed: 0.01 + Math.random() * 0.02
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const star of stars) {
      star.alpha += star.speed;
      if (star.alpha >= 1 || star.alpha <= 0) {
        star.speed *= -1;
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 100, 255, ${Math.abs(star.alpha)})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "purple";
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);

  resize();
  createStars(200);
  draw();
}
