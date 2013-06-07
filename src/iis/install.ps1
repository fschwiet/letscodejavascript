param([string]$installDir, [string]$uploadDir, [string]$hostpattern = "*", [string]$port = 80)

$name = "letscodejavascript ($hostpattern)"

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $installDir
Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $uploadDir

Install-IisWebsite -Name $name -p $installDir -bindings "http/$($hostpattern):$($port):"