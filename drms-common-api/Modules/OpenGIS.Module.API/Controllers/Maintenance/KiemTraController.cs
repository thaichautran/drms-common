using System;
using System.Linq;
using System.Threading.Tasks;
using Dapper.FastCrud;
using HeyRed.Mime;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.API.Helpers;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/kiem-tra")]
    public class KiemTraController : BaseController
    {
        public KiemTraController(IDbFactory dbFactory)
            : base(dbFactory)
        {
        }

        [HttpPost("ho-so/upload")]
        [RequestSizeLimit(100_000_000)]
        public async Task<RestBase> uploadHoSoAsync([FromForm] HoSoQuanLyKiemTra hoSoQuanLy)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (hoSoQuanLy == null)
                        return new RestError(-1, "Lỗi tham số!");
                    if (hoSoQuanLy.file == null) return new RestError(-1, "Lỗi tham số!");
                    hoSoQuanLy.url = await FileHelper.PostDocumentAsync(hoSoQuanLy.file, hoSoQuanLy.file.FileName, hoSoQuanLy.file.ContentType);
                    hoSoQuanLy.loaikiemtra = hoSoQuanLy.loaikiemtra;
                    await session.InsertAsync(hoSoQuanLy);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("anh-minh-hoa/upload")]
        public async Task<RestBase> uploadAnhMinhHoaAsync([FromForm] PhieuGiamSatFileViewModel anhMinhHoaKiemTraViewModel)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (anhMinhHoaKiemTraViewModel == null || anhMinhHoaKiemTraViewModel.files == null || anhMinhHoaKiemTraViewModel.files.Count() == 0)
                        return new RestError(-1, "Lỗi tham số!");
                    foreach (var file in anhMinhHoaKiemTraViewModel.files)
                    {
                        var maintenanceFile = new AnhMinhHoaKiemTra
                        {
                            file_name = file.FileName,
                            mime_type = file.ContentType,
                            extension = MimeTypesMap.GetExtension(file.ContentType) ?? "unknow",
                            size = file.Length,
                            phieugiamsat_id = anhMinhHoaKiemTraViewModel.phieugiamsat_id,
                            url = await FileHelper.PostFileAsync(file, file.FileName, file.ContentType),
                            loaikiemtra = anhMinhHoaKiemTraViewModel.loaikiemtra
                        };
                        await session.InsertAsync(maintenanceFile);
                    };
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("trao-doi/upload")]
        public async Task<RestBase> uploadThongTinTraoDoiAsync([FromForm] PhieuGiamSatFileViewModel thongTinTraoDoiKiemTraViewModel)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (thongTinTraoDoiKiemTraViewModel == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                            }
                        };
                    if (thongTinTraoDoiKiemTraViewModel.files == null || thongTinTraoDoiKiemTraViewModel.files.Count() == 0) return new RestError();
                    var userId = getUserId();
                    foreach (var file in thongTinTraoDoiKiemTraViewModel.files)
                    {
                        var thongTinTraoDoi = new ThongTinTraoDoiKiemTra
                        {
                            phieugiamsat_id = thongTinTraoDoiKiemTraViewModel.phieugiamsat_id,
                            user_cr_dtime = DateTime.Now,
                            user_id = userId,
                            image_url = await FileHelper.PostFileAsync(file, file.FileName, file.ContentType),
                            loaikiemtra = thongTinTraoDoiKiemTraViewModel.loaikiemtra
                        };
                        await session.InsertAsync(thongTinTraoDoi);
                    };
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
    }
}
