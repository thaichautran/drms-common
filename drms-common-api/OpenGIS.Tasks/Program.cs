using AutoMapper;
using Dapper;
using Dapper.FastCrud;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.ServiceModel;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using OfficeOpenXml;
using Autofac;
using HeyRed.Mime;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Identity.PostgreSQL.Models;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using NetTopologySuite.Operation.Buffer;

namespace OpenGIS.Tasks
{
    class Program
    {
        private static string[] _excluded_schema = new string[]
        {
            // "public",
            "pg_catalog",
            "regional",
            "information_schema",
            "identity",
            "web"
        };

        // private static string[] _excluded_schema = new string[]
        // {
        //     "csdl_capnuoc",
        //     "csdl_cayxanh",
        //     "csdl_chieusang",
        //     "csdl_dancukhudothi",
        //     "csdl_khucn",
        //     "csdl_nghiatrang",
        //     "csdl_suco_phanhoi",
        //     "csdl_thoatnuoc",
        //     "csdl_thongtingoithau",
        //     "csdl_tuynenkythuat",
        // };

        public static IConfigurationRoot Configuration { get; set; }
        public static IContainer Container { get; set; }
        public static ILogger Logger { get; set; }
        private static ILoggerFactory LoggerFactory { get; set; }

        static void Main(string[] args)
        {
            Configuration = RegisterConfiguration();
            Container = RegisterContainer();
            //
            // normalizeTable();
            // addRegionColumn("csdl_cayxanh");
            // addTimeColumn("csdl_cayxanh");
            // addSearchContent("csdl_cayxanh");
            // addDeleteColumn();

            syncWithDbAsync("category");
            syncColumns("category");
            // syncDomains();
            // syncRelations();
            addCreateByColumn();
            // addIsApprovedColumn();
            // syncTime();
            // syncRegions();
            // indexSearch();

            // syncLayers("csdl_cayxanh");
            // updateGeomType("csdl_cayxanh");
            // indexLayer("csdl_cayxanh");
            // linkHSQ(args.Length > 0 ? args[0] : "", args.Length > 1 ? args[1] : "");
            // linkHSQ();

            // importColumns();

            // fakeData();
        }

        private static void importColumns()
        {
            using (var package = new ExcelPackage("./csdl_chieusang.xlsx"))
            {
                using var scope = Container.BeginLifetimeScope();
                var dbFactory = scope.Resolve<IDbFactory>();
                using var session = dbFactory.Create<IServiceSession>();
                var tables = session.Find<TableInfo>(s => s.Include<TableColumn>());
                foreach (var ws in package.Workbook.Worksheets)
                {
                    // Console.WriteLine($"Row count: {ws.Dimension.Rows}");
                    var tableName = ws.Name;
                    var table = tables.FirstOrDefault(x => x.table_name == tableName);
                    if (table == null)
                    {
                        Console.WriteLine(tableName);
                        // session.Execute($"create table csdl_cayxanh.{tableName} (id serial not null);");
                        continue;
                    }
                    for (int idx = 2; idx < ws.Dimension.Rows; idx++)
                    {
                        string rawColName = ws.Cells[$"B{idx}"].Value?.ToString();
                        string rawDataType = ws.Cells[$"C{idx}"].Value?.ToString();
                        string rawNote = ws.Cells[$"D{idx}"].Value?.ToString();

                        string colName = StringHelper.Normalize(StringHelper.RemoveVietNameseSign(rawColName), "");

                        if (string.IsNullOrWhiteSpace(colName) == false)
                        {
                            if (table.columns.Any(x => x.column_name == colName) == false)
                            {
                                session.Execute($"alter table {table.table_schema}.{table.table_name} add column  IF NOT EXISTS  {colName} {getDataType(rawDataType)};");
                            }
                            else
                            {
                                var col = table.columns.FirstOrDefault(x => x.column_name == colName);
                                if (col.column_name == col.name_vn)
                                {
                                    col.name_vn = rawColName;
                                    session.Update(col);
                                }
                            }
                        }

                        // getDataType(rawDataType);
                        // Console.WriteLine($"{colName},{getDataType(rawDataType)},{rawNote}");
                    }
                }
            }
        }

        private static void fakeData()
        {
            using var scope = Container.BeginLifetimeScope();
            var dbFactory = scope.Resolve<IDbFactory>();
            using var session = dbFactory.Create<IServiceSession>();
            var tables = session.Find<TableInfo>(s => s.Include<TableColumn>());

            foreach (var table in tables.Where(o => o.table_schema == "csdl_cayxanh" || o.table_schema == "csdl_chieusang" || o.table_schema == "csdl_thoatnuoc"))
            {
                session.Execute($"ALTER TABLE {table.table_schema}.{table.table_name} DISABLE TRIGGER ALL;");
                if (table.columns.Any(x => x.data_type == EnumPgDataType.Text || x.data_type == EnumPgDataType.String))
                {
                    foreach (var col in table.columns.Where(x => x.data_type == EnumPgDataType.Text || x.data_type == EnumPgDataType.String))
                    {
                        if (col.column_name != "province_code" && col.column_name != "district_code" && col.column_name != "commune_code"
                            && col.column_name != "matinh" && col.column_name != "mahuyen" && col.column_name != "maxa" && col.column_name != "created_by"
                            && col.column_name != "updated_by")
                        {
                            try
                            {
                                session.Execute($"UPDATE {table.table_schema}.{table.table_name} set {col.column_name} = NULL WHERE {col.column_name} = 'Thông tin sẽ được cập nhật trong quá trình vận hành'");
                            }
                            catch (Exception)
                            {
                                Console.WriteLine($"{table.table_name}, {col.column_name}");
                            }
                        }
                    }
                }
                session.Execute($"ALTER TABLE {table.table_schema}.{table.table_name} ENABLE TRIGGER ALL;");
            }
        }
        private static void deleteData()
        {
            using var scope = Container.BeginLifetimeScope();
            var dbFactory = scope.Resolve<IDbFactory>();
            using var session = dbFactory.Create<IServiceSession>();
            var tables = session.Find<TableInfo>(s => s.Include<TableColumn>()
            .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema")
            .WithParameters(new
            {
                schema = "csdl_chieusang"
            }));
            var arr = new string[] { "TĐ-882", "TĐ-898", "TĐ-952", "TĐ-956", "TĐ-958", "TĐ-979" };
            foreach (var table in tables)
            {
                // session.Execute($"ALTER TABLE {table.table_schema}.{table.table_name} DISABLE TRIGGER ALL;");
                // if (table.table_name.StartsWith("dm_"))
                // {
                //     Console.WriteLine($"CLEAR DATA {table.table_name}");
                //     session.Execute($"delete from {table.table_schema}.{table.table_name}");
                // }
                // else
                if (table.columns.Any(x => x.column_name == "matramden" || x.column_name == "matram"))
                {
                    Console.WriteLine($"CLEAR DATA {table.table_name}");

                    foreach (var col in table.columns.Where(x => x.column_name == "matramden" || x.column_name == "matram"))
                    {
                        try
                        {
                            session.Execute($"delete from {table.table_schema}.{table.table_name} WHERE {col.column_name} = ANY(@arr)", new
                            {
                                arr
                            });
                        }
                        catch (Exception)
                        {
                            Console.WriteLine($"{table.table_name}, {col.column_name}");
                        }
                    }
                }
                // session.Execute($"ALTER TABLE {table.table_schema}.{table.table_name} ENABLE TRIGGER ALL;");
            }
        }

        private static string getDataType(string rawDataType)
        {
            if (string.IsNullOrWhiteSpace(rawDataType))
            {
                return "varchar";
            }
            switch (StringHelper.RemoveVietNameseSign(rawDataType).Trim().Replace("  ", " ").ToLower())
            {
                case "chuoi ky tu":
                case "chuoi ki tu":
                    return "varchar";
                case "so thuc":
                    return "double precision";
                case "date":
                    return "date";
                case "so tu nhien":
                    return "int";
                case "integer":
                    return "int";
                case "":
                default:
                    Console.WriteLine("Missing type: " + rawDataType);
                    return "varchar";
            }
        }

        private static IConfigurationRoot RegisterConfiguration()
        {
            var configBuilder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json");
            return configBuilder.Build();
        }

        private static IContainer RegisterContainer()
        {
            ContainerBuilder builder = new ContainerBuilder();
            AutofacRegistrar.Register(builder);
            builder.RegisterType<ServiceSession>().As<IServiceSession>();
            //
            return builder.Build();
        }

        public interface IServiceSession : ISession
        {
        }

        public class ServiceSession : Session<NpgsqlConnection>, IServiceSession
        {
            public ServiceSession(IDbFactory session)
                : base(session, Configuration.GetConnectionString("DefaultConnection"))
            {
                Dapper.FastCrud.OrmConfiguration.DefaultDialect = Dapper.FastCrud.SqlDialect.PostgreSql;
            }
        }

        #region Tasks

        private static void linkHSQ(string table_schema = "", string table_name = "")
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    var layers = getLayersWithTableAndColumn();

                    if (string.IsNullOrWhiteSpace(table_schema) == false)
                    {
                        layers = layers.Where(x => x.table.table_schema == table_schema);
                    }
                    if (string.IsNullOrWhiteSpace(table_name) == false)
                    {
                        layers = layers.Where(x => x.table.table_name == table_name);
                    }

                    foreach (var layer in layers)
                    {
                        using (var uow = new UnitOfWork(dbFactory, session))
                        {
                            try
                            {
                                List<string> links = new List<string>();
                                if (layer.table.columns.Any(x => x.column_name == "linkhsq"))
                                {
                                    links.AddRange(session.Query<string>($"SELECT DISTINCT linkhsq FROM {layer.table.table_schema}.{layer.table.table_name}"));
                                }
                                if (layer.table.columns.Any(x => x.column_name == "link_hsq"))
                                {
                                    links.AddRange(session.Query<string>($"SELECT DISTINCT link_hsq FROM {layer.table.table_schema}.{layer.table.table_name}"));
                                }
                                if (layer.table.columns.Any(x => x.column_name == "linkdulieu"))
                                {
                                    links.AddRange(session.Query<string>($"SELECT DISTINCT linkdulieu FROM {layer.table.table_schema}.{layer.table.table_name}"));
                                }
                                if (layer.table.columns.Any(x => x.column_name == "linkshq"))
                                {
                                    links.AddRange(session.Query<string>($"SELECT DISTINCT linkshq FROM {layer.table.table_schema}.{layer.table.table_name}"));
                                }
                                if (links.Count > 0)
                                {
                                    // Console.WriteLine($">> Link HSQ: {layer.table.table_name}");
                                }
                                foreach (var link in links)
                                {
                                    // Console.WriteLine($">>> Path: {link}");
                                    if (string.IsNullOrWhiteSpace(link) == false)
                                    {

                                        // string normalLink = link.Replace("...", "").Replace("..", "").Replace("F:", "");
                                        // List<string> paths = normalLink.Split("\\").Where(x => string.IsNullOrWhiteSpace(x) == false).ToList();
                                        // string path = Path.Combine(paths.ToArray());
                                        // path = path.Replace("CaoBang_SoTTTT", "CaoBang_STTTT");
                                        // path = path.Replace("/", "\\");
                                        // if (Directory.Exists(path))
                                        // {
                                        //     foreach (var file in Directory.GetFiles(path, "*", SearchOption.AllDirectories))
                                        //     {
                                        //         var fi = new FileInfo(file);
                                        //         var item = new LayerFile
                                        //         {
                                        //             layer_id = layer.id,
                                        //             name = fi.Name,
                                        //             url = $"/files/{file.Replace("\\", "/")}",
                                        //             size = fi.Length,
                                        //             mime_type = MimeTypesMap.GetMimeType(fi.Name)
                                        //         };
                                        //         if (session.Count<LayerFile>(statement => statement.Where($"{nameof(LayerFile.name)} = @name AND {nameof(LayerFile.url)} = @url").WithParameters(item)) == 0)
                                        //         {
                                        //             // Console.WriteLine($">>>> File: {fi.Name} not exist!");
                                        //             uow.Insert(item);
                                        //         }
                                        //         else
                                        //         {
                                        //             // Console.WriteLine($">>>> File: {fi.Name} exist!");
                                        //         }
                                        //     }
                                        // }
                                    }
                                }
                            }
                            catch (Exception e)
                            {
                                // Console.WriteLine(e.Message);
                                uow.Rollback();
                            }
                        }
                    }
                }
            }
        }

        private static void indexLayer(string table_schema = "")
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
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
                    var layers = getLayersWithTableAndColumn(table_schema);
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        try
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
                        catch (Exception e)
                        {
                            // Console.WriteLine(e.Message);
                            uow.Rollback();
                        }
                    }
                }
            }
        }

        private static void syncTime()
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    var tables = session.Find<TableInfo>();
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        try
                        {
                            foreach (var table in tables)
                            {
                                // Console.WriteLine(">> Indexing: " + table.table_name);
                                string sql = $"UPDATE \"{table.table_schema}\".\"{table.table_name}\" SET created_at = '2022-11-30', updated_at = '2022-11-30';";
                                uow.Connection.Execute(sql);
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
        }

        private static void normalizeTable(string table_schema = "")
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        try
                        {
                            IEnumerable<InformationTable> dbTables = session.Query<InformationTable>(
                              $@"SELECT * FROM information_schema.tables 
                                    WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}) 
                                ORDER BY table_schema, table_name"
                            );
                            if (string.IsNullOrWhiteSpace(table_schema) == false)
                            {
                                dbTables = dbTables.Where(x => x.table_schema == table_schema);
                            }
                            foreach (var table in dbTables)
                            {
                                var columns = session.Query<InformationColumn>(
                                    $@"SELECT * FROM information_schema.columns 
                                        WHERE table_name = '{table.table_name}' AND table_schema = '{table.table_schema}'");
                                // Console.WriteLine(">> Normalize: " + table.table_name);
                                foreach (var col in columns)
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
                                    try
                                    {
                                        if (col.column_name.ToLower().Equals("shape"))
                                        {
                                            // Console.WriteLine(">> ESRI Geometry: " + col.column_name);
                                            uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"geom\";");
                                        }
                                        // if (col.column_name.ToLower().Equals("province_i"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"province_code\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("district_i"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"district_code\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("commune_i"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"commune_code\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("ngayvanhan"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"ngayvanhanh\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("donvivanha"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"donvivanhanh\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("donviquanl"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"donviquanly\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("sohieuduon"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"sohieuduong\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("matinh"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"province_code\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("mahuyen"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"district_code\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("maxa"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"commune_code\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("insert_time"))
                                        // {
                                        // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN \"{col.column_name}\";");
                                        // }
                                        if (col.column_name.ToLower().Equals("geom"))
                                        {
                                            string geometryType = uow.Connection.Query<string>($"SELECT ST_GeometryType(geom) FROM \"{table.table_schema}\".\"{table.table_name}\";").FirstOrDefault();
                                            // Console.WriteLine(geometryType);
                                        }
                                        // if (col.column_name.ToLower().Equals("last_update"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN \"{col.column_name}\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("province_id") || col.column_name.ToLower().Equals("district_id") 
                                        //     || col.column_name.ToLower().Equals("commune_id") || col.column_name.ToLower().Equals("tinhid")
                                        //     || col.column_name.ToLower().Equals("huyenid") || col.column_name.ToLower().Equals("xaid")
                                        //     || col.column_name.ToLower().Equals("insertdate") || col.column_name.ToLower().Equals("updatedate")
                                        // )
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN \"{col.column_name}\";");
                                        // }
                                        // if (col.column_name.ToLower().Equals("objectid"))
                                        // {
                                        //     uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" RENAME COLUMN \"{col.column_name}\" TO \"id\";");
                                        // }
                                    }
                                    catch (Exception ex)
                                    {
                                        // Console.WriteLine(ex.Message);
                                    }
                                }
                                // if (table.columns.Any(x => x.column_name == "created_at"))
                                // {
                                //     uow.Connection.Execute($"UPDATE \"{table.table_schema}\".\"{table.table_name}\" SET created_at = created_at");
                                // }
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS id_tinh;");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS id_huyen;");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS id_xa;");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS lon;");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS lat;");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS hinh_anh;");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS hinh_anh1;");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"SHAPE_Area\";");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"SHAPE_Length\";");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"OBJECTID\";");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"shape_area\";");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"shape_le_1\";");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"shape_leng\";");
                                // uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN IF EXISTS \"shape_length\";");
                                // }
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

        }

        private static void syncRegions(string table_schema = "")
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    var layers = getLayersWithTableAndColumn();
                    if (string.IsNullOrWhiteSpace(table_schema) == false)
                    {
                        layers = layers.Where(x => x.table.table_schema == table_schema);
                    }
                    // using (var uow = new UnitOfWork(dbFactory, session))
                    // {
                    try
                    {
                        foreach (var layer in layers)
                        {
                            if (layer.geometry == "Point" || layer.geometry == "MultiPoint")
                            {
                                // Console.WriteLine($"Syncing: {layer.table.table_schema}.{layer.table.table_name}");
                                try
                                {
                                    if (layer.table.columns.Any(x => x.column_name == "matinh"))
                                    {
                                        session.Connection.Execute($"UPDATE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" AS t set commune_code = maxa, district_code = mahuyen, province_code = matinh");
                                    }
                                    else if (layer.table.columns.Any(x => x.column_name == "matinh_1"))
                                    {
                                        session.Connection.Execute($"UPDATE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" AS t set commune_code = maxa_1, district_code = mahuyen_1, province_code = matinh_1");
                                    }
                                    else
                                    {
                                        session.Connection.Execute($"UPDATE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" AS t set commune_code = r.comid_2004, district_code = r.disid_2004, province_code = r.proid_2004 FROM (SELECT comid_2004, disid_2004, proid_2004, geom FROM regional.communes) AS r WHERE ST_WithIn(t.geom, r.geom);");
                                    }
                                }
                                catch (Exception e)
                                {
                                    // Console.WriteLine(e.Message);
                                }
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        // uow.Rollback();
                        // Console.WriteLine(e.Message);
                    }

                    // }
                }
            }
        }

        private static void indexSearch(string table_schema = "")
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    var layers = session.Find<Layer>(statement => statement.Include<TableInfo>());
                    if (string.IsNullOrWhiteSpace(table_schema) == false)
                    {
                        layers = layers.Where(x => x.table.table_schema == table_schema);
                    }
                    foreach (var layer in layers)
                    {
                        // Console.WriteLine($"Indexing: {layer.table.table_schema}.{layer.table.table_name}");
                        session.Connection.Execute($"UPDATE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" AS t SET commune_code = commune_code");
                    }
                }
            }
        }

        private static void addRegionColumn(string table_schema = "", bool dryrun = false)
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        IEnumerable<InformationTable> dbTables = session.Query<InformationTable>(
                            $@"SELECT * FROM information_schema.tables 
                                WHERE table_type = 'BASE TABLE'
                                AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}) 
                            ORDER BY table_schema, table_name"
                        );

                        if (string.IsNullOrWhiteSpace(table_schema) == false)
                        {
                            dbTables = dbTables.Where(x => x.table_schema == table_schema);
                        }

                        try
                        {
                            foreach (var dbTable in dbTables)
                            {
                                bool hasGeomColumn = session.Query<int>(
                                    $@"SELECT COUNT(1) FROM information_schema.columns 
                                            WHERE table_name = '{dbTable.table_name}'
                                            AND table_schema = '{dbTable.table_schema}'
                                            AND column_name = 'geom'"
                                ).FirstOrDefault() > 0;

                                if (hasGeomColumn == false)
                                {
                                    continue;
                                }

                                // Console.WriteLine($">> Checking region column: {dbTable.table_schema}.{dbTable.table_name}");
                                InformationColumn column = session.Query<InformationColumn>($@"
                                    SELECT *
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'district_code'
                                        AND t.table_schema = '{dbTable.table_schema}' 
                                        AND t.table_name = '{dbTable.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                if (column != null && column.data_type != "character varying")
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" DROP COLUMN \"district_code\"");
                                    column = null;
                                }
                                if (column == null)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" ADD COLUMN \"district_code\" character varying (50)");
                                }
                                column = session.Query<InformationColumn>($@"
                                    SELECT *
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'commune_code'
                                        AND t.table_schema = '{dbTable.table_schema}' 
                                        AND t.table_name = '{dbTable.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                if (column != null && column.data_type != "character varying")
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" DROP COLUMN \"commune_code\"");
                                    column = null;
                                }
                                if (column == null)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" ADD COLUMN \"commune_code\" character varying (50)");
                                }
                                column = session.Query<InformationColumn>($@"
                                    SELECT *
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'province_code'
                                        AND t.table_schema = '{dbTable.table_schema}' 
                                        AND t.table_name = '{dbTable.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                if (column != null && column.data_type != "character varying")
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" DROP COLUMN \"province_code\"");
                                    column = null;
                                }
                                if (column == null)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" ADD COLUMN \"province_code\" character varying (50)");
                                }
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
        }

        private static void addTimeColumn(string table_schema = "")
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        IEnumerable<InformationTable> dbTables = session.Query<InformationTable>(
                            $@"SELECT * FROM information_schema.tables 
                                WHERE table_type = 'BASE TABLE'
                                AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}) 
                            ORDER BY table_schema, table_name"
                        );

                        if (string.IsNullOrWhiteSpace(table_schema) == false)
                        {
                            dbTables = dbTables.Where(x => x.table_schema == table_schema);
                        }

                        try
                        {
                            foreach (var dbTable in dbTables)
                            {
                                // bool hasGeomColumn = session.Query<int>(
                                //     $@"SELECT COUNT(1) FROM information_schema.columns 
                                //             WHERE table_name = '{dbTable.table_name}'
                                //             AND table_schema = '{dbTable.table_schema}'
                                //             AND column_name = 'geom'"
                                // ).FirstOrDefault() > 0;

                                // if (hasGeomColumn == false)
                                // {
                                //     continue;
                                // }

                                // Console.WriteLine($">> Checking time column: {dbTable.table_schema}.{dbTable.table_name}");
                                InformationColumn column = session.Query<InformationColumn>($@"
                                    SELECT *
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'created_at'
                                        AND t.table_schema = '{dbTable.table_schema}' 
                                        AND t.table_name = '{dbTable.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                if (column == null)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" ADD COLUMN \"created_at\" timestamp without time zone;");
                                }
                                column = session.Query<InformationColumn>($@"
                                    SELECT *
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'updated_at'
                                        AND t.table_schema = '{dbTable.table_schema}' 
                                        AND t.table_name = '{dbTable.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                if (column == null)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" ADD COLUMN \"updated_at\" timestamp without time zone;");
                                }

                                int countTriggerInsert = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM  information_schema.triggers
                                    WHERE event_object_table = '{dbTable.table_name}' 
                                        AND event_object_schema = '{dbTable.table_schema}' 
                                        AND trigger_name = 'trigger_update_created_at'
                                
                                ").FirstOrDefault();
                                if (countTriggerInsert == 0)
                                {
                                    string sql = $"CREATE TRIGGER trigger_update_created_at BEFORE INSERT ON \"{dbTable.table_schema}\".\"{dbTable.table_name}\" FOR EACH ROW EXECUTE PROCEDURE update_created_at();";
                                    uow.Connection.Execute(sql);
                                }
                                int countTriggerUpdate = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM  information_schema.triggers
                                    WHERE event_object_table = '{dbTable.table_name}' 
                                        AND event_object_schema = '{dbTable.table_schema}' 
                                        AND trigger_name = 'trigger_update_updated_at'
                                
                                ").FirstOrDefault();
                                if (countTriggerUpdate == 0)
                                {
                                    string sql = $"CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON \"{dbTable.table_schema}\".\"{dbTable.table_name}\" FOR EACH ROW EXECUTE PROCEDURE update_updated_at();";
                                    uow.Connection.Execute(sql);
                                }
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
        }

        private static void addSearchContent(string table_schema = "")
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        IEnumerable<InformationTable> dbTables = session.Query<InformationTable>(
                            $@"SELECT * FROM information_schema.tables 
                                WHERE table_type = 'BASE TABLE'
                                AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}) 
                            ORDER BY table_schema, table_name"
                        );

                        if (string.IsNullOrWhiteSpace(table_schema) == false)
                        {
                            dbTables = dbTables.Where(x => x.table_schema == table_schema);
                        }

                        try
                        {
                            foreach (var dbTable in dbTables)
                            {
                                // bool hasGeomColumn = session.Query<int>(
                                //     $@"SELECT COUNT(1) FROM information_schema.columns 
                                //             WHERE table_name = '{dbTable.table_name}'
                                //             AND table_schema = '{dbTable.table_schema}'
                                //             AND column_name = 'geom'"
                                // ).FirstOrDefault() > 0;

                                // if (hasGeomColumn == false)
                                // {
                                //     continue;
                                // }

                                // Console.WriteLine($">> Checking search column: {dbTable.table_schema}.{dbTable.table_name}");
                                InformationColumn column = session.Query<InformationColumn>($@"
                                    SELECT *
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'search_content'
                                        AND t.table_schema = '{dbTable.table_schema}' 
                                        AND t.table_name = '{dbTable.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                if (column == null)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{dbTable.table_schema}\".\"{dbTable.table_name}\" ADD COLUMN \"search_content\" tsvector;");
                                }
                                int countTriggerInsert = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM  information_schema.triggers
                                    WHERE event_object_table = '{dbTable.table_name}' 
                                        AND event_object_schema = '{dbTable.table_schema}' 
                                        AND trigger_name = 'update_search_content'
                                ").FirstOrDefault();
                                if (countTriggerInsert == 0)
                                {
                                    string sql = $"CREATE TRIGGER update_search_content BEFORE INSERT OR UPDATE ON \"{dbTable.table_schema}\".\"{dbTable.table_name}\" FOR EACH ROW EXECUTE PROCEDURE update_search_content();";
                                    uow.Connection.Execute(sql);
                                }
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
        }

        private static void addDeleteColumn()
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    var layers = session.Find<Layer>(statement => statement.Include<TableInfo>(join => join.InnerJoin()));
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        try
                        {
                            foreach (var layer in layers)
                            {
                                int countDelete = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'is_delete'
                                        AND t.table_schema = '{layer.table.table_schema}' 
                                        AND t.table_name = '{layer.table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                // Console.WriteLine($">> {layer.table.table_name}: {countDelete}");
                                if (countDelete == 0)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ADD COLUMN \"is_delete\" Boolean DEFAULT FALSE");
                                }
                                else
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ALTER COLUMN \"is_delete\" SET DEFAULT FALSE");
                                }
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
        }
        private static void addCreateByColumn()
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    var layers = session.Find<Layer>(statement => statement.Include<TableInfo>(join => join.InnerJoin()));
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        try
                        {
                            foreach (var layer in layers)
                            {
                                Console.WriteLine($">> Checking {layer.name_vn}");
                                int count = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'created_by'
                                        AND t.table_schema = '{layer.table.table_schema}' 
                                        AND t.table_name = '{layer.table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                // Console.WriteLine($">> {layer.table.table_name}: {count}");
                                if (count == 0)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ADD COLUMN \"created_by\" varchar(36) NULL");
                                }

                                var tableColumn = new TableColumn()
                                {
                                    column_name = "created_by",
                                    character_max_length = 36,
                                    name_en = "created_by",
                                    name_vn = "Người khởi tạo",
                                    data_type = EnumPgDataType.String,
                                    is_identity = false,
                                    is_nullable = false,
                                    require = false,
                                    visible = false,
                                    permanent = true,
                                    table_id = layer.table.id
                                };
                                count = session.Count<TableColumn>(x => x
                                .Where($"{Sql.Entity<TableColumn>(x => x.column_name):TC} = @column_name AND {Sql.Entity<TableColumn>(x => x.table_id):TC} = @table_id")
                                .WithParameters(tableColumn));
                                if (count == 0)
                                {
                                    uow.Connection.Insert(tableColumn);
                                }
                                //
                                count = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'updated_by'
                                        AND t.table_schema = '{layer.table.table_schema}' 
                                        AND t.table_name = '{layer.table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                // Console.WriteLine($">> {layer.table.table_name}: {count}");
                                if (count == 0)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ADD COLUMN \"updated_by\" varchar(36) NULL");
                                }

                                tableColumn = new TableColumn()
                                {
                                    column_name = "updated_by",
                                    character_max_length = 36,
                                    name_en = "updated_by",
                                    name_vn = "Người cập nhật",
                                    data_type = EnumPgDataType.String,
                                    is_identity = false,
                                    is_nullable = false,
                                    require = false,
                                    visible = false,
                                    permanent = true,
                                    table_id = layer.table.id
                                };
                                count = session.Count<TableColumn>(x => x
                                .Where($"{Sql.Entity<TableColumn>(x => x.column_name):TC} = @column_name AND {Sql.Entity<TableColumn>(x => x.table_id):TC} = @table_id")
                                .WithParameters(tableColumn));
                                if (count == 0)
                                {
                                    uow.Connection.Insert(tableColumn);
                                }
                            }
                        }
                        catch (Exception e)
                        {
                            uow.Rollback();
                            Console.WriteLine(e.Message);
                        }

                    }
                }
            }
        }
        private static void addIsApprovedColumn()
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    var layers = session.Find<Layer>(statement => statement.Include<TableInfo>(join => join.InnerJoin()));
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        try
                        {
                            foreach (var layer in layers)
                            {
                                int count = session.Query<int>($@"
                                    SELECT COUNT(1)
                                    FROM information_schema.tables t
                                    INNER JOIN information_schema.columns c ON c.table_name = t.table_name
                                        AND c.table_schema = t.table_schema
                                    WHERE c.column_name = 'is_approved'
                                        AND t.table_schema = '{layer.table.table_schema}' 
                                        AND t.table_name = '{layer.table.table_name}'
                                        AND t.table_type = 'BASE TABLE'
                                ").FirstOrDefault();
                                // Console.WriteLine($">> {layer.table.table_name}: {count}");
                                if (count == 0)
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ADD COLUMN \"is_approved\" Boolean DEFAULT FALSE");
                                }
                                else
                                {
                                    uow.Connection.Execute($"ALTER TABLE \"{layer.table.table_schema}\".\"{layer.table.table_name}\" ALTER COLUMN \"is_approved\" SET DEFAULT FALSE");
                                }

                                var tableColumn = new TableColumn()
                                {
                                    column_name = "is_approved",
                                    character_max_length = 0,
                                    name_en = "is_approved",
                                    name_vn = "Phê duyệt",
                                    data_type = EnumPgDataType.Boolean,
                                    is_identity = false,
                                    is_nullable = false,
                                    require = false,
                                    visible = false,
                                    permanent = true,
                                    table_id = layer.table.id
                                };
                                count = session.Count<TableColumn>(x => x
                                .Where($"{Sql.Entity<TableColumn>(x => x.column_name):TC} = @column_name AND {Sql.Entity<TableColumn>(x => x.table_id):TC} = @table_id")
                                .WithParameters(tableColumn));
                                if (count == 0)
                                {
                                    uow.Connection.Insert(tableColumn);
                                }
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
        }

        private static void GetTileRect(int x, int y, int zoom)
        {
            var tilesAtThisZoom = 1 << zoom;
            var lngWidth = 360.0 / tilesAtThisZoom;
            double leftLong = -180.0 + (x * lngWidth);
            double rightLong = leftLong + lngWidth;

            var latHeightMerc = 1.0 / tilesAtThisZoom;
            var topLatMerc = y * latHeightMerc;
            var bottomLatMerc = topLatMerc + latHeightMerc;

            double bottomLat = (180.0 / Math.PI) * ((2.0 * Math.Atan(Math.Exp(Math.PI * (1.0 - (2.0 * bottomLatMerc))))) - (Math.PI / 2.0));
            double topLat = (180.0 / Math.PI) * ((2.0 * Math.Atan(Math.Exp(Math.PI * (1.0 - (2.0 * topLatMerc))))) - (Math.PI / 2.0));

            // Console.WriteLine($"{leftLong} {rightLong} {bottomLat} {topLat}");
        }

        public class GeometryColumn
        {
            public string type { get; set; }
            public int coord_dimension { get; set; }
            public int srid { get; set; }
        }

        private static void updateGeomType(string table_schema = "")
        {
            IEnumerable<Layer> layers = getLayersWithTableAndColumn(table_schema);

            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        foreach (var layer in layers)
                        {
                            try
                            {
                                GeometryColumn geomtype = session.Query<GeometryColumn>($@"
                                    SELECT type, coord_dimension, srid
                                    FROM geometry_columns
                                    WHERE f_table_schema = '{layer.table.table_schema}'
                                        AND f_table_name = '{layer.table.table_name}'
                                        AND f_geometry_column = 'geom';
                                ").FirstOrDefault();
                                // Console.WriteLine($"{layer.table.table_name},{geomtype.type} ({geomtype.coord_dimension}D)");
                                if (geomtype.type.ToUpper() == "LINESTRING")
                                {
                                    layer.geometry = "LineString";
                                    layer.order = 3;
                                }
                                else if (geomtype.type.ToUpper() == "MULTILINESTRING")
                                {
                                    layer.geometry = "MultiLineString";
                                    layer.order = 4;
                                }
                                else if (geomtype.type.ToUpper() == "POINT")
                                {
                                    layer.geometry = "Point";
                                    layer.order = 1;
                                }
                                else if (geomtype.type.ToUpper() == "MULTIPOINT")
                                {
                                    layer.geometry = "MultiPoint";
                                    layer.order = 2;
                                }
                                else if (geomtype.type.ToUpper() == "POLYGON")
                                {
                                    layer.geometry = "Polygon";
                                    layer.order = 5;
                                }
                                else if (geomtype.type.ToUpper() == "MULTIPOLYGON")
                                {
                                    layer.geometry = "MultiPolygon";
                                    layer.order = 6;
                                }
                                layer.dimension = geomtype.coord_dimension;
                                uow.Connection.Update(layer);
                            }
                            catch (Exception e)
                            {
                                uow.Rollback();
                                // Console.WriteLine(e.Message);
                            }
                        }
                    }
                }
            }
        }

        private static async Task clearData()
        {
            IEnumerable<Layer> layers = getLayersWithTableAndColumn();

            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    foreach (var layer in layers)
                    {
                        try
                        {
                            string geomtype = session.Query<string>($@"
                                    SELECT type
                                    FROM geometry_columns
                                    WHERE f_table_schema = '{layer.table.table_schema}'
                                        AND f_table_name = '{layer.table.table_name}'
                                        AND f_geometry_column = 'geom';
                                ").FirstOrDefault();
                            if (geomtype.ToUpper() == "LINESTRING" || geomtype.ToUpper() == "MULTILINESTRING")
                            {
                            }
                            else if (geomtype.ToUpper() == "POINT")
                            {

                            }
                            else if (geomtype.ToUpper() == "POLYGON" || geomtype.ToUpper() == "MULTIPOLYGON")
                            {
                                // Console.WriteLine($"DELETING >> {layer.table.table_schema}.{layer.table.table_name}");
                                session.Execute($"DELETE FROM {layer.table.table_schema}.{layer.table.table_name};");
                            }
                        }
                        catch (Exception e)
                        {
                            // Console.WriteLine(e.Message);
                        }
                    }
                }
            }
        }

        public async System.Threading.Tasks.Task<IEnumerable<InformationTable>> listFromDbAsync()
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    return await session.QueryAsync<InformationTable>(
                        $"SELECT * FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}) ORDER BY table_schema, table_name"
                    );
                }
            }
        }

        public static void syncWithDbAsync(string table_schema = "", bool dryrun = false)
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        var tables = session.Find<TableInfo>();
                        if (string.IsNullOrWhiteSpace(table_schema) == false)
                        {
                            tables = tables.Where(x => x.table_schema == table_schema);
                        }
                        foreach (var table in tables)
                        {
                            if (session.Query<bool>($"SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_schema = '{table.table_schema}' AND table_name = '{table.table_name}'  AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}));").FirstOrDefault() == false)
                            {
                                if (dryrun == false)
                                {
                                    uow.Delete(table);
                                }
                                // Console.WriteLine($">> Deleted table: \"{table.table_schema}\".\"{table.table_name}\"");
                            }
                        }
                    }
                    IEnumerable<InformationTable> dbTables = session.Query<InformationTable>(
                        $"SELECT * FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ({string.Join(",", _excluded_schema.Select(x => $"'{x}'"))}) ORDER BY table_schema, table_name"
                    );
                    if (string.IsNullOrWhiteSpace(table_schema) == false)
                    {
                        dbTables = dbTables.Where(x => x.table_schema == table_schema);
                    }
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        foreach (var info in dbTables)
                        {
                            int count = session.Count<TableInfo>(statement =>
                                statement.Where(
                                        $"{nameof(TableInfo.table_name)}=@table_name AND {nameof(TableInfo.table_schema)}=@table_schema")
                                    .WithParameters(info));
                            if (count == 0)
                            {
                                if (dryrun == false)
                                {
                                    uow.Connection.Insert(new TableInfo()
                                    {
                                        table_schema = info.table_schema,
                                        table_name = info.table_name,
                                        name_en = info.table_name,
                                        name_vn = info.table_name
                                    });
                                }

                                // Console.WriteLine($">> New table: {info.table_schema}.{info.table_name}");
                            }
                        }
                    }
                }
            }
        }

        private static void syncLayers(string table_schema = "")
        {
            var tables = getTablesAndColumns(table_schema).Where(x => x.columns.Any(o => o.column_name == "geom")).OrderBy(x => x.name_vn);
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    using (var uow = new UnitOfWork(dbFactory, session))
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

                    using (var uow = new UnitOfWork(dbFactory, session))
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
            }
        }

        private static void syncColumns(string table_schema = "", bool dryrun = false)
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    IDictionary<string, object> data = new Dictionary<string, object>();
                    IEnumerable<TableInfo> tables = session.Find<TableInfo>();
                    if (string.IsNullOrWhiteSpace(table_schema) == false)
                    {
                        tables = tables.Where(x => x.table_schema == table_schema);
                    }
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        try
                        {
                            foreach (var table in tables)
                            {
                                // Console.WriteLine($">> Syncing columns: \"{table.table_schema}\".\"{table.table_name}\"");
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
                                        // Console.WriteLine($"--> \"{table.table_schema}\".\"{table.table_name}\" - Deleted columns: {string.Join(",", deleteCols.Select(x => x.column_name))}");
                                        if (dryrun == false)
                                        {
                                            sql = $"DELETE FROM {Sql.Table<TableColumn>()} WHERE {Sql.TableAndColumn<TableColumn>(nameof(TableColumn.id))} IN ({String.Join(",", deleteCols.Select(x => x.id))})";
                                            uow.Connection.Execute(sql);
                                        }
                                    }
                                }

                                foreach (var column in columns)
                                {
                                    if (column.column_name == "search_content")
                                        continue;
                                    var tableColumn = session.Find<TableColumn>(statement =>
                                        statement.Where(
                                            $"{nameof(TableColumn.column_name):C}='{column.column_name}' AND {nameof(TableColumn.table_id):C}={table.id}"
                                            )).FirstOrDefault();
                                    if (tableColumn == null)
                                    {
                                        // Console.WriteLine($"--> \"{table.table_schema}\".\"{table.table_name}\" - Create column: {column.column_name}");
                                        if (dryrun == false)
                                        {
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
                                                visible = true,
                                                permanent = true,
                                                table_id = table.id
                                            };
                                            //
                                            uow.Connection.Insert(tableColumn);
                                        }
                                    }
                                    else
                                    {
                                        if (dryrun == false)
                                        {
                                            Console.Write($".");
                                            tableColumn.character_max_length = column.character_maximum_length == null ? 0 : column.character_maximum_length.Value;
                                            tableColumn.data_type = column.data_type;
                                            tableColumn.is_identity = pkeyColumn?.ToLower().Equals(column.column_name.ToLower()) ?? false;
                                            tableColumn.is_nullable = "YES".Equals(column.is_nullable);
                                            tableColumn.require = "NO".Equals(column.is_nullable);
                                            //
                                            uow.Connection.Update(tableColumn);
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception e)
                        {
                            uow.Rollback();
                            // Console.WriteLine(e);
                        }
                    }
                }
            }
        }

        private static async Task syncDomains(string tableSchema = "")
        {
            // List<Layer> layers = getLayersWithTableAndColumn().ToList();
            //
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    List<TableInfo> tables = session.Find<TableInfo>(statement => statement.Include<TableColumn>()).ToList();

                    if (string.IsNullOrWhiteSpace(tableSchema) == false)
                    {
                        tables = tables.Where(x => x.table_schema == tableSchema).ToList();
                    }
                    //
                    string sql = $@"
                    SELECT
                        tc.table_schema, 
                        tc.constraint_name, 
                        tc.table_name, 
                        kcu.column_name, 
                        ccu.table_schema AS foreign_table_schema,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name 
                    FROM 
                        information_schema.table_constraints AS tc 
                        JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema NOT IN ('identity') ORDER BY table_name
                ";
                    //
                    IEnumerable<InformationConstraint> constraints = session.Query<InformationConstraint>(sql);
                    // string sqlExist =
                    //     $"SELECT COUNT(1) FROM {Sql.Table<LayerDomain>()} WHERE {nameof(LayerDomain.layer_id)} = @layer_id AND {nameof(LayerDomain.table_id)} = @table_id AND {nameof(LayerDomain.column_id)} = @column_id";
                    // sql =
                    //     $"INSERT INTO {Sql.Table<LayerDomain>()} ({nameof(LayerDomain.layer_id)},{nameof(LayerDomain.table_id)},{nameof(LayerDomain.column_id)}) VALUES (@layer_id, @table_id, @column_id)";
                    using (var uow = new UnitOfWork(dbFactory, session))
                    {
                        foreach (var constraint in constraints)
                        {
                            TableInfo table = tables.FirstOrDefault(x =>
                                x.table_name == constraint.table_name && x.table_schema == constraint.table_schema);
                            TableInfo fkTable = tables.FirstOrDefault(x =>
                                x.table_name == constraint.foreign_table_name &&
                                x.table_schema == constraint.foreign_table_schema);
                            // Layer fkLayer = layers.FirstOrDefault(x =>
                            //     x.table.table_name == constraint.foreign_table_name &&
                            //     x.table.table_schema == constraint.foreign_table_schema);
                            //
                            if (table != null && fkTable != null)
                            {
                                TableColumn column =
                                    table.columns.FirstOrDefault(x => x.column_name == constraint.column_name);
                                TableColumn fkColumn = fkTable.columns.FirstOrDefault(x =>
                                    x.column_name == constraint.foreign_column_name);
                                if (column != null && column.is_identity == false)
                                {
                                    column.has_category = true;
                                    column.lookup_table_id = fkTable.id;
                                    //
                                    uow.Connection.Update(column);
                                }
                            }
                        }

                        // Layer layer = layers.FirstOrDefault(x => x.table.table_name == constraint.table_name && x.table.table_schema == constraint.table_schema);
                        // TableInfo table = tables.FirstOrDefault(x => x.table_name == constraint.foreign_table_name && x.table_schema == constraint.foreign_table_schema);
                        // if (layer != null && table != null)
                        // {
                        //     TableColumn column = layer.table.columns.FirstOrDefault(x => x.column_name == constraint.column_name);
                        //     if (column != null)
                        //     {
                        //         int count = session.Query<int>(sqlExist, new
                        //         {
                        //             layer_id = layer.id,
                        //             column_id = column.id,
                        //             table_id = table.id
                        //         }).FirstOrDefault();
                        //         using (var uow = new UnitOfWork(DbFactory, session))
                        //         {
                        //             if (count == 0)
                        //             {
                        //                 uow.Connection.Execute(sql, new
                        //                 {
                        //                     layer_id = layer.id,
                        //                     column_id = column.id,
                        //                     table_id = table.id
                        //                 });
                        //             }
                        //             //
                        //             column.has_category = true;
                        //             uow.Connection.Update(column);
                        //         }
                        //     }
                        // }
                    }
                }
            }
        }

        private static async Task syncRelations()
        {
            List<Layer> layers = getLayersWithTableAndColumn().ToList();
            //
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    List<TableInfo> tables = session.Find<TableInfo>(statement => statement.Include<TableColumn>())
                        .ToList();
                    //
                    string sql = $@"
                    SELECT
                        tc.table_schema, 
                        tc.constraint_name, 
                        tc.table_name, 
                        kcu.column_name, 
                        ccu.table_schema AS foreign_table_schema,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name 
                    FROM 
                        information_schema.table_constraints AS tc 
                        JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema NOT IN ('identity') ORDER BY table_name
                ";
                    //
                    IEnumerable<InformationConstraint> constraints = session.Query<InformationConstraint>(sql);
                    string sqlExist =
                        $"SELECT COUNT(1) FROM {Sql.Table<TableRelation>()} WHERE {nameof(TableRelation.mediate_table_id)} = @mediate_table_id AND {nameof(TableRelation.relation_table_column_id)} = @relation_table_column_id AND {nameof(TableRelation.relation_table_id)} = @relation_table_id AND {nameof(TableRelation.table_column_id)} = @table_column_id AND {nameof(TableRelation.table_id)} = @table_id ";
                    sql =
                        $"INSERT INTO {Sql.Table<TableRelation>()} ({nameof(TableRelation.mediate_table_id)},{nameof(TableRelation.relation_table_column_id)},{nameof(TableRelation.relation_table_id)},{nameof(TableRelation.table_column_id)},{nameof(TableRelation.table_id)}) VALUES (@mediate_table_id, @relation_table_column_id, @relation_table_id, @table_column_id, @table_id)";
                    foreach (var constraint in constraints)
                    {
                        Layer layer = layers.FirstOrDefault(x =>
                            x.table.table_name == constraint.foreign_table_name &&
                            x.table.table_schema == constraint.foreign_table_schema);
                        if (layer != null)
                        {
                            IEnumerable<InformationConstraint> mediates = constraints.Where(x =>
                                x.table_name == constraint.table_name
                                && x.table_schema == constraint.table_schema
                                && x.foreign_table_schema == constraint.foreign_table_schema
                                && x.foreign_table_name != constraint.foreign_table_name
                            );
                            InformationConstraint mediate = constraints.FirstOrDefault(x =>
                                x.table_name == constraint.table_name
                                && x.table_schema == constraint.table_schema
                                && x.foreign_table_schema == constraint.foreign_table_schema
                                && x.foreign_table_name != constraint.foreign_table_name);
                            if (mediate != null)
                            {
                                TableInfo tableRelation = tables.FirstOrDefault(x =>
                                    x.table_name == mediate.foreign_table_name &&
                                    x.table_schema == mediate.foreign_table_schema);
                                TableInfo tableMediate = tables.FirstOrDefault(x =>
                                    x.table_name == mediate.table_name && x.table_schema == mediate.table_schema);
                                if (tableRelation != null && tableMediate != null)
                                {
                                    TableColumn column =
                                        tableMediate.columns.FirstOrDefault(
                                            x => x.column_name == constraint.column_name);
                                    TableColumn columnRelation =
                                        tableMediate.columns.FirstOrDefault(x => x.column_name == mediate.column_name);
                                    if (column != null && columnRelation != null)
                                    {
                                        using (var uow = new UnitOfWork(dbFactory, session))
                                        {
                                            int count = session.Query<int>(sqlExist, new
                                            {
                                                mediate_table_id = tableMediate.id,
                                                relation_table_column_id = columnRelation.id,
                                                relation_table_id = tableRelation.id,
                                                table_column_id = column.id,
                                                table_id = layer.table.id
                                            }).FirstOrDefault();
                                            if (count == 0)
                                            {
                                                uow.Connection.Execute(sql, new
                                                {
                                                    mediate_table_id = tableMediate.id,
                                                    relation_table_column_id = columnRelation.id,
                                                    relation_table_id = tableRelation.id,
                                                    table_column_id = column.id,
                                                    table_id = layer.table.id
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        private Layer getLayerWithTable(int id)
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    return session.Find<Layer>(statement =>
                            statement.Where($"{nameof(Layer.id):C}={id}")
                                .Include<TableInfo>(join => join.InnerJoin())
                                .Include<LayerClassify>(join => join.LeftOuterJoin())
                        )
                        .FirstOrDefault();
                }
            }
        }

        private Layer getLayerWithTableAndColumn(int id)
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    return session.Find<Layer>(statement =>
                            statement.Where($"{nameof(Layer.id):C}={id}").Include<TableInfo>(join => join.InnerJoin())
                                .Include<TableColumn>(join => join.InnerJoin())
                                .OrderBy($"{Sql.TableAndColumn<TableColumn>(nameof(TableColumn.order))}")
                                .Include<LayerClassify>(join => join.LeftOuterJoin())
                        )
                        .FirstOrDefault();
                }
            }
        }

        private static IEnumerable<Layer> getLayersWithTableAndColumn(string schema = "")
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    if (string.IsNullOrWhiteSpace(schema))
                    {
                        return session.Find<Layer>(statement =>
                            statement.Include<TableInfo>(join => join.InnerJoin())
                                .Include<TableColumn>(join => join.InnerJoin())
                                .Include<LayerClassify>(join => join.LeftOuterJoin())
                        );
                    }
                    else
                    {
                        return session.Find<Layer>(statement =>
                            statement.Include<TableInfo>(join => join.InnerJoin())
                                .Include<TableColumn>(join => join.InnerJoin())
                                .Where($"{nameof(TableInfo.table_schema)} = '{schema}'")
                                .Include<LayerClassify>(join => join.LeftOuterJoin())
                        );
                    }
                }
            }
        }

        private Layer getLayer(int id)
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    return session.Find<Layer>(statement =>
                            statement.Where($"{nameof(Layer.id):C}={id}")
                                .Include<LayerClassify>(join => join.LeftOuterJoin())
                        )
                        .FirstOrDefault();
                }
            }
        }

        private static TableInfo getTableAndColumns(int id)
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    return session.Find<TableInfo>(statement =>
                        statement.Where($"{nameof(TableInfo.id):C}={id}")
                            .Include<TableColumn>(join => join.LeftOuterJoin())
                            .OrderBy($"{nameof(TableColumn.order):TC}")
                        ).FirstOrDefault();
                }
            }
        }

        private static IEnumerable<TableInfo> getTablesAndColumns(string schema)
        {
            using (var scope = Container.BeginLifetimeScope())
            {
                var dbFactory = scope.Resolve<IDbFactory>();
                //
                using (var session = dbFactory.Create<IServiceSession>())
                {
                    if (string.IsNullOrWhiteSpace(schema))
                    {
                        return session.Find<TableInfo>(statement =>
                        statement.Include<TableColumn>(join => join.LeftOuterJoin())
                            .OrderBy($"{nameof(TableColumn.order):TC}")
                        );
                    }
                    else
                    {
                        return session.Find<TableInfo>(statement =>
                        statement.Where($"{nameof(TableInfo.table_schema):C}='{schema}'")
                            .Include<TableColumn>(join => join.LeftOuterJoin())
                            .OrderBy($"{nameof(TableColumn.order):TC}")
                        );
                    }
                }
            }
        }
        #endregion
    }
}