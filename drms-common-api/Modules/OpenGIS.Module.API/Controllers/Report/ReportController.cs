using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Features;
using OfficeOpenXml;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Repositories;
using OpenGIS.Module.Core.ViewModels;
using OpenGIS.Module.Core.Models.DTO;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;
using Microsoft.AspNetCore.Hosting;
using VietGIS.Infrastructure.Identity.Managers;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Identity.Entities;
using Microsoft.AspNetCore.Identity;
using System.Diagnostics.Eventing.Reader;
using System.Data.SqlTypes;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.Text;
using VietGIS.Infrastructure.Web;
using System.Threading.Tasks;
using VietGIS.Infrastructure;
using System.Globalization;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    public partial class ReportController : BaseController
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
        protected readonly ApplicationUserManager _userManager;
        protected readonly IReportFieldRepository _reportFieldRepository;
        protected readonly IReportRepository _reportRepository;
        protected readonly IMapLayersRepository _mapLayersRepository;
        private readonly IRazorViewRenderer _viewRenderer;
        public ReportController(IDbFactory dbFactory,
            IReportFieldRepository reportFieldRepository,
            IReportRepository reportRepository,
            IWebHostEnvironment webHostEnvironment,
            IMapLayersRepository mapLayersRepository,
            UserManager<ApplicationUser> userManager,
            IRazorViewRenderer viewRenderer)
            : base(dbFactory)
        {
            _reportFieldRepository = reportFieldRepository;
            _reportRepository = reportRepository;
            _webHostEnvironment = webHostEnvironment;
            _userManager = (ApplicationUserManager)userManager;
            _mapLayersRepository = mapLayersRepository;
            _viewRenderer = viewRenderer;
        }

        [HttpPost("{table_schema}/{table_name}/data")]
        public async Task<RestBase> BaoCaoBangDuLieu([FromRoute] string table_schema, [FromRoute] string table_name, [FromBody] SearchByLogicDTO searchDTO)
        {
            if (searchDTO == null || string.IsNullOrWhiteSpace(table_name) || string.IsNullOrWhiteSpace(table_schema))
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            using var session = OpenSession();
            var tableInfo = session.Find<TableInfo>(statement => statement
                                 .Where($"{Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = @table_schema  AND {Sql.Entity<TableColumn>(x => x.visible):TC}")
                                 .WithParameters(new
                                 {
                                     table_schema,
                                     table_name
                                 })
                                 .Include<TableColumn>(join => join.LeftOuterJoin())
                                 .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                             ).FirstOrDefault();
            if (tableInfo == null)
            {
                return new RestError(400, "Không tìm thấy bảng dữ liệu!");
            }
            var conditions = getConditionsSearchByLogic(tableInfo, searchDTO.@params);
            var selectedFields = tableInfo.columns.Where(x => x.visible);
            IDictionary<string, List<DomainViewModel>> domains_values = domainValueForLookup(tableInfo);
            string sql = @$"SELECT {string.Join(',', selectedFields.Where(x => "geom".Equals(x.column_name) == false && "search_content".Equals(x.column_name) == false).Select(x => tableInfo.table_schema + "." + tableInfo.table_name + "." + x.column_name))} 
                        FROM {tableInfo.table_schema}.{tableInfo.table_name}
                        WHERE {conditions} ";

            string sqlGroup = string.Empty;

            var provinces = session.Find<Province>(statement => statement
                .Where($"{nameof(Province.visible)}")
            );
            var districts = session.Find<District>(stm => stm
                .Where($"{Sql.Entity<District>(x => x.parent_id):TC} = ANY(@province_ids)")
                .WithParameters(new { province_ids = provinces.Select(x => x.area_id).ToArray() })
                .OrderBy($"{Sql.Entity<District>(x => x.area_id):TC}")
            );
            var communes = session.Find<Commune>(stm => stm
                .Where($"{Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@district_ids)")
                .WithParameters(new { district_ids = districts.Select(x => x.area_id).ToArray() })
                .OrderBy($"{Sql.Entity<Commune>(x => x.area_id):TC}")
            );

            sql += @$" ORDER BY {tableInfo.table_schema}.{tableInfo.table_name}.district_code";

            var totalCount = session.Query<double>($"SELECT COUNT(1) FROM ({sql}) AS result").FirstOrDefault();

            if (searchDTO.pageSize > 0)
            {
                int skip = searchDTO.pageSize.Value * (searchDTO.pageIndex.Value - 1);
                sql += $" LIMIT {searchDTO.pageSize} OFFSET {skip}";
            }
            var result = session.Query(sql);
            double _pageCountCeil = Math.Ceiling(totalCount / searchDTO.pageSize.Value);

            var records = result.Select(x => (IDictionary<string, object>)x).ToList();
            var view = await _viewRenderer.RenderViewToStringAsync("~/Views/Shared/ReportView/_BaoCaoDuLieuBang.cshtml", new RecordsTableViewModel
            {
                index = searchDTO.pageSize.Value * (searchDTO.pageIndex.Value - 1),
                table = tableInfo,
                columns = selectedFields,
                records = records,
                provinces = provinces,
                districts = districts,
                communes = communes,
                domains = domainValueForLookup(tableInfo),
                total = totalCount
            });
            return new RestData
            {
                data = new
                {
                    view,
                    _pageCountCeil,
                    totalCount,
                }
            };
        }
        [HttpPost("{table_schema}/{table_name}/export")]
        public async Task<ActionResult> XuatBaoCaoBangDuLieu([FromRoute] string table_schema, [FromRoute] string table_name, [FromBody] SearchByLogicDTO searchDTO)
        {
            if (searchDTO == null || string.IsNullOrWhiteSpace(table_name) || string.IsNullOrWhiteSpace(table_schema))
            {
                return new JsonResult(new RestError(400, "Vui lòng kiểm tra lại tham số!"));
            }
            using var session = OpenSession();
            var tableInfo = session.Find<TableInfo>(statement => statement
                                 .Where($"{Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = @table_schema  AND {Sql.Entity<TableColumn>(x => x.visible):TC}")
                                 .WithParameters(new
                                 {
                                     table_schema,
                                     table_name
                                 })
                                 .Include<TableColumn>(join => join.LeftOuterJoin())
                                 .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                             ).FirstOrDefault();
            if (tableInfo == null)
            {
                return new JsonResult(new RestError(400, "Không tìm thấy bảng dữ liệu!"));
            }
            var conditions = getConditionsSearchByLogic(tableInfo, searchDTO.@params);
            var selectedColumns = tableInfo.columns.Where(x => x.visible);

            string sql = @$"SELECT {string.Join(',', selectedColumns.Where(x => "geom".Equals(x.column_name) == false && "search_content".Equals(x.column_name) == false).Select(x => tableInfo.table_schema + "." + tableInfo.table_name + "." + x.column_name))} 
                        FROM {tableInfo.table_schema}.{tableInfo.table_name}
                        WHERE {conditions} ";

            string sqlGroup = string.Empty;

            var provinces = session.Find<Province>(statement => statement
                .Where($"{nameof(Province.visible)}")
            );
            var districts = session.Find<District>(stm => stm
                .Where($"{Sql.Entity<District>(x => x.parent_id):TC} = ANY(@province_ids)")
                .WithParameters(new { province_ids = provinces.Select(x => x.area_id).ToArray() })
                .OrderBy($"{Sql.Entity<District>(x => x.area_id):TC}")
            );
            var communes = session.Find<Commune>(stm => stm
                .Where($"{Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@district_ids)")
                .WithParameters(new { district_ids = districts.Select(x => x.area_id).ToArray() })
                .OrderBy($"{Sql.Entity<Commune>(x => x.area_id):TC}")
            );

            sql += @$" ORDER BY {tableInfo.table_schema}.{tableInfo.table_name}.district_code";

            var totalCount = session.Query<double>($"SELECT COUNT(1) FROM ({sql}) AS result").FirstOrDefault();

            var results = session.Query(sql);

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            IDictionary<string, List<DomainViewModel>> domains = domainValueForLookup(tableInfo);
            using (ExcelPackage p = new ExcelPackage())
            {
                ExcelWorksheet sheet;
                ExcelRange cell;
                sheet = p.Workbook.Worksheets.Add("BÁO CÁO TỔNG HỢP CƠ SỞ DỮ LIỆU " + tableInfo.name_vn?.ToUpper());
                cell = sheet.Cells[1, 1];
                cell.Style.Font.Size = 14;
                cell.Style.Font.Name = "Times New Roman";
                cell.Value = "BÁO CÁO TỔNG HỢP CƠ SỞ DỮ LIỆU " + tableInfo.name_vn?.ToUpper();
                OfficeHelper.setStyle(ref cell,
                    EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                cell = sheet.Cells[sheet.Cells[1, 1] + ":" + sheet.Cells[1, selectedColumns.Count() + 1]];
                cell.Merge = true;

                var row = 2;

                cell = sheet.Cells[row, 1];
                cell.Style.Font.Size = 14;
                cell.Style.Font.Name = "Times New Roman";
                cell.Value = "THÀNH PHỐ " + provinces.FirstOrDefault()?.name_vn.ToUpper();
                OfficeHelper.setStyle(ref cell,
                    EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                cell = sheet.Cells[sheet.Cells[row, 1] + ":" + sheet.Cells[row, selectedColumns.Count() + 1]];
                cell.Merge = true;

                row++;

                cell = sheet.Cells[row, 1];
                cell.Style.Font.Size = 14;
                cell.Style.Font.Name = "Times New Roman";
                cell.Value = $"Ngày {DateTime.Now.ToString("dd/MM/yyyy")}";
                OfficeHelper.setStyle(ref cell,
                    EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                cell = sheet.Cells[sheet.Cells[row, 1] + ":" + sheet.Cells[row, selectedColumns.Count() + 1]];
                cell.Merge = true;

                row++;

                cell = sheet.Cells[row, 1];
                cell.Style.Font.Size = 14;
                cell.Style.Font.Name = "Times New Roman";
                cell.Value = $"Tổng: {totalCount.ToString("#,##0.##", CultureInfo.GetCultureInfo("vi-VN").NumberFormat)}";
                OfficeHelper.setStyle(ref cell,
                    EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                cell = sheet.Cells[sheet.Cells[row, 1] + ":" + sheet.Cells[row, selectedColumns.Count() + 1]];
                cell.Merge = true;

                row++;
                var col = 0;

                cell = sheet.Cells[row, ++col];
                cell.Style.Font.Size = 11;
                cell.Style.Font.Name = "Times New Roman";
                cell.Value = "STT";
                OfficeHelper.setStyle(ref cell,
                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                foreach (var column in selectedColumns)
                {
                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = column.name_vn;
                    cell.Style.WrapText = true;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    if (column.data_type == EnumPgDataType.String || column.data_type == EnumPgDataType.Text)
                    {
                        sheet.Columns[col].Width = 20;
                    }
                    else
                    {
                        sheet.Columns[col].Width = 15;
                    }
                }

                var dem = 0;
                row++;
                foreach (var result in results)
                {
                    col = 0;
                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = ++dem;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    var data = result as IDictionary<string, object>;
                    if (data != null)
                    {
                        foreach (var item in selectedColumns)
                        {
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.WrapText = true;
                            cell.Style.Font.Name = "Times New Roman";

                            if (data.ContainsKey(item.column_name) && data[item.column_name] != null)
                            {
                                var value = data.FirstOrDefault(s => s.Key == item.column_name);
                                if (value.Value != null)
                                {
                                    switch (true)
                                    {
                                        case true when item.lookup_table_id > 0:
                                            if (domains.ContainsKey(item.column_name))
                                            {
                                                var domain = domains.FirstOrDefault(s => s.Key == item.column_name).Value.Where(x => x.id != null);
                                                var domainValue = domain.FirstOrDefault(x => x.id.Equals(value.Value));
                                                cell.Value = domainValue?.mo_ta;
                                            }
                                            else
                                            {
                                                cell.Value = value.Value;
                                            }
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                            break;
                                        case true when item.column_name.Equals("province_code"):
                                            cell.Value = provinces.FirstOrDefault(x => x.area_id == value.Value.ToString())?.name_vn;
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                            break;
                                        case true when item.column_name.Equals("district_code"):
                                            cell.Value = districts.FirstOrDefault(x => x.area_id == value.Value.ToString())?.name_vn;
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                            break;
                                        case true when item.column_name.Equals("commune_code"):
                                            cell.Value = communes.FirstOrDefault(x => x.area_id == value.Value.ToString())?.name_vn;
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                            break;
                                        case true when item.data_type.Equals(EnumPgDataType.Boolean):
                                            cell.Value = Convert.ToBoolean(value.Value.ToString()) == true ? "Có" : "Không";
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.CENTER);
                                            break;
                                        case true when item.data_type.Equals(EnumPgDataType.SmallInt):
                                        case true when item.data_type.Equals(EnumPgDataType.Integer):
                                            if (int.TryParse(value.Value.ToString(), out int intValue))
                                            {
                                                cell.Value = intValue.ToString("#,##0.##", CultureInfo.GetCultureInfo("vi-VN").NumberFormat);
                                            }
                                            else
                                                cell.Value = value.Value;
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.RIGHT);
                                            break;
                                        case true when item.data_type.Equals(EnumPgDataType.Double):
                                            if (double.TryParse(value.Value.ToString(), out double doubleValue))
                                            {
                                                cell.Value = doubleValue.ToString("#,##0.##", CultureInfo.GetCultureInfo("vi-VN").NumberFormat);
                                            }
                                            else
                                                cell.Value = value.Value;
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.RIGHT);
                                            break;
                                        case true when item.data_type.Equals(EnumPgDataType.Date):
                                        case true when item.data_type.Equals(EnumPgDataType.Time):
                                        case true when item.data_type.Equals(EnumPgDataType.DateTime):
                                        case true when item.data_type.Equals(EnumPgDataType.DateTimeTZ):
                                            if (DateTime.TryParse(value.Value.ToString(), out DateTime dt))
                                            {
                                                cell.Value = dt.ToString("dd/MM/yyyy");
                                            }
                                            else
                                                cell.Value = "-";
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.CENTER);
                                            break;
                                        default:
                                            cell.Value = value.Value;
                                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                            break;
                                    }
                                }
                                else
                                {
                                    cell.Value = "-";
                                    OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.CENTER);
                                }
                            }
                            else
                            {
                                cell.Value = "-";
                                OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.CENTER);
                            }

                        }
                        row++;
                    }
                }
                return File(p.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"BaoCaoDuLieu_{tableInfo.name_vn.RemoveVietNameseSign().Replace(" ", "_")}_{DateTime.Now.ToString("ddMMyyyyhhmmss")}.xlsx");
            }
        }
        [HttpPost("searchByLogic")]
        public RestBase SearchByLogic([FromBody] SearchByLogicDTO searchDTO)
        {
            if (searchDTO == null || ((searchDTO.layer_id == null || searchDTO.layer_id.Value == 0) && (searchDTO.table_id == null || searchDTO.table_id.Value == 0)))
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            Layer? layer = null;
            TableInfo? tableInfo = null;
            if (searchDTO.layer_id.HasValue && searchDTO.layer_id.Value > 0)
            {
                layer = getLayerWithTableAndColumn(searchDTO.layer_id.Value);
                if (layer == null)
                {
                    return new RestError(400, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                }
                tableInfo = layer.table;
            }
            else if (searchDTO.table_id.HasValue && searchDTO.table_id.Value > 0)
            {
                tableInfo = getTableAndColumns(searchDTO.table_id.Value);
            }
            if (tableInfo == null)
            {
                return new RestError(400, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
            }
            using (var session = OpenSession())
            {
                if (searchDTO.selectedFields == null || searchDTO.selectedFields.Count() == 0)
                {
                    searchDTO.selectedFields = tableInfo.columns.Where(x => x.visible);
                }
                IDictionary<string, List<DomainViewModel>> domains_values = domainValueForLookup(tableInfo);

                FeatureCollection features = new FeatureCollection();

                var conditions = getConditionsSearchByLogic(tableInfo, searchDTO.@params);
                var relationSql = getJoinTableRelation(tableInfo, searchDTO.@params);

                string sql =
                    @$"SELECT {string.Join(',', searchDTO.selectedFields.Where(x => "geom".Equals(x.column_name) == false && "search_content".Equals(x.column_name) == false).Select(x => tableInfo.table_schema + "." + tableInfo.table_name + "." + x.column_name))} 
                        FROM {tableInfo.table_schema}.{tableInfo.table_name}
                        {relationSql["leftJoin"]} 
                        WHERE {conditions} AND {relationSql["searchWhere"]}";

                string sqlGroup = string.Empty;

                var provinces = session.Find<Province>(statement => statement
                    .Where($"{nameof(Province.visible)}")
                );
                var districts = session.Find<District>(stm => stm
                    .Where($"{Sql.Entity<District>(x => x.parent_id):TC} = ANY(@province_ids)")
                    .WithParameters(new { province_ids = provinces.Select(x => x.area_id).ToArray() })
                    .OrderBy($"{Sql.Entity<District>(x => x.area_id):TC}")
                );
                var communes = session.Find<Commune>(stm => stm
                    .Where($"{Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@district_ids)")
                    .WithParameters(new { district_ids = districts.Select(x => x.area_id).ToArray() })
                    .OrderBy($"{Sql.Entity<Commune>(x => x.area_id):TC}")
                );

                sql += @$" ORDER BY ";

                if (searchDTO.groupFields != null && searchDTO.groupFields.Count() > 0)
                {
                    sql += string.Join(",", searchDTO.groupFields.Select(x => x.column_name));
                    sql += ",";
                    StringBuilder builder = new StringBuilder();
                    builder.AppendLine($"SELECT {string.Join(",", searchDTO.groupFields.Select(x => x.column_name))}, COUNT({tableInfo.key_column?.column_name ?? tableInfo.identity_column?.column_name}) FROM {tableInfo.table_schema}.{tableInfo.table_name}");
                    builder.AppendLine($" {relationSql["leftJoin"]} WHERE {conditions} AND {relationSql["searchWhere"]} GROUP BY {string.Join(",", searchDTO.groupFields.Select(x => x.column_name))}");
                    sqlGroup = builder.ToString();
                    // Console.WriteLine(sqlGroup);
                }

                TableColumn? orderColumn = tableInfo.label_column ?? tableInfo.key_column ?? tableInfo.identity_column;

                if (!string.IsNullOrWhiteSpace(searchDTO.orderby))
                {
                    sql += searchDTO.orderby;
                }
                else if (orderColumn != null)
                {
                    sql += orderColumn.column_name;
                }

                var totalCount = session.Query<double>($"SELECT COUNT(1) FROM ({sql}) AS result").FirstOrDefault();

                if (searchDTO.pageSize > 0)
                {
                    int skip = searchDTO.pageSize.Value * (searchDTO.pageIndex.Value - 1);
                    sql += $" LIMIT {searchDTO.pageSize} OFFSET {skip}";
                }
                var result = session.Query(sql);
                double _pageCountCeil = Math.Ceiling(totalCount / searchDTO.pageSize.Value);

                var records = result.Select(x => (IDictionary<string, object>)x).ToList();

                var selectedColumns = searchDTO.selectedFields.Where(s => "geom".Equals(s.column_name) == false);
                var relations = getRelations(tableInfo);

                return new RestData()
                {
                    data = new
                    {
                        relations,
                        layer,
                        records,
                        domains = domainValueForLookup(tableInfo),
                        selectedColumns,
                        districts,
                        communes,
                        provinces,
                        pageCount = _pageCountCeil,
                        totalCount,
                        groupSummary = string.IsNullOrWhiteSpace(sqlGroup) ? null : session.Query(sqlGroup).ToList()
                    }
                };
            }
        }

        [HttpPost("getChartData")]
        public RestBase dataChart([FromBody] ChartDTO dto)
        {
            if (dto == null || (!dto.table_id.HasValue || dto.table_id.Value == 0))
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            var table = getTableAndColumns(dto.table_id.Value);
            if (table == null)
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                    }
                };
            using (var session = OpenSession())
            {
                TableColumn? countColumn = table.key_column ?? table.identity_column;
                if (dto.count_column_id.HasValue && dto.count_column_id.Value > 0)
                {
                    countColumn = table.columns.Where(x => x.id == dto.count_column_id).FirstOrDefault();
                }
                var labelColumn = table.label_column ?? countColumn;
                var result = new List<DevChartViewModel>();

                if (dto.group_column_id.HasValue && dto.group_column_id.Value > 0)
                {
                    var column_group = table.columns.Where(x => x.id == dto.group_column_id).FirstOrDefault();
                    if (column_group == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Trường thông tin nhóm không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    else
                    {
                        var sql = string.Empty;
                        var col_category_name = string.Empty;
                        var condition = getConditionForChart(table, dto.@params, column_group);
                        var relationSql = getJoinTableRelation(table);
                        if (column_group.lookup_table_id > 0)
                        {
                            var table_domain = getTableAndColumns(column_group.lookup_table_id);
                            var domainKeyColumn = table_domain.key_column ?? table_domain.identity_column;
                            if (table_domain != null)
                            {
                                col_category_name = table_domain.label_column == null ? "id" : table_domain.label_column.column_name;

                                sql = $@"SELECT CASE WHEN {table.table_schema}.{table.table_name}.{countColumn.column_name} > 0 THEN 1 ELSE 0 END  AS quantity, {table_domain.table_schema}.{table_domain.table_name}.*
                                     FROM {table_domain.table_schema}.{table_domain.table_name}  
                                     LEFT JOIN {table.table_schema}.{table.table_name}
                                        ON {table_domain.table_name}.{domainKeyColumn.column_name} = {table.table_name}.{column_group.column_name}
                                     {relationSql["leftJoin"]}
                                     WHERE {condition} AND {relationSql["searchWhere"]} ";
                                if (dto.@params.ContainsKey(column_group.column_name))
                                {
                                    sql += $@" AND {table_domain.table_name}.id IN ({dto.@params[column_group.column_name]})";
                                }
                            }
                        }
                        else if (column_group.column_name == "district_code"
                            || column_group.column_name == "commune_code"
                            || column_group.column_name == "province_code")
                        {
                            var table_group = string.Empty;
                            var fk_col = string.Empty;
                            switch (column_group.column_name)
                            {
                                case "province_code":
                                    table_group = $"{Sql.Entity<Province>():T}";
                                    col_category_name = Sql.Entity<Province>(x => x.name_vn).ToString();
                                    fk_col = Sql.Entity<Province>(x => x.area_id).ToString();
                                    break;
                                case "district_code":
                                    table_group = $"{Sql.Entity<District>():T}";
                                    col_category_name = Sql.Entity<District>(x => x.name_vn).ToString();
                                    fk_col = Sql.Entity<District>(x => x.area_id).ToString();
                                    break;
                                case "commune_code":
                                    table_group = $"{Sql.Entity<Commune>():T}";
                                    col_category_name = Sql.Entity<Commune>(x => x.name_vn).ToString();
                                    fk_col = Sql.Entity<Commune>(x => x.area_id).ToString();
                                    break;
                                default:
                                    break;
                            }
                            var select_sql = string.Empty;
                            if (!dto.count_column_id.HasValue || dto.count_column_id.Value == 0)
                            {
                                select_sql = $@"SELECT CASE  WHEN {table.table_schema}.{table.table_name}.{countColumn.column_name} > 0 THEN 1 ELSE 0 END  AS  quantity, {table_group}.*";
                            }
                            else
                            {
                                select_sql = $@"SELECT CASE  WHEN {table.table_schema}.{table.table_name}.{countColumn.column_name} > 0 THEN {table.table_schema}.{table.table_name}.{countColumn.column_name} ELSE 0 END  AS  quantity, {table_group}.*";
                            }
                            sql = select_sql + $@" FROM {table.table_schema}.{table.table_name}
                                    LEFT JOIN {table_group} ON
                                    {column_group.column_name} = {table_group}.{fk_col}
                                     {relationSql["leftJoin"]}
                                     WHERE {condition} AND {relationSql["searchWhere"]}";
                            if (dto.@params.ContainsKey(column_group.column_name))
                                sql += $@" AND {table_group}.{col_category_name} IN ({dto.@params[column_group.column_name]})";
                        }
                        var sqlBase = $@"SELECT SUM(quantity) as count, q.{col_category_name} as category_name FROM
                                        ({sql}) as q
                                        GROUP BY category_name";
                        result = session.Query<DevChartViewModel>(sqlBase).ToList();
                        foreach (var category in result)
                        {
                            if (string.IsNullOrWhiteSpace(category.category_name))
                            {
                                category.category_name = "Không xác định";
                            }
                        }
                    }
                }
                else
                {
                    string condition = getConditions(table, dto.@params);
                    string sql = $@"SELECT {countColumn.column_name} AS count, {labelColumn.column_name} AS category_name FROM {table.table_schema}.{table.table_name} WHERE {condition}";
                    result = session.Query<DevChartViewModel>(sql).ToList();
                }
                return new RestData()
                {
                    data = result
                };
            }
        }

        [HttpPost("exportSearchByLogic")]
        public IActionResult ExportSearchByLogic([FromBody] SearchByLogicDTO searchDTO)
        {
            if (searchDTO == null || ((searchDTO.layer_id == null || searchDTO.layer_id.Value == 0) && (searchDTO.table_id == null || searchDTO.table_id.Value == 0)))
                return NotFound();
            TableInfo? tableInfo = null;
            Layer? layer = null;
            if (searchDTO.layer_id.HasValue && searchDTO.layer_id.Value > 0)
            {
                layer = getLayerWithTableAndColumn(searchDTO.layer_id.Value);
                if (layer == null)
                    return NotFound();
                tableInfo = layer.table;
            }
            else
            {
                tableInfo = getTableAndColumns(searchDTO.table_id.Value);
            }
            if (tableInfo == null)
                return NotFound();

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using (var session = OpenSession())
            {
                FeatureCollection features = new FeatureCollection();

                var conditions = getConditionsSearchByLogic(tableInfo, searchDTO.@params);
                List<TableColumn> selectedColumns = searchDTO.selectedFields
                    .Where(x => "geom".Equals(x.column_name) == false && "id".Equals(x.column_name) == false && "search_content".Equals(x.column_name) == false)
                    .ToList();
                string sql = @$"SELECT {string.Join(',', selectedColumns.Select(x => x.column_name))} FROM {tableInfo.table_schema}.{tableInfo.table_name} WHERE {conditions}";

                TableColumn? orderColumn = tableInfo.label_column ?? tableInfo.key_column ?? tableInfo.identity_column;
                if (!string.IsNullOrWhiteSpace(searchDTO.orderby))
                {
                    sql += @$" ORDER BY " + searchDTO.orderby;
                }
                else if (orderColumn != null)
                {
                    sql += @$" ORDER BY " + orderColumn.column_name;
                }

                var result = session
                    .Query(sql);
                var totalCount = session
                    .Query<double>($"SELECT COUNT(*) FROM ({sql}) AS result").FirstOrDefault();

                var records = result.Select(x => (IDictionary<string, object>)x).ToList();

                var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id):C}"));
                var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id):C}"));
                var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id):C}"));

                IDictionary<string, List<DomainViewModel>> domains_values = domainValueForLookup(tableInfo);
                using (ExcelPackage p = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    sheet = p.Workbook.Worksheets.Add("Thông tin dữ liệu " + tableInfo.name_vn);
                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Thông tin dữ liệu " + tableInfo.name_vn;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    string cellMerge3 = sheet.Cells[1, 1] + ":" + sheet.Cells[1, selectedColumns.Count() + 1];
                    ExcelRange rng3 = sheet.Cells[cellMerge3];
                    rng3.Merge = true;

                    var row = 2;

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

                    var dem = 0;
                    row = 4;
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
                                    if (selectedColumns[j].data_type.Equals(EnumPgDataType.Boolean)) //)
                                    {
                                        if (currentCol.Value != null)
                                        {
                                            if (Convert.ToBoolean(currentCol.Value) == true)
                                            {
                                                cell = sheet.Cells[row, colIdx + j + incre];
                                                cell.Value = "x";

                                            }
                                            else
                                            {
                                                cell = sheet.Cells[row, colIdx + j + incre + 1];
                                                cell.Value = "x";
                                            }
                                        }
                                        cell = sheet.Cells[row, colIdx + j + incre];
                                        OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                        cell = sheet.Cells[row, colIdx + j + incre + 1];
                                        OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                        incre += 1;
                                    }
                                    else
                                    {
                                        cell = sheet.Cells[row, colIdx + j + incre];
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
                                                    OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.LEFT);
                                                    break;
                                                case EnumPgDataType.Date:
                                                case EnumPgDataType.Time:
                                                case EnumPgDataType.DateTime:
                                                case EnumPgDataType.DateTimeTZ:
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
                                    var domain = domains?.Where(x => x.id.ToString() == currentCol.Value?.ToString())?.FirstOrDefault();
                                    cell = sheet.Cells[row, colIdx + j + incre];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Value = domain != null ? domain.mo_ta : "Không xác định";
                                    cell.Style.WrapText = true;

                                    OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT);
                                }
                            }
                            row++;
                        }
                    }
                    return File(p.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        $"ThongTin_{tableInfo.name_vn.RemoveVietNameseSign().Replace(" ", "_")}.xlsx");
                }
            }
        }

        protected string getConditionForChart(TableInfo table, IDictionary<string, object> parameter, TableColumn group_column)
        {
            if (parameter == null)
            {
                return "(1=1)";
            }

            var conditions = new List<string>();
            conditions.Add("(1=1)");
            var columns = table.columns;
            columns.ToList().Remove(group_column);
            foreach (var _key in parameter.Keys)
            {
                var attr_name = _key.Replace("_start", "").Replace("_dateStart", "");
                if (!string.IsNullOrWhiteSpace(parameter[_key].ToString()) && columns.Select(x => x.column_name).Contains(attr_name))
                {
                    var col = columns.Where(x => x.column_name == attr_name).FirstOrDefault();
                    if (col != null)
                    {
                        if (col.lookup_table_id > 0)
                        {
                            conditions.Add($"{table.table_name}.{col.column_name} IN ({parameter[_key]})");
                        }
                        else if ((col.data_type == EnumPgDataType.SmallInt || col.data_type == EnumPgDataType.Integer || col.data_type == EnumPgDataType.Double))
                        {
                            conditions.Add($@"({table.table_name}.{col.column_name} >= {parameter[col.column_name + "_start"]} 
                                        AND {table.table_name}.{col.column_name} <= {parameter[col.column_name + "_end"]})");
                        }
                        else if (col.data_type == EnumPgDataType.Boolean)
                        {
                            conditions.Add($"{table.table_name}.{col.column_name} IN ({parameter[_key]})");
                        }
                        else if (col.data_type == EnumPgDataType.Date || col.data_type == EnumPgDataType.DateTime)
                        {
                            var dateStart = DateTime.Parse(parameter[attr_name + "_dateStart"].ToString());
                            var dateEnd = DateTime.Parse(parameter[attr_name + "_dateEnd"].ToString());
                            if (col.data_type == EnumPgDataType.DateTime)
                                conditions.Add($@"({table.table_name}.{col.column_name} >= to_timestamp('{dateStart.ToString("dd-MM-yy HH:mm:ss")}','DD-MM-YY HH24:mi:SS') AND 
                                                {table.table_name}.{col.column_name} <= to_timestamp('{dateEnd.ToString("dd-MM-yy HH:mm:ss")}','DD-MM-YY HH24:mi:SS'))");
                            else if (col.data_type == EnumPgDataType.Date)
                                conditions.Add($@"({table.table_name}.{col.column_name} >= to_timestamp('{dateStart.ToString("dd-MM-yy")}','DD-MM-YY') AND 
                                                {table.table_name}.{col.column_name} <= to_timestamp('{dateEnd.ToString("dd-MM-yy")}','DD-MM-YY'))");
                        }
                        else if (col.data_type == EnumPgDataType.Text || col.data_type == EnumPgDataType.String)
                        {
                            var text = parameter[col.column_name].ToString().ToPGFulltext();
                            conditions.Add($"{table.table_name}.search_content @@ '{text}'");
                        }
                    }
                }
                else if (_key == "textSearch" && !string.IsNullOrWhiteSpace(parameter[_key].ToString()))
                {
                    var cleanKw = parameter[_key].ToString().ToPGFulltext();
                    conditions.Add($"{table.table_name}.search_content @@ '{cleanKw}'");
                }
                else if (_key == "geomSearch" && !string.IsNullOrWhiteSpace(parameter[_key].ToString()))
                {
                    conditions.Add($"ST_Intersects({table.table_name}.geom, ST_SetSRID(ST_GeomFromGeoJSON('{parameter[_key]}'),4326))");
                }
            }
            return string.Join(" AND ", conditions);
        }
    }
}