using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;
using OpenGIS.Module.API.Helpers;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Middlewares
{
    public class FileHandleMiddleware
    {
        private RequestDelegate _next;
        private IWebHostEnvironment _env;
        private IDbFactory _dbFactory;
        private string NO_IMAGE = Path.Combine(FileHelper.APP_DATA, "no-image.png");
        private readonly ILogger<FileHandleMiddleware> _logger;

        // Must have constructor with this signature, otherwise exception at run time
        public FileHandleMiddleware(RequestDelegate next,
            IDbFactory dbFactory,
            IWebHostEnvironment env, ILogger<FileHandleMiddleware> logger)
        {
            _next = next;
            _dbFactory = dbFactory;
            _env = env;
            _logger = logger;
        }

        public async System.Threading.Tasks.Task Invoke(HttpContext context)
        {
            List<string> paths = context.Request.Path.Value.Split("/").Where(x => string.IsNullOrWhiteSpace(x) == false).ToList();
            if ("GET".Equals(context.Request.Method) && paths.Count > 0)
            {
                string filePath = Path.Combine(_env.ContentRootPath, "AppData", "files", "feature", Path.Combine(paths.ToArray()));
                if (File.Exists(filePath))
                {
                    _logger.LogInformation($"Request file: {filePath} - Exist");
                    await context.Response.SendFileAsync(filePath);

                    // byte[] buffer = System.IO.File.ReadAllBytes(filePath);
                    // if (buffer != null)
                    // {
                    //     context.Response.ContentType = MimeTypesMap.GetMimeType(fi.Name);
                    //     context.Response.ContentLength = fi.Length;
                    //     await context.Response.BodyWriter.WriteAsync(buffer);
                    // }
                    // else
                    // {
                    //     context.Response.StatusCode = ((int)HttpStatusCode.NotFound);
                    // }
                }
                else
                {
                    _logger.LogInformation($"Request file: {filePath} - Not exist");
                    context.Response.StatusCode = ((int)HttpStatusCode.NotFound);
                }
            }
            else
            {
                await _next(context);
            }
            // string file = context.Request.Path.Value;
            // if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            // {
            //     file = file?.Replace("/", "\\");
            // }
            // if (file.StartsWith("\\")) { file = file.Substring(1); }

            // if (string.IsNullOrWhiteSpace(file) == false)
            // {
            //     string filePath = Path.Combine(_env.ContentRootPath, FileHelper.FILE_DIR, "feature", file);
            //     if (System.IO.File.Exists(filePath))
            //     {
            //         await returnFile(file, filePath, context);
            //     }
            //     else
            //     {
            //         // if (File.Exists(NO_IMAGE))
            //         //     await returnNoImage(NO_IMAGE, context);
            //         // else
            //         context.Response.StatusCode = (int)HttpStatusCode.NotFound;
            //     }
            // }
            // await _next.Invoke(context);
        }

        private async Task returnFile(string file, string filePath, HttpContext context)
        {
            using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read))
            {
                byte[] buffer = new byte[fs.Length];
                fs.Read(buffer, 0, buffer.Length);
                //
                var accept = context.Request.Headers[HeaderNames.AcceptEncoding];
                if (!string.IsNullOrWhiteSpace(accept))
                {
                    context.Response.Headers.Append(HeaderNames.Vary, HeaderNames.AcceptEncoding);
                }
                FeatureFile imageDb = null;
                using (var con = _dbFactory.Create<INpgsqlSession>())
                {
                    imageDb = con.Query<FeatureFile>($"SELECT * FROM {Sql.Entity<FeatureFile>():T} WHERE LOWER({nameof(FeatureFile.file_name)})=N'{file.ToLower()}'").FirstOrDefault();
                }
                //
                MediaTypeHeaderValue mediaType = new MediaTypeHeaderValue((imageDb == null || string.IsNullOrWhiteSpace(imageDb.mime_type)) ? "file/unknow" : imageDb.mime_type);
                mediaType.Encoding = System.Text.Encoding.UTF8;
                context.Response.ContentType = mediaType.ToString();
                //
                context.Response.Headers.Append("Cache-Control", "max-age=2592000");
                context.Response.ContentType = mediaType.ToString();
                context.Response.ContentLength = buffer.Length;
                //
                await context.Response.Body.WriteAsync(buffer, 0, buffer.Length);
                await context.Response.Body.FlushAsync();
            }
        }

        private async Task returnNoImage(string imagePath, HttpContext context)
        {
            using (FileStream fs = new FileStream(imagePath, FileMode.Open, FileAccess.Read))
            {
                byte[] buffer = new byte[fs.Length];
                fs.Read(buffer, 0, buffer.Length);
                //
                var accept = context.Request.Headers[HeaderNames.AcceptEncoding];
                if (!string.IsNullOrWhiteSpace(accept))
                {
                    context.Response.Headers.Append(HeaderNames.Vary, HeaderNames.AcceptEncoding);
                }
                Microsoft.Net.Http.Headers.MediaTypeHeaderValue mediaType = new Microsoft.Net.Http.Headers.MediaTypeHeaderValue("image/png");
                mediaType.Encoding = System.Text.Encoding.UTF8;
                context.Response.ContentType = mediaType.ToString();
                //
                context.Response.Headers.Append("Cache-Control", "max-age=2592000");
                context.Response.ContentType = mediaType.ToString();
                context.Response.ContentLength = buffer.Length;
                //
                await context.Response.Body.WriteAsync(buffer, 0, buffer.Length);
                await context.Response.Body.FlushAsync();
            }
        }
    }

    public static class FileHandlerExtension
    {
        public static IApplicationBuilder UseFileHandler(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<FileHandleMiddleware>();
        }
    }

}