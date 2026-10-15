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
    partial class MainWindow
    {
        public void ScheduleTick(DateTime now)
        {
            if(voiceRecording&&(DateTime.UtcNow-voiceBegan).TotalMinutes>=3){StopVoice();SetFootnote("Vocal enregistré · limite de trois minutes atteinte.");if(CurrentPage=="Messages")ShowPage("Messages");}
            ProtectionTick();ControlTick(now);UpdateTiming14();
            if(!Session.Active)return;
            guard.Tick();
            if(now.Date!=lastDay){lastDay=now.Date;Session.Prepared.Clear();sentReminders.Clear();if(CurrentPage=="Planning"){selectedDay=now.Date;ShowPage("Planning");}}
            if(reminder!=null)return;
            if(!preferences.TaskAlerts)return;var due=Planning.Reminders(Planning.Get(preferences,now.Date),now,sentReminders,preferences.TaskAdvanceMinutes,preferences.TaskRepeatMinutes);
            if(due.Count==0)return;
            foreach(var item in due)sentReminders[item.Key]=now;
            string title=due.Count==1?due[0].Kind+" · "+due[0].Task.Time:due.Count+" tâches à suivre";
            string text=String.Join("\n",due.Take(3).Select(r=>r.Task.Time+"  ·  "+r.Task.Title));if(due.Count>3)text+="\n+ "+(due.Count-3)+" autres tâches";
            ShowReminder(title,text);
        }
        public void ShowReminder(string title,string text)
        {
            if(reminder!=null)reminder.Close();
            reminder=new ReminderWindow(title,text,delegate {Reveal();selectedDay=DateTime.Today;ShowPage("Planning");},preferences.ReducedMotion);
            reminder.Closed+=delegate {reminder=null;};reminder.Show();
        }
        void PlanningChanged()
        {
            SavePreferences();if(Session.Active)guard.Tick();
        }
        void BuildPlanning(){BuildPlanningStudio14();}
        void ShowTaskEditor(DailyPlan plan,PlanTask task)
        {
            CancelOverlay();shell.IsEnabled=false;shell.Effect=new BlurEffect {Radius=7};overlay.Background=Visuals.Brush("#C7090B0F");overlay.Visibility=Visibility.Visible;
            var body=new StackPanel {Width=450};body.Children.Add(Visuals.Eyebrow("COMPOSEZ VOTRE JOURNÉE  /  "+plan.Date));
            var title=Visuals.TextBlock(task==null?"Une tâche, une intention.":"Ajustez votre tâche.",28,Visuals.Text,true);title.Margin=new Thickness(0,13,0,23);body.Children.Add(title);
            body.Children.Add(Visuals.TextBlock("Votre tâche",12,Visuals.Muted));var name=new TextBox {Text=task==null?"":task.Title,MaxLength=150,Margin=new Thickness(0,8,0,18),FontSize=14};body.Children.Add(name);AutomationProperties.SetName(name,"Nom de la tâche");
            body.Children.Add(Visuals.TextBlock("Heure du rappel · facultative (HH:mm)",12,Visuals.Muted));var time=new TextBox {Text=task==null?DateTime.Now.AddHours(1).ToString("HH:mm"):task.Time,MaxLength=5,Margin=new Thickness(0,8,0,12),FontSize=16};body.Children.Add(time);AutomationProperties.SetName(time,"Heure de fin de la tâche");
            body.Children.Add(Visuals.TextBlock("Application concernée",12,Visuals.Muted));var appChoice=new ComboBox {Margin=new Thickness(0,8,0,14),Height=36,Foreground=Brushes.Black,Background=Brushes.White};appChoice.Items.Add(new ComboBoxItem {Content="Journée · toutes les applications Travail",Tag=""});foreach(var entry in preferences.Apps.Where(a=>a.Work))appChoice.Items.Add(new ComboBoxItem {Content=entry.Name,Tag=entry.Id});appChoice.SelectedIndex=0;foreach(ComboBoxItem option in appChoice.Items)if(task!=null&&(string)option.Tag==task.AppId)appChoice.SelectedItem=option;body.Children.Add(appChoice);
            body.Children.Add(Visuals.TextBlock("Durée prévue · facultative (1 à 480 minutes)",12,Visuals.Muted));var duration=new TextBox {Text=task==null||task.Minutes==0?"":task.Minutes.ToString(),MaxLength=3,Margin=new Thickness(0,8,0,14)};body.Children.Add(duration);
            var error=Visuals.TextBlock("",11,Visuals.Gold);error.Margin=new Thickness(0,0,0,15);body.Children.Add(error);
            body.Children.Add(Visuals.Button("Enregistrer la tâche",delegate {
                string text=name.Text.Trim(),hour=time.Text.Trim();if(text.Length==0||(!String.IsNullOrEmpty(hour)&&!Planning.ValidTime(hour))){error.Text="Indiquez une tâche et une heure valide, par exemple 17:30.";return;}
                if(task==null&&plan.Tasks.Count>=40){error.Text="Une journée peut contenir jusqu'à 40 tâches.";return;}
                int minutes=0;if(duration.Text.Trim().Length>0&&(!Int32.TryParse(duration.Text.Trim(),out minutes)||minutes<1||minutes>480)){error.Text="Indiquez une durée entre 1 et 480 minutes.";return;}string appId=(string)((ComboBoxItem)appChoice.SelectedItem).Tag;
                if(task==null)plan.Tasks.Add(new PlanTask {Id=Guid.NewGuid().ToString("N"),Title=text,Time=hour,AppId=appId,Minutes=minutes});else{task.Title=text;task.Time=hour;task.AppId=appId;task.Minutes=minutes;}Session.Prepared.Clear();
                sentReminders.Clear();PlanningChanged();CancelOverlay();ShowPage("Planning");
            },true));
            if(task!=null){var remove=Visuals.Button("Supprimer cette tâche",delegate {plan.Tasks.Remove(task);PlanningChanged();CancelOverlay();ShowPage("Planning");});remove.Margin=new Thickness(0,10,0,0);body.Children.Add(remove);}
            var cancel=Visuals.Button("Annuler",CancelOverlay);cancel.Margin=new Thickness(0,10,0,0);body.Children.Add(cancel);
            var card=Visuals.Card(body,new Thickness(30));card.HorizontalAlignment=HorizontalAlignment.Center;card.VerticalAlignment=VerticalAlignment.Center;overlay.Children.Add(card);name.Focus();
        }
        public void ShowWorkGate(AppEntry app)
        {
            CancelOverlay();GateChecks.Clear();bool resuming=guard.HasHeld(app);shell.IsEnabled=false;shell.Effect=new BlurEffect {Radius=8};overlay.Background=Visuals.Brush("#C7090B0F");overlay.Visibility=Visibility.Visible;
            var plan=new DailyPlan {Date=Today.Date,Tasks=AppTasks(app)};var list=new StackPanel {Width=485};list.Children.Add(Visuals.Eyebrow("TRAVAIL  /  CHECKLIST DU JOUR"));
            var title=Visuals.TextBlock("Avant "+app.Name+".",29,Visuals.Text,true);title.Margin=new Thickness(0,15,0,12);list.Children.Add(title);
            list.Children.Add(Visuals.TextBlock(resuming?"L'ouverture Windows est en pause. Validez vos tâches pour la reprendre.":"Votre journée prépare l'accès à vos outils de travail.",12,Visuals.Muted));
            var progress=Visuals.TextBlock("",13,Visuals.Gold);progress.Margin=new Thickness(0,17,0,17);list.Children.Add(progress);
            GateOpenButton=Visuals.Button((resuming?"Reprendre ":"Ouvrir ")+app.Name+"   ↗",delegate {if(!CanLaunch(app))return;CancelOverlay();if(resuming){guard.Release(app);}else RequestLaunch(app);ShowPage(CurrentPage);},true);
            Action update=delegate {progress.Text=plan.Tasks.Count(t=>t.Done)+" / "+plan.Tasks.Count+" tâches terminées";GateOpenButton.IsEnabled=plan.Complete;};
            if(plan.Tasks.Count==0){list.Children.Add(Visuals.TextBlock("Votre planning est vide. Préparez les tâches de la journée pour déverrouiller le travail.",13,Visuals.Muted));}
            foreach(var item in plan.Tasks.OrderBy(t=>t.Time,StringComparer.Ordinal)){
                var task=item;var label=new StackPanel();label.Children.Add(Visuals.TextBlock(task.Title,13));label.Children.Add(Visuals.TextBlock(String.IsNullOrEmpty(task.Time)?"Sans heure fixe":"Heure prévue : "+task.Time,10,Visuals.Muted));
                var check=new CheckBox {Content=label,IsChecked=task.Done,Style=(Style)Application.Current.Resources["StepCheck"],Margin=new Thickness(0,0,0,15)};
                check.Checked+=delegate {task.Done=true;PlanningChanged();update();};check.Unchecked+=delegate {task.Done=false;PlanningChanged();update();};list.Children.Add(check);GateChecks.Add(check);
            }
            list.Children.Add(GateOpenButton);
            var planning=Visuals.Button("Préparer mon planning",delegate {CancelOverlay();selectedDay=DateTime.Today;ShowPage("Planning");});planning.Margin=new Thickness(0,10,0,0);list.Children.Add(planning);
            EmergencyButton=Visuals.Button("Urgence · ouvrir cette fois",delegate {CancelOverlay();if(resuming){guard.Release(app);SetFootnote(app.Name+" reprend en urgence. Vos tâches restent à faire.");}else{if(!testing)guard.AllowNext(app);try{Launcher(app);SetFootnote("Ouverture d'urgence : "+app.Name+". Vos tâches restent à faire.");}catch(Exception ex){Error(ex);}}ShowPage(CurrentPage);});EmergencyButton.Margin=new Thickness(0,10,0,0);list.Children.Add(EmergencyButton);
            var cancel=Visuals.Button(resuming?"Revenir · ouverture toujours en attente":"Revenir",CancelOverlay);cancel.Margin=new Thickness(0,10,0,0);list.Children.Add(cancel);update();
            var card=Visuals.Card(list,new Thickness(30));card.HorizontalAlignment=HorizontalAlignment.Center;card.VerticalAlignment=VerticalAlignment.Center;
            var scroll=new ScrollViewer {Content=card,VerticalScrollBarVisibility=ScrollBarVisibility.Auto,HorizontalScrollBarVisibility=ScrollBarVisibility.Disabled,MaxHeight=Math.Max(400,ActualHeight-40),VerticalAlignment=VerticalAlignment.Center};overlay.Children.Add(scroll);
            if(!preferences.ReducedMotion&&!testing)Visuals.Fade(overlay,0,1,300);
        }
        public void PrepareTestPlan()
        {Today.Tasks=new List<PlanTask> {new PlanTask {Id="a",Title="Préparer la scène Roblox",Time="10:30"},new PlanTask {Id="b",Title="Finaliser le script de déplacement",Time="14:00"},new PlanTask {Id="c",Title="Tester et noter les corrections",Time="17:30"}};SavePreferences();}
        public void CaptureReminder(string path){if(reminder==null)throw new Exception("Le rappel doit être visible.");reminder.VerifyAndCapture(path);reminder.OpenButton.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));if(CurrentPage!="Planning"||reminder!=null)throw new Exception("Le rappel doit ramener au planning et se fermer.");}
    }
}
