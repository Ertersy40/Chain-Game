const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
const confettiCount = 100;
const confetti = [];
const colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C'];

function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Confetto {
    constructor() {
        this.x = canvas.width / 2;
        this.y = 0;
        this.w = Math.random() * 20 + 10;
        this.h = Math.random() * 10 + 5;
        this.color = randomColor();
        this.rotationX = Math.random() * 360;
        this.rotationY = Math.random() * 360;
        this.rotationSpeedX = Math.random() * 2 - 1;
        this.rotationSpeedY = Math.random() * 2 - 1;
        const angle = Math.random() * Math.PI * 1.3 + 5.8;
        this.speedX = Math.cos(angle) * (Math.random() * 10 + 5); // Start fast, slow down
        this.speedY = Math.sin(angle) * (Math.random() * 10 + 5); // Start fast, slow down
        this.friction = 0.98; // Slow down over time
        this.gravity = 0.5; // Constant gravity
    }

    update() {
        this.speedX *= this.friction;
        this.speedY *= this.friction;
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotationX += this.rotationSpeedX;
        this.rotationY += this.rotationSpeedY;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotationX * Math.PI) / 180);
        ctx.rotate((this.rotationY * Math.PI) / 180);
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

function burstConfetti() {
    canvas.style.display = "block"
    for (let i = 0; i < confettiCount; i++) {
        confetti.push(new Confetto());
    }
    render();
    
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach((confetto) => {
        confetto.update();
        confetto.draw();
    });
    if (confetti.some(confetto => confetto.y < canvas.height)) {
        requestAnimationFrame(render);
    } else {
        canvas.style.display = "none"

    }
}