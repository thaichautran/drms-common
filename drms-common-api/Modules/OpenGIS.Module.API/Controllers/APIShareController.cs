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
    [Route("api/api-share")]
    public class APIShareApiController : BaseApiCRUDController<INpgsqlSession, APIShare, int>
    {
        public APIShareApiController(IDbFactory dbFactory, IMapper mapper, IRepository<APIShare, int> repository)
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
                dto.searchValue = dto.searchValue?.ToFullTextString();
                condition += $" AND ({Sql.Entity<APIShare>():T}.search_content @@ to_tsquery(@searchValue))";
            }
            List<APIShare> data = new List<APIShare>();
            if (dto.take > 0)
            {
                data = session.Find<APIShare>(statement => statement.Where($"{condition}")
                    .WithParameters(new { dto.searchValue })
                    .OrderBy($"{Sql.Entity<APIShare>(x => x.id):TC}")
                    .Skip(dto.skip)
                    .Top(dto.take)
                ).ToList();
            }
            else
            {
                data = session.Find<APIShare>(statement => statement.Where($"{condition}")
                    .WithParameters(new { dto.searchValue })
                    .OrderBy($"{Sql.Entity<APIShare>(x => x.id):TC}")
                ).ToList();
            }
            return new RestPagedDataTable()
            {
                data = data,
                recordsTotal = session.Count<APIShare>(statement => statement
                    .Where($"{condition}")
                    .WithParameters(new { dto.searchValue })
                )
            };
        }
    }
}