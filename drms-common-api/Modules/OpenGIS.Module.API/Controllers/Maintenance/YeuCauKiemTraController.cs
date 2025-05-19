using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models.DTO;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/yeu-cau-kiem-tra")]
    public class YeuCauKiemTraController : BaseController
    {
        public YeuCauKiemTraController(IDbFactory dbFactory)
            : base(dbFactory)
        {
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] KiemTraListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                List<YeuCauKiemTraSuaChua> data = new List<YeuCauKiemTraSuaChua>();
                string condition = $@"{Sql.Entity<YeuCauKiemTraSuaChua>(x => x.loaiyeucau)} = @loaikiemtra";
                if (dto.take == 0)
                {
                    data = (await session.FindAsync<YeuCauKiemTraSuaChua>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto).OrderBy($"{nameof(YeuCauKiemTraSuaChua.ngaycapnhat):C} DESC")
                        )).ToList();
                }
                else
                {
                    data = (await session.FindAsync<YeuCauKiemTraSuaChua>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto).OrderBy($"{nameof(YeuCauKiemTraSuaChua.ngaycapnhat):C} DESC")
                        )).Skip(dto.skip).Take(dto.take).ToList();
                }
                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = await session.CountAsync<YeuCauKiemTraSuaChua>()
                };
            }
        }

        [HttpPost("save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_BASE_LAYER))]
        public async Task<RestBase> save([FromBody] YeuCauKiemTraSuaChua item)
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
                        item.ngaykhoitao = DateTime.Now;
                        await session.InsertAsync(item);
                        return new RestBase(EnumErrorCode.OK);
                    }
                    else
                    {
                        var existItem = session.Get(new YeuCauKiemTraSuaChua { id = item.id });
                        if (existItem == null)
                        {
                            return new RestError
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail {  message = "Yêu cầu kiểm tra không tồn tại, vui lòng kiểm tra lại!" }
                                }
                            };
                        }
                        else
                        {
                            existItem.tenyeucau = item.tenyeucau;
                            existItem.noidung = item.noidung;
                            existItem.tennguoitao = item.tennguoitao;
                            existItem.phongban = item.phongban;
                            existItem.ngaycapnhat = DateTime.Now;
                            await session.UpdateAsync(existItem);
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
                    data = session.Get(new YeuCauKiemTraSuaChua { id = id })
                };
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_BASE_LAYER))]
        public RestBase Delete([FromForm] YeuCauKiemTraSuaChua item)
        {
            using (var session = OpenSession())
            {
                var existItem = session.Get(new YeuCauKiemTraSuaChua { id = item.id });
                if (existItem == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Yêu cầu kiểm tra không tồn tại, vui lòng kiểm tra lại!" }
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
