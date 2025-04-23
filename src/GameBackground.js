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
            let powerupSpawnTimer = 900; // Changed from 300 (5 seconds) to 900 (15 seconds at 60fps)
            let activePowerups = {
                shield: 0,
                tripleShot: 0,
                speedBoost: 0
            };
            let powerGainEffects = [];
            let alienHeads = []; // Array to track alien heads
            let alienSpawnTimer = 180; // Spawn a new alien head every 3 seconds

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
                
                // Instead of creating an initial powerup, set a random timer for the first one
                powerups = []; // Clear any existing powerups
                powerupSpawnTimer = p.floor(p.random(120, 600)); // Random time between 2-10 seconds
                
                // Initialize alien heads array
                alienHeads = [];
                alienSpawnTimer = p.floor(p.random(60, 180));
                
                console.log("First powerup will appear in", Math.ceil(powerupSpawnTimer / 60), "seconds");
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
                alienHeads = []; // Reset alien heads
                playerHitEffect = 0;
                powerupSpawnTimer = 300; // Changed from 60 to 300 (5 seconds)
                alienSpawnTimer = 180; // Reset alien spawn timer
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
                    drawAlienHeads(); // Draw alien heads
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
                
                // Improved thruster effects
                const baseY = playerY + playerHeight;
                
                // Main thruster flame effect
                if (activePowerups.speedBoost > 0) {
                    // Enhanced thruster with speed boost
                    p.fill(0, 255, 150, 180 + p.sin(p.frameCount * 0.3) * 50);
                    
                    // Main flame
                    p.beginShape();
                    p.vertex(playerX - 8, baseY);
                    p.vertex(playerX - 15, baseY + 15 + p.sin(p.frameCount * 0.4) * 5);
                    p.vertex(playerX, baseY + 40 + p.sin(p.frameCount * 0.5) * 8);
                    p.vertex(playerX + 15, baseY + 15 + p.sin(p.frameCount * 0.4) * 5);
                    p.vertex(playerX + 8, baseY);
                    p.endShape(p.CLOSE);
                    
                    // Inner flame (brighter)
                    p.fill(100, 255, 200, 200);
                    p.beginShape();
                    p.vertex(playerX - 4, baseY);
                    p.vertex(playerX - 8, baseY + 10 + p.sin(p.frameCount * 0.4) * 3);
                    p.vertex(playerX, baseY + 25 + p.sin(p.frameCount * 0.5) * 5);
                    p.vertex(playerX + 8, baseY + 10 + p.sin(p.frameCount * 0.4) * 3);
                    p.vertex(playerX + 4, baseY);
                    p.endShape(p.CLOSE);
                } else {
                    // Regular thruster
                    p.fill(255, 50, 255, 180 + p.sin(p.frameCount * 0.3) * 50);
                    
                    // Main flame
                    p.beginShape();
                    p.vertex(playerX - 7, baseY);
                    p.vertex(playerX - 10, baseY + 10 + p.sin(p.frameCount * 0.4) * 3);
                    p.vertex(playerX, baseY + 25 + p.sin(p.frameCount * 0.5) * 5);
                    p.vertex(playerX + 10, baseY + 10 + p.sin(p.frameCount * 0.4) * 3);
                    p.vertex(playerX + 7, baseY);
                    p.endShape(p.CLOSE);
                    
                    // Inner flame (brighter)
                    p.fill(255, 150, 255, 200);
                    p.beginShape();
                    p.vertex(playerX - 3, baseY);
                    p.vertex(playerX - 5, baseY + 7 + p.sin(p.frameCount * 0.4) * 2);
                    p.vertex(playerX, baseY + 15 + p.sin(p.frameCount * 0.5) * 3);
                    p.vertex(playerX + 5, baseY + 7 + p.sin(p.frameCount * 0.4) * 2);
                    p.vertex(playerX + 3, baseY);
                    p.endShape(p.CLOSE);
                }
                
                // Side thrusters
                p.fill(255, 100, 255, 150 + p.sin(p.frameCount * 0.2) * 40);
                p.beginShape(); // Left thruster
                p.vertex(playerX - playerWidth*0.8, playerY + playerHeight*0.7);
                p.vertex(playerX - playerWidth*0.9, playerY + playerHeight*0.8 + p.sin(p.frameCount * 0.3) * 3);
                p.vertex(playerX - playerWidth*0.7, playerY + playerHeight*0.8 + p.sin(p.frameCount * 0.3) * 3);
                p.endShape(p.CLOSE);
                
                p.beginShape(); // Right thruster
                p.vertex(playerX + playerWidth*0.8, playerY + playerHeight*0.7);
                p.vertex(playerX + playerWidth*0.9, playerY + playerHeight*0.8 + p.sin(p.frameCount * 0.3) * 3);
                p.vertex(playerX + playerWidth*0.7, playerY + playerHeight*0.8 + p.sin(p.frameCount * 0.3) * 3);
                p.endShape(p.CLOSE);
                
                // Redesigned spaceship
                // Main body - elongated teardrop shape
                p.fill(220); // Light grey
                p.beginShape();
                p.vertex(playerX, playerY - playerHeight/3); // Nose
                p.bezierVertex(
                    playerX + playerWidth/2, playerY, // Control point 1
                    playerX + playerWidth/2, playerY + playerHeight/2, // Control point 2
                    playerX, playerY + playerHeight // Bottom point
                );
                p.bezierVertex(
                    playerX - playerWidth/2, playerY + playerHeight/2, // Control point 1
                    playerX - playerWidth/2, playerY, // Control point 2
                    playerX, playerY - playerHeight/3 // Back to nose
                );
                p.endShape();
                
                // Armored plates
                p.fill(180); // Medium grey
                // Left plate
                p.beginShape();
                p.vertex(playerX - playerWidth/10, playerY);
                p.vertex(playerX - playerWidth/2, playerY + playerHeight/4);
                p.vertex(playerX - playerWidth/3, playerY + playerHeight*0.6);
                p.vertex(playerX - playerWidth/10, playerY + playerHeight*0.4);
                p.endShape(p.CLOSE);
                
                // Right plate
                p.beginShape();
                p.vertex(playerX + playerWidth/10, playerY);
                p.vertex(playerX + playerWidth/2, playerY + playerHeight/4);
                p.vertex(playerX + playerWidth/3, playerY + playerHeight*0.6);
                p.vertex(playerX + playerWidth/10, playerY + playerHeight*0.4);
                p.endShape(p.CLOSE);
                
                // Cockpit - blue glass dome with highlight
                p.fill(30, 100, 255, 200); // Blue tinted glass
                p.ellipse(playerX, playerY + playerHeight/6, playerWidth/2, playerHeight/4);
                
                // Cockpit highlight
                p.fill(200, 220, 255, 150);
                p.arc(playerX - playerWidth/10, playerY + playerHeight/8, playerWidth/4, playerHeight/8, p.PI, 2*p.PI);
                
                // Wings
                p.fill(160); // Darker grey
                // Left wing
                p.beginShape();
                p.vertex(playerX - playerWidth/4, playerY + playerHeight*0.45);
                p.vertex(playerX - playerWidth*1.2, playerY + playerHeight*0.65);
                p.vertex(playerX - playerWidth/2, playerY + playerHeight*0.85);
                p.endShape(p.CLOSE);
                
                // Right wing
                p.beginShape();
                p.vertex(playerX + playerWidth/4, playerY + playerHeight*0.45);
                p.vertex(playerX + playerWidth*1.2, playerY + playerHeight*0.65);
                p.vertex(playerX + playerWidth/2, playerY + playerHeight*0.85);
                p.endShape(p.CLOSE);
                
                // Engine area
                p.fill(40); // Dark grey
                p.rect(playerX - playerWidth/5, playerY + playerHeight*0.7, playerWidth*0.4, playerHeight*0.25, 5);
                
                // Neon details and highlights
                // Engine glow
                p.fill(255, 50, 255, 80); // Pink glow
                p.ellipse(playerX, playerY + playerHeight*0.83, playerWidth*0.3, playerHeight*0.1);
                
                // Side thrusters housings
                p.fill(60);
                p.rect(playerX - playerWidth*0.85, playerY + playerHeight*0.65, playerWidth*0.2, playerHeight*0.1, 2);
                p.rect(playerX + playerWidth*0.65, playerY + playerHeight*0.65, playerWidth*0.2, playerHeight*0.1, 2);
                
                // Side pod details
                p.fill(255); // White accents
                p.rect(playerX - playerWidth*0.9, playerY + playerHeight*0.5, playerWidth*0.15, playerHeight*0.02, 1);
                p.rect(playerX + playerWidth*0.75, playerY + playerHeight*0.5, playerWidth*0.15, playerHeight*0.02, 1);
            }

            function drawEnemies() {
                for (let enemy of enemies) {
                    // Base shape for all enemies
                    p.noStroke();
                    
                    // Enemy type variations
                    if (enemy.type === 0) {
                        // Type 1: Advanced Saucer with Tech Details
                        
                        // Glow effect
                        p.fill(255, 0, 255, 80); // Neon pink glow
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 2, enemy.size);
                        
                        // Main saucer body - metallic grey
                        p.fill(70);
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 1.8, enemy.size * 0.7);
                        
                        // Detailed body ridges
                        p.fill(40);
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 1.6, enemy.size * 0.5);
                        p.fill(90);
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 1.4, enemy.size * 0.3);
                        
                        // Center dome with details
                        p.fill(200);
                        p.ellipse(enemy.x, enemy.y, enemy.size * 0.9, enemy.size * 0.6);
                        
                        // Dome details - tech pattern
                        p.fill(150);
                        p.arc(enemy.x, enemy.y, enemy.size * 0.8, enemy.size * 0.5, p.PI, 2*p.PI);
                        
                        // Center energy core
                        p.fill(255, 0, 255); // Neon pink
                        p.ellipse(enemy.x, enemy.y, enemy.size * 0.4, enemy.size * 0.4);
                        
                        // Pulsing energy effect
                        p.fill(255, 100, 255, 100 + p.sin(p.frameCount * 0.2) * 50);
                        p.ellipse(enemy.x, enemy.y, enemy.size * 0.6, enemy.size * 0.3);
                        
                        // Bottom thrusters
                        p.fill(255, 150, 0, 200);
                        for (let i = -2; i <= 2; i++) {
                            let thrusterX = enemy.x + i * (enemy.size * 0.3);
                            p.ellipse(thrusterX, enemy.y + enemy.size * 0.7, enemy.size * 0.15, enemy.size * 0.2);
                            
                            // Thruster flames
                            if (p.frameCount % 4 < 2) {
                                p.fill(255, 100, 0, 150);
                                p.ellipse(thrusterX, enemy.y + enemy.size * 0.9, enemy.size * 0.1, enemy.size * 0.3);
                            }
                        }
                        
                    } else if (enemy.type === 1) {
                        // Type 2: Angular Battle Cruiser
                        
                        // Glow effect
                        p.fill(170, 0, 255, 80); // Neon purple glow
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 2, enemy.size);
                        
                        // Main body - angular and aggressive
                        p.fill(50);
                        // Central body
                        p.beginShape();
                        p.vertex(enemy.x, enemy.y - enemy.size * 0.5); // Front point
                        p.vertex(enemy.x + enemy.size * 0.8, enemy.y); // Right mid
                        p.vertex(enemy.x + enemy.size * 0.5, enemy.y + enemy.size * 0.8); // Right back
                        p.vertex(enemy.x - enemy.size * 0.5, enemy.y + enemy.size * 0.8); // Left back
                        p.vertex(enemy.x - enemy.size * 0.8, enemy.y); // Left mid
                        p.endShape(p.CLOSE);
                        
                        // Armor plating
                        p.fill(70);
                        p.quad(
                            enemy.x, enemy.y - enemy.size * 0.4,
                            enemy.x + enemy.size * 0.6, enemy.y,
                            enemy.x + enemy.size * 0.4, enemy.y + enemy.size * 0.4,
                            enemy.x, enemy.y + enemy.size * 0.1
                        );
                        p.quad(
                            enemy.x, enemy.y - enemy.size * 0.4,
                            enemy.x - enemy.size * 0.6, enemy.y,
                            enemy.x - enemy.size * 0.4, enemy.y + enemy.size * 0.4,
                            enemy.x, enemy.y + enemy.size * 0.1
                        );
                        
                        // Engine section
                        p.fill(40);
                        p.rect(enemy.x - enemy.size * 0.4, enemy.y + enemy.size * 0.5, enemy.size * 0.8, enemy.size * 0.3, 5);
                        
                        // Energy core
                        p.fill(170, 0, 255); // Neon purple
                        p.ellipse(enemy.x, enemy.y + enemy.size * 0.2, enemy.size * 0.4, enemy.size * 0.4);
                        
                        // Tech details - light strips
                        p.fill(200);
                        p.rect(enemy.x - enemy.size * 0.65, enemy.y, enemy.size * 0.3, enemy.size * 0.05, 2);
                        p.rect(enemy.x + enemy.size * 0.35, enemy.y, enemy.size * 0.3, enemy.size * 0.05, 2);
                        
                        // Thruster glow
                        p.fill(170, 0, 255, 150 + p.sin(p.frameCount * 0.3) * 50);
                        p.rect(enemy.x - enemy.size * 0.3, enemy.y + enemy.size * 0.8, enemy.size * 0.6, enemy.size * 0.1, 5);
                        
                        // Twin cannons
                        p.fill(90);
                        p.rect(enemy.x - enemy.size * 0.5, enemy.y + enemy.size * 0.1, enemy.size * 0.2, enemy.size * 0.3, 2);
                        p.rect(enemy.x + enemy.size * 0.3, enemy.y + enemy.size * 0.1, enemy.size * 0.2, enemy.size * 0.3, 2);
                        
                    } else {
                        // Type 3: Bio-mechanical Craft
                        
                        // Glow effect
                        p.fill(255, 0, 200, 80); // Neon magenta glow
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 2, enemy.size);
                        
                        // Main body - organic shape
                        p.fill(40);
                        p.ellipse(enemy.x, enemy.y + enemy.size/2, enemy.size * 1.2, enemy.size * 1.2);
                        
                        // Outer carapace
                        p.fill(60);
                        p.beginShape();
                        for (let angle = 0; angle < p.TWO_PI; angle += p.TWO_PI / 8) {
                            let r = enemy.size * 0.6 + p.sin(angle * 3 + p.frameCount * 0.05) * 5;
                            let x = enemy.x + r * p.cos(angle);
                            let y = enemy.y + enemy.size/2 + r * p.sin(angle);
                            p.vertex(x, y);
                        }
                        p.endShape(p.CLOSE);
                        
                        // Wing-like appendages
                        p.fill(80);
                        p.triangle(
                            enemy.x, enemy.y,
                            enemy.x - enemy.size * 1.1, enemy.y - enemy.size * 0.2 + p.sin(p.frameCount * 0.1) * 5,
                            enemy.x - enemy.size * 0.5, enemy.y + enemy.size * 0.6
                        );
                        p.triangle(
                            enemy.x, enemy.y,
                            enemy.x + enemy.size * 1.1, enemy.y - enemy.size * 0.2 + p.sin(p.frameCount * 0.1) * 5,
                            enemy.x + enemy.size * 0.5, enemy.y + enemy.size * 0.6
                        );
                        
                        // Central 'eye' - pulsing organic energy
                        p.fill(255, 0, 200); // Neon magenta
                        p.ellipse(enemy.x, enemy.y, enemy.size * 0.5, enemy.size * 0.5);
                        
                        // Inner eye detail
                        p.fill(255, 100, 225);
                        p.ellipse(enemy.x, enemy.y, enemy.size * 0.3, enemy.size * 0.3);
                        
                        // Vein-like patterns
                        p.stroke(255, 0, 200, 150);
                        p.strokeWeight(2);
                        for (let i = 0; i < 5; i++) {
                            let angle = p.TWO_PI / 5 * i + p.frameCount * 0.01;
                            p.line(
                                enemy.x, enemy.y,
                                enemy.x + p.cos(angle) * enemy.size * 0.8,
                                enemy.y + enemy.size/2 + p.sin(angle) * enemy.size * 0.8
                            );
                        }
                        p.noStroke();
                        
                        // Smaller sensory appendages
                        p.fill(70);
                        p.ellipse(enemy.x - enemy.size * 0.4, enemy.y - enemy.size * 0.2, enemy.size * 0.15, enemy.size * 0.3);
                        p.ellipse(enemy.x + enemy.size * 0.4, enemy.y - enemy.size * 0.2, enemy.size * 0.15, enemy.size * 0.3);
                        
                        // Glow tips
                        p.fill(255, 100, 200);
                        p.ellipse(enemy.x - enemy.size * 0.4, enemy.y - enemy.size * 0.35, enemy.size * 0.1, enemy.size * 0.1);
                        p.ellipse(enemy.x + enemy.size * 0.4, enemy.y - enemy.size * 0.35, enemy.size * 0.1, enemy.size * 0.1);
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
                // Removed the auto-spawn code that creates a powerup when none exist
                
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

            function drawAlienHeads() {
                for (let alien of alienHeads) {
                    // Head outer glow
                    p.fill(0, 255, 0, 80 + p.sin(p.frameCount * 0.2) * 30);
                    p.ellipse(alien.x, alien.y, alien.size * 1.2, alien.size * 1.2);
                    
                    // Alien head - neon green with pulsing effect
                    p.fill(0, 255, 0, 200 + p.sin(p.frameCount * 0.1 + alien.pulseOffset) * 55);
                    p.ellipse(alien.x, alien.y, alien.size, alien.size * 1.1);
                    
                    // Top of head
                    p.fill(0, 230, 0);
                    p.arc(alien.x, alien.y - alien.size * 0.05, alien.size, alien.size * 0.9, p.PI, 2*p.PI);
                    
                    // Eyes - INCREASED SIZE AND MADE GREY WITH 3D SHADING
                    const eyeSize = alien.size * 0.4;
                    const eyeY = alien.y - alien.size * 0.15;
                    
                    // Eye sockets
                    p.fill(0, 150, 0);
                    p.ellipse(alien.x - alien.size * 0.3, eyeY, eyeSize * 1.3, eyeSize * 1.3);
                    p.ellipse(alien.x + alien.size * 0.3, eyeY, eyeSize * 1.3, eyeSize * 1.3);
                    
                    // 3D Eyes with gradient shading
                    // Outer eye - dark grey
                    p.fill(40);
                    p.ellipse(alien.x - alien.size * 0.3, eyeY, eyeSize, eyeSize);
                    p.ellipse(alien.x + alien.size * 0.3, eyeY, eyeSize, eyeSize);
                    
                    // Mid-eye - medium grey
                    p.fill(80);
                    p.ellipse(alien.x - alien.size * 0.3, eyeY, eyeSize * 0.75, eyeSize * 0.75);
                    p.ellipse(alien.x + alien.size * 0.3, eyeY, eyeSize * 0.75, eyeSize * 0.75);
                    
                    // Inner eye - light grey with slight shine
                    p.fill(120);
                    p.ellipse(alien.x - alien.size * 0.3, eyeY, eyeSize * 0.5, eyeSize * 0.5);
                    p.ellipse(alien.x + alien.size * 0.3, eyeY, eyeSize * 0.5, eyeSize * 0.5);
                    
                    // Eye shine - small white highlight
                    p.fill(200);
                    p.ellipse(alien.x - alien.size * 0.3 - eyeSize * 0.1, eyeY - eyeSize * 0.1, eyeSize * 0.15, eyeSize * 0.15);
                    p.ellipse(alien.x + alien.size * 0.3 - eyeSize * 0.1, eyeY - eyeSize * 0.1, eyeSize * 0.15, eyeSize * 0.15);
                    
                    // Tiny mouth - just a small black line
                    p.fill(0);
                    p.noStroke();
                    p.ellipse(alien.x, alien.y + alien.size * 0.2, alien.size * 0.1, alien.size * 0.03);
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

            // New circle-rectangle collision detection function
            function circleRectangleOverlap(circle, rect) {
                // Find the closest point in the rectangle to the circle
                let closestX = Math.max(rect.left, Math.min(circle.x, rect.right));
                let closestY = Math.max(rect.top, Math.min(circle.y, rect.bottom));
                
                // Calculate the distance between the circle's center and this closest point
                let distanceX = circle.x - closestX;
                let distanceY = circle.y - closestY;
                
                // If the distance is less than the circle's radius, there's a collision
                return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
            }

            function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
                // Calculate area of the triangle
                const areaOrig = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
                
                // Calculate area of 3 triangles made between the point and each corner
                const area1 = Math.abs((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py));
                const area2 = Math.abs((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py));
                const area3 = Math.abs((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py));
                
                // Point is inside if sum of the three areas equals the original area
                return Math.abs(area1 + area2 + area3 - areaOrig) < 0.01;
            }

            function updateGame() {
                if (isGameOver) return;
                
                // Update active powerups timers
                for (let type in activePowerups) {
                    if (activePowerups[type] > 0) {
                        activePowerups[type]--;
                    }
                }
                
                // Auto-spawn new powerups - timer increased from 5 to 15 seconds
                powerupSpawnTimer--;
                if (powerupSpawnTimer <= 0) {
                    const types = ['shield', 'tripleShot', 'speedBoost'];
                    const type = types[Math.floor(p.random(types.length))];
                    createPowerup(type, p.random(100, p.width - 100), -50);
                    console.log("Timer spawned new powerup:", type);
                    powerupSpawnTimer = 900; // Reset to 15 seconds (changed from 300)
                }
                
                // Spawn alien heads
                alienSpawnTimer--;
                if (alienSpawnTimer <= 0) {
                    spawnAlienHead();
                    alienSpawnTimer = p.floor(p.random(120, 300)); // Random time between 2-5 seconds
                }
                
                // Update alien heads
                for (let i = alienHeads.length - 1; i >= 0; i--) {
                    let alien = alienHeads[i];
                    
                    // Update position with randomized movement
                    alien.x += Math.sin(p.frameCount * 0.05 + alien.id) * 3;
                    alien.y += alien.speedY;
                    
                    // Occasionally change Y speed for more unpredictable movement
                    if (p.frameCount % 30 === 0 && p.random() > 0.7) {
                        alien.speedY = p.random(2, 5);
                    }
                    
                    // Check for collision with player
                    let alienCircle = {
                        x: alien.x,
                        y: alien.y,
                        radius: alien.size / 2
                    };
                    
                    let playerHitBox = { 
                        left: playerX - playerWidth/2, 
                        right: playerX + playerWidth/2, 
                        top: playerY, 
                        bottom: playerY + playerHeight 
                    };
                    
                    if (circleRectangleOverlap(alienCircle, playerHitBox)) {
                        // Remove alien
                        alienHeads.splice(i, 1);
                        
                        // Use same explosion as when enemy bullets hit player
                        explosions.push({
                            x: alien.x,
                            y: alien.y,
                            size: 40,
                            frame: 0
                        });
                        
                        // Apply damage if not shielded
                        if (activePowerups.shield <= 0) {
                            playerHitEffect = 30;
                            lives--;
                            
                            if (lives <= 0) {
                                // Create big explosion for player death
                                for (let j = 0; j < 5; j++) {
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
                        
                        continue;
                    }
                    
                    // Remove if offscreen
                    if (alien.y > p.height + 50) {
                        alienHeads.splice(i, 1);
                    }
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
                                default: color = p.color(255, 255, 255); break;
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
                
                // Update bullet-enemy collision
                for (let i = playerBullets.length - 1; i >= 0; i--) {
                    let bullet = playerBullets[i];
                    let bulletBB = { left: bullet.x - 1, right: bullet.x + 1, top: bullet.y - 5, bottom: bullet.y + 5 };
                    
                    // Check for collisions with alien heads
                    for (let j = alienHeads.length - 1; j >= 0; j--) {
                        let alien = alienHeads[j];
                        let alienCircle = {
                            x: alien.x,
                            y: alien.y,
                            radius: alien.size / 2
                        };
                        
                        if (circleRectangleOverlap(alienCircle, bulletBB)) {
                            playerBullets.splice(i, 1);
                            alienHeads.splice(j, 1);
                            
                            // Create alien hit effect
                            createAlienHitEffect(alien.x, alien.y);
                            
                            // Add score
                            score += 15;
                            break;
                        }
                    }
                    
                    // Skip if bullet was already used
                    if (i >= playerBullets.length) continue;
                    
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        let enemy = enemies[j];
                        
                        // Create a circle representation for enemy
                        let enemyCircle = { 
                            x: enemy.x, 
                            y: enemy.y + enemy.size/4,
                            radius: enemy.size * 0.9
                        };
                        
                        // Use circle-rectangle collision detection
                        if (circleRectangleOverlap(enemyCircle, bulletBB)) {
                            playerBullets.splice(i, 1);
                            
                            // Create neon hit effect at impact point
                            createEnemyNeonHitEffect(bullet.x, bullet.y);
                            
                            enemies.splice(j, 1);
                            score += 10;
                            
                            // Create neon hit effect at enemy center
                            createEnemyNeonHitEffect(enemy.x, enemy.y);
                            
                            break;
                        }
                    }
                }
                
                // Updated player collision with enemy bullets
                // Main ship body collision
                let playerMainBB = { 
                    left: playerX - playerWidth/2, 
                    right: playerX + playerWidth/2, 
                    top: playerY, 
                    bottom: playerY + playerHeight 
                };
            
                for (let i = enemyBullets.length - 1; i >= 0; i--) {
                    let bullet = enemyBullets[i];
                    let bulletBB = { 
                        left: bullet.x - 5,
                        right: bullet.x + 5, 
                        top: bullet.y - 5, 
                        bottom: bullet.y + 5 
                    };
                    
                    // Check for collision with player
                    let mainBodyHit = rectanglesOverlap(bulletBB, playerMainBB);
                    let leftWingHit = pointInTriangle(bullet.x, bullet.y, playerX - playerWidth/4, playerY + playerHeight/2, playerX - playerWidth*1.2, playerY + playerHeight*0.7, playerX - playerWidth/2, playerY + playerHeight*0.9);
                    let rightWingHit = pointInTriangle(bullet.x, bullet.y, playerX + playerWidth/4, playerY + playerHeight/2, playerX + playerWidth*1.2, playerY + playerHeight*0.7, playerX + playerWidth/2, playerY + playerHeight*0.9);
                    
                    // If any part of the ship is hit
                    if (mainBodyHit || leftWingHit || rightWingHit) {
                        enemyBullets.splice(i, 1);
                        
                        // Create hit explosion - this is what we need to match for alien collisions
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
                    
                    // Alien hit special effect
                    if (exp.type === 'alien') {
                        p.push();
                        p.translate(exp.x, exp.y);
                        p.rotate(p.radians(exp.rotation + exp.frame * 3));
                        
                        // Green psychic waves - hexagon shape that expands and fades
                        p.noFill();
                        p.strokeWeight(2); // Thinner stroke
                        p.stroke(0, 255, 100, 200 - exp.frame * 10); // Fades faster
                        
                        let radius = exp.size * (1 + exp.frame/10);
                        p.beginShape();
                        for (let j = 0; j < 6; j++) {
                            let angle = j * p.TWO_PI / 6;
                            let px = Math.cos(angle) * radius;
                            let py = Math.sin(angle) * radius;
                            p.vertex(px, py);
                        }
                        p.endShape(p.CLOSE);
                        
                        p.pop();
                        
                        // Update frame
                        exp.frame++;
                        
                        // Remove old explosions - shorter duration
                        if (exp.frame > 20) {
                            explosions.splice(i, 1);
                        }
                    }
                    // Neon enemy hit effect - new type
                    else if (exp.type === 'neonEnemyHit') {
                        // Pulsing neon plasma effect
                        p.noStroke();
                        
                        // Outer glow - bright pink/purple neon
                        let alpha = 150 - exp.frame * 7;
                        p.fill(255, 50, 255, alpha);
                        let pulseSize = exp.size * (1 + exp.frame/8) + Math.sin(exp.frame * 0.3 + exp.pulseOffset) * 3;
                        p.ellipse(exp.x, exp.y, pulseSize, pulseSize);
                        
                        // Inner core - brighter
                        p.fill(255, 150, 255, alpha + 50);
                        p.ellipse(exp.x, exp.y, pulseSize * 0.6, pulseSize * 0.6);
                        
                        // Electric arcs - small lines radiating outward
                        if (exp.frame < 10) {
                            p.stroke(255, 200, 255, alpha + 50);
                            p.strokeWeight(1);
                            for (let j = 0; j < 5; j++) {
                                let angle = p.random(0, p.TWO_PI);
                                let len = p.random(5, 15);
                                p.line(
                                    exp.x, exp.y,
                                    exp.x + Math.cos(angle) * len,
                                    exp.y + Math.sin(angle) * len
                                );
                            }
                        }
                        
                        // Update frame
                        exp.frame++;
                        
                        // Remove when faded
                        if (exp.frame > 20) {
                            explosions.splice(i, 1);
                        }
                    }
                    // Alien particle effect
                    else if (exp.type === 'alienParticle') {
                        // Update position
                        exp.x += exp.vx;
                        exp.y += exp.vy;
                        
                        // Slow down particles
                        exp.vx *= 0.95;
                        exp.vy *= 0.95;
                        
                        // Draw particle
                        p.noStroke();
                        let alpha = 255 * (exp.life / exp.maxLife);
                        p.fill(0, 255, 0, alpha);
                        p.ellipse(exp.x, exp.y, exp.size * (exp.life / exp.maxLife), exp.size * (exp.life / exp.maxLife));
                        
                        // Inner glow
                        p.fill(100, 255, 100, alpha * 0.7);
                        p.ellipse(exp.x, exp.y, exp.size * 0.6 * (exp.life / exp.maxLife), exp.size * 0.6 * (exp.life / exp.maxLife));
                        
                        // Update life
                        exp.life--;
                        
                        // Remove dead particles
                        if (exp.life <= 0) {
                            explosions.splice(i, 1);
                        }
                    }
                    // Neon enemy particle effect - new type
                    else if (exp.type === 'neonEnemyParticle') {
                        // Update position
                        exp.x += exp.vx;
                        exp.y += exp.vy;
                        
                        // Slow down particles
                        exp.vx *= 0.95;
                        exp.vy *= 0.95;
                        
                        // Draw particle - bright pink/purple neon
                        p.noStroke();
                        let alpha = 255 * (exp.life / exp.maxLife);
                        p.fill(255, 100, 255, alpha);
                        p.ellipse(exp.x, exp.y, exp.size * (exp.life / exp.maxLife), exp.size * (exp.life / exp.maxLife));
                        
                        // Inner bright core
                        p.fill(255, 200, 255, alpha * 0.8);
                        p.ellipse(exp.x, exp.y, exp.size * 0.5 * (exp.life / exp.maxLife), exp.size * 0.5 * (exp.life / exp.maxLife));
                        
                        // Update life
                        exp.life--;
                        
                        // Remove dead particles
                        if (exp.life <= 0) {
                            explosions.splice(i, 1);
                        }
                    }
                    // Regular explosion
                    else {
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

            function spawnAlienHead() {
                alienHeads.push({
                    id: p.random(1000), // For unique movement patterns
                    x: p.random(100, p.width - 100),
                    y: -50,
                    size: p.random(40, 60),
                    speedY: p.random(2, 4),
                    pulseOffset: p.random(0, 10)
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
            
            function createAlienHitEffect(x, y) {
                // Create unique alien hit effect - green psychic waves - SMALLER SIZE
                for (let i = 0; i < 2; i++) { // Reduced from 3 to 2 waves
                    let size = 25 + i * 10; // Smaller size (was 40 + i * 20)
                    
                    explosions.push({
                        x: x,
                        y: y,
                        size: size,
                        frame: 0,
                        type: 'alien',
                        rotation: p.random(0, 360)
                    });
                }
                
                // Green particles flying outward - FEWER & SMALLER
                for (let i = 0; i < 10; i++) { // Reduced from 20 to 10 particles
                    let angle = p.random(0, p.TWO_PI);
                    let speed = p.random(1, 4); // Slower particles
                    let life = p.random(15, 25); // Shorter life
                    
                    explosions.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: p.random(3, 8), // Smaller size
                        frame: 0,
                        type: 'alienParticle',
                        life: life,
                        maxLife: life
                    });
                }
            }

            // New function for neon enemy hit effect
            function createEnemyNeonHitEffect(x, y) {
                // Neon plasma pulse effect
                for (let i = 0; i < 2; i++) {
                    explosions.push({
                        x: x,
                        y: y,
                        size: 15 + i * 10, // Small size
                        frame: 0,
                        type: 'neonEnemyHit',
                        pulseOffset: p.random(0, 10)
                    });
                }
                
                // Few neon particles
                for (let i = 0; i < 8; i++) {
                    let angle = p.random(0, p.TWO_PI);
                    let speed = p.random(1, 3);
                    let life = p.random(10, 20);
                    
                    explosions.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: p.random(2, 6),
                        frame: 0,
                        type: 'neonEnemyParticle',
                        life: life,
                        maxLife: life
                    });
                }
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

    return <div ref={sketchRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
};

export default GameBackground;