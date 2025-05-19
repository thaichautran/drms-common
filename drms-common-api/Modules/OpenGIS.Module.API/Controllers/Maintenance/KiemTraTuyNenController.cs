using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Extensions;
using OpenGIS.Module.Core.Models.DTO;
using OpenGIS.Module.Core.Models.Entities.Category;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.Models.Entities.Maintenance.TuyNen;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Identity.Services;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Controllers.Maintenance
{
    [Route("api/tuy-nen/kiem-tra")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    public class KiemTraTuyNenController : BaseController
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IEmailSender _emailSender;
        private readonly IWorkContext _workContext;
        public KiemTraTuyNenController(
            IDbFactory dbFactory,
            IWebHostEnvironment webHostEnvironment,
            IEmailSender emailSender,
            IWorkContext workContext
        ) : base(dbFactory)
        {
            _webHostEnvironment = webHostEnvironment;
            _emailSender = emailSender;
            _workContext = workContext;
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] KiemTraListDxDTO? dto)
        {
            if (dto == null)
            {
                return new RestError
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Lỗi tham số!" }
                    }
                };
            }
            using (var session = OpenSession())
            {
                List<PhieuGiamSatKiemTraTuyNen> data = new List<PhieuGiamSatKiemTraTuyNen>();
                string condition = "1=1";
                if (dto.phuongthuckiemtraid.HasValue && dto.phuongthuckiemtraid.Value > 0)
                {
                    condition += $" AND {Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.phuongthuckiemtraid):TC} = @phuongthuckiemtraid";
                }
                if (dto.congcukiemtraid.HasValue && dto.congcukiemtraid.Value > 0)
                {
                    condition += $" AND {Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.congcukiemtraid):TC} = @congcukiemtraid";
                }
                if (dto.table_id.HasValue && dto.table_id.Value > 0)
                {
                    condition += $" AND {Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.id):TC} IN (SELECT {Sql.Entity<KiemTraBaoDuongCongTrinh>(x => x.phieugiamsat_id):TC} FROM {Sql.Entity<KiemTraBaoDuongCongTrinh>():T} WHERE {Sql.Entity<KiemTraBaoDuongCongTrinh>(x => x.table_id):TC} = @table_id)";
                }
                if (dto.isCompleted.HasValue && dto.isCompleted.Value == false)
                {
                    dto.thoigian = DateTime.Now.Date;
                    condition += $" AND DATE({Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.ngaythuchien):TC}) >= @thoigian";
                }
                if (dto.take == 0)
                {
                    data = (await session.FindAsync<PhieuGiamSatKiemTraTuyNen>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .OrderBy($"{Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.ngaythuchien):TC} DESC")
                    )).ToList();
                }
                else
                {
                    data = (await session.FindAsync<PhieuGiamSatKiemTraTuyNen>(stm => stm.Where($"{condition}")
                        .WithParameters(dto)
                        .OrderBy($"{Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.ngaythuchien):TC} DESC")
                   )).Skip(dto.skip).Take(dto.take).ToList();
                }
                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = await session.CountAsync<PhieuGiamSatKiemTraTuyNen>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto))
                };
            }
        }
        [HttpPost("notify")]
        public async Task<RestBase> NotifyAsync([FromQuery] bool isCreated, [FromBody] PhieuGiamSatKiemTraTuyNen item)
        {
            using (var session = OpenSession())
            {
                if (item.giaoViecNhanViens != null && item.giaoViecNhanViens.Count() > 0)
                {
                    var listNhanVien = session.Find<NhanVien>(x => x
                    .Where($"{Sql.Entity<NhanVien>(x => x.id):TC} = ANY(@listIds) AND {Sql.Entity<NhanVien>(x => x.email):TC} is not null")
                    .WithParameters(new { listIds = item.giaoViecNhanViens.Select(x => x.nhanvien_id).ToArray() }));
                    foreach (var nhanVien in listNhanVien)
                    {
                        if (!string.IsNullOrWhiteSpace(nhanVien.email))
                        {
                            await _emailSender.SendEmailAsync(nhanVien.email, "Thông báo có công việc " + (isCreated ? "mới" : "được cập nhật"), "Thông báo có công việc vận hành bảo dưỡng " + (isCreated ? "mới" : "được cập nhật"), GlobalConfiguration.ApplicationName);
                        }
                    }
                    var result = await _workContext.SendNotification(new PushNotificationViewModel
                    {
                        content = "Thông báo có công việc vận hành bảo dưỡng " + (isCreated ? "mới" : "được cập nhật"),
                        user_id = new List<string>(),
                        title = "Thông báo có công việc " + (isCreated ? "mới" : "được cập nhật")
                    });
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }
        [HttpPost("save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_WORKER))]
        public async Task<RestBase> save([FromBody] PhieuGiamSatKiemTraTuyNen item)
        {
            using (var session = OpenSession())
            {
                if (item == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Phiếu giám sát này không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    if (item.id == 0)
                    {
                        await session.InsertAsync(item);
                    }
                    else
                    {
                        var existItem = session.Get(new PhieuGiamSatKiemTraTuyNen { id = item.id });
                        if (existItem == null)
                        {
                            return new RestError
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail {  message = "Phiếu giám sát đã tồn tại, vui lòng kiểm tra lại!" }
                                }
                            };
                        }
                        else
                        {
                            await session.UpdateAsync(item);
                        }
                    }
                    session.Execute($"DELETE FROM {Sql.Entity<KiemTraBaoDuongCongTrinh>():T} WHERE {nameof(KiemTraBaoDuongCongTrinh.phieugiamsat_id)} = @id AND {nameof(KiemTraBaoDuongCongTrinh.loaikiemtra)} = '{EnumLoaiKiemTra.TUYNEN}'", item);
                    if (item.congTrinhBaoDuongs != null)
                    {
                        if (item.congTrinhBaoDuongs.Count() > 0)
                        {
                            foreach (KiemTraBaoDuongCongTrinh congTrinh in item.congTrinhBaoDuongs)
                            {
                                congTrinh.phieugiamsat_id = item.id;
                                congTrinh.loaikiemtra = EnumLoaiKiemTra.TUYNEN;
                                await session.InsertAsync(congTrinh);
                            }
                        }
                    }

                    session.Execute($"DELETE FROM {Sql.Entity<GiaoViecNhanVien>():T} WHERE {nameof(GiaoViecNhanVien.phieugiamsat_id)} = @id AND {nameof(GiaoViecNhanVien.loaikiemtra)} = '{EnumLoaiKiemTra.TUYNEN}'", item);

                    if (item.giaoViecNhanViens != null && item.giaoViecNhanViens.Count() > 0)
                    {
                        var listNhanVien = session.Find<NhanVien>(x => x
                        .Where($"{Sql.Entity<NhanVien>(x => x.id):TC} = ANY(@listIds)")
                        .WithParameters(new { listIds = item.giaoViecNhanViens.Select(x => x.nhanvien_id) }));

                    }

                    if (item.deleteHoSoQuanLyIds != null && item.deleteHoSoQuanLyIds.Count() > 0)
                    {
                        await session.ExecuteAsync($"DELETE FROM {Sql.Entity<AnhMinhHoaKiemTra>():T} WHERE {nameof(AnhMinhHoaKiemTra.id)} = ANY(@hoso_ids)", new { hoso_ids = item.deleteHoSoQuanLyIds.ToArray() });
                    }

                    if (item.deleteAnhMinhHoaIds != null && item.deleteAnhMinhHoaIds.Count() > 0)
                    {
                        await session.ExecuteAsync($"DELETE FROM {Sql.Entity<AnhMinhHoaKiemTra>():T} WHERE {nameof(AnhMinhHoaKiemTra.id)} = ANY(@anhminhhoa_ids)", new { anhminhhoa_ids = item.deleteAnhMinhHoaIds.ToArray() });
                    }

                    if (item.thongTinTraoDois != null)
                    {
                        if (item.thongTinTraoDois.Count() > 0)
                        {
                            foreach (ThongTinTraoDoiKiemTra thongTinTraoDoi in item.thongTinTraoDois)
                            {
                                if (thongTinTraoDoi.id == 0)
                                {
                                    thongTinTraoDoi.phieugiamsat_id = item.id;
                                    thongTinTraoDoi.user_id = getUserId(); ;
                                    thongTinTraoDoi.user_cr_dtime = DateTime.Now;
                                    thongTinTraoDoi.loaikiemtra = EnumLoaiKiemTra.TUYNEN;
                                    await session.InsertAsync(thongTinTraoDoi);
                                }
                            }
                        }
                    }

                    return new RestData { data = item };
                }
            }
        }

        [HttpGet("{id}")]
        public RestBase Get([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                PhieuGiamSatKiemTraTuyNen? data = session.Find<PhieuGiamSatKiemTraTuyNen>(stm => stm
                    .Where($"{Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.id):TC} = @id")
                    .WithParameters(new { id = id })
                    .Include<PhuongThucKiemTra>(x => x.LeftOuterJoin())
                    .Include<CongCuKiemTra>(x => x.LeftOuterJoin())
                ).FirstOrDefault();
                if (data != null)
                {
                    data.congTrinhBaoDuongs = session.Find<KiemTraBaoDuongCongTrinh>(stm => stm
                        .Where(@$"{Sql.Entity<KiemTraBaoDuongCongTrinh>(x => x.phieugiamsat_id):TC} = @id 
                            AND {Sql.Entity<KiemTraBaoDuongCongTrinh>(x => x.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'")
                        .WithParameters(data)
                    ).ToList();
                    data.hoSoQuanLys = session.Find<HoSoQuanLyKiemTra>(stm => stm
                        .Where(@$"{Sql.Entity<HoSoQuanLyKiemTra>(x => x.phieugiamsat_id):TC} = @id 
                            AND {Sql.Entity<HoSoQuanLyKiemTra>(x => x.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'")
                        .WithParameters(data)
                    ).ToList();
                    data.anhMinhHoas = session.Find<AnhMinhHoaKiemTra>(stm => stm
                        .Where(@$"{Sql.Entity<AnhMinhHoaKiemTra>(x => x.phieugiamsat_id):TC} = @id 
                            AND {Sql.Entity<AnhMinhHoaKiemTra>(x => x.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'")
                        .WithParameters(data)
                    ).ToList();
                    data.giaoViecNhanViens = session.Find<GiaoViecNhanVien>(stm => stm
                        .Where(@$"{Sql.Entity<GiaoViecNhanVien>(x => x.phieugiamsat_id):TC} = @id 
                            AND {Sql.Entity<GiaoViecNhanVien>(x => x.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'")
                        .WithParameters(data)
                    ).ToList();
                    data.thongTinTraoDois = session.Find<ThongTinTraoDoiKiemTra>(stm => stm
                        .Where(@$"{Sql.Entity<ThongTinTraoDoiKiemTra>(x => x.phieugiamsat_id):TC} = @id 
                            AND {Sql.Entity<ThongTinTraoDoiKiemTra>(x => x.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'")
                        .WithParameters(data)
                    ).ToList();
                }
                return new RestData
                {
                    data = data
                };
            }
        }

        [HttpDelete("{id}")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_WORKER))]
        public RestBase Delete([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                var existItem = session.Get(new PhieuGiamSatKiemTraTuyNen { id = id });
                if (existItem == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Phiếu giám sát không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    session.Execute(@$"DELETE FROM {Sql.Entity<HoSoQuanLyKiemTra>():T} 
                            WHERE {nameof(HoSoQuanLyKiemTra.phieugiamsat_id)} = @id AND {nameof(HoSoQuanLyKiemTra.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'", existItem);
                    session.Execute(@$"DELETE FROM {Sql.Entity<AnhMinhHoaKiemTra>():T} 
                            WHERE {nameof(AnhMinhHoaKiemTra.phieugiamsat_id)} = @id AND {nameof(AnhMinhHoaKiemTra.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'", existItem);
                    session.Execute(@$"DELETE FROM {Sql.Entity<GiaoViecNhanVien>():T} 
                            WHERE {nameof(GiaoViecNhanVien.phieugiamsat_id)} = @id AND {nameof(GiaoViecNhanVien.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'", existItem);
                    session.Execute(@$"DELETE FROM {Sql.Entity<ThongTinTraoDoiKiemTra>():T} 
                            WHERE {nameof(ThongTinTraoDoiKiemTra.phieugiamsat_id)} = @id AND {nameof(ThongTinTraoDoiKiemTra.loaikiemtra):TC} = '{EnumLoaiKiemTra.TUYNEN}'", existItem);
                    session.Delete(existItem);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("export")]
        public async Task<IActionResult> Export([FromForm] KiemTraListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                string condition = "1=1";
                if (dto.phuongthuckiemtraid.HasValue && dto.phuongthuckiemtraid.Value > 0)
                {
                    condition += $" AND {Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.phuongthuckiemtraid):TC} = @phuongthuckiemtraid";
                }
                if (dto.congcukiemtraid.HasValue && dto.congcukiemtraid.Value > 0)
                {
                    condition += $" AND {Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.congcukiemtraid):TC} = @congcukiemtraid";
                }
                if (dto.isCompleted.HasValue && dto.isCompleted.Value == false)
                {
                    dto.thoigian = DateTime.Now.Date;
                    condition += $" AND DATE({Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.ngaythuchien):TC}) >= @thoigian";
                }
                List<PhieuGiamSatKiemTraTuyNen> data = (await session.FindAsync<PhieuGiamSatKiemTraTuyNen>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(dto)
                    .Include<PhuongThucKiemTra>(x => x.LeftOuterJoin())
                    .Include<CongCuKiemTra>(x => x.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<PhieuGiamSatKiemTraTuyNen>(x => x.ngaythuchien):TC} DESC")
                )).ToList();

                int totalCount = await session.CountAsync<PhieuGiamSatKiemTraTuyNen>(stm => stm
                           .Where($"{condition}")
                           .WithParameters(dto));

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                string fileName = "BaoCaoKiemTraTuyNen.xlsx";

                var filePath = Path.Combine(_webHostEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;

                    cell = worksheet.Cells[2, 1];
                    cell.Value = "Tổng số : " + totalCount + "(công việc kiểm tra)";

                    int rowIndex = 6;
                    int STT = 1;
                    if (data.Count() > 0)
                    {
                        foreach (var kiemTra in data)
                        {
                            int columnIndex = 1;
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = STT++;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            // Thông tin chung
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.phuongThucKiemTra?.mo_ta;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.congCuKiemTra?.mo_ta;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.thoitiet;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.thietbi;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.sonhancong;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.vitri;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.diadiem;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.tencongtrinh;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.goithauso;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.RIGHT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.nhathau;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.donvithicong;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.ngaythuchien?.ToString("dd/MM/yyyy");
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.ngayketthuc?.ToString("dd/MM/yyyy");
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.ghichu;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            // Công tác an toàn
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtracongtacatld;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtracongtacatgt;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtractvsmtkhuvuctc;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            // Trạm đèn
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrachatlieutramden;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtracongsuattheotram;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtracongsuattheotuyen;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtracongsuattheotuyenquanly;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            // Tủ điện
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrakhoidongtu;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtraaptomat;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrabochuyenmach;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrathietbidieukhientrungtam;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtradonghohengio;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            // Cột đèn
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtraloaicot;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtradaydan;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrabangdiencuacot;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrachungloaivoden;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrachieucaocot;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrasoluongbaudentrencot;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            // Tuyến cáp
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtratietdientuyencap;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrachieudaituyencap;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrachatlieutuyencap;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            // Hệ thống trang trí
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrabodieukhientrangtri;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtratudieukhientrangtri;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            // Bầu đèn
                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtraloaidaylenden;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrachieudaidaylenden;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtrakichthuocdaylenden;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtraloaibong;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = worksheet.Cells[rowIndex, columnIndex++];
                            cell.Value = kiemTra.kiemtracongsuatbong;
                            OfficeHelper.setStyle(ref cell,
                                    EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            rowIndex++;
                        }
                    }
                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
        }
    }
}
