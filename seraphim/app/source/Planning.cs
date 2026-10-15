using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.Serialization;
using System.Text;
using System.Threading;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;

namespace SeraphimLuxury
{
    [DataContract] public class PlanTask
    {
        [DataMember] public string Id;
        [DataMember] public string Title;
        [DataMember] public string Time;
        [DataMember] public bool Done;
        [DataMember] public string AppId;
        [DataMember] public int Minutes;
    }
    [DataContract] public class DailyPlan
    {
        [DataMember] public string Date;
        [DataMember] public List<PlanTask> Tasks = new List<PlanTask>();
        public bool Complete { get { return Tasks.Count > 0 && Tasks.All(t => t.Done); } }
    }
    public class PlanReminder
    {
        public PlanTask Task; public string Kind; public string Key;
    }
    static class Planning
    {
        public static string Day(DateTime date) { return date.ToString("yyyy-MM-dd",System.Globalization.CultureInfo.InvariantCulture); }
        public static bool ValidTime(string value)
        { DateTime time; return DateTime.TryParseExact(value,"HH:mm",System.Globalization.CultureInfo.InvariantCulture,System.Globalization.DateTimeStyles.None,out time); }
        public static DailyPlan Get(Preferences prefs,DateTime date)
        {
            if(prefs.Plans==null)prefs.Plans=new List<DailyPlan>();
            string day=Day(date);var plan=prefs.Plans.FirstOrDefault(p=>p.Date==day);
            if(plan==null){plan=new DailyPlan {Date=day};prefs.Plans.Add(plan);}return plan;
        }
        public static bool CanLaunch(SessionState session,AppEntry entry,DailyPlan today)
        {return !session.Active || (entry.Work ? today.Complete : session.CanLaunch(entry));}
        public static List<PlanReminder> Reminders(DailyPlan plan,DateTime now,IDictionary<string,DateTime> sent,int advance=10,int repeat=15)
        {
            var result=new List<PlanReminder>();if(plan.Date!=Day(now))return result;
            foreach(var task in plan.Tasks.Where(t=>!t.Done&&!String.IsNullOrEmpty(t.Time))){
                DateTime due=now.Date.Add(TimeSpan.Parse(task.Time));double mins=(due-now).TotalMinutes;
                string kind=mins>0 ? "Bientôt" : "C’est le moment";string key=plan.Date+"/"+task.Id+"/"+task.Time+"/"+(mins>0?"soon":"due");
                DateTime last;if(mins>advance)continue;if(sent.TryGetValue(key,out last) && (mins>0 || (now-last).TotalMinutes<repeat))continue;
                result.Add(new PlanReminder {Task=task,Kind=kind,Key=key});
            }return result.OrderBy(r=>r.Task.Time,StringComparer.Ordinal).ToList();
        }
        public static string FindRoblox()
        {
            string root=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Roblox","Versions");
            try {return Directory.GetDirectories(root).Select(d=>Path.Combine(d,"RobloxStudioBeta.exe")).Where(File.Exists).OrderByDescending(File.GetLastWriteTimeUtc).FirstOrDefault();}catch{return null;}
        }
    }
    // Only newly observed, explicitly tagged executables are held. Existing processes are baselined.
    // A separate helper owns an emergency resume handle and releases the target if this UI exits/crashes.
    static class ProcessNative
    {
        [DllImport("kernel32.dll",SetLastError=true)] public static extern IntPtr OpenProcess(uint rights,bool inherit,int pid);
        [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr handle);
        [DllImport("kernel32.dll")] public static extern uint WaitForSingleObject(IntPtr handle,uint ms);
        [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool QueryFullProcessImageName(IntPtr handle,int flags,StringBuilder name,ref int size);
        [DllImport("ntdll.dll")] public static extern int NtSuspendProcess(IntPtr handle);
        [DllImport("ntdll.dll")] public static extern int NtResumeProcess(IntPtr handle);
        public static string Executable(int pid)
        {
            IntPtr h=OpenProcess(0x1000,false,pid);if(h==IntPtr.Zero)return null;
            try {var b=new StringBuilder(32768);int length=b.Capacity;return QueryFullProcessImageName(h,0,b,ref length)?b.ToString():null;}finally{CloseHandle(h);}
        }
        public static int Watch(string[] args)
        {
            IntPtr target=IntPtr.Zero,parent=IntPtr.Zero;
            try {
                int parentId=Int32.Parse(args[1]),targetId=Int32.Parse(args[2]);long ticks=Int64.Parse(args[3]);
                using(var process=Process.GetProcessById(targetId)){if(process.StartTime.ToUniversalTime().Ticks!=ticks)return 2;}
                target=OpenProcess(0x1800|0x100000,false,targetId);parent=OpenProcess(0x100000,false,parentId);
                if(target==IntPtr.Zero || parent==IntPtr.Zero)return 3;
                using(var released=EventWaitHandle.OpenExisting(args[4]))using(var ready=EventWaitHandle.OpenExisting(args[5])){
                    ready.Set();while(!released.WaitOne(200)){
                        if(WaitForSingleObject(target,0)==0)return 0;
                        if(WaitForSingleObject(parent,0)==0){NtResumeProcess(target);return 0;}
                    }
                }return 0;
            }catch{return 4;}finally{if(target!=IntPtr.Zero)CloseHandle(target);if(parent!=IntPtr.Zero)CloseHandle(parent);}
        }
    }
    class HeldProcess : IDisposable
    {
        public int Id;public AppEntry App;public IntPtr Handle;public EventWaitHandle Released;public Process Helper;
        public void Dispose()
        {
            if(Handle!=IntPtr.Zero){ProcessNative.NtResumeProcess(Handle);ProcessNative.CloseHandle(Handle);Handle=IntPtr.Zero;}
            if(Released!=null){Released.Set();Released.Dispose();Released=null;}if(Helper!=null){Helper.Dispose();Helper=null;}
        }
    }
    class WorkGuard : IDisposable
    {
        readonly Preferences prefs;readonly Func<AppEntry,bool> allowed;readonly Action<AppEntry> blocked;readonly Action<string> warning;
        readonly HashSet<string> seen=new HashSet<string>();readonly List<HeldProcess> held=new List<HeldProcess>();
        readonly Dictionary<string,DateTime> permits=new Dictionary<string,DateTime>();
        public bool Active;
        public int HeldCount {get{return held.Count;}}
        public WorkGuard(Preferences p,Func<AppEntry,bool> canLaunch,Action<AppEntry> onBlocked,Action<string> onWarning){prefs=p;allowed=canLaunch;blocked=onBlocked;warning=onWarning;}
        IEnumerable<Tuple<Process,AppEntry>> Candidates()
        {
            foreach(var group in prefs.Apps.Where(a=>(a.Work||a.Social||ControlCatalog14.Policy(prefs,a).LimitBlock) && String.Equals(Path.GetExtension(a.Executable??a.Target),".exe",StringComparison.OrdinalIgnoreCase)).GroupBy(a=>Path.GetFileNameWithoutExtension(a.Executable??a.Target),StringComparer.OrdinalIgnoreCase)){
                Process[] processes;try{processes=Process.GetProcessesByName(group.Key);}catch{continue;}
                foreach(var process in processes){
                    string path=ProcessNative.Executable(process.Id);
                    var entry=group.FirstOrDefault(a=>String.Equals(path,a.Executable??a.Target,StringComparison.OrdinalIgnoreCase) ||
                        (a.Id=="roblox-studio" && path!=null && path.StartsWith(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Roblox","Versions")+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase) && String.Equals(Path.GetFileName(path),"RobloxStudioBeta.exe",StringComparison.OrdinalIgnoreCase)));
                    if(entry!=null)yield return Tuple.Create(process,entry);else process.Dispose();
                }
            }
        }
        string Identity(Process p){return p.Id+"/"+p.StartTime.ToUniversalTime().Ticks;}
        public void Baseline()
        {foreach(var candidate in Candidates())using(candidate.Item1){try{seen.Add(Identity(candidate.Item1));}catch{}}}
        public void Activate(){seen.Clear();Baseline();Active=true;}
        public void Tick()
        {
            if(!Active)return;
            foreach(var item in held.ToArray())if(ProcessNative.WaitForSingleObject(item.Handle,0)==0||allowed(item.App)){item.Dispose();held.Remove(item);}
            foreach(var candidate in Candidates())using(candidate.Item1){
                try{
                    var process=candidate.Item1;var entry=candidate.Item2;string identity=Identity(process);
                    bool first=seen.Add(identity);
                    if(held.Any(h=>h.Id==process.Id)||allowed(entry)||(!first&&!((entry.Social&&(prefs.NativeContentLock||prefs.LimitBlock))||ControlCatalog14.Policy(prefs,entry).LimitBlock)))continue;
                    DateTime until;if(permits.TryGetValue(entry.Id,out until)){permits.Remove(entry.Id);if(DateTime.UtcNow<=until)continue;}
                    var item=Hold(process,entry);if(item!=null){held.Add(item);blocked(entry);}
                }catch(Exception ex){warning("Cette ouverture n'a pas pu être mise en attente : "+ex.Message);}
            }
        }
        HeldProcess Hold(Process process,AppEntry entry)
        {
            IntPtr handle=ProcessNative.OpenProcess(0x1800|0x100000,false,process.Id);
            if(handle==IntPtr.Zero){warning("Impossible de mettre "+entry.Name+" en attente. Lancez-la sans droits administrateur.");return null;}
            var heldProcess=new HeldProcess {Id=process.Id,App=entry,Handle=handle};
            string token="Local\\Seraphim.Hold."+Guid.NewGuid().ToString("N");
            heldProcess.Released=new EventWaitHandle(false,EventResetMode.ManualReset,token+".release");
            using(var ready=new EventWaitHandle(false,EventResetMode.ManualReset,token+".ready")){
                try {
                    heldProcess.Helper=Process.Start(new ProcessStartInfo(System.Reflection.Assembly.GetExecutingAssembly().Location,
                        "--watch-resume "+Process.GetCurrentProcess().Id+" "+process.Id+" "+process.StartTime.ToUniversalTime().Ticks+" "+token+".release "+token+".ready") {UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden});
                    if(!ready.WaitOne(2000) || heldProcess.Helper.HasExited)throw new IOException("Le mécanisme de reprise n'est pas prêt.");
                    if(ProcessNative.NtSuspendProcess(handle)!=0)throw new IOException("Windows a refusé la mise en pause.");
                    return heldProcess;
                }catch {heldProcess.Dispose();throw;}
            }
        }
        public bool HasHeld(AppEntry app){return held.Any(h=>h.App.Id==app.Id);}
        public void AllowNext(AppEntry app){permits[app.Id]=DateTime.UtcNow.AddSeconds(15);}
        public void Release(AppEntry app){foreach(var h in held.Where(h=>h.App.Id==app.Id).ToArray()){h.Dispose();held.Remove(h);}}
        public void Dispose(){Active=false;foreach(var h in held)h.Dispose();held.Clear();seen.Clear();permits.Clear();}
    }
    class ReminderWindow : Window
    {
        readonly DispatcherTimer timer;Action action;
        public Button OpenButton;
        public ReminderWindow(string title,string message,Action open,bool reduced,string buttonLabel="Voir mon planning   →",string kicker="SERAPHIM  /  VOTRE PLANNING")
        {
            action=open;Width=365;SizeToContent=SizeToContent.Height;WindowStyle=WindowStyle.None;ResizeMode=ResizeMode.NoResize;
            ShowInTaskbar=false;ShowActivated=false;Topmost=true;Background=Brushes.Transparent;AllowsTransparency=true;
            var body=new StackPanel {Margin=new Thickness(22)};
            var header=new Grid();header.Children.Add(Visuals.Eyebrow(kicker));
            var close=Visuals.Button("×",delegate {Close();});close.Width=25;close.MinHeight=23;close.Padding=new Thickness(0);close.HorizontalAlignment=HorizontalAlignment.Right;header.Children.Add(close);body.Children.Add(header);
            var heading=Visuals.TextBlock(title,21,Visuals.Text,true);heading.Margin=new Thickness(0,10,0,8);body.Children.Add(heading);
            body.Children.Add(Visuals.TextBlock(message,12,Visuals.Muted));var button=Visuals.Button(buttonLabel,delegate {var callback=action;Close();if(callback!=null)callback();},true);OpenButton=button;button.Margin=new Thickness(0,16,0,0);body.Children.Add(button);
            var notification=Visuals.Card(body,new Thickness(0));notification.Background=Visuals.Brush("#F0151620");Content=notification;
            Loaded+=delegate {var area=SystemParameters.WorkArea;Left=area.Right-Width-18;Top=area.Bottom-ActualHeight-18;if(!reduced)Visuals.Fade(this,0,1,260);};
            timer=new DispatcherTimer {Interval=TimeSpan.FromSeconds(18)};timer.Tick+=delegate {Close();};Closed+=delegate {timer.Stop();action=null;};timer.Start();
        }
        public void VerifyAndCapture(string file)
        {
            var area=SystemParameters.WorkArea;
            if(Math.Abs(Left+ActualWidth-(area.Right-18))>2||Math.Abs(Top+ActualHeight-(area.Bottom-18))>2)throw new Exception("Le rappel doit être placé en bas à droite de la zone de travail.");
            var content=(FrameworkElement)Content;content.UpdateLayout();var bitmap=new System.Windows.Media.Imaging.RenderTargetBitmap((int)Math.Ceiling(content.ActualWidth),(int)Math.Ceiling(content.ActualHeight),96,96,PixelFormats.Pbgra32);bitmap.Render(content);
            var encoder=new System.Windows.Media.Imaging.PngBitmapEncoder();encoder.Frames.Add(System.Windows.Media.Imaging.BitmapFrame.Create(bitmap));using(var stream=File.Create(file))encoder.Save(stream);
        }
    }
}
