using System;
using System.IO;
using System.Runtime.Serialization;
using System.Security.Cryptography;
using System.Text;

namespace SeraphimLuxury
{
    [DataContract] class LocalAccount
    {
        [DataMember] public string Name;
        [DataMember] public string Avatar;
        [DataMember] public string Salt;
        [DataMember] public string Hash;
        [DataMember] public int Iterations;
    }
    static class AccountSession
    {
        public static bool SignedIn;public static string Name;
        public static string Root {get{return System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Seraphim");}}
        public static string FilePath {get{return System.IO.Path.Combine(Root,"account.json");}}
        public static LocalAccount Load(string path){return File.Exists(path)?Json.Read<LocalAccount>(File.ReadAllText(path)):null;}
        public static LocalAccount Create(string name,string password,string path)
        {
            if(String.IsNullOrWhiteSpace(name)||name.Length>60||password.Length<10||password.Length>256)throw new ArgumentException("Indiquez un nom et un mot de passe d'au moins 10 caractères.");
            if(File.Exists(path))throw new IOException("Un profil local existe déjà.");
            byte[] salt=new byte[32];using(var random=RandomNumberGenerator.Create())random.GetBytes(salt);byte[] hash;
            using(var pbkdf=new Rfc2898DeriveBytes(password,salt,600000,HashAlgorithmName.SHA256))hash=pbkdf.GetBytes(32);
            var account=new LocalAccount {Name=name.Trim(),Salt=Convert.ToBase64String(salt),Hash=Convert.ToBase64String(hash),Iterations=600000};Directory.CreateDirectory(System.IO.Path.GetDirectoryName(path));File.WriteAllText(path,Json.Write(account),Encoding.UTF8);return account;
        }
        public static bool Verify(LocalAccount account,string password)
        {
            if(account==null||password.Length>256||account.Iterations<600000||account.Iterations>1200000)return false;
            byte[] expected=Convert.FromBase64String(account.Hash),actual;using(var pbkdf=new Rfc2898DeriveBytes(password,Convert.FromBase64String(account.Salt),account.Iterations,HashAlgorithmName.SHA256))actual=pbkdf.GetBytes(32);
            int difference=expected.Length^actual.Length;for(int i=0;i<Math.Min(expected.Length,actual.Length);i++)difference|=expected[i]^actual[i];return difference==0;
        }
    }
    static class SecretVault
    {
        static readonly byte[] purpose=Encoding.UTF8.GetBytes("Seraphim.Gmail.v1");
        public static void Save<T>(string name,T value){Directory.CreateDirectory(AccountSession.Root);byte[] encrypted=ProtectedData.Protect(Encoding.UTF8.GetBytes(Json.Write(value)),purpose,DataProtectionScope.CurrentUser);File.WriteAllBytes(System.IO.Path.Combine(AccountSession.Root,name),encrypted);}
        public static T Load<T>(string name) where T:class {string path=System.IO.Path.Combine(AccountSession.Root,name);if(!File.Exists(path))return null;return Json.Read<T>(Encoding.UTF8.GetString(ProtectedData.Unprotect(File.ReadAllBytes(path),purpose,DataProtectionScope.CurrentUser)));}
        public static void Remove(string name){string path=System.IO.Path.Combine(AccountSession.Root,name);if(File.Exists(path))File.Delete(path);}
    }
}
