using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Models.DTO.Request;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Helpers;
using OpenGIS.Module.DRMS.Models;
using VietGIS.Infrastructure.Enums;
using System;
using VietGIS.Infrastructure;
using OpenGIS.Module.Core.Helpers;
using OpenGIS.Module.DRMS.ViewModels;
using OpenGIS.Module.Core.Areas.Core.Controllers.Base;
using OpenGIS.Module.Core.Enums;
using Microsoft.Extensions.Configuration;
using RestSharp;
using System.Net;
using System.Text.Json;
using OpenGIS.Module.DRMS.Models.DRMS;
using OpenGIS.Module.DRMS.Enums;
using ZstdSharp.Unsafe;
using VietGIS.Infrastructure.Models.Regional;
using Dapper;
using Microsoft.VisualBasic;

namespace OpenGIS.Module.DRMS.Areas.DRMS.Controllers
{
    [Authorize(AuthenticationSchemes = OpenGIS.Module.Core.Constants.Constants.AUTH_SCHEMES)]
    [Route("api/drms/data")]
    public class SyncApiController : ApiBaseController
    {
        private readonly IConfiguration _configurationManager;
        public SyncApiController(IDbFactory dbFactory, IMapper mapper, IConfiguration configurationManager)
            : base(dbFactory, mapper)
        {
            _configurationManager = configurationManager;
        }
        [HttpPost("sync")]
        public async Task<RestBase> Sync([FromBody] SyncDataParams dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.province_code) || dto.loai_congtrinh_id?.Length == 0)
            {
                return new RestError(400, "Lỗi tham số! Vui lòng thử lại.");
            }
            var url = _configurationManager.GetValue<string>("GPS_SYNC_URL");
            if (string.IsNullOrWhiteSpace(url))
            {
                return new RestError(404, "Chưa cấu hình đường dẫn đồng bộ dữ liệu! Vui lòng thử lại.");
            }
            var options = new RestClientOptions(url)
            {
                RemoteCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true
            };
            RestClient restClient = new RestClient(options);

            var listNhaO = new List<NhaOViewModel>();
            var listNhaVanHoa = new List<NhaVanHoaViewModel>();
            var listTruongHoc = new List<TruongHocViewModel>();
            var listCoSoYTe = new List<CoSoYTeViewModel>();
            var listUBND = new List<UBNDViewModel>();
            var listCommuneCode = new List<string>();
            var message = new List<string>();
            foreach (var loai_congtrinh_id in dto?.loai_congtrinh_id)
            {
                RestRequest restRequest = new RestRequest();
                var area_code = !string.IsNullOrWhiteSpace(dto.commune_code) ? dto.commune_code : (!string.IsNullOrWhiteSpace(dto.district_code) ? dto.district_code : dto.province_code);
                restRequest.AddQueryParameter("area_code", area_code);
                restRequest.AddQueryParameter("loai_congtrinh_id", loai_congtrinh_id);

                var responseRaw = await restClient.ExecuteAsync(restRequest);
                if (responseRaw != null && responseRaw.StatusCode == HttpStatusCode.OK && string.IsNullOrWhiteSpace(responseRaw.Content) == false)
                {
                    switch (loai_congtrinh_id)
                    {
                        case (int)EnumLoaiDuLieuDongBo.NHA_O:
                            var nhaORestData = JsonSerializer.Deserialize<RestData<List<NhaOViewModel>>>(responseRaw.Content);
                            if (nhaORestData != null && nhaORestData.data != null && nhaORestData.data.Count() > 0)
                            {
                                listNhaO = nhaORestData.data.ToList();
                                listCommuneCode.AddRange(listNhaO?.Select(x => x.commune_code));
                            }
                            break;
                        case (int)EnumLoaiDuLieuDongBo.NHA_VANHOA:
                            var nhaVanHoaRestData = JsonSerializer.Deserialize<RestData<List<NhaVanHoaViewModel>>>(responseRaw.Content);
                            if (nhaVanHoaRestData != null && nhaVanHoaRestData.data.Count() > 0)
                            {
                                listNhaVanHoa = nhaVanHoaRestData.data.ToList();
                                listCommuneCode.AddRange(listNhaVanHoa?.Select(x => x.commune_code));
                            }
                            break;
                        case (int)EnumLoaiDuLieuDongBo.TRUONG_HOC:
                            var truongHocRestData = JsonSerializer.Deserialize<RestData<List<TruongHocViewModel>>>(responseRaw.Content);
                            if (truongHocRestData != null && truongHocRestData.data.Count() > 0)
                            {
                                listTruongHoc = truongHocRestData.data.ToList();
                                listCommuneCode.AddRange(listTruongHoc?.Select(x => x.commune_code));
                            }
                            break;
                        case (int)EnumLoaiDuLieuDongBo.COSO_YTE:
                            var coSoYTeRestData = JsonSerializer.Deserialize<RestData<List<CoSoYTeViewModel>>>(responseRaw.Content);
                            if (coSoYTeRestData != null && coSoYTeRestData.data.Count() > 0)
                            {
                                listCoSoYTe = coSoYTeRestData.data.ToList();
                                listCommuneCode.AddRange(listCoSoYTe?.Select(x => x.commune_code));
                            }
                            break;
                        case (int)EnumLoaiDuLieuDongBo.UBND:
                            var ubndRestData = JsonSerializer.Deserialize<RestData<List<UBNDViewModel>>>(responseRaw.Content);
                            if (ubndRestData != null && ubndRestData.data.Count() > 0)
                            {
                                listUBND = ubndRestData.data.ToList();
                                listCommuneCode.AddRange(listUBND?.Select(x => x.commune_code));
                            }
                            break;
                        default:
                            break;
                    }
                }
            }

            using var session = OpenSession();
            using var uow = new UnitOfWork(DbFactory, session);
            var listCommune = new List<Commune>();
            if (listCommuneCode.Distinct().Count() > 0)
            {
                listCommune = session.Find<Commune>(x => x.Where($"{Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@listCommuneCode)")
                .WithParameters(new
                {
                    listCommuneCode = listCommuneCode.Distinct().ToArray()
                })).ToList();
            }

            if (listNhaO.Count() > 0)
            {
                var count = 0;
                var exists = session.Query<NhaO>($@"SELECT {Sql.Entity<NhaO>(x => x.id):TC}, ST_X({Sql.Entity<NhaO>():T}.geom) as lon, ST_Y({Sql.Entity<NhaO>():T}.geom) as lat, {Sql.Entity<NhaO>(x => x.commune_code):TC}
                FROM {Sql.Entity<NhaO>():T} WHERE {Sql.Entity<NhaO>(x => x.commune_code):TC} = ANY(@commune_codes) AND ST_X({Sql.Entity<NhaO>():T}.geom) = ANY(@lons) AND ST_Y({Sql.Entity<NhaO>():T}.geom) = ANY(@lats)",
                new
                {
                    commune_codes = listNhaO.Select(x => x.commune_code).Distinct().ToArray(),
                    lons = listNhaO.Select(x => x.lon).Distinct().ToArray(),
                    lats = listNhaO.Select(x => x.lat).Distinct().ToArray(),
                });
                foreach (var item in listNhaO)
                {
                    var commune = listCommune.FirstOrDefault(x => x.area_id == item.commune_code);
                    var nhaO = new NhaO
                    {
                        dia_chi = item.dia_chi,
                        so_nam = item.so_nam,
                        so_nu = item.so_nu,
                        songuoi_sotan = item.so_khau,
                        commune_code = item.commune_code,
                        district_code = commune?.parent_id,
                        province_code = commune?.proid_2004,
                    };
                    var exist = exists.FirstOrDefault(x => x.lon == item.lon && x.lat == item.lat && x.commune_code == item.commune_code);
                    if (exist != null)
                    {
                        nhaO.id = exist.id;
                        uow.Connection.Update(nhaO);
                    }
                    else
                    {
                        uow.Connection.Insert(nhaO);
                    }
                    if (exist == null && nhaO.id > 0 && item.lon * item.lat != 0)
                    {
                        uow.Connection.Execute($@"UPDATE {Sql.Entity<NhaO>():T} 
                        SET geom = ST_SetSRID(ST_MakePoint(@lon, @lat),4326) 
                        WHERE {Sql.Entity<NhaO>(x => x.id):TC} = @id", new
                        {
                            item.lon,
                            item.lat,
                            nhaO.id
                        });
                    }
                    count++;
                }
                message.Add($"Nhà ở: {count} bản ghi.");
            }
            if (listNhaVanHoa.Count() > 0)
            {
                var count = 0;
                var exists = session.Query<NhaVanHoa>($@"SELECT {Sql.Entity<NhaVanHoa>(x => x.id):TC}, ST_X({Sql.Entity<NhaVanHoa>():T}.geom) as lon, ST_Y({Sql.Entity<NhaVanHoa>():T}.geom) as lat, {Sql.Entity<NhaVanHoa>(x => x.commune_code):TC} 
                FROM {Sql.Entity<NhaVanHoa>():T} WHERE {Sql.Entity<NhaVanHoa>(x => x.commune_code):TC} = ANY(@commune_codes) AND ST_X({Sql.Entity<NhaVanHoa>():T}.geom) = ANY(@lons) AND ST_Y({Sql.Entity<NhaVanHoa>():T}.geom) = ANY(@lats)",
                new
                {
                    commune_codes = listNhaVanHoa.Select(x => x.commune_code).Distinct().ToArray(),
                    lons = listNhaVanHoa.Select(x => x.lon).Distinct().ToArray(),
                    lats = listNhaVanHoa.Select(x => x.lat).Distinct().ToArray(),
                });
                foreach (var item in listNhaVanHoa.Where(x => !string.IsNullOrWhiteSpace(x.ten_nhavh)))
                {
                    var commune = listCommune.FirstOrDefault(x => x.area_id == item.commune_code);
                    var nhaVanHoa = new NhaVanHoa
                    {
                        ten_nhavh = item.ten_nhavh,
                        dia_diem = item.dia_chi,
                        co_nhavs = item.co_vs_nam_nu,
                        co_nuoc_sach = item.co_nuoc_sach,
                        songuoi_sotan = item.so_tiepnhan,
                        co_hotro_chong_thientai = item.co_hotro_chong_thientai,
                        commune_code = item.commune_code,
                        district_code = commune?.parent_id,
                        province_code = commune?.proid_2004,
                    };
                    var exist = exists.FirstOrDefault(x => x.lon == item.lon && x.lat == item.lat && x.commune_code == item.commune_code);
                    if (exist != null)
                    {
                        nhaVanHoa.id = exist.id;
                        uow.Connection.Update(nhaVanHoa);
                    }
                    else
                    {
                        uow.Connection.Insert(nhaVanHoa);
                    }
                    if (exist == null && nhaVanHoa.id > 0 && item.lon * item.lat != 0)
                    {
                        uow.Connection.Execute($@"UPDATE {Sql.Entity<NhaVanHoa>():T} 
                        SET geom = ST_SetSRID(ST_MakePoint(@lon, @lat),4326) 
                        WHERE {Sql.Entity<NhaVanHoa>(x => x.id):TC} = @id", new
                        {
                            item.lon,
                            item.lat,
                            nhaVanHoa.id
                        });
                    }
                    count++;
                }
                message.Add($"Nhà văn hoá: {count} bản ghi.");

            }
            if (listTruongHoc.Count() > 0)
            {
                var count = 0;
                var exists = session.Query<TruongHoc>($@"SELECT {Sql.Entity<TruongHoc>(x => x.id):TC}, ST_X({Sql.Entity<TruongHoc>():T}.geom) as lon, ST_Y({Sql.Entity<TruongHoc>():T}.geom) as lat, {Sql.Entity<TruongHoc>(x => x.commune_code):TC} 
                FROM {Sql.Entity<TruongHoc>():T} WHERE {Sql.Entity<TruongHoc>(x => x.commune_code):TC} = ANY(@commune_codes) AND ST_X({Sql.Entity<TruongHoc>():T}.geom) = ANY(@lons) AND ST_Y({Sql.Entity<TruongHoc>():T}.geom) = ANY(@lats)",
                new
                {
                    commune_codes = listTruongHoc.Select(x => x.commune_code).Distinct().ToArray(),
                    lons = listTruongHoc.Select(x => x.lon).Distinct().ToArray(),
                    lats = listTruongHoc.Select(x => x.lat).Distinct().ToArray(),
                });
                foreach (var item in listTruongHoc.Where(x => !string.IsNullOrWhiteSpace(x.ten_truong)))
                {
                    var commune = listCommune.FirstOrDefault(x => x.area_id == item.commune_code);
                    var truongHoc = new TruongHoc
                    {
                        ten_truonghoc = item.ten_truong,
                        dia_diem = item.dia_chi,
                        co_nhavs = item.co_vs_nam_nu,
                        co_nuocsach = item.co_nuoc_sach,
                        songuoi_sotan = item.so_tiepnhan,
                        co_hotro_chong_thientai = item.co_hotro_chong_thientai,
                        commune_code = item.commune_code,
                        district_code = commune?.parent_id,
                        province_code = commune?.proid_2004,
                        so_hocsinh = item.so_hocsinh,
                        so_gv_canbo = item.so_gv_cb,
                    };
                    var exist = exists.FirstOrDefault(x => x.lon == item.lon && x.lat == item.lat && x.commune_code == item.commune_code);
                    if (exist != null)
                    {
                        truongHoc.id = exist.id;
                        uow.Connection.Update(truongHoc);
                    }
                    else
                    {
                        uow.Connection.Insert(truongHoc);
                    }
                    if (exist == null && truongHoc.id > 0 && item.lon * item.lat != 0)
                    {
                        uow.Connection.Execute($@"UPDATE {Sql.Entity<TruongHoc>():T} 
                        SET geom = ST_SetSRID(ST_MakePoint(@lon, @lat),4326) 
                        WHERE {Sql.Entity<TruongHoc>(x => x.id):TC} = @id", new
                        {
                            item.lon,
                            item.lat,
                            truongHoc.id
                        });
                    }
                    count++;
                }
                message.Add($"Trường học: {count} bản ghi.");
            }
            if (listCoSoYTe.Count() > 0)
            {
                var count = 0;
                var exists = session.Query<CoSoYTe>($@"SELECT {Sql.Entity<CoSoYTe>(x => x.id):TC}, ST_X({Sql.Entity<CoSoYTe>():T}.geom) as lon, ST_Y({Sql.Entity<CoSoYTe>():T}.geom) as lat, {Sql.Entity<CoSoYTe>(x => x.commune_code):TC} 
                FROM {Sql.Entity<CoSoYTe>():T} WHERE {Sql.Entity<CoSoYTe>(x => x.commune_code):TC} = ANY(@commune_codes) AND ST_X({Sql.Entity<CoSoYTe>():T}.geom) = ANY(@lons) AND ST_Y({Sql.Entity<CoSoYTe>():T}.geom) = ANY(@lats)",
                new
                {
                    commune_codes = listCoSoYTe.Select(x => x.commune_code).Distinct().ToArray(),
                    lons = listCoSoYTe.Select(x => x.lon).Distinct().ToArray(),
                    lats = listCoSoYTe.Select(x => x.lat).Distinct().ToArray(),
                });
                foreach (var item in listCoSoYTe.Where(x => !string.IsNullOrWhiteSpace(x.ten_coso)))
                {
                    var commune = listCommune.FirstOrDefault(x => x.area_id == item.commune_code);
                    var coSoYTe = new CoSoYTe
                    {
                        ten_coso = item.ten_coso,
                        dia_diem = item.dia_chi,
                        co_nhavs = item.co_vs_nam_nu,
                        co_nuocsach = item.co_nuoc_sach,
                        songuoi_sotan = item.so_tiepnhan,
                        co_hotro_chong_thientai = item.co_hotro_chong_thientai,
                        commune_code = item.commune_code,
                        district_code = commune?.parent_id,
                        province_code = commune?.proid_2004,
                        so_phongbenh = item.so_phongbenh,
                        so_y_bacsi = item.tongso_nhansu,
                        lon = item.lon,
                        lat = item.lat
                    };
                    var exist = exists.FirstOrDefault(x => x.lon == item.lon && x.lat == item.lat && x.commune_code == item.commune_code);
                    if (exist != null)
                    {
                        coSoYTe.id = exist.id;
                        uow.Connection.Update(coSoYTe);
                    }
                    else
                    {
                        uow.Connection.Insert(coSoYTe);
                    }
                    uow.Connection.Insert(coSoYTe);
                    if (exist == null && coSoYTe.id > 0 && item.lon * item.lat != 0)
                    {
                        uow.Connection.Execute($@"UPDATE {Sql.Entity<CoSoYTe>():T} 
                        SET geom = ST_SetSRID(ST_MakePoint(@lon, @lat),4326) 
                        WHERE {Sql.Entity<CoSoYTe>(x => x.id):TC} = @id", new
                        {
                            item.lon,
                            item.lat,
                            coSoYTe.id
                        });
                    }
                    count++;
                }
                message.Add($"Cơ sở y tế: {count} bản ghi.");
            }
            if (listUBND.Count() > 0)
            {
                var count = 0;
                var exists = session.Query<UBND>($@"SELECT {Sql.Entity<UBND>(x => x.id):TC}, ST_X({Sql.Entity<UBND>():T}.geom) as lon, ST_Y({Sql.Entity<UBND>():T}.geom) as lat, {Sql.Entity<UBND>(x => x.commune_code):TC} 
                FROM {Sql.Entity<UBND>():T} WHERE {Sql.Entity<UBND>(x => x.commune_code):TC} = ANY(@commune_codes) AND ST_X({Sql.Entity<UBND>():T}.geom) = ANY(@lons) AND ST_Y({Sql.Entity<UBND>():T}.geom) = ANY(@lats)",
                new
                {
                    commune_codes = listUBND.Select(x => x.commune_code).Distinct().ToArray(),
                    lons = listUBND.Select(x => x.lon).Distinct().ToArray(),
                    lats = listUBND.Select(x => x.lat).Distinct().ToArray(),
                });
                foreach (var item in listUBND.Where(x => !string.IsNullOrWhiteSpace(x.ten_ubnd)))
                {
                    var commune = listCommune.FirstOrDefault(x => x.area_id == item.commune_code);
                    var ubnd = new UBND
                    {
                        ten_uyban = item.ten_ubnd,
                        dia_diem = item.dia_chi,
                        co_nhavs = item.co_vs_nam_nu,
                        co_nuocsach = item.co_nuoc_sach,
                        songuoi_sotan = item.so_tiepnhan,
                        co_hotro_chong_thientai = item.co_hotro_chong_thientai,
                        co_tiepcan_nguoikhuyettat = item.co_tiepcan_nguoikhuyettat,
                        commune_code = item.commune_code,
                        district_code = commune?.parent_id,
                        province_code = commune?.proid_2004,
                    };
                    var exist = exists.FirstOrDefault(x => x.lon == item.lon && x.lat == item.lat && x.commune_code == item.commune_code);
                    if (exist != null)
                    {
                        ubnd.id = exist.id;
                        uow.Connection.Update(ubnd);
                    }
                    else
                    {
                        uow.Connection.Insert(ubnd);
                    }
                    uow.Connection.Insert(ubnd);
                    if (exist == null && ubnd.id > 0 && item.lon * item.lat != 0)
                    {
                        uow.Connection.Execute($@"UPDATE {Sql.Entity<UBND>():T} 
                        SET geom = ST_SetSRID(ST_MakePoint(@lon, @lat),4326) 
                        WHERE {Sql.Entity<UBND>(x => x.id):TC} = @id", new
                        {
                            item.lon,
                            item.lat,
                            ubnd.id
                        });
                    }
                    count++;
                }
                message.Add($"Uỷ ban nhân dân: {count} bản ghi.");
            }
            return new RestData
            {
                data = string.Join(" ", message)
            };
        }
    }
}