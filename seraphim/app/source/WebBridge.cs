using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Threading;

namespace SeraphimLuxury
{
    static class Json
    {
        public static string Write<T>(T value){using(var stream=new MemoryStream()){new DataContractJsonSerializer(typeof(T)).WriteObject(stream,value);return Encoding.UTF8.GetString(stream.ToArray());}}
        public static T Read<T>(string value){using(var stream=new MemoryStream(Encoding.UTF8.GetBytes(value)))return (T)new DataContractJsonSerializer(typeof(T)).ReadObject(stream);}
    }
    [DataContract] public class Passage
    {
        [DataMember] public string Text;
        [DataMember] public string Reference;
    }
    static class WebPolicy
    {
        public static readonly string[] DefaultSocial={"instagram.com","facebook.com","messenger.com","x.com","twitter.com","tiktok.com","youtube.com","youtu.be","reddit.com","threads.net","threads.com","snapchat.com","twitch.tv","discord.com","linkedin.com","pinterest.com","bsky.app"};
        public static readonly string[] AdultDomains={"onlyfans.com","fansly.com","manyvids.com","pornhub.com","xvideos.com","xnxx.com","redtube.com","youporn.com","xhamster.com","chaturbate.com","stripchat.com","myfreecams.com","livejasmin.com","bongacams.com","camsoda.com","fapello.com","erome.com","rule34.xxx","nhentai.net","literotica.com","adultfriendfinder.com"};
        public static readonly Passage[] Passages={
            new Passage {Text="Garde ton cœur plus que toute autre chose, car de lui viennent les sources de la vie.",Reference="Proverbes 4:23 · Louis Segond 1910"},
            new Passage {Text="Que tes yeux regardent en face, et que tes paupières se dirigent devant toi.",Reference="Proverbes 4:25 · Louis Segond 1910"},
            new Passage {Text="Considère le chemin par où tu passes, et que toutes tes voies soient bien réglées.",Reference="Proverbes 4:26 · Louis Segond 1910"},
            new Passage {Text="La réflexion veillera sur toi, l’intelligence te gardera.",Reference="Proverbes 2:11 · Louis Segond 1910"},
            new Passage {Text="Tout est permis, mais tout n’est pas utile ; tout est permis, mais tout n’édifie pas.",Reference="1 Corinthiens 10:23 · Louis Segond 1910"}
        };
        public static string Normalize(string text){return (text??"").Normalize(NormalizationForm.FormC).Replace('’','\'').Replace('\u00a0',' ').Trim();}
        public static bool Matches(string actual,string expected){return String.Equals(Normalize(actual),Normalize(expected),StringComparison.Ordinal);}
        public static bool HostMatches(string host,IEnumerable<string> domains){return domains.Any(d=>String.Equals(host,d,StringComparison.OrdinalIgnoreCase)||host.EndsWith("."+d,StringComparison.OrdinalIgnoreCase));}
        public static bool ValidDomain(string domain){Uri uri;return !String.IsNullOrWhiteSpace(domain)&&Uri.TryCreate("https://"+domain,UriKind.Absolute,out uri)&&uri.Host==domain&&domain.Contains('.')&&!domain.Contains('/')&&!domain.Contains(':');}
        public static Passage Select(){byte[] bytes=new byte[4];using(var rng=RandomNumberGenerator.Create())rng.GetBytes(bytes);return Passages[(int)(BitConverter.ToUInt32(bytes,0)%Passages.Length)];}
    }
    [DataContract] public class BridgeRequest
    {
        [DataMember] public int seq;
        [DataMember] public string action;
        [DataMember] public int count;
        [DataMember] public string session;
        [DataMember] public string kind;
        [DataMember] public string host;
        [DataMember] public string id;
        [DataMember] public string text;
    }
    [DataContract] public class BridgeResponse
    {
        [DataMember] public AppPolicy14[] policies;[DataMember] public UsageEntry[] usage;[DataMember] public bool gray,shield;[DataMember] public long postUntil;
        [DataMember] public int seq;
        [DataMember] public bool active;
        [DataMember] public string[] blacklist;
        [DataMember] public bool blacklistEnabled;
        [DataMember] public bool connected;
        [DataMember] public bool premium;
        [DataMember] public bool social;
        [DataMember] public bool adult;
        [DataMember] public bool quiet;
        [DataMember] public bool shorts;
        [DataMember] public bool ads;
        [DataMember] public int hiddenShorts,hiddenAdults,hiddenAds,blockedMalicious,threatCount;
        [DataMember] public bool threat;
        [DataMember] public string threatVersion,threatUpdated;
        [DataMember] public string[] threatDomains;
        [DataMember] public string session;
        [DataMember] public string[] domains;
        [DataMember] public string[] adultDomains;
        [DataMember] public string id;
        [DataMember] public Passage passage;
        [DataMember] public bool valid;
        [DataMember] public string error;
    }
    class PendingPassage
    {public Passage Passage;public DateTime Expires;public string Host,Kind;}
    class NativeBridge : IDisposable
    {
        readonly Func<BridgeRequest,BridgeResponse> handler;volatile bool running;NamedPipeServerStream current;
        public static string PipeName {get{return "Seraphim.Web.v05."+WindowsIdentity.GetCurrent().User.Value;}}
        public NativeBridge(Func<BridgeRequest,BridgeResponse> callback){handler=callback;}
        public void Start(){running=true;new Thread(Serve){IsBackground=true,Name="Seraphim Browser Bridge"}.Start();}
        void Serve()
        {
            while(running){try {
                var security=new PipeSecurity();security.SetAccessRuleProtection(true,false);security.AddAccessRule(new PipeAccessRule(WindowsIdentity.GetCurrent().User,PipeAccessRights.FullControl,AccessControlType.Allow));
                using(var server=new NamedPipeServerStream(PipeName,PipeDirection.InOut,1,PipeTransmissionMode.Byte,PipeOptions.None,8192,8192,security)){
                    current=server;server.WaitForConnection();string json=ReadFrame(server,8192);var request=Json.Read<BridgeRequest>(json);BridgeResponse response=handler(request);WriteFrame(server,Json.Write(response));server.Flush();
                }
            }catch{if(!running)return;Thread.Sleep(100);}finally{current=null;}}
        }
        public void Dispose(){running=false;try{if(current!=null)current.Dispose();}catch{}}
        static string ReadFrame(Stream stream,int max)
        {
            byte[] prefix=new byte[4];ReadExact(stream,prefix);int length=BitConverter.ToInt32(prefix,0);if(length<1||length>max)throw new InvalidDataException("Message invalide.");byte[] bytes=new byte[length];ReadExact(stream,bytes);return Encoding.UTF8.GetString(bytes);
        }
        static void ReadExact(Stream stream,byte[] bytes){int at=0;while(at<bytes.Length){int read=stream.Read(bytes,at,bytes.Length-at);if(read==0)throw new EndOfStreamException();at+=read;}}
        static void WriteFrame(Stream stream,string text){byte[] bytes=Encoding.UTF8.GetBytes(text);byte[] length=BitConverter.GetBytes(bytes.Length);stream.Write(length,0,4);stream.Write(bytes,0,bytes.Length);stream.Flush();}
        public static BridgeResponse Query(BridgeRequest request)
        {
            try {using(var client=new NamedPipeClientStream(".",PipeName,PipeDirection.InOut)){client.Connect(600);WriteFrame(client,Json.Write(request));return Json.Read<BridgeResponse>(ReadFrame(client,262144));}}
            catch{return new BridgeResponse {active=false,connected=false,error="Seraphim est fermé ou en veille."};}
        }
        public static int Host(string origin)
        {
            try {
                string allowed=File.ReadAllText(System.IO.Path.Combine(Art.Root,"browser-extension","origin.txt")).Trim();if(origin!=allowed)return 3;
                using(var input=Console.OpenStandardInput())using(var output=Console.OpenStandardOutput())while(true){
                    string request;try{request=ReadFrame(input,8192);}catch(EndOfStreamException){return 0;}
                    BridgeResponse response;try{var data=Json.Read<BridgeRequest>(request);response=Query(data);response.seq=data.seq;}catch{response=new BridgeResponse {error="Requête invalide."};}
                    WriteFrame(output,Json.Write(response));
                }
            }catch{return 2;}
        }
    }
    partial class MainWindow
    {
        readonly Dictionary<string,PendingPassage> passages=new Dictionary<string,PendingPassage>();string webSession=Guid.NewGuid().ToString("N");bool previousWebActive;
        public BridgeResponse BrowserRequest(BridgeRequest request)
        {
            browserSeen=DateTime.UtcNow;if(previousWebActive!=Session.Active){previousWebActive=Session.Active;webSession=Guid.NewGuid().ToString("N");passages.Clear();metricEvents.Clear();}
            var response=new BridgeResponse {active=Session.Active,connected=true,premium=preferences.Premium,social=preferences.SocialPassage,adult=preferences.AdultFilter,quiet=preferences.QuietFeeds,shorts=preferences.HideShortVideos,ads=preferences.HideAds,hiddenShorts=HiddenCount("shorts"),hiddenAdults=HiddenCount("adult"),hiddenAds=HiddenCount("ads"),threat=preferences.Premium&&preferences.ThreatProtection&&Threats.Ready,threatVersion=Threats.Version,threatCount=Threats.Count,threatUpdated=Threats.Updated,blockedMalicious=HiddenCount("malicious"),session=webSession,domains=preferences.SocialDomains.ToArray(),adultDomains=WebPolicy.AdultDomains,blacklist=preferences.Blacklist.ToArray(),blacklistEnabled=preferences.BlacklistEnabled};
            response.policies=ControlCatalog14.All.Select(d=>ControlCatalog14.Policy(preferences,d.Id,d)).ToArray();response.usage=preferences.Usage.Where(u=>u.Day==DateTime.Today.ToString("yyyy-MM-dd")).Select(u=>{var a=preferences.Apps.FirstOrDefault(v=>v.Id==u.AppId);var d=a==null?null:ControlCatalog14.Definition(a);return d==null?u:new UsageEntry {Day=u.Day,AppId="social-"+d.Id,Seconds=u.Seconds};}).ToArray();response.gray=preferences.GrayWeb;response.shield=preferences.ShieldWeb;response.postUntil=preferences.PostModeUntil;
            foreach(var key in passages.Where(p=>p.Value.Expires<DateTime.UtcNow).Select(p=>p.Key).ToArray())passages.Remove(key);
            if(request.action=="metrics"){response.valid=CountFiltered(request);response.hiddenShorts=HiddenCount("shorts");response.hiddenAdults=HiddenCount("adult");response.hiddenAds=HiddenCount("ads");return response;}
            if(request.action=="threatPage"){if(Session.Active&&preferences.Premium&&preferences.ThreatProtection&&request.session==webSession&&request.text==Threats.Version){response.threatDomains=Threats.Page(request.count);response.valid=true;}return response;}
            if(request.action=="threatReady"){if(Session.Active&&response.threat&&request.session==webSession&&request.text==Threats.Version){threatAppliedVersion=request.text;threatAppliedAt=DateTime.UtcNow;response.valid=true;}return response;}
            if(request.action=="threatBlocked"){response.valid=CountThreat(request);response.blockedMalicious=HiddenCount("malicious");return response;}
            if(request.action=="threatDetail"){Reveal();ShowPage("Protection");return response;}
            if(request.action=="webFocus"){
                string focus=(request.host??"").ToLowerInvariant();string foreground=ForegroundPath();
                if(Session.Active&&request.session==webSession&&preferences.TimeTracking&&WebPolicy.ValidDomain(focus)&&WebPolicy.HostMatches(focus,preferences.SocialDomains)&&foreground!=null&&(System.IO.Path.GetFileName(foreground).Equals("chrome.exe",StringComparison.OrdinalIgnoreCase)||System.IO.Path.GetFileName(foreground).Equals("msedge.exe",StringComparison.OrdinalIgnoreCase))){webFocusHost=focus;webFocusUntil=DateTime.UtcNow.AddSeconds(5);response.valid=true;}return response;
            }
            if(request.action=="status")return response;
            if(request.action=="controlTools"){Reveal();ShowPage("Applications");return response;}
            if(request.action=="show"){Reveal();ShowPage("Web");return response;}
            string host=(request.host??"").ToLowerInvariant();if(!WebPolicy.ValidDomain(host)){response.error="Domaine invalide.";return response;}
            if(request.action=="challenge"){
                if(passages.Count>=100){response.error="Trop de demandes en attente.";return response;}
                string id=Guid.NewGuid().ToString("N");var passage=request.kind=="content"?new Passage {Text="Seigneur, éclaire mon esprit et aide-moi à garder la paix et la maîtrise de mon attention.",Reference="Prière personnelle · Control / Seraphim"}:WebPolicy.Select();passages[id]=new PendingPassage {Host=host,Kind=request.kind,Passage=passage,Expires=DateTime.UtcNow.AddMinutes(10)};response.id=id;response.passage=passage;return response;
            }
            PendingPassage pending;
            if(request.action=="verify"&&passages.TryGetValue(request.id??"",out pending)&&pending.Host==host&&pending.Kind==request.kind){response.valid=WebPolicy.Matches(request.text,pending.Passage.Text);if(response.valid)passages.Remove(request.id);else response.error="Le passage doit être recopié entièrement.";return response;}
            response.error="Ce passage a expiré. Recommencez.";return response;
        }
    }
}
