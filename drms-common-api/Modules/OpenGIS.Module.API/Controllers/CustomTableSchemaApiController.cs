using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Backend.Models;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models.DevExtreme;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/custom-schema")]
    public class CustomTableSchemaApiController : BaseApiCRUDController<INpgsqlSession, CustomTableSchema, string>
    {
        public CustomTableSchemaApiController(IDbFactory dbFactory, IMapper mapper, IRepository<CustomTableSchema, string> repository)
            : base(dbFactory, mapper, repository)
        {
        }
        [HttpPost("data-grid")]
        public RestBase DataGrid([FromBody] DxGridDTO dto)
        {
            if (dto == null)
            {
                return new RestError((int)HttpStatusCode.BadRequest, "Vui lòng kiểm tra lại tham số");
            }
            using var session = OpenSession();
            var condition = "1=1 ";
            if (string.IsNullOrWhiteSpace(dto.searchValue) == false)
            {
                condition += $" AND lower({Sql.Entity<CustomTableSchema>(x => x.description):TC}) LIKE @searchValue";
            }
            List<CustomTableSchema> data = new List<CustomTableSchema>();
            if (dto.take > 0)
            {
                data = session.Find<CustomTableSchema>(statement => statement.Where($"{condition}")
                    .WithParameters(new { dto.searchValue })
                    .OrderBy($"{Sql.Entity<CustomTableSchema>(x => x.schema_name):TC}")
                    .Skip(dto.skip)
                    .Top(dto.take)
                ).ToList();
            }
            else
            {
                data = session.Find<CustomTableSchema>(statement => statement.Where($"{condition}")
                    .WithParameters(new { dto.searchValue })
                    .OrderBy($"{Sql.Entity<CustomTableSchema>(x => x.schema_name):TC}")
                ).ToList();
            }
            return new RestPagedDataTable()
            {
                data = data,
                recordsTotal = session.Count<CustomTableSchema>(statement => statement
                    .Where($"{condition}")
                    .WithParameters(new { dto.searchValue })
                )
            };
        }

        public override async Task<RestBase> UpdateAsync([FromBody] CustomTableSchema entity)
        {
            if (entity == null)
            {
                return new RestError(400, "Dữ liệu đầu vào không hợp lệ");
            }

            using ISession session = OpenSession();
            using UnitOfWork uow = new UnitOfWork(DbFactory, session);
            var item = session.Get(new CustomTableSchema { schema_name = entity.schema_name });
            if (item != null)
            {
                await uow.Connection.UpdateAsync(entity);
                return new RestBase("OK");
            }

            return new RestError(204, "Cập nhật dữ liệu không thành công!");
        }
    }
}