using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.Entities;
using OfficeOpenXml;
using System.IO;
using NetTopologySuite.IO.Streams;
using OpenGIS.Module.Core.Models;
using System.Text;
using ICSharpCode.SharpZipLib.Zip;
using ICSharpCode.SharpZipLib.Core;
using OpenGIS.Module.Core.ViewModels;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models.DTO;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Enums;
using StringHelper = VietGIS.Infrastructure.Helpers.StringHelper;
using System.Globalization;
using OGR = OSGeo.OGR;
using OSR = OSGeo.OSR;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using OpenGIS.Module.Core.Helpers;
using Microsoft.AspNetCore.Authorization;
using Npgsql;
using NetTopologySuite;

namespace OpenGIS.Module.API.Controllers
{
    public partial class LayerController
    {
        [HttpPost("data")]
        public RestBase data([FromBody] SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
            {
                TableInfo? table;
                if (dto == null || ((!dto.layer_id.HasValue || dto.layer_id.Value == 0)
                    && (!dto.table_id.HasValue && dto.table_id.Value == 0)))
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
                    if (dto.layer_id > 0)
                    {
                        Layer? layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                        if (layer == null)
                            return new RestError()
                            {
                                errors = new RestErrorDetail[]
                                {
                                        new RestErrorDetail() { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                                }
                            };
                        table = layer.table;
                    }
                    else
                    {
                        table = getTableAndColumns(dto.table_id.Value);
                    }
                    if (table == null)
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                    new RestErrorDetail() { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        string conditions = string.Empty;

                        string select = @$"SELECT {String.Join(',', table.columns.Where(x => "geom".Equals(x.column_name) == false && "search_content".Equals(x.column_name) == false).Select(x => $"{table.table_schema}.{table.table_name}.{x.column_name}"))}";
                        string tables = @$" FROM {table.table_schema}.{table.table_name} ";
                        if (table.columns.Select(x => x.column_name).Contains("commune_code"))
                        {
                            select += $",{Sql.Entity<Commune>(x => x.name_vn):TC} AS commune_name ";
                            tables += @$" LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.commune_code ";
                        }
                        if (table.columns.Select(x => x.column_name).Contains("district_code"))
                        {
                            select += $",{Sql.Entity<District>(x => x.name_vn):TC} AS district_name ";
                            tables += @$" LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.district_code ";
                        }
                        if (table.columns.Select(x => x.column_name).Contains("province_code"))
                        {
                            select += $",{Sql.Entity<Province>(x => x.name_vn):TC} AS province_name ";
                            tables += @$" LEFT OUTER JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {table.table_schema}.{table.table_name}.province_code ";
                        }
                        conditions = getConditions(table, dto.@params);
                        string wheres = $" WHERE {conditions}";

                        string sqlCount = select + tables + wheres;
                        int totalCount = session.Query(sqlCount).ToList().Count;
                        string orderby = "";
                        TableColumn? orderColumn = table.label_column ?? table.key_column ?? table.identity_column;
                        if (orderColumn != null)
                        {
                            orderby = $" ORDER BY {orderColumn.column_name} ";
                        }

                        string sql = select + tables + wheres + orderby;
                        if (dto.take > 0)
                        {
                            sql += $" LIMIT {dto.take} OFFSET {dto.skip}";
                        }
                        var result = session.Query(sql).ToList();

                        var records = result.Select(x => (IDictionary<string, object>)x).ToList();
                        return new RestData()
                        {
                            data = new
                            {
                                dataSearch = new DevExprGridData
                                {
                                    data = records,
                                    totalCount = totalCount,
                                },
                            }
                        };
                    }
                }
            }
        }

        [HttpPost("import")]
        public async Task<RestBase> importData([FromForm] ImportDataDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null || dto.file == null || ((!dto.layerId.HasValue || dto.layerId.Value == 0) && (!dto.tableId.HasValue || dto.tableId.Value == 0)))
                {
                    return new RestError(400, "Vui lòng kiểm tra lại tham số!");
                }
                var tableInfo = new TableInfo();
                ///Xóa cache advanced-search
                if (dto.layerId.HasValue && dto.layerId.Value > 0)
                {
                    var layer = getLayerWithTableAndColumn(dto.layerId.Value);
                    if (layer == null)
                    {
                        return new RestError(400, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    tableInfo = layer.table;
                }
                else if (dto.tableId.HasValue && dto.tableId.Value > 0)
                {
                    tableInfo = getTableAndColumns(dto.tableId.Value);
                }

                if (tableInfo != null)
                {
                    await _workContext.ClearSearchCacheAsync(tableInfo);
                }

                switch (dto.type)
                {
                    case "SHP":
                    case "GDB":
                        return await importGDBorSHPV2(dto);
                    case "Excel":
                        return await importExcel(dto);
                    default:
                        return new RestError(400, "Kiểu dữ liệu không xác định!");
                }
            }
        }
        [HttpPost("export/{type}")]
        public IActionResult exportData([FromBody] SearchByLogicDTO dto, [FromRoute] string type)
        {
            using (var session = OpenSession())
            {
                if (dto == null
                || (!dto.layer_id.HasValue || dto.layer_id.Value == 0)
                && (!dto.table_id.HasValue || dto.table_id.Value == 0))
                    return NotFound();
                switch (type.ToLower())
                {
                    case "shp":
                        return exportShapeFile(dto);
                    case "gdb":
                        return exportGDBFile(dto);
                    case "excel":
                        return exportExcelFile(dto);
                    case "csv":
                        return exportCSVFile(dto);
                    case "mapinfo":
                        return exportMapInfo(dto);
                    default:
                        return NotFound();
                }
            }
        }
        [HttpPost("export/templates/{type}")]
        public IActionResult exportTemplate([FromBody] SearchByLogicDTO dto, [FromRoute] string type)
        {
            using (var session = OpenSession())
            {
                if (dto == null
                || (!dto.layer_id.HasValue || dto.layer_id.Value == 0)
                && (!dto.table_id.HasValue || dto.table_id.Value == 0))
                    return NotFound();
                switch (type)
                {
                    case "SHP":
                        return exportTemplateSHP(dto);
                    case "Excel":
                        return exportTemplateExcel(dto);
                    default:
                        return NotFound();
                }
            }
        }
        [HttpPost("{table_schema}/{layerId}/ImportTemplate")]
        public RestBase importTemplate([FromRoute] string table_schema, [FromRoute] int layerId, IFormFile fileImport)
        {
            var layer = getLayerWithTableAndColumn(layerId);
            if (layer == null)
                return new RestError(-1, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
            using (var session = OpenSession())
            {
                IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T} 
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {Sql.Entity<LayerDomain>(x => x.table_id):TC}  = {Sql.Entity<TableInfo>(x => x.id):TC}
                    WHERE {Sql.Entity<LayerDomain>(x => x.layer_id):TC} = {layer.id}", (d, t) =>
                {
                    d.table = t;
                    return d;
                },
                    splitOn: $"{Sql.Entity<LayerDomain>(x => x.table_id):TC}");

                var tableInfo = session.Find<TableInfo>(stm => stm.Where($"{nameof(TableInfo.id)} = @table_info_id AND {nameof(TableInfo.table_schema)} = @table_schema")
                    .WithParameters(new { table_info_id = layer.table_info_id, table_schema = table_schema })
                ).FirstOrDefault();
                if (tableInfo == null)
                    return new RestError(-1, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                IDictionary<string, IEnumerable<CategoryBaseEntity>> domains_values =
                    new Dictionary<string, IEnumerable<CategoryBaseEntity>>();
                foreach (var domain in domains)
                {
                    domains_values.Add(
                        layer.table.columns.FirstOrDefault(x => x.id == domain.column_id)?.column_name ?? "",
                        session.Query<CategoryBaseEntity>(
                            $"SELECT * FROM {domain.table.table_schema}.{domain.table.table_name}"
                            )
                        );
                }

                List<TableColumn> tableColumns = session.Find<TableColumn>(stm => stm
                    .Where($"{nameof(TableColumn.table_id)} = @table_id AND {nameof(TableColumn.visible)} = true")
                    .WithParameters(new { table_id = layer.table.id })
                    .OrderBy($"{nameof(TableColumn.order)}, {nameof(TableColumn.name_vn)}")
                ).ToList();

                using (ExcelPackage p = new ExcelPackage(fileImport.OpenReadStream()))
                {
                    var workbook = p.Workbook;
                    var worksheets = workbook.Worksheets;

                    var rowStart = 4;

                    foreach (var worksheet in worksheets)
                    {
                        for (int i = rowStart; i <= worksheet.Dimension.Rows; i++)
                        {
                            string parameter = "";
                            string valueParame = "";
                            var col = 2;
                            var incre = 0;
                            for (int j = 0; j < tableColumns.Count(); j++)
                            {
                                parameter += tableColumns[j].column_name + ",";
                                if (tableColumns[j].name_vn == worksheet.Cells[2, col + j + incre].Value?.ToString())
                                {
                                    if (tableColumns[j].lookup_table_id == 0)
                                    {
                                        if (tableColumns[j].data_type.Equals(EnumPgDataType.Boolean))
                                        {
                                            string xepLoai = "null,";
                                            if (!string.IsNullOrWhiteSpace(worksheet.Cells[i, col + incre + j].Value
                                                    ?.ToString()) &&
                                                worksheet.Cells[3, col + j + incre].Value?.ToString() == "Có")
                                            {
                                                xepLoai = "1,";
                                            }

                                            if (!string.IsNullOrWhiteSpace(worksheet.Cells[i, col + incre + j + 1].Value
                                                    ?.ToString()) &&
                                                worksheet.Cells[3, col + j + incre + 1].Value?.ToString() ==
                                                "Không")
                                            {
                                                xepLoai = "0,";
                                            }

                                            incre++;
                                            valueParame += xepLoai;
                                        }
                                        else
                                        {
                                            if (!string.IsNullOrWhiteSpace(worksheet.Cells[i, col + j + incre].Value
                                                ?.ToString()))
                                            {
                                                switch (tableColumns[j].data_type)
                                                {
                                                    case EnumPgDataType.SmallInt:
                                                    case EnumPgDataType.Integer:
                                                    case EnumPgDataType.Double:
                                                        valueParame +=
                                                            worksheet.Cells[i, col + j + incre].Value?.ToString() + ",";
                                                        break;
                                                    case EnumPgDataType.String:
                                                    case EnumPgDataType.Text:
                                                        valueParame +=
                                                            $"'{worksheet.Cells[i, col + j + incre].Value?.ToString()}',";
                                                        break;
                                                    case EnumPgDataType.Date:
                                                    case EnumPgDataType.Time:
                                                    case EnumPgDataType.DateTime:
                                                    case EnumPgDataType.DateTimeTZ:
                                                        valueParame +=
                                                            $"'{Convert.ToDateTime(worksheet.Cells[i, col + j + incre].Value?.ToString()).ToString("dd/MM/yyyy")}',";
                                                        break;
                                                    default:
                                                        break;
                                                }
                                            }
                                            else
                                            {
                                                switch (tableColumns[j].data_type)
                                                {
                                                    case EnumPgDataType.SmallInt:
                                                    case EnumPgDataType.Integer:
                                                    case EnumPgDataType.Double:
                                                        valueParame += "null,";
                                                        break;
                                                    case EnumPgDataType.String:
                                                    case EnumPgDataType.Text:
                                                        valueParame += "null,";
                                                        break;
                                                    case EnumPgDataType.Date:
                                                    case EnumPgDataType.Time:
                                                    case EnumPgDataType.DateTime:
                                                    case EnumPgDataType.DateTimeTZ:
                                                        valueParame += "null,";
                                                        break;
                                                    default:
                                                        break;
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        if (tableColumns[j].name_vn ==
                                            worksheet.Cells[2, col + j + incre].Value?.ToString())
                                        {
                                            string danhMucQ = "null,";

                                            List<CategoryBaseEntity>? categories = domains_values.FirstOrDefault(s => s.Key == tableColumns[j].column_name).Value as List<CategoryBaseEntity>;
                                            if (categories != null && categories.Count > 0)
                                            {
                                                for (int k = 0; k < categories.Count; k++)
                                                {
                                                    if (!string.IsNullOrWhiteSpace(worksheet.Cells[i, col + j + incre + k].Value
                                                        ?.ToString()))
                                                    {
                                                        if (worksheet.Cells[3, col + j + incre + k].Value?.ToString() ==
                                                            string.Format(".", categories[k].id, categories[k].mo_ta))
                                                        {
                                                            danhMucQ += categories[k].id + ",";
                                                        }
                                                    }
                                                }
                                                valueParame += danhMucQ;
                                                col += categories.Count() - 1;
                                            }
                                        }
                                    }
                                }
                            }
                            session.Query(
                                $"INSERT INTO {tableInfo.table_schema}.{tableInfo.table_name} ({parameter.Remove(parameter.Length - 1)}) values({valueParame.Remove(valueParame.Length - 1)})");
                        }
                    }
                }
            }
            return new RestBase(EnumErrorCode.OK);
        }
        private IActionResult exportTemplateSHP(SearchByLogicDTO dto)
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            Layer? layer = getLayerWithTableAndColumn(dto.layer_id.Value);
            if (layer == null)
                return NotFound();
            using (var session = OpenSession())
            {
                IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T} 
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {nameof(LayerDomain.table_id):C} = {Sql.Entity<TableInfo>(x => x.id):TC}
                    WHERE {nameof(LayerDomain.layer_id):C} = {layer.id}", (d, t) =>
                {
                    d.table = t;
                    return d;
                },
                    splitOn: $"{nameof(LayerDomain.table_id)}");

                List<TableColumn> tableColumns = session.Find<TableColumn>(stm => stm
                    .Where($"{nameof(TableColumn.table_id)} = {layer.table.id}")
                    .OrderBy($"{nameof(TableColumn.order)} ASC")).ToList();

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
                var wktReader = new WKTReader(geometryFactory);

                List<IFeature> features = new List<IFeature>();
                DbaseFileHeader header = new DbaseFileHeader();
                header.NumRecords = 0;
                foreach (var column in tableColumns)
                {
                    string col_name = column.column_name;
                    if (col_name.Length > 11)
                    {
                        col_name = col_name.Substring(0, 11);
                    }

                    switch (column.data_type)
                    {
                        case EnumPgDataType.BigInt:
                        case EnumPgDataType.SmallInt:
                        case EnumPgDataType.Integer:
                            header.AddColumn(col_name, 'N', IntLength, IntDecimals);
                            break;
                        case EnumPgDataType.Boolean:
                            header.AddColumn(col_name, 'L', BoolLength, BoolDecimals);
                            break;
                        case EnumPgDataType.Double:
                            header.AddColumn(col_name, 'N', DoubleLength, DoubleDecimals);
                            break;
                        case EnumPgDataType.String:
                        case EnumPgDataType.Text:
                            header.AddColumn(col_name, 'C', StringLength, StringDecimals);
                            break;
                        case EnumPgDataType.Date:
                        case EnumPgDataType.Time:
                        case EnumPgDataType.DateTime:
                        case EnumPgDataType.DateTimeTZ:
                            header.AddColumn(col_name, 'D', DateLength, DateDecimals);
                            break;
                        default:
                            break;
                    }
                }

                ShapefileDataWriter shpWriter =
                    new ShapefileDataWriter(streamProviderRegistry, geometryFactory, Encoding.UTF8);
                shpWriter.Header = new DbaseFileHeader(Encoding.UTF8) { NumRecords = 0 };

                foreach (var field in header.Fields)
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
                        ZipEntry shpEntry =
                            new ZipEntry(
                                $"{layer.table_info_id}.shp")
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
                                $"{layer.table_info_id}.dbf")
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
                                $"{layer.table_info_id}.shx")
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
                    return File(ms.ToArray(), "application/zip", string.Format("{0}.zip",
                            StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")));
                }
            }
        }
        private IActionResult exportTemplateExcel(SearchByLogicDTO dto)
        {
            var layer = getLayerWithTableAndColumn(dto.layer_id.Value);
            if (layer == null)
                return NotFound();
            using (var session = OpenSession())
            {
                List<TableColumn>? tableColumns = layer.table.columns.Where(x => x.visible == true
                // && "geom".Equals(x.column_name) == false 
                && x.column_name != "desc").ToList();
                tableColumns = tableColumns.OrderBy(o => o.order).ToList();
                var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (ExcelPackage p = new ExcelPackage())
                {
                    ExcelWorksheet sheet, sheetData;
                    ExcelRange cell;
                    sheet = p.Workbook.Worksheets.Add("Thông tin dữ liệu " + layer.name_vn);
                    sheetData = p.Workbook.Worksheets.Add("DM");
                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Thông tin dữ liệu " + layer.name_vn;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    string cellMerge3;
                    ExcelRange rng3;

                    var row = 2;
                    var colData = 0;

                    cell = sheet.Cells[row, 1];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "STT";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    cell = sheet.Cells[row + 1, 1];
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge3 = sheet.Cells[row, 1] + ":" + sheet.Cells[row + 1, 1];
                    rng3 = sheet.Cells[cellMerge3];
                    rng3.Merge = true;
                    //
                    cell = sheet.Cells[row, 2];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = keyColumn?.column_name;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    cell = sheet.Cells[row + 1, 2];
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge3 = sheet.Cells[row, 2] + ":" + sheet.Cells[row + 1, 2];
                    rng3 = sheet.Cells[cellMerge3];
                    rng3.Merge = true;

                    var col = 3;
                    if (tableColumns != null)
                    {
                        foreach (var column in tableColumns.Where(x => x.column_name != keyColumn.column_name))
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
                                    //cell.Style.ShrinkToFit = true;
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[row + 1, col + 1];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Value = "Không";
                                    cell.Style.WrapText = true;
                                    //cell.Style.ShrinkToFit = true;
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cellMerge3 = sheet.Cells[row, col] + ":" + sheet.Cells[row, col + 1];
                                    rng3 = sheet.Cells[cellMerge3];
                                    rng3.Merge = true;

                                    col++;
                                }
                                else if (column.column_name == "province_code")
                                {
                                    colData = colData + 1;
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

                                    int rowData = 1;

                                    List<Province> data = session.Find<Province>(statement => statement.Where($"{Sql.Entity<Province>(p => p.visible):TC}=TRUE")).ToList();
                                    foreach (var item in data)
                                    {
                                        sheetData.Cells[rowData, colData].Value = item.name_vn;
                                        rowData++;
                                    }

                                    string colLetter = OfficeOpenXml.ExcelCellAddress.GetColumnLetter(col).ToUpper();
                                    string colDataLetter = OfficeOpenXml.ExcelCellAddress.GetColumnLetter(colData).ToUpper();

                                    var dd = sheet.Cells[$"{colLetter}:{colLetter}"].DataValidation.AddListDataValidation();
                                    dd.AllowBlank = true;
                                    dd.Formula.ExcelFormula = $"'DM'!${colDataLetter}$1:${colDataLetter}${rowData}";
                                }
                                else if (column.column_name == "district_code")
                                {
                                    colData = colData + 1;
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

                                    int rowData = 1;

                                    List<District> data = session.Find<District>(statement => statement.Where($"{Sql.Entity<District>(p => p.visible):TC}=TRUE")).ToList();
                                    foreach (var item in data)
                                    {
                                        sheetData.Cells[rowData, colData].Value = item.name_vn;
                                        rowData++;
                                    }

                                    string colLetter = OfficeOpenXml.ExcelCellAddress.GetColumnLetter(col).ToUpper();
                                    string colDataLetter = OfficeOpenXml.ExcelCellAddress.GetColumnLetter(colData).ToUpper();

                                    var dd = sheet.Cells[$"{colLetter}:{colLetter}"].DataValidation.AddListDataValidation();
                                    dd.AllowBlank = true;
                                    dd.Formula.ExcelFormula = $"'DM'!${colDataLetter}$1:${colDataLetter}${rowData}";
                                }
                                else if (column.column_name == "commune_code")
                                {
                                    colData = colData + 1;
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

                                    int rowData = 1;

                                    List<Commune> data = session.Find<Commune>(statement => statement.Where($"{Sql.Entity<Commune>(p => p.visible):TC}=TRUE")).ToList();
                                    foreach (var item in data)
                                    {
                                        sheetData.Cells[rowData, colData].Value = item.name_vn;
                                        rowData++;
                                    }

                                    string colLetter = OfficeOpenXml.ExcelCellAddress.GetColumnLetter(col).ToUpper();
                                    string colDataLetter = OfficeOpenXml.ExcelCellAddress.GetColumnLetter(colData).ToUpper();

                                    var dd = sheet.Cells[$"{colLetter}:{colLetter}"].DataValidation.AddListDataValidation();
                                    dd.AllowBlank = true;
                                    dd.Formula.ExcelFormula = $"'DM'!${colDataLetter}$1:${colDataLetter}${rowData}";
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
                                }
                            }
                            else
                            {
                                colData = colData + 1;
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

                                int rowData = 1;

                                List<DomainViewModel> data = getTableShortData(column.lookup_table_id).ToList();
                                foreach (var item in data)
                                {
                                    sheetData.Cells[rowData, colData].Value = item.mo_ta;
                                    rowData++;
                                }

                                string colLetter = OfficeOpenXml.ExcelCellAddress.GetColumnLetter(col).ToUpper();
                                string colDataLetter = OfficeOpenXml.ExcelCellAddress.GetColumnLetter(colData).ToUpper();

                                var dd = sheet.Cells[$"{colLetter}:{colLetter}"].DataValidation.AddListDataValidation();
                                dd.AllowBlank = true;
                                dd.Formula.ExcelFormula = $"'DM'!${colDataLetter}$1:${colDataLetter}${rowData}";

                                // for (int i = 0; i < data.Count(); i++)
                                // {
                                //     cell = sheet.Cells[row, col + i];
                                //     OfficeHelper.setStyle(ref cell,
                                //         EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                //     cell = sheet.Cells[row + 1, col + i];
                                //     cell.Style.Font.Size = 11;
                                //     cell.Style.Font.Name = "Times New Roman";
                                //     //cell.Value = string.Join(".", data[i].id, data[i].mo_ta);
                                //     cell.Value = data[i].mo_ta;
                                //     cell.Style.WrapText = true;
                                //     OfficeHelper.setStyle(ref cell,
                                //         EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                // }

                                // string cellMerge = sheet.Cells[row, col] + ":" +
                                //                            sheet.Cells[row, col + data.Count() - 1];
                                // ExcelRange rng = sheet.Cells[cellMerge];
                                // rng.Merge = true;
                                // col += data.Count() - 1;
                            }

                            col++;
                        }
                    }

                    cellMerge3 = sheet.Cells[1, 1] + ":" + sheet.Cells[1, sheet.Dimension.Columns];
                    rng3 = sheet.Cells[cellMerge3];
                    rng3.Merge = true;

                    return File(p.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        $"ThongTin_{StringHelper.RemoveVietNameseSign(layer.table.name_vn).Replace(" ", "_")}.xlsx");
                }
            }
        }
        private async Task<RestBase> importGDBorSHP(ImportDataDTO dto)
        {
            using (var session = OpenSession())
            {
                IDictionary<string, List<IDictionary<string, object>>> data;
                if (dto.type == "SHP")
                {
                    data = parseShp(dto.file);
                }
                else if (dto.type == "GDB")
                {
                    data = parseGDB(dto.file);
                }
                else
                {
                    return new RestError(400, "Kiểu import không hợp lệ, vui lòng kiểm tra lại!");
                }
                foreach (var table in data)
                {
                    Layer? layer = new Layer();
                    TableInfo? tableInfo = new TableInfo();
                    if (dto.layerId.HasValue && dto.layerId.Value > 0)
                    {
                        layer = getLayerWithTableAndColumn(dto.layerId.Value);
                        if (layer == null)
                        {
                            return new RestError(404, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                        }
                        tableInfo = layer.table;
                    }
                    else
                    {
                        tableInfo = getTableAndColumns(dto.tableId.Value);
                    }
                    if (tableInfo == null)
                    {
                        return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    if (dto.truncateData.HasValue && dto.truncateData.Value)
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            uow.Connection.Execute(string.Format($"TRUNCATE TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\""));
                        }
                    }

                    List<IDictionary<string, object>>? records = table.Value.ToList();
                    TableColumn? keyColumn = tableInfo.key_column ?? tableInfo.identity_column;
                    if (keyColumn == null)
                    {
                        return new RestError(404, "Không tìm thấy trường khóa chính, vui lòng kiểm tra lại!");
                    }
                    IEnumerable<TableColumn> columns = tableInfo.columns.Where(x => x.column_name != "updated_at" && x.column_name != "created_at" && !x.is_identity);

                    GeoJsonReader reader = new GeoJsonReader();
                    GeoJsonWriter writer = new GeoJsonWriter();

                    List<string> paramMultiInsert = new List<string>();

                    for (int i = 2; i < records.Count(); i++)
                    {
                        var record = records[i];
                        //Check action is INSERT or UPDATE
                        string identifyValue = (record.ContainsKey(keyColumn.column_name) && record[keyColumn.column_name] != null) ? record[keyColumn.column_name].ToString() : "";
                        int countExist = 0;
                        if (string.IsNullOrWhiteSpace(identifyValue) == false)
                        {
                            countExist = session.Query<int>($"SELECT COUNT(1) FROM \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" WHERE \"{keyColumn.column_name}\"::TEXT = @identifyValue",
                                new { identifyValue = identifyValue }
                            ).FirstOrDefault();
                        }
                        if (countExist == 0) // INSERT
                        {
                            List<string> paramInsert = new List<string>();
                            foreach (var column in columns)
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
                                            if (layer != null)
                                            {
                                                Geometry? geometry;
                                                if (record["geom"] is Geometry)
                                                {
                                                    geometry = record["geom"] as Geometry;
                                                    if (geometry != null && !geometry.IsEmpty)
                                                    {
                                                        string gson = writer.Write(geometry);
                                                        // if (geometry.GeometryType == layer.geometry)
                                                        // {
                                                        //     paramInsert.Add($@"ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                                        // }
                                                        // else
                                                        // {
                                                        //     if ((geometry.GeometryType == EnumGeometryType.Point && layer.geometry == EnumGeometryType.MultiPoint)
                                                        //         || (geometry.GeometryType == EnumGeometryType.LineString && layer.geometry == EnumGeometryType.MultiLineString)
                                                        //         || (geometry.GeometryType == EnumGeometryType.Polygon && layer.geometry == EnumGeometryType.MultiPolygon))
                                                        //     {
                                                        //         paramInsert.Add($@"ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)");
                                                        //     }
                                                        //     else
                                                        //     {
                                                        //         paramInsert.Add("NULL");
                                                        //     }
                                                        // }
                                                        if (geometry.GeometryType != layer.geometry)
                                                        {
                                                            if (layer.dimension == 2)
                                                            {
                                                                paramInsert.Add($"geom = ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)");
                                                                // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326) WHERE {keyColumn?.column_name}=@id;";
                                                            }
                                                            else if (layer.dimension == 3)
                                                            {
                                                                paramInsert.Add($"geom = ST_Force3D(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326))");
                                                                // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_Force3D(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)) WHERE {keyColumn?.column_name}=@id;";
                                                            }
                                                        }
                                                        else
                                                        {
                                                            if (layer.dimension == 2)
                                                            {
                                                                paramInsert.Add($"geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                                                // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326) WHERE {keyColumn?.column_name}=@id;";
                                                            }
                                                            else if (layer.dimension == 3)
                                                            {
                                                                paramInsert.Add($"geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326))");
                                                                // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)) WHERE {keyColumn?.column_name}=@id;";
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
                        else // UPDATE
                        {
                            var setSql = new List<string>();
                            foreach (var item in record)
                            {
                                if (item.Value == null)
                                {

                                }
                                else if (layer != null && item.Key == "geom")
                                {
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
                                        string gson = writer.Write(geometry);
                                        if (geometry.GeometryType != layer.geometry)
                                        {
                                            if (layer.dimension == 2)
                                            {
                                                setSql.Add($"geom = ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)");
                                                // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326) WHERE {keyColumn?.column_name}=@id;";
                                            }
                                            else if (layer.dimension == 3)
                                            {
                                                setSql.Add($"geom = ST_Force3D(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326))");
                                                // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_Force3D(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)) WHERE {keyColumn?.column_name}=@id;";
                                            }
                                        }
                                        else
                                        {
                                            if (layer.dimension == 2)
                                            {
                                                setSql.Add($"geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                                // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326) WHERE {keyColumn?.column_name}=@id;";
                                            }
                                            else if (layer.dimension == 3)
                                            {
                                                setSql.Add($"geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326))");
                                                // sql = $"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)) WHERE {keyColumn?.column_name}=@id;";
                                            }
                                        }
                                        // if (geometry.GeometryType == layer.geometry)
                                        // {
                                        //     setSql.Add($@"{item.Key} = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                        // }
                                        // else
                                        // {
                                        //     if ((geometry.GeometryType == EnumGeometryType.Point && layer.geometry == EnumGeometryType.MultiPoint)
                                        //         || (geometry.GeometryType == EnumGeometryType.LineString && layer.geometry == EnumGeometryType.MultiLineString)
                                        //         || (geometry.GeometryType == EnumGeometryType.Polygon && layer.geometry == EnumGeometryType.MultiPolygon))
                                        //     {
                                        //         setSql.Add($@"{item.Key} = ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)");
                                        //     }
                                        // }
                                    }
                                }
                                else if (columns.Select(x => x.column_name).Contains(item.Key))
                                {
                                    if (item.Value is string && !string.IsNullOrWhiteSpace(item.Value.ToString()))
                                    {
                                        setSql.Add($"{item.Key} = '{item.Value}'");
                                    }
                                    else if (item.Value is DateTime)
                                    {
                                        setSql.Add($"{item.Key} = '{((DateTime)item.Value).ToString("MM-dd-yyyy")}'");
                                    }
                                    else
                                    {
                                        setSql.Add($"{item.Key} = {item.Value}");
                                    }
                                }
                            }

                            // setSql = setSql.Remove(setSql.Length - 1); // remove last ','
                            string sqlUpdate = $"UPDATE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" SET {string.Join(", ", setSql)} WHERE \"{keyColumn.column_name}\"::TEXT = @identifyValue ";
                            await session.ExecuteAsync(sqlUpdate, new { identifyValue = identifyValue });
                        }
                    }
                    // Insert multirow
                    if (paramMultiInsert.Count() > 0)
                    {
                        var sqlInsert = $"INSERT INTO {tableInfo.table_schema}.{tableInfo.table_name} ({string.Join(",", columns.Select(x => x.column_name).ToList())}) VALUES {string.Join(",", paramMultiInsert)}";
                        // Console.WriteLine(sqlInsert);
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            try
                            {
                                var user = await _workContext.GetCurrentUser();
                                await session.ExecuteAsync($"ALTER TABLE {tableInfo.table_schema}.{tableInfo.table_name} DISABLE TRIGGER ALL;");
                                await uow.Connection.ExecuteAsync(sqlInsert);
                                await _workContext.SendNotification(new PushNotificationViewModel
                                {
                                    content = $"Tài khoản {user.UserName} vừa cập nhật thông tin đối tượng của lớp {tableInfo.name_vn}. Vui lòng đăng nhập để kiểm tra thông tin.",
                                    title = "Biến động dữ liệu",
                                    user_id = await _workContext.ListNotifyUserIds()
                                });
                            }
                            catch (Exception e)
                            {
                                return new RestError(-1, $"{tableInfo.table_name} insert data error." + e.Message);
                            }
                            finally
                            {
                                await session.ExecuteAsync($"ALTER TABLE {tableInfo.table_schema}.{tableInfo.table_name} ENABLE TRIGGER ALL;");
                            }
                        }
                    }
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }
        private async Task<RestBase> importGDBorSHPV2(ImportDataDTO dto)
        {
            IDictionary<string, List<IDictionary<string, object>>> data;
            if (dto.type == "SHP")
            {
                data = parseShp(dto.file);
            }
            else if (dto.type == "GDB")
            {
                data = parseGDB(dto.file);
            }
            else
            {
                return new RestError(400, "Kiểu import không hợp lệ, vui lòng kiểm tra lại!");
            }

            using var session = OpenSession();

            var wktReader = new WKTReader(new NtsGeometryServices(new PrecisionModel(), 4326));
            var geojsonWriter = new GeoJsonWriter();
            foreach (var table in data)
            {
                Layer? layer = new Layer();
                TableInfo? tableInfo = new TableInfo();
                if (dto.layerId.HasValue && dto.layerId.Value > 0)
                {
                    layer = getLayerWithTableAndColumn(dto.layerId.Value);
                    if (layer == null)
                    {
                        return new RestError(404, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    tableInfo = layer.table;
                }
                else if (dto.tableId.HasValue && dto.tableId.Value > 0)
                {
                    tableInfo = getTableAndColumns(dto.tableId.Value);
                }
                if (tableInfo == null)
                {
                    return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                if (dto.truncateData.HasValue && dto.truncateData.Value)
                {
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        uow.Connection.Execute(string.Format($"TRUNCATE TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\""));
                    }
                }

                List<IDictionary<string, object>>? records = table.Value.ToList();
                TableColumn? keyColumn = tableInfo.key_column ?? tableInfo.identity_column;
                if (keyColumn == null)
                {
                    return new RestError(404, "Không tìm thấy trường khóa chính, vui lòng kiểm tra lại!");
                }
                IEnumerable<TableColumn> columns = tableInfo.columns.Where(x => x.column_name != "updated_at" && x.column_name != "created_at" && !x.is_identity);

                if (records.Count > 2)
                {
                    await session.ExecuteAsync($"ALTER TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" DISABLE TRIGGER ALL;");

                    List<object> listImportedKey = new List<object>();
                    List<IDictionary<string, object>> listUpdate = new List<IDictionary<string, object>>();
                    string sqlCopy = $"COPY \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ({string.Join(",", columns.Select(x => x.column_name).ToList())}) FROM STDIN (FORMAT BINARY)";
                    if (tableInfo.columns.Any(o => o.column_name == "search_content"))
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
                                //Check action is INSERT or UPDATE
                                string? identifyValue = (record.ContainsKey(keyColumn.column_name) && record[keyColumn.column_name] != null) ? record[keyColumn.column_name].ToString() : null;
                                int countExist = 0;
                                if (string.IsNullOrWhiteSpace(identifyValue) == false)
                                {
                                    countExist = session.Query<int>($"SELECT COUNT(1) FROM \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" WHERE \"{keyColumn.column_name}\"::TEXT = @identifyValue",
                                        new { identifyValue = identifyValue }
                                    ).FirstOrDefault();
                                }
                                if (countExist == 0) // INSERT
                                {
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
                                    if (tableInfo.columns.Any(o => o.column_name == "search_content"))
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
                                else // UPDATE
                                {
                                    record.Add("identifyValue", identifyValue);
                                    listUpdate.Add(record);
                                }
                            }

                            writer.Complete();
                        }
                        /// check update record
                        if (listUpdate.Count > 0)
                        {
                            foreach (var record in listUpdate)
                            {
                                var setSql = new List<string>();
                                foreach (var item in record)
                                {
                                    if (layer != null && item.Key == "geom")
                                    {
                                        Geometry? geometry;
                                        if (record["geom"] is Geometry)
                                        {
                                            geometry = record["geom"] as Geometry;
                                        }
                                        else
                                        {
                                            geometry = wktReader.Read(record["geom"].ToString());
                                        }
                                        if (geometry != null && !geometry.IsEmpty)
                                        {
                                            string gson = geojsonWriter.Write(geometry);

                                            if (geometry.GeometryType != layer.geometry)
                                            {
                                                if (layer.dimension == 2)
                                                {
                                                    setSql.Add($"geom = ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326)");
                                                }
                                                else if (layer.dimension == 3)
                                                {
                                                    setSql.Add($"geom = ST_Force3D(ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON('{gson}')), 4326))");
                                                }
                                            }
                                            else
                                            {
                                                if (layer.dimension == 2)
                                                {
                                                    setSql.Add($"geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                                }
                                                else if (layer.dimension == 3)
                                                {
                                                    setSql.Add($"geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326))");
                                                }
                                            }
                                        }
                                    }
                                    else if (columns.Select(x => x.column_name).Contains(item.Key))
                                    {
                                        setSql.Add($"{item.Key} = @{item.Key}");
                                    }
                                }
                                string sqlUpdate = $"UPDATE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" SET {string.Join(", ", setSql)} WHERE \"{keyColumn.column_name}\"::TEXT = @identifyValue";
                                await session.ExecuteAsync(sqlUpdate, record);
                            }
                        }
                        // Chạy lại trường hành chính mặc định theo mã tỉnh mã huyện, mã xã
                        await runQueryRegion(tableInfo, uow);
                        if (tableInfo.columns.Any(o => o.column_name == "search_content"))
                        {
                            await uow.Connection.ExecuteAsync($"UPDATE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" SET search_content = to_tsvector(search_content_en) WHERE search_content IS NULL AND search_content_en IS NOT NULL;");
                        }
                    }

                    await session.ExecuteAsync($"ALTER TABLE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" ENABLE TRIGGER ALL;");
                }
            }
            return new RestBase(EnumErrorCode.OK);
        }
        private async Task<RestBase> importExcel(ImportDataDTO dto)
        {
            using (var session = OpenSession())
            {
                using (var mem = new MemoryStream())
                {
                    await dto.file.CopyToAsync(mem);
                    ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                    using (ExcelPackage excelPackage = new ExcelPackage(mem))
                    {
                        var sheet = excelPackage.Workbook.Worksheets.FirstOrDefault();
                        Layer? layer = null;
                        TableInfo? tableInfo = null;
                        if (dto.layerId.HasValue && dto.layerId.Value > 0)
                        {
                            layer = getLayerWithTableAndColumn(dto.layerId.Value);
                            if (layer == null)
                            {
                                return new RestError(404, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                            }
                            tableInfo = layer.table;
                        }
                        else
                        {
                            tableInfo = getTableAndColumns(dto.tableId.Value);
                        }

                        if (tableInfo == null)
                        {
                            return new RestError(EnumErrorCode.ERROR)
                            {
                                errors = new RestErrorDetail[]
                                {
                                        new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                                }
                            };
                        }
                        if (sheet == null)
                        {
                            return new RestError(EnumErrorCode.ERROR)
                            {
                                errors = new RestErrorDetail[]
                                {
                                        new RestErrorDetail { message = "Tệp Excel không có dữ liệu, vui lòng kiểm tra lại!" }
                                }
                            };
                        }
                        List<TableColumn> selectedColumns = tableInfo.columns.Where(x => x.column_name != "updated_at" && x.column_name != "created_at").ToList();
                        var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id)}"));
                        var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id)}"));
                        var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id)}"));

                        int rowNum = sheet.Dimension.End.Row;
                        int columnNum = sheet.Dimension.End.Column;

                        int keyNumberColumn = 0;
                        TableColumn? keyColumn = tableInfo.identity_column ?? tableInfo.key_column;
                        if (keyColumn == null)
                        {
                            return new RestError(400, "Không tìm thấy trường khóa chính, vui lòng kiểm tra lại!");
                        }
                        for (int i = 2; i <= sheet.Dimension.End.Column; i++)
                        {
                            if (sheet.Cells[2, i] != null && sheet.Cells[2, i].Value != null)
                            {
                                if (sheet.Cells[2, i].Value.Equals(keyColumn?.column_name))
                                {
                                    keyNumberColumn = i;
                                    break;
                                }
                            }
                        }
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            for (int i = 4; i <= rowNum; i++)
                            {
                                GeoJsonWriter writer = new GeoJsonWriter();
                                Dictionary<string, object> attributes = new Dictionary<string, object>();
                                Geometry? geometry = null;
                                var columns = new List<string>();
                                if (keyNumberColumn > 0 && sheet.Cells[i, keyNumberColumn].Value != null)
                                {
                                    if (keyColumn.data_type == EnumPgDataType.String)
                                    {
                                        attributes.Add(keyColumn?.column_name, sheet.Cells[i, keyNumberColumn].Value.ToString());
                                    }
                                    else if (keyColumn.data_type == EnumPgDataType.Integer && int.TryParse(sheet.Cells[i, keyNumberColumn].Value.ToString(), out int objectId))
                                    {
                                        attributes.Add(keyColumn?.column_name, objectId);
                                    }
                                    else
                                    {
                                        continue;
                                    }
                                }
                                for (int j = 2; j <= columnNum; j++)
                                {
                                    if (j == keyNumberColumn)
                                    {
                                        continue;
                                    }
                                    if (sheet.Cells[2, j] != null && sheet.Cells[2, j].Value != null)
                                    {
                                        var fieldName = sheet.Cells[2, j].Value.ToString();
                                        var tableColumn = selectedColumns.Where(x => x.name_vn == fieldName).FirstOrDefault();
                                        if (tableColumn != null)
                                        {
                                            var value = sheet.Cells[i, j].Value;
                                            object _value = string.Empty;
                                            if (layer != null && tableColumn.column_name == "geom")
                                            {
                                                geometry = renderGeometry(value.ToString(), layer.geometry);
                                            }
                                            else if (tableColumn.lookup_table_id > 0)
                                            {
                                                List<DomainViewModel> data = getTableShortData(tableColumn.lookup_table_id).ToList();
                                                string? domain_value = String.Empty;
                                                DomainViewModel? category = null;
                                                // for (int m = j; m <= data.Count() + j; m++)
                                                // {
                                                //     value = sheet.Cells[i, m].Value;
                                                //     if (value != null && value.ToString() == "x")
                                                //     {
                                                //         domain_value = sheet.Cells[3, m].Value.ToString();
                                                //         break;
                                                //     }
                                                // }
                                                domain_value = sheet.Cells[i, j].Value?.ToString();
                                                if (!string.IsNullOrWhiteSpace(domain_value))
                                                {
                                                    category = data.Where(x => x.mo_ta.Contains(domain_value)).FirstOrDefault();
                                                }
                                                if (category != null)
                                                {
                                                    if (tableColumn.data_type == EnumPgDataType.SmallInt || tableColumn.data_type == EnumPgDataType.Integer || tableColumn.data_type == EnumPgDataType.Double)
                                                    {
                                                        int.TryParse(value?.ToString(), out int valueConvert);
                                                        _value = valueConvert;
                                                    }
                                                    else
                                                    {
                                                        _value = category.id.ToString();
                                                    }
                                                }
                                                else
                                                {
                                                    if (tableColumn.data_type == EnumPgDataType.SmallInt || tableColumn.data_type == EnumPgDataType.Integer || tableColumn.data_type == EnumPgDataType.Double)
                                                    {
                                                        _value = 0;
                                                    }
                                                    else
                                                    {
                                                        _value = "";
                                                    }
                                                }
                                            }
                                            else
                                            {
                                                if (value == null || value.ToString().ToLower().Contains("null") || tableColumn == null)
                                                {
                                                    continue;
                                                }
                                                else
                                                {
                                                    if (tableColumn.column_name == "province_code")
                                                    {
                                                        var province = provinces.Where(x => !string.IsNullOrWhiteSpace(x.name_vn) && x.name_vn.Contains(value.ToString())).FirstOrDefault();
                                                        if (province != null)
                                                        {
                                                            _value = province.area_id;
                                                        }
                                                        else
                                                        {
                                                            _value = value;
                                                        }
                                                    }
                                                    else if (tableColumn.column_name == "district_code")
                                                    {
                                                        var district = districts.Where(x => !string.IsNullOrWhiteSpace(x.name_vn) && x.name_vn.Contains(value.ToString())).FirstOrDefault();
                                                        if (district != null)
                                                        {
                                                            _value = district.area_id;
                                                        }
                                                        else
                                                        {
                                                            _value = value;
                                                        }
                                                    }
                                                    else if (tableColumn.column_name == "commune_code")
                                                    {
                                                        var commune = communes.Where(x => !string.IsNullOrWhiteSpace(x.name_vn) && x.name_vn.Contains(value.ToString())).FirstOrDefault();
                                                        if (commune != null)
                                                        {
                                                            _value = commune.area_id;
                                                        }
                                                        else
                                                        {
                                                            _value = value;
                                                        }
                                                    }
                                                    else
                                                    {
                                                        switch (tableColumn.data_type)
                                                        {
                                                            case EnumPgDataType.SmallInt:
                                                            case EnumPgDataType.Integer:
                                                                if (int.TryParse(value.ToString(), out int valueConvert))
                                                                {
                                                                    _value = valueConvert;
                                                                    break;
                                                                }
                                                                else
                                                                {
                                                                    continue;
                                                                }
                                                            case EnumPgDataType.Double:
                                                                if (double.TryParse(value.ToString(), out double doubleConvert))
                                                                {
                                                                    _value = doubleConvert;
                                                                    break;
                                                                }
                                                                else
                                                                {
                                                                    continue;
                                                                }
                                                                break;
                                                            case EnumPgDataType.String:
                                                            case EnumPgDataType.Text:
                                                                _value = value.ToString();
                                                                break;
                                                            case EnumPgDataType.Date:
                                                            case EnumPgDataType.Time:
                                                            case EnumPgDataType.DateTime:
                                                            case EnumPgDataType.DateTimeTZ:
                                                                DateTime dt;
                                                                if (DateTime.TryParseExact(value.ToString(), "dd/MM/yyyy", CultureInfo.CurrentCulture, DateTimeStyles.None, out dt))
                                                                {
                                                                    _value = dt.ToString("MM-dd-yyyy");
                                                                }
                                                                else
                                                                {
                                                                    _value = value.ToString();
                                                                }
                                                                break;
                                                            default:
                                                                continue;
                                                        }
                                                    }
                                                }
                                            }
                                            if (!attributes.ContainsKey(tableColumn.column_name))
                                            {
                                                attributes.Add(tableColumn.column_name, _value);
                                            }
                                        }

                                    }
                                }

                                if (attributes.ContainsKey(keyColumn.column_name) == false || string.IsNullOrWhiteSpace(attributes[keyColumn.column_name].ToString())) // INSERT
                                {
                                    var fieldSql = attributes.Keys.Where(x => selectedColumns.Select(x => x.column_name).Contains(x)).ToList();
                                    var valueSql = "";
                                    var values = new List<string>();

                                    foreach (var item in attributes)
                                    {
                                        if (item.Value != null)
                                        {
                                            if (item.Key == "geom")
                                            {
                                                string gson = writer.Write(geometry);
                                                // valueSql += $@"ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326),";
                                                values.Add($@"ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                            }
                                            else if (selectedColumns.Select(x => x.column_name).Contains(item.Key))
                                            {
                                                if (item.Value is string || item.Value is DateTime)
                                                {
                                                    // valueSql += $"'{item.Value}',";
                                                    values.Add($@"'{item.Value}'");
                                                }
                                                else
                                                {
                                                    if (item.Key == keyColumn.column_name)
                                                    {
                                                        // valueSql += "Default,";
                                                        values.Add($@"Default");
                                                    }
                                                    else
                                                    {
                                                        values.Add($@"{item.Value}");
                                                        // valueSql += $"{item.Value},";
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (tableInfo.columns.Count(x => x.column_name.Equals("created_by")) > 0)
                                    {
                                        fieldSql.Add("created_by");
                                        values.Add($"'{_workContext.GetCurrentUserId()}'");
                                    }
                                    if (tableInfo.columns.Count(x => x.column_name.Equals("is_approved")) > 0)
                                    {
                                        fieldSql.Add("is_approved");
                                        values.Add($"NULL");
                                    }
                                    // valueSql = valueSql.Remove(valueSql.Length - 1); // remove last ','
                                    var sqlInsert = @$"INSERT INTO {tableInfo.table_schema}.{tableInfo.table_name}({string.Join(",", fieldSql)}) VALUES ({string.Join(",", values)}) RETURNING {keyColumn.column_name}";
                                    await uow.Connection.ExecuteAsync(sqlInsert);
                                }
                                else // UPDATE
                                {
                                    List<string> listSetSql = new List<string>();
                                    foreach (var item in attributes)
                                    {
                                        if (item.Key == "geom")
                                        {
                                            string gson = writer.Write(geometry);
                                            listSetSql.Add($"{item.Key} = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326)");
                                        }
                                        else if (selectedColumns.Select(x => x.column_name).Contains(item.Key))
                                        {
                                            if (item.Value != null)
                                            {
                                                if (item.Value is string || item.Value is DateTime)
                                                {
                                                    listSetSql.Add($"{item.Key} = '{item.Value}'");
                                                }
                                                else
                                                {
                                                    listSetSql.Add($"{item.Key} = {item.Value}");
                                                }
                                            }
                                            else
                                            {

                                            }
                                        }
                                    }
                                    var sqlUpdate = $"UPDATE \"{tableInfo.table_schema}\".\"{tableInfo.table_name}\" SET {string.Join(",", listSetSql)} WHERE \"{keyColumn.column_name}\"::TEXT = @identifyValue";

                                    Console.WriteLine(sqlUpdate);

                                    await session.ExecuteAsync(sqlUpdate, new
                                    {
                                        identifyValue = attributes[keyColumn.column_name].ToString()
                                    });
                                }

                            }
                            //Chạy lại trường hành chính mặc định theo mã tỉnh mã huyện, mã xã
                            await runQueryRegion(tableInfo, uow);
                            await _workContext.ClearSearchCacheAsync(tableInfo);
                        }
                    }
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }
        private IActionResult exportShapeFile(SearchByLogicDTO dto)
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            Layer? layer = getLayerWithTableAndColumn(dto.layer_id.Value);
            if (layer == null)
                return NotFound();
            using (var session = OpenSession())
            {
                IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T} 
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {nameof(LayerDomain.table_id):C} = {Sql.Entity<TableInfo>(x => x.id):TC}
                    WHERE {nameof(LayerDomain.layer_id):C} = {layer.id}", (d, t) =>
                {
                    d.table = t;
                    return d;
                },
                    splitOn: $"{nameof(LayerDomain.table_id)}");

                List<TableColumn> tableColumns = layer.table.columns.OrderBy(x => x.order).ToList();
                var conditions = getConditions(layer.table, dto.@params);
                string sql =
                    @$"SELECT {String.Join(',', tableColumns.Where(x => "geom".Equals(x.column_name) == false && x.data_type != "tsvector" && x.visible).Select(x => x.column_name))}, ST_AsGeoJSON(geom) AS geom FROM {layer.table.table_schema}.{layer.table.table_name} WHERE {conditions}";
                var result = session.Query(sql).ToList();

                string shpName = Path.GetTempFileName();
                shpName = Path.ChangeExtension(shpName, "shp");
                string shxName = Path.GetTempFileName();
                shxName = Path.ChangeExtension(shxName, "shx");
                string sbnName = Path.GetTempFileName();
                sbnName = Path.ChangeExtension(sbnName, "sbn");
                string sbxName = Path.GetTempFileName();
                sbxName = Path.ChangeExtension(sbxName, "sbx");
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
                IStreamProvider dataEncodingStream = new FileStreamProvider(StreamTypes.DataEncoding, cpgName);
                IStreamProvider projectionStream = new FileStreamProvider(StreamTypes.Projection, prjName);
                IStreamProvider spatialIndexStream = new FileStreamProvider(StreamTypes.SpatialIndex, sbnName);
                IStreamProvider spatialIndexIndexStream = new FileStreamProvider(StreamTypes.SpatialIndexIndex, sbxName);

                IStreamProviderRegistry streamProviderRegistry =
                    new ShapefileStreamProviderRegistry(shapeStream, dataStream, idxStream, false, false, false, projectionStream, dataEncodingStream, spatialIndexStream, spatialIndexIndexStream);
                GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);


                List<IFeature> features = new List<IFeature>();
                DbaseFileHeader header = new DbaseFileHeader();
                header.NumRecords = result.Count;

                var rowHeader = 0;
                foreach (var row in result)
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

                        var tableColumn = tableColumns.FirstOrDefault(s => s.column_name == key);

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
                                case EnumPgDataType.DateTimeTZ:
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
                            features.Add(new Feature(geometryFactory.CreateGeometryCollection(), attributes));
                        }
                        else
                        {
                            GeoJsonReader reader = new GeoJsonReader();
                            Geometry geometry = reader.Read<Geometry>(items.FirstOrDefault(s => s.Key == "geom").Value.ToString());
                            String type = geometry.GeometryType;
                            features.Add(new Feature(geometryFactory.CreateGeometry(geometry), attributes));
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

                shpWriter.Write(features);

                using (var ms = new MemoryStream())
                {
                    ZipOutputStream zipStream = new ZipOutputStream(ms);
                    zipStream.SetLevel(3); //0-9, 9 being the highest level of compression

                    using (var sShape = new FileStream(shpName, FileMode.OpenOrCreate))
                    {
                        ZipEntry shpEntry =
                            new ZipEntry(
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.shp")
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
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.dbf")
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
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.shx")
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
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.cpg")
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
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.prj")
                            {
                                Size = sPrj.Length,
                                DateTime = DateTime.Now
                            };

                        zipStream.PutNextEntry(prjEntry);
                        StreamUtils.Copy(sPrj, zipStream, new byte[4096]);
                        zipStream.CloseEntry();
                    }

                    using (var sSpatialIndex = new FileStream(sbnName, FileMode.OpenOrCreate))
                    {
                        ZipEntry sbnEntry =
                            new ZipEntry(
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.sbn")
                            {
                                Size = sSpatialIndex.Length,
                                DateTime = DateTime.Now
                            };

                        zipStream.PutNextEntry(sbnEntry);
                        StreamUtils.Copy(sSpatialIndex, zipStream, new byte[4096]);
                        zipStream.CloseEntry();
                    }

                    using (var sSpatialIndexIndex = new FileStream(sbxName, FileMode.OpenOrCreate))
                    {
                        ZipEntry sbnEntry =
                            new ZipEntry(
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.sbx")
                            {
                                Size = sSpatialIndexIndex.Length,
                                DateTime = DateTime.Now
                            };

                        zipStream.PutNextEntry(sbnEntry);
                        StreamUtils.Copy(sSpatialIndexIndex, zipStream, new byte[4096]);
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
                    if (System.IO.File.Exists(cpgName))
                    {
                        System.IO.File.Delete(cpgName);
                    }
                    if (System.IO.File.Exists(prjName))
                    {
                        System.IO.File.Delete(prjName);
                    }
                    if (System.IO.File.Exists(sbnName))
                    {
                        System.IO.File.Delete(sbnName);
                    }
                    if (System.IO.File.Exists(sbxName))
                    {
                        System.IO.File.Delete(sbxName);
                    }

                    ms.Position = 0;
                    return File(ms.ToArray(), "application/zip",
                        string.Format("{0}.zip",
                            StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")));
                }
            }
        }
        private IActionResult exportGDBFile(SearchByLogicDTO dto)
        {
            List<string> defaultFields = new List<string>{
                "province_code",
                "district_code",
                "commune_code",
                "created_at",
                "updated_at",
                "search_content",
                "geom"
            };
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            Layer? layer = getLayerWithTableAndColumn(dto.layer_id.Value);
            if (layer == null)
                return NotFound();
            using (var session = OpenSession())
            {
                IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T} 
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {nameof(LayerDomain.table_id):C} = {Sql.Entity<TableInfo>(x => x.id):TC}
                    WHERE {nameof(LayerDomain.layer_id):C} = {layer.id}", (d, t) =>
                {
                    d.table = t;
                    return d;
                },
                    splitOn: $"{nameof(LayerDomain.table_id):C}");

                var conditions = getConditions(layer.table, dto.@params);
                var selectedColumns = layer.table.columns.Where(x => !defaultFields.Contains(x.column_name) && x.visible).ToList();
                string sql =
                    @$"SELECT {String.Join(',', selectedColumns.Select(x => x.column_name))}";
                if (layer.table.columns.Any(x => x.column_name == "geom"))
                {
                    sql += $@", ST_AsText(geom) AS geom";
                }
                sql += $@" FROM {layer.table.table_schema}.{layer.table.table_name} WHERE {conditions}";
                var result = session.Query(sql).ToList();

                string gdbFolderName = layer.table.table_name;

                // if (Directory.Exists(Path.Combine("Data_Stores", "temp")))
                // {
                //     Directory.Delete(Path.Combine("Data_Stores", "temp"));
                // }
                //Tạo thư mục gdb
                string tempFolderName = Directory.CreateDirectory(Path.Combine("Data_Stores", "temp")).FullName;
                string gdbFolderPath = Path.GetFullPath(Path.Combine(tempFolderName, gdbFolderName));
                Directory.CreateDirectory(gdbFolderPath);
                //Lấy tên file zip
                string gdbFolderZipPath = Path.GetFullPath(Path.Combine(tempFolderName, gdbFolderName));
                gdbFolderZipPath = Path.ChangeExtension(gdbFolderZipPath, "zip");
                // Lấy tên file gdb
                string gdbFileName = Path.GetFullPath(Path.Combine(gdbFolderPath, gdbFolderName));
                gdbFileName = Path.ChangeExtension(gdbFileName, "gdb");

                OGR.wkbGeometryType geometryType;
                switch (layer.geometry)
                {
                    case EnumGeometryType.Point:
                        geometryType = OGR.wkbGeometryType.wkbPoint;
                        break;
                    case EnumGeometryType.LineString:
                        geometryType = OGR.wkbGeometryType.wkbLineString;
                        break;
                    case EnumGeometryType.Polygon:
                        geometryType = OGR.wkbGeometryType.wkbPolygon;
                        break;
                    case EnumGeometryType.MultiPoint:
                        geometryType = OGR.wkbGeometryType.wkbMultiPoint;
                        break;
                    case EnumGeometryType.MultiLineString:
                        geometryType = OGR.wkbGeometryType.wkbMultiLineString;
                        break;
                    case EnumGeometryType.MultiPolygon:
                        geometryType = OGR.wkbGeometryType.wkbMultiPolygon;
                        break;
                    default:
                        geometryType = OGR.wkbGeometryType.wkbMultiPoint;
                        break;
                }
                OGR.Ogr.RegisterAll();

                string proj = $"GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]]";
                var srs = new OSR.SpatialReference(proj);
                using (var fileGdbDriver = OGR.Ogr.GetDriverByName("OpenFileGDB"))
                {
                    using (OGR.DataSource dataSource = fileGdbDriver.CreateDataSource(gdbFileName, new string[] { }))
                    {
                        dataSource.CreateLayer(layer.table.table_name, srs, geometryType, new string[] { });
                        var ogrLayer = dataSource.GetLayerByName(layer.table.table_name);
                        OGR.FeatureDefn featureDefn = new OGR.FeatureDefn(layer.table.table_name);
                        OGR.GeomFieldDefn geomFieldDefn = new OGR.GeomFieldDefn("SHAPE", geometryType);
                        featureDefn.AddGeomFieldDefn(geomFieldDefn);
                        for (int i = 0; i < selectedColumns.Count(); i++)
                        {
                            OGR.FieldType fieldType;
                            switch (selectedColumns[i].data_type)
                            {
                                case EnumPgDataType.BigInt:
                                    fieldType = OGR.FieldType.OFTInteger64;
                                    break;
                                case EnumPgDataType.SmallInt:
                                case EnumPgDataType.Integer:
                                    fieldType = OGR.FieldType.OFTInteger;
                                    break;
                                case EnumPgDataType.Double:
                                    fieldType = OGR.FieldType.OFTReal;
                                    break;
                                case EnumPgDataType.DateTime:
                                case EnumPgDataType.DateTimeTZ:
                                case EnumPgDataType.Date:
                                case EnumPgDataType.Time:
                                    fieldType = OGR.FieldType.OFTDateTime;
                                    break;
                                case EnumPgDataType.String:
                                    fieldType = OGR.FieldType.OFTString;
                                    break;
                                case EnumPgDataType.Boolean:
                                    fieldType = OGR.FieldType.OFTBinary;
                                    break;
                                default:
                                    fieldType = OGR.FieldType.OFTString;
                                    break;
                            }
                            OGR.FieldDefn fieldDefn = new OGR.FieldDefn(selectedColumns[i].column_name, fieldType);
                            fieldDefn.SetAlternativeName(selectedColumns[i].name_vn);
                            fieldDefn.SetWidth(selectedColumns[i].character_max_length);
                            featureDefn.AddFieldDefn(fieldDefn);
                            ogrLayer.CreateField(fieldDefn, 0);
                        }

                        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                        var wktReader = new WKTReader(geometryFactory);

                        List<IFeature> features = new List<IFeature>();
                        foreach (var row in result)
                        {
                            var items = row as IDictionary<string, object>;
                            OGR.Feature feature = new OGR.Feature(featureDefn);
                            foreach (string key in items?.Keys)
                            {
                                string? name = key?.ToLower().Trim();
                                object value = items.FirstOrDefault(s => s.Key == key).Value;

                                var tableColumn = selectedColumns.FirstOrDefault(s => s.column_name == key);
                                if (tableColumn != null)
                                {
                                    switch (tableColumn.data_type)
                                    {
                                        case EnumPgDataType.BigInt:
                                            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                                            {
                                                feature.SetField(tableColumn.column_name, 0);
                                            }
                                            else
                                            {
                                                feature.SetField(tableColumn.column_name, Int64.Parse(value.ToString()));
                                            }
                                            break;
                                        case EnumPgDataType.SmallInt:
                                        case EnumPgDataType.Integer:
                                            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                                            {
                                                feature.SetField(tableColumn.column_name, 0);
                                            }
                                            else
                                            {
                                                feature.SetField(tableColumn.column_name, int.Parse(value.ToString()));
                                            }
                                            break;
                                        case EnumPgDataType.DateTime:
                                        case EnumPgDataType.DateTimeTZ:
                                            DateTime dateTimeValue = DateTime.MinValue;
                                            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                                            {
                                                feature.SetField(tableColumn.column_name, "");
                                            }
                                            else
                                            {
                                                // DateTime.TryParseExact(value.ToString(), "dd/MM/yyyy HH:mm:ss", CultureInfo.CurrentCulture, DateTimeStyles.None, out dateValue);
                                                DateTime.TryParse(value.ToString(), out dateTimeValue);
                                                feature.SetField(tableColumn.column_name, dateTimeValue.Year, dateTimeValue.Month, dateTimeValue.Day, dateTimeValue.Hour, dateTimeValue.Minute, dateTimeValue.Second, 0);
                                            }
                                            break;
                                        case EnumPgDataType.Date:
                                        case EnumPgDataType.Time:
                                            DateTime dateValue = DateTime.MinValue;
                                            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                                            {
                                                feature.SetField(tableColumn.column_name, "");
                                            }
                                            else
                                            {
                                                DateTime.TryParse(value.ToString(), out dateValue);
                                                feature.SetField(tableColumn.column_name, dateValue.Year, dateValue.Month, dateValue.Day, dateValue.Hour, dateValue.Minute, dateValue.Second, 0);
                                            }
                                            break;
                                        default:
                                            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                                            {
                                                feature.SetField(tableColumn.column_name, "");
                                            }
                                            else
                                            {
                                                feature.SetField(tableColumn.column_name, value.ToString());
                                            }
                                            break;
                                    }
                                }
                            }
                            if (items.ContainsKey("geom"))
                            {
                                if (!string.IsNullOrWhiteSpace(items.FirstOrDefault(s => s.Key == "geom").Value?.ToString()))
                                {
                                    OGR.Geometry gdalGeometry = OGR.Geometry.CreateFromWkt(items.FirstOrDefault(s => s.Key == "geom").Value.ToString());
                                    feature.SetGeometry(gdalGeometry);
                                    feature.SetGeomField("SHAPE", gdalGeometry);
                                }
                                else
                                {
                                    feature.SetGeometry(null);
                                    feature.SetGeomField("SHAPE", null);
                                }
                            }
                            ogrLayer.CreateFeature(feature);
                        }
                    }
                }

                //Zip thư mục gdb
                using (var ms = new MemoryStream())
                {
                    System.IO.Compression.ZipFile.CreateFromDirectory(gdbFolderPath, gdbFolderZipPath);
                    using (var fileStream = new FileStream(gdbFolderZipPath, FileMode.Open))
                    {
                        fileStream.CopyTo(ms);
                    }
                    removeDirectory(tempFolderName);
                    string fileName = string.Format("{0}.gdb.zip", StringHelper.RemoveVietNameseSign(layer.table.table_name).Replace(" ", "_"));
                    return File(ms.ToArray(), "application/zip", fileName);
                }
            }
        }
        private IActionResult exportExcelFile(SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
            {
                TableInfo? table = null;
                Layer? layer = null;
                if (dto.layer_id > 0)
                {
                    layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                    if (layer != null)
                    {
                        table = layer.table;
                    }
                }
                else
                {
                    table = getTableAndColumns(dto.table_id.Value);
                }
                if (table != null)
                {
                    TableColumn? keyColumn = table.key_column ?? table.identity_column;
                    List<TableColumn> selectedColumns = table.columns.Where(x => x.visible || x.is_identity || x.is_key).OrderBy(x => x.is_identity || x.is_key).OrderBy(x => x.order).ToList();
                    ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                    using (ExcelPackage p = new ExcelPackage())
                    {
                        var conditions = getConditions(table, dto.@params);

                        if (dto.filter != null)
                        {
                            string parsed = StringUtils.ParseFilter(table, dto.filter);
                            if (string.IsNullOrWhiteSpace(parsed) == false)
                            {
                                conditions += $" AND ({parsed})";
                            }
                        }

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
                        string sql = $@"SELECT {String.Join(',', selectedColumns.Where(x => x.column_name != "geom").Select(x => x.column_name))}";
                        if (table.columns.Where(x => x.column_name == "geom").FirstOrDefault() != null)
                        {
                            sql += $@", ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom";
                        }
                        sql += $@" FROM {table.table_schema}.{table.table_name} WHERE {conditions} ORDER BY {keyColumn.column_name}";

                        var result = session.Query(sql).ToList();

                        ExcelWorksheet sheet;
                        ExcelRange cell;
                        sheet = p.Workbook.Worksheets.Add("Thông tin dữ liệu " + table.name_vn);
                        cell = sheet.Cells[1, 1];
                        cell.Style.Font.Size = 14;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Value = "Thông tin dữ liệu " + table.name_vn;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        string cellMerge3 = sheet.Cells[1, 1] + ":" + sheet.Cells[1, selectedColumns.Count() + 1];
                        ExcelRange rng3 = sheet.Cells[cellMerge3];
                        rng3.Merge = true;

                        var row = 2;

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
                            if (column.is_identity || column.is_key)
                            {
                                cell = sheet.Cells[row, col];
                                cell.Style.Font.Size = 11;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Value = column.name_vn;
                                cell.Style.WrapText = true;

                                cell.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                                cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.ColorTranslator.FromHtml("#FF0000"));

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
                            else if (column.lookup_table_id == 0)
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
                                cell = sheet.Cells[row + 1, col];
                                OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                cellMerge3 = sheet.Cells[row, col] + ":" + sheet.Cells[row + 1, col];
                                rng3 = sheet.Cells[cellMerge3];
                                rng3.Merge = true;

                                // List<DomainViewModel> data = getTableShortData(column.lookup_table_id).ToList();
                                // for (int i = 0; i < data.Count(); i++)
                                // {
                                //     cell = sheet.Cells[row, col + i];
                                //     OfficeHelper.setStyle(ref cell,
                                //         EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                //     cell = sheet.Cells[row + 1, col + i];
                                //     cell.Style.Font.Size = 11;
                                //     cell.Style.Font.Name = "Times New Roman";
                                //     //cell.Value = string.Join(".", data[i].id, data[i].mo_ta);
                                //     cell.Value = data[i].mo_ta;
                                //     cell.Style.WrapText = true;
                                //     OfficeHelper.setStyle(ref cell,
                                //         EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                // }
                                // string cellMerge = sheet.Cells[row, col] + ":" +
                                //                    sheet.Cells[row, col + data.Count() - 1];
                                // ExcelRange rng = sheet.Cells[cellMerge];
                                // rng.Merge = true;
                                // col += data.Count() - 1;

                                // col += 1;
                            }
                            col++;
                        }
                        var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id)}"));
                        var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id)}"));
                        var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id)}"));
                        var dem = 0;
                        row = 4;

                        IDictionary<string, List<DomainViewModel>> domains = new Dictionary<string, List<DomainViewModel>>();

                        GeoJsonReader reader = new GeoJsonReader();
                        foreach (var item in result)
                        {
                            cell = sheet.Cells[row, 1];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = ++dem;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                            var colIdx = 2;
                            var incre = 0;

                            var rowValue = item as IDictionary<string, object>;

                            if (rowValue != null)
                            {
                                for (int j = 0; j < selectedColumns.Count(); j++)
                                {
                                    var currentCol = rowValue.FirstOrDefault(s => s.Key == selectedColumns[j].column_name);

                                    if (selectedColumns[j].lookup_table_id == 0)
                                    {
                                        if (selectedColumns[j].column_name == "geom")
                                        {
                                            if (currentCol.Value != null)
                                            {
                                                Geometry geometry = reader.Read<Geometry>(currentCol.Value?.ToString());
                                                var coordinates = geometry.Coordinates;
                                                cell = sheet.Cells[row, colIdx + j + incre];
                                                cell.Value = String.Join("; ", coordinates.ToList()).Replace("(", "").Replace(")", "");
                                            }
                                            else
                                            {
                                                cell.Value = "";
                                            }
                                            OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                        }
                                        else if (selectedColumns[j].data_type.Equals(EnumPgDataType.Boolean)) //)
                                        {
                                            if (currentCol.Value != null)
                                            {
                                                if (Convert.ToBoolean(currentCol.Value) == true)
                                                {
                                                    cell = sheet.Cells[row, colIdx + j + incre];
                                                    cell.Value = "x";
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                                }
                                                else
                                                {
                                                    cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                    cell.Value = "x";
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                                }
                                            }
                                            else
                                            {
                                                cell = sheet.Cells[row, colIdx + j + incre];
                                                cell.Style.Font.Size = 11;
                                                cell.Style.Font.Name = "Times New Roman";
                                                OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                                cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
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
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE);
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
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                                        break;
                                                    case EnumPgDataType.Date:
                                                    case EnumPgDataType.Time:
                                                    case EnumPgDataType.DateTime:
                                                    case EnumPgDataType.DateTimeTZ:
                                                        cell.Value = Convert.ToDateTime(currentCol.Value).ToString("dd/MM/yyyy");
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                                        break;
                                                    default:
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                                        break;
                                                }
                                            }
                                            else
                                            {
                                                OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                            }
                                        }
                                    }
                                    else
                                    {
                                        List<DomainViewModel> data = new List<DomainViewModel>();
                                        if (domains.ContainsKey(selectedColumns[j].column_name))
                                        {
                                            data = domains[selectedColumns[j].column_name];
                                        }
                                        else
                                        {
                                            data = getTableShortData(selectedColumns[j].lookup_table_id).ToList();
                                            domains.Add(selectedColumns[j].column_name, data);
                                        }
                                        cell = sheet.Cells[row, colIdx + j + incre];
                                        // for (int i = 0; i < data.Count; i++)
                                        // {
                                        //     cell = sheet.Cells[row, colIdx + j + incre + i];
                                        //     if (currentCol.Value != null && currentCol.Value.ToString() == data[i].id.ToString())
                                        //     {
                                        //         cell.Style.Font.Size = 11;
                                        //         cell.Style.Font.Name = "Times New Roman";
                                        //         cell.Value = "x";
                                        //         cell.Style.ShrinkToFit = true;
                                        //     }

                                        //     OfficeHelper.setStyle(ref cell,
                                        //         EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                        // }

                                        cell.Style.Font.Size = 11;
                                        cell.Style.Font.Name = "Times New Roman";
                                        cell.Style.ShrinkToFit = true;

                                        OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                        // incre += data.Count - 1;
                                        // cell.Value = data.FirstOrDefault(o => o.id == currentCol.Value?.ToString())?.mo_ta;
                                        cell.Value = currentCol.Value != null ? data.FirstOrDefault(o => o.id?.ToString() == currentCol.Value?.ToString())?.mo_ta : "";
                                        // incre += 1;
                                    }
                                }
                                row++;
                            }
                        }
                        return File(p.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            $"{DateTime.Now.ToString("ddMMyyyyHHmm")}_thongtin_{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.xlsx");
                    }
                }
            }
            return NotFound();
        }
        private IActionResult exportCSVFile(SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
            {
                TableInfo? table = null;
                Layer? layer = null;
                if (dto.layer_id > 0)
                {
                    layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                    if (layer != null)
                    {
                        table = layer.table;
                    }
                }
                else
                {
                    table = getTableAndColumns(dto.table_id.Value);
                }
                if (table != null)
                {
                    TableColumn? keyColumn = table.key_column ?? table.identity_column;
                    List<TableColumn> selectedColumns = table.columns.Where(x => x.visible).OrderBy(x => x.order).ToList();
                    ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                    using (ExcelPackage p = new ExcelPackage())
                    {
                        var conditions = getConditions(table, dto.@params);
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
                        string sql = $@"SELECT {String.Join(',', selectedColumns.Where(x => x.column_name != "geom").Select(x => x.column_name))}";
                        if (table.columns.Where(x => x.column_name == "geom").FirstOrDefault() != null)
                        {
                            sql += $@", ST_AsGeoJSON({table.table_schema}.{table.table_name}.geom) AS geom";
                        }
                        sql += $@" FROM {table.table_schema}.{table.table_name} WHERE {conditions} ORDER BY {keyColumn.column_name}";

                        var result = session.Query(sql).ToList();

                        ExcelWorksheet sheet;
                        ExcelRange cell;
                        sheet = p.Workbook.Worksheets.Add("Thông tin dữ liệu " + table.name_vn);
                        cell = sheet.Cells[1, 1];
                        cell.Style.Font.Size = 14;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Value = "Thông tin dữ liệu " + table.name_vn;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        string cellMerge3 = sheet.Cells[1, 1] + ":" + sheet.Cells[1, selectedColumns.Count() + 1];
                        ExcelRange rng3 = sheet.Cells[cellMerge3];
                        rng3.Merge = true;

                        var row = 2;

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
                                List<DomainViewModel> data = getTableShortData(column.lookup_table_id).ToList();
                                for (int i = 0; i < data.Count(); i++)
                                {
                                    cell = sheet.Cells[row, col + i];
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[row + 1, col + i];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    //cell.Value = string.Join(".", data[i].id, data[i].mo_ta);
                                    cell.Value = data[i].mo_ta;
                                    cell.Style.WrapText = true;
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                }
                                string cellMerge = sheet.Cells[row, col] + ":" +
                                                   sheet.Cells[row, col + data.Count() - 1];
                                ExcelRange rng = sheet.Cells[cellMerge];
                                rng.Merge = true;
                                col += data.Count() - 1;
                            }
                            col++;
                        }
                        var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id)}"));
                        var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id)}"));
                        var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id)}"));
                        var dem = 0;
                        row = 4;

                        GeoJsonReader reader = new GeoJsonReader();
                        foreach (var item in result)
                        {
                            cell = sheet.Cells[row, 1];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = ++dem;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                            var colIdx = 2;
                            var incre = 0;

                            var rowValue = item as IDictionary<string, object>;

                            if (rowValue != null)
                            {
                                for (int j = 0; j < selectedColumns.Count(); j++)
                                {
                                    var currentCol = rowValue.FirstOrDefault(s => s.Key == selectedColumns[j].column_name);

                                    if (selectedColumns[j].lookup_table_id == 0)
                                    {
                                        if (selectedColumns[j].column_name == "geom")
                                        {
                                            if (currentCol.Value != null)
                                            {
                                                Geometry geometry = reader.Read<Geometry>(currentCol.Value?.ToString());
                                                var coordinates = geometry.Coordinates;
                                                cell = sheet.Cells[row, colIdx + j + incre];
                                                cell.Value = String.Join("; ", coordinates.ToList()).Replace("(", "").Replace(")", "");
                                            }
                                            else
                                            {
                                                cell.Value = "";
                                            }
                                            OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                        }
                                        else if (selectedColumns[j].data_type.Equals(EnumPgDataType.Boolean)) //)
                                        {
                                            if (currentCol.Value != null)
                                            {
                                                if (Convert.ToBoolean(currentCol.Value) == true)
                                                {
                                                    cell = sheet.Cells[row, colIdx + j + incre];
                                                    cell.Value = "x";
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                                }
                                                else
                                                {
                                                    cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                    cell.Value = "x";
                                                    OfficeHelper.setStyle(ref cell,
                                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                                }
                                            }
                                            else
                                            {
                                                cell = sheet.Cells[row, colIdx + j + incre];
                                                cell.Style.Font.Size = 11;
                                                cell.Style.Font.Name = "Times New Roman";
                                                OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                                cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
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
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE);
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
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                                        break;
                                                    case EnumPgDataType.Date:
                                                    case EnumPgDataType.Time:
                                                    case EnumPgDataType.DateTime:
                                                    case EnumPgDataType.DateTimeTZ:
                                                        cell.Value = Convert.ToDateTime(currentCol.Value).ToString("dd/MM/yyyy");
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                                        break;
                                                    default:
                                                        OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                                        break;
                                                }
                                            }
                                            else
                                            {
                                                OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                            }
                                        }
                                    }
                                    else
                                    {
                                        List<DomainViewModel> data = getTableShortData(selectedColumns[j].lookup_table_id).ToList();
                                        for (int i = 0; i < data.Count; i++)
                                        {
                                            cell = sheet.Cells[row, colIdx + j + incre + i];
                                            if (currentCol.Value != null && currentCol.Value.ToString() == data[i].id.ToString())
                                            {
                                                cell.Style.Font.Size = 11;
                                                cell.Style.Font.Name = "Times New Roman";
                                                cell.Value = "x";
                                                cell.Style.ShrinkToFit = true;
                                            }

                                            OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                                        }

                                        incre += data.Count - 1;
                                    }
                                }
                                row++;
                            }
                        }

                        var maxColumnNumber = sheet.Dimension.End.Column;
                        var currentRow = new List<string>(maxColumnNumber);
                        var totalRowCount = sheet.Dimension.End.Row;
                        var currentRowNum = 1;

                        var memory = new MemoryStream();

                        using (var writer = new StreamWriter(memory, Encoding.UTF8))
                        {
                            while (currentRowNum <= totalRowCount)
                            {
                                EpplusCsvConverter.BuildRow(sheet, currentRow, currentRowNum, maxColumnNumber);
                                EpplusCsvConverter.WriteRecordToFile(currentRow, writer, currentRowNum, totalRowCount);
                                currentRow.Clear();
                                currentRowNum++;
                            }
                        }
                        return File(memory.ToArray(), "text/csv",
                            $"ThongTin_{StringHelper.RemoveVietNameseSign(table.name_vn).Replace(" ", "_")}.csv");
                    }
                }
            }
            return NotFound();
        }
        private IActionResult exportMapInfo(SearchByLogicDTO dto)
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            Layer layer = getLayerWithTableAndColumn(dto.layer_id.Value);
            if (layer == null)
                return NotFound();
            using (var session = OpenSession())
            {
                IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T} 
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {nameof(LayerDomain.table_id)} = {Sql.Entity<TableInfo>(x => x.id):TC}
                    WHERE {nameof(LayerDomain.layer_id)} = {layer.id}", (d, t) =>
                {
                    d.table = t;
                    return d;
                },
                    splitOn: $"{nameof(LayerDomain.table_id)}");

                var conditions = getConditions(layer.table, dto.@params);
                var selectedColumns = layer.table.columns.Where(x => "geom".Equals(x.column_name) == false).ToList();
                string sql =
                    @$"SELECT {String.Join(',', selectedColumns.Select(x => x.column_name))}";
                if (layer.table.columns.Any(x => x.column_name == "geom"))
                {
                    sql += @$", ST_AsGeoJSON(geom) AS geom";
                }
                sql += $@" FROM {layer.table.table_schema}.{layer.table.table_name} WHERE {conditions}";
                var result = session.Query(sql).ToList();
                //Tạo thư mục mapInfo
                string tabFolderName = layer.table.table_name;
                string tempFolderName = Directory.CreateDirectory(Path.Combine("Data_Stores", "temp")).FullName;
                string tabFolderPath = Path.GetFullPath(Path.Combine(tempFolderName, tabFolderName));
                Directory.CreateDirectory(tabFolderPath);
                //Lấy tên file zip
                string tabFolderZipPath = Path.GetFullPath(Path.Combine(tempFolderName, tabFolderName));
                tabFolderZipPath = Path.ChangeExtension(tabFolderZipPath, "zip");
                // Lấy tên file tab
                string tabFileName = Path.GetFullPath(Path.Combine(tabFolderPath, tabFolderName));
                tabFileName = Path.ChangeExtension(tabFileName, "tab");
                //
                OGR.wkbGeometryType geometryType;
                switch (layer.geometry)
                {
                    case EnumGeometryType.Point:
                        geometryType = OGR.wkbGeometryType.wkbPoint;
                        break;
                    case EnumGeometryType.LineString:
                        geometryType = OGR.wkbGeometryType.wkbLineString;
                        break;
                    case EnumGeometryType.Polygon:
                        geometryType = OGR.wkbGeometryType.wkbPolygon;
                        break;
                    case EnumGeometryType.MultiPoint:
                        geometryType = OGR.wkbGeometryType.wkbMultiPoint;
                        break;
                    case EnumGeometryType.MultiLineString:
                        geometryType = OGR.wkbGeometryType.wkbMultiLineString;
                        break;
                    case EnumGeometryType.MultiPolygon:
                        geometryType = OGR.wkbGeometryType.wkbMultiPolygon;
                        break;
                    default:
                        geometryType = OGR.wkbGeometryType.wkbMultiPoint;
                        break;
                }
                OGR.Ogr.RegisterAll();

                string proj = $"GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]]";
                var srs = new OSR.SpatialReference(proj);
                using (var fileGdbDriver = OGR.Ogr.GetDriverByName("MapInfo File"))
                {
                    using (OGR.DataSource dataSource = fileGdbDriver.CreateDataSource(tabFileName, null))
                    {
                        dataSource.CreateLayer(layer.table.table_name, srs, geometryType, null);
                        var ogrLayer = dataSource.GetLayerByName(layer.table.table_name);
                        OGR.FeatureDefn featureDefn = new OGR.FeatureDefn(layer.table.table_name);
                        OGR.GeomFieldDefn geomFieldDefn = new OGR.GeomFieldDefn("geom", geometryType);
                        featureDefn.AddGeomFieldDefn(geomFieldDefn);
                        for (int i = 0; i < selectedColumns.Count(); i++)
                        {
                            OGR.FieldType fieldType;
                            switch (selectedColumns[i].data_type)
                            {
                                case EnumPgDataType.BigInt:
                                case EnumPgDataType.SmallInt:
                                case EnumPgDataType.Integer:
                                    fieldType = OGR.FieldType.OFTInteger;
                                    break;
                                case EnumPgDataType.Double:
                                    fieldType = OGR.FieldType.OFTReal;
                                    break;
                                case EnumPgDataType.DateTime:
                                case EnumPgDataType.DateTimeTZ:
                                    fieldType = OGR.FieldType.OFTDateTime;
                                    break;
                                case EnumPgDataType.Date:
                                    fieldType = OGR.FieldType.OFTDate;
                                    break;
                                case EnumPgDataType.Time:
                                    fieldType = OGR.FieldType.OFTTime;
                                    break;
                                case EnumPgDataType.String:
                                    fieldType = OGR.FieldType.OFTString;
                                    break;
                                case EnumPgDataType.Boolean:
                                    fieldType = OGR.FieldType.OFTBinary;
                                    break;
                                default:
                                    fieldType = OGR.FieldType.OFTString;
                                    break;
                            }
                            OGR.FieldDefn fieldDefn = new OGR.FieldDefn(selectedColumns[i].column_name, fieldType);
                            fieldDefn.SetAlternativeName(selectedColumns[i].name_vn);
                            fieldDefn.SetWidth(selectedColumns[i].character_max_length);
                            featureDefn.AddFieldDefn(fieldDefn);
                            try
                            {
                                ogrLayer.CreateField(fieldDefn, 0);
                            }
                            catch (System.Exception)
                            {
                                continue;
                            }
                        }

                        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                        var wktReader = new WKTReader(geometryFactory);

                        List<IFeature> features = new List<IFeature>();
                        foreach (var row in result)
                        {
                            var items = row as IDictionary<string, object>;
                            OGR.Feature feature = new OGR.Feature(featureDefn);
                            foreach (string key in items.Keys)
                            {
                                string name = key?.ToLower().Trim();
                                object value = items.FirstOrDefault(s => s.Key == key).Value;

                                var tableColumn = selectedColumns.FirstOrDefault(s => s.column_name == key);
                                if (tableColumn != null)
                                {
                                    switch (tableColumn.data_type)
                                    {
                                        case EnumPgDataType.BigInt:
                                        case EnumPgDataType.SmallInt:
                                        case EnumPgDataType.Integer:
                                            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                                            {
                                                feature.SetField(tableColumn.column_name, 0);
                                            }
                                            else
                                            {
                                                feature.SetField(tableColumn.column_name, int.Parse(value.ToString()));
                                            }
                                            break;
                                        case EnumPgDataType.DateTime:
                                        case EnumPgDataType.DateTimeTZ:
                                        case EnumPgDataType.Date:
                                        case EnumPgDataType.Time:
                                            DateTime dateValue;
                                            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                                            {
                                                dateValue = DateTime.MinValue;
                                            }
                                            else
                                            {
                                                if (DateTime.TryParseExact(value.ToString(), "dd/MM/yyyy", CultureInfo.CurrentCulture, DateTimeStyles.None, out dateValue))
                                                { }
                                                else
                                                {
                                                    dateValue = DateTime.MinValue;
                                                }
                                            }
                                            feature.SetField(tableColumn.column_name, dateValue.Year, dateValue.Month, dateValue.Day, dateValue.Hour, dateValue.Minute, dateValue.Second, 0);
                                            break;
                                        default:
                                            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                                            {
                                                feature.SetField(tableColumn.column_name, "");
                                            }
                                            else
                                            {
                                                feature.SetField(tableColumn.column_name, value.ToString());
                                            }
                                            break;
                                    }
                                }
                            }
                            if (items.ContainsKey("geom"))
                            {
                                if (!string.IsNullOrWhiteSpace(items.FirstOrDefault(s => s.Key == "geom").Value?.ToString()))
                                {
                                    GeoJsonReader reader = new GeoJsonReader();
                                    Geometry geometry = reader.Read<Geometry>(items.FirstOrDefault(s => s.Key == "geom").Value.ToString());

                                    WKTWriter writer = new WKTWriter();
                                    string wktJson = writer.Write(geometry);

                                    OGR.Geometry gdalGeometry = OGR.Geometry.CreateFromWkt(wktJson);
                                    feature.SetGeomField("geom", gdalGeometry);
                                }
                            }
                            ogrLayer.CreateFeature(feature);
                        }
                    }
                }
                DirectoryInfo folderInfo = new DirectoryInfo(tabFolderPath);
                DirectoryInfo[] directoryInfos = folderInfo.GetDirectories();
                FileInfo[] fileInfos = folderInfo.GetFiles();

                using (var ms = new MemoryStream())
                {
                    System.IO.Compression.ZipFile.CreateFromDirectory(tabFolderPath, tabFolderZipPath);
                    using (var fileStream = new FileStream(tabFolderZipPath, FileMode.Open))
                    {
                        fileStream.CopyTo(ms);
                    }
                    removeDirectory(tempFolderName);
                    string fileName = string.Format("{0}.tab.zip", StringHelper.RemoveVietNameseSign(layer.table.table_name).Replace(" ", "_"));
                    return File(ms.ToArray(), "application/zip", fileName);
                }
            }
        }
    }
}
