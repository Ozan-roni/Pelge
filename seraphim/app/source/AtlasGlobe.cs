using System;using System.Collections.Generic;using System.Linq;using System.Windows;using System.Windows.Input;using System.Windows.Media;
namespace SeraphimLuxury {
 partial class AtlasCanvas {
  public bool GlobeView,AircraftFlow,Thumbnail;public double GlobeLongitude=10,GlobeLatitude=12,GlobeScale=1;
  string globeCache;Point globePointer;bool globeDragging,globeMoved;double globeX,globeY;
  readonly Dictionary<MapCountry,List<Point[]>> earthPolygons=new Dictionary<MapCountry,List<Point[]>>();
  readonly Dictionary<MapCountry,Geometry> globeShapes=new Dictionary<MapCountry,Geometry>();
  void ZoomGlobeAt(Point p,double factor){double r=Math.Min(ActualWidth*.32,ActualHeight*.43)*GlobeScale;if(r>0&&factor>1){double x=(p.X-ActualWidth*.54)/r,y=-(p.Y-ActualHeight*.48)/r;if(x*x+y*y<1){double z=Math.Sqrt(1-x*x-y*y),tilt=GlobeLatitude*Math.PI/180;double lat=Math.Asin(y*Math.Cos(tilt)+z*Math.Sin(tilt))*180/Math.PI;double delta=Math.Atan2(x,z*Math.Cos(tilt)-y*Math.Sin(tilt))*180/Math.PI;double follow=1-1/factor;GlobeLongitude+=delta*follow;GlobeLatitude=Math.Max(-78,Math.Min(78,GlobeLatitude+(lat-GlobeLatitude)*follow));}}GlobeScale=Math.Max(.6,Math.Min(16,GlobeScale*factor));Notify();}
  public void SetGlobe(bool value){GlobeView=value;Playing=false;Notify();}
  public void RotateGlobe(double longitude,double latitude){GlobeLongitude=longitude;GlobeLatitude=Math.Max(-78,Math.Min(78,latitude));Notify();}
  public void GlobeBegin(Point p){globePointer=p;globeX=GlobeLongitude;globeY=GlobeLatitude;globeDragging=true;globeMoved=false;CaptureMouse();}
  public void GlobeMove(Point p){if(!globeDragging)return;Vector v=p-globePointer;if(v.Length>3)globeMoved=true;RotateGlobe(globeX-v.X*.32/GlobeScale,globeY+v.Y*.24/GlobeScale);}
  public void GlobeEnd(Point p){if(!globeDragging)return;globeDragging=false;ReleaseMouseCapture();if(globeMoved)return;double radius=Math.Min(ActualWidth*.32,ActualHeight*.43)*GlobeScale;var center=new Point(ActualWidth*.54,ActualHeight*.48);if(GlobeScale>=3){var city=AtlasPlaces.Data.cities.Where(c=>c.rank==1||c==City||GlobeScale>=4&&c.rank<=2||GlobeScale>=7).FirstOrDefault(c=>{var sphere=Sphere(Geo(new Point(c.x,c.y)));return sphere[2]>.05&&(SpherePoint(sphere,center,radius)-p).Length<12;});if(city!=null){SelectCity(city,true);return;}}var country=globeShapes.FirstOrDefault(c=>c.Value.FillContains(p)).Key;if(country!=null){FocusCountry(country);if(CountryPicked!=null)CountryPicked(country);Notify();}}
  Point Geo(Point p){double lat=(239-p.Y)/2.75;return new Point((p.X-500)/(2.63*Math.Cos(lat*Math.PI/180*.30)),lat);}
  double[] Sphere(Point geo){double phi=geo.Y*Math.PI/180,lambda=(geo.X-GlobeLongitude)*Math.PI/180,tilt=GlobeLatitude*Math.PI/180;double a=Math.Cos(phi)*Math.Cos(lambda),b=Math.Sin(phi);return new[]{Math.Cos(phi)*Math.Sin(lambda),b*Math.Cos(tilt)-a*Math.Sin(tilt),b*Math.Sin(tilt)+a*Math.Cos(tilt)};}
  Point SpherePoint(double[] p,Point center,double radius){return new Point(center.X+radius*p[0],center.Y-radius*p[1]);}
  Geometry GlobePolygon(MapCountry country,Point center,double radius){
   List<Point[]> rings;if(!earthPolygons.TryGetValue(country,out rings)){rings=new List<Point[]>();foreach(var f in country.Shape.GetFlattenedPathGeometry().Figures){var pts=new List<Point>{Geo(f.StartPoint)};foreach(var segment in f.Segments){var l=segment as LineSegment;var poly=segment as PolyLineSegment;if(l!=null)pts.Add(Geo(l.Point));if(poly!=null)pts.AddRange(poly.Points.Select(Geo));}if(pts.Count>2)rings.Add(pts.ToArray());}earthPolygons[country]=rings;}
   var geometry=new StreamGeometry();using(var draw=geometry.Open())foreach(var ring in rings){var visible=new List<Point>();var previous=Sphere(ring[ring.Length-1]);foreach(var pt in ring){var current=Sphere(pt);if((current[2]>=0)!=(previous[2]>=0)){double t=previous[2]/(previous[2]-current[2]);double xx=previous[0]+(current[0]-previous[0])*t,yy=previous[1]+(current[1]-previous[1])*t;double size=Math.Sqrt(xx*xx+yy*yy);if(size>0)visible.Add(new Point(center.X+radius*xx/size,center.Y-radius*yy/size));}if(current[2]>=0)visible.Add(SpherePoint(current,center,radius));previous=current;}if(visible.Count>2){draw.BeginFigure(visible[0],true,true);draw.PolyLineTo(visible.Skip(1).ToArray(),true,false);}}
   geometry.Freeze();return geometry;
  }
  void DrawGlobe(DrawingContext d){
   double radius=Math.Min(ActualWidth*.32,ActualHeight*.43)*GlobeScale;var center=new Point(ActualWidth*.54,ActualHeight*.48);var palette=AtlasPalette.For(Theme);
   d.DrawRectangle(Brushes.Transparent,null,new Rect(0,0,ActualWidth,ActualHeight));var halo=new RadialGradientBrush(Color.FromArgb(25,145,111,217),Colors.Transparent);d.DrawEllipse(halo,null,center,radius*1.15,radius*1.15);
   var ocean=new RadialGradientBrush(Color.FromArgb(95,24,23,37),Color.FromArgb(12,9,10,18)){GradientOrigin=new Point(.3,.2)};d.DrawEllipse(ocean,new Pen(AtlasPalette.Brush(palette.Accent,.22),.7),center,radius,radius);
   d.PushClip(new EllipseGeometry(center,radius,radius));string key=GlobeLongitude+"/"+GlobeLatitude+"/"+radius+"/"+center;bool changed=key!=globeCache;if(changed){globeShapes.Clear();globeCache=key;}
   foreach(var c in AtlasData.Countries){var shape=changed?GlobePolygon(c,center,radius):globeShapes[c];globeShapes[c]=shape;d.DrawGeometry(AtlasPalette.Brush(c==Selected?palette.Second:Thumbnail?"#726186":palette.Land,c==Selected?.28:.8),new Pen(AtlasPalette.Brush(Thumbnail?"#D1B9EE":palette.Line,.8),Thumbnail?1.05:.65),shape);}
   for(int lat=-60;lat<=60;lat+=30)DrawGlobeLine(d,Enumerable.Range(0,181).Select(i=>new Point(-180+i*2,lat)),center,radius,palette);
   for(int lon=-150;lon<=180;lon+=30)DrawGlobeLine(d,Enumerable.Range(0,91).Select(i=>new Point(lon,-90+i*2)),center,radius,palette);
   foreach(var city in AtlasPlaces.Data.cities.Where(c=>c.rank==1||c==City||GlobeScale>=4&&c.rank<=2||GlobeScale>=7)){var p=Sphere(Geo(new Point(city.x,city.y)));if(p[2]<=.05)continue;var screen=SpherePoint(p,center,radius);d.DrawEllipse(AtlasPalette.Brush(palette.Accent,.8),null,screen,city==City?4:1.6,city==City?4:1.6);}
   if(AircraftFlow){for(int i=0;i<7;i++){double lon=(phase*7+i*52)%360-180,lat=25*Math.Sin(i*1.7+phase*.03);var point=Sphere(new Point(lon,lat));if(point[2]<=0)continue;Point screen=SpherePoint(point,center,radius);d.PushTransform(new TranslateTransform(screen.X,screen.Y));d.DrawGeometry(AtlasPalette.Brush(palette.Accent,.75),null,Geometry.Parse("M-6,0 L6,0 L1,-3 L0,-8 L-2,-2 L-6,-1 Z"));d.Pop();}}
   d.Pop();d.DrawEllipse(null,new Pen(AtlasPalette.Brush(palette.Accent,.09),.6),center,radius*1.04,radius*1.04);
   double historyScale=Math.Min(ActualWidth/1000,ActualHeight/520);d.PushTransform(new TranslateTransform((ActualWidth-1000*historyScale)/2,(ActualHeight-520*historyScale)/2));d.PushTransform(new ScaleTransform(historyScale,historyScale));DrawHistory(d);d.Pop();d.Pop();
   Label(d,"G L O B E  /  G L I S S E R   P O U R   T O U R N E R",ActualWidth*.35,ActualHeight-30,9,Visuals.Muted);
  }
  void DrawGlobeLine(DrawingContext d,IEnumerable<Point> points,Point center,double radius,AtlasPalette palette){Point? previous=null;foreach(var point in points){var p=Sphere(point);if(p[2]>=0){Point screen=SpherePoint(p,center,radius);if(previous.HasValue)d.DrawLine(new Pen(AtlasPalette.Brush(palette.Accent,.1),.4),previous.Value,screen);previous=screen;}else previous=null;}}
 }
 class AtlasBackdrop:FrameworkElement {
  readonly MainWindow owner;public AtlasBackdrop(MainWindow w){owner=w;IsHitTestVisible=false;Opacity=.16;}
  protected override void OnRender(DrawingContext d){if(ActualWidth<1)return;var atlas=owner.atlas;double scale=Math.Min(ActualWidth/1100,ActualHeight/650);Point origin=new Point(ActualWidth*.18,ActualHeight*.15);double[] camera={1,0,0};try{if(atlas!=null&&atlas.IsVisible&&!atlas.GlobeView){origin=atlas.TranslatePoint(new Point(),this);scale=Math.Min(atlas.ActualWidth/1000,atlas.ActualHeight/520);origin+=new Vector((atlas.ActualWidth-1000*scale)/2,(atlas.ActualHeight-520*scale)/2);camera=atlas.CameraSnapshot();}}catch{}
   d.PushTransform(new TranslateTransform(origin.X,origin.Y));d.PushTransform(new ScaleTransform(scale,scale));d.PushTransform(new TranslateTransform(camera[1],camera[2]));d.PushTransform(new ScaleTransform(camera[0],camera[0]));foreach(var c in AtlasData.Countries)d.DrawGeometry(AtlasPalette.Brush("#5E507A",.18),new Pen(AtlasPalette.Brush("#776991",.22),.4/camera[0]),c.Shape);d.Pop();d.Pop();d.Pop();d.Pop();
  }
 }
}
