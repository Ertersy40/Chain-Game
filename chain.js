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
            if (path.length === 0) {
                return null;
            }
            currentWord = path[path.length - 1];
        }
    }

    saveGuesses(path);
    return null;
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
        const guessDivContainer = displayWord(guess);
        chainDiv.appendChild(guessDivContainer);
    });

    // Display the current word as the current word
    const guessDivContainer = displayWord(guesses[guesses.length - 1], true);
    chainDiv.appendChild(guessDivContainer);

    if (guesses[guesses.length - 1] !== targetWord) {
        // If the target word isn't guessed (the game hasn't finished) display the target word
        const targetDivContainer = displayWord(targetWord);
        chainDiv.appendChild(targetDivContainer);
    }
}

function displayWord(word, isCurrentWord = false) {
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
        letterDiv.addEventListener('click', () => selectLetter(letterDiv, wordDivContainer));
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
        const wordData = loadWordData('word_differences.json', (wordData) => {
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

    localStorage.setItem('startingWord', startingWord);
    localStorage.setItem('targetWord', targetWord);
    localStorage.setItem('guesses', JSON.stringify([startingWord])); // Start with the starting word
    
    displayChain([startingWord], targetWord); // Display the initial chain
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
            burstConfetti()
        }
    } else {
        console.log(currentWord);
    }

    document.getElementById('userGuess').value = ''; // Clear the input field
}
document.addEventListener("DOMContentLoaded", () => {
    loadWordData('word_differences.json', findAndDisplayPath);
});
