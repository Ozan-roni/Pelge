using System;
using System.IO;using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Interop;
using System.Windows.Media.Imaging;

namespace SeraphimLuxury
{
    partial class MainWindow
    {
        TextBlock studioThreatCount;
        Button studioThreatButton;
        FilterSpark studioThreatGraph;
        Button StudioButton(string text,Action action)
        {
            var b=Visuals.Button(text,action);b.Background=Brushes.Transparent;b.Foreground=Visuals.Text;b.BorderBrush=Visuals.Brush(preferences.Premium?"#4B61536F":"#50736488");b.BorderThickness=new Thickness(.65);b.MinHeight=27;b.Padding=new Thickness(10,5,10,5);b.FontSize=10;return b;
        }
        Border StudioSurface(UIElement child)
        {
            var b=Visuals.Card(child,new Thickness(0));b.Background=Brushes.Transparent;b.BorderThickness=new Thickness(0);b.Clip=null;b.SizeChanged+=delegate {b.Clip=null;};
            if(preferences.AtlasConcept==1){b.Padding=new Thickness(12);b.BorderThickness=new Thickness(0,1,0,0);}
            if(preferences.AtlasConcept==2){b.Padding=new Thickness(12);b.Background=new RadialGradientBrush(Visuals.Color("#186E5CC0"),Colors.Transparent);}
            return b;
        }
        [DllImport("shell32.dll",CharSet=CharSet.Unicode)]static extern int SHDefExtractIcon(string file,int index,uint flags,out IntPtr large,out IntPtr small,uint size);
        [DllImport("user32.dll")]static extern bool DestroyIcon(IntPtr icon);
        static BitmapSource ReadLargeIcon(string path){IntPtr large=IntPtr.Zero,small=IntPtr.Zero;try{if(SHDefExtractIcon(path,0,0,out large,out small,256)==0&&large!=IntPtr.Zero){var bitmap=Imaging.CreateBitmapSourceFromHIcon(large,Int32Rect.Empty,BitmapSizeOptions.FromEmptyOptions());bitmap.Freeze();return bitmap;}}catch{}finally{if(large!=IntPtr.Zero)DestroyIcon(large);if(small!=IntPtr.Zero)DestroyIcon(small);}using(var icon=System.Drawing.Icon.ExtractAssociatedIcon(path)){var bitmap=Imaging.CreateBitmapSourceFromHIcon(icon.Handle,Int32Rect.Empty,BitmapSizeOptions.FromEmptyOptions());bitmap.Freeze();return bitmap;}}
        static readonly Dictionary<string,BitmapSource> appIcons=new Dictionary<string,BitmapSource>();
        internal FrameworkElement ApplicationLogo(AppEntry entry,double size)
        {
            if(entry.Id=="roblox-studio"||entry.Name.IndexOf("Roblox Studio",StringComparison.OrdinalIgnoreCase)>=0){var studio=new System.Windows.Controls.Image {Source=Art.Load("app-roblox-studio.png"),Width=size,Height=size,Stretch=Stretch.Uniform};RenderOptions.SetBitmapScalingMode(studio,BitmapScalingMode.HighQuality);return studio;}

            var social=SocialLogo(entry.Id,size);if(social==null)foreach(var brand in new[]{"instagram","facebook","snapchat","tiktok","youtube","discord","reddit","pinterest","linkedin"})if(entry.Name.IndexOf(brand,StringComparison.OrdinalIgnoreCase)>=0){social=SocialLogo("social-"+brand,size);break;}if(social!=null)return social;string target=entry.Executable??entry.Target;if(entry.Id=="browser")target=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"Microsoft","Edge","Application","msedge.exe");
            try {if(target.StartsWith("shell:AppsFolder\\",StringComparison.OrdinalIgnoreCase)){if(!appIcons.ContainsKey(target))appIcons[target]=ShellImage14.Read(target);if(appIcons[target]!=null)return new System.Windows.Controls.Image {Source=appIcons[target],Width=size,Height=size,Stretch=Stretch.Uniform};}if(File.Exists(target)){if(!appIcons.ContainsKey(target)){appIcons[target]=ReadLargeIcon(target);}return new System.Windows.Controls.Image {Source=appIcons[target],Width=size,Height=size,Stretch=Stretch.Uniform};}}
            catch { }
            var glyph=Visuals.TextBlock(String.IsNullOrEmpty(entry.Glyph)?"\uE71D":entry.Glyph,size,Visuals.Gold);glyph.FontFamily=new FontFamily("Segoe MDL2 Assets");glyph.Width=size+4;glyph.Height=size+4;glyph.TextAlignment=TextAlignment.Center;return glyph;
        }
    }
}
