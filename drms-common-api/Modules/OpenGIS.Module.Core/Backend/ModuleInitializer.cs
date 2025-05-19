using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using VietGIS.Infrastructure.Modules;
using VietGIS.Infrastructure;
using OpenGIS.Module.Core.Profiles;
using OpenGIS.Module.Core.Middlewares;
using OpenGIS.Module.Core.Extensions;

namespace OpenGIS.Module.Core
{
    public class ModuleInitializer : IModuleInitializer
    {
        public void ConfigureServices(IServiceCollection services)
        {
            GlobalConfiguration.RegisterWebpackModule("OpenGIS.Module.Core");
            services.AddScoped<IWorkContext, WorkContext>();

            services.AddAutoMapper(typeof(CoreMapperProfile));
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // app.UseMiddleware(typeof(WebOptionMiddleware));
            app.UseMiddleware(typeof(AccessLogMiddleware));
        }
    }
}
