using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using OpenGIS.Module.Core.Extensions;
using OpenGIS.Module.Core.Models;
using System;
using System.Threading.Tasks;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.Core.Middlewares
{
    public class AccessLogMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IDbFactory _dbFactory;
        private readonly IWorkContext _workContext;

        public AccessLogMiddleware(RequestDelegate next, IDbFactory dbFactory, IWorkContext workContext)
        {
            _next = next;
            _dbFactory = dbFactory;
            _workContext = workContext;
        }

        public Task Invoke(HttpContext context)
        {
            var userId = _workContext.GetCurrentUserId();
            if (string.IsNullOrEmpty(System.IO.Path.GetExtension(context.Request.Path)))
            {
                var user = context.User;
                if (user != null && user?.Identity?.IsAuthenticated == true)
                {

                    var ip = context?.Connection?.RemoteIpAddress?.ToString();
                    var userAgent = context?.Request.Headers["User-Agent"].ToString();

                    var requestPath = context?.Request?.Path.Value ?? "";
                    var controller = requestPath.Substring(requestPath.LastIndexOf('/') + 1);
                    using var session = _dbFactory.Create<INpgsqlSession>();

                    // session.Insert(new UserAccessLog
                    // {
                    //     user_name = user.Identity?.Name,
                    //     timestamp = DateTime.Now,
                    //     ip_address = ip,
                    //     user_agent = userAgent,
                    //     url = requestPath,
                    //     method = context?.Request.Method,
                    // });
                }
            }

            return _next(context);
        }
    }
}