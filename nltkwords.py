import nltk
from nltk import pos_tag
from wordfreq import iter_wordlist

# Download necessary NLTK data
nltk.download('averaged_perceptron_tagger')

# Get English words sorted by frequency
english_words = list(iter_wordlist('en'))

# Filter for words that are exactly four letters long and only alphabetic
four_letter_words = [word for word in english_words if len(word) == 4 and word.isalpha()]

# Initialize a list to store non-proper nouns
non_proper_nouns = []

# Process words in batches to apply POS tagging and filter out proper nouns
batch_size = 5000
for i in range(0, len(four_letter_words), batch_size):
    batch_words = four_letter_words[i:i + batch_size]
    tagged_words = pos_tag(batch_words)
    for word, tag in tagged_words:
        if tag not in ('NNP', 'NNPS'):
            non_proper_nouns.append(word)

# Write the filtered four-letter non-proper nouns to 'output.txt'
with open('output.txt', 'w', encoding='utf-8') as f:
    for word in non_proper_nouns:
        f.write(word + '\n')

print(f"Total number of four-letter non-proper nouns: {len(non_proper_nouns)}")
