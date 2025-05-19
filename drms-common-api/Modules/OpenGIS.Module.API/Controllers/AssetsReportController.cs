using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/assets-report")]
    public class AssetsReportController : BaseController
    {
        public AssetsReportController(IDbFactory dbFactory)
            : base(dbFactory)
        {
        }
        [HttpPost("list-data")]
        public RestData ListData(AssetsReportViewModel @param)
        {
            using (var session = OpenSession())
            {
                string condition = "(1=1)";
                if (@param.ngay_batdau != null)
                {
                    condition += $" AND {Sql.Entity<TuyNenKyThuat>(x => x.ngaycapnhat)} >= @ngay_batdau";
                }

                if (@param.ngay_ketthuc != null)
                {
                    condition += $" AND {Sql.Entity<TuyNenKyThuat>(x => x.ngaycapnhat)} <= @ngay_ketthuc";
                }

                int skip = @param.pageSize * (@param.pageIndex - 1);
                var dataTuyNenKyThuat = session.Find<TuyNenKyThuat>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@param)
                    .OrderBy($"{Sql.Entity<TuyNenKyThuat>(x => x.objectid):TC} ASC")
                ).Skip(skip).Take(@param.pageSize).ToList();

                var districts = new List<District>();
                var communes = new List<Commune>();
                var hienTrangs = new List<string>();
                if (dataTuyNenKyThuat.Count() > 0)
                {
                    districts = session.Find<District>(statement => statement
                       .Where($"{Sql.Entity<District>(x => x.area_id):TC} = ANY(@districtIds)")
                       .WithParameters(new { districtIds = dataTuyNenKyThuat.Select(x => x.district_code).ToArray() })
                       .OrderBy($"{Sql.Entity<District>(x => x.area_id):TC} ASC")
                   ).ToList();

                    communes = session.Find<Commune>(statement => statement
                       .Where($"{Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@communeIds)")
                       .WithParameters(new { communeIds = dataTuyNenKyThuat?.Select(x => x.commune_code).ToArray() })
                       .OrderBy($"{Sql.Entity<Commune>(x => x.area_id):TC} ASC")
                   ).ToList();

                    hienTrangs = dataTuyNenKyThuat.Select(x => x.hientrangid).Distinct().ToList();
                };

                var datas = new List<AssetsReportDistrictViewModal>();
                if (districts.Count() > 0)
                {
                    int sttLetter = 0;
                    foreach (var district in districts)
                    {
                        var districtDatas = new AssetsReportDistrictViewModal();
                        districtDatas.stt = ToLetter(sttLetter++);
                        districtDatas.area_id = district.area_id;
                        districtDatas.name_vn = district.name_vn;

                        int sttRoman = 1;
                        var communeDatas = new List<AssetsReportCommuneViewModal>();
                        foreach (var commune in communes.Where(x => x.parent_id == district.area_id))
                        {
                            var communeData = new AssetsReportCommuneViewModal();
                            communeData.stt = ToRoman(sttRoman++);
                            communeData.area_id = commune.area_id;
                            communeData.name_vn = commune.name_vn;
                            var hienTrangData = new List<AssetsReportStatusViewModal>();
                            var sttLetterLower = 0;
                            foreach (var hienTrang in hienTrangs)
                            {
                                hienTrangData.Add(new AssetsReportStatusViewModal
                                {
                                    stt = ToLetter(sttLetterLower++).ToLower(),
                                    hientrangid = hienTrang,
                                    datas = dataTuyNenKyThuat.Where(x => x.district_code == district.area_id && x.commune_code == commune.area_id && x.hientrangid == hienTrang).ToList(),
                                });
                            }
                            communeData.hienTrangs = hienTrangData;
                            communeDatas.Add(communeData);
                        }
                        districtDatas.communes = communeDatas;
                        datas.Add(districtDatas);
                    }
                };

                return new RestData()
                {
                    data = datas
                };
            }
        }

        [HttpPost("export")]
        public IActionResult ExportExcel(AssetsReportViewModel @param)
        {
            using (var session = OpenSession())
            {
                string condition = "(1=1)";
                if (@param.ngay_batdau != null)
                {
                    condition += $" AND {Sql.Entity<TuyNenKyThuat>(x => x.ngaycapnhat)} >= @ngay_batdau";
                }

                if (@param.ngay_ketthuc != null)
                {
                    condition += $" AND {Sql.Entity<TuyNenKyThuat>(x => x.ngaycapnhat)} <= @ngay_ketthuc";
                }

                var data = session.Find<TuyNenKyThuat>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@param)
                ).ToList();

                var districts = new List<District>();
                var communes = new List<Commune>();
                var hienTrangs = new List<string>();
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

                    hienTrangs = data.Select(x => x.hientrangid).Distinct().ToList();
                };

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (var package = new ExcelPackage())
                {
                    ExcelWorksheet sheet;
                    ExcelRange cell;
                    string cellMerge;
                    ExcelRange range;
                    sheet = package.Workbook.Worksheets.Add("BÁO CÁO TĂNG, GIẢM TÀI SẢN");

                    cell = sheet.Cells[1, 1];
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "BÁO CÁO TĂNG, GIẢM TÀI SẢN";

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
                        cell.Value = "Mã trạm xử lý";
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
                        cell.Value = "kích thước";
                        sheet.Columns[4].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 5];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Ngày vận hành";
                        sheet.Columns[5].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 6];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Dơn vị vận hành";
                        sheet.Columns[6].Width = 30;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 7];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Dung lượng thiết kế";
                        sheet.Columns[7].Width = 30;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 8];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Cao độ đáy";
                        sheet.Columns[8].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 9];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Cao độ đỉnh";
                        sheet.Columns[9].Width = 20;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                        cell = sheet.Cells[row, 10];
                        cell.Style.Font.Size = 11;
                        cell.Style.Font.Name = "Times New Roman";
                        cell.Style.WrapText = true;
                        cell.Value = "Mã đơn vị quản lý";
                        sheet.Columns[9].Width = 40;
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);
                    }


                    if (data.Count > 0)
                    {
                        int rowIndex = 4;

                        int sttLetter = 0;
                        foreach (var district in districts)
                        {
                            cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 10];
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

                                    cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 10];
                                    range = sheet.Cells[cellMerge];
                                    range.Style.Font.Name = "Times New Roman";
                                    range.Style.Font.Size = 11;
                                    range.Merge = true;
                                    range.Value = ToRoman(sttRoman++) + "." + commune.name_vn;
                                    OfficeHelper.setStyle(ref range,
                                                    EnumFormat.BORDER | EnumFormat.MIDDLE);

                                    sheet.Rows[rowIndex].Height = 25;
                                    rowIndex++;
                                    var sttLetterLower = 0;
                                    foreach (var hienTrang in hienTrangs)
                                    {
                                        cellMerge = sheet.Cells[rowIndex, 1] + ":" + sheet.Cells[rowIndex, 10];
                                        range = sheet.Cells[cellMerge];
                                        range.Style.Font.Name = "Times New Roman";
                                        range.Style.Font.Size = 11;
                                        range.Merge = true;
                                        range.Value = ToLetter(sttLetterLower++).ToLower() + "." + hienTrang;
                                        OfficeHelper.setStyle(ref range,
                                                        EnumFormat.BORDER | EnumFormat.MIDDLE);

                                        sheet.Rows[rowIndex].Height = 25;
                                        rowIndex++;
                                        var dataGroupHienTrang = data.Where(x => x.district_code == district.area_id && x.commune_code == commune.area_id && x.hientrangid == hienTrang).ToList();
                                        if (dataGroupHienTrang.Count() > 0)
                                        {
                                            int stt = 1;
                                            if (data.Count() > 0)
                                            {
                                                foreach (var item in dataGroupHienTrang)
                                                {
                                                    int col = 1;
                                                    cell = sheet.Cells[rowIndex, col++];
                                                    cell.Style.WrapText = true;
                                                    cell.Value = stt++;
                                                    OfficeHelper.setStyle(ref cell,
                                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                                    cell = sheet.Cells[rowIndex, col++];
                                                    cell.Value = item.matuynen;
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
                                                    cell.Value = item.kichthuoc;
                                                    cell.Style.WrapText = true;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Style.Font.Size = 11;
                                                    OfficeHelper.setStyle(ref cell,
                                                            EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                                    cell = sheet.Cells[rowIndex, col++];
                                                    cell.Value = item.ngayvanhanh?.ToString("dd/MM/yyyy") ?? "-";
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Style.Font.Size = 11;
                                                    OfficeHelper.setStyle(ref cell,
                                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                                                    cell = sheet.Cells[rowIndex, col++];
                                                    cell.Value = item.donvivanhanh;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Style.Font.Size = 11;
                                                    OfficeHelper.setStyle(ref cell,
                                                            EnumFormat.BORDER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                                    cell = sheet.Cells[rowIndex, col++];
                                                    cell.Value = item.dungluongthietke;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Style.Font.Size = 11;
                                                    OfficeHelper.setStyle(ref cell,
                                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                                    cell = sheet.Cells[rowIndex, col++];
                                                    cell.Value = item.caododay;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Style.Font.Size = 11;
                                                    OfficeHelper.setStyle(ref cell,
                                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                                    cell = sheet.Cells[rowIndex, col++];
                                                    cell.Value = item.caododinh;
                                                    cell.Style.Font.Name = "Times New Roman";
                                                    cell.Style.Font.Size = 11;
                                                    OfficeHelper.setStyle(ref cell,
                                                            EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.MIDDLE);

                                                    cell = sheet.Cells[rowIndex, col++];
                                                    cell.Value = item.donviquanlyid;
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
                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BaoCaoTangGiamTaiSan.xlsx");
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
