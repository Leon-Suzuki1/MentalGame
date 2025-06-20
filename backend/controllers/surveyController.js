const db = require('../database');
const { updateUserStreak } = require('./streaksController'); // For step 3, but import now
const { awardBadgeIfCriteriaMet } = require('./badgeController'); // For step 3

// Helper to get today's date in YYYY-MM-DD
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Get active daily survey questions and user's submission status for today
exports.getDailySurvey = async (req, res) => {
    const userId = req.user.id;
    const todayStr = getTodayDateString();

    try {
        // Check if user has already submitted answers for any active question today
        // This query is a bit simplified; it checks if *any* answer exists for today.
        // A more precise check might be if all *current* active questions were answered today.
        const answeredTodaySql = `
            SELECT COUNT(sa.id) as count
            FROM survey_answers sa
            JOIN survey_questions sq ON sa.question_id = sq.id
            WHERE sa.user_id = ? AND sa.answered_on = ? AND sq.is_active = TRUE
        `;

        db.get(answeredTodaySql, [userId, todayStr], (err, row) => {
            if (err) {
                return res.status(500).json({ message: "Error checking survey submission status.", error: err.message });
            }

            const alreadySubmittedToday = row ? row.count > 0 : false;

            // Fetch active survey questions
            const questionsSql = "SELECT id, question_text, question_type, options, sort_order FROM survey_questions WHERE is_active = TRUE ORDER BY sort_order ASC";
            db.all(questionsSql, [], (qErr, questions) => {
                if (qErr) {
                    return res.status(500).json({ message: "Error fetching survey questions.", error: qErr.message });
                }

                // Parse JSON options string for multiple_choice_single questions
                const processedQuestions = questions.map(q => {
                    if (q.question_type === 'multiple_choice_single' && q.options) {
                        try {
                            q.options = JSON.parse(q.options);
                        } catch (parseError) {
                            console.error(`Error parsing options for question ID ${q.id}:`, parseError);
                            q.options = []; // Default to empty array on error
                        }
                    }
                    return q;
                });

                res.json({
                    message: "Daily survey questions fetched successfully.",
                    data: {
                        questions: processedQuestions,
                        alreadySubmittedToday: alreadySubmittedToday
                    }
                });
            });
        });

    } catch (error) {
        res.status(500).json({ message: "Server error fetching daily survey.", error: error.message });
    }
};


// Submit answers for the daily survey
exports.submitSurvey = async (req, res) => {
    const userId = req.user.id;
    const answers = req.body.answers; // Expected format: [{ question_id: X, answer_value: "Y" }, ...]
    const todayStr = getTodayDateString();

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: "No answers provided or invalid format." });
    }

    // Basic validation: check if all required fields are there
    for (const ans of answers) {
        if (ans.question_id == null || ans.answer_value == null || String(ans.answer_value).trim() === "") {
            return res.status(400).json({ message: "Invalid answer data. Each answer must have question_id and a non-empty answer_value." });
        }
    }

    // Check if already submitted today (again, more robust check on specific questions might be needed)
     const answeredTodaySql = "SELECT COUNT(id) as count FROM survey_answers WHERE user_id = ? AND answered_on = ?";
     db.get(answeredTodaySql, [userId, todayStr], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Error checking survey submission status before saving.", error: err.message });
        }
        if (row && row.count > 0) {
             // This check might be redundant if client disables form, but good for API integrity
            return res.status(409).json({ message: "Survey already submitted for today." });
        }

        const insertSql = "INSERT INTO survey_answers (user_id, question_id, answer_value, answered_on) VALUES (?, ?, ?, ?)";

        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");
            let completedOperations = 0;
            let anyError = null;

            answers.forEach(answer => {
                db.run(insertSql, [userId, answer.question_id, String(answer.answer_value).trim(), todayStr], function(runErr) {
                    completedOperations++;
                    if (runErr) {
                        anyError = runErr;
                        console.error("Error inserting survey answer:", runErr.message);
                    }

                    // After all db.run calls are scheduled
                    if (completedOperations === answers.length) {
                        if (anyError) {
                            db.run("ROLLBACK;", () => {
                                res.status(500).json({ message: "Error submitting survey answers. Transaction rolled back.", error: anyError.message });
                            });
                        } else {
                            db.run("COMMIT;", async (commitErr) => { // Make this callback async
                                if (commitErr) {
                                   return res.status(500).json({ message: "Error committing survey answers.", error: commitErr.message });
                                }

                                try {
                                    // Update survey streak (Step 3 integration)
                                    await updateUserStreak(userId, 'survey');
                                    console.log(`Survey streak updated for user ${userId}.`);

                                    // Award "First Survey Completed" badge (Step 3 integration)
                                    // Ensure 'First Survey Completed' badge name exists in database.js badgesToInsert array
                                    await awardBadgeIfCriteriaMet(userId, 'First Survey Completed');
                                    console.log(`'First Survey Completed' badge attempt for user ${userId}.`);

                                    res.status(201).json({ message: "Survey answers submitted successfully." });

                                } catch (streakOrBadgeError) {
                                    console.error("Error during streak/badge update after survey submission:", streakOrBadgeError);
                                    // Still return success for survey submission, but log the error
                                    res.status(201).json({ message: "Survey answers submitted (streak/badge issue)." });
                                }
                            });
                        }
                    }
                });
            });
        });
    });
};
