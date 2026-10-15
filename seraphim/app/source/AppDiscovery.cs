using System;using System.IO;using System.Linq;using System.Windows.Controls;using Microsoft.Win32;
namespace SeraphimLuxury { partial class MainWindow {
 void DiscoverSocialApplications()
 {
  int added=0;
  foreach(var hive in new[]{Registry.CurrentUser,Registry.LocalMachine})foreach(string keyPath in new[]{@"Software\Microsoft\Windows\CurrentVersion\Uninstall",@"Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"}){
   try {using(var uninstall=hive.OpenSubKey(keyPath)){if(uninstall==null)continue;foreach(string id in uninstall.GetSubKeyNames())using(var key=uninstall.OpenSubKey(id)){
    if(key==null)continue;string name=key.GetValue("DisplayName") as string;
    if(name==null||!new[]{"Instagram","Snapchat","Discord","TikTok","Telegram","WhatsApp","Spotify","Messenger","Twitch"}.Any(n=>name.Equals(n,StringComparison.OrdinalIgnoreCase)||name.StartsWith(n+" ",StringComparison.OrdinalIgnoreCase)))continue;
    string icon=key.GetValue("DisplayIcon") as string;if(String.IsNullOrEmpty(icon))continue;icon=Environment.ExpandEnvironmentVariables(icon.Trim());if(icon.StartsWith("\"")){int end=icon.IndexOf('"',1);if(end>1)icon=icon.Substring(1,end-1);}else {int comma=icon.LastIndexOf(',');if(comma>0)icon=icon.Substring(0,comma);}
    if(!File.Exists(icon)||!Path.GetExtension(icon).Equals(".exe",StringComparison.OrdinalIgnoreCase)||!new[]{"Instagram","Snapchat","Discord","DiscordPTB","DiscordCanary","TikTok","Telegram","WhatsApp","Spotify","Messenger","Twitch"}.Contains(Path.GetFileNameWithoutExtension(icon),StringComparer.OrdinalIgnoreCase)||preferences.Apps.Any(a=>String.Equals(a.Target,icon,StringComparison.OrdinalIgnoreCase))||preferences.Apps.Count>=50)continue;
    preferences.Apps.Add(new AppEntry {Id="native-social-"+Guid.NewGuid().ToString("N"),Name=name,Target=Path.GetFullPath(icon),Social=true,Glyph="\uE774"});added++;
   }}}
   catch { }
  }
  if(added>0){SavePreferences();guard.Baseline();}ShowPage("Applications");SetFootnote(added+" logiciel(s) social(aux) ajouté(s). Les versions Microsoft Store / PWA peuvent nécessiter un ajout manuel ou le compagnon Web.");
 }
}}
