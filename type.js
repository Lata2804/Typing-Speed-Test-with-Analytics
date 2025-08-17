document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const textToTypeEl = document.getElementById('text-to-type');
    const userInputEl = document.getElementById('user-input');
    const timerEl = document.getElementById('timer');
    const wpmEl = document.getElementById('wpm');
    const accuracyEl = document.getElementById('accuracy');
    const restartBtn = document.getElementById('restart-btn');
    
    // Gamification Elements
    const levelEl = document.getElementById('level');
    const xpEl = document.getElementById('xp');
    const xpNeededEl = document.getElementById('xp-needed');
    const xpBar = document.getElementById('xp-bar');

    // Sample texts for the test
    const TEXTS = [
        "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet.",
        "Technology has revolutionized the way we live and work. From smartphones to artificial intelligence, the pace of innovation is staggering.",
        "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune.",
        "The journey of a thousand miles begins with a single step. Persistence and determination are the keys to success in any endeavor.",
        "In the middle of difficulty lies opportunity. Every challenge we face is a chance to grow stronger and more resilient."
    ];
    
    const TEST_DURATION = 60; // seconds
    let timerInterval;
    let timeLeft = TEST_DURATION;
    let testInProgress = false;
    let startTime;
    let testHistory = []; // To store results for the chart

    // Gamification state
    let player = {
        level: 1,
        xp: 0,
        xpForNextLevel: 100,
    };

    // Chart.js instance
    let progressChart;

    // --- INITIALIZATION ---
    function initializeTest() {
        // Reset state
        clearInterval(timerInterval);
        testInProgress = false;
        timeLeft = TEST_DURATION;
        
        // Reset UI
        timerEl.textContent = timeLeft;
        wpmEl.textContent = '0';
        accuracyEl.textContent = '100';
        userInputEl.value = '';
        userInputEl.disabled = false;

        // Load new text
        const randomText = TEXTS[Math.floor(Math.random() * TEXTS.length)];
        textToTypeEl.innerHTML = '';
        randomText.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.textContent = char;
            textToTypeEl.appendChild(charSpan);
        });

        // Set cursor on the first character
        updateCursor();
    }

    // --- EVENT LISTENERS ---
    userInputEl.addEventListener('input', handleTyping);
    restartBtn.addEventListener('click', initializeTest);

    // --- CORE LOGIC ---
    function handleTyping() {
        if (!testInProgress && userInputEl.value.length > 0) {
            startTest();
        }

        const typedText = userInputEl.value;
        const textToTypeSpans = textToTypeEl.querySelectorAll('span');
        let correctChars = 0;
        
        textToTypeSpans.forEach((charSpan, index) => {
            const typedChar = typedText[index];
            if (typedChar == null) {
                charSpan.className = '';
            } else if (typedChar === charSpan.textContent) {
                charSpan.className = 'correct';
                correctChars++;
            } else {
                charSpan.className = 'incorrect';
            }
        });

        // Update accuracy in real-time
        const currentAccuracy = typedText.length > 0 ? (correctChars / typedText.length * 100).toFixed(2) : 100;
        accuracyEl.textContent = Math.round(currentAccuracy);
        updateCursor();

        // Check if test is complete
        if (typedText.length === textToTypeSpans.length) {
            endTest();
        }
    }

    function startTest() {
        testInProgress = true;
        startTime = new Date();
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft;
            if (timeLeft === 0) {
                endTest();
            }
        }, 1000);
    }


    function endTest() {
        clearInterval(timerInterval);
        testInProgress = false;
        userInputEl.disabled = true;

        const timeElapsed = (TEST_DURATION - timeLeft) / 60; // in minutes
        const typedText = userInputEl.value;
        const totalChars = typedText.length;
        const correctChars = document.querySelectorAll('.correct').length;

        const wordsTyped = totalChars / 5; // A "word" is standardized as 5 characters
        const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
        const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
        
        wpmEl.textContent = wpm;
        accuracyEl.textContent = accuracy;

        // Update analytics and gamification
        updateAnalytics(wpm, accuracy);
        updateGamification(wpm, accuracy);
    }
    
    function updateCursor() {
        document.querySelectorAll('.current').forEach(el => el.classList.remove('current'));
        const nextCharIndex = userInputEl.value.length;
        const nextCharSpan = textToTypeEl.querySelectorAll('span')[nextCharIndex];
        if (nextCharSpan) {
            nextCharSpan.classList.add('current');
        }
    }

    // --- ANALYTICS ---
    function updateAnalytics(wpm, accuracy) {
        testHistory.push({ wpm, accuracy });
        if (progressChart) {
            progressChart.data.labels.push(`Test ${testHistory.length}`);
            progressChart.data.datasets[0].data.push(wpm);
            progressChart.data.datasets[1].data.push(accuracy);
            progressChart.update();
        }
    }

    function createChart() {
        const ctx = document.getElementById('progress-chart').getContext('2d');
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], // Test 1, Test 2, etc.
                datasets: [{
                    label: 'WPM',
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.3
                }, {
                    label: 'Accuracy (%)',
                    data: [],
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // --- GAMIFICATION ---
    function updateGamification(wpm, accuracy) {
        // Simple XP formula: base points for WPM, multiplied by accuracy
        const xpGained = Math.round((wpm * (accuracy / 100)) / 2);
        player.xp += xpGained;

        // Check for level up
        while (player.xp >= player.xpForNextLevel) {
            player.level++;
            player.xp -= player.xpForNextLevel;
            player.xpForNextLevel = Math.round(player.xpForNextLevel * 1.5); // Increase XP needed for next level
            alert(`🎉 Congratulations! You've reached Level ${player.level}!`);
        }
        updateGamificationUI();
    }

    function updateGamificationUI() {
        levelEl.textContent = player.level;
        xpEl.textContent = player.xp;
        xpNeededEl.textContent = player.xpForNextLevel;
        const xpPercentage = (player.xp / player.xpForNextLevel) * 100;
        xpBar.style.width = `${xpPercentage}%`;
    }

    // --- INITIALIZE ON LOAD ---
    initializeTest();
    createChart();
    updateGamificationUI();
});