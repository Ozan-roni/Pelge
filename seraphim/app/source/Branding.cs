using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Effects;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Windows.Threading;

namespace SeraphimLuxury
{
    static class Branding
    {
        internal static bool SessionActive;public static void SetSession(bool active){SessionActive=active;foreach(var weak in eyes.ToArray()){var eye=weak.Target as EyeLogo;if(eye!=null)eye.Session(active);}}
        static readonly List<WeakReference> eyes=new List<WeakReference>();
        static readonly Dictionary<Window,IntPtr[]> windowIcons=new Dictionary<Window,IntPtr[]>();
        public static string IconPath(bool premium){return System.IO.Path.Combine(Art.Root,premium?"Seraphim-Premium.ico":"Control.ico");}
        public static BitmapFrame Icon(bool premium){return BitmapDecoder.Create(new Uri(IconPath(premium)),BitmapCreateOptions.PreservePixelFormat,BitmapCacheOption.OnLoad).Frames.OrderByDescending(f=>f.PixelWidth).First();}
        public static System.Drawing.Icon TrayIcon(bool premium){return new System.Drawing.Icon(IconPath(premium),32,32);}
        [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr hwnd,int msg,IntPtr w,IntPtr l);
        [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern IntPtr LoadImage(IntPtr instance,string path,uint type,int width,int height,uint flags);
        [DllImport("user32.dll")] static extern bool DestroyIcon(IntPtr icon);
        public static void SetWindowIcons(Window window,bool premium)
        {
            ReleaseWindowIcons(window);IntPtr hwnd=new WindowInteropHelper(window).Handle;
            var handles=new[]{LoadImage(IntPtr.Zero,IconPath(premium),1,32,32,0x10),LoadImage(IntPtr.Zero,IconPath(premium),1,16,16,0x10)};
            SendMessage(hwnd,0x80,new IntPtr(1),handles[0]);SendMessage(hwnd,0x80,IntPtr.Zero,handles[1]);windowIcons[window]=handles;
        }
        public static void ReleaseWindowIcons(Window window){IntPtr[] handles;if(!windowIcons.TryGetValue(window,out handles))return;foreach(var icon in handles)if(icon!=IntPtr.Zero)DestroyIcon(icon);windowIcons.Remove(window);}
        public static FrameworkElement Eye(double size,bool premium,bool animated)
        {
            var eye=new EyeLogo(premium,animated);eyes.Add(new WeakReference(eye));return new Viewbox {Width=size,Height=size,Child=eye};
        }
        public static FrameworkElement Loading(double size,bool premium){var eye=new EyeLogo(premium,true){LoadingCycle=true};eyes.Add(new WeakReference(eye));return new Viewbox {Width=size,Height=size,Child=eye};}
        public static void MotionChanged(){foreach(var weak in eyes.ToArray()){var eye=weak.Target as EyeLogo;if(eye==null){eyes.Remove(weak);continue;}eye.Motion(!Visuals.ReducedMotion);}}
        public static void UpdateShortcut(bool premium)
        {
            string desktop=System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),"Seraphim.lnk");
            string pinned=System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),"Microsoft","Internet Explorer","Quick Launch","User Pinned","TaskBar");
            var paths=new List<string>();if(File.Exists(desktop))paths.Add(desktop);if(Directory.Exists(pinned))paths.AddRange(Directory.GetFiles(pinned,"*.lnk"));
            string executable=System.IO.Path.GetFullPath(System.IO.Path.Combine(Art.Root,"Seraphim.exe"));
            object shell=null,shortcut=null;
            try {
                shell=Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));
                foreach(string path in paths){
                    shortcut=shell.GetType().InvokeMember("CreateShortcut",BindingFlags.InvokeMethod,null,shell,new object[]{path});
                    string target=shortcut.GetType().InvokeMember("TargetPath",BindingFlags.GetProperty,null,shortcut,null) as string;
                    if(!String.IsNullOrEmpty(target)&&String.Equals(System.IO.Path.GetFullPath(target),executable,StringComparison.OrdinalIgnoreCase)){
                        shortcut.GetType().InvokeMember("IconLocation",BindingFlags.SetProperty,null,shortcut,new object[]{IconPath(premium)+",0"});shortcut.GetType().InvokeMember("Save",BindingFlags.InvokeMethod,null,shortcut,null);IconChanged(0x2000,5,path,null);
                    }
                    Marshal.ReleaseComObject(shortcut);shortcut=null;
                }
            }catch{}finally {if(shortcut!=null)Marshal.ReleaseComObject(shortcut);if(shell!=null)Marshal.ReleaseComObject(shell);}
        }
        [DllImport("shell32.dll",EntryPoint="SHChangeNotify",CharSet=CharSet.Unicode)] static extern void IconChanged(uint change,uint flags,string item,string unused);
        public static void Capture(FrameworkElement element,string file)
        {
            element.UpdateLayout();var bmp=new RenderTargetBitmap((int)Math.Ceiling(element.ActualWidth),(int)Math.Ceiling(element.ActualHeight),96,96,PixelFormats.Pbgra32);bmp.Render(element);
            var png=new PngBitmapEncoder();png.Frames.Add(BitmapFrame.Create(bmp));using(var stream=File.Create(file))png.Save(stream);
        }
        public const string WingShape="M69.54,9.55 C74.13,7.85 72.16,9.47 72.96,9.88 C73.75,10.28 74.14,11.10 74.30,11.98 C74.47,12.86 74.34,14.21 73.93,15.15 C73.52,16.09 75.36,15.98 71.86,17.64 C68.37,19.29 56.93,23.15 52.95,25.08 C48.96,27.01 47.90,28.99 47.96,29.23 C48.02,29.46 50.56,27.47 53.30,26.49 C56.03,25.51 61.11,24.47 64.37,23.34 C67.63,22.21 71.10,20.34 72.86,19.73 C74.61,19.13 74.22,19.42 74.90,19.71 C75.57,19.99 76.53,20.80 76.92,21.43 C77.30,22.07 77.47,22.53 77.22,23.53 C76.98,24.53 77.05,25.89 75.45,27.41 C73.86,28.93 71.80,30.96 67.67,32.67 C63.54,34.38 54.44,36.39 50.67,37.67 C46.89,38.94 47.22,38.83 45.00,40.33 C42.78,41.83 39.17,44.78 37.33,46.67 C35.50,48.56 34.89,51.84 34.00,51.67 C33.11,51.50 32.34,47.73 31.98,45.65 C31.61,43.58 31.64,41.13 31.82,39.20 C32.00,37.27 32.26,36.02 33.08,34.09 C33.89,32.15 34.65,29.93 36.71,27.60 C38.77,25.26 39.97,23.07 45.45,20.06 C50.92,17.06 64.96,11.25 69.54,9.55 Z M79.43,31.85 C81.93,31.69 84.73,32.13 86.96,32.71 C89.18,33.29 90.61,33.77 92.78,35.33 C94.95,36.89 98.04,39.63 99.99,42.04 C101.93,44.45 102.54,45.63 104.46,49.82 C106.38,54.00 110.26,63.64 111.49,67.16 C112.73,70.68 111.92,70.12 111.87,70.92 C111.81,71.72 112.05,71.66 111.17,71.94 C110.29,72.22 107.77,72.76 106.60,72.58 C105.42,72.40 105.53,73.97 104.12,70.86 C102.70,67.75 99.55,57.54 98.08,53.93 C96.62,50.33 96.07,50.24 95.32,49.24 C94.57,48.23 93.24,46.68 93.58,47.91 C93.92,49.14 95.95,52.36 97.36,56.63 C98.77,60.91 101.48,70.40 102.03,73.56 C102.58,76.72 101.41,75.20 100.65,75.58 C99.90,75.97 98.79,76.35 97.50,75.88 C96.21,75.41 94.31,74.68 92.89,72.75 C91.47,70.83 90.09,67.57 89.00,64.33 C87.91,61.10 87.39,56.28 86.33,53.33 C85.28,50.39 84.50,48.83 82.67,46.67 C80.83,44.50 77.61,41.83 75.33,40.33 C73.06,38.83 70.61,38.17 69.00,37.67 C67.39,37.17 65.17,38.00 65.67,37.33 C66.17,36.67 69.71,34.58 72.00,33.67 C74.29,32.75 76.94,32.01 79.43,31.85 Z";
        public const string EyeShape="M57.00,39.00 C59.50,38.61 61.78,38.83 63.67,39.00 C65.56,39.17 66.22,39.17 68.33,40.00 C70.44,40.83 74.06,42.39 76.33,44.00 C78.61,45.61 80.28,47.11 82.00,49.67 C83.72,52.22 86.33,56.39 86.67,59.33 C87.00,62.28 85.50,64.78 84.00,67.33 C82.50,69.89 79.83,72.78 77.67,74.67 C75.50,76.56 73.06,77.72 71.00,78.67 C68.94,79.61 68.11,80.11 65.33,80.33 C62.56,80.56 57.56,80.67 54.33,80.00 C51.11,79.33 48.67,78.17 46.00,76.33 C43.33,74.50 40.33,71.56 38.33,69.00 C36.33,66.44 34.67,63.00 34.00,61.00 C33.33,59.00 33.94,58.44 34.33,57.00 C34.72,55.56 34.94,54.33 36.33,52.33 C37.72,50.33 40.61,46.83 42.67,45.00 C44.72,43.17 46.28,42.33 48.67,41.33 C51.06,40.33 54.50,39.39 57.00,39.00 Z M57.33,46.67 C55.11,46.83 53.67,47.39 52.00,48.00 C50.33,48.61 48.89,49.39 47.33,50.33 C45.78,51.28 44.39,52.11 42.67,53.67 C40.94,55.22 37.33,57.89 37.00,59.67 C36.67,61.44 38.89,62.67 40.67,64.33 C42.44,66.00 45.06,68.22 47.67,69.67 C50.28,71.11 53.33,72.50 56.33,73.00 C59.33,73.50 63.22,73.06 65.67,72.67 C68.11,72.28 69.22,71.56 71.00,70.67 C72.78,69.78 74.28,69.06 76.33,67.33 C78.39,65.61 82.17,61.67 83.33,60.33 C84.50,59.00 84.00,60.22 83.33,59.33 C82.67,58.44 81.22,56.61 79.33,55.00 C77.44,53.39 74.33,51.00 72.00,49.67 C69.67,48.33 67.78,47.50 65.33,47.00 C62.89,46.50 59.56,46.50 57.33,46.67 Z";
        public static void GenerateAssets(string root)
        {
            Art.Root=root;
            var eye=Eye(512,true,false);eye.Measure(new Size(512,512));eye.Arrange(new Rect(0,0,512,512));Capture(eye,System.IO.Path.Combine(root,"assets","seraphim-logo.png"));
            string path="<path stroke='white' stroke-width='.45' stroke-linejoin='round' fill-rule='evenodd' d='"+WingShape+"'/>";string svg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><g fill='white'>";
            svg+=path+"<g transform='rotate(180 60 60)'>"+path+"</g>";
            File.WriteAllText(System.IO.Path.Combine(root,"assets","seraphim-wings.svg"),svg+"</g></svg>");
        }
    }
    class EyeLogo : Grid
    {
        internal bool LoadingCycle;readonly RotateTransform orbit=new RotateTransform(0,60,60);readonly bool premium;bool active;internal double WingAngle {get{return orbit.Angle;}}
        readonly TranslateTransform glance=new TranslateTransform();readonly ScaleTransform lid=new ScaleTransform(1,1,60,61);bool requested;
        internal double Aperture {get{return lid.ScaleY;}}
        internal double GazeX {get{return glance.X;}}
        public EyeLogo(bool premium,bool animate)
        {
            this.premium=premium;active=Branding.SessionActive;Width=120;Height=120;requested=animate;if(premium)lid.CenterY=60;
            // Separate the opening from the original wings so both lids close together, including the iris.
            var eyeRegion=Geometry.Parse("M34,61 C38,46 51,35 60,37 C74,35 86,50 88,61 C84,77 72,86 60,85 C45,85 37,74 34,61 Z");
            var wings=new Image {Source=Art.Load(premium?"control-logo-white.png":"control-logo-black.png"),Stretch=Stretch.Uniform,Clip=new CombinedGeometry(GeometryCombineMode.Exclude,new RectangleGeometry(new Rect(0,0,120,120)),eyeRegion)};
            if(!premium){wings.RenderTransform=orbit;Children.Add(wings);}
            else {var wingLayer=new Grid {Width=120,Height=120,RenderTransform=orbit};Children.Add(wingLayer);for(int i=0;i<2;i++){var feather=new System.Windows.Shapes.Path {Data=Geometry.Parse(Branding.WingShape),Fill=Brushes.White,Stroke=Brushes.White,StrokeThickness=.45,StrokeLineJoin=PenLineJoin.Round,RenderTransform=new RotateTransform(i*180,60,60),IsHitTestVisible=false};wingLayer.Children.Add(feather);}}
            var opening=new Grid {Width=120,Height=120,RenderTransform=lid};Children.Add(opening);
            if(premium)opening.Children.Add(new System.Windows.Shapes.Path {Data=Geometry.Parse(Branding.EyeShape),Fill=Brushes.White});else opening.Children.Add(new Image {Source=Art.Load(premium?"control-logo-white.png":"control-logo-black.png"),Stretch=Stretch.Uniform,Clip=eyeRegion});
            var inside=new Grid {RenderTransform=premium?new TranslateTransform(0,2):null,Clip=Geometry.Parse("M37,58 C45,47 54,44 60,44 C67,44 77,48 84,58 C76,69 67,72 60,72 C52,72 43,67 37,58 Z")};opening.Children.Add(inside);
            var irisGroup=new Grid {Width=120,Height=120,RenderTransform=glance};inside.Children.Add(irisGroup);
            var iris=new Ellipse {Width=17,Height=17,Fill=premium?Brushes.White:Brushes.Black,Stroke=premium?Brushes.White:Brushes.Black,StrokeThickness=.45,HorizontalAlignment=HorizontalAlignment.Left,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(51.5,49.5,0,0)};irisGroup.Children.Add(iris);
            irisGroup.Children.Add(new Ellipse {Width=7,Height=7,Fill=premium?Visuals.Brush("#15141D"):Brushes.White,HorizontalAlignment=HorizontalAlignment.Left,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(56.5,54.5,0,0)});
            irisGroup.Children.Add(new Ellipse {Width=3.2,Height=3.2,Fill=Brushes.White,HorizontalAlignment=HorizontalAlignment.Left,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(54,51.5,0,0)});
            irisGroup.Children.Add(new Ellipse {Width=1.2,Height=1.2,Fill=Brushes.White,Opacity=.6,HorizontalAlignment=HorizontalAlignment.Left,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(63,61,0,0)});
            Loaded+=delegate {Motion(requested&&!Visuals.ReducedMotion);};Unloaded+=delegate {Motion(false);};
        }
        public void Session(bool value){active=value;WingMotion();}
        void WingMotion(){double angle=orbit.Angle;orbit.BeginAnimation(RotateTransform.AngleProperty,null);orbit.Angle=angle%360;if((!active&&!LoadingCycle)||(!premium&&!LoadingCycle)||!requested||Visuals.ReducedMotion||!IsLoaded)return;if(LoadingCycle){var cycle=new DoubleAnimationUsingKeyFrames {Duration=TimeSpan.FromSeconds(3.6),RepeatBehavior=RepeatBehavior.Forever};foreach(var v in new[]{Tuple.Create(0.0,0.0),Tuple.Create(1.1,170.0),Tuple.Create(1.5,170.0),Tuple.Create(3.0,360.0),Tuple.Create(3.6,360.0)})cycle.KeyFrames.Add(new EasingDoubleKeyFrame(v.Item2,KeyTime.FromTimeSpan(TimeSpan.FromSeconds(v.Item1)),new CubicEase {EasingMode=EasingMode.EaseInOut}));orbit.BeginAnimation(RotateTransform.AngleProperty,cycle);}else orbit.BeginAnimation(RotateTransform.AngleProperty,new DoubleAnimation(orbit.Angle,orbit.Angle+360,TimeSpan.FromSeconds(24)){RepeatBehavior=RepeatBehavior.Forever});}
        public void Motion(bool enabled)
        {
            glance.BeginAnimation(TranslateTransform.XProperty,null);glance.BeginAnimation(TranslateTransform.YProperty,null);lid.BeginAnimation(ScaleTransform.ScaleYProperty,null);glance.X=0;glance.Y=0;lid.ScaleY=1;
            if(!enabled){double angle=orbit.Angle;orbit.BeginAnimation(RotateTransform.AngleProperty,null);orbit.Angle=angle%360;}else WingMotion();
            if(!enabled||!requested)return;
            var look=new DoubleAnimationUsingKeyFrames {Duration=TimeSpan.FromSeconds(9.2),RepeatBehavior=RepeatBehavior.Forever};
            foreach(var pair in new[]{Tuple.Create(0.0,0.0),Tuple.Create(1.1,0.0),Tuple.Create(1.36,-6.0),Tuple.Create(2.65,-6.0),Tuple.Create(2.95,5.5),Tuple.Create(4.8,5.5),Tuple.Create(5.12,0.0),Tuple.Create(9.2,0.0)})look.KeyFrames.Add(new EasingDoubleKeyFrame(pair.Item2,KeyTime.FromTimeSpan(TimeSpan.FromSeconds(pair.Item1)),new CubicEase {EasingMode=EasingMode.EaseInOut}));glance.BeginAnimation(TranslateTransform.XProperty,look);
            var vertical=new DoubleAnimation(0,-1.8,TimeSpan.FromSeconds(3.4)){AutoReverse=true,RepeatBehavior=RepeatBehavior.Forever,EasingFunction=new SineEase {EasingMode=EasingMode.EaseInOut}};glance.BeginAnimation(TranslateTransform.YProperty,vertical);
            var blink=new DoubleAnimationUsingKeyFrames {Duration=TimeSpan.FromSeconds(7.6),RepeatBehavior=RepeatBehavior.Forever};
            foreach(var pair in new[]{Tuple.Create(0.0,1.0),Tuple.Create(2.15,1.0),Tuple.Create(2.24,.035),Tuple.Create(2.29,.035),Tuple.Create(2.44,1.0),Tuple.Create(6.05,1.0),Tuple.Create(6.14,.035),Tuple.Create(6.20,.035),Tuple.Create(6.36,1.0),Tuple.Create(7.6,1.0)})blink.KeyFrames.Add(new EasingDoubleKeyFrame(pair.Item2,KeyTime.FromTimeSpan(TimeSpan.FromSeconds(pair.Item1)),new SineEase {EasingMode=EasingMode.EaseInOut}));lid.BeginAnimation(ScaleTransform.ScaleYProperty,blink);
        }
    }
    class SplashWindow : Window
    {
        readonly DispatcherTimer timer;readonly DateTime began=DateTime.UtcNow;readonly Border progress;
        public SplashWindow(bool premium,bool reduced,Action done)
        {
            Width=460;Height=440;WindowStartupLocation=WindowStartupLocation.CenterScreen;WindowStyle=WindowStyle.None;ResizeMode=ResizeMode.NoResize;AllowsTransparency=true;Background=Brushes.Transparent;ShowInTaskbar=false;Topmost=true;
            var canvas=new Grid {Margin=new Thickness(20)};
            var core=new StackPanel {HorizontalAlignment=HorizontalAlignment.Center,VerticalAlignment=VerticalAlignment.Center};
            var orbit=new Grid {Width=235,Height=235};orbit.Children.Add(new Ellipse {Stroke=Visuals.Line,StrokeThickness=.7,Margin=new Thickness(5)});orbit.Children.Add(new Ellipse {Stroke=Visuals.Gold,StrokeThickness=.6,StrokeDashArray=new DoubleCollection {1,13},Opacity=.8,Margin=new Thickness(20)});orbit.Children.Add(Branding.Loading(192,premium));core.Children.Add(orbit);
            var track=new Grid {Width=185,Height=1,Margin=new Thickness(0,22,0,0),Background=Brushes.Transparent};progress=new Border {Width=0,HorizontalAlignment=HorizontalAlignment.Left,Background=Visuals.Gold};track.Children.Add(progress);core.Children.Add(track);canvas.Children.Add(core);Content=canvas;
            timer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(30)};timer.Tick+=delegate {double p=Math.Min(1,(DateTime.UtcNow-began).TotalSeconds/(reduced?.3:2.7));progress.Width=p*185;if(p<1)return;timer.Stop();Action finish=delegate {Close();done();};if(reduced)finish();else Visuals.Fade(this,1,0,350,finish);};Loaded+=delegate {if(!reduced)Visuals.Fade(this,0,1,260);timer.Start();};Closed+=delegate {timer.Stop();};
        }
    }
    partial class MainWindow
    {
        SplashWindow startSplash;
        void StartSplash(bool activate)
        {
            bool resumeAtlas=atlas!=null&&atlas.Playing;if(resumeAtlas)atlas.Seek(0);
            Opacity=0;ShowInTaskbar=false;startSplash=new SplashWindow(preferences.Premium,preferences.ReducedMotion,delegate {
                startSplash=null;ShowInTaskbar=true;Opacity=1;Activate();if(activate)BeginLoading(true);else if(!preferences.ReducedMotion)Visuals.Fade(this,0,1,750);
                if(resumeAtlas&&atlas!=null)atlas.Play();
            });startSplash.Show();
        }
    }
}
