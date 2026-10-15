from pathlib import Path
import sys,shutil,json,hashlib,zipfile,subprocess,re,html,os
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'distribution/tools'))
import qrcode,zxingcpp
from PIL import Image
BASE=ROOT/'app' if (ROOT/'app/source').exists() else ROOT/'outputs/Seraphim'
VERSION=os.environ.get('SERAPHIM_VERSION','0.16.2')
assert re.fullmatch(r'\d+\.\d+\.\d+',VERSION)
BUILD=ROOT/('work/partage-'+VERSION)
APP=BUILD/'app'
OUT=ROOT/('outputs/Seraphim-Partage-'+VERSION)
if BUILD.exists() or OUT.exists():raise SystemExit('Choose a new build/output folder; existing builds are preserved.')
APP.mkdir(parents=True);OUT.mkdir(parents=True)
source=APP/'source';source.mkdir()
for p in (BASE/'source').glob('*.cs'):shutil.copy2(p,source/p.name)
for n in ['Construire.ps1','Seraphim.manifest']:shutil.copy2(BASE/'source'/n,source/n)
p=source/'Interaction14.cs';s=p.read_text(encoding='utf8').replace('?"Ronnie":name.Trim()','?"vous":name.Trim()');p.write_text(s,encoding='utf8')
p=source/'Refinement16Tests.cs';s=p.read_text(encoding='utf8').replace('Contains("Ronnie")','Contains("vous")');p.write_text(s,encoding='utf8')
p=source/'AssemblyInfo.cs';p.write_text(p.read_text(encoding='utf8').replace('0.16.0.0',VERSION+'.0'),encoding='utf8')
p=source/'SeraphimLuxury.cs';p.write_text(p.read_text(encoding='utf8').replace('0.16 CLAIR',VERSION+' PARTAGE'),encoding='utf8')
shutil.copytree(BASE/'assets',APP/'assets',ignore=shutil.ignore_patterns('ART-GENERATION-*.txt'))
shutil.copytree(BASE/'browser-extension',APP/'browser-extension')
shutil.copytree(BASE/'Control-0.36.1',APP/'Control-autonome')
phone=APP/'Telephone';phone.mkdir();shutil.copy2(BASE/'mobile/Control-iPhone.user.js',phone/'Control-iPhone.user.js')
def run(args):
 r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,encoding='utf8',errors='replace')
 (BUILD/'build.log').open('a',encoding='utf8').write(r.stdout+r.stderr)
 if r.returncode:raise RuntimeError('Build failed; see '+str(BUILD/'build.log'))
run(['powershell.exe','-NoProfile','-File',str(source/'Construire.ps1')])
CSC=str(Path('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'))
common=[CSC,'/nologo','/target:winexe','/optimize+','/utf8output','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Core.dll','/reference:Microsoft.CSharp.dll']
run(common+['/reference:System.Net.Http.dll','/reference:System.Web.Extensions.dll','/out:'+str(APP/'Mises-a-jour.exe'),str(ROOT/'distribution/Updates.cs')])
run(common+['/out:'+str(APP/'Desinstaller.exe'),str(ROOT/'distribution/Uninstall.cs')])
run(common+['/out:'+str(APP/'Assistant-extensions.exe'),str(ROOT/'distribution/Extensions.cs')])
script='https://raw.githubusercontent.com/Ozan-roni/Pelge/main/mobile/Control-iPhone.user.js'
store='https://apps.apple.com/app/userscripts/id1463298887'
for name,url in [('Control-iPhone',script),('Userscripts-AppStore',store)]:
 image=qrcode.make(url);image.save(phone/(name+'.png'));decoded=zxingcpp.read_barcode(Image.open(phone/(name+'.png')))
 assert decoded and decoded.text==url,'Invalid QR code'
guide='''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bienvenue dans Seraphim</title><style>
*{box-sizing:border-box}body{margin:0;background:#12131b;color:#f3effa;font:16px/1.7 system-ui,sans-serif}main{max-width:940px;padding:55px 28px;margin:auto}header{display:flex;align-items:center;gap:24px;margin-bottom:40px}header img{width:82px}h1{font-size:34px;line-height:1.2;margin:0}h2{margin-top:40px;font-size:23px}h3{font-size:18px}small,p{color:#c0b7ce}a{color:#d5c0fa}section{border-top:1px solid #bba3dd25;padding-top:12px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:30px}.qr{background:white;padding:12px;border-radius:12px;width:180px;height:180px}code{background:#d4b4ff0b;border-radius:6px;padding:4px 8px;overflow-wrap:anywhere}li{margin:10px 0}.pill{font-size:12px;padding:5px 12px;border:1px solid #bba3dd35;border-radius:30px}.note{padding:16px 20px;background:#d4b4ff09;border-radius:14px}button{border:1px solid #bba3dd40;background:#292435;color:inherit;border-radius:12px;padding:12px 18px;cursor:pointer}footer{font-size:13px;margin-top:50px}@media(max-width:650px){.columns{grid-template-columns:1fr}h1{font-size:28px}main{padding:28px 20px}}
</style><main><header><img src="Icone-Seraphim.png" alt=""><div><span class="pill">PARTAGE · 0.16.1</span><h1>Bienvenue dans votre espace.</h1><small>Windows · Chrome / Edge · iPhone / iPad</small></div></header>
<section><h2>1. Votre application Windows</h2><p>Sur Windows 10 ou 11, extrayez toute l’archive, puis lancez <strong>Installer-Seraphim.exe</strong>. L’installation est réservée à votre compte Windows ; aucun compte Seraphim n’est fourni. Un raccourci est créé sur le bureau et dans le menu Démarrer.</p><p>Seraphim commence en veille. Choisissez Control ou Seraphim Premium, préparez votre planning, puis activez volontairement votre session. Le raccourci est <strong>Ctrl + Alt + Entrée + S</strong>. Vos applications restent libres tant que la session n’est pas active.</p><p>Vos données se créent uniquement sur votre PC, dans <code>%LOCALAPPDATA%\\Seraphim</code>. L’archive ne contient ni compte, ni planning personnel, ni historique du créateur.</p></section>
<section><h2>2. Choisissez votre extension</h2><p>Dans le menu Démarrer, ouvrez <strong>Seraphim → Installation des extensions</strong>, ou lancez <strong>Assistant-extensions.exe</strong> dans le dossier installé. L’assistant ouvre le bon dossier et la page des extensions.</p><div class="columns"><div><h3>Compagnon Seraphim · recommandé</h3><p>Suit les réglages et l’activation de Seraphim. Laissez l’application ouverte. Le pont local est configuré par l’installateur.</p><button onclick="copy('browser-extension')">Copier le chemin du compagnon</button></div><div><h3>Control autonome</h3><p>Fonctionne sans Seraphim, avec son propre tableau de bord. Ses réglages sont indépendants.</p><button onclick="copy('Control-autonome')">Copier le chemin de Control</button></div></div><ol><li>Chrome : <code>chrome://extensions</code> ; Edge : <code>edge://extensions</code>.</li><li>Activez le <strong>mode développeur</strong>, puis <strong>Charger l’extension non empaquetée</strong>.</li><li>Sélectionnez le dossier choisi dans l’assistant. Chargez <strong>une seule des deux extensions</strong> pour éviter les règles en double.</li><li>Épinglez l’extension et rechargez les onglets Instagram ou les autres réseaux déjà ouverts.</li></ol><p class="note">Le chargement manuel est nécessaire : ces extensions ne sont pas encore distribuées par les boutiques Chrome et Edge. Les permissions demandées concernent les sites filtrés et, pour le compagnon, la communication locale avec Seraphim.</p></section>
<section><h2>3. Control sur votre iPhone / iPad</h2><p>Cette édition fonctionne dans <strong>Safari avec Userscripts</strong>. Elle ne modifie pas les applications natives Instagram ou Snapchat et ne nécessite pas que votre PC reste allumé. Aucune application mobile native iOS/Android n’est incluse.</p><div class="columns"><div><h3>A. Installer Userscripts</h3><a href="STORE"><img class="qr" src="Telephone/Userscripts-AppStore.png" alt="QR code App Store Userscripts"></a><p><a href="STORE">Ouvrir Userscripts dans l’App Store</a></p></div><div><h3>B. Installer Control 1.7.2</h3><a href="SCRIPT"><img class="qr" src="Telephone/Control-iPhone.png" alt="QR code du script Control"></a><p><a href="SCRIPT">Ouvrir le script Control dans Safari</a></p></div></div><ol><li>Ouvrez Userscripts et choisissez son dossier dans Fichiers.</li><li>Dans les réglages de Safari, activez l’extension Userscripts et autorisez-la sur les sites concernés.</li><li>Ouvrez le lien Control dans Safari, puis le menu des extensions → Userscripts pour installer le script. Vous pouvez aussi placer le fichier <code>Telephone/Control-iPhone.user.js</code> dans le dossier choisi.</li><li>Gardez une seule copie Control active, vérifiez <strong>@version 1.7.2</strong>, puis rechargez les onglets Safari. Le script contient ses adresses de mise à jour GitHub ; utilisez la commande de mise à jour de Userscripts lorsqu’elle est disponible, sinon réinstallez depuis ce même lien.</li></ol><p>Les conversations restent utilisables. Un Reel reçu reste lisible sans défilement vers d’autres vidéos. Les stories sont désactivées par défaut et peuvent être autorisées dans les options Control.</p></section>
<section><h2>À savoir sur cette édition de test</h2><p>Windows 10/11 x64 avec .NET Framework 4.8. L’installateur n’est pas encore signé numériquement ; une réputation Windows peut donc manquer. Aucune désactivation des protections Windows n’est nécessaire.</p><p>La carte et les commandes VPN sont une interface : aucun tunnel VPN ni abonnement n’est fourni. Les intégrations cloud, mail et IA nécessitent encore leur configuration. Les filtres Web dépendent des structures des sites ; ils ne constituent pas un antivirus ni une garantie de filtrage de tout contenu.</p><p>Les QR codes et les liens publics demandent Internet ; le fichier iPhone est également fourni dans l’archive. Android : aucune installation native prise en charge dans ce paquet.</p><h3>Mise à jour et désinstallation</h3><p>Seraphim vérifie GitHub une fois par jour à l’ouverture. Depuis son icône près de l’horloge, choisissez Mises à jour pour télécharger et installer la nouvelle version ; vos préférences sont conservées. Une confirmation précède l’installation. Les versions sans ce mécanisme nécessitent une première réinstallation. Rechargez ensuite l’extension et les onglets. Pour supprimer Seraphim, quittez-le depuis son icône près de l’horloge puis utilisez les applications installées de Windows. Les données personnelles restent conservées ; retirez les extensions séparément dans votre navigateur.</p></section><footer><a href="assets/REAL-IMAGES-CREDITS.html">Sources et crédits des photographies</a> · <a href="assets/SOCIAL-ICONS-CREDITS.txt">Crédits des icônes</a> · <a href="https://github.com/quoid/userscripts">Documentation officielle Userscripts</a></footer></main><script>function copy(name){const p=decodeURIComponent(new URL(name+'/',location.href).pathname).replace(/^\\/(\\w:)/,'$1').replace(/\\//g,'\\\\');if(navigator.clipboard)navigator.clipboard.writeText(p).then(()=>alert('Chemin copié : '+p)).catch(()=>prompt('Copiez ce chemin',p));else prompt('Copiez ce chemin',p);}</script></html>'''.replace('STORE',store).replace('SCRIPT',script).replace('0.16.1',VERSION)
(APP/'BIENVENUE.html').write_text(guide,encoding='utf8')
(APP/'Control-autonome/INSTALLATION.txt').write_text('CONTROL 0.36.1\n\nUtiliser Assistant-extensions.exe ou BIENVENUE.html. Charger ce dossier dans chrome://extensions ou edge://extensions. Ne pas charger simultanément le compagnon Seraphim. Les réglages sont locaux au navigateur.\n',encoding='utf8')
inventory=[]
for p in sorted(APP.rglob('*')):
 if not p.is_file() or p.is_relative_to(source):continue
 rel=p.relative_to(APP).as_posix()
 if re.search(r'(preferences|account|token|\.backup|fixture|test-report|runtime-test)',rel,re.I):raise RuntimeError('Excluded/private filename: '+rel)
 if p.suffix in ['.json','.txt','.html','.js','.css','.svg']:
  content=p.read_text(encoding='utf-8-sig')
  if re.search(r'C:[/\\]+Users[/\\]+[^/\\\r\n]+|GOCSPX-|ya29\.',content,re.I):raise RuntimeError('Personal path or credential: '+rel)
 inventory.append({'path':rel,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(APP/'package-files.json').write_text(json.dumps(inventory,ensure_ascii=False),encoding='utf8')
payload=BUILD/'payload.zip'
with zipfile.ZipFile(payload,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for entry in inventory:z.write(APP/entry['path'],entry['path'])
 z.write(APP/'package-files.json','package-files.json')
(BUILD/'Installer.cs').write_text((ROOT/'distribution/Installer.cs').read_text(encoding='utf8').replace('0.16.1',VERSION),encoding='utf8')
run(common+['/reference:System.IO.Compression.dll','/reference:System.IO.Compression.FileSystem.dll','/reference:System.Web.Extensions.dll','/win32icon:'+str(APP/'Seraphim-Premium.ico'),'/resource:'+str(payload)+',payload.zip','/out:'+str(OUT/'Installer-Seraphim.exe'),str(BUILD/'Installer.cs')])
shutil.copytree(phone,OUT/'Telephone');shutil.copy2(APP/'Icone-Seraphim.png',OUT/'Icone-Seraphim.png');shutil.copy2(APP/'BIENVENUE.html',OUT/'BIENVENUE.html')
# The top-level guide's desktop actions refer to the installed folder; no duplicate desktop payload.
p=OUT/'BIENVENUE.html';s=p.read_text(encoding='utf8').replace('<script>function copy(name){','<script>function copy(name){alert("Après l’installation, ouvrez le guide depuis le menu Démarrer → Seraphim. L’assistant copie le chemin du dossier installé.");return;').replace('href="assets/REAL-IMAGES-CREDITS.html"','href="CREDITS-PHOTOGRAPHIES.html"').replace('href="assets/SOCIAL-ICONS-CREDITS.txt"','href="CREDITS-ICONES.txt"');p.write_text(s,encoding='utf8')
shutil.copy2(APP/'assets/REAL-IMAGES-CREDITS.html',OUT/'CREDITS-PHOTOGRAPHIES.html');shutil.copy2(APP/'assets/SOCIAL-ICONS-CREDITS.txt',OUT/'CREDITS-ICONES.txt')
(OUT/'COMMENCER-ICI.txt').write_text('CONTROL / SERAPHIM — PACK À PARTAGER '+VERSION+'\n\n1. Extraire toute l’archive ZIP.\n2. Double-cliquer Installer-Seraphim.exe sur Windows 10/11.\n3. Suivre le guide pour charger une extension Chrome ou Edge.\n4. Pour iPhone : ouvrir BIENVENUE.html et scanner les QR codes ; le script est aussi dans Telephone.\n\nAucun compte ni historique personnel fourni. Le programme crée les données sur le PC du destinataire. Ce paquet de test n’est pas signé. Aucun VPN réel ni application Android/iOS native inclus : sur iPhone, Control fonctionne dans Safari via Userscripts.\n\nLa version complète de Seraphim, les deux variantes d’extension et les guides sont contenus dans l’installateur. Le destinataire n’a pas besoin de Python, Node.js, Codex ou d’un serveur local.\n',encoding='utf8')
archive=ROOT/('outputs/Seraphim-Partage-'+VERSION+'.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(OUT.rglob('*')):
  if p.is_file():z.write(p,str(Path(OUT.name)/p.relative_to(OUT)))
report={'version':VERSION,'payloadFiles':len(inventory),'payloadBytes':sum(e['size'] for e in inventory),'archiveBytes':archive.stat().st_size,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'qrCodesDecoded':True,'personalDataExcluded':True,'versions':{'companion':'0.16.0','control':'0.36.1','iphone':'1.7.2'}}
(BUILD/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False))
