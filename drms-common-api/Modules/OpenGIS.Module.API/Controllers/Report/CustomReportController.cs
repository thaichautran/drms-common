using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.ViewModels;
using OpenGIS.Module.Core.Models.DTO;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using OpenGIS.Module.Core.Models.Entities.Category;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Globalization;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models.Entities;
using System.Text;

namespace OpenGIS.Module.API.Controllers
{
    public partial class ReportController
    {
        [HttpPost("custom-report-data")]
        public async Task<RestBase> getCustomReportDataAsync([FromBody] CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                if (param == null)
                {
                    return new RestError(-1, "Lỗi tham số!");
                }
                var result = new Dictionary<string, object>();
                switch (param.reportType)
                {
                    case EnumCustomReportType.SoLuong:
                        return getReportDataHoSoTheoLoaiNhaLoaiCongTrinh(param);
                    case EnumCustomReportType.SoLuongSuCo:
                        return getReportDataSuCo(param);
                    case EnumCustomReportType.SoLuongBaoTriBaoDuong:
                        return getReportDataBaoTri(param);
                    case EnumCustomReportType.SoLuongHoSo:
                        return getReportDataGroupHoSo(param);
                    case EnumCustomReportType.TinhTrangHoSo:
                        return getReportDataHoSo(param);
                    case EnumCustomReportType.DuyetHoSoMoiNhat:
                        return getReportDataDuyetHoSo(param);
                    case EnumCustomReportType.ChieuDaiTuyenCap:
                        return getReportDataChieuDai(param, "cs_tuyencap");
                    case EnumCustomReportType.ChieuDaiCongThoatNuoc:
                        return getReportDataChieuDai(param, "tn_congthoatnuoc");
                    case EnumCustomReportType.ThongKeSoLuong:
                        return getReportSoLuong(param);
                    case EnumCustomReportType.ThongKeThoatNuocTheoTuyen:
                        return getReportThongKeLoaiCongTrinhTheoTuyen(param);
                    case EnumCustomReportType.ThongKeThoatNuocTheoHo:
                        return getReportThongKeLoaiCongTrinhTheoHo(param);
                    case EnumCustomReportType.ThongKePhanLoaiCongThoatNuoc:
                        return getReportThongKePhanLoaiCongThoatNuoc(param);
                    case EnumCustomReportType.ThongKeCayXanhTheoTuyen:
                        return getReportThongKeLoaiCongTrinhTheoTuyen(param);
                    case EnumCustomReportType.ThongKeChieuSangTheoTuyen:
                        return getReportThongKeLoaiCongTrinhTheoTuyenChieuSang(param);
                    case EnumCustomReportType.ThongKeChieuSangTheoTramDen:
                        return getReportThongKeLoaiCongTrinhChieuSangTheoTram(param);
                    case EnumCustomReportType.TongHopThoatNuoc:
                        return getReportTongHopThoatNuoc(param);
                    default:
                        break;
                }
                return new RestData()
                {
                    data = result
                };
            }
        }

        [HttpPost("custom-chart-data")]
        public async Task<RestBase> getCustomChartDataAsync([FromBody] CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                if (param == null)
                {
                    return new RestError(-1, "Lỗi tham số!");
                }
                var result = new List<ReportDataViewModel>();
                switch (param.reportType)
                {
                    case "BieuDoSoLuong":
                        result = getChartDataHoSoTheoLoaiNhaCongTrinh(param);
                        break;
                    case "BieuDoSoLuongSuCo":
                        result = getChartDataSuCo(param);
                        break;
                    case "BieuDoSoLuongBaoTriBaoDuong":
                        result = getChartDataBaoTri(param);
                        break;
                    case "BieuDoSoLuongHoSo":
                        result = getChartDataHoSo(param);
                        break;
                    default:
                        break;
                }
                return new RestData()
                {
                    data = new
                    {
                        result = result.OrderBy(x => x.description),
                    }
                };
            }
        }

        [HttpPost("export-custom-report")]
        public IActionResult exportCustomReport([FromForm] CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                if (param == null)
                {
                    return NotFound();
                }
                var result = new Dictionary<string, object>();
                switch (param.reportType)
                {
                    case EnumCustomReportType.SoLuong:
                        return exportReportDataHoSoTheoLoaiNhaLoaiCongTrinh(param);
                    case EnumCustomReportType.SoLuongSuCo:
                        return exportReportDataSuCo(param);
                    case EnumCustomReportType.SoLuongBaoTriBaoDuong:
                        return exportReportDataBaoTri(param);
                    case EnumCustomReportType.SoLuongHoSo:
                        return exportReportDataGroupHoSo(param);
                    case EnumCustomReportType.TinhTrangHoSo:
                        return exportReportDataHoSo(param, false);
                    case EnumCustomReportType.DuyetHoSoMoiNhat:
                        return exportReportDataHoSo(param, true);
                    case EnumCustomReportType.ChieuDaiTuyenCap:
                        return exportReportDataChieuDaiTuyenCap(param);
                    case EnumCustomReportType.ChieuDaiCongThoatNuoc:
                        return exportReportDataChieuDaiCongThoatNuoc(param);
                    case EnumCustomReportType.ThongKeSoLuong:
                        return exportReportDataSoLuong(param);
                    case EnumCustomReportType.ThongKeChieuSangTheoTuyen:
                        return exportReportDataThongKeLoaiCongTrinhChieuSang(param);
                    case EnumCustomReportType.ThongKeCayXanhTheoTuyen:
                    case EnumCustomReportType.ThongKeThoatNuocTheoTuyen:
                    case EnumCustomReportType.ThongKeChieuSangTheoTramDen:
                    case EnumCustomReportType.ThongKeThoatNuocTheoHo:
                    case EnumCustomReportType.ThongKePhanLoaiCongThoatNuoc:
                        return exportReportDataThongKeLoaiCongTrinh(param);
                    default:
                        break;
                }
                return NotFound();
            }
        }

        [HttpGet("distinct-values")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_TABLE_COLUMN))]
        public RestBase distinctValues([FromQuery] string? q = "", [FromQuery] int? page = 1, [FromQuery] int? pageSize = 25, [FromQuery] string? tableName = "")
        {
            using var session = OpenSession();
            if (string.IsNullOrWhiteSpace(tableName))
                return new RestError(-1, "Lối tham số!");
            TableInfo? table = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = '{tableName}'")
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();
            if (table == null)
                return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
            var labelColumn = table.columns.Where(x => x.is_label).FirstOrDefault();
            if (labelColumn == null)
            {
                return new RestError(404, "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!");
            }
            List<string> where = new List<string>{
                        "1=1"
                    };
            if (page < 1)
            {
                page = 1;
            }
            if (pageSize < 1)
            {
                pageSize = 25;
            }
            if (string.IsNullOrWhiteSpace(q) == false)
            {
                where.Add($"search_content @@ to_tsquery('{q.ToFullTextStringProximity()}')");
            }
            if (!User.IsInRole(Core.Enums.EnumRoles.SA))
            {
                var userRegions = session.Find<UserRegion>(statement => statement
                   .Where($"{nameof(UserRegion.user_id)} = @id")
                   .WithParameters(new { id = getUserId() })
                ).ToList();
                if (table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                {
                    where.Add(@$"(district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(x => $"'{x.area_code}'"))}) OR district_code IS NULL OR district_code = '')");
                }
                if (table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                {
                    where.Add(@$"(commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(x => $"'{x.area_code}'"))}) OR commune_code IS NULL OR commune_code = '')");
                }

            }
            StringBuilder builder = new StringBuilder();
            builder.Append(@$"SELECT DISTINCT {labelColumn.column_name}::TEXT FROM {table.table_schema}.{table.table_name}");
            builder.Append(@$" WHERE {string.Join(" AND ", where)}");
            builder.Append(@$" ORDER BY 1");
            builder.Append(@$" OFFSET {--page * pageSize} LIMIT {pageSize};");
            return new RestPagedDataTable
            {
                data = session.Query<string>(builder.ToString()),
                recordsTotal = session.Query<int>($"SELECT COUNT(DISTINCT {labelColumn.column_name}) FROM {table.table_schema}.{table.table_name} WHERE {string.Join(" AND ", where)};").FirstOrDefault(),
            };
        }

        private RestBase getReportDataBaoTri(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var condition = " 1= 1";
                var sql = @$"SELECT w.worder_id, w.wdesc, org.mo_ta AS org_name, worg.mo_ta AS worg_name, objtype.mo_ta AS obj_type_name, 
                                 wtype.mo_ta AS wtype_name,  wkin.mo_ta AS wkind_name, wstatus.mo_ta AS wstatus_all, 
                                 wtype_result.mo_ta AS wtype_result_name, loai_taisan.mo_ta AS loaicongtrinh_name,
                                 district.dis_name AS dis_name, commune.com_name AS com_name 
                                 FROM {Sql.Entity<Worder>():T} w
                                 LEFT JOIN category.dm_donvi_quanly org ON w.org_id = org.id 
                                 LEFT JOIN category.dm_donvi_quanly worg ON w.worg_id = worg.id 
                                 LEFT JOIN category.dm_loai_congviec objtype ON w.obj_type_id = objtype.id 
                                 LEFT JOIN category.dm_kieu_congviec wtype ON w.wtype_id = wtype.id 
                                 LEFT JOIN category.dm_hinhthuc_kiemtra wkin ON w.wkind_id = wkin.id 
                                 LEFT JOIN category.dm_trangthai_congviec wstatus ON w.wstatus_id_all = wstatus.id 
                                 LEFT JOIN category.dm_ketqua_thuchien wtype_result ON w.wtype_result_id = wtype_result.id
                                 LEFT JOIN category.dm_loai_taisan loai_taisan ON w.loaicongtrinh_id = loai_taisan.id 
                                 LEFT JOIN regional.districts district ON w.district_code = district.disid_2004 
                                 LEFT JOIN regional.communes commune ON w.commune_code = commune.comid_2004 
                                 WHERE {condition} ORDER BY {nameof(Worder.actual_finish_date)} DESC LIMIT {param.pageSize} OFFSET {(param.pageIndex - 1) * param.pageSize}";
                var data = session.Query<WorderInfoViewModel>(sql, param).ToList();

                return new RestData
                {
                    data = new
                    {
                        data,
                        totalCount = session.Query<int>($"SELECT COUNT({nameof(Worder.worder_id)}) FROM {Sql.Entity<Worder>():T} w WHERE {condition}", param).FirstOrDefault()
                    },
                };
            }
        }
        private RestBase getReportDataDuyetHoSo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var condition = $"{Sql.Entity<HoSo>(x => x.trangthai_id):TC} = 2";
                if (param.dateStart != null && param.dateStart != DateTime.MinValue)
                {
                    condition += $" AND DATE({Sql.Entity<HoSo>(x => x.updated_at):TC}) >= @dateStart";
                }
                if (param.dateEnd != null && param.dateEnd != DateTime.MinValue)
                {
                    condition += $" AND DATE({Sql.Entity<HoSo>(x => x.updated_at):TC}) <= @dateEnd";
                }
                var rowIndex = (param.pageIndex - 1) * param.pageSize;
                var data = session.Find<HoSo>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(param)
                    .Include<LoaiHoSo>(x => x.InnerJoin())
                    .Include<NhomHoSo>(x => x.InnerJoin())
                    .Include<LoaiNha>(x => x.InnerJoin())
                    .Include<LoaiTaiSan>(x => x.InnerJoin())
                    .Include<TinhTrangHoSo>(x => x.InnerJoin())
                    .OrderBy($"{Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                ).Skip(rowIndex.Value).Take(param.pageSize.Value).ToList();

                return new RestData
                {
                    data = new
                    {
                        data,
                        totalCount = session.Count<HoSo>(stm => stm.Where($"{condition}").WithParameters(param))
                    }
                };
            }
        }
        private RestBase getReportDataHoSo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var condition = $"(1=1)";
                var rowIndex = (param.pageIndex - 1) * param.pageSize;
                var data = session.Find<HoSo>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(param)
                    .Include<LoaiHoSo>(x => x.InnerJoin())
                    .Include<NhomHoSo>(x => x.InnerJoin())
                    .Include<LoaiNha>(x => x.InnerJoin())
                    .Include<LoaiTaiSan>(x => x.InnerJoin())
                    .Include<TinhTrangHoSo>(x => x.InnerJoin())
                    .OrderBy($"{Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                ).Skip(rowIndex.Value).Take(param.pageSize.Value).ToList();

                return new RestData
                {
                    data = new
                    {
                        data,
                        totalCount = session.Count<HoSo>()
                    }
                };
            }
        }
        private RestBase getReportDataGroupHoSo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var rowIndex = (param.pageIndex - 1) * param.pageSize;
                List<HoSoReportGroupViewModel> data = new List<HoSoReportGroupViewModel>();
                if (param.groupBy == "LOAINHA")
                {
                    var records = session.Find<HoSo>(stm => stm
                            .Include<LoaiHoSo>(x => x.InnerJoin())
                            .Include<NhomHoSo>(x => x.InnerJoin())
                            .Include<LoaiNha>(x => x.InnerJoin())
                            .Include<LoaiTaiSan>(x => x.InnerJoin())
                            .Include<TinhTrangHoSo>(x => x.InnerJoin())
                            .OrderBy($"{Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                    ).GroupBy(x => x.loainha_id).Skip(rowIndex.Value).Take(param.pageSize.Value).ToList();
                    foreach (var record in records)
                    {
                        LoaiNha? loaiNha = session.Get(new LoaiNha { id = record.Key.Value });
                        data.Add(new HoSoReportGroupViewModel
                        {
                            hoSos = record.ToList(),
                            count = session.Count<HoSo>(stm => stm.Where($"{nameof(HoSo.loainha_id)} = {record.Key.Value}")),
                            key = loaiNha != null ? loaiNha.mo_ta : "Không xác định"
                        });
                    }
                }
                else if (param.groupBy == "TINHTRANG")
                {
                    var records = session.Find<HoSo>(stm => stm
                            .Include<LoaiHoSo>(x => x.InnerJoin())
                            .Include<NhomHoSo>(x => x.InnerJoin())
                            .Include<LoaiNha>(x => x.InnerJoin())
                            .Include<LoaiTaiSan>(x => x.InnerJoin())
                            .Include<TinhTrangHoSo>(x => x.InnerJoin())
                            .OrderBy($"{Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                    ).GroupBy(x => x.trangthai_id).Skip(rowIndex.Value).Take(param.pageSize.Value).ToList();
                    foreach (var record in records)
                    {
                        TinhTrangHoSo? tinhTrangHoSo = session.Get(new TinhTrangHoSo { id = record.Key.Value });
                        data.Add(new HoSoReportGroupViewModel
                        {
                            hoSos = record.ToList(),
                            count = session.Count<HoSo>(stm => stm.Where($"{nameof(HoSo.trangthai_id)} = {record.Key.Value}")),
                            key = tinhTrangHoSo != null ? tinhTrangHoSo.mo_ta : "Không xác định"
                        });
                    }
                }
                return new RestData
                {
                    data = new
                    {
                        data,
                        totalCount = session.Count<HoSo>()
                    }
                };
            }
        }
        private RestBase getReportDataHoSoTheoLoaiNhaLoaiCongTrinh(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var rowIndex = (param.pageIndex - 1) * param.pageSize;
                List<HoSoReportDoubleGroupViewModel> data = new List<HoSoReportDoubleGroupViewModel>();
                var records = session.Find<HoSo>(stm => stm
                            .Include<LoaiHoSo>(x => x.InnerJoin())
                            .Include<NhomHoSo>(x => x.InnerJoin())
                            .Include<LoaiNha>(x => x.InnerJoin())
                            .Include<LoaiTaiSan>(x => x.InnerJoin())
                            .Include<TinhTrangHoSo>(x => x.InnerJoin())
                            .OrderBy($"{Sql.Entity<HoSo>(x => x.loainha_id):TC}, {Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                    ).Skip(rowIndex.Value).Take(param.pageSize.Value).ToList().GroupBy(x => x.loainha_id);
                foreach (var record in records)
                {
                    LoaiNha? loaiNha = session.Get(new LoaiNha { id = record.Key.Value });
                    var hoSoGroupByCongTrinhs = record.ToList().GroupBy(x => x.loaicongtrinh_id).ToList();
                    var items = new List<HoSoReportGroupViewModel>();
                    foreach (var hoSoGroupByCongTrinh in hoSoGroupByCongTrinhs)
                    {
                        LoaiTaiSan? loaiTaiSan = session.Get(new LoaiTaiSan { id = hoSoGroupByCongTrinh.Key.Value });
                        items.Add(new HoSoReportGroupViewModel
                        {
                            hoSos = hoSoGroupByCongTrinh.ToList(),
                            count = session.Count<HoSo>(stm => stm
                                .Where($"{nameof(HoSo.loaicongtrinh_id)} = {hoSoGroupByCongTrinh.Key} AND {nameof(HoSo.loainha_id)} = {record.Key.Value}")),
                            key = loaiTaiSan != null ? loaiTaiSan.mo_ta : "Không xác định"
                        });
                    }
                    data.Add(new HoSoReportDoubleGroupViewModel
                    {
                        items = items,
                        count = session.Count<HoSo>(stm => stm.Where($"{nameof(HoSo.loainha_id)} = {record.Key}")),
                        key = loaiNha != null ? loaiNha.mo_ta : "Không   xác định"
                    });
                }
                return new RestData
                {
                    data = new
                    {
                        data,
                        totalCount = session.Count<HoSo>()
                    }
                };
            }
        }
        private RestBase getReportDataSuCo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var data = new List<object>();
                int totalCount = 0;
                TableInfo? tableInfo = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) LIKE '%vitrisuco%'")
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();
                if (tableInfo != null)
                {
                    List<string> selectedColumns = tableInfo.columns
                            .Where(x => x.visible && !x.column_name.Contains("geom") && !x.column_name.Contains("shape")
                    ).Select(x => x.column_name).ToList();
                    TableColumn? keyColumn = tableInfo.key_column ?? tableInfo.identity_column;
                    string query = @$"SELECT {string.Join(", ", selectedColumns)}, 
                                {Sql.Entity<LoaiTaiSan>(x => x.mo_ta):TC} AS loaicongtrinh_name, 
                                {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC}
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} sc 
                            LEFT JOIN {Sql.Entity<LoaiTaiSan>():T}
                                ON sc.loaicongtrinh_id = {Sql.Entity<LoaiTaiSan>(x => x.id):TC}
                            LEFT JOIN {Sql.Entity<District>():T}
                                ON sc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            LEFT JOIN {Sql.Entity<Commune>():T} 
                                ON sc.commune_code = {Sql.Entity<Commune>(x => x.area_id):TC}
                            ORDER BY sc.{keyColumn.column_name} DESC LIMIT {param.pageSize} OFFSET {(param.pageIndex - 1) * param.pageSize}";
                    data = session.Query<object>($"{query}").ToList();
                    totalCount = session.Query<int>($"SELECT COUNT({keyColumn.column_name}) FROM {tableInfo.table_schema}.{tableInfo.table_name}").FirstOrDefault();
                }
                return new RestData
                {
                    data = new
                    {
                        data,
                        totalCount
                    }
                };
            }
        }

        private RestBase getReportDataChieuDai(CustomReportListDxDTO param, string table_name = "")
        {
            using (var session = OpenSession())
            {
                int totalCount = 0;
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, ReportDataViewModel>> result = new List<IGrouping<string?, ReportDataViewModel>>();
                TableInfo? tableInfo = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = @table_name")
                    .WithParameters(new { table_name })
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();
                if (tableInfo != null)
                {
                    string where = "1=1";
                    if (string.IsNullOrWhiteSpace(param.communeCode) == false)
                    {
                        where += $" AND tc.commune_code = '{param.communeCode}'";
                    }
                    if (string.IsNullOrWhiteSpace(param.districtCode) == false)
                    {
                        where += $" AND tc.district_code = '{param.districtCode}'";
                    }

                    TableInfo? tuyenTable = null;
                    string sqlJoin = "";
                    if (table_name.Contains("tn_"))
                    {
                        tuyenTable = session.Find<TableInfo>(stm => stm
                            .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'tn_tuyen'")
                            .WithParameters(new { table_name })
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                        ).FirstOrDefault();
                    }
                    else if (table_name.Contains("cs_"))
                    {
                        tuyenTable = session.Find<TableInfo>(stm => stm
                            .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'cs_tuyen'")
                            .WithParameters(new { table_name })
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                        ).FirstOrDefault();
                    }
                    else if (table_name.Contains("cx_"))
                    {
                        tuyenTable = session.Find<TableInfo>(stm => stm
                            .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'cx_tuyen'")
                            .WithParameters(new { table_name })
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                        ).FirstOrDefault();
                    }
                    if (tuyenTable != null)
                    {
                        if (string.IsNullOrWhiteSpace(param.textSearch) == false)
                        {
                            var tenTuyens = param.textSearch.Split(",").ToList();
                            //where += $" AND tc.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')";
                            where += $" AND tuyen.tentuyen IN ({string.Join(",", tenTuyens.Select(x => @$"'{x}'"))})";
                        }
                        sqlJoin = @$"LEFT JOIN {tuyenTable.table_schema}.{tuyenTable.table_name} tuyen  ON tc.matuyen = tuyen.matuyen";
                    }
                    List<string> selectedColumns = tableInfo.columns
                            .Where(x => x.visible && !x.column_name.Contains("geom") && !x.column_name.Contains("shape")
                    ).Select(x => x.column_name).ToList();
                    TableColumn? keyColumn = tableInfo.key_column ?? tableInfo.identity_column;
                    string query = string.Empty;
                    if (param.groupBy == "HANHCHINH")
                    {
                        query = @$"SELECT SUM(tc.chieudai) / 1000 AS {nameof(ReportDataViewModel.sum)},
                            {Sql.Entity<District>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.description)},
                            {Sql.Entity<Commune>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.detail)}
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} tc 
                            LEFT JOIN {Sql.Entity<District>():T}
                                ON tc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            LEFT JOIN {Sql.Entity<Commune>():T} 
                                ON tc.commune_code = {Sql.Entity<Commune>(x => x.area_id):TC}
                            {sqlJoin}
                            WHERE tc.chieudai NOTNULL AND {where}
                            GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC} 
                            ORDER BY {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC} DESC 
                            LIMIT {param.pageSize} OFFSET {(param.pageIndex - 1) * param.pageSize}";

                        totalCount = session.Query<int>(@$"SELECT COUNT(DISTINCT(tc.district_code, tc.commune_code)) 
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} as tc {sqlJoin} WHERE {where}").FirstOrDefault();
                    }
                    else if (param.groupBy == "MATUYEN")
                    {
                        query = @$"SELECT SUM(tc.chieudai) / 1000 AS {nameof(ReportDataViewModel.sum)}, 
                            {Sql.Entity<District>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.description)},
                            tuyen.tentuyen AS {nameof(ReportDataViewModel.detail)} 
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} tc
                            LEFT JOIN {Sql.Entity<District>():T}
                                ON tc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            {sqlJoin}
                            WHERE tc.chieudai NOTNULL AND {where}
                            GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}, tuyen.tentuyen
                            ORDER BY {Sql.Entity<District>(x => x.name_vn):TC}, tuyen.tentuyen DESC LIMIT {param.pageSize} OFFSET {(param.pageIndex - 1) * param.pageSize}";

                        totalCount = session.Query<int>(@$"SELECT COUNT(DISTINCT(tc.district_code, tuyen.tentuyen)) 
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} as tc {sqlJoin} WHERE {where}").FirstOrDefault();
                    }
                    result = session.Query<ReportDataViewModel>($"{query}").ToList().GroupBy(x => x.description).ToList();
                    foreach (var record in result)
                    {
                        string condition = "(1 = 1)";
                        if (record.Key != null)
                        {
                            condition = @$"{Sql.Entity<District>(x => x.name_vn):TC} = '{record.Key.ToString()}'";
                        }
                        else
                        {
                            condition = $@"tc.district_code = '' OR tc.district_code IS NULL";
                        }
                        var group = new ReportGroupViewModel
                        {
                            sum = session.Query<double>(@$"SELECT SUM(tc.chieudai) / 1000
                                FROM {tableInfo.table_schema}.{tableInfo.table_name} tc 
                                LEFT JOIN {Sql.Entity<District>():T}
                                ON tc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                                WHERE tc.chieudai NOTNULL AND {condition}").FirstOrDefault(),
                            key = record.Key != null ? record.Key : "Không xác định",
                            items = new List<ReportGroupViewModel>()
                        };
                        if (record.Count() > 0)
                        {
                            foreach (var item in record)
                            {
                                var child = new ReportGroupViewModel
                                {
                                    sum = item.sum.Value,
                                    key = item.detail != null ? item.detail : "Không xác định"
                                };
                                group.items.Add(child);
                            }
                        }
                        data.Add(group);
                    }

                }
                return new RestData
                {
                    data = new
                    {
                        data,
                        totalCount
                    }
                };
            }
        }

        private RestBase getReportSoLuong(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                int totalCount = 0;
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, ReportDataViewModel>> result = new List<IGrouping<string?, ReportDataViewModel>>();
                if (param.layerIds == null || param.layerIds.Count() == 0) return new RestError(-1, "Lối tham số!");
                if (param.layerIds.Count() == 1)
                {
                    var layer = getLayerWithTableAndColumn(param.layerIds.FirstOrDefault());
                    if (layer == null) return new RestError(404, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    TableInfo tableInfo = layer.table;
                    string where = "1=1";
                    List<string> sqlJoin = new List<string>();
                    if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                    {
                        where += $" AND cx.commune_code = '{param.communeCode}'";
                        sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = cx.commune_code");
                    }
                    if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                    {
                        where += $" AND cx.district_code = '{param.districtCode}'";
                        sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = cx.district_code");
                    }
                    if (string.IsNullOrWhiteSpace(param.textSearch) == false)
                    {
                        where += $" AND cx.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')";
                    }
                    if (tableInfo != null)
                    {
                        TableColumn? keyColumn = tableInfo.key_column ?? tableInfo.identity_column;
                        string query = string.Empty;
                        string groupColumn = "";
                        if (tableInfo.columns.Where(x => x.column_name == param.groupBy.ToLower()).Count() == 0)
                        {
                            return new RestError(-1, "Trường dữ liệu nhóm không tồn tại, vui lòng kiểm tra lại");
                        }
                        else
                        {
                            groupColumn = param.groupBy.ToLower();
                        }
                        var join = sqlJoin.Count > 0 ? string.Join(" ", sqlJoin) : "";

                        query = @$"SELECT COUNT(1) AS {nameof(ReportDataViewModel.count)}, 
                            cx.matuyen AS {nameof(ReportDataViewModel.description)},
                            cx.{groupColumn} AS {nameof(ReportDataViewModel.detail)} 
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} cx
                            {join}
                            WHERE {where}
                            GROUP BY cx.matuyen, cx.{groupColumn}
                            ORDER BY cx.{groupColumn} DESC 
                            LIMIT {param.pageSize} OFFSET {(param.pageIndex - 1) * param.pageSize}";
                        totalCount = session.Query<int>(@$"SELECT COUNT(DISTINCT(cx.{groupColumn})) FROM {tableInfo.table_schema}.{tableInfo.table_name} cx {join} WHERE {where}").FirstOrDefault();
                        result = session.Query<ReportDataViewModel>($"{query}").ToList().GroupBy(x => x.description).ToList();
                        foreach (var record in result)
                        {
                            string condition = "(1 = 1)";
                            if (string.IsNullOrWhiteSpace(record.Key))
                            {
                                condition += @$" AND (cx.matuyen = '' OR cx.matuyen IS NULL)";

                            }
                            else
                            {
                                condition += $@" AND cx.matuyen = '{record.Key}'";
                            }
                            var group = new ReportGroupViewModel
                            {
                                count = session.Query<int>(@$"SELECT COUNT(1)
                                                FROM {tableInfo.table_schema}.{tableInfo.table_name} cx 
                                                LEFT JOIN {Sql.Entity<District>():T}
                                                ON cx.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                                                WHERE {condition}").FirstOrDefault(),
                                key = record.Key != null ? record.Key : "Không xác định",
                                items = new List<ReportGroupViewModel>()
                            };
                            if (record.Count() > 0)
                            {
                                foreach (var item in record)
                                {
                                    var child = new ReportGroupViewModel
                                    {
                                        count = item.count.Value,
                                        key = item.detail != null ? item.detail : "Không xác định"
                                    };
                                    group.items.Add(child);
                                }
                            }
                            data.Add(group);
                        }
                    }
                }
                else
                {
                    var sql_list = new List<string>();
                    param.layerIds.ForEach(layerId =>
                    {
                        Layer layer = getLayerWithTableAndColumn(layerId);
                        var table_where_sql = new List<string> { "1=1" };
                        if (string.IsNullOrWhiteSpace(param.textSearch) == false && layer.table.columns.Any(x => x.column_name == "search_content"))
                        {
                            table_where_sql.Add($"search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')");
                        }
                        var table_innerjoin_sql = string.Empty;

                        var sqlJoin = new List<string>();
                        if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                        {
                            table_where_sql.Add($"{layer.table.table_name}.district_code = '{param.districtCode}'");
                            sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {layer.table.table_name}.district_code");
                        }
                        if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                        {
                            table_where_sql.Add($"{layer.table.table_name}.commune_code = '{param.communeCode}'");
                            sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {layer.table.table_name}.commune_code");
                        }
                        var join = sqlJoin.Count > 0 ? string.Join(" ", sqlJoin) : "";

                        string layer_group_name = "Không xác định";
                        if (layer.layer_group != null)
                        {
                            layer_group_name = layer.layer_group.name_vn;
                        }
                        string table_select_sql = string.Empty;
                        if (layer.table.columns.Where(x => x.column_name == "matuyen").Count() > 0)
                        {
                            table_select_sql = $@"SELECT COUNT(1) AS {nameof(ReportDataViewModel.count)},
                                                {layer.table.table_schema}.{layer.table.table_name}.matuyen AS {nameof(ReportDataViewModel.description)},
                                                '{layer.name_vn}' AS {nameof(ReportDataViewModel.detail)}
                                                FROM {layer.table.table_schema}.{layer.table.table_name} 
                                                {join}
                                                WHERE {string.Join(" AND ", table_where_sql)}
                                                GROUP BY {nameof(ReportDataViewModel.description)}";

                        }
                        else
                        {
                            table_select_sql = $@"SELECT COUNT(1) AS {nameof(ReportDataViewModel.count)},
                                                'Không xác định' AS {nameof(ReportDataViewModel.description)},
                                                '{layer.name_vn}' AS {nameof(ReportDataViewModel.detail)}
                                                FROM {layer.table.table_schema}.{layer.table.table_name} 
                                                {join}
                                                WHERE {string.Join(" AND ", table_where_sql)}
                                                GROUP BY {nameof(ReportDataViewModel.description)}";
                        }
                        sql_list.Add(table_select_sql);
                    });
                    var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", sql_list)}) AS report ORDER BY description";
                    if (param.take > 0)
                    {
                        sql += $@" LIMIT {param.take} OFFSET {param.skip}";
                    }
                    var count = session.Query<int>($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", sql_list)}) AS report").FirstOrDefault();
                    //result = session.Query<ReportDataViewModel>(sql).ToList();
                    result = session.Query<ReportDataViewModel>($"{sql}").ToList().GroupBy(x => x.description).ToList();
                    foreach (var record in result)
                    {
                        string condition = "(1 = 1)";
                        if (string.IsNullOrWhiteSpace(record.Key))
                        {
                            condition += @$" AND (cx.district_code = '' OR cx.district_code IS NULL)";

                        }
                        else
                        {
                            condition += $@" AND {Sql.Entity<District>(x => x.name_vn):TC} = '{record.Key}'";
                        }
                        var group = new ReportGroupViewModel
                        {
                            //count = session.Query<int>(@$"SELECT COUNT(1)
                            //                    FROM {layer.table.table_schema}.{layer.table.table_name} cx 
                            //                    LEFT JOIN {Sql.Entity<District>():T}
                            //                    ON cx.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            //                    WHERE {condition}").FirstOrDefault(),
                            count = 0,
                            key = record.Key != null ? record.Key : "Không xác định",
                            items = new List<ReportGroupViewModel>()
                        };
                        if (record.Count() > 0)
                        {
                            foreach (var item in record)
                            {
                                var child = new ReportGroupViewModel
                                {
                                    count = item.count.Value,
                                    key = item.detail != null ? item.detail : "Không xác định"
                                };
                                group.items.Add(child);
                            }
                        }
                        data.Add(group);
                    }
                }

                return new RestData
                {
                    data = new
                    {
                        data,
                        totalCount
                    }
                };
            }
        }

        private RestBase getReportThongKeLoaiCongTrinhTheoTuyen(CustomReportListDxDTO param)
        {
            return new RestData
            {
                data = getDataThongKeLoaiCongTrinhTheoTuyen(param)
            };
        }
        private RestBase getReportThongKeLoaiCongTrinhTheoTuyenChieuSang(CustomReportListDxDTO param)
        {
            return new RestData
            {
                data = getDataThongKeLoaiCongTrinhTheoTuyenChieuSang(param)
            };
        }

        private RestBase getReportTongHopThoatNuoc(CustomReportListDxDTO param)
        {
            return new RestData
            {
                data = getDataTongHopThoatNuoc(param)
            };
        }
        private RestBase getReportThongKeLoaiCongTrinhChieuSangTheoTram(CustomReportListDxDTO param)
        {
            return new RestData
            {
                data = getDataThongKeLoaiCongTrinhChieuSangTheoTramDen(param)
            };
        }

        private RestBase getReportThongKeLoaiCongTrinhTheoHo(CustomReportListDxDTO param)
        {
            return new RestData
            {
                data = getDataThongKeLoaiCongTrinhTheoHo(param)
            };
        }

        private RestBase getReportThongKePhanLoaiCongThoatNuoc(CustomReportListDxDTO param)
        {
            return new RestData
            {
                data = getDataPhanLoaiCongThoatNuoc(param)
            };
        }
        private IActionResult exportReportDataHoSoTheoLoaiNhaLoaiCongTrinh(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                List<HoSoReportDoubleGroupViewModel> data = new List<HoSoReportDoubleGroupViewModel>();
                var records = session.Find<HoSo>(stm => stm
                            .Include<LoaiHoSo>(x => x.InnerJoin())
                            .Include<NhomHoSo>(x => x.InnerJoin())
                            .Include<LoaiNha>(x => x.InnerJoin())
                            .Include<LoaiTaiSan>(x => x.InnerJoin())
                            .Include<TinhTrangHoSo>(x => x.InnerJoin())
                            .OrderBy($"{Sql.Entity<HoSo>(x => x.loainha_id):TC}, {Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                    ).ToList().GroupBy(x => x.loainha_id);
                foreach (var record in records)
                {
                    LoaiNha? loaiNha = session.Get(new LoaiNha { id = record.Key.Value });
                    var hoSoGroupByCongTrinhs = record.ToList().GroupBy(x => x.loaicongtrinh_id).ToList();
                    var items = new List<HoSoReportGroupViewModel>();
                    foreach (var hoSoGroupByCongTrinh in hoSoGroupByCongTrinhs)
                    {
                        LoaiTaiSan? loaiTaiSan = session.Get(new LoaiTaiSan { id = hoSoGroupByCongTrinh.Key.Value });
                        items.Add(new HoSoReportGroupViewModel
                        {
                            hoSos = hoSoGroupByCongTrinh.ToList(),
                            count = session.Count<HoSo>(stm => stm
                                .Where($"{nameof(HoSo.loaicongtrinh_id)} = {hoSoGroupByCongTrinh.Key} AND {nameof(HoSo.loainha_id)} = {record.Key.Value}")),
                            key = loaiTaiSan != null ? loaiTaiSan.mo_ta : "Không xác định"
                        });
                    }
                    data.Add(new HoSoReportDoubleGroupViewModel
                    {
                        items = items,
                        count = session.Count<HoSo>(stm => stm.Where($"{nameof(HoSo.loainha_id)} = {record.Key}")),
                        key = loaiNha != null ? loaiNha.mo_ta : "Không   xác định"
                    });
                }
                int totalCount = session.Count<HoSo>();
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;
                    sheet = package.Workbook.Worksheets.Add("BÁO CÁO THỐNG KÊ SỐ LƯỢNG THEO LOẠI NHÀ, CÔNG TRÌNH");

                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "BÁO CÁO THỐNG KÊ SỐ LƯỢNG THEO LOẠI NHÀ, CÔNG TRÌNH";

                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 6];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    cell = sheet.Cells[2, 1];
                    cell.Style.Font.Size = 12;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = $"(Tổng số hồ sơ: {totalCount})";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    cellMerge = sheet.Cells[2, 1] + ":" + sheet.Cells[2, 6];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    int row = 3;
                    cell = sheet.Cells[row, 1];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "STT";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 2];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Mã hồ sơ";
                    sheet.Columns[2].Width = 30;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 3];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Tiêu đề";
                    sheet.Columns[3].Width = 30;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 4];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Loại hồ sơ";
                    sheet.Columns[4].Width = 30;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 5];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Ngày tạo";
                    sheet.Columns[5].Width = 30;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 6];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Ghi chú";
                    sheet.Columns[6].Width = 30;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);


                    if (data.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;

                        foreach (HoSoReportDoubleGroupViewModel hoSoGroupByLoaiNha in data)
                        {

                            cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 6];
                            range = sheet.Cells[cellMerge];
                            range.Style.Font.Name = "Times New Roman";
                            range.Style.Font.Size = 11;
                            range.Merge = true;
                            range.Value = @$"{hoSoGroupByLoaiNha.key}: {hoSoGroupByLoaiNha.count}";
                            OfficeHelper.setStyle(ref range,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            rowIndex++;

                            if (hoSoGroupByLoaiNha.items.Count() > 0)
                            {
                                foreach (var hoSoGroupByCongTrinh in hoSoGroupByLoaiNha.items)
                                {
                                    cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 6];
                                    range = sheet.Cells[cellMerge];
                                    range.Style.Font.Name = "Times New Roman";
                                    range.Style.Font.Size = 11;
                                    range.Merge = true;
                                    range.Value = @$"{hoSoGroupByCongTrinh.key}: {hoSoGroupByCongTrinh.count}";
                                    OfficeHelper.setStyle(ref range,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    rowIndex++;
                                    if (hoSoGroupByCongTrinh.hoSos.Count() > 0)
                                    {
                                        foreach (HoSo hoSo in hoSoGroupByCongTrinh.hoSos)
                                        {
                                            cell = sheet.Cells[rowIndex, 1];
                                            cell.Value = STT++;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, 2];
                                            cell.Value = hoSo.code;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, 3];
                                            cell.Value = hoSo.title;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, 4];
                                            cell.Value = hoSo.loai_hoso.mo_ta;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, 5];
                                            cell.Value = hoSo.created_at?.ToString("dd/MM/yyyy");
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, 6];
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Value = hoSo.ghi_chu;
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            rowIndex++;
                                        }
                                    }
                                }
                            }


                        }
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BaoCaoThongKeSoLuongTheoNhaCongTrinh.xlsx");
                }
            }
        }

        private IActionResult exportReportDataBaoTri([FromForm] CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                string fileName = "BaoCaoBaoTriBaoDuong.xlsx";

                var filePath = Path.Combine(_webHostEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var sql = @$"SELECT w.worder_id, w.wdesc, org.mo_ta AS org_name, worg.mo_ta AS worg_name, objtype.mo_ta AS obj_type_name, 
                                 wtype.mo_ta AS wtype_name,  wkin.mo_ta AS wkind_name, wstatus.mo_ta AS wstatus_all, 
                                 wtype_result.mo_ta AS wtype_result_name, loai_taisan.mo_ta AS loaicongtrinh_name,
                                 district.dis_name AS dis_name, commune.com_name AS com_name 
                                 FROM {Sql.Entity<Worder>():T} w
                                 LEFT JOIN category.dm_donvi_quanly org ON w.org_id = org.id 
                                 LEFT JOIN category.dm_donvi_quanly worg ON w.worg_id = worg.id 
                                 LEFT JOIN category.dm_loai_congviec objtype ON w.obj_type_id = objtype.id 
                                 LEFT JOIN category.dm_kieu_congviec wtype ON w.wtype_id = wtype.id 
                                 LEFT JOIN category.dm_hinhthuc_kiemtra wkin ON w.wkind_id = wkin.id 
                                 LEFT JOIN category.dm_trangthai_congviec wstatus ON w.wstatus_id_all = wstatus.id 
                                 LEFT JOIN category.dm_ketqua_thuchien wtype_result ON w.wtype_result_id = wtype_result.id
                                 LEFT JOIN category.dm_loai_taisan loai_taisan ON w.loaicongtrinh_id = loai_taisan.id 
                                 LEFT JOIN regional.districts district ON w.district_code = district.disid_2004 
                                 LEFT JOIN regional.communes commune ON w.commune_code = commune.comid_2004 
                                 ORDER BY {nameof(Worder.actual_finish_date)} DESC";
                    var worders = session.Query<WorderInfoViewModel>(sql).ToList();
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;
                    cell = worksheet.Cells[1, 1];
                    cell.Value = "BÁO CÁO THỐNG KÊ SỐ LƯỢNG BẢO TRÌ BẢO DƯỠNG";

                    cell = worksheet.Cells[2, 1];
                    cell.Value = $"(Tổng số hồ sơ: {worders.Count()})";

                    if (worders.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;
                        foreach (WorderInfoViewModel worder in worders)
                        {
                            cell = worksheet.Cells[rowIndex, 1];
                            cell.Value = STT++;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 2];
                            cell.Value = worder.wdesc;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 3];
                            cell.Value = worder.org_name;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 4];
                            cell.Value = worder.wtype_name;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 5];
                            cell.Value = worder.wtype_result_name;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 6];
                            cell.Value = worder.wstatus_all;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 7];
                            cell.Value = worder.loaicongtrinh_name;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 8];
                            cell.Value = worder.dis_name;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 9];
                            cell.Value = worder.com_name;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);
                            rowIndex++;
                        }
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
        }

        private IActionResult exportReportDataSuCo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                TableInfo? table = session.Find<TableInfo>(stm => stm
                        .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) LIKE '%vitrisuco%'")
                        .Include<TableSchema>()
                        .Include<TableColumn>()
                    ).FirstOrDefault();
                if (table != null)
                {
                    TableColumn? keyColumn = table.key_column ?? table.identity_column;
                    List<TableColumn> selectedColumns = table.columns.Where(x => "geom".Equals(x.column_name) == false && x.column_name != "desc" && x.visible).ToList();
                    ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                    using (ExcelPackage p = new ExcelPackage())
                    {
                        string sql = @$"SELECT {string.Join(',', selectedColumns.Select(x => x.column_name))} FROM {table.table_schema}.{table.table_name} ORDER BY {keyColumn.column_name}";
                        var result = session.Query(sql).ToList();

                        ExcelWorksheet sheet;
                        ExcelRange cell;
                        string cellMerge;
                        ExcelRange rng;
                        sheet = p.Workbook.Worksheets.Add("BÁO CÁO THỐNG KÊ SỐ LƯỢNG SỰ CỐ");

                        cell = sheet.Cells[1, 1];
                        cell.Style.Font.Size = 14;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Value = "BÁO CÁO THỐNG KÊ SỐ LƯỢNG SỰ CỐ";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, selectedColumns.Count() + 1];
                        rng = sheet.Cells[cellMerge];
                        rng.Merge = true;

                        cell = sheet.Cells[2, 1];
                        cell.Style.Font.Size = 12;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Value = $"(Tổng số sự cố: {result.Count()})";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cellMerge = sheet.Cells[2, 1] + ":" + sheet.Cells[2, selectedColumns.Count() + 1];
                        rng = sheet.Cells[cellMerge];
                        rng.Merge = true;

                        var row = 3;

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
                        rng = sheet.Cells[cellMerge];
                        rng.Merge = true;

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
                                    rng = sheet.Cells[cellMerge];
                                    rng.Merge = true;

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
                                    rng = sheet.Cells[cellMerge];
                                    rng.Merge = true;

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
                                cellMerge = sheet.Cells[row, col] + ":" +
                                                   sheet.Cells[row, col + data.Count() - 1];
                                rng = sheet.Cells[cellMerge];
                                rng.Merge = true;
                                col += data.Count() - 1;
                            }
                            col++;
                        }
                        var provinces = session.Find<Province>(stm => stm.OrderBy($"{nameof(Province.area_id)}"));
                        var districts = session.Find<District>(stm => stm.OrderBy($"{nameof(District.area_id)}"));
                        var communes = session.Find<Commune>(stm => stm.OrderBy($"{nameof(Commune.area_id)}"));
                        var dem = 0;
                        row = 5;

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
                        return File(p.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            $"BaoCaoThongKeSoLuongSuCo.xlsx");
                    }
                }
                return NotFound();
            }
        }

        private IActionResult exportReportDataGroupHoSo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                List<HoSoReportGroupViewModel> data = new List<HoSoReportGroupViewModel>();
                if (param.groupBy == "LOAINHA")
                {
                    var records = session.Find<HoSo>(stm => stm
                            .Include<LoaiHoSo>(x => x.InnerJoin())
                            .Include<NhomHoSo>(x => x.InnerJoin())
                            .Include<LoaiNha>(x => x.InnerJoin())
                            .Include<LoaiTaiSan>(x => x.InnerJoin())
                            .Include<TinhTrangHoSo>(x => x.InnerJoin())
                            .OrderBy($"{Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                    ).GroupBy(x => x.loainha_id).ToList();
                    foreach (var record in records)
                    {
                        LoaiNha? loaiNha = session.Get(new LoaiNha { id = record.Key.Value });
                        data.Add(new HoSoReportGroupViewModel
                        {
                            hoSos = record.ToList(),
                            count = session.Count<HoSo>(stm => stm.Where($"{nameof(HoSo.loainha_id)} = {record.Key.Value}")),
                            key = loaiNha != null ? loaiNha.mo_ta : "Không xác định"
                        });
                    }
                }
                else if (param.groupBy == "TINHTRANG")
                {
                    var records = session.Find<HoSo>(stm => stm
                            .Include<LoaiHoSo>(x => x.InnerJoin())
                            .Include<NhomHoSo>(x => x.InnerJoin())
                            .Include<LoaiNha>(x => x.InnerJoin())
                            .Include<LoaiTaiSan>(x => x.InnerJoin())
                            .Include<TinhTrangHoSo>(x => x.InnerJoin())
                            .OrderBy($"{Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                    ).GroupBy(x => x.trangthai_id).ToList();
                    foreach (var record in records)
                    {
                        TinhTrangHoSo? tinhTrangHoSo = session.Get(new TinhTrangHoSo { id = record.Key.Value });
                        data.Add(new HoSoReportGroupViewModel
                        {
                            hoSos = record.ToList(),
                            count = session.Count<HoSo>(stm => stm.Where($"{nameof(HoSo.trangthai_id)} = {record.Key.Value}")),
                            key = tinhTrangHoSo != null ? tinhTrangHoSo.mo_ta : "Không xác định"
                        });
                    }
                }
                int totalCount = session.Count<HoSo>();
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;
                    sheet = package.Workbook.Worksheets.Add("BÁO CÁO THỐNG KÊ HỒ SƠ");

                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    if (param.groupBy == "LOAINHA")
                    {
                        cell.Value = "BÁO CÁO THỐNG KÊ SỐ LƯỢNG HỒ SƠ THEO LOẠI NHÀ";
                    }
                    else
                    {
                        cell.Value = "BÁO CÁO THỐNG KÊ SỐ LƯỢNG HỒ SƠ THEO TÌNH TRẠNG";

                    }
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 6];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    cell = sheet.Cells[2, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = $"(Tổng số hồ sơ: {totalCount})";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge = sheet.Cells[2, 1] + ":" + sheet.Cells[2, 6];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    int row = 3;
                    cell = sheet.Cells[row, 1];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "STT";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 2];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Mã hồ sơ";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 3];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Tiêu đề";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 4];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Loại hồ sơ";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 5];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Ngày tạo";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 6];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Ghi chú";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);


                    if (data.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;

                        foreach (HoSoReportGroupViewModel hoSoGroup in data)
                        {

                            cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 6];
                            range = sheet.Cells[cellMerge];
                            range.Merge = true;
                            range.Value = @$"{hoSoGroup.key}: {hoSoGroup.count}";
                            OfficeHelper.setStyle(ref range,
                                EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            rowIndex++;

                            if (hoSoGroup.hoSos.Count() > 0)
                            {
                                foreach (HoSo hoSo in hoSoGroup.hoSos)
                                {
                                    cell = sheet.Cells[rowIndex, 1];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    sheet.Columns[1].Width = 10;
                                    cell.Value = STT++;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 2];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[2].Width = 20;
                                    cell.Value = hoSo.code;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 3];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[3].Width = 30;
                                    cell.Value = hoSo.title;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 4];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[4].Width = 30;
                                    cell.Value = hoSo.loai_hoso.mo_ta;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 5];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[5].Width = 20;
                                    cell.Value = hoSo.created_at?.ToString("dd/MM/yyyy");
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 6];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[6].Width = 30;
                                    cell.Value = hoSo.ghi_chu;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    rowIndex++;
                                }
                            }

                        }
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BaoCaoThongKeSoLuongHoSo.xlsx");
                }
            }
        }

        private IActionResult exportReportDataHoSo(CustomReportListDxDTO param, bool? isApprove)
        {
            using (var session = OpenSession())
            {
                var condition = "1=1";
                if (isApprove.HasValue && isApprove.Value == true)
                {
                    condition += $" AND {Sql.Entity<HoSo>(x => x.trangthai_id):TC} = 2";

                    if (param.dateStart != null && param.dateStart != DateTime.MinValue)
                    {
                        condition += $" AND DATE({Sql.Entity<HoSo>(x => x.updated_at):TC}) >= @dateStart";
                    }
                    if (param.dateEnd != null && param.dateEnd != DateTime.MinValue)
                    {
                        condition += $" AND DATE({Sql.Entity<HoSo>(x => x.updated_at):TC}) <= @dateEnd";
                    }
                }

                var data = session.Find<HoSo>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(param)
                        .Include<LoaiHoSo>(x => x.InnerJoin())
                        .Include<NhomHoSo>(x => x.InnerJoin())
                        .Include<LoaiNha>(x => x.InnerJoin())
                        .Include<LoaiTaiSan>(x => x.InnerJoin())
                        .Include<TinhTrangHoSo>(x => x.InnerJoin())
                        .OrderBy($"{Sql.Entity<HoSo>(x => x.created_at):TC} DESC")
                    ).ToList();


                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                string fileName = "BaoCaoHoSo.xlsx";

                var filePath = Path.Combine(_webHostEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;

                    cell = worksheet.Cells[1, 1];
                    if (isApprove.HasValue && isApprove.Value == false)
                    {
                        cell.Value = "BÁO CÁO THÔNG TIN CHUNG TÌNH TRẠNG HỒ SƠ";
                    }
                    else
                    {
                        cell.Value = "BÁO CÁO DUYỆT DANH SÁCH HỒ SƠ MỚI NHẤT THEO THỜI GIAN";
                    }


                    cell = worksheet.Cells[2, 1];
                    cell.Value = $"(Tổng số hồ sơ: {data.Count()})";
                    if (data.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;
                        foreach (HoSo hoSo in data)
                        {
                            cell = worksheet.Cells[rowIndex, 1];
                            cell.Value = STT++;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 2];
                            cell.Value = hoSo.code;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 3];
                            cell.Value = hoSo.title;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 4];
                            cell.Value = hoSo.loai_hoso.mo_ta;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 5];
                            cell.Value = hoSo.created_at?.ToString("dd/MM/yyyy");
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 6];
                            cell.Value = hoSo.trangthai_hoso.mo_ta;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 7];
                            cell.Value = hoSo.loai_nha.mo_ta;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 8];
                            cell.Value = hoSo.loai_taisan.mo_ta;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, 9];
                            cell.Value = hoSo.ghi_chu;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            rowIndex++;
                        }
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
        }

        private IActionResult exportReportDataChieuDaiTuyenCap(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, ReportDataViewModel>> result = new List<IGrouping<string?, ReportDataViewModel>>();
                TableInfo? tableInfo = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) LIKE '%tuyencap%'")
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();
                if (tableInfo != null)
                {
                    string where = "1=1";
                    if (string.IsNullOrWhiteSpace(param.communeCode) == false)
                    {
                        where += $" AND tc.commune_code = '{param.communeCode}'";
                    }
                    if (string.IsNullOrWhiteSpace(param.districtCode) == false)
                    {
                        where += $" AND tc.district_code = '{param.districtCode}'";
                    }
                    if (string.IsNullOrWhiteSpace(param.textSearch) == false)
                    {
                        where += $" AND tc.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')";
                    }
                    List<string> selectedColumns = tableInfo.columns
                            .Where(x => x.visible && !x.column_name.Contains("geom") && !x.column_name.Contains("shape")
                    ).Select(x => x.column_name).ToList();
                    TableColumn? keyColumn = tableInfo.key_column ?? tableInfo.identity_column;
                    string query = string.Empty;
                    if (param.groupBy == "HANHCHINH")
                    {
                        query = @$"SELECT SUM(tc.chieudai) AS {nameof(ReportDataViewModel.sum)},
                            {Sql.Entity<District>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.description)},
                            {Sql.Entity<Commune>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.detail)}
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} tc 
                            LEFT JOIN {Sql.Entity<District>():T}
                                ON tc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            LEFT JOIN {Sql.Entity<Commune>():T} 
                                ON tc.commune_code = {Sql.Entity<Commune>(x => x.area_id):TC}
                            WHERE tc.chieudai NOTNULL AND {where}
                            GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC} 
                            ORDER BY {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC} DESC";
                    }
                    else if (param.groupBy == "MATUYEN")
                    {
                        query = @$"SELECT SUM(tc.chieudai) AS {nameof(ReportDataViewModel.sum)}, 
                            {Sql.Entity<District>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.description)},
                            tc.matuyen AS {nameof(ReportDataViewModel.detail)} 
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} tc
                            LEFT JOIN {Sql.Entity<District>():T}
                                ON tc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            WHERE tc.chieudai NOTNULL AND {where}
                            GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}, tc.matuyen
                            ORDER BY {Sql.Entity<District>(x => x.name_vn):TC}, tc.matuyen DESC";
                    }
                    result = session.Query<ReportDataViewModel>($"{query}").ToList().GroupBy(x => x.description).ToList();
                    foreach (var record in result)
                    {
                        var group = new ReportGroupViewModel
                        {
                            sum = record.ToList().Sum(x => x.sum).Value,
                            key = record.Key != null ? record.Key : "Không xác định",
                            items = new List<ReportGroupViewModel>()
                        };
                        if (record.Count() > 0)
                        {
                            foreach (var item in record)
                            {
                                var child = new ReportGroupViewModel
                                {
                                    sum = item.sum.Value,
                                    key = item.detail != null ? item.detail : "Không xác định"
                                };
                                group.items.Add(child);
                            }
                        }
                        data.Add(group);
                    }

                }

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;
                    sheet = package.Workbook.Worksheets.Add("BÁO CÁO THỐNG KÊ CHIỀU DÀI TUYẾN CÁP");

                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    if (param.groupBy == "HANHCHINH")
                    {
                        cell.Value = "BÁO CÁO THỐNG KÊ CHIỀU DÀI TUYẾN CÁP THEO HÀNH CHÍNH";
                    }
                    else
                    {
                        cell.Value = "BÁO CÁO THỐNG KÊ CHIỀU DÀI TUYẾN CÁP THEO MÃ TUYẾN";

                    }
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 3];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    int row = 3;
                    cell = sheet.Cells[row, 1];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "STT";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 2];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    if (param.groupBy == "HANHCHINH")
                    {
                        cell.Value = "Phường/Xã";
                    }
                    else
                    {
                        cell.Value = "Tuyến cáp";
                    }
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 3];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Chiều dài (m)";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);


                    if (data.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;

                        foreach (ReportGroupViewModel group in data)
                        {

                            cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 3];
                            range = sheet.Cells[cellMerge];
                            range.Merge = true;
                            range.Value = @$"{group.key}: {group.sum.ToString("#,#,##0.##", CultureInfo.CurrentCulture)} m";
                            OfficeHelper.setStyle(ref range,
                                EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            rowIndex++;

                            if (group.items.Count() > 0)
                            {
                                foreach (ReportGroupViewModel item in group.items)
                                {
                                    cell = sheet.Cells[rowIndex, 1];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    sheet.Columns[1].Width = 10;
                                    cell.Value = STT++;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 2];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[2].Width = 30;
                                    cell.Value = item.key;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 3];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[3].Width = 20;
                                    cell.Value = item.sum.ToString("#,#,##0.##", CultureInfo.CurrentCulture);
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.RIGHT);

                                    rowIndex++;
                                }
                            }

                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BaoCaoThongKeChieuDaiTuyenCap.xlsx");
                }
            }
        }

        private IActionResult exportReportDataChieuDaiCongThoatNuoc(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, ReportDataViewModel>> result = new List<IGrouping<string?, ReportDataViewModel>>();
                TableInfo? tableInfo = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'tn_congthoatnuoc'")
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();
                if (tableInfo != null)
                {
                    string where = "1=1";
                    if (string.IsNullOrWhiteSpace(param.communeCode) == false)
                    {
                        where += $" AND tc.commune_code = '{param.communeCode}'";
                    }
                    if (string.IsNullOrWhiteSpace(param.districtCode) == false)
                    {
                        where += $" AND tc.district_code = '{param.districtCode}'";
                    }
                    if (string.IsNullOrWhiteSpace(param.textSearch) == false)
                    {
                        where += $" AND tc.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')";
                    }
                    List<string> selectedColumns = tableInfo.columns
                            .Where(x => x.visible && !x.column_name.Contains("geom") && !x.column_name.Contains("shape")
                    ).Select(x => x.column_name).ToList();
                    TableColumn? keyColumn = tableInfo.key_column ?? tableInfo.identity_column;
                    string query = string.Empty;
                    if (param.groupBy == "HANHCHINH")
                    {
                        query = @$"SELECT SUM(tc.chieudai) / 1000 AS {nameof(ReportDataViewModel.sum)},
                            {Sql.Entity<District>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.description)},
                            {Sql.Entity<Commune>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.detail)}
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} tc 
                            LEFT JOIN {Sql.Entity<District>():T}
                                ON tc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            LEFT JOIN {Sql.Entity<Commune>():T} 
                                ON tc.commune_code = {Sql.Entity<Commune>(x => x.area_id):TC}
                            WHERE tc.chieudai NOTNULL AND {where}
                            GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC} 
                            ORDER BY {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC} DESC";
                    }
                    else if (param.groupBy == "MATUYEN")
                    {
                        query = @$"SELECT SUM(tc.chieudai) / 1000 AS {nameof(ReportDataViewModel.sum)}, 
                            {Sql.Entity<District>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.description)},
                            tc.matuyen AS {nameof(ReportDataViewModel.detail)} 
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} tc
                            LEFT JOIN {Sql.Entity<District>():T}
                                ON tc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            WHERE tc.chieudai NOTNULL AND {where}
                            GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}, tc.matuyen
                            ORDER BY {Sql.Entity<District>(x => x.name_vn):TC}, tc.matuyen DESC";
                    }
                    result = session.Query<ReportDataViewModel>($"{query}").ToList().GroupBy(x => x.description).ToList();
                    foreach (var record in result)
                    {
                        var group = new ReportGroupViewModel
                        {
                            sum = record.ToList().Sum(x => x.sum).Value,
                            key = record.Key != null ? record.Key : "Không xác định",
                            items = new List<ReportGroupViewModel>()
                        };
                        if (record.Count() > 0)
                        {
                            foreach (var item in record)
                            {
                                var child = new ReportGroupViewModel
                                {
                                    sum = item.sum.Value,
                                    key = item.detail != null ? item.detail : "Không xác định"
                                };
                                group.items.Add(child);
                            }
                        }
                        data.Add(group);
                    }

                }

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;
                    sheet = package.Workbook.Worksheets.Add("BÁO CÁO THỐNG KÊ CHIỀU DÀI CỐNG THOÁT NƯỚC");

                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    if (param.groupBy == "HANHCHINH")
                    {
                        cell.Value = "BÁO CÁO THỐNG KÊ CHIỀU DÀI CỐNG THOÁT NƯỚC THEO HÀNH CHÍNH";
                    }
                    else
                    {
                        cell.Value = "BÁO CÁO THỐNG KÊ CHIỀU DÀI CỐNG THOÁT NƯỚC THEO TUYẾN";

                    }
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 3];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    int row = 3;
                    cell = sheet.Cells[row, 1];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "STT";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 2];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    if (param.groupBy == "HANHCHINH")
                    {
                        cell.Value = "Phường/Xã";
                    }
                    else
                    {
                        cell.Value = "Tuyến";
                    }
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 3];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Chiều dài (km)";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);


                    if (data.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;

                        foreach (ReportGroupViewModel group in data)
                        {

                            cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 3];
                            range = sheet.Cells[cellMerge];
                            range.Merge = true;
                            range.Value = @$"{group.key}: {group.sum.ToString("#,#,##0.##", CultureInfo.CurrentCulture)} km";
                            OfficeHelper.setStyle(ref range,
                                EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            rowIndex++;

                            if (group.items.Count() > 0)
                            {
                                foreach (ReportGroupViewModel item in group.items)
                                {
                                    cell = sheet.Cells[rowIndex, 1];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    sheet.Columns[1].Width = 10;
                                    cell.Value = STT++;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 2];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[2].Width = 30;
                                    cell.Value = item.key;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 3];
                                    cell.Style.Font.Size = 11;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.WrapText = true;
                                    sheet.Columns[3].Width = 20;
                                    cell.Value = item.sum.ToString("#,#,##0.##", CultureInfo.CurrentCulture);
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.RIGHT);

                                    rowIndex++;
                                }
                            }

                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BaoCaoThongKeChieuDaiCongThoatNuoc.xlsx");
                }
            }
        }

        private IActionResult exportReportDataSoLuong(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;
                    sheet = package.Workbook.Worksheets.Add("BÁO CÁO THỐNG KÊ SỐ LƯỢNG");

                    List<ReportDataViewModel> result = new List<ReportDataViewModel>();
                    if (param.layerIds == null || param.layerIds.Count() == 0) return NotFound();
                    if (param.layerIds.Count() == 1)
                    {
                        var layer = getLayerWithTableAndColumn(param.layerIds.FirstOrDefault());
                        if (layer == null) return NotFound();
                        TableInfo tableInfo = layer.table;

                        if (tableInfo != null)
                        {
                            string where = "1=1";
                            List<string> sqlJoin = new List<string>();
                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                            {
                                where += $" AND cx.commune_code = '{param.communeCode}'";
                                sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = cx.commune_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                            {
                                where += $" AND cx.district_code = '{param.districtCode}'";
                                sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = cx.district_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.textSearch) == false)
                            {
                                where += $" AND cx.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')";
                            }
                            TableColumn? keyColumn = tableInfo.key_column ?? tableInfo.identity_column;
                            string query = string.Empty;
                            string groupColumn = "";
                            if (tableInfo.columns.Where(x => x.column_name == param.groupBy.ToLower()).Count() == 0)
                            {
                                return NotFound();
                            }
                            else
                            {
                                groupColumn = param.groupBy.ToLower();
                            }
                            var join = sqlJoin.Count > 0 ? string.Join(" ", sqlJoin) : "";
                            query = @$"SELECT COUNT(1) AS {nameof(ReportDataViewModel.count)}, 
                                cx.{groupColumn} AS {nameof(ReportDataViewModel.description)} 
                                FROM {tableInfo.table_schema}.{tableInfo.table_name} cx
                                {join}
                                WHERE {where}
                                GROUP BY cx.{groupColumn}
                                ORDER BY cx.{groupColumn} DESC";
                            result = session.Query<ReportDataViewModel>($"{query}").ToList();

                            cell = sheet.Cells[1, 1];
                            cell.Style.Font.Size = 14;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = "BÁO CÁO THỐNG KÊ SỐ LƯỢNG " + layer.name_vn.ToUpper() + " THEO " + param.groupName.ToUpper();
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 3];
                            range = sheet.Cells[cellMerge];
                            range.Merge = true;

                            int row = 3;
                            cell = sheet.Cells[row, 1];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Style.WrapText = true;
                            cell.Value = "STT";
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            cell = sheet.Cells[row, 2];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Style.WrapText = true;
                            cell.Value = param.groupName;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            cell = sheet.Cells[row, 3];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Style.WrapText = true;
                            cell.Value = $"Số lượng ({layer.name_vn.ToLower()})";
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        }
                    }
                    else
                    {
                        var sql_list = new List<string>();
                        param.layerIds.ForEach(layerId =>
                        {
                            Layer layer = getLayerWithTableAndColumn(layerId);
                            var table_where_sql = new List<string> { "1=1" };
                            if (string.IsNullOrWhiteSpace(param.textSearch) == false && layer.table.columns.Any(x => x.column_name == "search_content"))
                            {
                                table_where_sql.Add($"search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')");
                            }
                            var sqlJoin = new List<string>();
                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                            {
                                table_where_sql.Add($"{layer.table.table_name}.district_code = '{param.districtCode}'");
                                sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {layer.table.table_name}.district_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                            {
                                table_where_sql.Add($"{layer.table.table_name}.commune_code = '{param.communeCode}'");
                                sqlJoin.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {layer.table.table_name}.commune_code");
                            }
                            var join = sqlJoin.Count > 0 ? string.Join(" ", sqlJoin) : "";

                            string layer_group_name = "Không xác định";
                            if (layer.layer_group != null)
                            {
                                layer_group_name = layer.layer_group.name_vn;
                            }
                            var table_select_sql = $@"SELECT COUNT(1) AS {nameof(ReportDataViewModel.count)},
                                                '{layer.name_vn}' AS {nameof(ReportDataViewModel.description)}
                                                FROM {layer.table.table_schema}.{layer.table.table_name} 
                                                {join}
                                                WHERE {string.Join(" AND ", table_where_sql)}";
                            sql_list.Add(table_select_sql);
                        });
                        var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", sql_list)}) AS report ORDER BY description";
                        result = session.Query<ReportDataViewModel>(sql).ToList();

                        cell = sheet.Cells[1, 1];
                        cell.Style.Font.Size = 14;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Value = "BÁO CÁO THỐNG KÊ TỔNG SỐ LƯỢNG CÔNG TRÌNH ";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 3];
                        range = sheet.Cells[cellMerge];
                        range.Merge = true;

                        int row = 3;
                        cell = sheet.Cells[row, 1];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "STT";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 2];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Công trình";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 3];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = $"Số lượng";
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);


                    }

                    if (result.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;

                        foreach (var item in result)
                        {
                            cell = sheet.Cells[rowIndex, 1];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            sheet.Columns[1].Width = 10;
                            cell.Value = STT++;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[rowIndex, 2];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Style.WrapText = true;
                            sheet.Columns[2].Width = 30;
                            cell.Value = item.description;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[rowIndex, 3];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Style.WrapText = true;
                            sheet.Columns[3].Width = 20;
                            cell.Value = item.count.HasValue ? item.count.Value.ToString("N0", CultureInfo.CurrentCulture) : 0;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.RIGHT);

                            rowIndex++;
                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BaoCaoThongKeSoLuong.xlsx");
                }
            }
        }

        private IActionResult exportReportDataThongKeLoaiCongTrinh(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                string title = string.Empty;
                string file_name = string.Empty;
                var data = new List<ReportGroupViewModel>();
                switch (param.reportType)
                {
                    case EnumCustomReportType.ThongKeThoatNuocTheoTuyen:
                        title = "BÁO CÁO THỐNG KÊ THOÁT NƯỚC THEO TUYẾN";
                        data = getDataThongKeLoaiCongTrinhTheoTuyen(param).data;
                        file_name = "BaoCaoThongKeThoatNuocTheoTuyen";
                        break;
                    case EnumCustomReportType.ThongKeThoatNuocTheoHo:
                        title = "BÁO CÁO THỐNG KÊ THOÁT NƯỚC THEO HỒ";
                        data = getDataThongKeLoaiCongTrinhTheoHo(param).data;
                        file_name = "BaoCaoThongKeThoatNuocTheoHo";
                        break;
                    case EnumCustomReportType.ThongKePhanLoaiCongThoatNuoc:
                        title = "BÁO CÁO THỐNG KÊ PHÂN LOẠI CỐNG THOÁT NƯỚC";
                        data = getDataPhanLoaiCongThoatNuoc(param).data;
                        file_name = "BaoCaoThongKePhanLoaiCong";
                        break;
                    case EnumCustomReportType.ThongKeCayXanhTheoTuyen:
                        title = "BÁO CÁO THỐNG KÊ CÂY XANH THEO TUYẾN";
                        data = getDataThongKeLoaiCongTrinhTheoTuyen(param).data;
                        file_name = "BaoCaoThongKeCayXanhTheoTuyen";
                        break;
                    case EnumCustomReportType.ThongKeChieuSangTheoTuyen:
                        title = "BÁO CÁO THỐNG KÊ CHIẾU SÁNG THEO TUYẾN";
                        data = getDataThongKeLoaiCongTrinhTheoTuyen(param).data;
                        file_name = "BaoCaoThongKeChieuSangTheoTuyen";
                        break;
                    case EnumCustomReportType.ThongKeChieuSangTheoTramDen:
                        title = "BÁO CÁO THỐNG KÊ CHIẾU SÁNG THEO TRẠM ĐÈN";
                        data = getDataThongKeLoaiCongTrinhChieuSangTheoTramDen(param).data;
                        file_name = "BaoCaoThongKeChieuSangTheoTramDen";
                        break;
                    default:
                        break;
                }
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;

                    sheet = package.Workbook.Worksheets.Add(title);

                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = title;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 6];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    int row = 3;
                    cell = sheet.Cells[row, 1];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "STT";
                    sheet.Columns[1].Width = 15;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 2];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Nội dung";
                    sheet.Columns[2].Width = 30;
                    sheet.Columns[3].Width = 30;
                    cellMerge = sheet.Cells[row, 2] + ":" + sheet.Cells[row, 3];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;
                    OfficeHelper.setStyle(ref range,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 4];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Đơn vị";
                    sheet.Columns[4].Width = 10;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 5];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Số lượng";
                    sheet.Columns[5].Width = 20;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 6];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Ghi chú";
                    sheet.Columns[6].Width = 40;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);


                    if (data.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;
                        foreach (var groupByTuyen in data)
                        {
                            cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 6];
                            range = sheet.Cells[cellMerge];
                            range.Style.Font.Name = "Times New Roman";
                            range.Style.Font.Size = 11;
                            range.Merge = true;
                            range.Value = groupByTuyen.key.ToUpper();

                            OfficeHelper.setStyle(ref range,
                                EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            rowIndex++;
                            foreach (var groupByLayer in groupByTuyen.items)
                            {
                                // Nhóm theo bảng
                                cell = sheet.Cells[rowIndex, 1];
                                cell.Value = STT++;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex + groupByLayer.items.Count(), 1];
                                range = sheet.Cells[cellMerge];
                                range.Merge = true;
                                OfficeHelper.setStyle(ref range,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                cell = sheet.Cells[rowIndex, 2];
                                cell.Value = groupByLayer.key;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                cellMerge = sheet.Cells[rowIndex, 2] + ":" + sheet.Cells[rowIndex + groupByLayer.items.Count(), 2];
                                range = sheet.Cells[cellMerge];
                                range.Merge = true;
                                OfficeHelper.setStyle(ref range,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                cell = sheet.Cells[rowIndex, 3];
                                cell.Value = "Tổng";
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                cell = sheet.Cells[rowIndex, 4];
                                cell.Value = groupByLayer.unit;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                cell = sheet.Cells[rowIndex, 5];
                                cell.Value = groupByLayer.count.ToString("#,#,##0.##", CultureInfo.CurrentCulture);
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                cell = sheet.Cells[rowIndex, 6];
                                cell.Value = "";
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                rowIndex++;

                                foreach (var groupByPhanLoai in groupByLayer.items)
                                {
                                    cell = sheet.Cells[rowIndex, 3];
                                    cell.Value = groupByPhanLoai.key;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 4];
                                    cell.Value = groupByPhanLoai.unit;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 5];
                                    cell.Value = groupByPhanLoai.count.ToString("#,#,##0.##", CultureInfo.CurrentCulture);
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE);

                                    cell = sheet.Cells[rowIndex, 6];
                                    cell.Value = "";
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE);

                                    rowIndex++;
                                }
                            }
                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{file_name}.xlsx");
                }
            }
        }

        private IActionResult exportReportDataThongKeLoaiCongTrinhChieuSang(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                string title = "BÁO CÁO THỐNG KÊ CHIẾU SÁNG THEO TUYẾN";
                string file_name = "BaoCaoThongKeChieuSangTheoTuyen";
                var data = getDataThongKeLoaiCongTrinhTheoTuyenChieuSang(param).data;
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;

                    sheet = package.Workbook.Worksheets.Add(title);

                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = title;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 6];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    int row = 3;
                    cell = sheet.Cells[row, 1];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "STT";
                    sheet.Columns[1].Width = 15;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 2];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Nội dung";
                    sheet.Columns[2].Width = 30;
                    sheet.Columns[3].Width = 30;
                    cellMerge = sheet.Cells[row, 2] + ":" + sheet.Cells[row, 3];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;
                    OfficeHelper.setStyle(ref range,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 4];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Đơn vị";
                    sheet.Columns[4].Width = 10;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 5];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Số lượng";
                    sheet.Columns[5].Width = 20;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, 6];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Style.WrapText = true;
                    cell.Value = "Ghi chú";
                    sheet.Columns[6].Width = 40;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);


                    if (data.Count > 0)
                    {
                        int rowIndex = 4;
                        int STT = 1;
                        foreach (var groupByTuyen in data)
                        {
                            cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 6];
                            range = sheet.Cells[cellMerge];
                            range.Style.Font.Name = "Times New Roman";
                            range.Style.Font.Size = 11;
                            range.Merge = true;
                            range.Value = groupByTuyen.key.ToUpper();

                            OfficeHelper.setStyle(ref range,
                                EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                            rowIndex++;
                            foreach (var groupByTram in groupByTuyen.items)
                            {
                                cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 6];
                                range = sheet.Cells[cellMerge];
                                range.Style.Font.Name = "Times New Roman";
                                range.Style.Font.Size = 11;
                                range.Merge = true;
                                range.Value = groupByTram.key.ToUpper();

                                OfficeHelper.setStyle(ref range,
                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                rowIndex++;

                                foreach (var groupByLayer in groupByTram.items)
                                {
                                    // Nhóm theo bảng
                                    cell = sheet.Cells[rowIndex, 1];
                                    cell.Value = STT++;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex + groupByLayer.items.Count(), 1];
                                    range = sheet.Cells[cellMerge];
                                    range.Merge = true;
                                    OfficeHelper.setStyle(ref range,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[rowIndex, 2];
                                    cell.Value = groupByLayer.key;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    cellMerge = sheet.Cells[rowIndex, 2] + ":" + sheet.Cells[rowIndex + groupByLayer.items.Count(), 2];
                                    range = sheet.Cells[cellMerge];
                                    range.Merge = true;
                                    OfficeHelper.setStyle(ref range,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[rowIndex, 3];
                                    cell.Value = "Tổng";
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[rowIndex, 4];
                                    cell.Value = groupByLayer.unit;
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[rowIndex, 5];
                                    cell.Value = groupByLayer.count.ToString("#,#,##0.##", CultureInfo.CurrentCulture);
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    cell = sheet.Cells[rowIndex, 6];
                                    cell.Value = "";
                                    cell.Style.Font.Name = "Times New Roman";
                                    cell.Style.Font.Size = 11;
                                    OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE | EnumFormat.BOLD);

                                    rowIndex++;

                                    foreach (var groupByPhanLoai in groupByLayer.items)
                                    {
                                        cell = sheet.Cells[rowIndex, 3];
                                        cell.Value = groupByPhanLoai.key;
                                        cell.Style.Font.Name = "Times New Roman";
                                        cell.Style.Font.Size = 11;
                                        OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                                        cell = sheet.Cells[rowIndex, 4];
                                        cell.Value = groupByPhanLoai.unit;
                                        cell.Style.Font.Name = "Times New Roman";
                                        cell.Style.Font.Size = 11;
                                        OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                        cell = sheet.Cells[rowIndex, 5];
                                        cell.Value = groupByPhanLoai.count.ToString("#,#,##0.##", CultureInfo.CurrentCulture);
                                        cell.Style.Font.Name = "Times New Roman";
                                        cell.Style.Font.Size = 11;
                                        OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE);

                                        cell = sheet.Cells[rowIndex, 6];
                                        cell.Value = "";
                                        cell.Style.Font.Name = "Times New Roman";
                                        cell.Style.Font.Size = 11;
                                        OfficeHelper.setStyle(ref cell,
                                                EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE);

                                        rowIndex++;
                                    }
                                }
                            }

                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{file_name}.xlsx");
                }
            }
        }

        private List<ReportDataViewModel> getChartDataBaoTri(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var result = new List<ReportDataViewModel>();
                if (param.groupBy == "DIABAN")
                {
                    string query = @$"SELECT COUNT(1) AS {nameof(ReportDataViewModel.count)},
                            {Sql.Entity<District>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.description)},
                            {Sql.Entity<Commune>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.detail)}
                            FROM {Sql.Entity<Worder>():T}
                            LEFT JOIN {Sql.Entity<District>():T} 
                                ON {Sql.Entity<Worder>(x => x.district_code):TC} = {Sql.Entity<District>(x => x.area_id):TC} 
                            LEFT JOIN {Sql.Entity<Commune>():T} 
                                ON {Sql.Entity<Worder>(x => x.commune_code):TC} = {Sql.Entity<Commune>(x => x.area_id):TC} 
                            GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC}";
                    result = session.Query<ReportDataViewModel>($"{query}").ToList();
                    if (result.Count() > 0)
                    {
                        result = result.Where(x => x.count > 0).GroupBy(x => x.description).Select(stm => new ReportDataViewModel
                        {
                            description = stm.Key,
                            count = stm.Select(x => x.count).Sum(),
                            detail = string.Join(", \n", stm.Select(x => $"{x.detail}: {x.count}")),
                            donvitinh = "bảo trì, bảo dưỡng",
                            group_name = param.groupName
                        }).ToList();
                    }
                }
                else if (param.groupBy == "LOAICONGTRINH")
                {
                    string query = @$"SELECT COUNT({Sql.Entity<Worder>(x => x.worder_id):TC}) AS {nameof(ReportDataViewModel.count)},
                            {Sql.Entity<LoaiTaiSan>(x => x.mo_ta):TC} AS {nameof(ReportDataViewModel.description)}
                            FROM {Sql.Entity<Worder>():T}
                            LEFT JOIN {Sql.Entity<LoaiTaiSan>():T} 
                                ON {Sql.Entity<Worder>(x => x.loaicongtrinh_id):TC} = {Sql.Entity<LoaiTaiSan>(x => x.id):TC}
                            GROUP BY {Sql.Entity<LoaiTaiSan>(x => x.mo_ta):TC}";
                    result = session.Query<ReportDataViewModel>($"{query}").ToList();
                    if (result.Count() > 0)
                    {
                        result = result.Where(x => x.count > 0).GroupBy(x => x.description).Select(stm => new ReportDataViewModel
                        {
                            description = "Loại công trình: " + stm.Key,
                            count = stm.Select(x => x.count).Sum(),
                            detail = stm.Key + ": " + stm.Select(x => x.count).Sum(),
                            donvitinh = "bảo trì, bảo dưỡng",
                            group_name = param.groupName
                        }).ToList();
                    }
                }
                return result;
            }
        }

        private List<ReportDataViewModel> getChartDataHoSo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var result = new List<ReportDataViewModel>();
                if (param.groupBy == "LOAINHA")
                {
                    string query = @$"SELECT COUNT({Sql.Entity<HoSo>(x => x.id):TC}) AS {nameof(ReportDataViewModel.count)},
                            {Sql.Entity<LoaiNha>(x => x.mo_ta):TC} AS {nameof(ReportDataViewModel.description)}
                            FROM {Sql.Entity<HoSo>():T}
                            LEFT JOIN {Sql.Entity<LoaiNha>():T} 
                                ON {Sql.Entity<HoSo>(x => x.loainha_id):TC} = {Sql.Entity<LoaiNha>(x => x.id):TC} 
                            GROUP BY {Sql.Entity<LoaiNha>(x => x.mo_ta):TC}";
                    result = session.Query<ReportDataViewModel>($"{query}").ToList();
                    if (result.Count() > 0)
                    {
                        result = result.Where(x => x.count > 0).GroupBy(x => x.description).Select(stm => new ReportDataViewModel
                        {
                            description = stm.Key,
                            count = stm.Select(x => x.count).Sum(),
                            detail = stm.Key + ": " + stm.Select(x => x.count).Sum(),
                            donvitinh = "hồ sơ",
                            group_name = param.groupName
                        }).ToList();
                    }
                }
                else if (param.groupBy == "TINHTRANG")
                {
                    string query = @$"SELECT COUNT({Sql.Entity<HoSo>(x => x.id):TC}) AS {nameof(ReportDataViewModel.count)},
                            {Sql.Entity<TinhTrangHoSo>(x => x.mo_ta):TC} AS {nameof(ReportDataViewModel.description)} 
                            FROM {Sql.Entity<HoSo>():T}
                            LEFT JOIN {Sql.Entity<TinhTrangHoSo>():T} 
                                ON {Sql.Entity<HoSo>(x => x.trangthai_id):TC} = {Sql.Entity<TinhTrangHoSo>(x => x.id):TC} 
                            GROUP BY {Sql.Entity<TinhTrangHoSo>(x => x.mo_ta):TC}";
                    result = session.Query<ReportDataViewModel>($"{query}").ToList();
                    if (result.Count() > 0)
                    {
                        result = result.Where(x => x.count > 0).GroupBy(x => x.description).Select(stm => new ReportDataViewModel
                        {
                            description = stm.Key,
                            count = stm.Select(x => x.count).Sum(),
                            detail = stm.Key + ": " + stm.Select(x => x.count).Sum(),
                            donvitinh = "hồ sơ",
                            group_name = param.groupName
                        }).ToList();
                    }
                }
                return result;
            }
        }

        private List<ReportDataViewModel> getChartDataSuCo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var result = new List<ReportDataViewModel>();
                TableInfo? tableInfo = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) LIKE '%vitrisuco%'")
                ).FirstOrDefault();
                if (tableInfo != null)
                {
                    if (param.groupBy == "DIABAN")
                    {
                        string query = @$"SELECT COUNT(1) AS {nameof(ReportDataViewModel.count)},
                            {Sql.Entity<District>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.description)},
                            {Sql.Entity<Commune>(x => x.name_vn):TC} AS {nameof(ReportDataViewModel.detail)}
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} sc 
                            LEFT JOIN {Sql.Entity<District>():T}
                                ON sc.district_code = {Sql.Entity<District>(x => x.area_id):TC}
                            LEFT JOIN {Sql.Entity<Commune>():T} 
                                ON sc.commune_code = {Sql.Entity<Commune>(x => x.area_id):TC}
                            GROUP BY {Sql.Entity<District>(x => x.name_vn):TC}, {Sql.Entity<Commune>(x => x.name_vn):TC}";
                        result = session.Query<ReportDataViewModel>($"{query}").ToList();
                        if (result.Count() > 0)
                        {
                            result = result.Where(x => x.count > 0).GroupBy(x => x.description).Select(stm => new ReportDataViewModel
                            {
                                description = stm.Key,
                                count = stm.Select(x => x.count).Sum(),
                                detail = string.Join(", \n", stm.Select(x => $"{x.detail}: {x.count}")),
                                donvitinh = "sự cố",
                                group_name = param.groupName
                            }).ToList();
                        }
                    }
                    else if (param.groupBy == "LOAICONGTRINH")
                    {
                        string query = @$"SELECT COUNT(1) AS {nameof(ReportDataViewModel.count)},
                             {Sql.Entity<LoaiTaiSan>(x => x.mo_ta):TC} AS {nameof(ReportDataViewModel.description)}
                            FROM {tableInfo.table_schema}.{tableInfo.table_name} sc 
                            LEFT JOIN {Sql.Entity<LoaiTaiSan>():T} 
                                ON sc.loaicongtrinh_id = {Sql.Entity<LoaiTaiSan>(x => x.id):TC} 
                            GROUP BY  {Sql.Entity<LoaiTaiSan>(x => x.mo_ta):TC} ";
                        result = session.Query<ReportDataViewModel>($"{query}").ToList();
                        if (result.Count() > 0)
                        {
                            result = result.Where(x => x.count > 0).GroupBy(x => x.description).Select(stm => new ReportDataViewModel
                            {
                                description = "Loại công trình: " + stm.Key,
                                count = stm.Select(x => x.count).Sum(),
                                detail = stm.Key + ": " + stm.Select(x => x.count).Sum(),
                                donvitinh = "sự cố",
                                group_name = param.groupName
                            }).ToList();
                        }
                    }
                }
                return result;
            }
        }

        private List<ReportDataViewModel> getChartDataHoSoTheoLoaiNhaCongTrinh(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var result = new List<ReportDataViewModel>();
                string query = @$"SELECT COUNT({Sql.Entity<HoSo>(x => x.id):TC}) AS {nameof(ReportDataViewModel.count)},
                            {Sql.Entity<LoaiNha>(x => x.mo_ta):TC} AS {nameof(ReportDataViewModel.description)},
                            {Sql.Entity<LoaiTaiSan>(x => x.mo_ta):TC} AS {nameof(ReportDataViewModel.detail)}
                            FROM {Sql.Entity<HoSo>():T}
                            LEFT JOIN {Sql.Entity<LoaiNha>():T} 
                                ON {Sql.Entity<HoSo>(x => x.loainha_id):TC} = {Sql.Entity<LoaiNha>(x => x.id):TC} 
                            LEFT JOIN {Sql.Entity<LoaiTaiSan>():T} 
                                ON {Sql.Entity<HoSo>(x => x.loaicongtrinh_id):TC} = {Sql.Entity<LoaiTaiSan>(x => x.id):TC} 
                            GROUP BY {Sql.Entity<LoaiNha>(x => x.mo_ta):TC}, {Sql.Entity<LoaiTaiSan>(x => x.mo_ta):TC}";
                result = session.Query<ReportDataViewModel>($"{query}").ToList();
                if (result.Count() > 0)
                {
                    result = result.Where(x => x.count > 0).GroupBy(x => x.description).Select(stm => new ReportDataViewModel
                    {
                        description = stm.Key,
                        count = stm.Select(x => x.count).Sum(),
                        detail = string.Join(", \n", stm.Select(x => $"{x.detail}: {x.count}")),
                        donvitinh = "hồ sơ",
                        group_name = param.groupName
                    }).ToList();
                }
                return result;
            }
        }

        private ReportGroupDataViewModel getDataThongKeLoaiCongTrinhTheoTuyen(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                int totalCount = 0;
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, CustomReportViewModel>> resultGroupByTuyen = new List<IGrouping<string?, CustomReportViewModel>>();
                var sql_list = new List<string>();
                var count_list = new List<string>();

                var tieuChiBaoCaos = session.Find<ReportCriteria>(stm => stm
                    .Where($@"LOWER({Sql.Entity<ReportCriteria>(x => x.report_code):TC}) = '{param.reportType.ToLower()}'")
                    .Include<TableRelationGroupLevel>(x => x.LeftOuterJoin())
                ).ToList();
                List<CustomReportViewModel> tuyens = new List<CustomReportViewModel>();
                TableInfo? tableTuyen = new TableInfo();
                TableColumn? maTuyenColumn = null;
                TableColumn? tenTuyenColumn = null;
                switch (param.reportType)
                {
                    case EnumCustomReportType.ThongKeThoatNuocTheoTuyen:
                        TableInfo? tableHoDieuHoa = session.Find<TableInfo>(stm => stm
                            .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'tn_hodieuhoa'")
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                        ).FirstOrDefault();

                        tableTuyen = session.Find<TableInfo>(stm => stm
                            .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'tn_tuyen'")
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                        ).FirstOrDefault();

                        if (tableHoDieuHoa != null || tableTuyen != null)
                        {
                            var sql_where = new List<string> { "1=1" };
                            var sql_join = new List<string> { @$" LEFT OUTER JOIN {tableTuyen.table_schema}.{tableTuyen.table_name} tuyen ON ho.maho = tuyen.nguontiepnhan " };
                            sql_where.Add("ho.maho NOTNULL");
                            if (string.IsNullOrWhiteSpace(param.textSearch) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "search_content"))
                            {
                                sql_where.Add(@$"ho.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')");
                            }
                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "district_code"))
                            {
                                sql_where.Add($"ho.district_code = '{param.districtCode}'");
                                sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = ho.district_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "commune_code"))
                            {
                                sql_where.Add($"ho.commune_code = '{param.communeCode}'");
                                sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = ho.commune_code");
                            }
                            var hoDieuHoaJoin = sql_join.Count > 0 ? string.Join(" ", sql_join) : "";
                            var sqlSelect = $@"SELECT ho.maho AS {nameof(CustomReportViewModel.luuvuvid)}, ho.tenho AS {nameof(CustomReportViewModel.tenho)}
                                    , tuyen.matuyen AS {nameof(CustomReportViewModel.matuyen)}, tuyen.tentuyen AS {nameof(CustomReportViewModel.tentuyen)}
                                FROM {tableHoDieuHoa.table_schema}.{tableHoDieuHoa.table_name} ho {hoDieuHoaJoin} WHERE {string.Join(" AND ", sql_where)}";

                            tuyens = session.Query<CustomReportViewModel>(sqlSelect).ToList();
                        }
                        break;
                    case EnumCustomReportType.ThongKeCayXanhTheoTuyen:
                        tableTuyen = session.Find<TableInfo>(stm => stm
                           .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'cx_tuyen'")
                           .Include<TableSchema>()
                           .Include<TableColumn>()
                        ).FirstOrDefault();
                        maTuyenColumn = tableTuyen.columns.Where(x => x.column_name.Contains("matuyen")).FirstOrDefault();
                        tenTuyenColumn = tableTuyen.columns.Where(x => x.column_name.Contains("tentuyen")).FirstOrDefault();
                        if (tableTuyen != null && maTuyenColumn != null && tenTuyenColumn != null)
                        {
                            var sql_where = new List<string> { "1=1" };
                            var sql_join = new List<string>();
                            sql_where.Add(@$"tuyen.{maTuyenColumn.column_name} NOTNULL");
                            if (string.IsNullOrWhiteSpace(param.textSearch) == false && tableTuyen.columns.Any(x => x.column_name == "search_content"))
                            {
                                //sql_where.Add(@$"tuyen.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')");
                                sql_where.Add(@$"tuyen.{tenTuyenColumn.column_name} IN ({String.Join(",", param.textSearch.Split(",").ToList().Select(x => @$"'{x}'"))})");
                            }
                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && tableTuyen.columns.Any(x => x.column_name == "district_code"))
                            {
                                sql_where.Add($"tuyen.district_code = '{param.districtCode}'");
                                sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = tuyen.district_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && tableTuyen.columns.Any(x => x.column_name == "commune_code"))
                            {
                                sql_where.Add($"tuyen.commune_code = '{param.communeCode}'");
                                sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = tuyen.commune_code");
                            }
                            var sqlJoin = sql_join.Count > 0 ? string.Join(" ", sql_join) : "";
                            var sqlSelect = @$"SELECT tuyen.{maTuyenColumn.column_name} AS {nameof(CustomReportViewModel.matuyen)}, tuyen.{tenTuyenColumn.column_name} AS {nameof(CustomReportViewModel.tentuyen)}
                                FROM {tableTuyen.table_schema}.{tableTuyen.table_name} tuyen {sqlJoin} WHERE {string.Join(" AND ", sql_where)}";

                            tuyens = session.Query<CustomReportViewModel>(sqlSelect).ToList();
                        }
                        break;
                    case EnumCustomReportType.ThongKeChieuSangTheoTuyen:
                        tableTuyen = session.Find<TableInfo>(stm => stm
                           .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'matuyen'")
                           .Include<TableSchema>()
                           .Include<TableColumn>()
                        ).FirstOrDefault();
                        maTuyenColumn = tableTuyen.columns.Where(x => x.column_name.Contains("matuyen")).FirstOrDefault();
                        tenTuyenColumn = tableTuyen.columns.Where(x => x.column_name.Contains("tentuyen")).FirstOrDefault();
                        if (tableTuyen != null)
                        {
                            var sql_where = new List<string> { "1=1" };
                            var sql_join = new List<string>();
                            sql_where.Add(@$"tuyen.{maTuyenColumn.column_name} NOTNULL");
                            if (string.IsNullOrWhiteSpace(param.textSearch) == false && tableTuyen.columns.Any(x => x.column_name == "search_content"))
                            {
                                //sql_where.Add(@$"tuyen.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')");
                                sql_where.Add(@$"tuyen.{tenTuyenColumn.column_name} IN ({String.Join(",", param.textSearch.Split(",").ToList().Select(x => @$"'{x}'"))})");
                            }
                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && tableTuyen.columns.Any(x => x.column_name == "district_code"))
                            {
                                sql_where.Add($"tuyen.district_code = '{param.districtCode}'");
                                sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = tuyen.district_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && tableTuyen.columns.Any(x => x.column_name == "commune_code"))
                            {
                                sql_where.Add($"tuyen.commune_code = '{param.communeCode}'");
                                sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = tuyen.commune_code");
                            }
                            var sqlJoin = sql_join.Count > 0 ? string.Join(" ", sql_join) : "";
                            var sqlSelect = $@"SELECT tuyen.{maTuyenColumn.column_name} AS {nameof(CustomReportViewModel.matuyen)}, tuyen.{tenTuyenColumn.column_name} AS {nameof(CustomReportViewModel.tentuyen)}
                                FROM {tableTuyen.table_schema}.{tableTuyen.table_name} tuyen {sqlJoin} WHERE {string.Join(" AND ", sql_where)}";

                            tuyens = session.Query<CustomReportViewModel>(sqlSelect).ToList();
                        }
                        break;
                    default:
                        break;

                }

                if (tuyens != null && tuyens.Count() > 0)
                {
                    tieuChiBaoCaos.ForEach(tieuChiBaoCao =>
                    {
                        Layer? layer = session.Find<Layer>(stm => stm
                            .Where($"{Sql.Entity<Layer>(x => x.table_info_id):TC} = {tieuChiBaoCao.tableGroupLevel.table_id}")
                            .Include<TableInfo>(join => join.InnerJoin())
                            .Include<TableColumn>(join => join.InnerJoin())
                            .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).FirstOrDefault();
                        if (layer != null)
                        {
                            var table_where_sql = new List<string> { "1=1" };
                            string table_select_sql = string.Empty;
                            string table_count_sql = string.Empty;
                            var maTuyenCol = layer.table.columns.Where(x => x.column_name.Contains("matuyen")).FirstOrDefault();
                            table_select_sql = $@"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tieuChiBaoCao.tableGroupLevel.statistical_column}) AS {nameof(CustomReportViewModel.count)}";

                            if (maTuyenCol != null)
                            {
                                table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{maTuyenCol.column_name} AS {nameof(CustomReportViewModel.matuyen)}";
                                table_where_sql.Add($"{layer.table.table_schema}.{layer.table.table_name}.{maTuyenCol.column_name} IN ({String.Join(", ", tuyens.Select(x => $"'{x.matuyen}'"))})");
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.matuyen)}";
                            }
                            table_select_sql += $@", '{layer.name_vn}' AS {nameof(CustomReportViewModel.layer_name)}, '{layer.id}' AS {nameof(CustomReportViewModel.layer_id)}";
                            if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_1))
                            {
                                table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_1}::TEXT AS {nameof(CustomReportViewModel.group_level_1)}";
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_1)}";
                            }
                            table_select_sql += $@", '{tieuChiBaoCao.tableGroupLevel.unit}' AS {nameof(CustomReportViewModel.donvitinh)}";
                            table_select_sql += $@" FROM {layer.table.table_schema}.{layer.table.table_name}
                                                WHERE {string.Join(" AND ", table_where_sql)}
                                                GROUP BY {nameof(CustomReportViewModel.matuyen)}, {nameof(CustomReportViewModel.layer_name)}, {nameof(CustomReportViewModel.group_level_1)}";

                            sql_list.Add(table_select_sql);
                        }
                    });

                    var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", sql_list)}) AS report ORDER BY {nameof(CustomReportViewModel.matuyen)}, {nameof(CustomReportViewModel.layer_name)}, {nameof(CustomReportViewModel.group_level_1)}";
                    if (param.take > 0)
                    {
                        sql += $@" LIMIT {param.take} OFFSET {param.skip}";
                    }
                    // Console.WriteLine($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", sql_list)}) AS report");
                    totalCount = session.Query<int>($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", sql_list)}) AS report").FirstOrDefault();
                    // Console.WriteLine(sql);
                    resultGroupByTuyen = session.Query<CustomReportViewModel>($"{sql}").ToList().GroupBy(x => x.matuyen).ToList();
                    foreach (var tuyenGroup in resultGroupByTuyen)
                    {

                        var groupByLayer = tuyenGroup.GroupBy(x => x.layer_name).ToList();
                        List<ReportGroupViewModel> layerItems = new List<ReportGroupViewModel>();
                        foreach (var layerGroup in groupByLayer)
                        {
                            var condition = new List<string> { "1=1" };
                            if (!string.IsNullOrWhiteSpace(layerGroup.Key))
                            {
                                var layerId = layerGroup.FirstOrDefault().layer_id;
                                if (layerId.HasValue && layerId.Value > 0)
                                {
                                    Layer layer = getLayerWithTableAndColumn(layerId.Value);

                                    if (layer != null)
                                    {
                                        ReportCriteria tieuChiBaoCao = tieuChiBaoCaos.Where(x => x.tableGroupLevel.table_id == layer.table_info_id).FirstOrDefault();
                                        var col = layer.table.columns.Where(x => x.column_name.Contains("matuyen")).FirstOrDefault();
                                        if (col != null)
                                        {
                                            if (string.IsNullOrWhiteSpace(tuyenGroup.Key))
                                            {
                                                condition.Add(@$"(tb.{col.column_name} = '' OR tb.{col.column_name} IS NULL)");
                                            }
                                            else
                                            {
                                                condition.Add($@"(tb.{col.column_name} = '{tuyenGroup.Key}')");
                                            }
                                        }
                                        else
                                        {
                                            condition.Add("1=0");
                                        }
                                        var group = new ReportGroupViewModel
                                        {
                                            count = session.Query<double>(@$"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}) FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                            WHERE {string.Join(" AND ", condition)} AND tb.{tieuChiBaoCao.tableGroupLevel.statistical_column} NOTNULL").FirstOrDefault(),
                                            key = layerGroup.Key != null ? layerGroup.Key : "Không xác định",
                                            items = new List<ReportGroupViewModel>(),
                                            unit = layerGroup.FirstOrDefault().donvitinh
                                        };
                                        var group_column_level1 = layer.table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_1).FirstOrDefault();
                                        if (group_column_level1 != null)
                                        {
                                            List<DomainViewModel> shortDataLevel1 = new List<DomainViewModel>();
                                            if (group_column_level1.lookup_table_id > 0)
                                            {
                                                shortDataLevel1 = getTableShortData(group_column_level1.lookup_table_id).ToList();
                                            }
                                            var groupByPhanLoai = layerGroup.GroupBy(x => x.group_level_1).ToList();
                                            foreach (var phanLoaiGroup in groupByPhanLoai)
                                            {
                                                var sql_where_phanloai = $"{string.Join(" AND ", condition)}";
                                                var key = phanLoaiGroup.Key;
                                                if (string.IsNullOrWhiteSpace(phanLoaiGroup.Key))
                                                {
                                                    key = "Không xác định";
                                                    sql_where_phanloai += @$" AND (tb.{group_column_level1.column_name} = '' OR tb.{group_column_level1.column_name} IS NULL)";
                                                }
                                                else
                                                {
                                                    if (shortDataLevel1.Count() > 0)
                                                    {
                                                        var classify = shortDataLevel1.Where(x => x.id.ToString() == phanLoaiGroup.Key).FirstOrDefault();
                                                        if (classify != null)
                                                        {
                                                            key = classify.mo_ta;
                                                        }
                                                    }
                                                    sql_where_phanloai += $@" AND (tb.{group_column_level1.column_name} = '{phanLoaiGroup.Key}')";
                                                }
                                                var phanLoai = new ReportGroupViewModel
                                                {
                                                    count = session.Query<double>(@$"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}) 
                                                    FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                    WHERE {sql_where_phanloai} AND tb.{tieuChiBaoCao.tableGroupLevel.statistical_column} NOTNULL").FirstOrDefault(),
                                                    key = key,
                                                    unit = phanLoaiGroup.FirstOrDefault().donvitinh
                                                };
                                                group.items.Add(phanLoai);
                                            }
                                        }
                                        layerItems.Add(group);
                                    }
                                }
                            }
                        }
                        string tenTuyen = "Không xác định";
                        if (!String.IsNullOrWhiteSpace(tuyenGroup.Key))
                        {
                            tenTuyen = tuyens.Where(x => x.matuyen == tuyenGroup.Key).FirstOrDefault()?.tentuyen;
                        }
                        data.Add(new ReportGroupViewModel
                        {
                            count = 0,
                            key = tenTuyen,
                            items = layerItems
                        });
                    }
                }
                return new ReportGroupDataViewModel
                {
                    data = data,
                    totalCount = totalCount
                };
            }
        }

        private ReportGroupDataViewModel getDataThongKeLoaiCongTrinhTheoTuyenChieuSang(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                int totalCount = 0;
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, CustomReportViewModel>> resultGroupByTuyen = new List<IGrouping<string?, CustomReportViewModel>>();
                var sql_list = new List<string>();
                var count_list = new List<string>();

                var tieuChiBaoCaos = session.Find<ReportCriteria>(stm => stm
                    .Where($@"LOWER({Sql.Entity<ReportCriteria>(x => x.report_code):TC}) = '{param.reportType.ToLower()}'")
                    .Include<TableRelationGroupLevel>(x => x.LeftOuterJoin())
                ).ToList();
                List<CustomReportViewModel> tramDens = new List<CustomReportViewModel>();
                var tableTramDen = session.Find<TableInfo>(stm => stm
                            .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'cs_tramden'")
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                         ).FirstOrDefault();
                var tableTuyen = session.Find<TableInfo>(stm => stm
                           .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'cs_tuyen'")
                           .Include<TableSchema>()
                           .Include<TableColumn>()
                        ).FirstOrDefault();

                if (tableTramDen != null && tableTuyen != null)
                {
                    string tableTramDenName = @$"{tableTramDen.table_schema}.{tableTramDen.table_name}";
                    string tableTuyenName = @$"{tableTuyen.table_schema}.{tableTuyen.table_name}";
                    tieuChiBaoCaos.ForEach(tieuChiBaoCao =>
                    {
                        Layer? layer = session.Find<Layer>(stm => stm
                            .Where($"{Sql.Entity<Layer>(x => x.table_info_id):TC} = {tieuChiBaoCao.tableGroupLevel.table_id}")
                            .Include<TableInfo>(join => join.InnerJoin())
                            .Include<TableColumn>(join => join.InnerJoin())
                            .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).FirstOrDefault();
                        if (layer != null)
                        {
                            var table_where_sql = new List<string> { "1=1" };
                            var table_join_sql = new List<string>();
                            string table_select_sql = string.Empty;
                            string table_count_sql = string.Empty;
                            var tableName = $@"{layer.table.table_schema}.{layer.table.table_name}";
                            var maTramColumn = layer.table.columns.Where(x => x.column_name.ToLower() == "matramden").FirstOrDefault();

                            table_select_sql = $@"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tableName}.{tieuChiBaoCao.tableGroupLevel.statistical_column}) AS {nameof(CustomReportViewModel.count)}";

                            if (maTramColumn != null)
                            {
                                table_select_sql += $@", {tableName}.{maTramColumn.column_name} AS {nameof(CustomReportViewModel.matram)}";

                                // Join Trạm
                                table_select_sql += $@", {tableTramDenName}.tentramden AS {nameof(CustomReportViewModel.tentram)}";
                                table_join_sql.Add($"LEFT OUTER JOIN {tableTramDenName} ON {tableName}.{maTramColumn.column_name} = {tableTramDenName}.matramden");
                                // Join Tuyến
                                table_select_sql += $@", {tableTuyenName}.matuyen AS {nameof(CustomReportViewModel.matuyen)}
                                                            , {tableTuyenName}.tentuyen AS {nameof(CustomReportViewModel.tentuyen)}";
                                table_join_sql.Add($"LEFT OUTER JOIN {tableTuyenName} ON {tableTramDenName}.matramden = {tableTuyenName}.matramden");
                                if (string.IsNullOrWhiteSpace(param.textSearch) == false && tableTuyen.columns.Any(x => x.column_name == "search_content"))
                                {
                                    table_where_sql.Add($"{tableTuyenName}.tentuyen IN ({String.Join(",", param.textSearch.Split(",").ToList().Select(x => @$"'{x}'"))})");
                                }
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.matram)}, 'Không xác định' AS {nameof(CustomReportViewModel.tentram)}
                                                            , 'Không xác định' AS {nameof(CustomReportViewModel.matuyen)}, 'Không xác định' AS {nameof(CustomReportViewModel.tentuyen)}";
                            }

                            table_select_sql += $@", '{layer.name_vn}' AS {nameof(CustomReportViewModel.layer_name)}, '{layer.id}' AS {nameof(CustomReportViewModel.layer_id)}";
                            if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_1))
                            {
                                table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_1}::TEXT AS {nameof(CustomReportViewModel.group_level_1)}";
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_1)}";
                            }
                            table_select_sql += $@", '{tieuChiBaoCao.tableGroupLevel.unit}' AS {nameof(CustomReportViewModel.donvitinh)}";

                            // Lọc hành chính
                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                            {
                                table_where_sql.Add($"{tableName}.district_code = '{param.districtCode}'");
                                table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {tableName}.district_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                            {
                                table_where_sql.Add($"{tableName}.commune_code = '{param.communeCode}'");
                                table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} =  {tableName}.commune_code");
                            }

                            var sqlJoinTable = table_join_sql.Count > 0 ? string.Join(" ", table_join_sql) : "";
                            table_select_sql += $@" FROM {layer.table.table_schema}.{layer.table.table_name} {sqlJoinTable}
                                                WHERE {string.Join(" AND ", table_where_sql)}
                                                GROUP BY {tableTuyenName}.matuyen , {tableTuyenName}.tentuyen
                                                        , {tableName}.matramden, {tableTramDenName}.tentramden
                                                        , {nameof(CustomReportViewModel.layer_name)} , {nameof(CustomReportViewModel.group_level_1)}";

                            sql_list.Add(table_select_sql);
                        }
                    });

                    var sql = @$"SELECT * FROM ({string.Join(" UNION ALL ", sql_list)}) AS report ORDER BY {nameof(CustomReportViewModel.tentuyen)}, 
                            {nameof(CustomReportViewModel.tentram)}, {nameof(CustomReportViewModel.layer_name)}, {nameof(CustomReportViewModel.group_level_1)}";
                    if (param.take > 0)
                    {
                        sql += $@" LIMIT {param.take} OFFSET {param.skip}";
                    }
                    totalCount = session.Query<int>($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", sql_list)}) AS report").FirstOrDefault();
                    // Console.WriteLine(sql);
                    resultGroupByTuyen = session.Query<CustomReportViewModel>($"{sql}").ToList().GroupBy(x => x.tentuyen).ToList();
                    foreach (var tuyenGroup in resultGroupByTuyen)
                    {
                        var groupByTramDen = tuyenGroup.GroupBy(x => x.matram).ToList();
                        List<ReportGroupViewModel> tramDenItems = new List<ReportGroupViewModel>();
                        foreach (var tramDenGroup in groupByTramDen)
                        {
                            var groupByLayer = tramDenGroup.GroupBy(x => x.layer_name).ToList();
                            List<ReportGroupViewModel> layerItems = new List<ReportGroupViewModel>();
                            foreach (var layerGroup in groupByLayer)
                            {
                                if (!string.IsNullOrWhiteSpace(layerGroup.Key))
                                {
                                    var layerId = layerGroup.FirstOrDefault().layer_id;
                                    if (layerId.HasValue && layerId.Value > 0)
                                    {
                                        Layer layer = getLayerWithTableAndColumn(layerId.Value);

                                        if (layer != null)
                                        {
                                            ReportCriteria tieuChiBaoCao = tieuChiBaoCaos.Where(x => x.tableGroupLevel.table_id == layer.table_info_id).FirstOrDefault();
                                            var table_join_sql = new List<string>();
                                            var condition = new List<string> { "1=1" };
                                            if (layer.table.columns.Where(x => x.column_name == "matramden").FirstOrDefault() != null)
                                            {

                                                if (string.IsNullOrWhiteSpace(tramDenGroup.Key))
                                                {
                                                    condition.Add(@$"(tb.matramden = '' OR tb.matramden IS NULL)");
                                                }
                                                else
                                                {
                                                    condition.Add($@"(tb.matramden = '{tramDenGroup.Key}')");
                                                }
                                                // Join Trạm
                                                table_join_sql.Add($"LEFT OUTER JOIN {tableTramDenName} ON tb.matramden =  {tableTramDenName}.matramden");
                                                // Join Tuyến
                                                table_join_sql.Add($"LEFT OUTER JOIN {tableTuyenName} ON {tableTramDenName}.matramden = {tableTuyenName}.matramden");

                                                if (string.IsNullOrWhiteSpace(tuyenGroup.Key))
                                                {
                                                    condition.Add(@$"({tableTuyenName}.tentuyen = '' OR {tableTuyenName}.tentuyen IS NULL)");
                                                }
                                                else
                                                {
                                                    condition.Add($@"({tableTuyenName}.tentuyen = '{tuyenGroup.Key}')");
                                                }
                                            }
                                            else
                                            {
                                                condition.Add("1=0");
                                            }
                                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                                            {
                                                condition.Add($"tb.district_code = '{param.districtCode}'");
                                                table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = tb.district_code");
                                            }
                                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                                            {
                                                condition.Add($"tb.commune_code = '{param.communeCode}'");
                                                table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = tb.commune_code");
                                            }

                                            var sqlJoinTable = table_join_sql.Count > 0 ? string.Join(" ", table_join_sql) : "";
                                            var sqlCount = @$"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}) 
                                                    FROM {layer.table.table_schema}.{layer.table.table_name} tb {sqlJoinTable}
                                                    WHERE {string.Join(" AND ", condition)}";
                                            var group = new ReportGroupViewModel
                                            {
                                                count = session.Query<double>(sqlCount).FirstOrDefault(),
                                                key = layerGroup.Key != null ? layerGroup.Key : "Không xác định",
                                                items = new List<ReportGroupViewModel>(),
                                                unit = layerGroup.FirstOrDefault().donvitinh
                                            };
                                            var group_column_level1 = layer.table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_1).FirstOrDefault();
                                            if (group_column_level1 != null)
                                            {
                                                List<DomainViewModel> shortDataLevel1 = new List<DomainViewModel>();
                                                if (group_column_level1.lookup_table_id > 0)
                                                {
                                                    shortDataLevel1 = getTableShortData(group_column_level1.lookup_table_id).ToList();
                                                }
                                                var groupByPhanLoai = layerGroup.GroupBy(x => x.group_level_1).ToList();
                                                foreach (var phanLoaiGroup in groupByPhanLoai)
                                                {
                                                    var sql_where_phanloai = $"{string.Join(" AND ", condition)}";
                                                    var key = phanLoaiGroup.Key;
                                                    if (string.IsNullOrWhiteSpace(phanLoaiGroup.Key))
                                                    {
                                                        key = "Không xác định";
                                                        sql_where_phanloai += @$" AND (tb.{group_column_level1.column_name} = '' OR tb.{group_column_level1.column_name} IS NULL)";
                                                    }
                                                    else
                                                    {
                                                        if (shortDataLevel1.Count() > 0)
                                                        {
                                                            var classify = shortDataLevel1.Where(x => x.id.ToString() == phanLoaiGroup.Key).FirstOrDefault();
                                                            if (classify != null)
                                                            {
                                                                key = classify.mo_ta;
                                                            }
                                                        }
                                                        sql_where_phanloai += $@" AND (tb.{group_column_level1.column_name} = '{phanLoaiGroup.Key}')";
                                                    }
                                                    var phanLoai = new ReportGroupViewModel
                                                    {
                                                        count = phanLoaiGroup.FirstOrDefault().count.Value,
                                                        key = key,
                                                        unit = phanLoaiGroup.FirstOrDefault().donvitinh
                                                    };
                                                    group.items.Add(phanLoai);
                                                }
                                            }
                                            layerItems.Add(group);
                                        }
                                    }
                                }
                            }
                            string tenTram = "Không xác định";
                            if (!String.IsNullOrWhiteSpace(tramDenGroup.Key))
                            {
                                tenTram = session.Query<string>($@"SELECT tentramden FROM {tableTramDenName} WHERE matramden = '{tramDenGroup.Key}'").FirstOrDefault();
                            }
                            tramDenItems.Add(new ReportGroupViewModel
                            {
                                count = 0,
                                key = "Trạm đèn: " + tenTram,
                                items = layerItems
                            });
                        }
                        string tenTuyen = tuyenGroup.Key.ToUpper();
                        if (String.IsNullOrWhiteSpace(tuyenGroup.Key))
                        {
                            tenTuyen = "Không xác định";
                        }
                        data.Add(new ReportGroupViewModel
                        {
                            count = 0,
                            key = tenTuyen,
                            items = tramDenItems
                        });
                    }
                }

                return new ReportGroupDataViewModel
                {
                    data = data,
                    totalCount = totalCount
                };
            }
        }

        private ReportGroupDataViewModel getDataTongHopThoatNuoc(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                int totalCount = 0;
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, CustomReportViewModel>> resultGroupByTram = new List<IGrouping<string?, CustomReportViewModel>>();
                var sql_list = new List<string>();
                var count_list = new List<string>();

                var tieuChiBaoCaos = session.Find<ReportCriteria>(stm => stm
                    .Where($@"LOWER({Sql.Entity<ReportCriteria>(x => x.report_code):TC}) = '{param.reportType.ToLower()}'")
                    .Include<TableRelationGroupLevel>(x => x.LeftOuterJoin())
                ).ToList();
                List<CustomReportViewModel> tramDens = new List<CustomReportViewModel>();
                var tableTramDen = session.Find<TableInfo>(stm => stm
                            .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'cs_tramden'")
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                         ).FirstOrDefault();

                if (tableTramDen != null)
                {
                    string tableTramDenName = @$"{tableTramDen.table_schema}.{tableTramDen.table_name}";
                    var maTramDenColumn = tableTramDen.columns.Where(x => x.column_name.Contains("matramden")).FirstOrDefault();
                    var tenTramDenColumn = tableTramDen.columns.Where(x => x.column_name.Contains("tentramden")).FirstOrDefault();
                    tieuChiBaoCaos.ForEach(tieuChiBaoCao =>
                    {
                        Layer? layer = session.Find<Layer>(stm => stm
                            .Where($"{Sql.Entity<Layer>(x => x.table_info_id):TC} = {tieuChiBaoCao.tableGroupLevel.table_id}")
                            .Include<TableInfo>(join => join.InnerJoin())
                            .Include<TableColumn>(join => join.InnerJoin())
                            .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).FirstOrDefault();
                        if (layer != null)
                        {
                            var table_where_sql = new List<string> { "1=1" };
                            var table_join_sql = new List<string>();
                            string table_select_sql = string.Empty;
                            string table_count_sql = string.Empty;
                            var tableName = $@"{layer.table.table_schema}.{layer.table.table_name}";
                            var maTramColumn = layer.table.columns.Where(x => x.column_name.Contains("matramden")).FirstOrDefault();

                            table_select_sql = $@"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tableName}.{tieuChiBaoCao.tableGroupLevel.statistical_column}) AS {nameof(CustomReportViewModel.count)}";

                            if (maTramColumn != null)
                            {
                                table_select_sql += $@", {tableName}.{maTramColumn.column_name} AS {nameof(CustomReportViewModel.matram)}";
                                // Join Trạm
                                table_select_sql += $@", {tableTramDenName}.{tenTramDenColumn.column_name} AS {nameof(CustomReportViewModel.tentram)}";
                                table_join_sql.Add($"LEFT OUTER JOIN {tableTramDenName} ON {tableName}.{maTramColumn.column_name} = {tableTramDenName}.{maTramDenColumn.column_name}");

                                if (string.IsNullOrWhiteSpace(param.textSearch) == false && tableTramDen.columns.Any(x => x.column_name == "search_content"))
                                {
                                    table_where_sql.Add($"{tableTramDenName}.{tenTramDenColumn.column_name} IN ({String.Join(",", param.textSearch.Split(",").ToList().Select(x => @$"'{x}'"))})");
                                }
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.matram)}, 'Không xác định' AS {nameof(CustomReportViewModel.tentram)}";
                            }

                            table_select_sql += $@", '{layer.name_vn}' AS {nameof(CustomReportViewModel.layer_name)}, '{layer.id}' AS {nameof(CustomReportViewModel.layer_id)}";
                            if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_1))
                            {
                                table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_1}::TEXT AS {nameof(CustomReportViewModel.group_level_1)}";
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_1)}";
                            }
                            if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_2))
                            {
                                table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_2}::TEXT AS {nameof(CustomReportViewModel.group_level_2)}";
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_2)}";
                            }
                            table_select_sql += $@", '{tieuChiBaoCao.tableGroupLevel.unit}' AS {nameof(CustomReportViewModel.donvitinh)}";

                            // Lọc hành chính
                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                            {
                                table_where_sql.Add($"{tableName}.district_code = '{param.districtCode}'");
                                table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {tableName}.district_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                            {
                                table_where_sql.Add($"{tableName}.commune_code = '{param.communeCode}'");
                                table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} =  {tableName}.commune_code");
                            }

                            var sqlJoinTable = table_join_sql.Count > 0 ? string.Join(" ", table_join_sql) : "";
                            table_select_sql += $@" FROM {layer.table.table_schema}.{layer.table.table_name} {sqlJoinTable}
                                                WHERE {string.Join(" AND ", table_where_sql)}
                                                GROUP BY {tableName}.{maTramColumn.column_name}, {tableTramDenName}.{tenTramDenColumn.column_name}
                                                        , {nameof(CustomReportViewModel.layer_name)} , {nameof(CustomReportViewModel.group_level_1)}
                                                        , {nameof(CustomReportViewModel.group_level_2)}";

                            sql_list.Add(table_select_sql);
                        }
                    });

                    var sql = @$"SELECT * FROM ({string.Join(" UNION ALL ", sql_list)}) AS report ORDER BY {nameof(CustomReportViewModel.tentram)}, {nameof(CustomReportViewModel.layer_name)}, {nameof(CustomReportViewModel.group_level_1)}";
                    if (param.take > 0)
                    {
                        sql += $@" LIMIT {param.take} OFFSET {param.skip}";
                    }
                    totalCount = session.Query<int>($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", sql_list)}) AS report").FirstOrDefault();
                    // Console.WriteLine(sql);
                    resultGroupByTram = session.Query<CustomReportViewModel>($"{sql}").ToList().GroupBy(x => x.matram).ToList();
                    foreach (var tramDenGroup in resultGroupByTram)
                    {
                        var groupByLayer = tramDenGroup.GroupBy(x => x.layer_name).ToList();
                        List<ReportGroupViewModel> layerItems = new List<ReportGroupViewModel>();
                        foreach (var layerGroup in groupByLayer)
                        {
                            if (!string.IsNullOrWhiteSpace(layerGroup.Key))
                            {
                                var layerId = layerGroup.FirstOrDefault().layer_id;
                                if (layerId.HasValue && layerId.Value > 0)
                                {
                                    Layer layer = getLayerWithTableAndColumn(layerId.Value);

                                    if (layer != null)
                                    {
                                        ReportCriteria tieuChiBaoCao = tieuChiBaoCaos.Where(x => x.tableGroupLevel.table_id == layer.table_info_id).FirstOrDefault();
                                        var table_join_sql = new List<string>();
                                        var condition = new List<string> { "1=1" };
                                        if (layer.table.columns.Where(x => x.column_name == "matramden").FirstOrDefault() != null)
                                        {

                                            if (string.IsNullOrWhiteSpace(tramDenGroup.Key))
                                            {
                                                condition.Add(@$"(tb.matramden = '' OR tb.matramden IS NULL)");
                                            }
                                            else
                                            {
                                                condition.Add($@"(tb.matramden = '{tramDenGroup.Key}')");
                                            }
                                        }
                                        else
                                        {
                                            condition.Add("1=0");
                                        }
                                        if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                                        {
                                            condition.Add($"tb.district_code = '{param.districtCode}'");
                                            table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = tb.district_code");
                                        }
                                        if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                                        {
                                            condition.Add($"tb.commune_code = '{param.communeCode}'");
                                            table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = tb.commune_code");
                                        }

                                        var sqlJoinTable = table_join_sql.Count > 0 ? string.Join(" ", table_join_sql) : "";
                                        var sqlCount = string.Empty;
                                        if (tieuChiBaoCao.tableGroupLevel.statistical_type.ToLower() == "sum")
                                        {
                                            sqlCount = @$"SELECT COALESCE(SUM(COALESCE(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}, 0)), 0)
                                                    FROM {layer.table.table_schema}.{layer.table.table_name} tb 
                                                    WHERE {string.Join(" AND ", condition)} AND tb.{tieuChiBaoCao.tableGroupLevel.statistical_column} IS NOT NULL";
                                        }
                                        else
                                        {
                                            sqlCount = @$"SELECT COUNT(DISTINCT(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}))
                                                    FROM {layer.table.table_schema}.{layer.table.table_name} tb 
                                                    WHERE {string.Join(" AND ", condition)}";
                                        }
                                        ;
                                        var group = new ReportGroupViewModel
                                        {
                                            count = session.Query<double>(sqlCount).FirstOrDefault(),
                                            key = layerGroup.Key != null ? layerGroup.Key : "Không xác định",
                                            items = new List<ReportGroupViewModel>(),
                                            unit = layerGroup.FirstOrDefault().donvitinh
                                        };
                                        List<ReportGroupViewModel> level1Items = new List<ReportGroupViewModel>();
                                        var group_column_level1 = layer.table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_1).FirstOrDefault();
                                        if (group_column_level1 != null)
                                        {
                                            List<DomainViewModel> shortDataLevel1 = new List<DomainViewModel>();
                                            if (group_column_level1.lookup_table_id > 0)
                                            {
                                                shortDataLevel1 = getTableShortData(group_column_level1.lookup_table_id).ToList();
                                            }
                                            var groupByLevel1 = layerGroup.GroupBy(x => x.group_level_1).ToList();
                                            foreach (var groupLevel1 in groupByLevel1)
                                            {
                                                var sql_where_level1 = $"{string.Join(" AND ", condition)}";
                                                var keyLevel1 = groupLevel1.Key;
                                                if (string.IsNullOrWhiteSpace(groupLevel1.Key))
                                                {
                                                    keyLevel1 = "Không xác định";
                                                    sql_where_level1 += @$" AND (tb.{group_column_level1.column_name}::TEXT = '' OR tb.{group_column_level1.column_name}::TEXT IS NULL)";
                                                }
                                                else
                                                {
                                                    if (shortDataLevel1.Count() > 0)
                                                    {
                                                        var classify = shortDataLevel1.Where(x => x.id.ToString() == groupLevel1.Key).FirstOrDefault();
                                                        if (classify != null)
                                                        {
                                                            keyLevel1 = classify.mo_ta;
                                                        }
                                                    }
                                                    sql_where_level1 += $@" AND (tb.{group_column_level1.column_name}::TEXT = '{groupLevel1.Key}')";
                                                }

                                                var group_column_level2 = layer.table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_2).FirstOrDefault();
                                                if (group_column_level2 != null)
                                                {
                                                    var shortDataLevel2 = new List<DomainViewModel>();
                                                    if (group_column_level2.lookup_table_id > 0)
                                                    {
                                                        shortDataLevel2 = getTableShortData(group_column_level2.lookup_table_id).ToList();
                                                    }
                                                    var groupByLevel2 = groupLevel1.GroupBy(x => x.group_level_2).ToList();
                                                    List<ReportGroupViewModel> level2Items = new List<ReportGroupViewModel>();
                                                    foreach (var groupLevel2 in groupByLevel2)
                                                    {
                                                        var sql_where_level2 = sql_where_level1.Clone();
                                                        var keyLevel2 = groupLevel2.Key;
                                                        if (string.IsNullOrWhiteSpace(groupLevel2.Key))
                                                        {
                                                            keyLevel2 = "Không xác định";
                                                            sql_where_level2 += @$" AND (tb.{group_column_level2.column_name}::TEXT = '' OR tb.{group_column_level2.column_name}::TEXT IS NULL)";
                                                        }
                                                        else
                                                        {
                                                            if (shortDataLevel2.Count() > 0)
                                                            {
                                                                var classify = shortDataLevel2.Where(x => x.id.ToString() == groupLevel2.Key).FirstOrDefault();
                                                                if (classify != null)
                                                                {
                                                                    keyLevel2 = classify.mo_ta;
                                                                }
                                                            }
                                                            sql_where_level2 += $@" AND (tb.{group_column_level2.column_name}::TEXT = '{groupLevel2.Key}')";
                                                        }
                                                        string sqlCountLevel2 = string.Empty;
                                                        if (tieuChiBaoCao.tableGroupLevel.statistical_type.ToLower() == "sum")
                                                        {
                                                            sqlCountLevel2 = @$"SELECT COALESCE(SUM(COALESCE(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}, 0)), 0)
                                                                FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                                WHERE {sql_where_level2} AND tb.{tieuChiBaoCao.tableGroupLevel.statistical_column} IS NOT NULL";
                                                        }
                                                        else
                                                        {
                                                            sqlCountLevel2 = @$"SELECT COUNT(DISTINCT(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}))
                                                                FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                                WHERE {sql_where_level2}";
                                                        }
                                                        level2Items.Add(new ReportGroupViewModel
                                                        {
                                                            count = session.Query<double>(sqlCountLevel2).FirstOrDefault(),
                                                            key = keyLevel2,
                                                            unit = groupLevel2.FirstOrDefault().donvitinh
                                                        });
                                                    }
                                                    string sqlCountLevel1 = string.Empty;
                                                    if (tieuChiBaoCao.tableGroupLevel.statistical_type.ToLower() == "sum")
                                                    {
                                                        sqlCountLevel1 = @$"SELECT COALESCE(SUM(COALESCE(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}, 0)), 0)
                                                            FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                            WHERE {sql_where_level1} AND tb.{tieuChiBaoCao.tableGroupLevel.statistical_column} IS NOT NULL";
                                                    }
                                                    else
                                                    {
                                                        sqlCountLevel1 = @$"SELECT COUNT(DISTINCT(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}))
                                                            FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                            WHERE {sql_where_level1}";
                                                    }
                                                    group.items.Add(new ReportGroupViewModel
                                                    {
                                                        count = session.Query<double>(sqlCountLevel1).FirstOrDefault(),
                                                        key = keyLevel1,
                                                        items = level2Items,
                                                        unit = groupLevel1.FirstOrDefault().donvitinh
                                                    });
                                                }
                                            }
                                        }
                                        layerItems.Add(group);
                                    }
                                }
                            }
                        }
                        string tenTram = "Không xác định";
                        if (!String.IsNullOrWhiteSpace(tramDenGroup.Key))
                        {
                            tenTram = session.Query<string>($@"SELECT {tenTramDenColumn.column_name} FROM {tableTramDenName} WHERE {maTramDenColumn.column_name} = '{tramDenGroup.Key}'").FirstOrDefault();
                        }
                        data.Add(new ReportGroupViewModel
                        {
                            count = 0,
                            key = tenTram,
                            items = layerItems
                        });
                    }
                }

                return new ReportGroupDataViewModel
                {
                    data = data,
                    totalCount = totalCount
                };
            }
        }
        private ReportGroupDataViewModel getDataThongKeLoaiCongTrinhChieuSangTheoTramDen(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                int totalCount = 0;
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, CustomReportViewModel>> resultGroupByTram = new List<IGrouping<string?, CustomReportViewModel>>();
                var sql_list = new List<string>();
                var count_list = new List<string>();

                var tieuChiBaoCaos = session.Find<ReportCriteria>(stm => stm
                    .Where($@"LOWER({Sql.Entity<ReportCriteria>(x => x.report_code):TC}) = '{param.reportType.ToLower()}'")
                    .Include<TableRelationGroupLevel>(x => x.LeftOuterJoin())
                ).ToList();
                List<CustomReportViewModel> tramDens = new List<CustomReportViewModel>();
                var tableTramDen = session.Find<TableInfo>(stm => stm
                            .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'cs_tramden'")
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                         ).FirstOrDefault();

                if (tableTramDen != null)
                {
                    string tableTramDenName = @$"{tableTramDen.table_schema}.{tableTramDen.table_name}";
                    var maTramDenColumn = tableTramDen.columns.Where(x => x.column_name.Contains("matramden")).FirstOrDefault();
                    var tenTramDenColumn = tableTramDen.columns.Where(x => x.column_name.Contains("tentramden")).FirstOrDefault();
                    tieuChiBaoCaos.ForEach(tieuChiBaoCao =>
                    {
                        Layer? layer = session.Find<Layer>(stm => stm
                            .Where($"{Sql.Entity<Layer>(x => x.table_info_id):TC} = {tieuChiBaoCao.tableGroupLevel.table_id}")
                            .Include<TableInfo>(join => join.InnerJoin())
                            .Include<TableColumn>(join => join.InnerJoin())
                            .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).FirstOrDefault();
                        if (layer != null)
                        {
                            var table_where_sql = new List<string> { "1=1" };
                            var table_join_sql = new List<string>();
                            string table_select_sql = string.Empty;
                            string table_count_sql = string.Empty;
                            var tableName = $@"{layer.table.table_schema}.{layer.table.table_name}";
                            var maTramColumn = layer.table.columns.Where(x => x.column_name.Contains("matramden")).FirstOrDefault();

                            table_select_sql = $@"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tableName}.{tieuChiBaoCao.tableGroupLevel.statistical_column}) AS {nameof(CustomReportViewModel.count)}";

                            if (maTramColumn != null)
                            {
                                table_select_sql += $@", {tableName}.{maTramColumn.column_name} AS {nameof(CustomReportViewModel.matram)}";
                                // Join Trạm
                                table_select_sql += $@", {tableTramDenName}.{tenTramDenColumn.column_name} AS {nameof(CustomReportViewModel.tentram)}";
                                table_join_sql.Add($"LEFT OUTER JOIN {tableTramDenName} ON {tableName}.{maTramColumn.column_name} = {tableTramDenName}.{maTramDenColumn.column_name}");

                                if (string.IsNullOrWhiteSpace(param.textSearch) == false && tableTramDen.columns.Any(x => x.column_name == "search_content"))
                                {
                                    table_where_sql.Add($"{tableTramDenName}.{tenTramDenColumn.column_name} IN ({String.Join(",", param.textSearch.Split(",").ToList().Select(x => @$"'{x}'"))})");
                                }
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.matram)}, 'Không xác định' AS {nameof(CustomReportViewModel.tentram)}";
                            }

                            table_select_sql += $@", '{layer.name_vn}' AS {nameof(CustomReportViewModel.layer_name)}, '{layer.id}' AS {nameof(CustomReportViewModel.layer_id)}";
                            if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_1))
                            {
                                table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_1}::TEXT AS {nameof(CustomReportViewModel.group_level_1)}";
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_1)}";
                            }
                            if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_2))
                            {
                                table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_2}::TEXT AS {nameof(CustomReportViewModel.group_level_2)}";
                            }
                            else
                            {
                                table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_2)}";
                            }
                            table_select_sql += $@", '{tieuChiBaoCao.tableGroupLevel.unit}' AS {nameof(CustomReportViewModel.donvitinh)}";

                            // Lọc hành chính
                            if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                            {
                                table_where_sql.Add($"{tableName}.district_code = '{param.districtCode}'");
                                table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {tableName}.district_code");
                            }
                            if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                            {
                                table_where_sql.Add($"{tableName}.commune_code = '{param.communeCode}'");
                                table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} =  {tableName}.commune_code");
                            }

                            var sqlJoinTable = table_join_sql.Count > 0 ? string.Join(" ", table_join_sql) : "";
                            table_select_sql += $@" FROM {layer.table.table_schema}.{layer.table.table_name} {sqlJoinTable}
                                                WHERE {string.Join(" AND ", table_where_sql)}
                                                GROUP BY {tableName}.{maTramColumn.column_name}, {tableTramDenName}.{tenTramDenColumn.column_name}
                                                        , {nameof(CustomReportViewModel.layer_name)} , {nameof(CustomReportViewModel.group_level_1)}
                                                        , {nameof(CustomReportViewModel.group_level_2)}";

                            sql_list.Add(table_select_sql);
                        }
                    });

                    var sql = @$"SELECT * FROM ({string.Join(" UNION ALL ", sql_list)}) AS report ORDER BY {nameof(CustomReportViewModel.tentram)}, {nameof(CustomReportViewModel.layer_name)}, {nameof(CustomReportViewModel.group_level_1)}";
                    if (param.take > 0)
                    {
                        sql += $@" LIMIT {param.take} OFFSET {param.skip}";
                    }
                    totalCount = session.Query<int>($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", sql_list)}) AS report").FirstOrDefault();
                    // Console.WriteLine(sql);
                    resultGroupByTram = session.Query<CustomReportViewModel>($"{sql}").ToList().GroupBy(x => x.matram).ToList();
                    foreach (var tramDenGroup in resultGroupByTram)
                    {
                        var groupByLayer = tramDenGroup.GroupBy(x => x.layer_name).ToList();
                        List<ReportGroupViewModel> layerItems = new List<ReportGroupViewModel>();
                        foreach (var layerGroup in groupByLayer)
                        {
                            if (!string.IsNullOrWhiteSpace(layerGroup.Key))
                            {
                                var layerId = layerGroup.FirstOrDefault().layer_id;
                                if (layerId.HasValue && layerId.Value > 0)
                                {
                                    Layer layer = getLayerWithTableAndColumn(layerId.Value);

                                    if (layer != null)
                                    {
                                        ReportCriteria tieuChiBaoCao = tieuChiBaoCaos.Where(x => x.tableGroupLevel.table_id == layer.table_info_id).FirstOrDefault();
                                        var table_join_sql = new List<string>();
                                        var condition = new List<string> { "1=1" };
                                        if (layer.table.columns.Where(x => x.column_name == "matramden").FirstOrDefault() != null)
                                        {

                                            if (string.IsNullOrWhiteSpace(tramDenGroup.Key))
                                            {
                                                condition.Add(@$"(tb.matramden = '' OR tb.matramden IS NULL)");
                                            }
                                            else
                                            {
                                                condition.Add($@"(tb.matramden = '{tramDenGroup.Key}')");
                                            }
                                        }
                                        else
                                        {
                                            condition.Add("1=0");
                                        }
                                        if (string.IsNullOrWhiteSpace(param.districtCode) == false && layer.table.columns.Any(x => x.column_name == "district_code"))
                                        {
                                            condition.Add($"tb.district_code = '{param.districtCode}'");
                                            table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = tb.district_code");
                                        }
                                        if (string.IsNullOrWhiteSpace(param.communeCode) == false && layer.table.columns.Any(x => x.column_name == "commune_code"))
                                        {
                                            condition.Add($"tb.commune_code = '{param.communeCode}'");
                                            table_join_sql.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = tb.commune_code");
                                        }

                                        var sqlJoinTable = table_join_sql.Count > 0 ? string.Join(" ", table_join_sql) : "";
                                        var sqlCount = string.Empty;
                                        if (tieuChiBaoCao.tableGroupLevel.statistical_type.ToLower() == "sum")
                                        {
                                            sqlCount = @$"SELECT COALESCE(SUM(COALESCE(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}, 0)), 0)
                                                    FROM {layer.table.table_schema}.{layer.table.table_name} tb 
                                                    WHERE {string.Join(" AND ", condition)} AND tb.{tieuChiBaoCao.tableGroupLevel.statistical_column} IS NOT NULL";
                                        }
                                        else
                                        {
                                            sqlCount = @$"SELECT COUNT(DISTINCT(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}))
                                                    FROM {layer.table.table_schema}.{layer.table.table_name} tb 
                                                    WHERE {string.Join(" AND ", condition)}";
                                        }
                                        ;
                                        var group = new ReportGroupViewModel
                                        {
                                            count = session.Query<double>(sqlCount).FirstOrDefault(),
                                            key = layerGroup.Key != null ? layerGroup.Key : "Không xác định",
                                            items = new List<ReportGroupViewModel>(),
                                            unit = layerGroup.FirstOrDefault().donvitinh
                                        };
                                        List<ReportGroupViewModel> level1Items = new List<ReportGroupViewModel>();
                                        var group_column_level1 = layer.table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_1).FirstOrDefault();
                                        if (group_column_level1 != null)
                                        {
                                            List<DomainViewModel> shortDataLevel1 = new List<DomainViewModel>();
                                            if (group_column_level1.lookup_table_id > 0)
                                            {
                                                shortDataLevel1 = getTableShortData(group_column_level1.lookup_table_id).ToList();
                                            }
                                            var groupByLevel1 = layerGroup.GroupBy(x => x.group_level_1).ToList();
                                            foreach (var groupLevel1 in groupByLevel1)
                                            {
                                                var sql_where_level1 = $"{string.Join(" AND ", condition)}";
                                                var keyLevel1 = groupLevel1.Key;
                                                if (string.IsNullOrWhiteSpace(groupLevel1.Key))
                                                {
                                                    keyLevel1 = "Không xác định";
                                                    sql_where_level1 += @$" AND (tb.{group_column_level1.column_name}::TEXT = '' OR tb.{group_column_level1.column_name}::TEXT IS NULL)";
                                                }
                                                else
                                                {
                                                    if (shortDataLevel1.Count() > 0)
                                                    {
                                                        var classify = shortDataLevel1.Where(x => x.id.ToString() == groupLevel1.Key).FirstOrDefault();
                                                        if (classify != null)
                                                        {
                                                            keyLevel1 = classify.mo_ta;
                                                        }
                                                    }
                                                    sql_where_level1 += $@" AND (tb.{group_column_level1.column_name}::TEXT = '{groupLevel1.Key}')";
                                                }

                                                var group_column_level2 = layer.table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_2).FirstOrDefault();
                                                if (group_column_level2 != null)
                                                {
                                                    var shortDataLevel2 = new List<DomainViewModel>();
                                                    if (group_column_level2.lookup_table_id > 0)
                                                    {
                                                        shortDataLevel2 = getTableShortData(group_column_level2.lookup_table_id).ToList();
                                                    }
                                                    var groupByLevel2 = groupLevel1.GroupBy(x => x.group_level_2).ToList();
                                                    List<ReportGroupViewModel> level2Items = new List<ReportGroupViewModel>();
                                                    foreach (var groupLevel2 in groupByLevel2)
                                                    {
                                                        var sql_where_level2 = sql_where_level1.Clone();
                                                        var keyLevel2 = groupLevel2.Key;
                                                        if (string.IsNullOrWhiteSpace(groupLevel2.Key))
                                                        {
                                                            keyLevel2 = "Không xác định";
                                                            sql_where_level2 += @$" AND (tb.{group_column_level2.column_name}::TEXT = '' OR tb.{group_column_level2.column_name}::TEXT IS NULL)";
                                                        }
                                                        else
                                                        {
                                                            if (shortDataLevel2.Count() > 0)
                                                            {
                                                                var classify = shortDataLevel2.Where(x => x.id.ToString() == groupLevel2.Key).FirstOrDefault();
                                                                if (classify != null)
                                                                {
                                                                    keyLevel2 = classify.mo_ta;
                                                                }
                                                            }
                                                            sql_where_level2 += $@" AND (tb.{group_column_level2.column_name}::TEXT = '{groupLevel2.Key}')";
                                                        }
                                                        string sqlCountLevel2 = string.Empty;
                                                        if (tieuChiBaoCao.tableGroupLevel.statistical_type.ToLower() == "sum")
                                                        {
                                                            sqlCountLevel2 = @$"SELECT COALESCE(SUM(COALESCE(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}, 0)), 0)
                                                                FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                                WHERE {sql_where_level2} AND tb.{tieuChiBaoCao.tableGroupLevel.statistical_column} IS NOT NULL";
                                                        }
                                                        else
                                                        {
                                                            sqlCountLevel2 = @$"SELECT COUNT(DISTINCT(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}))
                                                                FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                                WHERE {sql_where_level2}";
                                                        }
                                                        level2Items.Add(new ReportGroupViewModel
                                                        {
                                                            count = session.Query<double>(sqlCountLevel2).FirstOrDefault(),
                                                            key = keyLevel2,
                                                            unit = groupLevel2.FirstOrDefault().donvitinh
                                                        });
                                                    }
                                                    string sqlCountLevel1 = string.Empty;
                                                    if (tieuChiBaoCao.tableGroupLevel.statistical_type.ToLower() == "sum")
                                                    {
                                                        sqlCountLevel1 = @$"SELECT COALESCE(SUM(COALESCE(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}, 0)), 0)
                                                            FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                            WHERE {sql_where_level1} AND tb.{tieuChiBaoCao.tableGroupLevel.statistical_column} IS NOT NULL";
                                                    }
                                                    else
                                                    {
                                                        sqlCountLevel1 = @$"SELECT COUNT(DISTINCT(tb.{tieuChiBaoCao.tableGroupLevel.statistical_column}))
                                                            FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                            WHERE {sql_where_level1}";
                                                    }
                                                    group.items.Add(new ReportGroupViewModel
                                                    {
                                                        count = session.Query<double>(sqlCountLevel1).FirstOrDefault(),
                                                        key = keyLevel1,
                                                        items = level2Items,
                                                        unit = groupLevel1.FirstOrDefault().donvitinh
                                                    });
                                                }
                                            }
                                        }
                                        layerItems.Add(group);
                                    }
                                }
                            }
                        }
                        string tenTram = "Không xác định";
                        if (!String.IsNullOrWhiteSpace(tramDenGroup.Key))
                        {
                            tenTram = session.Query<string>($@"SELECT {tenTramDenColumn.column_name} FROM {tableTramDenName} WHERE {maTramDenColumn.column_name} = '{tramDenGroup.Key}'").FirstOrDefault();
                        }
                        data.Add(new ReportGroupViewModel
                        {
                            count = 0,
                            key = tenTram,
                            items = layerItems
                        });
                    }
                }

                return new ReportGroupDataViewModel
                {
                    data = data,
                    totalCount = totalCount
                };
            }
        }
        private ReportGroupDataViewModel getDataThongKeLoaiCongTrinhTheoHo(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                int totalCount = 0;
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, CustomReportViewModel>> resultGroupByHo = new List<IGrouping<string?, CustomReportViewModel>>();
                var sql_list = new List<string>();
                var count_list = new List<string>();
                var tieuChiBaoCaos = session.Find<ReportCriteria>(stm => stm
                    .Where($@"LOWER({Sql.Entity<ReportCriteria>(x => x.report_code):TC}) = '{param.reportType.ToLower()}'")
                    .Include<TableRelationGroupLevel>(x => x.LeftOuterJoin())
                ).ToList();
                TableInfo? tableHoDieuHoa = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'tn_hodieuhoa'")
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();

                TableInfo? tableTuyenThoatNuoc = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'tn_tuyen'")
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();
                if (tableHoDieuHoa != null || tableTuyenThoatNuoc != null)
                {
                    var sql_where = new List<string> { "1=1" };
                    var sql_join = new List<string>();
                    sql_where.Add("ho.maho NOTNULL");
                    if (string.IsNullOrWhiteSpace(param.textSearch) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "search_content"))
                    {
                        sql_where.Add(@$"ho.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')");
                    }
                    if (string.IsNullOrWhiteSpace(param.districtCode) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "district_code"))
                    {
                        sql_where.Add($"ho.district_code = '{param.districtCode}'");
                        sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = ho.district_code");
                    }
                    if (string.IsNullOrWhiteSpace(param.communeCode) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "commune_code"))
                    {
                        sql_where.Add($"ho.commune_code = '{param.communeCode}'");
                        sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = ho.commune_code");
                    }
                    var hoDieuHoaJoin = sql_join.Count > 0 ? string.Join(" ", sql_join) : "";
                    var sqlSelect = $@"SELECT maho AS {nameof(CustomReportViewModel.luuvuvid)}, tenho AS {nameof(CustomReportViewModel.tenho)} 
                        FROM {tableHoDieuHoa.table_schema}.{tableHoDieuHoa.table_name} ho {hoDieuHoaJoin} WHERE {string.Join(" AND ", sql_where)}";
                    List<CustomReportViewModel> hoDieuHoas = session.Query<CustomReportViewModel>(sqlSelect).ToList();
                    if (hoDieuHoas != null && hoDieuHoas.Count() > 0)
                    {
                        foreach (var hoDieuHoa in hoDieuHoas)
                        {
                            var sqlSelectTuyen = $@"SELECT tuyen.matuyen, tuyen.tentuyen FROM {tableTuyenThoatNuoc.table_schema}.{tableTuyenThoatNuoc.table_name} tuyen WHERE tuyen.nguontiepnhan = '{hoDieuHoa.luuvuvid}'";
                            List<CustomReportViewModel> tuyenThoatNuocs = session.Query<CustomReportViewModel>(sqlSelectTuyen).ToList();
                            if (tuyenThoatNuocs.Count() > 0)
                            {
                                tieuChiBaoCaos.ForEach(tieuChiBaoCao =>
                                {
                                    // Layer? layer = session.Find<Layer>(stm => stm
                                    //     .Where($"{Sql.Entity<Layer>(x => x.table_info_id):TC} = {tieuChiBaoCao.tableGroupLevel.table_id}")
                                    //     .Include<TableInfo>(join => join.InnerJoin())
                                    //     .Include<TableColumn>(join => join.InnerJoin())
                                    //     .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                                    //).FirstOrDefault();
                                    TableInfo? table = getTableAndColumns(tieuChiBaoCao.tableGroupLevel.table_id.Value);
                                    var table_where_sql = new List<string> { "1=1" };
                                    var tuyenColumn = table.columns.Where(x => x.column_name.ToLower() == "matuyen").FirstOrDefault();
                                    if (tuyenColumn != null)
                                    {
                                        if (tuyenThoatNuocs != null && tuyenThoatNuocs.Count() > 0)
                                        {
                                            table_where_sql.Add($@"{table.table_schema}.{table.table_name}.{tuyenColumn.column_name} IN ({String.Join(", ", tuyenThoatNuocs.Select(x => $"'{x.matuyen}'"))})");
                                        }
                                        else
                                        {
                                            table_where_sql.Add($" 1 = 0");
                                        }
                                    }

                                    string table_select_sql = $@"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tieuChiBaoCao.tableGroupLevel.statistical_column}) AS {nameof(CustomReportViewModel.count)}, 
                                        '{hoDieuHoa.tenho}' AS {nameof(CustomReportViewModel.tenho)}, 
                                        '{table?.name_vn ?? "Không xác định"}' AS {nameof(CustomReportViewModel.table_name)}, '{table?.id}' AS {nameof(CustomReportViewModel.table_id)}";

                                    if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_1))
                                    {
                                        table_select_sql += $@", {table.table_schema}.{table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_1} AS {nameof(CustomReportViewModel.group_level_1)}";
                                    }
                                    else
                                    {
                                        table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_1)}";
                                    }
                                    table_select_sql += $@", '{tieuChiBaoCao.tableGroupLevel.unit}' AS {nameof(CustomReportViewModel.donvitinh)}";
                                    table_select_sql += $@" FROM {table.table_schema}.{table.table_name}
                                                WHERE {string.Join(" AND ", table_where_sql)}
                                                GROUP BY {nameof(CustomReportViewModel.tenho)}, {nameof(CustomReportViewModel.table_name)}, {nameof(CustomReportViewModel.group_level_1)}";

                                    sql_list.Add(table_select_sql);
                                });
                            }
                        }
                    }
                    if (sql_list.Count() > 0)
                    {
                        var sql = $"SELECT * FROM ({string.Join(" UNION ALL ", sql_list)}) AS report ORDER BY {nameof(CustomReportViewModel.tenho)}, {nameof(CustomReportViewModel.table_name)}, {nameof(CustomReportViewModel.group_level_1)}";
                        if (param.take > 0)
                        {
                            sql += $@" LIMIT {param.take} OFFSET {param.skip}";
                        }
                        totalCount = session.Query<int>($"SELECT COUNT(*) FROM ({string.Join(" UNION ALL ", sql_list)}) AS report").FirstOrDefault();
                        resultGroupByHo = session.Query<CustomReportViewModel>($"{sql}").ToList().GroupBy(x => x.tenho).ToList();
                        foreach (var hoGroup in resultGroupByHo)
                        {
                            var hoDieuHoa = hoDieuHoas.Where(x => x.tenho == hoGroup.FirstOrDefault().tenho).FirstOrDefault();
                            var tuyenColumn = tableTuyenThoatNuoc.columns.Where(x => x.column_name.ToLower().Contains("matuyen")).FirstOrDefault();
                            var tenTuyenColumn = tableTuyenThoatNuoc.columns.Where(x => x.column_name.ToLower().Contains("tentuyen")).FirstOrDefault();
                            var nguonTiepNhanColumn = tableTuyenThoatNuoc.columns.Where(x => x.column_name.ToLower().Contains("nguontiepnhan")).FirstOrDefault();
                            if (tuyenColumn != null && tenTuyenColumn != null && nguonTiepNhanColumn != null)
                            {
                                var sqlSelectTuyen = $@"SELECT tuyen.{tuyenColumn.column_name}, tuyen.{tenTuyenColumn.column_name} FROM {tableTuyenThoatNuoc.table_schema}.{tableTuyenThoatNuoc.table_name} tuyen WHERE tuyen.{nguonTiepNhanColumn.column_name} = '{hoDieuHoa.luuvuvid}'";
                                List<CustomReportViewModel> tuyenThoatNuocs = session.Query<CustomReportViewModel>(sqlSelectTuyen).ToList();


                                var groupByLayer = hoGroup.GroupBy(x => x.table_name).ToList();
                                List<ReportGroupViewModel> layerItems = new List<ReportGroupViewModel>();
                                foreach (var layerGroup in groupByLayer)
                                {
                                    if (!string.IsNullOrWhiteSpace(layerGroup.Key))
                                    {
                                        var tableId = layerGroup.FirstOrDefault().table_id;
                                        if (tableId.HasValue && tableId.Value > 0)
                                        {
                                            TableInfo? table = getTableAndColumns(tableId.Value);
                                            if (table != null)
                                            {
                                                var condition = new List<string> { "1=1" };
                                                var maTuyenColumn = table.columns.Where(x => x.column_name.ToLower().Contains("matuyen")).FirstOrDefault();
                                                if (maTuyenColumn != null && tuyenThoatNuocs != null && tuyenThoatNuocs.Count() > 0)
                                                {
                                                    condition.Add($@"(tb.{maTuyenColumn.column_name} IN ({String.Join(", ", tuyenThoatNuocs.Select(x => $"'{x.matuyen}'"))}))");
                                                }
                                                else
                                                {
                                                    condition.Add(@$"(1=0)");
                                                }
                                                ReportCriteria tieuChiBaoCao = tieuChiBaoCaos.Where(x => x.tableGroupLevel.table_id == table.id).FirstOrDefault();

                                                var group = new ReportGroupViewModel
                                                {
                                                    count = session.Query<double>(@$"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tieuChiBaoCao.tableGroupLevel.statistical_column}) FROM {table.table_schema}.{table.table_name} tb
                                            WHERE {string.Join(" AND ", condition)}").FirstOrDefault(),
                                                    key = layerGroup.Key != null ? layerGroup.Key : "Không xác định",
                                                    items = new List<ReportGroupViewModel>(),
                                                    unit = layerGroup.FirstOrDefault().donvitinh
                                                };
                                                var group_column_level1 = table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_1).FirstOrDefault();
                                                if (group_column_level1 != null)
                                                {
                                                    List<DomainViewModel> shortDataLevel1 = new List<DomainViewModel>();
                                                    if (group_column_level1.lookup_table_id > 0)
                                                    {
                                                        shortDataLevel1 = getTableShortData(group_column_level1.lookup_table_id).ToList();
                                                    }
                                                    var groupByPhanLoai = layerGroup.GroupBy(x => x.group_level_1).ToList();
                                                    foreach (var phanLoaiGroup in groupByPhanLoai)
                                                    {
                                                        var sql_where_phanloai = $"{string.Join(" AND ", condition)}";
                                                        var key = phanLoaiGroup.Key;
                                                        if (string.IsNullOrWhiteSpace(phanLoaiGroup.Key))
                                                        {
                                                            key = "Không xác định";
                                                            sql_where_phanloai += @$" AND (tb.{group_column_level1.column_name} = '' OR tb.{group_column_level1.column_name} IS NULL)";
                                                        }
                                                        else
                                                        {
                                                            if (shortDataLevel1.Count() > 0)
                                                            {
                                                                var classify = shortDataLevel1.Where(x => x.id.ToString() == phanLoaiGroup.Key).FirstOrDefault();
                                                                if (classify != null)
                                                                {
                                                                    key = classify.mo_ta;
                                                                }
                                                            }
                                                            sql_where_phanloai += $@" AND (tb.{group_column_level1.column_name} = '{phanLoaiGroup.Key}')";
                                                        }
                                                        var phanLoai = new ReportGroupViewModel
                                                        {
                                                            count = session.Query<double>(@$"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tieuChiBaoCao.tableGroupLevel.statistical_column}) FROM {table.table_schema}.{table.table_name} tb
                                                        WHERE {sql_where_phanloai}").FirstOrDefault(),
                                                            key = key,
                                                            unit = phanLoaiGroup.FirstOrDefault().donvitinh
                                                        };
                                                        group.items.Add(phanLoai);
                                                    }
                                                }

                                                layerItems.Add(group);
                                            }

                                        }
                                    }
                                }
                                data.Add(new ReportGroupViewModel
                                {
                                    count = 0,
                                    key = hoGroup.Key != null ? "Hồ: " + hoGroup.Key : "Không xác định" + "(" + tuyenThoatNuocs.Count() + "tuyến)",
                                    items = layerItems
                                });
                            }
                        }
                    }
                }
                return new ReportGroupDataViewModel
                {
                    data = data,
                    totalCount = totalCount
                };
            }
        }
        private ReportGroupDataViewModel getDataPhanLoaiCongThoatNuoc(CustomReportListDxDTO param)
        {
            using (var session = OpenSession())
            {
                int totalCount = 0;
                List<ReportGroupViewModel> data = new List<ReportGroupViewModel>();
                List<IGrouping<string?, CustomReportViewModel>> resultGroupByTuyen = new List<IGrouping<string?, CustomReportViewModel>>();
                var sql_list = new List<string>();
                var count_list = new List<string>();

                var tieuChiBaoCao = session.Find<ReportCriteria>(stm => stm
                   .Where($@"LOWER({Sql.Entity<ReportCriteria>(x => x.report_code):TC}) = '{param.reportType.ToLower()}'")
                   .Include<TableRelationGroupLevel>(x => x.LeftOuterJoin())
               ).FirstOrDefault();
                TableInfo? tableHoDieuHoa = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'tn_hodieuhoa'")
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();

                TableInfo? tableTuyenThoatNuoc = session.Find<TableInfo>(stm => stm
                    .Where($"LOWER({Sql.Entity<TableInfo>(x => x.table_name):TC}) = 'tn_tuyen'")
                    .Include<TableSchema>()
                    .Include<TableColumn>()
                ).FirstOrDefault();
                if (tableHoDieuHoa != null && tableTuyenThoatNuoc != null)
                {
                    var sql_where = new List<string> { "1=1" };
                    var sql_join = new List<string> { @$" LEFT OUTER JOIN {tableTuyenThoatNuoc.table_schema}.{tableTuyenThoatNuoc.table_name} tuyen ON ho.maho = tuyen.nguontiepnhan " };
                    sql_where.Add("ho.maho NOTNULL");
                    if (string.IsNullOrWhiteSpace(param.textSearch) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "search_content"))
                    {
                        sql_where.Add(@$"ho.search_content @@ to_tsquery('{param.textSearch.ToFullTextString()}')");
                    }
                    if (string.IsNullOrWhiteSpace(param.districtCode) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "district_code"))
                    {
                        sql_where.Add($"ho.district_code = '{param.districtCode}'");
                        sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = ho.district_code");
                    }
                    if (string.IsNullOrWhiteSpace(param.communeCode) == false && tableHoDieuHoa.columns.Any(x => x.column_name == "commune_code"))
                    {
                        sql_where.Add($"ho.commune_code = '{param.communeCode}'");
                        sql_join.Add($"LEFT OUTER JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = ho.commune_code");
                    }
                    var hoDieuHoaJoin = sql_join.Count > 0 ? string.Join(" ", sql_join) : "";
                    var sqlSelect = $@"SELECT ho.maho AS {nameof(CustomReportViewModel.luuvuvid)}, ho.tenho AS {nameof(CustomReportViewModel.tenho)}
                                    , tuyen.matuyen AS {nameof(CustomReportViewModel.matuyen)}, tuyen.tentuyen AS {nameof(CustomReportViewModel.tentuyen)}
                        FROM {tableHoDieuHoa.table_schema}.{tableHoDieuHoa.table_name} ho {hoDieuHoaJoin} WHERE {string.Join(" AND ", sql_where)}";
                    List<CustomReportViewModel> tuyenThoatNuocs = session.Query<CustomReportViewModel>(sqlSelect).ToList();


                    Layer? layer = session.Find<Layer>(stm => stm
                        .Where($"{Sql.Entity<Layer>(x => x.table_info_id):TC} = {tieuChiBaoCao.tableGroupLevel.table_id}")
                        .Include<TableInfo>(join => join.InnerJoin())
                        .Include<TableColumn>(join => join.InnerJoin())
                        .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                    ).FirstOrDefault();
                    var table_where_sql = new List<string> { "1=1" };
                    string table_select_sql = string.Empty;
                    var tuyenColumn = layer.table.columns.Where(x => x.column_name.ToLower() == "matuyen").FirstOrDefault();
                    table_select_sql = $@"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tieuChiBaoCao.tableGroupLevel.statistical_column}) AS {nameof(CustomReportViewModel.count)}";
                    if (tuyenColumn != null)
                    {
                        table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tuyenColumn.column_name} AS {nameof(CustomReportViewModel.matuyen)}";
                        if (tuyenThoatNuocs != null && tuyenThoatNuocs.Count() > 0)
                        {
                            table_where_sql.Add($"{layer.table.table_schema}.{layer.table.table_name}.{tuyenColumn.column_name} IN ({String.Join(", ", tuyenThoatNuocs.Select(x => $"'{x.matuyen}'"))})");
                        }
                        else
                        {
                            table_where_sql.Add($" 1 = 0");
                        }
                    }
                    else
                    {
                        table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.matuyen)}";
                    }
                    table_select_sql += $@", '{layer.name_vn}' AS {nameof(CustomReportViewModel.layer_name)}, '{layer.id}' AS {nameof(CustomReportViewModel.layer_id)}";
                    if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_1))
                    {
                        table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_1} AS {nameof(CustomReportViewModel.group_level_1)}";
                    }
                    else
                    {
                        table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_1)}";
                    }
                    if (!string.IsNullOrWhiteSpace(tieuChiBaoCao.tableGroupLevel.column_group_level_2))
                    {
                        table_select_sql += $@", {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_2} AS {nameof(CustomReportViewModel.group_level_2)}";
                    }
                    else
                    {
                        table_select_sql += $@", 'Không xác định' AS {nameof(CustomReportViewModel.group_level_2)}";
                    }
                    table_select_sql += $@", '{tieuChiBaoCao.tableGroupLevel.unit}' AS {nameof(CustomReportViewModel.donvitinh)}";
                    table_select_sql += $@" FROM {layer.table.table_schema}.{layer.table.table_name}
                                                WHERE {string.Join(" AND ", table_where_sql)}
                                                GROUP BY {nameof(CustomReportViewModel.matuyen)}, {nameof(CustomReportViewModel.group_level_1)}, {nameof(CustomReportViewModel.group_level_2)}
                                                ORDER BY {nameof(CustomReportViewModel.matuyen)}, {nameof(CustomReportViewModel.group_level_1)}, {nameof(CustomReportViewModel.group_level_2)}";

                    if (param.take > 0)
                    {
                        table_select_sql += $@" LIMIT {param.take} OFFSET {param.skip}";
                    }
                    totalCount = session.Query<int>(@$"SELECT COUNT(*) FROM {layer.table.table_schema}.{layer.table.table_name} 
                        WHERE {string.Join(" AND ", table_where_sql)} 
                        GROUP BY {nameof(CustomReportViewModel.matuyen)}, 
                            {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_1}, 
                            {layer.table.table_schema}.{layer.table.table_name}.{tieuChiBaoCao.tableGroupLevel.column_group_level_2}"
                    ).FirstOrDefault();
                    resultGroupByTuyen = session.Query<CustomReportViewModel>($"{table_select_sql}").ToList().GroupBy(x => x.matuyen).ToList();
                    foreach (var tuyenGroup in resultGroupByTuyen)
                    {
                        var condition = new List<string> { "1=1" };
                        if (string.IsNullOrWhiteSpace(tuyenGroup.Key))
                        {
                            condition.Add(@$"(tb.matuyen = '' OR tb.matuyen IS NULL)");
                        }
                        else
                        {
                            condition.Add($@"(tb.matuyen = '{tuyenGroup.Key}')");
                        }

                        List<ReportGroupViewModel> level1Items = new List<ReportGroupViewModel>();
                        var group_column_level1 = layer.table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_1).FirstOrDefault();
                        if (group_column_level1 != null)
                        {
                            var shortDataLevel1 = new List<DomainViewModel>();
                            if (group_column_level1.lookup_table_id > 0)
                            {
                                shortDataLevel1 = getTableShortData(group_column_level1.lookup_table_id).ToList();
                            }
                            var groupByLevel1 = tuyenGroup.GroupBy(x => x.group_level_1).ToList();
                            foreach (var groupLevel1 in groupByLevel1)
                            {
                                if (!string.IsNullOrWhiteSpace(groupLevel1.Key))
                                {
                                    var sql_where_level1 = $"{string.Join(" AND ", condition)}";
                                    var keyLevel1 = groupLevel1.Key;
                                    if (string.IsNullOrWhiteSpace(groupLevel1.Key))
                                    {
                                        keyLevel1 = "Không xác định";
                                        sql_where_level1 += @$" AND (tb.{group_column_level1.column_name} = '' OR tb.{group_column_level1.column_name} IS NULL)";
                                    }
                                    else
                                    {
                                        if (shortDataLevel1.Count() > 0)
                                        {
                                            var classify = shortDataLevel1.Where(x => x.id.ToString() == groupLevel1.Key).FirstOrDefault();
                                            if (classify != null)
                                            {
                                                keyLevel1 = classify.mo_ta;
                                            }
                                        }
                                        sql_where_level1 += $@" AND (tb.{group_column_level1.column_name} = '{groupLevel1.Key}')";
                                    }
                                    var group_column_level2 = layer.table.columns.Where(x => x.column_name == tieuChiBaoCao.tableGroupLevel.column_group_level_2).FirstOrDefault();
                                    if (group_column_level2 != null)
                                    {
                                        var shortDataLevel2 = new List<DomainViewModel>();
                                        if (group_column_level2.lookup_table_id > 0)
                                        {
                                            shortDataLevel2 = getTableShortData(group_column_level2.lookup_table_id).ToList();
                                        }
                                        var groupByLevel2 = groupLevel1.GroupBy(x => x.group_level_2).ToList();
                                        List<ReportGroupViewModel> level2Items = new List<ReportGroupViewModel>();
                                        foreach (var groupLevel2 in groupByLevel2)
                                        {
                                            var sql_where_level2 = sql_where_level1.Clone();
                                            var keyLevel2 = groupLevel2.Key;
                                            if (string.IsNullOrWhiteSpace(groupLevel2.Key))
                                            {
                                                keyLevel2 = "Không xác định";
                                                sql_where_level2 += @$" AND (tb.{group_column_level2.column_name} = '' OR tb.{group_column_level2.column_name} IS NULL)";
                                            }
                                            else
                                            {
                                                if (shortDataLevel2.Count() > 0)
                                                {
                                                    var classify = shortDataLevel2.Where(x => x.id.ToString() == groupLevel2.Key).FirstOrDefault();
                                                    if (classify != null)
                                                    {
                                                        keyLevel2 = classify.mo_ta;
                                                    }
                                                }
                                                sql_where_level2 += $@" AND (tb.{group_column_level2.column_name} = '{groupLevel2.Key}')";
                                            }
                                            level2Items.Add(new ReportGroupViewModel
                                            {
                                                count = session.Query<double>(@$"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tieuChiBaoCao.tableGroupLevel.statistical_column}) FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                                    WHERE {sql_where_level2}").FirstOrDefault(),
                                                key = keyLevel2,
                                                unit = groupLevel2.FirstOrDefault().donvitinh
                                            });
                                        }
                                        level1Items.Add(new ReportGroupViewModel
                                        {
                                            count = session.Query<double>(@$"SELECT {tieuChiBaoCao.tableGroupLevel.statistical_type}({tieuChiBaoCao.tableGroupLevel.statistical_column}) FROM {layer.table.table_schema}.{layer.table.table_name} tb
                                            WHERE {sql_where_level1}").FirstOrDefault(),
                                            key = keyLevel1,
                                            items = level2Items,
                                            unit = groupLevel1.FirstOrDefault().donvitinh
                                        });
                                    }
                                }
                            }

                        }
                        string tenTuyen = "Không xác định";
                        if (!String.IsNullOrWhiteSpace(tuyenGroup.Key))
                        {
                            tenTuyen = tuyenThoatNuocs.Where(x => x.matuyen == tuyenGroup.Key).FirstOrDefault()?.tentuyen;
                        }
                        data.Add(new ReportGroupViewModel
                        {
                            count = 0,
                            key = tenTuyen,
                            items = level1Items
                        });
                    }
                }
                return new ReportGroupDataViewModel
                {
                    data = data,
                    totalCount = totalCount
                };
            }
        }
    }
}
