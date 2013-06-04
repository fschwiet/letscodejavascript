param([string]$installDir, [string]$uploadDir, [string]$hostpattern = "*")

$name = "letscodejavascript ($hostpattern)"

$installDir = (get-item .).fullname
$rootDir = (get-item .).parent.fullname
$uploadsDir = $installDir.fullname + ".uploads"

if (-not (get-module carbo[n])) {
    throw "Install carbon first"
}

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $installDir
Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $uploadsDir

Install-IisWebsite -Name $name -p $installDir -bindings "http/$hostpattern:80:"