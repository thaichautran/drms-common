using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.ViewModels;
using System.Threading.Tasks;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Enums;
using StringHelper = VietGIS.Infrastructure.Helpers.StringHelper;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using OpenGIS.Module.Core.Models.DTO.Request;
using Aspose.Cells;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using NetTopologySuite;
using Npgsql;
using Microsoft.EntityFrameworkCore;
using NpgsqlTypes;
using Newtonsoft.Json;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.API.Controllers
{
    public partial class LayerController
    {
        [HttpPost("sync-layer")]
        public async Task<RestBase> SyncLayerAsync([FromQuery] string tableSchema = "")
        {
            var tables = getTablesAndColumns(tableSchema).Where(x => x.columns.Any(o => o.column_name == "geom")).OrderBy(x => x.name_vn);
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var layer in session.Find<Layer>())
                    {
                        int count = session.Count<TableInfo>(statement => statement.Where($"{nameof(TableInfo.id)}={layer.table_info_id}"));
                        if (count == 0)
                        {
                            uow.Delete(layer);
                            // Console.WriteLine(">> Deleted layer: " + layer.name_vn);
                        }
                    }
                }
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var table in tables)
                    {
                        try
                        {
                            int count = session.Count<Layer>(statement => statement.Where($"{nameof(Layer.table_info_id)}={table.id}"));
                            if (count == 0)
                            {
                                uow.Insert(new Layer
                                {
                                    name_vn = table.name_vn,
                                    table_info_id = table.id,
                                    permanent = true
                                });
                                // Console.WriteLine(">> New layer: " + table.name_vn);
                            }
                        }
                        catch (Exception e)
                        {
                            uow.Rollback();
                            // Console.WriteLine(e.Message);
                        }

                    }
                }
            }
            return new RestBase(EnumErrorCode.OK);
        }
        [HttpPost("copy-layer")]
        public async Task<RestBase> CopyLayerAsync([FromBody] CopyLayerParameter param)
        {
            if (param == null)
                return new RestError()
                {
                    errors = new RestErrorDetail[]
                    {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            using (var session = OpenSession())
            {
                string newTableName = StringHelper.Normalize(param.layer_name.ToLower(), "_");
                Layer layer = getLayerWithTableAndColumn(param.layer_id);
                if (layer == null)
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                TableInfo existTable = layer.table;
                var newTableInfo = existTable;
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (param.is_copy_data.HasValue && param.is_copy_data.Value)
                    {
                        uow.Connection.Execute(string.Format($@"CREATE TABLE {param.schema_name}.{newTableName} AS TABLE {existTable.table_schema}.{existTable.table_name}"));

                    }
                    else
                    {
                        uow.Connection.Execute(string.Format($@"CREATE TABLE {param.schema_name}.{newTableName} AS TABLE {existTable.table_schema}.{existTable.table_name} WITH NO DATA"));
                    }

                    uow.Connection.Execute($"CREATE TRIGGER update_search_content BEFORE INSERT OR UPDATE ON \"{param.schema_name}\".\"{newTableName}\" FOR EACH ROW EXECUTE PROCEDURE update_search_content();");
                    uow.Connection.Execute($"CREATE INDEX {newTableName}_geom_idx ON {param.schema_name}.{newTableName} USING GIST(geom);");

                    newTableInfo.id = 0;
                    newTableInfo.table_schema = param.schema_name;
                    newTableInfo.name_vn = param.layer_name;
                    newTableInfo.name_en = param.layer_name;
                    newTableInfo.table_name = newTableName;
                    uow.Connection.Insert<TableInfo>(newTableInfo);

                    if (newTableInfo != null)
                    {
                        layer.id = 0;
                        layer.table_info_id = newTableInfo.id;
                        layer.name_vn = param.layer_name;

                        _layerRepository.SaveOrUpdate(layer, uow);
                        // Add column
                        if (existTable.columns.Count() > 0)
                        {
                            foreach (var column in existTable.columns)
                            {
                                column.table_id = newTableInfo.id;
                                session.Insert(column);
                            }
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
        
        [HttpPost("createLayerByImportFile")]
        public async Task<RestBase> CreateLayerByImportAsync([FromForm] AddLayerByFileViewModel layerInfo)
        {
            using (var session = OpenSession())
            {
                if (layerInfo == null)
                {
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                }
                else
                {
                    // Lấy dữ liệu từ file import
                    IDictionary<string, List<IDictionary<string, object>>> data = new Dictionary<string, List<IDictionary<string, object>>>();
                    if (layerInfo.importType == "ShapeFile")
                    {
                        data = parseShp(layerInfo.file, layerInfo.geometry, layerInfo.layer_name);
                    }
                    else if (layerInfo.importType == "GeoJson")
                    {
                        data = parseGeojson(layerInfo.file, layerInfo.geometry, layerInfo.layer_name);
                    }
                    else if (layerInfo.importType == "GDB")
                    {
                        data = parseGDB(layerInfo.file);
                    }
                    else
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                            }
                        };
                    }

                    foreach (var table in data)
                    {
                        string tableName = StringHelper.Normalize(table.Key.ToLower(), "_");

                        var records = table.Value.ToList();
                        var tableColumns = records[0]; //Danh sách trường
                        var tableColumAlias = records[1]; //Danh sách Alias
                        if (string.IsNullOrWhiteSpace(layerInfo.geometry))
                        {
                            if (tableColumns != null && tableColumns.Count() > 0)
                            {
                                tableColumns.TryGetValue("geom", out object geometryType);
                                layerInfo.geometry = geometryType?.ToString();
                            }
                        }
                        var tableInfo = new TableInfo();

                        var existTableInfo = session.Find<TableInfo>(stm => stm
                            .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                            .WithParameters(new { schema_name = layerInfo.schema_name, table_name = tableName })
                        ).FirstOrDefault();
                        //Nếu bảng chưa tồn tại thì tạo bảng mới
                        if (existTableInfo == null)
                        {
                            using (var uow = new UnitOfWork(DbFactory, session))
                            {
                                uow.Connection.Execute(
                                $"CREATE TABLE IF NOT EXISTS {layerInfo.schema_name}.{tableName} (id SERIAL PRIMARY KEY, search_content tsvector) WITH(OIDS=FALSE)");
                                uow.Connection.Execute(
                                    $"SELECT AddGeometryColumn ('{layerInfo.schema_name}','{tableName}','geom',4326,'{layerInfo.geometry}',2);");

                                string sql = "ALTER TABLE \"" + layerInfo.schema_name + "\".\"" + tableName + "\" ADD COLUMN \"{0}\" {1}";

                                // uow.Connection.Execute(string.Format(sql, "is_delete", "boolean NOT NULL DEFAULT FALSE"));
                                uow.Connection.Execute(string.Format(sql, "created_at", "Timestamp Without Time Zone"));
                                uow.Connection.Execute(string.Format(sql, "updated_at", "Timestamp Without Time Zone"));
                                uow.Connection.Execute(string.Format(sql, "approved_at", "Timestamp Without Time Zone"));
                                uow.Connection.Execute(string.Format(sql, "commune_code", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "district_code", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "province_code", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "created_by", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "updated_by", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "approved_by", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "is_approved", "boolean NULL DEFAULT FALSE"));

                                uow.Connection.Execute($"CREATE TRIGGER update_search_content BEFORE INSERT OR UPDATE ON \"{layerInfo.schema_name}\".\"{tableName}\" FOR EACH ROW EXECUTE PROCEDURE update_search_content();");
                                uow.Connection.Execute($"CREATE INDEX {tableName}_geom_idx ON {layerInfo.schema_name}.{tableName} USING GIST(geom);");

                                uow.Connection.Insert<TableInfo>(new TableInfo()
                                {
                                    name_en = tableName,
                                    name_vn = tableName,
                                    table_schema = layerInfo.schema_name,
                                    table_name = tableName,
                                });

                            }

                            tableInfo = session.Find<TableInfo>(stm => stm
                                .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                                .WithParameters(new { schema_name = layerInfo.schema_name, table_name = tableName })
                            ).FirstOrDefault();
                            if (tableInfo == null) continue;

                            await syncColumns(tableInfo);

                            //Thêm lớp dữ liệu
                            if (string.IsNullOrWhiteSpace(layerInfo.layer_name))
                            {
                                layerInfo.layer_name = tableName;
                            }
                            var layer = new Layer();
                            layer.name_vn = layerInfo.layer_name;
                            layer.geometry = layerInfo.geometry;
                            layer.table_info_id = tableInfo.id;
                            layer.is_visible = true;
                            layer.layer_type = "vector";
                            layer.classify_column_id = 0;

                            using (var uow = new UnitOfWork(DbFactory, session))
                            {
                                _layerRepository.SaveOrUpdate(layer, uow);
                            }
                        }
                        else
                        {
                            // Nếu bảng đã tồn tại thì xóa hết dữ liệu cũ của bảng
                            using (var uow = new UnitOfWork(DbFactory, session))
                            {
                                uow.Connection.Execute($"DELETE FROM {existTableInfo.table_schema}.{existTableInfo.table_name}");
                            }
                        }
                        // Thêm trường dữ liệu mới
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            tableInfo = session.Find<TableInfo>(stm => stm.Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                                .WithParameters(new { schema_name = layerInfo.schema_name, table_name = tableName })
                                .Include<TableColumn>(join => join.LeftOuterJoin())
                            ).FirstOrDefault();
                            if (tableInfo != null && tableColumns != null && tableColumns.Count() > 0)
                            {
                                string sql = "ALTER TABLE \"" + layerInfo.schema_name + "\".\"" + tableName + "\" ADD COLUMN \"{0}\" {1}";
                                int thutu = 1;
                                foreach (var column in tableColumns)
                                {
                                    var alias = column.Key;
                                    var columnAlias = tableColumAlias.Where(x => x.Key == column.Key).FirstOrDefault();
                                    if (columnAlias.Value != null && !string.IsNullOrWhiteSpace(columnAlias.Value.ToString()))
                                    {
                                        alias = columnAlias.Value.ToString();
                                    }
                                    var existColumn = session.Find<TableColumn>(stm => stm
                                        .Where($"{Sql.Entity<TableColumn>(x => x.column_name):TC} = @column_name AND {Sql.Entity<TableColumn>(x => x.table_id):TC} = @table_id")
                                        .WithParameters(new { column_name = column.Key, table_id = tableInfo.id })
                                    ).FirstOrDefault();
                                    if (existColumn == null)
                                    {
                                        var tableColumn = new TableColumn()
                                        {
                                            column_name = column.Key,
                                            name_en = column.Key,
                                            name_vn = alias,
                                            is_identity = false,
                                            is_nullable = true,
                                            require = false,
                                            permanent = false,
                                            visible = true,
                                            table_id = tableInfo.id,
                                            order = thutu++
                                        };

                                        var values = column.Value.ToString().Split("_");
                                        string data_type = values[0];
                                        int character_max_length = 255;
                                        tableColumn.data_type = data_type;
                                        if (data_type == EnumPgDataType.BigInt)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "BIGINT"));
                                        }
                                        else if (data_type == EnumPgDataType.SmallInt)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "SMALLINT"));
                                        }
                                        else if (data_type == EnumPgDataType.Integer)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "INT4"));
                                        }
                                        else if (data_type == EnumPgDataType.DateTime)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "Timestamp Without Time Zone"));
                                        }
                                        else if (data_type == EnumPgDataType.Double)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "FLOAT8"));
                                        }
                                        else if (data_type.Contains(EnumPgDataType.String))
                                        {
                                            if (values.Count() == 2) character_max_length = int.Parse(values[1]);
                                            tableColumn.character_max_length = character_max_length;
                                            uow.Connection.Execute(string.Format(sql, column.Key, $"VARCHAR({character_max_length})"));
                                        }
                                        if (column.Key.Contains("shape")) { tableColumn.visible = false; }
                                        session.Insert(tableColumn);
                                    }
                                    else
                                    {
                                        existColumn.order = thutu++;
                                        session.Update(existColumn);
                                    }
                                }
                            }
                        }
                        //Xóa các trường cũ của bảng không tồn tại trong dữ liệu mới  
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            tableInfo = session.Find<TableInfo>(stm => stm
                                .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                                .WithParameters(new { schema_name = layerInfo.schema_name, table_name = tableName })
                                .Include<TableColumn>(join => join.LeftOuterJoin())
                            ).FirstOrDefault();

                            if (tableInfo != null && tableInfo.columns.Count() > 0 && tableColumns != null)
                            {
                                var deleteColumns = tableInfo.columns.Where(x => !tableColumns.Keys.Contains(x.column_name) && !_defaultFields.Contains(x.column_name)).ToList();
                                foreach (var column in deleteColumns)
                                {
                                    string sql = @$"ALTER TABLE {tableInfo.table_schema}.{tableInfo.table_name} DROP COLUMN {column.column_name} CASCADE;";
                                    uow.Connection.Execute(sql);
                                    uow.Delete(column);
                                }
                            }
                        }
                        // Import data
                        if (tableInfo == null) continue;
                        TableInfo? tb = session.Find<TableInfo>(stm => stm
                            .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = @id")
                            .Include<TableColumn>()
                            .WithParameters(new { id = tableInfo.id })
                        ).FirstOrDefault();
                        TableColumn? keyColumn = tb.key_column ?? tb.identity_column;
                        IEnumerable<TableColumn> selectedColumns = tb.columns.Where(x => x.column_name != "updated_at" && x.column_name != "created_at" && !x.is_identity);

                        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                        var wktReader = new WKTReader(geometryFactory);

                        List<string> paramMultiInsert = new List<string>();
                        for (int i = 2; i < records.Count(); i++)
                        {
                            var record = records[i];
                            List<string> paramInsert = new List<string>();
                            foreach (var column in selectedColumns)
                            {
                                var key = record.Keys.Where(x => column.column_name.Contains(x)).FirstOrDefault();
                                if (key != null && record[key] != null && !String.IsNullOrWhiteSpace(record[key].ToString()))
                                {
                                    switch (column.data_type)
                                    {
                                        case EnumPgDataType.BigInt:
                                        case EnumPgDataType.SmallInt:
                                        case EnumPgDataType.Integer:
                                            paramInsert.Add(record[key].ToString());
                                            break;
                                        case EnumPgDataType.Double:
                                            paramInsert.Add(record[key].ToString());
                                            break;
                                        case EnumPgDataType.String:
                                        case EnumPgDataType.Text:
                                            paramInsert.Add($@"'{record[key].ToString()}'");
                                            break;
                                        case EnumPgDataType.Date:
                                        case EnumPgDataType.Time:
                                        case EnumPgDataType.DateTime:
                                        case EnumPgDataType.DateTimeTZ:
                                            paramInsert.Add($"'{((DateTime)record[key]).ToString("MM-dd-yyyy")}'");
                                            break;
                                        case EnumPgDataType.Geometry:
                                            GeoJsonReader reader = new GeoJsonReader();
                                            Geometry? geometry;
                                            if (record["geom"] is Geometry)
                                            {
                                                geometry = record["geom"] as Geometry;
                                            }
                                            else
                                            {
                                                geometry = reader.Read<Geometry>(record["geom"].ToString());
                                            }
                                            if (geometry != null && !geometry.IsEmpty)
                                            {
                                                GeoJsonWriter writer = new GeoJsonWriter();
                                                string gson = writer.Write(geometry);
                                                if (geometry.GeometryType == layerInfo.geometry)
                                                {
                                                    paramInsert.Add($@"ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                                }
                                                else
                                                {
                                                    if ((geometry.GeometryType == EnumGeometryType.Point && layerInfo.geometry == EnumGeometryType.MultiPoint)
                                                        || (geometry.GeometryType == EnumGeometryType.LineString && layerInfo.geometry == EnumGeometryType.MultiLineString)
                                                        || (geometry.GeometryType == EnumGeometryType.Polygon && layerInfo.geometry == EnumGeometryType.MultiPolygon))
                                                    {
                                                        paramInsert.Add($@"ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)");
                                                    }
                                                    else
                                                    {
                                                        paramInsert.Add("NULL");
                                                    }
                                                }
                                            }
                                            else
                                            {
                                                paramInsert.Add("NULL");
                                            }
                                            break;
                                        default:
                                            paramInsert.Add(record[key].ToString());
                                            break;
                                    }
                                }
                                else
                                {
                                    paramInsert.Add("NULL");
                                }
                            }
                            paramMultiInsert.Add("(" + string.Join(", ", paramInsert) + " )");

                        }

                        if (selectedColumns.Count() > 0 && paramMultiInsert.Count() > 0)
                        {
                            string sqlInsert = $"INSERT INTO {tableInfo.table_schema}.{tableInfo.table_name}({string.Join(",", selectedColumns.Select(x => x.column_name).ToList())}) VALUES {string.Join(",", paramMultiInsert)}";
                            // Console.WriteLine(sqlInsert);
                            using (var uow = new UnitOfWork(DbFactory, session))
                            {
                                try
                                {
                                    await uow.Connection.ExecuteAsync($"ALTER TABLE {tableInfo.table_schema}.{tableInfo.table_name} DISABLE TRIGGER ALL;");
                                    await uow.Connection.ExecuteAsync(sqlInsert);
                                }
                                catch (Exception e)
                                {
                                    return new RestError(-1, $"{tableInfo.table_name} insert data error." + e.Message);
                                }
                                finally
                                {
                                    //Chạy lại trường hành chính mặc định theo mã tỉnh mã huyện, mã xã
                                    await runQueryRegion(tb, uow);
                                    await uow.Connection.ExecuteAsync($"ALTER TABLE {tableInfo.table_schema}.{tableInfo.table_name} ENABLE TRIGGER ALL;");
                                }
                            }
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
        [HttpPost("createSchemaByImportFile")]
        [DisableRequestSizeLimit]
        public async Task<RestBase> CreateOrUpdateSchemaByImportFileAsync([FromForm] AddSchemaByFileViewModel schemaInfo)
        {
            using (var session = OpenSession())
            {
                if (schemaInfo == null || schemaInfo.file == null || string.IsNullOrWhiteSpace(schemaInfo.schema_name))
                {
                    return new RestError(400, "Vui lòng kiểm tra lại tham số!");
                }
                else
                {
                    // Lấy dữ liệu shapefile
                    IDictionary<string, List<IDictionary<string, object>>> data = new Dictionary<string, List<IDictionary<string, object>>>();
                    if (schemaInfo.importType == "ShapeFile")
                    {

                    }
                    else if (schemaInfo.importType == "GeoJson")
                    {

                    }
                    else if (schemaInfo.importType == "GDB")
                    {
                        data = parseGDB(schemaInfo.file);
                    }
                    else
                    {
                        return new RestError(500, "Đã xảy ra lỗi, vui lòng thử lại!");
                    }
                    // Tạo schema
                    string schema_name = StringHelper.Normalize(schemaInfo.schema_name.ToLower(), "_");
                    TableSchema tableSchema = new TableSchema
                    {
                        schema_name = schema_name,
                        description = schemaInfo.description ?? schema_name
                    };
                    var existSchema = session.Find<TableSchema>(stm => stm.Where($"{Sql.Entity<TableSchema>(x => x.schema_name):TC} = @schema_name")
                        .WithParameters(new { schema_name = tableSchema.schema_name })).FirstOrDefault();
                    if (existSchema == null)
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            // Console.WriteLine($">> Create schema: {tableSchema.schema_name}");
                            string sql = $"SELECT count(1) FROM information_schema.schemata WHERE schema_name = @schema_name";
                            int count = session.Query<int>(sql, new { schema_name = tableSchema.schema_name }).FirstOrDefault();
                            if (count == 0)
                            {
                                sql = @$"CREATE SCHEMA IF NOT EXISTS {tableSchema.schema_name}";
                                session.Execute(sql);
                                uow.Insert(tableSchema);
                            }
                        }
                    }
                    var wktReader = new WKTReader(new NtsGeometryServices(new PrecisionModel(), 4326));
                    foreach (var table in data)
                    {
                        var tableName = StringHelper.Normalize(table.Key.ToLower(), "_");

                        var records = table.Value.ToList();
                        var tableColumns = records[0];
                        var tableColumnsAlias = records[1];
                        string? layerGeometry = string.Empty;
                        if (tableColumns != null && tableColumns.Count() > 0)
                        {
                            tableColumns.TryGetValue("geom", out object? geometryType);
                            layerGeometry = geometryType?.ToString();
                            if (layerGeometry == "Point25D" || layerGeometry == "PointZM")
                            {
                                layerGeometry = "Point";
                            }
                        }

                        var existTableInfo = session.Find<TableInfo>(stm => stm
                            .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                            .WithParameters(new { schema_name = tableSchema.schema_name, table_name = tableName })
                        ).FirstOrDefault();

                        var tableInfo = new TableInfo();

                        if (existTableInfo == null)
                        {
                            using (var uow = new UnitOfWork(DbFactory, session))
                            {
                                uow.Connection.Execute(
                                @$"CREATE TABLE IF NOT EXISTS {tableSchema.schema_name}.{tableName} (id SERIAL PRIMARY KEY, search_content tsvector) WITH(OIDS=FALSE)");
                                if (!string.IsNullOrEmpty(layerGeometry) && layerGeometry.ToLower() != "none")
                                {
                                    uow.Connection.Execute(
                                   $"SELECT AddGeometryColumn ('{tableSchema.schema_name}','{tableName}','geom',4326,'{layerGeometry}',2);");

                                    uow.Connection.Execute($"CREATE INDEX {tableName}_geom_idx ON {tableSchema.schema_name}.{tableName} USING GIST(geom);");
                                }
                                string sql = "ALTER TABLE \"" + tableSchema.schema_name + "\".\"" + tableName + "\" ADD COLUMN \"{0}\" {1}";

                                // uow.Connection.Execute(string.Format(sql, "is_delete", "boolean NOT NULL DEFAULT FALSE"));
                                uow.Connection.Execute(string.Format(sql, "created_at", "Timestamp Without Time Zone"));
                                uow.Connection.Execute(string.Format(sql, "updated_at", "Timestamp Without Time Zone"));
                                uow.Connection.Execute(string.Format(sql, "commune_code", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "district_code", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "province_code", "VARCHAR"));
                                uow.Connection.Execute(@$"CREATE TRIGGER update_search_content BEFORE INSERT OR UPDATE ON {tableSchema.schema_name}.{tableName} FOR EACH ROW EXECUTE PROCEDURE update_search_content();");

                                uow.Connection.Insert<TableInfo>(new TableInfo()
                                {
                                    name_en = tableName,
                                    name_vn = tableName,
                                    table_schema = tableSchema.schema_name,
                                    table_name = tableName,
                                });
                            }

                            tableInfo = session.Find<TableInfo>(stm => stm
                                .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                                .WithParameters(new { schema_name = tableSchema.schema_name, table_name = tableName })
                            ).FirstOrDefault();
                            if (tableInfo == null)
                            {
                                continue;
                            };
                            // Sync tableColumn
                            await syncColumns(tableInfo);
                            // Thêm lớp dữ liệu
                            if (!string.IsNullOrEmpty(layerGeometry) && layerGeometry.ToLower() != "none")
                            {
                                // Console.WriteLine($">> Create layer: {tableName}");
                                var layer = new Layer();
                                layer.name_vn = tableName;
                                layer.geometry = layerGeometry;
                                layer.table_info_id = tableInfo.id;
                                layer.is_visible = true;
                                layer.layer_type = "vector";
                                layer.classify_column_id = 0;

                                using (var uow = new UnitOfWork(DbFactory, session))
                                {
                                    _layerRepository.SaveOrUpdate(layer, uow);
                                }
                            }
                        }
                        else
                        {
                            if (schemaInfo.is_clear_data.HasValue && schemaInfo.is_clear_data.Value == true)
                            {
                                using (var uow = new UnitOfWork(DbFactory, session))
                                {
                                    // Delete data
                                    uow.Connection.Execute($"TRUNCATE \"{existTableInfo.table_schema}\".\"{existTableInfo.table_name}\";");
                                }
                            }
                        }
                        tableInfo = session.Find<TableInfo>(stm => stm
                            .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                            .WithParameters(new { schema_name = tableSchema.schema_name, table_name = tableName })
                            .Include<TableColumn>(join => join.LeftOuterJoin())
                        ).FirstOrDefault();
                        if (tableInfo == null)
                        {
                            return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                        }
                        // Add column
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            if (tableColumns != null && tableColumns.Count() > 0)
                            {
                                string sql = "ALTER TABLE \"" + tableSchema.schema_name + "\".\"" + tableName + "\" ADD COLUMN \"{0}\" {1}";
                                int thutu = 1;
                                foreach (var column in tableColumns)
                                {
                                    if (column.Key.ToLower() == "geom") continue;
                                    var alias = column.Key;
                                    var columnAlias = tableColumnsAlias.Where(x => x.Key == column.Key).FirstOrDefault();
                                    if (columnAlias.Value != null && !string.IsNullOrWhiteSpace(columnAlias.Value.ToString()))
                                    {
                                        alias = columnAlias.Value.ToString();
                                    }
                                    // Console.WriteLine($">> Create column: {column.Key}");
                                    var existColumn = session.Find<TableColumn>(stm => stm
                                        .Where($"{Sql.Entity<TableColumn>(x => x.column_name):TC} = @column_name AND {Sql.Entity<TableColumn>(x => x.table_id):TC} = @table_id")
                                        .WithParameters(new { column_name = column.Key, table_id = tableInfo.id })
                                    ).FirstOrDefault();
                                    if (existColumn == null)
                                    {
                                        var tableColumn = new TableColumn()
                                        {
                                            column_name = column.Key,
                                            name_en = column.Key,
                                            name_vn = alias,
                                            is_identity = false,
                                            is_nullable = true,
                                            require = false,
                                            permanent = false,
                                            visible = true,
                                            table_id = tableInfo.id,
                                            order = thutu++
                                        };
                                        var values = column.Value.ToString().Split("_");
                                        tableColumn.data_type = values[0];
                                        if (tableColumn.data_type == EnumPgDataType.BigInt)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "BIGINT"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.SmallInt)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "SMALLINT"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.Integer)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "INTEGER"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.DateTime)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "Timestamp Without Time Zone"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.Double)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "DOUBLE PRECISION"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.String)
                                        {
                                            int character_max_length = 255;
                                            if (values.Count() == 2)
                                            {
                                                character_max_length = int.Parse(values[1]);
                                            }
                                            if (character_max_length <= 0)
                                            {
                                                character_max_length = 1000;
                                            }
                                            tableColumn.character_max_length = character_max_length;
                                            uow.Connection.Execute(string.Format(sql, column.Key, $"CHARACTER VARYING ({character_max_length})"));
                                        }
                                        if (column.Key.Contains("shape")) { tableColumn.visible = false; }

                                        session.Insert(tableColumn);
                                    }
                                    else
                                    {
                                        existColumn.order = thutu++;
                                        if (schemaInfo.is_replace_alias.HasValue && schemaInfo.is_replace_alias.Value)
                                        {
                                            existColumn.name_vn = alias;
                                        }
                                        session.Update(existColumn);
                                    }
                                }
                            }
                            // Delete column
                            if (tableInfo != null && tableInfo.columns.Count() > 0 && tableColumns != null)
                            {
                                var deleteColumns = tableInfo.columns.Where(x => !tableColumns.Keys.Contains(x.column_name) && !_defaultFields.Contains(x.column_name)).ToList();
                                foreach (var column in deleteColumns)
                                {
                                    string sql = @$"ALTER TABLE {tableInfo.table_schema}.{tableInfo.table_name} DROP COLUMN {column.column_name} CASCADE;";
                                    uow.Connection.Execute(sql);
                                    uow.Delete(column);
                                }
                            }
                        }
                        // Import data
                        if (tableInfo == null) continue;
                        var tb = session.Find<TableInfo>(stm => stm
                            .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = @id")
                            .Include<TableColumn>()
                            .WithParameters(new { id = tableInfo.id })
                        ).FirstOrDefault();
                        if (tb == null) continue;
                        TableColumn? keyColumn = tb.key_column ?? tb.identity_column;
                        IEnumerable<TableColumn> columns = tb.columns.Where(x => x.column_name != "search_content" && x.column_name != "updated_at"
                            && x.column_name != "created_at" && !x.is_identity);
                        List<string> paramMultiInsert = new List<string>();
                        for (int i = 2; i < records.Count(); i++)
                        {
                            var record = records[i];
                            //Check action is INSERT or UPDATE
                            var sql_info = string.Empty;
                            var fieldSql = new List<string>();
                            var valueSql = new List<string>();
                            //IDictionary<string, object> paramInsert = new Dictionary<string, object>();
                            List<string> paramInsert = new List<string>();
                            List<string> searchContent = new List<string>();
                            string valueInsert = String.Empty;
                            foreach (var column in columns)
                            {
                                var key = record.Keys.Where(x => x == column.column_name).FirstOrDefault();
                                if (key != null && record[key] != null && String.IsNullOrWhiteSpace(record[key].ToString()) == false)
                                {
                                    switch (column.data_type)
                                    {
                                        case EnumPgDataType.BigInt:
                                        case EnumPgDataType.SmallInt:
                                        case EnumPgDataType.Integer:
                                            if (int.TryParse(record[key]?.ToString(), out int intValue))
                                            {
                                                paramInsert.Add(intValue.ToString());
                                            }
                                            else
                                            {
                                                paramInsert.Add("0");
                                            }
                                            break;
                                        case EnumPgDataType.Double:
                                            if (record[key]?.ToString() != "NaN" && double.TryParse(record[key]?.ToString(), out double dblValue))
                                            {
                                                if (dblValue != Double.NaN)
                                                {
                                                    paramInsert.Add(dblValue.ToString());
                                                }
                                                else
                                                {
                                                    paramInsert.Add("0.0");
                                                }
                                            }
                                            else
                                            {
                                                paramInsert.Add("0.0");
                                            }
                                            break;
                                        case EnumPgDataType.String:
                                        case EnumPgDataType.Text:
                                            paramInsert.Add($@"$${record[key]}$$");
                                            if (string.IsNullOrWhiteSpace(record[key]?.ToString()) == false)
                                            {
                                                searchContent.Add(StringHelper.RemoveVietNameseSign(record[key]?.ToString()).ToLower());
                                            }
                                            break;
                                        case EnumPgDataType.Date:
                                        case EnumPgDataType.Time:
                                        case EnumPgDataType.DateTime:
                                        case EnumPgDataType.DateTimeTZ:
                                            paramInsert.Add($"'{((DateTime)record[key]).ToString("MM-dd-yyyy")}'");
                                            break;
                                        case EnumPgDataType.Geometry:
                                            GeoJsonReader reader = new GeoJsonReader();
                                            Geometry? geometry;
                                            if (record["geom"] is Geometry)
                                            {
                                                geometry = record["geom"] as Geometry;
                                                if (geometry != null && !geometry.IsEmpty)
                                                {
                                                    GeoJsonWriter writer = new GeoJsonWriter();
                                                    string gson = writer.Write(geometry);
                                                    if (geometry.GeometryType == layerGeometry)
                                                    {
                                                        paramInsert.Add($@"ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                                    }
                                                    else
                                                    {
                                                        if ((geometry.GeometryType == EnumGeometryType.Point && layerGeometry == EnumGeometryType.MultiPoint)
                                                            || (geometry.GeometryType == EnumGeometryType.LineString && layerGeometry == EnumGeometryType.MultiLineString)
                                                            || (geometry.GeometryType == EnumGeometryType.Polygon && layerGeometry == EnumGeometryType.MultiPolygon))
                                                        {
                                                            paramInsert.Add($@"ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)");
                                                        }
                                                        else
                                                        {
                                                            paramInsert.Add("NULL");
                                                        }
                                                    }
                                                }
                                                else
                                                {
                                                    paramInsert.Add("NULL");
                                                }
                                            }
                                            else if (record["geom"] is string)
                                            {
                                                paramInsert.Add($@"ST_SetSRID(ST_GeomFromText('{record["geom"]}'), 4326)");
                                            }
                                            else
                                            {
                                                paramInsert.Add("NULL");
                                            }
                                            break;
                                        default:
                                            paramInsert.Add(record[key].ToString());
                                            break;
                                    }
                                }
                                else
                                {
                                    paramInsert.Add("NULL");
                                }
                            }
                            if (tb.columns.Any(x => x.column_name == "search_content"))
                            {
                                paramInsert.Add(searchContent.Count > 0 ? $"to_tsvector($${string.Join(" ", searchContent)}$$)" : "NULL");
                            }
                            paramMultiInsert.Add("(" + string.Join(", ", paramInsert) + " )");
                        }
                        if (columns.Count() > 0 && paramMultiInsert.Count() > 0)
                        {
                            string sqlInsert = $"INSERT INTO \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ({string.Join(",", columns.Select(x => x.column_name).ToList())}) VALUES {string.Join(",", paramMultiInsert)}";
                            if (tb.columns.Any(x => x.column_name == "search_content"))
                            {
                                sqlInsert = $"INSERT INTO \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ({string.Join(",", columns.Select(x => x.column_name).ToList())}, search_content) VALUES {string.Join(",", paramMultiInsert)}";
                            }
                            await session.ExecuteAsync($"ALTER TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" DISABLE TRIGGER ALL;");

                            using (var uow = new UnitOfWork(DbFactory, session))
                            {
                                try
                                {
                                    _logger.LogInformation($"Do insert: {tb.table_name}");
                                    // _logger.LogInformation(sqlInsert);
                                    await uow.Connection.ExecuteAsync(sqlInsert);
                                    //Chạy lại trường hành chính mặc định theo mã tỉnh mã huyện, mã xã
                                    await runQueryRegion(tb, uow);
                                }
                                catch (Exception e)
                                {
                                    return new RestError(e);
                                }
                                finally
                                {
                                }
                            }

                            await session.ExecuteAsync($"ALTER TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ENABLE TRIGGER ALL;");
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
        [HttpPost("createSchemaByImportFileCopy")]
        [DisableRequestSizeLimit]
        public async Task<RestBase> CreateOrUpdateSchemaByImportFileAsyncV2([FromForm] AddSchemaByFileViewModel schemaInfo)
        {
            using (var session = OpenSession())
            {
                if (schemaInfo == null || schemaInfo.files == null || schemaInfo.files.Count() == 0 || string.IsNullOrWhiteSpace(schemaInfo.schema_name))
                {
                    return new RestError(400, "Vui lòng kiểm tra lại tham số!");
                }
                else
                {
                    IDictionary<string, IDictionary<string, IEnumerable<IDictionary<string, object>>>> listImports = new Dictionary<string, IDictionary<string, IEnumerable<IDictionary<string, object>>>>();
                    List<int> clearedTables = new List<int>();
                    // Lấy dữ liệu
                    IDictionary<string, List<IDictionary<string, object>>> data = new Dictionary<string, List<IDictionary<string, object>>>();
                    if (schemaInfo.importType == "GDB")
                    {
                        foreach (var file in schemaInfo.files)
                        {
                            var parsed = parseGDB(file);
                            foreach (var item in parsed)
                            {
                                if (data.ContainsKey(item.Key) == false)
                                {
                                    data.Add(item.Key, item.Value);
                                }
                                else
                                {
                                    data[item.Key].AddRange(item.Value.Skip(2));
                                }
                            }
                        }
                    }
                    else
                    {
                        return new RestError(500, "Đã xảy ra lỗi, vui lòng thử lại!");
                    }
                    // Tạo schema
                    string schema_name = StringHelper.Normalize(schemaInfo.schema_name.ToLower(), "_");
                    TableSchema tableSchema = new TableSchema
                    {
                        schema_name = schema_name,
                        description = schemaInfo.description ?? schema_name
                    };
                    var existSchema = session.Find<TableSchema>(stm => stm.Where($"{Sql.Entity<TableSchema>(x => x.schema_name):TC} = @schema_name")
                        .WithParameters(new { schema_name = tableSchema.schema_name })).FirstOrDefault();
                    if (existSchema == null)
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            // Console.WriteLine($">> Create schema: {tableSchema.schema_name}");
                            string sql = $"SELECT count(1) FROM information_schema.schemata WHERE schema_name = @schema_name";
                            int count = session.Query<int>(sql, new { schema_name = tableSchema.schema_name }).FirstOrDefault();
                            if (count == 0)
                            {
                                sql = @$"CREATE SCHEMA IF NOT EXISTS {tableSchema.schema_name}";
                                session.Execute(sql);
                                uow.Insert(tableSchema);
                            }
                        }
                    }
                    var wktReader = new WKTReader(new NtsGeometryServices(new PrecisionModel(), 4326));
                    foreach (var table in data)
                    {
                        var tableName = StringHelper.Normalize(table.Key.ToLower(), "_");

                        var records = table.Value.ToList();
                        var tableColumns = records[0];
                        var tableColumnsAlias = records[1];
                        string? layerGeometry = string.Empty;
                        if (tableColumns != null && tableColumns.Count() > 0)
                        {
                            tableColumns.TryGetValue("geom", out object? geometryType);
                            layerGeometry = geometryType?.ToString();
                            if (layerGeometry == "Point25D" || layerGeometry == "PointZM")
                            {
                                layerGeometry = "Point";
                            }
                        }

                        var existTableInfo = session.Find<TableInfo>(stm => stm
                            .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                            .WithParameters(new { schema_name = tableSchema.schema_name, table_name = tableName })
                        ).FirstOrDefault();

                        var tableInfo = new TableInfo();

                        if (existTableInfo == null)
                        {
                            using (var uow = new UnitOfWork(DbFactory, session))
                            {
                                uow.Connection.Execute(
                                @$"CREATE TABLE IF NOT EXISTS {tableSchema.schema_name}.{tableName} (id SERIAL PRIMARY KEY, search_content tsvector) WITH(OIDS=FALSE)");
                                if (!string.IsNullOrEmpty(layerGeometry) && layerGeometry.ToLower() != "none")
                                {
                                    uow.Connection.Execute(
                                   $"SELECT AddGeometryColumn ('{tableSchema.schema_name}','{tableName}','geom',4326,'{layerGeometry}',2);");

                                    uow.Connection.Execute($"CREATE INDEX {tableName}_geom_idx ON {tableSchema.schema_name}.{tableName} USING GIST(geom);");
                                }
                                string sql = "ALTER TABLE \"" + tableSchema.schema_name + "\".\"" + tableName + "\" ADD COLUMN \"{0}\" {1}";

                                // uow.Connection.Execute(string.Format(sql, "is_delete", "boolean NOT NULL DEFAULT FALSE"));
                                uow.Connection.Execute(string.Format(sql, "created_at", "Timestamp Without Time Zone"));
                                uow.Connection.Execute(string.Format(sql, "updated_at", "Timestamp Without Time Zone"));
                                uow.Connection.Execute(string.Format(sql, "commune_code", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "district_code", "VARCHAR"));
                                uow.Connection.Execute(string.Format(sql, "province_code", "VARCHAR"));
                                uow.Connection.Execute($"CREATE TRIGGER trigger_update_search_content BEFORE INSERT OR UPDATE ON \"{tableSchema.schema_name}\".\"{tableName}\" FOR EACH ROW EXECUTE PROCEDURE update_search_content();");

                                uow.Connection.Insert<TableInfo>(new TableInfo()
                                {
                                    name_en = tableName,
                                    name_vn = tableName,
                                    table_schema = tableSchema.schema_name,
                                    table_name = tableName,
                                });
                            }

                            tableInfo = session.Find<TableInfo>(stm => stm
                                .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                                .WithParameters(new { schema_name = tableSchema.schema_name, table_name = tableName })
                            ).FirstOrDefault();
                            if (tableInfo == null)
                            {
                                continue;
                            };
                            // Sync tableColumn
                            await syncColumns(tableInfo);
                            // Thêm lớp dữ liệu
                            if (!string.IsNullOrEmpty(layerGeometry) && layerGeometry.ToLower() != "none")
                            {
                                // Console.WriteLine($">> Create layer: {tableName}");
                                var layer = new Layer();
                                layer.name_vn = tableName;
                                layer.geometry = layerGeometry;
                                layer.table_info_id = tableInfo.id;
                                layer.is_visible = true;
                                layer.layer_type = "vector";
                                layer.classify_column_id = 0;

                                using (var uow = new UnitOfWork(DbFactory, session))
                                {
                                    _layerRepository.SaveOrUpdate(layer, uow);
                                }
                            }
                        }
                        else
                        {
                            if (schemaInfo.is_clear_data.HasValue && schemaInfo.is_clear_data.Value == true && clearedTables.Contains(existTableInfo.id) == false)
                            {
                                using (var uow = new UnitOfWork(DbFactory, session))
                                {
                                    // Delete data
                                    uow.Connection.Execute($"TRUNCATE \"{existTableInfo.table_schema}\".\"{existTableInfo.table_name}\";");

                                    clearedTables.Add(existTableInfo.id);
                                }
                            }
                        }
                        tableInfo = session.Find<TableInfo>(stm => stm
                            .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
                            .WithParameters(new { schema_name = tableSchema.schema_name, table_name = tableName })
                            .Include<TableColumn>(join => join.LeftOuterJoin())
                        ).FirstOrDefault();
                        if (tableInfo == null)
                        {
                            return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                        }
                        // Add column
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            if (tableColumns != null && tableColumns.Count() > 0)
                            {
                                string sql = "ALTER TABLE \"" + tableSchema.schema_name + "\".\"" + tableName + "\" ADD COLUMN \"{0}\" {1}";
                                int thutu = 1;
                                foreach (var column in tableColumns)
                                {
                                    if (column.Key.ToLower() == "geom") continue;
                                    var alias = column.Key;
                                    var columnAlias = tableColumnsAlias.Where(x => x.Key == column.Key).FirstOrDefault();
                                    if (columnAlias.Value != null && !string.IsNullOrWhiteSpace(columnAlias.Value.ToString()))
                                    {
                                        alias = columnAlias.Value.ToString();
                                    }
                                    // Console.WriteLine($">> Create column: {column.Key}");
                                    var existColumn = session.Find<TableColumn>(stm => stm
                                        .Where($"{Sql.Entity<TableColumn>(x => x.column_name):TC} = @column_name AND {Sql.Entity<TableColumn>(x => x.table_id):TC} = @table_id")
                                        .WithParameters(new { column_name = column.Key, table_id = tableInfo.id })
                                    ).FirstOrDefault();
                                    if (existColumn == null)
                                    {
                                        var tableColumn = new TableColumn()
                                        {
                                            column_name = column.Key,
                                            name_en = column.Key,
                                            name_vn = alias,
                                            is_identity = false,
                                            is_nullable = true,
                                            require = false,
                                            permanent = false,
                                            visible = true,
                                            table_id = tableInfo.id,
                                            order = thutu++
                                        };
                                        var values = column.Value.ToString().Split("_");
                                        tableColumn.data_type = values[0];
                                        if (tableColumn.data_type == EnumPgDataType.BigInt)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "BIGINT"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.SmallInt)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "SMALLINT"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.Integer)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "INTEGER"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.DateTime)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "Timestamp Without Time Zone"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.Double)
                                        {
                                            uow.Connection.Execute(string.Format(sql, column.Key, "DOUBLE PRECISION"));
                                        }
                                        else if (tableColumn.data_type == EnumPgDataType.String)
                                        {
                                            int character_max_length = 255;
                                            if (values.Count() == 2)
                                            {
                                                character_max_length = int.Parse(values[1]);
                                            }
                                            if (character_max_length <= 0)
                                            {
                                                character_max_length = 1000;
                                            }
                                            tableColumn.character_max_length = character_max_length;
                                            uow.Connection.Execute(string.Format(sql, column.Key, $"CHARACTER VARYING ({character_max_length})"));
                                        }
                                        if (column.Key.Contains("shape")) { tableColumn.visible = false; }

                                        session.Insert(tableColumn);
                                    }
                                    else
                                    {
                                        existColumn.order = thutu++;
                                        if (schemaInfo.is_replace_alias.HasValue && schemaInfo.is_replace_alias.Value)
                                        {
                                            existColumn.name_vn = alias;
                                        }
                                        session.Update(existColumn);
                                    }
                                }
                            }
                            // Delete column
                            if (tableInfo != null && tableInfo.columns.Count() > 0 && tableColumns != null)
                            {
                                var deleteColumns = tableInfo.columns.Where(x => !tableColumns.Keys.Contains(x.column_name) && !_defaultFields.Contains(x.column_name)).ToList();
                                foreach (var column in deleteColumns)
                                {
                                    string sql = @$"ALTER TABLE {tableInfo.table_schema}.{tableInfo.table_name} DROP COLUMN {column.column_name} CASCADE;";
                                    uow.Connection.Execute(sql);
                                    uow.Delete(column);
                                }
                            }
                        }
                        // Import data
                        if (tableInfo == null) continue;
                        var tb = session.Find<TableInfo>(stm => stm
                            .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = @id")
                            .Include<TableColumn>()
                            .WithParameters(new { id = tableInfo.id })
                        ).FirstOrDefault();
                        if (tb == null) continue;
                        TableColumn? keyColumn = tb.key_column ?? tb.identity_column;
                        IEnumerable<TableColumn> columns = tb.columns.Where(x => x.column_name != "search_content" && x.column_name != "updated_at"
                            && x.column_name != "created_at" && !x.is_identity);
                        _logger.LogInformation($"Do copy: {tb.table_name}");
                        var watcher = System.Diagnostics.Stopwatch.StartNew();
                        if (records.Count() > 2)
                        {
                            await session.ExecuteAsync($"ALTER TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" DISABLE TRIGGER ALL;");

                            List<object> listImportedKey = new List<object>();
                            string sqlCopy = $"COPY \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ({string.Join(",", columns.Select(x => x.column_name).ToList())}) FROM STDIN (FORMAT BINARY)";
                            if (tb.columns.Any(o => o.column_name == "search_content"))
                            {
                                session.Connection.Execute($"ALTER TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ADD COLUMN IF NOT EXISTS search_content_en varchar;");
                                sqlCopy = $"COPY \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ({string.Join(",", columns.Select(x => x.column_name).ToList())}, search_content_en) FROM STDIN (FORMAT BINARY)";
                            }
                            using (var uow = new UnitOfWork(DbFactory, session))
                            {
                                using (var writer = ((NpgsqlConnection)uow.Connection).BeginBinaryImport(sqlCopy))
                                {
                                    for (int i = 2; i < records.Count(); i++)
                                    {
                                        var record = records[i];
                                        if (keyColumn != null && keyColumn.is_identity == false)
                                        {
                                            object key = record[keyColumn.column_name];
                                            if (key != null)
                                            {
                                                if (listImportedKey.Contains(key))
                                                {
                                                    continue;
                                                }
                                                else
                                                {
                                                    listImportedKey.Add(key);
                                                }
                                            }
                                        }
                                        writer.StartRow();
                                        //Check action is INSERT or UPDATE
                                        List<string> searchContent = new List<string>();
                                        foreach (var column in columns)
                                        {
                                            var key = record.Keys.Where(x => x == column.column_name).FirstOrDefault();
                                            if (key != null && record[key] != null && String.IsNullOrWhiteSpace(record[key].ToString()) == false)
                                            {
                                                switch (column.data_type)
                                                {
                                                    case EnumPgDataType.BigInt:
                                                        if (long.TryParse(record[key]?.ToString(), out long longValue))
                                                        {
                                                            writer.Write(longValue, NpgsqlTypes.NpgsqlDbType.Bigint);
                                                        }
                                                        else
                                                        {
                                                            writer.Write(0, NpgsqlTypes.NpgsqlDbType.Bigint);
                                                        }
                                                        break;
                                                    case EnumPgDataType.SmallInt:
                                                        if (int.TryParse(record[key]?.ToString(), out int smIntValue))
                                                        {
                                                            writer.Write(smIntValue, NpgsqlTypes.NpgsqlDbType.Smallint);
                                                        }
                                                        else
                                                        {
                                                            writer.Write(0, NpgsqlTypes.NpgsqlDbType.Smallint);
                                                        }
                                                        break;
                                                    case EnumPgDataType.Integer:
                                                        if (int.TryParse(record[key]?.ToString(), out int intValue))
                                                        {
                                                            writer.Write(intValue, NpgsqlTypes.NpgsqlDbType.Integer);
                                                        }
                                                        else
                                                        {
                                                            writer.Write(0, NpgsqlTypes.NpgsqlDbType.Integer);
                                                        }
                                                        break;
                                                    case EnumPgDataType.Double:
                                                        if (record[key]?.ToString() != "NaN" && double.TryParse(record[key]?.ToString(), out double dblValue))
                                                        {
                                                            if (dblValue != Double.NaN)
                                                            {
                                                                writer.Write(dblValue, NpgsqlTypes.NpgsqlDbType.Double);
                                                            }
                                                            else
                                                            {
                                                                writer.Write(0.0, NpgsqlTypes.NpgsqlDbType.Double);
                                                            }
                                                        }
                                                        else
                                                        {
                                                            writer.Write(0.0, NpgsqlTypes.NpgsqlDbType.Double);
                                                        }
                                                        break;
                                                    case EnumPgDataType.String:
                                                    case EnumPgDataType.Text:
                                                        writer.Write(record[key]?.ToString());
                                                        if (string.IsNullOrWhiteSpace(record[key]?.ToString()) == false)
                                                        {
                                                            searchContent.Add(StringHelper.RemoveVietNameseSign(record[key]?.ToString()).ToLower());
                                                        }
                                                        break;
                                                    case EnumPgDataType.Date:
                                                        if (record[key] is DateTime)
                                                        {
                                                            writer.Write(record[key], NpgsqlTypes.NpgsqlDbType.Date);
                                                        }
                                                        else
                                                        {
                                                            if (DateTime.TryParse(record[key]?.ToString(), out DateTime parsedDateTime))
                                                            {
                                                                writer.Write(parsedDateTime, NpgsqlTypes.NpgsqlDbType.Date);
                                                            }
                                                            else
                                                            {
                                                                writer.WriteNull();
                                                            }
                                                        }
                                                        break;
                                                    case EnumPgDataType.Time:
                                                        if (record[key] is DateTime)
                                                        {
                                                            writer.Write(record[key], NpgsqlTypes.NpgsqlDbType.Time);
                                                        }
                                                        else
                                                        {
                                                            if (DateTime.TryParse(record[key]?.ToString(), out DateTime parsedDateTime))
                                                            {
                                                                writer.Write(parsedDateTime, NpgsqlTypes.NpgsqlDbType.Time);
                                                            }
                                                            else
                                                            {
                                                                writer.WriteNull();
                                                            }
                                                        }
                                                        break;
                                                    case EnumPgDataType.DateTime:
                                                        if (record[key] is DateTime)
                                                        {
                                                            writer.Write(record[key], NpgsqlTypes.NpgsqlDbType.Timestamp);
                                                        }
                                                        else
                                                        {
                                                            if (DateTime.TryParse(record[key]?.ToString(), out DateTime parsedDateTime))
                                                            {
                                                                writer.Write(parsedDateTime, NpgsqlTypes.NpgsqlDbType.Timestamp);
                                                            }
                                                            else
                                                            {
                                                                writer.WriteNull();
                                                            }
                                                        }
                                                        break;
                                                    case EnumPgDataType.DateTimeTZ:
                                                        var date = new DateTime(((DateTime)record[key]).Ticks, DateTimeKind.Utc);
                                                        writer.Write(date, NpgsqlTypes.NpgsqlDbType.TimestampTz);
                                                        break;
                                                    case EnumPgDataType.Geometry:
                                                        Geometry? geometry;
                                                        if (record["geom"] is Geometry)
                                                        {
                                                            geometry = record["geom"] as Geometry;
                                                            if (geometry != null && !geometry.IsEmpty)
                                                            {
                                                                writer.Write(geometry, NpgsqlTypes.NpgsqlDbType.Geometry);
                                                            }
                                                            else
                                                            {
                                                                writer.WriteNull();
                                                            }
                                                        }
                                                        else if (record["geom"] is string)
                                                        {
                                                            var geom = wktReader.Read(record["geom"]?.ToString());
                                                            writer.Write(geom);
                                                        }
                                                        else
                                                        {
                                                            writer.WriteNull();
                                                        }
                                                        break;
                                                    default:
                                                        writer.Write(record[key].ToString());
                                                        break;
                                                }
                                            }
                                            else
                                            {
                                                writer.WriteNull();
                                            }
                                        }
                                        if (tb.columns.Any(o => o.column_name == "search_content"))
                                        {
                                            // NpgsqlTsVector? vector = null;//buildTsVector(sessionTsVector, string.Join(" ", searchContent));
                                            if (searchContent.Count > 0)
                                            {
                                                writer.Write(string.Join(" ", searchContent));
                                            }
                                            else
                                            {
                                                writer.WriteNull();
                                            }
                                        }
                                    }
                                    writer.Complete();
                                }
                                // Chạy lại trường hành chính mặc định theo mã tỉnh mã huyện, mã xã
                                await runQueryRegion(tb, uow);
                                if (tb.columns.Any(o => o.column_name == "search_content"))
                                {
                                    await uow.Connection.ExecuteAsync($"UPDATE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" SET search_content = to_tsvector(search_content_en) WHERE search_content IS NULL AND search_content_en IS NOT NULL;");
                                }
                            }
                            // await session.ExecuteAsync($"ALTER TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" DROP COLUMN IF EXISTS search_content_en;");
                            await session.ExecuteAsync($"ALTER TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ENABLE TRIGGER ALL;");
                        }
                        watcher.Stop();
                        _logger.LogInformation($"Done copy: {tb.table_name} in {watcher.ElapsedMilliseconds}ms");
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
    }
}