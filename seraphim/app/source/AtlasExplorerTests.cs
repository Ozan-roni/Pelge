using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Threading;
namespace SeraphimLuxury {
 static class AtlasExplorerTests {
  static void Check(bool value,string message){if(!value)throw new Exception(message);}
  public static int Run(string directory) {
   Directory.CreateDirectory(directory);var app=new Application {ShutdownMode=ShutdownMode.OnExplicitShutdown};var prefs=Preferences.Defaults();prefs.Premium=true;prefs.ReducedMotion=true;string path=Path.Combine(directory,"preferences.json");new PreferenceStore(path).Save(prefs);var w=new MainWindow(new PreferenceStore(path),true){Opacity=0,ShowInTaskbar=false};app.MainWindow=w;
   int stage=0;var watch=Stopwatch.StartNew();var timer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(150)};AtlasCanvas old=null;double paused=0;BridgeResponse status=null;
   timer.Tick+=delegate {try {switch(stage){
    case 0:
     Check(AtlasPlaces.Data.cities.Count>1200&&AtlasPlaces.Data.chapters.Count>=30,"Villes et sources chargées");var p=AtlasData.Project(2.35,48.86);var screen=w.atlas.ScreenPoint(p);w.atlas.ZoomAt(screen,2);Check((w.atlas.ScreenPoint(p)-screen).Length<.01,"Ancrage du zoom");w.atlas.ZoomAt(screen,2);Check(w.atlas.Selected.id=="FRA"&&w.atlas.Zoom==4,"France détectée");var start=new Point(250,150);var before=w.atlas.ScreenPoint(p);w.atlas.BeginPan(start);w.atlas.MovePan(start+new Vector(45,25));Check((w.atlas.ScreenPoint(p)-before-new Vector(45,25)).Length<.01,"Pan direct sans retard");w.atlas.EndPan();w.atlas.ResetCamera();Check(w.atlas.Zoom==1&&w.atlas.City==null&&w.atlas.Selected==null&&w.atlas.Position==6,"Reset du contexte/date");
     w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="FRA-paris"),true);Check(AtlasData.Year(w.atlas.Position)==1163,"Approche de Paris rejoint 1163");w.atlas.Seek(AtlasPlaces.PositionOf(1804));Check(w.shownChapter.year==1804,"Paris 1804");w.PrepareVpnCity();var saved=new PreferenceStore(path).Load();Check(saved.VpnCityId=="FRA-paris"&&saved.RecentVpnCities[0]=="FRA-paris"&&!w.Session.Active,"Récent préparé sans activer");w.Capture(Path.Combine(directory,"native-paris.png"));w.ToggleAtlasFullScreen();Check(w.atlasImmersion!=null&&w.atlasImmersion.Content==w.studioViewport&&!w.studioMapHost.Children.Contains(w.studioViewport),"Plein écran sans duplication");w.ToggleAtlasFullScreen();Check(w.atlasImmersion==null&&w.studioMapHost.Children.Contains(w.studioViewport),"Retour du plein écran");w.SelectAtlasTheme(1);Check(w.atlas.City.id=="FRA-paris"&&w.atlas.Zoom==9,"Thème conserve ville/caméra");stage++;break;
    case 1:
     w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="IRQ-baghdad"),true);Check(w.shownChapter.year==762,"Bagdad documenté");w.Capture(Path.Combine(directory,"native-bagdad.png"));w.atlas.Seek(0);Check(w.shownChapter==null,"Pas d’événement futur antidaté");w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="EGY-cairo"),true);w.atlas.Seek(AtlasPlaces.PositionOf(1900));Check(w.shownChapter.asset=="real-cairo.jpg"&&w.shownChapter.panel==-1,"Le Caire dédié");old=w.atlas;w.ShowPage("Web");Check(!old.TimerRunning,"Navigation libère la carte");w.WebOptionChecks[3].IsChecked=true;w.WebOptionChecks[4].IsChecked=true;Check(new PreferenceStore(path).Load().HideShortVideos&&new PreferenceStore(path).Load().HideAds,"Options persistées");status=w.BrowserRequest(new BridgeRequest {action="status"});Check(!w.BrowserRequest(new BridgeRequest {action="metrics",kind="shorts",count=2,id="off",session=status.session}).valid,"Pas de compte en veille");w.SampleControl(true,true);status=w.BrowserRequest(new BridgeRequest {action="status"});var metric=new BridgeRequest {action="metrics",kind="shorts",count=2,id="one",session=status.session};Check(w.BrowserRequest(metric).valid&&w.HiddenCount("shorts")==2,"Masquage réel compté");Check(!w.BrowserRequest(metric).valid&&w.HiddenCount("shorts")==2,"Doublon refusé");metric.id="bad";metric.session="expired";Check(!w.BrowserRequest(metric).valid,"Session incorrecte refusée");metric.session=status.session;metric.count=-1;Check(!w.BrowserRequest(metric).valid,"Compte négatif refusé");metric.count=3;metric.kind="ads";Check(w.BrowserRequest(metric).valid&&w.HiddenCount("ads")==3,"Pubs séparées");w.SampleControl(false,true);status=w.BrowserRequest(new BridgeRequest {action="status"});Check(status.hiddenShorts==2&&status.hiddenAds==3&&!status.active,"Compteurs conservés");w.ShowPage("Accueil");Check(w.atlas.City.id=="EGY-cairo","Ville conservée après navigation");Visuals.ReducedMotion=false;w.SelectAtlasTheme(0);w.atlas.ResetCamera();watch.Restart();stage++;break;
    case 2:
     if(watch.Elapsed.TotalSeconds<5.2)return;Check(!w.atlas.Playing&&Math.Abs(w.atlas.Position-6)<.00001,"Monde fixe après inactivité");w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="FRA-paris"),true);watch.Restart();stage++;break;
    case 3:
     if(watch.Elapsed.TotalSeconds<7.5)return;Check(w.atlas.Playing&&AtlasData.Year(w.atlas.Position)==1163,"Temps local très lent");w.atlas.Toggle();paused=w.atlas.Position;watch.Restart();stage++;break;
    case 4:
     if(watch.Elapsed.TotalSeconds<5.2)return;Check(!w.atlas.Playing&&w.atlas.Position==paused,"Pause durable");w.atlas.Seek(AtlasPlaces.PositionOf(1804));w.Capture(Path.Combine(directory,"native-paris-animated.png"));w.atlas.ZoomAt(w.atlas.ScreenPoint(AtlasData.Project(2.35,48.86)),1.5);watch.Restart();stage++;break;
    case 5:
     if(watch.Elapsed.TotalSeconds<1.1)return;Check(w.atlas.Zoom>13.4,"Zoom animé");w.Capture(Path.Combine(directory,"native-city-close.png"));w.atlas.ResetCamera();watch.Restart();stage++;break;
    case 6:
     if(watch.Elapsed.TotalSeconds<2)return;Check(w.atlas.City==null&&w.atlas.Zoom<1.01&&Math.Abs(w.atlas.Position-6)<.001&&!w.atlas.Playing,"Retour en fondu au monde/présent");timer.Stop();w.Close();File.WriteAllText(Path.Combine(directory,"explorer-test.txt"),"PASS : pan direct, ancrage de zoom, reset contexte/date/scène, frise manuelle, dérive locale 1 an/120 s, pause durable, plein écran/restauration, 1223 villes/40 chapitres, Paris/Bagdad/Le Caire, récents préparés, compteurs persistés avec validation session/dédoublonnage/veille, options de masquage. Aucun VPN ni compte personnel utilisé.",Encoding.UTF8);app.Shutdown();break;
   }}catch(Exception ex){timer.Stop();File.WriteAllText(Path.Combine(directory,"explorer-test.txt"),"FAIL stage "+stage+" : "+ex,Encoding.UTF8);app.Shutdown(1);}};
   w.Loaded+=delegate {timer.Start();};w.Show();return app.Run();
  }
 }
}

