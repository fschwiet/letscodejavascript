param([string]$installDir, [string]$port, [string]$uploadDir, [string]$logDir)

$name = "letscodejavascript"

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $installDir
Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $uploadDir
Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $logDir

Install-IisWebsite -Name $name -p $installDir -bindings "http/*:$($port):"