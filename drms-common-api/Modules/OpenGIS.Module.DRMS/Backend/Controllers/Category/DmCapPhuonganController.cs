using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Models.DTO.Request;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Helpers;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Areas.DRMS.Controllers
{
    [Authorize(AuthenticationSchemes = OpenGIS.Module.Core.Constants.Constants.AUTH_SCHEMES)]
    [Route("api/dm-cap-phuongan")]
    public class DmCapPhuonganController : BaseApiCRUDController<INpgsqlSession, DmCapPhuongan, int>
    {
        public DmCapPhuonganController(IDbFactory dbFactory, IMapper mapper, IRepository<DmCapPhuongan, int> repository)
            : base(dbFactory, mapper, repository)
        {
        }

        [AllowAnonymous]
        public override Task<RestBase> GetAllAsync([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 15)
        {
            return base.GetAllAsync(q, page, pageSize);
        }

        [HttpPost("datatable")]
        public async Task<RestBase> DatatableAsync([FromBody] DataTableParameters dataTb)
        {
            using var session = OpenSession();
            string condition = $"(1=1)";
            string tableAlias = typeof(DmCapPhuongan).Name.ToLower();
            string orderName = $" 1 ASC";
            string orderDir = "ASC";
            List<DmCapPhuongan> data;

            var recordsTotal = await session.CountAsync<DmCapPhuongan>(statement => statement
                .WithAlias(tableAlias).Where($"{condition}")
                .WithParameters(dataTb)
            );

            if (dataTb != null && dataTb.search != null && string.IsNullOrWhiteSpace(dataTb.search?.value) == false)
            {
                condition += $" AND ({tableAlias}.\"search_content\" @@ to_tsquery(@keyword))";
            }

            if (dataTb != null && dataTb.columns != null && dataTb.order != null && dataTb.order.Count > 0)
            {
                orderDir = dataTb.order.First().dir;
                var orderCol = dataTb.order.First().column;
                orderName += $", {tableAlias}.\"{dataTb.columns[orderCol].name}\" {orderDir}";
            }

            var withParams = new
            {
                keyword = dataTb?.search?.value?.ToFullTextString(),
            };

            if (dataTb?.length == -1)
            {
                data = (await session.FindAsync<DmCapPhuongan>(statement => statement.WithAlias(tableAlias).Where($"{condition}")
                    .WithParameters(withParams)
                    .OrderBy($"{orderName}")
                )).ToList();
            }
            else if (dataTb?.length == 0)
            {
                data = new List<DmCapPhuongan>();
            }
            else
            {
                data = (await session.FindAsync<DmCapPhuongan>(statement => statement
                    .WithAlias(tableAlias).Where($"{condition}")
                    .WithParameters(withParams)
                    .OrderBy($"{orderName}").Skip(dataTb?.start ?? 0)
                    .Top(dataTb?.length ?? 10)
                )).ToList();
            }
            return new RestPagedDataTable<IEnumerable<DmCapPhuongan>>
            {
                data = data,
                recordsFiltered = await session.CountAsync<DmCapPhuongan>(statement => statement
                    .WithAlias(tableAlias)
                    .Where($"{condition}")
                    .WithParameters(withParams)
                ),
                recordsTotal = recordsTotal,
                draw = dataTb?.draw ?? 1,
            };
        }
    }
}