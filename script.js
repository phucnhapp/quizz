// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyBB4GqaDVw8k3mLjJA_szhIWmgjSlIgnQ8",
  authDomain: "https://quizz-92f17-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quizz-92f17",
  storageBucket: "https://quizz-92f17-default-rtdb.asia-southeast1.firebasedatabase.app",
  databaseURL: "https://quizz-92f17-default-rtdb.asia-southeast1.firebasedatabase.app",
  messagingSenderId: "19153769746",
  appId: "1:19153769746:web:aff9dba03fc4daeac00fcb",
  measurementId: "G-NJ1VZ5PL25"
};

// Khởi tạo Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
        const appCheck = firebase.appCheck();
// Sử dụng reCAPTCHA v3
appCheck.activate(
    '6LfR37YsAAAAANt6q2YUB96iBm1s6X8Pn1jvdkgb', // Dán Site Key bạn vừa lấy từ Google reCAPTCHA vào đây
    true // Tự động làm mới Token
);
}
const database = firebase.database();

// 1. Dữ liệu câu hỏi
const quizData = [
    {
        question: "1 + 1 bằng mấy?",
        options: ["1", "2", "3", "4"],
        correct: 1
    },
    {
        question: "Thủ đô của Việt Nam là gì?",
        options: ["Hà Nội", "Đà Nẵng", "TP.HCM", "Huế"],
        correct: 0
    },
    {
        question: "Ngôn ngữ nào là linh hồn của web?",
        options: ["Python", "PHP", "JavaScript", "Java"],
        correct: 2
    }
];

let currentQuestionIndex = 0;
let score = 0;

// 2. Chờ HTML tải xong mới chạy code
window.onload = function() {
    loadQuestion();
};

function loadQuestion() {
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");

    if (!questionText || !optionsContainer) return; // Kiểm tra lỗi thiếu ID trong HTML

    const currentQuiz = quizData[currentQuestionIndex];
    
    // Hiển thị câu hỏi
    questionText.innerText = `Câu ${currentQuestionIndex + 1}: ${currentQuiz.question}`;
    
    // Xóa và tạo lại các nút chọn
    optionsContainer.innerHTML = "";
    currentQuiz.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("option");
        button.onclick = () => checkAnswer(index);
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedIndex) {
    if (selectedIndex === quizData[currentQuestionIndex].correct) {
        score++;
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById("question-area").classList.add("hidden");
    const resultArea = document.getElementById("result-area");
    resultArea.classList.remove("hidden");
    
    document.getElementById("result").innerText = `Điểm của bạn: ${score}/${quizData.length}`;

    // Lưu điểm lên Firebase
    const playerName = prompt("Nhập tên bạn để lưu vào bảng xếp hạng:");
    if (playerName) {
        database.ref('leaderboard').push({
            name: playerName,
            score: score,
            time: new Date().toLocaleString()
        }).then(() => {
            alert("Đã lưu điểm!");
            showLeaderboard();
        });
    }
}

function showLeaderboard() {
    const leaderboardRef = database.ref('leaderboard').orderByChild('score').limitToLast(10);
    leaderboardRef.once('value', (snapshot) => {
        const data = snapshot.val();
        let html = "<h3>Top 10 người giỏi nhất:</h3><ul>";
        const list = [];
        for (let key in data) list.push(data[key]);
        
        list.sort((a, b) => b.score - a.score).forEach(item => {
            html += `<li><strong>${item.name}</strong>: ${item.score} điểm</li>`;
        });
        html += "</ul>";
        document.getElementById("result-area").innerHTML += html;
    });
}