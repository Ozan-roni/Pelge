using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Effects;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Windows.Threading;
using Forms = System.Windows.Forms;
using Path = System.IO.Path;

namespace SeraphimLuxury
{
    [DataContract] public class AppEntry
    {
        [DataMember] public string Id;
        [DataMember] public string Name;
        [DataMember] public string Target;
        [DataMember] public string Glyph;
        [DataMember] public string Executable;
        [DataMember] public bool Protected;
        [DataMember] public bool Work;
        [DataMember] public bool Social;
    }
    [DataContract] public class Preferences
    {
        [DataMember] public List<AppPolicy14> AppPolicies;
        [DataMember] public List<string> RecentApplications;
        [DataMember] public int ApplicationLayout;
        [DataMember] public bool GrayWeb,ShieldWeb;
        [DataMember] public bool FeedBlankApplied16;
        [DataMember] public string AutoLaunchApp;
        [DataMember] public long PostModeUntil;
        [DataMember] public List<string> Steps;
        [DataMember] public List<AppEntry> Apps;
        [DataMember] public bool GlobeView,AircraftFlow,BlacklistEnabled=true;
        [DataMember] public string AiModel;
        [DataMember] public int SocialCatalogVersion;
        [DataMember] public List<string> Blacklist=new List<string>();
        [DataMember] public bool ReducedMotion;
        [DataMember] public bool Premium;
        [DataMember] public List<DailyPlan> Plans = new List<DailyPlan>();
        [DataMember] public bool SoftPlanning = true;
        [DataMember] public int WorkflowVersion = 1;
        [DataMember] public bool SocialPassage = true;
        [DataMember] public bool AdultFilter = true;
        [DataMember] public bool QuietFeeds = true;
        [DataMember] public List<string> SocialDomains = WebPolicy.DefaultSocial.ToList();
        [DataMember] public string GmailClientId;
        [DataMember] public int AtlasTheme,AtlasConcept;
        [DataMember] public bool ThreatProtection;
        [DataMember] public List<ThreatEvent> ThreatEvents=new List<ThreatEvent>();
        [DataMember] public bool HideShortVideos;
        [DataMember] public string VpnCityId;
        [DataMember] public bool HideAds;
        [DataMember] public List<string> RecentVpnCities=new List<string>();
        [DataMember] public List<FilterDay> FilterHistory=new List<FilterDay>();
        [DataMember] public int ToolVersion,ClockHours,ScreenLimitMinutes,TimeNoticeMinutes,IdleMinutes,TaskAdvanceMinutes,TaskRepeatMinutes;
        [DataMember] public bool ClockEnabled,TimeTracking,CalendarAlerts,TaskAlerts,NativeContentLock,LimitBlock;
        [DataMember] public List<CalendarEntry> Calendar=new List<CalendarEntry>();
        [DataMember] public List<UsageEntry> Usage=new List<UsageEntry>();
        public static Preferences Defaults()
        {
            return new Preferences {
                Steps = new List<string> { "Définir mon objectif", "Préparer mon espace", "Choisir ma priorité" },
                Apps = new List<AppEntry> {
                    new AppEntry {Id="browser", Name="Navigateur", Target="https://www.google.com/", Glyph="\uE774", Protected=true},
                    new AppEntry {Id="notepad", Name="Bloc-notes", Target=Path.Combine(Environment.SystemDirectory,"notepad.exe"), Glyph="\uE70B", Protected=true},
                    new AppEntry {Id="calculator", Name="Calculatrice", Target=Path.Combine(Environment.SystemDirectory,"calc.exe"), Glyph="\uE8EF", Protected=true},
                    new AppEntry {Id="explorer", Name="Explorateur", Target=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"explorer.exe"), Glyph="\uE8B7", Protected=true},
                    new AppEntry {Id="documents", Name="Documents", Target=Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), Glyph="\uE8A5", Protected=false},
                    new AppEntry {Id="settings", Name="Réglages Windows", Target="ms-settings:", Glyph="\uE713", Protected=false}
                }
            };
        }
    }
    public class PreferenceStore
    {
        public readonly string FilePath;
        public string Warning;
        public PreferenceStore(string filePath) { FilePath = filePath; }
        public Preferences Load()
        {
            if (!File.Exists(FilePath)) return Preferences.Defaults();
            try {
                using (var stream = File.OpenRead(FilePath)) {
                    var p = (Preferences)new DataContractJsonSerializer(typeof(Preferences)).ReadObject(stream);
                    if (p == null || p.Steps == null || p.Apps == null || p.Steps.Count > 12 || p.Apps.Count > 600
                        || p.Steps.Any(s => String.IsNullOrWhiteSpace(s) || s.Length > 100)
                        || p.Apps.Any(a => a == null || String.IsNullOrWhiteSpace(a.Id) || String.IsNullOrWhiteSpace(a.Target) || String.IsNullOrWhiteSpace(a.Name)))
                        throw new InvalidDataException("Configuration incomplète.");
                    if(p.Plans==null)p.Plans=new List<DailyPlan>();
                    if(p.WorkflowVersion==0){p.SoftPlanning=true;p.SocialPassage=true;p.AdultFilter=true;p.QuietFeeds=true;p.WorkflowVersion=1;}
                    if(p.ThreatEvents==null)p.ThreatEvents=new List<ThreatEvent>();p.ThreatEvents=p.ThreatEvents.Where(e=>e!=null&&WebPolicy.ValidDomain(e.Host)).Take(200).ToList();p.AtlasConcept=Math.Max(0,Math.Min(2,p.AtlasConcept));
                    if(p.RecentVpnCities==null)p.RecentVpnCities=new List<string>();if(p.FilterHistory==null)p.FilterHistory=new List<FilterDay>();p.FilterHistory=p.FilterHistory.Where(d=>d!=null&&d.Shorts>=0&&d.Ads>=0&&d.Adults>=0).OrderByDescending(d=>d.Day).Take(365).ToList();
                    if(p.SocialDomains==null)p.SocialDomains=WebPolicy.DefaultSocial.ToList();
                    p.AtlasTheme=Math.Max(0,Math.Min(2,p.AtlasTheme));
                    if(p.Plans.Any(d=>d==null||d.Tasks==null||d.Tasks.Count>40||d.Tasks.Any(t=>t==null||String.IsNullOrWhiteSpace(t.Id)||String.IsNullOrWhiteSpace(t.Title)||t.Title.Length>150||(!String.IsNullOrEmpty(t.Time)&&!Planning.ValidTime(t.Time)))))throw new InvalidDataException("Planning invalide.");
                    MainWindow.NormalizeTools(p);return p;
                }
            } catch { Warning = "Les préférences n'ont pas pu être lues. Le fichier original est conservé."; return Preferences.Defaults(); }
        }
        public void Save(Preferences prefs)
        {
            if (Warning != null) throw new IOException("Le fichier de préférences existant est illisible. Il a été conservé : " + FilePath);
            Directory.CreateDirectory(Path.GetDirectoryName(FilePath));
            string temporary = FilePath + ".new";
            using (var stream = File.Create(temporary)) new DataContractJsonSerializer(typeof(Preferences)).WriteObject(stream, prefs);
            if (File.Exists(FilePath)) File.Replace(temporary, FilePath, FilePath + ".backup");
            else File.Move(temporary, FilePath);
        }
    }
    public class SessionState
    {
        public bool Active { get; private set; }
        public readonly HashSet<int> Checked = new HashSet<int>();
        public readonly HashSet<string> Prepared = new HashSet<string>();
        public int StepCount;
        public SessionState(int steps) { StepCount = steps; }
        public bool Complete { get { return StepCount > 0 && Enumerable.Range(0, StepCount).All(i => Checked.Contains(i)); } }
        public void Activate() { Checked.Clear();Prepared.Clear(); Active = true; }
        public void Deactivate() { Active = false; Checked.Clear();Prepared.Clear(); }
        public bool CanLaunch(AppEntry app) { return !Active || !app.Protected || Complete; }
        public void Reset(int count) { StepCount = count; Checked.Clear(); }
    }
    public class ActivationGesture
    {
        bool latched; int clicks; DateTime firstClick;
        public bool KeyChord(bool ctrl, bool alt, bool enter, bool s)
        {
            bool pressed = ctrl && alt && enter && s;
            bool fire = pressed && !latched; latched = pressed; return fire;
        }
        public bool MiddleClick(DateTime now)
        {
            if (clicks == 0 || (now - firstClick).TotalSeconds > 5) { clicks = 0; firstClick = now; }
            clicks++; if (clicks == 7) { clicks = 0; return true; } return false;
        }
        public void ResetClicks() { clicks = 0; }
    }
    static class Native
    {
        public const int ShowMessage = 0x8001, ActivateMessage = 0x8002;
        [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int key);
        [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string title);
        [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l);
        public static bool Down(int key) { return (GetAsyncKeyState(key) & 0x8000) != 0; }
    }
    static class Art
    {
        public static string Root = AppDomain.CurrentDomain.BaseDirectory;
        static readonly Dictionary<string, BitmapImage> Cache = new Dictionary<string, BitmapImage>();
        public static BitmapImage Load(string name)
        {
            if (Cache.ContainsKey(name)) return Cache[name];
            string path = Path.Combine(Root, "assets", name);
            if (!File.Exists(path)) return null;
            var bitmap = new BitmapImage(); bitmap.BeginInit(); bitmap.CacheOption = BitmapCacheOption.OnLoad;
            bitmap.UriSource = new Uri(path); bitmap.DecodePixelWidth = name.StartsWith("flags/",StringComparison.Ordinal)?80:1600; bitmap.EndInit(); bitmap.Freeze();
            Cache[name] = bitmap; return bitmap;
        }
        public static Image Image(string name, double opacity)
        { return new Image { Source=Load(name), Stretch=Stretch.UniformToFill, Opacity=opacity, IsHitTestVisible=false }; }
    }
    static class Visuals
    {
        public static bool Premium;
        public static bool ReducedMotion;
        public static Brush Gold, Text, Muted, Line;
        public static readonly string[] OriginalColors = {"#D8BD83","#F1EDE5","#92918E","#32312D","#24221F","#17191D","#202124","#E8E4DC","#3A3832","#A38E68","#E0C795","#EBD4A5","#F0DFC0","#C6A568","#E6E0D5","#6C6250","#17191C","#161512","#ECD3A1","#FFF1CD","#F0EADF","#111317","#38372F","#E1C78F","#806B47","#4E473A","#2C2922","#101114","#504B3E","#28251F","#696861","#C7090B0F","#0B0C0F","#A6090A0C","#ED090A0C","#4B4437","#383227","#FF111215","#F0111215","#00111215","#FF18191B","#F014161A"};
        public static readonly string[] LightColors = {"#6557FF","#11162C","#75809E","#E7E1F3","#FEFDFF","#F5F2FC","#FCFAFF","#11162C","#E4DEF2","#9988ED","#6557FF","#8472FF","#8D79FF","#6557FF","#28304C","#D2C7EE","#FCFAFF","#FFFFFF","#8D79FF","#6557FF","#11162C","#FFFFFF","#E4DEF2","#6557FF","#CFC5FF","#D3CAE7","#E9DFFC","#FAF9FE","#E9E5F2","#ECE7FF","#8991A9","#C7EBE6F5","#FAF9FE","#A6FCFAFF","#EDF7F4FD","#DFD5F2","#E2DBF3","#FFFDFBFF","#F0FDFBFF","#00FDFBFF","#FFF8F5FD","#F0F8F5FD"};
        public static readonly string[] DarkColors = {"#C6B8FF","#F0EDF8","#9791AA","#373246","#24212E","#151620","#201E2B","#EEEBF7","#413A54","#9687BC","#D7C9FF","#D9CFFF","#E7DFFB","#ABA0D4","#E8E4F2","#645A7D","#161520","#141320","#D2C4F6","#EEE4FF","#F0EDF8","#11121A","#3D3650","#CABCF8","#665A85","#514663","#2B2439","#0E1018","#42394F","#292339","#777185","#C7090A12","#0B0D15","#A6090A12","#ED090A12","#49415D","#383047","#FF10121A","#F010121A","#0010121A","#FF161520","#F0141420"};
        public static void UseEdition(bool premium) {Premium=premium;Gold=Brush("#D8BD83");Text=Brush("#F1EDE5");Muted=Brush("#92918E");Line=Brush("#32312D");}
        public static string Map(string hex) {int i=Array.IndexOf(OriginalColors,hex.ToUpperInvariant());return i<0?hex:(Premium?DarkColors[i]:LightColors[i]);}
        public static Color Color(string hex) {return (Color)ColorConverter.ConvertFromString(Map(hex));}
        public static SolidColorBrush Brush(string hex) { return new SolidColorBrush(Color(hex)); }
        public static TextBlock TextBlock(string text, double size, Brush color=null, bool serif=false)
        {
            return new TextBlock { Text=text, FontSize=size, Foreground=color ?? Text, FontFamily=new FontFamily("Segoe UI"),FontWeight=serif?FontWeights.SemiBold:FontWeights.Normal,
                TextWrapping=TextWrapping.Wrap, LineHeight=size*1.4 };
        }
        public static TextBlock Eyebrow(string text) { return TextBlock(text, 10, Gold); }
        public static Border Card(UIElement child, Thickness padding)
        {
            var card = new Border { Background=new LinearGradientBrush(Premium?Color("#2424212E"):Color("#24FFFFFF"),
                Premium?Color("#18151620"):Color("#08F5F2FC"), 115), BorderBrush=new LinearGradientBrush(new GradientStopCollection {
                    new GradientStop(Premium?Color("#706B5C87"):Color("#FFFFFFFF"),0),new GradientStop(((SolidColorBrush)Line).Color,.42),new GradientStop(Premium?Color("#403D3352"):Color("#CDE6DFF6"),1)},new Point(0,0),new Point(1,1)), BorderThickness=new Thickness(0,0,0,.6),
                CornerRadius=new CornerRadius(0), Padding=padding, Child=child };
            card.SizeChanged += delegate { card.Clip=new RectangleGeometry(new Rect(0,0,card.ActualWidth,card.ActualHeight),0,0); };
            return card;
        }
        public static Button Button(string text, Action action, bool primary=false)
        {
            var b = new Button {Content=text, Style=(Style)Application.Current.Resources[primary ? "GoldButton" : "SoftButton"], MinHeight=43,
                Padding=new Thickness(18,10,18,10), FontSize=12, Cursor=Cursors.Hand, HorizontalContentAlignment=HorizontalAlignment.Center};
            AutomationProperties.SetName(b,text); b.Click += delegate { action(); }; return b;
        }
        static bool scroll13Registered;
        public static void InstallStyles(Application app)
        {
            string xaml = @"<ResourceDictionary xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation' xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'>
              <Style x:Key='SoftButton' TargetType='Button'>
                <Setter Property='Background' Value='#202124'/><Setter Property='Foreground' Value='#E8E4DC'/><Setter Property='BorderBrush' Value='#3A3832'/><Setter Property='BorderThickness' Value='1'/>
                <Setter Property='Template'><Setter.Value><ControlTemplate TargetType='Button'><Border x:Name='box' Background='{TemplateBinding Background}' BorderBrush='{TemplateBinding BorderBrush}' BorderThickness='{TemplateBinding BorderThickness}' CornerRadius='12' Padding='{TemplateBinding Padding}'><ContentPresenter HorizontalAlignment='{TemplateBinding HorizontalContentAlignment}' VerticalAlignment='Center'/></Border><ControlTemplate.Triggers><Trigger Property='IsMouseOver' Value='True'><Setter TargetName='box' Property='BorderBrush' Value='#A38E68'/><Setter TargetName='box' Property='Opacity' Value='.85'/></Trigger><Trigger Property='IsKeyboardFocused' Value='True'><Setter TargetName='box' Property='BorderBrush' Value='#E0C795'/></Trigger><Trigger Property='IsPressed' Value='True'><Setter TargetName='box' Property='Opacity' Value='.6'/></Trigger><Trigger Property='IsEnabled' Value='False'><Setter TargetName='box' Property='Opacity' Value='.38'/></Trigger></ControlTemplate.Triggers></ControlTemplate></Setter.Value></Setter>
              </Style>
              <Style x:Key='GoldButton' TargetType='Button' BasedOn='{StaticResource SoftButton}'><Setter Property='Foreground' Value='#161512'/><Setter Property='BorderBrush' Value='#EBD4A5'/><Setter Property='Background'><Setter.Value><LinearGradientBrush StartPoint='0,0' EndPoint='1,1'><GradientStop Color='#F0DFC0' Offset='0'/><GradientStop Color='#C6A568' Offset='1'/></LinearGradientBrush></Setter.Value></Setter></Style>
              <Style x:Key='StepCheck' TargetType='CheckBox'><Setter Property='Foreground' Value='#E6E0D5'/><Setter Property='FontSize' Value='13'/><Setter Property='Cursor' Value='Hand'/><Setter Property='Template'><Setter.Value><ControlTemplate TargetType='CheckBox'><Grid><Grid.ColumnDefinitions><ColumnDefinition Width='32'/><ColumnDefinition Width='*'/></Grid.ColumnDefinitions><Border x:Name='square' Width='21' Height='21' HorizontalAlignment='Left' VerticalAlignment='Center' BorderBrush='#6C6250' BorderThickness='1' CornerRadius='6' Background='#17191C'><TextBlock x:Name='mark' Text='✓' Visibility='Collapsed' Foreground='#161512' FontSize='14' HorizontalAlignment='Center' VerticalAlignment='Center'/></Border><ContentPresenter Grid.Column='1' VerticalAlignment='Center'/></Grid><ControlTemplate.Triggers><Trigger Property='IsChecked' Value='True'><Setter TargetName='square' Property='Background' Value='#D8BD83'/><Setter TargetName='mark' Property='Visibility' Value='Visible'/></Trigger><Trigger Property='IsMouseOver' Value='True'><Setter TargetName='square' Property='BorderBrush' Value='#ECD3A1'/></Trigger><Trigger Property='IsKeyboardFocused' Value='True'><Setter TargetName='square' Property='BorderBrush' Value='#FFF1CD'/></Trigger></ControlTemplate.Triggers></ControlTemplate></Setter.Value></Setter></Style>
              <Style TargetType='TextBox'><Setter Property='Foreground' Value='#F0EADF'/><Setter Property='Background' Value='#111317'/><Setter Property='BorderBrush' Value='#38372F'/><Setter Property='BorderThickness' Value='1'/><Setter Property='Padding' Value='12'/><Setter Property='CaretBrush' Value='#E1C78F'/><Setter Property='SelectionBrush' Value='#806B47'/><Setter Property='Template'><Setter.Value><ControlTemplate TargetType='TextBox'><Border x:Name='border' Background='{TemplateBinding Background}' BorderBrush='{TemplateBinding BorderBrush}' BorderThickness='{TemplateBinding BorderThickness}' CornerRadius='10' Padding='{TemplateBinding Padding}'><ScrollViewer x:Name='PART_ContentHost'/></Border><ControlTemplate.Triggers><Trigger Property='IsKeyboardFocused' Value='True'><Setter TargetName='border' Property='BorderBrush' Value='#D8BD83'/></Trigger></ControlTemplate.Triggers></ControlTemplate></Setter.Value></Setter></Style>
              <Style TargetType='ScrollBar'><Setter Property='Width' Value='5'/><Setter Property='Background' Value='Transparent'/><Setter Property='Template'><Setter.Value><ControlTemplate TargetType='ScrollBar'><Grid Width='5' ClipToBounds='True' Background='Transparent'><Track Width='5' x:Name='PART_Track' Orientation='Vertical' IsDirectionReversed='True'><Track.DecreaseRepeatButton><RepeatButton Command='{x:Static ScrollBar.PageUpCommand}' Opacity='0' Focusable='False'/></Track.DecreaseRepeatButton><Track.Thumb><Thumb Width='3'><Thumb.Template><ControlTemplate TargetType='Thumb'><Border Background='#544F456A' CornerRadius='2' Margin='1,0'/></ControlTemplate></Thumb.Template></Thumb></Track.Thumb><Track.IncreaseRepeatButton><RepeatButton Command='{x:Static ScrollBar.PageDownCommand}' Opacity='0' Focusable='False'/></Track.IncreaseRepeatButton></Track></Grid></ControlTemplate></Setter.Value></Setter><Style.Triggers><Trigger Property='Orientation' Value='Horizontal'><Setter Property='Width' Value='Auto'/><Setter Property='Height' Value='5'/><Setter Property='Template'><Setter.Value><ControlTemplate TargetType='ScrollBar'><Grid Height='5' Background='Transparent'><Track x:Name='PART_Track' Height='5' Orientation='Horizontal'><Track.DecreaseRepeatButton><RepeatButton Command='{x:Static ScrollBar.PageLeftCommand}' Opacity='0' Focusable='False'/></Track.DecreaseRepeatButton><Track.Thumb><Thumb Height='3'><Thumb.Template><ControlTemplate TargetType='Thumb'><Border Background='#80544F65' CornerRadius='2'/></ControlTemplate></Thumb.Template></Thumb></Track.Thumb><Track.IncreaseRepeatButton><RepeatButton Command='{x:Static ScrollBar.PageRightCommand}' Opacity='0' Focusable='False'/></Track.IncreaseRepeatButton></Track></Grid></ControlTemplate></Setter.Value></Setter></Trigger></Style.Triggers></Style>
            </ResourceDictionary>";
            for(int i=0;i<OriginalColors.Length;i++)xaml=xaml.Replace(OriginalColors[i],Premium?DarkColors[i]:LightColors[i]);
            app.Resources.MergedDictionaries.Clear();app.Resources.MergedDictionaries.Add((ResourceDictionary)XamlReader.Parse(xaml));
            if(!scroll13Registered){scroll13Registered=true;EventManager.RegisterClassHandler(typeof(System.Windows.Controls.Primitives.ScrollBar),FrameworkElement.LoadedEvent,new RoutedEventHandler(delegate(object sender,RoutedEventArgs e){var bar=(System.Windows.Controls.Primitives.ScrollBar)sender;if(bar.Orientation==Orientation.Vertical){bar.Style=(Style)Application.Current.FindResource(typeof(System.Windows.Controls.Primitives.ScrollBar));bar.Width=5;bar.MinWidth=0;}}));}
        }
        public static void Fade(UIElement element, double from, double to, int ms, Action done=null)
        {
            var animation = new DoubleAnimation(from,to,TimeSpan.FromMilliseconds(ms)) { EasingFunction=new CubicEase { EasingMode=EasingMode.EaseOut } };
            if (done != null) animation.Completed += delegate { done(); };
            element.BeginAnimation(UIElement.OpacityProperty,animation);
        }
        public static void AnimateIcon(FrameworkElement icon)
        {
            var scale=new ScaleTransform(1,1);icon.RenderTransform=scale;icon.RenderTransformOrigin=new Point(.5,.5);
            icon.MouseEnter+=delegate {if(ReducedMotion)return;scale.BeginAnimation(ScaleTransform.ScaleXProperty,new DoubleAnimation(1.12,TimeSpan.FromMilliseconds(220)));scale.BeginAnimation(ScaleTransform.ScaleYProperty,new DoubleAnimation(1.12,TimeSpan.FromMilliseconds(220)));};
            icon.MouseLeave+=delegate {scale.BeginAnimation(ScaleTransform.ScaleXProperty,new DoubleAnimation(1,TimeSpan.FromMilliseconds(ReducedMotion?1:280)));scale.BeginAnimation(ScaleTransform.ScaleYProperty,new DoubleAnimation(1,TimeSpan.FromMilliseconds(ReducedMotion?1:280)));};
        }
        public static void AnimateOn(FrameworkElement host,FrameworkElement icon)
        {
            var shift=new TranslateTransform();var scale=new ScaleTransform();var transforms=new TransformGroup();transforms.Children.Add(scale);transforms.Children.Add(shift);icon.RenderTransform=transforms;icon.RenderTransformOrigin=new Point(.5,.5);
            host.MouseEnter+=delegate {if(ReducedMotion)return;shift.BeginAnimation(TranslateTransform.YProperty,new DoubleAnimation(-3,TimeSpan.FromMilliseconds(220)));scale.BeginAnimation(ScaleTransform.ScaleXProperty,new DoubleAnimation(1.1,TimeSpan.FromMilliseconds(220)));scale.BeginAnimation(ScaleTransform.ScaleYProperty,new DoubleAnimation(1.1,TimeSpan.FromMilliseconds(220)));};
            host.MouseLeave+=delegate {int ms=ReducedMotion?1:260;shift.BeginAnimation(TranslateTransform.YProperty,new DoubleAnimation(0,TimeSpan.FromMilliseconds(ms)));scale.BeginAnimation(ScaleTransform.ScaleXProperty,new DoubleAnimation(1,TimeSpan.FromMilliseconds(ms)));scale.BeginAnimation(ScaleTransform.ScaleYProperty,new DoubleAnimation(1,TimeSpan.FromMilliseconds(ms)));};
            if(host is Button)((Button)host).Click+=delegate {if(!ReducedMotion)shift.BeginAnimation(TranslateTransform.YProperty,new DoubleAnimation(2,0,TimeSpan.FromMilliseconds(240)));};
        }
        public static FrameworkElement Seal(double size)
        {
            return Branding.Eye(size,Premium,!ReducedMotion);
        }

    }

    partial class MainWindow : Window
    {
        readonly PreferenceStore store; readonly bool testing; readonly Preferences preferences;
        public readonly SessionState Session;
        readonly ActivationGesture gesture = new ActivationGesture();
        readonly Grid root = new Grid(), shell = new Grid(), overlay = new Grid();
        readonly StackPanel page = new StackPanel();
        readonly List<Button> navigation = new List<Button>();
        TextBlock badge, footnote; Button pauseButton;
        DispatcherTimer keysTimer, loadingTimer, scheduleTimer;
        readonly WorkGuard guard;readonly Dictionary<string,DateTime> sentReminders=new Dictionary<string,DateTime>();
        ReminderWindow reminder;DateTime selectedDay=DateTime.Today,lastDay=DateTime.Today;
        public Button EmergencyButton;
        public DailyPlan Today {get{return Planning.Get(preferences,DateTime.Today);}}
        public AppEntry WorkApp {get{return preferences.Apps.FirstOrDefault(a=>a.Work);}}
        bool CanLaunch(AppEntry entry){
            if(NativeDenied(entry))return false;
            if(Session.Active&&entry.Social&&!entry.Work&&String.Equals(Path.GetExtension(entry.Target),".exe",StringComparison.OrdinalIgnoreCase))return true;
            if(!Session.Active||!entry.Work)return Planning.CanLaunch(Session,entry,Today);
            var tasks=AppTasks(entry);return preferences.SoftPlanning?Session.Prepared.Contains(entry.Id)&&tasks.Count>0:tasks.Count>0&&tasks.All(t=>t.Done);
        }
        List<PlanTask> AppTasks(AppEntry entry){return Today.Tasks.Where(t=>String.IsNullOrEmpty(t.AppId)||t.AppId==entry.Id).ToList();}
        NativeBridge bridge;DateTime browserSeen;
        Forms.NotifyIcon tray; HwndSource source;
        public string CurrentPage { get; private set; }
        public bool ActivateOnStart;
        bool exiting, loading; int loadingGeneration;
        public Button GateOpenButton; public readonly List<CheckBox> GateChecks = new List<CheckBox>();
        public Action<AppEntry> Launcher;
        public MainWindow(PreferenceStore preferenceStore, bool isTest)
        {
            store=preferenceStore; testing=isTest; preferences=store.Load();if(!testing&&!preferences.FeedBlankApplied16){var d=ControlCatalog14.All.First(v=>v.Id=="instagram");var p=ControlCatalog14.Policy(preferences,"instagram",d);foreach(var flag in p.Flags.Where(f=>f.Key=="HomeFeed"||f.Key=="HideFollowingPosts"))flag.Value=true;preferences.FeedBlankApplied16=true;if(store.Warning==null)store.Save(preferences);} Session=new SessionState(preferences.Steps.Count);InitializeTools();
            string roblox=Planning.FindRoblox();
            var installedStudio=preferences.Apps.FirstOrDefault(a=>a.Id=="roblox-studio");if(installedStudio!=null&&roblox!=null&&installedStudio.Target!=roblox){installedStudio.Target=roblox;SavePreferences();}
            if(roblox!=null&&!preferences.Apps.Any(a=>a.Id=="roblox-studio"||String.Equals(a.Target,roblox,StringComparison.OrdinalIgnoreCase))&&preferences.Apps.Count<600){preferences.Apps.Add(new AppEntry {Id="roblox-studio",Name="Roblox Studio",Target=roblox,Glyph="\uE943",Work=true});if(!testing&&store.Warning==null){try{store.Save(preferences);}catch{}}}
            guard=new WorkGuard(preferences,CanLaunch,delegate(AppEntry entry){Reveal();if(overlay.Visibility!=Visibility.Visible)ShowGate(entry);SetFootnote(entry.Name+(entry.Social?" est en attente. Un passage permet un accès temporaire.":" est en attente. Planning ou Urgence pour reprendre."));},SetFootnote);
            Visuals.UseEdition(preferences.Premium);Visuals.ReducedMotion=preferences.ReducedMotion;Visuals.InstallStyles(Application.Current);
            var dateStyle=new Style(typeof(DatePickerTextBox),(Style)Application.Current.Resources[typeof(TextBox)]);dateStyle.Setters.Add(new Setter(Control.PaddingProperty,new Thickness(8,4,8,4)));dateStyle.Setters.Add(new Setter(Control.FontSizeProperty,13.0));dateStyle.Setters.Add(new Setter(Control.VerticalContentAlignmentProperty,VerticalAlignment.Center));Resources[typeof(DatePickerTextBox)]=dateStyle;
            Launcher=delegate(AppEntry app) {if(app.Id=="roblox-studio"){string found=Planning.FindRoblox();if(found!=null)app.Target=found;}Process.Start(new ProcessStartInfo(app.Target) {UseShellExecute=true}); };
            Title="Seraphim"; Width=1180; Height=830; MinWidth=980; MinHeight=680;
            if(!testing) {Width=Math.Min(Width,SystemParameters.WorkArea.Width-30);Height=Math.Min(Height,SystemParameters.WorkArea.Height-30);MinWidth=Math.Min(MinWidth,Width);MinHeight=Math.Min(MinHeight,Height);}
            WindowStartupLocation=WindowStartupLocation.CenterScreen; WindowStyle=WindowStyle.None; ResizeMode=ResizeMode.CanResize;
            AllowsTransparency=true;Background=Brushes.Transparent; FontFamily=new FontFamily("Segoe UI"); Foreground=Visuals.Text;
            var chrome=new System.Windows.Shell.WindowChrome { CaptionHeight=0, ResizeBorderThickness=new Thickness(6), CornerRadius=new CornerRadius(18), GlassFrameThickness=new Thickness(0) };
            System.Windows.Shell.WindowChrome.SetWindowChrome(this,chrome);
            try { Icon=Branding.Icon(preferences.Premium); } catch { }
            root.Background=new RadialGradientBrush {Center=new Point(.75,.0),GradientOrigin=new Point(.75,0),RadiusX=.9,RadiusY=.85,
                GradientStops=new GradientStopCollection { new GradientStop(Visuals.Color("#2C2922"),0), new GradientStop(Visuals.Color("#101114"),.8) }};
            backdrop=new AtlasBackdrop(this);root.Children.Add(backdrop);
            var ambient=Art.Image("control-studio.png",preferences.Premium?.025:.48);ambient.VerticalAlignment=VerticalAlignment.Top;ambient.Height=470;ambient.OpacityMask=new LinearGradientBrush(Colors.Black,Colors.Transparent,90);root.Children.Add(ambient);
            Content=new Border {CornerRadius=new CornerRadius(16),BorderBrush=Visuals.Brush("#504B3E"),BorderThickness=new Thickness(.5),Child=root};
            root.SizeChanged+=delegate {root.Clip=new RectangleGeometry(new Rect(0,0,root.ActualWidth,root.ActualHeight),15,15);};
            root.Children.Add(shell); shell.Margin=new Thickness(14,0,22,12);
            shell.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(70)});shell.ColumnDefinitions.Add(new ColumnDefinition());
            shell.RowDefinitions.Add(new RowDefinition {Height=new GridLength(40)});
            shell.RowDefinitions.Add(new RowDefinition {Height=new GridLength(61)});
            shell.RowDefinitions.Add(new RowDefinition {Height=new GridLength(1,GridUnitType.Star)});
            shell.RowDefinitions.Add(new RowDefinition {Height=new GridLength(29)});
            SizeChanged+=delegate {if(studioMapHost!=null&&atlas!=null&&atlasImmersion==null)studioMapHost.Height=Math.Max(440,Math.Min(820,ActualHeight-335));};
            BuildChrome(); BuildNavigation();
            var scroller=new ScrollViewer {Content=page, VerticalScrollBarVisibility=ScrollBarVisibility.Auto,HorizontalScrollBarVisibility=ScrollBarVisibility.Disabled,Padding=new Thickness(6,5,6,10)};
            SmoothScroll13(scroller);Grid.SetRow(scroller,2);Grid.SetColumn(scroller,1);shell.Children.Add(scroller);
            var bottom=new Grid(); bottom.ColumnDefinitions.Add(new ColumnDefinition()); bottom.ColumnDefinitions.Add(new ColumnDefinition {Width=GridLength.Auto});
            footnote=Visuals.TextBlock("Le calme précède l'intention.",10,Visuals.Muted); bottom.Children.Add(footnote);
            var version=Visuals.TextBlock(preferences.Premium?"SERAPHIM PREMIUM  /  0.16 CLAIR":"CONTROL  /  0.16 CLAIR",9,Visuals.Brush("#696861")); Grid.SetColumn(version,1); bottom.Children.Add(version);
            Grid.SetRow(bottom,3);Grid.SetColumn(bottom,1);shell.Children.Add(bottom);
            overlay.Visibility=Visibility.Collapsed; root.Children.Add(overlay);
            PreviewMouseDown += delegate(object s,MouseButtonEventArgs e) {
                if (e.ChangedButton==MouseButton.Middle && CurrentPage=="Accueil" && overlay.Visibility!=Visibility.Visible) { HandleMiddleClick(DateTime.UtcNow); e.Handled=true; }
            };
            PreviewKeyDown += delegate(object s,KeyEventArgs e) { if (e.Key==Key.Escape && overlay.Visibility==Visibility.Visible) { CancelOverlay(); e.Handled=true; } };
            SourceInitialized += delegate {
                source=HwndSource.FromHwnd(new WindowInteropHelper(this).Handle); source.AddHook(WindowMessage);
                Branding.SetWindowIcons(this,preferences.Premium);
                if (!testing) {CreateTray();Branding.UpdateShortcut(preferences.Premium);}
            };
            Closing += delegate(object s,System.ComponentModel.CancelEventArgs e) {
                if(!testing&&exiting&&!dismissed){e.Cancel=true;DismissSurface(delegate {dismissed=true;Close();});return;}
                if (!testing && !exiting) { e.Cancel=true; Deactivate(); DismissSurface(Hide); if(tray!=null) {tray.BalloonTipTitle="Seraphim est en veille";tray.BalloonTipText="Ctrl + Alt + Entrée + S pour commencer une session.";tray.ShowBalloonTip(2400);} }
            };
            Closed += delegate { if(assistant!=null)assistant.Close();StopAtlas();Branding.ReleaseWindowIcons(this);if(bridge!=null)bridge.Dispose();if(startSplash!=null)startSplash.Close();StopVoice();gmail.Dispose(); guard.Dispose();if(scheduleTimer!=null)scheduleTimer.Stop();if(reminder!=null)reminder.Close(); if(keysTimer!=null)keysTimer.Stop(); if(loadingTimer!=null)loadingTimer.Stop(); if(tray!=null)tray.Dispose(); if(source!=null)source.RemoveHook(WindowMessage); };
            ShowPage("Accueil");
            if (!testing) {
                keysTimer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(50)};
                keysTimer.Tick += delegate { if(gesture.KeyChord(Native.Down(0x11),Native.Down(0x12),Native.Down(0x0D),Native.Down(0x53))) BeginActivation(); };
                keysTimer.Start(); Loaded += delegate { StartSplash(ActivateOnStart); OpenUpdates17(true); };
                bridge=new NativeBridge(delegate(BridgeRequest request){return Dispatcher.Invoke(new Func<BridgeResponse>(delegate{return BrowserRequest(request);}));});bridge.Start();
                scheduleTimer=new DispatcherTimer {Interval=TimeSpan.FromSeconds(1)};scheduleTimer.Tick+=delegate {ScheduleTick(DateTime.Now);};scheduleTimer.Start();
            }
        }
        void BuildChrome()
        {
            var bar=new Grid {Background=Brushes.Transparent};
            bar.MouseLeftButtonDown += delegate(object s,MouseButtonEventArgs e) { if(e.ClickCount==2) WindowState=WindowState==WindowState.Maximized ? WindowState.Normal : WindowState.Maximized; else if(e.ButtonState==MouseButtonState.Pressed) DragMove(); };
            var caption=Visuals.TextBlock("S E R A P H I M",9,Visuals.Muted); caption.VerticalAlignment=VerticalAlignment.Center; bar.Children.Add(caption);
            var buttons=new StackPanel {Orientation=Orientation.Horizontal,HorizontalAlignment=HorizontalAlignment.Right};
            foreach (var pair in new[] {Tuple.Create("−",(Action)delegate {WindowState=WindowState.Minimized;}),Tuple.Create("□",(Action)delegate {WindowState=WindowState==WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;}),Tuple.Create("×",(Action)delegate {Close();})}) {
                var b=Visuals.Button(pair.Item1,pair.Item2); b.MinHeight=25; b.Width=35; b.Padding=new Thickness(2); b.Background=Brushes.Transparent; b.BorderThickness=new Thickness(0); b.FontSize=17;
                b.PreviewMouseLeftButtonDown += delegate(object s,MouseButtonEventArgs e) { e.Handled=false; }; buttons.Children.Add(b);
            }
            bar.Children.Add(buttons);Grid.SetColumnSpan(bar,2);shell.Children.Add(bar);
        }
        void BuildNavigation()
        {
            var side=new Grid {Margin=new Thickness(0,4,10,0)};side.RowDefinitions.Add(new RowDefinition {Height=GridLength.Auto});side.RowDefinitions.Add(new RowDefinition());side.RowDefinitions.Add(new RowDefinition {Height=GridLength.Auto});
            var brand=Visuals.Seal(47);brand.Margin=new Thickness(0,0,0,14);brand.ToolTip=preferences.Premium?"Seraphim":"Control";side.Children.Add(brand);
            var nav=new StackPanel();var navScroll=new ScrollViewer {Content=nav,VerticalScrollBarVisibility=ScrollBarVisibility.Auto,HorizontalScrollBarVisibility=ScrollBarVisibility.Disabled};Grid.SetRow(navScroll,1);side.Children.Add(navScroll);
            int index=0;foreach(string name in new[]{"Accueil","Applications","Planning","Atlas"}){
                string n=name;var b=Visuals.Button("",delegate {ShowPage(n);});b.Tag=n;b.Width=48;b.Height=48;b.MinHeight=48;b.Padding=new Thickness(0);b.Margin=new Thickness(0,n=="Atlas"?40:0,0,5);b.Background=Brushes.Transparent;b.BorderThickness=new Thickness(0);b.Content=new NavigationMark(n=="Accueil"?0:n=="Applications"?2:n=="Planning"?3:1);NavigationHint(b,n);navigation.Add(b);nav.Children.Add(b);
            }
            var note=new StackPanel {HorizontalAlignment=HorizontalAlignment.Center};badge=Visuals.TextBlock("●",13,Visuals.Gold);badge.HorizontalAlignment=HorizontalAlignment.Center;badge.ToolTip="Session en veille";badge.Margin=new Thickness(0,6,0,8);note.Children.Add(badge);
            pauseButton=MapCommand("close",Deactivate,"Désactiver la session");pauseButton.Margin=new Thickness(0,0,0,9);pauseButton.Visibility=Visibility.Collapsed;NavigationHint(pauseButton,"Désactiver la session");note.Children.Add(pauseButton);Grid.SetRow(note,2);side.Children.Add(note);Grid.SetRow(side,1);Grid.SetRowSpan(side,3);shell.Children.Add(side);
            var header=new Grid {Margin=new Thickness(6,0,6,8)};header.ColumnDefinitions.Add(new ColumnDefinition());header.ColumnDefinitions.Add(new ColumnDefinition {Width=GridLength.Auto});
            var searchGrid=new Grid {VerticalAlignment=VerticalAlignment.Center,Margin=new Thickness(0,0,22,0)};
            var search=new TextBox {FontSize=12,Height=43,VerticalContentAlignment=VerticalAlignment.Center,Padding=new Thickness(15,10,15,10),MaxLength=80,Background=Brushes.Transparent,BorderThickness=new Thickness(0)};chromeSearch=search;AutomationProperties.SetName(search,"Rechercher une application");searchGrid.Children.Add(search);
            var placeholder=Visuals.TextBlock("Rechercher une application…",11,Visuals.Muted);placeholder.Margin=new Thickness(15,11,0,0);placeholder.IsHitTestVisible=false;searchGrid.Children.Add(placeholder);
            search.TextChanged+=delegate {search.Background=String.IsNullOrEmpty(search.Text)?Brushes.Transparent:Visuals.Brush("#148E78B3");placeholder.Visibility=String.IsNullOrEmpty(search.Text)?Visibility.Visible:Visibility.Collapsed;appFilter=search.Text.Trim();if(CurrentPage=="Applications"&&catalogSearch14!=null){catalogSearch14.Text=appFilter;RefreshCatalog14();}else ShowPage("Applications");};header.Children.Add(searchGrid);
            var choices=new StackPanel {Orientation=Orientation.Horizontal,VerticalAlignment=VerticalAlignment.Center};
            var classic=Visuals.Button("",delegate {ChooseEdition(false);});classic.Content=new Border {Child=Branding.Eye(29,false,false),Width=34,Height=34,Background=Visuals.Brush("#DCD5EE"),CornerRadius=new CornerRadius(17)};classic.ToolTip="Control";AutomationProperties.SetName(classic,"Control");classic.Width=44;classic.Height=44;classic.Padding=new Thickness(0);classic.Background=Brushes.Transparent;classic.BorderThickness=new Thickness(0);choices.Children.Add(classic);
            var premium=Visuals.Button("",delegate {ChooseEdition(true);});premium.Content=Branding.Eye(34,true,false);premium.ToolTip="Seraphim Premium";AutomationProperties.SetName(premium,"Seraphim Premium");premium.Width=44;premium.Height=44;premium.Padding=new Thickness(0);premium.Background=Brushes.Transparent;premium.BorderThickness=new Thickness(0);choices.Children.Add(premium);profileButton=ProfileCircle();choices.Children.Add(profileButton);
            Grid.SetColumn(choices,1);header.Children.Add(choices);Grid.SetColumn(header,1);Grid.SetRow(header,1);shell.Children.Add(header);
        }
        string appFilter="";
        public void ChooseEdition(bool premium)
        {
            if(preferences.Premium==premium)return;
            bool previous=preferences.Premium;preferences.Premium=premium;
            if(!SavePreferences()){preferences.Premium=previous;return;}
            guard.Dispose();Session.Deactivate();var next=new MainWindow(store,testing);if(testing){next.Opacity=0;next.ShowInTaskbar=false;}next.WindowStartupLocation=WindowStartupLocation.Manual;next.Left=Left;next.Top=Top;next.Width=Width;next.Height=Height;
            Application.Current.MainWindow=next;next.Show();exiting=true;Close();
        }
        void CreateTray()
        {
            tray=new Forms.NotifyIcon {Text="Seraphim · En veille",Visible=true,Icon=Branding.TrayIcon(preferences.Premium)};
            var menu=new Forms.ContextMenuStrip();menu.Items.Add("Ouvrir Seraphim",null,delegate {Reveal();});menu.Items.Add("Désactiver la session",null,delegate {Deactivate();});
            menu.Items.Add("Mises à jour",null,delegate {OpenUpdates17(false);});menu.Items.Add("Quitter Seraphim",null,delegate {exiting=true;Session.Deactivate();Close();});tray.ContextMenuStrip=menu;tray.DoubleClick += delegate {Reveal();};
        }
        IntPtr WindowMessage(IntPtr hwnd,int msg,IntPtr w,IntPtr l,ref bool handled)
        { if(msg==0x8063){PrepareUpdate17();handled=true;} if(msg==Native.ShowMessage) {Reveal();handled=true;} if(msg==Native.ActivateMessage) {BeginActivation();handled=true;} return IntPtr.Zero; }
        void Reveal() {CancelDismissSurface();Show();if(WindowState==WindowState.Minimized)WindowState=WindowState.Normal;Activate();}
        public void ShowPage(string name)
        {
            StopAtlas();CurrentPage=name;gesture.ResetClicks();page.Children.Clear();
            foreach(var b in navigation) {bool chosen=(string)b.Tag==name;b.Foreground=chosen?Visuals.Gold:Visuals.Muted;b.Background=Brushes.Transparent;b.BorderThickness=new Thickness(0);((NavigationMark)b.Content).Select(chosen);}
            if(name=="Accueil") BuildHome();else if(name=="Atlas")BuildAtlas(false); else if(name=="Applications") BuildApplicationsCompact(); else if(name=="Planning")BuildPlanning(); else if(name=="Web")BuildWeb();else if(name=="Protection")BuildProtection();else if(name=="Messages")BuildMessages();else if(name=="Apparence")BuildAppearanceStudio();else if(name=="Checklist"||name=="Rituel") BuildRitual(); else if(name=="Calendrier")BuildCalendarStudio();else if(name=="Blacklist")BuildBlacklist();else if(name=="IA")BuildAssistant();else if(name=="Actualités"){TitleSection("ACTUALITÉS","Choisissez un lieu.","Sélectionnez un pays ou une ville dans l’atlas, puis Actualités.");}else BuildSettingsExtended();
            FinishPage13();if(!testing && !preferences.ReducedMotion)Visuals.Fade(page,0,1,350);
        }
        public void HandleMiddleClick(DateTime now) {if(CurrentPage=="Accueil" && gesture.MiddleClick(now))BeginActivation();}
        public void BeginActivation() {RefreshRobloxTarget();if(loading)return;Reveal(); if(Session.Active){ShowPage("Planning");return;} BeginLoading(true);}
        public void Deactivate()
        {
            StopVoice();CancelOverlay();if(!testing&&preferences.TimeTracking)SavePreferences();clockAnchor=DateTime.MinValue;nativePasses.Clear();noticeQueue.Clear();timeNotices.Clear();StopVoice();guard.Dispose();if(reminder!=null){reminder.Close();reminder=null;}Session.Deactivate();UpdateTiming14();UpdateStatus();ShowPage("Accueil");SetFootnote("Session désactivée. Vos applications sont libres.");
        }
        void UpdateStatus()
        {
            Branding.SetSession(Session.Active);badge.Text="●";badge.ToolTip=Session.Active?"Session Travail active":"Session en veille";badge.Foreground=Session.Active?Visuals.Brush("#75DDB1"):Visuals.Muted;pauseButton.Visibility=Session.Active ? Visibility.Visible : Visibility.Collapsed;
            if(tray!=null)tray.Text=Session.Active ? "Seraphim · Session active" : "Seraphim · En veille";
        }
        void SetFootnote(string text) {footnote.Text=text;}
        void TitleSection(string eyebrow,string title,string subtitle)
        {
            var pre=Visuals.Eyebrow(eyebrow);pre.Margin=new Thickness(0,8,0,9);page.Children.Add(pre);
            page.Children.Add(Visuals.TextBlock(title,34,Visuals.Text,true));
            var sub=Visuals.TextBlock(subtitle,12,Visuals.Muted);sub.Margin=new Thickness(0,8,0,24);page.Children.Add(sub);
        }
        void BuildHome()
        {
            BuildAtlas(true);return;
        }
        void BuildApps()
        {
            TitleSection("VOS OUTILS  /  VOTRE CHOIX","L'action commence ici.","Choisissez les applications qui passent par votre checklist lorsque la session est active.");
            var info=Visuals.TextBlock(Session.Active ? (Session.Complete ? "✓  Checklist accompli · les ouvertures sont autorisées pour cette session." : "◇  Session active · cochez vos étapes pour ouvrir les applications protégées.") : "○  En veille · les applications s'ouvrent librement.",12,Visuals.Gold);info.Margin=new Thickness(0,0,0,20);page.Children.Add(info);
            var grid=new Grid();for(int i=0;i<3;i++)grid.ColumnDefinitions.Add(new ColumnDefinition());
            var visible=preferences.Apps.Where(a=>a.Name.IndexOf(appFilter,StringComparison.CurrentCultureIgnoreCase)>=0).OrderByDescending(a=>a.Work).ToList();int rows=(visible.Count+2)/3;for(int r=0;r<rows;r++)grid.RowDefinitions.Add(new RowDefinition {Height=GridLength.Auto});
            for(int i=0;i<visible.Count;i++){
                var app=visible[i];var stack=new StackPanel();
                var icon=ApplicationLogo(app,56);icon.HorizontalAlignment=HorizontalAlignment.Left;icon.ToolTip=app.Name;stack.Children.Add(icon);
                stack.Children.Add(Visuals.TextBlock(app.Name,14,Visuals.Text,true));stack.Children.Add(Visuals.TextBlock(app.Target.StartsWith("https://")?"Web · compagnon requis":File.Exists(app.Target)?"Logiciel disponible sur ce PC":"Emplacement à vérifier",9,Visuals.Muted));stack.ToolTip=app.Name;AutomationProperties.SetName(stack,app.Name);stack.Margin=new Thickness(0,6,0,0);
                var check=new CheckBox {Content="Passer par la checklist",IsChecked=app.Protected,Style=(Style)Application.Current.Resources["StepCheck"],Margin=new Thickness(0,0,0,19)};
                AutomationProperties.SetName(check,"Protéger "+app.Name);check.Checked+=delegate {app.Protected=true;SavePreferences();};check.Unchecked+=delegate {app.Protected=false;SavePreferences();};stack.Children.Add(check);
                var work=new CheckBox {Content="Travail · planning du jour",IsChecked=app.Work,Style=(Style)Application.Current.Resources["StepCheck"],FontSize=11,Margin=new Thickness(0,0,0,17),IsEnabled=String.Equals(Path.GetExtension(app.Target),".exe",StringComparison.OrdinalIgnoreCase)};
                work.Checked+=delegate {app.Work=true;guard.Baseline();SavePreferences();};work.Unchecked+=delegate {app.Work=false;guard.Release(app);SavePreferences();};stack.Children.Add(work);
                var social=new CheckBox {Content="Réseau social · temps & passage",IsChecked=app.Social,Style=(Style)Application.Current.Resources["StepCheck"],FontSize=10,Margin=new Thickness(0,0,0,13)};
                social.Checked+=delegate {app.Social=true;SavePreferences();};social.Unchecked+=delegate {if(Session.Active)ShowPassage("Retirer la protection de "+app.Name+".",delegate {app.Social=false;guard.Release(app);SavePreferences();ShowPage("Applications");});else {app.Social=false;SavePreferences();}};stack.Children.Add(social);
                var launch=StudioButton((!CanLaunch(app) ? (app.Work?"Voir la checklist":"Commencer la checklist") : "Ouvrir")+"   ↗",delegate {RequestLaunch(app);});stack.Children.Add(launch);
                var card=StudioSurface(stack);card.Padding=new Thickness(17);Visuals.AnimateOn(card,icon);card.Margin=new Thickness(0,0,i%3==2?0:14,14);Grid.SetColumn(card,i%3);Grid.SetRow(card,i/3);grid.Children.Add(card);
            }
            page.Children.Add(grid);
            var add=Visuals.Button("+  Ajouter une application Windows",AddApplication);add.HorizontalAlignment=HorizontalAlignment.Left;add.Margin=new Thickness(0,10,0,8);page.Children.Add(add);var discover=StudioButton("Détecter les logiciels sociaux installés   ↗",DiscoverSocialApplications);discover.HorizontalAlignment=HorizontalAlignment.Left;page.Children.Add(discover);
            var scope=Visuals.TextBlock("En session active, les nouvelles ouvertures Windows des applications Travail attendent le planning. Les applications déjà ouvertes restent libres. La checklist simple concerne les ouvertures depuis Seraphim.",11,Visuals.Muted);scope.Margin=new Thickness(0,12,0,0);page.Children.Add(scope);
        }
        void AddApplication()
        {
            if(preferences.Apps.Count>=600){SetFootnote("Vous avez atteint la limite de 600 applications.");return;}
            var dialog=new Microsoft.Win32.OpenFileDialog {Title="Choisir une application Windows",Filter="Applications Windows (*.exe)|*.exe",CheckFileExists=true,Multiselect=false};
            if(dialog.ShowDialog(this)!=true)return;
            string target=Path.GetFullPath(dialog.FileName);
            if(!String.Equals(Path.GetExtension(target),".exe",StringComparison.OrdinalIgnoreCase))return;
            if(preferences.Apps.Any(a=>String.Equals(a.Target,target,StringComparison.OrdinalIgnoreCase))){SetFootnote("Cette application est déjà dans votre liste.");return;}
            preferences.Apps.Add(new AppEntry {Id=Guid.NewGuid().ToString("N"),Name=Path.GetFileNameWithoutExtension(target),Target=target,Glyph="\uE71D",Protected=true});SavePreferences();ShowPage("Applications");
        }
        void BuildRitual()
        {
            TitleSection("AVANT L'ACTION  /  LE CHECKLIST","Posez votre intention.","Vos étapes sont communes aux applications protégées et restent validées jusqu'à la fin de la session.");
            var grid=new Grid();grid.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(1.35,GridUnitType.Star)});grid.ColumnDefinitions.Add(new ColumnDefinition());
            var list=new StackPanel();list.Children.Add(Visuals.Eyebrow(Session.Active ? "VOTRE SESSION" : "VOTRE CHECKLIST PERSONNEL"));
            var progress=Visuals.TextBlock(Session.Checked.Count+" / "+preferences.Steps.Count+" étapes accomplies",26,Visuals.Text,true);progress.Margin=new Thickness(0,16,0,20);list.Children.Add(progress);
            for(int i=0;i<preferences.Steps.Count;i++){
                int index=i;var check=new CheckBox {Content=preferences.Steps[i],IsChecked=Session.Checked.Contains(i),Style=(Style)Application.Current.Resources["StepCheck"],Margin=new Thickness(0,0,0,22),IsEnabled=Session.Active};
                check.Checked+=delegate {Session.Checked.Add(index);progress.Text=Session.Checked.Count+" / "+preferences.Steps.Count+" étapes accomplies";};
                check.Unchecked+=delegate {Session.Checked.Remove(index);progress.Text=Session.Checked.Count+" / "+preferences.Steps.Count+" étapes accomplies";};list.Children.Add(check);
            }
            var note=Visuals.TextBlock(Session.Active ? "Cochez chaque étape, puis choisissez votre application." : "Activez une session avec le raccourci ou les 7 clics de molette sur l'accueil.",12,Visuals.Muted);note.Margin=new Thickness(0,8,0,18);list.Children.Add(note);
            var apps=Visuals.Button("Choisir une application   →",delegate {ShowPage("Applications");},true);apps.HorizontalAlignment=HorizontalAlignment.Left;list.Children.Add(apps);
            var reset=Visuals.Button("Recommencer la checklist",delegate {Session.Reset(preferences.Steps.Count);ShowPage("Checklist");});reset.HorizontalAlignment=HorizontalAlignment.Left;reset.Margin=new Thickness(0,12,0,0);list.Children.Add(reset);
            var left=Visuals.Card(list,new Thickness(28));left.Margin=new Thickness(0,0,20,0);grid.Children.Add(left);
            var edit=new StackPanel();edit.Children.Add(Visuals.Eyebrow("COMPOSEZ VOS ÉTAPES"));var et=Visuals.TextBlock("Une checklist qui vous ressemble.",24,Visuals.Text,true);et.Margin=new Thickness(0,16,0,14);edit.Children.Add(et);
            edit.Children.Add(Visuals.TextBlock("Une étape par ligne. Entre 1 et 12 étapes.\nModifier la checklist remet la progression à zéro.",11,Visuals.Muted));
            var text=new TextBox {Text=String.Join(Environment.NewLine,preferences.Steps),AcceptsReturn=true,TextWrapping=TextWrapping.Wrap,Height=185,VerticalScrollBarVisibility=ScrollBarVisibility.Auto,Margin=new Thickness(0,19,0,16),MaxLength=1500,FontSize=13};AutomationProperties.SetName(text,"Étapes de la checklist, une par ligne");edit.Children.Add(text);
            edit.Children.Add(Visuals.Button("Enregistrer mon checklist",delegate {
                var steps=text.Text.Split(new[]{'\r','\n'},StringSplitOptions.RemoveEmptyEntries).Select(s=>s.Trim()).Where(s=>s.Length>0).ToList();
                if(steps.Count<1 || steps.Count>12 || steps.Any(s=>s.Length>100)){SetFootnote("Ajoutez de 1 à 12 étapes, de 100 caractères maximum chacune.");return;}
                preferences.Steps=steps;Session.Reset(steps.Count);if(SavePreferences()){ShowPage("Checklist");SetFootnote("Votre checklist est enregistré. La progression a été remise à zéro.");}
            }));var right=Visuals.Card(edit,new Thickness(28));Grid.SetColumn(right,1);grid.Children.Add(right);page.Children.Add(grid);
        }
        void BuildSettings()
        {
            TitleSection("LES DÉTAILS FONT L'EXPÉRIENCE","À votre rythme.","Une présence discrète, une ouverture douce, une session à votre initiative.");
            var grid=new Grid();grid.ColumnDefinitions.Add(new ColumnDefinition());grid.ColumnDefinitions.Add(new ColumnDefinition());
            var settings=new StackPanel();settings.Children.Add(Visuals.Eyebrow("MOUVEMENT & PRÉSENCE"));var title=Visuals.TextBlock("Une entrée en lumière.",25,Visuals.Text,true);title.Margin=new Thickness(0,16,0,23);settings.Children.Add(title);
            var reduce=new CheckBox {Content="Réduire les animations",IsChecked=preferences.ReducedMotion,Style=(Style)Application.Current.Resources["StepCheck"],Margin=new Thickness(0,0,0,25)};
            reduce.Checked+=delegate {preferences.ReducedMotion=true;Visuals.ReducedMotion=true;Branding.MotionChanged();SavePreferences();};reduce.Unchecked+=delegate {preferences.ReducedMotion=false;Visuals.ReducedMotion=false;Branding.MotionChanged();SavePreferences();};settings.Children.Add(reduce);
            settings.Children.Add(Visuals.TextBlock("Ctrl + Alt + Entrée + S",15,Visuals.Gold));var desc=Visuals.TextBlock("Maintenez les quatre touches ensemble.\nSeraphim doit être ouvert ou dans la zone de notification.\n\n7 clics de molette sur l'accueil, en 5 secondes,\ndéclenchent le même éveil.",12,Visuals.Muted);desc.Margin=new Thickness(0,12,0,25);settings.Children.Add(desc);
            settings.Children.Add(Visuals.Button("Revoir l'animation d'ouverture",delegate {BeginLoading(false);}));var first=Visuals.Card(settings,new Thickness(29));first.Margin=new Thickness(0,0,20,0);grid.Children.Add(first);
            var gallery=new Grid {ClipToBounds=true,Height=435};gallery.Children.Add(Art.Image("dore-celestial-rose.jpg",.22));gallery.Children.Add(new Border {Background=new LinearGradientBrush(Colors.Transparent,Visuals.Color("#F014161A"),90)});
            var copy=new StackPanel {Margin=new Thickness(29),VerticalAlignment=VerticalAlignment.Bottom};copy.Children.Add(Visuals.Eyebrow("LA ROSE CÉLESTE"));var ct=Visuals.TextBlock("Entre ombre et lumière.",25,Visuals.Text,true);ct.Margin=new Thickness(0,15,0,16);copy.Children.Add(ct);
            copy.Children.Add(Visuals.TextBlock("Gravure de Gustave Doré · XIXe siècle\nDomaine public · Wikimedia Commons\n\nSéraphin original créé pour cette édition.",12,Visuals.Muted));
            var source=Visuals.Button("Voir les crédits des visuels   ↗",delegate {try {Process.Start(new ProcessStartInfo(Path.Combine(Art.Root,"assets","CREDITS.txt")){UseShellExecute=true});}catch(Exception ex){Error(ex);}});source.Margin=new Thickness(0,22,0,0);copy.Children.Add(source);gallery.Children.Add(copy);
            var second=Visuals.Card(gallery,new Thickness(0));second.MinHeight=405;Grid.SetColumn(second,1);grid.Children.Add(second);page.Children.Add(grid);
            var bottom=Visuals.TextBlock("Fermer la fenêtre met Seraphim en veille et désactive la checklist. Pour quitter complètement, utilisez l'icône de notification.",11,Visuals.Muted);bottom.Margin=new Thickness(0,23,0,0);page.Children.Add(bottom);
        }
        bool SavePreferences()
        {try {store.Save(preferences);return true;}catch(Exception ex){Error(ex);return false;}}
        void Error(Exception ex) {MessageBox.Show(this,ex.Message,"Seraphim",MessageBoxButton.OK,MessageBoxImage.Information);SetFootnote("L'action n'a pas pu être terminée.");}
        public void RequestLaunch(AppEntry app)
        {
            if(!CanLaunch(app)){ShowGate(app);return;}
            if(guard.HasHeld(app)){guard.Release(app);SetFootnote(app.Name+" reprend.");return;}
            try {Launcher(app);SetFootnote("Ouverture demandée : "+app.Name+".");}catch(Exception ex){Error(ex);}
        }
        public void ShowGate(AppEntry app)
        {
            if(NativeDenied(app)){ShowNativeGate(app);return;}
            if(app.Work){if(preferences.SoftPlanning)ShowSoftGate(app);else ShowWorkGate(app);return;}
            CancelOverlay();GateChecks.Clear();shell.Effect=new BlurEffect {Radius=8};shell.IsEnabled=false;
            overlay.Children.Clear();overlay.Background=Visuals.Brush("#C7090B0F");overlay.Visibility=Visibility.Visible;
            var panel=new Grid {Width=700,HorizontalAlignment=HorizontalAlignment.Center,VerticalAlignment=VerticalAlignment.Center};panel.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(220)});panel.ColumnDefinitions.Add(new ColumnDefinition());
            var art=new Grid {ClipToBounds=true,Height=450};var img=Art.Image(preferences.Premium?"seraphim-chrome.png":"control-studio.png",.85);img.Width=560;img.Height=450;img.HorizontalAlignment=HorizontalAlignment.Right;art.Children.Add(img);
            art.Children.Add(new Border {Background=new LinearGradientBrush(Colors.Transparent,Visuals.Color("#FF18191B"),90)});var seal=Visuals.Seal(70);seal.VerticalAlignment=VerticalAlignment.Bottom;seal.Margin=new Thickness(0,0,0,34);art.Children.Add(seal);panel.Children.Add(art);
            var list=new StackPanel {Margin=new Thickness(30,29,30,28)};list.Children.Add(Visuals.Eyebrow("UN INSTANT AVANT L'ACTION"));var title=Visuals.TextBlock("Avant d'ouvrir\n"+app.Name+".",29,Visuals.Text,true);title.Margin=new Thickness(0,13,0,15);list.Children.Add(title);
            list.Children.Add(Visuals.TextBlock("Prenez le temps de valider votre checklist.",12,Visuals.Muted));
            var progress=Visuals.TextBlock("",11,Visuals.Gold);progress.Margin=new Thickness(0,17,0,17);list.Children.Add(progress);
            GateOpenButton=Visuals.Button("Ouvrir "+app.Name+"   ↗",delegate {if(!Session.CanLaunch(app))return;CancelOverlay();RequestLaunch(app);ShowPage(CurrentPage);},true);
            Action update=delegate {progress.Text=Session.Checked.Count+" / "+preferences.Steps.Count+" étapes accomplies";GateOpenButton.IsEnabled=Session.Complete;};
            for(int i=0;i<preferences.Steps.Count;i++){
                int index=i;var check=new CheckBox {Content=preferences.Steps[i],IsChecked=Session.Checked.Contains(i),Style=(Style)Application.Current.Resources["StepCheck"],Margin=new Thickness(0,0,0,18)};
                check.Checked+=delegate {Session.Checked.Add(index);update();};check.Unchecked+=delegate {Session.Checked.Remove(index);update();};list.Children.Add(check);GateChecks.Add(check);
            }
            list.Children.Add(GateOpenButton);var cancel=Visuals.Button("Revenir au sanctuaire",CancelOverlay);cancel.Margin=new Thickness(0,10,0,0);list.Children.Add(cancel);update();Grid.SetColumn(list,1);panel.Children.Add(list);
            var card=Visuals.Card(panel,new Thickness(0));card.HorizontalAlignment=HorizontalAlignment.Center;card.VerticalAlignment=VerticalAlignment.Center;card.ClipToBounds=true;card.MaxHeight=Math.Max(450,ActualHeight-40);
            var scroll=new ScrollViewer {Content=card,VerticalScrollBarVisibility=ScrollBarVisibility.Auto,HorizontalScrollBarVisibility=ScrollBarVisibility.Disabled,VerticalAlignment=VerticalAlignment.Center};overlay.Children.Add(scroll);
            if(!preferences.ReducedMotion && !testing)Visuals.Fade(overlay,0,1,330);
        }
        public void CancelOverlay()
        {
            loadingGeneration++;loading=false;if(loadingTimer!=null){loadingTimer.Stop();loadingTimer=null;}
            overlay.BeginAnimation(UIElement.OpacityProperty,null);overlay.Opacity=1;overlay.Visibility=Visibility.Collapsed;overlay.Children.Clear();shell.Effect=null;shell.IsEnabled=true;
        }
        public void BeginLoading(bool activate)
        {
            CancelOverlay();loading=true;int generation=loadingGeneration;
            overlay.Background=Visuals.Brush("#0B0C0F");overlay.Visibility=Visibility.Visible;shell.IsEnabled=false;
            var art=Art.Image("control-studio.png",preferences.Premium?.1:.8);overlay.Children.Add(art);
            overlay.Children.Add(new Border {Background=new RadialGradientBrush(Visuals.Color("#A6090A0C"),Visuals.Color("#ED090A0C"))});
            var particles=new Canvas {IsHitTestVisible=false};overlay.Children.Add(particles);
            var rng=new Random(17);for(int i=0;i<26;i++){
                var dot=new Ellipse {Width=i%3==0?2.4:1.3,Height=i%3==0?2.4:1.3,Fill=Visuals.Gold,Opacity=.18+rng.NextDouble()*.3};
                Canvas.SetLeft(dot,70+rng.NextDouble()*Math.Max(700,Width-140));Canvas.SetTop(dot,50+rng.NextDouble()*Math.Max(450,Height-100));particles.Children.Add(dot);
                if(!preferences.ReducedMotion){var move=new TranslateTransform();dot.RenderTransform=move;move.BeginAnimation(TranslateTransform.YProperty,new DoubleAnimation(0,-35-rng.Next(25),TimeSpan.FromSeconds(4+rng.NextDouble()*3)){RepeatBehavior=RepeatBehavior.Forever,AutoReverse=true});}
            }
            var center=new StackPanel {HorizontalAlignment=HorizontalAlignment.Center,VerticalAlignment=VerticalAlignment.Center,Width=580};overlay.Children.Add(center);
            var eyebrow=Visuals.Eyebrow(activate?"L'ÉVEIL DE VOTRE SESSION":"BIENVENUE DANS VOTRE SANCTUAIRE");eyebrow.TextAlignment=TextAlignment.Center;center.Children.Add(eyebrow);
            var ring=new Grid {Width=118,Height=118,Margin=new Thickness(0,31,0,23)};ring.Children.Add(new Ellipse {Stroke=Visuals.Brush("#4B4437"),StrokeThickness=1});
            ring.Children.Add(Branding.Loading(112,preferences.Premium));center.Children.Add(ring);
            var name=Visuals.TextBlock(preferences.Premium?"S E R A P H I M":"C O N T R O L",43,Visuals.Text,true);name.TextAlignment=TextAlignment.Center;center.Children.Add(name);
            var subtitle=Visuals.TextBlock("Le calme précède l'intention.",13,Visuals.Muted);subtitle.TextAlignment=TextAlignment.Center;subtitle.Margin=new Thickness(0,15,0,32);center.Children.Add(subtitle);
            var track=new Grid {Width=230,Height=2,Background=Visuals.Brush("#383227")};var fill=new Border {Background=Visuals.Gold,HorizontalAlignment=HorizontalAlignment.Left,Width=0};track.Children.Add(fill);center.Children.Add(track);
            var phase=Visuals.TextBlock("Lumière",10,Visuals.Gold);phase.TextAlignment=TextAlignment.Center;phase.Margin=new Thickness(0,17,0,0);center.Children.Add(phase);
            var escape=Visuals.TextBlock("ÉCHAP POUR REVENIR",8,Visuals.Muted);escape.HorizontalAlignment=HorizontalAlignment.Center;escape.VerticalAlignment=VerticalAlignment.Bottom;escape.Margin=new Thickness(0,0,0,31);overlay.Children.Add(escape);
            if(!preferences.ReducedMotion){Visuals.Fade(overlay,0,1,450);var scale=new ScaleTransform(1.045,1.045);art.RenderTransform=scale;art.RenderTransformOrigin=new Point(.7,.5);scale.BeginAnimation(ScaleTransform.ScaleXProperty,new DoubleAnimation(1.045,1,TimeSpan.FromSeconds(3)));scale.BeginAnimation(ScaleTransform.ScaleYProperty,new DoubleAnimation(1.045,1,TimeSpan.FromSeconds(3)));}
            var watch=Stopwatch.StartNew();double duration=preferences.ReducedMotion ? .25 : 2.4;
            loadingTimer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(30)};
            loadingTimer.Tick+=delegate {
                if(generation!=loadingGeneration)return;
                double p=Math.Min(1,watch.Elapsed.TotalSeconds/duration);fill.Width=230*p;phase.Text=p<.33?"Lumière":p<.7?"Intention":"Présence";
                if(p<1)return;loadingTimer.Stop();
                Action finish=delegate {
                    if(generation!=loadingGeneration)return;CancelOverlay();if(activate){Session.Activate();if(!testing)guard.Activate();selectedDay=DateTime.Today;UpdateStatus();ShowPage("Planning");SetFootnote("Session active. Le planning du jour déverrouille vos applications Travail.");LaunchChosen14();}
                };
                if(preferences.ReducedMotion)finish();else Visuals.Fade(overlay,1,0,650,finish);
            };loadingTimer.Start();
        }
        public void Capture(string file)
        {
            root.UpdateLayout();var bitmap=new RenderTargetBitmap((int)Math.Ceiling(root.ActualWidth),(int)Math.Ceiling(root.ActualHeight),96,96,PixelFormats.Pbgra32);bitmap.Render(root);
            var encoder=new PngBitmapEncoder();encoder.Frames.Add(BitmapFrame.Create(bitmap));using(var stream=File.Create(file))encoder.Save(stream);
        }
        public AppEntry FirstApp { get { return preferences.Apps[0]; } }
    }
    static class Program
    {
        static void Assert(bool condition,string message) {if(!condition)throw new Exception(message);}
        [STAThread] static int Main(string[] args)
        {
            if(args.Length>0&&args[0].StartsWith("chrome-extension://"))return NativeBridge.Host(args[0]);
            if(args.Length==2&&args[0]=="--news-test")return OrbitalTests.News(args[1]);
            if(args.Length==2&&args[0]=="--design13-test")return Design13Tests.Run(args[1]);
            if(args.Length==2&&args[0]=="--orbital-test")return OrbitalTests.Run(args[1]);
            if(args.Length==3&&args[0]=="--assistant-api-test")return OrbitalTests.Api(args[1],args[2]);
            if(args.Length==2&&args[0]=="--policy14-test")return Policy14Tests.Run(args[1]);
            if(args.Length==2&&args[0]=="--scan14-test")return Design14Tests.Scan(args[1]);
            if(args.Length==2&&args[0]=="--make-ui14")return Design14Tests.Assets(args[1]);
            if(args.Length==2&&args[0]=="--refinement16-test")return Refinement16Tests.Run(args[1]);
            if(args.Length==2&&args[0]=="--design14-test")return Design14Tests.Run(args[1]);
            if(args.Length==2&&args[0]=="--tools-test")return ToolsTests.Run(args[1]);
            if(args.Length==2&&args[0]=="--home-test")return HomeRefinementTests.Run(args[1]);
            if(args.Length==2&&args[0]=="--v09-test")return Revision09Tests.Run(args[1]);
            if(args.Length==2&&args[0]=="--feed-test")return Revision09Tests.Feed(args[1]);
            if(args.Length==2&&args[0]=="--atlas-test")return AtlasTests.Run(args[1]);
            if(args.Length==2&&args[0]=="--sample-test")return SampleTests.Run(args[1]);
            if(args.Length==2&&args[0]=="--bridge-fixture")return SampleTests.BridgeFixture(args[1]);
            if(args.Length==2&&args[0]=="--threat-fixture")return SampleTests.BridgeFixture(args[1],true);
            if(args.Length==2&&args[0]=="--make-ui13")return TechnicalArt.Generate(args[1]);
            if(args.Length==2&&args[0]=="--make-art"){AppearanceAssets.Generate(args[1]);return 0;}
            if(args.Length==2&&args[0]=="--make-brand-assets"){Branding.GenerateAssets(args[1]);return 0;}
            if(args.Length==2&&args[0]=="--explorer-test"){return AtlasExplorerTests.Run(args[1]);}
            System.Net.ServicePointManager.SecurityProtocol=System.Net.SecurityProtocolType.Tls12;
            if(args.Length==2&&args[0]=="--guard-test")return Verification.GuardTests(args[1]);
            if(args.Length==4&&args[0]=="--guard-parent")return Verification.GuardParent(args);
            if(args.Length==6&&args[0]=="--watch-resume")return ProcessNative.Watch(args);
            if(args.Length==2&&args[0]=="--guard-worker"){while(!File.Exists(args[1]))Thread.Sleep(100);return 0;}
            var app=new Application {ShutdownMode=ShutdownMode.OnMainWindowClose};Visuals.UseEdition(false);Visuals.InstallStyles(app);
            bool self=args.Length==2 && args[0]=="--self-test", smoke=args.Length==2 && (args[0]=="--smoke-test"||args[0]=="--smoke-test-premium");
            if(self){
                try {
                    Verification.PlanningTests();
                    Assert(Visuals.OriginalColors.Length==Visuals.LightColors.Length&&Visuals.OriginalColors.Length==Visuals.DarkColors.Length,"Les palettes doivent couvrir les mêmes composants.");
                    var entry=Preferences.Defaults().Apps[0];var s=new SessionState(3);Assert(s.CanLaunch(entry),"La veille doit laisser ouvrir.");
                    s.Activate();Assert(!s.CanLaunch(entry),"La session doit verrouiller.");s.Checked.Add(0);s.Checked.Add(1);Assert(!s.CanLaunch(entry),"Deux étapes ne suffisent pas.");
                    s.Checked.Add(2);Assert(s.CanLaunch(entry),"La checklist complet doit autoriser.");s.Checked.Remove(1);Assert(!s.CanLaunch(entry),"Décocher doit reverrouiller.");
                    entry.Protected=false;Assert(s.CanLaunch(entry),"Les applications libres restent libres.");entry.Protected=true;s.Deactivate();Assert(s.CanLaunch(entry)&&s.Checked.Count==0,"Désactiver doit tout libérer.");s.Activate();Assert(!s.Complete,"Une nouvelle session doit repartir de zéro.");
                    s.Reset(0);Assert(!s.Complete&&!s.CanLaunch(entry),"Une checklist vide ne doit pas autoriser.");
                    var gesture=new ActivationGesture();Assert(!gesture.KeyChord(true,true,true,false),"S doit être présent.");Assert(!gesture.KeyChord(true,true,false,true),"Entrée doit être présente.");Assert(gesture.KeyChord(true,true,true,true),"Le raccourci complet doit déclencher.");Assert(!gesture.KeyChord(true,true,true,true),"Le maintien ne doit pas répéter.");gesture.KeyChord(false,false,false,false);Assert(gesture.KeyChord(true,true,true,true),"Le raccourci doit pouvoir se redéclencher.");
                    var now=DateTime.UtcNow;for(int i=0;i<6;i++)Assert(!gesture.MiddleClick(now.AddMilliseconds(i*100)),"Six clics ne doivent pas déclencher.");Assert(gesture.MiddleClick(now.AddMilliseconds(650)),"Le septième clic doit déclencher.");
                    gesture.MiddleClick(now);Assert(!gesture.MiddleClick(now.AddSeconds(6)),"Le délai doit remettre le compteur à zéro.");
                    string prefsFile=Path.Combine(Path.GetDirectoryName(args[1]),"test-preferences.json");var store=new PreferenceStore(prefsFile);var p=Preferences.Defaults();Planning.Get(p,DateTime.Today).Tasks.Add(new PlanTask {Id="persist",Title="Tâche conservée",Time="16:45",Done=true});p.Apps[0].Work=true;store.Save(p);var roundtrip=store.Load();Assert(roundtrip.Plans.Count==1&&roundtrip.Plans[0].Tasks[0].Done&&roundtrip.Apps[0].Work,"Le planning et le tag Travail doivent être conservés.");Assert(roundtrip.Steps.Count==3&&roundtrip.Apps.Count==6,"Les préférences doivent être conservées.");
                    Assert(Art.Load("seraphim-chrome.png")!=null&&Art.Load("dore-celestial-rose.jpg")!=null&&Art.Load("control-logo-black.png")!=null&&Art.Load("control-phone.png")!=null,"Les visuels des deux éditions doivent être présents.");
                    File.WriteAllText(args[1],"PASS : veille, verrouillage, progression partielle et complète, décochage, applications libres, désactivation, nouvelle session, checklist vide, raccourci exact, anti-répétition, sept clics, délai, préférences et visuels.\r\n",Encoding.UTF8);return 0;
                }catch(Exception ex){File.WriteAllText(args[1],"FAIL : "+ex,Encoding.UTF8);return 1;}
            }
            if(args.Length==2&&args[0]=="--reminder-test"){
                Directory.CreateDirectory(args[1]);var testWindow=new MainWindow(new PreferenceStore(Path.Combine(args[1],"prefs.json")),true);app.MainWindow=testWindow;testWindow.Opacity=0;testWindow.ShowInTaskbar=false;
                var notificationTimer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(550)};testWindow.Loaded+=delegate {testWindow.ShowReminder("À terminer · 17:30","Tester et noter les corrections de Roblox Studio.");notificationTimer.Start();};
                notificationTimer.Tick+=delegate {notificationTimer.Stop();try {testWindow.CaptureReminder(Path.Combine(args[1],"rappel.png"));File.WriteAllText(Path.Combine(args[1],"reminder-test.txt"),"PASS : rappel rendu, placement en bas à droite, bouton de retour au planning et fermeture.");testWindow.Close();}catch(Exception ex){File.WriteAllText(Path.Combine(args[1],"reminder-test.txt"),"FAIL : "+ex);app.Shutdown(1);}};return app.Run(testWindow);
            }
            Mutex mutex=null;bool owned=false;
            if(!smoke){mutex=new Mutex(true,"Local\\Seraphim.Desktop.v2",out owned);if(!owned){Native.PostMessage(Native.FindWindow(null,"Seraphim"),args.Contains("--activate")?Native.ActivateMessage:Native.ShowMessage,IntPtr.Zero,IntPtr.Zero);mutex.Dispose();return 0;}}
            var path=smoke?Path.Combine(args[1],"smoke-preferences.json"):Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Seraphim","preferences.json");
            if(smoke){Directory.CreateDirectory(args[1]);var fixture=Preferences.Defaults();fixture.SoftPlanning=false;fixture.Apps.Add(new AppEntry {Id="roblox-studio",Name="Roblox Studio",Target=Planning.FindRoblox()??"C:\\SeraphimTest\\RobloxStudioBeta.exe",Work=true,Glyph="\uE943"});fixture.Premium=args[0]=="--smoke-test-premium";new PreferenceStore(path).Save(fixture);}
            var window=new MainWindow(new PreferenceStore(path),smoke);app.MainWindow=window;
            if(smoke){
                Directory.CreateDirectory(args[1]);window.ShowInTaskbar=false;window.Opacity=0;
                int stage=0,launches=0;var timer=new DispatcherTimer {Interval=TimeSpan.FromMilliseconds(300)};window.Launcher=delegate {launches++;};
                timer.Tick+=delegate {
                    try {
                        switch(stage++){
                            case 0: window.Capture(Path.Combine(args[1],"home.png"));window.ShowPage("Applications");break;
                            case 1: window.Capture(Path.Combine(args[1],"apps.png"));window.ShowPage("Checklist");break;
                            case 2: window.Capture(Path.Combine(args[1],"ritual.png"));window.ShowPage("Réglages");break;
                            case 3: window.Capture(Path.Combine(args[1],"settings.png"));window.ShowPage("Accueil");for(int i=0;i<6;i++)window.HandleMiddleClick(DateTime.UtcNow);Assert(!window.Session.Active,"Six clics dans l'accueil doivent rester en veille.");window.HandleMiddleClick(DateTime.UtcNow);timer.Interval=TimeSpan.FromMilliseconds(850);break;
                            case 4: window.Capture(Path.Combine(args[1],"loading.png"));timer.Interval=TimeSpan.FromMilliseconds(2500);break;
                            case 5: Assert(window.Session.Active,"Sept clics doivent activer après le fondu.");window.Capture(Path.Combine(args[1],"active.png"));window.RequestLaunch(window.FirstApp);Assert(launches==0,"La demande verrouillée ne doit pas lancer.");timer.Interval=TimeSpan.FromMilliseconds(200);break;
                            case 6: window.Capture(Path.Combine(args[1],"gate-locked.png"));Assert(!window.GateOpenButton.IsEnabled,"Le bouton doit être verrouillé.");foreach(var check in window.GateChecks)check.IsChecked=true;break;
                            case 7: window.Capture(Path.Combine(args[1],"gate-ready.png"));Assert(window.GateOpenButton.IsEnabled,"Le bouton doit être ouvert après toutes les étapes.");window.GateOpenButton.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Assert(launches==1,"Un clic autorisé doit lancer une fois.");window.Deactivate();window.RequestLaunch(window.FirstApp);Assert(launches==2,"La veille doit ouvrir librement.");
                                window.PrepareTestPlan();window.ShowPage("Planning");window.Capture(Path.Combine(args[1],"planning.png"));window.Session.Activate();window.RequestLaunch(window.WorkApp);Assert(launches==2&&!window.GateOpenButton.IsEnabled,"Une application Travail doit attendre le planning.");window.Capture(Path.Combine(args[1],"work-locked.png"));window.EmergencyButton.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Assert(launches==3&&!window.Today.Complete,"Urgence doit ouvrir sans cocher le planning.");window.RequestLaunch(window.WorkApp);foreach(var check in window.GateChecks)check.IsChecked=true;Assert(window.GateOpenButton.IsEnabled,"Le planning complet doit autoriser.");window.Capture(Path.Combine(args[1],"work-ready.png"));window.GateOpenButton.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));Assert(launches==4,"La checklist validée doit ouvrir le travail.");window.ShowReminder("À terminer · 17:30","Tester et noter les corrections");window.Deactivate();
                                bool targetEdition=!Visuals.Premium;window.ChooseEdition(targetEdition);var changed=(MainWindow)app.MainWindow;Assert(Visuals.Premium==targetEdition&&!changed.Session.Active,"Changer d'édition doit appliquer le thème et laisser la session en veille.");Assert(new PreferenceStore(path).Load().Premium==targetEdition,"L'édition choisie doit être sauvegardée.");changed.Capture(Path.Combine(args[1],"edition-switched.png"));changed.Width=980;changed.Height=680;changed.ShowPage("Applications");changed.Capture(Path.Combine(args[1],"minimum-size.png"));
                                File.WriteAllText(Path.Combine(args[1],"ui-test.txt"),"PASS : 13 captures, planning, checklist Travail, urgence sans validation, navigation, animation, six puis sept clics, activation après chargement, lancement bloqué, déverrouillage, ouverture, désactivation, changement d'édition sauvegardé et taille minimale.\r\n",Encoding.UTF8);timer.Stop();changed.Close();break;
                        }
                    }catch(Exception ex){File.WriteAllText(Path.Combine(args[1],"ui-test.txt"),"FAIL : "+ex,Encoding.UTF8);timer.Stop();app.Shutdown(1);}
                };window.Loaded+=delegate {timer.Start();};
            }else window.ActivateOnStart=args.Contains("--activate");
            app.DispatcherUnhandledException+=delegate(object sender,DispatcherUnhandledExceptionEventArgs e){if(smoke){File.WriteAllText(Path.Combine(args[1],"ui-test.txt"),"FAIL : "+e.Exception,Encoding.UTF8);}else MessageBox.Show("Seraphim a rencontré un problème : "+e.Exception.Message,"Seraphim");e.Handled=true;app.Shutdown(1);};
            int result=app.Run(window);if(mutex!=null){if(owned)mutex.ReleaseMutex();mutex.Dispose();}return result;
        }
    }
}
