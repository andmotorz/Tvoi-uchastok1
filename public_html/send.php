<?php
// ===== НАСТРОЙКИ =====
const BOT_TOKEN    = '8869241144:AAFxYXYJQtfGNXkdkzA2lnfNamqPE7Y3Fcg';   // токен бота от @BotFather
const CHAT_ID      = '7417411727';   // id вашего чата или группы
const EMAIL_TO     = '';   // необязательно: дублировать заявку на email
const ALLOWED_HOST = '';   // например 'tvoyuchastok.by' (пусто = не проверять)
// =====================
header('Content-Type: text/plain; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit('method'); }
$d = json_decode(file_get_contents('php://input'), true);
if (!is_array($d)) { http_response_code(400); exit('bad'); }
if (!empty($d['website'])) exit('ok'); // ловушка для ботов
if (ALLOWED_HOST !== '') {
  $h = parse_url($_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? ''), PHP_URL_HOST);
  if ($h !== ALLOWED_HOST && $h !== 'www.' . ALLOWED_HOST) { http_response_code(403); exit('forbidden'); }
}
$name  = mb_substr(trim($d['name'] ?? ''), 0, 80);
$phone = mb_substr(trim($d['phone'] ?? ''), 0, 40);
if (mb_strlen($name) < 2 || strlen(preg_replace('/\D/', '', $phone)) < 9) { http_response_code(422); exit('invalid'); }
// защита от флуда: не чаще 1 заявки в 20 секунд с одного IP
$lock = sys_get_temp_dir() . '/lead_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
if (is_file($lock) && time() - filemtime($lock) < 20) { http_response_code(429); exit('wait'); }
@touch($lock);
function e($s) { return htmlspecialchars(mb_substr((string)$s, 0, 600), ENT_NOQUOTES, 'UTF-8'); }
$text = "🔔 <b>Новая заявка с сайта</b>\n👤 " . e($name) . "\n📞 " . e($phone) . "\n"
      . (!empty($d['note']) ? "🧾 " . e($d['note']) . "\n" : '') . "🌐 " . e($d['source'] ?? '');
$ok = false;
if (BOT_TOKEN !== '' && CHAT_ID !== '' && function_exists('curl_init')) {
  $ch = curl_init('https://api.telegram.org/bot' . BOT_TOKEN . '/sendMessage');
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
    CURLOPT_POSTFIELDS => http_build_query(['chat_id' => CHAT_ID, 'text' => $text, 'parse_mode' => 'HTML'])]);
  $res = curl_exec($ch); $ok = ($res !== false && curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200); curl_close($ch);
}
if (EMAIL_TO !== '') {
  $ok = @mail(EMAIL_TO, '=?UTF-8?B?' . base64_encode('Новая заявка с сайта') . '?=', strip_tags($text), "Content-Type: text/plain; charset=utf-8") || $ok;
}
if (!$ok) { http_response_code(502); exit('fail'); }
exit('ok');
