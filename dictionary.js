class DictionaryApp {
    constructor() {
        this.apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.results = document.getElementById('results');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.wordTitle = document.getElementById('wordTitle');
        this.phoneticText = document.getElementById('phoneticText');
        this.meaningsContainer = document.getElementById('meaningsContainer');
        this.synonymsSection = document.getElementById('synonymsSection');
        this.antonymsSection = document.getElementById('antonymsSection');
        this.synonymsList = document.getElementById('synonymsList');
        this.antonymsList = document.getElementById('antonymsList');
        this.playBtn = document.getElementById('playBtn');
        this.historyList = document.getElementById('historyList');
        
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSearchHistory();
        this.setupSuggestions();
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchWord());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWord();
        });
        this.playBtn.addEventListener('click', () => this.playPronunciation());
    }

    async searchWord() {
        const word = this.searchInput.value.trim().toLowerCase();
        
        if (!word) {
            this.showError('Please enter a word to search');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            const response = await fetch(`${this.apiUrl}${word}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`"${word}" not found in dictionary`);
                }
                throw new Error('Failed to fetch word definition');
            }

            const data = await response.json();
            this.displayResults(data[0]);
            this.addToHistory(word);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayResults(wordData) {
        this.wordTitle.textContent = wordData.word;
        
        // Set phonetic
        const phonetic = wordData.phonetics.find(p => p.text) || wordData.phonetics[0];
        this.phoneticText.textContent = phonetic ? phonetic.text : '';
        
        // Store audio URL for pronunciation
        const audio = wordData.phonetics.find(p => p.audio);
        this.audioUrl = audio ? audio.audio : null;
        
        // Display meanings
        this.displayMeanings(wordData.meanings);
        
        // Display synonyms and antonyms
        this.displaySynonymsAntonyms(wordData.meanings);
        
        this.showResults();
    }

    displayMeanings(meanings) {
        this.meaningsContainer.innerHTML = '';
        
        meanings.forEach(meaning => {
            const meaningDiv = document.createElement('div');
            meaningDiv.className = 'meaning-section';
            
            const posTitle = document.createElement('h3');
            posTitle.className = 'part-of-speech';
            posTitle.textContent = meaning.partOfSpeech;
            meaningDiv.appendChild(posTitle);
            
            meaning.definitions.forEach((def, index) => {
                const defItem = document.createElement('div');
                defItem.className = 'definition-item';
                
                const definition = document.createElement('div');
                definition.className = 'definition';
                definition.textContent = `${index + 1}. ${def.definition}`;
                defItem.appendChild(definition);
                
                if (def.example) {
                    const example = document.createElement('div');
                    example.className = 'example';
                    example.textContent = `"${def.example}"`;
                    defItem.appendChild(example);
                }
                
                meaningDiv.appendChild(defItem);
            });
            
            this.meaningsContainer.appendChild(meaningDiv);
        });
    }

    displaySynonymsAntonyms(meanings) {
        const allSynonyms = [];
        const allAntonyms = [];
        
        meanings.forEach(meaning => {
            if (meaning.synonyms) allSynonyms.push(...meaning.synonyms);
            if (meaning.antonyms) allAntonyms.push(...meaning.antonyms);
        });
        
        // Display synonyms
        if (allSynonyms.length > 0) {
            this.synonymsSection.style.display = 'block';
            this.synonymsList.innerHTML = '';
            [...new Set(allSynonyms)].slice(0, 10).forEach(syn => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = syn;
                tag.addEventListener('click', () => {
                    this.searchInput.value = syn;
                    this.searchWord();
                });
                this.synonymsList.appendChild(tag);
            });
        } else {
            this.synonymsSection.style.display = 'none';
        }
        
        // Display antonyms
        if (allAntonyms.length > 0) {
            this.antonymsSection.style.display = 'block';
            this.antonymsList.innerHTML = '';
            [...new Set(allAntonyms)].slice(0, 10).forEach(ant => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = ant;
                tag.addEventListener('click', () => {
                    this.searchInput.value = ant;
                    this.searchWord();
                });
                this.antonymsList.appendChild(tag);
            });
        } else {
            this.antonymsSection.style.display = 'none';
        }
    }

    playPronunciation() {
        if (this.audioUrl) {
            const audio = new Audio(this.audioUrl);
            audio.play().catch(() => {
                this.showError('Could not play pronunciation');
            });
        } else {
            this.showError('No pronunciation available');
        }
    }

    addToHistory(word) {
        if (!this.searchHistory.includes(word)) {
            this.searchHistory.unshift(word);
            this.searchHistory = this.searchHistory.slice(0, 10);
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
            this.loadSearchHistory();
        }
    }

    loadSearchHistory() {
        this.historyList.innerHTML = '';
        
        if (this.searchHistory.length === 0) {
            this.historyList.innerHTML = '<p style="color: #666;">No recent searches</p>';
            return;
        }
        
        this.searchHistory.forEach(word => {
            const item = document.createElement('span');
            item.className = 'history-item';
            item.textContent = word;
            item.addEventListener('click', () => {
                this.searchInput.value = word;
                this.searchWord();
            });
            this.historyList.appendChild(item);
        });
    }

    setupSuggestions() {
        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.length > 2) {
                this.showSuggestions(value);
            } else {
                this.hideSuggestions();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-section')) {
                this.hideSuggestions();
            }
        });
    }

    showSuggestions(query) {
        // Simple suggestions based on common words
        const commonWords = [
            'apple', 'banana', 'computer', 'dictionary', 'elephant', 'friend', 'great', 'happy',
            'important', 'journey', 'knowledge', 'language', 'mountain', 'nature', 'ocean', 'people',
            'quality', 'respect', 'science', 'technology', 'understand', 'value', 'water', 'yellow'
        ];
        
        const suggestions = commonWords.filter(word => 
            word.startsWith(query.toLowerCase()) && word !== query.toLowerCase()
        ).slice(0, 5);
        
        const suggestionsDiv = document.getElementById('suggestions');
        
        if (suggestions.length > 0) {
            suggestionsDiv.innerHTML = suggestions.map(word => 
                `<div class="suggestion-item" onclick="app.searchInput.value='${word}'; app.searchWord();">${word}</div>`
            ).join('');
            suggestionsDiv.style.display = 'block';
        } else {
            this.hideSuggestions();
        }
    }

    hideSuggestions() {
        document.getElementById('suggestions').style.display = 'none';
    }

    showLoading() {
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }

    showResults() {
        this.results.classList.remove('hidden');
    }

    hideResults() {
        this.results.classList.add('hidden');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.error.classList.remove('hidden');
    }

    hideError() {
        this.error.classList.add('hidden');
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DictionaryApp();
});

// Add some sample words for quick testing
const sampleWords = ['hello', 'world', 'beautiful', 'amazing', 'wonderful'];
