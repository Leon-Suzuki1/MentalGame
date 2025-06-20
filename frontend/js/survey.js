document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const surveyForm = document.getElementById('surveyForm');
    const surveyQuestionsArea = document.getElementById('surveyQuestionsArea');
    const submitSurveyButton = document.getElementById('submitSurveyButton');
    const surveyMessage = document.getElementById('surveyMessage');
    const surveyIntroText = document.getElementById('surveyIntroText');

    const API_SURVEY_URL = 'http://localhost:3000/api/survey';

    const getToken = () => sessionStorage.getItem('jwtToken');

    const showMessage = (message, type = 'info', duration = 3000) => {
        surveyMessage.textContent = message;
        surveyMessage.className = `message ${type}`;
        surveyMessage.style.display = 'block';
        if (duration > 0) {
            setTimeout(() => {
                surveyMessage.style.display = 'none';
                surveyMessage.textContent = '';
                surveyMessage.className = 'message';
            }, duration);
        }
    };

    const renderSurveyQuestions = (questions) => {
        surveyQuestionsArea.innerHTML = ''; // Clear "Loading..." or old questions

        if (!questions || questions.length === 0) {
            surveyQuestionsArea.innerHTML = '<p>No survey questions available at the moment.</p>';
            submitSurveyButton.style.display = 'none';
            return;
        }

        questions.forEach(q => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'survey-question-item form-div'; // Use form-div for consistent spacing like other forms

            const label = document.createElement('label');
            label.htmlFor = `question_${q.id}`;
            label.textContent = q.question_text;
            questionDiv.appendChild(label);

            if (q.question_type === 'scale_1_5') {
                const scaleContainer = document.createElement('div');
                scaleContainer.className = 'scale-options';
                for (let i = 1; i <= 5; i++) {
                    const radioInput = document.createElement('input');
                    radioInput.type = 'radio';
                    radioInput.id = `question_${q.id}_val${i}`;
                    radioInput.name = `question_${q.id}`; // Group radios for the same question
                    radioInput.value = i;
                    radioInput.required = true;

                    const radioLabel = document.createElement('label');
                    radioLabel.htmlFor = radioInput.id;
                    radioLabel.textContent = i;
                    radioLabel.className = 'scale-option-label';

                    const wrapper = document.createElement('span'); // Wrapper for styling
                    wrapper.appendChild(radioInput);
                    wrapper.appendChild(radioLabel);
                    scaleContainer.appendChild(wrapper);
                }
                questionDiv.appendChild(scaleContainer);
            } else if (q.question_type === 'text') {
                const textArea = document.createElement('textarea');
                textArea.id = `question_${q.id}`;
                textArea.name = `question_${q.id}`;
                textArea.rows = 3;
                textArea.required = true;
                questionDiv.appendChild(textArea);
            } else if (q.question_type === 'multiple_choice_single') {
                const selectContainer = document.createElement('div');
                selectContainer.className = 'select-options';
                if (q.options && Array.isArray(q.options)) {
                    q.options.forEach(optionText => {
                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.id = `question_${q.id}_opt_${optionText.replace(/\s+/g, '-')}`;
                        radioInput.name = `question_${q.id}`;
                        radioInput.value = optionText;
                        radioInput.required = true;

                        const radioLabel = document.createElement('label');
                        radioLabel.htmlFor = radioInput.id;
                        radioLabel.textContent = optionText;
                        radioLabel.className = 'choice-option-label';

                        const wrapper = document.createElement('span');
                        wrapper.appendChild(radioInput);
                        wrapper.appendChild(radioLabel);
                        selectContainer.appendChild(wrapper);
                    });
                }
                questionDiv.appendChild(selectContainer);
            }
            surveyQuestionsArea.appendChild(questionDiv);
        });
        submitSurveyButton.style.display = 'block';
    };

    const fetchDailySurvey = async () => {
        const token = getToken();
        if (!token) {
            showMessage('Please log in to take the survey.', 'error', 0);
            surveyQuestionsArea.innerHTML = '<p>You must be logged in.</p>';
            submitSurveyButton.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`${API_SURVEY_URL}/daily`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Catch if body isn't JSON
                throw new Error(errorData.message || `Failed to fetch survey (${response.status})`);
            }
            const result = await response.json();

            if (result.data.alreadySubmittedToday) {
                surveyIntroText.textContent = "You've already completed the survey for today. Thank you!";
                surveyQuestionsArea.innerHTML = '<p>Come back tomorrow for the next survey!</p>';
                submitSurveyButton.style.display = 'none';
                showMessage('Survey completed for today!', 'success', 0);
            } else {
                renderSurveyQuestions(result.data.questions);
            }

        } catch (error) {
            console.error('Error fetching daily survey:', error);
            showMessage(`Error loading survey: ${error.message}`, 'error', 0);
            surveyQuestionsArea.innerHTML = '<p>Could not load survey questions at this time.</p>';
            submitSurveyButton.style.display = 'none';
        }
    };

    surveyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const token = getToken();
        if (!token) {
            showMessage('Please log in to submit the survey.', 'error');
            return;
        }

        const formData = new FormData(surveyForm);
        const answers = [];
        let allRequiredAnswered = true; // Assume all required are answered initially

        // Iterate over questions rendered to check if they're answered
        const questionsRendered = surveyQuestionsArea.querySelectorAll('.survey-question-item');

        // If no questions were rendered but form submitted, that's an issue.
        if (questionsRendered.length === 0) {
            showMessage('No survey questions were loaded to submit.', 'error');
            return;
        }

        questionsRendered.forEach(qDiv => {
            const firstInput = qDiv.querySelector('input, textarea'); // Get first input to find name
            if (!firstInput) return; // Should not happen if questions rendered correctly

            const questionIdFull = firstInput.name;
            const questionId = questionIdFull.replace('question_', '');
            let value = formData.get(questionIdFull); // For radio, gets selected value

            if (firstInput.type === 'textarea') { // Check if it's a textarea
                value = value ? String(value).trim() : null;
            }

            // Check if this question was required and is unanswered
            const isRequired = qDiv.querySelector('[required]');
            if (isRequired && (value === null || value === '')) {
                allRequiredAnswered = false;
                const label = qDiv.querySelector('label[for^="question_"]'); // Get the main label for the question
                showMessage(`Please answer the question: "${label ? label.textContent : 'A required question'}"`, 'error');
            }

            if(value !== null && value !== '') { // Only add if there's a value
                 answers.push({ question_id: parseInt(questionId), answer_value: value });
            }
        });

        if (!allRequiredAnswered) {
            return; // Stop submission if a required question is unanswered
        }

        // Ensure at least one answer is present if there were questions
        if (answers.length === 0 && questionsRendered.length > 0) {
            showMessage('Please answer at least one question, or check if all required fields are filled.', 'error');
            return;
        }


        submitSurveyButton.disabled = true;
        showMessage('Submitting your answers...', 'info', 0);

        try {
            const response = await fetch(`${API_SURVEY_URL}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('Survey submitted successfully! Thank you.', 'success', 0);
                surveyIntroText.textContent = "Thank you for completing today's survey!";
                surveyQuestionsArea.innerHTML = '<p>Your responses have been recorded.</p>';
                submitSurveyButton.style.display = 'none';
                // Trigger dashboard streak update visually if possible, or rely on next load
            } else {
                showMessage(result.message || 'Failed to submit survey.', 'error');
                submitSurveyButton.disabled = false;
            }
        } catch (error) {
            console.error('Error submitting survey:', error);
            showMessage('An error occurred while submitting your survey.', 'error');
            submitSurveyButton.disabled = false;
        }
    });

    // Initial fetch of survey
    fetchDailySurvey();
});
