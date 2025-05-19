using Dapper.FastCrud;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Interfaces;
using System;
using System.Linq;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using System.Net;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Repositories.Session;
using AutoMapper;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Models.DTO.Response;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.Models.DTO;
using System.IO;
using Dapper;
using OfficeOpenXml;
using SharpCompress;
using OpenGIS.Module.Core.ViewModels;
using Microsoft.VisualBasic;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;
using OpenGIS.Module.Core.Enums;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/kiem-tra/ke-hoach")]
    public class KeHoachKiemTraApiController : BaseApiCRUDController<INpgsqlSession, KeHoachKiemTra, int>
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        public KeHoachKiemTraApiController(IDbFactory dbFactory, IMapper mapper, IKeHoachKiemTraRepository repository,
        IWebHostEnvironment hostingEnvironment) : base(dbFactory, mapper, repository)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        [HttpPost("list-data")]
        public RestBase ListData([FromBody] KiemTraListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                var condition = $"(1=1)";

                if (!string.IsNullOrWhiteSpace(dto.searchValue))
                {
                    dto.searchValue = dto.searchValue?.ToPGFulltext();
                    condition += $" AND ({Sql.Entity<KeHoachKiemTra>():T}.search_content @@ to_tsquery(@keyword))";
                }
                if (!string.IsNullOrEmpty(dto.loaikiemtra))
                {
                    condition += $" AND ({Sql.Entity<KeHoachKiemTra>(x => x.loaikehoach):TC} = @loaikiemtra)";
                }

                List<KeHoachKiemTra> data = new List<KeHoachKiemTra>();
                var totalCount = session.Count<KeHoachKiemTra>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(dto)
                );
                if (dto.take > 0)
                {
                    data = session.Find<KeHoachKiemTra>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .Include<KeHoachKiemTraCongTrinh>(join => join.LeftOuterJoin())
                        .Include<KeHoachKiemTraNhanVien>(join => join.LeftOuterJoin())
                        .Include<NhanVien>(join => join.LeftOuterJoin())
                        .OrderBy($"{Sql.Entity<KeHoachKiemTra>(x => x.ngaylapkehoach):TC} DESC")
                    ).Skip(dto.skip).Take(dto.take).ToList();

                }
                else
                {
                    data = session.Find<KeHoachKiemTra>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .Include<KeHoachKiemTraCongTrinh>(join => join.LeftOuterJoin())
                        .Include<KeHoachKiemTraNhanVien>(join => join.LeftOuterJoin())
                        .Include<NhanVien>(join => join.LeftOuterJoin())
                        .OrderBy($"{Sql.Entity<KeHoachKiemTra>(x => x.ngaylapkehoach):TC} DESC")
                    ).ToList();
                }

                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = totalCount
                };
            }
        }

        [HttpGet("list-congviec")]
        public RestBase ListCongViec([FromQuery] string loaiKeHoach)
        {
            using var session = OpenSession();
            return new RestData
            {
                data = session.Find<DmHangMucCongViec>(statement => statement
                    .Where($"{nameof(DmHangMucCongViec.loaikehoach)}=@loaikehoach")
                    .WithParameters(new
                    {
                        loaikehoach = loaiKeHoach
                    }))
            };
        }

        [HttpGet("{id}")]
        public override async Task<RestBase> GetKeyAsync([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                var exitedItem = session.Find<KeHoachKiemTra>(stm => stm
                    .Where($"{Sql.Entity<KeHoachKiemTra>(x => x.id):TC} = @id")
                    .WithParameters(new { id = id })
                    .Include<KeHoachKiemTra.CongViec>(join => join.LeftOuterJoin())
                    .Include<DmHangMucCongViec>(join => join.LeftOuterJoin())
                    .Include<KeHoachKiemTra.DinhKem>(join => join.LeftOuterJoin())
                    .Include<KeHoachKiemTraCongTrinh>(join => join.LeftOuterJoin())
                    .Include<KeHoachKiemTraNhanVien>(join => join.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<KeHoachKiemTra.CongViec>(x => x.thoigian_thuchien):TC}, {Sql.Entity<DmHangMucCongViec>(x => x.order):TC}, {Sql.Entity<DmHangMucCongViec>(x => x.parent_id):TC}")
                ).FirstOrDefault();
                if (exitedItem != null)
                {
                    return new RestData
                    {
                        data = exitedItem
                    };
                }
                else
                {
                    return new RestError((int)HttpStatusCode.NotFound, "Không tìm thấy kế hoạch!");
                }
            }
        }

        [HttpPost("")]
        public override async Task<RestBase> InsertAsync([FromBody] KeHoachKiemTra entity)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (entity == null)
                    {
                        return new RestError(400, "Dữ liệu đầu vào không hợp lệ");
                    }

                    entity.ngaylapkehoach = DateTime.Now;
                    await Repository.SaveOrUpdateAsync(entity, uow);

                    await uow.Connection.BulkDeleteAsync<KeHoachKiemTraCongTrinh>(stm => stm
                        .Where($"{nameof(KeHoachKiemTraCongTrinh.kehoach_id)} = @kehoach_id")
                        .WithParameters(new
                        {
                            kehoach_id = entity.id,
                        })
                    );
                    await uow.Connection.BulkDeleteAsync<KeHoachKiemTraNhanVien>(stm => stm
                        .Where($"{nameof(KeHoachKiemTraCongTrinh.kehoach_id)} = @kehoach_id")
                        .WithParameters(new
                        {
                            kehoach_id = entity.id,
                        })
                    );
                    if (entity.congTrinhs != null && entity.congTrinhs.Count() > 0)
                    {
                        foreach (var congTrinh in entity.congTrinhs)
                        {
                            congTrinh.kehoach_id = entity.id;
                            uow.Connection.Insert(congTrinh);
                        }
                    }
                    if (entity.nhanViens != null && entity.nhanViens.Count() > 0)
                    {
                        foreach (var nhanVien in entity.nhanViens)
                        {
                            nhanVien.kehoach_id = entity.id;
                            uow.Connection.Insert(nhanVien);
                        }
                    }
                    if (entity.attachments != null && entity.attachments.Count() > 0)
                    {
                        foreach (var attachment in entity.attachments)
                        {
                            attachment.kehoach_id = entity.id;
                            attachment.extension = Path.GetExtension(attachment.file_name);
                            uow.Connection.Insert(attachment);
                        }
                    }

                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPut("")]
        public override async Task<RestBase> UpdateAsync([FromBody] KeHoachKiemTra entity)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (entity == null)
                    {
                        return new RestError(400, "Dữ liệu đầu vào không hợp lệ");
                    }

                    var existedItem = session.Get(new KeHoachKiemTra { id = entity.id });

                    if (existedItem == null)
                    {
                        return new RestError((int)HttpStatusCode.NotFound, "Không tìm thấy kịch bản");
                    }

                    entity.ngaylapkehoach = existedItem.ngaylapkehoach;
                    await Repository.SaveOrUpdateAsync(entity, uow);

                    await uow.Connection.BulkDeleteAsync<KeHoachKiemTraCongTrinh>(stm => stm
                        .Where($"{nameof(KeHoachKiemTraCongTrinh.kehoach_id)} = @kehoach_id")
                        .WithParameters(new
                        {
                            kehoach_id = entity.id
                        })
                    );
                    await uow.Connection.BulkDeleteAsync<KeHoachKiemTraNhanVien>(stm => stm
                        .Where($"{nameof(KeHoachKiemTraNhanVien.kehoach_id)} = @kehoach_id")
                        .WithParameters(new
                        {
                            kehoach_id = entity.id
                        })
                    );

                    if (entity.congTrinhs != null && entity.congTrinhs.Count() > 0)
                    {
                        foreach (var congTrinh in entity.congTrinhs)
                        {
                            congTrinh.kehoach_id = entity.id;
                            uow.Connection.Insert(congTrinh);
                        }
                    }
                    if (entity.nhanViens != null && entity.nhanViens.Count() > 0)
                    {
                        foreach (var nhanVien in entity.nhanViens)
                        {
                            nhanVien.kehoach_id = entity.id;
                            uow.Connection.Insert(nhanVien);
                        }
                    }
                    if (entity.listCongViec != null && entity.listCongViec.Count() > 0)
                    {
                        var deleteCondition = $"{nameof(KeHoachKiemTra.CongViec.kehoach_id)} = @kehoach_id";
                        if (entity.listCongViec.Count(x => x.id > 0) > 0)
                        {
                            deleteCondition += $" AND {nameof(KeHoachKiemTra.CongViec.kehoach_id)} <> ALL(@keepIds)";
                        }
                        await uow.Connection.BulkDeleteAsync<KeHoachKiemTra.CongViec>(stm => stm
                        .Where($"{deleteCondition}")
                        .WithParameters(new
                        {
                            kehoach_id = entity.id,
                            keepIds = entity.listCongViec.Where(x => x.id > 0).Select(x => x.id).ToArray()
                        }));
                        foreach (var cv in entity.listCongViec)
                        {
                            cv.kehoach_id = entity.id;
                            if (cv.id == 0)
                            {
                                uow.Connection.Insert(cv);
                            }
                            else
                            {
                                uow.Connection.Update(cv);
                            }
                        }
                    }
                    else
                    {
                        await uow.Connection.BulkDeleteAsync<KeHoachKiemTra.CongViec>(stm => stm
                        .Where($"{nameof(KeHoachKiemTra.CongViec.kehoach_id)} = @kehoach_id")
                        .WithParameters(new
                        {
                            kehoach_id = entity.id
                        })
                    );
                    }
                    var deletedIds = new int[] { };
                    var condition = $" {nameof(KeHoachKiemTra.DinhKem.kehoach_id)} = @kehoach_id";

                    if (entity.attachments != null && entity.attachments.Count() > 0)
                    {
                        if (entity.attachments.Count(x => x.id > 0) > 0)
                        {
                            deletedIds = entity.attachments.Select(x => x.id).ToArray();
                            condition += $" AND {nameof(KeHoachKiemTra.DinhKem.id)} <> ALL(@deletedIds)";
                        }

                        await uow.Connection.BulkDeleteAsync<KeHoachKiemTra.DinhKem>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(new
                        {
                            kehoach_id = entity.id,
                            deletedIds
                        }));

                        foreach (var attachment in entity.attachments)
                        {
                            if (attachment.id == 0)
                            {
                                attachment.kehoach_id = entity.id;
                                attachment.extension = Path.GetExtension(attachment.file_name);
                                uow.Connection.Insert(attachment);
                            }
                        }
                    }
                    else
                    {
                        await uow.Connection.BulkDeleteAsync<KeHoachKiemTra.DinhKem>(stm => stm
                                               .Where($"{condition}")
                                               .WithParameters(new
                                               {
                                                   kehoach_id = entity.id,
                                               }));
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("cay-xanh/excel")]
        public IActionResult ExportHangMucCayXanh([FromBody] KeHoachKiemTra keHoach)
        {
            using (var session = OpenSession())
            {

                var keHoachKiemTra = session.Find<KeHoachKiemTra>(x => x
                .Where($"{Sql.Entity<KeHoachKiemTra>(x => x.id):TC} = @id")
                .Include<KeHoachKiemTra.CongViec>(x => x.LeftOuterJoin())
                .WithParameters(keHoach)).FirstOrDefault();
                string fileName = $"BaoCaoHangMucCayXanh.xlsx";
                if (keHoachKiemTra == null)
                {
                    return new JsonResult(new RestError(400, "Không tìm thấy thông tin kế hoạch! Vui lòng kiểm tra lại"));
                }

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                var filePath = Path.Combine(_hostingEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;

                    int rowIndex = 8;
                    int STT = 1;
                    var hangMuc = session.Find<DmHangMucCongViec>(x => x
                    .Where($"{Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaikehoach")
                    .WithParameters(new
                    {
                        loaikehoach = "CAYXANH"
                    }).OrderBy($"{Sql.Entity<DmHangMucCongViec>(x => x.order):TC}"));
                    cell = worksheet.Cells[3, 1];
                    var goiThau = session.Find<DmGoiThauViewModel>(x => x
                    .Where($"{nameof(DmGoiThauViewModel.magoithau)} = @magoithau AND {nameof(DmGoiThauViewModel.loaikehoach)} = @loaikehoach")
                    .WithParameters(keHoachKiemTra)).FirstOrDefault();
                    if (goiThau != null)
                    {
                        cell.Value = $"Tên gói thầu: {goiThau?.tengoithau}";
                    }
                    else
                        cell.Value = $"Tên gói thầu: {keHoachKiemTra?.magoithau}";

                    cell = worksheet.Cells[4, 1];
                    cell.Value = $"Tên hợp đồng: {keHoachKiemTra?.mahopdong}";

                    foreach (var item in hangMuc)
                    {
                        int col = 0;
                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = STT++;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.value;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.donvi_tinh;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        //* Thống kê số liệu từ tháng 1 => 12
                        for (int i = 1; i <= 12; i++)
                        {
                            cell = worksheet.Cells[rowIndex, ++col];
                            if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            {
                                cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month == i).Sum(x => x.khoiluong_kehoach) * item.don_gia * item.he_so;
                                cell.Style.Numberformat.Format = $"#,##0";
                            }
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            cell = worksheet.Cells[rowIndex, ++col];
                            if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            {
                                cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month == i).Sum(x => x.khoiluong_thuchien) * item.don_gia * item.he_so;
                                cell.Style.Numberformat.Format = $"#,##0";
                            }
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            cell = worksheet.Cells[rowIndex, ++col];
                            cell.Formula = $"=+{worksheet.Cells[rowIndex, col - 1].Address}/{worksheet.Cells[rowIndex, col - 2].Address}";
                            cell.Style.Numberformat.Format = $"#,##0";
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                        }
                        cell = worksheet.Cells[rowIndex, ++col];
                        if (keHoachKiemTra?.listCongViec?.Count() > 0)
                        {
                            cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id).Sum(x => x.khoiluong_kehoach) * item.don_gia * item.he_so;
                            cell.Style.Numberformat.Format = $"#,##0";
                        }
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                        cell = worksheet.Cells[rowIndex, ++col];
                        if (keHoachKiemTra?.listCongViec?.Count() > 0)
                        {
                            cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id).Sum(x => x.khoiluong_thuchien) * item.don_gia * item.he_so;
                            cell.Style.Numberformat.Format = $"#,##0";
                        }
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Formula = $"=+{worksheet.Cells[rowIndex, col - 1].Address}/{worksheet.Cells[rowIndex, col - 2].Address}";
                        cell.Style.Numberformat.Format = $"#,##0";
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        rowIndex++;
                    }

                    if (keHoachKiemTra?.listCongViec?.Count() > 0)
                    {
                        var listNhaThau = session.Find<DmNhaThauViewModel>(x => x
                        .Where($"{Sql.Entity<DmNhaThauViewModel>(x => x.loaikehoach):TC} = @loaiKeHoach")
                        .WithParameters(new
                        {
                            loaiKeHoach = "CAYXANH"
                        }));
                        var groupDonVi = keHoachKiemTra?.listCongViec.GroupBy(x => x.nhathau).Select(x => new
                        {
                            nhaThau = listNhaThau.FirstOrDefault(stm => stm.code == x.Key),
                            key = x.Key,
                            items = x
                        });
                        foreach (var item in groupDonVi)
                        {
                            var donViWorksheet = package.Workbook.Worksheets.Add(item.nhaThau?.value ?? item.key.ToString());
                        }
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"BaoCaoHangMuc_{keHoachKiemTra?.tenkehoach}_{DateTime.Now.ToString("ddMMyyyyhhmmss")}.xlsx");
                }
            }
        }
        [HttpPost("thoat-nuoc/excel")]
        public IActionResult ExportHangMucThoatNuoc([FromBody] KeHoachKiemTra keHoach)
        {
            using (var session = OpenSession())
            {

                var keHoachKiemTra = session.Find<KeHoachKiemTra>(x => x
                .Where($"{Sql.Entity<KeHoachKiemTra>(x => x.id):TC} = @id")
                .Include<KeHoachKiemTra.CongViec>(x => x.LeftOuterJoin())
                .WithParameters(keHoach)).FirstOrDefault();
                string fileName = $"BaoCaoHangMucThoatNuoc.xlsx";
                if (keHoachKiemTra == null)
                {
                    return new JsonResult(new RestError(400, "Không tìm thấy thông tin kế hoạch! Vui lòng kiểm tra lại"));
                }
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                var filePath = Path.Combine(_hostingEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;

                    int rowIndex = 10;
                    int STT = 1;
                    var hangMuc = session.Find<DmHangMucCongViec>(x => x
                    .Where($"{Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaikehoach")
                    .WithParameters(new
                    {
                        loaikehoach = "THOATNUOC"
                    }).OrderBy($"{Sql.Entity<DmHangMucCongViec>(x => x.order):TC}"));

                    cell = worksheet.Cells[3, 1];
                    var goiThau = session.Find<DmGoiThauViewModel>(x => x
                   .Where($"{nameof(DmGoiThauViewModel.magoithau)} = @magoithau AND {nameof(DmGoiThauViewModel.loaikehoach)} = @loaikehoach")
                   .WithParameters(keHoachKiemTra)).FirstOrDefault();
                    if (goiThau != null)
                    {
                        cell.Value = $"Tên gói thầu: {goiThau?.tengoithau}";
                    }
                    else
                        cell.Value = $"Tên gói thầu: {keHoachKiemTra?.magoithau}";

                    cell = worksheet.Cells[4, 1];
                    cell.Value = $"Tên hợp đồng: {keHoachKiemTra?.mahopdong}";

                    foreach (var item in hangMuc)
                    {
                        int col = 0;
                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = STT++;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.code;
                        cell.Style.WrapText = true;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.MIDDLE | EnumFormat.CENTER | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.value;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.MIDDLE | EnumFormat.LEFT | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.donvi_tinh;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        //* Thống kê số liệu từ tháng 1 => 12
                        for (int i = 1; i <= 12; i++)
                        {
                            cell = worksheet.Cells[rowIndex, ++col];
                            if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            {
                                cell.Style.Numberformat.Format = $"#,##0";
                                cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month == i).Sum(x => x.khoiluong_thuchien);
                            }
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            // if (i % 3 == 0)
                            // {
                            //     cell = worksheet.Cells[rowIndex, ++col];
                            //     if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            //     {
                            //         cell.Style.Numberformat.Format = $"#,##0";
                            //         cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month <= i && x.thoigian_thuchien.Month >= i - 2).Sum(x => x.khoiluong_thuchien);
                            //     }
                            //     OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            // }
                        }
                        cell = worksheet.Cells[rowIndex, ++col];
                        if (keHoachKiemTra?.listCongViec?.Count() > 0)
                        {
                            cell.Style.Numberformat.Format = $"#,##0";
                            cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id).Sum(x => x.khoiluong_thuchien);
                        }
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        // cell = worksheet.Cells[rowIndex, ++col];
                        // OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Style.Numberformat.Format = $"#,##0";
                        cell.Value = item.don_gia;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        //* Thống kê số liệu từ tháng 1 => 12
                        for (int i = 1; i <= 12; i++)
                        {
                            cell = worksheet.Cells[rowIndex, ++col];
                            if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            {
                                cell.Style.Numberformat.Format = $"#,##0";
                                cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month == i).Sum(x => x.khoiluong_thuchien) * item.don_gia * item.he_so;
                            }
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            // if (i % 3 == 0)
                            // {
                            //     cell = worksheet.Cells[rowIndex, ++col];
                            //     if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            //     {
                            //         cell.Style.Numberformat.Format = $"#,##0";
                            //         cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month <= i && x.thoigian_thuchien.Month >= i - 2).Sum(x => x.khoiluong_thuchien) * item.don_gia * item.he_so;
                            //     }
                            //     OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            // }
                        }
                        cell = worksheet.Cells[rowIndex, ++col];
                        if (keHoachKiemTra?.listCongViec?.Count() > 0)
                        {
                            cell.Style.Numberformat.Format = $"#,##0";
                            cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id).Sum(x => x.khoiluong_thuchien) * item.don_gia * item.he_so;
                        }
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                        rowIndex++;
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"BaoCaoHangMuc_{keHoachKiemTra?.tenkehoach}_{DateTime.Now.ToString("ddMMyyyyhhmmss")}.xlsx");
                }
            }
        }
        [HttpPost("chieu-sang/excel")]
        public IActionResult ExportHangMucChieuSang([FromBody] KeHoachKiemTra keHoach)
        {
            using (var session = OpenSession())
            {

                var keHoachKiemTra = session.Find<KeHoachKiemTra>(x => x
                .Where($"{Sql.Entity<KeHoachKiemTra>(x => x.id):TC} = @id")
                .Include<KeHoachKiemTra.CongViec>(x => x.LeftOuterJoin())
                .Include<DmHangMucCongViec>(x => x.LeftOuterJoin())
                .WithParameters(keHoach)).FirstOrDefault();
                string fileName = $"BaoCaoHangMucChieuSang.xlsx";
                if (keHoachKiemTra == null)
                {
                    return new JsonResult(new RestError(400, "Không tìm thấy thông tin kế hoạch! Vui lòng kiểm tra lại"));
                }
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                var filePath = Path.Combine(_hostingEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;

                    int rowIndex = 7;
                    int STT = 1;
                    var hangMuc = session.Find<DmHangMucCongViec>(x => x
                    .Where($"{Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaikehoach")
                    .WithParameters(new
                    {
                        loaikehoach = "CHIEUSANG"
                    }).OrderBy($"{Sql.Entity<DmHangMucCongViec>(x => x.order):TC}"));

                    cell = worksheet.Cells[3, 1];
                    var goiThau = session.Find<DmGoiThauViewModel>(x => x
                   .Where($"{nameof(DmGoiThauViewModel.magoithau)} = @magoithau AND {nameof(DmGoiThauViewModel.loaikehoach)} = @loaikehoach")
                   .WithParameters(keHoachKiemTra)).FirstOrDefault();
                    if (goiThau != null)
                    {
                        cell.Value = $"Tên gói thầu: {goiThau?.tengoithau}";
                    }
                    else
                        cell.Value = $"Tên gói thầu: {keHoachKiemTra?.magoithau}";

                    cell = worksheet.Cells[4, 1];
                    cell.Value = $"Tên hợp đồng: {keHoachKiemTra?.mahopdong}";

                    foreach (var item in hangMuc)
                    {
                        int col = 0;
                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = STT++;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.value;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.MIDDLE | EnumFormat.LEFT | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.donvi_tinh;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.don_gia;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                        var isParent = hangMuc.Count(x => x.parent_id == item.id);
                        //* Thống kê số liệu từ tháng 1 => 12
                        for (int i = 1; i <= 12; i++)
                        {
                            cell = worksheet.Cells[rowIndex, ++col];
                            if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            {
                                cell.Style.Numberformat.Format = $"#,##0";

                                if (isParent > 0)
                                {
                                    if (isParent == 1)
                                    {
                                        cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ")";
                                    }
                                    else
                                    {
                                        cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ":" + worksheet.Cells[rowIndex + isParent, col].Address + ")";
                                    }
                                }
                                else
                                    cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month == i).Sum(x => x.khoiluong_thuchien);
                            }
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            if (i % 3 == 0)
                            {
                                cell = worksheet.Cells[rowIndex, ++col];
                                if (keHoachKiemTra?.listCongViec?.Count() > 0)
                                {
                                    cell.Style.Numberformat.Format = $"#,##0";
                                    if (isParent > 0)
                                    {
                                        if (isParent == 1)
                                        {
                                            cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ")";
                                        }
                                        else
                                        {
                                            cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ":" + worksheet.Cells[rowIndex + isParent, col].Address + ")";
                                        }
                                    }
                                    else
                                        cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month <= i && x.thoigian_thuchien.Month >= i - 2).Sum(x => x.khoiluong_thuchien);
                                }

                                OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            }
                        }
                        cell = worksheet.Cells[rowIndex, ++col];
                        if (keHoachKiemTra?.listCongViec?.Count() > 0)
                        {
                            cell.Style.Numberformat.Format = $"#,##0";
                            if (isParent > 0)
                            {
                                if (isParent == 1)
                                {
                                    cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ")";
                                }
                                else
                                {
                                    cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ":" + worksheet.Cells[rowIndex + isParent, col].Address + ")";
                                }
                            }
                            else
                                cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id).Sum(x => x.khoiluong_thuchien);
                        }
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        //* Thống kê số liệu từ tháng 1 => 12
                        for (int i = 1; i <= 12; i++)
                        {
                            cell = worksheet.Cells[rowIndex, ++col];
                            if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            {
                                cell.Style.Numberformat.Format = $"#,##0";
                                if (isParent > 0)
                                {
                                    if (isParent == 1)
                                    {
                                        cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ")";
                                    }
                                    else
                                    {
                                        cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ":" + worksheet.Cells[rowIndex + isParent, col].Address + ")";
                                    }
                                }
                                else
                                    cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month == i).Sum(x => x.khoiluong_thuchien) * item.don_gia * item.he_so;
                            }
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            // if (i % 3 == 0)
                            // {
                            //     cell = worksheet.Cells[rowIndex, ++col];
                            //     if (keHoachKiemTra?.listCongViec?.Count() > 0)
                            //     {
                            //         cell.Style.Numberformat.Format = $"#,##0";
                            //         cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id && x.thoigian_thuchien.Month <= i && x.thoigian_thuchien.Month >= i - 2).Sum(x => x.khoiluong_thuchien) * item.don_gia * item.he_so;
                            //     }
                            //     OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                            // }
                        }
                        cell = worksheet.Cells[rowIndex, ++col];
                        if (keHoachKiemTra?.listCongViec?.Count() > 0)
                        {
                            cell.Style.Numberformat.Format = $"#,##0";
                            if (isParent > 0)
                            {
                                if (isParent == 1)
                                {
                                    cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ")";
                                }
                                else
                                {
                                    cell.Formula = "=SUM(" + worksheet.Cells[rowIndex + 1, col].Address + ":" + worksheet.Cells[rowIndex + isParent, col].Address + ")";
                                }
                            }
                            else
                                cell.Value = keHoachKiemTra?.listCongViec.Where(x => x.congviec_id == item.id).Sum(x => x.khoiluong_thuchien) * item.don_gia * item.he_so;
                        }
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        // cell = worksheet.Cells[rowIndex, ++col];
                        // OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                        rowIndex++;
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"BaoCaoHangMuc_{keHoachKiemTra?.tenkehoach}_{DateTime.Now.ToString("ddMMyyyyhhmmss")}.xlsx");
                }
            }
        }

        [HttpPost("cay-xanh/template")]
        public IActionResult XuatBieuMauNhapLieuCayXanh()
        {
            using (var session = OpenSession())
            {

                string fileName = $"BieuMauHangMucCayXanh.xlsx";
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                var filePath = Path.Combine(_hostingEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;

                    int rowIndex = 8;
                    int STT = 1;
                    var hangMuc = session.Find<DmHangMucCongViec>(x => x
                    .Where($"{Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaiKiemTra")
                    .WithParameters(new
                    {
                        loaiKiemTra = EnumLoaiKiemTra.CAYXANH
                    }).OrderBy($"{Sql.Entity<DmHangMucCongViec>(x => x.order):TC}"));
                    var endCol = worksheet.Dimension.End.Column;
                    foreach (var item in hangMuc)
                    {
                        int col = 0;
                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = STT++;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.value;
                        cell.Style.WrapText = true;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.MIDDLE | EnumFormat.LEFT | EnumFormat.BORDER);

                        // cell = worksheet.Cells[rowIndex, ++col];
                        // cell.Value = item.don_gia;
                        // OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        // cell = worksheet.Cells[rowIndex, ++col];
                        // cell.Value = item.he_so;
                        // OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.donvi_tinh;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        for (int i = col; i < endCol; i++)
                        {
                            cell = worksheet.Cells[rowIndex, ++col];
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                        }
                        rowIndex++;
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{fileName}_{DateTime.Now.ToString("ddMMyyyyhhmmss")}.xlsx");
                }
            }
        }
        [HttpPost("thoat-nuoc/template")]
        public IActionResult XuatBieuMauNhapLieuThoatNuoc()
        {
            using (var session = OpenSession())
            {

                string fileName = $"BaoCaoHangMucThoatNuoc.xlsx";
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                var filePath = Path.Combine(_hostingEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;

                    int rowIndex = 10;
                    int STT = 1;
                    var hangMuc = session.Find<DmHangMucCongViec>(x => x
                    .Where($"{Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaiKiemTra")
                    .WithParameters(new
                    {
                        loaiKiemTra = EnumLoaiKiemTra.THOATNUOC
                    }).OrderBy($"{Sql.Entity<DmHangMucCongViec>(x => x.order):TC}"));
                    var endCol = worksheet.Dimension.End.Column;
                    foreach (var item in hangMuc)
                    {
                        int col = 0;
                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = STT++;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.code;
                        cell.Style.WrapText = true;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.LEFT | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.value;
                        cell.Style.WrapText = true;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.LEFT | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        // cell = worksheet.Cells[rowIndex, ++col];
                        // cell.Value = item.don_gia;
                        // OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        // cell = worksheet.Cells[rowIndex, ++col];
                        // cell.Value = item.he_so;
                        // OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.donvi_tinh;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        for (int i = col; i < endCol; i++)
                        {
                            cell = worksheet.Cells[rowIndex, ++col];
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                        }
                        rowIndex++;
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"BieuMauHangMucThoatNuoc_{DateTime.Now.ToString("ddMMyyyyhhmmss")}.xlsx");
                }
            }
        }
        [HttpPost("chieu-sang/template")]
        public IActionResult XuatBieuMauNhapLieuChieuSang()
        {
            using (var session = OpenSession())
            {

                string fileName = $"BaoCaoHangMucChieuSang.xlsx";
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                var filePath = Path.Combine(_hostingEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;

                    int rowIndex = 7;
                    int STT = 1;
                    var hangMuc = session.Find<DmHangMucCongViec>(x => x
                    .Where($"{Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaiKiemTra")
                    .WithParameters(new
                    {
                        loaiKiemTra = EnumLoaiKiemTra.CHIEUSANG
                    }).OrderBy($"{Sql.Entity<DmHangMucCongViec>(x => x.order):TC}"));
                    var endCol = worksheet.Dimension.End.Column;
                    foreach (var item in hangMuc)
                    {
                        int col = 0;
                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = STT++;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.value;
                        cell.Style.WrapText = true;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.LEFT | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.donvi_tinh;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.don_gia;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        for (int i = col; i < endCol; i++)
                        {
                            cell = worksheet.Cells[rowIndex, ++col];
                            OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);
                        }
                        rowIndex++;
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"BieuMauHangMucChieuSang_{DateTime.Now.ToString("ddMMyyyyhhmmss")}.xlsx");
                }
            }
        }

        [HttpPost("import")]
        public async Task<RestBase> ImportFileChamCong([FromForm] BieuMauNhapLieuKeHoachKiemTraViewModel @params)
        {
            if (@params == null || @params.file == null
             || @params.kehoach_id == 0 || @params.nam_kehoach == 0
            )
                return new RestError
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Lỗi tham số!" }
                    }
                };
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using (ExcelPackage package = new ExcelPackage(@params.file.OpenReadStream()))
            {
                using var session = OpenSession();
                using var uow = new UnitOfWork(DbFactory, session);
                var keHoach = session.Find<KeHoachKiemTra>(stm => stm
                    .Where($"{Sql.Entity<KeHoachKiemTra>(x => x.id):TC} = @id")
                    .WithParameters(new { id = @params.kehoach_id })
                    .Include<KeHoachKiemTra.CongViec>(join => join.LeftOuterJoin())
                ).FirstOrDefault();
                if (keHoach == null)
                {
                    return new RestError(400, "Không tìm thấy thông tin kế hoạch! Vui lòng kiểm tra lại");
                }
                var workbook = package.Workbook;
                var worksheet = workbook.Worksheets.First();
                var rowStart = 7;
                var endRow = worksheet.Dimension.End.Row;
                var hangMucCha = new DmHangMucCongViec();
                switch (keHoach.loaikehoach)
                {
                    case EnumLoaiKiemTra.CAYXANH:
                        rowStart = 8;

                        while (rowStart <= endRow)
                        {
                            var col = 1;
                            ExcelRange cell = worksheet.Cells[rowStart, ++col];

                            if (!string.IsNullOrWhiteSpace(cell.Value?.ToString()))
                            {
                                var hangMuc = session.Find<DmHangMucCongViec>(x => x
                               .Where($"lower({Sql.Entity<DmHangMucCongViec>(x => x.value):TC}) = lower(@value) AND {Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaikehoach")
                               .WithParameters(new
                               {
                                   value = cell?.Value?.ToString(),
                                   loaikehoach = EnumLoaiKiemTra.CAYXANH
                               })).FirstOrDefault();
                                if (hangMuc != null)
                                {

                                    col++;
                                    for (int i = 1; i <= 12; i++)
                                    {
                                        var congViec = new KeHoachKiemTra.CongViec();
                                        congViec.kehoach_id = @params.kehoach_id;
                                        congViec.congviec_id = hangMuc.id;
                                        congViec.nhathau = @params.nhathau;
                                        // * Kiểm tra hạng mục đã tồn tại
                                        var checkExist = keHoach?.listCongViec?.FirstOrDefault(x => x.thoigian_thuchien.Month == i && x.congviec_id == hangMuc.id && x.thoigian_thuchien.Year == @params.nam_kehoach);
                                        if (checkExist != null)
                                        {
                                            congViec.id = checkExist.id;
                                        }
                                        else
                                            congViec.thoigian_thuchien = new DateTime(@params.nam_kehoach, i, 1);

                                        cell = worksheet.Cells[rowStart, ++col];
                                        if (!string.IsNullOrWhiteSpace(cell.Value?.ToString()))
                                        {
                                            if (double.TryParse(cell.Value?.ToString(), out double value))
                                            {
                                                congViec.khoiluong_kehoach = value;
                                            }
                                        }
                                        cell = worksheet.Cells[rowStart, ++col];
                                        if (!string.IsNullOrWhiteSpace(cell.Value?.ToString()))
                                        {
                                            if (double.TryParse(cell.Value?.ToString(), out double value))
                                            {
                                                congViec.khoiluong_thuchien = value;
                                            }
                                        }
                                        if (congViec.id > 0)
                                        {
                                            await uow.Connection.UpdateAsync(congViec);
                                        }
                                        else
                                            await uow.Connection.InsertAsync(congViec);

                                    }
                                }
                            }

                            rowStart++;
                        }
                        return new RestBase(EnumErrorCode.OK);
                    case EnumLoaiKiemTra.THOATNUOC:
                        rowStart = 10;

                        while (rowStart <= endRow)
                        {
                            var col = 2;
                            ExcelRange cell = worksheet.Cells[rowStart, ++col];

                            if (!string.IsNullOrWhiteSpace(cell.Value?.ToString()))
                            {
                                // * Hạng mục thoát nước có mô tả giống nhau nhưng khác nhau ở hạng mục cha
                                // * Tìm danh sách hạng mục có chung mô tả
                                var listHangMuc = session.Find<DmHangMucCongViec>(x => x
                                .Where($"lower({Sql.Entity<DmHangMucCongViec>(x => x.value):TC}) = lower(@value) AND {Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaikehoach")
                                .WithParameters(new
                                {
                                    value = cell?.Value?.ToString(),
                                    loaikehoach = EnumLoaiKiemTra.THOATNUOC
                                }).OrderBy($"{Sql.Entity<DmHangMucCongViec>(x => x.order)}"));
                                if (listHangMuc.Count() > 0)
                                {
                                    var hangMuc = listHangMuc.FirstOrDefault();
                                    // * Nếu hạng mục cha (dữ liệu dòng trên dòng hiện tại) id trùng với parent_id của 1 trong số hạng mục trong danh sách
                                    if (hangMucCha != null && listHangMuc.Count(x => x.parent_id == hangMucCha?.id) > 0)
                                    {
                                        hangMuc = listHangMuc.FirstOrDefault(x => x.parent_id == hangMucCha?.id);
                                    }
                                    // * Nếu không thì gán hạng mục hiện tại làm hạng mục cha để kiểm tra hạng mục dòng tiếp theo
                                    else
                                    {
                                        hangMucCha = hangMuc;
                                    }

                                    col++;
                                    for (int i = 1; i <= 12; i++)
                                    {
                                        var congViec = new KeHoachKiemTra.CongViec();
                                        congViec.kehoach_id = @params.kehoach_id;
                                        congViec.congviec_id = hangMuc.id;
                                        // * Kiểm tra hạng mục đã tồn tại
                                        var checkExist = keHoach?.listCongViec?.FirstOrDefault(x => x.thoigian_thuchien.Month == i && x.congviec_id == hangMuc.id && x.thoigian_thuchien.Year == @params.nam_kehoach);
                                        if (checkExist != null)
                                        {
                                            congViec.id = checkExist.id;
                                        }
                                        else
                                            congViec.thoigian_thuchien = new DateTime(@params.nam_kehoach, i, 1);
                                        cell = worksheet.Cells[rowStart, ++col];

                                        if (!string.IsNullOrWhiteSpace(cell.Value?.ToString()))
                                        {
                                            System.Console.WriteLine(cell.Value.ToString());
                                            if (double.TryParse(cell.Value?.ToString(), out double value))
                                            {
                                                congViec.khoiluong_thuchien = value;
                                            }
                                        }

                                        if (congViec.id > 0)
                                        {
                                            await uow.Connection.UpdateAsync(congViec);
                                        }
                                        else
                                            await uow.Connection.InsertAsync(congViec);

                                        // if (i % 3 == 0) col++;
                                    }
                                }
                            }

                            rowStart++;
                        }
                        return new RestBase(EnumErrorCode.OK);
                    case EnumLoaiKiemTra.CHIEUSANG:
                        rowStart = 7;
                        while (rowStart <= endRow)
                        {
                            var col = 1;
                            ExcelRange cell = worksheet.Cells[rowStart, ++col];

                            if (!string.IsNullOrWhiteSpace(cell.Value?.ToString()))
                            {
                                // * Hạng mục chiếu sáng có mô tả giống nhau nhưng khác nhau ở hạng mục cha
                                // * Tìm danh sách hạng mục có chung mô tả
                                var listHangMuc = session.Find<DmHangMucCongViec>(x => x
                                .Where($"lower({Sql.Entity<DmHangMucCongViec>(x => x.value):TC}) = lower(@value) AND {Sql.Entity<DmHangMucCongViec>(x => x.loaikehoach):TC} = @loaikehoach")
                                .WithParameters(new
                                {
                                    value = cell?.Value?.ToString(),
                                    loaikehoach = EnumLoaiKiemTra.CHIEUSANG
                                }).OrderBy($"{Sql.Entity<DmHangMucCongViec>(x => x.order)}"));
                                if (listHangMuc.Count() > 0)
                                {
                                    var hangMuc = listHangMuc.FirstOrDefault();
                                    // * Nếu hạng mục cha (dữ liệu dòng trên dòng hiện tại) id trùng với parent_id của 1 trong số hạng mục trong danh sách
                                    if (hangMucCha != null && listHangMuc.Count(x => x.parent_id == hangMucCha?.id) > 0)
                                    {
                                        hangMuc = listHangMuc.FirstOrDefault(x => x.parent_id == hangMucCha?.id);
                                    }
                                    // * Nếu không thì gán hạng mục hiện tại làm hạng mục cha để kiểm tra hạng mục dòng tiếp theo
                                    else
                                    {
                                        hangMucCha = hangMuc;
                                    }
                                    // * Bỏ qua cột đơn vị, đơn giá, khối lượng
                                    col += 3;
                                    for (int i = 1; i <= 12; i++)
                                    {
                                        var congViec = new KeHoachKiemTra.CongViec();
                                        congViec.kehoach_id = @params.kehoach_id;
                                        congViec.congviec_id = hangMuc.id;
                                        // * Kiểm tra hạng mục đã tồn tại
                                        var checkExist = keHoach?.listCongViec?.FirstOrDefault(x => x.thoigian_thuchien.Month == i && x.congviec_id == hangMuc.id && x.thoigian_thuchien.Year == @params.nam_kehoach);
                                        if (checkExist != null)
                                        {
                                            congViec.id = checkExist.id;
                                        }
                                        else
                                            congViec.thoigian_thuchien = new DateTime(@params.nam_kehoach, i, 1);
                                        cell = worksheet.Cells[rowStart, ++col];

                                        if (!string.IsNullOrWhiteSpace(cell.Value?.ToString()))
                                        {
                                            System.Console.WriteLine(cell.Value.ToString());
                                            if (double.TryParse(cell.Value?.ToString(), out double value))
                                            {
                                                congViec.khoiluong_thuchien = value;
                                            }
                                        }

                                        if (congViec.id > 0)
                                        {
                                            await uow.Connection.UpdateAsync(congViec);
                                        }
                                        else
                                            await uow.Connection.InsertAsync(congViec);

                                        // * Bỏ qua cột quý sau tháng cuối của quý
                                        if (i % 3 == 0) col++;
                                    }
                                }
                            }

                            rowStart++;
                        }
                        return new RestBase(EnumErrorCode.OK);
                    default:
                        return new RestError(400, "Không tìm thấy loại kế hoạch! Vui lòng kiểm tra lại");
                }
            }
        }
    }
}