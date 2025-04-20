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
                playerHitEffect = 0;
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
                
                // Thruster glow effect (animated)
                p.fill(255, 0, 255, 100 + p.sin(p.frameCount * 0.2) * 50); // Neon pink
                p.ellipse(playerX, playerY + playerHeight + 15, 30 + p.sin(p.frameCount * 0.3) * 10, 20);
                
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

            function drawUI() {
                p.fill(255);
                p.textSize(16);
                p.textAlign(p.LEFT);
                p.text("Score: " + score, 10, 20);
                p.text("Lives: " + lives, 10, 40);
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
                if (moveLeft) playerX -= 7;
                if (moveRight) playerX += 7;
                playerX = p.constrain(playerX, playerWidth / 2, p.width - playerWidth / 2);
                if (shoot && shootCooldown <= 0) {
                    playerBullets.push({ x: playerX, y: playerY - 15, speed: -15 });
                    shootCooldown = 10;
                }
                if (shootCooldown > 0) shootCooldown--;
            }

            function updateGame() {
                if (isGameOver) return;
                
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
                let playerBB = { left: playerX - playerWidth / 2, right: playerX + playerWidth / 2, top: playerY - 15, bottom: playerY + playerHeight + 5 };
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