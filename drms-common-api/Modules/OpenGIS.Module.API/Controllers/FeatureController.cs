using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.IO;
using System;
using System.Collections.Generic;
using System.Linq;
using NetTopologySuite.Geometries;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.DTO.Mobile;
using OpenGIS.Module.Core.Models.Entities;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.DTO.Request;
using OfficeOpenXml;
using OpenGIS.Module.Core.Models.DevExtreme;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using OpenGIS.Module.Core.Repositories;
using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Repositories.Session;
using OpenGIS.Module.Core.Models.DTO;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure;
using OpenGIS.Module.Core.ViewModels;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using NetTopologySuite.IO.Streams;
using NetTopologySuite.Features;
using System.Text;
using ICSharpCode.SharpZipLib.Core;
using ICSharpCode.SharpZipLib.Zip;
using System.Data;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.Models.Entities.Maintenance.CayXanh;
using OpenGIS.Module.Core.Models.Entities.Maintenance.ChieuSang;
using OpenGIS.Module.Core.Models.Entities.Maintenance.ThoatNuoc;
using OpenGIS.Module.Core;
using Humanizer;
using OpenGIS.Module.Core.Extensions;
using VietGIS.Infrastructure.Web;
using VietGIS.Infrastructure.Identity.Services;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using EasyCaching.Core;
using Microsoft.Extensions.Logging;
using VietGIS.Infrastructure.Extensions;
using OpenGIS.Module.Core.Helpers;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_FEATURE))]
    public class FeatureController : BaseController
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        protected readonly IFeatureFileRepository _featureFileRepository;
        protected readonly ITableFileRepository _tableFileRepository;
        protected readonly IMapLayersRepository _mapLayersRepository;
        private readonly IWorkContext _workContext;
        private readonly IEmailSender _emailSender;
        private readonly IEasyCachingProvider _cacheProvider;
        private readonly ILogger<FeatureController> _logger;

        public FeatureController(
            IDbFactory dbFactory,
            IWebHostEnvironment hostingEnvironment,
            IFeatureFileRepository featureFileRepository,
            ITableFileRepository tableFileRepository,
            IMapLayersRepository mapLayersRepository,
            IWorkContext workContext,
            IEmailSender emailSender,
            IEasyCachingProviderFactory factory,
            ILogger<FeatureController> logger
        ) : base(dbFactory)
        {
            _featureFileRepository = featureFileRepository;
            _tableFileRepository = tableFileRepository;
            _hostingEnvironment = hostingEnvironment;
            _mapLayersRepository = mapLayersRepository;
            _workContext = workContext;
            _emailSender = emailSender;
            _cacheProvider = factory.GetCachingProvider("redis1");
            _logger = logger;
        }

        private const int DoubleLength = 18;
        private const int DoubleDecimals = 8;
        private const int IntLength = 10;
        private const int IntDecimals = 0;
        private const int StringLength = 254;
        private const int StringDecimals = 0;
        private const int BoolLength = 1;
        private const int BoolDecimals = 0;
        private const int DateLength = 8;
        private const int DateDecimals = 0;

        [HttpPost("add")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_FEATURE))]
        public async Task<RestBase> AddAsync([FromBody] DTOCreateFeature dto)
        {
            if (dto == null || (dto.layer_id == 0 && dto.table_id == 0))
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }

            Layer? layer = getLayerWithTableAndColumn(dto.layer_id);
            TableInfo? table = layer != null ? layer.table : getTableAndColumns(dto.table_id);

            var user = await _workContext.GetCurrentUser();
            var userInfo = _workContext.GetCurrentUserInfo();
            bool bypassApprove = User.IsInRole(VietGIS.Infrastructure.Enums.EnumRoles.SA) || (userInfo?.bypass_approve ?? false);

            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                if (table == null)
                {
                    return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                else
                {
                    IEnumerable<TableRelation> relations = getRelations(table);
                    IEnumerable<TableColumn> columns = table.columns
                        .Where(x => !x.is_identity)
                        .Where(x => !x.column_name.Contains("geom"))
                        .Where(x => x.column_name != "is_approved")
                    ;
                    List<string> fields = new List<string>();
                    List<string> dbParams = new List<string>();
                    IDictionary<string, object> cleanAttributes = new Dictionary<string, object>();

                    TableColumn? keyColumn = table.identity_column ?? table.key_column;
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        columns.ToList().ForEach(col =>
                        {
                            if (dto.attributes.Keys.Contains(col.column_name))
                            {
                                fields.Add($"{col.column_name}");
                                dbParams.Add($"@{col.column_name}");
                                cleanAttributes.Add(col.column_name, dto.attributes[col.column_name]);
                            }
                        });
                        string sql = $"INSERT INTO {table.table_schema}.{table.table_name} ({string.Join(",", fields)}) VALUES ({string.Join(",", dbParams)}) RETURNING {keyColumn?.column_name}::TEXT;";
                        string id = uow.Connection.Query<string>(sql, cleanAttributes).FirstOrDefault();
                        if (string.IsNullOrWhiteSpace(id) == false)
                        {
                            if (table.columns.Any(o => o.column_name == "is_approved"))
                            {
                                if (bypassApprove)
                                {
                                    sql = $"UPDATE \"{table.table_schema}\".\"{table.table_name}\" SET is_approved = TRUE, created_by = @user WHERE {keyColumn?.column_name}::TEXT=@id;";
                                }
                                else
                                {
                                    sql = $"UPDATE \"{table.table_schema}\".\"{table.table_name}\" SET is_approved = NULL, created_by = @user WHERE {keyColumn?.column_name}::TEXT=@id;";
                                }
                                uow.Connection.Execute(sql, new
                                {
                                    id = id.ToString(),
                                    user = user?.UserName,
                                });
                            }

                            if (string.IsNullOrWhiteSpace(dto.geom) == false && layer != null)
                            {
                                GeoJsonReader reader = new GeoJsonReader();
                                Geometry geometry = reader.Read<Geometry>(dto.geom);
                                GeoJsonWriter writer = new GeoJsonWriter();
                                string gson = writer.Write(geometry);
                                var regionColumns = columns.Where(x => new string[] { "province_code", "district_code", "commune_code" }.Contains(x.column_name));
                                fields = new List<string>();
                                cleanAttributes = new Dictionary<string, object>();

                                if (regionColumns.Count() > 0)
                                {
                                    var region = session.Find<Commune>(stm => stm
                                        .Where($"ST_Intersects({Sql.Entity<Commune>():T}.geom,st_setsrid(ST_GeomFromGeoJSON('{dto.geom}'),4326))")
                                        .Include<District>()
                                    ).FirstOrDefault();
                                    if (region != null && region.district != null)
                                    {
                                        foreach (var col in regionColumns)
                                        {
                                            switch (true)
                                            {
                                                case true when col.column_name.Equals("province_code"):
                                                    fields.Add($"{col.column_name} = @{col.column_name}");
                                                    cleanAttributes.Add(col.column_name, region.district.parent_id);
                                                    break;
                                                case true when col.column_name.Equals("district_code"):
                                                    fields.Add($"{col.column_name} = @{col.column_name}");
                                                    cleanAttributes.Add(col.column_name, region.parent_id);
                                                    break;
                                                case true when col.column_name.Equals("commune_code"):
                                                    fields.Add($"{col.column_name} = @{col.column_name}");
                                                    cleanAttributes.Add(col.column_name, region.area_id);
                                                    break;
                                                default:
                                                    break;
                                            }
                                        }
                                    }
                                }

                                if (geometry.GeometryType != layer.geometry)
                                {
                                    if (layer.dimension == 2)
                                    {
                                        fields.Add($"geom = ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)");
                                        // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326) WHERE {keyColumn?.column_name}=@id;";
                                    }
                                    else if (layer.dimension == 3)
                                    {
                                        fields.Add($"geom = ST_Force3D(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326))");
                                        // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_Force3D(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)) WHERE {keyColumn?.column_name}=@id;";
                                    }
                                }
                                else
                                {
                                    if (layer.dimension == 2)
                                    {
                                        fields.Add($"geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                        // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326) WHERE {keyColumn?.column_name}=@id;";
                                    }
                                    else if (layer.dimension == 3)
                                    {
                                        fields.Add($"geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326))");
                                        // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)) WHERE {keyColumn?.column_name}=@id;";
                                    }
                                }
                                sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET {string.Join(", ", fields)} WHERE {keyColumn?.column_name}::TEXT=@id;";
                                cleanAttributes.Add("id", id.ToString());
                                uow.Connection.Execute(sql, cleanAttributes);
                            }

                            foreach (var relation in relations)
                            {
                                if (relation.mediate_table != null)
                                {

                                    if (dto.attributes.ContainsKey(relation.mediate_table.table_name))
                                    {
                                        List<object>? mediateData = JsonConvert.DeserializeObject<List<object>>(dto.attributes[relation.mediate_table.table_name]?.ToString());

                                        if (mediateData != null)
                                        {
                                            foreach (object md in mediateData)
                                            {
                                                IDictionary<string, object> data = new Dictionary<string, object>();
                                                data.Add(relation.table_column.column_name, id);
                                                data.Add(relation.relation_column.column_name, md);
                                                sql = $"INSERT INTO {relation.mediate_table.table_schema}.{relation.mediate_table.table_name} ({String.Join(",", data.Select(x => x.Key))}) VALUES ({String.Join(",", data.Select(x => $"@{x.Key}"))})";
                                                uow.Connection.Execute(sql, data);
                                            }
                                        }
                                    }
                                    else
                                    {
                                        var relationTable = getTableAndColumns(relation.relation_table.id);

                                        TableColumn? relationKeyColumn = relationTable.key_column ?? relationTable.identity_column;
                                        TableColumn? relationLabelColumn = relationTable.label_column ?? keyColumn;
                                        if (relationTable != null)
                                        {
                                            var itemList = session.Query<DevExtremeBaseModel>($@"SELECT 
                                                    {relationKeyColumn?.column_name} AS {nameof(DevExtremeBaseModel.id)}
                                                    ,{relationLabelColumn?.column_name} AS {nameof(DevExtremeBaseModel.text)}
                                                FROM {relationTable.table_schema}.{relationTable.table_name} WHERE id != 0");
                                            foreach (var item in itemList)
                                            {
                                                IDictionary<string, object> data = new Dictionary<string, object>();

                                                if (dto.attributes.ContainsKey(relation.mediate_table.table_name + "_" + item.id))
                                                {
                                                    data.Add(relation.relation_column.column_name, item.id);
                                                    data.Add(relation.table_column.column_name, id);
                                                    IDictionary<string, object>? mediateData = JObject.FromObject(dto.attributes[relation.mediate_table.table_name + "_" + item.id]).ToObject<Dictionary<string, object>>();
                                                    if (mediateData != null)
                                                    {
                                                        foreach (var field in relation.extra_fields)
                                                        {
                                                            data.Add(field.column_name, mediateData[field.column_name]);
                                                        }
                                                    }
                                                    sql = $"INSERT INTO {relation.mediate_table.table_schema}.{relation.mediate_table.table_name} ({String.Join(",", data.Select(x => x.Key))}) VALUES ({String.Join(",", data.Select(x => $"@{x.Key}"))})";
                                                    uow.Connection.Execute(sql, data);
                                                }
                                            }
                                        }
                                    }
                                }
                            }



                            ///Xóa cache advanced-search
                            await _workContext.ClearSearchCacheAsync(table);

                            return new RestData
                            {
                                data = id
                            };
                        }
                        else
                            return new RestError(EnumErrorCode.ERROR)
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail { message = "Đã xảy ra lỗi khi lưu dữ liệu, vui lòng thử lại!" }
                                }
                            };
                    }
                }
            }
        }

        [HttpPost("update")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_FEATURE))]
        public async Task<RestBase> UpdateAsync([FromBody] DTOUpdateFeature dto)
        {
            if (dto == null || (dto.layer_id == 0 && dto.table_id == 0))
            {
                return new RestError
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            Layer? layer = getLayerWithTableAndColumn(dto.layer_id);
            TableInfo? table = layer != null ? layer.table : getTableAndColumns(dto.table_id);

            await _workContext.ClearSearchCacheAsync(table);
            var userInfo = _workContext.GetCurrentUserInfo();
            bool bypassApprove = User.IsInRole(VietGIS.Infrastructure.Enums.EnumRoles.SA) || (userInfo?.bypass_approve ?? false);

            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                if (table == null)
                {
                    return new RestError(400, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                else
                {
                    var user = await _workContext.GetCurrentUser();

                    IEnumerable<TableColumn> columns = table.columns
                        .Where(x => !x.is_identity)
                        .Where(x => !x.column_name.Contains("geom"))
                        .Where(x => x.column_name != "is_approved");
                    List<string> fields = new List<string>();
                    List<string> dbParams = new List<string>();
                    IDictionary<string, object> cleanAttributes = new Dictionary<string, object>();
                    TableColumn? keyColumn = table.key_column ?? table.identity_column;
                    TableColumn? identitycolumn = table.identity_column;
                    string oldData = session.Query<string>($"select row_to_json(t) from (select * from {table.table_schema}.{table.table_name} WHERE {keyColumn?.column_name} = @key) AS t;", new
                    {
                        key = dto.attributes[keyColumn?.column_name]
                    }).FirstOrDefault();
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        columns.ToList().ForEach(col =>
                        {
                            if (dto.attributes.Keys.Contains(col.column_name))
                            {
                                fields.Add($"{col.column_name}=@{col.column_name}");
                                cleanAttributes.Add(col.column_name, dto.attributes[col.column_name]);
                            }
                        });
                        cleanAttributes.Add("keyColumnValue", dto.attributes[keyColumn?.column_name]);
                        if (cleanAttributes.ContainsKey("updated_by") == false)
                        {
                            cleanAttributes.Add("updated_by", user?.UserName);
                        }
                        else
                        {
                            cleanAttributes["updated_by"] = user?.UserName;
                        }
                        string sql =
                            $@"UPDATE {table.table_schema}.{table.table_name}
                                   SET {string.Join(", ", fields)} WHERE {keyColumn?.column_name} = @keyColumnValue";
                        uow.Connection.Execute(sql, cleanAttributes);
                        if (bypassApprove)
                        {
                            sql =
                            $@"UPDATE {table.table_schema}.{table.table_name}
                                   SET is_approved = TRUE, updated_by = @updated_by WHERE {keyColumn?.column_name} = @keyColumnValue";
                        }
                        else
                        {
                            sql =
                            $@"UPDATE {table.table_schema}.{table.table_name}
                                   SET is_approved = NULL, updated_by = @updated_by WHERE {keyColumn?.column_name} = @keyColumnValue";
                        }
                        uow.Connection.Execute(sql, cleanAttributes);
                        if (string.IsNullOrWhiteSpace(dto.geom) == false && layer != null)
                        {
                            GeoJsonReader reader = new GeoJsonReader();
                            Geometry geometry = reader.Read<Geometry>(dto.geom);
                            GeoJsonWriter writer = new GeoJsonWriter();
                            string gson = writer.Write(geometry);

                            if (layer.dimension == 2)
                            {
                                sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326) WHERE {keyColumn?.column_name}=@keyColumnValue;";
                            }
                            else if (layer.dimension == 3)
                            {
                                sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)) WHERE {keyColumn?.column_name}=@keyColumnValue;";
                            }
                            uow.Connection.Execute(sql, new
                            {
                                keyColumnValue = dto.attributes[keyColumn?.column_name]
                            });
                        }



                        // if (dto.relations_table != null && dto.relations_column.Count > 0)
                        // {
                        //     var relations_table = dto.relations_table.ToList();
                        //     var relations_column = dto.relations_column.ToList();

                        //     for (int i = 0; i < dto.relations_table.Count; i++)
                        //     {
                        //         sql = $"DELETE FROM {layer.table.table_schema}.{relations_table[i].Key} WHERE {relations_column[i].Key}={dto.attributes["id"]}";
                        //         uow.Connection.Execute(sql);
                        //         var values = dto.attributes[relations_column[i].Value] == null ? new List<string>() : dto.attributes[relations_column[i].Value].Split(',').ToList();
                        //         foreach (var value in values)
                        //         {
                        //             sql = $@"INSERT INTO {layer.table.table_schema}.{relations_table[i].Key}({relations_column[i].Key},{relations_column[i].Value}) 
                        //                     VALUES({dto.attributes["id"]},{value})";
                        //             uow.Connection.Execute(sql);
                        //         }
                        //     }
                        // }
                        ///Xóa cache advanced-search
                        // await _workContext.ClearSearchCacheAsync(layer?.table);
                        return new RestData
                        {
                            data = dto.attributes[keyColumn?.column_name]
                        };
                    }
                }
            }
        }

        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_FEATURE))]
        [HttpPost("updateFeatures")]
        public RestBase UpdateFeatures([FromBody] UpdateMultiFeatureViewModel model)
        {
            if (model == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            Layer? layer = getLayerWithTableAndColumn(model.layer_id);

            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                if (layer == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail {  message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    _workContext.ClearSearchCacheAsync(layer.table);

                    TableColumn? column = layer.table.columns.Where(x => x.id == model.column_id).FirstOrDefault();
                    List<string> fields = new List<string>();
                    List<string> dbParams = new List<string>();
                    TableColumn keyColumn = layer.table.key_column ?? layer.table.identity_column;
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        string sql = $@"UPDATE {layer.table.table_schema}.{layer.table.table_name}
                                   SET {column?.column_name} = @value WHERE {keyColumn?.column_name} = ANY(@feature_ids)";
                        uow.Connection.Execute(sql, model);
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_FEATURE))]
        public async Task<RestBase> Delete([FromBody] DTODeleteFeature dto)
        {
            if (dto == null || (dto.layer_id == 0 && dto.table_id == 0))
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            Layer? layer = getLayerWithTableAndColumn(dto.layer_id);
            TableInfo? table = layer != null ? layer.table : getTableAndColumns(dto.table_id);

            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                if (table == null)
                {
                    return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                else
                {
                    var user = await _workContext.GetCurrentUser();

                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        var keyColumn = table.key_column ?? table.identity_column;
                        if (keyColumn != null)
                        {
                            string sql = @$"DELETE FROM {table.table_schema}.{table.table_name} WHERE {keyColumn?.column_name}::TEXT = @id;";
                            uow.Connection.Execute(sql, new
                            {
                                id = dto.attributes[keyColumn?.column_name]?.ToString()
                            });
                            if (int.TryParse(dto.attributes[keyColumn?.column_name].ToString(), out int id))
                            {
                                uow.Connection.BulkDelete<Form.Feature>(x => x
                                .Where($"{Sql.Entity<Form.Feature>(x => x.table_id):TC} = @table_id AND {Sql.Entity<Form.Feature>(x => x.feature_id):TC} = @id")
                                .WithParameters(new
                                {
                                    table_id = table.id,
                                    id
                                }));
                            }
                            uow.Insert(new TableHistory
                            {
                                table_schema = table.table_schema,
                                table_name = table.table_name,
                                layer_name = layer?.name_vn,
                                action = "DELETE",
                                old_data = JsonConvert.SerializeObject(dto.attributes),
                                action_time = DateTime.Now,
                                action_user = _workContext.GetCurrentUserId(),
                            });

                            await _workContext.SendNotification(new PushNotificationViewModel
                            {
                                content = $"Tài khoản {user?.UserName} vừa xóa của lớp {layer?.name_vn ?? table?.name_vn}. Vui lòng đăng nhập để kiểm tra thông tin.",
                                title = "Biến động dữ liệu",
                                user_id = await _workContext.ListNotifyUserIds()
                            });

                            ///Xóa cache advanced-search
                            await _workContext.ClearSearchCacheAsync(table);

                            return new RestBase(EnumErrorCode.OK);
                        }
                        else
                        {
                            return new RestError(400, "Không tìm thấy trường định danh của lớp dữ liệu!");
                        }
                    }
                }
            }
        }

        [HttpPost("approve")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_FEATURE))]
        public async Task<RestBase> ApproveAsync([FromBody] DTOApprovedFeature dto)
        {
            if (dto == null || (dto.layer_id == 0 && dto.table_id == 0) || dto?.listAttributes?.Count() == 0)
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            Layer? layer = getLayerWithTableAndColumn(dto.layer_id);
            TableInfo? table = layer != null ? layer.table : getTableAndColumns(dto.table_id);

            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                if (table == null)
                {
                    return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                else
                {
                    var user = await _workContext.GetCurrentUser();

                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        var keyColumn = table.key_column ?? table.identity_column;
                        var approvedColumn = table.columns.FirstOrDefault(x => x.column_name.Equals("is_approved"));
                        if (keyColumn != null)
                        {
                            if (approvedColumn != null)
                            {
                                foreach (var attributes in dto?.listAttributes)
                                {
                                    string sql = @$"UPDATE {table.table_schema}.{table.table_name} SET is_approved = TRUE, approved_by = @user WHERE {keyColumn?.column_name} = @key;";
                                    uow.Connection.Execute(sql, new
                                    {
                                        key = attributes[keyColumn?.column_name],
                                        user = user?.UserName
                                    });
                                    uow.Insert(new TableHistory
                                    {
                                        table_schema = table.table_schema,
                                        table_name = table.table_name,
                                        layer_name = layer?.name_vn,
                                        action = "APPROVE",
                                        new_data = JsonConvert.SerializeObject(attributes),
                                        action_time = DateTime.Now,
                                        action_user = _workContext.GetCurrentUserId(),
                                    });

                                }
                                await _workContext.ClearSearchCacheAsync(table);
                                return new RestBase(EnumErrorCode.OK);
                            }
                            else
                            {
                                return new RestError(404, "Không tìm thấy trường phê duyệt của lớp dữ liệu!");
                            }
                        }
                        else
                        {
                            return new RestError(404, "Không tìm thấy trường định danh của lớp dữ liệu!");
                        }
                    }
                }
            }
        }

        [HttpPost("reject")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_FEATURE))]
        public async Task<RestBase> RejectAsync([FromBody] DTODeleteFeature dto)
        {
            if (dto == null || (dto.layer_id == 0 && dto.table_id == 0))
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            Layer? layer = getLayerWithTableAndColumn(dto.layer_id);
            TableInfo? table = layer != null ? layer.table : getTableAndColumns(dto.table_id);

            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                if (table == null)
                {
                    return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                else
                {
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        var keyColumn = table.key_column ?? table.identity_column;
                        var approvedColumn = table.columns.FirstOrDefault(x => x.column_name.Equals("is_approved"));
                        if (keyColumn != null)
                        {
                            if (approvedColumn != null)
                            {
                                string sql = @$"UPDATE {table.table_schema}.{table.table_name} SET is_approved = FALSE WHERE {keyColumn?.column_name} = @key;";
                                uow.Connection.Execute(sql, new { key = dto.attributes[keyColumn?.column_name] });
                                uow.Insert(new TableHistory
                                {
                                    table_schema = table.table_schema,
                                    table_name = table.table_name,
                                    layer_name = layer?.name_vn,
                                    action = "REJECT",
                                    new_data = JsonConvert.SerializeObject(dto.attributes),
                                    action_time = DateTime.Now,
                                    action_user = _workContext.GetCurrentUserId(),
                                });
                                await _workContext.ClearSearchCacheAsync(table);
                                return new RestBase(EnumErrorCode.OK);
                            }
                            else
                            {
                                return new RestError(404, "Không tìm thấy trường phê duyệt của lớp dữ liệu!");
                            }
                        }
                        else
                        {
                            return new RestError(404, "Không tìm thấy trường định danh của lớp dữ liệu!");
                        }
                    }
                }
            }
        }

        [HttpPost("upload")]
        [RequestSizeLimit(250_000_000)]
        public RestBase upload([FromForm] DTOFeatureFiles dto)
        {
            if (dto == null || (!dto.layer_id.HasValue && !dto.table_id.HasValue))
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            using (var session = OpenSession())
            {
                if (dto.layer_id.HasValue && dto.layer_id.Value > 0)
                {
                    Layer? layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                    if (layer == null)
                    {
                        return new RestError(404, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    IEnumerable<FeatureFile> filesToSave = OpenGIS.Module.API.Helpers.FileHelper.saveFiles(dto.feature_id, layer, dto.files);

                    foreach (var file in filesToSave)
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            _featureFileRepository.SaveOrUpdate(file, uow);
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                {
                    TableInfo? table = getTableAndColumns(dto.table_id.Value);
                    if (table == null)
                    {
                        return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    IEnumerable<TableFiles> filesToSave = OpenGIS.Module.API.Helpers.FileHelper.saveFiles(dto.feature_id, table, dto.files);

                    foreach (var file in filesToSave)
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            _tableFileRepository.SaveOrUpdate(file, uow);
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("deleteFiles")]
        public async Task<RestBase> deleteFileAsync([FromBody] IEnumerable<FeatureFile> files)
        {
            using (var session = OpenSession())
            {
                if (files.Count() > 0)
                {
                    foreach (var file in files)
                    {
                        await session.DeleteAsync(file);
                    }
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }

        [HttpGet("geometry/{layer_id}/{feature_id}")]
        public RestBase getGeometry([FromRoute] int layer_id, [FromRoute] int feature_id)
        {
            using (var session = OpenSession())
            {
                var layer = getLayerWithTableAndColumn(layer_id);
                if (layer == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };

                TableColumn? keyColumn = layer.table.key_column ?? layer.table.identity_column;
                if (keyColumn == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Không tìm thấy trường định danh của lớp dữ liệu!" }
                        }
                    };
                string select = @$"SELECT ST_AsGeoJSON({layer.table.table_schema}.{layer.table.table_name}.geom)";
                var where = @$" WHERE {layer.table.table_name}.{keyColumn?.column_name} = @feature_id";
                string tables = @$" FROM {layer.table.table_schema}.{layer.table.table_name}";

                string sql = select + tables + where;
                return new RestData
                {
                    data = session.Query<string>(sql, new { feature_id = feature_id }).FirstOrDefault()
                };
            }
        }

        [HttpGet("checkValid")]
        public RestBase checkValidGeometry([FromQuery] string geojson)
        {
            using (var session = OpenSession())
            {
                string select = $"SELECT ST_IsValid(ST_SetSRID(ST_GeomFromGeoJSON(@geojson), 4326))";
                return new RestData
                {
                    data = session.Query<string>(select, new { geojson = geojson }).FirstOrDefault()
                };
            }

        }

        [HttpGet("checkValidLayer/{id}")]
        public RestBase checkValidLayer([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                var layer = getLayerWithTableAndColumn(id);
                if (layer == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                string sql = @$"SELECT COUNT(1), ST_IsValid({layer.table.table_schema}.{layer.table.table_name}.geom) AS isValid 
                        FROM {layer.table.table_schema}.{layer.table.table_name} 
                        GROUP BY  ST_IsValid({layer.table.table_schema}.{layer.table.table_name}.geom)";

                return new RestData
                {
                    data = session.Query<CheckValidViewModel>(sql).ToList()
                };
            }
        }

        [HttpPost("query-feature")]
        public RestBase getLayerDataFeature([FromBody] SearchFeatureDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null || (dto.layer_id == 0 && dto.table_id == 0) || string.IsNullOrWhiteSpace(dto.feature_id))
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lỗi tham số!" }
                        }
                    };
                TableInfo? table = null;
                Layer? layer = null;
                if (dto.layer_id.HasValue && dto.layer_id.Value > 0)
                {
                    layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                    if (layer == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        table = layer.table;
                    }
                }
                else if (dto.table_id.HasValue && dto.table_id.Value > 0)
                {
                    table = getTableAndColumns(dto.table_id.Value);
                }
                if (table == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };

                TableColumn keyColumn = table.key_column ?? table.identity_column;
                if (keyColumn == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Trường dữ liệu khóa chính không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                var where = @$" WHERE {table.table_schema}.{table.table_name}.{keyColumn?.column_name}::TEXT = @feature_id";
                string select = string.Empty;
                select = @$"SELECT {String.Join(',', table.columns.Where(x => x.column_name.Equals("geom") == false && x.column_name.Equals("search_content") == false).Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))}";
                if (table.columns.Any(x => x.column_name.Equals("geom")))
                {
                    select += @$", ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom ";
                }
                string tables = @$" FROM {table.table_schema}.{table.table_name}";
                if (table.columns.Any(x => x.column_name == "commune_code"))
                {
                    select += @$" ,{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.commune_code";
                }
                if (table.columns.Any(x => x.column_name == "district_code"))
                {
                    select += @$",{Sql.Entity<District>(x => x.name_vn):TC} AS district_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.district_code";
                }
                if (table.columns.Any(x => x.column_name == "province_code"))
                {
                    select += @$" ,{Sql.Entity<Province>(x => x.name_vn):TC} AS province_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.province_code";
                }

                var domain_values = domainValueForLookup(table);
                var relations = getRelations(table, true);

                string sql = select + tables + where;
                IDictionary<string, object>? feature = session.Query(sql, dto).FirstOrDefault();
                if (feature == null)
                    return new RestError();
                var files = session.Find<FeatureFile>(stm => stm
                    .Where($@"{nameof(FeatureFile.layer_id)} = @layer_id AND {nameof(FeatureFile.feature_id)} = @feature_id")
                    .WithParameters(dto)
                    .OrderBy($"{nameof(FeatureFile.id)} DESC")
                ).ToList();
                return new RestData
                {
                    data = new
                    {
                        attributes = feature,
                        files,
                        domain_values,
                        relations
                    }
                };
            }
        }

        [HttpPost("notify")]
        public async Task<RestBase> NotifyAsync([FromBody] SendNotificationDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null || (dto.layer_id == 0 && dto.table_id == 0) || string.IsNullOrWhiteSpace(dto.feature_id))
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lỗi tham số!" }
                        }
                    };
                TableInfo? table = null;
                Layer? layer = null;
                if (dto.layer_id.HasValue && dto.layer_id.Value > 0)
                {
                    layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                    if (layer == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        table = layer.table;
                    }
                }
                else if (dto.table_id.HasValue && dto.table_id.Value > 0)
                {
                    table = getTableAndColumns(dto.table_id.Value);
                }
                if (table == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };

                TableColumn keyColumn = table.key_column ?? table.identity_column;
                if (keyColumn == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Trường dữ liệu khóa chính không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                var where = @$" WHERE {table.table_schema}.{table.table_name}.{keyColumn?.column_name}::TEXT = @feature_id";
                string select = string.Empty;
                select = @$"SELECT {string.Join(',',
                table.columns.Where(x => x.column_name.Equals("geom") == false
                 && x.column_name.Equals("search_content") == false
                 && x.column_name.Equals("commune_code") == false
                 && x.column_name.Equals("district_code") == false
                 && x.column_name.Equals("province_code") == false
                 && x.column_name.Equals("created_at") == false
                 && x.column_name.Equals("updated_at") == false
                 && x != keyColumn
                 )
                 .Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))}";
                // if (table.columns.Any(x => x.column_name.Equals("geom")))
                // {
                //     select += @$", ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom ";
                // }
                string tables = @$" FROM {table.table_schema}.{table.table_name}";
                if (table.columns.Any(x => x.column_name == "commune_code"))
                {
                    select += @$" ,{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.commune_code";
                }
                if (table.columns.Any(x => x.column_name == "district_code"))
                {
                    select += @$",{Sql.Entity<District>(x => x.name_vn):TC} AS district_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.district_code";
                }
                if (table.columns.Any(x => x.column_name == "province_code"))
                {
                    select += @$" ,{Sql.Entity<Province>(x => x.name_vn):TC} AS province_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.province_code";
                }

                var domain_values = domainValueForLookup(table);

                string sql = select + tables + where;
                IDictionary<string, object>? feature = session.Query(sql, dto).FirstOrDefault();

                if (feature == null)
                    return new RestError();
                var content = new List<string>() { };
                foreach (var item in feature)
                {
                    var column = table.columns.FirstOrDefault(x => x.column_name.Equals(item.Key));
                    if (column != null)
                    {
                        if (column.lookup_table_id > 0)
                        {
                            var domain = domain_values.FirstOrDefault(x => x.Key.Equals(column.column_name)).Value;
                            if (domain != null)
                            {
                                var value = domain.FirstOrDefault(x => x.id.Equals(item.Value))?.mo_ta;
                                content.Add($"{column.name_vn.ToLower()}: {value ?? ""}");
                            }
                        }
                        else if (column.data_type == EnumPgDataType.Boolean)
                        {
                            if (column.column_name.Equals("is_approved"))
                            {
                                content.Add($"{column.name_vn.ToLower()}: {(item.Value?.ToString()?.Equals("true") == true ? "Đã phê duyệt" : "Chưa phê duyệt")}");
                            }
                            else
                            {
                                content.Add($"{column.name_vn.ToLower()}: {(item.Value?.ToString()?.Equals("true") == true ? "Có" : "Không")}");
                            }

                        }
                        else if (column.data_type == EnumPgDataType.Date || column.data_type == EnumPgDataType.DateTime)
                        {
                            content.Add($"{column.name_vn.ToLower()}: {Convert.ToDateTime(item.Value).ToString("dd/MM/yyyy")}");
                        }
                        else
                        {
                            content.Add($"{column.name_vn.ToLower()}: {item.Value}");
                        }
                    }
                }
                var result = await _workContext.SendNotification(new PushNotificationViewModel
                {
                    content = $"Thông tin {table.name_vn}:" + string.Join(", ", content),
                    user_id = dto.user_ids,
                    title = $"Thông tin {table.name_vn}"
                });
                if (result)
                {
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                    return new RestError(400, "Không gửi được thông báo");
            }
        }

        [HttpPost("send/mail")]
        public async Task<RestBase> SendMailAsync([FromBody] SearchFeatureDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null || dto.layer_id == 0 || string.IsNullOrWhiteSpace(dto.feature_id))
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lỗi tham số!" }
                        }
                    };
                TableInfo? table = null;
                Layer? layer = null;
                if (dto.layer_id.HasValue && dto.layer_id.Value > 0)
                {
                    layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                    if (layer == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        table = layer.table;
                    }
                }
                else if (dto.table_id.HasValue && dto.table_id.Value > 0)
                {
                    table = getTableAndColumns(dto.table_id.Value);
                }
                if (table == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };

                TableColumn keyColumn = table.key_column ?? table.identity_column;
                if (keyColumn == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Trường dữ liệu khóa chính không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                var where = @$" WHERE {table.table_schema}.{table.table_name}.{keyColumn?.column_name}::TEXT = @feature_id";
                string select = string.Empty;
                select = @$"SELECT {string.Join(',',
                table.columns.Where(x => x.column_name.Equals("geom") == false
                 && x.column_name.Equals("search_content") == false
                 && x.column_name.Equals("commune_code") == false
                 && x.column_name.Equals("district_code") == false
                 && x.column_name.Equals("province_code") == false
                 && x.column_name.Equals("created_at") == false
                 && x.column_name.Equals("updated_at") == false
                 && x != keyColumn
                 )
                 .Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))}";
                // if (table.columns.Any(x => x.column_name.Equals("geom")))
                // {
                //     select += @$", ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom ";
                // }
                string tables = @$" FROM {table.table_schema}.{table.table_name}";
                if (table.columns.Any(x => x.column_name == "commune_code"))
                {
                    select += @$" ,{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.commune_code";
                }
                if (table.columns.Any(x => x.column_name == "district_code"))
                {
                    select += @$",{Sql.Entity<District>(x => x.name_vn):TC} AS district_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.district_code";
                }
                if (table.columns.Any(x => x.column_name == "province_code"))
                {
                    select += @$" ,{Sql.Entity<Province>(x => x.name_vn):TC} AS province_name";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.province_code";
                }

                var domain_values = domainValueForLookup(table);

                string sql = select + tables + where;
                IDictionary<string, object>? feature = session.Query(sql, dto).FirstOrDefault();

                if (feature == null)
                    return new RestError();
                var content = new List<string>() { };
                foreach (var item in feature)
                {
                    var column = table.columns.FirstOrDefault(x => x.column_name.Equals(item.Key));
                    if (column != null && item.Value != null)
                    {
                        if (column.lookup_table_id > 0)
                        {
                            var domain = domain_values.FirstOrDefault(x => x.Key.Equals(column.column_name)).Value;
                            if (domain != null)
                            {
                                var value = domain.FirstOrDefault(x => x.id.Equals(item.Value))?.mo_ta;
                                content.Add($"{column.name_vn.ToLower()}: {value ?? ""}");
                            }
                        }
                        else if (column.data_type == EnumPgDataType.Date || column.data_type == EnumPgDataType.DateTime)
                        {
                            content.Add($"{column.name_vn.ToLower()}: {Convert.ToDateTime(item.Value).ToString("dd/MM/yyyy")}");
                        }
                        else
                        {
                            content.Add($"{column.name_vn.ToLower()}: {item.Value}");
                        }
                    }
                }
                if (feature.ContainsKey("email") && !string.IsNullOrEmpty(feature["email"].ToString()))
                {
                    await _emailSender.SendEmailAsync(feature["email"].ToString(), $"{table.name_vn}", $"Thông tin:" + string.Join(", ", content), GlobalConfiguration.ApplicationName);
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                {
                    return new RestError(404, "Không có dữ liệu thông tin email");
                }
            }
        }

        [HttpPost("getFiles")]
        public RestBase getFiles([FromBody] SearchFeatureDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null || (dto.layer_id == 0 && dto.table_id == 0) || string.IsNullOrWhiteSpace(dto.feature_id))
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lỗi tham số!" }
                        }
                    };
                List<FeatureFile> featureFiles = new List<FeatureFile>();
                List<TableFiles> tableFiles = new List<TableFiles>();
                if (dto.layer_id.HasValue && dto.layer_id.Value > 0)
                {

                    var layer = getLayer(dto.layer_id.Value);
                    if (layer != null)
                    {
                        dto.table_id = layer.table_info_id;
                        featureFiles = session.Find<FeatureFile>(stm => stm
                        .Where($@"{nameof(FeatureFile.layer_id)} = @layer_id AND {nameof(FeatureFile.feature_id)} = @feature_id")
                        .WithParameters(dto)
                        ).ToList();
                        tableFiles = session.Find<TableFiles>(stm => stm
                            .Where($@"{nameof(TableFiles.table_id)} = @table_id AND {nameof(TableFiles.feature_id)} = @feature_id")
                            .WithParameters(dto)
                        ).ToList();
                    }
                }
                else
                {
                    var layer = getLayerWithTableInfo(dto.table_id.Value);
                    if (layer != null)
                    {
                        dto.layer_id = layer.id;
                        featureFiles = session.Find<FeatureFile>(stm => stm
                            .Where($@"{nameof(FeatureFile.layer_id)} = @layer_id AND {nameof(FeatureFile.feature_id)} = @feature_id")
                            .WithParameters(dto)
                        ).ToList();
                    }
                    tableFiles = session.Find<TableFiles>(stm => stm
                        .Where($@"{nameof(TableFiles.table_id)} = @table_id AND {nameof(TableFiles.feature_id)} = @feature_id")
                        .WithParameters(dto)
                    ).ToList();
                }
                return new RestData
                {
                    data = new
                    {
                        featureFiles = featureFiles,
                        tableFiles = tableFiles
                    }
                };
            }
        }

        [HttpGet("{layer_id}/nearby-features")]
        public RestBase nearByFeatures([FromRoute] int layer_id, [FromQuery] string geom, [FromQuery] double radius = 0, [FromQuery] bool crossSchema = false)
        {
            using (var session = OpenSession())
            {
                var layerInfo = getLayerWithTable(layer_id);
                if (layerInfo != null)
                {
                    List<Layer> layers;
                    if (crossSchema)
                        layers = _mapLayersRepository.getLayersWithTableAndColumn().Where(x => x.id != layerInfo.id).ToList();
                    else
                        layers = _mapLayersRepository.getLayersWithTableAndColumn(schema: layerInfo.table.table_schema).Where(x => x.id != layerInfo.id).ToList();
                    var listSQL = new List<string>();

                    layers.ForEach(layer =>
                    {
                        string table = $"{layer.table.table_schema}.{layer.table.table_name}";
                        var listTableConditions = new List<String> { "1=1" };
                        listTableConditions.Add($"ST_Intersects({table}.geom, ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON('{geom}'), 4326)::GEOGRAPHY, {radius}))");

                        var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                        var labelColumn = layer.label_column ?? keyColumn;

                        var table_innerjoin_sql = string.Empty;
                        var region_name = string.Empty;

                        var sqlRegion = new List<String>();
                        var sqlJoin = new List<string>();
                        if (layer.table.columns.Any(x => x.column_name == "district_code"))
                        {
                            sqlRegion.Add($"{Sql.Entity<District>(x => x.name_vn):TC} AS district");
                            sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table}.district_code");
                        }
                        if (layer.table.columns.Any(x => x.column_name == "commune_code"))
                        {
                            sqlRegion.Add($"{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune");
                            sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table}.commune_code");
                        }

                        var region = sqlRegion.Count > 0 ? String.Join(",", sqlRegion) : "'' AS district, '' AS commune";
                        var join = sqlJoin.Count > 0 ? String.Join(" ", sqlJoin) : "";

                        var table_select_sql = $@"SELECT
                                                CONCAT('{table}', '.', {table}.{keyColumn.column_name}) AS uid
                                                ,{table}.{keyColumn.column_name} AS id
                                                ,{layer.table.table_name}.{labelColumn.column_name}::TEXT AS name
                                                ,{layer.id} AS layer_id
                                                ,'{layer.name_vn}' AS layer_name
                                                ,ST_AsGeoJSON({table}.geom) AS geom
                                                ,{region}
                                                ,ST_DistanceSphere({table}.geom, ST_SetSRID(ST_GeomFromGeoJSON('{geom}'), 4326)) AS distance
                                            FROM {table}
                                            {join}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                        listSQL.Add(table_select_sql);
                    });
                    var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", listSQL)}) AS layers";
                    var count = session.Query<int>($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", listSQL)}) AS layers").FirstOrDefault();
                    var result = session.Query(sql).ToList();
                    var records = result.Select(x => (IDictionary<string, object>)x).ToList();
                    return new RestData()
                    {
                        data = new
                        {
                            dataSearch = new
                            {
                                items = records,
                                totalCount = count,
                            }
                        }
                    };
                }
                else
                {
                    return new RestError(404, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
            }
        }

        [HttpPost("relationships")]
        public RestBase getRelationshipFeatures([FromBody] RelationSearchParameter param)
        {
            using (var session = OpenSession())
            {
                if (param == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                var tableInfo = getTableAndColumns(param.tableId);
                var relationTableInfo = getTableAndColumns(param.relationTableId);
                var feature = getFeature(param.tableId, param.featureId);
                var relation = getRelations(tableInfo, true).Where(x => x.relation_table_id == relationTableInfo.id || x.table_id == relationTableInfo.id).FirstOrDefault();
                if (relation == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                                new RestErrorDetail { message = "Quan hệ không tồn tại, vui lòng thử lại!" }
                        }
                    };
                }
                else if (feature == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Thiết bị, công trình không tồn tại, vui lòng thử lại!" }
                        }
                    };
                }
                else
                {
                    feature.TryGetValue(relation.table_column.column_name, out var foreignValue);
                    string tableRelationName = $"{relationTableInfo.table_schema}.{relationTableInfo.table_name}";
                    var selectedFields = relationTableInfo.columns.Where(x => (x.visible || x.is_identity) && "geom".Equals(x.column_name) == false);
                    var listTableConditions = new List<String> { "1=1" };
                    if (!string.IsNullOrWhiteSpace(foreignValue?.ToString()))
                    {
                        listTableConditions.Add($"{tableRelationName}.{relation.relation_column.column_name} = @foreignValue");

                        var keyColumn = relationTableInfo.key_column ?? relationTableInfo.identity_column;
                        var labelColumn = relationTableInfo.label_column ?? keyColumn;
                        var sql = @$"SELECT {String.Join(',', selectedFields.Select(x => $"{relationTableInfo.table_schema}.{relationTableInfo.table_name}.{x.column_name}"))}
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                        var result = session.Query(sql, new { foreignValue = foreignValue }).ToList();
                        records = result.Select(x => (IDictionary<string, object>)x).ToList();
                    }
                    return new RestData()
                    {
                        data = new
                        {
                            data = records,
                            selectedFields = selectedFields,
                            tableInfo = relationTableInfo,
                            totalCount = session.Query<int>(@$"SELECT COUNT(1) FROM {tableRelationName} WHERE {String.Join(" AND ", listTableConditions)}", new { foreignValue = foreignValue }).FirstOrDefault(),
                        }
                    };
                }
            }
        }

        [HttpPost("simulations")]
        public RestBase getSimulationFeatures([FromBody] RelationSearchParameter param)
        {
            using (var session = OpenSession())
            {
                if (param == null)
                {
                    return new RestError(400, "Vui lòng kiểm tra lại tham số!");
                }
                var records = getSimulationFeature(param.layerId, param.featureId);
                return new RestData()
                {
                    data = records
                };
            }
        }

        [HttpPost("maintenances")]
        public RestBase getMaintenanceFeatures([FromBody] FeatureMaintenanceListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null
                    || ((!dto.table_id.HasValue || dto.layer_id.Value == 0) && (!dto.layer_id.HasValue && dto.layer_id.Value == 0))
                    || string.IsNullOrWhiteSpace(dto.feature_id)
                    || string.IsNullOrWhiteSpace(dto.loaikiemtra))
                {
                    return new RestError(400, "Vui lòng kiểm tra lại tham số!");
                }
                var sqlJoin = string.Empty;
                switch (dto.loaikiemtra)
                {
                    case EnumLoaiKiemTra.CAYXANH:
                        sqlJoin = @$"LEFT JOIN {Sql.Entity<PhieuGiamSatKiemTraCayXanh>():T} kt 
                                    ON bd.{nameof(KiemTraBaoDuongCongTrinh.phieugiamsat_id):C} = kt.{nameof(PhieuGiamSatKiemTraCayXanh.id):C}
                                LEFT JOIN category.dm_congcu_kiemtra cckt 
                                    ON kt.{nameof(PhieuGiamSatKiemTraCayXanh.congcukiemtraid):C} = cckt.id
                                LEFT JOIN category.dm_phuongthuc_kiemtra ptkt 
                                    ON kt.{nameof(PhieuGiamSatKiemTraCayXanh.phuongthuckiemtraid):C} = ptkt.id";
                        break;
                    case EnumLoaiKiemTra.CHIEUSANG:
                        sqlJoin = @$"LEFT JOIN {Sql.Entity<PhieuGiamSatKiemTraChieuSang>():T} kt 
                                    ON bd.{nameof(KiemTraBaoDuongCongTrinh.phieugiamsat_id):C} = kt.{nameof(PhieuGiamSatKiemTraChieuSang.id):C}
                                LEFT JOIN category.dm_congcu_kiemtra cckt 
                                    ON kt.{nameof(PhieuGiamSatKiemTraChieuSang.congcukiemtraid):C} = cckt.id
                                LEFT JOIN category.dm_phuongthuc_kiemtra ptkt 
                                    ON kt.{nameof(PhieuGiamSatKiemTraChieuSang.phuongthuckiemtraid):C} = ptkt.id";
                        break;
                    case EnumLoaiKiemTra.THOATNUOC:
                        sqlJoin = @$"LEFT JOIN {Sql.Entity<PhieuGiamSatKiemTraThoatNuoc>():T} kt 
                                    ON bd.{nameof(KiemTraBaoDuongCongTrinh.phieugiamsat_id):C} = kt.{nameof(PhieuGiamSatKiemTraThoatNuoc.id):C}
                                LEFT JOIN category.dm_congcu_kiemtra cckt 
                                    ON kt.{nameof(PhieuGiamSatKiemTraThoatNuoc.congcukiemtraid):C} = cckt.id
                                LEFT JOIN category.dm_phuongthuc_kiemtra ptkt 
                                    ON kt.{nameof(PhieuGiamSatKiemTraThoatNuoc.phuongthuckiemtraid):C} = ptkt.id";
                        break;
                    default:
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Bảng kiểm tra không tồn tại!" }
                            }
                        };
                }
                if (dto.layer_id.HasValue && dto.layer_id.Value == 0)
                {
                    var layer = getLayer(dto.layer_id.Value);
                    if (layer != null)
                    {
                        dto.table_id = layer.table_info_id;
                    }
                }
                var condition = @$"bd.{nameof(KiemTraBaoDuongCongTrinh.loaikiemtra)} = @loaikiemtra 
                        AND bd.{nameof(KiemTraBaoDuongCongTrinh.feature_id):C} = @feature_id
                        AND bd.{nameof(KiemTraBaoDuongCongTrinh.table_id):C} = @table_id";
                var sql = @$"SELECT kt.*, 
                        cckt.mo_ta AS {nameof(FeatureMaintenanceViewModel.congcukiemtra)}, 
                        ptkt.mo_ta AS {nameof(FeatureMaintenanceViewModel.phuongthuckiemtra)} 
                        FROM {Sql.Entity<KiemTraBaoDuongCongTrinh>():T} bd {sqlJoin} WHERE {condition} LIMIT {dto.take} OFFSET {dto.skip}";
                return new RestPagedDataTable()
                {
                    data = session.Query<FeatureMaintenanceViewModel>(sql, dto).ToList(),
                    recordsTotal = session.Query<int>($@"SELECT COUNT(1) FROM {Sql.Entity<KiemTraBaoDuongCongTrinh>():T} bd 
                        {sqlJoin} WHERE {condition}", dto).FirstOrDefault()
                };
            }
        }

        [HttpPost("maintenance-plans")]
        public RestBase getMaintenancePlanFeatures([FromBody] FeatureMaintenanceListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null
                    || ((!dto.table_id.HasValue || dto.table_id.Value == 0) && (!dto.layer_id.HasValue || dto.layer_id.Value == 0))
                    || string.IsNullOrWhiteSpace(dto.feature_id)
                    || string.IsNullOrWhiteSpace(dto.loaikiemtra))
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                if (dto.layer_id.HasValue && dto.layer_id.Value == 0)
                {
                    var layer = getLayer(dto.layer_id.Value);
                    if (layer != null)
                    {
                        dto.table_id = layer.table_info_id;
                    }
                }
                var condition = @$"{Sql.Entity<KeHoachKiemTra>(x => x.loaikehoach):TC} = @loaikiemtra 
                        AND {Sql.Entity<KeHoachKiemTraCongTrinh>(x => x.feature_id):TC} = @feature_id
                        AND {Sql.Entity<KeHoachKiemTraCongTrinh>(x => x.table_id):TC} = @table_id";
                var sql = @$"SELECT * FROM {Sql.Entity<KeHoachKiemTra>():T} 
                                LEFT JOIN {Sql.Entity<KeHoachKiemTraCongTrinh>():T} 
                                    ON {Sql.Entity<KeHoachKiemTra>(x => x.id):TC} = {Sql.Entity<KeHoachKiemTraCongTrinh>(x => x.kehoach_id):TC}
                                WHERE {condition}";
                if (dto.take > 0)
                {
                    sql += $@" LIMIT {dto.take} OFFSET {dto.skip}";
                }
                return new RestPagedDataTable()
                {
                    data = session.Query<KeHoachKiemTra>(sql, dto).ToList(),
                    recordsTotal = session.Query<int>($@"SELECT COUNT(1) FROM {Sql.Entity<KeHoachKiemTra>():T} 
                        LEFT JOIN {Sql.Entity<KeHoachKiemTraCongTrinh>():T} 
                        ON {Sql.Entity<KeHoachKiemTra>(x => x.id):TC} = {Sql.Entity<KeHoachKiemTraCongTrinh>(x => x.kehoach_id):TC}
                        WHERE {condition}", dto).FirstOrDefault()
                };
            }
        }

        [HttpPost("exportRelationship")]
        public IActionResult exportRelationFeature([FromForm] RelationSearchParameter param)
        {
            using (var session = OpenSession())
            {

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (ExcelPackage excel = new ExcelPackage())
                {
                    ExcelRange cell;
                    var results = getRelationFeature(param.tableId, param.featureId);

                    if (results.Count() > 0)
                    {
                        var dataGroupByLayer = results.GroupBy(x => x.layer_id);
                        foreach (var layerExport in dataGroupByLayer)
                        {
                            if (layerExport.Count() > 0)
                            {
                                Layer? layer = getLayerWithTableAndColumn(layerExport.Key);
                                int STT = 0;
                                int row = 1;
                                string cellMerge;
                                if (layer != null)
                                {
                                    string tableName = $"{layer.table.table_schema}.{layer.table.table_name}";

                                    ExcelWorksheet sheet = excel.Workbook.Worksheets.Add($"{layer.name_vn}");
                                    sheet.DefaultRowHeight = 20;

                                    var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                                    var selectedColumns = layer.table.columns.Where(x =>
                                    {
                                        return (x.visible && !x.is_identity) && x.column_name != EnumPgDataType.Geometry && !x.column_name.ToLower().Contains("shape");
                                    }).OrderBy(x => x.order).ToList();

                                    var columnsStr = string.Join(",", selectedColumns.Select(x => x.column_name));

                                    int totalCol = selectedColumns.Count();

                                    cell = sheet.Cells[sheet.Cells[row, 1] + ":" + sheet.Cells[row, totalCol + 1]];
                                    cell.Merge = true;
                                    cell.Style.Font.Size = 12;
                                    cell.Style.Font.Name = "Verdana";
                                    cell.Value = "Thông tin dữ liệu " + " - " + layer.name_vn;
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    row = 3;
                                    var col = 1;
                                    cell = sheet.Cells[sheet.Cells[row, 1] + ":" + sheet.Cells[row + 1, 1]];
                                    cell.Merge = true;
                                    cell.Style.Font.Size = 8;
                                    cell.Style.Font.Name = "Verdana";
                                    cell.Value = "STT";
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    col = 2;
                                    foreach (var column in selectedColumns)
                                    {
                                        cell = sheet.Cells[row, col];
                                        cell.Style.Font.Size = 8;
                                        cell.Style.Font.Name = "Verdana";
                                        cell.Value = column.name_vn;
                                        cell.Style.WrapText = true;
                                        OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                        cell = sheet.Cells[row + 1, col];
                                        OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                        cellMerge = sheet.Cells[row, col] + ":" + sheet.Cells[row + 1, col];
                                        cell = sheet.Cells[cellMerge];
                                        cell.Merge = true;

                                        col++;
                                    }
                                    row = row + 1;
                                    foreach (var featureItem in layerExport)
                                    {
                                        if (String.IsNullOrWhiteSpace(featureItem.name))
                                        {
                                            featureItem.name = "OBJECTID";
                                        }
                                        string query = $"SELECT {columnsStr} FROM {tableName} WHERE {keyColumn.column_name}= {featureItem.id} ORDER BY {keyColumn.column_name}";
                                        var feature = session.Query<object>($"{query}").FirstOrDefault();

                                        if (feature != null)
                                        {
                                            row = row + 1;
                                            STT = STT + 1;

                                            cell = sheet.Cells[row, 1];
                                            cell.Style.Font.Size = 8;
                                            cell.Style.Font.Name = "Verdana";
                                            cell.Value = STT;
                                            OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                            var colIdx = 2;
                                            var incre = 0;

                                            var rowValue = feature as IDictionary<string, object>;
                                            if (rowValue != null)
                                            {
                                                for (int j = 0; j < selectedColumns.Count(); j++)
                                                {
                                                    var currentCol = rowValue.FirstOrDefault(s => s.Key == selectedColumns[j].column_name);

                                                    cell = sheet.Cells[row, colIdx + j + incre];
                                                    cell.Style.Font.Size = 8;
                                                    cell.Style.Font.Name = "Verdana";
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                                    if (currentCol.Value != null)
                                                    {
                                                        switch (selectedColumns[j].data_type)
                                                        {
                                                            case EnumPgDataType.BigInt:
                                                            case EnumPgDataType.SmallInt:
                                                            case EnumPgDataType.Integer:
                                                            case EnumPgDataType.Double:
                                                                cell.Value = currentCol.Value;
                                                                break;
                                                            case EnumPgDataType.String:
                                                            case EnumPgDataType.Text:
                                                                cell.Value = currentCol.Value.ToString();
                                                                break;
                                                            case EnumPgDataType.Date:
                                                            case EnumPgDataType.Time:
                                                            case EnumPgDataType.DateTime:
                                                            case EnumPgDataType.DateTimeTZ:
                                                                cell.Value = Convert.ToDateTime(currentCol.Value)
                                                                    .ToString("dd/MM/yyyy");
                                                                break;
                                                            default:
                                                                break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    sheet.Cells.AutoFitColumns();
                                }
                            }
                        }
                    }
                    else
                    {
                        ExcelWorksheet sheet = excel.Workbook.Worksheets.Add($"Không có dữ liệu");
                    }
                    return File(excel.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                       $"PhanTu_LienQuan.xlsx");
                }
            }
        }

        private List<string> GetTableFromFilter(JToken? jTokens)
        {
            if (jTokens == null)
            {
                return new List<string>();
            }
            List<string> parsedFilter = new List<string>();
            if (jTokens is JArray && jTokens.Any(x => x.Type != JTokenType.String && x.Type != JTokenType.Null))
            {
                foreach (JToken? f in jTokens)
                {
                    if (f is JArray)
                    {
                        parsedFilter.AddRange(GetTableFromFilter(f));
                    }
                    else if (f.Type == JTokenType.String)
                    {
                        parsedFilter.Add(f.Value<string?>() ?? "");
                    }
                }
            }
            else
            {
                if (jTokens.Count() == 3)
                {

                    if (jTokens[0].Value<string?>()?.ToLower() == "table_name")
                    {
                        return new List<string>{
                            jTokens[2].Value<string?>()
                        };
                    }
                }
                else
                {
                    return new List<string>();
                }
            }

            return parsedFilter;
        }

        [HttpPost("quick-search")]
        public RestBase quickSearch([FromBody] QuickSearchListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null)
                {
                    return new RestError(400, "Lỗi tham số!");
                }

                string cacheKey = "quick-search-" + "_" + StringHelper.MD5Hash(JsonConvert.SerializeObject(dto));

                var oldCache = _cacheProvider.Get<RestData>(cacheKey);

                if (oldCache.HasValue)
                {
                    return oldCache.Value;
                }

                var tables = getTablesAndColumns(string.Empty, dto.map_id, string.Empty, hasLayer: true, filterIds: dto.table_id).ToList();
                var listSQL = new List<string>();
                var listSQLCount = new List<string>();
                var listSQLTotalCount = new List<string>();
                var listSQLBoundary = new List<string>();

                if (dto.filter != null)
                {
                    var listTablesFilter = GetTableFromFilter(dto.filter).Where(x => string.IsNullOrWhiteSpace(x) == false && x.ToLower() != "and" && x.ToLower() != "or").ToList();
                    if (listTablesFilter.Count > 0)
                    {
                        tables = tables.Where(x => listTablesFilter.Contains(x.name_vn)).ToList();
                    }
                }

                foreach (var table in tables)
                {
                    if (dto.@params?.Any(x => x.Key == "table_name") == true)
                    {
                        if (table.name_vn != dto.@params?.FirstOrDefault(x => x.Key == "table_name").Value?.ToString())
                        {
                            continue;
                        }
                    }
                    var listTableConditions = new List<string> { "1=1" };
                    var listTotalCountConditions = new List<string> { "1=1" };
                    if (string.IsNullOrWhiteSpace(dto.keyword) == false)
                    {
                        if (table.columns.Any(x => x.column_name == "search_content"))
                        {
                            if (dto.keyword.Contains(" "))
                            {
                                listTableConditions.Add($"search_content @@ to_tsquery('{dto.keyword.ToFullTextStringProximity()}')");
                                listTotalCountConditions.Add($"search_content @@ to_tsquery('{dto.keyword.ToFullTextStringProximity()}')");
                            }
                            else
                            {
                                listTableConditions.Add($"search_content @@ phraseto_tsquery('{dto.keyword.ToFullTextStringProximity()}')");
                                listTotalCountConditions.Add($"search_content @@ phraseto_tsquery('{dto.keyword.ToFullTextStringProximity()}')");
                            }
                        }
                        else
                        {
                            listTableConditions.Add("1=2");
                            listTotalCountConditions.Add("1=2");
                        }
                    }
                    if (string.IsNullOrWhiteSpace(dto.geom) == false && table.columns.Any(x => x.column_name == "geom"))
                    {
                        listTableConditions.Add($"ST_Intersects({table.table_name}.geom, ST_SetSRID(ST_GeomFromGeoJSON('{dto.geom}'), 4326))");
                        listTotalCountConditions.Add($"ST_Intersects({table.table_name}.geom, ST_SetSRID(ST_GeomFromGeoJSON('{dto.geom}'), 4326))");
                    }
                    if (dto.capQuanLy.HasValue)
                    {
                        if (table.columns.Any(x => x.column_name == "madonviquanly"))
                        {
                            if (dto.capQuanLy == 1)
                            {
                                listTableConditions.Add($"(madonviquanly::TEXT = '1' OR madonviquanly IS NULL OR madonviquanly::TEXT = '')");
                                listTotalCountConditions.Add($"(madonviquanly::TEXT = '1' OR madonviquanly IS NULL OR madonviquanly::TEXT = '')");
                            }
                            else
                            {
                                listTableConditions.Add($"(madonviquanly IS NOT NULL AND madonviquanly::TEXT <> '1')");
                                listTotalCountConditions.Add($"(madonviquanly IS NOT NULL AND madonviquanly::TEXT <> '1')");
                            }
                        }
                    }
                    if (table.columns.Where(x => x.column_name == "province_code").Count() > 0 && string.IsNullOrWhiteSpace(dto.province_code) == false)
                    {
                        var provinces = dto.province_code.Split(",").ToList();
                        if (provinces.Count() > 0)
                        {
                            listTableConditions.Add($"province_code IN ({String.Join(",", provinces.Select(x => $"'{x}'"))})");
                            listTotalCountConditions.Add($"province_code IN ({String.Join(",", provinces.Select(x => $"'{x}'"))})");
                        }
                    }
                    if (table.columns.Where(x => x.column_name == "district_code").Count() > 0 && string.IsNullOrWhiteSpace(dto.district_code) == false)
                    {
                        var districts = dto.district_code.Split(",").ToList();
                        if (districts.Count() > 0)
                        {
                            listTableConditions.Add($"district_code IN ({String.Join(",", districts.Select(x => $"'{x}'"))})");
                            listTotalCountConditions.Add($"district_code IN ({String.Join(",", districts.Select(x => $"'{x}'"))})");
                        }
                    }
                    if (table.columns.Where(x => x.column_name == "commune_code").Count() > 0 && string.IsNullOrWhiteSpace(dto.commune_code) == false)
                    {
                        var communes = dto.commune_code.Split(",").ToList();
                        if (communes.Count() > 0)
                        {
                            listTableConditions.Add($"commune_code IN ({String.Join(",", communes.Select(x => $"'{x}'"))})");
                            listTotalCountConditions.Add($"commune_code IN ({String.Join(",", communes.Select(x => $"'{x}'"))})");
                        }
                    }

                    if (dto.filter != null)
                    {
                        string parsed = StringUtils.ParseFilter(table, dto.filter);
                        if (string.IsNullOrWhiteSpace(parsed))
                        {
                            parsed = "1=1";
                        }
                        listTableConditions.Add($"({parsed})");
                    }

                    var conditions = getConditions(table, dto.@params);

                    if (string.IsNullOrWhiteSpace(conditions) == false)
                    {
                        listTableConditions.Add(conditions);
                        listTotalCountConditions.Add(conditions);
                    }

                    TableColumn? keyColumn = table.key_column ?? table.identity_column ?? table.columns.FirstOrDefault(o => o.column_name.Contains("id"));
                    TableColumn? labelColumn = table.label_column ?? keyColumn;

                    var table_innerjoin_sql = string.Empty;
                    var region_name = string.Empty;

                    var sqlRegion = new List<String>();
                    var sqlJoin = new List<string>();
                    // if (table.columns.Any(x => x.column_name == "province_code"))
                    // {
                    //     sqlRegion.Add($"{Sql.Entity<Province>(x => x.name_vn):TC} AS district");
                    //     sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_name}.province_code");
                    // }
                    // if (table.columns.Any(x => x.column_name == "district_code"))
                    // {
                    //     sqlRegion.Add($"{Sql.Entity<District>(x => x.name_vn):TC} AS district");
                    //     sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_name}.district_code");
                    // }
                    // if (table.columns.Any(x => x.column_name == "commune_code"))
                    // {
                    //     sqlRegion.Add($"{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune");
                    //     sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_name}.commune_code");
                    // }
                    var region = sqlRegion.Count > 0 ? String.Join(",", sqlRegion) : "'' as province, '' AS district, '' AS commune";
                    var join = sqlJoin.Count > 0 ? String.Join(" ", sqlJoin) : "";
                    // var query = $@"SELECT COUNT(1) FROM {table.table_schema}.{table.table_name} {join} WHERE {String.Join(" AND ", listTableConditions)}";
                    if (dto.requireGroupCount == true && dto.group != null && dto.group.Count() > 0)
                    {
                        DxGroup? firstGroup = dto.group.FirstOrDefault();
                        TableColumn? groupedColumn = table.columns.FirstOrDefault(x => x.column_name == firstGroup?.selector);
                        if (firstGroup?.selector == "province")
                        {
                            groupedColumn = table.columns.FirstOrDefault(x => x.column_name == "province_code");
                        }
                        if (firstGroup?.selector == "district")
                        {
                            groupedColumn = table.columns.FirstOrDefault(x => x.column_name == "district_code");
                        }
                        if (firstGroup?.selector == "commune")
                        {
                            groupedColumn = table.columns.FirstOrDefault(x => x.column_name == "commune_code");
                        }
                        string tableAlias = $"\"{table.table_schema}\".\"{table.table_name}\"";
                        StringBuilder stringBuilder = new StringBuilder();
                        if (firstGroup?.selector == "table_name")
                        {
                            stringBuilder.AppendLine($"SELECT COUNT(1) AS count, '{table.name_vn}' AS key FROM {tableAlias} {join}");
                            stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTableConditions)}");
                            listSQLCount.Add(stringBuilder.ToString());

                            stringBuilder = new StringBuilder();
                            stringBuilder.AppendLine($"SELECT COUNT(1) AS count, '{table.name_vn}' AS key FROM {tableAlias} {join}");
                            stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTotalCountConditions)}");
                            listSQLTotalCount.Add(stringBuilder.ToString());
                        }
                        else if (firstGroup?.selector == "matuyen")
                        {
                            var tuyenColumn = table.columns.FirstOrDefault(x => x.column_name.Contains("matuyen"));
                            if (tuyenColumn != null)
                            {
                                TableInfo? domainTable = null;
                                TableColumn? domainLabel = null;
                                TableColumn? domainKey = null;
                                // join để lấy thông tin domain name hiển thị cho các bảng có domain, tuy nhiên khi search vẫn truyền tên nên chưa thể lọc đc
                                // if (tuyenColumn.lookup_table_id > 0)
                                // {
                                //     domainTable = getTableAndColumns(tuyenColumn.lookup_table_id); ;
                                //     if (domainTable != null)
                                //     {
                                //         domainKey = domainTable.key_column ?? domainTable.identity_column;
                                //         domainLabel = domainTable.label_column ?? domainTable.key_column ?? domainTable.identity_column;
                                //     }
                                // }
                                if (domainTable == null || domainLabel == null || domainKey == null)
                                {
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, {tableAlias}.{tuyenColumn.column_name} AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTableConditions)} GROUP BY {tableAlias}.{tuyenColumn.column_name}");
                                    listSQLCount.Add(stringBuilder.ToString());

                                    stringBuilder = new StringBuilder();
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, {tableAlias}.{tuyenColumn.column_name} AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTotalCountConditions)} GROUP BY {tableAlias}.{tuyenColumn.column_name}");
                                    listSQLTotalCount.Add(stringBuilder.ToString());
                                }
                                else
                                {
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, \"{domainTable.table_schema}\".\"{domainTable.table_name}\".\"{domainLabel.column_name}\" AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"LEFT JOIN \"{domainTable.table_schema}\".\"{domainTable.table_name}\" ON {tableAlias}.{tuyenColumn.column_name} = \"{domainTable.table_schema}\".\"{domainTable.table_name}\".\"{domainKey.column_name}\"");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTableConditions)} GROUP BY \"{domainTable.table_schema}\".\"{domainTable.table_name}\".\"{domainLabel.column_name}\"");
                                    listSQLCount.Add(stringBuilder.ToString());

                                    stringBuilder = new StringBuilder();
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, \"{domainTable.table_schema}\".\"{domainTable.table_name}\".\"{domainLabel.column_name}\" AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"LEFT JOIN \"{domainTable.table_schema}\".\"{domainTable.table_name}\" ON {tableAlias}.{tuyenColumn.column_name} = \"{domainTable.table_schema}\".\"{domainTable.table_name}\".\"{domainKey.column_name}\"");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTotalCountConditions)} GROUP BY \"{domainTable.table_schema}\".\"{domainTable.table_name}\".\"{domainLabel.column_name}\"");
                                    listSQLTotalCount.Add(stringBuilder.ToString());
                                }
                            }
                            else
                            {
                                stringBuilder.AppendLine($"SELECT COUNT(1) AS count, '' AS key FROM {tableAlias} {join}");
                                stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTableConditions)} group by key");
                                listSQLCount.Add(stringBuilder.ToString());

                                stringBuilder = new StringBuilder();
                                stringBuilder.AppendLine($"SELECT COUNT(1) AS count, '' AS key FROM {tableAlias} {join}");
                                stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTotalCountConditions)} group by key");
                                listSQLTotalCount.Add(stringBuilder.ToString());
                            }
                        }
                        else
                        {
                            if (groupedColumn != null)
                            {
                                if (firstGroup?.selector == "province")
                                {
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, {Sql.Entity<Province>(x => x.name_vn):TC} AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTableConditions)} GROUP BY {Sql.Entity<Province>(x => x.name_vn):TC}");
                                }
                                else if (firstGroup?.selector == "district")
                                {
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, {Sql.Entity<District>(x => x.name_vn):TC} AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTableConditions)} GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}");
                                }
                                else if (firstGroup?.selector == "commune")
                                {
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, {Sql.Entity<Commune>(x => x.name_vn):TC} AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTableConditions)} GROUP BY {Sql.Entity<Commune>(x => x.name_vn):TC}");
                                }
                                else
                                {
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, {firstGroup?.selector} AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTableConditions)} GROUP BY {firstGroup?.selector}");
                                    listSQLCount.Add(stringBuilder.ToString());

                                    stringBuilder = new StringBuilder();
                                    stringBuilder.AppendLine($"SELECT COUNT(1) AS count, {firstGroup?.selector} AS key FROM {tableAlias} {join}");
                                    stringBuilder.AppendLine($"WHERE {String.Join(" AND ", listTotalCountConditions)} GROUP BY {firstGroup?.selector}");
                                    listSQLTotalCount.Add(stringBuilder.ToString());
                                }
                            }
                        }
                    }

                    var regionCodeSql = new List<string>();
                    if (table.columns.Any(x => x.column_name == "province_code"))
                    {
                        regionCodeSql.Add("province_code");
                    }
                    else
                    {
                        regionCodeSql.Add("'' AS province_code");
                    }
                    if (table.columns.Any(x => x.column_name == "district_code"))
                    {
                        regionCodeSql.Add("district_code");
                    }
                    else
                    {
                        regionCodeSql.Add("'' AS district_code");
                    }
                    if (table.columns.Any(x => x.column_name == "commune_code"))
                    {
                        regionCodeSql.Add("commune_code");
                    }
                    else
                    {
                        regionCodeSql.Add("'' AS commune_code");
                    }

                    var maTuyenColumn = table.columns.FirstOrDefault(x => x.column_name.Contains("matuyen"));
                    var tuyenCodeSql = maTuyenColumn == null ? $"'' AS matuyen" : $"\"{maTuyenColumn.column_name}\" AS matuyen";

                    var table_select_sql = $@"SELECT
                            CONCAT('{table.table_name}', '.', {table.table_name}.{keyColumn?.column_name}) AS uid
                            ,{table.table_name}.{keyColumn?.column_name}::TEXT AS id
                            ,{table.table_name}.{labelColumn?.column_name}::TEXT AS name
                            ,{table.id} AS table_id
                            ,'{table.name_vn}' AS table_name
                            ,{tuyenCodeSql}
                            ,{string.Join(",", regionCodeSql)}
                        FROM {table.table_schema}.{table.table_name}
                        {join}
                        WHERE {String.Join(" AND ", listTableConditions)}";

                    listSQL.Add(table_select_sql);

                    if (table.columns.Any(x => x.column_name == "geom"))
                    {
                        var table_boundary_sql = $@"SELECT {table.table_name}.geom
                                            FROM {table.table_schema}.{table.table_name}
                                            {join}
                                            WHERE {String.Join(" AND ", listTableConditions)} AND {table.table_name}.geom IS NOT NULL";
                        listSQLBoundary.Add(table_boundary_sql);
                    }
                }
                string? boundary = string.Empty;
                if (listSQLBoundary.Count() > 0 && dto.requireBoundary.HasValue && dto.requireBoundary.Value == true)
                {
                    boundary = session.Query<string>($"SELECT ST_AsGeoJSON(ST_Extent(geom)) FROM ({string.Join(" UNION ALL ", listSQLBoundary)}) AS layers").FirstOrDefault();
                }
                if (dto.requireGroupCount == true && dto.group != null && dto.group.Count() > 0)
                {
                    string sqlCount = string.Empty;
                    DxGroup? firstGroup = dto.group.FirstOrDefault();

                    // sqlCount = $"SELECT SUM(COALESCE(count, 0, count)) AS count, key FROM ({string.Join(" UNION ALL ", listSQLCount)}) AS tables GROUP by key;";

                    // var groupedData = session.Query<DevExprGridGroupItem>(sqlCount).ToList();

                    var groupedData = new List<DevExprGridGroupItem>();

                    foreach (var sCount in listSQLCount)
                    {
                        groupedData.AddRange(session.Query<DevExprGridGroupItem>(sCount));
                    }

                    groupedData = groupedData.GroupBy(o => o.key).Select(p => new DevExprGridGroupItem { key = p.Key, count = p.Sum(x => x.count) }).ToList();

                    if (dto.groupSummary != null && dto.groupSummary.Count() > 0)
                    {
                        var groupSummary = dto.groupSummary.FirstOrDefault();
                        if (groupSummary != null)
                        {
                            groupedData.ForEach(o => o.summary = new List<object>() { o.count });
                        }
                    }

                    string totalCountSql = $"SELECT SUM(COALESCE(count, 0, count)) AS total FROM ({string.Join(" UNION ALL ", listSQLTotalCount)}) AS tables";

                    long totalCount = session.Query<long?>(totalCountSql).FirstOrDefault() ?? 0;

                    if (totalCount == 1)
                    {
                        var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", listSQL)}) AS tables ORDER BY \"uid\" ASC";
                        if (dto.take > 0)
                        {
                            sql += $@" LIMIT {dto.take} OFFSET {dto.skip}";
                        }
                        var result = session.Query(sql, new { }).ToList();
                        var records = result.Select(x => (IDictionary<string, object>)x).ToList();


                        var response = new RestData()
                        {
                            data = new
                            {
                                dataSearch = new DevExprGridGroupData
                                {
                                    data = groupedData.Where(o => o.count > 0).ToList(),
                                    totalCount = totalCount,
                                    groupCount = groupedData.Where(o => o.count > 0).Count(),
                                    boundary = boundary,
                                    items = records,
                                }
                            }
                        };

                        _cacheProvider.Set<RestData>(cacheKey, response, TimeSpan.FromMinutes(1));

                        return response;
                    }

                    var r = new RestData()
                    {
                        data = new
                        {
                            dataSearch = new
                            {
                                data = groupedData.Where(o => o.count > 0).ToList(),
                                totalCount = totalCount,
                                groupCount = groupedData.Where(o => o.count > 0).Count(),
                                boundary = boundary
                            }
                        }
                    };

                    _cacheProvider.Set<RestData>(cacheKey, r, TimeSpan.FromMinutes(1));

                    return r;
                }
                else
                {
                    string orderBy = string.Empty;
                    List<string> listOrders = new List<string>();
                    if (dto.sort != null && dto.sort.Count() > 0)
                    {
                        foreach (var s in dto.sort)
                        {
                            listOrders.Add($"\"{s.selector}\"" + (s.desc ? "DESC" : "ASC"));
                        }
                        if (listOrders.Count > 0)
                        {
                            orderBy += $" ORDER BY {string.Join(",", listOrders)}";
                        }
                    }

                    // var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", listSQL)}) AS tables ORDER BY table_order, table_name, name";
                    var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", listSQL)}) AS tables";
                    if (string.IsNullOrWhiteSpace(orderBy) == false)
                    {
                        sql += orderBy;
                        sql += ", \"uid\" ASC";
                    }
                    else
                    {
                        sql += " ORDER BY \"uid\" ASC";
                    }
                    if (dto.skip >= 0)
                    {
                        sql += $" OFFSET {dto.skip}";
                    }
                    if (dto.take >= 0)
                    {
                        sql += $@" LIMIT {dto.take}";
                    }
                    var count = session.Query<int>($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", listSQL)}) AS tables").FirstOrDefault();
                    var result = session.Query(sql, new { }).ToList();
                    var records = result.Select(x => (IDictionary<string, object>)x).ToList();

                    var r = new RestData()
                    {
                        data = new
                        {
                            dataSearch = new DevExprGridData
                            {
                                data = records,
                                totalCount = count,
                                boundary = boundary
                            }
                        }
                    };

                    _cacheProvider.Set<RestData>(cacheKey, r, TimeSpan.FromMinutes(1));

                    return r;
                }
            }
        }

        [HttpPost("exportQuickSearch/{fileType}")]
        public IActionResult exportSearch([FromBody] QuickSearchListDxDTO @params, [FromRoute] string fileType = "")
        {
            using (var session = OpenSession())
            {
                switch (fileType)
                {
                    case "excel":
                        return exportQuickSearchExcel(@params);
                    case "shapefile":
                        return exportQuickSearchShapeFile(@params);
                    default:
                        return NotFound();
                }
            }
        }

        [HttpPost("exportSearch/{fileType}")]
        public IActionResult exportData([FromBody] SearchByLogicDTO dto, [FromRoute] string fileType = "")
        {
            using (var session = OpenSession())
            {
                if (dto == null || (!dto.layer_id.HasValue || dto.layer_id.Value == 0) && (!dto.table_id.HasValue || dto.table_id.Value == 0))
                    return NotFound();
                TableInfo? table = null;
                if (dto.layer_id.HasValue && dto.layer_id.Value > 0)
                {
                    Layer? layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                    if (layer == null) return NotFound();
                    table = layer.table;
                }
                else
                {
                    table = getTableAndColumns(dto.table_id.Value);
                }
                switch (fileType)
                {
                    case "excel":
                        return exportSearchExcel(table, dto);
                    case "shapefile":
                        return exportSearchShapeFile(table, dto);
                    case "csv":
                        return exportSearchCsv(table, dto);
                    default:
                        return NotFound();
                }
            }
        }

        private FileContentResult exportQuickSearchExcel(QuickSearchListDxDTO @param)
        {
            using (var session = OpenSession())
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (ExcelPackage p = new ExcelPackage())
                {
                    AddData(p, @param);
                    return File(p.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                       $"ThongTin_TimKiem.xlsx");
                }
            }
        }

        private FileContentResult exportQuickSearchShapeFile(QuickSearchListDxDTO @param)
        {
            using (var session = OpenSession())
            {
                var geojsonWriter = new GeoJsonWriter();
                var geojsonReader = new GeoJsonReader();
                //
                var data = getQuickSearchFeatures(@param);
                var dataGroupByLayer = data.GroupBy(x => x.table_id);
                using (var ms = new MemoryStream())
                {
                    ZipOutputStream zipStream = new ZipOutputStream(ms);
                    zipStream.SetLevel(3); //0-9, 9 being the highest level of compression

                    if (dataGroupByLayer != null && dataGroupByLayer.Count() > 0)
                    {

                        foreach (var layerExport in dataGroupByLayer)
                        {
                            if (layerExport.Key != null)
                            {
                                TableInfo? table = getTableAndColumns(layerExport.Key.Value);
                                if (table != null)
                                {

                                    TableColumn? keyColumn = table.key_column ?? table.identity_column;
                                    if (keyColumn == null)
                                        continue;
                                    List<TableColumn> selectedColumns = table.columns.Where(x => "geom".Equals(x.column_name) == false && x.column_name != "desc" && x.visible).ToList();

                                    var columnsStr = string.Join(",", selectedColumns.Select(x => x.column_name));
                                    string sqlQuery = $"SELECT {columnsStr} FROM {table.table_schema}.{table.table_name} WHERE {keyColumn.column_name}::TEXT = ANY(@feature_ids) ORDER BY {keyColumn.column_name}";
                                    var features = session.Query<object>($"{sqlQuery}", new { feature_ids = layerExport.Select(x => x.id.ToString()).ToArray() }).ToList();

                                    if (features != null && features.Count() > 0)
                                    {
                                        string shpName = Path.GetTempFileName();
                                        shpName = Path.ChangeExtension(shpName, "shp");
                                        string shxName = Path.GetTempFileName();
                                        shxName = Path.ChangeExtension(shxName, "shx");
                                        string dbfName = Path.GetTempFileName();
                                        dbfName = Path.ChangeExtension(dbfName, "dbf");
                                        string cpgName = Path.GetTempFileName();
                                        cpgName = Path.ChangeExtension(cpgName, "cpg");
                                        string prjName = Path.GetTempFileName();
                                        prjName = Path.ChangeExtension(prjName, "prj");

                                        System.IO.File.WriteAllText(cpgName, "UTF-8");
                                        System.IO.File.WriteAllText(prjName, "GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]]");

                                        IStreamProvider shapeStream = new FileStreamProvider(StreamTypes.Shape, shpName);
                                        IStreamProvider dataStream = new FileStreamProvider(StreamTypes.Data, dbfName);
                                        IStreamProvider idxStream = new FileStreamProvider(StreamTypes.Index, shxName);

                                        IStreamProviderRegistry streamProviderRegistry =
                                            new ShapefileStreamProviderRegistry(shapeStream, dataStream, idxStream);
                                        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                                        var wktReader = new WKTReader(geometryFactory);

                                        List<IFeature> newFeatures = new List<IFeature>();
                                        DbaseFileHeader header = new DbaseFileHeader();
                                        header.NumRecords = features.Count;

                                        var rowHeader = 0;
                                        foreach (var row in features)
                                        {
                                            var items = row as IDictionary<string, object>;
                                            var attributes = new AttributesTable();

                                            foreach (string key in items?.Keys)
                                            {
                                                int countChar = 1;

                                                string? name = key?.ToLower().Trim();
                                                if (!string.IsNullOrWhiteSpace(name) && name.Length > 11)
                                                {
                                                    name = name.Substring(0, 11);
                                                    if (attributes.Exists(name))
                                                    {
                                                        name = key?.Substring(0, 11 - countChar);
                                                        countChar++;
                                                    }
                                                }

                                                object value = items.FirstOrDefault(s => s.Key == key).Value;

                                                var tableColumn = table.columns.FirstOrDefault(s => s.column_name == key);

                                                if (tableColumn != null && rowHeader == 0)
                                                {
                                                    switch (tableColumn.data_type)
                                                    {
                                                        case EnumPgDataType.BigInt:
                                                        case EnumPgDataType.SmallInt:
                                                        case EnumPgDataType.Integer:
                                                            header.AddColumn(name, 'N', IntLength, IntDecimals);
                                                            break;
                                                        case EnumPgDataType.Boolean:
                                                            header.AddColumn(name, 'L', BoolLength, BoolDecimals);
                                                            break;
                                                        case EnumPgDataType.Double:
                                                            header.AddColumn(name, 'N', DoubleLength, DoubleDecimals);
                                                            break;
                                                        case EnumPgDataType.String:
                                                        case EnumPgDataType.Text:
                                                            header.AddColumn(name, 'C', StringLength, StringDecimals);
                                                            break;
                                                        case EnumPgDataType.Date:
                                                        case EnumPgDataType.Time:
                                                        case EnumPgDataType.DateTime:
                                                            header.AddColumn(name, 'D', DateLength, DateDecimals);
                                                            break;
                                                        default:
                                                            break;
                                                    }
                                                }

                                                attributes.Add(name, items.FirstOrDefault(s => s.Key == key).Value);
                                            }

                                            rowHeader++;

                                            if (items.ContainsKey("geom"))
                                            {
                                                if (string.IsNullOrWhiteSpace(items.FirstOrDefault(s => s.Key == "geom").Value?.ToString()))
                                                {
                                                    newFeatures.Add(new Feature(geometryFactory.CreateGeometryCollection(), attributes));
                                                }
                                                else
                                                {
                                                    GeoJsonReader reader = new GeoJsonReader();
                                                    Geometry geometry = reader.Read<Geometry>(items.FirstOrDefault(s => s.Key == "geom").Value.ToString());
                                                    String type = geometry.GeometryType;
                                                    newFeatures.Add(new Feature(geometryFactory.CreateGeometry(geometry), attributes));
                                                }
                                            }
                                        }
                                        ShapefileDataWriter shpWriter =
                                            new ShapefileDataWriter(streamProviderRegistry, geometryFactory, Encoding.UTF8);
                                        shpWriter.Header = new DbaseFileHeader(Encoding.UTF8) { NumRecords = features.Count };


                                        foreach (var field in header.Fields)
                                        {
                                            shpWriter.Header.AddColumn(field.Name, field.DbaseType, field.Length, field.DecimalCount);
                                        }

                                        shpWriter.Write(newFeatures);

                                        using (var sShape = new FileStream(shpName, FileMode.OpenOrCreate))
                                        {
                                            ZipEntry shpEntry =
                                                new ZipEntry(
                                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.shp")
                                                {
                                                    Size = sShape.Length,
                                                    DateTime = DateTime.Now
                                                };

                                            zipStream.PutNextEntry(shpEntry);
                                            StreamUtils.Copy(sShape, zipStream, new byte[4096]);
                                            zipStream.CloseEntry();
                                        }

                                        using (var sData = new FileStream(dbfName, FileMode.OpenOrCreate))
                                        {
                                            ZipEntry dbfEntry =
                                                new ZipEntry(
                                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.dbf")
                                                {
                                                    Size = sData.Length,
                                                    DateTime = DateTime.Now
                                                };

                                            zipStream.PutNextEntry(dbfEntry);
                                            StreamUtils.Copy(sData, zipStream, new byte[4096]);
                                            zipStream.CloseEntry();
                                        }

                                        using (var sIdx = new FileStream(shxName, FileMode.OpenOrCreate))
                                        {
                                            ZipEntry shxEntry =
                                                new ZipEntry(
                                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.shx")
                                                {
                                                    Size = sIdx.Length,
                                                    DateTime = DateTime.Now
                                                };

                                            zipStream.PutNextEntry(shxEntry);
                                            StreamUtils.Copy(sIdx, zipStream, new byte[4096]);
                                            zipStream.CloseEntry();
                                        }

                                        using (var sCpg = new FileStream(cpgName, FileMode.OpenOrCreate))
                                        {
                                            ZipEntry cpgEntry =
                                                new ZipEntry(
                                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.shx")
                                                {
                                                    Size = sCpg.Length,
                                                    DateTime = DateTime.Now
                                                };

                                            zipStream.PutNextEntry(cpgEntry);
                                            StreamUtils.Copy(sCpg, zipStream, new byte[4096]);
                                            zipStream.CloseEntry();
                                        }

                                        using (var sPrj = new FileStream(prjName, FileMode.OpenOrCreate))
                                        {
                                            ZipEntry prjEntry =
                                                new ZipEntry(
                                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.shx")
                                                {
                                                    Size = sPrj.Length,
                                                    DateTime = DateTime.Now
                                                };

                                            zipStream.PutNextEntry(prjEntry);
                                            StreamUtils.Copy(sPrj, zipStream, new byte[4096]);
                                            zipStream.CloseEntry();
                                        }

                                        if (System.IO.File.Exists(shpName))
                                        {
                                            System.IO.File.Delete(shpName);
                                        }
                                        if (System.IO.File.Exists(dbfName))
                                        {
                                            System.IO.File.Delete(dbfName);
                                        }
                                        if (System.IO.File.Exists(shxName))
                                        {
                                            System.IO.File.Delete(shxName);
                                        }
                                        if (System.IO.File.Exists(cpgName))
                                        {
                                            System.IO.File.Delete(cpgName);
                                        }
                                        if (System.IO.File.Exists(prjName))
                                        {
                                            System.IO.File.Delete(prjName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    zipStream.IsStreamOwner = false;
                    zipStream.Close();
                    ms.Position = 0;
                    return File(ms.ToArray(), "application/zip", string.Format("{0}.zip", "ThongTin_TimKiem"));
                }
            }
        }

        private FileContentResult exportQuickSearchCsv(QuickSearchListDxDTO @param)
        {
            using (var session = OpenSession())
            {
                var data = getQuickSearchFeatures(@param);
                using (var ms = new MemoryStream())
                {
                    using (StreamWriter objWriter = new StreamWriter(ms))
                    {
                        if (data.Count() > 0)
                        {
                            var dataGroupByLayer = data.GroupBy(x => x.layer_id);
                            if (dataGroupByLayer != null && dataGroupByLayer.Count() > 0)
                            {
                                foreach (var layerExport in dataGroupByLayer)
                                {
                                    if (layerExport.Key != null)
                                    {
                                        Layer? layer = getLayerWithTableAndColumn(layerExport.Key.Value);
                                        if (layer != null)
                                        {
                                            TableColumn? keyColumn = layer.table.key_column ?? layer.table.identity_column;
                                            if (keyColumn == null)
                                                continue;
                                            List<TableColumn> selectedColumns = layer.table.columns.Where(x => "geom".Equals(x.column_name) == false && x.column_name != "desc" && x.visible).ToList();

                                            var columnsStr = string.Join(",", selectedColumns.Select(x => x.column_name));
                                            string sqlQuery = $"SELECT {columnsStr} FROM {layer.table.table_schema}.{layer.table.table_name} WHERE {keyColumn.column_name}::TEXT = ANY(@feature_ids) ORDER BY {keyColumn.column_name}";
                                            var features = session.Query<object>($"{sqlQuery}", new { feature_ids = layerExport.Select(x => x.id.ToString()).ToArray() }).ToList();

                                            if (features != null && features.Count() > 0)
                                            {
                                                DataTable table = new DataTable();
                                                List<string> rowHeaders = new List<string>();

                                                table.Columns.Add("STT", typeof(string));
                                                rowHeaders.Add("STT");
                                                foreach (var column in selectedColumns)
                                                {
                                                    rowHeaders.Add(column.name_vn);
                                                    switch (column.data_type)
                                                    {
                                                        case EnumPgDataType.SmallInt:
                                                        case EnumPgDataType.Integer:
                                                            table.Columns.Add(column.column_name, typeof(int));
                                                            break;
                                                        case EnumPgDataType.Double:
                                                            table.Columns.Add(column.column_name, typeof(double));
                                                            break;
                                                        case EnumPgDataType.DateTime:
                                                        case EnumPgDataType.Time:
                                                            table.Columns.Add(column.column_name, typeof(string));
                                                            break;
                                                        default:
                                                            table.Columns.Add(column.column_name, typeof(string));
                                                            break;
                                                    }
                                                }

                                                var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id)}"));
                                                var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id)}"));
                                                var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id)}"));
                                                var dem = 0;

                                                foreach (var feature in features)
                                                {
                                                    var rowValue = feature as IDictionary<string, object>;
                                                    if (rowValue != null)
                                                    {
                                                        dem++;
                                                        List<object> rowParams = new List<object>();
                                                        rowParams.Add(dem.ToString());
                                                        for (int j = 0; j < selectedColumns.Count(); j++)
                                                        {
                                                            var currentCol = rowValue.FirstOrDefault(s => s.Key == selectedColumns[j].column_name);
                                                            object value = "";
                                                            if (selectedColumns[j].lookup_table_id == 0)
                                                            {
                                                                if (selectedColumns[j].data_type.Equals(EnumPgDataType.Boolean))
                                                                {
                                                                    if (currentCol.Value != null && Convert.ToBoolean(currentCol.Value) == true)
                                                                    {
                                                                        value = "x";
                                                                    }
                                                                }
                                                                else
                                                                {
                                                                    switch (selectedColumns[j].data_type)
                                                                    {
                                                                        case EnumPgDataType.SmallInt:
                                                                        case EnumPgDataType.Integer:
                                                                        case EnumPgDataType.Double:
                                                                            value = currentCol.Value == null ? 0 : currentCol.Value;
                                                                            break;
                                                                        case EnumPgDataType.Date:
                                                                        case EnumPgDataType.Time:
                                                                        case EnumPgDataType.DateTime:
                                                                            value = Convert.ToDateTime(currentCol.Value).ToString("dd/MM/yyyy");
                                                                            break;
                                                                        default:
                                                                            if (currentCol.Value != null && !string.IsNullOrWhiteSpace(currentCol.Value.ToString()))
                                                                            {
                                                                                if (currentCol.Key == "commune_code")
                                                                                {
                                                                                    value = communes.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                                                }
                                                                                else if (currentCol.Key == "district_code")
                                                                                {
                                                                                    value = districts.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                                                }
                                                                                else if (currentCol.Key == "province_code")
                                                                                {
                                                                                    value = provinces.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                                                }
                                                                                else
                                                                                {
                                                                                    value = currentCol.Value.ToString();
                                                                                }
                                                                            }
                                                                            break;
                                                                    }
                                                                }
                                                            }
                                                            else
                                                            {
                                                                List<DomainViewModel> dataDomains = getTableShortData(selectedColumns[j].lookup_table_id).ToList();
                                                                value = dataDomains.FirstOrDefault(x => x.id.ToString() == currentCol.Value.ToString())?.mo_ta;
                                                            }
                                                            rowParams.Add(value);
                                                        }
                                                        table.Rows.Add(rowParams.ToArray());
                                                    }
                                                }

                                                StringBuilder dataCsv = ConvertDataTableToCsvFile(table);
                                                objWriter.WriteLine(dataCsv);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return File(ms.ToArray(), "text/csv", $"ThongTin_TimKiem.csv");
                }
            }
        }

        private FileContentResult exportSearchExcel(TableInfo table, SearchByLogicDTO dto)
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using (ExcelPackage p = new ExcelPackage())
            {
                using (var session = OpenSession())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    var data = getSearchFeatures(table, dto);
                    List<TableColumn> selectedColumns = table.columns.Where(x => "geom".Equals(x.column_name) == false && x.visible).ToList();
                    if (data.Count() > 0)
                    {
                        sheet = p.Workbook.Worksheets.Add($"{table.name_vn}");
                        sheet.DefaultRowHeight = 20;

                        cell = sheet.Cells[1, 1];
                        cell.Style.Font.Size = 14;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Value = "Thông tin dữ liệu " + table.name_vn;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);


                        int row = 1;
                        string cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, selectedColumns.Count() + 1];
                        ExcelRange rng3 = sheet.Cells[cellMerge];
                        rng3.Merge = true;

                        row = 2;

                        cell = sheet.Cells[row, 1];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "STT";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row + 1, 1];
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cellMerge = sheet.Cells[row, 1] + ":" + sheet.Cells[row + 1, 1];
                        rng3 = sheet.Cells[cellMerge];
                        rng3.Merge = true;

                        var col = 2;

                        foreach (var column in selectedColumns)
                        {
                            if (column.lookup_table_id == 0)
                            {
                                if (column.data_type.Equals(EnumPgDataType.Boolean))
                                {
                                    cell = sheet.Cells[row, col];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Value = column.name_vn;
                                    cell.Style.WrapText = true;
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                    var colDM = col;
                                    cell = sheet.Cells[row, col + 1];
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[row + 1, col];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Value = "Có";
                                    cell.Style.WrapText = true;
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[row + 1, col + 1];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Value = "Không";
                                    cell.Style.WrapText = true;
                                    cell.Style.ShrinkToFit = true;
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cellMerge = sheet.Cells[row, col] + ":" + sheet.Cells[row, col + 1];
                                    rng3 = sheet.Cells[cellMerge];
                                    rng3.Merge = true;

                                    col++;
                                }
                                else
                                {
                                    cell = sheet.Cells[row, col];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Value = column.name_vn;
                                    cell.Style.WrapText = true;
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                    cell = sheet.Cells[row + 1, col];
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cellMerge = sheet.Cells[row, col] + ":" + sheet.Cells[row + 1, col];
                                    rng3 = sheet.Cells[cellMerge];
                                    rng3.Merge = true;

                                    if (column.data_type == EnumPgDataType.String || column.data_type == EnumPgDataType.Text)
                                    {
                                        sheet.Columns[col].Width = 20;
                                    }
                                    else
                                    {
                                        sheet.Columns[col].Width = 15;
                                    }
                                }
                            }
                            else
                            {
                                cell = sheet.Cells[row, col];
                                cell.Style.Font.Size = 11;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Value = column.name_vn;
                                cell.Style.WrapText = true;
                                OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                cellMerge = sheet.Cells[row, col] + ":" + sheet.Cells[row + 1, col];
                                rng3 = sheet.Cells[cellMerge];
                                rng3.Merge = true;
                                sheet.Columns[col].Width = 30;
                            }
                            col++;
                        }
                        var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id)}"));
                        var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id)}"));
                        var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id)}"));
                        IDictionary<string, List<DomainViewModel>> domains_values = domainValueForLookup(table);

                        var dem = 0;
                        row = 4;

                        foreach (var rowValue in data)
                        {
                            cell = sheet.Cells[row, 1];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = ++dem;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                            var colIdx = 2;
                            var incre = 0;

                            if (rowValue != null)
                            {
                                for (int j = 0; j < selectedColumns.Count(); j++)
                                {
                                    var currentCol = rowValue.FirstOrDefault(s => s.Key == selectedColumns[j].column_name);

                                    if (selectedColumns[j].lookup_table_id == 0)
                                    {
                                        if (selectedColumns[j].data_type.Equals(EnumPgDataType.Boolean)) //)
                                        {
                                            if (currentCol.Value != null)
                                            {
                                                if (Convert.ToBoolean(currentCol.Value) == true)
                                                {
                                                    cell = sheet.Cells[row, colIdx + j + incre];
                                                    cell.Value = "x";
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);
                                                }
                                                else
                                                {
                                                    cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                    cell.Value = "x";
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);
                                                }
                                            }
                                            else
                                            {
                                                cell = sheet.Cells[row, colIdx + j + incre];
                                                cell.Style.Font.Size = 11;
                                                cell.Style.Font.Name = "Times New Roman";
                                                OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                                cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);
                                            }
                                            incre += 1;
                                        }
                                        else
                                        {
                                            cell = sheet.Cells[row, colIdx + j + incre];
                                            cell.Style.Font.Size = 11;
                                            cell.Style.Font.Name = "Times New Roman";
                                            if (currentCol.Value != null)
                                            {
                                                switch (selectedColumns[j].data_type)
                                                {
                                                    case EnumPgDataType.SmallInt:
                                                    case EnumPgDataType.Integer:
                                                    case EnumPgDataType.Double:
                                                        cell.Value = currentCol.Value;
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.RIGHT);
                                                        break;
                                                    case EnumPgDataType.String:
                                                    case EnumPgDataType.Text:
                                                        if (!string.IsNullOrWhiteSpace(currentCol.Value.ToString()))
                                                        {
                                                            if (currentCol.Key == "commune_code")
                                                            {
                                                                cell.Value = communes.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                            }
                                                            else if (currentCol.Key == "district_code")
                                                            {
                                                                cell.Value = districts.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                            }
                                                            else if (currentCol.Key == "province_code")
                                                            {
                                                                cell.Value = provinces.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                            }
                                                            else
                                                            {
                                                                cell.Value = currentCol.Value.ToString();
                                                            }
                                                        }
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                                        break;
                                                    case EnumPgDataType.Date:
                                                    case EnumPgDataType.Time:
                                                    case EnumPgDataType.DateTime:
                                                        cell.Value = Convert.ToDateTime(currentCol.Value).ToString("dd/MM/yyyy");
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.CENTER);
                                                        break;
                                                    default:
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT);
                                                        break;
                                                }
                                            }
                                            else
                                            {
                                                OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                            }
                                        }
                                    }
                                    else
                                    {
                                        domains_values.TryGetValue(selectedColumns[j].column_name, out var domains);
                                        var domain = domains.Where(x => x.id.ToString() == currentCol.Value.ToString()).FirstOrDefault();
                                        cell = sheet.Cells[row, colIdx + j + incre];
                                        cell.Style.Font.Size = 11;
                                        cell.Style.Font.Name = "Times New Roman";
                                        cell.Value = domain != null ? domain.mo_ta : "Không xác định";

                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                    }
                                }
                                row++;
                            }
                        }
                        sheet.Cells.AutoFitColumns();
                    }
                    else
                    {
                        sheet = p.Workbook.Worksheets.Add("Thông tin tìm kiếm");
                        cell = sheet.Cells[1, 1];
                        cell.Style.Font.Size = 14;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Value = "Thông tin tìm kiếm";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    }
                }
                return File(p.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                   $"ThongTin_TimKiem.xlsx");
            }
        }

        private FileContentResult exportSearchShapeFile(TableInfo table, SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
            {
                var geojsonWriter = new GeoJsonWriter();
                var geojsonReader = new GeoJsonReader();
                var data = getSearchFeatures(table, dto);
                using (var ms = new MemoryStream())
                {
                    ZipOutputStream zipStream = new ZipOutputStream(ms);
                    zipStream.SetLevel(3); //0-9, 9 being the highest level of compression

                    if (data.Count() > 0)
                    {
                        string shpName = Path.GetTempFileName();
                        shpName = Path.ChangeExtension(shpName, "shp");
                        string shxName = Path.GetTempFileName();
                        shxName = Path.ChangeExtension(shxName, "shx");
                        string dbfName = Path.GetTempFileName();
                        dbfName = Path.ChangeExtension(dbfName, "dbf");
                        string cpgName = Path.GetTempFileName();
                        cpgName = Path.ChangeExtension(cpgName, "cpg");
                        string prjName = Path.GetTempFileName();
                        prjName = Path.ChangeExtension(prjName, "prj");

                        System.IO.File.WriteAllText(cpgName, "UTF-8");
                        System.IO.File.WriteAllText(prjName, "GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]]");

                        IStreamProvider shapeStream = new FileStreamProvider(StreamTypes.Shape, shpName);
                        IStreamProvider dataStream = new FileStreamProvider(StreamTypes.Data, dbfName);
                        IStreamProvider idxStream = new FileStreamProvider(StreamTypes.Index, shxName);

                        IStreamProviderRegistry streamProviderRegistry =
                            new ShapefileStreamProviderRegistry(shapeStream, dataStream, idxStream);
                        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                        var wktReader = new WKTReader(geometryFactory);

                        List<IFeature> newFeatures = new List<IFeature>();
                        DbaseFileHeader header = new DbaseFileHeader();
                        header.NumRecords = data.Count();

                        var rowHeader = 0;
                        foreach (var items in data)
                        {
                            var attributes = new AttributesTable();

                            foreach (string key in items?.Keys)
                            {
                                int countChar = 1;

                                string? name = key?.ToLower().Trim();
                                if (!string.IsNullOrWhiteSpace(name) && name.Length > 11)
                                {
                                    name = name.Substring(0, 11);
                                    if (attributes.Exists(name))
                                    {
                                        name = key?.Substring(0, 11 - countChar);
                                        countChar++;
                                    }
                                }

                                object value = items.FirstOrDefault(s => s.Key == key).Value;

                                var tableColumn = table.columns.FirstOrDefault(s => s.column_name == key);

                                if (tableColumn != null && rowHeader == 0)
                                {
                                    switch (tableColumn.data_type)
                                    {
                                        case EnumPgDataType.BigInt:
                                        case EnumPgDataType.SmallInt:
                                        case EnumPgDataType.Integer:
                                            header.AddColumn(name, 'N', IntLength, IntDecimals);
                                            break;
                                        case EnumPgDataType.Boolean:
                                            header.AddColumn(name, 'L', BoolLength, BoolDecimals);
                                            break;
                                        case EnumPgDataType.Double:
                                            header.AddColumn(name, 'N', DoubleLength, DoubleDecimals);
                                            break;
                                        case EnumPgDataType.String:
                                        case EnumPgDataType.Text:
                                            header.AddColumn(name, 'C', StringLength, StringDecimals);
                                            break;
                                        case EnumPgDataType.Date:
                                        case EnumPgDataType.Time:
                                        case EnumPgDataType.DateTime:
                                            header.AddColumn(name, 'D', DateLength, DateDecimals);
                                            break;
                                        default:
                                            break;
                                    }
                                }

                                attributes.Add(name, items.FirstOrDefault(s => s.Key == key).Value);
                            }

                            rowHeader++;

                            if (items.ContainsKey("geom"))
                            {
                                if (string.IsNullOrWhiteSpace(items.FirstOrDefault(s => s.Key == "geom").Value?.ToString()))
                                {
                                    newFeatures.Add(new Feature(geometryFactory.CreateGeometryCollection(), attributes));
                                }
                                else
                                {
                                    GeoJsonReader reader = new GeoJsonReader();
                                    Geometry geometry = reader.Read<Geometry>(items.FirstOrDefault(s => s.Key == "geom").Value.ToString());
                                    String type = geometry.GeometryType;
                                    newFeatures.Add(new Feature(geometryFactory.CreateGeometry(geometry), attributes));
                                }
                            }
                        }
                        ShapefileDataWriter shpWriter =
                            new ShapefileDataWriter(streamProviderRegistry, geometryFactory, Encoding.UTF8);
                        shpWriter.Header = new DbaseFileHeader(Encoding.UTF8) { NumRecords = data.Count };

                        foreach (var field in header.Fields)
                        {
                            shpWriter.Header.AddColumn(field.Name, field.DbaseType, field.Length, field.DecimalCount);
                        }

                        shpWriter.Write(newFeatures);

                        using (var sShape = new FileStream(shpName, FileMode.OpenOrCreate))
                        {
                            ZipEntry shpEntry =
                                new ZipEntry(
                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.shp")
                                {
                                    Size = sShape.Length,
                                    DateTime = DateTime.Now
                                };

                            zipStream.PutNextEntry(shpEntry);
                            StreamUtils.Copy(sShape, zipStream, new byte[4096]);
                            zipStream.CloseEntry();
                        }

                        using (var sData = new FileStream(dbfName, FileMode.OpenOrCreate))
                        {
                            ZipEntry dbfEntry =
                                new ZipEntry(
                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.dbf")
                                {
                                    Size = sData.Length,
                                    DateTime = DateTime.Now
                                };

                            zipStream.PutNextEntry(dbfEntry);
                            StreamUtils.Copy(sData, zipStream, new byte[4096]);
                            zipStream.CloseEntry();
                        }

                        using (var sIdx = new FileStream(shxName, FileMode.OpenOrCreate))
                        {
                            ZipEntry shxEntry =
                                new ZipEntry(
                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.shx")
                                {
                                    Size = sIdx.Length,
                                    DateTime = DateTime.Now
                                };

                            zipStream.PutNextEntry(shxEntry);
                            StreamUtils.Copy(sIdx, zipStream, new byte[4096]);
                            zipStream.CloseEntry();
                        }

                        using (var sCpg = new FileStream(cpgName, FileMode.OpenOrCreate))
                        {
                            ZipEntry cpgEntry =
                                new ZipEntry(
                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.shx")
                                {
                                    Size = sCpg.Length,
                                    DateTime = DateTime.Now
                                };

                            zipStream.PutNextEntry(cpgEntry);
                            StreamUtils.Copy(sCpg, zipStream, new byte[4096]);
                            zipStream.CloseEntry();
                        }

                        using (var sPrj = new FileStream(prjName, FileMode.OpenOrCreate))
                        {
                            ZipEntry prjEntry =
                                new ZipEntry(
                                    $"{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.shx")
                                {
                                    Size = sPrj.Length,
                                    DateTime = DateTime.Now
                                };

                            zipStream.PutNextEntry(prjEntry);
                            StreamUtils.Copy(sPrj, zipStream, new byte[4096]);
                            zipStream.CloseEntry();
                        }

                        if (System.IO.File.Exists(shpName))
                        {
                            System.IO.File.Delete(shpName);
                        }
                        if (System.IO.File.Exists(dbfName))
                        {
                            System.IO.File.Delete(dbfName);
                        }
                        if (System.IO.File.Exists(shxName))
                        {
                            System.IO.File.Delete(shxName);
                        }
                        if (System.IO.File.Exists(cpgName))
                        {
                            System.IO.File.Delete(cpgName);
                        }
                        if (System.IO.File.Exists(prjName))
                        {
                            System.IO.File.Delete(prjName);
                        }
                    }
                    zipStream.IsStreamOwner = false;
                    zipStream.Close();
                    ms.Position = 0;
                    return File(ms.ToArray(), "application/zip", string.Format("{0}.zip", "ThongTin_TimKiem"));
                }
            }
        }

        private FileContentResult exportSearchCsv(TableInfo table, SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
            {
                using (var ms = new MemoryStream())
                {
                    var data = getSearchFeatures(table, dto);
                    List<TableColumn> selectedColumns = table.columns.Where(x => "geom".Equals(x.column_name) == false && x.visible).ToList();
                    using (StreamWriter objWriter = new StreamWriter(ms))
                    {
                        DataTable dataTable = new DataTable();
                        List<string> rowHeaders = new List<string>();

                        dataTable.Columns.Add("STT", typeof(string));
                        rowHeaders.Add("STT");
                        foreach (var column in selectedColumns)
                        {
                            rowHeaders.Add(column.name_vn);
                            if (column.lookup_table_id > 0)
                            {
                                dataTable.Columns.Add(column.column_name, typeof(string));
                            }
                            else
                            {
                                switch (column.data_type)
                                {
                                    case EnumPgDataType.SmallInt:
                                    case EnumPgDataType.Integer:
                                        dataTable.Columns.Add(column.column_name, typeof(int));
                                        break;
                                    case EnumPgDataType.Double:
                                        dataTable.Columns.Add(column.column_name, typeof(double));
                                        break;
                                    case EnumPgDataType.DateTime:
                                    case EnumPgDataType.Time:
                                        dataTable.Columns.Add(column.column_name, typeof(string));
                                        break;
                                    default:
                                        dataTable.Columns.Add(column.column_name, typeof(string));
                                        break;
                                }
                            }

                        }

                        var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id)}"));
                        var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id)}"));
                        var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id)}"));
                        var dem = 0;

                        foreach (var rowValue in data)
                        {
                            if (rowValue != null)
                            {
                                dem++;
                                List<object> rowParams = new List<object>();
                                rowParams.Add(dem.ToString());
                                for (int j = 0; j < selectedColumns.Count(); j++)
                                {
                                    var currentCol = rowValue.FirstOrDefault(s => s.Key == selectedColumns[j].column_name);
                                    object value = "";
                                    if (selectedColumns[j].lookup_table_id == 0)
                                    {
                                        if (selectedColumns[j].data_type.Equals(EnumPgDataType.Boolean))
                                        {
                                            if (currentCol.Value != null && Convert.ToBoolean(currentCol.Value) == true)
                                            {
                                                value = "x";
                                            }
                                        }
                                        else
                                        {
                                            switch (selectedColumns[j].data_type)
                                            {
                                                case EnumPgDataType.SmallInt:
                                                case EnumPgDataType.Integer:
                                                case EnumPgDataType.Double:
                                                    value = currentCol.Value == null ? 0 : currentCol.Value;
                                                    break;
                                                case EnumPgDataType.Date:
                                                case EnumPgDataType.Time:
                                                case EnumPgDataType.DateTime:
                                                    value = Convert.ToDateTime(currentCol.Value).ToString("dd/MM/yyyy");
                                                    break;
                                                default:
                                                    if (currentCol.Value != null && !string.IsNullOrWhiteSpace(currentCol.Value.ToString()))
                                                    {
                                                        if (currentCol.Key == "commune_code")
                                                        {
                                                            value = communes.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                        }
                                                        else if (currentCol.Key == "district_code")
                                                        {
                                                            value = districts.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                        }
                                                        else if (currentCol.Key == "province_code")
                                                        {
                                                            value = provinces.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                        }
                                                        else
                                                        {
                                                            value = currentCol.Value.ToString();
                                                        }
                                                    }
                                                    break;
                                            }
                                        }
                                    }
                                    else
                                    {
                                        List<DomainViewModel> dataDomains = getTableShortData(selectedColumns[j].lookup_table_id).ToList();
                                        value = dataDomains.FirstOrDefault(x => x.id.ToString() == currentCol.Value.ToString())?.mo_ta;
                                    }
                                    rowParams.Add(value);
                                }
                                dataTable.Rows.Add(rowParams.ToArray());
                            }
                        }

                        StringBuilder dataCsv = ConvertDataTableToCsvFile(dataTable);
                        objWriter.WriteLine(dataCsv);
                    }
                    return File(ms.ToArray(), "text/csv", $"DuLieu_{table.table_name}.csv");
                }
            }
        }

        [HttpPost("advanced-search")]
        public RestBase advancedSearch([FromBody] SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null || ((!dto.layer_id.HasValue || dto.layer_id.Value == 0) && (!dto.table_id.HasValue || dto.table_id.Value == 0)))
                {
                    return new RestError(400, "Vui lòng kiểm tra lại tham số!");
                }
                else
                {
                    Map? map = session.Get(new Map { id = dto.mapId.HasValue ? dto.mapId.Value : 0 });

                    if (map == null)
                    {
                        return new RestError(400, "Vui lòng kiểm tra lại tham số!");
                    }

                    Layer? layer = dto.layer_id.HasValue ? getLayerWithTableAndColumn(dto.layer_id.Value) : null;
                    TableInfo? table = layer != null ? layer.table : getTableAndColumns(dto.table_id.Value);
                    if (table == null)
                    {
                        return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    string cacheKey = "advanced-search-" + "_" + (dto.mapId ?? 0) + "_" + table.id + "_" + StringHelper.MD5Hash(JsonConvert.SerializeObject(dto));

                    // var oldCache = _cacheProvider.Get<RestData>(cacheKey);

                    // if (oldCache.HasValue)
                    // {
                    //     return oldCache.Value;
                    // }

                    string conditions = string.Empty;

                    // var domains = domainValueForLookup(table);
                    var domains = new Dictionary<string, List<DomainViewModel>>();
                    IEnumerable<TableRelation> relations = getRelations(table);

                    string select = string.Empty;
                    // if (layer != null)
                    // {
                    //     select = @$"SELECT {String.Join(',', table.columns.Where(x => "geom".Equals(x.column_name) == false).Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))}, ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom ";
                    // }
                    // else
                    // {
                    //     select = @$"SELECT {String.Join(',', table.columns.Where(x => "geom".Equals(x.column_name) == false).Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))} ";
                    // }
                    select = @$"SELECT {String.Join(',', table.columns.Where(x => "geom".Equals(x.column_name) == false && "search_content".Equals(x.column_name) == false).Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))} ";
                    //
                    string tables = @$" FROM {table.table_schema}.{table.table_name} ";
                    // if (table.columns.Any(x => x.column_name == "commune_code"))
                    // {
                    //     select += @$",{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune_name ";
                    //     tables += @$" LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.commune_code ";
                    // }
                    // if (table.columns.Any(x => x.column_name == "district_code"))
                    // {
                    //     select += @$",{Sql.Entity<District>(x => x.name_vn):TC} AS district_name ";
                    //     tables += @$" LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.district_code ";
                    // }
                    // if (table.columns.Any(x => x.column_name == "province_code"))
                    // {
                    //     select += @$",{Sql.Entity<Province>(x => x.name_vn):TC} AS province_name ";
                    //     tables += @$" LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.province_code ";
                    // }
                    conditions = getConditions(table, dto.@params);

                    if (string.IsNullOrWhiteSpace(map.boundary) == false && layer != null)
                    {
                        conditions += $" AND ST_Intersects(geom, ST_GeomFromGeoJSON('{map.boundary}'))";
                    }

                    if (dto.form != null)
                    {
                        var sql = $"{Sql.Entity<Form.Feature>(x => x.table_id):TC} = @table_id AND {Sql.Entity<Form.Feature>(x => x.form_id):TC} = @id";
                        var features = session.Find<Form.Feature>(x => x
                            .Where($"{sql}")
                            .WithParameters(new
                            {
                                dto.form.table_id,
                                dto.form.id,
                            }));
                        if (features.Count() > 0 && table.key_column != null)
                        {
                            conditions += $" AND ({table.table_name}.{table.key_column?.column_name} IN ({string.Join(",", features.Select(x => x.feature_id))}))";
                        }
                    }

                    string wheres = $" WHERE {conditions}";

                    if (dto.filter != null)
                    {
                        string parsed = StringUtils.ParseFilter(table, dto.filter);
                        if (string.IsNullOrWhiteSpace(parsed) == false)
                        {
                            wheres += $" AND ({parsed})";
                        }
                    }

                    string orderby = string.Empty;
                    List<string> listOrders = new List<string>();

                    TableColumn? orderColumn = table.label_column ?? table.key_column ?? table.identity_column;
                    if (dto.sort != null && dto.sort.Count() > 0)
                    {
                        foreach (var s in dto.sort)
                        {
                            var sortColumn = table.columns.FirstOrDefault(o => o.column_name == s.selector);
                            if (sortColumn != null)
                            {
                                listOrders.Add($"\"{sortColumn.column_name}\"" + (s.desc ? "DESC" : "ASC"));
                            }
                        }
                        if (listOrders.Count > 0)
                        {
                            orderby += $" ORDER BY {string.Join(",", listOrders)}";
                        }
                    }
                    else if (string.IsNullOrWhiteSpace(dto.orderby) == false)
                    {
                        orderby = @$" ORDER BY " + dto.orderby;
                    }
                    else if (orderColumn != null)
                    {
                        orderby = @$" ORDER BY " + orderColumn.column_name;
                    }
                    List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                    List<object> totalSummary = new List<object>();
                    int totalCount = session.Query<int>($"SELECT COUNT(1) FROM \"{table.table_schema}\".\"{table.table_name}\" {wheres}").FirstOrDefault();
                    // totalSummary.Add(totalCount);
                    string? boundary = string.Empty;

                    if (dto.totalSummary != null && dto.totalSummary.Count() > 0)
                    {
                        foreach (var s in dto.totalSummary)
                        {
                            if (s.summaryType == "sum")
                            {
                                totalSummary.Add(session.Query<long>(@$"SELECT COALESCE(SUM(COALESCE({s.selector}, 0)), 0) FROM {table.table_schema}.{table.table_name} {wheres} AND {s.selector} IS NOT NULL;").FirstOrDefault());
                            }
                            else if (s.summaryType == "count")
                            {
                                totalSummary.Add(session.Query<long>(@$"SELECT COUNT({s.selector}) FROM {table.table_schema}.{table.table_name} {wheres};").FirstOrDefault());
                            }
                        }
                    }

                    if (dto.requireGroupCount == true && dto.group != null && dto.group.Count() > 0)
                    {
                        DxGroup? firstGroup = dto.group.FirstOrDefault();
                        TableColumn? groupedColumn = table.columns.FirstOrDefault(x => x.column_name == firstGroup?.selector);
                        string tableAlias = $"\"{table.table_schema}\".\"{table.table_name}\"";
                        StringBuilder stringBuilder = new StringBuilder();
                        stringBuilder.AppendLine($"SELECT {tableAlias}.{firstGroup?.selector} AS key, COUNT({tableAlias}.\"{table.identity_column?.column_name}\") AS count");
                        stringBuilder.AppendLine($"FROM {tableAlias} {wheres}");
                        stringBuilder.AppendLine($"GROUP BY {tableAlias}.{firstGroup?.selector} ORDER BY {tableAlias}.{firstGroup?.selector}");
                        // stringBuilder.AppendLine($"LIMIT {dto.take} OFFSET {dto.skip};");
                        string sql = stringBuilder.ToString();
                        var groupedData = session.Query<DevExprGridGroupItem>(sql).ToList();
                        var groupCount = groupedData.Count;
                        if (dto.groupSummary != null && dto.groupSummary.Count() > 0)
                        {
                            // var groupSummary = dto.groupSummary.FirstOrDefault();
                            // if (groupSummary != null)
                            // {
                            //     groupedData.ForEach(o => o.summary = new List<object>() { o.count });
                            // }
                            groupedData.ForEach(o => o.summary = new List<object>() { });
                            foreach (var summary in dto.groupSummary)
                            {
                                stringBuilder = new StringBuilder();
                                if (summary.summaryType == "total")
                                {
                                    stringBuilder.AppendLine($"SELECT {tableAlias}.{firstGroup?.selector} AS key, SUM(\"{summary.selector}\") AS count");
                                }
                                else
                                {
                                    stringBuilder.AppendLine($"SELECT {tableAlias}.{firstGroup?.selector} AS key, COUNT(DISTINCT \"{summary.selector}\") AS count");
                                }
                                stringBuilder.AppendLine($"FROM {tableAlias} {wheres}");
                                stringBuilder.AppendLine($"GROUP BY {tableAlias}.{firstGroup?.selector} ORDER BY {tableAlias}.{firstGroup?.selector}");
                                var summaryResult = session.Query<DevExprGridSummaryValue>(stringBuilder.ToString()).ToList();
                                groupedData.ForEach(p =>
                                {
                                    var list = p.summary?.ToList() ?? new List<object>();
                                    list.Add(Math.Round(summaryResult.FirstOrDefault(o => o.key == p.key)?.count ?? 0.0, 2));
                                    p.summary = list;
                                });
                            }
                        }
                        // if (firstGroup?.selector == "district_code")
                        // {
                        //     List<District> districts = session.Find<District>(statement => statement
                        //         .Where($"{Sql.Entity<District>(o => o.area_id):TC} = ANY(@codes)")
                        //         .WithParameters(new { codes = groupedData.Select(x => x.key).ToList() })
                        //     ).ToList();
                        //     groupedData.ForEach(g =>
                        //     {
                        //         g.key = districts.FirstOrDefault(o => o.area_id == g.key)?.name_vn ?? g.key;
                        //     });
                        // }
                        // else if (firstGroup?.selector == "commune_code")
                        // {
                        //     List<Commune> communes = session.Find<Commune>(statement => statement
                        //         .Where($"{Sql.Entity<Commune>(o => o.area_id):TC} = ANY(@codes)")
                        //         .WithParameters(new { codes = groupedData.Select(x => x.key).ToList() })
                        //     ).ToList();
                        //     groupedData.ForEach(g =>
                        //     {
                        //         g.key = communes.FirstOrDefault(o => o.area_id == g.key)?.name_vn ?? g.key;
                        //     });
                        // }

                        if (dto.skip.HasValue)
                        {
                            groupedData = groupedData.Skip(dto.skip.Value).ToList();
                        }
                        if (dto.take.HasValue)
                        {
                            groupedData = groupedData.Take(dto.take.Value).ToList();
                        }

                        var r = new RestData()
                        {
                            data = new
                            {
                                dataSearch = new DevExprGridGroupData
                                {
                                    data = groupedData,
                                    totalCount = totalCount,
                                    groupCount = groupCount,
                                    totalSummary = totalSummary,
                                    boundary = boundary
                                },
                                domains = domains,
                                relations = relations,
                            }
                        };

                        // _cacheProvider.Set<RestData>(cacheKey, r, TimeSpan.FromMinutes(1));

                        return r;
                    }
                    else if (!dto.onlyReturnCount.HasValue || dto.onlyReturnCount.Value == false)
                    {
                        string sql = select + tables + wheres + orderby;
                        if (dto.skip.HasValue)
                        {
                            sql += $" OFFSET {dto.skip}";
                        }
                        if (dto.take.HasValue)
                        {
                            sql += $" LIMIT {dto.take}";
                        }
                        var result = session.Query(sql).ToList();

                        records = result.Select(x => (IDictionary<string, object>)x).ToList();

                        var requireBoundary = dto.requireBoundary.HasValue ? dto.requireBoundary.Value : true;

                        if (table.columns.Any(p => p.column_name == "geom") && requireBoundary)
                        {
                            boundary = session.Query<string>($"SELECT ST_AsGeoJSON(ST_Extent(geom)) FROM {table.table_schema}.{table.table_name} {wheres}").FirstOrDefault();
                        }
                    }

                    var response = new RestData()
                    {
                        data = new
                        {
                            dataSearch = new DevExprGridData
                            {
                                data = records,
                                totalCount = totalCount,
                                totalSummary = totalSummary,
                                boundary = boundary
                            },
                            domains = domains,
                            relations = relations,
                        }
                    };

                    // _cacheProvider.Set<RestData>(cacheKey, response, TimeSpan.FromMinutes(1));

                    return response;
                }
            }
        }

        private void storeFile(FeatureFile image)
        {
            string contentRootPath = _hostingEnvironment.ContentRootPath;
            string cachePath = Path.Combine(contentRootPath, "cache");
            if (Directory.Exists(cachePath) == false)
                Directory.CreateDirectory(cachePath);
            string layerPath = Path.Combine(cachePath, image.layer_id.ToString());
            if (Directory.Exists(layerPath) == false)
                Directory.CreateDirectory(layerPath);
            string featurePath = Path.Combine(layerPath, image.feature_id.ToString());
            if (Directory.Exists(featurePath) == false)
                Directory.CreateDirectory(featurePath);
            using (var stream = new FileStream(Path.Combine(featurePath, image.file_name), FileMode.Create))
            {
                image.raw.CopyTo(stream);
            }
        }

        private void deleteFile(FeatureFile image)
        {
            string path = Path.Combine(_hostingEnvironment.ContentRootPath, "cache", image.layer_id.ToString(), image.feature_id.ToString(), image.file_name);
            if (System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }
        }

        private IDictionary<string, object>? getFeature(int table_id, string feature_id)
        {
            using (var session = OpenSession())
            {
                var table = getTableAndColumns(table_id);
                if (table == null)
                    return new Dictionary<string, object>();
                TableColumn? keyColumn = table.key_column ?? table.identity_column;
                if (keyColumn == null)
                    return new Dictionary<string, object>();
                var where = @$" WHERE {table.table_schema}.{table.table_name}.{keyColumn.column_name}::TEXT = @feature_id";
                string select = string.Empty;
                if (table.columns.Any(x => x.column_name == "geom"))
                {
                    select = @$"SELECT {String.Join(',', table.columns.Where(x => x.column_name.Equals("geom") == false)
                        .Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))}, ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom ";
                }
                else
                {
                    select = @$"SELECT {String.Join(',', table.columns.Where(x => x.column_name.Equals("geom") == false)
                        .Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))}";
                }
                string tables = @$" FROM {table.table_schema}.{table.table_name}";
                if (table.columns.Any(x => x.column_name == "commune_code"))
                {
                    select += @$",{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune_name ";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.commune_code";
                }
                if (table.columns.Any(x => x.column_name == "district_code"))
                {
                    select += @$",{Sql.Entity<District>(x => x.name_vn):TC} AS district_name ";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.district_code";
                }
                if (table.columns.Any(x => x.column_name == "province_code"))
                {
                    select += @$",{Sql.Entity<Province>(x => x.name_vn):TC} AS province_name ";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.province_code";
                }
                string sql = select + tables + where;
                // Console.WriteLine(sql);
                IDictionary<string, object>? feature = session.Query(sql, new { feature_id = feature_id }).FirstOrDefault();
                return feature;
            }
        }

        private List<Dictionary<string, object>>? getFeatures(int table_id, string[] feature_id)
        {
            var sqlService = new SQLService(DbFactory);
            var table = getTableAndColumns(table_id);
            if (table == null)
                return new List<Dictionary<string, object>>();
            TableColumn? keyColumn = table.key_column ?? table.identity_column;
            if (keyColumn == null)
                return new List<Dictionary<string, object>>();
            string where = @$" WHERE 1=1";
            if (feature_id != null && feature_id.Count() > 0)
            {
                where = @$" WHERE {table.table_schema}.{table.table_name}.{keyColumn.column_name}::TEXT IN ({string.Join(",", feature_id.Select(f => $"'{f}'"))})";
            }
            string select = string.Empty;
            if (table.columns.Any(x => x.column_name == "geom"))
            {
                select = @$"SELECT {String.Join(',', table.columns.Where(x => x.column_name.Equals("geom") == false)
                    .Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))}, ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom ";
            }
            else
            {
                select = @$"SELECT {String.Join(',', table.columns.Where(x => x.column_name.Equals("geom") == false)
                    .Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))}";
            }
            string tables = @$" FROM {table.table_schema}.{table.table_name}";
            if (table.columns.Any(x => x.column_name == "commune_code"))
            {
                select += @$",{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune_name ";
                tables += @$" LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.commune_code";
            }
            if (table.columns.Any(x => x.column_name == "district_code"))
            {
                select += @$",{Sql.Entity<District>(x => x.name_vn):TC} AS district_name ";
                tables += @$" LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.district_code";
            }
            if (table.columns.Any(x => x.column_name == "province_code"))
            {
                select += @$",{Sql.Entity<Province>(x => x.name_vn):TC} AS province_name ";
                tables += @$" LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.province_code";
            }
            string sql = select + tables + where;
            return sqlService.QueryToDictationary(sql).ToList();
        }

        private List<RelationFeatureViewModel> getRelationFeature(int layer_id, string feature_id)
        {
            using (var session = OpenSession())
            {
                IDictionary<string, string> phanLoaiColumnDictionary = new Dictionary<string, string>();
                phanLoaiColumnDictionary.Add("tn_congthoatnuoc", "loaicongid");
                phanLoaiColumnDictionary.Add("tn_cuaxa", "loaiid");
                phanLoaiColumnDictionary.Add("tn_diemdenngapung", "phanloaiid");
                phanLoaiColumnDictionary.Add("tn_hodieuhoa", "loaihoid");
                phanLoaiColumnDictionary.Add("tn_hoga", "loaiho");
                phanLoaiColumnDictionary.Add("tn_muongthoatnuoc", "phanloai");
                phanLoaiColumnDictionary.Add("tn_nhamayxulynuocthai", "phanloaiid");
                phanLoaiColumnDictionary.Add("tn_ranhthoatnuoc", "phanloai");
                phanLoaiColumnDictionary.Add("tn_trambomthoatnuoc", "loaitramid");
                phanLoaiColumnDictionary.Add("tn_trucuuhoa", "phanloai");
                var layer = getLayerWithTable(layer_id);
                var feature = getFeature(layer.table_info_id, feature_id);
                var results = new List<RelationFeatureViewModel>();
                if (layer != null && feature != null)
                {
                    string sss = $@"
                    SELECT  tr.{nameof(TableRelation.id)},  tr.{nameof(TableRelation.table_id)}, tr.{nameof(TableRelation.table_column_id)},  
                            tr.{nameof(TableRelation.relation_table_id)},  tr.{nameof(TableRelation.relation_table_column_id)}, 
                            tr.{nameof(TableRelation.mediate_table_id)},
                            c.{nameof(TableColumn.id)}, c.{nameof(TableColumn.column_name)}, 
                            rc.{nameof(TableColumn.id)}, rc.{nameof(TableColumn.column_name)},
                            t.{nameof(TableInfo.id)}, t.{nameof(TableInfo.table_name)}, 
                            rt.{nameof(TableInfo.id)} , rt.{nameof(TableInfo.table_name)},
                            m.{nameof(TableInfo.id)}
                        FROM {Sql.Entity<TableRelation>():T} AS tr 
                    LEFT JOIN {Sql.Entity<TableColumn>():T} AS c
                        ON tr.{nameof(TableRelation.table_column_id)} = c.{nameof(TableColumn.id)}
                    LEFT JOIN {Sql.Entity<TableColumn>():T} AS rc
                        ON tr .{nameof(TableRelation.relation_table_column_id)} = rc.{nameof(TableColumn.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS t
                        ON tr.{nameof(TableRelation.table_id)} = t.{nameof(TableInfo.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS m
                        ON tr.{nameof(TableRelation.mediate_table_id)} = m.{nameof(TableInfo.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS rt
                        ON tr.{nameof(TableRelation.relation_table_id)} = rt.{nameof(TableInfo.id)}";
                    IEnumerable<TableRelation> relations = session.Query<TableRelation, TableColumn, TableColumn, TableInfo, TableInfo, TableInfo, TableRelation>(sss, (tr, c, rc, t, m, rt) =>
                    {
                        tr.table_column = c;
                        tr.relation_column = rc;
                        tr.table = t;
                        tr.mediate_table = m;
                        tr.relation_table = rt;
                        return tr;
                    },
                        splitOn: $"{nameof(TableColumn.id)}, {nameof(TableColumn.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}");

                    foreach (var relation in relations)
                    {
                        if (relation.table_id == layer.table_info_id)
                        {
                            feature.TryGetValue(relation.table_column.column_name, out var foreignValue);
                            if (!string.IsNullOrWhiteSpace(foreignValue?.ToString()))
                            {
                                var layerRelation = getLayerWithTableInfo(relation.relation_table_id);
                                if (layerRelation != null)
                                {
                                    string tableRelationName = $"{layerRelation.table.table_schema}.{layerRelation.table.table_name}";
                                    var listTableConditions = new List<String> { "1=1" };
                                    listTableConditions.Add($"{tableRelationName}.{relation.relation_column.column_name} = @foreignValue");

                                    var keyColumn = layerRelation.table.key_column ?? layerRelation.table.identity_column;
                                    var labelColumn = layerRelation.table.label_column ?? keyColumn;
                                    var phanLoaiColumn = phanLoaiColumnDictionary.ContainsKey(layerRelation.table.table_name) ? phanLoaiColumnDictionary[layerRelation.table.table_name] : string.Empty;
                                    var select_sql = string.Empty;
                                    if (string.IsNullOrEmpty(phanLoaiColumn))
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{tableRelationName}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name} AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    else
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{tableRelationName}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name} AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{tableRelationName}.{phanLoaiColumn}::TEXT AS phanloai
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    var result = session.Query<RelationFeatureViewModel>(select_sql, new { foreignValue = foreignValue }).ToList();
                                    results.AddRange(result);
                                }
                            }
                        }
                        else if (relation.relation_table_id == layer.table_info_id)
                        {
                            feature.TryGetValue(relation.relation_column.column_name, out var foreignValue);
                            if (foreignValue != null && !string.IsNullOrWhiteSpace(foreignValue.ToString()))
                            {
                                var layerRelation = getLayerWithTableInfo(relation.table_id);
                                if (layerRelation != null)
                                {
                                    string tableRelationName = $"{layerRelation.table.table_schema}.{layerRelation.table.table_name}";
                                    var listTableConditions = new List<String> { "1=1" };
                                    listTableConditions.Add($"{tableRelationName}.{relation.table_column.column_name} = @foreignValue");

                                    var keyColumn = layerRelation.table.key_column ?? layerRelation.table.identity_column;
                                    var labelColumn = layerRelation.table.label_column ?? keyColumn;
                                    var phanLoaiColumn = phanLoaiColumnDictionary[layerRelation.table.table_name];
                                    var select_sql = string.Empty;
                                    if (string.IsNullOrEmpty(phanLoaiColumn))
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{tableRelationName}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name} AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    else
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{tableRelationName}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name} AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{phanLoaiColumn}::TEXT AS phanloai
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    var result = session.Query<RelationFeatureViewModel>(select_sql, new { foreignValue = foreignValue }).ToList();
                                    results.AddRange(result);
                                }
                            }
                        }
                    }
                }
                return results;
            }
        }

        [HttpGet("get-relation-by-id")]
        public async Task<RestBase> getRegionAsync([FromQuery] int layer_id, [FromQuery] string feature_id)
        {
            using (var session = OpenSession())
            {
                var ExprTreeView = new List<DevTreeView>();

                IDictionary<string, string> phanLoaiColumnDictionary = new Dictionary<string, string>();
                phanLoaiColumnDictionary.Add("tn_congthoatnuoc", "loaicongid");
                phanLoaiColumnDictionary.Add("tn_cuaxa", "loaiid");
                phanLoaiColumnDictionary.Add("tn_diemdenngapung", "phanloaiid");
                phanLoaiColumnDictionary.Add("tn_hodieuhoa", "loaihoid");
                phanLoaiColumnDictionary.Add("tn_hoga", "loaiho");
                phanLoaiColumnDictionary.Add("tn_muongthoatnuoc", "phanloai");
                phanLoaiColumnDictionary.Add("tn_nhamayxulynuocthai", "phanloaiid");
                phanLoaiColumnDictionary.Add("tn_ranhthoatnuoc", "phanloai");
                phanLoaiColumnDictionary.Add("tn_trambomthoatnuoc", "loaitramid");
                phanLoaiColumnDictionary.Add("tn_trucuuhoa", "phanloai");
                var layer = getLayerWithTable(layer_id);
                var feature = getFeature(layer.table_info_id, feature_id);
                var results = new List<RelationFeatureViewModel>();
                if (layer != null && feature != null)
                {
                    string sss = $@"
                    SELECT  tr.{nameof(TableRelation.id)},  tr.{nameof(TableRelation.table_id)}, tr.{nameof(TableRelation.table_column_id)},  
                            tr.{nameof(TableRelation.relation_table_id)},  tr.{nameof(TableRelation.relation_table_column_id)}, 
                            tr.{nameof(TableRelation.mediate_table_id)},
                            c.{nameof(TableColumn.id)}, c.{nameof(TableColumn.column_name)}, 
                            rc.{nameof(TableColumn.id)}, rc.{nameof(TableColumn.column_name)},
                            t.{nameof(TableInfo.id)}, t.{nameof(TableInfo.table_name)}, 
                            rt.{nameof(TableInfo.id)} , rt.{nameof(TableInfo.table_name)},
                            m.{nameof(TableInfo.id)}
                        FROM {Sql.Entity<TableRelation>():T} AS tr 
                    LEFT JOIN {Sql.Entity<TableColumn>():T} AS c
                        ON tr.{nameof(TableRelation.table_column_id)} = c.{nameof(TableColumn.id)}
                    LEFT JOIN {Sql.Entity<TableColumn>():T} AS rc
                        ON tr .{nameof(TableRelation.relation_table_column_id)} = rc.{nameof(TableColumn.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS t
                        ON tr.{nameof(TableRelation.table_id)} = t.{nameof(TableInfo.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS m
                        ON tr.{nameof(TableRelation.mediate_table_id)} = m.{nameof(TableInfo.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS rt
                        ON tr.{nameof(TableRelation.relation_table_id)} = rt.{nameof(TableInfo.id)}";
                    IEnumerable<TableRelation> relations = session.Query<TableRelation, TableColumn, TableColumn, TableInfo, TableInfo, TableInfo, TableRelation>(sss, (tr, c, rc, t, m, rt) =>
                    {
                        tr.table_column = c;
                        tr.relation_column = rc;
                        tr.table = t;
                        tr.mediate_table = m;
                        tr.relation_table = rt;
                        return tr;
                    },
                        splitOn: $"{nameof(TableColumn.id)}, {nameof(TableColumn.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}");

                    foreach (var relation in relations)
                    {
                        if (relation.table_id == layer.table_info_id)
                        {
                            feature.TryGetValue(relation.table_column.column_name, out var foreignValue);
                            if (!string.IsNullOrWhiteSpace(foreignValue?.ToString()))
                            {
                                var layerRelation = getLayerWithTableInfo(relation.relation_table_id);
                                if (layerRelation != null)
                                {
                                    string tableRelationName = $"{layerRelation.table.table_schema}.{layerRelation.table.table_name}";
                                    var listTableConditions = new List<String> { "1=1" };
                                    listTableConditions.Add($"{tableRelationName}.{relation.relation_column.column_name} = @foreignValue");

                                    var keyColumn = layerRelation.table.key_column ?? layerRelation.table.identity_column;
                                    var labelColumn = layerRelation.table.label_column ?? keyColumn;
                                    var phanLoaiColumn = phanLoaiColumnDictionary.ContainsKey(layerRelation.table.table_name) ? phanLoaiColumnDictionary[layerRelation.table.table_name] : string.Empty;
                                    var select_sql = string.Empty;
                                    if (string.IsNullOrEmpty(phanLoaiColumn))
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{layerRelation.id}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name} AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    else
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{layerRelation.id}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name} AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{tableRelationName}.{phanLoaiColumn}::TEXT AS phanloai
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    var result = session.Query<RelationFeatureViewModel>(select_sql, new { foreignValue = foreignValue }).ToList();
                                    results.AddRange(result);
                                }
                            }
                        }
                        else if (relation.relation_table_id == layer.table_info_id)
                        {
                            feature.TryGetValue(relation.relation_column.column_name, out var foreignValue);
                            if (foreignValue != null && !string.IsNullOrWhiteSpace(foreignValue.ToString()))
                            {
                                var layerRelation = getLayerWithTableInfo(relation.table_id);
                                if (layerRelation != null)
                                {
                                    string tableRelationName = $"{layerRelation.table.table_schema}.{layerRelation.table.table_name}";
                                    var listTableConditions = new List<String> { "1=1" };
                                    listTableConditions.Add($"{tableRelationName}.{relation.table_column.column_name} = @foreignValue");

                                    var keyColumn = layerRelation.table.key_column ?? layerRelation.table.identity_column;
                                    var labelColumn = layerRelation.table.label_column ?? keyColumn;
                                    var phanLoaiColumn = phanLoaiColumnDictionary[layerRelation.table.table_name];
                                    var select_sql = string.Empty;
                                    if (string.IsNullOrEmpty(phanLoaiColumn))
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{layerRelation.id}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name} AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    else
                                    {
                                        select_sql = $@"SELECT
                                               CONCAT('{layerRelation.id}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name} AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{phanLoaiColumn}::TEXT AS phanloai
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    var result = session.Query<RelationFeatureViewModel>(select_sql, new { foreignValue = foreignValue }).ToList();
                                    results.AddRange(result);
                                }
                            }
                        }
                    }
                }
                if (results.Count() > 0)
                {
                    results.ForEach(x =>
                    {
                        ExprTreeView.Add(new RealtionFeatureTreeView
                        {
                            id = x.uid,
                            text = x.name,
                            featureId = x.id,
                            layerId = x.layer_id,
                            hasItems = true,
                            parentId = $"{layer_id}.{feature_id}",
                            isExpanded = false
                        });
                    });
                }
                return new RestData()
                {
                    data = ExprTreeView
                };
            }
        }

        [HttpPost("get-feature-relation-trees")]
        public async Task<RestBase> getFeatureRelationTreeAsync([FromBody] FeatureRelationTreeViewModel viewModel)
        {
            if (viewModel == null)
            {
                return new RestError(400, "Đầu vào không hợp lệ!");
            }
            return new RestData()
            {
                data = getFeatureRelations(viewModel.table_id, viewModel.feature_id, true)
            };
        }

        private List<IDictionary<string, object>> getFeatureRelations(int table_id, string[]? feature_id, bool isGrouped = false)
        {
            using (var session = OpenSession())
            {
                List<IDictionary<string, object>> grouped = new List<IDictionary<string, object>>();
                var table = getTableAndColumns(table_id);

                var results = new List<RelationFeatureViewModel>();
                if (table != null)
                {
                    List<IDictionary<string, object>> features = new List<IDictionary<string, object>>();
                    if (feature_id != null && feature_id.Count() > 0)
                    {
                        features.AddRange(getFeatures(table.id, feature_id));
                    }
                    else
                    {
                        features.AddRange(getFeatures(table.id, new string[] { }));
                    }
                    var relations = getRelations(table);
                    foreach (var feature in features)
                    {
                        if (feature != null)
                        {
                            List<IDictionary<string, object>> layerChildren = new List<IDictionary<string, object>>();
                            if (relations.Count() > 0)
                            {
                                foreach (var relation in relations)
                                {
                                    if (relation.table_id == table.id)
                                    {
                                        feature.TryGetValue(relation.table_column.column_name, out var foreignValue);
                                        if (!string.IsNullOrWhiteSpace(foreignValue?.ToString()))
                                        {
                                            var tableRelation = getTableAndColumns(relation.relation_table_id);
                                            if (tableRelation != null)
                                            {
                                                var groupLevel = session.Find<TableRelationGroupLevel>(stm => stm
                                                    .Where($"{Sql.Entity<TableRelationGroupLevel>(x => x.table_id):TC} = {tableRelation.id}")
                                                ).FirstOrDefault();
                                                if (groupLevel != null)
                                                {
                                                    string tableRelationName = $"{tableRelation.table_schema}.{tableRelation.table_name}";
                                                    var listTableConditions = new List<String> { "1=1" };
                                                    listTableConditions.Add($"{tableRelationName}.{relation.relation_column.column_name} = @foreignValue");

                                                    var relationKeyColumn = tableRelation.key_column ?? tableRelation.identity_column;
                                                    var relationLabelColumn = tableRelation.label_column ?? relationKeyColumn;
                                                    var select_sql = string.Empty;
                                                    List<IDictionary<string, object>> layerDataChildren = new List<IDictionary<string, object>>();
                                                    double countTotal = 0;
                                                    if (groupLevel.group_type == "layer")
                                                    {
                                                        select_sql = $@"SELECT
                                                            CONCAT('{tableRelationName}', '.', {tableRelationName}.{relationKeyColumn.column_name}) AS uid
                                                            ,{tableRelationName}.{relationKeyColumn.column_name}::TEXT AS id
                                                            ,{tableRelationName}.{relationLabelColumn.column_name}::TEXT AS name
                                                            ,{tableRelation.id} AS table_id
                                                            ,'{tableRelation.name_vn}' AS table_name
                                                            FROM {tableRelationName}
                                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                                        var records = session.Query<RelationFeatureViewModel>(select_sql, new { foreignValue = foreignValue }).ToList();
                                                        foreach (var record in records)
                                                        {
                                                            layerDataChildren.Add(new Dictionary<string, object>
                                                            {
                                                                // { "id", $"f_{tableRelation.id}_{record.id}" },
                                                                { "id", StringHelper.RandomFileName() },
                                                                { "text", string.IsNullOrWhiteSpace(record.name) == false ? record.name : $"Không rõ {tableRelation.name_vn.ToLower()}" },
                                                                { "raw", record },
                                                                { "type", "@feature" },
                                                                { "table_id", tableRelation.id },
                                                                { "countTotal", 1 },
                                                                { "items", getFeatureRelations(record.table_id, new string[]{record.id}) }
                                                            });
                                                        }
                                                        if (string.IsNullOrWhiteSpace(groupLevel.condition) == false)
                                                        {
                                                            listTableConditions.Add(groupLevel.condition);
                                                        }
                                                        var sqlCount = string.Empty;
                                                        if (groupLevel.statistical_type.ToLower() == "sum")
                                                        {
                                                            sqlCount = @$"SELECT COALESCE(SUM(COALESCE({tableRelationName}.{groupLevel.statistical_column}, 0)), 0)
                                                            FROM {tableRelationName}
                                                            WHERE {String.Join(" AND ", listTableConditions)} AND {tableRelationName}.{groupLevel.statistical_column}::TEXT IS NOT NULL";
                                                        }
                                                        else
                                                        {
                                                            sqlCount = @$"SELECT COUNT(DISTINCT({tableRelationName}.{groupLevel.statistical_column}))
                                                            FROM {tableRelationName}
                                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                                        }
                                                        countTotal = session.Query<double>(sqlCount, new { foreignValue = foreignValue }).FirstOrDefault();
                                                    }
                                                    else if (groupLevel.group_type == "table")
                                                    {
                                                        select_sql = $@"SELECT
                                                            CONCAT('{tableRelationName}', '.', {tableRelationName}.{relationKeyColumn.column_name}) AS uid
                                                            ,{tableRelationName}.{relationKeyColumn.column_name}::TEXT AS id
                                                            ,{tableRelationName}.{relationLabelColumn.column_name}::TEXT AS name
                                                            ,{tableRelation.id} AS table_id
                                                            ,'{tableRelation.name_vn}' AS table_name
                                                            FROM {tableRelationName}
                                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                                        var records = session.Query<RelationFeatureViewModel>(select_sql, new { foreignValue = foreignValue }).ToList();
                                                        foreach (var record in records)
                                                        {
                                                            layerDataChildren.Add(new Dictionary<string, object>
                                                            {
                                                                // { "id", $"r_{tableRelation.id}_{record.id}" },
                                                                { "id", StringHelper.RandomFileName() },
                                                                { "text", string.IsNullOrWhiteSpace(record.name) == false ? record.name : $"Không rõ {tableRelation.name_vn.ToLower()}" },
                                                                { "raw", record },
                                                                { "type", "@record" },
                                                                { "table_id", tableRelation.id },
                                                                { "countTotal", 1 },
                                                                { "items", getFeatureRelations(record.table_id, new string[]{record.id}) }
                                                            });
                                                        }
                                                        if (string.IsNullOrWhiteSpace(groupLevel.condition) == false)
                                                        {
                                                            listTableConditions.Add(groupLevel.condition);
                                                        }
                                                        var sqlCount = string.Empty;
                                                        if (groupLevel.statistical_type.ToLower() == "sum")
                                                        {
                                                            sqlCount = @$"SELECT COALESCE(SUM(COALESCE({tableRelationName}.{groupLevel.statistical_column}, 0)), 0)
                                                            FROM {tableRelationName}
                                                            WHERE {String.Join(" AND ", listTableConditions)} AND {tableRelationName}.{groupLevel.statistical_column}::TEXT IS NOT NULL";
                                                        }
                                                        else
                                                        {
                                                            sqlCount = @$"SELECT COUNT(DISTINCT({tableRelationName}.{groupLevel.statistical_column}))
                                                            FROM {tableRelationName}
                                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                                        }
                                                        countTotal = session.Query<double>(sqlCount, new { foreignValue = foreignValue }).FirstOrDefault();
                                                    }
                                                    else if (groupLevel.group_type == "classify")
                                                    {
                                                        List<IDictionary<string, object>> classidyDataChildren = new List<IDictionary<string, object>>();
                                                        if (!string.IsNullOrEmpty(groupLevel.column_group_level_1))
                                                        {
                                                            var column_group_level_1 = tableRelation.columns.Where(x => x.column_name == groupLevel.column_group_level_1).FirstOrDefault();
                                                            if (column_group_level_1 != null)
                                                            {
                                                                List<DomainViewModel> shortDataLevel1 = new List<DomainViewModel>();
                                                                if (column_group_level_1.lookup_table_id > 0)
                                                                {
                                                                    shortDataLevel1 = getTableShortData(column_group_level_1.lookup_table_id).ToList();
                                                                }
                                                                var classifiesLevel1 = session.Query<string>(@$"SELECT DISTINCT({tableRelationName}.{groupLevel.column_group_level_1}) 
                                                                    FROM {tableRelationName} 
                                                                    WHERE {String.Join(" AND ", listTableConditions)} ORDER BY 1", new { foreignValue = foreignValue }).ToList();
                                                                if (classifiesLevel1.Count() > 0)
                                                                {
                                                                    foreach (var classify1 in classifiesLevel1)
                                                                    {
                                                                        double countLevel1 = 0;
                                                                        var sql_where = String.Join(" AND ", listTableConditions);
                                                                        string classify1Value = classify1;
                                                                        if (string.IsNullOrWhiteSpace(classify1) == false)
                                                                        {
                                                                            if (shortDataLevel1.Count > 0)
                                                                            {
                                                                                var classify = shortDataLevel1.Where(x => x.id.ToString() == classify1).FirstOrDefault();
                                                                                if (classify != null)
                                                                                {
                                                                                    classify1Value = classify.mo_ta;
                                                                                }
                                                                            }
                                                                            sql_where += $@" AND {tableRelationName}.{groupLevel.column_group_level_1}::TEXT = '{classify1}'";
                                                                        }
                                                                        else
                                                                        {
                                                                            classify1Value = $"Không rõ {column_group_level_1.name_vn.ToLower()}";
                                                                            sql_where += $@" AND ({tableRelationName}.{groupLevel.column_group_level_1}::TEXT = '' OR {tableRelationName}.{groupLevel.column_group_level_1}::TEXT IS NULL)";
                                                                        }
                                                                        if (string.IsNullOrWhiteSpace(groupLevel.condition) == false)
                                                                        {
                                                                            sql_where += $@" AND {groupLevel.condition}";
                                                                        }
                                                                        if (!string.IsNullOrWhiteSpace(groupLevel.column_group_level_2))
                                                                        {
                                                                            var column_group_level_2 = tableRelation.columns.Where(x => x.column_name == groupLevel.column_group_level_2).FirstOrDefault();
                                                                            if (column_group_level_2 != null)
                                                                            {
                                                                                List<DomainViewModel> shortDataLevel2 = new List<DomainViewModel>();
                                                                                if (column_group_level_2.lookup_table_id > 0)
                                                                                {
                                                                                    shortDataLevel2 = getTableShortData(column_group_level_2.lookup_table_id).ToList();
                                                                                }
                                                                                List<IDictionary<string, object>> classify1Children = new List<IDictionary<string, object>>();
                                                                                var classifiesLevel2 = session.Query<string>(@$"SELECT DISTINCT({tableRelationName}.{groupLevel.column_group_level_2}) 
                                                                                    FROM {tableRelationName} WHERE {sql_where} ORDER BY 1", new { foreignValue = foreignValue }).ToList();
                                                                                if (classifiesLevel2.Count() > 0)
                                                                                {
                                                                                    foreach (var classify2 in classifiesLevel2)
                                                                                    {
                                                                                        var sql_where2 = sql_where.Clone();
                                                                                        string classify2Value = classify2;
                                                                                        if (string.IsNullOrWhiteSpace(classify2) == false)
                                                                                        {
                                                                                            if (shortDataLevel2.Count() > 0)
                                                                                            {
                                                                                                var classify = shortDataLevel2.Where(x => x.id.ToString() == classify2).FirstOrDefault();
                                                                                                if (classify != null)
                                                                                                {
                                                                                                    classify2Value = classify.mo_ta;
                                                                                                }
                                                                                            }
                                                                                            sql_where2 += $@" AND {tableRelationName}.{groupLevel.column_group_level_2}::TEXT = '{classify2}'";
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                            classify2Value = $"Không rõ {column_group_level_2.name_vn.ToLower()}";
                                                                                            sql_where2 += $@" AND ({tableRelationName}.{groupLevel.column_group_level_2}::TEXT = '' OR {tableRelationName}.{groupLevel.column_group_level_2}::TEXT IS NULL)";
                                                                                        }
                                                                                        string sqlCountLevel2 = string.Empty;
                                                                                        if (groupLevel.statistical_type.ToLower() == "sum")
                                                                                        {
                                                                                            sqlCountLevel2 = @$"SELECT COALESCE(SUM(COALESCE({tableRelationName}.{groupLevel.statistical_column}, 0)), 0)
                                                                                                FROM {tableRelationName}
                                                                                                WHERE {sql_where2} AND {tableRelationName}.{groupLevel.statistical_column}::TEXT IS NOT NULL";
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                            sqlCountLevel2 = @$"SELECT COUNT(DISTINCT({tableRelationName}.{groupLevel.statistical_column}))
                                                                                                FROM {tableRelationName}
                                                                                                WHERE {sql_where2}";
                                                                                        }
                                                                                        var countLevel2 = session.Query<double>(sqlCountLevel2, new { foreignValue = foreignValue }).FirstOrDefault();
                                                                                        classify1Children.Add(new Dictionary<string, object>
                                                                                        {
                                                                                            // { "id", $"cl2_{foreignValue.ToString().RemoveVietNameseSign().Replace(" ", "_")}_{tableRelation.id}_{classify1Value.RemoveVietNameseSign().Replace(" ", "_")}_{classify2Value.RemoveVietNameseSign().Replace(" ", "_")}" },
                                                                                            { "id", StringHelper.RandomFileName() },
                                                                                            { "text", $"{classify2Value}" },
                                                                                            { "unit", $"{groupLevel.unit.ToLower()}" },
                                                                                            { "countTotal", countLevel2 },
                                                                                            { "raw", classify2Value },
                                                                                            { "table_id", tableRelation.id },
                                                                                            { "type", "@classify" },
                                                                                            { "where", sql_where2 },
                                                                                            { "foreignValue", foreignValue }
                                                                                        });
                                                                                        countLevel1 += countLevel2;
                                                                                    }
                                                                                }
                                                                                layerDataChildren.Add(new Dictionary<string, object>
                                                                                {
                                                                                    // { "id", $"cl1_{foreignValue.ToString().RemoveVietNameseSign().Replace(" ", "_")}_{tableRelation.id}_{classify1Value.RemoveVietNameseSign().Replace(" ", "_")}" },
                                                                                    { "id", StringHelper.RandomFileName() },
                                                                                    { "text", $"{classify1Value}" },
                                                                                    { "unit", $"{groupLevel.unit.ToLower()}" },
                                                                                    { "countTotal", countLevel1 },
                                                                                    { "table_id", tableRelation.id },
                                                                                    { "raw", classify1Value },
                                                                                    { "type", "@classify" },
                                                                                    { "items",  classify1Children},
                                                                                });
                                                                                countTotal += countLevel1;
                                                                            }
                                                                        }
                                                                        else
                                                                        {
                                                                            List<IDictionary<string, object>> classify1Children = new List<IDictionary<string, object>>();
                                                                            string sqlCountLevel1 = string.Empty;
                                                                            if (groupLevel.statistical_type.ToLower() == "sum")
                                                                            {
                                                                                sqlCountLevel1 = @$"SELECT COALESCE(SUM(COALESCE({tableRelationName}.{groupLevel.statistical_column}, 0)), 0)
                                                                                                FROM {tableRelationName}
                                                                                                WHERE {sql_where} AND {tableRelationName}.{groupLevel.statistical_column}::TEXT IS NOT NULL";
                                                                            }
                                                                            else
                                                                            {
                                                                                sqlCountLevel1 = @$"SELECT COUNT(DISTINCT({tableRelationName}.{groupLevel.statistical_column}))
                                                                                                FROM {tableRelationName}
                                                                                                WHERE {sql_where}";
                                                                            }
                                                                            countLevel1 = session.Query<double>(sqlCountLevel1, new { foreignValue = foreignValue }).FirstOrDefault();
                                                                            layerDataChildren.Add(new Dictionary<string, object>
                                                                            {
                                                                                // { "id", $"cl1_{foreignValue.ToString().RemoveVietNameseSign().Replace(" ", "_")}_{tableRelation.id}_{classify1Value.RemoveVietNameseSign().Replace(" ", "_")}" },
                                                                                { "id", StringHelper.RandomFileName() },
                                                                                { "text", $"{classify1Value}" },
                                                                                { "unit", $"{groupLevel.unit.ToLower()}" },
                                                                                { "countTotal", countLevel1 },
                                                                                { "table_id", tableRelation.id },
                                                                                { "raw", classify1Value },
                                                                                { "type", "@classify" },
                                                                                { "items",  classify1Children},
                                                                                { "where", sql_where },
                                                                                { "foreignValue", foreignValue }
                                                                            });
                                                                            countTotal += countLevel1;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        else
                                                        {
                                                            var sqlCount = string.Empty;
                                                            if (string.IsNullOrWhiteSpace(groupLevel.condition) == false)
                                                            {
                                                                listTableConditions.Add(groupLevel.condition);
                                                            }
                                                            if (groupLevel.statistical_type.ToLower() == "sum")
                                                            {
                                                                sqlCount = @$"SELECT COALESCE(SUM(COALESCE({tableRelationName}.{groupLevel.statistical_column}, 0)), 0)
                                                                    FROM {tableRelationName}
                                                                    WHERE {String.Join(" AND ", listTableConditions)} AND {tableRelationName}.{groupLevel.statistical_column}::TEXT IS NOT NULL";
                                                            }
                                                            else
                                                            {
                                                                sqlCount = @$"SELECT COUNT(DISTINCT({tableRelationName}.{groupLevel.statistical_column}))
                                                                    FROM {tableRelationName}
                                                                    WHERE {String.Join(" AND ", listTableConditions)}";
                                                            }
                                                            countTotal = session.Query<double>(sqlCount, new { foreignValue = foreignValue }).FirstOrDefault();
                                                        }
                                                    }
                                                    layerChildren.Add(new Dictionary<string, object>
                                                    {
                                                        // { "id", $"l_{foreignValue.ToString().RemoveVietNameseSign().Replace(" ", "_")}_{tableRelation.id}" },
                                                        { "id", StringHelper.RandomFileName() },
                                                        { "text", $"{tableRelation.name_vn}" },
                                                        { "unit", $"{groupLevel.unit.ToLower()}" },
                                                        { "countTotal", countTotal },
                                                        { "table_id", tableRelation.id },
                                                        { "raw", tableRelation },
                                                        { "type", "@layer" },
                                                        { "items",  layerDataChildren},
                                                        { "where", String.Join(" AND ", listTableConditions) },
                                                        { "foreignValue", foreignValue }
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            TableColumn? keyColumn = table.key_column ?? table.identity_column;
                            TableColumn? labelColumn = table.label_column ?? keyColumn;
                            feature.TryGetValue(keyColumn?.column_name, out var featureId);
                            feature.TryGetValue(labelColumn?.column_name, out var featureName);

                            if (isGrouped)
                            {
                                grouped.Add(new Dictionary<string, object>
                                {
                                    // { "id", $"g_{table.id}_{featureId}" },
                                    { "id", StringHelper.RandomFileName() },
                                    { "text", featureName ?? "Không xác định" },
                                    { "raw", feature },
                                    { "items", layerChildren }
                                });
                            }
                            else
                            {
                                return layerChildren;
                            }
                        }
                    }
                }
                return grouped;
            }
        }

        [HttpPost("get-feature-relation")]
        public RestBase GetFeatureRelation([FromBody] SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null || ((!dto.layer_id.HasValue || dto.layer_id.Value == 0) && (!dto.table_id.HasValue || dto.table_id.Value == 0)))
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                TableInfo? table = null;
                if (dto.layer_id.HasValue && dto.layer_id.Value > 0)
                {
                    var layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                    if (layer == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                            new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    table = layer.table;
                }
                else
                {
                    table = getTableAndColumns(dto.table_id.Value);
                }

                var keyColumn = table.key_column ?? table.identity_column;
                var labelColumn = table.label_column ?? keyColumn;
                dto.@params.TryGetValue("foreignValue", out object foreignValue);
                dto.@params.TryGetValue("where", out object where);
                string select_sql = $@"SELECT
                    CONCAT('{table.table_name}', '.', {table.table_schema}.{table.table_name}.{keyColumn?.column_name}) AS uid
                    ,{table.table_schema}.{table.table_name}.{keyColumn?.column_name} AS id
                    ,{table.table_schema}.{table.table_name}.{labelColumn?.column_name}::TEXT AS name
                    ,{table.id} AS table_id
                    ,'{table.name_vn}' AS table_name
                    FROM {table.table_schema}.{table.table_name}
                    WHERE {where.ToString()}";
                // Console.WriteLine(select_sql);
                var feature = session.Query(select_sql, new { foreignValue = foreignValue }).ToList();
                return new RestData()
                {
                    data = feature
                };
            }
        }
        private List<SimulationFeatureViewModel> getSimulationFeature(int layer_id, string feature_id)
        {
            using (var session = OpenSession())
            {
                var layer = getLayerWithTable(layer_id);
                var feature = getFeature(layer.table_info_id, feature_id);
                var results = new List<SimulationFeatureViewModel>();
                if (layer != null && feature != null)
                {
                    string sss = $@"
                    SELECT  tr.{nameof(TableRelation.id)},  tr.{nameof(TableRelation.table_id)}, tr.{nameof(TableRelation.table_column_id)},  
                            tr.{nameof(TableRelation.relation_table_id)},  tr.{nameof(TableRelation.relation_table_column_id)}, 
                            tr.{nameof(TableRelation.mediate_table_id)},
                            c.{nameof(TableColumn.id)}, c.{nameof(TableColumn.column_name)}, 
                            rc.{nameof(TableColumn.id)}, rc.{nameof(TableColumn.column_name)},
                            t.{nameof(TableInfo.id)}, t.{nameof(TableInfo.table_name)}, 
                            rt.{nameof(TableInfo.id)} , rt.{nameof(TableInfo.table_name)},
                            m.{nameof(TableInfo.id)}
                        FROM {Sql.Entity<TableRelation>():T} AS tr 
                    LEFT JOIN {Sql.Entity<TableColumn>():T} AS c
                        ON tr.{nameof(TableRelation.table_column_id)} = c.{nameof(TableColumn.id)}
                    LEFT JOIN {Sql.Entity<TableColumn>():T} AS rc
                        ON tr .{nameof(TableRelation.relation_table_column_id)} = rc.{nameof(TableColumn.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS t
                        ON tr.{nameof(TableRelation.table_id)} = t.{nameof(TableInfo.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS m
                        ON tr.{nameof(TableRelation.mediate_table_id)} = m.{nameof(TableInfo.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS rt
                        ON tr.{nameof(TableRelation.relation_table_id)} = rt.{nameof(TableInfo.id)}";
                    IEnumerable<TableRelation> relations = session.Query<TableRelation, TableColumn, TableColumn, TableInfo, TableInfo, TableInfo, TableRelation>(sss, (tr, c, rc, t, m, rt) =>
                    {
                        tr.table_column = c;
                        tr.relation_column = rc;
                        tr.table = t;
                        tr.mediate_table = m;
                        tr.relation_table = rt;
                        return tr;
                    },
                        splitOn: $"{nameof(TableColumn.id)}, {nameof(TableColumn.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}");

                    foreach (var relation in relations)
                    {
                        if (relation.table_id == layer.table_info_id)
                        {
                            feature.TryGetValue(relation.table_column.column_name, out var foreignValue);
                            if (!string.IsNullOrWhiteSpace(foreignValue?.ToString()))
                            {
                                var layerRelation = getLayerWithTableInfo(relation.relation_table_id);
                                if (layerRelation != null)
                                {
                                    string tableRelationName = $"{layerRelation.table.table_schema}.{layerRelation.table.table_name}";
                                    var listTableConditions = new List<String> { "1=1" };
                                    listTableConditions.Add($"{tableRelationName}.{relation.relation_column.column_name} = @foreignValue");

                                    var keyColumn = layerRelation.table.key_column ?? layerRelation.table.identity_column;
                                    var labelColumn = layerRelation.table.label_column ?? keyColumn;

                                    var hienTrangColumn = layerRelation.table.columns.Where(x => x.column_name.ToLower().Contains("hientrang")).FirstOrDefault();
                                    var select_sql = String.Empty;
                                    if (hienTrangColumn != null)
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{tableRelationName}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name}::TEXT AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                                ,{relation.table_id} AS parent_layer_id
                                                ,'{relation.table.name_vn}' AS parent_layer_name
                                                ,'{foreignValue}' AS foreign_value
                                                ,{tableRelationName}.{hienTrangColumn.column_name} AS status
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    else
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{tableRelationName}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name}::TEXT AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                                ,{relation.table_id} AS parent_layer_id
                                                ,'{relation.table.name_vn}' AS parent_layer_name
                                                ,'{foreignValue}' AS foreign_value
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }

                                    var result = session.Query<SimulationFeatureViewModel>(select_sql, new { foreignValue = foreignValue }).ToList();
                                    results.AddRange(result);
                                }
                            }
                        }
                        else if (relation.relation_table_id == layer.table_info_id)
                        {
                            feature.TryGetValue(relation.relation_column.column_name, out var foreignValue);
                            if (foreignValue != null && !string.IsNullOrWhiteSpace(foreignValue.ToString()))
                            {
                                var layerRelation = getLayerWithTableInfo(relation.table_id);
                                if (layerRelation != null)
                                {
                                    string tableRelationName = $"{layerRelation.table.table_schema}.{layerRelation.table.table_name}";
                                    var listTableConditions = new List<String> { "1=1" };
                                    listTableConditions.Add($"{tableRelationName}.{relation.table_column.column_name} = @foreignValue");

                                    var keyColumn = layerRelation.table.key_column ?? layerRelation.table.identity_column;
                                    var labelColumn = layerRelation.table.label_column ?? keyColumn;

                                    var hienTrangColumn = layerRelation.table.columns.Where(x => x.column_name.ToLower().Contains("hientrang")).FirstOrDefault();
                                    var select_sql = String.Empty;

                                    if (hienTrangColumn != null)
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{tableRelationName}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name}::TEXT AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                                ,{relation.table_id} AS parent_layer_id
                                                ,'{relation.table.name_vn}' AS parent_layer_name
                                                ,'{foreignValue}' AS foreign_value
                                                ,{tableRelationName}.{hienTrangColumn.column_name} AS status
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }
                                    else
                                    {
                                        select_sql = $@"SELECT
                                                CONCAT('{tableRelationName}', '.', {tableRelationName}.{keyColumn.column_name}) AS uid
                                                ,{tableRelationName}.{keyColumn.column_name}::TEXT AS id
                                                ,{tableRelationName}.{labelColumn.column_name}::TEXT AS name
                                                ,{layerRelation.id} AS layer_id
                                                ,'{layerRelation.name_vn}' AS layer_name
                                                ,{relation.table_id} AS parent_layer_id
                                                ,'{relation.table.name_vn}' AS parent_layer_name
                                                ,'{foreignValue}' AS foreign_value
                                            FROM {tableRelationName}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                                    }

                                    var result = session.Query<SimulationFeatureViewModel>(select_sql, new { foreignValue = foreignValue }).ToList();
                                    results.AddRange(result);
                                }
                            }
                        }
                    }
                }
                return results;
            }
        }

        private List<SearchFeatureViewModel> getQuickSearchFeatures(QuickSearchListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                var schema = (dto.schema != null) ? dto.schema : "";
                var tables = getTablesAndColumns(schema, dto.map_id, string.Empty, true).ToList();
                var listSQL = new List<string>();
                if (dto.table_id != null && dto.table_id.Length > 0)
                {
                    tables = tables.Where(x => dto.table_id.Any(o => o == x.id)).ToList();
                }

                tables.ForEach(table =>
                {
                    var listTableConditions = new List<String> { "1=1" };
                    if (string.IsNullOrWhiteSpace(dto.keyword) == false && table.columns.Any(x => x.column_name == "search_content"))
                    {
                        //listTableConditions.Add($"search_content @@ to_tsquery('{dto.keyword.Trim().Replace(" ", " & ")}')");
                        listTableConditions.Add($"search_content @@ to_tsquery('{dto.keyword.ToFullTextString()}')");
                    }
                    if (string.IsNullOrWhiteSpace(dto.geom) == false && table.columns.Any(x => x.column_name == "geom"))
                    {
                        listTableConditions.Add($"ST_Intersects({table.table_name}.geom, ST_SetSRID(ST_GeomFromGeoJSON('{dto.geom}'), 4326))");
                    }
                    if (table.columns.Where(x => x.column_name == "province_code").Count() > 0 && string.IsNullOrWhiteSpace(dto.province_code) == false)
                    {
                        var provinces = dto.province_code.Split(",").ToList();
                        if (provinces.Count() > 0)
                        {
                            listTableConditions.Add($"province_code IN ({String.Join(",", provinces.Select(x => $"'{x}'"))})");
                        }
                    }
                    if (table.columns.Where(x => x.column_name == "district_code").Count() > 0 && string.IsNullOrWhiteSpace(dto.district_code) == false)
                    {
                        var districts = dto.district_code.Split(",").ToList();
                        if (districts.Count() > 0)
                        {
                            listTableConditions.Add($"district_code IN ({String.Join(",", districts.Select(x => $"'{x}'"))})");
                        }
                    }
                    if (table.columns.Where(x => x.column_name == "commune_code").Count() > 0 && string.IsNullOrWhiteSpace(dto.commune_code) == false)
                    {
                        var communes = dto.commune_code.Split(",").ToList();
                        if (communes.Count() > 0)
                        {
                            listTableConditions.Add($"commune_code IN ({String.Join(",", communes.Select(x => $"'{x}'"))})");
                        }
                    }
                    var keyColumn = table.key_column ?? table.identity_column;
                    var labelColumn = table.label_column ?? keyColumn;

                    var table_innerjoin_sql = string.Empty;
                    var region_name = string.Empty;

                    var sqlRegion = new List<String>();
                    var sqlJoin = new List<string>();
                    if (table.columns.Any(x => x.column_name == "province_code"))
                    {
                        sqlRegion.Add($"{Sql.Entity<Province>(x => x.name_vn):TC} AS province");
                        sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_name}.province_code");
                    }
                    if (table.columns.Any(x => x.column_name == "district_code"))
                    {
                        sqlRegion.Add($"{Sql.Entity<District>(x => x.name_vn):TC} AS district");
                        sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_name}.district_code");
                    }
                    if (table.columns.Any(x => x.column_name == "commune_code"))
                    {
                        sqlRegion.Add($"{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune");
                        sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_name}.commune_code");
                    }
                    var region = sqlRegion.Count > 0 ? String.Join(",", sqlRegion) : "'' AS province, '' AS district, '' AS commune";
                    var join = sqlJoin.Count > 0 ? String.Join(" ", sqlJoin) : "";

                    var table_select_sql = string.Empty;
                    table_select_sql = $@"SELECT
                                                CONCAT('{table.table_name}', '.', {table.table_name}.{keyColumn.column_name}) AS uid
                                                ,{table.table_name}.{keyColumn.column_name}::TEXT AS id
                                                ,{table.table_name}.{labelColumn.column_name}::TEXT AS name
                                                ,{table.id} AS table_id
                                                ,'{table.name_vn}' AS table_name
                                                ,{region}
                                            FROM {table.table_schema}.{table.table_name}
                                            {join}
                                            WHERE {String.Join(" AND ", listTableConditions)}";
                    listSQL.Add(table_select_sql);
                });
                var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", listSQL)}) AS tables";
                var data = session.Query<SearchFeatureViewModel>(sql).ToList();
                return data;
            }
        }

        private List<IDictionary<string, object>> getSearchFeatures(TableInfo? table, SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
            {
                string conditions = string.Empty;
                string select = @$"SELECT {String.Join(',', table.columns.Where(x => "geom".Equals(x.column_name) == false).Select(x => $"{table.table_schema}.{table.table_name}." + x.column_name))}";

                if (table.columns.Any(x => x.column_name == "geom"))
                {
                    select += @$", ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom";
                }
                string tables = $" FROM {table.table_schema}.{table.table_name} ";
                if (table.columns.Any(x => x.column_name == "commune_code"))
                {
                    select += $",{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune_name ";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.commune_code ";
                }
                if (table.columns.Any(x => x.column_name == "district_code"))
                {
                    select += $",{Sql.Entity<District>(x => x.name_vn):TC} AS district_name ";
                    tables += $" LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.district_code ";
                }
                if (table.columns.Any(x => x.column_name == "province_code"))
                {
                    select += $",{Sql.Entity<Province>(x => x.name_vn):TC} AS province_name ";
                    tables += @$" LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.province_code ";
                }
                conditions = getConditions(table, dto.@params);
                string wheres = $" WHERE {conditions}";
                if (dto.form != null)
                {
                    // * Lọc dữ liệu được tải lên từ biểu mẫu
                    var filterFeature = $"{Sql.Entity<Form.Feature>(x => x.table_id):TC} = @table_id AND {Sql.Entity<Form.Feature>(x => x.form_id):TC} = @id";
                    var features = session.Find<Form.Feature>(x => x
                        .Where($"{filterFeature}")
                        .WithParameters(new
                        {
                            dto.form.table_id,
                            dto.form.id,
                        }));
                    if (features.Count() > 0 && table.key_column != null)
                    {
                        conditions += $" AND ({table.table_name}.{table.key_column?.column_name} IN ({string.Join(",", features.Select(x => x.feature_id))}))";
                    }
                }
                string sql = select + tables + wheres;
                var result = session.Query(sql).ToList();

                var records = result.Select(x => (IDictionary<string, object>)x).ToList();

                return records;
            }
        }

        private void AddData(ExcelPackage p, QuickSearchListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                ExcelWorksheet sheet;
                ExcelRange cell;
                var data = getQuickSearchFeatures(dto);
                if (data.Count() > 0)
                {
                    var dataGroupByLayer = data.GroupBy(x => x.table_id);
                    if (dataGroupByLayer != null && dataGroupByLayer.Count() > 0)
                    {
                        foreach (var layerExport in dataGroupByLayer)
                        {
                            int row = 1;
                            string cellMerge;
                            if (layerExport.Key != null)
                            {
                                TableInfo? table = getTableAndColumns(layerExport.Key.Value);
                                if (table != null)
                                {
                                    TableColumn? keyColumn = table.key_column ?? table.identity_column;
                                    if (keyColumn == null)
                                        continue;
                                    List<TableColumn> selectedColumns = table.columns.Where(x => "geom".Equals(x.column_name) == false && x.column_name != "desc" && x.visible).ToList();

                                    var columnsStr = string.Join(",", selectedColumns.Select(x => x.column_name));
                                    string sqlQuery = $"SELECT {columnsStr} FROM {table.table_schema}.{table.table_name} WHERE {keyColumn.column_name}::TEXT = ANY(@feature_ids) ORDER BY {keyColumn.column_name}";
                                    var features = session.Query<object>($"{sqlQuery}", new { feature_ids = layerExport.Select(x => x.id.ToString()).ToArray() }).ToList();

                                    if (features != null && features.Count() > 0)
                                    {
                                        sheet = p.Workbook.Worksheets.Add($"{table.name_vn}");
                                        sheet.DefaultRowHeight = 20;

                                        cell = sheet.Cells[1, 1];
                                        cell.Style.Font.Size = 14;
                                        cell.Style.Font.Name = "Times New Roman";
                                        cell.Value = "Thông tin dữ liệu " + table.name_vn;
                                        OfficeHelper.setStyle(ref cell,
                                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                        string cellMerge3 = sheet.Cells[1, 1] + ":" + sheet.Cells[1, selectedColumns.Count() + 1];
                                        ExcelRange rng3 = sheet.Cells[cellMerge3];
                                        rng3.Merge = true;

                                        row = 2;

                                        cell = sheet.Cells[row, 1];
                                        cell.Style.Font.Size = 11;
                                        cell.Style.Font.Name = "Times New Roman";
                                        cell.Style.WrapText = true;
                                        cell.Value = "STT";
                                        OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                        cell = sheet.Cells[row + 1, 1];
                                        OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                        cellMerge3 = sheet.Cells[row, 1] + ":" + sheet.Cells[row + 1, 1];
                                        rng3 = sheet.Cells[cellMerge3];
                                        rng3.Merge = true;

                                        var col = 2;

                                        foreach (var column in selectedColumns)
                                        {
                                            if (column.lookup_table_id == 0)
                                            {
                                                if (column.data_type.Equals(EnumPgDataType.Boolean))
                                                {
                                                    cell = sheet.Cells[row, col];
                                                    cell.Style.Font.Size = 11;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Value = column.name_vn;
                                                    cell.Style.WrapText = true;
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                                    var colDM = col;
                                                    cell = sheet.Cells[row, col + 1];
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                                    cell = sheet.Cells[row + 1, col];
                                                    cell.Style.Font.Size = 11;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Value = "Có";
                                                    cell.Style.WrapText = true;
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                                    cell = sheet.Cells[row + 1, col + 1];
                                                    cell.Style.Font.Size = 11;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Value = "Không";
                                                    cell.Style.WrapText = true;
                                                    cell.Style.ShrinkToFit = true;
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                                    cellMerge3 = sheet.Cells[row, col] + ":" + sheet.Cells[row, col + 1];
                                                    rng3 = sheet.Cells[cellMerge3];
                                                    rng3.Merge = true;

                                                    col++;
                                                }
                                                else
                                                {
                                                    cell = sheet.Cells[row, col];
                                                    cell.Style.Font.Size = 11;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Value = column.name_vn;
                                                    cell.Style.WrapText = true;
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                                    cell = sheet.Cells[row + 1, col];
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                                    cellMerge3 = sheet.Cells[row, col] + ":" + sheet.Cells[row + 1, col];
                                                    rng3 = sheet.Cells[cellMerge3];
                                                    rng3.Merge = true;

                                                    if (column.data_type == EnumPgDataType.String || column.data_type == EnumPgDataType.Text)
                                                    {
                                                        sheet.Columns[col].Width = 20;
                                                    }
                                                    else
                                                    {
                                                        sheet.Columns[col].Width = 15;
                                                    }
                                                }
                                            }
                                            else
                                            {
                                                cell = sheet.Cells[row, col];
                                                cell.Style.Font.Size = 11;
                                                cell.Style.Font.Name = "Times New Roman";
                                                cell.Value = column.name_vn;
                                                cell.Style.WrapText = true;
                                                OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                                cellMerge3 = sheet.Cells[row, col] + ":" + sheet.Cells[row + 1, col];
                                                rng3 = sheet.Cells[cellMerge3];
                                                rng3.Merge = true;
                                                sheet.Columns[col].Width = 20;

                                            }
                                            col++;
                                        }
                                        var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id)}"));
                                        var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id)}"));
                                        var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id)}"));
                                        IDictionary<string, List<DomainViewModel>> domains_values = domainValueForLookup(table);

                                        var dem = 0;
                                        row = 4;

                                        foreach (var feature in features)
                                        {
                                            cell = sheet.Cells[row, 1];
                                            cell.Style.Font.Size = 11;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Value = ++dem;
                                            OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                            var colIdx = 2;
                                            var incre = 0;

                                            var rowValue = feature as IDictionary<string, object>;

                                            if (rowValue != null)
                                            {
                                                for (int j = 0; j < selectedColumns.Count(); j++)
                                                {
                                                    var currentCol = rowValue.FirstOrDefault(s => s.Key == selectedColumns[j].column_name);

                                                    if (selectedColumns[j].lookup_table_id == 0)
                                                    {
                                                        if (selectedColumns[j].data_type.Equals(EnumPgDataType.Boolean)) //)
                                                        {
                                                            if (currentCol.Value != null)
                                                            {
                                                                if (Convert.ToBoolean(currentCol.Value) == true)
                                                                {
                                                                    cell = sheet.Cells[row, colIdx + j + incre];
                                                                    cell.Value = "x";
                                                                    OfficeHelper.setStyle(ref cell,
                                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);
                                                                }
                                                                else
                                                                {
                                                                    cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                                    cell.Value = "x";
                                                                    OfficeHelper.setStyle(ref cell,
                                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);
                                                                }
                                                            }
                                                            else
                                                            {
                                                                cell = sheet.Cells[row, colIdx + j + incre];
                                                                cell.Style.Font.Size = 11;
                                                                cell.Style.Font.Name = "Times New Roman";
                                                                OfficeHelper.setStyle(ref cell,
                                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                                                cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                                OfficeHelper.setStyle(ref cell,
                                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);
                                                            }
                                                            incre += 1;
                                                        }
                                                        else
                                                        {
                                                            cell = sheet.Cells[row, colIdx + j + incre];
                                                            cell.Style.Font.Size = 11;
                                                            cell.Style.Font.Name = "Times New Roman";
                                                            if (currentCol.Value != null)
                                                            {
                                                                switch (selectedColumns[j].data_type)
                                                                {
                                                                    case EnumPgDataType.SmallInt:
                                                                    case EnumPgDataType.Integer:
                                                                    case EnumPgDataType.Double:
                                                                        cell.Value = currentCol.Value;
                                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.RIGHT);
                                                                        break;
                                                                    case EnumPgDataType.String:
                                                                    case EnumPgDataType.Text:
                                                                        if (!string.IsNullOrWhiteSpace(currentCol.Value.ToString()))
                                                                        {
                                                                            if (currentCol.Key == "commune_code")
                                                                            {
                                                                                cell.Value = communes.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                                            }
                                                                            else if (currentCol.Key == "district_code")
                                                                            {
                                                                                cell.Value = districts.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                                            }
                                                                            else if (currentCol.Key == "province_code")
                                                                            {
                                                                                cell.Value = provinces.FirstOrDefault(s => s.area_id == currentCol.Value.ToString())?.name_vn;
                                                                            }
                                                                            else
                                                                            {
                                                                                cell.Value = currentCol.Value.ToString();
                                                                            }
                                                                        }
                                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                                                        break;
                                                                    case EnumPgDataType.Date:
                                                                    case EnumPgDataType.Time:
                                                                    case EnumPgDataType.DateTime:
                                                                        cell.Value = Convert.ToDateTime(currentCol.Value).ToString("dd/MM/yyyy");
                                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.CENTER);
                                                                        break;
                                                                    default:
                                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT);
                                                                        break;
                                                                }
                                                            }
                                                            else
                                                            {
                                                                OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT);
                                                            }
                                                        }
                                                    }
                                                    else
                                                    {
                                                        domains_values.TryGetValue(selectedColumns[j].column_name, out var domains);
                                                        var domain = domains != null ? domains.Where(x => x.id?.ToString() == currentCol.Value?.ToString()).FirstOrDefault() : new DomainViewModel();
                                                        cell = sheet.Cells[row, colIdx + j + incre];
                                                        cell.Style.Font.Size = 11;
                                                        cell.Style.Font.Name = "Times New Roman";
                                                        cell.Value = domain != null ? domain.mo_ta : "Không xác định";

                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT);
                                                    }
                                                }
                                                row++;
                                            }
                                        }
                                        sheet.Cells.AutoFitColumns();
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        sheet = p.Workbook.Worksheets.Add("Thông tin tìm kiếm");
                        cell = sheet.Cells[1, 1];
                        cell.Style.Font.Size = 14;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Value = "Thông tin tìm kiếm";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    }
                }
                else
                {
                    sheet = p.Workbook.Worksheets.Add("Thông tin tìm kiếm");
                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Thông tin tìm kiếm";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                }
            }
        }

        private StringBuilder ConvertDataTableToCsvFile(DataTable dtData)
        {
            StringBuilder data = new StringBuilder();

            //Taking the column names.
            for (int column = 0; column < dtData.Columns.Count; column++)
            {
                //Making sure that end of the line, shoould not have comma delimiter.
                if (column == dtData.Columns.Count - 1)
                    data.Append(dtData.Columns[column].ColumnName.ToString().Replace(",", ";"));
                else
                    data.Append(dtData.Columns[column].ColumnName.ToString().Replace(",", ";") + ',');
            }

            data.Append(Environment.NewLine);//New line after appending columns.

            for (int row = 0; row < dtData.Rows.Count; row++)
            {
                for (int column = 0; column < dtData.Columns.Count; column++)
                {
                    ////Making sure that end of the line, shoould not have comma delimiter.
                    if (column == dtData.Columns.Count - 1)
                        data.Append(dtData.Rows[row][column].ToString().Replace(",", ";"));
                    else
                        data.Append(dtData.Rows[row][column].ToString().Replace(",", ";") + ',');
                }

                //Making sure that end of the file, should not have a new line.
                if (row != dtData.Rows.Count - 1)
                    data.Append(Environment.NewLine);
            }
            return data;
        }
    }
}