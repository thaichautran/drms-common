using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.DevExtreme;
using OpenGIS.Module.Core.Models.DTO;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/base-layer")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_BASE_LAYER))]
    public class BaseLayerController : BaseController
    {
        public BaseLayerController(IDbFactory dbFactory)
            : base(dbFactory)
        {
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] DxGridDTO dto)
        {
            using (var session = OpenSession())
            {
                List<BaseLayer> data = new List<BaseLayer>();
                if (dto.take == 0)
                {
                    data = (await session.FindAsync<BaseLayer>()).ToList();
                }
                else
                {
                    data = (await session.FindAsync<BaseLayer>()).Skip(dto.skip).Take(dto.take).ToList();
                }
                return new RestData
                {
                    data = new
                    {
                        data = data,
                        totalCount = await session.CountAsync<BaseLayer>()
                    }
                };
            }
        }

        [HttpPost("createOrUpdate")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_BASE_LAYER))]
        public async Task<RestBase> CreateOrUpdate([FromBody] BaseLayer item)
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
                        var existItem = session.Get(new BaseLayer { id = item.id });
                        if (existItem == null)
                        {
                            return new RestError
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail {  message = "Lớp bản đồ này không tồn tại, vui lòng kiểm tra lại!" }
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
                    data = session.Get(new BaseLayer { id = id })
                };
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_BASE_LAYER))]
        public RestBase Delete([FromForm] BaseLayer item)
        {
            using (var session = OpenSession())
            {
                var existItem = session.Get(new BaseLayer { id = item.id });
                if (existItem == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lớp bản đồ này không tồn tại, vui lòng kiểm tra lại!" }
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

        [HttpGet("tree")]
        [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "mapId" })]
        public RestBase getTreeBaseLayers([FromQuery] int mapId = 0)
        {
            using (var session = OpenSession())
            {
                string condition = "1=1";
                if (mapId > 0)
                {
                    List<int> BaseLayerIds = session.Find<MapBaseLayers>(statement => statement
                        .Where($"{nameof(MapBaseLayers.map_id)} = @mapId")
                        .WithParameters(new { mapId })
                        .OrderBy($"{nameof(MapBaseLayers.order)}")
                    ).Select(x => x.base_layer_id).ToList();
                    if (BaseLayerIds.Count() > 0)
                    {
                        condition = $"{Sql.Entity<BaseLayer>(x => x.id):TC} IN ({string.Join(",", BaseLayerIds)})";
                    }
                    else
                    {
                        condition = "0=1";
                    }
                }
                List<BaseLayer> BaseLayers = session.Find<BaseLayer>(stm => stm.Where($"{condition}")).ToList();
                List<IDictionary<string, object>> children = new List<IDictionary<string, object>>();
                foreach (var BaseLayer in BaseLayers)
                {
                    IDictionary<string, object> child = new Dictionary<string, object>
                    {
                        { "id", $"base_{BaseLayer.id}"},
                        { "text", BaseLayer.name },
                        { "raw", BaseLayer },
                        { "type", "@BaseLayer"},
                        { "selected", BaseLayer.visible }
                    };
                    children.Add(child);
                }
                IDictionary<string, object> baseGroup = new Dictionary<string, object>
                {
                    { "id", $"g_BaseLayerGroup"},
                    { "text", "Lớp nền"},
                    { "expanded", true},
                    { "icon", "mdi mdi-layers-outline" },
                    { "type", "@BaseLayergroup"},
                };
                if (children.Count > 0)
                {
                    baseGroup.Add("items", children);
                }
                return new RestData
                {
                    data = new IDictionary<string, object>[] { baseGroup }
                };
            }
        }
    }
}
