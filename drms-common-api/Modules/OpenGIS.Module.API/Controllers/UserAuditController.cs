using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using System;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.Managers;
using Microsoft.AspNetCore.Identity;
using AutoMapper;
using OpenGIS.Module.Core.Models.DTO;
using System.Collections.Generic;
using Dapper;
using OpenGIS.Module.Core.ViewModels;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/user-audit")]
    public class UserAuditController : BaseController
    {
        protected readonly ApplicationUserManager _userManager;
        protected readonly IMapper _mapper;
        public UserAuditController(IDbFactory dbFactory,
            UserManager<ApplicationUser> userManager, IMapper mapper) : base(dbFactory)
        {
            _userManager = (ApplicationUserManager)userManager;
            _mapper = mapper;
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] UserAuditListDxDTO @params)
        {
            using (var session = OpenSession())
            {
                var condition = "1=1";
                if (!string.IsNullOrWhiteSpace(@params.user_id))
                {
                    condition += $" AND {Sql.Entity<ApplicationUserAudit>(x => x.UserId):TC} = @user_id";
                }
                if (@params.start_date.HasValue)
                {
                    @params.start_date = @params.start_date.Value.ToUniversalTime();
                    condition += $" AND DATE({Sql.Entity<ApplicationUserAudit>(x => x.Timestamp):TC}) >= @start_date";
                }
                if (@params.end_date.HasValue)
                {
                    @params.end_date = @params.end_date.Value.ToUniversalTime();
                    condition += $" AND DATE({Sql.Entity<ApplicationUserAudit>(x => x.Timestamp):TC}) <= @end_date";
                }
                if (@params.audit_event != 0)
                {
                    condition += $" AND {Sql.Entity<ApplicationUserAudit>(x => x.AuditEvent):TC} = @audit_event";
                }
                if (!string.IsNullOrWhiteSpace(@params.user_id))
                {
                    condition += $" AND {Sql.Entity<ApplicationUserAudit>(x => x.UserId):TC} = @user_id";
                }
                List<ApplicationUserAudit> data = session.Find<ApplicationUserAudit>(statement => statement
                    .Include<ApplicationUser>(x => x.InnerJoin())
                    .Where($"{condition}")
                    .WithParameters(@params)
                    .OrderBy($"{Sql.Entity<ApplicationUserAudit>(x => x.Timestamp):TC} DESC")
                    .Skip(@params.skip)
                    .Top(@params.take)
                ).ToList();
                var totalCount = session.Count<ApplicationUserAudit>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@params)
                );
                return new RestPagedDataTable
                {
                    data = _mapper.Map<List<ApplicationUserAudit.View>>(data),
                    recordsTotal = totalCount
                };
            }
        }

        [HttpPost("countGroupByUser")]
        public async Task<RestBase> countByUser([FromForm] UserAuditListDxDTO @params)
        {
            using (var session = OpenSession())
            {
                var sql = @$"SELECT COUNT(1) AS count, {Sql.Entity<ApplicationUserAudit>(x => x.UserId):TC} AS id, {Sql.Entity<ApplicationUser>(x => x.UserName)} AS key 
                            FROM {Sql.Entity<ApplicationUserAudit>():T} 
                            LEFT JOIN {Sql.Entity<ApplicationUser>():T} ON {Sql.Entity<ApplicationUserAudit>(x => x.UserId):TC} = {Sql.Entity<ApplicationUser>(x => x.Id):TC}
                            GROUP BY {Sql.Entity<ApplicationUserAudit>(x => x.UserId):TC}, {Sql.Entity<ApplicationUser>(x => x.UserName)} ";
                return new RestData
                {
                    data = session.Query<UserGroupByViewModel>(sql).ToList()
                };
            }
        }
    }
}
