// chain.js

// Constants
const WORD_DATA_FILE = 'word_differences.json';
const MAX_CHAIN_LENGTH = 20;
const MIN_MOVES_THRESHOLD = 5;
const MAX_MOVES_THRESHOLD = 6;

// Utility Functions
const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const hasNoSimilarLetters = (word1, word2) =>
    !word1.split('').some(letter => word2.includes(letter));

const isOneLetterDifferent = (word1, word2) =>
    word1.length === word2.length &&
    word1.split('').filter((char, i) => char !== word2[i]).length === 1;

const saveToLocalStorage = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));

const loadFromLocalStorage = (key) =>
    JSON.parse(localStorage.getItem(key)) || null;

// Data Loading
const loadWordData = (filePath, callback) => {
    fetch(filePath)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Error loading word data:', error));
};

// Game Initialization
const initializeGame = (wordData) => {
    const lastPlayed = localStorage.getItem('LastPlayed');
    const today = getTodayDateString();

    if (lastPlayed === today) {
        loadExistingGame(wordData);
    } else {
        startNewGame(wordData);
    }
};

const loadExistingGame = (wordData) => {
    const startingWord = localStorage.getItem('startingWord');
    const targetWord = localStorage.getItem('targetWord');
    const guesses = loadFromLocalStorage('guesses') || [startingWord];

    displayChain(wordData, guesses, targetWord);

    if (guesses[guesses.length - 1] === targetWord) {
        endGame(wordData);
    } else {
        calculateMinMoves(wordData, startingWord, targetWord);
    }
};

const startNewGame = (wordData) => {
    const today = new Date();
    const baseSeed = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
    let seedIncrement = 0;
    let path, minMoves;

    do {
        const seed = parseInt(baseSeed + seedIncrement, 10);
        const startingWord = getRandomWord(wordData, seed);
        path = findPath(wordData, startingWord);

        if (path) {
            const targetWord = path[path.length - 1];
            minMoves = calculateMinMoves(wordData, startingWord, targetWord);

            if (minMoves >= MIN_MOVES_THRESHOLD && minMoves < MAX_MOVES_THRESHOLD) {
                saveGameData(startingWord, targetWord, [startingWord]);
                displayChain(wordData, [startingWord], targetWord);
                break;
            }
        }

        seedIncrement++;
    } while (true);
};

const saveGameData = (startingWord, targetWord, guesses) => {
    saveToLocalStorage('startingWord', startingWord);
    saveToLocalStorage('targetWord', targetWord);
    saveToLocalStorage('guesses', guesses);
    localStorage.setItem('LastPlayed', getTodayDateString());
};

// Word Selection
const getRandomWord = (words, seed) => {
    const keys = Object.keys(words);
    const randomIndex = Math.floor(seededRandom(seed) * keys.length);
    return keys[randomIndex];
};

// Path Finding
const findPath = (words, startingWord) => {
    let path = [startingWord];
    let currentWord = startingWord;
    let visited = new Set([startingWord]);

    while (path.length <= MAX_CHAIN_LENGTH) {
        let foundNext = false;

        for (const nextWord of words[currentWord]) {
            if (!visited.has(nextWord)) {
                if (hasNoSimilarLetters(startingWord, nextWord)) {
                    path.push(nextWord);
                    saveToLocalStorage('guesses', path);
                    return path;
                } else {
                    visited.add(nextWord);
                    path.push(nextWord);
                    currentWord = nextWord;
                    foundNext = true;
                    break;
                }
            }
        }

        if (!foundNext) {
            path.pop();
            if (path.length === 0) return null;
            currentWord = path[path.length - 1];
        }
    }

    saveToLocalStorage('guesses', path);
    return path;
};

// Minimum Moves Calculation
const calculateMinMoves = (words, startingWord, targetWord) => {
    let queue = [[targetWord, 0]];
    let visited = new Set([targetWord]);

    while (queue.length > 0) {
        const [currentWord, depth] = queue.shift();

        if (currentWord === startingWord) {
            return depth;
        }

        for (const nextWord of words[currentWord]) {
            if (!visited.has(nextWord) && isOneLetterDifferent(currentWord, nextWord)) {
                visited.add(nextWord);
                queue.push([nextWord, depth + 1]);
            }
        }
    }

    return Infinity;
};

// Display Functions
const displayChain = (wordData, guesses, targetWord) => {
    const chainDiv = document.getElementById('chainDisplay');
    chainDiv.innerHTML = '';

    guesses.forEach((guess, index) => {
        const isCurrentWord = index === guesses.length - 1;
        const previousWord = guesses[index - 1] || '';
        const wordElement = createWordElement(wordData, guess, targetWord, isCurrentWord, previousWord);
        chainDiv.appendChild(wordElement);
    });

    if (guesses[guesses.length - 1] !== targetWord) {
        const targetElement = createWordElement(wordData, targetWord, targetWord);
        chainDiv.appendChild(targetElement);
    }

    animateChainDisplay(chainDiv);
};

const createWordElement = (wordData, word, targetWord, isCurrentWord = false, previousWord = '') => {
    const wordDiv = document.createElement('div');
    wordDiv.className = 'word';
    if (isCurrentWord) wordDiv.classList.add('current');

    const moves = calculateMinMoves(wordData, word, targetWord);
    const { color, shadow } = getColorBasedOnMoves(moves);

    word.split('').forEach((letter, index) => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'letter';
        letterDiv.textContent = letter;
        letterDiv.dataset.index = index;

        if (targetWord[index] === letter) {
            letterDiv.classList.add('correct');
        }

        letterDiv.style.backgroundColor = color;

        if (previousWord && previousWord[index] && previousWord[index] !== letter) {
            letterDiv.classList.add('changed');
        }

        if (isCurrentWord) {
            letterDiv.addEventListener('click', () => selectLetter(letterDiv, wordDiv));
            letterDiv.style.boxShadow = `${shadow} 5px 5px 0px 0px, ${shadow} 3px 3px 0px 0px, ${shadow} 1px 1px 0px 0px`;
        }

        wordDiv.appendChild(letterDiv);
    });

    return wordDiv;
};

const animateChainDisplay = (chainDiv) => {
    const currentWordDiv = chainDiv.querySelector('.word.current');
    const lastWordDiv = chainDiv.querySelector('.word:last-child');

    if (currentWordDiv) currentWordDiv.classList.add('slideDown');
    if (lastWordDiv && lastWordDiv !== currentWordDiv) lastWordDiv.classList.add('slideDown');

    setTimeout(() => {
        if (currentWordDiv) currentWordDiv.classList.remove('slideDown');
        if (lastWordDiv && lastWordDiv !== currentWordDiv) lastWordDiv.classList.remove('slideDown');
    }, 200);

    chainDiv.scrollTo({ top: chainDiv.scrollHeight, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
};

// Letter Selection and Input Handling
const selectLetter = (letterDiv, wordDiv) => {
    wordDiv.querySelectorAll('.letter').forEach(div => div.classList.remove('selected'));
    letterDiv.classList.add('selected');
};

const handleLetterChange = (event) => {
    const selectedLetter = document.querySelector('.letter.selected');
    if (!selectedLetter) {
        hintSelectLetter();
        return;
    }

    const newLetter = event.key ? event.key.toLowerCase() : event.toLowerCase();

    if (newLetter.length === 1 && /[a-z]/.test(newLetter)) {
        const wordDiv = selectedLetter.closest('.word');
        const wordArray = Array.from(wordDiv.querySelectorAll('.letter')).map(div => div.textContent);
        const index = selectedLetter.dataset.index;

        wordArray[index] = newLetter;
        const newWord = wordArray.join('');

        loadWordData(WORD_DATA_FILE, (wordData) => {
            const guesses = loadFromLocalStorage('guesses');
            const currentWord = guesses[guesses.length - 1];

            if (wordData[newWord] && isOneLetterDifferent(currentWord, newWord)) {
                submitGuess(wordData, newWord);
            } else {
                triggerShakeAnimation(selectedLetter);
            }
        });
    }

    selectedLetter.classList.add('selected');
};

const hintSelectLetter = () => {
    const currentWordContainer = document.querySelector('.word.current');
    if (currentWordContainer) {
        const letters = currentWordContainer.querySelectorAll('.letter');
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.add('hint');
                setTimeout(() => {
                    letter.classList.remove('hint');
                }, 200);
            }, index * 100);
        });
    }
};

const triggerShakeAnimation = (element) => {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
};

// Guess Submission
const submitGuess = (wordData, userGuess) => {
    const guesses = loadFromLocalStorage('guesses');
    const currentWord = guesses[guesses.length - 1];
    const targetWord = localStorage.getItem('targetWord');

    if (userGuess && wordData[userGuess] && isOneLetterDifferent(currentWord, userGuess)) {
        guesses.push(userGuess);
        saveToLocalStorage('guesses', guesses);
        displayChain(wordData, guesses, targetWord);

        if (userGuess === targetWord) {
            endGame(wordData);
        }
    } else {
        console.error('Invalid guess:', userGuess);
    }
};

// Game Completion
const endGame = (wordData) => {
    burstConfetti();
    disableLetterSelection();
    showWinModal(wordData);
    addFinishedClass('customKeyboard');
    addFinishedClass('chainDisplay');
    addShareResultsButton();
};

const disableLetterSelection = () => {
    document.querySelectorAll('.letter.selected').forEach(letter => letter.classList.remove('selected'));
    document.querySelectorAll('.letter').forEach(letter => {
        const newLetter = letter.cloneNode(true);
        letter.replaceWith(newLetter);
    });
};

const addFinishedClass = (elementId) => {
    document.getElementById(elementId).classList.add('finished');
};

// Color Management
const getColorBasedOnMoves = (moves) => {
    const colorMapping = {
        0: 'var(--color-0)',
        1: 'var(--color-1)',
        2: 'var(--color-2)',
        3: 'var(--color-3)',
        4: 'var(--color-4)',
        5: 'var(--color-5)',
        6: 'var(--color-6)',
        7: 'var(--color-7)',
        8: 'var(--color-8)',
        9: 'var(--color-9)',
    };

    const shadowMapping = {
        0: 'var(--shadow-0)',
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
        4: 'var(--shadow-4)',
        5: 'var(--shadow-5)',
        6: 'var(--shadow-6)',
        7: 'var(--shadow-7)',
        8: 'var(--shadow-8)',
        9: 'var(--shadow-9)',
    };

    const clampedMoves = Math.min(moves, 9);
    return { color: colorMapping[clampedMoves], shadow: shadowMapping[clampedMoves] };
};

// Modals and UI Elements
const showWinModal = (wordData) => {
    const modal = document.getElementById('winModal');
    const scoreMessage = document.getElementById('scoreMessage');
    const shareButton = document.getElementById('shareButton');
    const closeModalButton = document.getElementById('closeModalButton');

    const guesses = loadFromLocalStorage('guesses');
    const minMoves = calculateMinMoves(wordData, guesses[0], localStorage.getItem('targetWord'));
    const playerScore = guesses.length - 1;

    scoreMessage.textContent = `Final score:\n${playerScore} out of ${minMoves}.`;

    shareButton.onclick = () => shareResults(playerScore, minMoves);
    closeModalButton.onclick = () => (modal.style.display = 'none');

    modal.style.display = 'flex';
};

const showHelpModal = () => {
    const modal = document.getElementById('helpModal');
    const closeModalButton = document.getElementById('closeHelpModalButton');

    closeModalButton.onclick = () => (modal.style.display = 'none');
    modal.style.display = 'flex';
};

const addShareResultsButton = () => {
    const container = document.getElementById('shareResultsContainer');
    container.innerHTML = '';

    const shareButton = document.createElement('button');
    shareButton.id = 'shareResultsButton';
    shareButton.textContent = 'Share your results';
    shareButton.onclick = () => {
        const modal = document.getElementById('winModal');
        modal.style.display = 'flex';
    };

    container.appendChild(shareButton);
};

const shareResults = (playerScore, minMoves) => {
    const shareText = `I completed WordChains in ${playerScore}/${minMoves}!\nWordChains.xyz`;
    if (navigator.share) {
        navigator.share({
            title: 'WordChains Game',
            text: shareText,
            url: window.location.href,
        })
        .then(() => console.log('Thanks for sharing!'))
        .catch(console.error);
    } else {
        alert('Sharing is not supported in this browser. Copy the link manually!');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', handleLetterChange);
    loadWordData(WORD_DATA_FILE, initializeGame);

    document.getElementById('customKeyboard').addEventListener('click', (event) => {
        const clickedKey = event.target.textContent.trim();
        if (clickedKey.length === 1 && /[a-zA-Z]/.test(clickedKey)) {
            handleLetterChange(clickedKey.toLowerCase());
        }
    });

    document.getElementById('helpButton').onclick = showHelpModal;

    window.onclick = (event) => {
        const winModal = document.getElementById('winModal');
        const helpModal = document.getElementById('helpModal');
        if (event.target === winModal) winModal.style.display = 'none';
        if (event.target === helpModal) helpModal.style.display = 'none';
    };

    document.addEventListener('click', (event) => {
        const currentWordElement = document.querySelector('.word.current');
        const selectedLetter = document.querySelector('.letter.selected');
        if (currentWordElement && selectedLetter && !currentWordElement.contains(event.target)) {
            selectedLetter.classList.remove('selected');
            const lastWord = document.querySelector('#chainDisplay .word:last-child');
            if (lastWord) lastWord.classList.remove('shift-down');
        }
    });
});
