using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Runtime.Loader;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using System.Security.Claims;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;
using VietGIS.Infrastructure.Modules;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Web.ModelBinders;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.Extensions;
using VietGIS.Infrastructure.Identity.DbContexts;
using VietGIS.Infrastructure.Identity.Managers;
using VietGIS.Infrastructure.Identity.Implements;
using VietGIS.Infrastructure.Identity.Stores;
using VietGIS.Infrastructure.Identity.Services;
using System.ComponentModel;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.Razor;
using VietGIS.Infrastructure.Web;
using System.Text.Encodings.Web;
using System.Text.Unicode;
using Microsoft.Extensions.WebEncoders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Policies.Handlers;
using Microsoft.AspNetCore.DataProtection;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Swaggers.Implements;
using System.Text;
using OpenGIS.Web.Implements;
using EasyCaching.Core.Configurations;
using EasyCaching.Core;

namespace OpenGIS.Web.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddCustomizedMvc(this IServiceCollection services, IList<ModuleInfo> modules)
        {
            var mvcBuilder = services
                .AddMvc(o =>
                {
                    o.EnableEndpointRouting = false;
                    o.ModelBinderProviders.Insert(0, new InvariantDecimalModelBinderProvider());
                })
                .AddRazorRuntimeCompilation(options =>
                {
                    foreach (var module in modules.Where(x => x.IsBundledWithHost && x.Enabled))
                    {
                        string modulePath = Path.GetFullPath($"../Modules/{module.Id}/Backend");
                        if (Directory.Exists(modulePath))
                        {
                            options.FileProviders.Add(new PhysicalFileProvider(modulePath));
                        }
                    }
                })
                //.AddViewLocalization()
                //.AddModelBindingMessagesLocalizer(services)
                //.AddDataAnnotationsLocalization(o =>
                //{
                //    var factory = services.BuildServiceProvider().GetService<IStringLocalizerFactory>();
                //    var L = factory.Create(null);
                //    o.DataAnnotationLocalizerProvider = (t, f) => L;
                //})
                .AddNewtonsoftJson(options =>
                {
                    options.SerializerSettings.ContractResolver = new DefaultContractResolver();
                    options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
                    // options.SerializerSettings.TypeNameHandling = TypeNameHandling.Objects;
                    options.SerializerSettings.MetadataPropertyHandling = MetadataPropertyHandling.ReadAhead;
                    options.SerializerSettings.DateFormatHandling = DateFormatHandling.IsoDateFormat;
                    // options.SerializerSettings.SerializationBinder = new KnownTypesBinder() { KnownTypes = new List<Type>() { typeof(Layer) } };
                });

            foreach (var module in modules.Where(x => !x.IsBundledWithHost && x.Enabled))
            {
                AddApplicationPart(mvcBuilder, module.Assembly);
            }

            services.AddSwaggerGen(c =>
            {
                c.OperationFilter<AddRequiredHeaderParameter>();
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "API Documentation", Version = "v1" });
                c.CustomSchemaIds(x =>
                {
                    var attributes = x.GetCustomAttributes<DisplayNameAttribute>();
                    if (attributes != null && attributes.Count() > 0)
                    {
                        return attributes.FirstOrDefault()?.DisplayName ?? "";
                    }
                    else
                    {
                        return x.FullName;
                    }

                });
                foreach (var module in modules.Where(x => x.IsBundledWithHost && x.Enabled))
                {
                    var xmlFile = $"{module.Assembly.GetName().Name}.xml";
                    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                    if (File.Exists(xmlPath))
                    {
                        c.IncludeXmlComments(xmlPath);
                    }
                }
            });
            services.AddCors(p => p.AddPolicy("allowall", builder =>
            {
                builder.WithOrigins("*").AllowAnyMethod().AllowAnyHeader();
            }));
            services.Configure<FormOptions>(x =>
            {
                x.ValueLengthLimit = 524288000;
                x.MultipartBodyLengthLimit = 524288000; // In case of multipart
                x.MultipartHeadersLengthLimit = 524288000;
            });

            services.Configure<RazorViewEngineOptions>(
                options => { options.ViewLocationExpanders.Add(new ModuleViewLocationExpander()); });
            services.Configure<WebEncoderOptions>(options =>
            {
                options.TextEncoderSettings = new TextEncoderSettings(UnicodeRanges.All);
            });
            services.AddTransient<IRazorViewRenderer, RazorViewRenderer>();

            // foreach (var module in GlobalConfiguration.Modules)
            // {
            //     if (module.Enabled)
            //     {
            //         var moduleInitializerType = module.Assembly.GetTypes()
            //        .FirstOrDefault(t => typeof(IModuleInitializer).IsAssignableFrom(t));
            //         if ((moduleInitializerType != null) && (moduleInitializerType != typeof(IModuleInitializer)))
            //         {
            //             var moduleInitializer = Activator.CreateInstance(moduleInitializerType) as IModuleInitializer;
            //             if (moduleInitializer != null)
            //             {
            //                 services.AddSingleton(typeof(IModuleInitializer), moduleInitializer);
            //                 moduleInitializer.ConfigureServices(services);
            //             }
            //         }
            //     }
            // }

            return services;
        }

        private static void AddApplicationPart(IMvcBuilder mvcBuilder, Assembly assembly)
        {
            var partFactory = ApplicationPartFactory.GetApplicationPartFactory(assembly);
            foreach (var part in partFactory.GetApplicationParts(assembly))
            {
                mvcBuilder.PartManager.ApplicationParts.Add(part);
            }

            var relatedAssemblies = RelatedAssemblyAttribute.GetRelatedAssemblies(assembly, throwOnError: false);
            foreach (var relatedAssembly in relatedAssemblies)
            {
                partFactory = ApplicationPartFactory.GetApplicationPartFactory(relatedAssembly);
                foreach (var part in partFactory.GetApplicationParts(relatedAssembly))
                {
                    mvcBuilder.PartManager.ApplicationParts.Add(part);
                }
            }
        }

        public static IServiceCollection AddCustomizedIdentity(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDataProtection()
               .SetApplicationName(GlobalConfiguration.ApplicationName)
               .PersistKeysToFileSystem(new System.IO.DirectoryInfo(@"./SecretKeys"));


            services.Configure<CookiePolicyOptions>(options =>
            {
                options.CheckConsentNeeded = context => true;
                options.MinimumSameSitePolicy = SameSiteMode.Strict;
                options.HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always;
            });

            services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                options.SignIn.RequireConfirmedAccount = false;
                options.SignIn.RequireConfirmedEmail = false;
                options.SignIn.RequireConfirmedPhoneNumber = false;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders()
            .AddNumericTotpTokenProvider()
            .AddDapperStores();

            services.Configure<IdentityOptions>(options =>
            {
                // Password settings
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireDigit = true;

                // Lockout settings
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                // User settings
                options.User.RequireUniqueEmail = false;
            });

            services.ConfigureApplicationCookie(options =>
            {
                // Cookie settings
                options.ExpireTimeSpan = TimeSpan.FromMinutes(60 * 24);

                options.Cookie.SameSite = SameSiteMode.Strict;
                options.Cookie.Name = "opengis.cookie";
                options.Cookie.HttpOnly = true;

                options.LoginPath = "/account/login";
                options.AccessDeniedPath = "/Account/AccessDenied";

                options.SlidingExpiration = true;
            });

            services.AddScoped<AuditableSignInManager<ApplicationUser>, AuditableSignInManager<ApplicationUser>>();
            services.AddScoped<IGroupStore<ApplicationGroup>, GroupStore<ApplicationGroup, ApplicationDbContext>>();
            services.AddScoped<IUnitStore<ApplicationUnit>, UnitStore<ApplicationUnit, ApplicationDbContext, string, ApplicationUser>>();

            services.AddScoped<UserManager<ApplicationUser>, ApplicationUserManager>();
            // services.AddScoped<RoleManager<ApplicationRole>, CustomRoleManager>();
            services.AddScoped<UnitManager<ApplicationUnit>, ApplicationUnitManager>();
            services.AddScoped<GroupManager<ApplicationGroup>, ApplicationGroupManager>();

            services.AddScoped<IAuthorizationHandler, PermissionHandlers>();

            services.AddTransient<IEmailSender, EmailSender>();
            services.AddTransient<ISmsSender, SmsSender>();

            services.AddAuthentication(options =>
            {
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                // options.DefaultChallengeScheme = "oidc";
            })
            .AddJwtBearer(options =>
            {
                // options.Authority = configuration["Authentication:OIDC:Authority"];
                // options.RequireHttpsMetadata = false;
                // options.TokenValidationParameters = new TokenValidationParameters
                // {
                //     ValidateAudience = false,
                //     ValidateIssuer = false,
                //     ValidAudiences = new List<string>() { configuration["Authentication:OIDC:ApiName"] },
                // };
                // options.BackchannelHttpHandler = new HttpClientHandler
                // {
                //     ServerCertificateCustomValidationCallback =
                //               (message, certificate, chain, sslPolicyErrors) => true
                // };
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes("x81xvo6u6w862ycvd2tt1qe1fr62uvsd")),
                    ValidateIssuer = false,
                    ValidateAudience = false
                };
            })
            .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
            {
                options.Cookie.SameSite = SameSiteMode.Strict;
                options.Cookie.Name = "opengis.cookie";
                options.Cookie.HttpOnly = true;

                options.LoginPath = "/account/login";
                options.LogoutPath = "/account/logout";
                options.AccessDeniedPath = "/Account/AccessDenied";
            });

            services.AddOpenIddict()
                // Register the OpenIddict core components.
                .AddCore(options =>
                {
                    // Configure OpenIddict to use the Entity Framework Core stores and models.
                    // Note: call ReplaceDefaultEntities() to replace the default entities.
                    options.UseEntityFrameworkCore()
                        .UseDbContext<ApplicationDbContext>();
                })
                // Register the OpenIddict server components.
                .AddServer(options =>
                {
                    // Enable the token endpoint.
                    options.SetTokenEndpointUris("connect/token");

                    // Enable the client credentials flow.
                    options.AllowClientCredentialsFlow();

                    // Register the signing and encryption credentials.
                    options.AddDevelopmentEncryptionCertificate()
                        .AddDevelopmentSigningCertificate();

                    // Register the ASP.NET Core host and configure the ASP.NET Core options.
                    options.UseAspNetCore()
                        .DisableTransportSecurityRequirement()
                        .EnableTokenEndpointPassthrough();
                })
                // Register the OpenIddict validation components.
                .AddValidation(options =>
                {
                    // Import the configuration from the local OpenIddict server instance.
                    options.UseLocalServer();

                    // Register the ASP.NET Core host.
                    options.UseAspNetCore();
                });

            services.AddAuthorization(options =>
            {
                foreach (var module in GlobalConfiguration.Modules)
                {
                    if (module.Enabled)
                    {
                        var moduleFunctionType = module.Assembly.GetTypes()
                       .FirstOrDefault(t => typeof(IModuleFunction).IsAssignableFrom(t));
                        if (moduleFunctionType != null)
                        {
                            var fieldInfos = moduleFunctionType.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static).ToList();

                            foreach (FieldInfo? fieldInfo in fieldInfos)
                            {
                                if (fieldInfo != null)
                                {
                                    object? value = fieldInfo.GetValue(moduleFunctionType);
                                    if (value != null && value is IAuthorizationRequirement)
                                    {
                                        options.AddPolicy(fieldInfo.Name, p => p.AddRequirements((IAuthorizationRequirement)value));
                                    }
                                }
                            }
                        }
                    }
                }
            });

            services.AddHostedService<Worker>();

            return services;
        }

        public static IServiceCollection AddCustomizedDataStore(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"), options => options.MigrationsAssembly("VietGIS.Infrastructure.Identity.PostgreSQL"));
                options.UseOpenIddict();
            });
            return services;
        }

        public static IServiceCollection AddEasyCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddEasyCaching(options =>
            {
                //use memory cache that named default
                options.UseInMemory();

                // // use memory cache with your own configuration
                // options.UseInMemory(config => 
                // {
                //     config.DBConfig = new InMemoryCachingOptions
                //     {
                //         // scan time, default value is 60s
                //         ExpirationScanFrequency = 60, 
                //         // total count of cache items, default value is 10000
                //         SizeLimit = 100 
                //     };
                //     // the max random second will be added to cache's expiration, default value is 120
                //     config.MaxRdSecond = 120;
                //     // whether enable logging, default is false
                //     config.EnableLogging = false;
                //     // mutex key's alive time(ms), default is 5000
                //     config.LockMs = 5000;
                //     // when mutex key alive, it will sleep some time, default is 300
                //     config.SleepMs = 300;
                // }, "m2");

                //use redis cache that named redis1
                options.UseRedis(config =>
                {
                    config.DBConfig.Endpoints.Add(new ServerEndPoint(configuration.GetValue<string>("Hosts:Redis"), 6379));
                    config.SerializerName = "msgpack";
                }, "redis1")
                .WithJson("newtonSoft")
                // .WithSystemTextJson("sysjson")
                .WithMessagePack("msgpack");
                ;

            });

            services.AddEasyCachingResponseCaching(EasyCachingConstValue.DefaultInMemoryName);

            return services;
        }
    }
}