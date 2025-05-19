using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models;
using VietGIS.Infrastructure.Models.DTO.Response;
using System.Linq;
using System;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Identity.Entities;
using Microsoft.AspNetCore.Identity;
using VietGIS.Infrastructure.Identity.Managers;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models.Entities;
using Dapper;
using System.Collections.Generic;

namespace OpenGIS.Module.API.Controllers
{
    public class HomeController : BaseController
    {
        protected readonly ApplicationUserManager _userManager;
        public HomeController(IDbFactory dbFactory, UserManager<ApplicationUser> userManager) : base(dbFactory)
        {
            _userManager = (ApplicationUserManager)userManager;
        }

        [HttpGet("api/[controller]/items")]
        public async Task<RestBase> getitemsAsync([FromQuery] int? id)
        {
            using (var session = OpenSession())
            {
                var condition = @$"{Sql.Entity<HomeItem>(x => x.visible):TC} = TRUE AND {Sql.Entity<HomeItem>(x => x.parent_id):TC} = @parent_id";
                var paramQuery = new Dictionary<string, object>();
                paramQuery.Add("parent_id", id.HasValue ? id.Value : 0);
                if (User.IsInRole(EnumRoles.SA) == false)
                {
                    var user = await _userManager.FindByIdAsync(getUserId());
                    var user_permissions = (session.Find<ApplicationUserPermission>(stm => stm
                        .Where($"{Sql.Entity<ApplicationUserPermission>(x => x.UserId):TC} = @Id")
                        .WithParameters(user)
                    )).ToList();

                    // if (User.IsInRole(EnumRoles.ADMINISTRATOR))
                    // {
                    //     if (user_permissions != null && user_permissions.Count() > 0)
                    //     {
                    //         var permissions = user_permissions.Select(x => x.Permission).ToArray();
                    //         paramQuery.Add("permissions", permissions);
                    //         condition += @$" AND ({Sql.Entity<HomeItem>(x => x.url):TC} LIKE '%system%' 
                    //             OR split_part({Sql.Entity<HomeItem>(x => x.url):TC}, '/', 2) = ANY(@permissions))";
                    //     }
                    // }
                    // else
                    // {
                    //     if (user_permissions != null && user_permissions.Count() > 0)
                    //     {
                    //         var permissions = user_permissions.Select(x => x.Permission).ToArray();
                    //         paramQuery.Add("permissions", permissions);
                    //         condition += @$" AND split_part({Sql.Entity<HomeItem>(x => x.url):TC}, '/', 2) = ANY(@permissions)";
                    //     }
                    // }
                    if (user_permissions != null && user_permissions.Count() > 0)
                    {
                        var permissions = user_permissions.Select(x => x.Permission).ToArray();
                        paramQuery.Add("permissions", permissions);
                        condition += @$" AND {Sql.Entity<HomeItem>(x => x.permission):TC} = ANY(@permissions)";
                    }
                }

                var data = session.Find<HomeItem>(statement => statement
                    .Where($"{condition}")
                    .WithParameters(paramQuery)
                    .OrderBy($"{Sql.Entity<HomeItem>(x => x.order):TC}, {Sql.Entity<HomeItem>(x => x.name):TC}")
                ).ToList();

                return new RestData
                {
                    data = data
                };
            }
        }

    }
}