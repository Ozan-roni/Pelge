using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.Serialization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Microsoft.Win32;

namespace SeraphimLuxury
{
    static class AppearanceAssets
    {
        public static void Generate(string root)
        {
            foreach(bool premium in new[]{false,true}){
                Visuals.UseEdition(premium);string path=System.IO.Path.Combine(root,"assets",premium?"wallpaper-Seraphim.png":"wallpaper-Control.png");
                var visual=new DrawingVisual();using(var draw=visual.RenderOpen()){
                    var background=new RadialGradientBrush(premium?Visuals.Color("#332A4D"):Visuals.Color("#EAE4FF"),premium?Visuals.Color("#0D1019"):Visuals.Color("#FAF9FF"));background.Center=new Point(.6,.35);background.GradientOrigin=background.Center;background.RadiusX=.9;background.RadiusY=.9;draw.DrawRectangle(background,null,new Rect(0,0,2560,1440));
                    var pen=new Pen(new SolidColorBrush(premium?Color.FromArgb(17,203,187,255):Color.FromArgb(28,102,85,219)),1);for(int x=0;x<2560;x+=80)draw.DrawLine(pen,new Point(x,0),new Point(x,1440));for(int y=0;y<1440;y+=80)draw.DrawLine(pen,new Point(0,y),new Point(2560,y));
                    for(int radius=260;radius<740;radius+=110)draw.DrawEllipse(null,pen,new Point(1280,690),radius,radius);
                    draw.DrawImage(Art.Load(premium?"seraphim-logo.png":"control-logo-black.png"),new Rect(1110,510,340,340));
                    var name=new FormattedText(premium?"S E R A P H I M":"C O N T R O L",System.Globalization.CultureInfo.GetCultureInfo("fr-FR"),FlowDirection.LeftToRight,new Typeface("Segoe UI"),48,Visuals.Text);draw.DrawText(name,new Point(1280-name.Width/2,900));
                    var caption=new FormattedText("Votre attention. Votre intention.",System.Globalization.CultureInfo.GetCultureInfo("fr-FR"),FlowDirection.LeftToRight,new Typeface("Segoe UI"),23,Visuals.Muted);draw.DrawText(caption,new Point(1280-caption.Width/2,984));
                }
                var bitmap=new RenderTargetBitmap(2560,1440,96,96,PixelFormats.Pbgra32);bitmap.Render(visual);var png=new PngBitmapEncoder();png.Frames.Add(BitmapFrame.Create(bitmap));using(var file=File.Create(path))png.Save(file);
            }
        }
    }
    [DataContract] class AppearanceBackup
    {
        [DataMember] public string Wallpaper;
        [DataMember] public int? AppsTheme;
        [DataMember] public int? SystemTheme;
    }
    static class WindowsAppearance
    {
        const string key="Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
        static string backupPath {get{return System.IO.Path.Combine(AccountSession.Root,"appearance-backup.json");}}
        [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool SystemParametersInfo(uint action,uint parameter,string value,uint flags);
        static void Backup()
        {
            if(File.Exists(backupPath))return;using(var registry=Registry.CurrentUser.OpenSubKey(key))using(var desktop=Registry.CurrentUser.OpenSubKey("Control Panel\\Desktop")){
                var data=new AppearanceBackup {Wallpaper=desktop==null?"":Convert.ToString(desktop.GetValue("WallPaper","")),AppsTheme=registry==null?null:registry.GetValue("AppsUseLightTheme") as int?,SystemTheme=registry==null?null:registry.GetValue("SystemUsesLightTheme") as int?};Directory.CreateDirectory(AccountSession.Root);File.WriteAllText(backupPath,Json.Write(data));
            }
        }
        public static void Apply(bool premium,bool wallpaperOnly)
        {
            Backup();string image=System.IO.Path.Combine(Art.Root,"assets",premium?"wallpaper-Seraphim.png":"wallpaper-Control.png");if(!File.Exists(image))throw new IOException("Le fond d'écran est introuvable.");if(!SystemParametersInfo(20,0,image,3))throw new IOException("Windows n'a pas pu appliquer le fond d'écran.");
            if(!wallpaperOnly)using(var registry=Registry.CurrentUser.CreateSubKey(key)){registry.SetValue("AppsUseLightTheme",premium?0:1,RegistryValueKind.DWord);registry.SetValue("SystemUsesLightTheme",premium?0:1,RegistryValueKind.DWord);}
        }
        public static void Restore()
        {
            if(!File.Exists(backupPath))throw new IOException("Aucun changement d'apparence n'a encore été appliqué par Seraphim.");var data=Json.Read<AppearanceBackup>(File.ReadAllText(backupPath));
            if(!SystemParametersInfo(20,0,data.Wallpaper??"",3))throw new IOException("Le fond d'écran d'origine n'a pas pu être restauré.");
            using(var registry=Registry.CurrentUser.CreateSubKey(key)){if(data.AppsTheme.HasValue)registry.SetValue("AppsUseLightTheme",data.AppsTheme.Value,RegistryValueKind.DWord);else registry.DeleteValue("AppsUseLightTheme",false);if(data.SystemTheme.HasValue)registry.SetValue("SystemUsesLightTheme",data.SystemTheme.Value,RegistryValueKind.DWord);else registry.DeleteValue("SystemUsesLightTheme",false);}File.Delete(backupPath);
        }
    }
    partial class MainWindow
    {
        void BuildAppearance()
        {
            TitleSection("APPARENCE  /  UN ÉCHANTILLON","Votre bureau, plus serein.","Un aperçu du fond d'écran, du verre et des couleurs. Windows change uniquement avec les boutons d'application ci-dessous.");
            var desktop=new Grid {Height=350,ClipToBounds=true};desktop.Children.Add(Art.Image(preferences.Premium?"wallpaper-Seraphim.png":"wallpaper-Control.png",1));
            var mock=new StackPanel {Width=340,HorizontalAlignment=HorizontalAlignment.Left,VerticalAlignment=VerticalAlignment.Center,Margin=new Thickness(34)};mock.Children.Add(Visuals.Eyebrow("APERÇU VISUEL  /  CE N'EST PAS WINDOWS"));var time=Visuals.TextBlock("09:41",45,Visuals.Text,true);time.Margin=new Thickness(0,13,0,7);mock.Children.Add(time);mock.Children.Add(Visuals.TextBlock("Une journée à votre rythme.",13,Visuals.Muted));var small=Visuals.Card(mock,new Thickness(25));small.Width=400;small.HorizontalAlignment=HorizontalAlignment.Left;small.VerticalAlignment=VerticalAlignment.Center;small.Margin=new Thickness(25);desktop.Children.Add(small);
            var dock=new StackPanel {Orientation=Orientation.Horizontal,HorizontalAlignment=HorizontalAlignment.Center,VerticalAlignment=VerticalAlignment.Bottom,Margin=new Thickness(0,0,0,15)};foreach(string name in new[]{"Control","Travail","Messages","Chrome"}){var label=Visuals.TextBlock(name,12,Visuals.Gold);label.Margin=new Thickness(18,12,18,12);dock.Children.Add(label);}var dockCard=Visuals.Card(dock,new Thickness(0));dockCard.HorizontalAlignment=HorizontalAlignment.Center;dockCard.VerticalAlignment=VerticalAlignment.Bottom;dockCard.Margin=new Thickness(0,0,0,15);desktop.Children.Add(dockCard);
            page.Children.Add(Visuals.Card(desktop,new Thickness(0)));
            var actions=new WrapPanel {Margin=new Thickness(0,22,0,0)};
            foreach(var item in new[]{Tuple.Create("Appliquer uniquement le fond",0),Tuple.Create("Fond + mode clair/sombre Windows",1),Tuple.Create("Restaurer mon apparence d'origine",2)}){
                int action=item.Item2;var button=Visuals.Button(item.Item1,delegate {try{if(action==2)WindowsAppearance.Restore();else WindowsAppearance.Apply(preferences.Premium,action==0);SetFootnote(action==2?"Apparence d'origine restaurée.":"Apparence appliquée. La restauration reste disponible ici.");}catch(Exception ex){Error(ex);}});button.FontSize=11;button.Margin=new Thickness(0,0,9,9);actions.Children.Add(button);
            }page.Children.Add(actions);
            var chrome=Visuals.Button("Ouvrir les thèmes Chrome préparés   ↗",delegate {try{System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(System.IO.Path.Combine(Art.Root,"chrome-themes")){UseShellExecute=true});}catch(Exception ex){Error(ex);}});chrome.HorizontalAlignment=HorizontalAlignment.Left;chrome.Margin=new Thickness(0,12,0,0);page.Children.Add(chrome);
            var note=Visuals.TextBlock("Les thèmes Chrome modifient les couleurs, les onglets et le fond du nouvel onglet. Les barres d'outils Windows et Chrome gardent leur structure native. Une refonte plus poussée du bureau reste à définir ensemble.",12,Visuals.Muted);note.Margin=new Thickness(0,18,0,0);page.Children.Add(note);
        }
    }
}
