const cards = document.querySelectorAll('.memory-card');
const timerDisplay = document.getElementById('timer');
const movesDisplay = document.getElementById('moves');
const gameResult = document.getElementById('gameResult');
const resultMessage = document.getElementById('resultMessage');
const claimPrizeButton = document.getElementById('claimPrize');
const chooseProductButton = document.getElementById('chooseProduct');
const playAgainButton = document.getElementById('playAgain');
const winnerForm = document.getElementById('winnerForm');
const winnerDataForm = document.getElementById('winnerDataForm');
const winnerPhoneInput = document.getElementById('winnerPhone');
const winnerNameInput = document.getElementById('winnerName');
const winnerEmailInput = document.getElementById('winnerEmail');
const nameError = document.getElementById('nameError');
const phoneError = document.getElementById('phoneError');
const emailError = document.getElementById('emailError');
const flipSound = document.getElementById('flipSound');
const matchSound = document.getElementById('matchSound');
const winSound = document.getElementById('winSound');
const loseSound = document.getElementById('loseSound');

let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let moves = 0;
let matches = 0;
const maxMoves = 125;
let timeLeft = 300;
let timerId;

// Phone mask function
function formatPhoneNumber(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Brazilian phone number validation (11 digits, mobile with 9 after area code)
function isValidBRPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    const mobileRegex = /^[1-9]{2}9[0-9]{8}$/; // e.g., 11987654321
    return digits.length === 11 && mobileRegex.test(digits);
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Apply phone mask
winnerPhoneInput.addEventListener('input', (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
});

winnerPhoneInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        e.target.value = formatPhoneNumber(e.target.value);
    }, 0);
});

function startTimer() {
    timerId = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `Tempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (timeLeft <= 0) endGame('O tempo acabou! Você perdeu.');
    }, 1000);
}

function flipCard() {
    if (lockBoard || moves >= maxMoves || timeLeft <= 0) return;
    if (this === firstCard) return;

    this.classList.add('flip');
    flipSound.play();

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        if (moves === 0) startTimer();
        return;
    }

    secondCard = this;
    moves++;
    movesDisplay.textContent = `Jogadas: ${moves}/${maxMoves}`;
    checkForMatch();

    if (moves >= maxMoves) endGame('Você atingiu o limite de 125 jogadas! Você perdeu.');
}

function checkForMatch() {
    let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;
    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    matchSound.play();
    matches++;
    if (matches === 6) endGame('Parabéns! Você venceu!'); // Alterado para 6 matches
    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 1500);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function generatePrizeCode() {
    return `CS${new Date().getFullYear()}WIN${Math.random().toString(36).slice(-4).toUpperCase()}`;
}

function endGame(message) {
    clearInterval(timerId);
    lockBoard = true;
    resultMessage.textContent = message;

    gameResult.style.display = 'flex';
    gameResult.classList.add('show');

    if (message.includes('venceu')) {
        winSound.play();
        playAgainButton.style.display = 'none';
        claimPrizeButton.style.display = 'inline-block';
        chooseProductButton.style.display = 'none';

        claimPrizeButton.onclick = () => {
            gameResult.classList.remove('show');
            setTimeout(() => {
                gameResult.style.display = 'none';
                winnerForm.style.display = 'flex';
                winnerForm.classList.add('show');
            }, 500);

            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        };

        winnerDataForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = winnerNameInput.value.trim();
            const phone = winnerPhoneInput.value;
            const email = winnerEmailInput.value.trim();
            const prizeCode = generatePrizeCode();

            // Reset error messages
            nameError.textContent = '';
            phoneError.textContent = '';
            emailError.textContent = '';

            let isValid = true;

            // Validate name
            if (name.length < 2) {
                nameError.textContent = 'Nome deve ter pelo menos 2 caracteres.';
                isValid = false;
            }

            // Validate Brazilian phone
            if (!isValidBRPhone(phone)) {
                phoneError.textContent = 'Número inválido. Use o formato (XX) 9XXXX-XXXX.';
                isValid = false;
            }

            // Validate email
            if (!isValidEmail(email)) {
                emailError.textContent = 'E-mail inválido.';
                isValid = false;
            }

            if (!isValid) return;

            // Format timestamp in Brazilian style (e.g., "01/03/2025 12:00:00")
            const timestamp = new Date().toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'America/Sao_Paulo' // Use Brazilian timezone
            });

            const winnerData = {
                name,
                phone,
                email,
                prizeCode,
                timestamp // Now in Brazilian format
            };

            try {
                await window.db.collection('pascoaparatodos').add(winnerData);

                winnerForm.classList.remove('show');
                setTimeout(() => {
                    winnerForm.style.display = 'none';
                    gameResult.style.display = 'flex';
                    gameResult.classList.add('show');
                    resultMessage.textContent = `Parabéns, ${name}! Você ganhou 80% de desconto! Seu código: ${prizeCode}`;
                    claimPrizeButton.style.display = 'none';
                    chooseProductButton.style.display = 'inline-block';
                }, 500);
            } catch (error) {
                console.error('Error:', error);
                emailError.textContent = 'Erro ao salvar dados. Tente novamente.';
            }
        };

        chooseProductButton.onclick = () => {
            window.location.href = '/loja/';
        };
    } else {
        loseSound.play();
        claimPrizeButton.style.display = 'none';
        chooseProductButton.style.display = 'none';
        playAgainButton.style.display = 'inline-block';
    }

    playAgainButton.onclick = () => resetGame();
}

function resetGame() {
    gameResult.classList.remove('show');
    setTimeout(() => {
        gameResult.style.display = 'none';
        moves = 0;
        matches = 0;
        timeLeft = 300;
        hasFlippedCard = false;
        lockBoard = false;
        firstCard = null;
        secondCard = null;
        movesDisplay.textContent = `Jogadas: ${moves}/${maxMoves}`;
        timerDisplay.textContent = `Tempo: 05:00`;
        cards.forEach(card => {
            card.classList.remove('flip');
            card.addEventListener('click', flipCard);
            let randomPos = Math.floor(Math.random() * cards.length);
            card.style.order = randomPos;
        });
    }, 500);
}

function shuffle() {
    cards.forEach(card => {
        let randomPos = Math.floor(Math.random() * cards.length);
        card.style.order = randomPos;
    });
}

// Initialize game
console.log('Initializing game...');
shuffle();
cards.forEach(card => card.addEventListener('click', flipCard));