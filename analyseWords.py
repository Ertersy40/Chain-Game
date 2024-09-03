import json

def load_words(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        words = [line.strip() for line in file if len(line.strip()) == 4]
    return words

def find_one_letter_differences(words):
    word_dict = {}
    
    for word in words:
        word_dict[word] = []
        for other_word in words:
            if word != other_word and sum(1 for a, b in zip(word, other_word) if a != b) == 1:
                word_dict[word].append(other_word)
    
    return word_dict

def write_to_json(word_dict, output_file):
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(word_dict, file, indent=4)

def main():
    input_file = "4_letter_words.txt"  # The file containing 4-letter words
    output_file = "word_differences.json"  # The output JSON file
    
    words = load_words(input_file)
    word_dict = find_one_letter_differences(words)
    write_to_json(word_dict, output_file)
    
    print(f"Analysis complete. JSON file created at {output_file}")

if __name__ == "__main__":
    main()
