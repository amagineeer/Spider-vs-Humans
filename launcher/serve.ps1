# Spider vs Humans — запуск игры на этом компьютере без установки чего-либо.
# Его вызывает «Запустить игру.bat»: скрипт поднимает маленький веб-сервер, доступный только с этого компьютера
# (http://localhost:8765/), открывает игру в браузере по умолчанию и работает, пока открыто окно.
# Сервер нужен, потому что из файла (file://) браузер не загружает модули игры.
# Работает в Windows PowerShell 2.0–5.1 (встроен в Windows 7–11) и в PowerShell 7 (Windows, macOS, Linux).
# Для проверок: SVH_PORT — основной порт (8765), SVH_NO_BROWSER=1 — не открывать браузер,
# SVH_NO_PAUSE=1 — не ждать Enter после сообщения об ошибке.

$ErrorActionPreference = 'Stop'
try { $Host.UI.RawUI.WindowTitle = 'Spider vs Humans' } catch {}

function Stop-WithMessage([string]$text) {
  Write-Host ''
  Write-Host $text -ForegroundColor Yellow
  Write-Host ''
  if (-not $env:SVH_NO_PAUSE) { try { [void](Read-Host '  Нажмите Enter, чтобы закрыть окно') } catch {} }
  exit 3
}

# Папка игры — на уровень выше папки launcher.
$sep = [string][IO.Path]::DirectorySeparatorChar
$root = [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..'))
if (-not $root.EndsWith($sep)) { $root += $sep }
if (-not [IO.File]::Exists($root + 'index.html')) {
  Stop-WithMessage ("  Не найден index.html в папке игры.`n" +
    "  Распакуйте архив целиком (правой кнопкой по архиву -> «Извлечь все»)`n" +
    "  и запустите «Запустить игру.bat» из распакованной папки.")
}

$primary = 8765
if ($env:SVH_PORT) { $primary = [int]$env:SVH_PORT }

# Прогресс игры привязан к адресу вместе с портом, поэтому второй запуск не поднимает новый сервер,
# а открывает уже запущенную игру.
function Test-RunningGame([int]$port) {
  try {
    $request = [Net.WebRequest]::Create("http://localhost:$port/index.html")
    $request.Proxy = $null
    $request.Timeout = 1500
    $response = $request.GetResponse()
    try { $html = (New-Object IO.StreamReader($response.GetResponseStream())).ReadToEnd() } finally { $response.Close() }
    return $html.Contains('<title>Spider vs Humans</title>')
  } catch { return $false }
}

$listener = $null
$port = 0
foreach ($candidate in (@($primary) + (($primary + 1)..($primary + 10)))) {
  $attempt = New-Object Net.HttpListener
  $attempt.Prefixes.Add("http://localhost:$candidate/")
  try {
    $attempt.Start()
    $listener = $attempt
    $port = $candidate
    break
  } catch {
    try { $attempt.Close() } catch {}
    if ($candidate -eq $primary -and (Test-RunningGame $candidate)) {
      Write-Host ''
      Write-Host '  Игра уже запущена в другом окне — открываю её в браузере.' -ForegroundColor Green
      if (-not $env:SVH_NO_BROWSER) { try { Start-Process "http://localhost:$candidate/" } catch {} }
      Start-Sleep -Seconds 3
      exit 0
    }
  }
}
if (-not $listener) {
  Stop-WithMessage ("  Не удалось открыть порт для игры ($primary–$($primary + 10)).`n" +
    "  Закройте другие окна с игрой или локальные серверы и попробуйте ещё раз.")
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.txt' = 'text/plain; charset=utf-8'; '.vtt' = 'text/vtt; charset=utf-8'
  '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.gif' = 'image/gif'; '.webp' = 'image/webp'; '.avif' = 'image/avif'; '.ico' = 'image/x-icon'
  '.mp4' = 'video/mp4'; '.webm' = 'video/webm'; '.mp3' = 'audio/mpeg'; '.ogg' = 'audio/ogg'
  '.opus' = 'audio/ogg'; '.wav' = 'audio/wav'; '.m4a' = 'audio/mp4'
  '.woff' = 'font/woff'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'; '.otf' = 'font/otf'
  '.wasm' = 'application/wasm'
}

# Один запрос. Выполняется в пуле потоков, чтобы долгая загрузка ролика не задерживала остальные файлы.
# Поддерживает Range (нужен браузерам для видео), отдаёт только файлы внутри папки игры.
$handler = {
  param($ctx, $root, $mime)
  $res = $ctx.Response
  try {
    $req = $ctx.Request
    $res.AddHeader('Cache-Control', 'no-cache')
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path.EndsWith('/')) { $path += 'index.html' }
    $full = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $path.TrimStart('/').Replace('/', [string][IO.Path]::DirectorySeparatorChar)))
    if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not [IO.File]::Exists($full)) {
      $body = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $res.StatusCode = 404
      $res.ContentType = 'text/plain; charset=utf-8'
      $res.ContentLength64 = $body.Length
      $res.OutputStream.Write($body, 0, $body.Length)
      return
    }
    $type = $mime[[IO.Path]::GetExtension($full).ToLowerInvariant()]
    if (-not $type) { $type = 'application/octet-stream' }
    $res.ContentType = $type
    $res.AddHeader('Accept-Ranges', 'bytes')
    $fs = [IO.File]::Open($full, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
    try {
      $len = $fs.Length
      $start = [int64]0
      $end = $len - 1
      $range = $req.Headers['Range']
      if ($range -and $range -match '^bytes=(\d*)-(\d*)$') {
        if ($matches[1] -ne '') {
          $start = [int64]$matches[1]
          if ($matches[2] -ne '') { $end = [Math]::Min([int64]$matches[2], $len - 1) }
        } elseif ($matches[2] -ne '') {
          $start = [Math]::Max([int64]0, $len - [int64]$matches[2])
        }
        if ($start -ge $len -or $start -gt $end) {
          $res.StatusCode = 416
          $res.AddHeader('Content-Range', "bytes */$len")
          $res.ContentLength64 = 0
          return
        }
        $res.StatusCode = 206
        $res.AddHeader('Content-Range', "bytes $start-$end/$len")
      }
      $count = $end - $start + 1
      $res.ContentLength64 = $count
      if ($req.HttpMethod -eq 'HEAD') { return }
      [void]$fs.Seek($start, [IO.SeekOrigin]::Begin)
      $buf = [Array]::CreateInstance([byte], 65536)
      $out = $res.OutputStream
      while ($count -gt 0) {
        $n = $fs.Read($buf, 0, [int][Math]::Min([int64]$buf.Length, $count))
        if ($n -le 0) { break }
        $out.Write($buf, 0, $n)
        $count -= $n
      }
    } finally { $fs.Close() }
  } catch {
    try { $res.StatusCode = 500 } catch {}
  } finally {
    try { $res.Close() } catch {}
  }
}

$pool = [RunspaceFactory]::CreateRunspacePool(1, 12)
$pool.Open()
$jobs = New-Object Collections.ArrayList
function Clear-Finished {
  for ($k = $jobs.Count - 1; $k -ge 0; $k--) {
    $job = $jobs[$k]
    if ($job.Handle.IsCompleted) {
      try { [void]$job.Shell.EndInvoke($job.Handle) } catch {}
      $job.Shell.Dispose()
      $jobs.RemoveAt($k)
    }
  }
}

$url = "http://localhost:$port/"
Write-Host ''
Write-Host '  Spider vs Humans запущена.' -ForegroundColor Green
Write-Host "  Адрес игры: $url"
if ($port -ne $primary) {
  Write-Host "  Порт $primary занят, поэтому игра открыта на порту $port; прогресс на нём сохраняется отдельно." -ForegroundColor DarkYellow
}
Write-Host ''
Write-Host '  Не закрывайте это окно, пока играете.'
Write-Host '  Чтобы выключить игру, просто закройте его.'
Write-Host ''
if (-not $env:SVH_NO_BROWSER) {
  try { Start-Process $url } catch { Write-Host '  Откройте адрес игры в браузере вручную.' -ForegroundColor Yellow }
}

try {
  while ($listener.IsListening) {
    $async = $listener.BeginGetContext($null, $null)
    while (-not $async.AsyncWaitHandle.WaitOne(250)) { Clear-Finished }
    $ctx = $listener.EndGetContext($async)
    $shell = [PowerShell]::Create()
    $shell.RunspacePool = $pool
    [void]$shell.AddScript($handler).AddArgument($ctx).AddArgument($root).AddArgument($mime)
    [void]$jobs.Add(@{ Shell = $shell; Handle = $shell.BeginInvoke() })
    Clear-Finished
  }
} catch {
  Stop-WithMessage ("  Сервер игры остановился из-за ошибки:`n  " + $_.Exception.Message)
} finally {
  try { $listener.Close() } catch {}
  try { $pool.Close() } catch {}
}
