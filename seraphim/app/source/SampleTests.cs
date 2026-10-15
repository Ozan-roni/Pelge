using System;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace SeraphimLuxury
{
    [DataContract] class FixtureControl
    {
        [DataMember] public bool active;
        [DataMember] public bool premium;
        [DataMember] public bool stop;
        [DataMember] public bool control14;[DataMember] public System.Collections.Generic.List<AppPolicy14> policies;[DataMember] public System.Collections.Generic.List<UsageEntry> usage;
    }
    partial class MainWindow
    {
        public void SamplePassage(Action complete){ShowPassage("Votre intention avant le réseau.",complete);}
        public void SampleAccount(){ShowAccount();}
        public void SampleCancel(){CancelOverlay();}
        public void SampleDomains(System.Collections.Generic.List<string> list){SaveSocialDomains(list);}
        public void SampleBridgeStart(){bridge=new NativeBridge(request=>Dispatcher.Invoke(new Func<BridgeResponse>(()=>BrowserRequest(request))));bridge.Start();}
        public void SamplePolicies14(FixtureControl c){if(!c.control14)return;preferences.SocialPassage=preferences.AdultFilter=preferences.QuietFeeds=preferences.HideShortVideos=preferences.HideAds=false;if(c.policies!=null)preferences.AppPolicies=c.policies;if(c.usage!=null)preferences.Usage=c.usage;ControlCatalog14.Normalize(preferences);}
        public void SampleControl(bool active,bool premium){if(active!=Session.Active){if(active)Session.Activate();else Session.Deactivate();}preferences.Premium=premium;}
        public bool SampleAllowed(AppEntry entry){return CanLaunch(entry);}
    }
    static class SampleTests
    {
        static void Check(bool value,string message){if(!value)throw new Exception(message);}
        public static int BridgeFixture(string directory,bool threats=false)
        {
            Directory.CreateDirectory(directory);var app=new Application {ShutdownMode=ShutdownMode.OnMainWindowClose};
            var prefs=Preferences.Defaults();prefs.Apps.Clear();prefs.ThreatProtection=threats;if(File.Exists(Path.Combine(directory,"blacklist-config.txt"))){prefs.Blacklist=MainWindow.ParseBlacklist(File.ReadAllText(Path.Combine(directory,"blacklist-config.txt")));prefs.BlacklistEnabled=true;}new PreferenceStore(Path.Combine(directory,"fixture-preferences.json")).Save(prefs);
            if(threats&&!File.Exists(Path.Combine(directory,"phishing-army-cache.json")))File.WriteAllText(Path.Combine(directory,"phishing-army-cache.json"),Json.Write(new ThreatFeed {Updated=DateTime.UtcNow.ToString("o"),Version="owned-browser-fixture",Domains=new[]{"blocked.seraphim.example.org"}}));
            var window=new MainWindow(new PreferenceStore(Path.Combine(directory,"fixture-preferences.json")),true){Opacity=0,ShowInTaskbar=false};app.MainWindow=window;window.SampleBridgeStart();
            var tick=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(120)};tick.Tick+=delegate {
                try{var control=Json.Read<FixtureControl>(File.ReadAllText(Path.Combine(directory,"control.json")));if(control.stop){tick.Stop();window.Close();return;}window.SampleControl(control.active,control.premium);window.SamplePolicies14(control);}catch{}
            };window.Loaded+=delegate {File.WriteAllText(Path.Combine(directory,"bridge-ready.txt"),"ready");tick.Start();};return app.Run(window);
        }
        public static int Run(string directory)
        {
            Directory.CreateDirectory(directory);string report=Path.Combine(directory,"sample-test.txt");var app=new Application {ShutdownMode=ShutdownMode.OnMainWindowClose};
            var prefs=Preferences.Defaults();prefs.ReducedMotion=false;prefs.Premium=true;prefs.Apps.Add(new AppEntry {Id="roblox-studio",Name="Roblox Studio",Target="C:\\SeraphimTest\\RobloxStudioBeta.exe",Work=true});
            string path=Path.Combine(directory,"preferences.json");new PreferenceStore(path).Save(prefs);var window=new MainWindow(new PreferenceStore(path),true){Opacity=0,ShowInTaskbar=false};app.MainWindow=window;
            int stage=0,launches=0,confirmed=0;SplashWindow splash=null;var timer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(250)};window.Launcher=delegate {launches++;};
            timer.Tick+=delegate {
                try {
                    switch(stage++){
                        case 0:
                            window.Capture(Path.Combine(directory,"01-seraphim.png"));Check(!window.Session.Active,"Le lancement reste en veille.");window.RequestLaunch(window.WorkApp);Check(launches==1,"En veille, travail libre.");window.Session.Activate();window.RequestLaunch(window.WorkApp);Check(launches==1,"Préparation requise en session.");window.Capture(Path.Combine(directory,"02-preparation.png"));window.PreparationConfirm.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(launches==1,"Préparation vide refusée.");window.FillPreparationTest("Construire la scène", "27:12", "45");window.PreparationConfirm.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(launches==1,"Heure invalide refusée.");window.FillPreparationTest("Construire la scène", "14:30", "45");window.PreparationConfirm.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(launches==2&&!window.Today.Tasks[0].Done&&window.Today.Tasks[0].AppId==window.WorkApp.Id,"Soft ouvre après préparation, tâche non terminée et propre à l'application.");window.RequestLaunch(window.WorkApp);Check(launches==3,"Préparation valable pendant la session.");window.Deactivate();window.Session.Activate();window.RequestLaunch(window.WorkApp);Check(launches==3,"Nouvelle session demande validation.");window.EmergencyButton.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(launches==4&&!window.Session.Prepared.Contains(window.WorkApp.Id),"Urgence ponctuelle sans préparer.");window.RequestLaunch(window.WorkApp);window.FillPreparationTest("Construire la scène", "", "");window.PreparationConfirm.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(launches==5&&window.Today.Tasks[0].Time=="","Heure et durée facultatives.");
                            var other=new AppEntry {Id="other",Name="Autre outil",Work=true};Check(!window.SampleAllowed(other),"Le planning d'une application ne déverrouille pas une autre.");
                            window.Today.Tasks[0].Time="14:30";window.Today.Tasks[0].Minutes=45;window.ShowPage("Planning");break;
                        case 1: window.Capture(Path.Combine(directory,"03-planning.png"));window.ShowPage("Web");break;
                        case 2: window.Capture(Path.Combine(directory,"04-web.png"));window.WebOptionChecks[1].IsChecked=false;Check(window.BrowserRequest(new BridgeRequest {action="status"}).adult&&!window.PassageConfirm.IsEnabled,"Retirer la protection adulte active attend le passage.");window.PassageInput.Text=window.CurrentPassage.Text;window.PassageConfirm.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(!window.BrowserRequest(new BridgeRequest {action="status"}).adult,"Passage exact retire la protection choisie.");window.WebOptionChecks[1].IsChecked=true;window.SampleDomains(new System.Collections.Generic.List<string>{"instagram.com"});Check(window.BrowserRequest(new BridgeRequest {action="status"}).domains.Length>1,"Retirer des domaines actifs attend le passage.");window.PassageInput.Text=window.CurrentPassage.Text;window.PassageConfirm.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(window.BrowserRequest(new BridgeRequest {action="status"}).domains.Length==1,"Passage confirme la réduction des domaines.");window.SamplePassage(()=>confirmed++);break;
                        case 3: window.Capture(Path.Combine(directory,"05-passage.png"));window.PassageInput.Text=window.CurrentPassage.Text.Substring(0,7);Check(!window.PassageConfirm.IsEnabled,"Phrase partielle refusée.");window.PassageInput.Text=window.CurrentPassage.Text+"x";Check(!window.PassageConfirm.IsEnabled,"Phrase différente refusée.");window.PassageInput.Text=window.CurrentPassage.Text;Check(window.PassageConfirm.IsEnabled,"Phrase exacte acceptée.");window.Capture(Path.Combine(directory,"06-passage-complet.png"));window.PassageConfirm.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(confirmed==1,"Confirmation déclenche une seule action.");
                            var challenge=window.BrowserRequest(new BridgeRequest {action="challenge",host="instagram.com",kind="social"});Check(challenge.active&&challenge.passage!=null,"Défi natif créé.");var verify=new BridgeRequest {action="verify",host="instagram.com",kind="social",id=challenge.id,text=challenge.passage.Text};verify.text+="x";Check(!window.BrowserRequest(verify).valid,"Défi natif refuse phrase incorrecte.");verify.text=challenge.passage.Text;Check(window.BrowserRequest(verify).valid&&!window.BrowserRequest(verify).valid,"Défi validé une seule fois.");window.Deactivate();Check(!window.BrowserRequest(new BridgeRequest {action="status"}).active,"Pont désactivé avec session.");window.ShowPage("Messages");break;
                        case 4: window.Capture(Path.Combine(directory,"07-messages.png"));window.SampleAccount();break;
                        case 5: window.Capture(Path.Combine(directory,"08-profil.png"));window.SampleCancel();window.ShowPage("Apparence");break;
                        case 6: window.Capture(Path.Combine(directory,"09-apparence.png"));window.Width=980;window.Height=680;window.ShowPage("Planning");break;
                        case 7: window.Capture(Path.Combine(directory,"10-minimum.png"));window.Width=1180;window.Height=830;window.ChooseEdition(false);window=(MainWindow)app.MainWindow;Check(((System.Windows.Media.Imaging.BitmapSource)window.Icon).PixelWidth==256&&!Visuals.Premium,"Control possède la bonne icône et le thème clair.");window.ShowPage("Accueil");break;
                        case 8: window.Capture(Path.Combine(directory,"11-control.png"));splash=new SplashWindow(false,false,delegate{});splash.Show();timer.Interval=TimeSpan.FromMilliseconds(450);break;
                        case 9: Branding.Capture((FrameworkElement)splash.Content,Path.Combine(directory,"12-splash.png"));splash.Close();
                            string accountPath=Path.Combine(directory,"test-account.json");if(File.Exists(accountPath))File.Delete(accountPath);var account=AccountSession.Create("Exemple","phrase-test-12345",accountPath);Check(AccountSession.Verify(account,"phrase-test-12345")&&!AccountSession.Verify(account,"mauvais"),"PBKDF2 vérifie le profil.");Check(!File.ReadAllText(accountPath).Contains("phrase-test-12345"),"Mot de passe jamais enregistré en clair.");
                            Check(WebPolicy.Matches("L'intelligence","L’intelligence")&&!WebPolicy.Matches("l'intelligence","L’intelligence"),"Normalisation typographique, casse exacte.");Check(WebPolicy.HostMatches("www.instagram.com",WebPolicy.DefaultSocial)&&!WebPolicy.HostMatches("instagram.com.example.org",WebPolicy.DefaultSocial),"Frontières de domaines.");
                            var mail=new GmailMessage {payload=new GmailPayload {headers=new[]{new GmailHeader {name="From",value="Exemple <example@example.org>"},new GmailHeader {name="Subject",value="Objet échantillon"},new GmailHeader {name="Message-ID",value="<sample@example.org>"}}}};string mime=GmailClient.MimeReply(mail,"Réponse test",null);Check(mime.Contains("To: example@example.org")&&mime.Contains("In-Reply-To: <sample@example.org>"),"Réponse MIME et fil préparés sans envoi.");
                            File.WriteAllText(report,"PASS : veille, soft par application, champs facultatifs, urgence ponctuelle, reprise nouvelle session, pages des deux éditions, passage exact natif et usage unique, icônes, splash, profil PBKDF2, limites domaines et MIME Gmail (aucun envoi ni microphone).",Encoding.UTF8);timer.Stop();window.Close();break;
                    }
                }catch(Exception ex){timer.Stop();if(splash!=null)splash.Close();File.WriteAllText(report,"FAIL : stage "+stage+" "+ex,Encoding.UTF8);app.Shutdown(1);}
            };window.Loaded+=delegate {timer.Start();};return app.Run(window);
        }
    }
}
