using System;
using System.Linq;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Enums;
using System.Collections.Generic;
using VietGIS.Infrastructure.Identity.PostgreSQL.Models;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.API.Controllers
{
    public partial class LayerController
    {
        [HttpGet("{layer_id}/listIndexes")]
        public RestBase listIndexes([FromRoute] int layer_id)
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
            return new RestData
            {
                data = getLayerIndexes(layer)
            };
        }

        [HttpPost("{layer_id}/createIndex")]
        public RestBase createIndex([FromRoute] int layer_id, [FromBody] IDictionary<string, object>? @params)
        {
            var layer = getLayerWithTableAndColumn(layer_id);
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
                IEnumerable<InformationIndex> indexes = getLayerIndexes(layer);
                if (@params.ContainsKey("column_id") && @params.ContainsKey("index_type"))
                {
                    TableColumn? column = layer.table.columns.FirstOrDefault(x => x.id == int.Parse(@params["column_id"]?.ToString()));
                    if (column == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!"}
                            }
                        };
                    }
                    else if (indexes.Any(x => x.column_name.Equals(column.column_name) == false))
                    {
                        string? index_type = @params["index_type"]?.ToString();
                        string sql = $"CREATE INDEX idx_{index_type}_{layer.table.table_name}_{column.column_name} ON \"{layer.table.table_schema}\".\"{layer.table.table_name}\"";
                        switch (index_type)
                        {
                            case "btree":
                                sql += $" USING BTREE({column.column_name});";
                                break;
                            case "gin":
                                sql += $" USING GIN({column.column_name});";
                                break;
                            case "hash":
                                sql += $" USING HASH({column.column_name});";
                                break;
                            case "gist":
                                sql += $" USING GIST({column.column_name});";
                                break;
                            case "spgist":
                                sql += $" USING spgist({column.column_name});";
                                break;
                            default:
                                return new RestError(EnumErrorCode.ERROR)
                                {
                                    errors = new RestErrorDetail[]
                                    {
                                        new RestErrorDetail(-1, "Kiểu chỉ mục không hợp lệ, vui lòng kiểm tra lại!")
                                    }
                                };
                        }
                        using (var session = OpenSession())
                        {
                            session.Execute(sql);
                        }
                    }
                    else
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail(-1, "Trường chỉ mục đã tồn tại, vui lòng kiểm tra lại!")
                            }
                        };
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                }
            }
            return new RestBase("OK");
        }

        [HttpPost("{layer_id}/dropIndex")]
        public RestBase dropIndex([FromRoute] int layer_id, [FromBody] InformationIndex? @params)
        {
            var layer = getLayerWithTableAndColumn(layer_id);
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
                InformationIndex? index = getLayerIndexes(layer).FirstOrDefault(x => x.column_name.Equals(@params.column_name) && x.index_name.Equals(@params.index_name));
                if (index == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Chỉ mục không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    if (index.column_name != "geom"
                        && index.column_name != "search_content"
                        && index.index_name.Contains("pk") == false
                        && index.column_name != layer.table.identity_column?.column_name)
                    {
                        using (var session = OpenSession())
                        {
                            session.Execute($"DROP INDEX IF EXISTS {layer.table.table_schema}.{index.index_name};");
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
    }
}
