using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace SeraphimLuxury
{
    [DataContract] class AtlasCity
    {
        [DataMember] public string id,name,country;
        [DataMember] public bool heritage;
        [DataMember] public double x,y;
        [DataMember] public int rank,population;
        public override string ToString(){return name;}
    }
    [DataContract] class HistoryChapter
    {
        [DataMember] public string cityId,country,label,title,text,source,sourceName,asset,kind;
        [DataMember] public string imageSource,imageCredit,imageDescription;
        [DataMember] public int year,panel;
    }
    [DataContract] class AtlasPlaces
    {
        [DataMember] public List<AtlasCity> cities;
        [DataMember] public List<HistoryChapter> chapters;
        [DataMember] public List<HistoryChapter> horizons;
        [DataMember] public List<HistoryChapter> globalChapters;
        static AtlasPlaces cached;
        static readonly Dictionary<string,BitmapSource> panels=new Dictionary<string,BitmapSource>();
        public static AtlasPlaces Data {get {
            if(cached==null)using(var stream=File.OpenRead(System.IO.Path.Combine(Art.Root,"assets","atlas-places.json")))cached=(AtlasPlaces)new DataContractJsonSerializer(typeof(AtlasPlaces)).ReadObject(stream);
            return cached;
        }}
        public static BitmapSource ArtPanel(int index){return ArtPanel("history-vignettes.png",index);}
        public static BitmapSource ArtPanel(string asset,int index)
        {
            asset=String.IsNullOrEmpty(asset)?"history-vignettes.png":System.IO.Path.GetFileName(asset);string key=asset+index;
            if(!panels.ContainsKey(key)){var source=Art.Load(asset);if(index<0){panels[key]=source;return source;}var image=new CroppedBitmap(source,new Int32Rect(index%3*(source.PixelWidth/3),index/3*(source.PixelHeight/2),source.PixelWidth/3,source.PixelHeight/2));image.Freeze();panels[key]=image;}
            return panels[key];
        }
        public static double PositionOf(int year){for(int i=0;i<6;i++)if(year<=AtlasData.Years[i+1])return i+(year-AtlasData.Years[i])/(double)(AtlasData.Years[i+1]-AtlasData.Years[i]);return 6;}
        public static HistoryChapter Chapter(AtlasCity city,MapCountry country,int year)
        {
            var list=Data.chapters.Where(c=>city!=null?c.cityId==city.id:country!=null&&c.country==country.id).OrderBy(c=>c.year).ToList();
            var chapter=list.LastOrDefault(c=>c.year<=year);if(chapter!=null)return chapter;
            if(country!=null){chapter=Data.chapters.Where(c=>c.country==country.id&&c.year<=year).OrderBy(c=>c.year).LastOrDefault();if(chapter!=null)return chapter;}
            if(Data.globalChapters!=null)return Data.globalChapters.Where(c=>c.year<=year).OrderBy(c=>c.year).LastOrDefault();
            if(year<DateTime.Today.Year||Data.horizons==null)return null;
            return Data.horizons.FirstOrDefault(c=>city!=null?c.cityId==city.id:country!=null&&c.cityId==""&&c.country==country.id);
        }
    }
    class TimeCurve : FrameworkElement
    {
        readonly AtlasCanvas atlas;
        static readonly string[] emblems={"M12,2 A10,10 0 1 0 12,22 A10,10 0 1 0 12,2 M2,12 H22 M12,2 C5,8 5,16 12,22 C19,16 19,8 12,2",
            "M4,22 V8 Q12,-2 20,8 V22 M8,22 V10 Q12,4 16,10 V22 M2,22 H22",
            "M12,2 L15,9 L22,12 L15,15 L12,22 L9,15 L2,12 L9,9 Z",
            "M12,2 A10,10 0 1 0 12,22 A10,10 0 1 0 12,2 M12,6 V12 L17,15",
            "M2,12 C2,1 22,1 22,12 C22,23 2,23 2,12 M12,2 C1,2 1,22 12,22 C23,22 23,2 12,2 M10,12 H14",
            "M4,4 H20 V20 H4 Z M4,4 L20,20 M20,4 L4,20 M12,2 V22 M2,12 H22",
            "M2,12 Q12,-1 22,12 Q12,25 2,12 Z M12,8 A4,4 0 1 0 12,16 A4,4 0 1 0 12,8"};
        public TimeCurve(AtlasCanvas owner){atlas=owner;Height=116;IsHitTestVisible=false;}
        protected override void OnRender(DrawingContext d)
        {
            double w=ActualWidth;if(w<65)return;
            var arc=new StreamGeometry();using(var g=arc.Open()){g.BeginFigure(new Point(43,59),false,false);g.BezierTo(new Point(w*.27,12),new Point(w*.72,12),new Point(w-43,59),true,false);}
            d.DrawGeometry(null,new Pen(AtlasPalette.Brush("#AF91D5",.14),.8),arc);
            d.DrawLine(new Pen(AtlasPalette.Brush("#8F79AD",.25),.8),new Point(43,59),new Point(w-43,59));
            double px=43+atlas.Position/6*(w-86);
            d.DrawLine(new Pen(new LinearGradientBrush(Colors.Transparent,Color.FromArgb(125,187,155,230),0),1.4),new Point(43,59),new Point(px,59));
            for(int i=0;i<7;i++){double x=43+i*(w-86)/6;var accent=AtlasPalette.Brush("#C9B4E3",atlas.Position>=i?.8:.3);d.DrawEllipse(null,new Pen(accent,.5),new Point(x,29),0,0);d.PushTransform(new TranslateTransform(x-10,19));d.PushTransform(new ScaleTransform(20.0/24,20.0/24));d.DrawGeometry(null,new Pen(accent,1),Geometry.Parse(emblems[i]));d.Pop();d.Pop();d.DrawLine(new Pen(accent,.6),new Point(x,49),new Point(x,64));}
            string[] labels={"Nativité","Héritages","Horizons","Industrie","Espace","Réseaux","Présent"};for(int i=0;i<7;i++){double x=43+i*(w-86)/6;var label=new FormattedText(labels[i],System.Globalization.CultureInfo.GetCultureInfo("fr-FR"),FlowDirection.LeftToRight,new Typeface("Segoe UI"),9,Visuals.Muted);d.DrawText(label,new Point(x-label.Width/2,45));} 
            foreach(var c in AtlasPlaces.Data.chapters.Where(c=>atlas.City!=null?c.cityId==atlas.City.id:atlas.Selected!=null&&c.country==atlas.Selected.id)){double x=43+AtlasPlaces.PositionOf(c.year)/6*(w-86);d.DrawEllipse(AtlasPalette.Brush("#E8C584"),null,new Point(x,59),3,3);d.DrawEllipse(null,new Pen(AtlasPalette.Brush("#E8C584",.24),.6),new Point(x,59),7,7);}
        }
    }
}
