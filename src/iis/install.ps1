
$installDir = (get-item .).fullname
$rootDir = (get-item .).parent.fullname

if (-not (get-module carbo[n])) {
    throw "Install carbon first"
}

import-module carbon

Grant-Permission -Identity "IIS_IUSRS" -Permission Modify -Path $rootDir

Install-IisWebsite -Name letscodejavascript -p $installDir -bindings "http/*:80:"