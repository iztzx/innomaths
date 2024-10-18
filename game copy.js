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
let bossQuestionIndex = 0;
let magicTracking = false;
let smallMushroomSpeed = 2;
const totalWaves = 10;
let currentQuestion, currentBossQuestion;
const magicMinHeight = 20; // Minimum height for magic projectile
let targetBoss = false; // Flag to determine the target

// -------------------- Question Generation Functions --------------------

function generateQuestion(type = null) {
    const types = ['factors', 'zeros', 'roots'];
    type = type || types[Math.floor(Math.random() * types.length)];
    let question, correctAnswer, answerFormat;
    
    const generateNonZeroRandom = (min, max) => {
        let num;
        do {
            num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (num === 0);
        return num;
    };

    switch (type) {
        case 'factors':
            const root1 = generateNonZeroRandom(-5, 5);
            const root2 = generateNonZeroRandom(-5, 5);
            const b = -(root1 + root2);
            const c = root1 * root2;
            question = `Find the factors of: x² ${b !== 0 ? (b > 0 ? '+' : '') + b + 'x' : ''} ${c >= 0 ? '+' : ''}${c}`;
            correctAnswer = [`(x${-root1 >= 0 ? '+' : ''}${-root1})`, `(x${-root2 >= 0 ? '+' : ''}${-root2})`];
            answerFormat = "Enter factors in the format: (x+a) or (x-a)";
            break;
        case 'zeros':
            const zero1 = generateNonZeroRandom(-5, 5);
            const zero2 = generateNonZeroRandom(-5, 5);
            const sumZeros = -(zero1 + zero2);
            const productZeros = zero1 * zero2;
            question = `Find the zeros of: x²${sumZeros !== 0 ? ' ' + (sumZeros > 0 ? '+' : '') + sumZeros + 'x' : ''}${productZeros !== 0 ? ' ' + (productZeros > 0 ? '+' : '') + productZeros : ''}`;
            correctAnswer = [zero1, zero2].sort((a, b) => a - b);
            answerFormat = "Enter zeros as integers (e.g., 3)";
            break;
        case 'roots':
            const coeff = generateNonZeroRandom(1, 5);
            const root = generateNonZeroRandom(-5, 5);
            const adjustedConstant = -coeff * root;
            question = `Find the root of: ${coeff}x ${adjustedConstant >= 0 ? '+' : ''}${adjustedConstant} = 0`;
            correctAnswer = [root];
            answerFormat = "Enter the root as an integer (e.g., -2)";
            break;
    }
    return { question, correctAnswer, answerFormat, type };
}

function generateBossQuestions() {
    return ['factors', 'zeros', 'roots'].map(type => generateQuestion(type));
}



function displayBossQuestions() {
    currentBossQuestions = generateBossQuestions();
    currentBossQuestions.forEach((q, index) => {
        const questionElement = document.getElementById(`boss-question-${index + 1}`);
        questionElement.querySelector(`#boss-question-text-${index + 1}`).textContent = q.question;
        
        const answer1Input = questionElement.querySelector(`#boss-answer-${index + 1}-1`);
        const answer2Input = questionElement.querySelector(`#boss-answer-${index + 1}-2`);
        
        answer1Input.value = '';
        answer2Input.value = '';
        
        // Update placeholders based on question type
        if (q.type === 'zeros') {
            answer1Input.placeholder = "Zero 1";
            answer2Input.placeholder = "Zero 2";
            answer2Input.style.display = 'inline';
        } else if (q.type === 'roots') {
            answer1Input.placeholder = "Root";
            answer2Input.style.display = 'none';
        } else if (q.type === 'factors') {
            answer1Input.placeholder = "(x+a)";
            answer2Input.placeholder = "(x-a)";
            answer2Input.style.display = 'inline';
        }
        
        questionElement.querySelector(`#boss-answer-${index + 1}-feedback`).textContent = '';
    });
}

function checkBossAnswer(index, answer1, answer2) {
    const q = currentBossQuestions[index];
    switch (q.type) {
        case 'factors':
            // Normalize the answers to handle (x) and (x+0) cases
            const normalizeFactorAnswer = (answer) => {
                answer = answer.replace(/\s/g, ''); // Remove all whitespace
                if (answer === '(x)') return '(x+0)';
                return answer;
            };
            const normalizedAnswer1 = normalizeFactorAnswer(answer1);
            const normalizedAnswer2 = normalizeFactorAnswer(answer2);
            const normalizedCorrect1 = normalizeFactorAnswer(q.correctAnswer[0]);
            const normalizedCorrect2 = normalizeFactorAnswer(q.correctAnswer[1]);
            
            return (normalizedAnswer1 === normalizedCorrect1 && normalizedAnswer2 === normalizedCorrect2) ||
                   (normalizedAnswer1 === normalizedCorrect2 && normalizedAnswer2 === normalizedCorrect1);
        case 'zeros':
            const userZeros = [parseInt(answer1), parseInt(answer2)].sort((a, b) => a - b);
            return userZeros.join(',') === q.correctAnswer.join(',');
        case 'roots':
            return parseInt(answer1) === q.correctAnswer[0];
    }
    return false;
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
        mushroom.remove(); // Ensure the mushroom is removed
        spawnNewMushroom();
    } else {
        mushroom.style.left = mushroomPosition - mushroomSpeed + 'px';
    }
}





// -------------------- Magic Projectile Functions --------------------

function moveMagic() {
    const magic = document.getElementById("magic");
    let target;

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

    if (magicPosition >= targetPosition - 50 && Math.abs(magicBottom - targetBottom) < 50) {
        magic.style.display = 'none';
        magic.style.left = '70px';
        magic.style.bottom = '35px';
        magicMoving = false;
        magicTracking = false;

        if (bossPhase) {
            if (targetBoss) {
                hitBoss();
            } else {
                target.remove();
                smallMushrooms--;
            }
        } else {
            target.remove();
            waveCount++;
            updateBossArrival(); // Ensure the arrival bar updates here

            if (waveCount >= totalWaves) {
                startBossPhase();
            } else {
                spawnNewMushroom();
            }
            updateQuestion();
        }
    } else {
        magic.style.left = magicPosition + magicSpeed + 'px';
        let newBottom = magicBottom;
        if (magicBottom < targetBottom) {
            newBottom += magicSpeed;
        } else if (magicBottom > targetBottom && magicBottom > magicMinHeight) {
            newBottom -= magicSpeed;
        }
        magic.style.bottom = Math.max(newBottom, magicMinHeight) + 'px';
    }
}



// -------------------- Boss Phase Functions --------------------
function updateBossArrival() {
    const remainingWaves = totalWaves - waveCount;
    const arrivalText = document.getElementById("arrival-text");
    const arrivalBar = document.getElementById("arrival-bar");
    
    arrivalText.textContent = `Boss arriving in ${remainingWaves} mushrooms`;
    
    // Update progress bar width based on remaining waves
    const progressPercentage = (waveCount / totalWaves) * 100;
    arrivalBar.style.width = `${100 - progressPercentage}%`;

    // Hide the arrival message and bar when the boss arrives
    if (remainingWaves <= 0) {
        document.getElementById("boss-arrival").style.display = 'none';
    }
}

function startBossPhase() {
    bossPhase = true;
    bossHealth = 5;
    updateBossHealth();
    
    document.getElementById("regular-phase").classList.add('hidden');
    document.getElementById("boss-phase").classList.remove('hidden');
    document.getElementById("boss-arrival").style.display = 'none'; // Hide the boss arrival bar

    const boss = document.createElement('div');
    boss.classList.add('boss');
    const gameLane = document.querySelector('.game-lane');
    gameLane.appendChild(boss);
    
    currentBossQuestions = generateBossQuestions();
    bossQuestionIndex = 0;
    displayBossQuestions();
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

    if (bossHealth <= 0) {
        defeatBoss();
    } else {
        currentBossQuestions = generateBossQuestions();
        displayBossQuestions();
    }
}




function defeatBoss() {
    const boss = document.querySelector('.boss');
    if (boss) boss.remove();
    
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
    
    makeMushroomJump(smallMushroom);
    
    smallMushrooms++;
    
    // Add event listener for tap to zap
    smallMushroom.addEventListener('click', function() {
        zapMushroom(smallMushroom);
    });
}

function moveSmallMushrooms() {
    const mushrooms = document.querySelectorAll('.small-mushroom');
    mushrooms.forEach(mushroom => {
        let mushroomPosition = mushroom.offsetLeft;
        
        if (mushroomPosition <= 70) {
            hitWizard();
            mushroom.remove();
            smallMushrooms--;
        } else {
            mushroom.style.left = mushroomPosition - smallMushroomSpeed + 'px';
        }
    });
}

function zapMushroom(mushroom) {
    smallMushrooms--;
    if (!magicMoving) {
        document.getElementById("magic").style.display = 'block';
        magicMoving = true;
        magicTracking = true;
        targetBoss = false;
    }
}

// -------------------- Wizard Functions --------------------

function hitWizard() {
    wizardHealth -= 1;
    updateWizardHearts();
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
    waveCount = 0   ;
    bossPhase = false;
    bossHealth = 5;
    smallMushrooms = 0;

    document.getElementById("boss-phase").classList.add('hidden');
    document.getElementById("regular-phase").classList.remove('hidden');
    document.getElementById("boss-arrival").style.display = 'block'; // Ensure the boss arrival bar is visible at the start
    
    updateWizardHearts();
    document.getElementById("game-over").classList.add('hidden');
    updateQuestion();
    updateBossArrival();
    spawnNewMushroom();
    startGameLoops();
}

function gameOver() {
    document.getElementById("game-over").classList.remove('hidden');
    document.getElementById("game-over-text").textContent = 'Game Over!';
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

function updateQuestion() {
    currentQuestion = generateQuestion();
    document.getElementById("question").textContent = currentQuestion.question;
    document.getElementById("answer-format").textContent = currentQuestion.answerFormat;
}

// -------------------- Event Listeners --------------------

document.addEventListener('DOMContentLoaded', (event) => {
    const gameTitle = document.getElementById("game-title");
    gameTitle.addEventListener("click", function () {
        window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
    });

    document.getElementById("submitAnswer").addEventListener("click", function () {
        const playerAnswer1 = document.getElementById("answer1").value.trim();
        const playerAnswer2 = document.getElementById("answer2").value.trim();
        
        let correct = false;
        
        switch (currentQuestion.type) {
            case 'factors':
                correct = (playerAnswer1 === currentQuestion.correctAnswer[0] && playerAnswer2 === currentQuestion.correctAnswer[1]) ||
                          (playerAnswer1 === currentQuestion.correctAnswer[1] && playerAnswer2 === currentQuestion.correctAnswer[0]);
                break;
            case 'zeros':
                const playerZeros = [playerAnswer1, playerAnswer2].sort().join(',');
                correct = playerZeros === currentQuestion.correctAnswer;
                break;
            case 'roots':
                correct = playerAnswer1 == currentQuestion.correctAnswer[0] || playerAnswer2 == currentQuestion.correctAnswer[0];
                break;
        }
        
        if (correct) {
            if (!magicMoving) {
                document.getElementById("magic").style.display = 'block';
                magicMoving = true;
                magicTracking = true;
            }
        }
        document.getElementById("answer1").value = '';
        document.getElementById("answer2").value = '';
    });
    
    document.getElementById("boss-submit").addEventListener("click", function () {
        let allCorrect = true;
        currentBossQuestions.forEach((q, index) => {
            const answer1 = document.getElementById(`boss-answer-${index + 1}-1`).value.trim();
            const answer2 = document.getElementById(`boss-answer-${index + 1}-2`).value.trim();
            const feedbackElement = document.getElementById(`boss-answer-${index + 1}-feedback`);
            
            if (checkBossAnswer(index, answer1, answer2)) {
                feedbackElement.textContent = 'Correct!';
                feedbackElement.style.color = 'green';
            } else {
                allCorrect = false;
                feedbackElement.textContent = 'Incorrect. Try again.';
                feedbackElement.style.color = 'red';
                document.getElementById(`boss-answer-${index + 1}-1`).value = '';
                document.getElementById(`boss-answer-${index + 1}-2`).value = '';
            }
        });
    
        if (allCorrect) {
            if (!magicMoving) {
                document.getElementById("magic").style.display = 'block';
                magicMoving = true;
                magicTracking = true;
                targetBoss = true;
            }
            currentBossQuestions = generateBossQuestions();
            displayBossQuestions();
        }
    });
       

    document.getElementById("restart").addEventListener("click", startGame);

    // Start the game when the page loads
    startGame();
});
