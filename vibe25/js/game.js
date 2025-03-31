const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1600;
canvas.height = 800;

// World size (actual level size)
const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 1500;

// Player properties
const player = {
    x: 50,
    y: 200,
    width: 30,
    height: 30,
    speed: 8,  // Increased speed for larger level
    jumpForce: 14,  // Increased jump height
    gravity: 0.5,
    velocityY: 0,
    isJumping: false
};

// Platform properties
const platforms = [
    // Ground sections with gaps
    { x: 0, y: WORLD_HEIGHT - 50, width: 800, height: 50 },
    { x: 900, y: WORLD_HEIGHT - 50, width: 800, height: 50 },
    { x: 1800, y: WORLD_HEIGHT - 50, width: 800, height: 50 },
    { x: 2700, y: WORLD_HEIGHT - 50, width: 800, height: 50 },
    { x: 3600, y: WORLD_HEIGHT - 50, width: 1400, height: 50 },
    
    // Lower platforms
    { x: 300, y: WORLD_HEIGHT - 200, width: 200, height: 20 },
    { x: 700, y: WORLD_HEIGHT - 250, width: 300, height: 20 },
    { x: 1200, y: WORLD_HEIGHT - 300, width: 200, height: 20 },
    { x: 1600, y: WORLD_HEIGHT - 200, width: 400, height: 20 },
    
    // Middle height platforms
    { x: 400, y: WORLD_HEIGHT - 400, width: 200, height: 20 },
    { x: 800, y: WORLD_HEIGHT - 500, width: 200, height: 20 },
    { x: 1300, y: WORLD_HEIGHT - 450, width: 300, height: 20 },
    { x: 1800, y: WORLD_HEIGHT - 550, width: 200, height: 20 },
    { x: 2200, y: WORLD_HEIGHT - 500, width: 400, height: 20 },
    
    // High platforms
    { x: 500, y: WORLD_HEIGHT - 700, width: 150, height: 20 },
    { x: 900, y: WORLD_HEIGHT - 800, width: 150, height: 20 },
    { x: 1400, y: WORLD_HEIGHT - 750, width: 200, height: 20 },
    { x: 1800, y: WORLD_HEIGHT - 800, width: 150, height: 20 },
    
    // Far right section
    { x: 2500, y: WORLD_HEIGHT - 300, width: 300, height: 20 },
    { x: 2900, y: WORLD_HEIGHT - 400, width: 300, height: 20 },
    { x: 3300, y: WORLD_HEIGHT - 500, width: 300, height: 20 },
    { x: 3700, y: WORLD_HEIGHT - 600, width: 300, height: 20 },
    { x: 4100, y: WORLD_HEIGHT - 700, width: 300, height: 20 },
    { x: 4500, y: WORLD_HEIGHT - 800, width: 400, height: 20 },
    
    // Some floating islands
    { x: 2000, y: WORLD_HEIGHT - 900, width: 400, height: 40 },
    { x: 2600, y: WORLD_HEIGHT - 1000, width: 300, height: 40 },
    { x: 3200, y: WORLD_HEIGHT - 1100, width: 500, height: 40 },
    { x: 3900, y: WORLD_HEIGHT - 950, width: 400, height: 40 },
];

// Enemy properties
const enemies = [
    {
        x: 500,
        y: WORLD_HEIGHT - 100,
        width: 30,
        height: 30,
        speed: 2,
        direction: 1, // 1 for right, -1 for left
        platformIndex: 0, // Index of the platform this enemy patrols
        patrolStart: 400,
        patrolEnd: 700
    },
    {
        x: 1300,
        y: WORLD_HEIGHT - 500,
        width: 30,
        height: 30,
        speed: 3,
        direction: 1,
        platformIndex: 12, // Platform index this enemy patrols
        patrolStart: 1300,
        patrolEnd: 1550
    },
    {
        x: 2200,
        y: WORLD_HEIGHT - 550,
        width: 30,
        height: 30,
        speed: 4,
        direction: 1,
        platformIndex: 14,
        patrolStart: 2200,
        patrolEnd: 2500
    }
];

// Game controls
const keys = {
    left: false,
    right: false,
    up: false
};

// Event listeners for controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') keys.up = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
});

// Check collision between player and platform
function checkCollision(player, platform) {
    return player.x < platform.x + platform.width &&
           player.x + player.width > platform.x &&
           player.y < platform.y + platform.height &&
           player.y + player.height > platform.y;
}

// Gun and bullet properties
const gunPickup = {
    x: 1000,
    y: WORLD_HEIGHT - 300,
    width: 40,
    height: 20,
    collected: false
};

const bullets = [];
const bulletSpeed = 15;
const maxBullets = 30; // Ammo capacity
let currentAmmo = maxBullets;
let hasGun = false;
let lastShotTime = 0;
const fireRate = 100; // Milliseconds between shots
const shellCasings = [];
const muzzleFlashes = [];

// Add mouse tracking
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Add click listener for shooting
canvas.addEventListener('mousedown', (e) => {
    if (hasGun && currentAmmo > 0 && Date.now() - lastShotTime > fireRate) {
        shoot();
    }
});

// Add R key for reloading
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && hasGun) {
        reload();
    }
});

function shoot() {
    const cameraX = Math.max(0, Math.min(player.x - canvas.width/2, WORLD_WIDTH - canvas.width));
    const cameraY = Math.max(0, Math.min(player.y - canvas.height/2, WORLD_HEIGHT - canvas.height));
    
    // Calculate actual mouse position in world coordinates
    const targetX = mouseX + cameraX;
    const targetY = mouseY + cameraY;
    
    // Calculate direction
    const angle = Math.atan2(targetY - (player.y + player.height/2), 
                           targetX - (player.x + player.width/2));
    
    // Create bullet
    bullets.push({
        x: player.x + player.width/2,
        y: player.y + player.height/2,
        velocityX: Math.cos(angle) * bulletSpeed,
        velocityY: Math.sin(angle) * bulletSpeed,
        size: 5,
        damage: 10,
        lifetime: 60 // frames
    });

    // Create muzzle flash
    muzzleFlashes.push({
        x: player.x + player.width/2 + Math.cos(angle) * 30,
        y: player.y + player.height/2 + Math.sin(angle) * 30,
        size: 20,
        alpha: 1,
        angle: angle
    });

    // Create shell casing
    shellCasings.push({
        x: player.x + player.width/2,
        y: player.y + player.height/2,
        velocityX: Math.cos(angle + Math.PI/2) * 3,
        velocityY: -4,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        rotation: 0,
        gravity: 0.2,
        bounces: 2
    });

    // Update ammo and shot time
    currentAmmo--;
    lastShotTime = Date.now();

    // Add screen shake
    screenShake = 5;
}

function reload() {
    currentAmmo = maxBullets;
}

// Update game logic
function update() {
    // Horizontal movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;

    // Apply gravity
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // Check platform collisions
    let onPlatform = false;
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Collision from above
            if (player.velocityY > 0 && 
                player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                onPlatform = true;
            }
        }
    });

    // Jump when on platform
    if (keys.up && !player.isJumping && onPlatform) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
    }

    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > WORLD_WIDTH) player.x = WORLD_WIDTH - player.width;
    
    // Reset player if they fall
    if (player.y > WORLD_HEIGHT) {
        resetPlayer();
    }

    // Update enemies
    enemies.forEach(enemy => {
        // Move enemy
        enemy.x += enemy.speed * enemy.direction;

        // Change direction at patrol boundaries
        if (enemy.x <= enemy.patrolStart) {
            enemy.direction = 1;
        } else if (enemy.x >= enemy.patrolEnd) {
            enemy.direction = -1;
        }

        // Check collision with player
        if (checkCollision(player, enemy)) {
            resetPlayer();
        }
    });

    // Check gun pickup collision
    if (!gunPickup.collected && checkCollision(player, gunPickup)) {
        gunPickup.collected = true;
        hasGun = true;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
        bullet.lifetime--;

        // Check enemy collisions
        enemies.forEach(enemy => {
            if (checkCollision(bullet, enemy)) {
                // Remove enemy and bullet
                enemies.splice(enemies.indexOf(enemy), 1);
                bullets.splice(i, 1);
                // Add particle effect for hit
                createBloodEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            }
        });

        // Remove old bullets
        if (bullet.lifetime <= 0) {
            bullets.splice(i, 1);
        }
    }

    // Update shell casings
    shellCasings.forEach(shell => {
        shell.x += shell.velocityX;
        shell.y += shell.velocityY;
        shell.velocityY += shell.gravity;
        shell.rotation += shell.rotationSpeed;

        // Ground collision
        platforms.forEach(platform => {
            if (shell.y > platform.y - 5 && 
                shell.y < platform.y + 5 && 
                shell.x > platform.x && 
                shell.x < platform.x + platform.width) {
                if (shell.bounces > 0) {
                    shell.velocityY = -shell.velocityY * 0.6;
                    shell.velocityX *= 0.8;
                    shell.bounces--;
                } else {
                    shell.velocityY = 0;
                    shell.velocityX *= 0.95;
                }
            }
        });
    });

    // Update muzzle flashes
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        muzzleFlashes[i].alpha -= 0.2;
        if (muzzleFlashes[i].alpha <= 0) {
            muzzleFlashes.splice(i, 1);
        }
    }
}

// Add player reset function
function resetPlayer() {
    player.x = 50;
    player.y = 200;
    player.velocityY = 0;
}

// Draw game elements
function draw() {
    // Clear canvas with transform reset
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#87CEEB';  // Sky blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Camera follow with smooth movement
    const cameraX = Math.max(0, Math.min(player.x - canvas.width/2, WORLD_WIDTH - canvas.width));
    const cameraY = Math.max(0, Math.min(player.y - canvas.height/2, WORLD_HEIGHT - canvas.height));
    ctx.setTransform(1, 0, 0, 1, -cameraX, -cameraY);

    // Draw background elements
    ctx.fillStyle = '#ddd';  // Distant mountains
    for(let i = 0; i < WORLD_WIDTH; i += 500) {
        ctx.beginPath();
        ctx.moveTo(i, WORLD_HEIGHT - 200);
        ctx.lineTo(i + 250, WORLD_HEIGHT - 500);
        ctx.lineTo(i + 500, WORLD_HEIGHT - 200);
        ctx.fill();
    }

    // Draw platforms
    ctx.fillStyle = '#8B4513';  // Brown platforms
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw enemies
    ctx.fillStyle = '#00FF00';  // Green enemies
    enemies.forEach(enemy => {
        // Draw enemy body
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw enemy eyes (makes them look more menacing)
        ctx.fillStyle = '#000000';
        if (enemy.direction === 1) {
            // Eyes pointing right
            ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 5, 5, 5);
            ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 20, 5, 5);
        } else {
            // Eyes pointing left
            ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
            ctx.fillRect(enemy.x + 5, enemy.y + 20, 5, 5);
        }
        ctx.fillStyle = '#00FF00';
    });

    // Draw player
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw gun pickup
    if (!gunPickup.collected) {
        ctx.fillStyle = '#666';
        ctx.fillRect(gunPickup.x, gunPickup.y, gunPickup.width, gunPickup.height);
        // Draw gun details
        ctx.fillStyle = '#444';
        ctx.fillRect(gunPickup.x + 25, gunPickup.y - 5, 15, 10);
    }

    // Draw bullets
    ctx.fillStyle = '#FFA500';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw shell casings
    ctx.fillStyle = '#B8860B';
    shellCasings.forEach(shell => {
        ctx.save();
        ctx.translate(shell.x, shell.y);
        ctx.rotate(shell.rotation);
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();
    });

    // Draw muzzle flashes
    muzzleFlashes.forEach(flash => {
        ctx.save();
        ctx.translate(flash.x, flash.y);
        ctx.rotate(flash.angle);
        ctx.globalAlpha = flash.alpha;
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(0, 0, flash.size, 0, Math.PI * 2);
        ctx.fill();
        // Add inner bright flash
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, flash.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    });

    // Draw gun if collected
    if (hasGun) {
        const cameraX = Math.max(0, Math.min(player.x - canvas.width/2, WORLD_WIDTH - canvas.width));
        const cameraY = Math.max(0, Math.min(player.y - canvas.height/2, WORLD_HEIGHT - canvas.height));
        
        // Calculate gun angle based on mouse position
        const angle = Math.atan2(
            (mouseY + cameraY) - (player.y + player.height/2),
            (mouseX + cameraX) - (player.x + player.width/2)
        );

        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.rotate(angle);
        
        // Draw gun body
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, 40, 10);
        ctx.fillStyle = '#666';
        ctx.fillRect(0, -3, 35, 6);
        
        // Draw gun grip
        ctx.fillStyle = '#444';
        ctx.fillRect(5, 5, 10, 15);
        
        ctx.restore();
    }

    // Draw ammo counter if has gun
    if (hasGun) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for UI
        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText(`Ammo: ${currentAmmo}/${maxBullets}`, 20, 30);
        ctx.restore();
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

// Helper function to create blood effect
function createBloodEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particles.push({
            x: x,
            y: y,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            size: Math.random() * 5 + 2,
            color: '#8B0000',
            lifetime: 60
        });
    }
} 