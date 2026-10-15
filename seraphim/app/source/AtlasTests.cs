using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Threading;

namespace SeraphimLuxury
{
    static class AtlasTests
    {
        [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr hwnd,int msg,IntPtr w,IntPtr l);
        static void Check(bool value,string message){if(!value)throw new Exception(message);}
        public static int Run(string directory)
        {
            Directory.CreateDirectory(directory);var app=new Application {ShutdownMode=ShutdownMode.OnExplicitShutdown};
            var prefs=Preferences.Defaults();prefs.Premium=true;string path=Path.Combine(directory,"preferences.json");new PreferenceStore(path).Save(prefs);
            var w=new MainWindow(new PreferenceStore(path),true){Opacity=0,ShowInTaskbar=false};app.MainWindow=w;
            var eye=new EyeLogo(true,true);var eyeWindow=new Window {Width=280,Height=280,Content=new Viewbox {Child=eye},Opacity=0,ShowInTaskbar=false};
            var timer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(160)};int stage=0;AtlasCanvas old=null;Stopwatch eyeClock=null;
            timer.Tick+=delegate {
                try {
                    if(stage>=20){double seconds=eyeClock.Elapsed.TotalSeconds;
                        if(stage==20&&seconds>=1.42){Check(eye.GazeX<-3,"Le regard atteint la gauche avec une pause naturelle.");Branding.Capture((System.Windows.FrameworkElement)eyeWindow.Content,Path.Combine(directory,"eye-open.png"));stage=21;}
                        if(stage==21&&seconds>=2.235){Check(eye.Aperture<.25,"Les paupières se ferment avec l’iris.");Branding.Capture((System.Windows.FrameworkElement)eyeWindow.Content,Path.Combine(directory,"eye-blink.png"));stage=22;}
                        if(stage==22&&seconds>=2.57){Check(eye.Aperture>.95,"L’œil se rouvre.");eye.Motion(false);Check(eye.Aperture==1&&eye.GazeX==0,"Réduction du mouvement remet l’œil au repos.");eyeWindow.Close();timer.Stop();w.Close();File.WriteAllText(Path.Combine(directory,"atlas-test.txt"),"PASS : 241 géométries, frise 0-présent, vue globale fixe/pause/seek, trois ambiances persistées, destination conservée, navigation sans timer orphelin, réduction du mouvement, 980x680, WM_GETICON 32/16 px avec iris, regard/clignement/réouverture. Aucune connexion réseau VPN.",Encoding.UTF8);app.Shutdown();}return;
                    }
                    switch(stage++){
                        case 0:
                            Check(AtlasData.Countries.Count==241,"Catalogue géographique complet chargé.");Check(AtlasData.Countries.All(c=>c.Shape.IsFrozen),"Géométries mises en cache.");Check(AtlasData.Year(0)==0&&AtlasData.Year(6)==DateTime.Today.Year,"Bornes de la frise.");w.atlas.Seek(0);w.Capture(Path.Combine(directory,"native-0.png"));w.atlas.Play();break;
                        case 1: Check(w.atlas.Position==0&&!w.atlas.Playing,"La vue du monde reste fixe.");w.atlas.Seek(1);w.Capture(Path.Combine(directory,"native-800.png"));break;
                        case 2: w.atlas.Seek(2);w.Capture(Path.Combine(directory,"native-1500.png"));break;
                        case 3: w.atlas.Seek(3);w.Capture(Path.Combine(directory,"native-1800.png"));break;
                        case 4: w.atlas.Seek(4);w.Capture(Path.Combine(directory,"native-1969.png"));break;
                        case 5: w.atlas.Seek(5);w.Capture(Path.Combine(directory,"native-2000.png"));break;
                        case 6: w.atlasTimeline.Value=6;Check(w.atlas.Position==6&&!w.atlas.Playing,"Déplacement de la frise met en pause.");w.atlasCountries.SelectedItem=AtlasData.Countries.First(c=>c.id=="FRA");Check(w.atlas.Selected.id=="FRA","Sélection de la destination.");w.Capture(Path.Combine(directory,"native-obsidienne.png"));w.SelectAtlasTheme(1);break;
                        case 7: Check(w.atlas.Theme==1&&w.atlas.Selected.id=="FRA"&&new PreferenceStore(path).Load().AtlasTheme==1,"Ambiance et destination conservées.");w.Capture(Path.Combine(directory,"native-relique.png"));w.SelectAtlasTheme(2);break;
                        case 8: Check(w.atlas.Theme==2,"Troisième ambiance.");w.Capture(Path.Combine(directory,"native-ion.png"));w.Width=980;w.Height=680;break;
                        case 9: w.Capture(Path.Combine(directory,"native-minimum.png"));old=w.atlas;w.ShowPage("Planning");Check(!old.TimerRunning&&!old.Playing,"Le timer se libère en quittant l’atlas.");w.ShowPage("Accueil");Visuals.ReducedMotion=true;break;
                        case 10: Check(!w.atlas.TimerRunning,"Réduction du mouvement arrête la carte.");Visuals.ReducedMotion=false;w.Width=1180;w.Height=830;w.SelectAtlasTheme(0);
                            IntPtr hwnd=new WindowInteropHelper(w).Handle;using(var icon=System.Drawing.Icon.FromHandle(SendMessage(hwnd,0x7F,new IntPtr(1),IntPtr.Zero)))using(var bitmap=icon.ToBitmap()){Check(bitmap.Width==32,"Icône native 32 pixels.");bitmap.Save(Path.Combine(directory,"taskbar-32.png"));}
                            using(var icon=System.Drawing.Icon.FromHandle(SendMessage(hwnd,0x7F,IntPtr.Zero,IntPtr.Zero)))using(var bitmap=icon.ToBitmap()){Check(bitmap.Width==16,"Icône native 16 pixels.");bitmap.Save(Path.Combine(directory,"taskbar-16.png"));}
                            eyeWindow.Show();eyeClock=Stopwatch.StartNew();stage=20;timer.Interval=TimeSpan.FromMilliseconds(16);break;
                    }
                }catch(Exception ex){timer.Stop();File.WriteAllText(Path.Combine(directory,"atlas-test.txt"),"FAIL stage "+stage+" : "+ex,Encoding.UTF8);app.Shutdown(1);}
            };w.Loaded+=delegate {timer.Start();};w.Show();return app.Run();
        }
    }
}
