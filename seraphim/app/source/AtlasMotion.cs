using System;
using System.Linq;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Input;
using System.Windows.Media;

namespace SeraphimLuxury
{
    partial class AtlasCanvas
    {
        public AtlasCity City;
        public bool DemoActive;
        public bool HistoryEnabled=true;
        public double Zoom {get{return zoom;}}
        public double TargetZoom {get{return targetZoom;}}
        public bool Travelling {get{return dateTravel;}}
        public bool LocalPaused {get{return manualPause;}}
        public void RestoreTime(double p,bool paused){Position=p;dateTravel=false;manualPause=paused;Playing=HistoryEnabled&&!Visuals.ReducedMotion&&!paused&&City!=null&&zoom>=5&&p<6;}
        public event Action<AtlasCity> CityPicked;
        public event Action<MapCountry> RegionExplored;
        public event Action OverviewReset;
        double zoom=1,targetZoom=1,panX,panY,targetX,targetY,lastTouch,dateTarget=6;
        bool pointerDown,dragged,manualPause,dateTravel;
        Point down,dragStart;
        Vector velocity;
        double dragTime;
        Point lastDrag;
        HistoryChapter scene;
        double sceneOpacity;
        public double[] CameraSnapshot(){return new[]{targetZoom,targetX,targetY};}
        public void RestoreCamera(double[] v){if(v==null)return;zoom=targetZoom=v[0];panX=targetX=v[1];panY=targetY=v[2];Notify();}
        Point BasePoint(Point p){double scale=Math.Min(ActualWidth/1000,ActualHeight/520);return new Point((p.X-(ActualWidth-1000*scale)/2)/scale,(p.Y-(ActualHeight-520*scale)/2)/scale);}
        public Point ScreenPoint(Point p){double scale=Math.Min(ActualWidth/1000,ActualHeight/520);return new Point((ActualWidth-1000*scale)/2+(p.X*zoom+panX)*scale,(ActualHeight-520*scale)/2+(p.Y*zoom+panY)*scale);}
        void Touch(){lastTouch=clock.Elapsed.TotalSeconds;}
        public void BeginPan(Point screen){down=BasePoint(screen);targetZoom=zoom;targetX=panX;targetY=panY;dragStart=new Point(panX,panY);lastDrag=down;dragTime=clock.Elapsed.TotalSeconds;velocity=new Vector();pointerDown=true;dragged=false;Touch();}
        public void MovePan(Point screen){if(!pointerDown)return;var p=BasePoint(screen);if((p-down).Length>3)dragged=true;double now=clock.Elapsed.TotalSeconds,dt=Math.Max(.008,now-dragTime);var sample=(p-lastDrag)/dt;velocity=velocity*.55+sample*.45;lastDrag=p;dragTime=now;targetX=dragStart.X+p.X-down.X;targetY=dragStart.Y+p.Y-down.Y;ClampCamera();panX=targetX;panY=targetY;Touch();Notify();}
        public void EndPan(){pointerDown=false;if(clock.Elapsed.TotalSeconds-dragTime>.08||Visuals.ReducedMotion)velocity=new Vector();Touch();}
        void SetupExplorer()
        {
            AutomationProperties.SetName(this,"Atlas. Glisser pour déplacer, molette pour zoomer. Le temps reste fixe dans la vue du monde.");
            MouseWheel+=delegate(object s,MouseWheelEventArgs e){if(GlobeView){ZoomGlobeAt(e.GetPosition(this),Math.Pow(1.0013,e.Delta));e.Handled=true;return;}ZoomAt(e.GetPosition(this),Math.Pow(1.0013,e.Delta));e.Handled=true;};
            MouseLeftButtonDown+=delegate(object s,MouseButtonEventArgs e){Focus();if(GlobeView){GlobeBegin(e.GetPosition(this));e.Handled=true;return;}if(e.ClickCount==2){ZoomAt(e.GetPosition(this),1.6);e.Handled=true;return;}BeginPan(e.GetPosition(this));CaptureMouse();Cursor=Cursors.SizeAll;e.Handled=true;};
            MouseMove+=delegate(object s,MouseEventArgs e){if(GlobeView){GlobeMove(e.GetPosition(this));return;}if(pointerDown){MovePan(e.GetPosition(this));return;}var p=MapPoint(e.GetPosition(this));var city=NearestCity(p);var country=AtlasData.Countries.FirstOrDefault(c=>c.Shape.FillContains(p));if(country!=hover){hover=country;InvalidateVisual();}ToolTip=city!=null?city.name:country==null?null:country.name;};
            MouseLeftButtonUp+=delegate(object s,MouseButtonEventArgs e){if(GlobeView){GlobeEnd(e.GetPosition(this));return;}if(!pointerDown)return;bool moved=dragged;EndPan();ReleaseMouseCapture();Cursor=Cursors.Cross;if(moved){ExploreRegion(new Point((500-targetX)/targetZoom,(250-targetY)/targetZoom));Notify();return;}var p=MapPoint(e.GetPosition(this));var city=NearestCity(p);if(city!=null){SelectCity(city,true);return;}var country=AtlasData.Countries.FirstOrDefault(c=>c.Shape.FillContains(p));if(country!=null){Selected=country;FocusCountry(country);if(CountryPicked!=null)CountryPicked(country);Notify();}};
            LostMouseCapture+=delegate {pointerDown=false;Cursor=Cursors.Cross;};
        }
        bool CityVisible(AtlasCity c){return c==City||zoom>=2.4&&(zoom>=9||c.rank<=Math.Max(1,(int)(zoom*.75)));}
        AtlasCity NearestCity(Point p){return AtlasPlaces.Data.cities.Where(c=>CityVisible(c)&&(new Point(c.x,c.y)-p).Length<10/zoom).OrderBy(c=>(new Point(c.x,c.y)-p).Length).FirstOrDefault();}
        public void ZoomAt(Point screen,double factor)
        {
            if(GlobeView){ZoomGlobeAt(screen,factor);return;}var p=BasePoint(screen);var world=new Point((p.X-targetX)/targetZoom,(p.Y-targetY)/targetZoom);double next=Math.Max(1,Math.Min(24,targetZoom*factor));targetX=p.X-(p.X-targetX)*next/targetZoom;targetY=p.Y-(p.Y-targetY)*next/targetZoom;targetZoom=next;velocity=new Vector();ClampCamera();
            if(next<=1.35){ResetCamera();return;}ExploreRegion(world);Touch();InstantCamera();Notify();
        }
        void ExploreRegion(Point p)
        {
            if(targetZoom<2.5)return;var country=AtlasData.Countries.FirstOrDefault(c=>c.Shape.FillContains(p));if(country==null)return;
            if(country!=Selected){Selected=country;City=null;Playing=false;DemoActive=false;if(RegionExplored!=null)RegionExplored(country);}
            if(targetZoom>=7.5){var city=AtlasPlaces.Data.cities.Where(c=>c.country==country.id&&(new Point(c.x,c.y)-p).Length<22/targetZoom).OrderBy(c=>(new Point(c.x,c.y)-p).Length).FirstOrDefault();if(city!=null&&city!=City)SelectCity(city,false);}
        }
        public void ResetCamera(){if(GlobeView){GlobeLongitude=10;GlobeLatitude=12;GlobeScale=1;}targetZoom=1;targetX=targetY=0;velocity=new Vector();City=null;Selected=null;DemoActive=false;Playing=false;manualPause=false;GoToTime(6);Touch();InstantCamera();if(OverviewReset!=null)OverviewReset();Notify();}
        void GoToTime(double p){dateTarget=p;dateTravel=!Visuals.ReducedMotion;if(!dateTravel)Position=p;}
        public void FocusCountry(MapCountry country){if(GlobeView){var g=Geo(new Point(country.x,country.y));GlobeLongitude=g.X;GlobeLatitude=g.Y;GlobeScale=Math.Max(GlobeScale,3.5);}Selected=country;City=null;DemoActive=false;Playing=false;targetZoom=5;targetX=500-country.x*5;targetY=240-country.y*5;velocity=new Vector();ClampCamera();Touch();InstantCamera();Notify();}
        public void SelectCity(AtlasCity city,bool focus)
        {
            if(GlobeView&&focus){var geo=Geo(new Point(city.x,city.y));GlobeLongitude=geo.X;GlobeLatitude=geo.Y;GlobeScale=Math.Max(GlobeScale,7);}bool changed=City==null||City.id!=city.id;City=city;Selected=AtlasData.Countries.FirstOrDefault(c=>c.id==city.country);DemoActive=false;
            if(focus){targetZoom=Math.Max(9,targetZoom);targetX=500-city.x*targetZoom;targetY=250-city.y*targetZoom;velocity=new Vector();ClampCamera();}
            if(changed){var first=HistoryEnabled?AtlasPlaces.Data.chapters.Where(c=>c.cityId==city.id).OrderBy(c=>c.year).FirstOrDefault():null;GoToTime(first==null?6:AtlasPlaces.PositionOf(first.year));Playing=false;manualPause=false;}
            Touch();InstantCamera();if(CityPicked!=null)CityPicked(city);Notify();
        }
        void ClampCamera(){targetX=Math.Max(1000-1000*targetZoom-780,Math.Min(780,targetX));targetY=Math.Max(520-520*targetZoom-400,Math.Min(400,targetY));}
        void InstantCamera(){if(Visuals.ReducedMotion){zoom=targetZoom;panX=targetX;panY=targetY;InvalidateVisual();}}
        void ExplorerTick(double dt)
        {
            if(!pointerDown&&velocity.Length>5){targetX+=velocity.X*dt;targetY+=velocity.Y*dt;ClampCamera();panX=targetX;panY=targetY;velocity*=Math.Exp(-dt*8);}
            double ease=1-Math.Exp(-dt*14);zoom+=(targetZoom-zoom)*ease;if(!pointerDown){panX+=(targetX-panX)*ease;panY+=(targetY-panY)*ease;}
            if(dateTravel){Position+=(dateTarget-Position)*(1-Math.Exp(-dt*7));if(Math.Abs(dateTarget-Position)<.00001){Position=dateTarget;dateTravel=false;}}
            if(HistoryEnabled&&!dateTravel&&City!=null&&zoom>=5&&!manualPause&&clock.Elapsed.TotalSeconds-lastTouch>4&&AtlasPlaces.Data.chapters.Any(c=>c.cityId==City.id)&&Position<6)Playing=true;
            if(Playing&&!dateTravel&&City!=null&&zoom>=5){double year=ExactYear(Position)+dt/120;Position=AtlasPlaces.PositionOf((int)Math.Floor(year))+(year-Math.Floor(year))/IntervalAt(year);if(Position>=6){Position=6;Playing=false;}}
            var next=HistoryEnabled?AtlasPlaces.Chapter(City,Selected,AtlasData.Year(Position)):null;double opacity=next==null?0:next.kind=="world"?.16:zoom>2?Math.Min(.32,(zoom-2)*.06):0;
            if(next!=scene){sceneOpacity=Math.Max(0,sceneOpacity-dt*.9);if(sceneOpacity==0)scene=next;}else sceneOpacity+=(opacity-sceneOpacity)*Math.Min(1,dt*3);
        }
        static double IntervalAt(double year){for(int i=0;i<6;i++)if(year<=AtlasData.Years[i+1])return AtlasData.Years[i+1]-AtlasData.Years[i];return 26;}
        static double ExactYear(double p){int i=Math.Min(6,(int)p);return i==6?AtlasData.Years[6]:AtlasData.Years[i]+(AtlasData.Years[i+1]-AtlasData.Years[i])*(p-i);}
        void DrawCities(DrawingContext d)
        {
            if(zoom<2.2&&City==null)return;var labels=new System.Collections.Generic.List<Point>();
            foreach(var c in AtlasPlaces.Data.cities){if(!CityVisible(c))continue;var screen=new Point(c.x*zoom+panX,c.y*zoom+panY);if(screen.X<0||screen.X>1000||screen.Y<0||screen.Y>520)continue;bool chosen=c==City;string color=chosen&&DemoActive?"#32DDA2":c.heritage&&HistoryEnabled?"#DBD8E7":"#777CFF";var p=new Point(c.x,c.y);if(chosen){double pulse=DemoActive&&!Visuals.ReducedMotion?4+3*Math.Sin(phase*2):0;d.DrawEllipse(AtlasPalette.Brush(color,.10),null,p,(16+pulse)/zoom,(16+pulse)/zoom);d.DrawEllipse(null,Pen(color,.8/zoom,.7),p,7/zoom,7/zoom);}d.DrawEllipse(AtlasPalette.Brush(color),null,p,(chosen?3:2)/zoom,(chosen?3:2)/zoom);
                if(chosen||zoom>=6&&(c.rank<=2||zoom>=14)&&!labels.Any(q=>Math.Abs(q.X-screen.X)<70&&Math.Abs(q.Y-screen.Y)<16)){Label(d,c.name,c.x+6/zoom,c.y-12/zoom,10/zoom,AtlasPalette.Brush(chosen?"#A5F4D6":"#B8B1C8"));labels.Add(screen);}
                if(chosen&&DemoActive&&zoom>=10){for(int i=0;i<3;i++){double a=(i*120-25)*Math.PI/180;var node=p+new Vector(Math.Cos(a)*27/zoom,Math.Sin(a)*27/zoom);d.DrawLine(Pen(color,.6/zoom,.3),p,node);d.DrawEllipse(null,Pen(color,.7/zoom,.5),node,2.6/zoom,2.6/zoom);}}
            }
        }
        static void HistoryPlane(DrawingContext d,System.Windows.Media.Imaging.BitmapSource art,Rect box,double opacity)
        {
            var mask=new RadialGradientBrush {MappingMode=BrushMappingMode.Absolute,Center=new Point(box.X+box.Width/2,box.Y+box.Height/2),GradientOrigin=new Point(box.X+box.Width/2,box.Y+box.Height/2),RadiusX=box.Width*.49,RadiusY=box.Height*.49};mask.GradientStops.Add(new GradientStop(Colors.White,.22));mask.GradientStops.Add(new GradientStop(Colors.Transparent,1));mask.Freeze();d.PushOpacity(opacity);d.PushOpacityMask(mask);d.DrawImage(art,box);d.Pop();d.Pop();
        }
        void DrawHistory(DrawingContext d)
        {
            if(!HistoryEnabled||scene==null||sceneOpacity<.001||String.IsNullOrEmpty(scene.asset))return;
            var memories=AtlasPlaces.Data.chapters.Where(c=>c.cityId==scene.cityId).GroupBy(c=>c.asset).Select(g=>g.First()).ToArray();
            for(int i=0;i<3;i++){double cycle=Visuals.ReducedMotion?.48:(phase*.028+i/3.0)%1;var frame=memories.Length>0?memories[i%memories.Length]:scene;var art=AtlasPlaces.ArtPanel(frame.asset,frame.panel);double size=(i==2?480:330)*(.85+cycle*.25),alpha=Visuals.ReducedMotion?(i==2?.6:.16):Math.Pow(Math.Sin(Math.PI*cycle),3);double cx=(i==0?330:i==1?740:545)+(i==0?1:-1)*cycle*25-panX*.001;HistoryPlane(d,art,new Rect(cx-size/2,246-size/2,size,size),sceneOpacity*alpha*(i==2?.75:.25));}
            string name=City==null?Selected==null?"ATLAS":Selected.name:City.name;Label(d,"M E M O R I A  /  "+name.ToUpperInvariant(),105,420,26,AtlasPalette.Brush(AtlasPalette.For(Theme).Accent,.06));
            for(int i=0;i<3;i++)Label(d,"TEMPUS  ::  "+scene.label+"  /  INTENTIO  /  ARCHIVE 0"+(i+1),115+i*170,75+i*27,7,AtlasPalette.Brush("#AD9AC4",.22));
        }
    }
}
