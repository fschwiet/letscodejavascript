param([string]$installDir, [string]$uploadDir, [string]$hostpattern = "*")

$name = "letscodejavascript ($hostpattern)"

$rootDir = (get-item $installDir).parent.fullname

if (-not (get-module -listavailable | select-string carbon)) {
    throw "Install carbon first"
}

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $installDir
Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $uploadsDir

Install-IisWebsite -Name $name -p $installDir -bindings "http/$hostpattern:80:"