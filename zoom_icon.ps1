Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\PC\.gemini\antigravity\brain\6389b609-7b20-4da3-9ffa-3f3e8b893e56\couple_finance_cute_heart_piggy_v1_1770903223255.png"
$outputPath = "d:\workspace\couple-finance\public\logo.png"

$img = [System.Drawing.Image]::FromFile($srcPath)
$w = $img.Width
$h = $img.Height

# 목표: 텍스트를 제외하고 돼지 캐릭터를 상하좌우 여백이 균형 잡히게 정중앙에 배치
# 1024x1024 기준으로 텍스트 위쪽 영역에서 돼지의 중심을 찾습니다.
# 대략적인 돼지의 영역: 가로 200~824, 세로 100~800 (예상)
# 800x800 크기로 잘라내되, 세로 시작점을 조절하여 텍스트는 안 나오게 하고 위아래 여백을 맞춥니다.

$cropSize = 820
$startX = [int](($w - $cropSize) / 2)
# startY를 약 30으로 설정하면 하단 텍스트(대략 850 이후)를 피하면서 
# 상단 동전(대략 100 부근)과 돼지 몸체 사이의 여백을 맞출 수 있습니다.
$startY = 35 

$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$graphics.Clear([System.Drawing.Color]::White)

$destRect = New-Object System.Drawing.Rectangle(0, 0, 1024, 1024)
$srcRect = New-Object System.Drawing.Rectangle($startX, $startY, $cropSize, $cropSize)

$graphics.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

# 모든 아이콘 파일 동기화
$bmp.Save("d:\workspace\couple-finance\public\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("d:\workspace\couple-finance\public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("d:\workspace\couple-finance\public\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)

$graphics.Dispose()
$bmp.Dispose()
$img.Dispose()

Write-Output "여백의 균형을 맞춰 돼지 캐릭터를 정중앙에 배치했습니다."
