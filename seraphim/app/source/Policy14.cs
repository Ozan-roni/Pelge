using System;using System.IO;using System.Linq;using System.Collections.Generic;using System.Runtime.Serialization;using System.Diagnostics;using System.Threading.Tasks;
namespace SeraphimLuxury {
 [DataContract] public class RuleFlag14 {[DataMember]public string Key;[DataMember]public bool Value;}
 [DataContract] public class AppPolicy14 {
  [DataMember]public string Id;[DataMember]public bool Enabled=true,TrackTime=true,ShowTimer=true,LimitBlock;
  [DataMember]public int DailyLimitMinutes,NotifyMinutes=15;[DataMember]public List<RuleFlag14> Flags=new List<RuleFlag14>();
 }
 [DataContract] public class RuleDefinition14 {[DataMember]public string Key,Label;[DataMember]public bool OriginalDefault;}
 [DataContract] public class AppDefinition14 {[DataMember]public string Name,Id;[DataMember]public string[] Domains;[DataMember]public List<RuleDefinition14> Rules;}
 static class ControlCatalog14 {
  static List<AppDefinition14> cache;
  public static List<AppDefinition14> All {get {if(cache==null)cache=Json.Read<List<AppDefinition14>>(File.ReadAllText(Path.Combine(Art.Root,"assets","control-options.json")));return cache;}}
  public static AppDefinition14 Definition(AppEntry a){return All.FirstOrDefault(d=>a.Id=="social-"+d.Id||a.Name.Equals(d.Name,StringComparison.OrdinalIgnoreCase)||a.Name.IndexOf(d.Name,StringComparison.OrdinalIgnoreCase)>=0&&d.Id.Length>1);}
  public static AppDefinition14 Host(string host){return All.FirstOrDefault(d=>WebPolicy.HostMatches(host,d.Domains));}
  public static AppPolicy14 Policy(Preferences p,AppEntry a){var d=Definition(a);return Policy(p,d==null?a.Id:d.Id,d);}
  public static AppPolicy14 Policy(Preferences p,string id,AppDefinition14 d=null){if(p.AppPolicies==null)p.AppPolicies=new List<AppPolicy14>();var r=p.AppPolicies.FirstOrDefault(x=>x.Id==id);if(r==null){r=new AppPolicy14{Id=id};p.AppPolicies.Add(r);}if(r.Flags==null)r.Flags=new List<RuleFlag14>();if(d!=null)foreach(var item in d.Rules)if(!r.Flags.Any(f=>f.Key==item.Key))r.Flags.Add(new RuleFlag14 {Key=item.Key,Value=item.Key=="Search"});return r;}
  public static void Normalize(Preferences p){if(p.AppPolicies==null)p.AppPolicies=new List<AppPolicy14>();p.AppPolicies=p.AppPolicies.Where(r=>r!=null&&!String.IsNullOrEmpty(r.Id)&&r.Id.Length<200).GroupBy(r=>r.Id).Select(g=>g.First()).Take(600).ToList();foreach(var r in p.AppPolicies){r.DailyLimitMinutes=Math.Max(0,Math.Min(720,r.DailyLimitMinutes));r.NotifyMinutes=Math.Max(1,Math.Min(180,r.NotifyMinutes));if(r.Flags==null)r.Flags=new List<RuleFlag14>();r.Flags=r.Flags.Where(f=>f!=null&&f.Key!=null&&f.Key.Length<80).GroupBy(f=>f.Key).Select(g=>g.First()).Take(60).ToList();}if(p.RecentApplications==null)p.RecentApplications=new List<string>();p.ApplicationLayout=Math.Max(0,Math.Min(2,p.ApplicationLayout));}
  public static int Usage(Preferences p,AppEntry app,DateTime day){var d=Definition(app);var ids=d==null?new HashSet<string>():new HashSet<string>(p.Apps.Where(a=>Definition(a)==d).Select(a=>a.Id));return p.Usage.Where(u=>u.Day==day.ToString("yyyy-MM-dd")&&(u.AppId==app.Id||d!=null&&(ids.Contains(u.AppId)||u.AppId.StartsWith("web:")&&WebPolicy.HostMatches(u.AppId.Substring(4),d.Domains)))).Sum(u=>u.Seconds);}

 }
 [DataContract] class StartApp14 {[DataMember]public string Name,AppID;}
 static class InstalledCatalog14 {
  public static List<AppEntry> Scan(){var entries=new Dictionary<string,AppEntry>(StringComparer.OrdinalIgnoreCase);foreach(var folder in new[]{Environment.GetFolderPath(Environment.SpecialFolder.StartMenu),Environment.GetFolderPath(Environment.SpecialFolder.CommonStartMenu)}){
   object shell=null;try{Type kind=Type.GetTypeFromProgID("WScript.Shell");if(kind==null)continue;shell=Activator.CreateInstance(kind);foreach(string file in Shortcuts(folder)){object link=null;try{link=shell.GetType().InvokeMember("CreateShortcut",System.Reflection.BindingFlags.InvokeMethod,null,shell,new object[]{file});string target=link.GetType().InvokeMember("TargetPath",System.Reflection.BindingFlags.GetProperty,null,link,null) as string;string name=Path.GetFileNameWithoutExtension(file);if(String.IsNullOrEmpty(target)||!target.EndsWith(".exe",StringComparison.OrdinalIgnoreCase)||!File.Exists(target)||name.IndexOf("uninstall",StringComparison.OrdinalIgnoreCase)>=0||name.IndexOf("désinstaller",StringComparison.OrdinalIgnoreCase)>=0)continue;entries[name]=new AppEntry {Id="installed-"+Stable(file),Name=name,Target=file,Executable=target,Glyph="\uE71D"};}catch{}finally{if(link!=null)System.Runtime.InteropServices.Marshal.FinalReleaseComObject(link);}}}catch{}finally{if(shell!=null)System.Runtime.InteropServices.Marshal.FinalReleaseComObject(shell);}

  }
  try{var p=Process.Start(new ProcessStartInfo("powershell.exe","-NoProfile -NonInteractive -Command \"[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding; @(Get-StartApps | Select-Object Name,AppID) | ConvertTo-Json -Compress\""){UseShellExecute=false,RedirectStandardOutput=true,RedirectStandardError=true,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden,StandardOutputEncoding=System.Text.Encoding.UTF8});string data=p.StandardOutput.ReadToEnd();if(!p.WaitForExit(15000)){p.Kill();return entries.Values.ToList();}if(p.ExitCode==0){foreach(var a in Json.Read<List<StartApp14>>(data))if(a.Name!=null&&a.AppID!=null&&!entries.ContainsKey(a.Name)&&entries.Count<600)entries[a.Name]=new AppEntry {Id="installed-"+Stable(a.AppID),Name=a.Name,Target="shell:AppsFolder\\"+a.AppID,Glyph="\uE71D"};}p.Dispose();}catch{}
  return entries.Values.OrderBy(e=>e.Name).ToList();}
  static List<string> Shortcuts(string root){var found=new List<string>();var pending=new Queue<string>();pending.Enqueue(root);int visited=0;while(pending.Count>0&&visited++<1000){var folder=pending.Dequeue();try{found.AddRange(Directory.GetFiles(folder,"*.lnk"));foreach(var dir in Directory.GetDirectories(folder))if((File.GetAttributes(dir)&FileAttributes.ReparsePoint)==0)pending.Enqueue(dir);}catch{}}return found;}
  static string Stable(string s){using(var sha=System.Security.Cryptography.SHA256.Create())return BitConverter.ToString(sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(s))).Replace("-","").Substring(0,16);}
 }
}
