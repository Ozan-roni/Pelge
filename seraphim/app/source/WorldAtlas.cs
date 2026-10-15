using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Threading;

namespace SeraphimLuxury
{
    [DataContract] class MapCountry
    {
        [DataMember] public string id;
        [DataMember] public string name;
        [DataMember] public double x;
        [DataMember] public double y;
        [DataMember] public string path;
        public Geometry Shape;
        public override string ToString(){return name;}
    }
    static class AtlasData
    {
        static List<MapCountry> cached;
        public static List<MapCountry> Countries
        {
            get {
                if(cached!=null)return cached;
                using(var stream=File.OpenRead(System.IO.Path.Combine(Art.Root,"assets","world-map.json")))
                    cached=(List<MapCountry>)new DataContractJsonSerializer(typeof(List<MapCountry>)).ReadObject(stream);
                foreach(var c in cached){c.Shape=Geometry.Parse(c.path);c.Shape.Freeze();}
                return cached;
            }
        }
        public static Point Project(double lon,double lat){return new Point(500+lon*2.63*Math.Cos(lat*Math.PI/180*.30),239-lat*2.75);}
        public static readonly int[] Years={0,800,1500,1800,1969,2000,DateTime.Today.Year};
        public static readonly string[] Names={"Naissance du Christ · origine symbolique","Les mémoires","Les horizons","Les cadences","Les orbites","Les réseaux","Votre présent"};
        public static readonly string[] Copies={"Un point de lumière. Une intention.","Le temps se transmet. L’attention se cultive.","Le monde s’élargit. Choisissez votre direction.","Tout s’accélère. Gardez votre rythme.","Prenez de la hauteur sur votre journée.","Tout est relié. Votre attention reste à vous.","Deux mille ans de mouvement. Cet instant vous appartient."};
        public static int Year(double p){p=Math.Max(0,Math.Min(6,p));int i=(int)Math.Floor(p);return i==6?Years[6]:(int)Math.Round(Years[i]+(Years[i+1]-Years[i])*(p-i));}
    }
    class AtlasPalette
    {
        public string Name,Accent,Second,Land,Line;
        public static AtlasPalette For(int theme)
        {
            if(theme==1)return new AtlasPalette {Name="Relique",Accent="#E8C584",Second="#9C7750",Land="#25201B",Line="#594632"};
            if(theme==2)return new AtlasPalette {Name="Ion",Accent="#8BE3EF",Second="#4B91AC",Land="#15272E",Line="#34545F"};
            return new AtlasPalette {Name="Obsidienne",Accent="#C0AFFB",Second="#7360BD",Land="#22202E",Line="#494158"};
        }
        public static SolidColorBrush Brush(string hex,double opacity=1){var b=new SolidColorBrush((Color)ColorConverter.ConvertFromString(hex));b.Opacity=opacity;b.Freeze();return b;}
        public static string Mix(string a,string b,double t){var first=(Color)ColorConverter.ConvertFromString(a);var last=(Color)ColorConverter.ConvertFromString(b);return Color.FromRgb((byte)(first.R+(last.R-first.R)*t),(byte)(first.G+(last.G-first.G)*t),(byte)(first.B+(last.B-first.B)*t)).ToString();}
    }
    // Artistic passage through time over present-day geographical outlines. No historical borders or VPN traffic.
    partial class AtlasCanvas : FrameworkElement, IDisposable
    {
        public double Position=6;
        public bool Playing {get;private set;}
        public bool TimerRunning {get{return timer.IsEnabled;}}
        public int Theme;
        public MapCountry Selected;
        public event Action Changed;
        public event Action<MapCountry> CountryPicked;
        readonly DispatcherTimer timer;
        readonly Stopwatch clock=new Stopwatch();
        double last,phase;
        bool disposed;
        MapCountry hover;
        public AtlasCanvas(int theme)
        {
            Theme=theme;MinHeight=0;Focusable=true;Cursor=Cursors.Cross;
            AutomationProperties.SetName(this,"Carte du monde. Parcours artistique de l’an 0 à aujourd’hui.");
            timer=new DispatcherTimer(DispatcherPriority.Background){Interval=TimeSpan.FromMilliseconds(16)};
            timer.Tick+=Tick;
            Loaded+=delegate {if(!disposed){clock.Start();last=clock.Elapsed.TotalSeconds;if(!Visuals.ReducedMotion)timer.Start();}};
            Unloaded+=delegate {timer.Stop();};
            SetupExplorer();
            KeyDown+=delegate(object s,KeyEventArgs e){if(e.Key==Key.Space){Toggle();e.Handled=true;}else if(e.Key==Key.Left||e.Key==Key.Right){Seek(Position+(e.Key==Key.Left?-.25:.25));e.Handled=true;}};
        }
        Point MapPoint(Point p){double scale=Math.Min(ActualWidth/1000,ActualHeight/520);return new Point(((p.X-(ActualWidth-1000*scale)/2)/scale-panX)/zoom,((p.Y-(ActualHeight-520*scale)/2)/scale-panY)/zoom);}
        public void Seek(double p){Position=Math.Max(0,Math.Min(6,p));Playing=false;manualPause=true;dateTravel=false;Touch();Notify();}
        public void Play(){if(!HistoryEnabled||Visuals.ReducedMotion||City==null||zoom<5)return;Playing=true;manualPause=false;Touch();last=clock.Elapsed.TotalSeconds;Notify();}
        public void Toggle(){if(Playing){Playing=false;manualPause=true;Notify();}else Play();}
        void Notify(){if(Visuals.ReducedMotion){scene=HistoryEnabled?AtlasPlaces.Chapter(City,Selected,AtlasData.Year(Position)):null;sceneOpacity=scene==null?0:scene.kind=="world"?.12:zoom>2?.26:0;}InvalidateVisual();if(Changed!=null)Changed();}
        void Tick(object sender,EventArgs e)
        {
            double now=clock.Elapsed.TotalSeconds,dt=Math.Min(.1,Math.Max(0,now-last));last=now;
            var window=Window.GetWindow(this);
            if(!IsVisible||window==null||!window.IsVisible||window.WindowState==WindowState.Minimized)return;
            if(Visuals.ReducedMotion){Playing=false;timer.Stop();Notify();return;}
            phase+=dt;ExplorerTick(dt);
            Notify();
        }
        public void Dispose(){if(disposed)return;disposed=true;timer.Stop();timer.Tick-=Tick;Playing=false;Changed=null;CountryPicked=null;CityPicked=null;RegionExplored=null;OverviewReset=null;}
        static Pen Pen(string hex,double width,double opacity=1){var p=new Pen(AtlasPalette.Brush(hex,opacity),width);p.Freeze();return p;}
        void Label(DrawingContext d,string text,double x,double y,double size,Brush color)
        {d.DrawText(new FormattedText(text,CultureInfo.InvariantCulture,FlowDirection.LeftToRight,new Typeface("Segoe UI"),size,color),new Point(x,y));}
        protected override void OnRender(DrawingContext d)
        {
            base.OnRender(d);if(GlobeView){DrawGlobe(d);return;}var palette=AtlasPalette.For(Theme);double tint=Math.Min(1,Position/5);palette.Accent=AtlasPalette.Mix("#DAB16D",palette.Accent,tint);palette.Land=AtlasPalette.Mix("#25201B",palette.Land,tint);palette.Line=AtlasPalette.Mix("#594632",palette.Line,tint);
            d.DrawRectangle(Brushes.Transparent,null,new Rect(0,0,ActualWidth,ActualHeight));
            double scale=Math.Min(ActualWidth/1000,ActualHeight/520);if(scale<=0)return;
            d.PushTransform(new TranslateTransform((ActualWidth-1000*scale)/2,(ActualHeight-520*scale)/2));d.PushTransform(new ScaleTransform(scale,scale));
            var glow=new RadialGradientBrush {Center=new Point(.52,.36),GradientOrigin=new Point(.52,.36),RadiusX=.5,RadiusY=.65};
            glow.GradientStops.Add(new GradientStop(((SolidColorBrush)AtlasPalette.Brush(palette.Second)).Color,0));glow.GradientStops.Add(new GradientStop(Colors.Transparent,.8));glow.Opacity=.14;
            d.DrawRectangle(glow,null,new Rect(0,0,1000,520));
            Label(d,"C O N T R O L  /  M E M O R I A",40,95,34,AtlasPalette.Brush(palette.Accent,.035));
            for(int i=0;i<90;i++){double x=(i*137.51+35)%1000,y=(i*73.13+19)%505,alpha=.18+.18*Math.Sin(phase*.35+i);d.DrawEllipse(AtlasPalette.Brush(palette.Accent,alpha),null,new Point(x,y),.65,.65);}
            d.PushTransform(new TranslateTransform(panX,panY));d.PushTransform(new ScaleTransform(zoom,zoom));
            var grid=Pen(palette.Line,.5/zoom,.28);
            for(int lat=-60;lat<=60;lat+=30){Point a=AtlasData.Project(-180,lat),b=AtlasData.Project(180,lat);d.DrawLine(grid,a,b);}
            for(int lon=-150;lon<=150;lon+=30){var geo=new StreamGeometry();using(var c=geo.Open()){c.BeginFigure(AtlasData.Project(lon,-60),false,false);for(int lat=-55;lat<=80;lat+=5)c.LineTo(AtlasData.Project(lon,lat),true,false);}d.DrawGeometry(null,grid,geo);}
            double stage=Position,old=Math.Max(0,1-stage/3);
            var border=Pen(palette.Line,.55/zoom,.85);var normal=AtlasPalette.Brush(palette.Land);var selected=AtlasPalette.Brush(palette.Second,zoom>2?.3:.9);var overBrush=AtlasPalette.Brush(palette.Line);var selectedPen=Pen(palette.Accent,1.3/zoom);
            foreach(var c in AtlasData.Countries){bool chosen=c==Selected,over=c==hover;d.DrawGeometry(chosen?selected:over?overBrush:normal,chosen?selectedPen:border,c.Shape);}
            d.PushOpacity(Math.Max(0,1-(zoom-1)/3));
            // Engraved astrolabe, then mechanical rings, orbital tracks and flowing connections.
            Point center=AtlasData.Project(35.2,31.8);
            if(stage<3.7){d.PushOpacity(Math.Min(1,3.7-stage));double radius=65+stage*22;d.DrawEllipse(null,Pen(palette.Accent,.7,.28),center,radius,radius);
                for(int i=0;i<48;i++){double a=(i*7.5+phase*(stage>=3?8:1.5))*Math.PI/180;double r=radius+(i%4==0?7:3);d.DrawLine(Pen(palette.Accent,.8,.32),center+new Vector(Math.Cos(a)*radius,Math.Sin(a)*radius),center+new Vector(Math.Cos(a)*r,Math.Sin(a)*r));}
                d.DrawEllipse(AtlasPalette.Brush(palette.Accent,.08),null,center,30+12*Math.Sin(phase*.5),30+12*Math.Sin(phase*.5));d.Pop();}
            double memory=Math.Max(0,.42-Math.Abs(stage-1)*.42);
            if(memory>0){d.PushOpacity(memory);string letters="TEMPUS · INTENTIO · MEMORIA · ";for(int i=0;i<letters.Length;i++){double angle=i*360.0/letters.Length+phase;d.PushTransform(new RotateTransform(angle,center.X,center.Y));d.DrawText(new FormattedText(letters[i].ToString(),CultureInfo.InvariantCulture,FlowDirection.LeftToRight,new Typeface("Georgia"),10,AtlasPalette.Brush(palette.Accent)),new Point(center.X-3,center.Y-87));d.Pop();}d.Pop();}
            double navigation=Math.Max(0,.48-Math.Abs(stage-2)*.48);
            if(navigation>0){d.PushOpacity(navigation);d.DrawEllipse(null,Pen(palette.Accent,.65),new Point(480,271),65,65);d.DrawGeometry(null,Pen(palette.Accent,.8),Geometry.Parse("M480,208 L488,262 L543,271 L488,280 L480,334 L472,280 L417,271 L472,262 Z M434,225 L480,260 L526,225 L491,271 L526,317 L480,282 L434,317 L469,271 Z"));Label(d,"N",477,196,10,AtlasPalette.Brush(palette.Accent));d.Pop();}
            double mechanical=Math.Max(0,.4-Math.Abs(stage-3)*.4);
            if(mechanical>0){d.PushOpacity(mechanical);var hub=new Point(510,223);d.DrawEllipse(null,Pen(palette.Accent,.7),hub,124,124);for(int i=0;i<60;i++){double a=i*6*Math.PI/180;d.DrawLine(Pen(palette.Accent,.7),hub+new Vector(Math.Cos(a)*116,Math.Sin(a)*116),hub+new Vector(Math.Cos(a)*(i%5==0?108:113),Math.Sin(a)*(i%5==0?108:113)));}d.PushTransform(new RotateTransform(phase*7,510,223));d.DrawLine(Pen(palette.Accent,1),hub,new Point(510,125));d.DrawLine(Pen(palette.Accent,1),hub,new Point(561,254));d.DrawEllipse(null,Pen(palette.Accent,1),hub,4,4);d.Pop();d.Pop();}
            var locations=new[]{AtlasData.Project(12.5,41.9),center,AtlasData.Project(116.4,39.9),AtlasData.Project(2.35,48.86),AtlasData.Project(-74,40.7),AtlasData.Project(139.7,35.7),AtlasData.Project(-46.6,-23.5),AtlasData.Project(151.2,-33.9),AtlasData.Project(18.4,-33.9),AtlasData.Project(77.2,28.6)};
            int count=Math.Min(locations.Length,2+(int)(stage*1.5));
            for(int i=0;i<count;i++){
                Point a=locations[i],b=locations[(i+1)%count];var control=new Point((a.X+b.X)/2,(a.Y+b.Y)/2-35-Math.Abs(a.X-b.X)*.12);
                var route=new StreamGeometry();using(var ctx=route.Open()){ctx.BeginFigure(a,false,false);ctx.QuadraticBezierTo(control,b,true,false);}
                double alpha=.2+.12*Math.Sin(phase*.7+i);d.DrawGeometry(null,Pen(palette.Accent,stage>=5?.9:.65,alpha),route);
                double t=(phase*(stage>=5?.18:.08)+i*.17)%1;Point dot=new Point((1-t)*(1-t)*a.X+2*(1-t)*t*control.X+t*t*b.X,(1-t)*(1-t)*a.Y+2*(1-t)*t*control.Y+t*t*b.Y);
                d.DrawEllipse(AtlasPalette.Brush(palette.Accent,.07),null,dot,7,7);if(AircraftFlow){d.PushTransform(new TranslateTransform(dot.X,dot.Y));d.PushTransform(new RotateTransform(Math.Atan2(b.Y-a.Y,b.X-a.X)*180/Math.PI));d.DrawGeometry(AtlasPalette.Brush(palette.Accent,.8),null,Geometry.Parse("M-5,0 L6,0 L0,-3 L-1,-7 L-2,-2 L-5,-1 Z"));d.Pop();d.Pop();}else d.DrawEllipse(AtlasPalette.Brush(palette.Accent,.7),null,dot,1.7,1.7);
                d.DrawEllipse(null,Pen(palette.Accent,.75,.5),a,4,4);d.DrawEllipse(AtlasPalette.Brush(palette.Accent,.8),null,a,1.5,1.5);
            }
            if(stage>3.25){d.PushOpacity(Math.Min(1,stage-3.25));var orbitCenter=new Point(510,220);d.PushTransform(new RotateTransform(-19,510,220));d.DrawEllipse(null,Pen(palette.Accent,.65,.20),orbitCenter,315,130);d.DrawEllipse(null,Pen(palette.Accent,.5,.12),orbitCenter,354,160);double a=phase*.2;var satellite=orbitCenter+new Vector(315*Math.Cos(a),130*Math.Sin(a));d.DrawEllipse(AtlasPalette.Brush(palette.Accent,.8),null,satellite,2.8,2.8);d.Pop();d.Pop();}
            if(stage>=5){double sweep=(phase*70)%1100-100;var beam=new LinearGradientBrush(Colors.Transparent,((SolidColorBrush)AtlasPalette.Brush(palette.Accent)).Color,0){Opacity=.035};d.DrawRectangle(beam,null,new Rect(sweep,35,80,370));}
            d.Pop();
            if(Selected!=null&&City==null){var p=new Point(Selected.x,Selected.y);double pulse=Visuals.ReducedMotion?0:(Math.Sin(phase*2)+1)*3;d.DrawEllipse(AtlasPalette.Brush(palette.Accent,.09),null,p,(15+pulse)/zoom,(15+pulse)/zoom);d.DrawEllipse(null,Pen(palette.Accent,1.2/zoom,.75),p,8/zoom,8/zoom);d.DrawEllipse(AtlasPalette.Brush(palette.Accent),null,p,2.5/zoom,2.5/zoom);}
            d.Pop();d.Pop();DrawHistory(d);d.PushTransform(new TranslateTransform(panX,panY));d.PushTransform(new ScaleTransform(zoom,zoom));DrawCities(d);d.Pop();d.Pop();

            if(HistoryEnabled)Label(d,"0  —  "+DateTime.Today.Year,850,477,11,AtlasPalette.Brush("#8F8B9F"));
            d.Pop();d.Pop();
        }
    }
    partial class MainWindow
    {
        internal AtlasCanvas atlas;
        bool atlasSeen;
        string atlasCountry;
        string atlasRememberCity;
        double[] atlasCamera;
        double atlasPosition=6;
        internal Slider atlasTimeline;
        internal ComboBox atlasCountries;
        internal Button atlasPlay;
        TextBlock atlasYear,atlasEra,atlasCopy,atlasSelection;
        bool updatingAtlas;
        void AtlasStyles()
        {
            if(Resources.Contains("AtlasCombo"))return;
            var dictionary=(ResourceDictionary)XamlReader.Parse(@"<ResourceDictionary xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation' xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'>
              <Style x:Key='AtlasCombo' TargetType='ComboBox'><Setter Property='Foreground' Value='#F2EFF9'/><Setter Property='Background' Value='#171823'/><Setter Property='BorderBrush' Value='#484054'/><Setter Property='ItemContainerStyle'><Setter.Value><Style TargetType='ComboBoxItem'><Setter Property='Foreground' Value='#EEEAF6'/><Setter Property='Padding' Value='10,7'/><Setter Property='Template'><Setter.Value><ControlTemplate TargetType='ComboBoxItem'><Border x:Name='box' Background='Transparent' Padding='{TemplateBinding Padding}'><ContentPresenter/></Border><ControlTemplate.Triggers><Trigger Property='IsHighlighted' Value='True'><Setter TargetName='box' Property='Background' Value='#393147'/></Trigger></ControlTemplate.Triggers></ControlTemplate></Setter.Value></Setter></Style></Setter.Value></Setter>
                <Setter Property='Template'><Setter.Value><ControlTemplate TargetType='ComboBox'><Grid><ToggleButton Focusable='False' ClickMode='Press' IsChecked='{Binding IsDropDownOpen, Mode=TwoWay, RelativeSource={RelativeSource TemplatedParent}}'><ToggleButton.Template><ControlTemplate TargetType='ToggleButton'><Border Background='Transparent' BorderBrush='#484054' BorderThickness='0,0,0,.6' CornerRadius='0'><TextBlock Text='⌄' Foreground='#B7ABC7' HorizontalAlignment='Right' VerticalAlignment='Center' Margin='0,0,10,0'/></Border></ControlTemplate></ToggleButton.Template></ToggleButton><ContentPresenter Margin='10,0,30,0' HorizontalAlignment='Left' VerticalAlignment='Center' Content='{TemplateBinding SelectionBoxItem}' ContentTemplate='{TemplateBinding SelectionBoxItemTemplate}' IsHitTestVisible='False'/><Popup x:Name='PART_Popup' IsOpen='{TemplateBinding IsDropDownOpen}' Placement='Bottom' AllowsTransparency='True' Focusable='False'><Border MinWidth='{Binding ActualWidth,RelativeSource={RelativeSource TemplatedParent}}' MaxHeight='240' Background='#171823' BorderBrush='#484054' BorderThickness='1' CornerRadius='9' Padding='3'><ScrollViewer CanContentScroll='True'><ItemsPresenter/></ScrollViewer></Border></Popup></Grid></ControlTemplate></Setter.Value></Setter></Style>
              <Style x:Key='OrbitSlider' TargetType='Slider'><Setter Property='Height' Value='26'/><Setter Property='Template'><Setter.Value><ControlTemplate TargetType='Slider'><Grid Background='Transparent'><Track x:Name='PART_Track' Minimum='{TemplateBinding Minimum}' Maximum='{TemplateBinding Maximum}' Value='{TemplateBinding Value}'><Track.DecreaseRepeatButton><RepeatButton Command='{x:Static Slider.DecreaseLarge}' Opacity='0'/></Track.DecreaseRepeatButton><Track.Thumb><Thumb Width='26' Height='26'><Thumb.Template><ControlTemplate TargetType='Thumb'><Grid><Ellipse Fill='#24202F' Stroke='#C0AFFB' StrokeThickness='1'/><Ellipse Margin='5' Stroke='#E5D5FF' StrokeThickness='.6'/><Ellipse Margin='10' Fill='#DDC5FF'/></Grid></ControlTemplate></Thumb.Template></Thumb></Track.Thumb><Track.IncreaseRepeatButton><RepeatButton Command='{x:Static Slider.IncreaseLarge}' Opacity='0'/></Track.IncreaseRepeatButton></Track></Grid></ControlTemplate></Setter.Value></Setter></Style>
              <Style x:Key='AtlasSlider' TargetType='Slider'><Setter Property='Height' Value='20'/><Setter Property='Template'><Setter.Value><ControlTemplate TargetType='Slider'><Grid Background='Transparent'><Border Height='2' Background='#50455F' VerticalAlignment='Center' CornerRadius='1'/><Track x:Name='PART_Track'><Track.DecreaseRepeatButton><RepeatButton Command='{x:Static Slider.DecreaseLarge}' Opacity='0'/></Track.DecreaseRepeatButton><Track.Thumb><Thumb Width='14' Height='14'><Thumb.Template><ControlTemplate TargetType='Thumb'><Ellipse Fill='#C0AFFB' Stroke='#F3EDFF' StrokeThickness='1.2'/></ControlTemplate></Thumb.Template></Thumb></Track.Thumb><Track.IncreaseRepeatButton><RepeatButton Command='{x:Static Slider.IncreaseLarge}' Opacity='0'/></Track.IncreaseRepeatButton></Track></Grid></ControlTemplate></Setter.Value></Setter></Style>
            </ResourceDictionary>");Resources.MergedDictionaries.Add(dictionary);
        }
        void StopAtlas(){if(atlasImmersion!=null)atlasImmersion.Close();if(atlas!=null){atlasPosition=atlas.Position;atlasLocalPaused=atlas.LocalPaused;atlasRememberCity=atlas.City==null?null:atlas.City.id;globeMemory=new[]{atlas.GlobeLongitude,atlas.GlobeLatitude,atlas.GlobeScale};atlasCamera=atlas.CameraSnapshot();if(atlas.Selected!=null)atlasCountry=atlas.Selected.id;atlas.Dispose();atlas=null;}}
        internal void SelectAtlasTheme(int theme){preferences.AtlasTheme=Math.Max(0,Math.Min(2,theme));if(SavePreferences())ShowPage(CurrentPage);}
        void BuildAtlas(bool home){BuildAtlasStudio(home);}
        void UpdateAtlas(){UpdateStudio();}
    }
}
