using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using VietGIS.Infrastructure.Modules;
using VietGIS.Infrastructure;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Http;
using System.IO;
using OpenGIS.Module.API.Middlewares;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using OpenGIS.Module.API.Services;

namespace OpenGIS.Module.API
{
    public class ModuleInitializer : IModuleInitializer
    {
        public void ConfigureServices(IServiceCollection services)
        {
            GlobalConfiguration.RegisterWebpackModule("OpenGIS.Module.API");
            services.AddTransient<IRouteService, RouteService>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // app.UseMiddleware(typeof(ErrorHandlingMiddleware));
        }
    }
}
