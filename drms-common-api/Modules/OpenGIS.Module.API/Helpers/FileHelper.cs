using HeyRed.Mime;
using MetadataExtractor;
using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.Models.Entities;
using RestSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using Newtonsoft.Json;
using System.Linq;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.API.Helpers
{
    public static class FileHelper
    {
        public static string APP_DATA = "AppData"; // AppDomain.CurrentDomain.GetData("APPBASE")?.ToString();
        public static string FILE_DIR = Path.Combine(APP_DATA, "files");

        static FileHelper()
        {
            if (System.IO.Directory.Exists(FILE_DIR) == false)
            {
                System.IO.Directory.CreateDirectory(FILE_DIR);
            }
        }

        public static IEnumerable<FeatureFile> saveFiles(string featureId, Layer layer, IFormFile[] files)
        {
            List<FeatureFile> filesSave = new List<FeatureFile>();
            foreach (IFormFile file in files)
            {
                string ext = MimeTypesMap.GetExtension(file.ContentType) ?? "unknow";
                string fileName = file.FileName; // $"{randomName()}.{ext}";

                var folderSave = Path.Combine(FILE_DIR, "feature", layer.id.ToString(), featureId.ToString());

                if (System.IO.Directory.Exists(folderSave) == false)
                {
                    System.IO.Directory.CreateDirectory(folderSave);
                }

                string filePath = Path.Combine(folderSave, fileName);
                //
                FeatureFile fileSave = new FeatureFile
                {
                    mime_type = file.ContentType,
                    size = file.Length,
                    file_name = fileName,
                    layer_id = layer.id,
                    feature_id = featureId,
                    extension = $".{ext}"
                };
                try
                {
                    using (FileStream fs = new FileStream(filePath, FileMode.OpenOrCreate, FileAccess.ReadWrite))
                    {
                        using (Stream s = file.OpenReadStream())
                        {
                            s.Seek(0, SeekOrigin.Begin);
                            s.CopyTo(fs);
                        }
                    }
                    //
                    filesSave.Add(fileSave);
                }
                catch
                {
                }
            }
            return filesSave;
        }

        public static IEnumerable<TableFiles> saveFiles(string featureId, TableInfo table, IFormFile[] files)
        {
            List<TableFiles> filesSave = new List<TableFiles>();
            foreach (IFormFile file in files)
            {
                string ext = MimeTypesMap.GetExtension(file.ContentType) ?? "unknow";
                string fileName = file.FileName; // $"{randomName()}.{ext}";

                var folderSave = Path.Combine(FILE_DIR, "table", table.id.ToString(), featureId.ToString());

                if (System.IO.Directory.Exists(folderSave) == false)
                {
                    System.IO.Directory.CreateDirectory(folderSave);
                }

                string filePath = Path.Combine(folderSave, fileName);
                //
                TableFiles fileSave = new TableFiles
                {
                    mime_type = file.ContentType,
                    size = file.Length,
                    file_name = fileName,
                    table_id = table.id,
                    feature_id = featureId,
                    extension = $".{ext}"
                };
                try
                {
                    using (FileStream fs = new FileStream(filePath, FileMode.OpenOrCreate, FileAccess.ReadWrite))
                    {
                        using (Stream s = file.OpenReadStream())
                        {
                            s.Seek(0, SeekOrigin.Begin);
                            s.CopyTo(fs);
                        }
                    }
                    //
                    filesSave.Add(fileSave);
                }
                catch
                {
                }
            }
            return filesSave;
        }

        public static async Task<string> PostFileAsync(IFormFile file, string fileName, string contentType)
        {

            using (var ms = new MemoryStream())
            {
                await file.CopyToAsync(ms);
                RestClient restClient = new RestClient(GlobalConfiguration.CDNUrl);
                var options = new RestClientOptions(GlobalConfiguration.CDNUrl)
                {
                    RemoteCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true
                };
                RestRequest restRequest = new RestRequest(GlobalConfiguration.CDNUrl + GlobalConfiguration.ImageUploadPath);
                restRequest.RequestFormat = DataFormat.Json;
                restRequest.Method = Method.Post;
                restRequest.AddHeader("Authorization", "Authorization");
                restRequest.AddHeader("Content-Type", "multipart/form-data");
                restRequest.AddFile("chunkContent", ms.ToArray(), fileName, contentType);
                var response = await restClient.PostAsync<RestData>(restRequest);
                return response.data?.ToString() ?? "";
            }
        }
        public static async Task<string> PostDocumentAsync(IFormFile file, string fileName, string contentType)
        {
            using (var ms = new MemoryStream())
            {
                await file.CopyToAsync(ms);
                RestClient restClient = new RestClient(GlobalConfiguration.CDNUrl);
                var options = new RestClientOptions(GlobalConfiguration.CDNUrl)
                {
                    RemoteCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true
                };
                RestRequest restRequest = new RestRequest(GlobalConfiguration.DocumentUploadPath);
                restRequest.RequestFormat = DataFormat.Json;
                restRequest.Method = Method.Post;
                restRequest.AddHeader("Authorization", "Authorization");
                restRequest.AddHeader("Content-Type", "multipart/form-data");
                restRequest.AddFile("chunkContent", ms.ToArray(), fileName, contentType);
                var response = await restClient.PostAsync<RestData<string[]>>(restRequest);
                var path = response?.data?.FirstOrDefault();
                return GlobalConfiguration.DocumentPath + "/" + path;
            }
        }


        // public static FeatureFile saveBase64(int objectId, Layer layer, string b64)
        // {
        //     DataImage image = fromBase64(b64);
        //     if (image == null)
        //         return null;
        //     if (image.RawData != null && image.RawData.Length > 0)
        //     {
        //         string ext = MimeTypesMap.GetExtension(image.MimeType) ?? "unknow";
        //         string imageName = $"{randomName()}.{ext}";
        //         string imagePath = Path.Combine(IMAGES_DIR, imageName);
        //         try
        //         {
        //             using (FileStream fs = new FileStream(imagePath, FileMode.OpenOrCreate, FileAccess.ReadWrite))
        //             {
        //                 using (MemoryStream ms = new MemoryStream(image.RawData))
        //                 {
        //                     ms.Seek(0, SeekOrigin.Begin);
        //                     ms.CopyTo(fs);
        //                 }
        //             }
        //         }
        //         catch
        //         {
        //             return null;
        //         }
        //         Image imageToSave = new Image();
        //         imageToSave.ContentType = image.MimeType;
        //         imageToSave.ImageName = imageName;
        //         imageToSave.ImageSize = image.RawData.Length;
        //         imageToSave.ObjectId = objectId;
        //         imageToSave.LayerId = layer.LayerId;
        //         imageToSave.ModuleId = layer.ModuleId;
        //         imageToSave.Extension = $".{ext}";
        //         return imageToSave;
        //     }
        //     return null;
        // }

        // public static Image getImage()
        // {
        //     return null;
        // }

        // public static DataImage fromBase64(string b64)
        // {
        //     if (string.IsNullOrWhiteSpace(b64))
        //         return null;
        //     DataImage image = DataImage.TryParse(b64);
        //     if (image == null)
        //         return null;
        //     return image;
        // }
        public static string randomName()
        {
            return $"{string.Format("{0}", DateTime.Now.Ticks.GetHashCode().ToString("x"))}_file";
        }
    }
}
