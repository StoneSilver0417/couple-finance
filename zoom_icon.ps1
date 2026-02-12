Add-Type -AssemblyName System.Drawing

# 원본 이미지 경로 (Gemini가 생성한 원본)
$srcPath = "C:\Users\PC\.gemini\antigravity\brain\6389b609-7b20-4da3-9ffa-3f3e8b893e56\couple_finance_cute_heart_piggy_v1_1770903223255.png"
$outputPath = "d:\workspace\couple-finance\public\logo.png"

$img = [System.Drawing.Image]::FromFile($srcPath)
$w = $img.Width
$h = $img.Height

# 돼지 저금통 캐릭터가 중앙~약간 상단에 위치함. 
# 하단 텍스트 "Couple Finance"를 완전히 제외하기 위해 상단 70% 영역만 타겟팅.
# 가로(X): 중앙 70%, 세로(Y): 상단 70%
$cropW = [int]($w * 0.70)
$cropH = [int]($h * 0.70)
$startX = [int](($w - $cropW) / 2)
$startY = [int]($h * 0.05) 

$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$graphics.Clear([System.Drawing.Color]::White)

# 잘라낸 영역을 1024x1024 캔버스에 꽉 차게 그리기
$destRect = New-Object System.Drawing.Rectangle(0, 0, 1024, 1024)
$srcRect = New-Object System.Drawing.Rectangle($startX, $startY, $cropW, $cropH)

$graphics.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

# 다른 아이콘 파일들도 동일하게 업데이트
$bmp.Save("d:\workspace\couple-finance\public\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("d:\workspace\couple-finance\public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("d:\workspace\couple-finance\public\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)

$graphics.Dispose()
$bmp.Dispose()
$img.Dispose()

Write-Output "Successfully updated all icons with zoomed piggy (text removed)."
