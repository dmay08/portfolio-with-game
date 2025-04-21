import React, { useRef, useEffect } from 'react';

const GameBackground = () => {
    const sketchRef = useRef(null);

    useEffect(() => {
        // Make sure p5 is available globally
        const p5 = window.p5;
        if (!p5) {
            console.error('p5.js is not loaded');
            return;
        }

        const sketch = (p) => {
            let stars = [];
            let playerX, playerY;
            let playerWidth = 40;
            let playerHeight = 60;
            let enemies = [];
            let playerBullets = [];
            let enemyBullets = [];
            let lives = 3;
            let score = 0;
            let shootCooldown = 0;
            let enemyDirection = 1;
            let enemySpeed = 2;
            let buttonSize = 60;
            let isGameOver = false;
            let gameOverTimer = 0;
            let playerHitEffect = 0;
            let explosions = [];
            let powerups = [];
            let powerupSpawnTimer = 300; // 5 seconds at 60fps
            let activePowerups = {
                shield: 0,
                tripleShot: 0,
                speedBoost: 0
            };
            let powerGainEffects = [];

            p.setup = () => {
                p.createCanvas(p.windowWidth, p.windowHeight).parent(sketchRef.current);
                playerX = p.width / 2;
                playerY = p.height - buttonSize - 20 - playerHeight;
                for (let i = 0; i < 100; i++) {
                    stars.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        speedY: p.random(1, 3),
                        size: p.random(1, 3),
                    });
                }
                spawnEnemies();
                
                // Create initial powerups
                powerups = []; // Clear any existing powerups
                createPowerup('shield', p.width / 4, -50);
                createPowerup('tripleShot', p.width / 2, -100);
                createPowerup('speedBoost', p.width * 3/4, -150);
                
                console.log("Initial powerups created:", powerups.length);
            };

            function spawnEnemies() {
                enemies = [];
                for (let i = 0; i < 3; i++) {
                    enemies.push({
                        x: p.width / 2 - 100 + i * 100,
                        y: 80,
                        size: 40,
                        shootTimer: p.floor(p.random(60, 120)),
                        type: p.floor(p.random(3))
                    });
                }
            }
            
            function resetGame() {
                lives = 3;
                score = 0;
                isGameOver = false;
                playerBullets = [];
                enemyBullets = [];
                explosions = [];
                powerups = [];
                playerHitEffect = 0;
                powerupSpawnTimer = 60; // Spawn a powerup quickly after resetting
                activePowerups = {
                    shield: 0,
                    tripleShot: 0,
                    speedBoost: 0
                };
                spawnEnemies();
            }

            p.draw = () => {
                p.background(0);
                drawStars();
                
                if (isGameOver) {
                    drawGameOver();
                } else {
                    drawPlayer();
                    drawEnemies();
                    drawPlayerBullets();
                    drawEnemyBullets();
                    drawPowerups();
                    drawUI();
                    drawButtons();
                    handleInput();
                    updateGame();
                }
                
                drawExplosions();
            };
            
            function drawGameOver() {
                // White text with slight pulsing for visual emphasis
                p.fill(255, 255, 255, 200 + p.sin(p.frameCount * 0.1) * 55);
                p.textSize(70);
                p.textAlign(p.CENTER, p.CENTER);
                p.textStyle(p.BOLD);
                p.text("GAME OVER", p.width / 2, p.height / 2);
                
                p.textSize(30);
                p.textStyle(p.NORMAL);
                p.text("Final Score: " + score, p.width / 2, p.height / 2 + 70);
                
                gameOverTimer++;
                if (gameOverTimer > 240) { // 4 seconds at 60 FPS
                    resetGame();
                    gameOverTimer = 0;
                }
            }

            function drawStars() {
                for (let star of stars) {
                    p.fill(255);
                    p.noStroke();
                    p.ellipse(star.x, star.y, star.size, star.size);
                    star.y += star.speedY;
                    if (star.y > p.height) {
                        star.y = 0;
                        star.x = p.random(p.width);
                    }
                }
            }

            function drawPlayer() {
                // Skip drawing player if in hit animation and blinking
                if (playerHitEffect > 0 && Math.floor(playerHitEffect / 5) % 2 === 0) {
                    playerHitEffect--;
                    return;
                }
                
                if (playerHitEffect > 0) {
                    playerHitEffect--;
                }
                
                p.noStroke();
                
                // Hit effect - red glow when player is hit
                if (playerHitEffect > 0) {
                    p.fill(255, 0, 0, 100);
                    p.ellipse(playerX, playerY + playerHeight/2, playerWidth * 1.5, playerHeight * 1.5);
                }
                
                // Shield effect if active
                if (activePowerups.shield > 0) {
                    p.fill(0, 200, 255, 80 + p.sin(p.frameCount * 0.2) * 40);
                    p.ellipse(playerX, playerY + playerHeight/2, playerWidth * 2.2, playerHeight * 2);
                }
                
                // Thruster glow effect enhanced with speed boost
                let thrusterSize = 30;
                if (activePowerups.speedBoost > 0) {
                    thrusterSize = 50;
                    p.fill(0, 255, 0, 120 + p.sin(p.frameCount * 0.3) * 50);
                    p.ellipse(playerX, playerY + playerHeight + 20, thrusterSize + p.sin(p.frameCount * 0.4) * 15, thrusterSize - 10);
                }
                
                // Normal thruster
                p.fill(255, 0, 255, 100 + p.sin(p.frameCount * 0.2) * 50); // Neon pink
                p.ellipse(playerX, playerY + playerHeight + 15, thrusterSize + p.sin(p.frameCount * 0.3) * 10, 20);
                
                // Main body
                p.fill(220); // Light grey
                p.ellipse(playerX, playerY + playerHeight/2, playerWidth * 0.9, playerHeight * 1.1);
                
                // Cockpit
                p.fill(50); // Dark grey
                p.ellipse(playerX, playerY + playerHeight/3, playerWidth/2, playerHeight/4);
                
                // Wings
                p.fill(180); // Medium grey
                // Left wing
                p.beginShape();
                p.vertex(playerX - playerWidth/4, playerY + playerHeight/2);
                p.vertex(playerX - playerWidth*1.2, playerY + playerHeight*0.7);
                p.vertex(playerX - playerWidth/2, playerY + playerHeight*0.9);
                p.endShape(p.CLOSE);
                // Right wing
                p.beginShape();
                p.vertex(playerX + playerWidth/4, playerY + playerHeight/2);
                p.vertex(playerX + playerWidth*1.2, playerY + playerHeight*0.7);
                p.vertex(playerX + playerWidth/2, playerY + playerHeight*0.9);
                p.endShape(p.CLOSE);
                
                // Engine area
                p.fill(30); // Very dark grey
                p.rect(playerX - playerWidth/5, playerY + playerHeight*0.7, playerWidth*0.4, playerHeight*0.3, 5);
                
                // Details
                p.fill(255); // White highlights
                p.rect(playerX - playerWidth/8, playerY + playerHeight/10, playerWidth/4, playerHeight/20, 2);
                p.rect(playerX - playerWidth/8 + playerWidth/4 + playerWidth/20, playerY + playerHeight/10, playerWidth/4, playerHeight/20, 2);
                
                // Top fin
                p.fill(100); // Grey
                p.triangle(
                    playerX, playerY + playerHeight/6,
                    playerX - playerWidth/10, playerY + playerHeight/2,
                    playerX + playerWidth/10, playerY + playerHeight/2
                );
            }

            function drawEnemies() {
                for (let enemy of enemies) {
                    // Base shape for all enemies
                    p.noStroke();
                    
                    // Enemy type variations
                    if (enemy.type === 0) {
                        // Type 1: Saucer with dome
                        // Glow effect
                        p.fill(255, 0, 255, 80); // Neon pink glow
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 2, enemy.size);
                        
                        // Main body
                        p.fill(70);
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 1.8, enemy.size * 0.7);
                        
                        // Dome
                        p.fill(200);
                        p.ellipse(enemy.x, enemy.y, enemy.size * 0.9, enemy.size * 0.6);
                        
                        // Center light
                        p.fill(255, 0, 255); // Neon pink
                        p.ellipse(enemy.x, enemy.y, enemy.size * 0.3, enemy.size * 0.3);
                        
                    } else if (enemy.type === 1) {
                        // Type 2: Angular fighter
                        // Glow effect
                        p.fill(170, 0, 255, 80); // Neon purple glow
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 2, enemy.size);
                        
                        // Main body
                        p.fill(50);
                        p.beginShape();
                        p.vertex(enemy.x, enemy.y - enemy.size/2);
                        p.vertex(enemy.x + enemy.size, enemy.y + enemy.size/2);
                        p.vertex(enemy.x, enemy.y + enemy.size);
                        p.vertex(enemy.x - enemy.size, enemy.y + enemy.size/2);
                        p.endShape(p.CLOSE);
                        
                        // Center
                        p.fill(150);
                        p.ellipse(enemy.x, enemy.y + enemy.size/3, enemy.size * 0.6, enemy.size * 0.6);
                        
                        // Accent
                        p.fill(170, 0, 255); // Neon purple
                        p.rect(enemy.x - enemy.size * 0.8, enemy.y + enemy.size/3, enemy.size * 1.6, enemy.size * 0.1);
                        
                    } else {
                        // Type 3: Insectoid ship
                        // Glow effect
                        p.fill(255, 0, 200, 80); // Neon magenta glow
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 2, enemy.size);
                        
                        // Main body
                        p.fill(40);
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size, enemy.size * 1.2);
                        
                        // Wings
                        p.fill(100);
                        p.triangle(
                            enemy.x, enemy.y,
                            enemy.x - enemy.size, enemy.y - enemy.size/2,
                            enemy.x - enemy.size/2, enemy.y + enemy.size/2
                        );
                        p.triangle(
                            enemy.x, enemy.y,
                            enemy.x + enemy.size, enemy.y - enemy.size/2,
                            enemy.x + enemy.size/2, enemy.y + enemy.size/2
                        );
                        
                        // Eyes
                        p.fill(255, 0, 200); // Neon magenta
                        p.ellipse(enemy.x - enemy.size/4, enemy.y, enemy.size * 0.2, enemy.size * 0.2);
                        p.ellipse(enemy.x + enemy.size/4, enemy.y, enemy.size * 0.2, enemy.size * 0.2);
                    }
                }
            }

            function drawPlayerBullets() {
                p.noStroke();
                for (let bullet of playerBullets) {
                    // Glow effect
                    p.fill(255, 0, 255, 150); // Neon pink with alpha
                    p.ellipse(bullet.x, bullet.y, 12, 12);
                    
                    // Core
                    p.fill(255);
                    p.ellipse(bullet.x, bullet.y, 6, 6);
                }
            }

            function drawEnemyBullets() {
                p.noStroke();
                for (let bullet of enemyBullets) {
                    // Glow effect
                    p.fill(170, 0, 255, 150); // Neon purple with alpha
                    p.ellipse(bullet.x, bullet.y, 10, 10);
                    
                    // Core
                    p.fill(255);
                    p.ellipse(bullet.x, bullet.y, 4, 4);
                }
            }

            function drawPowerups() {
                if (powerups.length === 0) {
                    // Ensure there's always at least one powerup
                    console.log("No powerups found, creating one");
                    createPowerup('shield', p.random(100, p.width - 100), -50);
                }
                
                // Draw each powerup
                for (let i = 0; i < powerups.length; i++) {
                    let powerup = powerups[i];
                    
                    // Update rotation and pulse
                    powerup.rotation += 1;
                    powerup.pulse += 0.1;
                    
                    // Create trail particles
                    if (p.frameCount % 3 === 0) {
                        powerup.particles.push({
                            x: powerup.x + p.random(-10, 10),
                            y: powerup.y + p.random(-10, 10),
                            size: p.random(5, 15),
                            alpha: 255,
                            life: 30
                        });
                    }
                    
                    // Update and draw particles
                    p.noStroke();
                    for (let j = powerup.particles.length - 1; j >= 0; j--) {
                        let particle = powerup.particles[j];
                        particle.life--;
                        particle.alpha -= 8;
                        particle.y += 0.5; // Slight downward drift
                        
                        // Draw fading particles
                        let particleColor;
                        switch (powerup.type) {
                            case 'shield':
                                particleColor = p.color(150, 50, 255, particle.alpha);
                                break;
                            case 'tripleShot':
                                particleColor = p.color(255, 50, 150, particle.alpha);
                                break;
                            case 'speedBoost':
                                particleColor = p.color(255, 0, 255, particle.alpha);
                                break;
                            default:
                                particleColor = p.color(255, 255, 255, particle.alpha);
                                break;
                        }
                        p.fill(particleColor);
                        p.ellipse(particle.x, particle.y, particle.size, particle.size);
                        
                        // Remove dead particles
                        if (particle.life <= 0) {
                            powerup.particles.splice(j, 1);
                        }
                    }
                    
                    // Main powerup glow - outer pulse
                    p.push();
                    p.translate(powerup.x, powerup.y);
                    p.rotate(p.radians(powerup.rotation));
                    
                    // Pulsing size
                    let pulseSize = 65 + Math.sin(powerup.pulse) * 10;
                    
                    // Outer glow
                    p.noFill();
                    for (let g = 0; g < 3; g++) {
                        let glowSize = pulseSize + g * 5;
                        let alpha = 100 - g * 30;
                        switch (powerup.type) {
                            case 'shield':
                                p.stroke(150, 50, 255, alpha);
                                break;
                            case 'tripleShot':
                                p.stroke(255, 50, 150, alpha);
                                break;
                            case 'speedBoost':
                                p.stroke(255, 0, 255, alpha);
                                break;
                            default:
                                p.stroke(255, 255, 255, alpha);
                                break;
                        }
                        p.strokeWeight(3);
                        p.ellipse(0, 0, glowSize, glowSize);
                    }
                    
                    // Main powerup shape - changed to represent their function
                    p.noStroke();
                    switch (powerup.type) {
                        case 'shield':
                            // Simple shield shape
                            // Main shield body
                            p.fill(130, 50, 240);
                            p.beginShape();
                            p.vertex(0, -25);  // Top point
                            p.vertex(20, -10); // Top right
                            p.vertex(20, 15);  // Bottom right
                            p.vertex(0, 25);   // Bottom point
                            p.vertex(-20, 15); // Bottom left
                            p.vertex(-20, -10); // Top left
                            p.endShape(p.CLOSE);
                            
                            // Inner shield detail
                            p.fill(180, 100, 255);
                            p.beginShape();
                            p.vertex(0, -15);  // Top point
                            p.vertex(12, -5);  // Top right
                            p.vertex(12, 10);  // Bottom right
                            p.vertex(0, 18);   // Bottom point
                            p.vertex(-12, 10); // Bottom left
                            p.vertex(-12, -5); // Top left
                            p.endShape(p.CLOSE);
                            
                            // Center dot
                            p.fill(255);
                            p.ellipse(0, 0, 8, 8);
                            break;
                            
                        case 'tripleShot':
                            // Pistol body
                            p.fill(220, 20, 120);
                            p.rect(-15, -5, 30, 15); // Horizontal body
                            
                            // Handle
                            p.fill(180, 10, 100);
                            p.rect(-10, 10, 10, 15); // Vertical handle
                            
                            // Three barrels
                            p.fill(180, 10, 100);
                            // p.rect(10, -10, 15, 4);  // Top barrel
                            p.rect(10, -2, 15, 4);   // Middle barrel
                            // p.rect(10, 6, 15, 4);    // Bottom barrel
                            
                            // Muzzle details
                            p.fill(255);
                            p.ellipse(25, -8, 3, 3); // Top muzzle
                            p.ellipse(25, 0, 3, 3);  // Middle muzzle
                            p.ellipse(25, 8, 3, 3);  // Bottom muzzle
                            break;
                            
                        case 'speedBoost':
                            // Simple rocket shape
                            // Rocket body
                            p.fill(220, 50, 220);
                            p.rect(-8, -20, 16, 30, 5);
                            
                            // Rocket nose
                            p.fill(255, 100, 255);
                            p.triangle(-8, -20, 0, -30, 8, -20);
                            
                            // Rocket fins
                            p.fill(255, 100, 255);
                            p.triangle(-8, 10, -15, 20, -8, 5);  // Left fin
                            p.triangle(8, 10, 15, 20, 8, 5);     // Right fin
                            
                            // Rocket flame - animated
                            p.fill(255, 150, 50, 200 + Math.sin(p.frameCount * 0.3) * 55);
                            p.triangle(-6, 10, 0, 25 + Math.sin(p.frameCount * 0.5) * 5, 6, 10);
                            p.fill(255, 255, 100, 150 + Math.sin(p.frameCount * 0.3) * 55);
                            p.triangle(-3, 10, 0, 18 + Math.sin(p.frameCount * 0.5) * 3, 3, 10);
                            break;
                        default:
                            // Default shape (circle)
                            p.fill(255);
                            p.ellipse(0, 0, 30, 30);
                            break;
                    }
                    
                    p.pop();
                }
            }

            function drawUI() {
                p.fill(255);
                p.textSize(16);
                p.textAlign(p.LEFT);
                p.text("Score: " + score, 10, 20);
                p.text("Lives: " + lives, 10, 40);
                
                // Draw active powerups
                let yPos = 70;
                p.textAlign(p.LEFT);
                
                if (activePowerups.shield > 0) {
                    p.fill(0, 200, 255);
                    p.text("🛡️ Shield: " + Math.ceil(activePowerups.shield / 60) + "s", 10, yPos);
                    yPos += 25;
                }
                
                if (activePowerups.tripleShot > 0) {
                    p.fill(255, 50, 50);
                    p.text("🔥 Triple Shot: " + Math.ceil(activePowerups.tripleShot / 60) + "s", 10, yPos);
                    yPos += 25;
                }
                
                if (activePowerups.speedBoost > 0) {
                    p.fill(50, 255, 50);
                    p.text("⚡ Speed Boost: " + Math.ceil(activePowerups.speedBoost / 60) + "s", 10, yPos);
                }
            }

            function drawButtons() {
                p.fill(100, 100, 100, 150);
                p.noStroke();
                p.rect(0, p.height - buttonSize, buttonSize, buttonSize);
                p.rect(p.width - buttonSize, p.height - buttonSize, buttonSize, buttonSize);
                p.rect(p.width / 2 - buttonSize / 2, p.height - buttonSize, buttonSize, buttonSize);
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(16);
                p.text("Left", buttonSize / 2, p.height - buttonSize / 2);
                p.text("Right", p.width - buttonSize / 2, p.height - buttonSize / 2);
                p.text("Shoot", p.width / 2, p.height - buttonSize / 2);
            }

            function handleInput() {
                if (isGameOver) return;
                
                let moveLeft = p.keyIsDown(p.LEFT_ARROW) || (p.mouseIsPressed && p.mouseX < buttonSize && p.mouseY > p.height - buttonSize);
                let moveRight = p.keyIsDown(p.RIGHT_ARROW) || (p.mouseIsPressed && p.mouseX > p.width - buttonSize && p.mouseY > p.height - buttonSize);
                let shoot = p.keyIsDown(32) || (p.mouseIsPressed && p.mouseX > p.width / 2 - buttonSize / 2 && p.mouseX < p.width / 2 + buttonSize / 2 && p.mouseY > p.height - buttonSize);
                
                // Speed boost powerup affects movement speed
                const moveSpeed = activePowerups.speedBoost > 0 ? 12 : 7;
                
                if (moveLeft) playerX -= moveSpeed;
                if (moveRight) playerX += moveSpeed;
                playerX = p.constrain(playerX, playerWidth / 2, p.width - playerWidth / 2);
                
                if (shoot && shootCooldown <= 0) {
                    // Normal shot
                    playerBullets.push({ x: playerX, y: playerY - 15, speed: -15 });
                    
                    // Triple shot powerup
                    if (activePowerups.tripleShot > 0) {
                        playerBullets.push({ x: playerX - 15, y: playerY, speed: -15 });
                        playerBullets.push({ x: playerX + 15, y: playerY, speed: -15 });
                    }
                    
                    shootCooldown = 10;
                }
                
                if (shootCooldown > 0) shootCooldown--;
            }

            function updateGame() {
                if (isGameOver) return;
                
                // Update active powerups timers
                for (let type in activePowerups) {
                    if (activePowerups[type] > 0) {
                        activePowerups[type]--;
                    }
                }
                
                // Auto-spawn new powerups every 5 seconds
                powerupSpawnTimer--;
                if (powerupSpawnTimer <= 0) {
                    const types = ['shield', 'tripleShot', 'speedBoost'];
                    const type = types[Math.floor(p.random(types.length))];
                    createPowerup(type, p.random(100, p.width - 100), -50);
                    console.log("Timer spawned new powerup:", type);
                    powerupSpawnTimer = 300; // Reset to 5 seconds
                }
                
                // Move powerups down the screen
                for (let i = powerups.length - 1; i >= 0; i--) {
                    let powerup = powerups[i];
                    powerup.y += powerup.speed; // Faster, varying speeds
                    
                    // Add slight horizontal wobble
                    powerup.x += Math.sin(p.frameCount * 0.05 + i) * 1.5;
                    
                    // Remove if offscreen
                    if (powerup.y > p.height + 50) {
                        powerups.splice(i, 1);
                        console.log("Powerup went offscreen, removed");
                    }
                }
                
                // Check for powerup collection
                let playerHitBox = { 
                    left: playerX - playerWidth, 
                    right: playerX + playerWidth, 
                    top: playerY - playerHeight/2, 
                    bottom: playerY + playerHeight 
                };
                
                for (let i = powerups.length - 1; i >= 0; i--) {
                    let powerup = powerups[i];
                    let powerupBB = { 
                        left: powerup.x - 30, 
                        right: powerup.x + 30, 
                        top: powerup.y - 30, 
                        bottom: powerup.y + 30 
                    };
                    
                    if (rectanglesOverlap(playerHitBox, powerupBB)) {
                        console.log("Powerup collected:", powerup.type);
                        
                        // Apply powerup effect
                        activePowerups[powerup.type] = 600; // 10 seconds
                        
                        // Create power gaining effect instead of explosion
                        // Radial energy waves expanding outward
                        for (let j = 0; j < 3; j++) {
                            let color;
                            switch (powerup.type) {
                                case 'shield': color = p.color(150, 50, 255); break;
                                case 'tripleShot': color = p.color(255, 50, 150); break;
                                case 'speedBoost': color = p.color(255, 0, 255); break;
                            }
                            
                            // Add energy wave effect
                            powerGainEffects.push({
                                x: playerX,
                                y: playerY,
                                color: color,
                                radius: 20,
                                maxRadius: 100 + j * 30,
                                alpha: 255
                            });
                        }
                        
                        // Remove collected powerup
                        powerups.splice(i, 1);
                        
                        // Add score
                        score += 5;
                    }
                }
                
                // Regular game updates
                for (let bullet of playerBullets) {
                    bullet.y += bullet.speed;
                }
                playerBullets = playerBullets.filter(b => b.y > -10);
                
                for (let bullet of enemyBullets) {
                    bullet.y += bullet.speed;
                }
                enemyBullets = enemyBullets.filter(b => b.y < p.height + 10);
                
                let shouldReverse = false;
                for (let enemy of enemies) {
                    enemy.x += enemyDirection * enemySpeed;
                    if (enemy.x - enemy.size / 2 < 0 || enemy.x + enemy.size / 2 > p.width) {
                        shouldReverse = true;
                    }
                    if (enemy.shootTimer > 0) {
                        enemy.shootTimer--;
                    } else {
                        enemyBullets.push({ x: enemy.x, y: enemy.y + enemy.size / 2, speed: 5 });
                        enemy.shootTimer = p.floor(p.random(60, 120));
                    }
                }
                if (shouldReverse) {
                    enemyDirection *= -1;
                }
                for (let i = playerBullets.length - 1; i >= 0; i--) {
                    let bullet = playerBullets[i];
                    let bulletBB = { left: bullet.x - 1, right: bullet.x + 1, top: bullet.y - 5, bottom: bullet.y + 5 };
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        let enemy = enemies[j];
                        let enemyBB = { left: enemy.x - enemy.size / 2, right: enemy.x + enemy.size / 2, top: enemy.y, bottom: enemy.y + enemy.size / 2 };
                        if (rectanglesOverlap(bulletBB, enemyBB)) {
                            playerBullets.splice(i, 1);
                            
                            // Create explosion at impact point
                            explosions.push({
                                x: bullet.x,
                                y: bullet.y,
                                size: 30,
                                frame: 0
                            });
                            
                            enemies.splice(j, 1);
                            score += 10;
                            
                            // Create larger explosion for enemy death
                            explosions.push({
                                x: enemy.x,
                                y: enemy.y,
                                size: 60,
                                frame: 0
                            });
                            
                            break;
                        }
                    }
                }
                
                // Check player collision with enemy bullets
                let playerBB = { left: playerX - playerWidth, right: playerX + playerWidth, top: playerY - playerHeight/2, bottom: playerY + playerHeight };
                for (let i = enemyBullets.length - 1; i >= 0; i--) {
                    let bullet = enemyBullets[i];
                    let bulletBB = { left: bullet.x - 1, right: bullet.x + 1, top: bullet.y - 5, bottom: bullet.y + 5 };
                    if (rectanglesOverlap(bulletBB, playerBB)) {
                        enemyBullets.splice(i, 1);
                        
                        // Create hit explosion
                        explosions.push({
                            x: bullet.x,
                            y: bullet.y,
                            size: 40,
                            frame: 0
                        });
                        
                        // Check for shield
                        if (activePowerups.shield > 0) {
                            // Shield absorbs hit without damage
                            continue;
                        }
                        
                        // Player hit effect
                        playerHitEffect = 30;
                        
                        lives--;
                        if (lives <= 0) {
                            // Create big explosion for player death
                            for (let i = 0; i < 5; i++) {
                                explosions.push({
                                    x: playerX + p.random(-playerWidth, playerWidth),
                                    y: playerY + p.random(-playerHeight, playerHeight),
                                    size: 70 + p.random(20),
                                    frame: p.random(5)
                                });
                            }
                            
                            isGameOver = true;
                        }
                    }
                }
                
                if (enemies.length === 0) {
                    spawnEnemies();
                }
                
                // Update power gain effects
                for (let i = powerGainEffects.length - 1; i >= 0; i--) {
                    let effect = powerGainEffects[i];
                    effect.radius += 3;
                    effect.alpha -= 5;
                    
                    if (effect.radius >= effect.maxRadius || effect.alpha <= 0) {
                        powerGainEffects.splice(i, 1);
                    }
                }
            }

            function rectanglesOverlap(r1, r2) {
                return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
            }

            function drawExplosions() {
                for (let i = explosions.length - 1; i >= 0; i--) {
                    let exp = explosions[i];
                    
                    // Draw explosion
                    p.noStroke();
                    
                    // Outer glow
                    p.fill(255, 100, 0, 150 - exp.frame * 2);
                    p.ellipse(exp.x, exp.y, exp.size * (1 + exp.frame/10), exp.size * (1 + exp.frame/10));
                    
                    // Inner bright part
                    p.fill(255, 200, 0, 200 - exp.frame * 3);
                    p.ellipse(exp.x, exp.y, exp.size * (0.7 + exp.frame/15), exp.size * (0.7 + exp.frame/15));
                    
                    // Core
                    p.fill(255);
                    p.ellipse(exp.x, exp.y, exp.size * (0.3 + exp.frame/30), exp.size * (0.3 + exp.frame/30));
                    
                    // Update explosion frame
                    exp.frame++;
                    
                    // Remove old explosions
                    if (exp.frame > 30) {
                        explosions.splice(i, 1);
                    }
                }
                
                // Draw power gain effects
                for (let effect of powerGainEffects) {
                    p.noFill();
                    let color = effect.color;
                    color.setAlpha(effect.alpha);
                    p.stroke(color);
                    p.strokeWeight(3);
                    p.ellipse(effect.x, effect.y, effect.radius * 2, effect.radius * 2);
                }
            }

            // The below functions are kept for future use but currently not actively used
            // eslint-disable-next-line no-unused-vars
            function spawnRandomPowerup() {
                const types = ['shield', 'tripleShot', 'speedBoost'];
                const type = types[Math.floor(p.random(types.length))];
                
                console.log("Spawning powerup:", type); // Debug message
                
                powerups.push({
                    x: p.random(100, p.width - 100),
                    y: -50,
                    type: type,
                    speed: p.random(1, 3) // Variable speed
                });
            }

            function createPowerup(type, x, y) {
                powerups.push({
                    type: type,
                    x: x,
                    y: y,
                    speed: p.random(3, 7),          // Faster, varying speeds
                    rotation: p.random(0, 360),     // Starting rotation
                    pulse: p.random(0, 100),        // For offset pulsing effect
                    particles: []                   // Trailing particles
                });
                console.log("Created powerup:", type, "at", x, y);
            }

            // Helper function to draw regular polygons
            // eslint-disable-next-line no-unused-vars
            function drawPolygon(x, y, radius, sides, rotation = 0) {
                p.beginShape();
                for (let i = 0; i < sides; i++) {
                    let angle = p.radians(rotation + i * 360 / sides);
                    let vx = x + cos(angle) * radius;
                    let vy = y + sin(angle) * radius;
                    p.vertex(vx, vy);
                }
                p.endShape(p.CLOSE);
            }
            
            // Helper function to draw a star
            // eslint-disable-next-line no-unused-vars
            function drawStar(x, y, innerRadius, outerRadius, points) {
                p.beginShape();
                for (let i = 0; i < points * 2; i++) {
                    let angle = p.radians(i * 180 / points);
                    let radius = i % 2 === 0 ? outerRadius : innerRadius;
                    let vx = x + cos(angle) * radius;
                    let vy = y + sin(angle) * radius;
                    p.vertex(vx, vy);
                }
                p.endShape(p.CLOSE);
            }
            
            // Helper functions for drawPolygon
            function cos(angle) {
                return Math.cos(angle);
            }
            
            function sin(angle) {
                return Math.sin(angle);
            }

            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
                playerX = p.width / 2;
                playerY = p.height - buttonSize - 20 - playerHeight;
            };
        };

        const p5Instance = new window.p5(sketch);
        return () => {
            p5Instance.remove();
        };
    }, []);

    return <div ref={sketchRef} className="absolute inset-0 z-0" />;
};

export default GameBackground;