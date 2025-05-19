using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models;
using VietGIS.Infrastructure.Models.DTO.Response;
using System;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Enums;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using OpenGIS.Module.Core.Models.DevExtreme;
using System.Collections.Generic;
using VietGIS.Infrastructure.Models.Database.Map;
using Dapper;
using NetTopologySuite.Index.HPRtree;
using SharpKml.Dom;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/home-items")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_HOME_ITEM))]
    public class HomeItemController : BaseController
    {
        public HomeItemController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [HttpPost("save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_HOME_ITEM))]
        public async Task<RestBase> saveAsync([FromBody] HomeItem item)
        {
            using (var session = OpenSession())
            {
                using (var uow = session.UnitOfWork())
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
                            var existItem = session.Get(new HomeItem { id = item.id });
                            if (existItem == null)
                            {
                                return new RestError
                                {
                                    errors = new RestErrorDetail[]
                                    {
                                        new RestErrorDetail {  message = "Module này không tồn tại, vui lòng kiểm tra lại!" }
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
        }

        [HttpGet("root-items")]
        public async Task<RestBase> items([FromQuery] int? id)
        {
            using (var session = OpenSession())
            {
                var data = (await session.FindAsync<HomeItem>(statement => statement
                    .Where($"{Sql.Entity<HomeItem>(x => x.parent_id):TC} = @parent_id")
                    .WithParameters(new { parent_id = id.HasValue ? id.Value : 0 })
                    .OrderBy($"{Sql.Entity<HomeItem>(x => x.order):TC}, {Sql.Entity<HomeItem>(x => x.name):TC}")
                )).ToList();
                return new RestData
                {
                    data = data
                };
            }
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] DxGridDTO dto)
        {
            using (var session = OpenSession())
            {
                List<HomeItem> data = new List<HomeItem>();
                string sql = $@"SELECT child.{nameof(HomeItem.id)}, child.{nameof(HomeItem.name)}, 
                                child.{nameof(HomeItem.url)}, child.{nameof(HomeItem.visible)}, 
                                child.{nameof(HomeItem.order)}, child.{nameof(HomeItem.icon)}, 
                                child.{nameof(HomeItem.permission)}, 
                                child.{nameof(HomeItem.parent_id)}, parent.{nameof(HomeItem.name)} AS {nameof(HomeItem.parent_name)}
                            FROM {Sql.Entity<HomeItem>():T} child 
                            LEFT JOIN {Sql.Entity<HomeItem>():T} parent ON child.parent_id  = parent.id 
                            ORDER BY parent.{nameof(HomeItem.order)}, parent.{nameof(HomeItem.name)}, child.{nameof(HomeItem.order)}, child.{nameof(HomeItem.name)}";
                if (dto.take == 0)
                {
                    data = (await session.QueryAsync<HomeItem>($"{sql}")).ToList();
                }
                else
                {
                    sql += @$" LIMIT {dto.take} OFFSET {dto.skip}";
                    data = (await session.QueryAsync<HomeItem>($"{sql}")).ToList();
                }
                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = await session.CountAsync<HomeItem>()
                };
            }
        }

        [HttpGet("get-by-url")]
        [AllowAnonymous]
        public async Task<RestBase> getParentItem([FromQuery] string? url)
        {
            if (User.Identity != null && User.Identity.IsAuthenticated == false) {
                return new RestError(-1, "");
            }
            using (var session = OpenSession())
            {
                string sql = $@"SELECT child.{nameof(HomeItem.id)}, child.{nameof(HomeItem.name)}, 
                                child.{nameof(HomeItem.url)}, child.{nameof(HomeItem.visible)}, 
                                child.{nameof(HomeItem.order)}, child.{nameof(HomeItem.icon)}, 
                                child.{nameof(HomeItem.parent_id)}, parent.{nameof(HomeItem.name)} AS {nameof(HomeItem.parent_name)}
                            FROM {Sql.Entity<HomeItem>():T} child 
                            LEFT JOIN {Sql.Entity<HomeItem>():T} parent ON child.parent_id  = parent.id 
                            WHERE child.url = @url
                            ORDER BY child.{nameof(HomeItem.order)}, child.{nameof(HomeItem.name)}";

                return new RestData
                {
                    data = (await session.QueryAsync<HomeItem>(sql, new { url = url })).FirstOrDefault()
                };
            }
        }
    }
}