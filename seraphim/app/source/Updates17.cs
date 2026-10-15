using System;using System.IO;using System.Diagnostics;
namespace SeraphimLuxury {
 partial class MainWindow {
  void OpenUpdates17(bool quiet){string helper=Path.Combine(Art.Root,"Mises-a-jour.exe");if(!File.Exists(helper))return;if(quiet){string installed=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Programs","Seraphim");if(!String.Equals(Path.GetFullPath(Art.Root).TrimEnd(Path.DirectorySeparatorChar),installed,StringComparison.OrdinalIgnoreCase)||!File.Exists(Path.Combine(Art.Root,"installation-seraphim.txt")))return;}try{Process.Start(new ProcessStartInfo(helper,quiet?"--quiet":""){UseShellExecute=false,CreateNoWindow=true});}catch(Exception ex){if(!quiet)SetFootnote(ex.Message);}}
  void PrepareUpdate17(){string installed=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Programs","Seraphim");if(!String.Equals(Path.GetFullPath(Art.Root).TrimEnd(Path.DirectorySeparatorChar),installed,StringComparison.OrdinalIgnoreCase))return;Deactivate();exiting=true;Close();}
 }
}
