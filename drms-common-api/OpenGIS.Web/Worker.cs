using Dapper.FastCrud;
using Microsoft.EntityFrameworkCore;
using OpenGIS.Module.Core.Models.Entities;
using OpenIddict.Abstractions;
using VietGIS.Infrastructure.Identity.DbContexts;
using VietGIS.Infrastructure.Identity.Initialize;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace OpenGIS.Web
{
    public class Worker : IHostedService
    {
        private readonly IServiceProvider _serviceProvider;

        public Worker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            await using var scope = _serviceProvider.CreateAsyncScope();

            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            IDbFactory dbFactory = scope.ServiceProvider.GetRequiredService<IDbFactory>();

            using var session = dbFactory.Create<INpgsqlSession>();

            VietGIS.Infrastructure.GlobalConfiguration.ApplicationName = session.Get(new WebOption { option_name = "site_name" })?.option_value ?? "";
            VietGIS.Infrastructure.GlobalConfiguration.ApplicationLogo = session.Get(new WebOption { option_name = "site_logo" })?.option_value ?? "";
            VietGIS.Infrastructure.GlobalConfiguration.ApplicationDescription = session.Get(new WebOption { option_name = "site_description" })?.option_value ?? "";

            var manager = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();

            if (await manager.FindByClientIdAsync("service-worker") == null)
            {
                await manager.CreateAsync(new OpenIddictApplicationDescriptor
                {
                    ClientId = "service-worker",
                    ClientSecret = "388D45FA-B36B-4988-BA59-B187D329C207",
                    Permissions =
                {
                    Permissions.Endpoints.Token,
                    Permissions.GrantTypes.ClientCredentials
                }
                });
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}

