using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Runtime.Serialization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;

namespace SeraphimLuxury
{
    [DataContract] public class ThreatEvent
    {
        [DataMember] public string Host,At,Category,Source;
    }
    [DataContract] class ThreatFeed
    {
        [DataMember] public string Updated,Version;
        [DataMember] public string[] Domains;
    }
    class ThreatCatalog
    {
        public const string Source="https://phishing.army/download/phishing_army_blocklist.txt";
        public const int PageSize=500;
        readonly string path;
        ThreatFeed feed;
        HashSet<string> domains=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        static readonly string[] Shared={"google.com","sites.google.com","github.com","github.io","facebook.com","instagram.com","youtube.com","microsoft.com","office.com","cloudflare.com","replit.app","replit.dev","wixsite.com","wordpress.com","blogspot.com","netlify.app","vercel.app","pages.dev","azurewebsites.net","weebly.com"};
        public ThreatCatalog(string directory){path=Path.Combine(directory,"phishing-army-cache.json");try{if(File.Exists(path)){var raw=File.ReadAllText(path);if(raw.Length<=15000000){var f=Json.Read<ThreatFeed>(raw);if(f!=null&&f.Domains!=null&&f.Domains.Length<=200000)Install(f);}}}catch {}}
        void Install(ThreatFeed f){var clean=f.Domains.Where(ValidHost).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(s=>s,StringComparer.Ordinal).ToArray();feed=new ThreatFeed {Updated=f.Updated,Version=f.Version,Domains=clean};domains=new HashSet<string>(clean,StringComparer.OrdinalIgnoreCase);}
        public static bool ValidHost(string host){return host!=null&&host.Length<=253&&Regex.IsMatch(host,@"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$",RegexOptions.CultureInvariant)&&!Shared.Contains(host)&&!host.EndsWith(".invalid")&&!host.EndsWith(".test")&& !Regex.IsMatch(host,@"^\d+(?:\.\d+){3}$");}
        public bool Ready{get{DateTime updated;return feed!=null&&domains.Count>0&&DateTime.TryParse(feed.Updated,null,System.Globalization.DateTimeStyles.RoundtripKind,out updated)&&updated>DateTime.UtcNow.AddDays(-7)&&updated<=DateTime.UtcNow.AddMinutes(5);}}
        public int Count{get{return Ready?domains.Count:0;}}
        public string Version{get{return Ready?feed.Version:null;}}
        public string Updated{get{return feed==null?null:feed.Updated;}}
        public bool Matches(string host){if(!Ready||!WebPolicy.ValidDomain(host))return false;string candidate=host.ToLowerInvariant();while(candidate.Contains('.')){if(domains.Contains(candidate))return true;candidate=candidate.Substring(candidate.IndexOf('.')+1);}return false;}
        public string[] Page(int page){if(!Ready||page<0||page>(Count+PageSize-1)/PageSize)return new string[0];return feed.Domains.Skip(page*PageSize).Take(PageSize).ToArray();}
        public async System.Threading.Tasks.Task Refresh()
        {
            ServicePointManager.SecurityProtocol|=SecurityProtocolType.Tls12;
            using(var client=new HttpClient(new HttpClientHandler {AllowAutoRedirect=false})){
                client.Timeout=TimeSpan.FromSeconds(25);client.DefaultRequestHeaders.UserAgent.ParseAdd("Seraphim-Personal/0.9");
                using(var response=await client.GetAsync(Source,HttpCompletionOption.ResponseHeadersRead)){
                    response.EnsureSuccessStatusCode();if(response.Content.Headers.ContentLength>12000000)throw new InvalidDataException("Liste trop volumineuse.");
                    using(var input=await response.Content.ReadAsStreamAsync())using(var buffer=new MemoryStream()){
                        byte[] bytes=new byte[16384];int read;while((read=await input.ReadAsync(bytes,0,bytes.Length))>0){buffer.Write(bytes,0,read);if(buffer.Length>12000000)throw new InvalidDataException("Liste trop volumineuse.");}
                        var text=Encoding.UTF8.GetString(buffer.ToArray());var list=text.Split('\n').Select(s=>s.Trim().ToLowerInvariant()).Where(s=>!s.StartsWith("#")&&ValidHost(s)).Distinct().OrderBy(s=>s,StringComparer.Ordinal).ToArray();if(list.Length<10||list.Length>200000)throw new InvalidDataException("Liste non valide.");
                        string version;using(var sha=SHA256.Create())version=BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(String.Join("\n",list)))).Replace("-","");
                        var next=new ThreatFeed {Domains=list,Updated=DateTime.UtcNow.ToString("o"),Version=version};Directory.CreateDirectory(Path.GetDirectoryName(path));string temporary=path+".new";File.WriteAllText(temporary,Json.Write(next),Encoding.UTF8);if(File.Exists(path))File.Replace(temporary,path,path+".backup");else File.Move(temporary,path);Install(next);
                    }
                }
            }
        }
    }
    partial class MainWindow
    {
        ThreatCatalog threatCatalog;
        bool feedUpdating;
        DateTime lastThreatNotice=DateTime.MinValue;
        string threatAppliedVersion;
        DateTime threatAppliedAt=DateTime.MinValue,lastProtectionTick=DateTime.UtcNow,lastProtectionSave=DateTime.UtcNow;
        ThreatCatalog Threats{get{return threatCatalog??(threatCatalog=new ThreatCatalog(Path.GetDirectoryName(store.FilePath)));}}
        internal bool ThreatRunning{get{return Session.Active&&preferences.Premium&&preferences.ThreatProtection&&Threats.Ready&&threatAppliedVersion==Threats.Version&&(DateTime.UtcNow-threatAppliedAt).TotalSeconds<8;}}
        void RefreshRobloxTarget(){string found=Planning.FindRoblox();var entry=preferences.Apps.FirstOrDefault(a=>a.Id=="roblox-studio");if(found!=null&&entry!=null&&entry.Target!=found){entry.Target=found;SavePreferences();}}
        internal void BuildProtectionPage(){ShowPage("Protection");}
        async void RefreshThreatFeed(bool enable)
        {
            if(feedUpdating)return;feedUpdating=true;SetFootnote("Actualisation de la liste d’hameçonnage…");
            try {await Threats.Refresh();if(enable)preferences.ThreatProtection=true;SavePreferences();SetFootnote(Threats.Count+" domaines référencés · compagnon Web requis");}
            catch(Exception){SetFootnote("Actualisation indisponible. La dernière liste valide est conservée.");}
            finally {feedUpdating=false;if(CurrentPage=="Protection")ShowPage("Protection");}
        }
        void BuildProtection()
        {
            TitleSection("PROTECTION  /  COMPAGNON WEB","Votre vigilance, en clair.","Filtre d’hameçonnage dans le navigateur. Les autres protections de votre PC restent assurées par leurs logiciels dédiés.");
            var row=new StackPanel {Orientation=Orientation.Horizontal};var toggle=StudioButton("Anti-menaces  "+(preferences.ThreatProtection?"ON":"OFF"),delegate {if(preferences.ThreatProtection){preferences.ThreatProtection=false;SavePreferences();ShowPage("Protection");}else if(Threats.Ready){preferences.ThreatProtection=true;SavePreferences();ShowPage("Protection");}else RefreshThreatFeed(true);});row.Children.Add(toggle);var refresh=StudioButton(feedUpdating?"Actualisation…":"↻  Actualiser la liste",delegate {RefreshThreatFeed(false);});refresh.Margin=new Thickness(12,0,0,0);refresh.IsEnabled=!feedUpdating;row.Children.Add(refresh);page.Children.Add(row);
            var status=Visuals.TextBlock(ThreatRunning?"●  Protection navigateur active":!Session.Active?"○  En veille · activez votre session Travail":!preferences.Premium?"○  Protection réservée à Seraphim":"○  Compagnon, option et liste valide nécessaires",12,Visuals.Gold);status.Margin=new Thickness(0,15,0,8);page.Children.Add(status);
            page.Children.Add(Visuals.TextBlock(Threats.Count+" domaines · dernière récupération : "+(Threats.Updated??"aucune"),10,Visuals.Muted));
            var graphs=new Grid {Margin=new Thickness(0,20,0,15)};graphs.ColumnDefinitions.Add(new ColumnDefinition());graphs.ColumnDefinitions.Add(new ColumnDefinition());var blocked=new StackPanel();blocked.Children.Add(Visuals.TextBlock(HiddenCount("malicious")+" accès dangereux bloqués",16,Visuals.Text));blocked.Children.Add(new FilterSpark {Days=preferences.FilterHistory,Mode=1,Height=145});graphs.Children.Add(blocked);var hours=new StackPanel {Margin=new Thickness(25,0,0,0)};hours.Children.Add(Visuals.TextBlock((preferences.FilterHistory.Sum(d=>d.ProtectedSeconds)/3600.0).ToString("0.00")+" h de filtre Web actif",16,Visuals.Text));hours.Children.Add(new FilterSpark {Days=preferences.FilterHistory,Mode=2,Height=145});Grid.SetColumn(hours,1);graphs.Children.Add(hours);page.Children.Add(graphs);
            page.Children.Add(Visuals.TextBlock("VPN : 0 h sécurisée · Dark Web Monitor OFF · Mesh OFF",10,Visuals.Muted));
            var title=Visuals.TextBlock("Journal des blocages",20,Visuals.Text);title.Margin=new Thickness(0,22,0,12);page.Children.Add(title);
            if(preferences.ThreatEvents.Count==0)page.Children.Add(Visuals.TextBlock("Aucun blocage enregistré.",12,Visuals.Muted));
            foreach(var e in preferences.ThreatEvents.Take(40)){var body=new StackPanel {Margin=new Thickness(0,0,0,13)};body.Children.Add(Visuals.TextBlock("◈  "+e.Host,13,Visuals.Text));body.Children.Add(Visuals.TextBlock(e.Category+" · "+e.At,10,Visuals.Muted));body.Children.Add(Visuals.TextBlock("Source : "+e.Source+" · navigation interrompue avant le site",9,Visuals.Muted));page.Children.Add(body);}
            var credit=StudioButton("Phishing Army · Andrea Draghetti · CC BY-NC 4.0 ↗",delegate {System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("https://phishing.army/"){UseShellExecute=true});});credit.FontSize=9;credit.BorderThickness=new Thickness(0);credit.Margin=new Thickness(0,18,0,0);page.Children.Add(credit);
        }
        internal bool CountThreat(BridgeRequest request)
        {
            if(!Session.Active||!preferences.Premium||!preferences.ThreatProtection||request.session!=webSession||!Threats.Matches(request.host)||String.IsNullOrEmpty(request.id)||request.id.Length>100||metricEvents.Contains(request.id)||metricEvents.Count>=10000)return false;
            string day=DateTime.Today.ToString("yyyy-MM-dd");var entry=preferences.FilterHistory.FirstOrDefault(d=>d.Day==day);bool created=entry==null;if(created){entry=new FilterDay{Day=day};preferences.FilterHistory.Add(entry);}entry.Malicious++;
            var ev=new ThreatEvent{Host=request.host,At=DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss 'UTC'"),Category="Hameçonnage signalé",Source="Phishing Army"};preferences.ThreatEvents.Insert(0,ev);
            if(!SavePreferences()){entry.Malicious--;preferences.ThreatEvents.Remove(ev);if(created)preferences.FilterHistory.Remove(entry);return false;}
            if(preferences.ThreatEvents.Count>200)preferences.ThreatEvents.RemoveRange(200,preferences.ThreatEvents.Count-200);metricEvents.Add(request.id);RefreshStudioStats();
            if(!testing&&(DateTime.UtcNow-lastThreatNotice).TotalSeconds>8){lastThreatNotice=DateTime.UtcNow;var notice=new ReminderWindow("Navigation bloquée",request.host+"\nHameçonnage signalé · Phishing Army",delegate {Reveal();ShowPage("Protection");},preferences.ReducedMotion,"Détails de la menace  →","SERAPHIM  /  PROTECTION");notice.Show();}
            return true;
        }
        void ProtectionTick()
        {
            if(CurrentPage=="Accueil"||CurrentPage=="Atlas")RefreshStudioStats();
            var now=DateTime.UtcNow;double dt=(now-lastProtectionTick).TotalSeconds;lastProtectionTick=now;
            if(ThreatRunning&&dt>0&&dt<=3){string day=DateTime.Today.ToString("yyyy-MM-dd");var entry=preferences.FilterHistory.FirstOrDefault(d=>d.Day==day);if(entry==null){entry=new FilterDay {Day=day};preferences.FilterHistory.Add(entry);}entry.ProtectedSeconds+=(int)Math.Round(dt);if((now-lastProtectionSave).TotalSeconds>=60){SavePreferences();lastProtectionSave=now;}}
        }
    }
}
