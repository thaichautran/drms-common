using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using VietGIS.Infrastructure.Interfaces;
using Newtonsoft.Json;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Repositories;
using OpenGIS.Module.Core.Helpers;
using OpenGIS.Module.Core.Models.DTO.Request;
using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Repositories.Implements;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using OpenGIS.Module.Core.Models.DevExtreme;
using System.Globalization;
using System.IO;
using OpenGIS.Module.Core.Models.DTO;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using VietGIS.Infrastructure.Models.Regional;
using OpenGIS.Module.Core.Models;
using System.Text;
using Microsoft.Extensions.Logging;
using OpenGIS.Module.Core.ViewModels;
using ProtoBuf;
using Microsoft.Net.Http.Headers;
using OpenGIS.Module.Core.Extensions;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_MAP))]
    public partial class MapController : BaseController
    {
        private readonly IMapRepository _mapRepository;
        private readonly ILayerRepository _layerRepository;
        private readonly ILogger<MapController> _logger;
        private readonly IWorkContext _workContext;

        public MapController(IDbFactory dbFactory,
                            IMapRepository mapRepository,
                            ILayerRepository layerRepository,
                            IWorkContext workContext,
                            ILogger<MapController> logger
                            ) : base(dbFactory)
        {
            _mapRepository = mapRepository;
            _layerRepository = layerRepository;
            _workContext = workContext;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "id" })]
        public RestBase Get([FromRoute] int id)
        {
            using var session = OpenSession();

            return new RestData
            {
                data = session.Get(new Map { id = id })
            };
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] MapListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                List<Map> data = new List<Map>();
                string condition = $"1=1";
                if (dto.parent_id > 0)
                {
                    condition += $" AND {nameof(Map.parent_id)} = @parent_id";
                }
                if (dto.take == 0)
                {
                    data = (await session.FindAsync<Map>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto))
                    ).OrderBy(x => x.id).ToList();
                }
                else
                {
                    data = (await session.FindAsync<Map>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)))
                        .OrderBy(x => x.id)
                        .Skip(dto.skip)
                        .Take(dto.take).ToList();
                }
                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = await session.CountAsync<Map>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto))
                };
            }
        }

        [HttpPost("create-from-templates")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public RestBase createFromTemplateMap([FromForm] Map map)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (map == null || map.id == 0)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    //Map? existMap = session.Find<Map>(stm => stm
                    //    .Where($@"{Sql.Entity<Map>(x => x.id):TC} = @id")
                    //    .WithParameters(map)
                    //    .Include<MapBaseLayers>()
                    //    .Include<MapLayers>()
                    //    .Include<MapTables>()
                    //).FirstOrDefault();
                    Map? existMap = session.Get(new Map { id = map.id });
                    if (existMap == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                    new RestErrorDetail() { message = "Bản đồ mẫu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    existMap.mapBaseLayers = session.Find<MapBaseLayers>(stm => stm
                        .Where($"{Sql.Entity<MapBaseLayers>(x => x.map_id):TC} = @id")
                        .WithParameters(existMap)
                    ).ToList();
                    existMap.mapLayers = session.Find<MapLayers>(stm => stm
                        .Where($"{Sql.Entity<MapLayers>(x => x.map_id):TC} = @id")
                        .WithParameters(existMap)
                    ).ToList();
                    existMap.mapTables = session.Find<MapTables>(stm => stm
                        .Where($"{Sql.Entity<MapTables>(x => x.map_id):TC} = @id")
                        .WithParameters(existMap)
                    ).ToList();
                    //
                    existMap.id = 0;
                    existMap.description = map.description;
                    existMap.name = map.name;

                    map.id = _mapRepository.SaveOrUpdate(existMap, uow);


                    // BaseLayer
                    if (existMap.mapBaseLayers != null && existMap.mapBaseLayers.Count() > 0)
                    {
                        foreach (var mapBaseLayer in existMap.mapBaseLayers)
                        {
                            session.Insert(new MapBaseLayers
                            {
                                map_id = map.id,
                                base_layer_id = mapBaseLayer.base_layer_id
                            });
                        }
                    }
                    // Layer
                    if (existMap.mapLayers != null && existMap.mapLayers.Count() > 0)
                    {
                        foreach (var mapLayer in existMap.mapLayers)
                        {
                            session.Insert(new MapLayers
                            {
                                map_id = map.id,
                                layer_id = mapLayer.layer_id
                            });
                        }
                    }
                    // Table
                    if (existMap.mapTables != null && existMap.mapTables.Count() > 0)
                    {
                        foreach (var mapTable in existMap.mapTables)
                        {
                            session.Insert(new MapTables
                            {
                                map_id = map.id,
                                table_id = mapTable.table_id
                            });
                        }
                    }

                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public RestBase saveMap([FromForm] Map map)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (map == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    if (map.id == 0)
                    {
                        map.id = _mapRepository.SaveOrUpdate(map, uow);
                        if (map.id == 0)
                        {
                            return new RestError()
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail() { message = "Đã xảy ra lỗi khi thêm bản ghi!" }
                                }
                            };
                        }
                    }
                    else
                    {
                        Map? existMap = session.Get(new Map { id = map.id });
                        if (existMap == null)
                            return new RestError()
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail() { message = "Bản đồ không tồn tại, vui lòng kiểm tra lại!" }
                                }
                            };
                        existMap.name = map.name;
                        existMap.description = map.description;
                        existMap.center = map.center;
                        existMap.defaultzoom = map.defaultzoom;
                        existMap.minzoom = map.minzoom;
                        existMap.maxzoom = map.maxzoom;
                        existMap.visible = map.visible;
                        existMap.icon = map.icon;
                        existMap.parent_id = map.parent_id;
                        existMap.cluster = map.cluster;
                        map.id = _mapRepository.SaveOrUpdate(existMap, uow);
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("layer/save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public RestBase saveMapLayers([FromForm] Map map)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (map == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    session.Execute($"DELETE FROM {Sql.Entity<MapLayers>():T} WHERE {nameof(MapLayers.map_id)} = @id", map);
                    if (map.mapLayers != null && map.mapLayers.Count() > 0)
                    {
                        foreach (MapLayers mapLayer in map.mapLayers)
                        {
                            uow.Connection.Insert(new MapLayers
                            {
                                layer_id = mapLayer.layer_id,
                                map_id = map.id
                            });
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("table/save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public RestBase saveMapTables([FromForm] Map map)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (map == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    session.Execute($"DELETE FROM {Sql.Entity<MapTables>():T} WHERE {nameof(MapTables.map_id)} = @id", map);
                    if (map.mapTables != null && map.mapTables.Count() > 0)
                    {
                        foreach (MapTables mapTable in map.mapTables)
                        {
                            uow.Connection.Insert(new MapTables
                            {
                                table_id = mapTable.table_id,
                                map_id = map.id
                            });
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("regions/save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public async Task<RestBase> saveMapRegionsAsync([FromBody] Map map)
        {
            using var session = OpenSession();
            using var uow = new UnitOfWork(DbFactory, session);
            if (map == null)
            {
                return new RestError(400, "Lỗi tham số!");
            }
            await uow.BulkDeleteAsync<MapRegion>(statement => statement
                .Where($"{Sql.Entity<MapRegion>(p => p.map_id):TC}=@mapId")
                .WithParameters(new { mapId = map.id })
            );
            if (map.mapRegions != null && map.mapRegions.Count() > 0)
            {
                foreach (MapRegion mapRegion in map.mapRegions)
                {
                    await uow.InsertAsync(new MapRegion
                    {
                        area_code = mapRegion.area_code,
                        map_id = map.id,
                        area_type = mapRegion.area_type
                    });
                }
            }
            return new RestBase(EnumErrorCode.OK);
        }

        [HttpPost("base-layer/save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public RestBase saveMapBaseLayers([FromForm] Map map)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (map == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    session.Execute($"DELETE FROM {Sql.Entity<MapBaseLayers>():T} WHERE {nameof(MapBaseLayers.map_id)} = @id", map);
                    if (map.mapBaseLayers != null && map.mapBaseLayers.Count() > 0)
                    {
                        foreach (MapBaseLayers mapBaseLayer in map.mapBaseLayers)
                        {
                            mapBaseLayer.map_id = map.id;
                            uow.Connection.Insert(mapBaseLayer);
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public async Task<RestBase> deleteMapSync([FromForm] Map map)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (map == null || map.id == 0)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    Map? existMap = session.Get(new Map { id = map.id });
                    if (existMap == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Bản đồ không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    await uow.DeleteAsync(existMap);
                    // Xóa lớp nền, lớp dữ liệu cũ
                    await session.ExecuteAsync($"DELETE FROM {Sql.Entity<MapLayers>():T} WHERE {nameof(MapLayers.map_id):C} = @id", existMap);
                    await session.ExecuteAsync($"DELETE FROM {Sql.Entity<MapTables>():T} WHERE {nameof(MapTables.map_id):C} = @id", existMap);
                    await session.ExecuteAsync($"DELETE FROM {Sql.Entity<MapBaseLayers>():T} WHERE {nameof(MapBaseLayers.map_id):C} = @id", existMap);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("base-layer/delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public async Task<RestBase> deleteMapLayerSync([FromForm] MapBaseLayers mapBaseLayer)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (mapBaseLayer == null || mapBaseLayer.base_layer_id == 0 || mapBaseLayer.map_id == 0)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    MapBaseLayers? existMapBaseLayer = session.Find<MapBaseLayers>(stm => stm
                        .Where($"{nameof(MapBaseLayers.map_id):C} = @map_id AND {nameof(MapBaseLayers.base_layer_id)} = @base_layer_id")
                        .WithParameters(mapBaseLayer)
                    ).FirstOrDefault();
                    if (existMapBaseLayer == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lớp nền bản đồ không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    await uow.DeleteAsync(existMapBaseLayer);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("layer/delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public async Task<RestBase> deleteMapLayerSync([FromForm] MapLayers mapLayer)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (mapLayer == null || mapLayer.layer_id == 0 || mapLayer.map_id == 0)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    MapLayers? existMapLayer = session.Find<MapLayers>(stm => stm
                        .Where($"{nameof(MapLayers.map_id):C} = @map_id AND {nameof(MapLayers.layer_id)} = @layer_id")
                        .WithParameters(mapLayer)).FirstOrDefault();
                    if (existMapLayer == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    await uow.DeleteAsync(existMapLayer);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("table/delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAP))]
        public async Task<RestBase> deleteMapLayerSync([FromForm] MapTables mapTable)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (mapTable == null || mapTable.table_id == 0 || mapTable.map_id == 0)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Lỗi tham số!" }
                            }
                        };
                    MapTables? existMapTable = session.Find<MapTables>(stm => stm
                        .Where($"{nameof(MapTables.map_id):C} = @map_id AND {nameof(MapTables.table_id)} = @table_id")
                        .WithParameters(mapTable)
                    ).FirstOrDefault();
                    if (existMapTable == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    await uow.DeleteAsync(existMapTable);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpGet("tree-regions")]
        [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "mapId" })]
        public async Task<JsonResult> getRegionAsync([FromQuery] int? mapId)
        {
            using (var session = OpenSession())
            {
                var provinceIds = session.Find<MapRegion>(statement => statement
                    .Where($"{Sql.Entity<MapRegion>(p => p.map_id):TC}=@mapId AND {Sql.Entity<MapRegion>(p => p.area_type):TC} = 1")
                    .WithParameters(new { mapId })
                ).Select(o => o.area_code).ToList();
                var ExprTreeView = new List<DevTreeView>();
                var provinces = (await session.FindAsync<Province>(statement => statement
                    .Where($"{Sql.Entity<Province>(p => p.area_id):TC} = ANY(@provinceIds)")
                    .WithParameters(new
                    {
                        provinceIds = provinceIds
                    })
                )).ToList();
                provinces.ForEach(x =>
                {
                    ExprTreeView.Add(new DevTreeView
                    {
                        id = x.area_id,
                        text = x.name_vn,
                        hasItems = true,
                        parentId = 0,
                        isExpanded = false
                    });
                });
                return new JsonResult(ExprTreeView);
            }
        }

        [AllowAnonymous]
        [HttpGet("tree-layers")]
        [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "mapId" })]
        public async Task<RestBase> GetMapLayers([FromQuery] int mapId)
        {
            using (var session = OpenSession())
            {
                var map = session.Get(new Map { id = mapId });
                var mapRegions = session.Find<MapRegion>(statement => statement
                .Where($"{Sql.Entity<MapRegion>(p => p.map_id):TC}=@mapId")
                .WithParameters(new { mapId })).ToList();
                List<int> layerIds = session.Find<MapLayers>(statement => statement
                    .Where($"{nameof(MapLayers.map_id)}=@mapId")
                    .WithParameters(new { mapId })
                ).Select(x => x.layer_id).ToList();
                List<int> tableIds = session.Find<MapTables>(statement => statement
                    .Where($"{nameof(MapTables.map_id)}=@mapId")
                    .WithParameters(new { mapId })
                ).Select(x => x.table_id).ToList();
                List<int> columnIds = new List<int>();

                if (layerIds == null || layerIds.Count == 0)
                {
                    return new RestData
                    {
                        data = new object[] { }
                    };
                }
                List<UserRegion> userRegions = new List<UserRegion>();
                List<UserLayer> userLayers = new List<UserLayer>();
                List<UserTable> userTables = new List<UserTable>();
                List<UserColumn> userColumns = new List<UserColumn>();

                var user = await _workContext.GetCurrentUser();

                bool isSa = User.IsInRole(EnumRoles.SA);
                bool isAdmin = User.IsInRole(EnumRoles.ADMINISTRATOR);

                if (isSa == false && isAdmin == false)
                {
                    userRegions = session.Find<UserRegion>(statement => statement
                        .Where($"{nameof(UserRegion.user_id)} = @id")
                        .WithParameters(new { id = getUserId() })
                        .Include<District>(x => x.LeftOuterJoin())
                    ).ToList();
                    userLayers = session.Find<UserLayer>(statement => statement
                        .Where($"{nameof(UserLayer.user_id)} = @id")
                        .WithParameters(new { id = getUserId() })
                    ).ToList();
                    userColumns = ListUserColumns(session);
                    layerIds = layerIds.Where(x => userLayers.Any(y => y.layer_id == x)).ToList();
                    tableIds = tableIds.Where(x => userTables.Any(y => y.table_id == x)).ToList();
                    columnIds = userColumns.Select(x => x.column_id).ToList();
                }

                string conditonLayer = "(1 = 0)";
                string conditonTable = "(1 = 0)";
                string conditionColumn = "(1 = 1)";
                if (layerIds.Count() > 0)
                {
                    conditonLayer = $"{Sql.Entity<Layer>(x => x.id):TC} IN ({string.Join(",", layerIds)})";
                }
                if (tableIds.Count() > 0)
                {
                    conditonTable = $"{Sql.Entity<TableInfo>(x => x.id):TC} IN ({string.Join(",", tableIds)})";
                }
                if (columnIds.Count() > 0)
                {
                    StringBuilder builder = new StringBuilder();
                    builder.Append("(");
                    builder.AppendLine($"{Sql.Entity<TableColumn>(x => x.id):TC} = ANY(@columnIds)");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.is_key):TC} = TRUE");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.is_identity):TC} = TRUE");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.is_label):TC} = TRUE");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.column_name):TC} = 'province_code'");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.column_name):TC} = 'district_code'");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.column_name):TC} = 'commune_code'");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.column_name):TC} = 'geom'");
                    builder.Append(")");
                    conditionColumn = builder.ToString();
                }
                IEnumerable<LayerGroup> layerGroups = (await session.FindAsync<LayerGroup>(x => x
                    .Where($@"{conditionColumn} AND {conditonLayer} AND {Sql.Entity<Layer>(x => x.layer_group_id):TC} > 0")
                    .Include<Layer>(join => join.LeftOuterJoin())
                    .Include<TileLayer>(join => join.LeftOuterJoin())
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .WithParameters(new { columnIds = columnIds })
                    .OrderBy($@"{Sql.Entity<LayerGroup>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.order):TC}, 
                        {Sql.Entity<Layer>(x => x.name_vn):TC}, {Sql.Entity<TableColumn>(x => x.require):TC} DESC, 
                        {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                )).ToList();

                IEnumerable<Layer> layers = await session.FindAsync<Layer>(statement => statement
                    .Where($@"{conditionColumn} AND {conditonLayer} AND ({Sql.Entity<Layer>(x => x.layer_group_id):TC} = 0 OR {Sql.Entity<Layer>(x => x.layer_group_id):TC} IS NULL)")
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .WithParameters(new { columnIds = columnIds })
                    .OrderBy($@"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC}, 
                        {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC}, 
                        {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                );

                // Lấy bảng dữ liệu không có hình học
                IEnumerable<TableGroup> tableGroups = (await session.FindAsync<TableGroup>(x => x
                    .Where($"{conditionColumn} AND {conditonTable} AND {Sql.Entity<TableInfo>(x => x.table_group_id):TC} > 0")
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .WithParameters(new { columnIds = columnIds })
                    .OrderBy($@"{Sql.Entity<TableGroup>(x => x.order):TC}, {Sql.Entity<TableInfo>(x => x.order):TC},
                        {Sql.Entity<TableInfo>(x => x.name_vn):TC}, {Sql.Entity<TableColumn>(x => x.require):TC} DESC, 
                        {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}"))
                ).ToList();

                IEnumerable<TableInfo> tables = await session.FindAsync<TableInfo>(statement => statement
                    .Where($@"{conditionColumn} AND {conditonTable} AND ({Sql.Entity<TableInfo>(x => x.table_group_id):TC} = 0 OR {Sql.Entity<TableInfo>(x => x.table_group_id):TC} IS NULL)")
                    .Include<TableGroup>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .WithParameters(new { columnIds = columnIds })
                    .OrderBy($@"{Sql.Entity<TableInfo>(x => x.id):TC}, {Sql.Entity<TableInfo>(x => x.name_vn):TC}, 
                        {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC}, 
                        {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                );

                List<IDictionary<string, object>> treeItems = new List<IDictionary<string, object>>();
                List<IDictionary<string, object>> layerChildren = new List<IDictionary<string, object>>();

                foreach (var layerGroup in layerGroups)
                {
                    IDictionary<string, object> data = new Dictionary<string, object>
                        {
                            { "id", $"g_{layerGroup.id}" },
                            { "text", layerGroup.name_vn },
                            { "expanded", true },
                            { "icon", "mdi mdi-layers-outline" },
                            { "type", "@layergroup" },
                            { "raw", layerGroup }
                        };
                    List<IDictionary<string, object>> children = new List<IDictionary<string, object>>();
                    if (layerGroup.layers != null)
                    {
                        foreach (var layer in layerGroup.layers.OrderBy(x => x.order))
                        {
                            if (layer.hidden == false)
                            {
                                TableColumn? keyColumn = layer.table.key_column ?? layer.table.identity_column;
                                int countRecords = 0;
                                if (keyColumn != null)
                                {
                                    string sqlCount = $"SELECT COUNT({keyColumn.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name} WHERE 1=1";
                                    if (isSa == false && isAdmin == false)
                                    {
                                        if (userRegions != null && userRegions.Count() > 0)
                                        {
                                            // if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                                            // {
                                            //     sqlCount += @$" AND {layer.table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))})";
                                            // }
                                            if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                                            {
                                                sqlCount += $" AND (\"{layer.table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".district_code IS NULL OR \"{layer.table.table_name}\".district_code = '')";
                                            }
                                            if (layer.table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                                            {
                                                sqlCount += $" AND (\"{layer.table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".commune_code IS NULL OR \"{layer.table.table_name}\".commune_code = '')";
                                            }
                                        }
                                        if (layer.table.columns.Any(o => o.column_name == "is_approved"))
                                        {
                                            sqlCount += @$" AND (is_approved = TRUE OR created_by = '{user?.UserName}')";
                                        }
                                    }
                                    if (!string.IsNullOrEmpty(map.boundary))
                                    {
                                        sqlCount += @$" AND st_intersects(geom, ST_GeomFromGeoJSON('{map.boundary}'))";
                                    }
                                    countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                                }
                                IDictionary<string, object> child = new Dictionary<string, object>
                                    {
                                        //var domains = getDomainValues(layer);
                                        //var relations = getRelations(layer);
                                        { "id", $"l_{layer.id}" },
                                        { "text", $"{layer.name_vn} ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})"},
                                        { "raw", layer },
                                        { "type", "@layer" },
                                        { "icon", "mdi mdi-circle-outline" },
                                        { "selected", layer.is_visible }
                                    };
                                //child.Add("domains", domains);
                                //child.Add("relations", relations);
                                if (layer.layer_classify.Count() > 0)
                                {
                                    List<IDictionary<string, object>> childrenClassify = new List<IDictionary<string, object>>();
                                    foreach (var classify in layer.layer_classify.Where(x => x.table_column_id == layer.classify_column_id).ToList())
                                    {
                                        var column = layer.table.columns.FirstOrDefault(x => x.id == classify.table_column_id);
                                        if (column != null)
                                        {
                                            string sqlCount = $"SELECT COUNT({keyColumn?.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name} WHERE lower({column.column_name}) = '{classify.value?.ToLower()}'";
                                            if (column.data_type == EnumPgDataType.Integer || column.data_type == EnumPgDataType.BigInt || column.data_type == EnumPgDataType.Double)
                                            {
                                                sqlCount = $"SELECT COUNT({keyColumn?.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name} WHERE {column.column_name}::TEXT = @value";
                                            }
                                            if (isSa == false && isAdmin == false)
                                            {
                                                if (userRegions != null && userRegions.Count() > 0)
                                                {
                                                    // if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                                                    // {
                                                    //     sqlCount += @$" AND {layer.table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))})";
                                                    // }
                                                    if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                                                    {
                                                        sqlCount += $" AND (\"{layer.table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".district_code IS NULL OR \"{layer.table.table_name}\".district_code = '')";
                                                    }
                                                    if (layer.table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                                                    {
                                                        sqlCount += $" AND (\"{layer.table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".commune_code IS NULL OR \"{layer.table.table_name}\".commune_code = '')";
                                                    }
                                                }
                                                if (layer.table.columns.Any(o => o.column_name == "is_approved"))
                                                {
                                                    sqlCount += @$" AND (is_approved = TRUE OR created_by = '{user?.UserName}')";
                                                }
                                            }
                                            if (!string.IsNullOrEmpty(map.boundary))
                                            {
                                                sqlCount += @$" AND st_intersects(geom, ST_GeomFromGeoJSON('{map.boundary}'))";
                                            }
                                            countRecords = session.Query<int>(sqlCount, new
                                            {
                                                value = classify.value
                                            }).FirstOrDefault();
                                        }
                                        else
                                        {
                                            countRecords = 0;
                                        }

                                        IDictionary<string, object> childClassify = new Dictionary<string, object>
                                        {
                                            {"id", $"lc_{classify.id}" },
                                            {"text", classify.description + $" ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})" },
                                            {"raw", classify },
                                            {"type", "@layer_classify" },
                                            {"selected", layer.is_visible },
                                            {"icon", "mdi mdi-circle-outline" }
                                        };
                                        childrenClassify.Add(childClassify);
                                    }
                                    if (childrenClassify.Count > 0)
                                    {
                                        child.Add("items", childrenClassify);
                                        child.Add("expanded", (User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)) && childrenClassify.Count < 10);
                                    }
                                }
                                children.Add(child);
                            }
                        }
                    }
                    if (layerGroup.tile_layers != null)
                    {
                        foreach (var layer in layerGroup.tile_layers)
                        {
                            IDictionary<string, object> child = new Dictionary<string, object>
                            {
                                { "id", $"tl_{layer.id}" },
                                { "text", layer.name },
                                { "raw", layer },
                                { "type", "@tilelayer" },
                                { "icon", "mdi mdi-circle-outline" },
                                { "selected", layer.visible }
                            };
                            children.Add(child);
                        }
                    }

                    if (children.Count > 0)
                    {
                        // data.Add("disabled", true);
                        data.Add("items", children);
                        treeItems.Add(data);
                    }
                }

                foreach (var layer in layers.OrderBy(x => x.order))
                {
                    if (layer.hidden == false)
                    {
                        TableColumn? keyColumn = layer.table.key_column ?? layer.table.identity_column;
                        int countRecords = 0;
                        if (keyColumn != null)
                        {
                            string sqlCount = @$"SELECT COUNT({keyColumn.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name} WHERE 1=1";
                            if (isSa == false && isAdmin == false)
                            {
                                if (userRegions != null && userRegions.Count() > 0)
                                {
                                    // if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                                    // {
                                    //     sqlCount += @$" AND {layer.table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))})";
                                    // }
                                    if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                                    {
                                        sqlCount += $" AND (\"{layer.table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".district_code IS NULL OR \"{layer.table.table_name}\".district_code = '')";
                                    }
                                    if (layer.table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                                    {
                                        sqlCount += $" AND (\"{layer.table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".commune_code IS NULL OR \"{layer.table.table_name}\".commune_code = '')";
                                    }
                                }
                            }
                            if (layer.table.columns.Any(o => o.column_name == "is_approved"))
                            {
                                sqlCount += @$" AND (is_approved = TRUE OR created_by = '{user?.UserName}')";
                            }
                            countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                        }
                        IDictionary<string, object> child = new Dictionary<string, object>
                        {
                            //var domains = getDomainValues(layer);
                            //var relations = getRelations(layer);
                            { "id", $"l_{layer.id}" },
                            { "text", $"{layer.name_vn} ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})" },
                            { "raw", layer },
                            { "type", "@layer" },
                            { "icon", "mdi mdi-layers-outline" },
                            { "selected", layer.is_visible }
                        };
                        //child.Add("domains", domains);
                        //child.Add("relations", relations);
                        if (layer.layer_classify.Count() > 0)
                        {
                            List<IDictionary<string, object>> childrenClassify = new List<IDictionary<string, object>>();
                            foreach (var classify in layer.layer_classify.Where(x => x.table_column_id == layer.classify_column_id).ToList())
                            {
                                IDictionary<string, object> childClassify = new Dictionary<string, object>
                                    {
                                        {"id", $"lc_{classify.id}" },
                                        {"text", classify.description },
                                        {"raw", classify },
                                        {"type", "@layer_classify" },
                                        {"selected", layer.is_visible },
                                        {"icon", "mdi mdi-circle-outline" }

                                    };
                                childrenClassify.Add(childClassify);
                            }
                            if (childrenClassify.Count > 0)
                            {
                                child.Add("items", childrenClassify);
                                child.Add("expanded", (User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)) && childrenClassify.Count < 10);
                            }
                        }
                        layerChildren.Add(child);
                    }
                }

                IDictionary<string, object> dataOrphan = new Dictionary<string, object>
                {
                    { "id", $"g_Orphans" },
                    { "text", "Nhóm dữ liệu khác" },
                    { "expanded", true },
                    { "icon", "mdi mdi-layers-outline" },
                    { "type", "@layergroup" }
                };

                if (layerChildren.Count > 0)
                {
                    dataOrphan.Add("items", layerChildren);
                    treeItems.Add(dataOrphan);
                }


                // Bảng dữ liệu
                IDictionary<string, object> dataTable = new Dictionary<string, object>
                    {
                        { "id", $"g_Table" },
                        { "text", "Bảng dữ liệu" },
                        { "expanded", true },
                        { "icon", "mdi mdi-layers-outline" },
                        { "type", "@tablegroup" }
                    };
                List<IDictionary<string, object>> tableGroupItems = new List<IDictionary<string, object>>();
                foreach (var tableGroup in tableGroups)
                {
                    IDictionary<string, object> dataTableGroup = new Dictionary<string, object>
                        {
                            { "id", $"tg_{tableGroup.id}" },
                            { "text", tableGroup.name_vn },
                            { "expanded", true },
                            { "icon", "mdi mdi-layers-outline" },
                            { "type", "@table-sm-group" },
                            { "raw", tableGroup }
                        };
                    List<IDictionary<string, object>> tableItems = new List<IDictionary<string, object>>();
                    if (tableGroup.tables != null)
                    {
                        foreach (var table in tableGroup.tables.OrderBy(x => x.order))
                        {
                            TableColumn? keyColumn = table.key_column ?? table.identity_column;
                            int countRecords = 0;
                            if (keyColumn != null)
                            {
                                string sqlCount = @$"SELECT COUNT({keyColumn.column_name}) FROM {table.table_schema}.{table.table_name} WHERE 1=1";
                                if (isSa == false && isAdmin == false)
                                {
                                    if (userRegions != null && userRegions.Count() > 0)
                                    {
                                        //     if (table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                                        //     {
                                        //         sqlCount += @$" AND {table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))})";
                                        //     }
                                        if (table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                                        {
                                            sqlCount += $" AND (\"{table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{table.table_name}\".district_code IS NULL OR \"{table.table_name}\".district_code = '')";
                                        }
                                        if (table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                                        {
                                            sqlCount += $" AND (\"{table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{table.table_name}\".commune_code IS NULL OR \"{table.table_name}\".commune_code = '')";
                                        }
                                    }
                                }
                                if (table.columns.Any(o => o.column_name == "is_approved"))
                                {
                                    sqlCount += @$" AND (is_approved = TRUE OR created_by = '{user?.UserName}')";
                                }
                                countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                            }
                            IDictionary<string, object> child = new Dictionary<string, object>
                                    {
                                        { "id", $"table_{table.id}" },
                                        { "text", $"{table.name_vn} ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})"},
                                        { "raw", table },
                                        { "type", "@table" },
                                        { "icon", "mdi mdi-circle-outline" },
                                        { "selected", false}
                                    };
                            tableItems.Add(child);
                        }
                    }
                    if (tableItems.Count > 0)
                    {
                        dataTableGroup.Add("items", tableItems);
                        tableGroupItems.Add(dataTableGroup);
                    }
                }

                IDictionary<string, object> dataTableOrphan = new Dictionary<string, object>
                    {
                        { "id", $"tg_Orphans" },
                        { "text", "Nhóm dữ liệu khác" },
                        { "expanded", true },
                        { "icon", "mdi mdi-layers-outline" },
                        { "type", "@table-sm-group" }
                    };
                List<IDictionary<string, object>> tableChildren = new List<IDictionary<string, object>>();
                foreach (var table in tables)
                {
                    TableColumn? keyColumn = table.key_column ?? table.identity_column;

                    int countRecords = 0;
                    if (keyColumn != null)
                    {
                        string sqlCount = @$"SELECT COUNT({keyColumn.column_name}) FROM {table.table_schema}.{table.table_name} WHERE 1=1";
                        if (isSa == false && isAdmin == false)
                        {
                            if (userRegions != null && userRegions.Count() > 0)
                            {
                                // if (table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                                // {
                                //     sqlCount += @$" AND {table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))})";
                                // }
                                if (table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                                {
                                    sqlCount += $" AND (\"{table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{table.table_name}\".district_code IS NULL OR \"{table.table_name}\".district_code = '')";
                                }
                                if (table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                                {
                                    sqlCount += $" AND (\"{table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{table.table_name}\".commune_code IS NULL OR \"{table.table_name}\".commune_code = '')";
                                }
                            }
                        }
                        if (table.columns.Any(o => o.column_name == "is_approved"))
                        {
                            sqlCount += @$" AND (is_approved = TRUE OR created_by = '{user?.UserName}')";
                        }
                        countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                    }
                    IDictionary<string, object> child = new Dictionary<string, object>
                        {
                           { "id", $"table_{table.id}" },
                           { "text", $"{table.name_vn} ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})"},
                           { "raw", table },
                           { "type", "@table" },
                           { "icon", "mdi mdi-layers-outline" },
                           { "selected", true }
                        };
                    tableChildren.Add(child);
                }
                if (tableChildren.Count > 0)
                {
                    dataTableOrphan.Add("items", tableChildren);
                    tableGroupItems.Add(dataTableOrphan);
                }

                if (tableGroupItems.Count() > 0)
                {
                    dataTable.Add("items", tableGroupItems);
                    treeItems.Add(dataTable);
                }

                return new RestData()
                {
                    data = treeItems
                };
            }
        }

        [HttpGet("tree-baselayers")]
        [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "mapId" })]
        public RestBase getMapBaseLayersTree([FromQuery] int mapId)
        {
            if (mapId == 0)
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            else
            {
                using var session = OpenSession();
                IEnumerable<MapBaseLayers> mapBaseLayers = session.Find<MapBaseLayers>(statement => statement
                    .Include<BaseLayer>(join => join.InnerJoin())
                    .Where($"{Sql.Entity<MapBaseLayers>(x => x.map_id):TC} = @id")
                    .WithParameters(new { id = mapId })
                    .OrderBy($"{Sql.Entity<MapBaseLayers>(p => p.order):TC}")
                );

                List<IDictionary<string, object>> children = new List<IDictionary<string, object>>();
                foreach (var mapBaseLayer in mapBaseLayers)
                {
                    IDictionary<string, object> child = new Dictionary<string, object>
                            {
                                { "id", $"base_{mapBaseLayer.baseLayer?.id}"},
                                { "text", mapBaseLayer.baseLayer?.name ?? "" },
                                { "raw", mapBaseLayer.baseLayer },
                                { "type", "@BaseLayer"},
                                { "selected", mapBaseLayer.visible }
                            };
                    children.Add(child);
                }
                IDictionary<string, object> baseGroup = new Dictionary<string, object>
                        {
                            { "id", $"g_BaseLayers"},
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

        [HttpGet("base-layers/{id}")]
        public RestBase getMapBaseLayers([FromRoute] int id, [FromForm] DxGridDTO dto)
        {
            if (id == 0)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    IEnumerable<MapBaseLayers> mapBaseLayers = session.Find<MapBaseLayers>(statement => statement
                        .Where($"{Sql.Entity<MapBaseLayers>(x => x.map_id):TC} = @id")
                        .WithParameters(new { id = id })
                    );
                    List<BaseLayer> baseLayers = new List<BaseLayer>();
                    int totalCount = session.Count<BaseLayer>(stm => stm
                        .Where($"{Sql.Entity<BaseLayer>(x => x.id):TC} = ANY(@base_layer_ids)")
                        .WithParameters(new { base_layer_ids = mapBaseLayers.Select(x => x.base_layer_id).ToArray() }));
                    if (dto.take == 0)
                    {
                        baseLayers = session.Find<BaseLayer>(stm => stm
                            .Where($"{Sql.Entity<BaseLayer>(x => x.id):TC} = ANY(@base_layer_ids)")
                            .WithParameters(new { base_layer_ids = mapBaseLayers.Select(x => x.base_layer_id).ToArray() })
                            .OrderBy($"{Sql.Entity<BaseLayer>(x => x.id):TC}")
                        ).ToList();
                    }
                    else
                    {
                        baseLayers = session.Find<BaseLayer>(stm => stm
                            .Where($"{Sql.Entity<BaseLayer>(x => x.id):TC} = ANY(@base_layer_ids)")
                            .WithParameters(new { base_layer_ids = mapBaseLayers.Select(x => x.base_layer_id).ToArray() })
                            .OrderBy($"{Sql.Entity<BaseLayer>(x => x.id):TC}")
                        ).Skip(dto.skip).Take(dto.take).ToList();
                    }
                    baseLayers.ForEach(b =>
                    {
                        b.visible = mapBaseLayers.FirstOrDefault(o => o.base_layer_id == b.id)?.visible ?? b.visible;
                    });
                    return new RestPagedDataTable
                    {
                        data = baseLayers,
                        recordsTotal = totalCount
                    };
                }
            }
        }

        [HttpGet("layers/{id}")]
        public RestBase getMapLayers([FromRoute] int id, [FromForm] DxGridDTO dto)
        {
            if (id == 0)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    IEnumerable<MapLayers> mapLayers = session.Find<MapLayers>(statement => statement
                        .Where($"{Sql.Entity<MapLayers>(x => x.map_id):TC} = @id")
                        .WithParameters(new { id = id })
                    );
                    List<Layer> layers = new List<Layer>();
                    int totalCount = session.Count<Layer>(statement => statement
                        .Where($"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layer_ids)")
                        .WithParameters(new
                        {
                            layer_ids = mapLayers.Select(x => x.layer_id).ToArray()
                        })
                    );

                    if (dto.take == 0)
                    {
                        layers = session.Find<Layer>(statement => statement
                            .Where($"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layer_ids)")
                            .Include<TableInfo>(join => join.InnerJoin())
                            .Include<TableColumn>(join => join.InnerJoin())
                            .Include<LayerClassify>(join => join.LeftOuterJoin())
                            .WithParameters(new
                            {
                                layer_ids = mapLayers.Select(x => x.layer_id).ToArray()
                            })
                            .OrderBy($@"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC}, 
                                {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC}, 
                                {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).ToList();
                    }
                    else
                    {
                        layers = session.Find<Layer>(statement => statement
                            .Where($"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layer_ids)")
                            .Include<TableInfo>(join => join.InnerJoin())
                            .Include<TableColumn>(join => join.InnerJoin())
                            .Include<LayerClassify>(join => join.LeftOuterJoin())
                            .WithParameters(new
                            {
                                layer_ids = mapLayers.Select(x => x.layer_id).ToArray()
                            })
                            .OrderBy($@"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC}, 
                                {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC}, 
                                {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).Skip(dto.skip).Take(dto.take).ToList();
                    }
                    return new RestPagedDataTable
                    {
                        data = layers,
                        recordsTotal = totalCount
                    };
                }
            }
        }

        [HttpGet("tables/{id}")]
        public RestBase getMapTables([FromRoute] int id, [FromForm] DxGridDTO dto)
        {
            if (id == 0)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    IEnumerable<MapTables> mapTables = session.Find<MapTables>(statement => statement
                        .Where($"{Sql.Entity<MapTables>(x => x.map_id):TC} = @id")
                        .WithParameters(new { id = id })
                    );
                    List<TableInfo> tables = new List<TableInfo>();
                    int totalCount = session.Count<TableInfo>(statement => statement
                        .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = ANY(@table_ids)")
                        .WithParameters(new
                        {
                            table_ids = mapTables.Select(x => x.table_id).ToArray()
                        })
                    );
                    if (dto.take == 0)
                    {
                        tables = session.Find<TableInfo>(statement => statement
                            .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = ANY(@table_ids)")
                            .Include<TableColumn>(join => join.InnerJoin())
                            .WithParameters(new
                            {
                                table_ids = mapTables.Select(x => x.table_id).ToArray()
                            })
                            .OrderBy($@"{Sql.Entity<TableInfo>(x => x.order):TC}, {Sql.Entity<TableInfo>(x => x.name_vn):TC}, 
                                {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC}, 
                                {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).ToList();
                    }
                    else
                    {
                        tables = session.Find<TableInfo>(statement => statement
                            .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = ANY(@table_ids)")
                            .Include<TableColumn>(join => join.InnerJoin())
                            .WithParameters(new
                            {
                                table_ids = mapTables.Select(x => x.table_id).ToArray()
                            })
                            .OrderBy($@"{Sql.Entity<TableInfo>(x => x.order):TC}, {Sql.Entity<TableInfo>(x => x.name_vn):TC}, 
                                {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC}, 
                                {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).Skip(dto.skip).Take(dto.take).ToList();
                    }
                    return new RestPagedDataTable
                    {
                        data = tables,
                        recordsTotal = totalCount
                    };
                }
            }
        }

        [HttpGet("regions-tree/{id}")]
        public RestBase GetMapRegionsTree([FromRoute] int id)
        {
            if (id == 0)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    IEnumerable<MapRegion> mapRegions = session.Find<MapRegion>(statement => statement
                        .Where($"{Sql.Entity<MapRegion>(x => x.map_id):TC} = @id")
                        .WithParameters(new { id = id })
                    );
                    return new RestData
                    {
                        data = session.Find<Province>()
                            .Select(x => new
                            {
                                id = x.area_id,
                                text = x.name_vn,
                                expanded = true,
                                selected = mapRegions.Any(p => p.area_code == x.area_id),
                                raw = x
                            }).ToList()
                    };
                }
            }
        }

        [HttpGet("base-layers-tree/{id}")]
        public RestBase GetMapBaseLayers([FromRoute] int id)
        {
            using var session = OpenSession();

            if (id == 0)
            {
                return new RestData
                {
                    data = session.Find<BaseLayer>()
                        .Select(x => new
                        {
                            id = x.id,
                            text = x.name,
                            expanded = true,
                            selected = false,
                            is_visible = x.visible,
                            raw = x
                        }).ToList()
                };
            }
            else
            {
                IEnumerable<MapBaseLayers> mapBaseLayers = session.Find<MapBaseLayers>(statement => statement
                    .Where($"{Sql.Entity<MapBaseLayers>(x => x.map_id):TC} = @id")
                    .WithParameters(new { id = id })
                );
                return new RestData
                {
                    data = session.Find<BaseLayer>()
                        .Select(x => new
                        {
                            id = x.id,
                            text = x.name,
                            expanded = true,
                            selected = mapBaseLayers.Any(p => p.base_layer_id == x.id),
                            is_visible = mapBaseLayers.FirstOrDefault(p => p.base_layer_id == x.id)?.visible,
                            raw = x
                        }).ToList()
                };
            }
        }

        [HttpGet("layers-tree/{id}")]
        public RestBase getMapLayersTree([FromRoute] int id)
        {
            using var session = OpenSession();

            if (id == 0)
            {
                return new RestData
                {
                    data = session.Find<Layer>(statement => statement
                        .Include<TableInfo>()
                        .Include<TableSchema>()
                        .Where($"{Sql.Entity<TableSchema>():T}.is_active = TRUE")
                            )
                            .GroupBy(x => x.table?.table_schema_info?.description ?? "Khác")
                            .Select(x => new
                            {
                                id = x.Key,
                                text = x.Key,
                                expanded = true,
                                items = x.Select(o => new
                                {
                                    id = $"l_{o.id}",
                                    text = o.name_vn,
                                    selected = false,
                                    raw = o
                                })
                            }).ToList()
                };
            }
            else
            {
                IEnumerable<MapLayers> mapLayers = session.Find<MapLayers>(statement => statement
                    .Where($"{Sql.Entity<MapLayers>(x => x.map_id):TC} = @id")
                    .WithParameters(new { id = id })
                );
                return new RestData
                {
                    data = session.Find<Layer>(statement => statement
                        .Include<TableInfo>()
                        .Include<TableSchema>()
                        .Where($"{Sql.Entity<TableSchema>():T}.is_active = TRUE")
                        )
                        .GroupBy(x => x.table?.table_schema_info?.description ?? "Khác")
                        .Select(x => new
                        {
                            id = x.Key,
                            text = x.Key,
                            expanded = true,
                            items = x.Select(o => new
                            {
                                id = $"l_{o.id}",
                                text = o.name_vn,
                                selected = mapLayers.Any(p => p.layer_id == o.id),
                                raw = o
                            })
                        }).ToList()
                };
            }
        }

        [HttpGet("tables-tree/{id}")]
        public RestBase getMapTablesTree([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                IEnumerable<MapTables> mapTables = session.Find<MapTables>(statement => statement
                    .Where($"{Sql.Entity<MapTables>(x => x.map_id):TC} = @id")
                    .WithParameters(new { id = id })
                );
                return new RestData
                {
                    data = session.Find<TableInfo>(statement => statement
                        .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} NOT IN (SELECT {Sql.Entity<Layer>(x => x.table_info_id):TC} FROM {Sql.Entity<Layer>():T})")
                        .Include<TableSchema>()
                        .Where($"{Sql.Entity<TableSchema>():T}.is_active = TRUE")
                        )
                        .GroupBy(x => x.table_schema_info.description)
                        .Select(x => new
                        {
                            id = x.Key,
                            text = x.Key,
                            expanded = true,
                            items = x.Select(o => new
                            {
                                id = $"l_{o.id}",
                                text = o.name_vn,
                                selected = mapTables.Any(p => p.table_id == o.id),
                                raw = o
                            })
                        }).ToList()
                };
            }
        }

        [HttpPost("export/templates")]
        public IActionResult exportMapTemplates([FromForm] int id)
        {
            if (id == 0)
                return NotFound();
            using (var session = OpenSession())
            {
                Map? map = session.Get(new Map { id = id });
                if (map == null)
                    return NotFound();
                map.mapBaseLayers = session.Find<MapBaseLayers>(stm => stm
                        .Where($"{Sql.Entity<MapBaseLayers>(x => x.map_id):TC} = @id")
                        .WithParameters(map)
                    ).ToList();
                map.mapLayers = session.Find<MapLayers>(stm => stm
                    .Where($"{Sql.Entity<MapLayers>(x => x.map_id):TC} = @id")
                    .WithParameters(map)
                ).ToList();
                map.mapTables = session.Find<MapTables>(stm => stm
                    .Where($"{Sql.Entity<MapTables>(x => x.map_id):TC} = @id")
                    .WithParameters(map)
                ).ToList();

                using (var ms = new MemoryStream())
                {
                    using var streamWriter = new StreamWriter(ms);
                    using var jsonWriter = new JsonTextWriter(streamWriter);
                    JsonSerializer.CreateDefault().Serialize(jsonWriter, map);
                    jsonWriter.Flush();
                    ms.Position = 0;
                    return File(ms.ToArray(), "text/plain", "mapTemplates");
                }
            }
        }

        [HttpGet]
        [Route("{schema}/{z}/{x}/{y}.pbf")]
        [Produces("application/x-protobuf")]
        public FileContentResult all([FromRoute] string schema, [FromRoute] long x, [FromRoute] long y, [FromRoute] int z)
        {
            using (var session = OpenSession())
            {
                var env = TileHelper.tileToEnvelope(x, y, z);

                var layers = session.Find<Layer>(statement => statement
                    .Include<TableInfo>(join => join.InnerJoin())
                    .Where($"{nameof(TableInfo.table_schema)} = '{schema}'")
                );

                List<string> sql = new List<string>();
                foreach (var layer in layers)
                {
                    sql.Add($@"
                        SELECT
                        id,
                        {layer.id} AS layer_id,
                        ST_AsMVTGeom(
                            geom,
                            ST_MakeEnvelope(@xmin, @ymin, @xmax, @ymax, 4326),
                            4096,
                            512,
                            false
                        ) geom
                        FROM {layer.table.table_schema}.{layer.table.table_name}
                        WHERE (geom && ST_MakeEnvelope(@xmin, @ymin, @xmax, @ymax, 4326))
                    ");
                }
                string sAll = $@"SELECT ST_AsMVT(q, 'pois', 4096, 'geom') FROM({String.Join(" UNION ALL ", sql)}) AS q";
                var tileData = session.Query<byte[]>(sAll, new
                {
                    xmin = env["xmin"],
                    xmax = env["xmax"],
                    ymin = env["ymin"],
                    ymax = env["ymax"]
                }).FirstOrDefault();

                return new FileContentResult(tileData, "application/x-protobuf");
            }
        }

        [HttpGet]
        [Route("poi/{z}/{x}/{y}.pbf")]
        [Produces("application/x-protobuf")]
        public FileContentResult poi([FromRoute] long x, [FromRoute] long y, [FromRoute] int z)
        {
            using (var session = OpenSession())
            {
                var env = TileHelper.tileToEnvelope(x, y, z);

                var tileData = session.Query<byte[]>($@"
                    SELECT ST_AsMVT(q, 'pois', 4096, 'geom') FROM
                    (SELECT
                        id, buaname_vn,
                        ST_AsMVTGeom(
                            geom,
                            ST_MakeEnvelope(@xmin, @ymin, @xmax, @ymax, 4326),
                            4096,
                            512,
                            false
                            ) geom
                            FROM pois
                            WHERE (geom && ST_MakeEnvelope(@xmin, @ymin, @xmax, @ymax, 4326) AND level_zoom <= {z - 15} AND level_zoom > 0 
                        )
                    ) AS q
                ", new
                {
                    xmin = env["xmin"],
                    xmax = env["xmax"],
                    ymin = env["ymin"],
                    ymax = env["ymax"]
                }).FirstOrDefault();

                return new FileContentResult(tileData, "application/x-protobuf");
            }
        }

        [HttpGet]
        [Route("mvt/{layer_id}/{z}/{x}/{y}.pbf")]
        [Produces("application/x-protobuf")]
        public FileContentResult mvt([FromRoute] int layer_id, [FromRoute] long x, [FromRoute] long y, [FromRoute] int z)
        {
            using (var session = OpenSession())
            {
                // var layer = getLayerWithTable(layer_id);
                // var env = TileHelper.tileToEnvelope(x, y, z);
                var tileData = session.Query<byte[]>($@"
                    SELECT * FROM get_layer_mvt({layer_id}, {z}, {x}, {y})
                ", new
                {
                    z = (int)z,
                    x = (int)x,
                    y = (int)y,
                    // xmin = env["xmin"],
                    // xmax = env["xmax"],
                    // ymin = env["ymin"],
                    // ymax = env["ymax"]
                }).FirstOrDefault();
                return new FileContentResult(tileData, "application/x-protobuf");
            }
        }

        [HttpGet]
        [Route("wfs/{layer_id}")]
        public string wfs([FromRoute] int layer_id, [FromQuery] int? maxFeatures = -1,
            [FromQuery] string? bbox = "",
            [FromQuery] string? f = "json")
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            var layer = getLayerWithTableAndColumn(layer_id);
            if (layer == null)
                return geojsonWriter.Write(new FeatureCollection());
            if (layer.table.columns.Any(x => "geom".Equals(x.column_name)) == false)
                return geojsonWriter.Write(new FeatureCollection());
            using (var session = OpenSession())
            {
                var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                var labelColumn = layer.table.label_column ?? keyColumn;
                string sql =
                    @$"SELECT {keyColumn.column_name}, {labelColumn.column_name} AS label, {layer.id} AS layer_id, ST_AsGeoJSON(geom) AS geom_text FROM {layer.table.table_schema}.{layer.table.table_name}";
                if (string.IsNullOrWhiteSpace(bbox) == false)
                {
                    double[] env = bbox.Split(',').Select(x => double.Parse(x)).ToArray();
                    sql += $" WHERE geom && ST_MakeEnvelope({env[0]},{env[1]},{env[2]},{env[3]}, 4326) ";
                }
                if (maxFeatures != -1)
                {
                    sql += $" LIMIT {maxFeatures}";
                }
                var result = session
                    .Query(sql)
                    .ToList();
                FeatureCollection features = new FeatureCollection();
                foreach (IDictionary<string, object> record in result)
                {
                    if (record.ContainsKey("geom_text") && record["geom_text"] != null)
                    {
                        IFeature feature = new Feature();
                        feature.Attributes = new AttributesTable();
                        foreach (var attr in record)
                        {
                            if (attr.Key != "geom_text")
                            {
                                feature.Attributes.Add(attr.Key, attr.Value);
                            }
                        }
                        feature.Geometry = geojsonReader.Read<Geometry>(record["geom_text"]?.ToString());
                        features.Add(feature);
                    }
                }

                return geojsonWriter.Write(features);
            }
        }

        [HttpGet]
        [Route("extent/{layer_id}")]
        public string extent([FromRoute] int layer_id, [FromQuery] int? maxFeatures = -1,
            [FromQuery] string? bbox = "",
            [FromQuery] string? f = "json")
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            var layer = getLayerWithTableAndColumn(layer_id);
            if (layer == null)
                return geojsonWriter.Write(new FeatureCollection());
            if (layer.table.columns.Any(x => "geom".Equals(x.column_name)) == false)
                return geojsonWriter.Write(new FeatureCollection());
            using (var session = OpenSession())
            {
                var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                var labelColumn = layer.table.label_column ?? keyColumn;
                string sql = @$"SELECT ST_AsGeoJSON(ST_Extent(geom)) AS geom_text FROM {layer.table.table_schema}.{layer.table.table_name}";
                var result = session
                    .Query(sql)
                    .ToList();
                FeatureCollection features = new FeatureCollection();
                foreach (IDictionary<string, object> record in result)
                {
                    if (record.ContainsKey("geom_text") && record["geom_text"] != null)
                    {
                        IFeature feature = new Feature();
                        feature.Attributes = new AttributesTable();
                        foreach (var attr in record)
                        {
                            if (attr.Key != "geom_text")
                            {
                                feature.Attributes.Add(attr.Key, attr.Value);
                            }
                        }
                        feature.Geometry = geojsonReader.Read<Geometry>(record["geom_text"]?.ToString());
                        features.Add(feature);
                    }
                }

                return geojsonWriter.Write(features);
            }
        }

        [HttpPost("wfs")]
        public async Task<JsonResult> wfs([FromForm] WFSParameter dto)
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            if (string.IsNullOrWhiteSpace(dto.layers))
            {
                return new JsonResult(JsonConvert.DeserializeObject(geojsonWriter.Write(new FeatureCollection())));
            }
            using (var session = OpenSession())
            {
                var layerInfos = (await session.FindAsync<Layer>(statement => statement
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>()
                    .Include<TableColumn>()
                    .Where($"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layer_ids)")
                    .WithParameters(new { layer_ids = dto.layers.Split(",").Select(x => int.Parse(x)).ToArray() })
                )).ToList();

                List<string> sql = new List<string>();
                List<double> env = new List<double>();
                if (string.IsNullOrWhiteSpace(dto.bbox) == false)
                {
                    env = dto.bbox.Split(',').Select(x => double.Parse(x, CultureInfo.InvariantCulture)).ToList();
                }

                foreach (var layer in layerInfos)
                {
                    var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                    var labelColumn = layer.table.label_column ?? keyColumn;
                    string geomCol = "geom";
                    //if (layer.geometry == "Polygon")
                    //{
                    //    geomCol = "ST_SimplifyPreserveTopology(geom, 0.1) AS geom";
                    //}
                    string condition = "(1=1)";
                    if (!String.IsNullOrWhiteSpace(dto.layerFilterIds) && dto.@params != null)
                    {
                        var param = JsonConvert.DeserializeObject<Dictionary<string, object>>(dto.@params);
                        if (dto.layerFilterIds.Split(",").Contains(layer.id.ToString()))
                        {
                            condition = getConditions(layer.table, param);
                        }
                    }
                    if (!User.IsInRole(EnumRoles.SA))
                    {
                        var userRegions = session.Find<UserRegion>(statement => statement
                               .Where($"{nameof(UserRegion.user_id)} = @id")
                               .WithParameters(new { id = getUserId() })
                               .Include<District>(x => x.LeftOuterJoin())
                            ).ToList();
                        if (userRegions != null && userRegions.Count() > 0)
                        {
                            // if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                            // {
                            //     condition += @$" AND ({layer.table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))}) OR {layer.table.table_name}.district_code IS NULL OR {layer.table.table_name}.district_code = '')";
                            // }
                            if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                            {
                                condition += $" AND (\"{layer.table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".district_code IS NULL OR \"{layer.table.table_name}\".district_code = '')";
                            }
                            if (layer.table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                            {
                                condition += $" AND (\"{layer.table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".commune_code IS NULL OR \"{layer.table.table_name}\".commune_code = '')";
                            }
                        }
                        else
                        {
                            condition = "(1=0)";
                        }
                    }
                    string iSql = @$"SELECT CONCAT({layer.id}, '_', {keyColumn?.column_name}) AS id, 
                        CAST({keyColumn?.column_name} AS TEXT) AS fid, 
                        CAST({labelColumn?.column_name} AS TEXT) AS label, 
                        {layer.id} AS layer_id, 
                        '{layer.name_vn}' AS layer_name, 
                        NULL AS classify_value, 
                        {geomCol} 
                        FROM {layer.table.table_schema}.{layer.table.table_name}";

                    if (layer.classify_column != null)
                    {
                        if (!string.IsNullOrWhiteSpace(dto.classifies))
                        {
                            var conditionClassify = @$"{Sql.Entity<LayerClassify>(x => x.layer_id):TC} = {layer.id} AND {Sql.Entity<LayerClassify>(x => x.value):TC} = ANY(@classifies)";
                            var layerClassifies = (await session.FindAsync<LayerClassify>(statement => statement
                                .Where($"{conditionClassify}")
                                .WithParameters(new { classifies = dto.classifies.Split(",").ToArray() })
                            )).ToList();
                            var classifyValue = layerClassifies.Select(x => "'" + x.value + "'").ToList();
                            if (layerClassifies != null && layerClassifies.Count() > 0)
                            {
                                condition += $" AND {layer.classify_column.column_name} IN ({string.Join(",", classifyValue)})";
                            }
                        }
                        iSql = @$"SELECT CONCAT({layer.id}, '_', {keyColumn?.column_name}) AS id, 
                            CAST({keyColumn?.column_name} AS TEXT) AS fid, 
                            CAST({labelColumn?.column_name} AS TEXT) AS label, 
                            {layer.id} AS layer_id, 
                            '{layer.name_vn}' AS layer_name, 
                            {layer.classify_column.column_name} AS classify_value, 
                            {geomCol} 
                            FROM {layer.table.table_schema}.{layer.table.table_name}";
                    }

                    if (env.Count > 0)
                    {
                        condition += $" AND ST_Intersects(geom, ST_MakeEnvelope({env[0]},{env[1]},{env[2]},{env[3]}, 4326))";
                    }

                    if (string.IsNullOrWhiteSpace(dto.filterGeometry) == false)
                    {
                        condition += $" AND ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON('{dto.filterGeometry}'), 4326))";
                    }

                    iSql = iSql + " WHERE " + condition;
                    if (dto.maxFeatures >= 0)
                    {
                        iSql += $" LIMIT {dto.maxFeatures}";
                    }
                    sql.Add($"({iSql})");
                }

                string rawSql = string.Join(" UNION ALL ", sql);

                if (dto.maxFeatures >= 0 && layerInfos.Count() > 1)
                {
                    rawSql += $" LIMIT {dto.maxFeatures}";
                }

                rawSql = $@"
                    SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature))
                    FROM (
                        SELECT 
                            jsonb_build_object('type', 'Feature', 'id', id, 'geometry', ST_AsGeoJSON(geom)::jsonb, 'properties', to_jsonb(inputs) - 'id' - 'geom') AS feature 
                        FROM ({rawSql}) AS inputs
                    ) features;
                ";
                // _logger.LogInformation(rawSql);
                // Console.WriteLine(rawSql);
                var data = JsonConvert.DeserializeObject<WFSViewModel>((await session.QueryAsync<string>(rawSql)).FirstOrDefault());
                if (data != null && data.features == null)
                {
                    data.features = new object[] { };
                }
                return new JsonResult(data);
            }
        }

        [HttpPost("wfsflb")]
        public async Task<FileContentResult> wfsFlatGeoBuf([FromForm] WFSParameter dto)
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            if (string.IsNullOrWhiteSpace(dto.layers))
            {
                return File(new byte[] { }, "application/octet-stream");
            }
            using (var session = OpenSession())
            {
                var layerInfos = (await session.FindAsync<Layer>(statement => statement
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>()
                    .Include<TableColumn>()
                    .Where($"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layer_ids)")
                    .WithParameters(new { layer_ids = dto.layers.Split(",").Select(x => int.Parse(x)).ToArray() })
                )).ToList();
                List<string>? layerFilters = dto.layerFilterIds?.Split(",").ToList().Where(o =>
                {
                    return int.TryParse(o, out int n);
                }).ToList();

                if (layerFilters == null || layerFilters.Count() == 0)
                {
                    layerFilters = layerInfos.Select(o => o.id.ToString()).ToList();
                }

                List<string> sql = new List<string>();
                List<double> env = new List<double>();

                if (string.IsNullOrWhiteSpace(dto.bbox) == false)
                {
                    env = dto.bbox.Split(',').Select(x => double.Parse(x, CultureInfo.InvariantCulture)).ToList();
                }

                var user = await _workContext.GetCurrentUser();

                foreach (var layer in layerInfos)
                {
                    var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                    var labelColumn = layer.table.label_column ?? keyColumn;
                    var labelExp = string.IsNullOrWhiteSpace(layer.label_expression) == false ? layer.label_expression : labelColumn?.column_name;
                    string geomCol = "geom";
                    //if (layer.geometry == "Polygon")
                    //{
                    //    geomCol = "ST_SimplifyPreserveTopology(geom, 0.1) AS geom";
                    //}
                    string condition = "(1=1)";
                    condition += " AND geom IS NOT NULL";
                    if (dto.@params != null && layerFilters.Contains(layer.id.ToString()))
                    {
                        var param = JsonConvert.DeserializeObject<Dictionary<string, object>>(dto.@params);
                        condition = getConditions(layer.table, param);
                    }

                    if (!(User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)))
                    {
                        var userRegions = session.Find<UserRegion>(statement => statement
                            .Where($"{nameof(UserRegion.user_id)} = @id")
                            .WithParameters(new { id = getUserId() })
                            .Include<District>(x => x.LeftOuterJoin())
                        ).ToList();
                        if (userRegions != null && userRegions.Count() > 0)
                        {
                            // if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                            // {
                            //     condition += @$" AND ({layer.table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))}) OR {layer.table.table_name}.district_code IS NULL OR {layer.table.table_name}.district_code = '')";
                            // }
                            if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                            {
                                condition += $" AND (\"{layer.table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".district_code IS NULL OR \"{layer.table.table_name}\".district_code = '')";
                            }
                            if (layer.table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                            {
                                condition += $" AND (\"{layer.table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".commune_code IS NULL OR \"{layer.table.table_name}\".commune_code = '')";
                            }
                        }
                        else
                        {
                            condition = "(1=0)";
                        }
                        if (User.IsInRole(EnumRoles.ADMINISTRATOR) == false)
                        {
                            if (layer.table.columns.Any(o => o.column_name == "is_approved"))
                            {
                                condition = $"(is_approved = TRUE OR created_by = '{user?.UserName}')";
                            }
                        }
                    }
                    string iSql = @$"SELECT
                        {layer.id} AS layer_id, 
                        '{layer.name_vn}' AS layer_name, 
                        CONCAT({layer.id}, '_', {keyColumn?.column_name}) AS id, 
                        {keyColumn?.column_name}::TEXT AS fid, 
                        COALESCE(({labelExp})::TEXT, '') AS label, 
                        ''::TEXT AS classify_value,
                        {geomCol} 
                        FROM ""{layer.table.table_schema}"".""{layer.table.table_name}""";

                    if (layer.classify_column != null)
                    {
                        if (string.IsNullOrWhiteSpace(dto.classifies) == false)
                        {
                            var conditionClassify = @$"{Sql.Entity<LayerClassify>(x => x.layer_id):TC} = {layer.id} AND {Sql.Entity<LayerClassify>(x => x.value):TC} = ANY(@classifies)";
                            var layerClassifies = (await session.FindAsync<LayerClassify>(statement => statement
                                .Where($"{conditionClassify}")
                                .WithParameters(new { classifies = dto.classifies.Split(",").ToArray() })
                            )).ToList();
                            var classifyValue = layerClassifies.Select(x => "'" + x.value + "'").ToList();
                            if (layerClassifies != null && layerClassifies.Count() > 0)
                            {
                                condition += $" AND {layer.classify_column.column_name} IN ({string.Join(",", classifyValue)})";
                            }
                        }
                        iSql = @$"SELECT
                            {layer.id} AS layer_id, 
                            '{layer.name_vn}' AS layer_name, 
                            CONCAT({layer.id}, '_', {keyColumn?.column_name}) AS id, 
                            {keyColumn?.column_name}::TEXT AS fid, 
                            COALESCE(({labelExp})::TEXT, '') AS label, 
                            ""{layer.classify_column.column_name}""::TEXT AS classify_value, 
                            {geomCol} 
                            FROM ""{layer.table.table_schema}"".""{layer.table.table_name}""";
                    }

                    if (env.Count > 0)
                    {
                        condition += $" AND ST_Intersects(geom, ST_MakeEnvelope({env[0]},{env[1]},{env[2]},{env[3]}, 4326))";
                    }

                    if (string.IsNullOrWhiteSpace(dto.filterGeometry) == false)
                    {
                        condition += $" AND ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON('{dto.filterGeometry}'), 4326))";
                    }

                    iSql = iSql + " WHERE " + condition;
                    if (dto.maxFeatures >= 0)
                    {
                        iSql += $" LIMIT {dto.maxFeatures}";
                    }
                    sql.Add($"({iSql})");
                }

                string rawSql = string.Join(" UNION ALL ", sql);

                if (dto.maxFeatures >= 0 && layerInfos.Count() > 1)
                {
                    rawSql += $" LIMIT {dto.maxFeatures}";
                }

                rawSql = $@"
                    SELECT 
                        ST_AsFlatGeobuf(inputs, false, 'geom') AS feature 
                    FROM ({rawSql}) AS inputs;
                ";
                // _logger.LogInformation(rawSql);
                var buffer = session.Query<byte[]>(rawSql).FirstOrDefault();
                return File(buffer ?? [], "application/octet-stream");
            }
        }

        [HttpPost("wfsGeoBuf")]
        public async Task<FileContentResult> wfsGeoBuf([FromForm] WFSParameter dto)
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            if (string.IsNullOrWhiteSpace(dto.layers))
            {
                return File(new byte[] { }, "application/protobuf");
            }
            using (var session = OpenSession())
            {
                var layerInfos = (await session.FindAsync<Layer>(statement => statement
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>()
                    .Include<TableColumn>()
                    .Where($"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layer_ids)")
                    .WithParameters(new { layer_ids = dto.layers.Split(",").Select(x => int.Parse(x)).ToArray() })
                )).ToList();

                List<string> sql = new List<string>();
                List<double> env = new List<double>();
                if (string.IsNullOrWhiteSpace(dto.bbox) == false)
                {
                    env = dto.bbox.Split(',').Select(x => double.Parse(x, CultureInfo.InvariantCulture)).ToList();
                }

                foreach (var layer in layerInfos)
                {
                    var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                    var labelColumn = layer.table.label_column ?? keyColumn;
                    string geomCol = "geom";
                    //if (layer.geometry == "Polygon")
                    //{
                    //    geomCol = "ST_SimplifyPreserveTopology(geom, 0.1) AS geom";
                    //}
                    string condition = "(1=1)";
                    condition += " AND geom IS NOT NULL";
                    if (!String.IsNullOrWhiteSpace(dto.layerFilterIds) && dto.@params != null)
                    {
                        var param = JsonConvert.DeserializeObject<Dictionary<string, object>>(dto.@params);
                        if (dto.layerFilterIds.Split(",").Contains(layer.id.ToString()))
                        {
                            condition = getConditions(layer.table, param);
                        }
                    }
                    if (!User.IsInRole(EnumRoles.SA))
                    {
                        var userRegions = session.Find<UserRegion>(statement => statement
                               .Where($"{nameof(UserRegion.user_id)} = @id")
                               .WithParameters(new { id = getUserId() })
                               .Include<District>(x => x.LeftOuterJoin())
                            ).ToList();
                        if (userRegions != null && userRegions.Count() > 0)
                        {
                            // if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                            // {
                            //     condition += @$" AND ({layer.table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))}) OR {layer.table.table_name}.district_code IS NULL OR {layer.table.table_name}.district_code = '')";
                            // }
                            if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                            {
                                condition += $" AND (\"{layer.table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".district_code IS NULL OR \"{layer.table.table_name}\".district_code = '')";
                            }
                            if (layer.table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                            {
                                condition += $" AND (\"{layer.table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".commune_code IS NULL OR \"{layer.table.table_name}\".commune_code = '')";
                            }
                        }
                        else
                        {
                            condition = "(1=0)";
                        }
                    }
                    string iSql = @$"SELECT CONCAT({layer.id}, '_', {keyColumn?.column_name}) AS id, 
                        CAST({keyColumn?.column_name} AS TEXT) AS fid, 
                        CAST({labelColumn?.column_name} AS TEXT) AS label, 
                        {layer.id} AS layer_id, 
                        '{layer.name_vn}' AS layer_name, 
                        NULL AS classify_value, 
                        {geomCol} 
                        FROM {layer.table.table_schema}.{layer.table.table_name}";

                    if (layer.classify_column != null)
                    {
                        if (!string.IsNullOrWhiteSpace(dto.classifies))
                        {
                            var conditionClassify = @$"{Sql.Entity<LayerClassify>(x => x.layer_id):TC} = {layer.id} AND {Sql.Entity<LayerClassify>(x => x.value):TC} = ANY(@classifies)";
                            var layerClassifies = (await session.FindAsync<LayerClassify>(statement => statement
                                .Where($"{conditionClassify}")
                                .WithParameters(new { classifies = dto.classifies.Split(",").ToArray() })
                            )).ToList();
                            var classifyValue = layerClassifies.Select(x => "'" + x.value + "'").ToList();
                            if (layerClassifies != null && layerClassifies.Count() > 0)
                            {
                                condition += $" AND {layer.classify_column.column_name} IN ({string.Join(",", classifyValue)})";
                            }
                        }
                        iSql = @$"SELECT CONCAT({layer.id}, '_', {keyColumn?.column_name}) AS id, 
                            CAST({keyColumn?.column_name} AS TEXT) AS fid, 
                            CAST({labelColumn?.column_name} AS TEXT) AS label, 
                            {layer.id} AS layer_id, 
                            '{layer.name_vn}' AS layer_name, 
                            {layer.classify_column.column_name}::TEXT AS classify_value, 
                            {geomCol} 
                            FROM {layer.table.table_schema}.{layer.table.table_name}";
                    }

                    if (env.Count > 0)
                    {
                        condition += $" AND ST_Intersects(geom, ST_MakeEnvelope({env[0]},{env[1]},{env[2]},{env[3]}, 4326))";
                    }

                    if (string.IsNullOrWhiteSpace(dto.filterGeometry) == false)
                    {
                        condition += $" AND ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON('{dto.filterGeometry}'), 4326))";
                    }

                    iSql = iSql + " WHERE " + condition;
                    if (dto.maxFeatures >= 0)
                    {
                        iSql += $" LIMIT {dto.maxFeatures}";
                    }
                    sql.Add($"({iSql})");
                }

                string rawSql = string.Join(" UNION ALL ", sql);

                if (dto.maxFeatures >= 0 && layerInfos.Count() > 1)
                {
                    rawSql += $" LIMIT {dto.maxFeatures}";
                }

                rawSql = $@"
                    SELECT 
                        ST_AsGeoBuf(inputs, 'geom') AS feature 
                    FROM ({rawSql}) AS inputs;
                ";
                _logger.LogInformation(rawSql);
                var buffer = session.Query<byte[]>(rawSql).FirstOrDefault();
                return File(buffer ?? new byte[] { }, "application/protobuf");
            }
        }

        [HttpGet]
        [Route("wfs/{geometry}/{layers}/{z}")]
        public async Task<JsonResult> wfsGroup([FromRoute] string layers,
            [FromQuery] int maxFeatures = -1,
            [FromQuery] string bbox = "",
            [FromQuery] string classifies = "",
            [FromRoute] string geometry = "",
            [FromRoute] int z = -1,
            [FromQuery] string f = "json")
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            if (string.IsNullOrWhiteSpace(layers) || string.IsNullOrWhiteSpace(geometry))
                return new JsonResult(JsonConvert.DeserializeObject(geojsonWriter.Write(new FeatureCollection())));
            using (var session = OpenSession())
            {
                var layerInfos = (await session.FindAsync<Layer>(statement => statement
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Where($"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layer_ids)")
                    .WithParameters(new { layer_ids = layers.Split(",").Select(x => int.Parse(x)).ToArray() })
                    .Include<TableInfo>()
                    .Include<TableColumn>()
                )).ToList();
                if (string.IsNullOrWhiteSpace(geometry))
                {
                    layerInfos.Clear();
                }
                else
                {
                    if (geometry == "Point")
                    {
                        layerInfos = layerInfos.Where(x => x.geometry == "Point" || x.geometry == "MultiPoint").ToList();
                    }
                    else if (geometry == "LineString")
                    {
                        layerInfos = layerInfos.Where(x => x.geometry == "LineString" || x.geometry == "MultiLineString").ToList();
                    }
                    else if (geometry == "Polygon")
                    {
                        layerInfos = layerInfos.Where(x => x.geometry == "Polygon" || x.geometry == "MultiPolygon").ToList();
                    }
                }
                List<string> sql = new List<string>();
                List<double> env = new List<double>();
                if (string.IsNullOrWhiteSpace(bbox) == false)
                {
                    env = bbox.Split(',').Select(x => double.Parse(x)).ToList();
                }

                foreach (var layer in layerInfos)
                {
                    var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                    var labelColumn = layer.table.label_column ?? keyColumn;
                    string geomCol = "geom";
                    //if (layer.geometry == "Polygon")
                    //{
                    //    geomCol = "ST_SimplifyPreserveTopology(geom, 0.1) AS geom";
                    //}
                    string condition = "(1=1)";
                    if (!User.IsInRole(EnumRoles.SA))
                    {
                        var userRegions = session.Find<UserRegion>(statement => statement
                               .Where($"{nameof(UserRegion.user_id)} = @id")
                               .WithParameters(new { id = getUserId() })
                               .Include<District>(x => x.LeftOuterJoin())
                            ).ToList();
                        if (userRegions != null && userRegions.Count() > 0)
                        {
                            // if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null)
                            // {
                            //     condition += @$" AND ({layer.table.table_name}.district_code IN ({string.Join(",", userRegions.Select(o => $"'{o.district_code}'"))}) OR {layer.table.table_name}.district_code IS NULL OR {layer.table.table_name}.district_code = '')";
                            // }
                            if (layer.table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                            {
                                condition += $" AND (\"{layer.table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".district_code IS NULL OR \"{layer.table.table_name}\".district_code = '')";
                            }
                            if (layer.table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                            {
                                condition += $" AND (\"{layer.table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{layer.table.table_name}\".commune_code IS NULL OR \"{layer.table.table_name}\".commune_code = '')";
                            }
                        }
                        else
                        {
                            condition = "(1=0)";
                        }
                    }

                    string iSql = @$"SELECT CONCAT({layer.id}, '_', {keyColumn.column_name}) AS id, 
                            CAST({keyColumn.column_name} AS TEXT) AS fid, 
                            CAST({labelColumn.column_name} AS TEXT) AS label, 
                            {layer.id} AS layer_id, '{layer.name_vn}' AS layer_name, 
                            NULL AS classify_value, {geomCol} FROM {layer.table.table_schema}.{layer.table.table_name}";

                    if (layer.classify_column != null)
                    {
                        if (!string.IsNullOrEmpty(classifies))
                        {
                            var conditionClassify = @$"{Sql.Entity<LayerClassify>(x => x.layer_id):TC} = {layer.id} 
                                    AND {Sql.Entity<LayerClassify>(x => x.value):TC} IN ({classifies})";
                            var layerClassifies = (await session.FindAsync<LayerClassify>(statement => statement
                                .Where($"{conditionClassify}")
                            )).ToList();
                            var classifyValue = layerClassifies.Select(x => "'" + x.value + "'").ToList();
                            if (layerClassifies != null && layerClassifies.Count() > 0)
                            {
                                condition += $" AND {layer.classify_column.column_name} IN ({string.Join(",", classifyValue)})";
                            }
                        }
                        iSql = @$"SELECT CONCAT({layer.id}, '_', {keyColumn.column_name}) AS id, 
                                CAST({keyColumn.column_name} AS TEXT) AS fid, 
                                CAST({labelColumn.column_name} AS TEXT) AS label, 
                                {layer.id} AS layer_id, 
                                '{layer.name_vn}' AS layer_name, 
                                {layer.classify_column.column_name} AS classify_value, 
                                {geomCol} FROM {layer.table.table_schema}.{layer.table.table_name}";
                    }
                    // if (layer.geometry == "LineString" || layer.geometry == "Polygon")
                    // {
                    //     iSql = $"SELECT CONCAT({layer.id}, '_', {identityColumn.column_name}) AS id, CAST({identityColumn.column_name} AS TEXT) AS fid, CAST({labelColumn.column_name} AS TEXT) AS label, {layer.id} AS layer_id, '{layer.name_vn}' AS layer_name, ST_Simplify(geom, 1, FALSE) AS geom FROM \"{layer.table.table_schema}\".\"{layer.table.table_name}\"";
                    // }
                    if (env.Count > 0)
                    {
                        condition += $" AND ST_WithIn(geom, ST_MakeEnvelope({env[0]},{env[1]},{env[2]},{env[3]}, 4326))";
                    }
                    iSql = iSql + " WHERE " + condition;
                    if (maxFeatures >= 0)
                    {
                        iSql += $" LIMIT {maxFeatures}";
                    }
                    sql.Add($"({iSql})");
                }

                string rawSql = String.Join(" UNION ALL ", sql);

                if (maxFeatures >= 0 && layerInfos.Count() > 1)
                {
                    rawSql += $" LIMIT {maxFeatures}";
                }

                rawSql = $@"
                    SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature))
                    FROM (
                        SELECT jsonb_build_object('type', 'Feature', 'id', id, 'geometry', ST_AsGeoJSON(geom)::jsonb, 'properties', to_jsonb(inputs) - 'id' - 'geom') AS feature
                        FROM (
                            {rawSql}
                            ) inputs
                        ) features;
                ";
                var data = JsonConvert.DeserializeObject<IDictionary<string, object>>((await session.QueryAsync<string>(rawSql)).FirstOrDefault());
                if (data != null && data.ContainsKey("features") && data["features"] == null)
                {
                    data["features"] = new object[] { };
                }
                return new JsonResult(data);
            }
        }

        [HttpGet]
        [Route("wfsLinePolygon")]
        public JsonResult wfsLinePolygon([FromQuery] string layers,
            [FromQuery] int maxFeatures = -1,
            [FromQuery] string bbox = "",
            [FromQuery] string f = "json")
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            if (string.IsNullOrWhiteSpace(layers))
                return new JsonResult(geojsonWriter.Write(new FeatureCollection()));
            using (var session = OpenSession())
            {
                var layerInfos = session.Find<Layer>(statement => statement
                    .Where($"{Sql.Entity<Layer>(x => x.id):TC} IN ({layers}) AND ({Sql.Entity<Layer>(x => x.geometry):TC} = 'LineString' OR {Sql.Entity<Layer>(x => x.geometry):TC} = 'Polygon')")
                    .Include<TableInfo>()
                    .Include<TableColumn>()
                );
                List<string> sql = new List<string>();
                List<double> env = new List<double>();
                if (string.IsNullOrWhiteSpace(bbox) == false)
                {
                    env = bbox.Split(',').Select(x => double.Parse(x)).ToList();
                }

                foreach (var layer in layerInfos)
                {
                    var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                    var labelColumn = layer.table.label_column ?? keyColumn;
                    if (env.Count > 0)
                    {
                        sql.Add(@$"SELECT CONCAT({layer.id}, '_', {keyColumn.column_name}) AS id, CAST({keyColumn.column_name} AS TEXT) AS fid, CAST({labelColumn.column_name} AS TEXT) AS label, {layer.id} AS layer_id, ST_AsGeoJSON(geom) AS geom_text FROM {layer.table.table_schema}.{layer.table.table_name} WHERE geom && ST_MakeEnvelope({env[0]},{env[1]},{env[2]},{env[3]}, 4326)");
                    }
                    else
                    {
                        sql.Add(@$"SELECT CONCAT({layer.id}, '_', {keyColumn.column_name}) AS id, CAST({keyColumn.column_name} AS TEXT) AS fid, CAST({labelColumn.column_name} AS TEXT) AS label, {layer.id} AS layer_id, ST_AsGeoJSON(geom) AS geom_text FROM {layer.table.table_schema}.{layer.table.table_name}");
                    }
                }

                string rawSql = String.Join(" UNION ALL ", sql);

                // if (maxFeatures != -1)
                // {
                //     sql += $" LIMIT {maxFeatures}";
                // }
                var result = session
                    .Query(rawSql)
                    .ToList();
                FeatureCollection features = new FeatureCollection();
                foreach (IDictionary<string, object> record in result)
                {
                    if (record.ContainsKey("geom_text") && record["geom_text"] != null)
                    {
                        IFeature feature = new Feature();
                        feature.Attributes = new AttributesTable();
                        foreach (var attr in record)
                        {
                            if (attr.Key != "geom_text")
                            {
                                feature.Attributes.Add(attr.Key, attr.Value);
                            }
                        }
                        feature.Geometry = geojsonReader.Read<Geometry>(record["geom_text"]?.ToString());
                        features.Add(feature);
                    }
                }

                return new JsonResult(JsonConvert.DeserializeObject(geojsonWriter.Write(features)));
            }
        }

        [HttpGet]
        [Route("thematic/{layer_id}/{classify_field}")]
        public string thematic([FromRoute] int layer_id, [FromRoute] int classify_field, [FromQuery] int maxFeatures = -1,
         [FromQuery] string bbox = "",
         [FromQuery] string f = "json")
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            var layer = getLayerWithTableAndColumn(layer_id);
            if (layer == null)
                return geojsonWriter.Write(new FeatureCollection());
            if (layer.table.columns.Any(x => "geom".Equals(x.column_name)) == false)
                return geojsonWriter.Write(new FeatureCollection());
            using (var session = OpenSession())
            {
                var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                var labelColumn = layer.table.label_column ?? keyColumn;

                var classifyField = session.Find<TableColumn>(stm => stm
                                                .Where($"{nameof(TableColumn.lookup_table_id):C} = {classify_field} AND {nameof(TableColumn.table_id):C} = {layer.table_info_id}")).FirstOrDefault();

                string sql =
                    @$"SELECT {keyColumn.column_name}, {labelColumn.column_name} AS label, {classifyField?.column_name} as classifyValue, ST_AsGeoJSON(geom) AS geom_text FROM {layer.table.table_schema}.{layer.table.table_name}";
                if (string.IsNullOrWhiteSpace(bbox) == false)
                {
                    double[] env = bbox.Split(',').Select(x => double.Parse(x)).ToArray();
                    sql += $" AND geom && ST_MakeEnvelope({env[0]},{env[1]},{env[2]},{env[3]}, 4326)";
                }
                if (maxFeatures != -1)
                {
                    sql += $" LIMIT {maxFeatures}";
                }
                var result = session
                    .Query(sql)
                    .ToList();
                FeatureCollection features = new FeatureCollection();
                foreach (IDictionary<string, object> record in result)
                {
                    if (record.ContainsKey("geom_text") && record["geom_text"] != null)
                    {
                        IFeature feature = new Feature();
                        feature.Attributes = new AttributesTable();
                        foreach (var attr in record)
                        {
                            if (attr.Key != "geom_text")
                            {
                                feature.Attributes.Add(attr.Key, attr.Value);
                            }
                        }
                        feature.Geometry = geojsonReader.Read<Geometry>(record["geom_text"]?.ToString());
                        features.Add(feature);
                    }
                }

                return geojsonWriter.Write(features);
            }
        }

        private IEnumerable<TableRelation> getRelation(Layer layer)
        {
            using (var session = OpenSession())
            {
                string sss = $@"
                    SELECT * FROM {Sql.Entity<TableRelation>():T} AS tr 
                    INNER JOIN {Sql.Entity<TableColumn>():T} AS c
                        ON tr.{nameof(TableRelation.table_column_id)} = c.{nameof(TableColumn.id)}
                    INNER JOIN {Sql.Entity<TableColumn>():T} AS rc
                        ON tr.{nameof(TableRelation.relation_table_column_id)} = rc.{nameof(TableColumn.id)}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS t
                        ON tr.{nameof(TableRelation.table_id)} = t.{nameof(TableInfo.id)}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS m
                        ON tr.{nameof(TableRelation.mediate_table_id)} = m.{nameof(TableInfo.id)}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS rt
                        ON tr.{nameof(TableRelation.relation_table_id)} = rt.{nameof(TableInfo.id)}
                    WHERE tr.{nameof(TableRelation.table_id)} = {layer.table.id}";

                IEnumerable<TableRelation> relations = session.Query<TableRelation, TableColumn, TableColumn, TableInfo, TableInfo, TableInfo, TableRelation>(sss, (r, c, rc, t, m, rt) =>
                {
                    r.table_column = c;
                    r.relation_column = rc;
                    r.table = t;
                    r.mediate_table = m;
                    r.relation_table = rt;
                    return r;
                },
                    splitOn: $"{nameof(TableColumn.id)}, {nameof(TableColumn.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}");
                return relations;
            }
        }
    }
}