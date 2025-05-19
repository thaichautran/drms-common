using HeyRed.Mime;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace OpenGIS.Module.API.Middlewares
{
    public class HSQMiddleware
    {
        private IWebHostEnvironment _env;
        private readonly RequestDelegate _next;
        private String _cacheFolder;

        private readonly ILogger<HSQMiddleware> _logger;

        public HSQMiddleware(IWebHostEnvironment env, RequestDelegate next, ILogger<HSQMiddleware> logger)
        {
            _env = env;
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            List<string> paths = context.Request.Path.Value.Split("/").Where(x => string.IsNullOrWhiteSpace(x) == false).ToList();
            if ("GET".Equals(context.Request.Method) && paths.Count > 0)
            {
                string filePath = Path.Combine(_env.ContentRootPath, "AppData", Path.Combine(paths.ToArray()));
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
        }
    }
}
