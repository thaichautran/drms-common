using Dapper.FastCrud;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Interfaces;
using System;
using System.Linq;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using System.Net;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Repositories.Session;
using AutoMapper;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Models.DTO.Response;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.Models.DTO;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/kiem-tra/ke-hoach/dinh-kem")]
    public class KeHoachKiemTraDinhKemApiController : BaseApiCRUDController<INpgsqlSession, KeHoachKiemTra.DinhKem, int>
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        public KeHoachKiemTraDinhKemApiController(IDbFactory dbFactory, IMapper mapper, IRepository<KeHoachKiemTra.DinhKem, int> repository,
        IWebHostEnvironment hostingEnvironment) : base(dbFactory, mapper, repository)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        [HttpPost("list-data")]
        public RestBase ListData([FromBody] KiemTraDinhKemDxDTO dto)
        {
            using (var session = OpenSession())
            {
                var condition = $"(1=1)";

                if (!string.IsNullOrWhiteSpace(dto.searchValue))
                {
                    dto.searchValue = dto.searchValue?.ToPGFulltext();
                    condition += $" AND ({Sql.Entity<KeHoachKiemTra.DinhKem>():T}.search_content @@ to_tsquery(@keyword))";
                }
                if (dto.kehoach_id > 0)
                {
                    condition += $" AND ({Sql.Entity<KeHoachKiemTra.DinhKem>(x => x.kehoach_id):TC} = @kehoach_id)";
                }

                List<KeHoachKiemTra.DinhKem> data = new List<KeHoachKiemTra.DinhKem>();
                var totalCount = session.Count<KeHoachKiemTra.DinhKem>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(dto)
                );
                if (dto.take > 0)
                {
                    data = session.Find<KeHoachKiemTra.DinhKem>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .Include<KeHoachKiemTra>(join => join.LeftOuterJoin())
                        .OrderBy($"{Sql.Entity<KeHoachKiemTra.DinhKem>(x => x.id):TC} DESC")
                    ).Skip(dto.skip).Take(dto.take).ToList();

                }
                else
                {
                    data = session.Find<KeHoachKiemTra.DinhKem>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .Include<KeHoachKiemTra>(join => join.LeftOuterJoin())
                        .OrderBy($"{Sql.Entity<KeHoachKiemTra.DinhKem>(x => x.id):TC} DESC")
                    ).ToList();
                }

                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = totalCount
                };
            }
        }
    }
}