<?php
// Enable CORS for frontend requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read raw POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $customerEmail = isset($data['email']) ? trim($data['email']) : '';
    $subject = isset($data['subject']) ? trim($data['subject']) : '';
    $message = isset($data['message']) ? trim($data['message']) : '';

    // Validate input data
    if (empty($customerEmail) || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'කරුණාකර වලංගු Email ලිපිනයක් ඇතුළත් කරන්න. (Please enter a valid email address.)']);
        exit;
    }

    if (empty($message)) {
        echo json_encode(['status' => 'error', 'message' => 'කරුණාකර පණිවිඩය ඇතුළත් කරන්න. (Please enter your message.)']);
        exit;
    }

    $to = "pythonstore2008@gmail.com";
    $emailSubject = "Python Store - Web Message: " . (empty($subject) ? "Inquiry" : $subject);

    // Email Body construction
    $emailBody = "You received a new message from Python Store contact form:\n\n";
    $emailBody .= "----------------------------------------\n";
    $emailBody .= "From Email: " . $customerEmail . "\n";
    $emailBody .= "Subject: " . $subject . "\n";
    $emailBody .= "Date: " . date("Y-m-d H:i:s") . "\n";
    $emailBody .= "----------------------------------------\n\n";
    $emailBody .= "Message:\n" . $message . "\n\n";
    $emailBody .= "----------------------------------------\n";
    $emailBody .= "You can reply directly to this email to contact the customer.";

    // Headers
    // Using a system email for From header to ensure delivery, and Reply-To for customer replies
    $headers = "From: noreply@pythonstore.com\r\n";
    $headers .= "Reply-To: " . $customerEmail . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    if (mail($to, $emailSubject, $emailBody, $headers)) {
        echo json_encode(['status' => 'success', 'message' => 'පණිවිඩය සාර්ථකව යවන ලදී! (Message sent successfully!)']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'පණිවිඩය යැවීමට නොහැකි විය. Server එකෙහි mail configuration පරීක්ෂා කරන්න. (Failed to send message. Please check server mail configuration.)']);
    }
    exit;
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}
?>
