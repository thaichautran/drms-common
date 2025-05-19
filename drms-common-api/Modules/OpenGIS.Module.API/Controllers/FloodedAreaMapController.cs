using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models.Entities.Category;
using OpenGIS.Module.Core.Models.Entities.ThoatNuoc;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/vi-tri-ngap-ung")]
    public class FloodedAreaMapController : BaseController
    {
        public FloodedAreaMapController(IDbFactory dbFactory)
            : base(dbFactory)
        {
        }
        [HttpPost("report/list-data")]
        public RestBase ListData(FloodedLocationViewModel @param)
        {
            switch (@param?.type)
            {
                case EnumFloodedLocation.HANHCHINH:
                    {
                        return FloodedLocationByArea(@param);
                    }
                // case EnumFloodedLocation.PHANLOAI:
                //     {
                //         return FloodedLocationByArea(@param);
                //     }
                // case EnumFloodedLocation.TINHTRANG:
                //     {
                //         return FloodedLocationByArea(@param);
                //     }
                // case EnumFloodedLocation.THOIGIAN:
                //     {
                //         return FloodedLocationByArea(@param);
                //     }
                default:
                    return FloodedLocationData(@param);
            }
        }

        private RestBase FloodedLocationData(FloodedLocationViewModel @param)
        {
            using (var session = OpenSession())
            {
                string condition = "(1=1)";
                if (!String.IsNullOrEmpty(@param?.district_code))
                {
                    condition += $" AND {Sql.Entity<ViTriNgapUng>(x => x.district_code):TC} = @district_code";
                };
                if (!String.IsNullOrEmpty(@param?.commune_code))
                {
                    condition += $" AND {Sql.Entity<ViTriNgapUng>(x => x.commune_code):TC} = @commune_code";
                };
                string order;
                switch (@param?.type)
                {
                    case EnumFloodedLocation.PHANLOAI:
                        order = $"{Sql.Entity<ViTriNgapUng>(x => x.phanloaiid):TC}";
                        break;
                    case EnumFloodedLocation.TINHTRANG:
                        order = $"{Sql.Entity<ViTriNgapUng>(x => x.tinhtrang_id):TC}";
                        break;
                    case EnumFloodedLocation.THOIGIAN:
                        order = $"EXTRACT (YEAR FROM {Sql.Entity<ViTriNgapUng>(x => x.ngaycapnhat):TC}) DESC";
                        break;
                    default:
                        order = $"{Sql.Entity<ViTriNgapUng>(x => x.id):TC}";
                        break;
                }
                int skip = @param.pageSize * (@param.pageIndex - 1);
                var data = session.Find<ViTriNgapUng>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@param)
                    .Include<PhanLoaiNgapLut>(x => x.LeftOuterJoin())
                    .Include<TinhTrangNgapLut>(x => x.LeftOuterJoin())
                    .OrderBy($"{order}")
                    .Skip(skip).Top(@param.pageSize)
                ).ToList();
                var totalCount = session.Count<ViTriNgapUng>(stm => stm
                                    .Where($"{condition}")
                                    .WithParameters(@param));
                switch (@param?.type)
                {
                    case EnumFloodedLocation.PHANLOAI:
                        return new RestPagedDataTable
                        {
                            data = data.GroupBy(x => x.phanLoai?.mo_ta).Select(x => new
                            {
                                key = x.Key,
                                items = x
                            }),
                            recordsTotal = totalCount
                        };
                    case EnumFloodedLocation.TINHTRANG:
                        return new RestPagedDataTable
                        {
                            data = data.GroupBy(x => x.tinhTrang?.mo_ta).Select(x => new
                            {
                                key = x.Key,
                                items = x
                            }),
                            recordsTotal = totalCount
                        };
                    case EnumFloodedLocation.THOIGIAN:
                        return new RestPagedDataTable
                        {
                            data = data.GroupBy(x => x.namcapnhat).Select(x => new
                            {
                                key = x.Key,
                                items = x
                            }),
                            recordsTotal = totalCount
                        };
                    default:
                        return new RestPagedDataTable
                        {
                            data = data,
                            recordsTotal = totalCount
                        };
                }
            }
        }
        private RestBase FloodedLocationByArea(FloodedLocationViewModel @param)
        {
            using (var session = OpenSession())
            {
                string condition = "(1=1)";
                if (!String.IsNullOrEmpty(@param?.district_code))
                {
                    condition += $" AND {Sql.Entity<ViTriNgapUng>(x => x.district_code):TC} = @district_code";
                };
                if (!String.IsNullOrEmpty(@param?.commune_code))
                {
                    condition += $" AND {Sql.Entity<ViTriNgapUng>(x => x.commune_code):TC} = @commune_code";
                };

                int skip = @param.pageSize * (@param.pageIndex - 1);
                var dataDiemNgapUng = session.Find<ViTriNgapUng>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@param)
                    .Include<PhanLoaiNgapLut>()
                    .Include<TinhTrangNgapLut>()
                    .OrderBy($"{Sql.Entity<ViTriNgapUng>(x => x.id):TC} ASC")
                ).Skip(skip).Take(@param.pageSize).ToList();

                var districts = new List<District>();
                var communes = new List<Commune>();
                if (dataDiemNgapUng.Count() > 0)
                {
                    districts = session.Find<District>(statement => statement
                       .Where($"{Sql.Entity<District>(x => x.area_id):TC} = ANY(@districtIds)")
                       .WithParameters(new { districtIds = dataDiemNgapUng.Select(x => x.district_code).ToArray() })
                       .OrderBy($"{Sql.Entity<District>(x => x.area_id):TC} ASC")
                   ).ToList();

                    communes = session.Find<Commune>(statement => statement
                       .Where($"{Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@communeIds)")
                       .WithParameters(new { communeIds = dataDiemNgapUng?.Select(x => x.commune_code).ToArray() })
                       .OrderBy($"{Sql.Entity<Commune>(x => x.area_id):TC} ASC")
                   ).ToList();
                };

                var datas = new List<FloodedLocationByDistrictViewModel>();
                if (districts.Count() > 0)
                {
                    int sttLetter = 0;
                    foreach (var district in districts)
                    {
                        var districtDatas = new FloodedLocationByDistrictViewModel();
                        districtDatas.stt = ToLetter(sttLetter++);
                        districtDatas.area_id = district.area_id;
                        districtDatas.name_vn = district.name_vn;

                        int sttRoman = 1;
                        var communeDatas = new List<FloodedLocationByCommuneViewModel>();
                        foreach (var commune in communes.Where(x => x.parent_id == district.area_id))
                        {
                            var communeData = new FloodedLocationByCommuneViewModel();
                            communeData.stt = ToRoman(sttRoman++);
                            communeData.area_id = commune.area_id;
                            communeData.name_vn = commune.name_vn;
                            communeData.datas = dataDiemNgapUng.Where(x => x.commune_code == commune.area_id && x.district_code == district.area_id).ToList();
                            communeDatas.Add(communeData);
                        }
                        districtDatas.communes = communeDatas;
                        datas.Add(districtDatas);
                    }
                };

                return new RestPagedDataTable
                {
                    data = datas
                };
            }
        }

        [HttpPost("report/export")]
        public IActionResult ExportExcel(FloodedLocationViewModel @param)
        {
            switch (@param?.type)
            {
                case EnumFloodedLocation.HANHCHINH:
                    {
                        return FloodedLocationByAreaExcel(@param);
                    }
                default:
                    return FloodedLocationReportExcel(@param);
            }
        }

        private IActionResult FloodedLocationByAreaExcel(FloodedLocationViewModel @param)
        {
            using (var session = OpenSession())
            {
                string condition = "(1=1)";
                if (!String.IsNullOrEmpty(@param?.district_code))
                {
                    condition += $" AND {Sql.Entity<ViTriNgapUng>(x => x.district_code):TC} = @district_code";
                };
                if (!String.IsNullOrEmpty(@param?.commune_code))
                {
                    condition += $" AND {Sql.Entity<ViTriNgapUng>(x => x.commune_code):TC} = @commune_code";
                };

                var data = session.Find<ViTriNgapUng>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@param)
                    .Include<PhanLoaiNgapLut>()
                    .Include<TinhTrangNgapLut>()
                ).ToList();

                var districts = new List<District>();
                var communes = new List<Commune>();
                if (data.Count() > 0)
                {
                    districts = session.Find<District>(statement => statement
                       .Where($"{Sql.Entity<District>(x => x.area_id):TC} = ANY(@districtIds)")
                       .WithParameters(new { districtIds = data.Select(x => x.district_code).ToArray() })
                   ).ToList();

                    communes = session.Find<Commune>(statement => statement
                       .Where($"{Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@communeIds)")
                       .WithParameters(new { communeIds = data?.Select(x => x.commune_code).ToArray() })
                   ).ToList();
                };

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;
                    sheet = package.Workbook.Worksheets.Add("BÁO CÁO NGẬP ÚNG/NGẬP LỤT THEO ĐƠN VỊ HÀNH CHÍNH");

                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "BÁO CÁO NGẬP ÚNG/NGẬP LỤT THEO ĐƠN VỊ HÀNH CHÍNH";

                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 9];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    cell = sheet.Cells[2, 1];
                    cell.Style.Font.Size = 12;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = $"(Tổng số: {data.Count()} bản ghi)";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    cellMerge = sheet.Cells[2, 1] + ":" + sheet.Cells[2, 9];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    //TITLE
                    int row = 3;
                    sheet.Rows[row].Height = 25;
                    {
                        cell = sheet.Cells[row, 1];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "STT";
                        sheet.Columns[1].Width = 10;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 2];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Tên vùng ngập lụt";
                        sheet.Columns[2].Width = 30;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 3];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Địa chỉ";
                        sheet.Columns[3].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 4];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Thời gian ngập";
                        sheet.Columns[4].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 5];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Kịch bản ngập";
                        sheet.Columns[5].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 6];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Diện tích (m2)";
                        sheet.Columns[6].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 7];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Lượng mưa (m3)";
                        sheet.Columns[7].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 8];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Độ sâu";
                        sheet.Columns[8].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 9];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Số hiệu đường";
                        sheet.Columns[9].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    }


                    if (data.Count > 0)
                    {
                        int rowIndex = 4;

                        int sttLetter = 0;
                        foreach (var district in districts)
                        {
                            cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 9];
                            range = sheet.Cells[cellMerge];
                            range.Style.Font.Name = "Times New Roman";
                            range.Style.Font.Size = 11;
                            range.Merge = true;
                            range.Value = ToLetter(sttLetter++) + "." + district.name_vn;
                            OfficeHelper.setStyle(ref range,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                            range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                            range.Style.Fill.BackgroundColor.SetColor(ColorTranslator.FromHtml("#A2C493"));

                            sheet.Rows[rowIndex].Height = 25;
                            rowIndex++;

                            if (communes.Count() > 0)
                            {
                                int sttRoman = 1;
                                foreach (var commune in communes.Where(x => x.parent_id == district.area_id))
                                {
                                    cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 9];
                                    range = sheet.Cells[cellMerge];
                                    range.Style.Font.Name = "Times New Roman";
                                    range.Style.Font.Size = 11;
                                    range.Merge = true;
                                    range.Value = ToRoman(sttRoman++) + "." + commune.name_vn;
                                    OfficeHelper.setStyle(ref range,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    sheet.Rows[rowIndex].Height = 25;
                                    rowIndex++;
                                    int stt = 1;
                                    if (data.Count() > 0)
                                    {
                                        foreach (var item in data.Where(x => x.commune_code == commune.area_id))
                                        {
                                            int col = 1;
                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Style.WrapText = true;
                                            cell.Value = stt++;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Value = item.tendiem;
                                            cell.Style.WrapText = true;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER_RIGHT | EnumFormat.MIDDLE | EnumFormat.MIDDLE | EnumFormat.MIDDLE);
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER_BOTTOM);

                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Value = item.diachi;
                                            cell.Style.WrapText = true;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Value = item.ngaycapnhat?.ToString("dd/MM/yyyy") ?? "-";
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Value = item.kichbanngap;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Value = item.dientichvungngap;
                                            cell.Style.Numberformat.Format = "#,##";
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Value = item.luongmua;
                                            cell.Style.Numberformat.Format = "#,##";
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Value = item.dosaungap;
                                            cell.Style.Numberformat.Format = "#,##";
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            cell = sheet.Cells[rowIndex, col++];
                                            cell.Value = item.sohieuduong;
                                            cell.Style.Font.Name = "Times New Roman";
                                            cell.Style.Font.Size = 11;
                                            OfficeHelper.setStyle(ref cell,
                                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                            rowIndex++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BaoCaoNhapUngNgapLutTheoDonViHanhChinh.xlsx");
                }
            }
        }
        private IActionResult FloodedLocationReportExcel(FloodedLocationViewModel @param)
        {
            using (var session = OpenSession())
            {
                string condition = "(1=1)";
                if (!String.IsNullOrEmpty(@param?.district_code))
                {
                    condition += $" AND {Sql.Entity<ViTriNgapUng>(x => x.district_code):TC} = @district_code";
                };
                if (!String.IsNullOrEmpty(@param?.commune_code))
                {
                    condition += $" AND {Sql.Entity<ViTriNgapUng>(x => x.commune_code):TC} = @commune_code";
                };

                var data = session.Find<ViTriNgapUng>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@param)
                    .Include<PhanLoaiNgapLut>(x => x.LeftOuterJoin())
                    .Include<TinhTrangNgapLut>(x => x.LeftOuterJoin())
                ).ToList();
                var reportData = new List<IGrouping<string?, ViTriNgapUng>>();
                var title = "";
                switch (@param?.type)
                {
                    case EnumFloodedLocation.PHANLOAI:
                        reportData = data.GroupBy(x => x.phanLoai?.mo_ta).ToList();
                        title = "BÁO CÁO NGẬP LỤT THEO LOẠI";
                        break;
                    case EnumFloodedLocation.TINHTRANG:
                        reportData = data.GroupBy(x => x.tinhTrang?.mo_ta).ToList();
                        title = "BÁO CÁO NGẬP LỤT THEO TÌNH TRẠNG";
                        break;
                    case EnumFloodedLocation.THOIGIAN:
                        title = "BÁO CÁO NGẬP LỤT THỜI GIAN";
                        reportData = data.GroupBy(x => x.namcapnhat).ToList();
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

                    cellMerge = sheet.Cells[1, 1] + ":" + sheet.Cells[1, 9];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    cell = sheet.Cells[2, 1];
                    cell.Style.Font.Size = 12;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = $"(Tổng số: {data.Count()} bản ghi)";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    cellMerge = sheet.Cells[2, 1] + ":" + sheet.Cells[2, 9];
                    range = sheet.Cells[cellMerge];
                    range.Merge = true;

                    //TITLE
                    int row = 3;
                    sheet.Rows[row].Height = 25;
                    {
                        cell = sheet.Cells[row, 1];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "STT";
                        sheet.Columns[1].Width = 10;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 2];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Tên vùng ngập lụt";
                        sheet.Columns[2].Width = 30;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 3];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Địa chỉ";
                        sheet.Columns[3].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 4];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Thời gian ngập";
                        sheet.Columns[4].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 5];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Kịch bản ngập";
                        sheet.Columns[5].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 6];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Diện tích (m2)";
                        sheet.Columns[6].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 7];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Lượng mưa (m3)";
                        sheet.Columns[7].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 8];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Độ sâu";
                        sheet.Columns[8].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 9];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Số hiệu đường";
                        sheet.Columns[9].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    }


                    if (reportData.Count > 0)
                    {
                        int rowIndex = 4;

                        int sttLetter = 0;
                        foreach (var grouped in reportData)
                        {
                            int col = 1;
                            cell = sheet.Cells[rowIndex, col, rowIndex, 10];
                            cell.Style.WrapText = true;
                            cell.Merge = true;
                            cell.Value = grouped.Key;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.BOLD | EnumFormat.MIDDLE);
                            rowIndex++;
                            foreach (var item in grouped)
                            {
                                col = 1;
                                cell = sheet.Cells[rowIndex, col++];
                                cell.Style.WrapText = true;
                                cell.Value = ++sttLetter;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                cell = sheet.Cells[rowIndex, col++];
                                cell.Value = item.tendiem;
                                cell.Style.WrapText = true;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER_RIGHT | EnumFormat.MIDDLE | EnumFormat.MIDDLE | EnumFormat.MIDDLE);
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER_BOTTOM);

                                cell = sheet.Cells[rowIndex, col++];
                                cell.Value = item.diachi;
                                cell.Style.WrapText = true;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                cell = sheet.Cells[rowIndex, col++];
                                cell.Value = item.ngaycapnhat?.ToString("dd/MM/yyyy") ?? "-";
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                cell = sheet.Cells[rowIndex, col++];
                                cell.Value = item.kichbanngap;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                cell = sheet.Cells[rowIndex, col++];
                                cell.Value = item.dientichvungngap;
                                cell.Style.Numberformat.Format = "#,##";
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                cell = sheet.Cells[rowIndex, col++];
                                cell.Value = item.luongmua;
                                cell.Style.Numberformat.Format = "#,##";
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                cell = sheet.Cells[rowIndex, col++];
                                cell.Value = item.dosaungap;
                                cell.Style.Numberformat.Format = "#,##";
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                cell = sheet.Cells[rowIndex, col++];
                                cell.Value = item.sohieuduong;
                                cell.Style.Font.Name = "Times New Roman";
                                cell.Style.Font.Size = 11;
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                rowIndex++;
                            }
                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BaoCaoNhapUngNgapLut.xlsx");
                }
            }
        }

        /// <summary>
        /// Convert number to Roman
        /// </summary>
        /// <param name="number">Number</param>
        /// <returns>Roman</returns>
        private static string ToRoman(int number)
        {
            if ((number < 0) || (number > 3999)) throw new ArgumentOutOfRangeException(nameof(number), "insert value between 1 and 3999");
            if (number < 1) return string.Empty;
            if (number >= 1000) return "M" + ToRoman(number - 1000);
            if (number >= 900) return "CM" + ToRoman(number - 900);
            if (number >= 500) return "D" + ToRoman(number - 500);
            if (number >= 400) return "CD" + ToRoman(number - 400);
            if (number >= 100) return "C" + ToRoman(number - 100);
            if (number >= 90) return "XC" + ToRoman(number - 90);
            if (number >= 50) return "L" + ToRoman(number - 50);
            if (number >= 40) return "XL" + ToRoman(number - 40);
            if (number >= 10) return "X" + ToRoman(number - 10);
            if (number >= 9) return "IX" + ToRoman(number - 9);
            if (number >= 5) return "V" + ToRoman(number - 5);
            if (number >= 4) return "IV" + ToRoman(number - 4);
            if (number >= 1) return "I" + ToRoman(number - 1);
            return string.Empty;
        }
        /// <summary>
        /// Convert number to letter
        /// </summary>
        /// <param name="index">index</param>
        /// <returns>letter</returns>
        private string ToLetter(int index)
        {
            const string letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

            var value = String.Empty;
            if (index >= letters.Length)
                value += letters[index / letters.Length - 1];
            value += letters[index % letters.Length];
            return value;
        }
    }
}
