using System.Security.Claims;
using IdentityServer4.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using VietGIS.Infrastructure.Policies.Requirements;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;
using Dapper.FastCrud;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Web.Extensions
{
    public class DbPermissionHandler : AuthorizationHandler<BasePermission>
    {
        private IDbFactory _dbFactory;
        public DbPermissionHandler(IDbFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public override Task HandleAsync(AuthorizationHandlerContext context)
        {
            if (context.User == null)
            {
                return Task.CompletedTask;
            }

            var pendingRequirements = context.PendingRequirements.ToList();

            foreach (var requirement in pendingRequirements)
            {
                if (context.User?.IsInRole(EnumRoles.SA) == true)
                {
                    context.Succeed(requirement);
                }
                else if (requirement is DenyAnonymousAuthorizationRequirement)
                {
                    if (context.User != null && context.User?.Identity?.IsAuthenticated == true)
                    {
                        context.Succeed(requirement);
                    }
                }
                else if (requirement is ReadPermission)
                {
                    if (HasPermission(context.User, context.Resource, ((ReadPermission)requirement).value))
                    {
                        context.Succeed(requirement);
                    }
                }
                else if (requirement is EditPermission)
                {
                    if (HasPermission(context.User, context.Resource, ((EditPermission)requirement).value))
                    {
                        context.Succeed(requirement);
                    }
                }
                else if (requirement is DeletePermission)
                {
                    if (HasPermission(context.User, context.Resource, ((DeletePermission)requirement).value))
                    {
                        context.Succeed(requirement);
                    }
                }
                else if (requirement is ApprovePermission)
                {
                    if (HasPermission(context.User, context.Resource, ((ApprovePermission)requirement).value))
                    {
                        context.Succeed(requirement);
                    }
                }
            }

            return Task.CompletedTask;
        }

        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, BasePermission requirement)
        {
            var user = context.User;
            var resource = context.Resource;
            if (context.User.IsInRole(EnumRoles.SA))
            {
                context.Succeed(requirement);
            }
            else
            {
                var claim = context.User.FindFirst(x => x.Type == EnumClaimTypes.Permission && x.Value.Equals(requirement.value));
                if (claim != null)
                {
                    context.Succeed(requirement);
                }
            }
            return Task.CompletedTask;
        }

        private bool HasPermission(ClaimsPrincipal? user, object? resource, string value)
        {
            if (user == null)
            {
                return false;
            }
            using var session = _dbFactory.Create<INpgsqlSession>();
            return user.IsAuthenticated() && session.Get(new ApplicationUserPermission { UserId = user.Claims.FirstOrDefault(x => x.Type == "sub" || x.Type == ClaimTypes.NameIdentifier)?.Value ?? "", Permission = value }) != null;
        }
    }
}