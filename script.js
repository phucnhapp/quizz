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
let timerInterval;
let timeLeft = 300; // 5 phút = 300 giây

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.onload = function() {
    if (localStorage.getItem('quiz_completed') === 'false') {
        database.goOnline(); 
        document.getElementById("user-info-area").classList.add("hidden");
        document.getElementById("already-done").classList.remove("hidden");
    }
};
function startTimer() {
    const timerDisplay = document.getElementById("timer");
    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        
        timerDisplay.innerText = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Hết giờ làm bài! Hệ thống sẽ tự động nộp bài của bạn.");
            submitToFirebase(); // Tự động nộp
        }
        timeLeft--;
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
    document.getElementById("user-info-area").classList.add("hidden");
    document.getElementById("question-area").classList.remove("hidden");
    startTimer();
    fetch('data.json?v=1.0.1')
        .then(res => res.json())
        .then(data => {
            let shuffledQuestions = shuffle(data);
            quizData = shuffledQuestions.slice(0, 20);
            quizData.forEach(q => {
                q.shuffledOptions = shuffle([...q.options]);
            });
            loadQuestion();
        })
        .catch(err => {
            console.error("Lỗi tải dữ liệu:", err);
            alert("Có lỗi xảy ra. Vui lòng báo lại quản trị viên và thử lại sau!");
        });
}

function loadQuestion() {
    const currentQuiz = quizData[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    document.getElementById("progress-bar").style.width = progress + "%";

    document.getElementById("question-text").innerHTML = 
       // `<small style="color:gray">Mã: ${currentQuiz.id}</small><br>` + 
        `Câu ${currentQuestionIndex + 1}/${quizData.length}: ${currentQuiz.question}`;
    
    const container = document.getElementById("options-container");
    container.innerHTML = "";

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
        container.appendChild(btn);
    });

    document.getElementById("prev-btn").disabled = (currentQuestionIndex === 0);
    if (currentQuestionIndex === quizData.length - 1) {
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
    if (confirm(`Bạn đã làm ${answeredCount}/${quizData.length} câu. Chắc chắn nộp bài?`)) {
        submitToFirebase();
    }
}
function submitToFirebase() {
    // Dừng bộ đếm ngay khi bắt đầu nộp
    clearInterval(timerInterval);
    
    // Hiện BlockUI
    document.getElementById("block-ui").classList.remove("hidden");

    const details = Object.keys(userResponses).map(id => ({
        id: id,
        answer: userResponses[id]
    }));

    database.ref('submissions').push({
        ...userData,
        timestamp: new Date().toISOString(),
        details: details
    }).then(() => {
        database.goOffline(); 
        localStorage.setItem('quiz_completed', 'true');
        
        // Ẩn BlockUI và chuyển màn hình kết quả
        document.getElementById("block-ui").classList.add("hidden");
        document.getElementById("question-area").classList.add("hidden");
        document.getElementById("result-area").classList.remove("hidden");
    }).catch(err => {
        console.error(err);
        // Nếu lỗi, ẩn BlockUI để người dùng có thể thử lại
        document.getElementById("block-ui").classList.add("hidden");
        alert("Lỗi kết nối! Vui lòng kiểm tra lại mạng và bấm nộp lại.");
        
        // Nếu muốn cho phép đếm tiếp khi lỗi mạng (tùy chọn)
        // startTimer(); 
    });
}
//     function submitToFirebase() {
//     const details = Object.keys(userResponses).map(id => ({
//         id: id,
//         answer: userResponses[id]
//     }));

//     database.ref('submissions').push({
//         ...userData,
//         timestamp: new Date().toISOString(),
//         details: details
//     }).then(() => {
//         database.goOffline(); 
//         localStorage.setItem('quiz_completed', 'true');
//         document.getElementById("question-area").classList.add("hidden");
//         document.getElementById("result-area").classList.remove("hidden");
//     }).catch(err => {
//         console.error(err);
//         alert("Lỗi kết nối hoặc bảo mật! Vui lòng kiểm tra lại mạng.");
//     });
// }