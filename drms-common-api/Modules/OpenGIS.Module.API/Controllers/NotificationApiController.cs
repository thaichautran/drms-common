using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.DevExtreme;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/notification")]
    public class NotificationApiController : BaseApiCRUDController<INpgsqlSession, UserNotification, int>
    {
        public NotificationApiController(IDbFactory dbFactory, IMapper mapper, IRepository<UserNotification, int> repository)
            : base(dbFactory, mapper, repository)
        {
        }
        [HttpPost("data-grid")]
        public RestBase DataGrid([FromBody] NotificationParams dto)
        {
            if (dto == null)
            {
                return new RestError((int)HttpStatusCode.BadRequest, "Vui lòng kiểm tra lại tham số");
            }
            using var session = OpenSession();
            var condition = "1=1 ";
            if (string.IsNullOrWhiteSpace(dto.searchValue) == false)
            {
                condition += $" AND {Sql.Entity<UserNotification>():T}.search_content @@ to_tsquery(@keyword)";
            }
            if (string.IsNullOrWhiteSpace(dto.user_id) == false)
            {
                condition += $" AND {Sql.Entity<UserNotification>(x => x.user_id):T} = @user_id";
            }
            if (string.IsNullOrWhiteSpace(dto.devices_token) == false)
            {
                condition += $" AND {Sql.Entity<UserNotification>(x => x.device_received):T} = @devices_token";
            }
            if (dto.from.HasValue)
            {
                condition += $" AND {Sql.Entity<UserNotification>(x => x.sent_at):TC} >= @from";
            }
            if (dto.to.HasValue)
            {
                condition += $" AND {Sql.Entity<UserNotification>(x => x.sent_at):TC} <= @to";
            }
            List<UserNotification> data = new List<UserNotification>();
            var withParameters = new
            {
                keyword = dto.searchValue?.ToFullTextString(),
                dto.user_id,
                dto.from,
                dto.to,
                dto.devices_token,
            };
            if (dto.take > 0)
            {
                data = session.Find<UserNotification>(statement => statement.Where($"{condition}")
                    .WithParameters(withParameters)
                    .OrderBy($"{Sql.Entity<UserNotification>(x => x.sent_at):TC} DESC")
                    .Skip(dto.skip)
                    .Top(dto.take)
                ).ToList();
            }
            else
            {
                data = session.Find<UserNotification>(statement => statement.Where($"{condition}")
                    .WithParameters(withParameters)
                    .OrderBy($"{Sql.Entity<UserNotification>(x => x.sent_at):TC} DESC")
                ).ToList();
            }

            return new RestPagedDataTable()
            {
                data = data,
                recordsTotal = session.Count<UserNotification>(statement => statement
                    .Where($"{condition}")
                    .WithParameters(withParameters)
                )
            };
        }
    }
}