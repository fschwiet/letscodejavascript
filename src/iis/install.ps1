param([string]$name, [string]$installDir, [string]$hostname, [string]$port)

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $installDir

Install-IisWebsite -Name $name -p $installDir -bindings "http/*:$($port):$($hostname)"