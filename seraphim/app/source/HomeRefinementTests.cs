using System;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;

namespace SeraphimLuxury
{
    static class HomeRefinementTests
    {
        static void Check(bool value,string message){if(!value)throw new Exception(message);}
        public static int Run(string directory)
        {
            Directory.CreateDirectory(directory);var app=new Application {ShutdownMode=ShutdownMode.OnExplicitShutdown};var prefs=Preferences.Defaults();prefs.Premium=true;prefs.ReducedMotion=true;prefs.ThreatProtection=true;string path=Path.Combine(directory,"preferences.json");new PreferenceStore(path).Save(prefs);
            File.WriteAllText(Path.Combine(directory,"phishing-army-cache.json"),Json.Write(new ThreatFeed {Updated=DateTime.UtcNow.ToString("o"),Version="home-test",Domains=new[]{"blocked.seraphim.example.org"}}));
            var w=new MainWindow(new PreferenceStore(path),true){Opacity=0,ShowInTaskbar=false};app.MainWindow=w;var timer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(220)};int stage=0;
            timer.Tick+=delegate {try{switch(stage++){
                case 0:
                    w.UpdateLayout();Check(w.HomeNav.All(b=>b.Content is NavigationMark),"Navigation uniquement en icônes");Check(((NavigationMark)w.HomeNav[0].Content).Selected,"Accueil sélectionné");var nav=w.HomeNav[1];var popup=(Popup)nav.Resources["NavigationHint"];Check(!popup.IsOpen,"Libellé caché au repos");nav.RaiseEvent(new MouseEventArgs(Mouse.PrimaryDevice,0){RoutedEvent=UIElement.MouseEnterEvent});Check(popup.IsOpen,"Libellé visible au survol");nav.RaiseEvent(new MouseEventArgs(Mouse.PrimaryDevice,0){RoutedEvent=UIElement.MouseLeaveEvent});Check(!popup.IsOpen,"Libellé se referme");nav.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(w.CurrentPage=="Atlas"&&((NavigationMark)nav.Content).Selected&&!((NavigationMark)w.HomeNav[0].Content).Selected,"L’icône active suit la navigation");
                    w.ShowPage("Accueil");w.UpdateLayout();Check(w.atlas.ActualWidth>990&&w.atlas.ActualHeight>=460,"Carte agrandie en largeur et hauteur");Check(w.studioDestination.Parent==w.studioViewport,"Destination en superposition");var camera=w.atlas.CameraSnapshot();w.studioDestinationToggle.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(!w.destinationOpen&&w.studioDestination.Visibility==Visibility.Collapsed,"Destination fermée");Check(camera.SequenceEqual(w.atlas.CameraSnapshot()),"Caméra conservée");w.Capture(Path.Combine(directory,"home-closed.png"));w.studioDestinationToggle.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Check(w.destinationOpen&&w.studioDestination.Visibility==Visibility.Visible,"Destination rouverte");w.atlas.SelectCity(AtlasPlaces.Data.cities.First(c=>c.id=="AUT-salzburg"),true);w.atlasTimeline.Value=5.5;Check(Math.Abs(w.atlas.Position-5.5)<.001&&w.studioTimeYear.Text==AtlasData.Year(5.5).ToString(),"Date illustrée et frise fonctionnelles");w.Capture(Path.Combine(directory,"home-open.png"));
                    w.ToggleAtlasFullScreen();Check(w.atlasImmersion!=null&&w.studioDestination.Parent==w.studioViewport,"Destination conservée en plein écran");w.ToggleAtlasFullScreen();Check(w.atlasImmersion==null&&w.studioViewport.Parent==w.studioMapHost,"Retour du plein écran");w.Width=980;w.Height=680;break;
                case 1:
                    w.ShowPage("Accueil");w.Capture(Path.Combine(directory,"home-minimum.png"));w.CheckHomeThreatStates();w.SampleStudioScroll(true);w.Capture(Path.Combine(directory,"home-statistics.png"));w.SampleStudioScroll(false);w.Width=1180;w.Height=830;w.ChooseEdition(false);var control=(MainWindow)app.MainWindow;control.ShowPage("Accueil");Check(!control.atlas.HistoryEnabled,"Control garde sa carte sans histoires");control.SetDestinationOpen(false);control.Capture(Path.Combine(directory,"home-control.png"));timer.Stop();control.Close();File.WriteAllText(Path.Combine(directory,"home-test.txt"),"PASS : navigation icônes, libellés de survol, sélection remplie, grande carte, destination repliable sans changement de caméra, date illustrée et frise manuelle, plein écran/restauration, 980x680, graphiques et états ON/OFF vérifiés, Control sans histoires. Les règles de travail et de protection ne sont pas modifiées.");app.Shutdown();break;
            }}catch(Exception e){timer.Stop();File.WriteAllText(Path.Combine(directory,"home-test.txt"),"FAIL stage "+stage+" "+e);w.Close();app.Shutdown(1);}};w.Loaded+=delegate {timer.Start();};return app.Run(w);
        }
    }
    partial class MainWindow {internal Button[] HomeNav {get{return navigation.ToArray();}}internal void CheckHomeThreatStates(){Session.Activate();var s=BrowserRequest(new BridgeRequest {action="status"});if(!s.threat)throw new Exception("Liste de test prête");BrowserRequest(new BridgeRequest {action="threatReady",text=s.threatVersion,session=s.session});ShowPage("Accueil");if(studioThreatState.Text!="ON")throw new Exception("Badge ON après confirmation du compagnon");Session.Deactivate();ShowPage("Accueil");if(studioThreatState.Text!="OFF")throw new Exception("Badge OFF en veille");}}
}
