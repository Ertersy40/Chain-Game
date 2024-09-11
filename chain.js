// localStorage.setItem('guesses', '["carp"]')
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

function findAndDisplayPath(wordData) {
    // Generate a seed based on today's date
    const today = new Date();
    const baseSeed = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;

    let startingWord, path, minMoves, seedIncrement = 0;

    do {
        const seed = parseInt(baseSeed + seedIncrement, 10);; // Increment seed slightly each iteration
        startingWord = getRandomWord(wordData, seed);
        path = findPath(wordData, startingWord);

        if (path) {
            const targetWord = path[path.length - 1];
            minMoves = calculateMinMoves(wordData, startingWord, targetWord);
        }

        seedIncrement++; // Increment to try a different seed in case of failure
    } while (!path || minMoves < 5 || minMoves >= 6); // Ensure that only words with more than 5 minimum moves apart are chosen

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
            // console.log('Ideal path:', path.reverse().join(' -> ')); // Log the ideal path
            return depth; // Return the minimum depth when starting word is found
        }

        for (let nextWord of words[currentWord]) {
            if (!visited.has(nextWord) && isOneLetterDifferent(currentWord, nextWord)) {
                visited.add(nextWord);
                queue.push([nextWord, depth + 1, [...path, nextWord]]);
            }
        }
    }

    return Infinity; // If no path is found (should not happen in a valid game)
}

function initializeGame(wordData) {
    const lastPlayed = localStorage.getItem('LastPlayed');
    const today = getTodayDateString();
    if (lastPlayed === today) {
        // If the game was already played today, load from localStorage
        const startingWord = localStorage.getItem('startingWord');
        const targetWord = localStorage.getItem('targetWord');
        const guesses = JSON.parse(localStorage.getItem('guesses')) || [startingWord];
        
        displayChain(wordData, guesses, targetWord); // Display the chain
        
        // Check if the game was won
        if (guesses[guesses.length - 1] === targetWord) {
            endGame(wordData);
        } else {
            calculateMinMoves(wordData, startingWord, targetWord);
        }
    } else {
        // If the game hasn't been played today, run findAndDisplayPath
        findAndDisplayPath(wordData);
        
    }
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

    const moves = calculateMinMoves(wordData, word, targetWord); // Calculate moves from current word to target word
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
        console.log(previousWord, index, letter)
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



// function displayWord(wordData, word, targetWord, isCurrentWord = false) {
//     const wordDivContainer = document.createElement('div');
//     wordDivContainer.className = 'word';
//     if (isCurrentWord) {
//         wordDivContainer.classList.add('current');
//     }

//     const moves = calculateMinMoves(wordData, word, targetWord); // Calculate moves from current word to target word
//     const color = getColorBasedOnMoves(moves); // Get the color based on moves

//     word.split('').forEach((letter, index) => {
//         const letterDiv = document.createElement('div');
//         letterDiv.className = 'letter';
//         letterDiv.textContent = letter;
//         letterDiv.dataset.index = index;

//         // Add green class if the letter is correct and in the correct position
//         if (targetWord[index] === letter) {
//             letterDiv.classList.add('correct');
//         }

//         letterDiv.style.backgroundColor = color; // Apply the color based on moves

//         if (isCurrentWord) {
//             letterDiv.addEventListener('click', () => selectLetter(letterDiv, wordDivContainer));
//         }

//         wordDivContainer.appendChild(letterDiv);
//     });

//     return wordDivContainer;
// }


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

    // console.log("adding input event listener to letterdiv", letterDiv)
    document.addEventListener('keydown', handleLetterChange);
}

document.getElementById('customKeyboard').addEventListener('click', function(event) {
    const clickedKey = event.target.textContent.trim();

    if (clickedKey.length === 1 && /[a-zA-Z]/.test(clickedKey)) {
        handleLetterChange(clickedKey.toLowerCase());
    }
});



function handleLetterChange(event) {
    // console.log("LETTER CHANGEEE")
    const selectedLetter = document.querySelector('.letter.selected');
    if (!selectedLetter) {
        // console.log('no selected letter?')
        return
    };
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

function submitGuess(wordData, userGuess = null) {

    // console.log('clogclef')
    // calculateMinMoves(wordData, "clog", "clef")
    // console.log('clogclef')

    userGuess = userGuess || document.getElementById('userGuess').value.trim().toLowerCase();
    const guesses = loadGuesses();
    const currentWord = guesses.length > 0 ? guesses[guesses.length - 1] : localStorage.getItem('startingWord');
    const targetWord = localStorage.getItem('targetWord');

    if (userGuess && wordData[userGuess] && isOneLetterDifferent(currentWord, userGuess)) {
        guesses.push(userGuess);
        saveGuesses(guesses);

        displayChain(wordData, guesses, targetWord); // Update the chain display

        if (userGuess === targetWord) {
            endGame(wordData);
        }
    } else {
        // console.log(currentWord);
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


function endGame(wordData) {
    burstConfetti(); 

    // Deselect all letters
    document.querySelectorAll('.letter.selected').forEach(letter => letter.classList.remove('selected'));

    // Remove click event listeners to disable further selection
    document.querySelectorAll('.letter').forEach(letter => {
        letter.replaceWith(letter.cloneNode(true)); // Cloning removes all event listeners
    });

    // Show the win modal
    const guesses = loadGuesses();
    const minMoves = calculateMinMoves(wordData, guesses[0], localStorage.getItem('targetWord'));
    const playerScore = guesses.length - 1;
    showWinModal(playerScore, minMoves);

    addFinishClass('customKeyboard')
    addFinishClass('chainDisplay')

    // Add "Share your results" button to the bottom of the page
    addShareResultsButton();
}

function addFinishClass(name) {
    document.getElementById(name).classList.add('finished')
}

function showWinModal(playerScore, minMoves) {
    const modal = document.getElementById('winModal');
    const scoreMessage = document.getElementById('scoreMessage');
    const shareButton = document.getElementById('shareButton');
    const closeModalButton = document.getElementById('closeModalButton');

    scoreMessage.textContent = `Final score:\n${playerScore} out of ${minMoves}.`;

    // Share button functionality
    shareButton.onclick = function() {
        const shareText = `I completed WordChains in ${playerScore}/${minMoves}!\nWordChains.xyz`;
        if (navigator.share) {
            navigator.share({
                title: 'Word Game',
                text: shareText,
                url: window.location.href
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
    loadWordData('word_differences.json', initializeGame);
});

