document.addEventListener('DOMContentLoaded', () => {
    const messageField = document.getElementById('message');
    const form = document.getElementById("contact-form");
    const result = document.getElementById("submission-result");

    if (messageField) {

        const adjustHeight = (element) => {
            element.style.height = 'auto';
            element.style.height = element.scrollHeight + 'px';
        };

        messageField.addEventListener('input', function () {
            adjustHeight(this);
        });

        adjustHeight(messageField);
    } else {
        console.error("Element with id 'message' was not found.");
    }
    const mathQuestionText = document.getElementById('math-question-text');
    const mathAnswer = document.getElementById('math-answer');

    function generateMathQuestion() {
        const num1 = Math.floor(Math.random() * 10);
        const num2 = Math.floor(Math.random() * 10);
        const question = `${num1} + ${num2}`;
        mathQuestionText.textContent = `What is ${question}?`;
        return num1 + num2;
    }

    let correctAnswer = generateMathQuestion();
        

    form.addEventListener("submit", function (e) {
        if (parseInt(mathAnswer.value) !== correctAnswer) {
            e.preventDefault();
            result.innerHTML = "Incorrect math answer. Please try again.";
            correctAnswer = generateMathQuestion();
            return;
        }
        
        e.preventDefault();
        const formData = new FormData(form);
        const object = {};
        formData.forEach((value, key) => {
            object[key] = value;
        });
        const json = JSON.stringify(object);
        result.innerHTML = "Please wait...";

        fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: json
        })
        .then(async (response) => {
            let json = await response.json();
            if (response.status === 200) {
                result.innerHTML = json.message;
            } else {
                console.log(response);
                result.innerHTML = json.message;
            }
        })
        .catch((error) => {
            console.log(error);
            result.innerHTML = "Something went wrong!";
        })
        .then(function () {
            form.reset();
            setTimeout(() => {
                result.style.display = "none";
            }, 5000);
        });
        correctAnswer = generateMathQuestion();
    });
});
