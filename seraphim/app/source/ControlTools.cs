using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace SeraphimLuxury
{
    [DataContract] public class CalendarEntry
    {
        [DataMember] public string Id,Title,Date,Time;
        [DataMember] public bool Annual;
    }
    [DataContract] public class UsageEntry
    {
        [DataMember] public string Day,AppId;
        [DataMember] public int Seconds;
    }
    [DataContract] class DefenderState
    {
        [DataMember] public bool AntivirusEnabled,RealTimeProtectionEnabled,AntispywareEnabled;
        [DataMember] public string AntivirusSignatureLastUpdated;
    }
    static class TimeRules
    {
        public static bool Due(CalendarEntry item,DateTime now)
        {
            DateTime day;if(item==null||!DateTime.TryParseExact(item.Date,"yyyy-MM-dd",System.Globalization.CultureInfo.InvariantCulture,System.Globalization.DateTimeStyles.None,out day)||!Planning.ValidTime(item.Time))return false;
            if(item.Annual){if(day.Month!=now.Month||day.Day!=now.Day)return false;day=now.Date;}
            if(day.Date!=now.Date)return false;
            var due=day.Add(TimeSpan.Parse(item.Time));return now>=due&&(now-due).TotalMinutes<15;
        }
        public static int Total(Preferences p,string id,DateTime day){return p.Usage.Where(u=>u.Day==day.ToString("yyyy-MM-dd")&&u.AppId==id).Sum(u=>u.Seconds);}
    }
    partial class MainWindow
    {
        [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint id);
        [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref IdleInfo input);
        [StructLayout(LayoutKind.Sequential)] struct IdleInfo {public uint Size,Tick;}
        readonly Dictionary<string,DateTime> nativePasses=new Dictionary<string,DateTime>();
        readonly HashSet<string> timeNotices=new HashSet<string>();
        readonly Queue<Tuple<string,string,Action>> noticeQueue=new Queue<Tuple<string,string,Action>>();
        DateTime trackingTick,clockAnchor,usageSaved,webFocusUntil;string webFocusHost;
        string activeTask;
        Button profileButton;
        internal ListBox visibleCountries;
        internal static void NormalizeTools(Preferences p)
        {
            if(p.Blacklist==null){p.Blacklist=new List<string>();p.BlacklistEnabled=true;}p.Blacklist=ParseBlacklist(String.Join("\n",p.Blacklist));
            if(p.ToolVersion==0){p.ClockEnabled=true;p.ClockHours=3;p.TimeTracking=true;p.ScreenLimitMinutes=45;p.TimeNoticeMinutes=15;p.IdleMinutes=3;p.CalendarAlerts=true;p.TaskAlerts=true;p.TaskAdvanceMinutes=10;p.TaskRepeatMinutes=15;p.ToolVersion=1;}
            if(p.Calendar==null)p.Calendar=new List<CalendarEntry>();if(p.Usage==null)p.Usage=new List<UsageEntry>();
            p.ClockHours=Math.Max(1,Math.Min(12,p.ClockHours));p.ScreenLimitMinutes=Math.Max(1,Math.Min(720,p.ScreenLimitMinutes));p.TimeNoticeMinutes=Math.Max(1,Math.Min(180,p.TimeNoticeMinutes));p.IdleMinutes=Math.Max(1,Math.Min(60,p.IdleMinutes));p.TaskAdvanceMinutes=Math.Max(0,Math.Min(120,p.TaskAdvanceMinutes));p.TaskRepeatMinutes=Math.Max(1,Math.Min(180,p.TaskRepeatMinutes));
            p.Calendar=p.Calendar.Where(c=>c!=null&&!String.IsNullOrWhiteSpace(c.Id)&&!String.IsNullOrWhiteSpace(c.Title)&&c.Title.Length<=150&&ValidCalendarDate(c.Date)&&Planning.ValidTime(c.Time)).Take(500).ToList();
            p.Usage=p.Usage.Where(u=>u!=null&&u.Seconds>=0&&u.Seconds<=86400&&u.Day!=null&&u.AppId!=null).OrderByDescending(u=>u.Day).Take(5000).ToList();
        }
        static bool ValidCalendarDate(string value){DateTime parsed;return DateTime.TryParseExact(value,"yyyy-MM-dd",System.Globalization.CultureInfo.InvariantCulture,System.Globalization.DateTimeStyles.None,out parsed);}
        void RefreshProfile(){RefreshGreeting14();if(profileButton==null)return;var fresh=ProfileCircle();var content=fresh.Content;fresh.Content=null;profileButton.Content=content;}
        void InitializeTools()
        {
            NormalizeTools(preferences);ControlCatalog14.Normalize(preferences);
            if(preferences.SocialCatalogVersion<1)foreach(var site in new[]{Tuple.Create("instagram","Instagram","instagram.com"),Tuple.Create("snapchat","Snapchat","web.snapchat.com"),Tuple.Create("youtube","YouTube","youtube.com"),Tuple.Create("tiktok","TikTok","tiktok.com"),Tuple.Create("facebook","Facebook","facebook.com"),Tuple.Create("x","X","x.com"),Tuple.Create("reddit","Reddit","reddit.com"),Tuple.Create("discord","Discord","discord.com"),Tuple.Create("linkedin","LinkedIn","linkedin.com"),Tuple.Create("pinterest","Pinterest","pinterest.com")}){
                string id="social-"+site.Item1;if(preferences.Apps.Count<50&&!preferences.Apps.Any(a=>a.Id==id))preferences.Apps.Add(new AppEntry {Id=id,Name=site.Item2,Target="https://"+site.Item3+"/",Glyph="\uE774",Social=true});
            }
            preferences.SocialCatalogVersion=1;if(!testing&&store.Warning==null)SavePreferences();
        }
        bool NativeDenied(AppEntry app)
        {
            if(!Session.Active||!String.Equals(System.IO.Path.GetExtension(app.Executable??app.Target),".exe",StringComparison.OrdinalIgnoreCase))return false;
            DateTime pass;if(nativePasses.TryGetValue(app.Id,out pass)&&pass>DateTime.UtcNow)return false;
            var policy=ControlCatalog14.Policy(preferences,app);return (app.Social&&(preferences.NativeContentLock||preferences.SocialPassage||(preferences.LimitBlock&&TimeRules.Total(preferences,app.Id,DateTime.Today)>=preferences.ScreenLimitMinutes*60)))||(policy.LimitBlock&&policy.DailyLimitMinutes>0&&ControlCatalog14.Usage(preferences,app,DateTime.Today)>=policy.DailyLimitMinutes*60);
        }
        void ShowNativeGate(AppEntry app)
        {
            ShowPassage(preferences.NativeContentLock?"Ce logiciel est verrouillé.":"Avant "+app.Name+".",delegate {
                bool resuming=guard.HasHeld(app);nativePasses[app.Id]=DateTime.UtcNow.AddMinutes(10);CancelOverlay();if(!CanLaunch(app)){ShowGate(app);return;}guard.Release(app);if(!resuming){guard.AllowNext(app);if(!testing)try{Launcher(app);}catch(Exception ex){Error(ex);}}SetFootnote("Accès temporaire de 10 minutes · les images de ce logiciel ne sont pas filtrées.");
            });
        }
        string ForegroundPath()
        {
            uint id;GetWindowThreadProcessId(GetForegroundWindow(),out id);return id==0?null:ProcessNative.Executable((int)id);
        }
        bool UserIdle()
        {
            var data=new IdleInfo {Size=(uint)Marshal.SizeOf(typeof(IdleInfo))};return GetLastInputInfo(ref data)&&unchecked((uint)Environment.TickCount-data.Tick)>preferences.IdleMinutes*60000;
        }
        internal void AddUsage(string id,int seconds,DateTime day)
        {
            if(seconds<=0)return;string date=day.ToString("yyyy-MM-dd");var item=preferences.Usage.FirstOrDefault(u=>u.Day==date&&u.AppId==id);if(item==null){item=new UsageEntry {Day=date,AppId=id};preferences.Usage.Add(item);}item.Seconds=Math.Min(86400,item.Seconds+seconds);
        }
        void QueueNotice(string title,string body,Action action)
        {if(noticeQueue.Count<30)noticeQueue.Enqueue(Tuple.Create(title,body,action));}
        void FlushNotice()
        {
            if(reminder!=null||noticeQueue.Count==0)return;var item=noticeQueue.Dequeue();reminder=new ReminderWindow(item.Item1,item.Item2,delegate {Reveal();item.Item3();},preferences.ReducedMotion,"Ouvrir   →","CONTROL  /  VOTRE TEMPO");reminder.Closed+=delegate {reminder=null;};reminder.Show();
        }
        void ControlTick(DateTime now)
        {
            if(!Session.Active){trackingTick=DateTime.UtcNow;clockAnchor=DateTime.MinValue;nativePasses.Clear();noticeQueue.Clear();timeNotices.Clear();return;}
            DateTime utc=DateTime.UtcNow;if(clockAnchor==DateTime.MinValue)clockAnchor=utc;
            double delta=trackingTick==DateTime.MinValue?0:(utc-trackingTick).TotalSeconds;trackingTick=utc;
            if(preferences.TimeTracking&&delta>=.7&&delta<5&&!UserIdle()){
                string path=ForegroundPath();var app=preferences.Apps.FirstOrDefault(a=>String.Equals(a.Executable??a.Target,path,StringComparison.OrdinalIgnoreCase)&&ControlCatalog14.Policy(preferences,a).TrackTime);string id=app==null?null:app.Id;
                if(id==null&&path!=null&&(System.IO.Path.GetFileName(path).Equals("chrome.exe",StringComparison.OrdinalIgnoreCase)||System.IO.Path.GetFileName(path).Equals("msedge.exe",StringComparison.OrdinalIgnoreCase))&&utc<webFocusUntil)id="web:"+webFocusHost;
                if(id!=null&&TrackHost14(app,webFocusHost)){AddUsage(id,(int)Math.Round(delta),now.Date);int seconds=app==null?HostUsage14(webFocusHost,now.Date):ControlCatalog14.Usage(preferences,app,now.Date),bucket=seconds/(preferences.TimeNoticeMinutes*60);string key=now.ToString("yyyy-MM-dd")+id+"/"+bucket;
                    var policy=app==null?HostPolicy14(webFocusHost):ControlCatalog14.Policy(preferences,app);int limit=policy!=null&&policy.DailyLimitMinutes>0?policy.DailyLimitMinutes:preferences.ScreenLimitMinutes;key=now.ToString("yyyy-MM-dd")+id+"/"+seconds/((policy==null?preferences.TimeNoticeMinutes:policy.NotifyMinutes)*60);if(seconds>=limit*60&&timeNotices.Add(key))QueueNotice("Votre attention · "+seconds/60+" min","Temps au premier plan sur "+(app==null?webFocusHost:app.Name)+" aujourd'hui. Une pause est possible.",delegate {ShowPage("Réglages");});
                }
            }
            if(preferences.ClockEnabled){int slice=(int)((utc-clockAnchor).TotalHours/preferences.ClockHours);if(slice>0&&timeNotices.Add("clock/"+clockAnchor.Ticks+"/"+slice))QueueNotice(now.ToString("HH:mm")+" · repère de journée",preferences.ClockHours+" heures viennent de passer"+(String.IsNullOrEmpty(activeTask)?" dans votre session.":" depuis votre tâche : "+activeTask+"."),delegate {ShowPage("Planning");});}
            if(preferences.CalendarAlerts)foreach(var item in preferences.Calendar.Where(c=>TimeRules.Due(c,now))){if(timeNotices.Add("calendar/"+now.ToString("yyyy-MM-dd")+"/"+item.Id))QueueNotice(item.Time+" · "+item.Title,"Votre calendrier vous rappelle ce rendez-vous.",delegate {ShowCalendar();});}
            if((utc-usageSaved).TotalSeconds>60){usageSaved=utc;preferences.Usage=preferences.Usage.Where(u=>String.CompareOrdinal(u.Day,now.Date.AddDays(-90).ToString("yyyy-MM-dd"))>=0).ToList();if(!testing)SavePreferences();}
            FlushNotice();
        }
        void StartTask(PlanTask task)
        {activeTask=task.Title;clockAnchor=trackingTick=DateTime.UtcNow;SetFootnote("Tâche démarrée · "+task.Title+" · repères toutes les "+preferences.ClockHours+" h.");}
        static Border ToolLine(UIElement content)
        {return new Border {Child=content,BorderBrush=Visuals.Line,BorderThickness=new Thickness(0,0,0,.6),Padding=new Thickness(0,13,0,13)};}
        void ToolToggle(Panel target,string title,string note,bool initial,Action<bool> set,bool passage)
        {
            var row=new Grid();row.ColumnDefinitions.Add(new ColumnDefinition());row.ColumnDefinitions.Add(new ColumnDefinition {Width=GridLength.Auto});
            var words=new StackPanel();words.Children.Add(Visuals.TextBlock(title,13,Visuals.Text,true));words.Children.Add(Visuals.TextBlock(note,10,Visuals.Muted));row.Children.Add(words);
            var check=new CheckBox {IsChecked=initial,Style=(Style)Application.Current.Resources["StepCheck"],VerticalAlignment=VerticalAlignment.Center,Margin=new Thickness(18,0,0,0)};Grid.SetColumn(check,1);row.Children.Add(check);AutomationProperties.SetName(check,title);if(CurrentPage=="Web")WebOptionChecks.Add(check);check.ToolTip="Réglage préparé · s’applique pendant votre session active";
            var pill=StatePill(initial?"ON":"OFF",initial);check.Content=pill;bool changing=false;
            Action<bool> update=delegate(bool value){set(value);pill.Background=StatePill(value?"ON":"OFF",value).Background;((TextBlock)pill.Child).Text=value?"ON":"OFF";((TextBlock)pill.Child).Foreground=StatePill(value?"ON":"OFF",value).Child is TextBlock?((TextBlock)StatePill(value?"ON":"OFF",value).Child).Foreground:Visuals.Text;};
            check.Checked+=delegate {if(!changing)update(true);};check.Unchecked+=delegate {if(changing)return;if(passage&&Session.Active){changing=true;check.IsChecked=true;changing=false;ShowPassage("Avant de retirer cette protection.",delegate {changing=true;check.IsChecked=false;changing=false;update(false);});}else update(false);};target.Children.Add(ToolLine(row));
        }
        void NumberSetting(Panel target,string title,string note,int value,int min,int max,Action<int> set)
        {
            var row=new Grid();row.ColumnDefinitions.Add(new ColumnDefinition());row.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(90)});var copy=new StackPanel();copy.Children.Add(Visuals.TextBlock(title,13));copy.Children.Add(Visuals.TextBlock(note,10,Visuals.Muted));row.Children.Add(copy);var input=new TextBox {Text=value.ToString(),MaxLength=3,Padding=new Thickness(8),VerticalContentAlignment=VerticalAlignment.Center,ToolTip=min+" à "+max,MinHeight=32};AutomationProperties.SetName(input,title);Grid.SetColumn(input,1);row.Children.Add(input);input.LostKeyboardFocus+=delegate {int n;if(!Int32.TryParse(input.Text,out n)||n<min||n>max){input.Text=value.ToString();SetFootnote("Valeur attendue : "+min+" à "+max+".");return;}value=n;set(n);SavePreferences();};target.Children.Add(ToolLine(row));
        }
        StackPanel ToolGroup(string title,string glyph)
        {
            return NewGroup13(title,glyph);
        }
        void AddEssentialTools()
        {
            Essential13();
        }
        void BuildSettingsExtended()
        {
            AtlasStyles();TitleSection("CONTROL  /  VOTRE ESPACE","Tout commence par vos choix.","Des réglages locaux, appliqués pendant votre session. Les services non connectés restent identifiés.");
            var content=ToolGroup("Contenu & applications","shield");page.Children.Add(content);
            foreach(var tuple in new[]{Tuple.Create("Passage avant les réseaux",0,preferences.SocialPassage),Tuple.Create("Contenus sensibles / 18+",1,preferences.AdultFilter),Tuple.Create("Réduire les recommandations",2,preferences.QuietFeeds),Tuple.Create("Masquer Reels / Shorts / Spotlight",3,preferences.HideShortVideos),Tuple.Create("Masquer les publicités",4,preferences.HideAds)}){int id=tuple.Item2;ToolToggle(content,tuple.Item1,"Chrome / Edge · compagnon requis, pendant une session active",tuple.Item3,delegate(bool b){SetWebOption(id,b);},id==0||id==1||id==3);}
            ToolToggle(content,"Verrouillage des logiciels sociaux","Pause des exécutables sélectionnés ; accès temporaire après recopie. Aucune reconnaissance universelle des images.",preferences.NativeContentLock,delegate(bool b){preferences.NativeContentLock=b;SavePreferences();if(Session.Active)guard.Tick();},true);
            var open=StudioButton("Applications & domaines protégés   →",delegate {ShowPage("Applications");});open.Margin=new Thickness(0,10,0,0);content.Children.Add(open);
            var time=ToolGroup("Votre temps","globe");page.Children.Add(time);
            ToolToggle(time,"Compter le temps au premier plan","Logiciels sociaux sélectionnés et domaines connus · conservé 90 jours sur ce PC",preferences.TimeTracking,delegate(bool b){preferences.TimeTracking=b;SavePreferences();},false);
            NumberSetting(time,"Seuil de temps social (minutes)","Une notification vous invite à faire une pause",preferences.ScreenLimitMinutes,1,720,delegate(int n){preferences.ScreenLimitMinutes=n;});
            NumberSetting(time,"Répéter l'avertissement (minutes)","Après le seuil, si l'utilisation continue",preferences.TimeNoticeMinutes,1,180,delegate(int n){preferences.TimeNoticeMinutes=n;});
            NumberSetting(time,"Ignorer l'inactivité après (minutes)","Le compteur ne compte pas une session laissée sans interaction",preferences.IdleMinutes,1,60,delegate(int n){preferences.IdleMinutes=n;});
            ToolToggle(time,"Verrouiller les nouvelles ouvertures au seuil","Exécutables sociaux sélectionnés seulement · accès temporaire après recopie",preferences.LimitBlock,delegate(bool b){preferences.LimitBlock=b;SavePreferences();},true);
            ToolToggle(time,"Repères de journée","Le point de départ est la session, ou le bouton Démarrer d'une tâche",preferences.ClockEnabled,delegate(bool b){preferences.ClockEnabled=b;SavePreferences();},false);
            NumberSetting(time,"Découper la journée (heures)","1 à 12 h entre deux repères",preferences.ClockHours,1,12,delegate(int n){preferences.ClockHours=n;});
            var usage=new StackPanel {Margin=new Thickness(0,16,0,10)};foreach(var u in preferences.Usage.Where(u=>u.Day==DateTime.Today.ToString("yyyy-MM-dd")).OrderByDescending(u=>u.Seconds).Take(10)){var app=preferences.Apps.FirstOrDefault(a=>a.Id==u.AppId);usage.Children.Add(Visuals.TextBlock((app==null?u.AppId.Replace("web:",""):app.Name)+"  ·  "+u.Seconds/60+" min aujourd'hui",11,Visuals.Gold));}if(usage.Children.Count==0)usage.Children.Add(Visuals.TextBlock("Aujourd'hui · aucun temps social enregistré",11,Visuals.Muted));time.Children.Add(usage);
            var alerts=ToolGroup("Planning & rappels","apps");page.Children.Add(alerts);
            ToolToggle(alerts,"Rappels des tâches","Dix minutes avant par défaut, à l'heure prévue, puis rappels espacés",preferences.TaskAlerts,delegate(bool b){preferences.TaskAlerts=b;SavePreferences();},false);
            NumberSetting(alerts,"Prévenir avant (minutes)","0 désactive le rappel anticipé",preferences.TaskAdvanceMinutes,0,120,delegate(int n){preferences.TaskAdvanceMinutes=n;});
            NumberSetting(alerts,"Répéter les tâches en retard (minutes)","Les tâches cochées ne déclenchent plus de rappels",preferences.TaskRepeatMinutes,1,180,delegate(int n){preferences.TaskRepeatMinutes=n;});
            ToolToggle(alerts,"Notifications du calendrier","Dates et heures locales du PC, rendez-vous annuels disponibles",preferences.CalendarAlerts,delegate(bool b){preferences.CalendarAlerts=b;SavePreferences();},false);alerts.Children.Add(StudioButton("Calendrier & horizon annuel   →",ShowCalendar));
            var threats=ToolGroup("Protection anti-menaces","shield");page.Children.Add(threats);threats.Children.Add(Visuals.TextBlock(ThreatRunning?"ON · compagnon relié et règles appliquées":"OFF · protection non active dans le navigateur",12,Visuals.Gold));threats.Children.Add(StudioButton("Activer, actualiser la liste & consulter les incidents   →",BuildProtectionPage));
            var device=ToolGroup("Windows & réseau Wi-Fi","mesh");page.Children.Add(device);AddDeviceTools(device);
            var local=ToolGroup("Apparence & profil","monitor");page.Children.Add(local);
            ToolToggle(local,"Réduire les animations","Clignement, carte, fondus et parallax",preferences.ReducedMotion,delegate(bool b){preferences.ReducedMotion=b;Visuals.ReducedMotion=b;Branding.MotionChanged();SavePreferences();},false);
            local.Children.Add(StudioButton("Mon profil · photo & connexion locale   →",ShowAccount));local.Children.Add(StudioButton("Revoir l'animation d'ouverture",delegate {BeginLoading(false);}));
            local.Children.Add(StudioButton("Effacer uniquement mon historique de temps",delegate {ShowPassage("Avant d'effacer ces compteurs.",delegate {preferences.Usage.Clear();timeNotices.Clear();SavePreferences();ShowPage("Réglages");});}));
            local.Children.Add(Visuals.TextBlock("Ctrl + Alt + Entrée + S · ou 7 clics de molette sur l'accueil. Fermer la fenêtre désactive la session. VPN, Mesh, Dark Web Monitor et stockage cloud : fournisseurs à connecter. Gmail conserve sa configuration OAuth séparée.",11,Visuals.Muted));
        }
        void OpenWindows(string uri){try{Process.Start(new ProcessStartInfo(uri){UseShellExecute=true});}catch(Exception ex){Error(ex);}}
        void AddDeviceTools(Panel panel)
        {
            var state=Visuals.TextBlock("Protection Windows · lecture en cours…",12,Visuals.Gold);panel.Children.Add(ToolLine(state));
            var refresh=StudioButton("Actualiser l'état",async delegate {
                state.Text="Lecture de Windows…";
                try {string json=await Task.Run(delegate {using(var p=Process.Start(new ProcessStartInfo(System.IO.Path.Combine(Environment.SystemDirectory,"WindowsPowerShell","v1.0","powershell.exe"),"-NoProfile -NonInteractive -Command \"Get-MpComputerStatus -ErrorAction Stop | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,AntispywareEnabled | ConvertTo-Json -Compress\""){UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,WindowStyle=ProcessWindowStyle.Hidden})){var read=p.StandardOutput.ReadToEndAsync();if(!p.WaitForExit(10000)){p.Kill();throw new IOException("Windows ne répond pas.");}string result=read.Result;if(p.ExitCode!=0||result.Trim().Length==0)throw new IOException("État Defender indisponible. Ouvrez Sécurité Windows pour vérifier votre antivirus.");return result;}});var d=Json.Read<DefenderState>(json);state.Text="Microsoft Defender  ·  antivirus "+(d.AntivirusEnabled?"ON":"OFF")+"  ·  temps réel "+(d.RealTimeProtectionEnabled?"ON":"OFF");}
                catch(Exception ex){state.Text=ex.Message;}
            });panel.Children.Add(refresh);if(testing)state.Text="Protection Windows · état à lire sur ce PC";if(!testing)refresh.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
            var wifi=NetworkInterface.GetAllNetworkInterfaces().FirstOrDefault(n=>n.NetworkInterfaceType==NetworkInterfaceType.Wireless80211&&n.OperationalStatus==OperationalStatus.Up);panel.Children.Add(ToolLine(Visuals.TextBlock(wifi==null?"Wi-Fi · aucune interface connectée détectée":"Wi-Fi · interface connectée",12,Visuals.Muted)));
            var links=new WrapPanel();foreach(var pair in new[]{Tuple.Create("Antivirus & analyses","windowsdefender:"),Tuple.Create("Pare-feu Windows","ms-settings:windowsdefender"),Tuple.Create("Wi-Fi & réseaux","ms-settings:network-wifi"),Tuple.Create("Réseaux enregistrés","ms-settings:network-wifisettings"),Tuple.Create("Point d'accès","ms-settings:network-mobilehotspot"),Tuple.Create("Proxy","ms-settings:network-proxy"),Tuple.Create("État du réseau","ms-settings:network-status")}){string uri=pair.Item2;var b=StudioButton(pair.Item1+"   ↗",delegate {OpenWindows(uri);});b.Margin=new Thickness(0,0,15,8);links.Children.Add(b);}panel.Children.Add(links);panel.Children.Add(Visuals.TextBlock("Ces commandes ouvrent les protections et réglages réels de Windows. Seraphim ne remplace pas un antivirus ; le VPN ne garantit pas l'absence de malware.",10,Visuals.Muted));
        }
        void ShowCalendar(){ShowPage("Calendrier");}
        void BuildCalendar()
        {
            TitleSection("VOTRE HORIZON  /  JOUR · MOIS · ANNÉE","Du temps pour ce qui compte.","Cliquez une date pour préparer ses tâches. Les rendez-vous ont leurs propres rappels, pendant une session active.");
            var controls=new WrapPanel();foreach(var move in new[]{Tuple.Create("←",-1),Tuple.Create("→",1)}){int amount=move.Item2;var b=StudioButton(move.Item1,delegate {selectedDay=selectedDay.AddMonths(amount);ShowCalendar();});b.Width=40;controls.Children.Add(b);}var month=Visuals.TextBlock(selectedDay.ToString("MMMM yyyy",System.Globalization.CultureInfo.GetCultureInfo("fr-FR")),23,Visuals.Gold);month.Margin=new Thickness(15,4,20,0);controls.Children.Add(month);controls.Children.Add(StudioButton("+  Rendez-vous",delegate {EditCalendar(null);}));page.Children.Add(controls);
            var calendar=new System.Windows.Controls.Primitives.UniformGrid {Columns=7,Margin=new Thickness(0,20,0,16)};foreach(string name in new[]{"L","M","M","J","V","S","D"}){var t=Visuals.TextBlock(name,10,Visuals.Muted);t.TextAlignment=TextAlignment.Center;calendar.Children.Add(t);}var first=new DateTime(selectedDay.Year,selectedDay.Month,1);int offset=((int)first.DayOfWeek+6)%7;for(int i=0;i<offset;i++)calendar.Children.Add(new Border());for(int d=1;d<=DateTime.DaysInMonth(first.Year,first.Month);d++){DateTime day=first.AddDays(d-1);string key=day.ToString("yyyy-MM-dd");int plans=preferences.Plans.Where(p=>p.Date==key).Sum(p=>p.Tasks.Count);int events=preferences.Calendar.Count(c=>c.Date==key||c.Annual&&c.Date.Substring(5)==key.Substring(5));var b=StudioButton(d+(plans+events>0?"  ·":""),delegate {selectedDay=day;ShowPage("Planning");});b.MinHeight=48;b.Foreground=day==DateTime.Today?Visuals.Gold:Visuals.Text;b.BorderThickness=new Thickness(0,0,0,.5);b.ToolTip=plans+" tâches · "+events+" rendez-vous";calendar.Children.Add(b);}page.Children.Add(calendar);
            foreach(var entry in preferences.Calendar.OrderBy(e=>e.Date+e.Time)){var item=entry;var row=new Grid();row.ColumnDefinitions.Add(new ColumnDefinition());row.ColumnDefinitions.Add(new ColumnDefinition {Width=GridLength.Auto});row.Children.Add(Visuals.TextBlock(item.Date+"   "+item.Time+"   ·   "+item.Title+(item.Annual?"  ↻ annuel":""),12));var edit=StudioButton("Modifier",delegate {EditCalendar(item);});Grid.SetColumn(edit,1);row.Children.Add(edit);page.Children.Add(ToolLine(row));}
            var year=ToolGroup("L'année · "+selectedDay.Year,"globe");page.Children.Add(year);var months=new System.Windows.Controls.Primitives.UniformGrid {Columns=4};for(int m=1;m<=12;m++){DateTime date=new DateTime(selectedDay.Year,m,1);int count=preferences.Plans.Where(p=>p.Date.StartsWith(date.ToString("yyyy-MM"))).Sum(p=>p.Tasks.Count);var b=StudioButton(date.ToString("MMM",System.Globalization.CultureInfo.GetCultureInfo("fr-FR"))+"  ·  "+count+" tâches",delegate {selectedDay=date;ShowCalendar();});b.BorderThickness=new Thickness(0,0,0,.5);months.Children.Add(b);}year.Children.Add(months);
            var years=new WrapPanel();years.Children.Add(StudioButton("Année précédente",delegate {selectedDay=selectedDay.AddYears(-1);ShowCalendar();}));years.Children.Add(StudioButton("Année suivante",delegate {selectedDay=selectedDay.AddYears(1);ShowCalendar();}));year.Children.Add(years);
        }
        void EditCalendar(CalendarEntry item)
        {
            CancelOverlay();shell.IsEnabled=false;overlay.Background=Visuals.Brush("#EE101018");overlay.Visibility=Visibility.Visible;var body=new StackPanel {Width=430};body.Children.Add(Visuals.TextBlock(item==null?"Un rendez-vous, une heure.":"Ajuster ce rendez-vous.",25,Visuals.Text,true));var title=new TextBox {Text=item==null?"":item.Title,MaxLength=150,Margin=new Thickness(0,20,0,12),ToolTip="Titre du rendez-vous"};body.Children.Add(title);var date=new DatePicker {SelectedDate=item==null?selectedDay:DateTime.Parse(item.Date),Margin=new Thickness(0,0,0,12)};body.Children.Add(date);var hour=new TextBox {Text=item==null?"09:00":item.Time,MaxLength=5,ToolTip="HH:mm",Margin=new Thickness(0,0,0,12)};body.Children.Add(hour);var annual=new CheckBox {Content="Répéter chaque année",IsChecked=item!=null&&item.Annual,Style=(Style)Application.Current.Resources["StepCheck"],Margin=new Thickness(0,0,0,16)};body.Children.Add(annual);var error=Visuals.TextBlock("",11,Visuals.Gold);body.Children.Add(error);
            AutomationProperties.SetName(title,"Titre du rendez-vous");AutomationProperties.SetName(hour,"Heure du rendez-vous");AutomationProperties.SetName(date,"Date du rendez-vous");
            body.Children.Add(StudioButton("Enregistrer",delegate {if(String.IsNullOrWhiteSpace(title.Text)||!date.SelectedDate.HasValue||!Planning.ValidTime(hour.Text)||preferences.Calendar.Count>=500&&item==null){error.Text="Indiquez un titre, une date et une heure HH:mm (500 rendez-vous maximum).";return;}var e=item??new CalendarEntry {Id=Guid.NewGuid().ToString("N")};e.Title=title.Text.Trim();e.Date=date.SelectedDate.Value.ToString("yyyy-MM-dd");e.Time=hour.Text;e.Annual=annual.IsChecked==true;if(item==null)preferences.Calendar.Add(e);SavePreferences();CancelOverlay();ShowCalendar();}));if(item!=null)body.Children.Add(StudioButton("Supprimer ce rendez-vous",delegate {preferences.Calendar.Remove(item);SavePreferences();CancelOverlay();ShowCalendar();}));body.Children.Add(StudioButton("Revenir",CancelOverlay));var card=Visuals.Card(body,new Thickness(30));card.HorizontalAlignment=HorizontalAlignment.Center;card.VerticalAlignment=VerticalAlignment.Center;overlay.Children.Add(card);
        }
        Button ProfileCircle()
        {
            var b=StudioButton("",ShowAccount);b.Width=38;b.Height=38;b.MinHeight=38;b.Padding=new Thickness(0);b.Margin=new Thickness(9,0,0,0);b.ToolTip="Mon compte";AutomationProperties.SetName(b,"Mon compte");var g=new Grid {Width=32,Height=32};g.Children.Add(new Ellipse {Stroke=Visuals.Gold,StrokeThickness=.7});
            string avatar=null;try{var profile=AccountSession.Load(AccountSession.FilePath);if(profile!=null&&AccountSession.SignedIn)avatar=profile.Avatar;}catch{}
            if(!String.IsNullOrEmpty(avatar)&&System.IO.Path.GetFileName(avatar)==avatar&&File.Exists(System.IO.Path.Combine(AccountSession.Root,avatar))){try{var image=new Image {Source=new BitmapImage(new Uri(System.IO.Path.Combine(AccountSession.Root,avatar))),Stretch=Stretch.UniformToFill,Margin=new Thickness(2)};image.Clip=new EllipseGeometry(new Point(14,14),14,14);g.Children.Add(image);}catch{}}
            else {var p=new System.Windows.Shapes.Path {Data=Geometry.Parse("M16,7 A4,4 0 1 0 16,15 A4,4 0 1 0 16,7 M7,26 C7,16 25,16 25,26"),Stroke=Visuals.Gold,StrokeThickness=.9,Fill=Brushes.Transparent};g.Children.Add(p);}b.Content=g;return b;
        }
        void ImportAvatar()
        {
            if(!AccountSession.SignedIn)return;var dialog=new Microsoft.Win32.OpenFileDialog {Filter="Images (*.png;*.jpg;*.jpeg)|*.png;*.jpg;*.jpeg",Title="Votre photo de profil"};if(dialog.ShowDialog(this)!=true)return;
            try {if(new FileInfo(dialog.FileName).Length>8000000)throw new IOException("Choisissez une image de moins de 8 Mo.");var image=new BitmapImage();image.BeginInit();image.CacheOption=BitmapCacheOption.OnLoad;image.DecodePixelWidth=256;image.UriSource=new Uri(dialog.FileName);image.EndInit();var encoder=new PngBitmapEncoder();encoder.Frames.Add(BitmapFrame.Create(image));string file="avatar-"+Guid.NewGuid().ToString("N")+".png";Directory.CreateDirectory(AccountSession.Root);using(var stream=File.Create(System.IO.Path.Combine(AccountSession.Root,file)))encoder.Save(stream);var account=AccountSession.Load(AccountSession.FilePath);account.Avatar=file;File.WriteAllText(AccountSession.FilePath,Json.Write(account),System.Text.Encoding.UTF8);RefreshProfile();CancelOverlay();ShowAccount();}catch(Exception ex){Error(ex);}
        }
        Image GlobeImage(double size)
        {var image=new Image {Source=Art.Load("ui-globe.png"),Width=size,Height=size,Stretch=Stretch.UniformToFill,Opacity=1};image.Clip=new EllipseGeometry(new Point(size/2,size/2),size/2,size/2);return image;}
    }
}
