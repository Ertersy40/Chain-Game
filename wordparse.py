import os
import re

def extract_words_of_length(folder_path, word_length):
    words = set()  # Use a set to automatically handle duplicates
    
    # Regular expression to match only a-z letters
    valid_word_regex = re.compile(r'^[a-z]+$')
    
    # Loop through all files in the directory
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        
        # Only process files
        if os.path.isfile(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    for line in file:
                        word = line.strip().lower()  # Convert to lowercase
                        if len(word) == word_length and valid_word_regex.match(word):
                            words.add(word)  # Add valid word to set
            except UnicodeDecodeError:
                # If UTF-8 fails, try reading with ISO-8859-1 encoding or ignoring errors
                with open(file_path, 'r', encoding='ISO-8859-1') as file:
                    for line in file:
                        word = line.strip().lower()  # Convert to lowercase
                        if len(word) == word_length and valid_word_regex.match(word):
                            words.add(word)  # Add valid word to set

    return words

def write_words_to_file(words, output_file):
    with open(output_file, 'w', encoding='utf-8') as file:
        for word in sorted(words):  # Sort words for consistency in output
            file.write(f"{word}\n")

def main():
    folder_path = 'words'  # Folder where the word files are located
    word_length = int(input("Enter the word length: "))  # Length of words to extract
    output_file = f"{word_length}_letter_words.txt"  # Output file name
    
    words = extract_words_of_length(folder_path, word_length)
    write_words_to_file(words, output_file)
    
    print(f"Words of length {word_length} have been written to {output_file}")

if __name__ == "__main__":
    main()
