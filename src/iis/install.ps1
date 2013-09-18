param([string]$name, [string]$installDir, [string]$hostname, [string]$port, [string]$extraDir)

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $installDir
Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $extraDir

Install-IisWebsite -Name $name -p $installDir -bindings "http/*:$($port):$($hostname)"