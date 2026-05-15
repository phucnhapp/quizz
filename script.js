// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBB4GqaDVw8k3mLjJA_szhIWmgjSlIgnQ8",
    authDomain: "quizz-92f17-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quizz-92f17",
    storageBucket: "https://quizz-92f17-default-rtdb.asia-southeast1.firebasedatabase.app",
    databaseURL: "https://quizz-92f17-default-rtdb.asia-southeast1.firebasedatabase.app",
    messagingSenderId: "19153769746",
    appId: "1:19153769746:web:aff9dba03fc4daeac00fcb"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const appCheck = firebase.appCheck();
appCheck.activate('6LfR37YsAAAAANt6q2YUB96iBm1s6X8Pn1jvdkgb', true);
const database = firebase.database();

let quizData = [];
let currentQuestionIndex = 0;
let userResponses = {}; 
let userData = {}; 
let essayResponse = "";
let timerInterval;
let timeLeft = 300; // 5 phút

// Biến theo dõi thời gian mới
let startTime = null;
let endTime = null;
let totalQuizTimeMs = 0; 
let lastTickTime = null;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.onload = function() {
    if (localStorage.getItem('quiz_completed') === 'true') {
        // Có thể mở comment nếu muốn chặn thi lại
        // document.getElementById("user-info-area").classList.add("hidden");
        // document.getElementById("already-done").classList.remove("hidden");
    }
};

document.getElementById('essay-input').addEventListener('input', function() {
    let words = this.value.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 100) {
        this.value = words.slice(0, 100).join(" ");
        words = words.slice(0, 100);
    }
    essayResponse = this.value;
    document.getElementById('word-count').innerText = `Số từ: ${words.length}/100`;
});

function startTimer() {
    const timerDisplay = document.getElementById("timer");
    timerInterval = setInterval(() => {
        const now = Date.now();
        const deltaTime = now - lastTickTime;
        lastTickTime = now;

        // Chỉ đếm ngược và cộng dồn thời gian nếu đang ở các câu TRẮC NGHIỆM
        if (currentQuestionIndex < quizData.length) {
            totalQuizTimeMs += deltaTime;

            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            timerDisplay.innerText = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                alert("Hết giờ làm bài trắc nghiệm! Hệ thống sẽ chuyển sang phần tiếp theo.");
                // Nếu hết giờ khi đang trắc nghiệm, nhảy thẳng đến câu tự luận cuối cùng
                currentQuestionIndex = quizData.length;
                loadQuestion();
            }
            timeLeft--;
        } else {
            // Khi ở câu tự luận: Dừng đếm giây, hiển thị trạng thái nghỉ
            timerDisplay.innerText = "PAUSED";
        }
    }, 1000);
}

function startQuiz() {
    const name = document.getElementById("user-name").value.trim();
    const org = document.getElementById("user-org").value.trim();
    const phone = document.getElementById("user-phone").value.trim();
    if (!name || !org || !phone) {
        alert("Vui lòng nhập đầy đủ thông tin trước khi bắt đầu!");
        return;
    }

    userData = { name, org, phone };
    startTime = new Date(); // Lưu thời gian bắt đầu làm bài
    lastTickTime = Date.now(); // Điểm neo thời gian đầu tiên

    document.getElementById("user-info-area").classList.add("hidden");
    document.getElementById("question-area").classList.remove("hidden");
    
    startTimer();

    fetch('data.json?v=1.0.2')
        .then(res => res.json())
        .then(data => {
            let shuffledQuestions = shuffle(data);
            quizData = shuffledQuestions.slice(0, 30);
            quizData.forEach(q => q.shuffledOptions = shuffle([...q.options]));
            loadQuestion();
        })
        .catch(err => {
            console.error("Lỗi tải dữ liệu:", err);
            alert("Có lỗi xảy ra khi tải câu hỏi!");
        });
}

function loadQuestion() {
    const totalQuestions = quizData.length + 1;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    document.getElementById("progress-bar").style.width = progress + "%";

    const optionsContainer = document.getElementById("options-container");
    const essayContainer = document.getElementById("essay-container");
    const questionText = document.getElementById("question-text");

    // Reset lại mốc tick mỗi khi chuyển câu để tính toán deltaTime chính xác
    lastTickTime = Date.now();

    if (currentQuestionIndex < quizData.length) {
        essayContainer.classList.add("hidden");
        optionsContainer.classList.remove("hidden");
        
        const currentQuiz = quizData[currentQuestionIndex];
        questionText.innerHTML = `Câu ${currentQuestionIndex + 1}/${totalQuestions}: ${currentQuiz.question}`;
        
        optionsContainer.innerHTML = "";
        currentQuiz.shuffledOptions.forEach(option => {
            const btn = document.createElement("button");
            btn.innerText = option;
            btn.classList.add("option");
            if (userResponses[currentQuiz.id] === option) btn.classList.add("selected");

            btn.onclick = () => {
                userResponses[currentQuiz.id] = option;
                document.querySelectorAll(".option").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
            };
            optionsContainer.appendChild(btn);
        });
    } else {
        optionsContainer.classList.add("hidden");
        essayContainer.classList.remove("hidden");
        questionText.innerHTML = `Câu ${totalQuestions}/${totalQuestions}: Câu hỏi thêm về sáng kiến khoa học công nghệ.`;
    }

    document.getElementById("prev-btn").disabled = (currentQuestionIndex === 0);
    if (currentQuestionIndex === totalQuestions - 1) {
        document.getElementById("next-btn").classList.add("hidden");
        document.getElementById("submit-btn").classList.remove("hidden");
    } else {
        document.getElementById("next-btn").classList.remove("hidden");
        document.getElementById("submit-btn").classList.add("hidden");
    }
}

function changeQuestion(step) {
    currentQuestionIndex += step;
    loadQuestion();
}

function confirmSubmit() {
    const answeredCount = Object.keys(userResponses).length;
    if (confirm(`Bạn đã làm ${answeredCount}/20 câu trắc nghiệm. Chắc chắn nộp bài?`)) {
        submitToFirebase();
    }
}

function submitToFirebase() {
    clearInterval(timerInterval);
    endTime = new Date(); // Lưu thời gian kết thúc

    document.getElementById("block-ui").classList.remove("hidden");

    const details = Object.keys(userResponses).map(id => ({
        id: id,
        answer: userResponses[id]
    }));

    database.ref('submissions').push({
        ...userData,
        timestamp: endTime.toISOString(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_quiz_time_ms: Math.floor(totalQuizTimeMs),
        details: details,
        essay_answer: essayResponse 
    }).then(() => {
        database.goOffline();
        localStorage.setItem('quiz_completed', 'true');
        document.getElementById("block-ui").classList.add("hidden");
        document.getElementById("question-area").classList.add("hidden");
        document.getElementById("result-area").classList.remove("hidden");
    }).catch(err => {
        console.error(err);
        document.getElementById("block-ui").classList.add("hidden");
        alert("Lỗi kết nối! Vui lòng kiểm tra mạng và nộp lại.");
    });
}