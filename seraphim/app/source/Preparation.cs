using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace SeraphimLuxury
{
    class PreparationRow
    {
        public PlanTask Original;public TextBox Title,Time,Minutes;
    }
    partial class MainWindow
    {
        readonly List<PreparationRow> preparationRows=new List<PreparationRow>();
        public Button PreparationConfirm;
        public void AddPlanningMode(StackPanel panel)
        {
            var modes=new StackPanel {Orientation=Orientation.Horizontal,Margin=new Thickness(0,0,0,20)};
            foreach(var pair in new[]{Tuple.Create("Soft · préparer puis travailler",true),Tuple.Create("Strict · tâches terminées",false)}){
                bool soft=pair.Item2;var b=Visuals.Button(pair.Item1,delegate {preferences.SoftPlanning=soft;Session.Prepared.Clear();guard.Baseline();SavePreferences();ShowPage("Planning");},preferences.SoftPlanning==soft);b.FontSize=10;b.Padding=new Thickness(10,8,10,8);b.MinHeight=35;b.Margin=new Thickness(0,0,7,0);modes.Children.Add(b);
            }panel.Children.Add(modes);
        }
        public void ShowSoftGate(AppEntry app)
        {
            CancelOverlay();preparationRows.Clear();bool resuming=guard.HasHeld(app);shell.IsEnabled=false;shell.Effect=new BlurEffect {Radius=8};overlay.Background=Visuals.Brush("#C7090B0F");overlay.Visibility=Visibility.Visible;
            var body=new StackPanel {Width=630};var heading=new Grid();heading.ColumnDefinitions.Add(new ColumnDefinition());heading.ColumnDefinitions.Add(new ColumnDefinition {Width=GridLength.Auto});
            var copy=new StackPanel();copy.Children.Add(Visuals.Eyebrow("MODE SOFT  /  VOTRE INTENTION D'ABORD"));var title=Visuals.TextBlock("Votre journée dans\n"+app.Name+".",29,Visuals.Text,true);title.Margin=new Thickness(0,10,0,10);copy.Children.Add(title);copy.Children.Add(Visuals.TextBlock("Préparez vos tâches, puis commencez. Vous les cocherez au fil du travail.\nUne heure déclenche un rappel ; la durée indique le temps que vous prévoyez.",12,Visuals.Muted));heading.Children.Add(copy);var logo=Visuals.Seal(66);Grid.SetColumn(logo,1);logo.Margin=new Thickness(20,0,0,0);heading.Children.Add(logo);body.Children.Add(heading);
            var fields=new StackPanel {Margin=new Thickness(0,22,0,10)};body.Children.Add(fields);
            var labels=new Grid();labels.ColumnDefinitions.Add(new ColumnDefinition());labels.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(85)});labels.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(80)});labels.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(34)});
            labels.Children.Add(Visuals.TextBlock("TÂCHE",10,Visuals.Muted));var hour=Visuals.TextBlock("HEURE",10,Visuals.Muted);Grid.SetColumn(hour,1);labels.Children.Add(hour);var duration=Visuals.TextBlock("MINUTES",10,Visuals.Muted);Grid.SetColumn(duration,2);labels.Children.Add(duration);fields.Children.Add(labels);
            Action<PlanTask> add=delegate(PlanTask original){
                var row=new PreparationRow {Original=original,Title=new TextBox {Text=original==null?"":original.Title,MaxLength=150},Time=new TextBox {Text=original==null?"":original.Time,MaxLength=5},Minutes=new TextBox {Text=original==null||original.Minutes==0?"":original.Minutes.ToString(),MaxLength=3}};
                var line=new Grid {Margin=new Thickness(0,9,0,0)};line.ColumnDefinitions.Add(new ColumnDefinition());line.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(85)});line.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(80)});line.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(34)});
                int index=0;foreach(var field in new[]{row.Title,row.Time,row.Minutes}){field.Height=39;field.Padding=new Thickness(9,7,9,7);field.FontSize=12;field.Margin=new Thickness(0,0,7,0);Grid.SetColumn(field,index++);line.Children.Add(field);}
                AutomationProperties.SetName(row.Title,"Tâche pour "+app.Name);AutomationProperties.SetName(row.Time,"Heure facultative HH:mm");AutomationProperties.SetName(row.Minutes,"Durée prévue en minutes");
                var remove=Visuals.Button("×",delegate {preparationRows.Remove(row);fields.Children.Remove(line);});remove.MinHeight=34;remove.Width=30;remove.Padding=new Thickness(0);Grid.SetColumn(remove,3);line.Children.Add(remove);fields.Children.Add(line);preparationRows.Add(row);
            };
            foreach(var task in AppTasks(app))add(task);if(preparationRows.Count==0)add(null);
            var error=Visuals.TextBlock("",11,Visuals.Gold);error.Margin=new Thickness(0,10,0,12);body.Children.Add(error);
            var more=Visuals.Button("+  Ajouter une tâche",delegate {if(preparationRows.Count>=40){error.Text="Maximum : 40 tâches.";return;}add(null);});more.HorizontalAlignment=HorizontalAlignment.Left;body.Children.Add(more);
            PreparationConfirm=Visuals.Button((resuming?"Enregistrer et reprendre ":"Enregistrer et ouvrir ")+app.Name+"   ↗",delegate {
                var tasks=new List<PlanTask>();foreach(var row in preparationRows){
                    string text=row.Title.Text.Trim(),time=row.Time.Text.Trim();int minutes=0;
                    if(text.Length==0){error.Text="Chaque tâche doit avoir un nom.";return;}
                    if(time.Length>0&&!Planning.ValidTime(time)){error.Text="Une heure doit être au format HH:mm, par exemple 14:30.";return;}
                    if(row.Minutes.Text.Trim().Length>0&&(!Int32.TryParse(row.Minutes.Text.Trim(),out minutes)||minutes<1||minutes>480)){error.Text="La durée doit être comprise entre 1 et 480 minutes.";return;}
                    tasks.Add(new PlanTask {Id=row.Original==null?Guid.NewGuid().ToString("N"):row.Original.Id,Title=text,Time=time,Minutes=minutes,AppId=row.Original!=null&&String.IsNullOrEmpty(row.Original.AppId)?null:app.Id,Done=row.Original!=null&&row.Original.Done&&row.Original.Title==text});
                }
                if(tasks.Count==0){error.Text="Préparez au moins une tâche, ou utilisez Urgence.";return;}
                var previous=Today.Tasks.ToList();var edited=AppTasks(app);var next=Today.Tasks.Except(edited).Concat(tasks).ToList();if(next.Count>40){error.Text="Maximum : 40 tâches sur une journée.";return;}
                Today.Tasks=next;if(!SavePreferences()){Today.Tasks=previous;return;}Session.Prepared.Add(app.Id);sentReminders.Clear();CancelOverlay();
                if(resuming){guard.Release(app);SetFootnote(app.Name+" reprend. Votre planning est prêt.");}else RequestLaunch(app);ShowPage(CurrentPage);
            },true);PreparationConfirm.Margin=new Thickness(0,18,0,0);body.Children.Add(PreparationConfirm);
            EmergencyButton=Visuals.Button("Urgence · entrer sans préparer",delegate {CancelOverlay();if(resuming)guard.Release(app);else{if(!testing)guard.AllowNext(app);try{Launcher(app);}catch(Exception ex){Error(ex);}}SetFootnote("Ouverture ponctuelle. Aucune tâche n'a été cochée.");ShowPage(CurrentPage);});EmergencyButton.Margin=new Thickness(0,10,0,0);body.Children.Add(EmergencyButton);
            var back=Visuals.Button(resuming?"Revenir · l'ouverture reste en attente":"Revenir",CancelOverlay);back.Margin=new Thickness(0,10,0,0);body.Children.Add(back);
            var card=Visuals.Card(body,new Thickness(30));card.HorizontalAlignment=HorizontalAlignment.Center;var scroll=new ScrollViewer {Content=card,VerticalScrollBarVisibility=ScrollBarVisibility.Auto,HorizontalScrollBarVisibility=ScrollBarVisibility.Disabled,MaxHeight=Math.Max(400,ActualHeight-48),VerticalAlignment=VerticalAlignment.Center};overlay.Children.Add(scroll);
            if(!preferences.ReducedMotion&&!testing)Visuals.Fade(overlay,0,1,260);
        }
        public void FillPreparationTest(string title,string time,string minutes)
        {preparationRows[0].Title.Text=title;preparationRows[0].Time.Text=time;preparationRows[0].Minutes.Text=minutes;}
    }
}
