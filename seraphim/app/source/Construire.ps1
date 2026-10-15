param([string]$OutputName = 'Seraphim.exe')
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
Add-Type -AssemblyName System.Drawing
foreach($premium in @($false,$true)) {
 $premiumLogo=Join-Path $appRoot 'assets\seraphim-logo.png'
 $newLogo=$premium -and (Test-Path -LiteralPath $premiumLogo)
 $logo=[System.Drawing.Bitmap]::new((Join-Path $appRoot $(if($newLogo){'assets\seraphim-logo.png'}elseif($premium){'assets\control-logo-white.png'}else{'assets\control-logo-black.png'})))
 $frames=@()
 try {
  foreach($size in @(16,32,48,64,128,256)) {
   $bitmap=[System.Drawing.Bitmap]::new($size,$size);$g=[System.Drawing.Graphics]::FromImage($bitmap)
   $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias;$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;$g.Clear([System.Drawing.Color]::Transparent);$g.ScaleTransform($size/256.0,$size/256.0)
   $tile=[System.Drawing.Drawing2D.GraphicsPath]::new();$tile.AddArc(4,4,52,52,180,90);$tile.AddArc(200,4,52,52,270,90);$tile.AddArc(200,200,52,52,0,90);$tile.AddArc(4,200,52,52,90,90);$tile.CloseFigure()
   $top=if($premium){[System.Drawing.Color]::FromArgb(70,54,108)}else{[System.Drawing.Color]::White};$bottom=if($premium){[System.Drawing.Color]::FromArgb(15,17,28)}else{[System.Drawing.Color]::FromArgb(236,230,255)}
   $background=[System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Point]::new(0,0),[System.Drawing.Point]::new(256,256),$top,$bottom);$edge=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(172,153,240),2)
   
   if($premium){$g.DrawImage($logo,-9,-9,274,274)}else{$g.DrawImage($logo,-5,-5,266,266)}
   $irisBrush=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::Black);$pupilBrush=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::White);$shine=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
   if(-not $newLogo){$g.FillEllipse($irisBrush,108,104,40,40);$g.FillEllipse($pupilBrush,118,114,20,20);$g.FillEllipse($shine,113,108,9,9)}
   $irisBrush.Dispose();$pupilBrush.Dispose();$shine.Dispose()
   $memory=[System.IO.MemoryStream]::new();$bitmap.Save($memory,[System.Drawing.Imaging.ImageFormat]::Png);$frames+=,@{Size=$size;Data=$memory.ToArray()}
   if($size -eq 256){$bitmap.Save((Join-Path $appRoot $(if($premium){'Icone-Seraphim.png'}else{'Icone-Control.png'})),[System.Drawing.Imaging.ImageFormat]::Png)}
   if(-not $premium -and $size -in @(16,32,48,128)){$asset=Join-Path $appRoot "browser-extension\assets\icon$size.png";New-Item -ItemType Directory -Path (Split-Path -Parent $asset) -Force|Out-Null;$bitmap.Save($asset,[System.Drawing.Imaging.ImageFormat]::Png)}
   $memory.Dispose();$tile.Dispose();$edge.Dispose();$background.Dispose();$g.Dispose();$bitmap.Dispose()
  }
 }finally{$logo.Dispose()}
 $iconPath=Join-Path $appRoot $(if($premium){'Seraphim-Premium.ico'}else{'Control.ico'})
 $writer=[System.IO.BinaryWriter]::new([System.IO.File]::Create($iconPath))
 try {$writer.Write([uint16]0);$writer.Write([uint16]1);$writer.Write([uint16]$frames.Count);$offset=6+16*$frames.Count
 foreach($frame in $frames){$dimension=if($frame.Size -eq 256){0}else{$frame.Size};$writer.Write([byte]$dimension);$writer.Write([byte]$dimension);$writer.Write([byte]0);$writer.Write([byte]0);$writer.Write([uint16]1);$writer.Write([uint16]32);$writer.Write([uint32]$frame.Data.Length);$writer.Write([uint32]$offset);$offset+=$frame.Data.Length};foreach($frame in $frames){$writer.Write([byte[]]$frame.Data)}}finally{$writer.Dispose()}
}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe';$framework=Split-Path -Parent $compiler;$wpf=Join-Path $framework 'WPF'
$speech=Join-Path $env:WINDIR 'Microsoft.NET\assembly\GAC_MSIL\System.Speech\v4.0_4.0.0.0__31bf3856ad364e35\System.Speech.dll'
if(-not(Test-Path -LiteralPath $speech)){$speech=Join-Path ${env:ProgramFiles(x86)} 'Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Speech.dll'}
$sources=Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.cs'|Select-Object -ExpandProperty FullName
& $compiler /nologo /target:winexe /platform:anycpu /optimize+ /utf8output "/out:$appRoot\$OutputName" "/win32icon:$appRoot\Control.ico" "/win32manifest:$PSScriptRoot\Seraphim.manifest" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Core.dll /reference:Microsoft.CSharp.dll /reference:System.Xml.Linq.dll "/reference:$speech" /reference:System.Security.dll /reference:System.Net.Http.dll /reference:System.Runtime.Serialization.dll /reference:System.Xaml.dll "/reference:$wpf\WindowsBase.dll" "/reference:$wpf\PresentationCore.dll" "/reference:$wpf\PresentationFramework.dll" $sources
if($LASTEXITCODE -ne 0){throw 'La compilation a échoué.'}
Write-Output "Seraphim compilé : $appRoot\$OutputName"
