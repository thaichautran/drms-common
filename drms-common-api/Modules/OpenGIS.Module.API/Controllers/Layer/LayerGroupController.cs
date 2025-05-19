using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Models.Database.Map;
using Microsoft.AspNetCore.Authorization;
using OpenGIS.Module.Core.Models.DevExtreme;
using System.Linq;
using System.Collections.Generic;

namespace OpenGIS.Module.API.Controllers
{
    public partial class LayerController
    {

        [HttpGet("group/{id}")]
        public RestBase getGroupById([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = _layerGroupRepository.GetKey(id, session)
                };
            }
        }

        [HttpPost("group/save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_LAYER_GROUP))]
        public RestBase saveOrUpdate([FromBody] LayerGroup group)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (group.id > 0)
                    {
                        if (_layerGroupRepository.SaveOrUpdate(group, uow) > 0)
                        {
                            return new RestBase(EnumErrorCode.OK);
                        }
                        else
                        {
                            return new RestError(500, "Lưu thông tin thất bại, vui lòng thử lại sau");
                        }
                    }
                    else if (_layerGroupRepository.IsExistedGroup(group))
                    {
                        if (_layerGroupRepository.SaveOrUpdate(group, uow) > 0)
                        {
                            return new RestBase(EnumErrorCode.OK);
                        }
                        else
                        {
                            return new RestError(500, "Lưu thông tin thất bại, vui lòng thử lại sau");
                        }
                    }
                    else
                    {
                        return new RestError(202, "Nhóm dữ liệu đã tồn tại,  vui lòng kiểm tra lại!");
                    }
                }
            }
        }

        [HttpPost("group/delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_LAYER_GROUP))]
        public RestBase delete([FromForm] LayerGroup group)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    List<Layer> layers = session.Find<Layer>(stm => stm
                        .Where($"{nameof(Layer.layer_group_id)} = @id")
                        .WithParameters(new { id = group.id })
                    ).ToList();
                    foreach (Layer layer in layers)
                    {
                        layer.layer_group_id = 0;
                        if (_layerRepository.SaveOrUpdate(layer, uow) < 0)
                        {
                            continue;
                        }
                    }
                    if (_layerGroupRepository.Delete(group, uow))
                    {
                        return new RestBase(EnumErrorCode.OK);
                    }
                    else
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                            }
                        };
                    }
                }
            }
        }

        [HttpGet("groups")]
        public RestData listGroups([FromQuery] string? table_schema = "")
        {
            using (var session = OpenSession())
            {
                if (table_schema == null || string.IsNullOrWhiteSpace(table_schema))
                {
                    return new RestData()
                    {
                        data = session.Find<LayerGroup>(statement => statement
                            .OrderBy($"{Sql.Entity<LayerGroup>(x => x.order):TC}, {Sql.Entity<LayerGroup>(x => x.name_vn):TC}")
                        )
                    };
                }
                else
                {
                    return new RestData()
                    {
                        data = session.Find<LayerGroup>(statement => statement
                            .Where($"{Sql.Entity<LayerGroup>(x => x.table_schema):TC} = @table_schema")
                            .WithParameters(new { table_schema = table_schema })
                            .OrderBy($"{Sql.Entity<LayerGroup>(x => x.order):TC}, {Sql.Entity<LayerGroup>(x => x.name_vn):TC}")
                        )
                    };
                }
            }
        }

        [HttpPost("getGroups")]
        public RestBase getGroups([FromBody] DxGridDTO parameter)
        {
            using (var session = OpenSession())
            {
                return new RestPagedData()
                {
                    // total_count = session.Find<LayerGroup>(statement => statement
                    //                       .Where($"{nameof(LayerGroup.table_schema)} = @table_schema")
                    //                       .WithParameters(new { table_schema = parameter.table_schema })).Count(),
                    // data = session.Find<LayerGroup>(statement => statement
                    //               .Where($"{nameof(LayerGroup.table_schema)} = @table_schema")
                    //               .WithParameters(new { table_schema = parameter.table_schema })
                    //               .OrderBy($"{nameof(LayerGroup.name_vn)}")
                    //               .Skip(parameter.skip)
                    //               .Top(parameter.take))
                };
            }
        }
    }
}
