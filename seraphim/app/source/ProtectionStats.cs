using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;

namespace SeraphimLuxury
{
    [DataContract] public class FilterDay
    {
        [DataMember] public string Day;
        [DataMember] public int Shorts,Adults,Ads,Malicious,ProtectedSeconds;
    }
    partial class MainWindow
    {
        readonly HashSet<string> metricEvents=new HashSet<string>();
        internal bool CountFiltered(BridgeRequest request)
        {
            if(!Session.Active||!preferences.Premium||request.session!=webSession||request.count<1||request.count>100||String.IsNullOrEmpty(request.id)||request.id.Length>100)return false;
            if(request.kind!="shorts"&&request.kind!="adult"&&request.kind!="ads")return false;
            if(request.kind=="shorts"&&!preferences.HideShortVideos||request.kind=="ads"&&!preferences.HideAds||request.kind=="adult"&&!preferences.AdultFilter)return false;
            if(metricEvents.Contains(request.id)||metricEvents.Count>=10000)return false;
            string day=DateTime.Today.ToString("yyyy-MM-dd");var entry=preferences.FilterHistory.FirstOrDefault(d=>d.Day==day);bool created=entry==null;if(created){entry=new FilterDay {Day=day};preferences.FilterHistory.Add(entry);}
            if(request.kind=="shorts")entry.Shorts+=request.count;else if(request.kind=="ads")entry.Ads+=request.count;else entry.Adults+=request.count;
            if(!SavePreferences()){if(request.kind=="shorts")entry.Shorts-=request.count;else if(request.kind=="ads")entry.Ads-=request.count;else entry.Adults-=request.count;if(created)preferences.FilterHistory.Remove(entry);return false;}
            metricEvents.Add(request.id);RefreshStudioStats();return true;
        }
        internal int HiddenCount(string kind){return preferences.FilterHistory.Sum(d=>kind=="shorts"?d.Shorts:kind=="ads"?d.Ads:kind=="malicious"?d.Malicious:d.Adults);}
        internal void RememberVpnCity(string cityId)
        {
            preferences.RecentVpnCities.Remove(cityId);preferences.RecentVpnCities.Insert(0,cityId);if(preferences.RecentVpnCities.Count>6)preferences.RecentVpnCities.RemoveRange(6,preferences.RecentVpnCities.Count-6);
        }
    }
}
