const MAX_GUESSES = {"1": 6, "2": 7, "3": 8, "4": 9, "5": 10};
let gameOver = false; // Track if the game is over


function loadWordData(filePath, callback) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Error loading word data:', error));
}

function getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function seededRandom(seed) {
    // console.log(seed)
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getRandomWord(words, seed) {
    const keys = Object.keys(words);
    const randomIndex = Math.floor(seededRandom(seed) * keys.length);
    return keys[randomIndex];
}

function hasNoSimilarLetters(word1, word2) {
    return !word1.split('').some(letter => word2.includes(letter));
}

function isOneLetterDifferent(word1, word2) {
    return word1.length === word2.length && 
           word1.split('').filter((char, i) => char !== word2[i]).length === 1;
}

function findPath(words, startingWord, maxLength = 20) {
    let path = [startingWord];
    let currentWord = startingWord;
    let visited = new Set([startingWord]);

    while (path.length <= maxLength) {
        let foundNext = false;
        for (let nextWord of words[currentWord]) {
            if (!visited.has(nextWord)) {
                if (hasNoSimilarLetters(startingWord, nextWord)) {
                    path.push(nextWord);
                    saveGuesses(path);
                    return path; // Return the path found
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
            if (path.length === 0) {
                return null;
            }
            currentWord = path[path.length - 1];
        }
    }

    saveGuesses(path);
    return path; // Return the path found
}

function findAndDisplayPath(wordData, minGuesses=5) {
    // Generate a seed based on today's date
    const today = new Date();
    const baseSeed = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}${minGuesses}`;

    let startingWord, path, minMoves, seedIncrement = 0;

    do {
        const seed = parseInt(baseSeed + seedIncrement, 10);; // Increment seed slightly each iteration
        startingWord = getRandomWord(wordData, seed);
        path = findPath(wordData, startingWord);

        if (path) {
            const targetWord = path[path.length - 1];
            minMoves = calculateMinMoves(wordData, startingWord, targetWord).depth;
        }

        seedIncrement++; // Increment to try a different seed in case of failure
    } while (!path || minMoves < minGuesses || minMoves >= minGuesses + 1); // Ensure that only words with more than 5 minimum moves apart are chosen

    const targetWord = path[path.length - 1];

    localStorage.setItem('startingWord', startingWord);
    localStorage.setItem('targetWord', targetWord);
    localStorage.setItem('guesses', JSON.stringify([startingWord])); // Start with the starting word
    localStorage.setItem('LastPlayed', getTodayDateString()); // Store today's date

    displayChain(wordData, [startingWord], targetWord); // Display the initial chain
}

function calculateMinMoves(words, startingWord, targetWord) {
    let queue = [[targetWord, 0, [targetWord]]]; // Queue of [word, depth, path]
    let visited = new Set([targetWord]);

    while (queue.length > 0) {
        let [currentWord, depth, path] = queue.shift();

        if (currentWord === startingWord) {
            // console.log(path.reverse())
            return { depth, path: path }; // Return the minimum depth and ideal path
        }

        for (let nextWord of words[currentWord]) {
            if (!visited.has(nextWord) && isOneLetterDifferent(currentWord, nextWord)) {
                visited.add(nextWord);
                queue.push([nextWord, depth + 1, [...path, nextWord]]);
            }
        }
    }

    return { depth: Infinity, path: [] }; // Return Infinity and an empty path if no valid path found
}


function initializeGame(wordData) {
    const helpShown = localStorage.getItem('HelpShown');
    if (!helpShown) {
        showHelpModal();
        localStorage.setItem('HelpShown', 'true');
    }

    const lastPlayed = localStorage.getItem('LastPlayed');
    const startingWord = localStorage.getItem('startingWord');
    const targetWord = localStorage.getItem('targetWord');
    let level = parseInt(localStorage.getItem('level')) || 1; // Ensure level is a number
    const guesses = JSON.parse(localStorage.getItem('guesses')) || [startingWord];

    const today = getTodayDateString();
    const maxLevel = Object.keys(MAX_GUESSES).length; // Total number of levels

    if (lastPlayed === today && startingWord && targetWord) {
        setLevel(level);

        // Display the chain based on saved progress
        displayChain(wordData, guesses, targetWord);

        // Check for win or loss conditions
        if (guesses[guesses.length - 1] === targetWord) {
            if (level === maxLevel) {
                // Player finished all levels, show end screen
                endGame(wordData, true);
            } else {
                nextLevel(wordData); // Move to next level
            }
        } else if (guesses.length >= MAX_GUESSES[level] + 1) {
            // Player ran out of guesses, show loss screen
            endGame(wordData, false);
        } else {
            // Continue game with the same path
            calculateMinMoves(wordData, startingWord, targetWord);
        }
    } else {
        // Reset to level 1 and start a new game if it's a new day
        if (level > maxLevel) {
            // Player has already finished all levels, show end screen
            endGame(wordData, true);
        } else {
            // Start the first level or resume based on today's date
            setLevel(1);
            findAndDisplayPath(wordData, 3);
        }
    }
}


function setLevel(level) {
    document.getElementById("levelNumDisplay").innerHTML = `level ${level}: `
    localStorage.setItem('level', level)
}

function nextLevel(wordData) {
    const level = localStorage.getItem('level');
    const guesses = loadGuesses();
    updateLevelScores(level, guesses); // Save the guesses for the completed level

    burstConfetti();
    if (!level) {
        localStorage.setItem('level', 1);
    }
    setLevel(parseInt(level) + 1);

    findAndDisplayPath(wordData, parseInt(MAX_GUESSES[parseInt(level) + 1]) - 3);
}

function updateLevelScores(level, guesses) {
    const scores = JSON.parse(localStorage.getItem('levelScores')) || {};
    scores[level] = guesses;
    localStorage.setItem('levelScores', JSON.stringify(scores));
}



function saveGuesses(path) {
    localStorage.setItem('guesses', JSON.stringify(path));
}

function loadGuesses() {
    const guesses = localStorage.getItem('guesses');
    return guesses ? JSON.parse(guesses) : [];
}

function displayChain(wordData, guesses, targetWord) {
    const chainDiv = document.getElementById('chainDisplay');
    chainDiv.innerHTML = ''; // Clear previous content
    const level = localStorage.getItem('level')

    // Display each word in the guesses list
    guesses.slice(0, guesses.length - 1).forEach((guess, guessIndex) => {
        const previousWord = guesses[guessIndex - 1] || ''; // Get the previous word, or empty string if none
        const guessDivContainer = displayWord(wordData, guess, targetWord, false, previousWord);
        chainDiv.appendChild(guessDivContainer);
    });

    // Display the current word as the current word
    const guessDivContainer = displayWord(wordData, guesses[guesses.length - 1], targetWord, true);
    chainDiv.appendChild(guessDivContainer);

    if (guesses[guesses.length - 1] !== targetWord) {
        // Display the target word if the game isn't finished
        const targetDivContainer = displayWord(wordData, targetWord, targetWord);
        chainDiv.appendChild(targetDivContainer);
    }

    // Update guesses remaining display
    const guessesUsedDiv = document.getElementById('guessesUsedDisplay');
    const guessesUsed = guesses.length - 1;
    guessesUsedDiv.textContent = `${guessesUsed}/${MAX_GUESSES[level]}`;

    // Add the slideDown class to the current word and the last word
    const currentWordDiv = chainDiv.querySelector('.word.current');
    const lastWordDiv = chainDiv.querySelector('.word:last-child');

    if (currentWordDiv) {
        currentWordDiv.classList.add('slideDown');
    }
    if (lastWordDiv && lastWordDiv !== currentWordDiv) {
        lastWordDiv.classList.add('slideDown');
    }

    // Remove the slideDown class after the animation is done (0.2 seconds)
    setTimeout(() => {
        if (currentWordDiv) {
            currentWordDiv.classList.remove('slideDown');
        }
        if (lastWordDiv && lastWordDiv !== currentWordDiv) {
            lastWordDiv.classList.remove('slideDown');
        }
    }, 200); // 200ms corresponds to the 0.2s animation duration

    // Smooth scroll to the bottom of the div and body
    chainDiv.scrollTo({
        top: chainDiv.scrollHeight,
        behavior: 'smooth'
    });

    document.body.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function displayWord(wordData, word, targetWord, isCurrentWord = false, previousWord = '') {
    const wordDivContainer = document.createElement('div');
    wordDivContainer.className = 'word';
    if (isCurrentWord) {
        wordDivContainer.classList.add('current');
    }

    const moves = calculateMinMoves(wordData, word, targetWord).depth; // Calculate moves from current word to target word
    const colors = getColorBasedOnMoves(moves); // Get the color based on moves
    const color = colors.color
    const shadow = colors.shadow

    word.split('').forEach((letter, index) => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'letter';
        letterDiv.textContent = letter;
        letterDiv.dataset.index = index;

        // Add green class if the letter is correct and in the correct position
        if (targetWord[index] === letter) {
            letterDiv.classList.add('correct');
        }

        // Apply the color based on moves
        letterDiv.style.backgroundColor = color;
        
        // Add the "changed" class if the letter differs from the previous word
        // console.log(previousWord, index, letter)
        if (previousWord && previousWord[index] && previousWord[index] !== letter) {
            letterDiv.classList.add('changed');
        }
        
        if (isCurrentWord) {
            letterDiv.addEventListener('click', () => selectLetter(letterDiv, wordDivContainer));
            letterDiv.style.boxShadow = `${shadow} 5px 5px 0px 0px, ${shadow} 3px 3px 0px 0px, ${shadow} 1px 1px 0px 0px `
        }

        wordDivContainer.appendChild(letterDiv);
    });

    return wordDivContainer;
}


// Add event listener for clicks outside the word.current
document.addEventListener('click', function(event) {
    const currentWordElement = document.querySelector('.word.current');
    const selectedLetter = document.querySelector('.letter.selected');

    if (currentWordElement && selectedLetter && !currentWordElement.contains(event.target)) {
        // Deselect the letter
        selectedLetter.classList.remove('selected');

        const lastWord = document.querySelector('#chainDisplay .word:last-child');
        lastWord.classList.remove('shift-down');
    }
});

// Modify selectLetter to keep the input focus within the current word
function selectLetter(letterDiv, wordDivContainer) {
    // Remove 'selected' class from all letters in the current word
    wordDivContainer.querySelectorAll('.letter').forEach(div => div.classList.remove('selected'));
    
    // Add 'selected' class to the clicked letter
    letterDiv.classList.add('selected');
}

document.getElementById('customKeyboard').addEventListener('click', function(event) {
    if (gameOver) return;
    const clickedKey = event.target.textContent.trim();

    if (clickedKey.length === 1 && /[a-zA-Z]/.test(clickedKey)) {
        handleLetterChange(clickedKey.toLowerCase());
    }
});



function handleLetterChange(event) {
    if (gameOver) return;
    // console.log("first")
    // console.log("LETTER CHANGEEE")
    const selectedLetter = document.querySelector('.letter.selected');
    if (!selectedLetter) {
        // No letter is selected, add "hint" class to all letters in the current word with a delay
        const currentWordContainer = document.querySelector('.word.current');
        if (currentWordContainer) {
            const letters = currentWordContainer.querySelectorAll('.letter');
            letters.forEach((letter, index) => {
                setTimeout(() => {
                    letter.classList.add('hint');
                    
                    // Remove the "hint" class after a short delay
                    setTimeout(() => {
                        letter.classList.remove('hint');
                    }, 200); // Adjust the duration as needed
    
                }, index * 100); // 0.1s (100ms) delay between each letter
            });
        }
        return;
    }
    
    let newLetter;
    if (event.key){
        newLetter = event.key.toLowerCase();
    } else {
        newLetter = event;
    }

    if (newLetter.length === 1 && /[a-z]/.test(newLetter)) {
        const wordDivContainer = selectedLetter.closest('.word');
        const wordArray = Array.from(wordDivContainer.querySelectorAll('.letter')).map(div => div.textContent);
        const index = selectedLetter.dataset.index;

        // Replace the selected letter with the new one
        wordArray[index] = newLetter;
        const newWord = wordArray.join('');

        // Check if the new word is valid
        loadWordData('word_differences.json', (wordData) => {
            const guesses = loadGuesses();
            // console.log('guesses:', guesses)
            const currentWord = guesses[guesses.length - 1];
            if (wordData[newWord] && isOneLetterDifferent(currentWord, newWord)) {
                submitGuess(wordData, newWord); // Submit the guess if valid
            } else {
                // If the word is invalid, trigger the shake and fade animation
                selectedLetter.classList.add('shake');
                
                setTimeout(() => {
                    selectedLetter.classList.remove('shake');
                }, 500);
            }
        });
    }

    // Keep the letter selected after the animation
    selectedLetter.classList.add('selected');
    // document.getElementById('hiddenInput').removeEventListener('input', handleLetterChange);
}



// function displayMinMoves(minMoves) {
//     const minMovesDiv = document.getElementById('minMovesDisplay');
//     minMovesDiv.textContent = `Minimum possible moves: ${minMoves}`;
// }

    // console.log('clogclef')
    // calculateMinMoves(wordData, "clog", "clef")
    // console.log('clogclef')

function submitGuess(wordData, userGuess = null) {
    userGuess = userGuess || document.getElementById('userGuess').value.trim().toLowerCase();
    const guesses = loadGuesses();
    const currentWord = guesses.length > 0 ? guesses[guesses.length - 1] : localStorage.getItem('startingWord');
    const targetWord = localStorage.getItem('targetWord');
    const level = localStorage.getItem('level');

    if (userGuess && wordData[userGuess] && isOneLetterDifferent(currentWord, userGuess)) {
        guesses.push(userGuess);
        saveGuesses(guesses);

        displayChain(wordData, guesses, targetWord); // Update the chain display

        if (userGuess === targetWord) {
            if (level == Object.keys(MAX_GUESSES)[Object.keys(MAX_GUESSES).length - 1]) {
                endGame(wordData, true); // Player wins
            } else {
                nextLevel(wordData)
            }
        } else if (guesses.length >= MAX_GUESSES[level] + 1) {
            endGame(wordData, false); // Player loses
        }
    } else {
        // Invalid guess handling (optional)
    }
}


function getColorBasedOnMoves(moves) {
    const colorMapping = {
        0: 'var(--color-0)',    // Green
        1: 'var(--color-1)',
        2: 'var(--color-2)',
        3: 'var(--color-3)',
        4: 'var(--color-4)',
        5: 'var(--color-5)',    // Red
        6: 'var(--color-6)',
        7: 'var(--color-7)',
        8: 'var(--color-8)',
        9: 'var(--color-9)',    // Deep Red
    };
    
    const shadowMapping = {
        0: 'var(--shadow-0)',    // Green
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
        4: 'var(--shadow-4)',
        5: 'var(--shadow-5)',    // Red
        6: 'var(--shadow-6)',
        7: 'var(--shadow-7)',
        8: 'var(--shadow-8)',
        9: 'var(--shadow-9)',    // Deep Red
    };
    
    
    const clampedMoves = Math.min(moves, 9); // Clamp moves to a maximum of 9
    return {color: colorMapping[clampedMoves], shadow: shadowMapping[clampedMoves]};
}


function endGame(wordData, won = true) {
    gameOver = true; // Set the game over state

    if (won) {
        const level = localStorage.getItem('level');
        const guesses = loadGuesses();
        updateLevelScores(level, guesses); // Save guesses for the completed level
        burstConfetti();
    }

    // Deselect all letters
    document.querySelectorAll('.letter.selected').forEach(letter => letter.classList.remove('selected'));

    // Disable further selection
    document.querySelectorAll('.letter').forEach(letter => {
        letter.replaceWith(letter.cloneNode(true)); // Cloning removes all event listeners
    });

    const guesses = loadGuesses();
    const startingWord = guesses[0];
    const targetWord = localStorage.getItem('targetWord');

    // Get the ideal path and minimum moves
    const { depth: minMoves, path: idealPath } = calculateMinMoves(wordData, startingWord, targetWord);
    const playerScore = guesses.length - 1;

    // Show the end game modal and pass the ideal path
    showEndGameModal(wordData, playerScore, minMoves, idealPath, won);

    addFinishClass('customKeyboard');
    addFinishClass('chainDisplay');

    // Add "Share your results" button
    addShareResultsButton(won);
}

function displayLevelScores(wordData) {
    const scores = JSON.parse(localStorage.getItem('levelScores')) || {};
    const scoresDiv = document.getElementById('levelScoreParas');
    scoresDiv.innerHTML = ''; // Reset display

    // Define gradient emojis (from red to green)
    const gradientEmojis = [
        '✅', '🟩', '🟨', '🟧', '🟥', '🟦', '🟪', '⬛', '😬'
    ];

    // Define number emojis for levels

    // Iterate through each level's scores
    Object.keys(scores).forEach((level, index) => {
        const guesses = scores[level]; // Get guessed words for this level
        const targetWord = guesses[guesses.length - 1]; // Retrieve target word
        let scoreText = ''; // Use number emoji for the level

        // Generate gradient emojis based on moves
        scoreText += guesses.map(guess => {
            const moves = calculateMinMoves(wordData, guess, targetWord).depth; // Calculate moves to target
            const emojiIndex = Math.min(moves, gradientEmojis.length - 1); // Clamp index to max length
            return gradientEmojis[emojiIndex]; // Display only the emoji
        }).join(' '); // Separate emojis with spaces

        // Add the formatted score to the display
        const levelText = document.createElement('p');
        levelText.textContent = scoreText; // Use the emoji-based score text
        scoresDiv.appendChild(levelText);
    });
}






function addFinishClass(name) {
    document.getElementById(name).classList.add('finished')
}

// This is my wordle game. Right now when you get one word right it just ends and says you won. I want there to be levels where if you get it right, you go to the next level which is more steps away from the target word. If you finish the final level you get the win screen 


function showEndGameModal(wordData, playerScore, minMoves, idealPath, won) {
    const modal = document.getElementById('winModal');
    const scoreMessage = document.getElementById('scoreMessage');
    const shareButton = document.getElementById('shareButton');
    const closeModalButton = document.getElementById('closeModalButton');
    const idealPathContainer = document.getElementById('idealPathContainer');
    const level = localStorage.getItem('level')

    displayLevelScores(wordData);

    // Clear previous ideal path display
    // idealPathContainer.innerHTML = '';

    // Display message
    if (won) {
        modal.querySelector('h2').textContent = 'Congratulations!';
        scoreMessage.textContent = `Final score: ${playerScore} out of ${minMoves}.`;
    } else {
        modal.querySelector('h2').textContent = 'Game Over!';
        scoreMessage.textContent = `You used all ${MAX_GUESSES[level]} guesses.`;
    }

    // Display the ideal path
    // idealPath.forEach((word) => {
    //     const wordDiv = document.createElement('div');
    //     wordDiv.className = 'idealWord';
    //     wordDiv.textContent = word;

    //     // Calculate the color based on the number of moves from this word to the target
    //     const movesToTarget = calculateMinMoves(wordData, word, idealPath[idealPath.length - 1]).depth;
    //     const colors = getColorBasedOnMoves(movesToTarget);
    //     wordDiv.style.backgroundColor = colors.color;

    //     // Append the word div to the container
    //     // idealPathContainer.appendChild(wordDiv);
    // });

    // Share button functionality
    shareButton.onclick = function () {
        // Calculate the day number based on November 20th
        const startDate = new Date(2024, 10, 22); // November 20, 2023 (month is zero-indexed)
        const today = new Date();
        const dayNumber = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1; // Add 1 to make it Day 1
    
        // Load scores
        const scores = JSON.parse(localStorage.getItem('levelScores')) || {};
        const gradientEmojis = [
            '✅', '🟩', '🟨', '🟧', '🟥', '🟦', '🟪', '⬛', '😬'
        ]; // Gradient emojis for progress
    
        // Generate score text with emojis
        let scoreDetails = Object.keys(scores).map((level, index) => {
            const guesses = scores[level];
            const targetWord = guesses[guesses.length - 1];
    
            // Map guesses to gradient emojis
            const emojiScore = guesses.map(guess => {
                const moves = calculateMinMoves(wordData, guess, targetWord).depth;
                const emojiIndex = Math.min(moves, gradientEmojis.length - 1);
                return gradientEmojis[emojiIndex];
            }).join(' '); // Separate emojis with spaces
    
            return `${emojiScore}`; // Combine level number and emojis
        }).join('\n'); // New line for each level
    
        // Final share text
        let shareText;
        if (won) {
            shareText = `🎉 #WordChains${dayNumber}\n\n${scoreDetails}\n\NWordChains.xyz`;
        } else {
            shareText = `😢 #WordChains${dayNumber}\n\n${scoreDetails}\n\nWordChains.xyz`;
        }
    
        // Share logic
        if (navigator.share) {
            navigator.share({
                title: `WordChains - Day ${dayNumber}`,
                text: shareText,
            }).then(() => {
                console.log('Thanks for sharing!');
            }).catch(console.error);
        } else {
            alert('Sharing is not supported in this browser. Copy the link manually!');
        }
    };
    
    

    // Close button functionality
    closeModalButton.onclick = function() {
        modal.style.display = 'none';
    };

    // Display the modal
    modal.style.display = 'flex';
}



function showHelpModal() {
    const modal = document.getElementById('helpModal');
    const closeModalButton = document.getElementById('closeHelpModalButton');

    // Close button functionality
    closeModalButton.onclick = function() {
        modal.style.display = 'none';
    };

    // Display the modal
    modal.style.display = 'flex';
}

function addShareResultsButton() {
    const container = document.getElementById('shareResultsContainer');
    container.innerHTML = ''; // Clear any previous button

    const shareButton = document.createElement('button');
    shareButton.id = 'shareResultsButton';
    shareButton.textContent = 'Share your results';
    shareButton.onclick = function() {
        const modal = document.getElementById('winModal');
        modal.style.display = 'flex'; // Open the win modal when the button is clicked
    };

    container.appendChild(shareButton);
}

// Close the modal if the user clicks anywhere outside of it
window.onclick = function(event) {
    const winModal = document.getElementById('winModal');
    const helpModal = document.getElementById('helpModal')
    if (event.target === winModal || event.target === helpModal) {
        winModal.style.display = 'none';
        helpModal.style.display = 'none';
    }
};

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener('keydown', handleLetterChange);
    loadWordData('word_differences.json', initializeGame);
});