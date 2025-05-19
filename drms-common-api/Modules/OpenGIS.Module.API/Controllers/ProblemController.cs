using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models.DTO;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_PROBLEM))]
    public class ProblemController : BaseController
    {
        public ProblemController(IDbFactory dbFactory)
            : base(dbFactory)
        {
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] ProblemListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                List<Problem> data = new List<Problem>();
                var condition = "1 = 1";
                if (dto.status != null && !string.IsNullOrWhiteSpace(dto.status))
                {
                    condition += @$" AND {Sql.Entity<Problem>(x => x.trangthai_id):TC} = @status";
                }
                if (dto.start_date.HasValue && dto.start_date != DateTime.MinValue)
                {
                    condition += @$" AND {Sql.Entity<Problem>(x => x.thoigian_xayra_suco):TC} >= @start_date";
                }
                if (dto.end_date.HasValue && dto.end_date != DateTime.MinValue)
                {
                    condition += @$" AND {Sql.Entity<Problem>(x => x.thoigian_xayra_suco):TC} >= @end_date";
                }
                if (dto.years != null && dto.years.Count() > 0)
                {
                    dto.years = dto.years.ToArray();
                    condition += @$" AND DATE_PART('year', {Sql.Entity<Problem>(x => x.thoigian_xayra_suco):TC}) = ANY(@years)";
                }
                if (dto.take == 0)
                {
                    data = (await session.FindAsync<Problem>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .OrderBy(@$"{Sql.Entity<Problem>(x => x.thoigian_capnhat_trangthai):TC} DESC")
                    )).ToList();
                }
                else
                {
                    data = (await session.FindAsync<Problem>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .OrderBy(@$"{Sql.Entity<Problem>(x => x.thoigian_capnhat_trangthai):TC} DESC")
                    )).Skip(dto.skip).Take(dto.take).ToList();
                }
                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = await session.CountAsync<Problem>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                    )
                };
            }
        }

        [HttpPost("save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_PROBLEM))]
        public async Task<RestBase> save([FromForm] Problem item)
        {
            using (var session = OpenSession())
            {
                if (item == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lỗi tham số!" }
                        }
                    };
                }
                else
                {
                    if (item.id == 0)
                    {
                        await session.InsertAsync(item);
                        return new RestBase(EnumErrorCode.OK);
                    }
                    else
                    {
                        Problem? existItem = session.Get(new Problem { id = item.id });
                        if (existItem == null)
                        {
                            return new RestError
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail {  message = "Sự cố này không tồn tại, vui lòng kiểm tra lại!" }
                                }
                            };
                        }
                        else
                        {
                            await session.UpdateAsync(item);
                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
            }
        }

        [HttpGet("{id}")]
        public RestBase Get([FromRoute] int id)
        {
            using (var con = OpenSession())
            {
                using var session = OpenSession();

                return new RestData
                {
                    data = session.Get(new Problem { id = id })
                };
            }
        }

        [HttpDelete("{id}")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_PROBLEM))]
        public RestBase Delete([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                Problem? existItem = session.Get(new Problem { id = id });
                if (existItem == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Sự cố này không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    session.Delete(existItem);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
    }
}
