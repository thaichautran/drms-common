using System.Data;
using System.Globalization;
using System.IO.Compression;
using System.Reflection;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using Dapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.ResponseCompression;
using Npgsql;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Web;
using OpenGIS.Web.Extensions;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Identity.DbContexts;
using VietGIS.Infrastructure.Identity.Initialize;
using VietGIS.Infrastructure.Modules;
using VietGIS.Infrastructure.Options;
using VietGIS.Infrastructure.Profiles;
using WebMarkupMin.AspNet.Common.UrlMatchers;
using Serilog;
using OpenGIS.Module.Core.Profiles;
using MaxRev.Gdal.Core;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Middlewares;
using Microsoft.AspNetCore.Builder;
using OpenGIS.Web.Implements;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;
using OpenGIS.Module.Core.Models.Entities;
using EasyCaching.ResponseCaching;
using OpenGIS.Module.API.Middlewares;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;
using VietGIS.Infrastructure.Policies.Handlers;
using WebMarkupMin.AspNetCoreLatest;

internal class Program
{
    private static void Main(string[] args)
    {
        // GdalBase.ConfigureAll();
        NpgsqlConnection.GlobalTypeMapper.UseNetTopologySuite();
        SqlMapper.AddTypeHandler(new GeometryTypeMapper());

        Dapper.FastCrud.OrmConfiguration.DefaultDialect = Dapper.FastCrud.SqlDialect.PostgreSql;
        var builder = WebApplication.CreateBuilder(args);

        ConfigurationManager configuration = builder.Configuration;
        configuration.AddEnvironmentVariables(prefix: "OPENGIS_");
        IWebHostEnvironment hostingEnvironment = builder.Environment;

        // Dapper configuration
        Dapper.FastCrud.OrmConfiguration.DefaultDialect = Dapper.FastCrud.SqlDialect.PostgreSql;
        // Global configuration
        GlobalConfiguration.WebRootPath = hostingEnvironment.WebRootPath;
        GlobalConfiguration.ContentRootPath = hostingEnvironment.ContentRootPath;
        GlobalConfiguration.CDNUrl = configuration.GetValue<string>("Hosts:CDN");
        GlobalConfiguration.ImagePath = configuration.GetValue<string>("Hosts:ImagePath");
        GlobalConfiguration.DocumentPath = configuration.GetValue<string>("Hosts:DocumentPath");
        GlobalConfiguration.ImageUploadPath = configuration.GetValue<string>("Hosts:ImageUploadPath");
        GlobalConfiguration.DocumentUploadPath = configuration.GetValue<string>("Hosts:DocumentUploadPath");
        GlobalConfiguration.CacheKeys = new List<string>();
        // Security concern
        builder.WebHost.ConfigureKestrel(option => option.AddServerHeader = false);
        builder.WebHost.UseIISIntegration();
        builder.Services.AddEasyCache(configuration);
        // Log configuration
        builder.Host.UseSerilog((ctx, c) => { c.ReadFrom.Configuration(configuration); });
        // Configuration Autofac - Do not modify
        builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());
        builder.Host.ConfigureContainer<ContainerBuilder>(builder => AutofacRegistrar.Register(builder));
        // AspNet Core Identity configuration - Do not modify
        builder.Services.AddSingleton<IConfiguration>(configuration);
        builder.Services.Configure<DatabaseOptions>(configuration.GetSection("ConnectionStrings"));
        builder.Services.Configure<EmailOptions>(configuration.GetSection("SMTP"));
        //builder.Services.Configure<HostsOptions>(configuration.GetSection("Hosts"));
        // Response compression - Do not modify
        builder.Services.AddResponseCompression(options =>
        {
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
        });
        builder.Services.Configure<GzipCompressionProviderOptions>(options =>
        {
            options.Level = CompressionLevel.Optimal;
        });
        builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
        {
            options.Level = CompressionLevel.Optimal;
        });
        builder.Services.AddWebMarkupMin(
        options =>
        {
            options.AllowMinificationInDevelopmentEnvironment = true;
            options.AllowCompressionInDevelopmentEnvironment = true;
        })
        .AddHtmlMinification(options =>
        {
            options.MinificationSettings.RemoveRedundantAttributes = true;
            options.MinificationSettings.RemoveHttpProtocolFromAttributes = true;
            options.MinificationSettings.RemoveHttpsProtocolFromAttributes = true;

            options.ExcludedPages = new List<IUrlMatcher>
            {
                new RegexUrlMatcher(@"/signin"),
                new RegexUrlMatcher(@"/signout"),
                new RegexUrlMatcher(@"/connect"),
                new RegexUrlMatcher(@"/connect/authorize")
            };
        }).AddHttpCompression();
        // Configuration memory cache
        builder.Services.AddMemoryCache();
        // Configuration httpclient - Do not modify
        builder.Services.AddHttpClient();
        builder.Services.AddHttpContextAccessor();
        // Configuration XSRF-Token
        builder.Services.AddAntiforgery(options =>
        {
            options.HeaderName = "x-xsrf-token";
            options.Cookie.Name = "xsrf.token";
        });
        // Site configuratio - Do not modify - Do not change order
        builder.Services.AddModules();
        builder.Services.AddCustomizedDataStore(configuration);
        builder.Services.AddCustomizedIdentity(configuration);
        builder.Services.AddCustomizedMvc(GlobalConfiguration.Modules);
        builder.Services.AddDatabasePermissionHandler();
        // Custom site Authorization
        builder.Services.AddScoped<IAuthorizationHandler, OpenGIS.Web.Extensions.DbPermissionHandler>();
        builder.Services.AddScoped<ServiceFactory>(p => p.GetService);
        builder.Services.AddScoped<IMediator, Mediator>();
        // Auto mapper configuration
        BaseMapperConfig.Configure();
        builder.Services.AddAutoMapper(typeof(IdentityMapperProfile), typeof(CoreMapperProfile));
        // Module Configuration
        foreach (var module in GlobalConfiguration.Modules)
        {
            var moduleInitializerType = module.Assembly.GetTypes()
               .FirstOrDefault(t => typeof(IModuleInitializer).IsAssignableFrom(t));
            if ((moduleInitializerType != null) && (moduleInitializerType != typeof(IModuleInitializer)))
            {
                IModuleInitializer? moduleInitializer = Activator.CreateInstance(moduleInitializerType) as IModuleInitializer;
                if (moduleInitializer != null)
                {
                    builder.Services.AddSingleton(typeof(IModuleInitializer), moduleInitializer);
                    moduleInitializer.ConfigureServices(builder.Services);
                }
            }
        }
        // Mixed configuration - Add here
        // Begin host configuration
        var app = builder.Build();
        CultureInfo.CurrentCulture = new CultureInfo("en-US");
        CultureInfo.DefaultThreadCurrentCulture = new CultureInfo("en-US");
        CultureInfo.DefaultThreadCurrentUICulture = new CultureInfo("en-US");
        // Culture configuration
        // CultureInfo.CurrentCulture = new CultureInfo("vi-VN");
        // CultureInfo.DefaultThreadCurrentCulture = new CultureInfo("vi-VN");
        // CultureInfo.DefaultThreadCurrentUICulture = new CultureInfo("vi-VN");
        app.UseEasyCachingResponseCaching();
        /* Using response compression, uncomment to use */
        app.UseResponseCompression();
        /* Using web markupmin, ucomment to use */
        app.UseWebMarkupMin();

        /* Error page configuration - Do not modify */
        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
            app.UseWhen(
               context => !context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase),
               a => a.UseStatusCodePagesWithReExecute("/core/home/error-with-code/{0}")
            );
        }
        else
        {
            app.UseWhen(
               context => !context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase),
               a => a.UseStatusCodePagesWithReExecute("/core/home/error-with-code/{0}")
            );
            // app.UseWhen(
            //    context => !context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase),
            //    a => a.UseExceptionHandler("/Home/Error")
            // );
            app.UseHsts();
        }
        app.UseSwagger();
        app.UseSwaggerUI();
        // Configuration static files
        app.UseCustomizedStaticFiles(app.Environment, configuration);
        // Modules configuration - Do not modify
        var moduleInitializers = app.Services.GetServices<IModuleInitializer>();
        foreach (var moduleInitializer in moduleInitializers)
        {
            moduleInitializer.Configure(app, app.Environment);
        }
        // app.UseHttpsRedirection();
        app.UseRouting();
        app.UseCookiePolicy();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseCors("allowall");
        //
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        DatabaseInitializer.Initialize(app, context);

        app.Map("/_upload/images", svc => svc.UseMiddleware<ImageUploadMiddleware>());
        app.Map("/_upload/documents", svc => svc.UseMiddleware<DocumentUploadMiddleware>());
        app.Map("/_images", app => app.UseMiddleware<ImageServeMiddleware>());
        app.Map("/_documents", app => app.UseMiddleware<DocumentServeMiddleware>());
        app.Map(
            "/api/files/feature",
            appBranch =>
            {
                appBranch.UseFileHandler();
            });
        app.Map("/files", b => b.UseMiddleware<HSQMiddleware>());

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllerRoute(
                name: "areas",
                pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");
            endpoints.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");
            endpoints.MapSwagger();
        });

        app.Run();
    }
}
