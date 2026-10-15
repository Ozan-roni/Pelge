using System;using System.Runtime.InteropServices;using System.Windows;using System.Windows.Interop;using System.Windows.Media.Imaging;
namespace SeraphimLuxury {
 static class ShellImage14 {
  [StructLayout(LayoutKind.Sequential)] struct ImageSize {public int Width,Height;}
  [ComImport,Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IImageFactory {[PreserveSig]int GetImage(ImageSize size,int flags,out IntPtr bitmap);}
  [DllImport("shell32.dll",CharSet=CharSet.Unicode,PreserveSig=true)] static extern int SHCreateItemFromParsingName(string name,IntPtr binding,ref Guid iid,[MarshalAs(UnmanagedType.Interface)]out IImageFactory item);
  [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr handle);
  public static BitmapSource Read(string target){IImageFactory factory=null;IntPtr bitmap=IntPtr.Zero;try{string name=target;var id=new Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b");int hr=SHCreateItemFromParsingName(name,IntPtr.Zero,ref id,out factory);if(hr!=0)return null;hr=factory.GetImage(new ImageSize{Width=128,Height=128},0,out bitmap);if(hr!=0||bitmap==IntPtr.Zero)return null;var image=Imaging.CreateBitmapSourceFromHBitmap(bitmap,IntPtr.Zero,Int32Rect.Empty,BitmapSizeOptions.FromEmptyOptions());image.Freeze();return image;}catch{return null;}finally{if(bitmap!=IntPtr.Zero)DeleteObject(bitmap);if(factory!=null)Marshal.ReleaseComObject(factory);}}
 }
}
