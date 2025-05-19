using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using VietGIS.Infrastructure.Modules;
using VietGIS.Infrastructure;

namespace OpenGIS.Module.DRMS
{
    public class ModuleInitializer : IModuleInitializer
    {
        public void ConfigureServices(IServiceCollection services)
        {
            GlobalConfiguration.RegisterWebpackModule("OpenGIS.Module.DRMS");
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
        }
    }
}
