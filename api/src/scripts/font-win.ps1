Param(
  [string]$fontPath
)

if (-Not $fontPath) {
  Write-Host "Font path is required"
  exit 1
}

Copy-Item $fontPath -Destination "C:\Windows\Fonts\"

Write-Host "Font installed successfully!"
