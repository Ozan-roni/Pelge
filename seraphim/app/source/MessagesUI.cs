using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace SeraphimLuxury
{
    partial class MainWindow
    {
        readonly GmailClient gmail=new GmailClient();List<GmailMessage> inbox=new List<GmailMessage>();string nextMailPage;bool mailBusy,voiceRecording;DateTime voiceBegan;string voiceFile;
        [DllImport("winmm.dll",CharSet=CharSet.Unicode)] static extern int mciSendString(string command,StringBuilder response,int length,IntPtr callback);
        public void ShowAccount()
        {
            LocalAccount account;try{account=AccountSession.Load(AccountSession.FilePath);}catch(Exception ex){Error(ex);return;}
            CancelOverlay();shell.IsEnabled=false;shell.Effect=new BlurEffect {Radius=7};overlay.Background=Visuals.Brush("#C7090B0F");overlay.Visibility=Visibility.Visible;
            var panel=new StackPanel {Width=410};panel.Children.Add(Visuals.Eyebrow("VOTRE PROFIL  /  SUR CE PC"));var title=Visuals.TextBlock(AccountSession.SignedIn?"Bonjour, "+AccountSession.Name+".":account==null?"Votre espace personnel.":"Retrouver votre espace.",28,Visuals.Text,true);title.Margin=new Thickness(0,14,0,14);panel.Children.Add(title);
            if(AccountSession.SignedIn){panel.Children.Add(Visuals.Button("Choisir ma photo de profil",ImportAvatar));panel.Children.Add(Visuals.TextBlock("Profil local connecté. Gmail reste une connexion séparée, autorisée par Google.",12,Visuals.Muted));var logout=Visuals.Button("Me déconnecter du profil local",delegate {AccountSession.SignedIn=false;AccountSession.Name=null;RefreshProfile();inbox.Clear();CancelOverlay();ShowPage("Messages");});logout.Margin=new Thickness(0,22,0,0);panel.Children.Add(logout);}
            else {
                panel.Children.Add(Visuals.TextBlock("Ce profil reste sur votre PC. Aucun mot de passe Gmail n'est demandé.",12,Visuals.Muted));var name=new TextBox {Text=account==null?"":account.Name,MaxLength=60,Margin=new Thickness(0,20,0,14),FontSize=14};panel.Children.Add(name);
                panel.Children.Add(Visuals.TextBlock(account==null?"Choisissez un mot de passe · 10 caractères minimum":"Votre mot de passe local",11,Visuals.Muted));var password=new PasswordBox {Padding=new Thickness(12),Background=Visuals.Brush("#111317"),Foreground=Visuals.Text,BorderBrush=Visuals.Line,FontSize=15,Margin=new Thickness(0,9,0,12),MaxLength=256};panel.Children.Add(password);
                PasswordBox confirm=null;if(account==null){panel.Children.Add(Visuals.TextBlock("Confirmer le mot de passe",11,Visuals.Muted));confirm=new PasswordBox {Padding=new Thickness(12),Background=Visuals.Brush("#111317"),Foreground=Visuals.Text,BorderBrush=Visuals.Line,FontSize=15,Margin=new Thickness(0,9,0,12),MaxLength=256};panel.Children.Add(confirm);}
                var error=Visuals.TextBlock("",11,Visuals.Gold);error.Margin=new Thickness(0,0,0,14);panel.Children.Add(error);Button login=null;
                login=Visuals.Button(account==null?"Créer mon profil local":"Me connecter",async delegate {
                    string secret=password.Password,user=name.Text.Trim();if(confirm!=null&&confirm.Password!=secret){error.Text="Les deux mots de passe doivent correspondre.";return;}login.IsEnabled=false;
                    try {LocalAccount loaded=account;if(loaded==null)loaded=await Task.Run(()=>AccountSession.Create(user,secret,AccountSession.FilePath));else {bool valid=await Task.Run(()=>AccountSession.Verify(loaded,secret));if(!valid||user!=loaded.Name){error.Text="Nom ou mot de passe incorrect.";return;}}
                        AccountSession.SignedIn=true;AccountSession.Name=loaded.Name;RefreshProfile();password.Clear();if(confirm!=null)confirm.Clear();CancelOverlay();ShowPage("Messages");
                    }catch(Exception ex){error.Text=ex.Message;}finally{login.IsEnabled=true;}
                },true);panel.Children.Add(login);
            }
            var close=Visuals.Button("Revenir",CancelOverlay);close.Margin=new Thickness(0,10,0,0);panel.Children.Add(close);var card=Visuals.Card(panel,new Thickness(30));card.HorizontalAlignment=HorizontalAlignment.Center;card.VerticalAlignment=VerticalAlignment.Center;overlay.Children.Add(card);
        }
        void BuildMessages()
        {
            TitleSection("MESSAGES  /  SANS FIL D'ACTUALITÉ","Vos échanges, simplement.","Une boîte de réception sobre. Pas de recommandations, pas de défilement infini. Gmail et un enregistreur de vocaux pour commencer.");
            var account=Visuals.TextBlock(AccountSession.SignedIn?"●  Profil local : "+AccountSession.Name:"○  Visiteur · profil local à connecter",12,Visuals.Gold);account.Margin=new Thickness(0,0,0,16);page.Children.Add(account);
            var actions=new WrapPanel();var login=Visuals.Button(AccountSession.SignedIn?"Mon profil":"Connexion au profil local",ShowAccount);login.Margin=new Thickness(0,0,8,8);actions.Children.Add(login);
            var setup=Visuals.Button("Ajouter les identifiants Google OAuth",delegate {
                if(!AccountSession.SignedIn){ShowAccount();return;}var file=new Microsoft.Win32.OpenFileDialog {Filter="Identifiants Google (*.json)|*.json",Title="Choisir le client OAuth de type Application de bureau"};if(file.ShowDialog(this)!=true)return;
                try{gmail.Configure(file.FileName);SetFootnote("Client Google enregistré et chiffré sur ce PC. Vous pouvez maintenant connecter Gmail.");ShowPage("Messages");}catch(Exception ex){Error(ex);}
            });setup.Margin=new Thickness(0,0,8,8);actions.Children.Add(setup);
            var connect=Visuals.Button(gmail.Connected?"Actualiser Gmail":"Connecter Gmail",async delegate {
                if(!AccountSession.SignedIn){ShowAccount();return;}if(mailBusy)return;
                if(!gmail.Configured){SetFootnote("À votre retour : fournissez un client OAuth Google de type Bureau. Aucun compte n'est relié actuellement.");return;}
                mailBusy=true;try{if(!gmail.Connected)await gmail.Connect();var result=await gmail.Inbox();if(!AccountSession.SignedIn)return;inbox=(result.messages??new GmailMessage[0]).ToList();nextMailPage=result.nextPageToken;ShowPage("Messages");}catch(Exception ex){Error(ex);}finally{mailBusy=false;}
            },true);connect.Margin=new Thickness(0,0,8,8);actions.Children.Add(connect);page.Children.Add(actions);
            var grid=new Grid {Margin=new Thickness(0,16,0,0)};grid.ColumnDefinitions.Add(new ColumnDefinition {Width=new GridLength(1.6,GridUnitType.Star)});grid.ColumnDefinitions.Add(new ColumnDefinition());
            var list=new StackPanel();list.Children.Add(Visuals.Eyebrow(gmail.Connected?"GMAIL  /  BOÎTE DE RÉCEPTION":"APERÇU  /  DONNÉES FICTIVES"));
            if(inbox.Count==0){
                var empty=Visuals.TextBlock(gmail.Connected?"Actualisez pour charger vos messages.":"Aucun compte Gmail connecté.\nLes trois lignes ci-dessous illustrent l'interface.",12,Visuals.Muted);empty.Margin=new Thickness(0,14,0,18);list.Children.Add(empty);
                foreach(var label in new[]{"Équipe projet · Retour sur la scène", "Organisation · Les objectifs de la journée", "Discussion · Un échange sans distractions"}){var example=Visuals.TextBlock(label,13);var card=Visuals.Card(example,new Thickness(15));card.Margin=new Thickness(0,0,0,10);list.Children.Add(card);}
            }else foreach(var message in inbox){var item=message;var button=Visuals.Button(message.Header("From")+"\n"+message.Header("Subject"),async delegate {if(mailBusy)return;mailBusy=true;try{var full=await gmail.Read(item.id);ShowMail(full);}catch(Exception ex){Error(ex);}finally{mailBusy=false;}});button.HorizontalContentAlignment=HorizontalAlignment.Left;button.Margin=new Thickness(0,12,0,0);list.Children.Add(button);}
            if(nextMailPage!=null){var more=Visuals.Button("Charger 20 autres messages",async delegate {if(mailBusy)return;mailBusy=true;try{var result=await gmail.Inbox(nextMailPage);if(!AccountSession.SignedIn)return;inbox.AddRange(result.messages??new GmailMessage[0]);nextMailPage=result.nextPageToken;ShowPage("Messages");}catch(Exception ex){Error(ex);}finally{mailBusy=false;}});more.Margin=new Thickness(0,15,0,0);list.Children.Add(more);}
            var left=Visuals.Card(list,new Thickness(25));left.Margin=new Thickness(0,0,16,0);grid.Children.Add(left);
            var voice=new StackPanel();voice.Children.Add(Visuals.Eyebrow("UN VOCAL  /  VOTRE VOIX"));var vt=Visuals.TextBlock(voiceRecording?"Enregistrement en cours…":"Une voix, sans le réseau.",24,Visuals.Text,true);vt.Margin=new Thickness(0,16,0,18);voice.Children.Add(vt);
            voice.Children.Add(Visuals.TextBlock("Le micro ne démarre qu'avec ce bouton. Le vocal est enregistré localement en WAV, jusqu'à trois minutes. Vous pourrez le joindre à une réponse Gmail.\n\nLes messageries des autres réseaux restent à choisir et à connecter avec leurs API autorisées.",12,Visuals.Muted));
            var record=Visuals.Button(voiceRecording?"Arrêter et enregistrer":"Enregistrer un vocal",delegate {try{if(voiceRecording)StopVoice();else StartVoice();ShowPage("Messages");}catch(Exception ex){Error(ex);}},true);record.Margin=new Thickness(0,21,0,10);voice.Children.Add(record);
            if(voiceFile!=null&&File.Exists(voiceFile)){voice.Children.Add(Visuals.TextBlock("Vocal prêt · "+System.IO.Path.GetFileName(voiceFile),11,Visuals.Gold));voice.Children.Add(Visuals.Button("Ouvrir le dossier des vocaux   ↗",delegate {System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(System.IO.Path.GetDirectoryName(voiceFile)){UseShellExecute=true});}));}
            if(gmail.Connected){var disconnect=Visuals.Button("Déconnecter Gmail de ce PC",delegate {gmail.Disconnect();inbox.Clear();ShowPage("Messages");});disconnect.Margin=new Thickness(0,18,0,0);voice.Children.Add(disconnect);}
            var right=Visuals.Card(voice,new Thickness(25));Grid.SetColumn(right,1);grid.Children.Add(right);page.Children.Add(grid);
        }
        void ShowMail(GmailMessage message)
        {
            if(!AccountSession.SignedIn)return;
            CancelOverlay();shell.IsEnabled=false;shell.Effect=new BlurEffect {Radius=7};overlay.Background=Visuals.Brush("#C7090B0F");overlay.Visibility=Visibility.Visible;
            var panel=new StackPanel {Width=630};panel.Children.Add(Visuals.Eyebrow(message.Header("From")));var title=Visuals.TextBlock(message.Header("Subject"),24,Visuals.Text,true);title.Margin=new Thickness(0,12,0,14);panel.Children.Add(title);
            string text=GmailClient.PlainText(message.payload);if(text.Length==0)text=message.snippet??"Message sans texte simple.";if(text.Length>16000)text=text.Substring(0,16000)+"\n[…]";
            var content=new ScrollViewer {Content=Visuals.TextBlock(text,12,Visuals.Muted),MaxHeight=180,VerticalScrollBarVisibility=ScrollBarVisibility.Auto,Margin=new Thickness(0,0,0,20)};panel.Children.Add(content);
            var reply=new TextBox {AcceptsReturn=true,TextWrapping=TextWrapping.Wrap,Height=110,MaxLength=10000,VerticalScrollBarVisibility=ScrollBarVisibility.Auto};panel.Children.Add(reply);
            var audio=new CheckBox {Content="Joindre mon dernier vocal WAV",IsEnabled=voiceFile!=null&&File.Exists(voiceFile),Style=(Style)Application.Current.Resources["StepCheck"],Margin=new Thickness(0,14,0,14)};panel.Children.Add(audio);var status=Visuals.TextBlock("",11,Visuals.Gold);panel.Children.Add(status);Button send=null;
            send=Visuals.Button("Envoyer cette réponse",async delegate {
                if(reply.Text.Trim().Length==0&&audio.IsChecked!=true){status.Text="Écrivez une réponse ou joignez un vocal.";return;}send.IsEnabled=false;
                try{await gmail.Reply(message,reply.Text,audio.IsChecked==true?voiceFile:null);CancelOverlay();SetFootnote("Réponse envoyée via Gmail.");}catch(Exception ex){status.Text=ex.Message;}finally{send.IsEnabled=true;}
            },true);send.Margin=new Thickness(0,14,0,0);panel.Children.Add(send);var back=Visuals.Button("Annuler",CancelOverlay);back.Margin=new Thickness(0,10,0,0);panel.Children.Add(back);
            var card=Visuals.Card(panel,new Thickness(30));card.HorizontalAlignment=HorizontalAlignment.Center;var scroll=new ScrollViewer {Content=card,VerticalScrollBarVisibility=ScrollBarVisibility.Auto,MaxHeight=Math.Max(450,ActualHeight-40),VerticalAlignment=VerticalAlignment.Center};overlay.Children.Add(scroll);
        }
        void StartVoice()
        {
            string folder=System.IO.Path.Combine(AccountSession.Root,"Vocaux");Directory.CreateDirectory(folder);voiceFile=System.IO.Path.Combine(folder,"vocal-"+DateTime.Now.ToString("yyyyMMdd-HHmmss")+".wav");
            int code=mciSendString("open new type waveaudio alias seraphimVoice",null,0,IntPtr.Zero);if(code!=0)throw new IOException("Le microphone n'a pas pu être ouvert. Vérifiez son accès dans Windows.");
            code=mciSendString("record seraphimVoice",null,0,IntPtr.Zero);if(code!=0){mciSendString("close seraphimVoice",null,0,IntPtr.Zero);throw new IOException("L'enregistrement n'a pas pu démarrer.");}voiceRecording=true;voiceBegan=DateTime.UtcNow;
        }
        void StopVoice()
        {
            if(!voiceRecording)return;voiceRecording=false;mciSendString("stop seraphimVoice",null,0,IntPtr.Zero);int saved=mciSendString("save seraphimVoice \""+voiceFile+"\"",null,0,IntPtr.Zero);mciSendString("close seraphimVoice",null,0,IntPtr.Zero);if(saved!=0){voiceFile=null;SetFootnote("Windows n'a pas pu enregistrer le vocal.");}
        }
    }
}
