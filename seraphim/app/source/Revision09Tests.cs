using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
namespace SeraphimLuxury
{
    static class Revision09Tests
    {
        static void Check(bool condition,string message){if(!condition)throw new Exception(message);}
        public static int Feed(string directory)
        {
            try{Directory.CreateDirectory(directory);var catalog=new ThreatCatalog(directory);catalog.Refresh().GetAwaiter().GetResult();Check(catalog.Count>10,"Liste récupérée et validée");Check(!catalog.Matches("google.com")&&!catalog.Matches("example.org"),"Sites légitimes non inclus");Check(new ThreatCatalog(directory).Count==catalog.Count,"Cache relu");File.WriteAllText(Path.Combine(directory,"feed-test.txt"),"PASS : récupération HTTPS Phishing Army, validation des domaines, conservation du cache et exclusion des plateformes partagées. Domaines : "+catalog.Count);return 0;}catch(Exception e){File.WriteAllText(Path.Combine(directory,"feed-test.txt"),"FAIL : "+e);return 1;}
        }
        public static int Run(string directory)
        {
            Directory.CreateDirectory(directory);var app=new Application {ShutdownMode=ShutdownMode.OnExplicitShutdown};var prefs=Preferences.Defaults();prefs.Premium=true;prefs.ReducedMotion=true;prefs.ThreatProtection=true;prefs.Apps.Add(new AppEntry {Id="roblox-studio",Name="Roblox Studio",Target="C:\\SeraphimTest\\RobloxStudioBeta.exe",Work=true});string path=Path.Combine(directory,"preferences.json");new PreferenceStore(path).Save(prefs);
            File.WriteAllText(Path.Combine(directory,"phishing-army-cache.json"),Json.Write(new ThreatFeed {Updated=DateTime.UtcNow.ToString("o"),Version="owned-fixture",Domains=new[]{"blocked.seraphim.example.org"}}));
            var w=new MainWindow(new PreferenceStore(path),true){Opacity=0,ShowInTaskbar=false};app.MainWindow=w;var timer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(250)};int stage=0;var log=new StringBuilder();
            timer.Tick+=delegate {try{switch(stage++){
                case 0:
                    Check(!w.Session.Active,"Démarrage en veille");Check(w.atlas.HistoryEnabled,"Histoires Premium activées");var p=w.atlas.ScreenPoint(AtlasData.Project(2.35,48.86));w.atlas.BeginPan(new Point(200,150));w.atlas.MovePan(new Point(275,185));Check((w.atlas.ScreenPoint(AtlasData.Project(2.35,48.86))-p-new Vector(75,35)).Length<.1,"Déplacement libre au zoom minimal");w.atlas.EndPan();w.atlas.ResetCamera();
                    w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="FRA-forbach"),true);Check(w.shownChapter.year==1250,"Forbach documenté");w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="DZA-annaba"),true);Check(w.shownChapter.title.Contains("Augustin"),"Augustin en Algérie");w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="USA-fonda"),true);Check(w.shownChapter.title.Contains("Kateri"),"Kateri dans la vallée Mohawk");
                    Check(Art.Load("flags/AUT.png").PixelWidth==80,"Drapeau local chargé");
                    for(int c=0;c<3;c++){w.SampleConcept(c);w.Capture(Path.Combine(directory,new[]{"native-halo.png","native-meridien.png","native-constellation.png"}[c]));}Check(w.SampleStudioScroll(true),"Défilement de toute la page");w.Capture(Path.Combine(directory,"native-statistics.png"));w.SampleStudioScroll(false);w.ShowPage("Applications");w.Capture(Path.Combine(directory,"native-applications.png"));w.ShowPage("Protection");w.Capture(Path.Combine(directory,"native-protection.png"));log.AppendLine("PASS : déplacement au zoom 1, trois compositions, illustrations ciblées, drapeaux locaux, défilement, logos d’applications et graphiques hebdomadaires.");break;
                case 1:
                    w.SampleControl(true,true);var status=w.BrowserRequest(new BridgeRequest {action="status"});Check(status.threat&&status.threatCount==1,"Liste prête en session");var page=w.BrowserRequest(new BridgeRequest {action="threatPage",count=0,session=status.session,text=status.threatVersion});Check(page.valid&&page.threatDomains.Length==1,"Pagination cohérente");Check(!w.BrowserRequest(new BridgeRequest {action="threatPage",count=0,session="old",text=status.threatVersion}).valid,"Page refusée en ancienne session");
                    var e=new BridgeRequest {action="threatBlocked",host="blocked.seraphim.example.org",id="owned-event",session=status.session};Check(w.BrowserRequest(e).valid&&w.HiddenCount("malicious")==1,"Blocage signalé compté");Check(!w.BrowserRequest(e).valid&&w.HiddenCount("malicious")==1,"Doublon refusé");e.host="example.org";e.id="legitimate";Check(!w.BrowserRequest(e).valid,"Domaine légitime refusé par le compteur");Check(w.BrowserRequest(new BridgeRequest {action="threatReady",text=status.threatVersion,session=status.session}).valid&&w.ThreatRunning,"Accusé de règles appliquées requis");w.ShowPage("Protection");w.Capture(Path.Combine(directory,"native-protection-journal.png"));
                    var n=new ReminderWindow("Navigation bloquée","blocked.seraphim.example.org\nHameçonnage signalé · liste de test",delegate {w.BuildProtectionPage();},true,"Détails de la menace →","SERAPHIM / PROTECTION"){Opacity=0};n.Show();n.VerifyAndCapture(Path.Combine(directory,"threat-notification.png"));n.OpenButton.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(w.CurrentPage=="Protection","Notification ouvre les détails");
                    w.SampleControl(false,false);Check(!w.BrowserRequest(e).valid,"Pas de compte en veille");w.ShowPage("Accueil");Check(w.atlas!=null&&!w.atlas.HistoryEnabled&&w.shownChapter==null,"Control possède la carte sans histoires");w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="FRA-paris"),true);Check(w.atlas.Position==6&&w.shownChapter==null,"Control ne déplace pas le temps");w.Capture(Path.Combine(directory,"native-control.png"));log.AppendLine("PASS : filtre natif, pagination, session, compteur exact, journal, notification en bas à droite, lien vers détails et Control sans histoires.");
                    Check(new PreferenceStore(path).Load().Apps.First(c=>c.Id=="roblox-studio").Target==Planning.FindRoblox(),"Chemin Roblox actualisé");log.AppendLine("PASS : chemin Roblox actualisé sans lancer le logiciel de l’utilisateur.");timer.Stop();w.Close();File.WriteAllText(Path.Combine(directory,"revision-test.txt"),log.ToString());app.Shutdown();break;
            }}catch(Exception e){timer.Stop();File.WriteAllText(Path.Combine(directory,"revision-test.txt"),"FAIL : stage "+stage+" "+e);w.Close();app.Shutdown(1);}};w.Loaded+=delegate {timer.Start();};return app.Run(w);
        }
    }
    partial class MainWindow {internal void SampleConcept(int value){preferences.AtlasConcept=value;ShowPage("Accueil");}internal bool SampleStudioScroll(bool bottom){UpdateLayout();DependencyObject parent=page;while(parent!=null&&!(parent is ScrollViewer))parent=System.Windows.Media.VisualTreeHelper.GetParent(parent);var scroll=parent as ScrollViewer;if(scroll==null)return false;if(bottom)scroll.ScrollToBottom();else scroll.ScrollToTop();UpdateLayout();return !bottom||scroll.VerticalOffset>0;}}
}
