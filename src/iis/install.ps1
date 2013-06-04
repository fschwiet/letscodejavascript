param([string]$installDir, [string]$uploadDir)

$installDir = (get-item .).fullname
$rootDir = (get-item .).parent.fullname
$uploadsDir = $installDir.fullname + ".uploads"

if (-not (get-module carbo[n])) {
    throw "Install carbon first"
}

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $installDir
Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $uploadsDir

Install-IisWebsite -Name letscodejavascript -p $installDir -bindings "http/*:80:"