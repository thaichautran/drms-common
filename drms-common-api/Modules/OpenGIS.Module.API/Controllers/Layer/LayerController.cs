using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.Entities;
using System.IO;
using NetTopologySuite.IO.Streams;
using OpenGIS.Module.Core.Models;
using System.Text;
using ICSharpCode.SharpZipLib.Zip;
using ICSharpCode.SharpZipLib.Core;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Identity.Managers;
using Microsoft.AspNetCore.Identity;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using System.IO.Compression;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Enums;
using StringHelper = VietGIS.Infrastructure.Helpers.StringHelper;
using SharpKml.Base;
using System.Globalization;
using OGR = OSGeo.OGR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.StaticFiles;
using VietGIS.Infrastructure.Identity.PostgreSQL.Models;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Repositories.Implements;
using OpenGIS.Module.Core.Repositories;
using OpenGIS.Module.Core.ViewModels;
using OpenGIS.Module.Core.Extensions;
using VietGIS.Infrastructure.Abstractions;
using EasyCaching.Core;
using Microsoft.Extensions.Logging;
using OSGeo.OSR;
using SharpCompress.Readers;
using SharpCompress.Common;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_LAYER))]
    public partial class LayerController : BaseController
    {
        protected readonly ILayerRepository _layerRepository;
        protected readonly ILayerGroupRepository _layerGroupRepository;
        protected readonly ILayerClassifyRepository _layerClassifyRepository;
        protected readonly IMapLayersRepository _mapLayersRepository;
        protected readonly ITableRepository _tableRepository;
        private readonly ApplicationUserManager _userManager;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly IWorkContext _workContext;
        private readonly ILogger<LayerController> _logger;
        // private readonly IEasyCachingProvider _cacheProvider;
        public LayerController(IDbFactory dbFactory,
            ILayerRepository layerRepository,
            ILayerGroupRepository layerGroupRepository,
            ILayerClassifyRepository layerClassifyRepository,
            IMapLayersRepository mapLayersRepository,
            ITableRepository tableRepository,
            UserManager<ApplicationUser> userManager,
            IWebHostEnvironment hostEnvironment,
            IWorkContext workContext,
            ILogger<LayerController> logger
            // IEasyCachingProviderFactory factory
            )
            : base(dbFactory)
        {
            _layerGroupRepository = layerGroupRepository;
            _layerRepository = layerRepository;
            _layerClassifyRepository = layerClassifyRepository;
            _mapLayersRepository = mapLayersRepository;
            _tableRepository = tableRepository;
            _userManager = (ApplicationUserManager)userManager;
            _hostEnvironment = hostEnvironment;
            _workContext = workContext;
            _logger = logger;
            // _cacheProvider = factory.GetCachingProvider("redis1");
        }

        List<string> _defaultFields = new List<string>{
                "objectid",
                "id",
                "is_delete",
                "is_approved",
                "created_at",
                "created_by",
                "updated_at",
                "updated_by",
                "approved_at",
                "approved_by",
                "search_content",
                "province_code",
                "district_code",
                "commune_code",
                "geom"
        };

        [HttpGet("{id}")]
        public RestBase Get([FromRoute] int id)
        {
            return new RestData()
            {
                data = getLayerWithTableAndColumn(id)
            };
        }

        [HttpGet("getLayers")]
        public RestBase GetLayers([FromQuery] string? schema = "", string? keyword = "", int? mapId = 0, bool returnFullInfo = true)
        {
            var data = _mapLayersRepository.getLayersWithTableAndColumn(schema, keyword, mapId.Value, returnFullInfo).ToList();

            if (returnFullInfo)
            {
                data.ForEach(x => x.data_domains = getDomainValues(x));
            }

            return new RestData()
            {
                data = data
            };
        }

        [AllowAnonymous]
        [HttpPost("{id}/setSLDStyles")]
        public RestBase setSLDStyle([FromRoute] int id, [FromBody] string? sld)
        {
            if (id == 0 || string.IsNullOrWhiteSpace(sld))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            using (var session = OpenSession())
            {
                Layer? layer = getLayer(id);
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
                    layer.sld_styles = sld;
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        if (_layerRepository.SaveOrUpdate(layer, uow) > 0)
                            return new RestBase("OK");
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                }
            }
        }

        [HttpPost("{id}/setStyle")]
        public RestBase setStyle([FromRoute] int id, [FromForm] LayerStyleViewModel? item)
        {
            if (id == 0 || item == null || string.IsNullOrWhiteSpace(item.style))
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
                    Layer? layer = getLayer(id);
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
                        layer.styles = item.style;
                        if (item.anchorX.HasValue)
                        {
                            layer.styles_anchor_x = item.anchorX.Value;
                        }
                        if (item.anchorY.HasValue)
                        {
                            layer.styles_anchor_y = item.anchorY.Value;
                        }

                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            if (_layerRepository.SaveOrUpdate(layer, uow) > 0)
                                return new RestBase(EnumErrorCode.OK);
                            return new RestError(EnumErrorCode.ERROR)
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng kiểm tra lại!" }
                                }
                            };
                        }
                    }
                }
            }
        }

        [HttpPost("{id}/setLabelStyle")]
        public RestBase setLabelStyle([FromRoute] int id, [FromForm] LayerLabelStyleViewModel? item)
        {
            if (id == 0 || item == null || string.IsNullOrWhiteSpace(item.style))
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
                    Layer? layer = getLayer(id);
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
                        layer.label_styles = item.style;
                        if (item.is_label_visible.HasValue)
                        {
                            layer.is_label_visible = item.is_label_visible.Value;
                        }

                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            if (_layerRepository.SaveOrUpdate(layer, uow) > 0)
                                return new RestBase(EnumErrorCode.OK);
                            return new RestError(EnumErrorCode.ERROR)
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng kiểm tra lại!" }
                                }
                            };
                        }
                    }
                }
            }
        }

        private DbaseFileHeader GetHeader(IFeature feature, int count, List<TableColumn> tableColumns)
        {
            IAttributesTable attribs = feature.Attributes;
            string[] names = attribs.GetNames();
            DbaseFileHeader header = new DbaseFileHeader();
            header.NumRecords = count;
            foreach (string name in names)
            {
                Type type = attribs.GetType(name);
                if (type == typeof(double) || type == typeof(float))
                    header.AddColumn(name, 'N', DoubleLength, DoubleDecimals);
                else if (type == typeof(short) || type == typeof(ushort) ||
                         type == typeof(int) || type == typeof(uint) ||
                         type == typeof(long) || type == typeof(ulong))
                    header.AddColumn(name, 'N', IntLength, IntDecimals);
                else if (type == typeof(string))
                    header.AddColumn(name, 'C', StringLength, StringDecimals);
                else if (type == typeof(bool))
                    header.AddColumn(name, 'L', BoolLength, BoolDecimals);
                else
                    header.AddColumn(name, 'D', DateLength, DateDecimals);
            }

            return header;
        }

        private const int DoubleLength = 18;
        private const int DoubleDecimals = 8;
        private const int IntLength = 18;
        private const int IntDecimals = 0;
        private const int StringLength = 254;
        private const int StringDecimals = 0;
        private const int BoolLength = 1;
        private const int BoolDecimals = 0;
        private const int DateLength = 8;
        private const int DateDecimals = 0;

        private FileContentResult toShp(Layer layer)
        {
            using (var session = OpenSession())
            {
                string shpName = Path.GetTempFileName();
                shpName = Path.ChangeExtension(shpName, "shp");
                string shxName = Path.GetTempFileName();
                shxName = Path.ChangeExtension(shxName, "shx");
                string dbfName = Path.GetTempFileName();
                dbfName = Path.ChangeExtension(dbfName, "dbf");

                IStreamProvider shapeStream = new FileStreamProvider(StreamTypes.Shape, shpName);
                IStreamProvider dataStream = new FileStreamProvider(StreamTypes.Data, dbfName);
                IStreamProvider idxStream = new FileStreamProvider(StreamTypes.Index, shxName);
                //
                IStreamProviderRegistry streamProviderRegistry =
                    new ShapefileStreamProviderRegistry(shapeStream, dataStream, idxStream);
                GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                //MssqlService mssqlService = new MssqlService(_dbFactory);
                string sql =
                    @$"SELECT {String.Join(',', layer.table.columns.Where(x => "geom".Equals(x.column_name) == false).Select(x => x.column_name))},ST_AsGeoJSON(geom) AS geom
                    FROM {layer.table.table_schema}.{layer.table.table_name}";
                var rows = session
                    .Query(sql)
                    .ToList();
                //var rows = mssqlService.QueryToDictationary($"SELECT {queryField} FROM {layer.TableName}");

                var wktReader = new WKTReader(geometryFactory);

                List<IFeature> features = new List<IFeature>();

                foreach (Dictionary<string, object> row in rows)
                {
                    var attributes = new AttributesTable();
                    foreach (string key in row.Keys)
                    {
                        string? name = key?.ToLower().Trim();
                        if (!string.IsNullOrWhiteSpace(name) && name.Length > 11)
                            name = name.Substring(0, 11);
                        object value = row[key];
                        if (value == DBNull.Value)
                            attributes.Add(name, "");
                        else if (value is decimal)
                            attributes.Add(name, decimal.ToDouble((decimal)value));
                        else
                            attributes.Add(name, value);
                    }

                    if (row.ContainsKey(nameof(GeoPoint.toado_x)) && row.ContainsKey(nameof(GeoPoint.toado_y)))
                    {
                        if (string.IsNullOrWhiteSpace(row[nameof(GeoPoint.toado_x)]?.ToString()) ||
                            string.IsNullOrWhiteSpace(row[nameof(GeoPoint.toado_y)]?.ToString()))
                            features.Add(new Feature(geometryFactory.CreatePoint(), attributes));
                        else
                            features.Add(new Feature(
                                geometryFactory.CreatePoint(new NetTopologySuite.Geometries.Coordinate(
                                    double.Parse(row[nameof(GeoPoint.toado_x)]?.ToString()),
                                    double.Parse(row[nameof(GeoPoint.toado_y)]?.ToString()))), attributes));
                    }
                    else if (row.ContainsKey(nameof(GeoShape.geom_text)))
                    {
                        if (string.IsNullOrWhiteSpace(row[nameof(GeoShape.geom_text)]?.ToString()))
                        {
                            if (layer.geometry == "Polyline")
                                features.Add(new Feature(geometryFactory.CreateLineString(), attributes));
                            else if (layer.geometry == "Polygon")
                                features.Add(new Feature(geometryFactory.CreatePolygon(), attributes));
                        }
                        else
                            features.Add(new Feature(wktReader.Read(row[nameof(GeoShape.geom_text)]?.ToString()),
                                attributes));
                    }
                }

                ShapefileDataWriter shpWriter =
                    new ShapefileDataWriter(streamProviderRegistry, geometryFactory, Encoding.UTF8);
                shpWriter.Header = new DbaseFileHeader(Encoding.UTF8) { NumRecords = features.Count };

                foreach (var field in ShapefileDataWriter.GetHeader(features[0], features.Count).Fields)
                {
                    shpWriter.Header.AddColumn(field.Name, field.DbaseType, field.Length, field.DecimalCount);
                }

                shpWriter.Write(features);

                using (var ms = new MemoryStream())
                {
                    ZipOutputStream zipStream = new ZipOutputStream(ms);
                    zipStream.SetLevel(3); //0-9, 9 being the highest level of compression

                    using (var sShape = new FileStream(shpName, FileMode.OpenOrCreate))
                    {
                        ZipEntry shpEntry = new ZipEntry($"{layer.name_vn}.shp")
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
                        ZipEntry dbfEntry = new ZipEntry($"{layer.name_vn}.dbf")
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
                        ZipEntry shxEntry = new ZipEntry($"{layer.name_vn}.shx")
                        {
                            Size = sIdx.Length,
                            DateTime = DateTime.Now
                        };

                        zipStream.PutNextEntry(shxEntry);
                        StreamUtils.Copy(sIdx, zipStream, new byte[4096]);
                        zipStream.CloseEntry();
                    }

                    zipStream.IsStreamOwner = false;
                    zipStream.Close();

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

                    ms.Position = 0;
                    return File(ms.ToArray(), "application/zip", string.Format("{0}.zip", StringHelper.RemoveVietNameseSign(layer.name_vn?.Replace(" ", "_"))));
                }
            }
        }

        [HttpGet("mvt")]
        [AllowAnonymous]
        [Produces("application/x-protobuf")]
        public IActionResult mvt([FromQuery] int layer_id, [FromQuery] string? bbox = "")
        {
            var layer = getLayerWithTableAndColumn(layer_id);
            if (layer == null)
                return NotFound();
            if (layer.table.columns.Any(x => "geom".Equals(x.column_name)) == false)
                return NotFound();
            string[] bboxx = bbox.Split(',');
            using (var session = OpenSession())
            {
                string sql =
                    $"SELECT ST_AsMVT(tile) FROM (SELECT *, ST_AsMVTGeom(geom, ST_Makebox2d(ST_SetSrid(ST_MakePoint({bboxx[0]},{bboxx[1]}),4326),ST_SetSrid(ST_MakePoint({bboxx[2]},{bboxx[3]}),4326)), 4096, 0, false) AS geom FROM \"{layer.table.table_schema}\".\"{layer.table.table_name}\") AS tile";
                using (IDbCommand cmd = session.CreateCommand())
                {
                    cmd.Connection = session.Connection;
                    cmd.CommandType = CommandType.Text;
                    cmd.CommandText = sql;

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new FileContentResult((byte[])reader[0], "application/x-protobuf");
                        }
                    }
                }
            }
            return NotFound();
        }

        [HttpGet("domains")]
        public RestBase action_getDomains([FromQuery] int id)
        {
            Layer? layer = getLayerWithTableAndColumn(id);
            if (layer == null)
                return new RestError()
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail() { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                    }
                };
            using (var session = OpenSession())
            {
                IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T}
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {Sql.Entity<LayerDomain>(x => x.table_id):TC} = {Sql.Entity<TableInfo>(x => x.id):TC}
                    WHERE {Sql.Entity<LayerDomain>(x => x.layer_id):TC} = {layer.id}", (d, t) =>
                {
                    d.table = t;
                    return d;
                },
                    splitOn: $"{Sql.Entity<LayerDomain>(x => x.table_id):TC}");

                IDictionary<string, IEnumerable<CategoryBaseEntity>> domains_values = new Dictionary<string, IEnumerable<CategoryBaseEntity>>();
                foreach (var domain in domains)
                {
                    domains_values.Add(
                        layer.table.columns.FirstOrDefault(x => x.id == domain.column_id)?.column_name ?? "",
                        session.Query<CategoryBaseEntity>(
                            @$"SELECT * FROM {domain.table.table_schema}.{domain.table.table_name}"));
                }

                return new RestData()
                {
                    data = domains_values
                };
            }
        }

        [HttpGet("properties")]
        public RestBase getProperties([FromQuery] int id, [FromQuery] int form_id)
        {
            using (var session = OpenSession())
            {
                Layer? layer = getLayerWithTableAndColumn(id);
                if (layer == null)
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail() { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                string condition = $@"{Sql.Entity<TableColumn>(x => x.table_id):TC} = {layer.table_info_id}
                    AND {Sql.Entity<TableColumn>(x => x.id):TC} NOT IN (SELECT public.form_fields.table_column_id FROM public.forms JOIN public.form_fields ON public.forms.id = public.form_fields.form_id WHERE public.forms.id = {form_id})";
                var columns = session.Find<TableColumn>(stm => stm
                    .Include<TableInfo>()
                    .Where($"{condition}"))
                    .Where(x => !x.is_identity);

                return new RestData()
                {
                    data = columns.OrderBy(s => s.order)
                };
            }
        }

        [HttpGet("get-fields")]
        public RestBase getColumns([FromQuery] int id, [FromQuery] string? keyword)
        {
            var layer = getLayerWithTableAndColumn(id, keyword);
            if (layer == null)
                return new RestError()
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail() { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                    }
                };
            return new RestData()
            {
                data = layer.table.columns.OrderBy(x => x.order)
            };
        }

        [HttpPost("{schema}/save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_LAYER))]
        public async Task<RestBase> saveAsync([FromRoute] string schema, [FromBody] Layer layer)
        {
            if (string.IsNullOrWhiteSpace(schema) || layer == null)
                return new RestError()
                {
                    errors = new RestErrorDetail[]
                    {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            using (var session = OpenSession())
            {
                string tableName = StringHelper.Normalize(layer.name_vn.ToLower(), "_");

                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var existTableInfo = session.Find<TableInfo>(stm => stm
                        .Where($"{nameof(TableInfo.table_schema)} = @schema AND {nameof(TableInfo.table_name)} = @tableName")
                        .WithParameters(new { schema = schema, tableName = tableName })
                    );
                    if (existTableInfo.Count() > 0)
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                    new RestErrorDetail() { message = "Lớp đã tồn tại, vui lòng tạo lớp khác!" }
                            }
                        };
                    }
                    uow.Connection.Query(
                        $"CREATE TABLE IF NOT EXISTS {schema}.{tableName} (id SERIAL PRIMARY KEY, search_content tsvector) WITH(OIDS=FALSE)");
                    uow.Connection.Query(
                        $"SELECT AddGeometryColumn ('{schema}','{tableName}','geom',4326,'{layer.geometry}',2);");

                    string sql = "ALTER TABLE \"" + schema + "\".\"" + tableName + "\" ADD COLUMN \"{0}\" {1}";

                    // uow.Connection.Execute(string.Format(sql, "is_delete", "boolean NOT NULL DEFAULT FALSE"));

                    uow.Connection.Execute(string.Format(sql, "created_at", "Timestamp Without Time Zone"));
                    uow.Connection.Execute(string.Format(sql, "updated_at", "Timestamp Without Time Zone"));
                    uow.Connection.Execute(string.Format(sql, "created_by", "VARCHAR"));
                    uow.Connection.Execute(string.Format(sql, "is_approved", "boolean NULL DEFAULT FALSE"));
                    uow.Connection.Execute(string.Format(sql, "commune_code", "VARCHAR"));
                    uow.Connection.Execute(string.Format(sql, "district_code", "VARCHAR"));
                    uow.Connection.Execute(string.Format(sql, "province_code", "VARCHAR"));
                    uow.Connection.Execute($"CREATE TRIGGER update_search_content BEFORE INSERT OR UPDATE ON \"{schema}\".\"{tableName}\" FOR EACH ROW EXECUTE PROCEDURE update_search_content();");
                    uow.Connection.Execute($"CREATE INDEX {tableName}_geom_idx ON {schema}.{tableName} USING GIST(geom);");

                    uow.Connection.Insert<TableInfo>(new TableInfo()
                    {
                        name_en = layer.name_vn,
                        name_vn = layer.name_vn,
                        table_schema = schema,
                        table_name = tableName,
                    });
                }

                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var tableInfo = session.Find<TableInfo>(stm => stm
                        .Where($"{nameof(TableInfo.table_schema)} = @schema AND {nameof(TableInfo.table_name)}= @tableName")
                        .WithParameters(new { schema = schema, tableName = tableName })
                    ).FirstOrDefault();
                    if (tableInfo != null)
                    {
                        await syncColumns(tableInfo);
                        layer.table_info_id = tableInfo.id;
                    }
                    layer.is_visible = true;
                    layer.layer_type = "vector";
                    if (!layer.layer_group_id.HasValue)
                    {
                        layer.layer_group_id = 0;
                    }
                    if (_layerRepository.SaveOrUpdate(layer, uow) > 0)
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

        private async Task syncColumns(TableInfo table)
        {
            List<string> hiddenFields = new List<string>{
                "is_approved",
                "is_delete",
                "created_at",
                "updated_at",
                "approved_at",
                "created_by",
                "updated_by",
                "approved_by",
                "search_content",
                "geom"
            };
            IDictionary<string, string> defaultColumnName = new Dictionary<string, string>();
            defaultColumnName.Add("created_at", "Thời gian thêm mới");
            defaultColumnName.Add("updated_at", "Thời gian cập nhật");
            defaultColumnName.Add("approved_at", "Thời gian phê duyệt");
            defaultColumnName.Add("created_by", "Người khởi tạo");
            defaultColumnName.Add("updated_by", "Người cập nhật");
            defaultColumnName.Add("approved_by", "Người phê duyệt");
            defaultColumnName.Add("is_approved", "Phê duyệt");
            defaultColumnName.Add("province_code", "Tỉnh/Thành phố");
            defaultColumnName.Add("district_code", "Quận/Huyện");
            defaultColumnName.Add("commune_code", "Phường/Xã");
            defaultColumnName.Add("geom", "Geo");

            using (var session = OpenSession())
            {
                IDictionary<string, object> data = new Dictionary<string, object>();
                using (var uow = new UnitOfWork(DbFactory, session))
                {
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
                        string sql = $"{Sql.Entity<TableColumn>(x => x.id):TC} = {table.id} AND {Sql.Entity<TableColumn>(x => x.column_name):TC} NOT IN ({String.Join(",", columns.Select(x => $"'{x.column_name}'"))})";
                        var deleteCols = session.Find<TableColumn>(statement => statement.Where($"{sql}"));
                        if (deleteCols.Count() > 0)
                        {
                            // Console.WriteLine(@$"--> {table.table_schema}.{table.table_name} - Deleted columns: {string.Join(",", deleteCols.Select(x => x.column_name))}");
                            sql = $"DELETE FROM {Sql.Entity<TableColumn>():T} WHERE {Sql.Entity<TableColumn>(x => x.id):TC} IN ({String.Join(",", deleteCols.Select(x => x.id))})";
                            await uow.Connection.ExecuteAsync(sql);
                        }
                        foreach (var column in columns)
                        {
                            if (column.column_name == "search_content")
                                continue;
                            var tableColumn = session.Find<TableColumn>(statement => statement
                                .Where($"{nameof(TableColumn.column_name):C}=@column_name AND {nameof(TableColumn.table_id):C}=@id")
                                .WithParameters(new { column_name = column.column_name, id = table.id })
                            ).FirstOrDefault();
                            if (tableColumn == null)
                            {
                                // Console.WriteLine($">> Create column: {column.column_name}");
                                string? name_vn = column.column_name;
                                int thu_tu = 0;
                                if (defaultColumnName.ContainsKey(column.column_name))
                                {
                                    defaultColumnName.TryGetValue(column.column_name, out name_vn);
                                    thu_tu = 999;
                                }
                                int character_max_length = column.character_maximum_length == null ? 0 : column.character_maximum_length.Value;
                                if (column.column_name == "province_code" || column.column_name == "district_code" || column.column_name == "commune_code")
                                {
                                    character_max_length = 10;
                                }
                                tableColumn = new TableColumn()
                                {
                                    column_name = column.column_name,
                                    character_max_length = character_max_length,
                                    name_en = column.column_name,
                                    name_vn = name_vn,
                                    data_type = column.data_type,
                                    is_identity = pkeyColumn?.ToLower().Equals(column.column_name.ToLower()) ?? false,
                                    is_nullable = "YES".Equals(column.is_nullable),
                                    require = "NO".Equals(column.is_nullable),
                                    visible = hiddenFields.Any(x => x == column.column_name) == false,
                                    permanent = true,
                                    table_id = table.id,
                                    order = thu_tu
                                };

                                await uow.Connection.InsertAsync(tableColumn);
                            }
                            else
                            {
                                // Console.WriteLine($">> Update column: {column.column_name}");
                                if (column.character_maximum_length > 0)
                                {
                                    tableColumn.character_max_length = column.character_maximum_length.Value;
                                }
                                tableColumn.data_type = column.data_type;
                                tableColumn.is_identity = pkeyColumn?.ToLower().Equals(column.column_name.ToLower()) ?? false;
                                tableColumn.is_nullable = "YES".Equals(column.is_nullable);
                                tableColumn.require = "NO".Equals(column.is_nullable);
                                tableColumn.visible = hiddenFields.Any(x => x == column.column_name) == false;

                                await uow.Connection.UpdateAsync(tableColumn);
                            }
                        }
                    }
                }
            }
        }

        private async Task runQueryRegion(TableInfo table, UnitOfWork uow)
        {
            string column_name_matinh = string.Empty;
            string column_name_mahuyen = string.Empty;
            string column_name_maxa = string.Empty;
            if (table.columns.Where(x => x.column_name == "tinhid").FirstOrDefault() != null)
            {
                column_name_matinh = "tinhid";
            }
            else if (table.columns.Where(x => x.column_name == "matinh").FirstOrDefault() != null)
            {
                column_name_matinh = "matinh";
            }
            else if (table.columns.Where(x => x.column_name == "tinh_id").FirstOrDefault() != null)
            {
                column_name_matinh = "tinh_id";
            }
            if (table.columns.Where(x => x.column_name == "huyenid").FirstOrDefault() != null)
            {
                column_name_mahuyen = "huyenid";
            }
            else if (table.columns.Where(x => x.column_name == "mahuyen").FirstOrDefault() != null)
            {
                column_name_mahuyen = "mahuyen";
            }
            else if (table.columns.Where(x => x.column_name == "huyen_id").FirstOrDefault() != null)
            {
                column_name_mahuyen = "huyen_id";
            }
            else if (table.columns.Where(x => x.column_name == "maquan").FirstOrDefault() != null)
            {
                column_name_mahuyen = "maquan";
            }
            if (table.columns.Where(x => x.column_name == "xaid").FirstOrDefault() != null)
            {
                column_name_maxa = "xaid";
            }
            else if (table.columns.Where(x => x.column_name == "maxa").FirstOrDefault() != null)
            {
                column_name_maxa = "maxa";
            }
            else if (table.columns.Where(x => x.column_name == "xa_id").FirstOrDefault() != null)
            {
                column_name_maxa = "xa_id";
            }
            else if (table.columns.Where(x => x.column_name == "maphuong").FirstOrDefault() != null)
            {
                column_name_maxa = "maphuong";
            }
            if (string.IsNullOrWhiteSpace(column_name_matinh) == false && table.columns.Any(x => x.column_name == "province_code"))
            {
                await uow.Connection.ExecuteAsync($@"UPDATE {table.table_schema}.{table.table_name} SET province_code = {column_name_matinh} WHERE province_code IS NULL AND {column_name_matinh} IS NOT NULL");
            }
            if (string.IsNullOrWhiteSpace(column_name_mahuyen) == false && table.columns.Any(x => x.column_name == "district_code"))
            {
                await uow.Connection.ExecuteAsync($@"UPDATE {table.table_schema}.{table.table_name} SET district_code = {column_name_mahuyen} WHERE district_code IS NULL AND {column_name_mahuyen} IS NOT NULL");
            }
            if (string.IsNullOrWhiteSpace(column_name_maxa) == false && table.columns.Any(x => x.column_name == "commune_code"))
            {
                await uow.Connection.ExecuteAsync($@"UPDATE {table.table_schema}.{table.table_name} SET commune_code = {column_name_maxa} WHERE commune_code IS NULL AND {column_name_maxa} IS NOT NULL");
            }

            // if (!string.IsNullOrWhiteSpace(column_name_matinh) && !string.IsNullOrWhiteSpace(column_name_mahuyen) && !string.IsNullOrWhiteSpace(column_name_maxa))
            // {
            //     var sqlUpdateRegion = $@"UPDATE {table.table_schema}.{table.table_name}
            //             SET province_code = {column_name_matinh},
            //                 district_code = {column_name_mahuyen},
            //                 commune_code = {column_name_maxa}";
            //     // Console.WriteLine(sqlUpdateRegion);
            //     await uow.Connection.ExecuteAsync(sqlUpdateRegion);
            // }
        }

        [HttpPost("saveOrUpdate")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_LAYER))]
        public RestBase saveOrUpdate([FromBody] Layer layer)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (layer == null || layer.table_info_id <= 0)
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail() { message = "Vui lòng kiểm tra lại tham số!" }
                            }
                        };
                    }
                    layer.id = _layerRepository.SaveOrUpdate(layer, uow);
                    if (layer.id > 0)
                    {
                        if (layer.label_column_id > 0)
                        {
                            TableColumn? tableColumn = session.Find<TableColumn>(stm => stm
                                .Where($"{nameof(TableColumn.id)} = @id")
                                .WithParameters(new { id = layer.label_column_id })
                            ).FirstOrDefault();
                            if (tableColumn != null)
                            {
                                tableColumn.is_label = true;
                                uow.Connection.Update(tableColumn);
                            }
                        }
                        return new RestData()
                        {
                            data = layer
                        };
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

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_LAYER))]
        public RestBase delete([FromForm] Layer layer)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var existLayer = _layerRepository.GetKey(layer.id, session);
                    if (existLayer == null)
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail
                                {
                                    message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!"
                                }
                            }
                        };
                    }
                    if (existLayer.permanent)
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail()
                                {
                                    message = "Lớp dữ liệu này không được phép xóa!"
                                }
                            }
                        };
                    }
                    var existTableInfo = session.Find<TableInfo>(stm => stm
                        .Where($"{nameof(TableInfo.id)} = @id")
                        .WithParameters(new { id = existLayer.table_info_id })
                    ).FirstOrDefault();
                    if (existTableInfo == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message =  "Đã xảy ra lỗi, vui lòng thử lại!" }
                            }
                        };
                    var sqlDeleteColumns = $"DELETE FROM {Sql.Entity<TableColumn>():T} WHERE {Sql.Entity<TableColumn>(x => x.table_id):TC} = @table_id";
                    session.Execute(sqlDeleteColumns, new { table_id = existTableInfo.id });
                    if (_layerRepository.DeleteKey(layer.id, uow))
                    {
                        session.Delete<TableInfo>(existTableInfo);
                        uow.Connection.Query($"DROP TABLE {existTableInfo.table_schema}.{existTableInfo.table_name}");
                        return new RestBase(EnumErrorCode.OK);
                    }
                    else
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail()
                                {
                                    message = "Có lỗi xảy ra, vui lòng kiểm tra lại thông tin lớp dữ liệu!"
                                }
                            }
                        };
                    }
                }
            }
        }

        [HttpPost("{id}/clear-data")]
        public RestBase clearDataLayer([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    Layer layer = getLayerWithTableAndColumn(id);
                    if (layer == null)
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    uow.Connection.Execute(string.Format($@"TRUNCATE TABLE {layer.table.table_schema}.{layer.table.table_name}"));
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpGet("getLayerByGroupId")]
        public RestBase getLayerByGroupId([FromQuery] int id)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<Layer>(statement => statement
                        .Include<TableInfo>(join => join.LeftOuterJoin())
                        .Where($"{Sql.Entity<Layer>(x => x.layer_group_id):TC} = @id")
                        .WithParameters(new { id = id })
                        .OrderBy($"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC}")
                    )
                };
            }
        }

        [HttpGet("{table_schema}/GetLayers")]
        public RestBase ListLayers([FromRoute] string table_schema)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<Layer>(x => x.Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @table_schema")
                        .WithParameters(new { table_schema = table_schema })
                        .Include<LayerGroup>(join => join.LeftOuterJoin())
                        .Include<TableInfo>(join => join.InnerJoin())
                        .Include<TableColumn>(join => join.InnerJoin())
                        .OrderBy(@$"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC},
                            {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                    )
                };
            }
        }

        [HttpGet("list-layers")]
        public RestBase GetAllLayers([FromQuery] bool? includeStyle = true, [FromQuery] string? tableSchema = "", string? keyword = "", [FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            using (var session = OpenSession())
            {
                var condition = "1=1";
                if (string.IsNullOrWhiteSpace(tableSchema) == false)
                {
                    condition += $" AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = @tableSchema";
                }
                if (!string.IsNullOrWhiteSpace(keyword))
                {
                    condition += $" AND {Sql.Entity<TableInfo>():T}.search_content @@ to_tsquery(@keyword)";
                }
                var data = session.Find<Layer>(x => x.Where($"{condition}")
                    .WithParameters(new { tableSchema = tableSchema, keyword = keyword?.ToFullTextString() })
                    .Include<LayerGroup>(join => join.LeftOuterJoin())
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableSchema>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy(@$"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.order):TC},
                        {Sql.Entity<Layer>(x => x.name_vn):TC}, {Sql.Entity<TableColumn>(x => x.order):TC},
                        {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                ).Skip(skip).Take(take).ToList();

                return new RestPagedDataTable
                {
                    data = data,
                    recordsFiltered = session.Count<Layer>(x => x.Where($"{condition}")
                        .WithParameters(new { tableSchema = tableSchema, keyword = keyword?.ToFullTextString() })
                        .Include<LayerGroup>(join => join.LeftOuterJoin())
                        .Include<TableInfo>(join => join.LeftOuterJoin())
                    ),
                    recordsTotal = session.Count<Layer>(x => x
                        .Include<LayerGroup>(join => join.LeftOuterJoin())
                        .Include<TableInfo>(join => join.LeftOuterJoin())
                    )
                };
            }
        }

        [HttpGet("getLayersAndGroupLayers")]
        public async System.Threading.Tasks.Task<RestBase> getLayersAndGroupLayersAsync([FromQuery] string tableSchema)
        {
            using (var session = OpenSession())
            {
                var userLayerIds = new List<int>();
                string conditon = $"(1=1)";
                var paramQuery = new Dictionary<string, object>();
                paramQuery.Add("table_schemas", tableSchema.Split(',').ToArray());
                if (User.Identity.IsAuthenticated && !(User?.Identity?.IsAuthenticated == true && User.IsInRole(EnumRoles.SA) || User?.Identity?.IsAuthenticated == true && User.IsInRole(EnumRoles.ADMINISTRATOR)))
                {
                    var user = await _userManager.FindByNameAsync(User.Identity.Name);
                    if (user != null)
                    {
                        conditon += $" AND {Sql.Entity<Layer>(x => x.id):TC} IN (SELECT {Sql.Entity<UserLayer>(x => x.layer_id):TC} FROM {Sql.Entity<UserLayer>():T} WHERE {Sql.Entity<UserLayer>(x => x.user_id):TC} = @user_id)";
                        paramQuery.Add("user_id", user.Id);
                    }
                }

                IEnumerable<LayerGroup> layerGroups = (await session.FindAsync<LayerGroup>(x => x
                    .Where($"{Sql.Entity<LayerGroup>(x => x.table_schema):TC} = ANY(@table_schemas) OR {Sql.Entity<LayerGroup>(x => x.table_schema):TC} IS NULL OR {Sql.Entity<LayerGroup>(x => x.table_schema):TC} = ''")
                    .WithParameters(paramQuery)
                    .Include<Layer>(join => join.LeftOuterJoin())
                    .Include<TileLayer>(join => join.LeftOuterJoin())
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($@"{Sql.Entity<LayerGroup>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.order):TC},
                        {Sql.Entity<Layer>(x => x.name_vn):TC}, {Sql.Entity<TableColumn>(x => x.require):TC} DESC,
                        {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}"))
                ).ToList();

                IEnumerable<Layer> layers = await session.FindAsync<Layer>(statement => statement
                    .Where($@"{Sql.Entity<Layer>(x => x.layer_group_id):TC}=0 AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = ANY(@table_schemas) AND {conditon}")
                    .WithParameters(paramQuery)
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($@"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC},
                        {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC},
                        {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                );

                IEnumerable<TileLayer> tileLayers = await session.FindAsync<TileLayer>(statement => statement
                    .Where($@"{nameof(TileLayer.layer_group_id)}=0")
                    .OrderBy($"{nameof(TileLayer.name)}")
                );

                // Lấy bảng dữ liệu không có hình học
                IEnumerable<TableGroup> tableGroups = (await session.FindAsync<TableGroup>(x => x
                    .Where($"{Sql.Entity<TableGroup>(x => x.table_schema):TC} = ANY(@table_schemas) OR {Sql.Entity<TableGroup>(x => x.table_schema):TC} IS NULL OR {Sql.Entity<TableGroup>(x => x.table_schema):TC} = ''")
                    .WithParameters(paramQuery)
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($@"{Sql.Entity<TableGroup>(x => x.order):TC}, {Sql.Entity<TableInfo>(x => x.order):TC},
                        {Sql.Entity<TableInfo>(x => x.name_vn):TC}, {Sql.Entity<TableColumn>(x => x.require):TC} DESC,
                        {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}"))
                ).ToList();

                var tableIds = session.Find<Layer>(statement => statement.Include<TableInfo>()
                    .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = ANY(@table_schemas)")
                    .WithParameters(paramQuery)
                ).Select(x => x.table.id);

                IEnumerable<TableInfo> tables = await session.FindAsync<TableInfo>(statement => statement
                    .Where($@"NOT({Sql.Entity<TableInfo>(x => x.id):TC} = ANY(@table_ids)) AND {Sql.Entity<TableInfo>(x => x.table_group_id):TC} = 0 AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = ANY(@table_schemas)")
                    .WithParameters(new { table_ids = tableIds.ToArray(), table_schemas = tableSchema.Split(',').ToArray() })
                    .Include<TableGroup>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($@"{Sql.Entity<TableInfo>(x => x.id):TC}, {Sql.Entity<TableInfo>(x => x.name_vn):TC},
                        {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC},
                        {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                );

                List<IDictionary<string, object>> treeItems = new List<IDictionary<string, object>>();

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
                                    string sqlCount = @$"SELECT COUNT(DISTINCT {keyColumn.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name}";
                                    countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                                }
                                else
                                {
                                    countRecords = 0;
                                }
                                IDictionary<string, object> child = new Dictionary<string, object>
                                    {
                                        //var domains = getDomainValues(layer);
                                        //var relations = getRelations(layer);
                                        { "id", $"l_{layer.id}" },
                                        { "text", $"{layer.name_vn} ({countRecords})"},
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
                                    foreach (var classify in layer.layer_classify)
                                    {
                                        IDictionary<string, object> childClassify = new Dictionary<string, object>
                                        {
                                            {"id", $"lc_{classify.id}" },
                                            {"text", classify.value },
                                            {"raw", classify },
                                            {"type", "@layerclassify" },
                                            {"selected", layer.is_visible },
                                            {"icon", "mdi mdi-circle-outline" }
                                        };
                                        childrenClassify.Add(childClassify);
                                    }
                                    if (childrenClassify.Count > 0)
                                    {
                                        // data.Add("disabled", true);
                                        child.Add("items", childrenClassify);
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

                List<IDictionary<string, object>> layerChildren = new List<IDictionary<string, object>>();

                foreach (var layer in layers.OrderBy(x => x.order))
                {
                    if (layer.hidden == false)
                    {
                        TableColumn? keyColumn = layer.table.key_column ?? layer.table.identity_column;

                        int countRecords = 0;
                        if (keyColumn != null)
                        {
                            string sqlCount = @$"SELECT COUNT(DISTINCT {keyColumn.column_name}) FROM {layer.table.table_schema}.{layer.table.table_name}";
                            countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                        }
                        IDictionary<string, object> child = new Dictionary<string, object>
                            {
                                //var domains = getDomainValues(layer);
                                //var relations = getRelations(layer);
                                { "id", $"l_{layer.id}" },
                                { "text", $"{layer.name_vn} ({countRecords})"  },
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
                            foreach (var classify in layer.layer_classify)
                            {
                                IDictionary<string, object> childClassify = new Dictionary<string, object>
                                    {
                                        {"id", $"lc_{classify.id}" },
                                        {"text", classify.value },
                                        {"raw", classify },
                                        {"type", "@layerclassify" },
                                        {"selected", layer.is_visible },
                                        {"icon", "mdi mdi-circle-outline" }

                                    };
                                childrenClassify.Add(childClassify);
                            }
                            if (childrenClassify.Count > 0)
                            {
                                // data.Add("disabled", true);
                                child.Add("items", childrenClassify);
                            }
                        }
                        layerChildren.Add(child);
                    }
                }

                foreach (var layer in tileLayers)
                {
                    IDictionary<string, object> child = new Dictionary<string, object>
                        {
                            { "id", $"tl_{layer.id}" },
                            { "text", layer.name },
                            { "raw", layer },
                            { "type", "@tilelayer" },
                            { "icon", "mdi mdi-layers-outline" },
                            { "selected", layer.visible }
                        };
                    layerChildren.Add(child);
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
                    // dataOrphan.Add("disabled", true);
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
                                string sqlCount = @$"SELECT COUNT(DISTINCT {keyColumn.column_name}) FROM {table.table_schema}.{table.table_name}";
                                countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                            }
                            IDictionary<string, object> child = new Dictionary<string, object>
                                    {
                                        { "id", $"table_{table.id}" },
                                        { "text", $"{table.name_vn} ({countRecords})"},
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
                        string sqlCount = @$"SELECT COUNT(DISTINCT {keyColumn.column_name}) FROM {table.table_schema}.{table.table_name}";
                        countRecords = session.Query<int>(sqlCount).FirstOrDefault();
                    }
                    IDictionary<string, object> child = new Dictionary<string, object>
                        {
                           { "id", $"table_{table.id}" },
                           { "text", $"{table.name_vn} ({countRecords})"},
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
                //
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

        /// <summary>
        /// Lấy danh sách layer, classsify nhóm theo schema theo dạng tree
        /// </summary>
        /// <param name="keyword"></param>
        /// <returns>Danh sách layer, classsify theo dạng tree (Cấp 1: schema, Cấp 2: layer, Cấp 3: classify)</returns>
        [HttpGet("getAllLayersAndGroupLayers")]
        public async Task<RestBase> getAllLayersAndGroupLayersAsync([FromQuery] string? keyword)
        {
            using (var session = OpenSession())
            {
                var userLayerIds = new List<int>();
                string conditon = $"(1=1)";
                var paramQuery = new Dictionary<string, object>();
                if (User.Identity.IsAuthenticated && !(User?.Identity?.IsAuthenticated == true && User.IsInRole(EnumRoles.SA) || User?.Identity?.IsAuthenticated == true && User.IsInRole(EnumRoles.ADMINISTRATOR)))
                {
                    var user = await _userManager.FindByNameAsync(User.Identity.Name);
                    if (user != null)
                    {
                        conditon += $" AND {Sql.Entity<Layer>(x => x.id):TC}" +
                            $" IN (SELECT {nameof(UserLayer.layer_id)} FROM {Sql.Entity<UserLayer>():T} WHERE {nameof(UserLayer.user_id)} = '{user.Id}')";
                    }
                }
                var table_schemas = session.Query<string>($"SELECT {Sql.Entity<TableSchema>(x => x.schema_name):TC} FROM {Sql.Entity<TableSchema>():T}").ToList();
                paramQuery.Add("table_schemas", table_schemas.ToArray());

                IEnumerable<LayerGroup> layerGroups = (await session.FindAsync<LayerGroup>(x => x
                    .Where($"{Sql.Entity<LayerGroup>(x => x.table_schema):TC} = ANY(@table_schemas) OR{Sql.Entity<LayerGroup>(x => x.table_schema):TC} IS NULL OR {Sql.Entity<LayerGroup>(x => x.table_schema):TC} = ''")
                    .WithParameters(paramQuery)
                    .Include<Layer>(join => join.LeftOuterJoin())
                    .Include<TileLayer>(join => join.LeftOuterJoin())
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($@"{Sql.Entity<LayerGroup>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.order):TC},
                        {Sql.Entity<Layer>(x => x.name_vn):TC}, {Sql.Entity<TableColumn>(x => x.require):TC} DESC,
                        {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}"))
                ).ToList();

                IEnumerable<Layer> layers = await session.FindAsync<Layer>(statement => statement
                    .Where($@"{nameof(Layer.layer_group_id)} = 0 AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = ANY(@table_schemas) AND {conditon}")
                    .WithParameters(paramQuery)
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($@"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC},
                        {Sql.Entity<TableColumn>(x => x.require):TC} DESC, {Sql.Entity<TableColumn>(x => x.order):TC},
                        {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                );

                IEnumerable<TileLayer> tileLayers = await session.FindAsync<TileLayer>(statement => statement
                    .Where($@"{nameof(TileLayer.layer_group_id)} = 0")
                    .OrderBy($"{nameof(TileLayer.name)}")
                );

                List<IDictionary<string, object>> treeItems = new List<IDictionary<string, object>>();

                foreach (var layer in tileLayers)
                {
                    IDictionary<string, object> child = new Dictionary<string, object>
                        {
                            { "id", $"tl_{layer.id}"},
                            { "text", layer.name },
                            { "expanded", true },
                            { "raw", layer },
                            { "type", "@tilelayer"},
                            { "icon", "mdi mdi-layers-outline" },
                            { "selected", layer.visible }
                        };
                    treeItems.Add(child);
                }
                var tableSchemas = (await session.FindAsync<TableSchema>(statement => statement
                    .Where($"{Sql.Entity<TableSchema>(x => x.schema_name):TC} = ANY(@table_schemas)")
                    .WithParameters(paramQuery)
                    .OrderBy($"{nameof(TableSchema.schema_name)} ASC"))
                ).ToList();
                if (tableSchemas != null && tableSchemas.Count() > 0)
                {
                    foreach (var schema in tableSchemas)
                    {
                        IDictionary<string, object> dataOrphan = new Dictionary<string, object>
                            {
                                { "id", $"g_Schema_{schema.schema_name}" },
                                { "text", schema.description },
                                { "expanded", true },
                                { "raw", schema },
                                { "icon", "mdi mdi-layers-outline" },
                                { "type", "@layergroup" },
                            };
                        List<IDictionary<string, object>> schemaChildren = new List<IDictionary<string, object>>();

                        var layer_groups = layerGroups.Where<LayerGroup>(stm => stm.table_schema == schema.schema_name).ToList();
                        foreach (var layerGroup in layer_groups)
                        {
                            IDictionary<string, object> data = new Dictionary<string, object>
                                {
                                    { "id", $"g_LayerGroup_{layerGroup.id}" },
                                    { "text", layerGroup.name_vn },
                                    { "expanded", true },
                                    { "icon", "mdi mdi-layers-outline" },
                                    { "type", "@layergroup" },
                                    { "raw", layerGroup },
                                };
                            List<IDictionary<string, object>> children = new List<IDictionary<string, object>>();
                            if (layerGroup.layers != null)
                            {
                                foreach (var layer in layerGroup.layers.OrderBy(x => x.order))
                                {
                                    if (layer.hidden == false)
                                    {
                                        IDictionary<string, object> child = new Dictionary<string, object>
                                            {
                                                { "id", $"l_{layer.id}" },
                                                { "text", layer.name_vn },
                                                { "raw", layer},
                                                { "type", "@layer" },
                                                { "icon", "mdi mdi-circle-outline" },
                                                { "selected", layer.is_visible }
                                            };
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
                                            { "id", $"tl_{layer.id}"},
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
                                data.Add("items", children);
                                schemaChildren.Add(data);
                            }
                        }
                        //Nhóm dữ liệu khác
                        List<IDictionary<string, object>> layerChildren = new List<IDictionary<string, object>>();
                        foreach (var layer in layers.Where<Layer>(stm => stm.table.table_schema == schema.schema_name).OrderBy(x => x.order))
                        {
                            if (layer.hidden == false)
                            {
                                IDictionary<string, object> child = new Dictionary<string, object>
                                    {
                                        { "id", $"l_{layer.id}" },
                                        { "text", layer.name_vn },
                                        { "raw", layer },
                                        { "type", "@layer" },
                                        { "icon", "mdi mdi-layers-outline" },
                                        { "selected", layer.is_visible }
                                    };
                                layerChildren.Add(child);
                            }
                        }

                        foreach (var layer in tileLayers)
                        {
                            IDictionary<string, object> child = new Dictionary<string, object>
                                {
                                    { "id", $"tl_{layer.id}" },
                                    { "text", layer.name },
                                    { "raw", layer },
                                    { "type", "@tilelayer" },
                                    { "icon", "mdi mdi-layers-outline" },
                                    { "selected", layer.visible }
                                };
                            layerChildren.Add(child);
                        }

                        IDictionary<string, object> dataOrphanGroup = new Dictionary<string, object>
                            {
                                { "id", $"g_Orphan_{schema.schema_name}" },
                                { "text", "Nhóm dữ liệu khác" },
                                { "expanded", true },
                                { "icon", "mdi mdi-layers-outline" },
                                { "type", "@layergroup" }
                            };
                        if (layerChildren.Count > 0)
                        {
                            dataOrphanGroup.Add("items", layerChildren);
                            schemaChildren.Add(dataOrphanGroup);
                        }
                        if (schemaChildren.Count() > 0)
                        {
                            dataOrphan.Add("items", schemaChildren);
                            treeItems.Add(dataOrphan);
                        }
                    }
                }
                return new RestData()
                {
                    data = treeItems
                };
            }
        }

        [HttpPost("getLayerAndGroupLayerByLayerId")]
        public RestBase getLayerAndGroupLayerByLayerId(string layer_id)
        {
            using (var session = OpenSession())
            {
                Layer? layer = session.Find<Layer>(statement => statement
                    .Where($@"{Sql.Entity<Layer>(x => x.id):TC} = @layer_id")
                    .WithParameters(new { layer_id = layer_id })
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($@"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC},
                        {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                ).FirstOrDefault();
                if (layer == null)
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail() { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                var domains = getDomainValues(layer);
                var relations = getRelations(layer.table);
                return new RestData()
                {
                    data = new
                    {
                        layer = layer,
                        domains = domains,
                        relation = relations,
                    },
                };
            }
        }

        [HttpPost("getGeojsonBuffer/{radius}")]
        public RestBase getBuffer([FromForm] string geom, [FromRoute] double radius)
        {
            using (var session = OpenSession())
            {
                if (!string.IsNullOrWhiteSpace(geom))
                {
                    return new RestData()
                    {
                        data = session.Query<string>($"SELECT ST_AsGeoJSON(ST_Buffer(ST_GeomFromGeoJSON('{geom}')::GEOGRAPHY,{radius}));").FirstOrDefault()
                    };
                }
                return new RestData
                {
                    data = String.Empty
                };
            }
        }

        [HttpPost("GetLayerById")]
        public RestData getLayerById(string table_schema, int layer_id)
        {
            using (var session = OpenSession())
            {
                IEnumerable<Layer> orphanLayers = session.Find<Layer>(statement => statement
                    .Where($@"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @table_schema AND{Sql.Entity<Layer>(x => x.id):TC} = @layer_id")//AND {Sql.TableAndColumn<TableColumn>(x => x.is_searchable):TC=true
                    .WithParameters(new { table_schema = table_schema, layer_id = layer_id })
                    .Include<TableInfo>(join => join.LeftOuterJoin())
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($@"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC},
                        {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                );

                List<IDictionary<string, object>> treeItems = new List<IDictionary<string, object>>();

                foreach (var layer in orphanLayers)
                {
                    IDictionary<string, object> child = new Dictionary<string, object> {
                        {"id", $"l_{layer.id}" },
                        {"text", layer.name_vn },
                        {"raw", layer },
                        {"type", "@layer" },
                        {"icon", "mdi mdi-layers-outline" },
                        {"domains", getDomainValues(layer) },
                        {"relations", getRelations(layer.table) }
                    };
                    treeItems.Add(child);
                }
                return new RestData()
                {
                    data = treeItems
                };
            }
        }

        [HttpGet("{id}/files")]
        public RestData listLayerFile(int id)
        {
            using (var session = OpenSession())
            {
                return new RestData
                {
                    data = session.Find<LayerFile>(statement => statement
                        .Where($"{nameof(LayerFile.layer_id)} = @id")
                        .WithParameters(new { id = id })
                    ).ToList()
                };
            }
        }

        [HttpGet("{id}/files/{feature_id}")]
        [AllowAnonymous]
        public RestData listFeatureFile([FromRoute] int id, [FromRoute] string feature_id)
        {
            using (var session = OpenSession())
            {
                List<LayerFile> data = new List<LayerFile>();
                var rootFolder = Path.Combine(_hostEnvironment.ContentRootPath, $"AppData");
                var layer = getLayerWithTableAndColumn(id);
                if (layer != null)
                {
                    var linkHsqColumn = layer.table.columns.Where(x => x.column_name == "linkhsq").FirstOrDefault();
                    TableColumn? keyColumn = layer.table.key_column ?? layer.table.identity_column;

                    if (linkHsqColumn != null && keyColumn != null)
                    {
                        var linkHsq = session.Query<string>(@$"SELECT {linkHsqColumn.column_name} FROM {layer.table.table_schema}.{layer.table.table_name} WHERE {keyColumn}::TEXT = @feature_id", new { feature_id = feature_id }).FirstOrDefault();
                        if (!string.IsNullOrWhiteSpace(linkHsq))
                        {
                            string normalLink = linkHsq.Replace("...", "").Replace("..", "").Replace("F:", "");
                            List<string> paths = normalLink.Split("\\").Where(x => string.IsNullOrWhiteSpace(x) == false).ToList();
                            string pathFolder = Path.Combine(paths.ToArray());
                            string fullpathFolder = Path.Combine(rootFolder, pathFolder);
                            var provider = new FileExtensionContentTypeProvider();
                            const string DefaultContentType = "application/octet-stream";
                            if (Directory.Exists(fullpathFolder))
                            {
                                foreach (var file in Directory.GetFiles(fullpathFolder, "*.*", SearchOption.AllDirectories))
                                {
                                    var fi = new FileInfo(file);
                                    if (!provider.TryGetContentType(file, out string? contentType))
                                    {
                                        contentType = DefaultContentType;
                                    }
                                    data.Add(new LayerFile
                                    {
                                        layer_id = layer.id,
                                        name = fi.Name,
                                        mime_type = contentType,
                                        url = $"/files/{pathFolder.Replace("\\", "/")}/{fi.Name}"
                                    });
                                }
                            }
                        }
                    }
                }
                return new RestData
                {
                    data = data
                };
            }
        }

        [HttpGet("relations")]
        public async Task<RestBase> getRelationTableAsync([FromQuery] int layer_id)
        {
            using (var session = OpenSession())
            {
                var layer = getLayerWithTable(layer_id);
                if (layer == null)
                {
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail() { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    return new RestData
                    {
                        data = getRelations(layer.table, true)
                    };
                }
            }
        }

        /// <summary>
        /// Extract zip file to a folder
        /// </summary>
        /// <param name="file"></param>
        /// <returns>full path of the directory</returns>
        private string extractZip(IFormFile file)
        {
            using (Stream stream = file.OpenReadStream())
            {
                using (ZipArchive archive = new ZipArchive(stream))
                {
                    string fullName = Directory.CreateDirectory(Path.Combine("Data_Stores", "temp")).FullName;
                    string fullPath = Path.GetFullPath(Path.Combine(fullName, StringHelper.RandomFileName()));
                    if (Directory.Exists(fullPath) == false)
                    {
                        Directory.CreateDirectory(fullPath);
                    }

                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        string entryOutPath = Path.Combine(fullPath, entry.Name);
                        entry.ExtractToFile(entryOutPath);
                        // using (Stream fileStream = System.IO.File.Open(entryOutPath, FileMode.Create, FileAccess.Write, FileShare.None))
                        // {
                        //     using (Stream entryStream = entry.Open())
                        //     {
                        //         entryStream.CopyTo(fileStream);
                        //     }
                        // }
                    }
                    return fullPath;
                }
            }
        }

        /// <summary>
        /// Extract rar file to a folder
        /// </summary>
        /// <param name="file"></param>
        /// <returns>full path of the directory</returns>
        private string extractRar(IFormFile file, string? pathName = null)
        {
            using (Stream stream = file.OpenReadStream())
            {
                string fullName = Directory.CreateDirectory(Path.Combine("Data_Stores", "temp")).FullName;
                string fullPath = Path.GetFullPath(Path.Combine(fullName, pathName ?? StringHelper.RandomFileName()));
                if (Directory.Exists(fullPath) == false)
                {
                    var reader = ReaderFactory.Open(stream);
                    Directory.CreateDirectory(fullPath);
                    while (reader.MoveToNextEntry())
                    {
                        if (!reader.Entry.IsDirectory)
                        {
                            reader.WriteEntryToDirectory(fullPath, new ExtractionOptions() { ExtractFullPath = false, Overwrite = true });
                        }
                    }
                }
                return fullPath;
            }
        }

        private IDictionary<string, List<IDictionary<string, object>>> parseShp(IFormFile file, string geometryType = "", string layerName = "")
        {
            IFormFile? shp = file.FileName.Substring(file.FileName.IndexOf(".")) == ".shp" ? file : null;
            IFormFile? shx = file.FileName.Substring(file.FileName.IndexOf(".")) == ".shx" ? file : null;
            IFormFile? dbf = file.FileName.Substring(file.FileName.IndexOf(".")) == ".dbf" ? file : null;
            IFormFile? cpg = file.FileName.Substring(file.FileName.IndexOf(".")) == ".cpg" ? file : null;
            IFormFile? prj = file.FileName.Substring(file.FileName.IndexOf(".")) == ".prj" ? file : null;
            string? shpDirectory = string.Empty;
            string? shxDirectory = string.Empty;
            string? dbfDirectory = string.Empty;
            string? cpgDirectory = string.Empty;
            string? prjDirectory = string.Empty;
            string[] files = { };
            string? tempFolder = "";
            if (file.ContentType == "application/zip" || file.ContentType == "application/x-zip-compressed")
            {
                tempFolder = extractRar(file);
            }
            else if (file.ContentType == "application/vnd.rar")
            {
                tempFolder = extractRar(file);
            }

            if (string.IsNullOrWhiteSpace(tempFolder) == true)
            {
                throw new Exception("File import không hợp lệ. Vui lòng kiểm tra lại!");
            }

            files = Directory.GetFileSystemEntries(tempFolder, "*", SearchOption.AllDirectories);
            shpDirectory = files.Where(x => x.Contains(".shp")).FirstOrDefault();
            shxDirectory = files.Where(x => x.Contains(".shx")).FirstOrDefault();
            dbfDirectory = files.Where(x => x.Contains(".dbf")).FirstOrDefault();
            cpgDirectory = files.Where(x => x.Contains(".cpg")).FirstOrDefault();
            prjDirectory = files.Where(x => x.Contains(".prj")).FirstOrDefault();

            if (string.IsNullOrEmpty(shpDirectory) || string.IsNullOrEmpty(shxDirectory) || string.IsNullOrEmpty(dbfDirectory) || string.IsNullOrEmpty(cpgDirectory))
            {
                throw new Exception("File import không hợp lệ. Vui lòng kiểm tra lại!");
            }
            else
            {
                string baseName = string.Empty;
                MemoryStream ShpMs = new MemoryStream();
                MemoryStream ShxMs = new MemoryStream();
                MemoryStream DbfMs = new MemoryStream();
                MemoryStream CpgMs = new MemoryStream();
                List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                using (var session = OpenSession())
                {
                    using (FileStream fsShp = new FileStream(shpDirectory, FileMode.Open, FileAccess.ReadWrite))
                    {
                        baseName = Path.GetFileNameWithoutExtension(fsShp.Name);
                        fsShp.CopyTo(ShpMs);
                        IStreamProvider shapeStream = new ByteStreamProvider(StreamTypes.Shape, ShpMs);
                        using (FileStream fsDbf = new FileStream(dbfDirectory, FileMode.Open, FileAccess.ReadWrite))
                        {
                            fsDbf.CopyTo(DbfMs);
                            IStreamProvider dataStream = new ByteStreamProvider(StreamTypes.Data, DbfMs);

                            using (FileStream fsCpg = new FileStream(cpgDirectory, FileMode.Open, FileAccess.ReadWrite))
                            {
                                fsCpg.CopyTo(CpgMs);
                                IStreamProvider dataEncodingStream = new ByteStreamProvider(StreamTypes.DataEncoding, CpgMs);
                                using (FileStream fsShx = new FileStream(shxDirectory, FileMode.Open, FileAccess.ReadWrite))
                                {
                                    fsShx.CopyTo(ShxMs);
                                    IStreamProvider idxStream = new ByteStreamProvider(StreamTypes.Index, ShxMs);

                                    IStreamProviderRegistry streamProviderRegistry =
                                        new ShapefileStreamProviderRegistry(shapeStream, dataStream, idxStream, dataEncodingStream: dataEncodingStream);
                                    GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                                    ShapefileDataReader shapeFileDataReader = new ShapefileDataReader(streamProviderRegistry, geometryFactory);
                                    DbaseFileHeader header = shapeFileDataReader.DbaseHeader;
                                    DbaseFileHeader.DefaultEncoding = Encoding.UTF8;
                                    shapeFileDataReader.Reset();

                                    IList<IFeature> features = new List<IFeature>();
                                    IDictionary<string, object> recordHeader = new Dictionary<string, object>();
                                    IDictionary<string, object> recordAlias = new Dictionary<string, object>();
                                    for (int i = 0; i < header.NumFields; i++)
                                    {
                                        Type type = header.Fields[i].Type;
                                        recordAlias.Add(header.Fields[i].Name.ToLower(), header.Fields[i].Name);
                                        try
                                        {
                                            if (type == typeof(double) || type == typeof(float))
                                            {
                                                recordHeader.Add(header.Fields[i].Name.ToLower(), EnumPgDataType.Double);
                                            }
                                            else if (type == typeof(short) || type == typeof(ushort) ||
                                                     type == typeof(int) || type == typeof(uint) ||
                                                     type == typeof(long) || type == typeof(ulong))
                                            {
                                                recordHeader.Add(header.Fields[i].Name.ToLower(), EnumPgDataType.Integer);
                                            }
                                            else if (type == typeof(bool))
                                            {
                                                recordHeader.Add(header.Fields[i].Name.ToLower(), EnumPgDataType.Boolean);
                                            }
                                            else if (type == typeof(DateTime))
                                            {
                                                recordHeader.Add(header.Fields[i].Name.ToLower(), EnumPgDataType.DateTime);
                                            }
                                            else
                                            {
                                                recordHeader.Add(header.Fields[i].Name.ToLower(), EnumPgDataType.String);
                                            }
                                        }
                                        catch (System.Exception)
                                        {
                                            continue;
                                        }
                                    }
                                    records.Add(recordHeader);
                                    records.Add(recordAlias);
                                    if (shapeFileDataReader.RecordCount > 0)
                                    {
                                        while (shapeFileDataReader.Read())
                                        {
                                            IDictionary<string, object> record = new Dictionary<string, object>();
                                            Geometry geometry = shapeFileDataReader.Geometry;
                                            if (string.IsNullOrWhiteSpace(geometryType) || geometryType == geometry.GeometryType || geometryType.Contains(geometry.GeometryType))
                                            {
                                                record.Add("geom", geometry);
                                            }
                                            else
                                            {
                                                throw new Exception("Dạng hình học của lớp dữ liệu không khớp với shapefile");
                                            }
                                            for (int i = 0; i < header.NumFields; i++)
                                            {
                                                try
                                                {
                                                    DbaseFieldDescriptor fldDescriptor = header.Fields[i];
                                                    if (fldDescriptor.Name == nameof(GeoPoint.toado_y))
                                                    {
                                                        record.Add(header.Fields[i].Name.ToLower(), geometry?.Coordinate?.X);
                                                    }
                                                    else if (fldDescriptor.Name == nameof(GeoPoint.toado_x))
                                                    {
                                                        record.Add(header.Fields[i].Name.ToLower(), geometry?.Coordinate?.Y);
                                                    }
                                                    else if (fldDescriptor.Name == nameof(GeoShape.geom_text))
                                                    {
                                                        record.Add(header.Fields[i].Name.ToLower(), geometry?.AsText());
                                                    }
                                                    else if (header.Fields[i].Type == typeof(string))
                                                    {
                                                        string value = shapeFileDataReader.GetString(i + 1);
                                                        if (string.IsNullOrWhiteSpace(value))
                                                        {
                                                            record.Add(header.Fields[i].Name.ToLower(), null);
                                                        }
                                                        else if (value.Contains("\\"))
                                                        {
                                                            record.Add(header.Fields[i].Name.ToLower(), value);
                                                        }
                                                        else
                                                        {
                                                            //record.Add(header.Fields[i].Name, value.DecodeFromUtf8());
                                                            string decode = Encoding.UTF8.GetString(Encoding.Default.GetBytes(value));
                                                            record.Add(header.Fields[i].Name.ToLower(), Encoding.UTF8.GetString(Encoding.Default.GetBytes(value)));
                                                        }
                                                    }
                                                    else if (header.Fields[i].Type == typeof(Int64))
                                                    {
                                                        record.Add(header.Fields[i].Name.ToLower(), shapeFileDataReader.GetInt64(i + 1));
                                                    }
                                                    else
                                                        record.Add(header.Fields[i].Name.ToLower(), shapeFileDataReader.GetValue(i + 1));
                                                }
                                                catch (System.Exception e)
                                                {
                                                    continue;
                                                }
                                            }
                                            records.Add(record);
                                        }
                                    }
                                    shapeFileDataReader.Close();
                                    shapeFileDataReader.Dispose();
                                }
                            }
                        }
                    }
                }
                IDictionary<string, List<IDictionary<string, object>>> data = new Dictionary<string, List<IDictionary<string, object>>>();
                data.Add(layerName, records);
                if (files.Count() > 0)
                {
                    foreach (var fileItem in files)
                    {
                        if (System.IO.File.Exists(fileItem))
                        {
                            System.IO.File.Delete(fileItem);
                        }
                    }
                }
                return data;
            }
        }

        private IDictionary<string, List<IDictionary<string, object>>> parseGeojson(IFormFile file, string geometryType = "", string layerName = "")
        {
            using (var session = OpenSession())
            {
                IFormFile? geoJsonFile = file.FileName.Substring(file.FileName.IndexOf(".")) == ".geojson" ? file : null;
                IFormFile? kmlFile = file.FileName.Substring(file.FileName.IndexOf(".")) == ".kml" ? file : null;

                string? geoJsonDirectory = string.Empty;
                string? kmlDirectory = string.Empty;
                string[] files = { };
                if (file.ContentType == "application/zip" || file.ContentType == "application/x-zip-compressed")
                {
                    var forderTemp = extractZip(file);
                    files = Directory.GetFileSystemEntries(forderTemp, "*", SearchOption.AllDirectories);
                    geoJsonDirectory = files.Where(x => x.Contains(".geojson")).FirstOrDefault();
                    kmlDirectory = files.Where(x => x.Contains(".kml")).FirstOrDefault();
                }
                if (string.IsNullOrEmpty(geoJsonDirectory) && string.IsNullOrEmpty(kmlDirectory))
                {
                    throw new Exception("File import không hợp lệ. Vui lòng kiểm tra lại!");
                }
                else
                {
                    string baseName = string.Empty;
                    List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                    if (!string.IsNullOrEmpty(geoJsonDirectory))
                    {
                        MemoryStream geoJSonMs = new MemoryStream();
                        var geoJson = System.IO.File.ReadAllText(geoJsonDirectory);
                        var reader = new GeoJsonReader();
                        var featureCollection = reader.Read<FeatureCollection>(geoJson);

                        // Lấy danh sách trường
                        var featureFirstAttr = featureCollection.FirstOrDefault().Attributes;
                        string[] nameHeaders = featureFirstAttr.GetNames();
                        DbaseFileHeader header = new DbaseFileHeader();
                        DbaseFileHeader.DefaultEncoding = Encoding.UTF8;

                        IDictionary<string, object> recordHeader = new Dictionary<string, object>();
                        IDictionary<string, object> recordAlias = new Dictionary<string, object>();
                        foreach (string name in nameHeaders)
                        {
                            Type type = featureFirstAttr.GetType(name);
                            recordAlias.Add(name.ToLower(), name);
                            if (type == typeof(double) || type == typeof(float))
                            {
                                header.AddColumn(name, 'N', DoubleLength, DoubleDecimals);
                                recordHeader.Add(name.ToLower(), EnumPgDataType.Double);
                            }
                            else if (type == typeof(short) || type == typeof(ushort) ||
                                     type == typeof(int) || type == typeof(uint) ||
                                     type == typeof(long) || type == typeof(ulong))
                            {
                                header.AddColumn(name, 'N', IntLength, IntDecimals);
                                recordHeader.Add(name.ToLower(), EnumPgDataType.Integer);
                            }
                            else if (type == typeof(bool))
                            {
                                header.AddColumn(name, 'L', BoolLength, BoolDecimals);
                                recordHeader.Add(name.ToLower(), EnumPgDataType.Boolean);
                            }
                            else if (type == typeof(DateTime))
                            {
                                header.AddColumn(name, 'D', DateLength, DateDecimals);
                                recordHeader.Add(name.ToLower(), EnumPgDataType.DateTime);
                            }
                            else
                            {
                                header.AddColumn(name, 'C', StringLength, StringDecimals);
                                recordHeader.Add(name.ToLower(), EnumPgDataType.String);
                            }
                        }
                        records.Add(recordHeader);
                        records.Add(recordAlias);
                        foreach (var feature in featureCollection)
                        {
                            IDictionary<string, object> record = new Dictionary<string, object>();
                            Geometry geometry = feature.Geometry;
                            if (string.IsNullOrWhiteSpace(geometryType)
                                    || geometryType == geometry.GeometryType
                                    || geometryType.ToLower().Contains(geometry.GeometryType.ToLower()))
                            {
                                record.Add("geom", geometry);
                            }
                            else
                                throw new Exception("Dạng hình học của lớp dữ liệu không khớp với file geojson");

                            IAttributesTable attributes = feature.Attributes;

                            for (int i = 0; i < header.NumFields; i++)
                            {
                                DbaseFieldDescriptor fldDescriptor = header.Fields[i];
                                if (fldDescriptor.Name == nameof(GeoPoint.toado_y))
                                {
                                    record.Add(header.Fields[i].Name.ToLower(), geometry?.Coordinate?.X);
                                }
                                else if (fldDescriptor.Name == nameof(GeoPoint.toado_x))
                                {
                                    record.Add(header.Fields[i].Name.ToLower(), geometry?.Coordinate?.Y);
                                }
                                else if (fldDescriptor.Name == nameof(GeoShape.geom_text))
                                {
                                    record.Add(header.Fields[i].Name.ToLower(), geometry?.AsText());
                                }
                                else if (header.Fields[i].Type == typeof(string))
                                {
                                    string? value = attributes.GetOptionalValue(header.Fields[i].Name)?.ToString();
                                    if (string.IsNullOrWhiteSpace(value))
                                    {
                                        record.Add(header.Fields[i].Name.ToLower(), null);
                                    }
                                    else if (value.Contains("\\"))
                                    {
                                        record.Add(header.Fields[i].Name.ToLower(), value);
                                    }
                                    else
                                    {
                                        string decode = Encoding.UTF8.GetString(Encoding.Default.GetBytes(value));
                                        record.Add(header.Fields[i].Name.ToLower(), Encoding.UTF8.GetString(Encoding.Default.GetBytes(value)));
                                    }
                                }
                                else if (header.Fields[i].Type == typeof(Int64))
                                {
                                    record.Add(header.Fields[i].Name.ToLower(), int.Parse(attributes.GetOptionalValue(header.Fields[i].Name)?.ToString()));
                                }
                                else
                                    record.Add(header.Fields[i].Name.ToLower(), attributes.GetOptionalValue(header.Fields[i].Name));
                            }
                            records.Add(record);
                        }
                    }
                    else
                    {
                        MemoryStream kmlMs = new MemoryStream();
                        StringBuilder builder = new StringBuilder();
                        using (StreamReader reader = System.IO.File.OpenText(kmlDirectory))
                        {
                            GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                            var xmlString = reader.ReadToEnd();

                            Parser parser = new Parser();
                            parser.ParseString(xmlString, false);

                            SharpKml.Dom.Kml kml = (SharpKml.Dom.Kml)parser.Root;
                            SharpKml.Dom.Document document = (SharpKml.Dom.Document)kml.Feature;

                            SharpKml.Dom.Schema schema = (SharpKml.Dom.Schema)document.Schemas.FirstOrDefault();
                            List<SharpKml.Dom.SimpleField> fields = schema.Fields.ToList();

                            DbaseFileHeader header = new DbaseFileHeader();
                            DbaseFileHeader.DefaultEncoding = Encoding.UTF8;

                            IDictionary<string, object> recordHeader = new Dictionary<string, object>();
                            foreach (var field in fields)
                            {
                                string type = field.FieldType;
                                string name = field.Name;
                                try
                                {
                                    if (type == "double" || type == "float")
                                    {
                                        header.AddColumn(name, 'N', DoubleLength, DoubleDecimals);
                                        recordHeader.Add(name.ToLower(), EnumPgDataType.Double);
                                    }
                                    else if (type == "short" || type == "ushort" ||
                                             type == "int" || type == "uint" ||
                                             type == "long" || type == "ulong")
                                    {
                                        header.AddColumn(name, 'N', IntLength, IntDecimals);
                                        recordHeader.Add(name.ToLower(), EnumPgDataType.Integer);
                                    }
                                    else if (type == "bool")
                                    {
                                        header.AddColumn(name, 'L', BoolLength, BoolDecimals);
                                        recordHeader.Add(name.ToLower(), EnumPgDataType.Boolean);
                                    }
                                    else if (type == "datetime")
                                    {
                                        header.AddColumn(name, 'D', DateLength, DateDecimals);
                                        recordHeader.Add(name.ToLower(), EnumPgDataType.DateTime);
                                    }
                                    else
                                    {
                                        header.AddColumn(name, 'C', StringLength, StringDecimals);
                                        recordHeader.Add(name.ToLower(), EnumPgDataType.String);
                                    }
                                }
                                catch (System.Exception)
                                {
                                    continue;
                                }
                            }
                            records.Add(recordHeader);

                            SharpKml.Dom.Folder folderFeature = (SharpKml.Dom.Folder)(document.Features.FirstOrDefault());
                            List<SharpKml.Dom.Feature> plackMarkCollection = (List<SharpKml.Dom.Feature>)folderFeature.Features.ToList();

                            foreach (SharpKml.Dom.Placemark feature in plackMarkCollection)
                            {
                                IDictionary<string, object> record = new Dictionary<string, object>();

                                SharpKml.Dom.Geometry geometryKml = feature.Geometry;
                                Geometry? geometry = kmlGeometryToGeometry(geometryKml);
                                if (geometry != null)
                                {
                                    if (string.IsNullOrWhiteSpace(geometryType)
                                    || geometryType == geometry.GeometryType
                                    || geometryType.ToLower().Contains(geometry.GeometryType.ToLower()))
                                    {
                                        record.Add("geom", geometry);
                                    }
                                    else
                                        throw new Exception("Dạng hình học của lớp dữ liệu không khớp với file kml");
                                }
                                else
                                {
                                    record.Add("geom", null);
                                }
                                SharpKml.Dom.ExtendedData extendedData = feature.ExtendedData;
                                SharpKml.Dom.SchemaData schemaData = (SharpKml.Dom.SchemaData)extendedData.SchemaData.FirstOrDefault();
                                List<SharpKml.Dom.SimpleData> simpleDatas = (List<SharpKml.Dom.SimpleData>)schemaData.SimpleData.ToList();

                                foreach (SharpKml.Dom.SimpleData simpleData in simpleDatas)
                                {
                                    record.Add(simpleData.Name, simpleData.Text);
                                }
                                records.Add(record);
                            }
                        }
                    }
                    IDictionary<string, List<IDictionary<string, object>>> data = new Dictionary<string, List<IDictionary<string, object>>>();
                    data.Add(layerName, records);
                    if (files.Count() > 0)
                    {
                        foreach (var fileItem in files)
                        {
                            if (System.IO.File.Exists(fileItem))
                            {
                                System.IO.File.Delete(fileItem);
                            }
                        }
                    }
                    return data;
                }
            }
        }

        private IDictionary<string, List<IDictionary<string, object>>> parseGDB(IFormFile file)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    WKTReader wKTReader = new WKTReader();
                    var wgs84Sp = new SpatialReference("");
                    wgs84Sp.ImportFromEPSG(4326);
                    wgs84Sp.SetAxisMappingStrategy(AxisMappingStrategy.OAMS_TRADITIONAL_GIS_ORDER);

                    string fullPath = string.Empty;

                    IDictionary<string, List<IDictionary<string, object>>> data = new Dictionary<string, List<IDictionary<string, object>>>();
                    if (file.ContentType == "application/zip" || file.ContentType == "application/x-zip-compressed")
                    {
                        fullPath = extractRar(file, StringHelper.RandomFileName() + ".gdb");
                    }
                    else if (file.ContentType == "application/vnd.rar")
                    {
                        fullPath = extractRar(file, StringHelper.RandomFileName() + ".gdb");
                    }
                    else
                    {
                        throw new Exception($"File {file.FileName} không hợp lệ, vui lòng kiểm tra lại!");
                    }

                    using (var mem = new MemoryStream())
                    {
                        OGR.Ogr.RegisterAll();
                        var fileGdbDriver = OGR.Ogr.GetDriverByName("OpenFileGDB");

                        using (OGR.DataSource dataSource = fileGdbDriver.Open(fullPath, 0))
                        {
                            if (dataSource == null)
                            {
                                throw new Exception($"{file.FileName}: Không đọc được dữ liệu file, vui lòng kiểm tra lại!");
                            }
                            if (dataSource.GetLayerCount() == 0)
                            {
                                throw new Exception($"{file.FileName}: File GDB không tồn tại lớp dữ liệu, vui lòng kiểm tra lại!");
                            }
                            for (int i = 0; i < dataSource.GetLayerCount(); i++)
                            {
                                List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                                var layer = dataSource.GetLayerByIndex(i);
                                if (layer == null)
                                {
                                    throw new Exception("{file.FileName}: Đã xảy ra lỗi, vui lòng kiểm tra lại!");
                                }
                                var spatialReference = layer.GetSpatialRef();
                                if (spatialReference == null)
                                {
                                    spatialReference = wgs84Sp;
                                }
                                var transform = Osr.CreateCoordinateTransformation(spatialReference, wgs84Sp, new CoordinateTransformationOptions
                                {

                                });
                                var shapeType = layer.GetGeomType().ToString("G").Substring(3);

                                if (shapeType == "Point25D(2)")
                                {
                                    shapeType = "Point";
                                }

                                if (shapeType == "PointZM(2)")
                                {
                                    shapeType = "Point";
                                }

                                var layerDefinition = layer.GetLayerDefn();

                                IDictionary<string, object> recordHeader = new Dictionary<string, object>();
                                IDictionary<string, object> recordAlias = new Dictionary<string, object>();
                                recordHeader.Add("geom", shapeType);
                                recordAlias.Add("geom", "geom");
                                for (var j = 0; j < layerDefinition.GetFieldCount(); j++)
                                {
                                    var field = layerDefinition.GetFieldDefn(j);
                                    var alias = field.GetAlternativeName();
                                    var aliasRef = field.GetAlternativeNameRef();
                                    recordAlias.Add(field.GetName().ToLower(), alias);
                                    switch (field.GetFieldType())
                                    {
                                        case OGR.FieldType.OFTBinary:
                                            break;
                                        case OGR.FieldType.OFTDateTime:
                                        case OGR.FieldType.OFTTime:
                                        case OGR.FieldType.OFTDate:
                                            recordHeader.Add($"{field.GetName().ToLower()}", EnumPgDataType.DateTime);
                                            break;
                                        case OGR.FieldType.OFTInteger:
                                            recordHeader.Add($"{field.GetName().ToLower()}", EnumPgDataType.Integer);
                                            break;
                                        case OGR.FieldType.OFTInteger64:
                                            recordHeader.Add($"{field.GetName().ToLower()}", EnumPgDataType.BigInt);
                                            break;
                                        case OGR.FieldType.OFTReal:
                                            recordHeader.Add($"{field.GetName().ToLower()}", EnumPgDataType.Double);
                                            break;
                                        default:
                                            recordHeader.Add($"{field.GetName().ToLower()}", $"{EnumPgDataType.String}_{field.GetWidth()}");
                                            break;
                                    }
                                }
                                records.Add(recordHeader);
                                records.Add(recordAlias);
                                OGR.Feature feature;
                                while ((feature = layer.GetNextFeature()) != null)
                                {
                                    if (feature != null)
                                    {
                                        IDictionary<string, object> record = new Dictionary<string, object>();
                                        OGR.Geometry gdalGeometry = feature.GetGeometryRef();
                                        Geometry? geometry = null;
                                        if (gdalGeometry != null)
                                        {
                                            if (spatialReference.IsSame(wgs84Sp, new string[] { }) == 0)
                                            {
                                                gdalGeometry.Transform(transform);
                                            }
                                            int result = gdalGeometry.ExportToWkt(out string wkt);
                                            if (wkt.Contains("MULTISURFACE") || wkt.Contains("MULTICURVE"))
                                            {
                                                geometry = session.Query<Geometry>($"SELECT ST_CurveToLine(ST_GeomFromText('{wkt}'), 32, 2, 2) AS geometry").FirstOrDefault();
                                                record.Add("geom", geometry);
                                            }
                                            else
                                            {
                                                geometry = wKTReader.Read(wkt);
                                                record.Add("geom", geometry);
                                            }
                                        }
                                        for (int k = 0; k < layerDefinition.GetFieldCount(); k++)
                                        {
                                            var field = layerDefinition.GetFieldDefn(k);
                                            if (field.GetName().ToLower() == nameof(GeoPoint.toado_y))
                                            {
                                                record.Add(field.GetName().ToLower(), geometry?.Coordinate?.X ?? 0);
                                            }
                                            else if (field.GetName().ToLower() == nameof(GeoPoint.toado_x))
                                            {
                                                record.Add(field.GetName().ToLower(), geometry?.Coordinate?.Y ?? 0);
                                            }
                                            else if (field.GetName().ToLower() == nameof(GeoShape.geom_text))
                                            {
                                                record.Add(field.GetName().ToLower(), geometry?.AsText() ?? string.Empty);
                                            }
                                            else
                                            {
                                                switch (field.GetFieldType())
                                                {
                                                    case OGR.FieldType.OFTBinary:
                                                        break;
                                                    case OGR.FieldType.OFTDateTime:
                                                    case OGR.FieldType.OFTTime:
                                                    case OGR.FieldType.OFTDate:
                                                        DateTime dateValue;
                                                        var dateString = feature.GetFieldAsString(field.GetName());
                                                        if (dateString.IndexOf("+") > 0)
                                                        {
                                                            dateString = dateString.Substring(0, dateString.IndexOf("+"));
                                                        }
                                                        if (DateTime.TryParseExact(dateString, "yyyy/MM/dd hh:mm:ss", CultureInfo.CurrentCulture, DateTimeStyles.None, out dateValue))
                                                        {
                                                            record.Add(field.GetName().ToLower(), dateValue);
                                                        }
                                                        else
                                                        {
                                                            record.Add(field.GetName().ToLower(), null);
                                                        }
                                                        break;
                                                    case OGR.FieldType.OFTInteger64:
                                                        record.Add(field.GetName().ToLower(), feature.GetFieldAsInteger64(field.GetName()));
                                                        break;
                                                    case OGR.FieldType.OFTInteger:
                                                        record.Add(field.GetName().ToLower(), feature.GetFieldAsInteger(field.GetName()));
                                                        break;
                                                    case OGR.FieldType.OFTReal:
                                                        record.Add(field.GetName().ToLower(), feature.GetFieldAsDouble(field.GetName()));
                                                        break;
                                                    case OGR.FieldType.OFTString:
                                                        record.Add(field.GetName().ToLower(), feature.GetFieldAsString(field.GetName()));
                                                        break;
                                                    default:
                                                        record.Add(field.GetName().ToLower(), feature.GetFieldAsString(field.GetName()));
                                                        break;
                                                }
                                            }
                                        }
                                        records.Add(record);
                                        feature.Dispose();
                                    }
                                }
                                data.Add(layer.GetName().ToLower(), records);
                            }
                        }
                        if (System.IO.File.Exists(fullPath))
                        {
                            System.IO.File.Delete(fullPath);
                        }
                        return data;
                    }
                }
            }
        }
        private Geometry? kmlGeometryToGeometry(SharpKml.Dom.Geometry kmlGeometry)
        {
            Geometry? geometry = null;
            if (kmlGeometry != null)
            {
                var geometryType = kmlGeometry.GetType();
                GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                if (geometryType == typeof(SharpKml.Dom.Point))
                {
                    SharpKml.Dom.Point kmlPoint = kmlGeometry as SharpKml.Dom.Point;
                    if (kmlPoint != null)
                    {
                        var coordinate = new Coordinate { X = kmlPoint.Coordinate.Longitude, Y = kmlPoint.Coordinate.Latitude };
                        geometry = geometryFactory.CreatePoint(coordinate);
                    }
                }
                else if (geometryType == typeof(SharpKml.Dom.LineString))
                {
                    SharpKml.Dom.LineString kmlLineString = kmlGeometry as SharpKml.Dom.LineString;
                    var kmlCoordinates = kmlLineString?.Coordinates;
                    var coordinates = new List<Coordinate>();
                    if (kmlCoordinates != null)
                    {
                        foreach (var kmlCoordinate in kmlCoordinates)
                        {
                            coordinates.Add(new Coordinate { X = kmlCoordinate.Longitude, Y = kmlCoordinate.Latitude });
                        }
                    }
                    geometry = geometryFactory.CreateLineString(coordinates.ToArray());
                }
                else if (geometryType == typeof(SharpKml.Dom.Polygon))
                {
                    SharpKml.Dom.Polygon kmlPolygon = kmlGeometry as SharpKml.Dom.Polygon;
                    var kmlCoordinates = kmlPolygon?.OuterBoundary.LinearRing.Coordinates;
                    var coordinates = new List<Coordinate>();
                    if (kmlCoordinates != null)
                    {
                        foreach (var kmlCoordinate in kmlCoordinates)
                        {
                            coordinates.Add(new Coordinate { X = kmlCoordinate.Longitude, Y = kmlCoordinate.Latitude });
                        }
                    }
                    geometry = geometryFactory.CreatePolygon(coordinates.ToArray());
                }
            }
            return geometry;
        }

        /// <summary>
        /// Convert geometry imported from excel
        /// </summary>
        /// <param name="geoValue">(Ex: "105.851857648, 21.008641158; 105.852006059, 21.0086324110001; 105.852015931, 21.008631918")</param>
        /// <param name="geometryType">(Ex: "Point")</param>
        /// <returns></returns>
        private Geometry? renderGeometry(string geoValue, string geometryType)
        {

            GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
            Geometry? geometry = null;
            if (geometryType == EnumGeometryType.Point)
            {
                var coords = geoValue.Split(",").Select(x => double.Parse(x)).ToList();
                var coordinate = new Coordinate { X = coords[0], Y = coords[1] };
                geometry = geometryFactory.CreatePoint(coordinate);
            }
            else if (geometryType == EnumGeometryType.LineString || geometryType == EnumGeometryType.MultiLineString)
            {
                var coordinates = new List<Coordinate>();
                foreach (var coords in geoValue.Split(";"))
                {
                    var listCoordinate = coords.Split(",").Select(x => double.Parse(x)).ToList();
                    coordinates.Add(new Coordinate { X = listCoordinate[0], Y = listCoordinate[1] });
                }
                geometry = geometryFactory.CreateLineString(coordinates.ToArray());
            }
            else if (geometryType == EnumGeometryType.Polygon || geometryType == EnumGeometryType.MultiPolygon)
            {
                var coordinates = new List<Coordinate>();
                foreach (var coords in geoValue.Split(";"))
                {
                    var listCoordinate = coords.Split(",").Select(x => double.Parse(x)).ToList();
                    coordinates.Add(new Coordinate { X = listCoordinate[0], Y = listCoordinate[1] });
                }
                geometry = geometryFactory.CreatePolygon(coordinates.ToArray());
            }
            return geometry;
        }

        private void removeDirectory(string pathFolder)
        {
            if (Directory.Exists(pathFolder))
            {
                DirectoryInfo folder = new DirectoryInfo(pathFolder);
                DirectoryInfo[] directories = folder.GetDirectories();
                FileInfo[] files = folder.GetFiles();
                foreach (var file in files)
                {
                    System.IO.File.Delete(file.FullName);
                }
                foreach (var directory in directories)
                {
                    removeDirectory(directory.FullName);
                }
                Directory.Delete(pathFolder);
            }
        }
    }
}
