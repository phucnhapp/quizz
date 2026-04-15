// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBB4GqaDVw8k3mLjJA_szhIWmgjSlIgnQ8",
  authDomain: "quizz-92f17.firebaseapp.com",
  projectId: "quizz-92f17",
  storageBucket: "quizz-92f17.appspot.com",
  databaseURL: "https://quizz-92f17-default-rtdb.asia-southeast1.firebasedatabase.app",
  messagingSenderId: "19153769746",
  appId: "1:19153769746:web:aff9dba03fc4daeac00fcb"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 2. App Check (reCAPTCHA v3)
const appCheck = firebase.appCheck();
appCheck.activate('6LfR37YsAAAAANt6q2YUB96iBm1s6X8Pn1jvdkgb', true);
const database = firebase.database();

// 3. Khởi tạo biến
let quizData = [];
let currentQuestionIndex = 0;
let userResponses = {}; // Lưu dưới dạng Object { "Q001": "Đáp án A" }

// Hàm trộn mảng
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.onload = function() {
    // Kiểm tra xem đã thi chưa
    if (localStorage.getItem('quiz_completed') === 'false') {
        document.getElementById("question-area").classList.add("hidden");
        document.getElementById("already-done").classList.remove("hidden");
        return;
    }

    // Nạp dữ liệu từ file JSON
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            quizData = shuffle(data); // Trộn thứ tự câu hỏi
            // Trộn sẵn đáp án cho mỗi câu để không bị thay đổi khi quay lại
            quizData.forEach(q => q.shuffledOptions = shuffle([...q.options]));
            loadQuestion();
        })
        .catch(err => {
            console.error("Lỗi nạp JSON:", err);
            document.getElementById("question-text").innerText = "Lỗi nạp câu hỏi!";
        });
};

function loadQuestion() {
    const currentQuiz = quizData[currentQuestionIndex];
    
    // Cập nhật thanh tiến trình
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    document.getElementById("progress-bar").style.width = progress + "%";

    // Hiển thị câu hỏi
    document.getElementById("question-text").innerHTML = 
        `<small style="color:var(--secondary-color)">Mã: ${currentQuiz.id}</small><br>` + 
        `Câu ${currentQuestionIndex + 1}/${quizData.length}: ${currentQuiz.question}`;
    
    // Hiển thị đáp án
    const container = document.getElementById("options-container");
    container.innerHTML = "";

    currentQuiz.shuffledOptions.forEach(option => {
        const btn = document.createElement("button");
        btn.innerText = option;
        btn.classList.add("option");
        
        // Nếu đã chọn rồi thì highlight lại
        if (userResponses[currentQuiz.id] === option) {
            btn.classList.add("selected");
        }

        btn.onclick = () => {
            userResponses[currentQuiz.id] = option; // Lưu lựa chọn
            // Reset màu các nút khác và highlight nút vừa chọn
            document.querySelectorAll(".option").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
        };
        container.appendChild(btn);
    });

    // Cập nhật các nút điều hướng
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
    const totalAns = Object.keys(userResponses).length;
    let msg = `Bạn đã làm ${totalAns}/${quizData.length} câu. Bạn có chắc chắn muốn nộp bài?`;
    
    if (confirm(msg)) {
        submitToFirebase();
    }
}

function submitToFirebase() {
    const playerName = prompt("Nhập họ tên đầy đủ để nộp bài:");
    if (!playerName) return;

    // Chuyển Object về mảng để lưu trữ chuyên nghiệp
    const finalData = Object.keys(userResponses).map(key => ({
        id: key,
        answer: userResponses[key]
    }));

    database.ref('submissions').push({
        user: playerName,
        timestamp: new Date().toISOString(),
        details: finalData
    }).then(() => {
        localStorage.setItem('quiz_completed', 'true'); // Khóa thi lại
        document.getElementById("question-area").classList.add("hidden");
        document.getElementById("result-area").classList.remove("hidden");
    }).catch(err => {
        alert("Lỗi nộp bài! Kiểm tra kết nối hoặc App Check.");
        console.error(err);
    });
}