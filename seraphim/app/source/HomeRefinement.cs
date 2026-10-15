using System;
using System.Linq;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;

namespace SeraphimLuxury
{
    class NavigationMark : Grid
    {
        readonly System.Windows.Shapes.Path symbol;
        readonly SolidColorBrush fill;
        readonly Ellipse halo;
        public bool Selected {get;private set;}
        public NavigationMark(int index)
        {
            Width=44;Height=44;
            halo=new Ellipse {Margin=new Thickness(2),Fill=Visuals.Gold,Opacity=0};Children.Add(halo);
            string[] shapes={"M3,11 L12,3 L21,11 L19,11 V21 H14 V14 H10 V21 H5 V11 Z",
                "M12,2 A10,10 0 1 0 12,22 A10,10 0 1 0 12,2 Z M12,2 C5,8 5,16 12,22 C19,16 19,8 12,2 M2,12 H22",
                "M3,3 H10 V10 H3 Z M14,3 H21 V10 H14 Z M3,14 H10 V21 H3 Z M14,14 H21 V21 H14 Z",
                "M4,5 H20 V21 H4 Z M4,10 H20 M8,2 V7 M16,2 V7 M8,14 H11 M14,14 H17 M8,18 H11",
                "M12,2 A10,10 0 1 0 12,22 A10,10 0 1 0 12,2 Z M2,12 H22 M12,2 V22 M4,7 H20 M4,17 H20",
                "M3,4 H21 V17 H10 L5,21 V17 H3 Z M7,8 H17 M7,12 H14",
                "M12,3 C6,3 2,7 2,12 C2,19 9,23 14,21 C17,19 11,16 16,14 C22,13 24,4 12,3 Z M6,10 H8 M10,6 H12 M16,7 H18",
                "M4,4 H20 V20 H4 Z M8,12 L11,15 L17,8",
                "M9,2 H15 L16,6 L20,7 L22,12 L20,17 L16,18 L15,22 H9 L8,18 L4,17 L2,12 L4,7 L8,6 Z M12,8 A4,4 0 1 0 12,16 A4,4 0 1 0 12,8 Z"};
            fill=new SolidColorBrush(((SolidColorBrush)Visuals.Gold).Color){Opacity=0};
            symbol=new System.Windows.Shapes.Path {Data=Geometry.Parse(index==9?"M3,5 H21 V21 H3 Z M7,9 H17 M7,13 H17 M7,17 H13 M3,5 L21,21":index==10?"M12,2 A10,10 0 1 0 12,22 A10,10 0 1 0 12,2 M7,12 H8 M11,12 H12 M15,12 H16":shapes[Math.Max(0,Math.Min(8,index))]),Stroke=Visuals.Muted,Fill=fill,StrokeThickness=1.25,StrokeLineJoin=PenLineJoin.Round,Stretch=Stretch.Uniform};
            Children.Add(new Viewbox {Width=23,Height=23,Child=symbol,HorizontalAlignment=HorizontalAlignment.Center,VerticalAlignment=VerticalAlignment.Center});
            IsHitTestVisible=false;
        }
        public void Select(bool selected)
        {
            Selected=selected;symbol.Stroke=selected?Visuals.Gold:Visuals.Muted;
            int ms=Visuals.ReducedMotion?1:260;
            fill.BeginAnimation(Brush.OpacityProperty,new DoubleAnimation(selected?.45:0,TimeSpan.FromMilliseconds(ms)));
            halo.BeginAnimation(UIElement.OpacityProperty,new DoubleAnimation(selected?.15:0,TimeSpan.FromMilliseconds(ms)));
        }
    }
    partial class MainWindow
    {
        internal Border studioDestination;
        internal Button studioDestinationToggle;
        internal bool destinationOpen=true;
        internal TextBlock studioTimeYear;
        TextBlock studioThreatState;
        Border studioThreatPill;
        StackPanel studioStoryPanel;
        void NavigationHint(Button button,string name)
        {
            var text=Visuals.TextBlock(name,12,Visuals.Text);
            var label=new Border {Background=Visuals.Brush(preferences.Premium?"#EF191823":"#F9FCF9FF"),CornerRadius=new CornerRadius(10),Padding=new Thickness(15,9,15,9),Child=text,BorderBrush=Visuals.Line,BorderThickness=new Thickness(.5),Opacity=0};
            var popup=new Popup {PlacementTarget=button,Placement=PlacementMode.Right,HorizontalOffset=13,AllowsTransparency=true,StaysOpen=true,Child=label};
            button.Resources["NavigationHint"]=popup;
            Action show=delegate {popup.IsOpen=true;Visuals.Fade(label,0,1,Visuals.ReducedMotion?1:180);};
            button.MouseEnter+=delegate {show();};button.MouseLeave+=delegate {popup.IsOpen=false;};button.GotKeyboardFocus+=delegate {show();};button.LostKeyboardFocus+=delegate {popup.IsOpen=false;};button.Unloaded+=delegate {popup.IsOpen=false;};
            AutomationProperties.SetName(button,name);
        }
        Button MapCommand(string kind,Action action,string name)
        {
            string path=kind=="plus"?"M5,12 H19 M12,5 V19":kind=="minus"?"M5,12 H19":kind=="world"?"M12,3 A9,9 0 1 0 12,21 A9,9 0 1 0 12,3 M3,12 H21 M12,3 C6,8 6,16 12,21 C18,16 18,8 12,3":kind=="close"?"M6,6 L18,18 M18,6 L6,18":kind=="destination"?"M12,3 A7,7 0 0 0 5,10 C5,16 12,22 12,22 C12,22 19,16 19,10 A7,7 0 0 0 12,3 M12,7 A3,3 0 1 0 12,13 A3,3 0 1 0 12,7":"M3,9 V3 H9 M15,3 H21 V9 M21,15 V21 H15 M9,21 H3 V15";
            var shape=new System.Windows.Shapes.Path {Data=Geometry.Parse(path),Stroke=Visuals.Text,StrokeThickness=1.3,StrokeStartLineCap=PenLineCap.Round,StrokeEndLineCap=PenLineCap.Round};
            var b=StudioButton("",action);b.Content=new Viewbox {Width=18,Height=18,Child=new Canvas {Width=24,Height=24,Children={shape}}};b.Width=40;b.Height=40;b.MinHeight=40;b.Padding=new Thickness(0);b.HorizontalContentAlignment=HorizontalAlignment.Center;b.VerticalContentAlignment=VerticalAlignment.Center;b.ToolTip=name;AutomationProperties.SetName(b,name);return b;
        }
        internal void SetDestinationOpen(bool open)
        {
            destinationOpen=open;
            if(studioDestination==null)return;
            studioDestinationToggle.Visibility=open?Visibility.Collapsed:Visibility.Visible;if(studioLocationPanel!=null)studioLocationPanel.Margin=new Thickness(open?260:17,0,65,13);studioDestinationToggle.ToolTip=open?"Fermer les destinations":"Ouvrir les destinations";AutomationProperties.SetName(studioDestinationToggle,open?"Fermer les destinations":"Ouvrir les destinations");
            studioDestination.IsHitTestVisible=open;
            if(open){studioDestination.Visibility=Visibility.Visible;if(Visuals.ReducedMotion){studioDestination.BeginAnimation(UIElement.OpacityProperty,null);studioDestination.Opacity=1;}else Visuals.Fade(studioDestination,0,1,240);}
            else if(Visuals.ReducedMotion)studioDestination.Visibility=Visibility.Collapsed;
            else Visuals.Fade(studioDestination,1,0,220,delegate {if(!destinationOpen)studioDestination.Visibility=Visibility.Collapsed;});
            if(studioStoryPanel!=null)studioStoryPanel.Margin=new Thickness(open?270:25,0,72,82);
        }
        Border StatePill(string label,bool on)
        {
            var text=Visuals.TextBlock(label,11,Visuals.Brush(on?"#99F2CA":"#DEBDC3"),true);text.TextAlignment=TextAlignment.Center;
            return new Border {Child=text,Background=Visuals.Brush(on?"#403DBA83":"#40543A49"),BorderBrush=Visuals.Brush(on?"#608AE4B7":"#60785562"),BorderThickness=new Thickness(.7),CornerRadius=new CornerRadius(12),Padding=new Thickness(10,4,10,4),HorizontalAlignment=HorizontalAlignment.Left,VerticalAlignment=VerticalAlignment.Center};
        }
        void UpdateThreatPill()
        {
            if(studioThreatState==null)return;bool on=ThreatRunning;studioThreatState.Text=on?"ON":"OFF";studioThreatState.Foreground=Visuals.Brush(on?"#99F2CA":"#DEBDC3");studioThreatPill.Background=Visuals.Brush(on?"#403DBA83":"#40543A49");studioThreatPill.BorderBrush=Visuals.Brush(on?"#608AE4B7":"#60785562");
        }
    }
}
