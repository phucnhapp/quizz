<?php
header('Content-Type: application/json');

// Cấu hình Database
$host = 'localhost';
$db   = 'lns';
$user = 'root'; // Thay bằng user của bạn
$pass = '';     // Thay bằng pass của bạn

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Lấy dữ liệu JSON từ body request
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if ($data) {
        $sql = "INSERT INTO submissions 
                (name, org, phone, start_time, end_time, total_quiz_time_ms, essay_answer, responses_json) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['name'],
            $data['org'],
            $data['phone'],
            $data['start_time'],
            $data['end_time'],
            $data['total_quiz_time_ms'],
            $data['essay_answer'],
            json_encode($data['details'], JSON_UNESCAPED_UNICODE)
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Lưu dữ liệu thành công']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Dữ liệu không hợp lệ']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>