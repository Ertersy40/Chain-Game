function loadWordData(filePath, callback) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Error loading word data:', error));
}

function getRandomWord(words) {
    const keys = Object.keys(words);
    return keys[Math.floor(Math.random() * keys.length)];
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

function calculateMinMoves(words, startingWord, targetWord) {
    let queue = [[targetWord, 0]]; // Queue of [word, depth]
    let visited = new Set([targetWord]);

    while (queue.length > 0) {
        let [currentWord, depth] = queue.shift();

        if (currentWord === startingWord) {
            return depth; // Return the minimum depth when starting word is found
        }

        for (let nextWord of words[currentWord]) {
            if (!visited.has(nextWord) && isOneLetterDifferent(currentWord, nextWord)) {
                visited.add(nextWord);
                queue.push([nextWord, depth + 1]);
            }
        }
    }

    return Infinity; // If no path is found (should not happen in a valid game)
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
    if (!selectedLetter) return;

    const newLetter = event.target.value.toLowerCase();
    event.target.value = '';  // Clear the input field for next entry

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
            }
        });
    }

    // Remove the 'selected' class after typing the new letter
    selectedLetter.classList.remove('selected');
    document.getElementById('hiddenInput').removeEventListener('input', handleLetterChange);
}

function findAndDisplayPath(wordData) {
    let startingWord, path;

    do {
        startingWord = getRandomWord(wordData);
        path = findPath(wordData, startingWord);
    } while (!path || path.length > 20);

    const targetWord = path[path.length - 1];
    
    // Calculate the minimum number of moves using BFS
    const minMoves = calculateMinMoves(wordData, startingWord, targetWord);

    localStorage.setItem('startingWord', startingWord);
    localStorage.setItem('targetWord', targetWord);
    localStorage.setItem('guesses', JSON.stringify([startingWord])); // Start with the starting word
    
    displayChain([startingWord], targetWord); // Display the initial chain
    displayMinMoves(minMoves); // Display the minimum possible moves
}

function displayMinMoves(minMoves) {
    const minMovesDiv = document.getElementById('minMovesDisplay');
    minMovesDiv.textContent = `Minimum possible moves: ${minMoves}`;
}

function submitGuess(wordData, userGuess = null) {
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
}

function showWinModal(playerScore, minMoves) {
    const modal = document.getElementById('winModal');
    const scoreMessage = document.getElementById('scoreMessage');
    const shareButton = document.getElementById('shareButton');
    const closeModalButton = document.getElementById('closeModalButton');

    scoreMessage.textContent = `Score: ${playerScore}/${minMoves}`;

    // Share button functionality
    shareButton.onclick = function() {
        const shareText = `I completed the word game in ${playerScore} moves, with the minimum possible being ${minMoves}! Can you beat my score?`;
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

// Close the modal if the user clicks anywhere outside of it
window.onclick = function(event) {
    const modal = document.getElementById('winModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};


document.addEventListener("DOMContentLoaded", () => {
    loadWordData('word_differences.json', findAndDisplayPath);
});
