using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Net.Sockets;
using System.Runtime.Serialization;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace SeraphimLuxury
{
    [DataContract] class GoogleClientFile {[DataMember]public GoogleClient installed;}
    [DataContract] class GoogleClient {[DataMember]public string client_id;[DataMember]public string client_secret;}
    [DataContract] class GoogleToken {[DataMember]public string access_token;[DataMember]public string refresh_token;[DataMember]public int expires_in;[DataMember]public long expiresAt;}
    [DataContract] class GmailHeader {[DataMember]public string name;[DataMember]public string value;}
    [DataContract] class GmailBody {[DataMember]public string data;}
    [DataContract] class GmailPayload {[DataMember]public string mimeType;[DataMember]public GmailHeader[] headers;[DataMember]public GmailBody body;[DataMember]public GmailPayload[] parts;}
    [DataContract] class GmailMessage {[DataMember]public string id;[DataMember]public string threadId;[DataMember]public string snippet;[DataMember]public GmailPayload payload;
        public string Header(string name){return payload==null||payload.headers==null?"":(payload.headers.FirstOrDefault(h=>String.Equals(h.name,name,StringComparison.OrdinalIgnoreCase))??new GmailHeader()).value??"";}
    }
    [DataContract] class GmailPage {[DataMember]public GmailMessage[] messages;[DataMember]public string nextPageToken;}
    [DataContract] class GmailSend {[DataMember]public string raw;[DataMember]public string threadId;}
    sealed class GmailClient : IDisposable
    {
        readonly HttpClient http=new HttpClient {Timeout=TimeSpan.FromSeconds(25)};
        readonly System.Threading.SemaphoreSlim tokenLock=new System.Threading.SemaphoreSlim(1,1);int connectionGeneration;
        public void Dispose(){http.Dispose();}
        public bool Configured {get{try{return SecretVault.Load<GoogleClient>("google-client.bin")!=null;}catch{return false;}}}
        public bool Connected {get{try{return SecretVault.Load<GoogleToken>("google-token.bin")!=null;}catch{return false;}}}
        public void Configure(string path){var file=Json.Read<GoogleClientFile>(File.ReadAllText(path));if(file==null||file.installed==null||String.IsNullOrEmpty(file.installed.client_id)||!file.installed.client_id.EndsWith(".apps.googleusercontent.com",StringComparison.Ordinal))throw new ArgumentException("Choisissez les identifiants OAuth d'une application de bureau Google.");Disconnect();SecretVault.Save("google-client.bin",file.installed);}
        static string Base64Url(byte[] bytes){return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+','-').Replace('/','_');}
        public async Task Connect()
        {
            int generation=connectionGeneration;
            var client=SecretVault.Load<GoogleClient>("google-client.bin");if(client==null)throw new InvalidOperationException("Ajoutez d'abord votre fichier OAuth Google de type Bureau.");
            byte[] entropy=new byte[32];using(var random=RandomNumberGenerator.Create())random.GetBytes(entropy);string verifier=Base64Url(entropy),challenge;using(var hash=SHA256.Create())challenge=Base64Url(hash.ComputeHash(Encoding.ASCII.GetBytes(verifier)));
            string state=Guid.NewGuid().ToString("N");var listener=new TcpListener(IPAddress.Loopback,0);listener.Start();
            try {
                int port=((IPEndPoint)listener.LocalEndpoint).Port;string redirect="http://127.0.0.1:"+port+"/";
                string url="https://accounts.google.com/o/oauth2/v2/auth?client_id="+Uri.EscapeDataString(client.client_id)+"&redirect_uri="+Uri.EscapeDataString(redirect)+"&response_type=code&scope="+Uri.EscapeDataString("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send")+"&access_type=offline&prompt=consent&state="+state+"&code_challenge="+challenge+"&code_challenge_method=S256";
                Process.Start(new ProcessStartInfo(url){UseShellExecute=true});var accept=listener.AcceptTcpClientAsync();if(await Task.WhenAny(accept,Task.Delay(180000))!=accept)throw new TimeoutException("La connexion Google n'a pas été terminée.");
                Dictionary<string,string> query;
                using(var socket=await accept)using(var stream=socket.GetStream()){
                    var reader=new StreamReader(stream,Encoding.ASCII,false,1024,true);var line=reader.ReadLineAsync();if(await Task.WhenAny(line,Task.Delay(10000))!=line)throw new TimeoutException("La réponse Google n'a pas été reçue.");string first=await line;if(first==null||first.Length>8192||!first.StartsWith("GET "))throw new IOException("Réponse OAuth invalide.");
                    var uri=new Uri(redirect.TrimEnd('/')+first.Split(' ')[1]);query=uri.Query.TrimStart('?').Split('&').Where(x=>x.Contains('=')).Select(x=>x.Split(new[]{'='},2)).ToDictionary(x=>x[0],x=>Uri.UnescapeDataString(x[1].Replace('+',' ')));
                    byte[] page=Encoding.UTF8.GetBytes("<!doctype html><meta charset=utf-8><title>Seraphim</title><p>Vous pouvez revenir dans Seraphim. La connexion est en cours de vérification.</p>");byte[] header=Encoding.ASCII.GetBytes("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Security-Policy: default-src 'none'\r\nContent-Length: "+page.Length+"\r\nConnection: close\r\n\r\n");await stream.WriteAsync(header,0,header.Length);await stream.WriteAsync(page,0,page.Length);
                }
                string returnedState,code;if(!query.TryGetValue("state",out returnedState)||returnedState!=state||!query.TryGetValue("code",out code))throw new IOException("La connexion Google a été annulée ou n'a pas pu être vérifiée.");
                var fields=new Dictionary<string,string>{{"client_id",client.client_id},{"code",code},{"code_verifier",verifier},{"redirect_uri",redirect},{"grant_type","authorization_code"}};if(!String.IsNullOrEmpty(client.client_secret))fields["client_secret"]=client.client_secret;
                var token=await Token(fields);if(generation!=connectionGeneration)throw new IOException("La connexion a été interrompue.");SecretVault.Save("google-token.bin",token);
            }finally{listener.Stop();}
        }
        async Task<GoogleToken> Token(Dictionary<string,string> fields)
        {
            using(var response=await http.PostAsync("https://oauth2.googleapis.com/token",new FormUrlEncodedContent(fields))){if(!response.IsSuccessStatusCode)throw new IOException("Google a refusé la connexion. Vérifiez le client OAuth et les autorisations Gmail.");var token=Json.Read<GoogleToken>(await response.Content.ReadAsStringAsync());token.expiresAt=DateTime.UtcNow.AddSeconds(Math.Max(60,token.expires_in-60)).Ticks;return token;}
        }
        async Task<string> AccessToken()
        {
            await tokenLock.WaitAsync();try {
            int generation=connectionGeneration;
            var token=SecretVault.Load<GoogleToken>("google-token.bin");if(token==null)throw new InvalidOperationException("Gmail n'est pas connecté.");if(token.expiresAt>DateTime.UtcNow.Ticks)return token.access_token;
            var client=SecretVault.Load<GoogleClient>("google-client.bin");var fields=new Dictionary<string,string>{{"client_id",client.client_id},{"refresh_token",token.refresh_token},{"grant_type","refresh_token"}};if(!String.IsNullOrEmpty(client.client_secret))fields["client_secret"]=client.client_secret;
            var fresh=await Token(fields);fresh.refresh_token=token.refresh_token;if(generation!=connectionGeneration)throw new IOException("Gmail a été déconnecté.");SecretVault.Save("google-token.bin",fresh);return fresh.access_token;
            }finally{tokenLock.Release();}
        }
        async Task<T> Request<T>(HttpMethod method,string path,object body=null)
        {
            using(var request=new HttpRequestMessage(method,"https://gmail.googleapis.com/gmail/v1/users/me/"+path)){
                request.Headers.Authorization=new AuthenticationHeaderValue("Bearer",await AccessToken());if(body!=null)request.Content=new StringContent(Json.Write((GmailSend)body),Encoding.UTF8,"application/json");
                using(var response=await http.SendAsync(request)){if(!response.IsSuccessStatusCode)throw new IOException("Gmail a refusé cette action ("+(int)response.StatusCode+"). Aucun autre envoi n'a été tenté.");return Json.Read<T>(await response.Content.ReadAsStringAsync());}
            }
        }
        public async Task<GmailPage> Inbox(string pageToken=null)
        {
            var list=await Request<GmailPage>(HttpMethod.Get,"messages?labelIds=INBOX&maxResults=20"+(String.IsNullOrEmpty(pageToken)?"":"&pageToken="+Uri.EscapeDataString(pageToken)));
            if(list.messages!=null)list.messages=await Task.WhenAll(list.messages.Select(m=>Request<GmailMessage>(HttpMethod.Get,"messages/"+Uri.EscapeDataString(m.id)+"?format=metadata")));return list;
        }
        public Task<GmailMessage> Read(string id){return Request<GmailMessage>(HttpMethod.Get,"messages/"+Uri.EscapeDataString(id)+"?format=full");}
        public static string PlainText(GmailPayload payload)
        {
            if(payload==null)return "";if(payload.mimeType=="text/plain"&&payload.body!=null&&!String.IsNullOrEmpty(payload.body.data)){string text=payload.body.data.Replace('-','+').Replace('_','/');return Encoding.UTF8.GetString(Convert.FromBase64String(text.PadRight((text.Length+3)/4*4,'=')));}
            return payload.parts==null?"":String.Join("\n",payload.parts.Select(PlainText).Where(x=>x.Length>0));
        }
        public static string MimeReply(GmailMessage original,string text,string audio)
        {
            string recipient=original.Header("Reply-To");if(String.IsNullOrEmpty(recipient))recipient=original.Header("From");string address=new MailAddress(recipient).Address;
            string subject=original.Header("Subject");if(!subject.StartsWith("Re:",StringComparison.OrdinalIgnoreCase))subject="Re: "+subject;
            string id=original.Header("Message-ID");if(id.Contains('\r')||id.Contains('\n'))throw new ArgumentException("En-tête du message invalide.");
            var mime=new StringBuilder("To: "+address+"\r\nSubject: =?UTF-8?B?"+Convert.ToBase64String(Encoding.UTF8.GetBytes(subject))+"?=\r\nMIME-Version: 1.0\r\n");if(id.Length>0)mime.Append("In-Reply-To: "+id+"\r\nReferences: "+id+"\r\n");
            string encoded=Convert.ToBase64String(Encoding.UTF8.GetBytes(text),Base64FormattingOptions.InsertLineBreaks);
            if(String.IsNullOrEmpty(audio)){mime.Append("Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"+encoded);return mime.ToString();}
            if(!File.Exists(audio)||new FileInfo(audio).Length>20000000)throw new IOException("Le vocal est introuvable ou dépasse 20 Mo.");string boundary="seraphim_"+Guid.NewGuid().ToString("N");mime.Append("Content-Type: multipart/mixed; boundary=\""+boundary+"\"\r\n\r\n--"+boundary+"\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"+encoded+"\r\n--"+boundary+"\r\nContent-Type: audio/wav\r\nContent-Disposition: attachment; filename=\"vocal.wav\"\r\nContent-Transfer-Encoding: base64\r\n\r\n"+Convert.ToBase64String(File.ReadAllBytes(audio),Base64FormattingOptions.InsertLineBreaks)+"\r\n--"+boundary+"--\r\n");return mime.ToString();
        }
        public Task<GmailMessage> Reply(GmailMessage original,string text,string audio){return Request<GmailMessage>(HttpMethod.Post,"messages/send",new GmailSend {threadId=original.threadId,raw=Base64Url(Encoding.UTF8.GetBytes(MimeReply(original,text,audio)))});}
        public void Disconnect(){connectionGeneration++;SecretVault.Remove("google-token.bin");}
    }
}
