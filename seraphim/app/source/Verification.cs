using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;

namespace SeraphimLuxury
{
    static class Verification
    {
        static void Assert(bool condition,string text){if(!condition)throw new Exception(text);}
        public static void PlanningTests()
        {
            var prefs=Preferences.Defaults();var day=Planning.Get(prefs,new DateTime(2026,10,7));
            var session=new SessionState(3);var app=new AppEntry {Work=true,Protected=false};
            Assert(Planning.CanLaunch(session,app,day),"En veille, les applications Travail restent libres.");session.Activate();
            Assert(!Planning.CanLaunch(session,app,day),"Un planning vide doit demander une préparation.");
            day.Tasks.Add(new PlanTask {Id="one",Title="Scène",Time="14:00"});day.Tasks.Add(new PlanTask {Id="two",Title="Script",Time="16:00"});
            day.Tasks[0].Done=true;Assert(!Planning.CanLaunch(session,app,day),"Une checklist partielle ne suffit pas.");day.Tasks[1].Done=true;Assert(Planning.CanLaunch(session,app,day),"Les applications Travail sont libérées par le planning complet.");
            day.Tasks[0].Done=false;Assert(!Planning.CanLaunch(session,app,day),"Décocher reverrouille les prochaines ouvertures.");
            Assert(!Planning.Get(prefs,new DateTime(2026,10,8)).Complete,"Le jour suivant est indépendant.");
            Assert(Planning.ValidTime("23:59")&&!Planning.ValidTime("24:00")&&!Planning.ValidTime("9:7"),"Les échéances doivent être valides.");
            var sent=new Dictionary<string,DateTime>();var now=new DateTime(2026,10,7,13,50,0);var reminders=Planning.Reminders(day,now,sent);
            Assert(reminders.Count==1&&reminders[0].Kind=="Bientôt","Rappel dix minutes avant.");sent[reminders[0].Key]=now;
            Assert(Planning.Reminders(day,now.AddMinutes(1),sent).Count==0,"Un rappel anticipé ne doit pas se répéter.");
            now=new DateTime(2026,10,7,14,0,0);reminders=Planning.Reminders(day,now,sent);Assert(reminders.Count==1&&reminders[0].Kind=="C’est le moment","Rappel à l'échéance.");sent[reminders[0].Key]=now;
            Assert(Planning.Reminders(day,now.AddMinutes(14),sent).Count==0&&Planning.Reminders(day,now.AddMinutes(15),sent).Count==1,"Répétition à quinze minutes.");
            day.Tasks[0].Done=true;Assert(Planning.Reminders(day,now.AddMinutes(16),sent).Count==0,"Les tâches terminées n'ont plus de rappels.");
        }
        static Process Worker(string exe,string marker)
        {return Process.Start(new ProcessStartInfo(exe,"\""+marker+"\""){UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden});}
        public static int GuardParent(string[] args)
        {
            var prefs=Preferences.Defaults();prefs.Apps=new List<AppEntry> {new AppEntry {Id="test",Name="Test",Target=args[1],Work=true}};
            var guard=new WorkGuard(prefs,delegate{return false;},delegate{},delegate(string s){throw new Exception(s);});guard.Activate();
            var process=Worker(args[1],args[2]);Thread.Sleep(200);guard.Tick();if(guard.HeldCount!=1)return 3;
            File.WriteAllText(args[3],process.Id.ToString());while(true)Thread.Sleep(1000);
        }
        public static int GuardTests(string directory)
        {
            Directory.CreateDirectory(directory);string worker=Path.Combine(directory,"SeraphimTestWorker.exe");string report=Path.Combine(directory,"guard-test.txt");
            var processes=new List<Process>();WorkGuard guard=null;
            try {
                Assert(File.Exists(worker),"L'exécutable de test doit être compilé.");
                var prefs=Preferences.Defaults();var entry=new AppEntry {Id="test",Name="Test",Target=worker,Work=true};prefs.Apps=new List<AppEntry> {entry};
                bool allowed=false;int blocked=0;guard=new WorkGuard(prefs,delegate{return allowed;},delegate{blocked++;},delegate(string message){throw new Exception(message);});
                string existingMarker=Path.Combine(directory,"existing.release");var existing=Worker(worker,existingMarker);processes.Add(existing);Thread.Sleep(200);guard.Activate();
                string marker=Path.Combine(directory,"held.release");var held=Worker(worker,marker);processes.Add(held);Thread.Sleep(200);guard.Tick();
                Assert(blocked==1&&guard.HeldCount==1,"Seule la nouvelle ouverture doit être mise en attente.");File.WriteAllText(existingMarker,"");Assert(existing.WaitForExit(3000),"Une application déjà ouverte doit rester utilisable.");
                File.WriteAllText(marker,"");Thread.Sleep(400);Assert(!held.HasExited,"L'ouverture verrouillée doit réellement être en pause.");
                allowed=true;guard.Tick();Assert(held.WaitForExit(3000)&&guard.HeldCount==0,"Le planning complet doit reprendre le processus.");allowed=false;
                marker=Path.Combine(directory,"emergency.release");held=Worker(worker,marker);processes.Add(held);Thread.Sleep(200);guard.Tick();Assert(guard.HeldCount==1,"Une nouvelle ouverture doit être contrôlée.");guard.Release(entry);File.WriteAllText(marker,"");Assert(held.WaitForExit(3000),"Urgence doit reprendre l'ouverture.");
                marker=Path.Combine(directory,"permit.release");guard.AllowNext(entry);held=Worker(worker,marker);processes.Add(held);Thread.Sleep(200);guard.Tick();Assert(guard.HeldCount==0,"Urgence depuis Seraphim doit laisser passer une ouverture.");File.WriteAllText(marker,"");Assert(held.WaitForExit(3000),"L'ouverture d'urgence doit rester exécutable.");
                marker=Path.Combine(directory,"deactivate.release");held=Worker(worker,marker);processes.Add(held);Thread.Sleep(200);guard.Tick();Assert(guard.HeldCount==1,"Test de désactivation en attente.");guard.Dispose();File.WriteAllText(marker,"");Assert(held.WaitForExit(3000),"Désactiver doit reprendre les ouvertures.");
                string crashMarker=Path.Combine(directory,"crash.release"),pidFile=Path.Combine(directory,"parent-pid.txt");
                var parent=Process.Start(new ProcessStartInfo(System.Reflection.Assembly.GetExecutingAssembly().Location,"--guard-parent \""+worker+"\" \""+crashMarker+"\" \""+pidFile+"\""){UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden});processes.Add(parent);
                for(int i=0;i<60&&!File.Exists(pidFile)&&!parent.HasExited;i++)Thread.Sleep(100);
                Assert(File.Exists(pidFile),"Le parent de test doit avoir mis son ouverture en pause.");var orphan=Process.GetProcessById(Int32.Parse(File.ReadAllText(pidFile)));processes.Add(orphan);
                File.WriteAllText(crashMarker,"");Thread.Sleep(400);Assert(!orphan.HasExited,"L'ouverture de test est en attente avant l'arrêt du parent.");
                parent.Kill();parent.WaitForExit(3000);Assert(orphan.WaitForExit(5000),"Le gardien doit reprendre l'ouverture si Seraphim est interrompu.");
                File.WriteAllText(report,"PASS : planning quotidien, rappels, application déjà ouverte libre, pause réelle d'une nouvelle ouverture Windows, validation, urgence, autorisation ponctuelle, désactivation et reprise après arrêt brutal du parent.\r\n");return 0;
            }catch(Exception ex){File.WriteAllText(report,"FAIL : "+ex);return 1;}
            finally {if(guard!=null)guard.Dispose();foreach(var process in processes){try{if(!process.HasExited)process.Kill();}catch{}process.Dispose();}}
        }
    }
}
