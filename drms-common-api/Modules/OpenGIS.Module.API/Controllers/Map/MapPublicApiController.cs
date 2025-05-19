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
using Newtonsoft.Json.Linq;
namespace OpenGIS.Module.API.Controllers;
public partial class MapController
{

    private string ParseFilter(TableInfo table, JToken? jTokens)
    {
        if (jTokens == null)
        {
            return "";
        }
        List<string> parsedFilter = new List<string>();
        if (jTokens is JArray && jTokens.Any(x => x.Type != JTokenType.String && x.Type != JTokenType.Null))
        {
            foreach (JToken? f in jTokens)
            {
                if (f is JArray)
                {
                    parsedFilter.Add(ParseFilter(table, f));
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
                    return $"(1=1)";
                }
                else if (jTokens[0].Value<string?>()?.ToLower() == "matuyen")
                {
                    var tuyenColumn = table.columns.FirstOrDefault(x => x.column_name.Contains("matuyen"));
                    if (tuyenColumn != null)
                    {
                        string? op = jTokens[1].Value<string?>() ?? "<>";
                        if ((op == "<" || op == ">") && (tuyenColumn.data_type == EnumPgDataType.String || tuyenColumn.data_type == EnumPgDataType.Text))
                        {
                            op = "=";
                        }
                        else
                        {
                            op = "=";
                        }
                        string? value = jTokens[2].Value<string?>();
                        if (value == null)
                        {
                            return $"(\"{table.table_name}\".\"{tuyenColumn.column_name}\" IS NULL)";
                        }
                        else if (string.IsNullOrWhiteSpace(value))
                        {
                            return $"(\"{table.table_name}\".\"{tuyenColumn.column_name}\"::TEXT = '')";
                        }
                        return $"(\"{table.table_name}\".\"{tuyenColumn.column_name}\" {jTokens[1]} $${value}$$)";
                    }
                    else
                    {
                        return "1=2";
                    }
                }
                else
                {
                    var column = table.columns.FirstOrDefault(x => x.column_name == jTokens[0].Value<string?>());
                    if (column == null)
                    {
                        return "1=2";
                    }
                    string? op = jTokens[1].Value<string?>() ?? "<>";
                    if ((op == "<" || op == ">" || op == "contains") && (column.data_type == EnumPgDataType.String || column.data_type == EnumPgDataType.Text))
                    {
                        op = "=";
                    }
                    else
                    {
                        op = "=";
                    }
                    string? value = jTokens[2].Value<string?>();
                    if (value == null)
                    {
                        return $"(\"{table.table_name}\".\"{column.column_name}\" IS NULL)";
                    }
                    else if (string.IsNullOrWhiteSpace(value))
                    {
                        return $"(\"{table.table_name}\".\"{column.column_name}\"::TEXT = '')";
                    }
                    return $"(\"{table.table_name}\".\"{jTokens[0]}\" {op} $${jTokens[2]}$$)";
                }
            }
            else
            {
                return "";
            }
        }

        if (parsedFilter.Count <= 2)
        {
            return "";
        }

        return string.Join(" ", parsedFilter);
    }

    [HttpGet("public/{id:int}")]
    [AllowAnonymous]
    public RestBase GetMapPublic([FromRoute] int id)
    {
        using var session = OpenSession();

        return new RestData
        {
            data = session.Get(new Map { id = id })
        };
    }

    [HttpPost("public/query-feature")]
    [AllowAnonymous]
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
                layer = getLayerWithTableAndColumn(dto.layer_id.Value, string.Empty, true);
                if (layer == null)
                {
                    return new RestError(404, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                else
                {
                    table = layer.table;
                }
            }
            else if (dto.table_id.HasValue && dto.table_id.Value > 0)
            {
                table = getTableAndColumns(dto.table_id.Value, false, true);
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

    [AllowAnonymous]
    [HttpPost("public/advanced-search")]
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
                Layer? layer = dto.layer_id.HasValue ? getLayerWithTableAndColumn(dto.layer_id.Value, bypassFilter: true) : null;
                TableInfo? table = layer != null ? layer.table : getTableAndColumns(dto.table_id.Value, byPassFilter: true);
                if (table == null)
                {
                    return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                Map map = session.Get(new Map { id = dto.mapId.HasValue ? dto.mapId.Value : 0 });

                if (map == null)
                {
                    return new RestError(400, "Vui lòng kiểm tra lại tham số!");
                }

                string conditions = string.Empty;

                var domains = domainValueForLookup(table);
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
                conditions = getConditions(table, dto.@params, byPassFilter: true);

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
                    string parsed = ParseFilter(table, dto.filter);
                    if (string.IsNullOrWhiteSpace(parsed) == false)
                    {
                        wheres += $" AND ({parsed})";
                    }
                }

                string orderby = string.Empty;

                TableColumn? orderColumn = table.label_column ?? table.key_column ?? table.identity_column;
                if (!string.IsNullOrWhiteSpace(dto.orderby))
                {
                    orderby = @$" ORDER BY " + dto.orderby;
                }
                else if (orderColumn != null)
                {
                    orderby = @$" ORDER BY " + orderColumn.column_name;
                }
                List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                List<object> totalSummary = new List<object>();
                int totalCount = session.Query<int>(@$"SELECT COUNT(1) FROM {table.table_schema}.{table.table_name} {wheres}").FirstOrDefault();
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
                    var firstGroup = dto.group.FirstOrDefault();
                    TableColumn? groupedColumn = table.columns.FirstOrDefault(x => x.column_name == firstGroup?.selector);
                    string tableAlias = $"\"{table.table_schema}\".\"{table.table_name}\"";
                    StringBuilder stringBuilder = new StringBuilder();
                    stringBuilder.AppendLine($"SELECT {tableAlias}.{firstGroup?.selector} AS key, COUNT({tableAlias}.\"{table.identity_column?.column_name}\") AS count");
                    stringBuilder.AppendLine($"FROM {tableAlias} {wheres}");
                    stringBuilder.AppendLine($"GROUP BY {tableAlias}.{firstGroup?.selector} ORDER BY {tableAlias}.{firstGroup?.selector}");
                    // stringBuilder.AppendLine($"LIMIT {dto.take} OFFSET {dto.skip};");
                    string sql = stringBuilder.ToString();
                    var groupedData = session.Query<DevExprGridGroupItem>(sql).ToList();
                    if (dto.groupSummary != null && dto.groupSummary.Count() > 0)
                    {
                        var groupSummary = dto.groupSummary.FirstOrDefault();
                        if (groupSummary != null)
                        {
                            groupedData.ForEach(o => o.summary = new List<object>() { o.count });
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

                    var r = new RestData()
                    {
                        data = new
                        {
                            dataSearch = new DevExprGridGroupData
                            {
                                data = groupedData,
                                totalCount = totalCount,
                                groupCount = groupedData.Count,
                                totalSummary = totalSummary,
                                boundary = boundary
                            },
                            domains = domains,
                            relations = relations,
                        }
                    };

                    return r;
                }
                else if (!dto.onlyReturnCount.HasValue || dto.onlyReturnCount.Value == false)
                {
                    string sql = select + tables + wheres + orderby + $" LIMIT {dto.take} OFFSET {dto.skip}";
                    var result = session.Query(sql).ToList();

                    records = result.Select(x => (IDictionary<string, object>)x).ToList();

                    if (table.columns.Any(p => p.column_name == "geom"))
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

                return response;
            }
        }
    }

    [ResponseCache(Duration = 300, VaryByQueryKeys = new string[] { "area_id", "f" })]
    [HttpGet("public/boundary")]
    [AllowAnonymous]
    public async Task<RestBase> shape([FromQuery] string? area_id = "", [FromQuery] string? f = "json")
    {
        if (string.IsNullOrWhiteSpace(area_id) && (f?.ToLower()?.Equals("json") == false || f?.ToLower()?.Equals("wkt") == false))
        {
            return new RestError("MISSING_PARAMETER")
            {
                errors = new RestErrorDetail[]{
                        new RestErrorDetail(){
                            code = 400,
                            message = "missing params"
                        }
                    }
            };
        }
        else
        {
            using (var session = OpenSession())
            {
                object? data = null;
                //if (area_id.ToString().Length == 1)
                //    data = (await session.QueryAsync<string>($"SELECT ST_AsGeoJson(geom) FROM {Sql.Entity<Region>():T} WHERE {Sql.Entity<EntityRegion>(x => x.area_id):TC}= @area_id", new { area_id = area_id })).FirstOrDefault();
                if (area_id.ToString().Length == 2)
                    data = (await session.QueryAsync($"SELECT ST_AsGeoJson(geom) AS boundary, ST_AsGeoJSON(ST_Extent(ST_Buffer(st_envelope(geom)::GEOGRAPHY, 1000)::Geometry)) as extent FROM {Sql.Entity<Province>():T} WHERE {Sql.Entity<Province>(x => x.area_id):TC}=@area_id GROUP BY geom", new { area_id = area_id })).FirstOrDefault();
                else if (area_id.ToString().Length == 3)
                    data = (await session.QueryAsync($"SELECT ST_AsGeoJson(geom) AS boundary, ST_AsGeoJSON(ST_Extent(ST_Buffer(st_envelope(geom)::GEOGRAPHY, 1000)::Geometry)) as extent FROM {Sql.Entity<District>():T} WHERE {Sql.Entity<District>(x => x.area_id):TC}=@area_id GROUP BY geom", new { area_id = area_id })).FirstOrDefault();
                else if (area_id.ToString().Length == 5)
                    data = (await session.QueryAsync($"SELECT ST_AsGeoJson(geom) AS boundary, ST_AsGeoJSON(ST_Extent(ST_Buffer(st_envelope(geom)::GEOGRAPHY, 1000)::Geometry)) as extent FROM {Sql.Entity<Commune>():T} WHERE {Sql.Entity<Commune>(x => x.area_id):TC}=@area_id GROUP BY geom", new { area_id = area_id })).FirstOrDefault();
                return new RestData()
                {
                    data = data
                };
            }
        }
    }

    [HttpPost("public/wfsflb")]
    [AllowAnonymous]
    public async Task<FileContentResult> WFSFlatGeoBufPublic([FromForm] WFSParameter dto)
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
            var layerFilters = dto.layerFilterIds?.Split(",").ToList() ?? layerInfos.Select(o => o.id.ToString());

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
                    condition = getConditions(layer.table, param, byPassFilter: true);
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
            return File(buffer ?? new byte[] { }, "application/octet-stream");
        }
    }

    [AllowAnonymous]
    [HttpGet("public/tree-regions")]
    [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "mapId" })]
    public async Task<RestBase> GetRegionsPublicAsync([FromQuery] int? mapId, [FromQuery] string? parentId)
    {
        using (var session = OpenSession())
        {
            var mapRegions = session.Find<MapRegion>(statement => statement
                .Where($"{Sql.Entity<MapRegion>(p => p.map_id):TC}=@mapId")
                .WithParameters(new { mapId })
            ).ToList();
            var ExprTreeView = new List<DevTreeView>();
            var provinces = (await session.FindAsync<Province>(statement => statement
                .Where($"{Sql.Entity<Province>(p => p.area_id):TC} = ANY(@areaIds)")
                .WithParameters(new
                {
                    areaIds = mapRegions.Where(o => o.area_type == 1).Select(o => o.area_code).ToArray()
                })
            )).ToList();
            var districts = (await session.FindAsync<District>(statement => statement
                .Where($"{Sql.Entity<District>(p => p.area_id):TC} = ANY(@areaIds)")
                .WithParameters(new
                {
                    areaIds = mapRegions.Where(o => o.area_type == 2).Select(o => o.area_code).ToArray()
                })
            )).ToList();
            var communes = (await session.FindAsync<Commune>(statement => statement
                .Where($"{Sql.Entity<Commune>(p => p.area_id):TC} = ANY(@areaIds)")
                .WithParameters(new
                {
                    areaIds = mapRegions.Where(o => o.area_type == 3).Select(o => o.area_code).ToArray()
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
                    isExpanded = true,
                    children = districts.Where(d => d.parent_id == x.area_id).Select(d => new DevTreeView
                    {
                        id = d.area_id,
                        text = d.name_vn,
                        hasItems = true,
                        parentId = x.area_id,
                        isExpanded = true,
                        children = communes.Where(c => c.parent_id == d.area_id).Select(c => new DevTreeView
                        {
                            id = c.area_id,
                            text = c.name_vn,
                            hasItems = false,
                            parentId = d.area_id,
                            isExpanded = false,
                        }).ToList()
                    }).ToList()
                });
            });
            return new RestData
            {
                data = ExprTreeView
            };
        }
    }

    [AllowAnonymous]
    [HttpGet("public/tree-base-layers")]
    [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "mapId" })]
    public RestBase getTreeBaseLayers([FromQuery] int mapId = 0)
    {
        using (var session = OpenSession())
        {
            string condition = "1=1";
            if (mapId > 0)
            {
                List<MapBaseLayers> listMapBaseLayers = session.Find<MapBaseLayers>(statement => statement
                    .Where($"{nameof(MapBaseLayers.map_id)} = @mapId")
                    .WithParameters(new { mapId })
                ).ToList();
                List<int> BaseLayerIds = listMapBaseLayers.Select(x => x.base_layer_id).ToList();
                if (BaseLayerIds.Count() > 0)
                {
                    condition = $"{Sql.Entity<BaseLayer>(x => x.id):TC} IN ({string.Join(",", BaseLayerIds)})";
                }
                else
                {
                    condition = "0=1";
                }
                List<BaseLayer> BaseLayers = session.Find<BaseLayer>(stm => stm.Where($"{condition}")).ToList();
                List<IDictionary<string, object>> children = new List<IDictionary<string, object>>();
                foreach (var BaseLayer in BaseLayers)
                {
                    BaseLayer.visible = listMapBaseLayers.FirstOrDefault(o => o.base_layer_id == BaseLayer.id)?.visible ?? false;
                    IDictionary<string, object> child = new Dictionary<string, object>
                        {
                        { "key", $"base_{BaseLayer.id}"},
                        { "label", BaseLayer.name },
                        { "data", BaseLayer },
                        { "type", "@BaseLayer"},
                        { "selected", BaseLayer.visible }
                        };
                    children.Add(child);
                }
                IDictionary<string, object> baseGroup = new Dictionary<string, object>
                {
                    { "key", $"g_BaseLayers"},
                    { "label", "Lớp nền"},
                    { "expanded", true},
                    { "icon", "mdi mdi-layers-outline" },
                    { "type", "@BaseLayergroup"},
                };
                if (children.Count > 0)
                {
                    baseGroup.Add("children", children);
                }
                return new RestData
                {
                    data = new IDictionary<string, object>[] { baseGroup }
                };
            }

            return new RestError(404, "Không có thông tin bản đồ!");
        }
    }

    [AllowAnonymous]
    [HttpGet("public/tree-layers")]
    [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "mapId" })]
    public async Task<RestBase> GetMapLayersPublic([FromQuery] int mapId)
    {
        using (var session = OpenSession())
        {
            var map = session.Get(new Map { id = mapId });
            List<MapLayers> mapLayers = session.Find<MapLayers>(statement => statement
                .Where($"{nameof(MapLayers.map_id)}=@mapId")
                .WithParameters(new { mapId })
            ).ToList();
            List<int> layerIds = mapLayers.Select(x => x.layer_id).ToList();
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
                            { "key", $"g_{layerGroup.id}" },
                            { "label", layerGroup.name_vn },
                            { "expanded", true },
                            { "icon", "mdi mdi-layers-outline" },
                            { "type", "@layergroup" },
                            { "data", layerGroup }
                        };
                List<IDictionary<string, object>> children = new List<IDictionary<string, object>>();
                if (layerGroup.layers != null)
                {
                    foreach (var layer in layerGroup.layers.OrderBy(x => x.order))
                    {
                        if (layer.hidden == false)
                        {
                            int countRecords = 0;

                            if (layer.layer_type != "raster" && layer.table != null)
                            {
                                TableColumn? keyColumn = layer.table.key_column ?? layer.table.identity_column;
                                if (keyColumn != null)
                                {
                                    string sqlCount = $"SELECT COUNT({keyColumn.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name} WHERE 1=1";
                                    if (!string.IsNullOrEmpty(map.boundary))
                                    {
                                        sqlCount += @$" AND st_intersects(geom, ST_GeomFromGeoJSON('{map.boundary}'))";
                                    }
                                    countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                                }
                            }
                            IDictionary<string, object> child = new Dictionary<string, object>
                                    {
                                        //var domains = getDomainValues(layer);
                                        //var relations = getRelations(layer);
                                        { "key", $"l_{layer.id}" },
                                        { "label", $"{layer.name_vn} ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})"},
                                        { "data", layer },
                                        { "type", "@layer" },
                                        { "icon", "mdi mdi-circle-outline" },
                                        { "selected", mapLayers.FirstOrDefault(o => o.layer_id == layer.id)?.visible ?? layer.is_visible }
                                    };
                            //child.Add("domains", domains);
                            //child.Add("relations", relations);
                            if (layer.layer_type != "raster" && layer.table != null)
                            {
                                TableColumn? keyColumn = layer.table.key_column ?? layer.table.identity_column;

                                if (layer.layer_classify.Count() > 0)
                                {
                                    List<IDictionary<string, object>> childrenClassify = new List<IDictionary<string, object>>();
                                    foreach (var classify in layer.layer_classify.Where(x => x.table_column_id == layer.classify_column_id).ToList())
                                    {
                                        var column = layer.table.columns.FirstOrDefault(x => x.id == classify.table_column_id);
                                        if (column != null)
                                        {
                                            string sqlCount = $"SELECT COUNT({keyColumn?.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name} WHERE lower({column.column_name}) = '{classify.value.ToLower()}'";
                                            if (column.data_type == EnumPgDataType.Integer || column.data_type == EnumPgDataType.BigInt)
                                            {
                                                sqlCount = $"SELECT COUNT({keyColumn?.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name} WHERE {column.column_name}::TEXT = @value";
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
                                            {"key", $"lc_{classify.id}" },
                                            {"label", classify.description + $" ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})" },
                                            {"data", classify },
                                            {"type", "@layer_classify" },
                                            {"selected", layer.is_visible },
                                            {"icon", "mdi mdi-circle-outline" }
                                        };
                                        childrenClassify.Add(childClassify);
                                    }
                                    if (childrenClassify.Count > 0)
                                    {
                                        child.Add("children", childrenClassify);
                                        child.Add("expanded", (User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)) && childrenClassify.Count < 10);
                                    }
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
                                { "key", $"tl_{layer.id}" },
                                { "label", layer.name },
                                { "data", layer },
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
                    data.Add("children", children);
                    treeItems.Add(data);
                }
            }

            foreach (var layer in layers.OrderBy(x => x.order))
            {
                if (layer.hidden == false)
                {
                    int countRecords = 0;
                    if (layer.layer_type != "raster" && layer.table != null)
                    {
                        TableColumn? keyColumn = layer.table?.key_column ?? layer.table?.identity_column;
                        if (keyColumn != null)
                        {
                            string sqlCount = @$"SELECT COUNT({keyColumn.column_name}) FROM {layer.table?.table_schema}.{layer.table?.table_name} WHERE 1=1";
                            if (!string.IsNullOrEmpty(map.boundary))
                            {
                                sqlCount += @$" AND st_intersects(geom, ST_GeomFromGeoJSON('{map.boundary}'))";
                            }
                            countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                        }
                    }
                    IDictionary<string, object> child = new Dictionary<string, object>
                        {
                            //var domains = getDomainValues(layer);
                            //var relations = getRelations(layer);
                            { "key", $"l_{layer.id}" },
                            { "label", $"{layer.name_vn} ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})" },
                            { "data", layer },
                            { "type", "@layer" },
                            { "icon", "mdi mdi-layers-outline" },
                            { "selected", layer.is_visible }
                        };
                    //child.Add("domains", domains);
                    //child.Add("relations", relations);
                    if (layer.layer_classify != null && layer.layer_classify.Count() > 0)
                    {
                        List<IDictionary<string, object>> childrenClassify = new List<IDictionary<string, object>>();
                        foreach (var classify in layer.layer_classify.Where(x => x.table_column_id == layer.classify_column_id).ToList())
                        {
                            IDictionary<string, object> childClassify = new Dictionary<string, object>
                                    {
                                        {"key", $"lc_{classify.id}" },
                                        {"label", classify?.description },
                                        {"data", classify },
                                        {"type", "@layer_classify" },
                                        {"selected", layer.is_visible },
                                        {"icon", "mdi mdi-circle-outline" }

                                    };
                            childrenClassify.Add(childClassify);
                        }
                        if (childrenClassify.Count > 0)
                        {
                            child.Add("children", childrenClassify);
                            child.Add("expanded", (User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)) && childrenClassify.Count < 10);
                        }
                    }
                    layerChildren.Add(child);
                }
            }

            IDictionary<string, object> dataOrphan = new Dictionary<string, object>
                {
                    { "key", $"g_Orphans" },
                    { "label", "Nhóm dữ liệu khác" },
                    { "expanded", true },
                    { "icon", "mdi mdi-layers-outline" },
                    { "type", "@layergroup" }
                };

            if (layerChildren.Count > 0)
            {
                dataOrphan.Add("children", layerChildren);
                treeItems.Add(dataOrphan);
            }


            // Bảng dữ liệu
            IDictionary<string, object> dataTable = new Dictionary<string, object>
                    {
                        { "key", $"g_Table" },
                        { "label", "Bảng dữ liệu" },
                        { "expanded", true },
                        { "icon", "mdi mdi-layers-outline" },
                        { "type", "@tablegroup" }
                    };
            List<IDictionary<string, object>> tableGroupItems = new List<IDictionary<string, object>>();
            foreach (var tableGroup in tableGroups)
            {
                IDictionary<string, object> dataTableGroup = new Dictionary<string, object>
                        {
                            { "key", $"tg_{tableGroup.id}" },
                            { "label", tableGroup.name_vn },
                            { "expanded", true },
                            { "icon", "mdi mdi-layers-outline" },
                            { "type", "@table-sm-group" },
                            { "data", tableGroup }
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
                            string sqlCount = @$"SELECT COUNT({keyColumn.column_name}) FROM {table.table_schema}.{table.table_name}";
                            countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                        }
                        IDictionary<string, object> child = new Dictionary<string, object>
                                    {
                                        { "key", $"table_{table.id}" },
                                        { "label", $"{table.name_vn} ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})"},
                                        { "data", table },
                                        { "type", "@table" },
                                        { "icon", "mdi mdi-circle-outline" },
                                        { "selected", false}
                                    };
                        tableItems.Add(child);
                    }
                }
                if (tableItems.Count > 0)
                {
                    dataTableGroup.Add("children", tableItems);
                    tableGroupItems.Add(dataTableGroup);
                }
            }

            IDictionary<string, object> dataTableOrphan = new Dictionary<string, object>
                    {
                        { "key", $"tg_Orphans" },
                        { "label", "Nhóm dữ liệu khác" },
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
                    string sqlCount = @$"SELECT COUNT({keyColumn.column_name}) FROM {table.table_schema}.{table.table_name}";
                    countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                }
                IDictionary<string, object> child = new Dictionary<string, object>
                        {
                           { "key", $"table_{table.id}" },
                           { "label", $"{table.name_vn} ({countRecords.ToString("N0", CultureInfo.CurrentCulture)})"},
                           { "data", table },
                           { "type", "@table" },
                           { "icon", "mdi mdi-layers-outline" },
                           { "selected", true }
                        };
                tableChildren.Add(child);
            }
            if (tableChildren.Count > 0)
            {
                dataTableOrphan.Add("children", tableChildren);
                tableGroupItems.Add(dataTableOrphan);
            }

            if (tableGroupItems.Count() > 0)
            {
                dataTable.Add("children", tableGroupItems);
                treeItems.Add(dataTable);
            }

            return new RestData()
            {
                data = treeItems
            };
        }
    }
}