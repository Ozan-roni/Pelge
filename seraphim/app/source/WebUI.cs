using System;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace SeraphimLuxury
{
    partial class MainWindow
    {
        public TextBox PassageInput;public Button PassageConfirm;public Passage CurrentPassage;
        public readonly System.Collections.Generic.List<CheckBox> WebOptionChecks=new System.Collections.Generic.List<CheckBox>();
        void ShowPassage(string reason,Action complete)
        {
            CancelOverlay();shell.IsEnabled=false;shell.Effect=new BlurEffect {Radius=8};overlay.Background=Visuals.Brush("#C7090B0F");overlay.Visibility=Visibility.Visible;
            CurrentPassage=WebPolicy.Select();var verse=CurrentPassage;
            var panel=new StackPanel {Width=595};panel.Children.Add(Visuals.Eyebrow("UN INSTANT DE PRÉSENCE"));var title=Visuals.TextBlock(reason,28,Visuals.Text,true);title.Margin=new Thickness(0,13,0,12);panel.Children.Add(title);
            panel.Children.Add(Visuals.TextBlock("Recopiez le passage entièrement, puis appuyez sur Entrée.\nPrenez votre temps : ce moment n'est pas une course.",12,Visuals.Muted));
            int oldLength=0;var quote=Visuals.TextBlock("",24,Visuals.Text,true);quote.LineHeight=35;quote.Margin=new Thickness(0,26,0,12);panel.Children.Add(quote);
            var reference=Visuals.TextBlock(verse.Reference,11,Visuals.Gold);reference.Margin=new Thickness(0,0,0,23);panel.Children.Add(reference);
            PassageInput=new TextBox {MaxLength=verse.Text.Length+20,FontSize=16,TextWrapping=TextWrapping.Wrap,Height=95,AcceptsReturn=false,ContextMenu=null,AllowDrop=false};panel.Children.Add(PassageInput);
            DataObject.AddPastingHandler(PassageInput,delegate(object sender,DataObjectPastingEventArgs e){e.CancelCommand();});PassageInput.CommandBindings.Add(new CommandBinding(ApplicationCommands.Paste,delegate(object sender,ExecutedRoutedEventArgs e){e.Handled=true;},delegate(object sender,CanExecuteRoutedEventArgs e){e.CanExecute=false;e.Handled=true;}));
            var status=Visuals.TextBlock("",11,Visuals.Muted);status.Margin=new Thickness(0,13,0,20);panel.Children.Add(status);
            PassageConfirm=Visuals.Button("Confirmer mon intention   ↵",delegate {if(!WebPolicy.Matches(PassageInput.Text,verse.Text))return;CancelOverlay();complete();},true);panel.Children.Add(PassageConfirm);
            Action update=delegate {
                string expected=WebPolicy.Normalize(verse.Text),actual=WebPolicy.Normalize(PassageInput.Text);int correct=0;quote.Inlines.Clear();
                for(int i=0;i<verse.Text.Length;i++){bool typed=i<actual.Length;bool good=typed&&i<expected.Length&&actual[i]==expected[i];if(good)correct++;var brush=new SolidColorBrush(good?((SolidColorBrush)Visuals.Gold).Color:typed?Color.FromRgb(207,109,128):((SolidColorBrush)Visuals.Muted).Color);if(good&&i==actual.Length-1&&actual.Length>oldLength&&!preferences.ReducedMotion)brush.BeginAnimation(SolidColorBrush.ColorProperty,new System.Windows.Media.Animation.ColorAnimation(Colors.White,brush.Color,TimeSpan.FromMilliseconds(350)));quote.Inlines.Add(new Run(verse.Text[i].ToString()){Foreground=brush});}
                oldLength=actual.Length;PassageConfirm.IsEnabled=WebPolicy.Matches(PassageInput.Text,verse.Text);status.Text=PassageConfirm.IsEnabled?"Phrase complète · Entrée pour continuer":correct+" caractères reconnus · collage désactivé";
            };PassageInput.TextChanged+=delegate {update();};PassageInput.PreviewKeyDown+=delegate(object sender,KeyEventArgs e){if(e.Key==Key.Enter){e.Handled=true;if(PassageConfirm.IsEnabled)PassageConfirm.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));}};update();
            var cancel=Visuals.Button("Revenir",CancelOverlay);cancel.Margin=new Thickness(0,10,0,0);panel.Children.Add(cancel);
            var card=Visuals.Card(panel,new Thickness(32));card.HorizontalAlignment=HorizontalAlignment.Center;card.VerticalAlignment=VerticalAlignment.Center;overlay.Children.Add(card);PassageInput.Focus();if(!testing&&!preferences.ReducedMotion)Visuals.Fade(overlay,0,1,260);
        }
        void BuildWeb(){BuildWebStudio14();}
        void SaveSocialDomains(System.Collections.Generic.List<string> list)
        {
            Action save=delegate {preferences.SocialDomains=list;SavePreferences();ShowPage("Web");SetFootnote("Domaines enregistrés. Chrome reçoit la nouvelle liste.");};
            if(Session.Active&&preferences.SocialPassage&&preferences.SocialDomains.Any(d=>!list.Contains(d)))ShowPassage("Avant de retirer ces réseaux de la protection.",save);else save();
        }
        void SetWebOption(int setting,bool value){if(setting==0)preferences.SocialPassage=value;else if(setting==1)preferences.AdultFilter=value;else if(setting==2)preferences.QuietFeeds=value;else if(setting==3)preferences.HideShortVideos=value;else preferences.HideAds=value;SavePreferences();}
    }
}
