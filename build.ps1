# 打包两个付费交付物：
#   dist/RedactLocal-Pro-v1.0.0.zip      英文版（$29）
#   dist/RedactLocal-CN-Pro-v1.0.0.zip   国内版（¥129）
# 用法：powershell -ExecutionPolicy Bypass -File build.ps1
#       或先 node build-cn.js 再执行本脚本

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$ver  = "1.0.0"
$dist = Join-Path $root "dist"

New-Item -ItemType Directory -Force -Path $dist | Out-Null

function Build-Zip {
  param($StageName, $SourceHtml, $ReadmeText, $ZipName)
  $stage = Join-Path $dist "stage-$StageName"
  if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $stage | Out-Null
  Copy-Item $SourceHtml (Join-Path $stage "index.html")
  $ReadmeText | Set-Content (Join-Path $stage "先读我.txt") -Encoding UTF8
  $zip = Join-Path $dist $ZipName
  if (Test-Path $zip) { Remove-Item $zip -Force }
  Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -CompressionLevel Optimal
  Remove-Item $stage -Recurse -Force
  Write-Host ("Built: {0}  ({1:N0} KB)" -f $zip, ((Get-Item $zip).Length / 1KB))
}

# ---------- 英文版 ----------
$enReadme = @"
RedactLocal Pro v$ver
=====================

Thank you for buying RedactLocal Pro.

HOW TO USE (30 seconds, no install)
-----------------------------------
1. Unzip this folder somewhere permanent.
2. Double-click index.html — it opens in Chrome, Edge, Firefox or Safari.
3. Paste text, or drag CSV/TXT files onto the "Batch files" tab.
4. When asked for a license key, paste the key from your purchase email.
   It is verified offline. Once activated it is remembered on this machine.

The file works with no internet connection. Nothing is uploaded, ever.
Optional: drag index.html to your bookmarks bar for one-click access.

WHAT PRO UNLOCKS
----------------
- Unlimited text length (Free is capped at 5,000 characters)
- Unlimited batch files (CSV / TXT / TSV / MD / JSON / LOG)
- Custom regex rules
- Restore panel + mapping CSV export

LICENSE
-------
One license covers one person. Team licenses cover up to 10 people
in one organisation. Commercial use by the licensee is allowed.
Do not redistribute or resell this file.

SUPPORT / REFUNDS
-----------------
Reply to your purchase email. 14-day refund, no questions asked.

Copyright (c) $(Get-Date -Format yyyy) RedactLocal. All rights reserved.
"@
Build-Zip -StageName "en" -SourceHtml (Join-Path $root "index.html") -ReadmeText $enReadme -ZipName "RedactLocal-Pro-v$ver.zip"

# ---------- 国内版 ----------
$cnHtml = Join-Path $root "cn\index.html"
if (-not (Test-Path $cnHtml)) {
  Write-Host "cn\index.html 不存在，正在运行 node build-cn.js ..."
  Push-Location $root
  node build-cn.js
  Pop-Location
}

$cnReadme = @"
RedactLocal 专业版 v$ver
=======================

感谢购买。整个过程不需要安装，不需要联网。

怎么用（30 秒）
---------------
1. 把这个文件夹解压到固定的位置（别放在下载目录，容易被清理）。
2. 双击 index.html，用 Chrome / Edge / 火狐 打开。
3. 粘贴文本即可脱敏；批量处理把 CSV / TXT 拖到「批量文件」标签页。
4. 第一次会提示输入授权码：粘贴微信发给你的那串 RL-XXXX-XXXX-XXXX。
   授权码在本机离线校验，激活一次即可，之后自动记住。

这个文件断网也能用，全程不上传任何内容。
小技巧：把 index.html 拖到浏览器书签栏，以后一点就开。

专业版包含
----------
- 文本长度不限（免费版 5000 字符）
- 批量文件不限个数（CSV / TXT / TSV / MD / JSON / LOG）
- 自定义正则规则
- 还原面板 + 映射表 CSV 导出

授权说明
--------
一份授权限一人使用；团队版限 5 台设备，可在公司内部商用。
请勿转售或公开分享，泄露后可能被他人激活。

售后
----
微信直接找我就行。7 天内不满意，无条件全额退款。

Copyright (c) $(Get-Date -Format yyyy) RedactLocal
"@
Build-Zip -StageName "cn" -SourceHtml $cnHtml -ReadmeText $cnReadme -ZipName "RedactLocal-CN-Pro-v$ver.zip"

Write-Host ""
Write-Host "完成。两个包都在 dist\ 目录。"
