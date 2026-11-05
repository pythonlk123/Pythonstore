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
    if (isset($_FILES['sticker']) && $_FILES['sticker']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['sticker']['tmp_name'];
        $fileName = $_FILES['sticker']['name'];
        $fileSize = $_FILES['sticker']['size'];
        $fileType = $_FILES['sticker']['type'];
        
        // 5MB Max File Size limit
        if ($fileSize > 5 * 1024 * 1024) {
            echo json_encode(['status' => 'error', 'message' => 'File size exceeds 5MB limit.']);
            exit;
        }

        // Validate file extension
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        if (in_array($fileExtension, $allowedExtensions)) {
            // Validate MIME type to prevent malicious uploads
            $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            $detectedMimeType = mime_content_type($fileTmpPath);
            
            if (!in_array($detectedMimeType, $allowedMimeTypes)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only standard images are allowed.']);
                exit;
            }

            // Define upload folder path
            $uploadFileDir = './uploads/';
            if (!is_dir($uploadFileDir)) {
                mkdir($uploadFileDir, 0755, true);
            }
            
            // Generate a unique name for the file to prevent conflicts
            $newFileName = uniqid('sticker_', true) . '.' . $fileExtension;
            $dest_path = $uploadFileDir . $newFileName;
            
            if (move_uploaded_file($fileTmpPath, $dest_path)) {
                // Construct the full URL
                $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
                $host = $_SERVER['HTTP_HOST'];
                $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
                $scriptDir = ($scriptDir === '/' || $scriptDir === '\\') ? '' : $scriptDir;
                $fileUrl = $protocol . $host . $scriptDir . '/uploads/' . $newFileName;
                
                echo json_encode([
                    'status' => 'success',
                    'url' => 'uploads/' . $newFileName,
                    'full_url' => $fileUrl
                ]);
                exit;
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to save the file on the server. Check folder permissions.']);
                exit;
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid file extension. Allowed: ' . implode(', ', $allowedExtensions)]);
            exit;
        }
    } else {
        $errorCode = isset($_FILES['sticker']) ? $_FILES['sticker']['error'] : 'no_file';
        echo json_encode(['status' => 'error', 'message' => 'No file uploaded or upload error: ' . $errorCode]);
        exit;
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}
?>
