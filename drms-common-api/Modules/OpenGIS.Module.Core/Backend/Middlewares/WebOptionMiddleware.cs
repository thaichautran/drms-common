using System;
using System.Net;
using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.Core.Middlewares
{
    public class WebOptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IDbFactory _dbFactory;
        public WebOptionMiddleware(RequestDelegate next, IDbFactory dbFactory)
        {
            _next = next;
            _dbFactory = dbFactory;
        }

        public async Task Invoke(HttpContext context /* other dependencies */)
        {
            using var session = _dbFactory.Create<INpgsqlSession>();

            VietGIS.Infrastructure.GlobalConfiguration.ApplicationName = session.Get(new WebOption { option_name = "site_name" })?.option_value ?? "";
            VietGIS.Infrastructure.GlobalConfiguration.ApplicationLogo = session.Get(new WebOption { option_name = "site_logo" })?.option_value ?? "";
            VietGIS.Infrastructure.GlobalConfiguration.ApplicationDescription = session.Get(new WebOption { option_name = "site_description" })?.option_value ?? "";

            session.Close();

            await _next.Invoke(context);
        }
    }
}