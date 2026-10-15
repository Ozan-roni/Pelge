from pathlib import Path
import os,re,json,hashlib,shutil,subprocess
root=Path(__file__).resolve().parents[1]
version=os.environ.get('SERAPHIM_VERSION','0.16.2')
assert re.fullmatch(r'\d+\.\d+\.\d+',version)
bundle=root/'outputs'/('Seraphim-Partage-'+version)
out=root/'outputs/release-assets';out.mkdir(parents=True,exist_ok=True)
setup=out/'Seraphim-Setup.exe';shutil.copy2(bundle/'Installer-Seraphim.exe',setup)
shutil.copy2(root/'outputs'/('Seraphim-Partage-'+version+'.zip'),out/'Seraphim-Partage.zip')
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest={'version':version,'url':'https://github.com/Ozan-roni/Pelge/releases/download/v'+version+'/Seraphim-Setup.exe','size':setup.stat().st_size,'sha256':digest(setup)}
(out/'desktop-update.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
(out/'SHA256SUMS.txt').write_text('\n'.join(digest(p)+'  '+p.name for p in sorted(out.iterdir()) if p.is_file() and p.name!='SHA256SUMS.txt')+'\n',encoding='utf8')
report=root/'work/release-verification.txt'
r=subprocess.run([str(setup),'--verify',str(report)])
assert r.returncode==0 and report.read_text(encoding='utf8').startswith('PASS')
print(report.read_text(encoding='utf8'))
