<?php
require __DIR__ . '/auth.php';

function hsj_deny()
{
    http_response_code(401);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo "ログインが必要です\n";
    exit;
}

function hsj_miss()
{
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo "見つかりません\n";
    exit;
}

function hsj_content_type($path)
{
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $map = array(
        'html' => 'text/html; charset=UTF-8',
        'css' => 'text/css; charset=UTF-8',
        'js' => 'application/javascript; charset=UTF-8',
        'mjs' => 'application/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'txt' => 'text/plain; charset=UTF-8',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'webmanifest' => 'application/manifest+json; charset=UTF-8',
        'map' => 'application/json; charset=UTF-8',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
    );
    if (isset($map[$ext])) {
        return $map[$ext];
    }
    return 'application/octet-stream';
}

function hsj_requested_path()
{
    if (isset($_GET['hsj_path']) && !is_array($_GET['hsj_path'])) {
        return (string) $_GET['hsj_path'];
    }
    $uri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '';
    $path = parse_url($uri, PHP_URL_PATH);
    $path = rawurldecode(is_string($path) ? $path : '');
    $base = hsj_cookie_path();
    if ($base !== '/' && strpos($path, $base) === 0) {
        $path = substr($path, strlen($base));
    }
    return ltrim($path, '/');
}

function hsj_resolve($relative)
{
    $relative = str_replace('\\', '/', (string) $relative);
    $relative = rawurldecode($relative);
    if ($relative === '' || strpos($relative, "\0") !== false) {
        return '';
    }
    $parts = explode('/', $relative);
    $safe = array();
    foreach ($parts as $part) {
        if ($part === '' || $part === '.') {
            continue;
        }
        if ($part === '..' || $part[0] === '.') {
            return '';
        }
        $safe[] = $part;
    }
    $relative = implode('/', $safe);
    if ($relative === '') {
        return '';
    }
    if (preg_match('/^(auth|gate|index)\\.php$/', $relative) || substr($relative, -4) === '.php') {
        return '';
    }
    if ($relative === 'index.html') {
        return '';
    }

    $root = realpath(__DIR__);
    if ($root === false) {
        return '';
    }
    $candidate = $root . '/' . $relative;
    if (!is_file($candidate)) {
        return '';
    }
    $real = realpath($candidate);
    if ($real === false || !is_file($real)) {
        return '';
    }
    $prefix = rtrim($root, '/') . '/';
    if (strpos($real, $prefix) !== 0) {
        return '';
    }
    if (substr($real, -4) === '.php' || substr($real, -10) === '.htaccess' || substr($real, -9) === '.user.ini') {
        return '';
    }
    return $real;
}

$hsjRequested = hsj_requested_path();
$hsjPublic = array(
    'manifest.webmanifest' => true,
    'sw.js' => true,
    'icons/icon-192.png' => true,
    'icons/icon-512.png' => true,
);
if (isset($hsjPublic[$hsjRequested])) {
    $publicFile = hsj_resolve($hsjRequested);
    if ($publicFile === '') {
        hsj_miss();
    }
    header('Content-Type: ' . hsj_content_type($publicFile));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: public, max-age=3600');
    readfile($publicFile);
    exit;
}

if (!hsj_logged_in()) {
    hsj_deny();
}

$file = hsj_resolve(hsj_requested_path());
if ($file === '') {
    hsj_miss();
}

$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
header('Content-Type: ' . hsj_content_type($file));
header('X-Content-Type-Options: nosniff');
if ($ext === 'html') {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
} else {
    header('Cache-Control: private, no-cache');
}
readfile($file);
