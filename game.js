// Game state variables
let mushroomHealth = 3;
let wizardHealth = 3;
let magicMoving = false;
let magicSpeed = 3;
let mushroomSpeed = 1;
let jumpInterval;
let waveCount = 0;
let bossPhase = false;
let bossHealth = 5;
let smallMushrooms = 0;
let magicTracking = false;
let smallMushroomSpeed = 2;
const totalWaves = 10;
let currentQuestion, currentBossQuestion, currentSmallMushroomQuestion;
const magicMinHeight = 20; // Minimum height for magic projectile
let targetBoss = false; // Flag to determine the target

// -------------------- Question Generation Functions --------------------

function generateQuestion() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*', '/'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let question, correctAnswer;

    switch (operation) {
        case '+':
            question = `${num1} + ${num2}`;
            correctAnswer = num1 + num2;
            break;
        case '-':
            question = `${num1} - ${num2}`;
            correctAnswer = num1 - num2;
            break;
        case '*':
            question = `${num1} * ${num2}`;
            correctAnswer = num1 * num2;
            break;
        case '/':
            let divisionNum1 = num1 * num2;
            question = `${divisionNum1} / ${num2}`;
            correctAnswer = divisionNum1 / num2;
            break;
    }
    return { question, correctAnswer: correctAnswer.toString() };
}

function generateBossQuestion() {
    let root1, root2;
    let a, b, c;

    do {
        root1 = Math.floor(Math.random() * 21) - 10;
        root2 = Math.floor(Math.random() * 21) - 10;
        a = 1;
        b = -(root1 + root2);
        c = root1 * root2;
    } while (b === 0 || c === 0);

    const question = `Solve for x: x² ${b > 0 ? '+' : ''}${b}x ${c > 0 ? '+' : ''}${c} = 0`;
    
    let correctAnswer;
    if (root1 === root2) {
        correctAnswer = root1.toString();
    } else {
        [root1, root2] = [root1, root2].sort((a, b) => a - b);
        correctAnswer = `${root1},${root2}`;
    }

    return { question, correctAnswer };
}

function generateSmallMushroomQuestion() {
    return generateQuestion(); // Reuse the simple math question generator
}

// -------------------- Mushroom Functions --------------------

function spawnNewMushroom() {
    const gameLane = document.querySelector('.game-lane');
    const mushroom = document.createElement('div');
    mushroom.classList.add('mushroom');
    mushroom.style.left = '500px';
    gameLane.appendChild(mushroom);
    makeMushroomJump(mushroom);
}

function makeMushroomJump(mushroom) {
    let isJumping = false;
    let position = 0;

    function jump() {
        if (isJumping) return;
        isJumping = true;

        let upInterval = setInterval(() => {
            if (position >= 50) {
                clearInterval(upInterval);
                let downInterval = setInterval(() => {
                    if (position <= 0) {
                        clearInterval(downInterval);
                        isJumping = false;
                    } else {
                        position -= 5;
                        mushroom.style.bottom = position + 'px';
                    }
                }, 20);
            } else {
                position += 5;
                mushroom.style.bottom = position + 'px';
            }
        }, 20);
    }

    return setInterval(jump, 1000);
}

function moveMushroom() {
    const mushroom = document.querySelector('.mushroom:not(.small-mushroom)');
    if (!mushroom) return;

    let mushroomPosition = mushroom.offsetLeft;
    
    if (mushroomPosition <= 70) {
        hitWizard();
        mushroom.remove();
        spawnNewMushroom();
    } else {
        mushroom.style.left = mushroomPosition - mushroomSpeed + 'px';
    }
}

// -------------------- Magic Projectile Functions --------------------

function moveMagic() {
    const magic = document.getElementById("magic");
    let target;

    // Determine the target based on the targetBoss flag and game phase
    if (bossPhase) {
        target = targetBoss ? document.querySelector(".boss") : document.querySelector(".small-mushroom");
    } else {
        target = document.querySelector(".mushroom:not(.small-mushroom)");
    }

    if (!magic || !target) return;

    let magicPosition = magic.offsetLeft;
    let targetPosition = target.offsetLeft;
    let magicBottom = parseInt(window.getComputedStyle(magic).bottom);
    let targetBottom = parseInt(window.getComputedStyle(target).bottom);

    // Debugging output
    console.log(`Magic Position: ${magicPosition}, Target Position: ${targetPosition}`);

    // Move magic towards the determined target
    if (magicPosition >= targetPosition - 50 && Math.abs(magicBottom - targetBottom) < 50) {
        magic.style.display = 'none';
        magic.style.left = '70px';
        magic.style.bottom = '35px';
        magicMoving = false;
        magicTracking = false;

        if (bossPhase) {
            if (targetBoss) {
                hitBoss(); // Hit the boss
            } else {
                target.remove(); // Hit the small mushroom
                smallMushrooms--;
                currentSmallMushroomQuestion = generateSmallMushroomQuestion(); // Generate new question
                updateSmallMushroomQuestion(); // Update question after hitting a small mushroom
            }
        } else {
            target.remove(); // Hit the regular mushroom
            waveCount++;
            if (waveCount >= totalWaves) {
                startBossPhase(); // Transition to boss phase
            } else {
                spawnNewMushroom(); // Spawn new mushroom
            }
            currentQuestion = generateQuestion(); // Prepare new question
            document.getElementById("question").textContent = `What is ${currentQuestion.question}?`;
        }
    } else {
        // Move the magic projectile towards the target
        magic.style.left = magicPosition + magicSpeed + 'px'; // Update magic position
        let newBottom = magicBottom;
        if (magicBottom < targetBottom) {
            newBottom += magicSpeed;
        } else if (magicBottom > targetBottom && magicBottom > magicMinHeight) {
            newBottom -= magicSpeed;
        }
        magic.style.bottom = Math.max(newBottom, magicMinHeight) + 'px'; // Update magic bottom position
    }
}


// -------------------- Boss Phase Functions --------------------

function startBossPhase() {
    bossPhase = true;
    bossHealth = 5;
    updateBossHealth();
    
    // Hide the regular question container
    document.getElementById("regular-phase").classList.add('hidden');
    
    // Show the boss phase container
    document.getElementById("boss-phase").classList.remove('hidden');
    const boss = document.createElement('div');
    boss.classList.add('boss');
    const gameLane = document.querySelector('.game-lane');
    gameLane.appendChild(boss);
    
    currentBossQuestion = generateBossQuestion();
    document.getElementById("boss-question").textContent = currentBossQuestion.question;
    
    currentSmallMushroomQuestion = generateSmallMushroomQuestion();
    updateSmallMushroomQuestion();
}

function updateBossHealth() {
    const healthBar = document.getElementById("boss-health-fill");
    const healthText = document.getElementById("boss-health-text");
    
    const healthPercentage = (bossHealth / 5) * 100;
    healthBar.style.width = `${healthPercentage}%`;
    healthText.textContent = `Boss Health: ${bossHealth}/5`;
}

function hitBoss() {
    bossHealth--;
    updateBossHealth();

    // Generate a new boss question after hitting the boss
    currentBossQuestion = generateBossQuestion();
    document.getElementById("boss-question").textContent = currentBossQuestion.question;

    if (bossHealth <= 0) {
        defeatBoss();
    }
}

function defeatBoss() {
    const boss = document.querySelector('.boss');
    if (boss) boss.remove();
    
    // Remove all small mushrooms
    const smallMushrooms = document.querySelectorAll('.small-mushroom');
    smallMushrooms.forEach(mushroom => mushroom.remove());
    
    document.getElementById("game-over").classList.remove('hidden');
    document.getElementById("game-over-text").textContent = 'Congratulations, You Win!';
    stopGameLoops();
}

function spawnSmallMushroom() {
    if (!bossPhase || bossHealth <= 0 || smallMushrooms >= 3) return;
    
    const smallMushroom = document.createElement('div');
    smallMushroom.classList.add('mushroom', 'small-mushroom');
    smallMushroom.style.left = '500px';
    document.querySelector('.game-lane').appendChild(smallMushroom);
    
    // Make small mushroom jump
    makeMushroomJump(smallMushroom);
    
    smallMushrooms++;
    updateSmallMushroomQuestion();
}

function moveSmallMushrooms() {
    const mushrooms = document.querySelectorAll('.small-mushroom');
    mushrooms.forEach(mushroom => {
        let mushroomPosition = mushroom.offsetLeft;
        
        if (mushroomPosition <= 70) {
            hitWizard();
            mushroom.remove();
            smallMushrooms--;
            updateSmallMushroomQuestion();
        } else{
            mushroom.style.left = mushroomPosition - smallMushroomSpeed + 'px';
        }
    });
}

function updateSmallMushroomQuestion() {
    if (!currentSmallMushroomQuestion) {
        currentSmallMushroomQuestion = generateSmallMushroomQuestion();
    }
    document.getElementById("small-mushroom-question").textContent = `Small Mushroom: ${currentSmallMushroomQuestion.question}`;
}


function checkBossHealth() {
    if (bossHealth <= 0) {
        document.querySelector('.boss').remove();
        document.getElementById("game-over").classList.remove('hidden');
        document.getElementById("game-over").innerHTML = 'Congratulations, You Win!';
        stopGameLoops();
    }
}

// -------------------- Wizard Functions --------------------

function hitWizard() {
    wizardHealth -= 1;
    updateWizardHearts();

    const hitSound = document.getElementById("hit-sound");
    hitSound.play();

    const wizard = document.getElementById("wizard");
    wizard.classList.add("flash");

    setTimeout(() => {
        wizard.classList.remove("flash");
    }, 1000);

    if (wizardHealth <= 0) {
        gameOver();
    }
}

function updateWizardHearts() {
    const heartsDisplay = document.getElementById("wizard-hearts");
    heartsDisplay.innerHTML = '❤️'.repeat(wizardHealth);
}

// -------------------- Game Control Functions --------------------


function startGame() {
    removeAllMushrooms();
    mushroomHealth = 3;
    wizardHealth = 3;
    waveCount = 0;
    bossPhase = false;
    bossHealth = 5;
    smallMushrooms = 0;

    // Make sure the boss phase container is hidden
    document.getElementById("boss-phase").classList.add('hidden');
    document.getElementById("regular-phase").classList.remove('hidden');
    
    updateWizardHearts();
    document.getElementById("game-over").classList.add('hidden');

    currentQuestion = generateQuestion();
    document.getElementById("question").textContent = `What is ${currentQuestion.question}?`;
    
    spawnNewMushroom();
    startGameLoops();
}



function gameOver() {
    document.getElementById("game-over").classList.remove('hidden');
    stopGameLoops();
}

function removeAllMushrooms() {
    const mushrooms = document.querySelectorAll('.mushroom, .boss');
    mushrooms.forEach(mushroom => mushroom.remove());
}

// Game loop intervals
let magicInterval, mushroomInterval, smallMushroomSpawnInterval;

function startGameLoops() {
    magicInterval = setInterval(function () {
        if (magicTracking) {
            moveMagic();
        }
    }, 30);

    mushroomInterval = setInterval(function () {
        if (!bossPhase) {
            moveMushroom();
        } else {
            moveSmallMushrooms();
        }
    }, 30);

    smallMushroomSpawnInterval = setInterval(function () {
        if (bossPhase && smallMushrooms < 3) {
            spawnSmallMushroom();
        }
    }, 5000);
}

function stopGameLoops() {
    clearInterval(magicInterval);
    clearInterval(mushroomInterval);
    clearInterval(smallMushroomSpawnInterval);
    clearInterval(jumpInterval);
}

// -------------------- Event Listeners --------------------

const gameTitle = document.getElementById("game-title");
gameTitle.addEventListener("click", function () {
    window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
});

document.getElementById("submitAnswer").addEventListener("click", function () {
    const playerAnswer = document.getElementById("answer").value;
    if (playerAnswer == currentQuestion.correctAnswer) {
        if (!magicMoving) {
            document.getElementById("magic").style.display = 'block';
            magicMoving = true;
            magicTracking = true;
        }
    }
    document.getElementById("answer").value = '';
});

document.getElementById("boss-submit").addEventListener("click", function () {
    const playerAnswer = document.getElementById("boss-answer").value.trim();
    const correctAnswerParts = currentBossQuestion.correctAnswer.split(',').map(Number).sort((a, b) => a - b);
    const playerAnswerParts = playerAnswer.split(',').map(Number).sort((a, b) => a - b);

    if (correctAnswerParts.length === playerAnswerParts.length && correctAnswerParts.every((val, index) => val === playerAnswerParts[index])) {
        if (!magicMoving) {
            document.getElementById("magic").style.display = 'block';
            magicMoving = true;
            magicTracking = true;
            targetBoss = true; // Set target to boss
        }
    }
    document.getElementById("boss-answer").value = '';
});


document.getElementById("small-mushroom-submit").addEventListener("click", function () {
    const playerAnswer = document.getElementById("small-mushroom-answer").value.trim();
    if (playerAnswer == currentSmallMushroomQuestion.correctAnswer) {
        if (!magicMoving) {
            document.getElementById("magic").style.display = 'block';
            magicMoving = true;
            magicTracking = true;
            targetBoss = false; // Set target to small mushroom
        }
    }
    document.getElementById("small-mushroom-answer").value = '';
});

document.getElementById("restart").addEventListener("click", startGame);

// Start the game when the page loads
window.addEventListener('load', startGame);
