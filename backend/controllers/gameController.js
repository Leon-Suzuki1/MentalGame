const db = require('../database');
const { updateUserStreak } = require('./streaksController');
const { awardBadgeIfCriteriaMet } = require('./badgeController');

// Shuffle array helper (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Get data for a new matching game round
exports.getNewMatchingRound = async (req, res) => {
    const numberOfQuestions = parseInt(req.query.questions) || 5; // Default to 5 questions
    const numberOfChoices = parseInt(req.query.choices) || 4;   // Default to 4 choices per question

    if (numberOfChoices < 2) {
        return res.status(400).json({ message: "Number of choices must be at least 2." });
    }

    try {
        // Fetch all possible pairs from the database
        db.all("SELECT id, negative_thought, healthy_alternative FROM game_matching_pairs", [], async (err, allPairs) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching game pairs from database.", error: err.message });
            }

            if (!allPairs || allPairs.length < numberOfQuestions) {
                return res.status(400).json({ message: "Not enough game pairs in database to generate the requested number of questions." });
            }
             if (!allPairs || allPairs.length < numberOfChoices-1 && allPairs.length > 1 ) { // Need enough unique alternatives for distractors, but can't be more than total pairs
                // This condition needs to be nuanced: we need at least (numberOfChoices - 1) OTHER pairs for distractors.
                // So, total pairs must be at least numberOfChoices if all alternatives are unique.
                // If total pairs is less than numberOfChoices, we can't form enough unique distractors.
                if (allPairs.length < numberOfChoices) {
                    return res.status(400).json({ message: `Not enough unique healthy alternatives in database to generate ${numberOfChoices} choices. Total pairs: ${allPairs.length}` });
                }
            }


            // Shuffle all pairs and pick N for questions
            const shuffledPairs = shuffleArray([...allPairs]);
            const selectedPairsForQuestions = shuffledPairs.slice(0, numberOfQuestions);

            const gameRoundData = selectedPairsForQuestions.map(questionPair => {
                const correctAnswer = questionPair.healthy_alternative;

                // Get distractors: other healthy alternatives, not the current correct one
                let distractors = allPairs
                    .filter(p => p.id !== questionPair.id) // Exclude the current question's pair
                    .map(p => p.healthy_alternative); // Get their healthy alternatives

                // Ensure distractors are unique among themselves and different from the correct answer
                distractors = [...new Set(distractors)].filter(d => d !== correctAnswer);
                shuffleArray(distractors); // Shuffle the unique distractors

                // Select N-1 distractors
                const selectedDistractors = distractors.slice(0, numberOfChoices - 1);

                // Combine correct answer with distractors and shuffle
                const choices = shuffleArray([correctAnswer, ...selectedDistractors]);

                // Check if enough choices were formed. This is crucial.
                if (choices.length < Math.min(numberOfChoices, 2) ) { // If we can't even form 2 choices (or requested amount if less than 2)
                     console.warn(`Warning: Not enough unique distractors for question ID ${questionPair.id}. Requested ${numberOfChoices}, got ${choices.length}. Correct answer: ${correctAnswer}, Distractors found: ${selectedDistractors.length}`);
                     return null; // Mark this question as invalid to be filtered out
                }


                return {
                    id: questionPair.id, // ID of the game_matching_pairs entry
                    negative_thought: questionPair.negative_thought,
                    choices: choices,
                    // We don't send the correct answer index directly; client will need to check value.
                    // Or, for easier client-side checking, send the correct answer text separately.
                    correctAnswerText: correctAnswer
                };
            }).filter(q => q !== null); // Filter out questions that couldn't be formed correctly

            // Filter out questions that couldn't form enough choices (if any strict check was added)
            // const finalGameRoundData = gameRoundData.filter(q => q.choices.length >= Math.min(2, numberOfChoices));

            if (gameRoundData.length < numberOfQuestions) {
                 console.warn(`Warning: Could only generate ${gameRoundData.length} questions out of ${numberOfQuestions} requested due to choice constraints.`);
            }

            if (gameRoundData.length === 0 && numberOfQuestions > 0) {
                return res.status(500).json({ message: "Failed to generate any valid questions for the game round. Check database content and choice constraints."});
            }


            res.json({
                message: "New game round data fetched successfully.",
                data: gameRoundData
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error generating new game round.", error: error.message });
    }
};

exports.completeMatchingRound = async (req, res) => {
    const userId = req.user.id; // From authMiddleware

    try {
        // Update game activity streak
        const streakResult = await updateUserStreak(userId, 'game_activity');
        console.log(`Game activity streak updated for user ${userId}:`, streakResult);

        // Award "First Game Played" badge
        const badgeResult = await awardBadgeIfCriteriaMet(userId, 'First Game Played');
        console.log(`'First Game Played' badge attempt for user ${userId}:`, badgeResult.message);

        res.json({
            message: "Game round completion processed.",
            streakData: streakResult,
            badgeData: badgeResult
        });

    } catch (error) {
        console.error(`Error processing game round completion for user ${userId}:`, error);
        res.status(500).json({ message: "Error processing game round completion.", error: error.message });
    }
};
