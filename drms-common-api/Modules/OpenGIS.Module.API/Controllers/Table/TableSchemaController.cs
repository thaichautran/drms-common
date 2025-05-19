using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure;
using System;
using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Database;
using System.Threading.Tasks;
using System.Collections.Generic;
using VietGIS.Infrastructure.Identity.PostgreSQL.Models;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Repositories.Session;
using OpenGIS.Module.Core.Models.DevExtreme;
using System.Net;

namespace OpenGIS.Module.API.Controllers
{
    //// [Authorize(Policy = nameof(ModuleFunction.READ_TABLE_SCHEMA))]
    public partial class TableController : BaseController
    {
        private string[] _excluded_schema = new string[]
        {
            "public",
            "pg_catalog",
            "regional",
            "information_schema",
            "identity",
            "route",
            "category"
        };

        List<string> _hiddenFields = new List<string>{
                "is_delete",
                "created_at",
                "updated_at",
                "search_content",
                "geom"
            };

        [HttpPost("schema/list")]
        [AllowAnonymous]
        public RestBase ListAsync([FromBody] DxGridDTO dto)
        {
            if (dto == null)
            {
                return new RestError((int)HttpStatusCode.BadRequest, "Vui lòng kiểm tra lại tham số");
            }
            using var session = OpenSession();
            var condition = "1=1";
            if (string.IsNullOrWhiteSpace(dto.searchValue) == false)
            {
                condition += $" AND lower({Sql.Entity<TableSchema>(x => x.description):TC}) LIKE @keyword";
            }
            List<TableSchema> data = new List<TableSchema>();
            if (dto.take > 0)
            {
                data = session.Find<TableSchema>(statement => statement.Where($"{condition}")
                    .WithParameters(new { keyword = dto.searchValue?.ToLower() })
                    .OrderBy($"{Sql.Entity<TableSchema>(x => x.schema_name):TC}")
                    .Skip(dto.skip)
                    .Top(dto.take)
                ).ToList();
            }
            else
            {
                data = session.Find<TableSchema>(statement => statement.Where($"{condition}")
                    .WithParameters(new { keyword = dto.searchValue?.ToLower() })
                    .OrderBy($"{Sql.Entity<TableSchema>(x => x.schema_name):TC}")
                ).ToList();
            }
            return new RestPagedDataTable()
            {
                data = data,
                recordsTotal = session.Count<TableSchema>(statement => statement
                    .Where($"{condition}")
                    .WithParameters(new { keyword = dto.searchValue?.ToLower() })
                )
            };
        }
        [HttpGet("schema/list")]
        public RestBase listTableSchema()
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<TableSchema>().OrderBy(x => x.description).ToList(),
                };
            }
        }

        [HttpGet("schema/{schema}")]
        public RestBase getSchema([FromRoute] string schema)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Get(new TableSchema { schema_name = schema })
                };
            }
        }

        [HttpPost("schema/create")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_TABLE_SCHEMA))]
        public RestBase createSchema([FromBody] TableSchema dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                }
                dto.schema_name = StringHelper.Normalize(dto.schema_name, "_").ToLower();
                string sql = $"SELECT count(1) FROM information_schema.schemata WHERE schema_name = @schema_name";
                int count = session.Query<int>(sql, new { schema_name = dto.schema_name }).FirstOrDefault();
                if (count > 0)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Schema đã tồn tại, vui lòng tạo schema khác!" }
                        }
                    };
                }
                else
                {
                    // sql = $"CREATE SCHEMA IF NOT EXISTS \"{dto.schema_name}\"";
                    // session.Execute(sql);
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        uow.Insert(dto);
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("schema/update")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_TABLE_SCHEMA))]
        public RestBase updateSchema([FromBody] TableSchema dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                }
                var existSchema = session.Get(new TableSchema { schema_name = dto.schema_name });
                if (existSchema == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Schema không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        uow.Update(dto);
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("schema/delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_TABLE_SCHEMA))]
        public RestBase deleteSchema([FromForm] TableSchema dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                }
                var existSchema = session.Get(new TableSchema { schema_name = dto.schema_name });
                if (existSchema == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Schema không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        uow.Delete(dto);
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("schema/sync")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_TABLE_SCHEMA))]
        public async Task<RestBase> syncSchemaAsync([FromQuery] string? schema)
        {
            using (var session = OpenSession())
            {
                if (string.IsNullOrWhiteSpace(schema))
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                }
                _tableRepository.SyncTableWithDatabase(schema, false);
                // normalizeTable(schema);
                // addSearchContent(schema);
                // addTimeColumn(schema);
                // addRegionColumn(schema);
                // syncColumns(schema);
                // syncLayers(schema);
                // indexLayer(schema);
                // updateGeomType(schema);

                return new RestBase(EnumErrorCode.OK);
            }
        }

        private void indexLayer(string schema = "")
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                IEnumerable<InformationIndex> indexes = session.Query<InformationIndex>($@"
                        SELECT n.nspname AS table_schema
                            ,t.relname AS table_name
                            ,i.relname AS index_name
                            ,a.attname AS column_name
                        FROM pg_catalog.pg_namespace n
                            ,pg_class t
                            ,pg_class i
                            ,pg_index ix
                            ,pg_attribute a
                        WHERE n.oid = t.relnamespace
                            AND t.oid = ix.indrelid
                            AND i.oid = ix.indexrelid
                            AND a.attrelid = t.oid
                            AND a.attnum = ANY (ix.indkey)
                            AND a.attname = 'geom'
                            AND t.relkind = 'r'
                        ORDER BY t.relname
                            ,a.attname;
                    ");
                var layers = _mapLayersRepository.getLayersWithTableAndColumn();
                if (string.IsNullOrWhiteSpace(schema) == false)
                {
                    layers = layers.Where(x => x.table.table_schema == schema);
                }
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var layer in layers)
                    {
                        if (indexes.Any(x => x.table_name == layer.table.table_name && x.table_schema == layer.table.table_schema) == false)
                        {
                            // Console.WriteLine(">> Indexing: " + layer.table.table_name);
                            uow.Connection.Execute($"CREATE INDEX {layer.table.table_name}_geom_idx ON {layer.table.table_schema}.{layer.table.table_name} USING GIST(geom);");
                        }
                    }
                }
            }
        }
        private void normalizeTable(string schema = "")
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var tables = session.Find<TableInfo>(statement => statement.Include<TableColumn>());
                    if (string.IsNullOrWhiteSpace(schema) == false)
                    {
                        tables = tables.Where(x => x.table_schema == schema);
                    }
                    foreach (var table in tables)
                    {
                        // Console.WriteLine(">> Indexing: " + table.table_name);
                        foreach (var col in table.columns)
                        {
                            if (col.column_name.ToLower().Equals(col.column_name) == false)
                            {
                                // Console.WriteLine(">> Uppercase: " + col.column_name);
                                if (col.column_name.ToLower().Equals("id"))
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"_gid\";");
                                }
                                else
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"{col.column_name.ToLower()}\";");
                                }
                            }
                        }
                        // if (table.columns.Any(x => x.column_name == "created_at"))
                        // {
                        //     uow.Connection.Execute($"UPDATE \"{table.table_schema}\".\"{table.table_name}\" SET created_at = created_at");
                        // }
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS is_delete;");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS id_tinh;");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS id_huyen;");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS id_xa;");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS polygon;");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS lon;");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS lat;");
                        // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS hinh_anh;");
                        // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS hinh_anh1;");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"SHAPE_Area\";");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"SHAPE_Length\";");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"OBJECTID\";");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"shape_area\";");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"shape_le_1\";");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"shape_leng\";");
                        uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"shape_length\";");
                    }
                }
            }
        }
        private void addRegionColumn(string schema = "")
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                var layers = session.Find<Layer>(statement => statement.Include<TableInfo>());
                if (string.IsNullOrWhiteSpace(schema) == false)
                {
                    layers = layers.Where(x => x.table.table_schema == schema);
                }
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var layer in layers)
                    {
                        // Console.WriteLine(">> Indexing: " + layer.table.table_name);
                        int countInsert = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'district_code'
                                        AND t.table_schema = '{layer.table.table_schema}' 
                                        AND t.table_name = '{layer.table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                        if (countInsert == 0)
                        {
                            string sql = $"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ADD COLUMN \"district_code\" integer";
                            uow.Connection.Execute(sql);
                        }
                        int countUpdate = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'commune_code'
                                        AND t.table_schema = '{layer.table.table_schema}' 
                                        AND t.table_name = '{layer.table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                        if (countUpdate == 0)
                        {
                            string sql = $"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ADD COLUMN \"commune_code\" integer";
                            uow.Connection.Execute(sql);
                        }
                        int countProv = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'province_code'
                                        AND t.table_schema = '{layer.table.table_schema}' 
                                        AND t.table_name = '{layer.table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                        if (countProv == 0)
                        {
                            string sql = $"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ADD COLUMN \"province_code\" integer";
                            uow.Connection.Execute(sql);
                        }
                    }
                }
            }
        }
        private void addTimeColumn(string schema = "")
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                var tables = session.Find<TableInfo>();
                if (string.IsNullOrWhiteSpace(schema) == false)
                {
                    tables = tables.Where(x => x.table_schema == schema);
                }
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var table in tables)
                    {
                        // Console.WriteLine($"Syncing time column: {table.table_name}");
                        int countInsert = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'created_at'
                                        AND t.table_schema = '{table.table_schema}' 
                                        AND t.table_name = '{table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                        if (countInsert == 0)
                        {
                            string sql = $"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" ADD COLUMN \"created_at\" timestamp without time zone";
                            uow.Connection.Execute(sql);
                        }
                        int countUpdate = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'updated_at'
                                        AND t.table_schema = '{table.table_schema}' 
                                        AND t.table_name = '{table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                        if (countUpdate == 0)
                        {
                            string sql = $"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" ADD COLUMN \"updated_at\" timestamp without time zone";
                            uow.Connection.Execute(sql);
                        }
                        int countTriggerInsert = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM  information_schema.triggers
                                    WHERE event_object_table = '{table.table_name}' 
                                        AND event_object_schema = '{table.table_schema}' 
                                        AND trigger_name = 'trigger_update_created_at'
                                
                                ").FirstOrDefault();
                        if (countTriggerInsert == 0)
                        {
                            string sql = $"CREATE TRIGGER trigger_update_created_at BEFORE INSERT ON \"{table.table_schema}\".\"{table.table_name}\" FOR EACH ROW EXECUTE PROCEDURE update_created_at();";
                            uow.Connection.Execute(sql);
                        }
                        int countTriggerUpdate = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM  information_schema.triggers
                                    WHERE event_object_table = '{table.table_name}' 
                                        AND event_object_schema = '{table.table_schema}' 
                                        AND trigger_name = 'trigger_update_updated_at'
                                
                                ").FirstOrDefault();
                        if (countTriggerUpdate == 0)
                        {
                            string sql = $"CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON \"{table.table_schema}\".\"{table.table_name}\" FOR EACH ROW EXECUTE PROCEDURE update_updated_at();";
                            uow.Connection.Execute(sql);
                        }
                    }
                }
            }
        }
        private void addSearchContent(string schema = "")
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                var tables = session.Find<TableInfo>();
                if (string.IsNullOrWhiteSpace(schema) == false)
                {
                    tables = tables.Where(x => x.table_schema == schema);
                }
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var table in tables)
                    {
                        // Console.WriteLine(">> Syncing search content: " + table.table_name);
                        int countCol = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'search_content'
                                        AND t.table_schema = '{table.table_schema}' 
                                        AND t.table_name = '{table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                        if (countCol == 0)
                        {
                            string sql = $"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" ADD COLUMN \"search_content\" TSVector";
                            uow.Connection.Execute(sql);
                        }
                        int countTriggerInsert = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM  information_schema.triggers
                                    WHERE event_object_table = '{table.table_name}' 
                                        AND event_object_schema = '{table.table_schema}' 
                                        AND trigger_name = 'update_search_content'
                                ").FirstOrDefault();
                        if (countTriggerInsert == 0)
                        {
                            string sql = $"CREATE TRIGGER update_search_content BEFORE INSERT OR UPDATE ON \"{table.table_schema}\".\"{table.table_name}\" FOR EACH ROW EXECUTE PROCEDURE update_search_content();";
                            uow.Connection.Execute(sql);
                        }
                    }
                }
            }
        }
        private void updateGeomType(string schema = "")
        {
            IEnumerable<Layer> layers = _mapLayersRepository.getLayersWithTableAndColumn();
            if (string.IsNullOrWhiteSpace(schema) == false)
            {
                layers = layers.Where(x => x.table.table_schema == schema);
            }
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var layer in layers)
                    {
                        if (layer.table.table_schema == "bcvt")
                            continue;
                        string? geomtype = session.Query<string>($@"
                                    SELECT type
                                    FROM geometry_columns
                                    WHERE f_table_schema = '{layer.table.table_schema}'
                                        AND f_table_name = '{layer.table.table_name}'
                                        AND f_geometry_column = 'geom';
                                ").FirstOrDefault();
                        if (!string.IsNullOrWhiteSpace(geomtype))
                        {
                            // Console.WriteLine($"{layer.table.table_name},{geomtype}");
                            if (geomtype.ToUpper() == "LINESTRING")
                            {
                                layer.geometry = "LineString";
                                layer.order = 3;
                            }
                            else if (geomtype.ToUpper() == "MULTILINESTRING")
                            {
                                layer.geometry = "MultiLineString";
                                layer.order = 4;
                            }
                            else if (geomtype.ToUpper() == "POINT")
                            {
                                layer.geometry = "Point";
                                layer.order = 1;
                            }
                            else if (geomtype.ToUpper() == "MULTIPOINT")
                            {
                                layer.geometry = "MultiPoint";
                                layer.order = 2;
                            }
                            else if (geomtype.ToUpper() == "POLYGON")
                            {
                                layer.geometry = "Polygon";
                                layer.order = 5;
                            }
                            else if (geomtype.ToUpper() == "MULTIPOLYGON")
                            {
                                layer.geometry = "MultiPolygon";
                                layer.order = 6;
                            }
                        }
                        uow.Connection.Update(layer);
                    }
                }
            }
        }
        private async Task syncWithDbAsync(string schema = "")
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var tables = session.Find<TableInfo>();
                    if (string.IsNullOrWhiteSpace(schema) == false)
                    {
                        tables = tables.Where(x => x.table_schema == schema);
                    }
                    foreach (var table in tables)
                    {
                        if (session.Query<bool>($"SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_schema = '{table.table_schema}' AND table_name = '{table.table_name}'  AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}));").FirstOrDefault() == false)
                        {
                            uow.Delete(table);
                            // Console.WriteLine($">> Deleted table: {table.table_name}");
                        }
                    }
                }
                IEnumerable<InformationTable> dbTables = await session.QueryAsync<InformationTable>(
                    $"SELECT * FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}) ORDER BY table_schema, table_name"
                );
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var info in dbTables)
                    {
                        int count = session.Count<TableInfo>(statement => statement
                            .Where($"{nameof(TableInfo.table_name)}=@table_name AND {nameof(TableInfo.table_schema)}=@table_schema")
                            .WithParameters(info)
                        );
                        if (count == 0)
                        {
                            uow.Connection.Insert(new TableInfo()
                            {
                                table_schema = info.table_schema,
                                table_name = info.table_name,
                                name_en = info.table_name,
                                name_vn = info.table_name
                            });
                        }
                    }
                }
            }
        }
        private void syncLayers(string schema = "")
        {
            var tables = getTablesAndColumns(null).Where(x => x.columns.Any(o => o.column_name == "geom")).OrderBy(x => x.name_vn).ToList();
            if (string.IsNullOrWhiteSpace(schema) == false)
            {
                tables = tables.Where(x => x.table_schema == schema).ToList();
            }
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var layer in session.Find<Layer>())
                    {
                        int count = session.Count<TableInfo>(statement => statement
                            .Where($"{nameof(TableInfo.id)}={layer.table_info_id}")
                        );
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
                        int count = session.Count<Layer>(statement => statement
                            .Where($"{nameof(Layer.table_info_id)}={table.id}")
                        );
                        if (count == 0)
                        {
                            uow.Insert(new Layer
                            {
                                name_vn = table.name_vn,
                                table_info_id = table.id,
                                permanent = true,
                                layer_type = "vector"
                            });
                        }
                    }
                }
            }
        }
        private void syncColumns(string schema = "")
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                IDictionary<string, object> data = new Dictionary<string, object>();
                IEnumerable<TableInfo> tables = session.Find<TableInfo>();
                if (string.IsNullOrWhiteSpace(schema) == false)
                {
                    tables = tables.Where(x => x.table_schema == schema);
                }
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var table in tables)
                    {
                        // Console.WriteLine($">> Syncing: {table.table_schema}.{table.table_name}");
                        var pkeyColumn = session.Query<string>(
                            $@"
                                        SELECT c.column_name
                                        FROM information_schema.table_constraints tc
                                        JOIN information_schema.constraint_column_usage AS ccu USING (
                                                constraint_schema
                                                ,constraint_name
                                                )
                                        JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
                                            AND tc.table_name = c.table_name
                                            AND ccu.column_name = c.column_name
                                        WHERE constraint_type = 'PRIMARY KEY'
                                            AND tc.table_name = '{table.table_name}' AND tc.table_schema = '{table.table_schema}';
                                    "
                        ).FirstOrDefault();
                        var columns = session.Query<InformationColumn>(
                            $"SELECT * FROM information_schema.columns WHERE table_name = '{table.table_name}' AND table_schema = '{table.table_schema}'");
                        if (columns != null && columns.Count() > 0)
                        {
                            string sql = $"{nameof(TableColumn.table_id)} = {table.id} AND {nameof(TableColumn.column_name)} NOT IN ({String.Join(",", columns.Select(x => $"'{x.column_name}'"))})";
                            var deleteCols = session.Find<TableColumn>(statement => statement.Where($"{sql}"));
                            if (deleteCols.Count() > 0)
                            {
                                // Console.WriteLine($"--> {table.table_schema}.{table.table_name} - Deleted columns: {string.Join(",", deleteCols.Select(x => x.column_name))}");
                                sql = $"DELETE FROM {Sql.Entity<TableColumn>():T} WHERE {Sql.Entity<TableColumn>(x => x.id):TC} = ANY(@deleteColIds)";
                                uow.Connection.Execute(sql, new { deleteColIds = deleteCols.Select(x => x.id).ToArray() });
                            }
                            foreach (var column in columns)
                            {
                                if (column.column_name == "search_content")
                                    continue;
                                var tableColumn = session.Find<TableColumn>(statement => statement
                                    .Where($"{nameof(TableColumn.column_name):C}='{column.column_name}' AND {nameof(TableColumn.table_id):C}={table.id}")
                                ).FirstOrDefault();

                                if (tableColumn == null)
                                {
                                    // Console.WriteLine($">> Create column: {column.column_name}");
                                    tableColumn = new TableColumn()
                                    {
                                        column_name = column.column_name,
                                        character_max_length = column.character_maximum_length == null ? 0 : column.character_maximum_length.Value,
                                        name_en = column.column_name,
                                        name_vn = column.column_name,
                                        data_type = column.data_type,
                                        is_identity = pkeyColumn?.ToLower().Equals(column.column_name.ToLower()) ?? false,
                                        is_nullable = "YES".Equals(column.is_nullable),
                                        require = "NO".Equals(column.is_nullable),
                                        visible = _hiddenFields.Any(x => x == column.column_name) == false,
                                        permanent = true,
                                        table_id = table.id
                                    };

                                    uow.Connection.Insert(tableColumn);
                                }
                                else
                                {
                                    // Console.WriteLine($">> Update column: {column.column_name}");
                                    tableColumn.character_max_length = column.character_maximum_length == null ? 0 : column.character_maximum_length.Value;
                                    tableColumn.data_type = column.data_type;
                                    tableColumn.is_identity = pkeyColumn?.ToLower().Equals(column.column_name.ToLower()) ?? false;
                                    tableColumn.is_nullable = "YES".Equals(column.is_nullable);
                                    tableColumn.require = "NO".Equals(column.is_nullable);
                                    tableColumn.visible = _hiddenFields.Any(x => x == column.column_name) == false;

                                    uow.Connection.Update(tableColumn);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}