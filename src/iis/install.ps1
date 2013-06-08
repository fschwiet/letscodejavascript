param([string]$installDir, [string]$uploadDir, [string]$port = 80)

$name = "letscodejavascript ($port)"

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $installDir
Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $uploadDir

Install-IisWebsite -Name $name -p $installDir -bindings "http/*:$($port):"