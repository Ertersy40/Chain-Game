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
    console.log(seed)
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
    } while (!path || minMoves <= 5); // Ensure that only words with more than 5 minimum moves apart are chosen

    const targetWord = path[path.length - 1];

    localStorage.setItem('startingWord', startingWord);
    localStorage.setItem('targetWord', targetWord);
    localStorage.setItem('guesses', JSON.stringify([startingWord])); // Start with the starting word
    localStorage.setItem('LastPlayed', getTodayDateString()); // Store today's date

    displayChain([startingWord], targetWord); // Display the initial chain
}

function calculateMinMoves(words, startingWord, targetWord) {
    let queue = [[targetWord, 0, [targetWord]]]; // Queue of [word, depth, path]
    let visited = new Set([targetWord]);

    while (queue.length > 0) {
        let [currentWord, depth, path] = queue.shift();

        if (currentWord === startingWord) {
            console.log('Ideal path:', path.reverse().join(' -> ')); // Log the ideal path
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
        console.log("PLAYED TODAY")
        // If the game was already played today, load from localStorage
        const startingWord = localStorage.getItem('startingWord');
        const targetWord = localStorage.getItem('targetWord');
        const guesses = JSON.parse(localStorage.getItem('guesses')) || [startingWord];

        displayChain(guesses, targetWord); // Display the chain
        const minMoves = calculateMinMoves(wordData, startingWord, targetWord);
    } else {
        console.log("NEW GAME")
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

function displayChain(guesses, targetWord) {
    const chainDiv = document.getElementById('chainDisplay');
    chainDiv.innerHTML = ''; // Clear previous content

    // Display each word in the guesses list
    guesses.slice(0, guesses.length - 1).forEach(guess => {
        const guessDivContainer = displayWord(guess, targetWord);
        chainDiv.appendChild(guessDivContainer);
    });

    // Display the current word as the current word
    const guessDivContainer = displayWord(guesses[guesses.length - 1], targetWord, true);
    chainDiv.appendChild(guessDivContainer);

    if (guesses[guesses.length - 1] !== targetWord) {
        // If the target word isn't guessed (the game hasn't finished) display the target word
        const targetDivContainer = displayWord(targetWord, targetWord);
        chainDiv.appendChild(targetDivContainer);
    }

    chainDiv.scrollTo({
        top: chainDiv.scrollHeight,
        behavior: 'smooth' // This makes the scroll smooth
    });
    document.body.scrollTo({
        top: document.body.scrollHeight -216,
        behavior: 'smooth' // This makes the scroll smooth
    });
}

function displayWord(word, targetWord, isCurrentWord = false) {
    const wordDivContainer = document.createElement('div');
    wordDivContainer.className = 'word';
    if (isCurrentWord) {
        wordDivContainer.classList.add('current');
    }

    word.split('').forEach((letter, index) => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'letter';
        letterDiv.textContent = letter;
        letterDiv.dataset.index = index;

        // Add green class if the letter is correct and in the correct position
        if (targetWord[index] === letter) {
            letterDiv.classList.add('correct');
        }

        if (isCurrentWord) {
            letterDiv.addEventListener('click', () => selectLetter(letterDiv, wordDivContainer));
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
    }
});

// Modify selectLetter to keep the input focus within the current word
function selectLetter(letterDiv, wordDivContainer) {
    // Remove 'selected' class from all letters in the current word
    wordDivContainer.querySelectorAll('.letter').forEach(div => div.classList.remove('selected'));
    
    // Add 'selected' class to the clicked letter
    letterDiv.classList.add('selected');

    // Create an invisible input field for mobile keyboard
    let input = document.getElementById('hiddenInput');
    if (!input) {
        input = document.createElement('input');
        input.type = 'text';
        input.id = 'hiddenInput';
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.height = '0';
        input.style.width = '0';
        document.body.appendChild(input);
    }

    // Focus on the hidden input to pull up the keyboard on mobile
    input.focus();

    // Add an event listener for typing a new letter
    input.addEventListener('input', handleLetterChange);
}


function handleLetterChange(event) {
    const selectedLetter = document.querySelector('.letter.selected');
    if (!selectedLetter) {
        console.log('no selected letter?')
        return
    };

    const newLetter = event.target.value.toLowerCase();
    event.target.value = '';  // Clear the input field for the next entry

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
            const currentWord = guesses[guesses.length - 1];
            if (wordData[newWord] && isOneLetterDifferent(currentWord, newWord)) {
                submitGuess(wordData, newWord); // Submit the guess if valid
            } else {
                // If the word is invalid, trigger the shake and fade animation
                selectedLetter.classList.add('shake', 'fade-red');
                
                setTimeout(() => {
                    selectedLetter.classList.remove('shake', 'fade-red');
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

        displayChain(guesses, targetWord); // Update the chain display

        if (userGuess === targetWord) {
            endGame(wordData);
        }
    } else {
        console.log(currentWord);
    }
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

    // Add "Share your results" button to the bottom of the page
    addShareResultsButton();
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
    modal.style.display = 'block';
}

function addShareResultsButton() {
    const container = document.getElementById('shareResultsContainer');
    container.innerHTML = ''; // Clear any previous button

    const shareButton = document.createElement('button');
    shareButton.id = 'shareResultsButton';
    shareButton.textContent = 'Share your results';
    shareButton.onclick = function() {
        const modal = document.getElementById('winModal');
        modal.style.display = 'block'; // Open the win modal when the button is clicked
    };

    container.appendChild(shareButton);
}

// Close the modal if the user clicks anywhere outside of it
window.onclick = function(event) {
    const modal = document.getElementById('winModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadWordData('word_differences.json', initializeGame);
});
