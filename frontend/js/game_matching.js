document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startGameButton = document.getElementById('startGameButton');
    const gameControls = document.getElementById('gameControls');
    const scoreArea = document.getElementById('scoreArea');
    const currentScoreSpan = document.getElementById('currentScore');

    const gamePlayArea = document.getElementById('gamePlayArea');
    const gameQuestionArea = document.getElementById('gameQuestionArea');
    const gameChoicesArea = document.getElementById('gameChoicesArea');
    const gameFeedbackArea = document.getElementById('gameFeedbackArea');
    const nextQuestionButton = document.getElementById('nextQuestionButton');

    const gameResultsArea = document.getElementById('gameResultsArea');
    const finalScoreSpan = document.getElementById('finalScore');
    const playAgainButton = document.getElementById('playAgainButton');

    const API_GAME_URL = 'http://localhost:3000/api/game/matching/new-round';

    // Game State
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let questionsPerRound = 5; // Can be made configurable

    const getToken = () => sessionStorage.getItem('jwtToken');

    const showFeedback = (message, type) => {
        gameFeedbackArea.textContent = message;
        gameFeedbackArea.className = `message ${type}`; // Assumes 'message' base class, then 'success' or 'error'
        gameFeedbackArea.style.display = 'block';
    };

    const hideFeedback = () => {
        gameFeedbackArea.style.display = 'none';
        gameFeedbackArea.textContent = '';
    };

    const displayQuestion = () => {
        hideFeedback();
        nextQuestionButton.style.display = 'none';
        const questionData = currentQuestions[currentQuestionIndex];
        gameQuestionArea.textContent = questionData.negative_thought;

        gameChoicesArea.innerHTML = ''; // Clear previous choices
        questionData.choices.forEach(choiceText => {
            const choiceButton = document.createElement('button');
            choiceButton.className = 'choice-button button-secondary'; // General styling
            choiceButton.textContent = choiceText;
            choiceButton.addEventListener('click', handleAnswerSelection);
            gameChoicesArea.appendChild(choiceButton);
        });
    };

    const handleAnswerSelection = (event) => {
        const selectedButton = event.target;
        const selectedAnswer = selectedButton.textContent;
        const correctAnswer = currentQuestions[currentQuestionIndex].correctAnswerText;

        // Disable all choice buttons after selection
        document.querySelectorAll('.choice-button').forEach(btn => btn.disabled = true);

        if (selectedAnswer === correctAnswer) {
            score++;
            currentScoreSpan.textContent = score;
            showFeedback('Correct!', 'success');
            selectedButton.classList.add('correct-answer'); // Style for correct
        } else {
            showFeedback('Not quite. The healthier alternative was: ' + correctAnswer, 'error');
            selectedButton.classList.add('incorrect-answer'); // Style for incorrect
            // Highlight the correct answer
            document.querySelectorAll('.choice-button').forEach(btn => {
                if (btn.textContent === correctAnswer) {
                    btn.classList.add('correct-answer-reveal');
                }
            });
        }
        nextQuestionButton.style.display = 'block';
    };

    const loadNextQuestion = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuestions.length) {
            displayQuestion();
        } else {
            endGame();
        }
    };

    const startGame = async () => {
        const token = getToken();
        if (!token) {
            alert('Please log in to play the game.'); // Simple feedback for now
            return;
        }

        // Reset game state
        score = 0;
        currentQuestionIndex = 0;
        currentScoreSpan.textContent = score;
        currentQuestions = [];

        // UI updates for starting game
        startGameButton.style.display = 'none';
        gameResultsArea.style.display = 'none';
        scoreArea.style.display = 'block';
        gamePlayArea.style.display = 'block';
        hideFeedback();
        nextQuestionButton.style.display = 'none';

        try {
            const response = await fetch(`${API_GAME_URL}?questions=${questionsPerRound}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch game questions.');
            }
            const result = await response.json();

            if (result.data && result.data.length > 0) {
                currentQuestions = result.data;
                displayQuestion();
            } else {
                throw new Error('No questions received from server or not enough questions.');
            }
        } catch (error) {
            console.error('Error starting game:', error);
            gamePlayArea.innerHTML = `<p class="message error">Error starting game: ${error.message}. Please try again later.</p>`;
            startGameButton.style.display = 'block'; // Show start button again
            scoreArea.style.display = 'none';
        }
    };

    const endGame = () => {
        gamePlayArea.style.display = 'none';
        gameResultsArea.style.display = 'block';
        finalScoreSpan.textContent = score;

        const token = getToken();
        if (token) {
            fetch('http://localhost:3000/api/game/matching/complete-round', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' // Though no body is strictly needed for this POST
                }
            })
            .then(res => res.json())
            .then(data => {
                console.log("Game round completion processed by backend:", data);
                if (data.badgeData && data.badgeData.awarded) {
                    // Optionally, show a specific "New Badge Unlocked!" message on the game screen
                    // This would require adding a new message area or using the existing feedback one.
                    // For now, just log it. The main badges page will reflect the new badge.
                    console.log("New badge awarded:", data.badgeData.message);
                     showFeedback(`New Badge Unlocked: ${data.badgeData.message.split("'")[1]}!`, 'success'); // Attempt to extract badge name
                }
            })
            .catch(err => console.error("Error notifying backend of game round completion:", err));
        }
    };

    // Event Listeners
    startGameButton.addEventListener('click', startGame);
    nextQuestionButton.addEventListener('click', loadNextQuestion);
    playAgainButton.addEventListener('click', startGame); // Play again restarts the game

});
