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
using OpenGIS.Module.DRMS.Models.Category;
using VietGIS.Infrastructure.Models.Regional;
using OpenGIS.Module.DRMS.ViewModels;
using OpenGIS.Module.Core.Helpers;
using Dapper;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Enums;
using OpenGIS.Module.Core.Constants;
using OpenGIS.Module.DRMS.Enums;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Extensions;
using System.Security.Claims;
using System;
using OfficeOpenXml.ConditionalFormatting.Contracts;

namespace OpenGIS.Module.DRMS.Areas.DRMS.Controllers
{
    [AllowAnonymous]
    [Route("api/pan-ungpho-thientai")]
    public class PanUngphoThientaiController : BaseApiCRUDController<INpgsqlSession, PanUngphoThientai, int>
    {
        private readonly IMapRepository _mapRepository;
        private readonly IWorkContext _workContext;
        public PanUngphoThientaiController(IDbFactory dbFactory, IMapper mapper,
        IRepository<PanUngphoThientai, int> repository, IMapRepository mapRepository, IWorkContext workContext)
            : base(dbFactory, mapper, repository)
        {
            _mapRepository = mapRepository;
            _workContext = workContext;
        }

        [AllowAnonymous]
        [HttpGet("public/tree")]
        public RestBase PublicTree()
        {
            using var session = OpenSession();
            var data = session.Find<PhuonganThientai>(x => x
                .Include<PanUngphoThientai>(x => x.LeftOuterJoin())
                .Include<DmLoaiThientai>(x => x.LeftOuterJoin())
                .Include<Province>(x => x.LeftOuterJoin())
                .Include<District>(x => x.LeftOuterJoin())
                .Include<Commune>(x => x.LeftOuterJoin())
                .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
            ).GroupBy(x => x?.phuongAn?.nam_xaydung)
            .OrderByDescending(x => x.Key)
            .Select(x => new
            {
                key = x.Key.ToString(),
                label = "Năm " + x.Key,
                data = x.Key,
                expanded = true,
                type = "nam_xaydung",
                children = x.GroupBy(x => x.loaiThienTai)
                .OrderBy(x => x.Key?.mo_ta)
                .Select(y => new
                {
                    key = $"{x.Key}_{y.Key?.id}",
                    label = y.Key?.mo_ta,
                    data = y.Key,
                    expanded = true,
                    type = "loai_thientai",
                    children = y.OrderBy(x => x.phuongAn?.ten_phuongan).Select(z => new
                    {
                        key = $"{x.Key}_{y.Key?.id}_{z.phuongAn?.id}",
                        label = z.phuongAn?.ten_phuongan,
                        data = z.phuongAn,
                        type = "kich_ban",
                    })
                })
            });
            return new RestData { data = data };
        }

        /// <summary>
        /// API dữ liệu bản đồ nhóm theo loại thiên tai, tỉnh
        /// </summary>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpGet("public/map/tree")]
        public RestBase PublicMapTree()
        {
            using var session = OpenSession();
            var data = session.Find<PhuonganThientai>(x => x
                .Include<PanUngphoThientai>(x => x.LeftOuterJoin())
                .Include<PhuongAnMap>(x => x.LeftOuterJoin())
                .Include<DmLoaiThientai>(x => x.LeftOuterJoin())
                .Include<Province>(x => x.LeftOuterJoin())
                .Include<District>(x => x.LeftOuterJoin())
                .Include<Commune>(x => x.LeftOuterJoin())
                .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                .Include<Map>(join => join.InnerJoin())
            )
            .GroupBy(x => x.loaiThienTai)
            .OrderBy(x => x.Key?.mo_ta)
            .Select(y => new
            {
                key = $"{y.Key?.id}",
                label = y.Key?.mo_ta,
                data = y.Key,
                expanded = true,
                type = "loai_thientai",
                children = y.OrderBy(x => x.phuongAn?.province?.name_vn).GroupBy(x => x.phuongAn?.province).Select(x => new
                {
                    key = $"{y.Key?.id}_{x.Key?.area_id}",
                    label = x.Key?.name_vn,
                    data = x.Key,
                    expanded = true,
                    type = "tinh_thanhpho",
                    children = x.OrderBy(x => x.phuongAn?.map?.name).GroupBy(x => x.phuongAn?.map).Select(z => new
                    {
                        key = $"{y.Key?.id}_{x.Key?.area_id}_{z.Key?.id}",
                        label = z?.Key?.name,
                        data = z?.Key,
                        type = "ban_do",
                    })
                })
            });
            return new RestData { data = data };
        }

        [AllowAnonymous]
        [HttpPost("public/{id}")]
        public async Task<RestBase> GetKeyAsync([FromRoute] int id)
        {
            using var session = OpenSession();

            var data = (await session.FindAsync<PanUngphoThientai>(statement => statement
                .WithParameters(new { id })
                .Where($"{Sql.Entity<PanUngphoThientai>(x => x.id):TC}=@id")
               .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
               .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
               .Include<Province>(join => join.LeftOuterJoin())
               .Include<District>(join => join.LeftOuterJoin())
               .Include<Commune>(join => join.LeftOuterJoin())
            )).FirstOrDefault();

            if (data == null)
            {
                return new RestError(404, "Bản ghi không tồn tại!");
            }

            var listPhuongAnThienTai = session.Find<PhuonganThientai>(x => x
                .Include<DmLoaiThientai>()
                .Where($"{Sql.Entity<PhuonganThientai>(x => x.phuongan_id):TC} = ANY(@ids)")
                .WithParameters(new
                {
                    ids = new int[] { data.id }
                }));
            var phuongAnMap = session.Find<PhuongAnMap>(x => x
            .Include<Map>()
            .Where($"{Sql.Entity<PhuongAnMap>(x => x.phuongan_id):TC} = ANY(@ids)")
            .WithParameters(new
            {
                ids = new int[] { data.id }
            }));

            data.listPhuongAnThienTai = listPhuongAnThienTai.Where(x => x.phuongan_id == data.id);
            data.listPhuongAnMap = phuongAnMap.Where(x => x.phuongan_id == data.id);

            return new RestData
            {
                data = data
            };
        }

        [AllowAnonymous]
        [HttpPost("public/datatable")]
        public async Task<RestBase> PublicDatatableAsync([FromBody] PanUngPhoParams dataTb)
        {
            using var session = OpenSession();
            string condition = $"(1=1)";
            string tableAlias = typeof(PanUngphoThientai).Name.ToLower();
            string orderName = $" 1 ASC";
            List<PanUngphoThientai> data;

            var recordsTotal = await session.CountAsync<PanUngphoThientai>(statement => statement
                .WithAlias(tableAlias).Where($"{condition}")
                .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                .WithParameters(dataTb)
            );

            if (string.IsNullOrWhiteSpace(dataTb?.search?.value) == false)
            {
                condition += $" AND ({tableAlias}.search_content @@ to_tsquery(@keyword))";
            }
            if (dataTb?.listProvinceCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<District>(x => x.parent_id):TC} = ANY(@listProvinceCode)";
            }
            if (dataTb?.listDistrictCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@listDistrictCode)";
            }
            if (dataTb?.listCommuneCode?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.commune_code)} = ANY(@listCommuneCode)";
            }
            if (dataTb?.listYear?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.nam_xaydung)} = ANY(@listYear)";
            }
            if (dataTb?.listLoaiPhuongAnId?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.loai_phuongan_id)} = ANY(@listLoaiPhuongAnId)";
            }
            if (dataTb?.listCapPhuongAnId?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.cap_phuongan_id)} = ANY(@listCapPhuongAnId)";
            }
            if (dataTb?.listLoaiThienTai?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.id)} IN (SELECT {Sql.Entity<PhuonganThientai>(x => x.phuongan_id):TC} FROM {Sql.Entity<PhuonganThientai>():T} WHERE {Sql.Entity<PhuonganThientai>(x => x.loai_thientai_id):TC} = ANY(@listLoaiThienTai))";
            }
            if (dataTb?.orders != null && dataTb?.orders?.Count() > 0)
            {
                var tableName = typeof(PanUngphoThientai).TableNameMapper();
                var existFields = session.QueryFirstOrDefault<int>(
                    $"select COUNT(1) from information_schema.columns WHERE table_name = @tableName AND column_name = ANY(@sortFields)",
                    new
                    {
                        tableName,
                        sortFields = dataTb?.orders.Select(x => x.sortField).ToArray()
                    });
                if (existFields != dataTb?.orders?.Count())
                {
                    return new RestError(400, "Lỗi tham số orders! Vui lòng kiểm tra lại.");
                }
                orderName = string.Join(", ", dataTb?.orders?.Select(x => $"{tableAlias}.{x.sortField} {(x.sortOrder?.ToLower()?.Equals("desc") == true ? "desc" : "asc")}"));
            }
            if (!string.IsNullOrWhiteSpace(dataTb?.sortField) && !string.IsNullOrWhiteSpace(dataTb?.sortOrder?.ToLower()))
            {
                var tableName = typeof(PanUngphoThientai).TableNameMapper();
                var existField = session.QueryFirstOrDefault<int>(
                    $"select COUNT(1) from information_schema.columns WHERE table_name = @tableName AND column_name = @sortField",
                    new
                    {
                        tableName,
                        dataTb?.sortField
                    });
                if (existField == 0)
                {
                    return new RestError(400, "Lỗi tham số! Vui lòng kiểm tra lại.");
                }
                switch (dataTb?.sortOrder?.ToUpper())
                {
                    case "DESC":
                    case "ASC":
                        orderName = $"{tableAlias}.{dataTb?.sortField} {dataTb?.sortOrder}";
                        break;
                    default:
                        break;
                }
            }
            var withParams = new
            {
                keyword = dataTb?.search?.value?.ToFullTextString(),
                dataTb?.listProvinceCode,
                dataTb?.listDistrictCode,
                dataTb?.listCommuneCode,
                dataTb?.listYear,
                dataTb?.listLoaiPhuongAnId,
                dataTb?.listCapPhuongAnId,
                dataTb?.listLoaiThienTai,
            };

            if (dataTb?.length == -1)
            {
                data = (await session.FindAsync<PanUngphoThientai>(statement => statement.WithAlias(tableAlias).Where($"{condition}")
                    .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                    .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .WithParameters(withParams)
                    .OrderBy($"{orderName}")
                )).ToList();
            }
            else if (dataTb?.length == 0)
            {
                data = new List<PanUngphoThientai>();
            }
            else
            {
                data = (await session.FindAsync<PanUngphoThientai>(statement => statement
                    .WithAlias(tableAlias).Where($"{condition}")
                    .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                    .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .WithParameters(withParams)
                    .OrderBy($"{orderName}").Skip(dataTb?.start ?? 0)
                    .Top(dataTb?.length ?? 10)
                )).ToList();
            }

            if (data?.Count() > 0)
            {
                var listPhuongAnThienTai = session.Find<PhuonganThientai>(x => x
                .Include<DmLoaiThientai>()
                .Where($"{Sql.Entity<PhuonganThientai>(x => x.phuongan_id):TC} = ANY(@ids)")
                .WithParameters(new
                {
                    ids = data.Select(x => x.id).ToArray()
                }));
                var phuongAnMap = session.Find<PhuongAnMap>(x => x
                .Include<Map>()
                .Where($"{Sql.Entity<PhuongAnMap>(x => x.phuongan_id):TC} = ANY(@ids)")
                .WithParameters(new
                {
                    ids = data.Select(x => x.id).ToArray()
                }));
                foreach (var item in data)
                {
                    item.listPhuongAnThienTai = listPhuongAnThienTai.Where(x => x.phuongan_id == item.id);
                    item.listPhuongAnMap = phuongAnMap.Where(x => x.phuongan_id == item.id);
                }
            }
            var kichBanTheoNam = session.Query<ChartViewModel>(
                $@"select count(1) as {nameof(ChartViewModel.so_luong)}, {tableAlias}.nam_xaydung::text as {nameof(ChartViewModel.mo_ta)} 
                FROM {Sql.Entity<PanUngphoThientai>():T} as {tableAlias}
                left join {Sql.Entity<Province>():T} on {Sql.Entity<Province>(x => x.area_id):TC} = {tableAlias}.{nameof(PanUngphoThientai.province_code)}
                left join {Sql.Entity<District>():T} on {Sql.Entity<District>(x => x.area_id):TC} = {tableAlias}.{nameof(PanUngphoThientai.district_code)}
                left join {Sql.Entity<Commune>():T} on {Sql.Entity<Commune>(x => x.area_id):TC} = {tableAlias}.{nameof(PanUngphoThientai.commune_code)}
                where {condition} group by {tableAlias}.nam_xaydung order by {tableAlias}.nam_xaydung desc",
                 withParams
                );
            return new RestPagedDataTable<IEnumerable<PanUngphoThientai>>
            {
                data = data,
                recordsFiltered = await session.CountAsync<PanUngphoThientai>(statement => statement
                    .WithAlias(tableAlias)
                    .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                    .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .Where($"{condition}")
                    .WithParameters(withParams)
                ),
                recordsTotal = recordsTotal,
                draw = dataTb?.draw ?? 1,
                metadata = new
                {
                    kichBanTheoNam
                }
            };
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="dataTb.loaiThongKe">Loại thống kê: 1 là theo hành chính, 2 là theo loại thiên tai</param>
        /// <returns></returns>/
        [HttpPost("public/map")]
        [AllowAnonymous]
        public async Task<RestBase> PublicMapInfo([FromBody] PanUngPhoMapParams dataTb)
        {
            string condition = $"(1=1)";
            string tableAlias = typeof(PanUngphoThientai).Name.ToLower();

            if (string.IsNullOrWhiteSpace(dataTb?.search?.value) == false)
            {
                condition += $" AND ({tableAlias}.search_content @@ to_tsquery(@keyword))";
            }
            if (dataTb?.listProvinceCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<District>(x => x.parent_id):TC} = ANY(@listProvinceCode)";
            }
            if (dataTb?.listDistrictCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@listDistrictCode)";
            }
            if (dataTb?.listCommuneCode?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.commune_code)} = ANY(@listCommuneCode)";
            }
            if (dataTb?.listYear?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.nam_xaydung)} = ANY(@listYear)";
            }
            if (dataTb?.listLoaiPhuongAnId?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.loai_phuongan_id)} = ANY(@listLoaiPhuongAnId)";
            }
            if (dataTb?.listCapPhuongAnId?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.cap_phuongan_id)} = ANY(@listCapPhuongAnId)";
            }
            if (dataTb?.listLoaiThienTai?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.id)} IN (SELECT {Sql.Entity<PhuonganThientai>(x => x.phuongan_id):TC} FROM {Sql.Entity<PhuonganThientai>():T} WHERE {Sql.Entity<PhuonganThientai>(x => x.loai_thientai_id):TC} = ANY(@listLoaiThienTai))";
            }
            var withParams = new
            {
                keyword = dataTb?.search?.value?.ToFullTextString(),
                dataTb?.listProvinceCode,
                dataTb?.listDistrictCode,
                dataTb?.listCommuneCode,
                dataTb?.listYear,
                dataTb?.listLoaiPhuongAnId,
                dataTb?.listCapPhuongAnId,
                dataTb?.listLoaiThienTai,
            };
            var sql = string.Empty;
            using var session = OpenSession();
            if (dataTb?.loaiThongKe == (int)EnumLoaiThongKePanBanDo.LOAI_THIENTAI)
            {
                sql = @$"with summary_info as (
                            select count({tableAlias}.id) tong, dm.mo_ta ten_loai, panungphothientai.province_code ma_vung
                            from {Sql.Entity<PanUngphoThientai>():T} {tableAlias}
                            inner join regional.provinces on {Sql.Entity<Province>(x => x.area_id):TC} = {tableAlias}.province_code
                            left join regional.districts on {Sql.Entity<District>(x => x.area_id):TC} = {tableAlias}.district_code
                            left  join regional.communes on {Sql.Entity<Commune>(x => x.area_id):TC} = {tableAlias}.commune_code
                            left join drms.phuongan_thientai pt on {tableAlias}.id = pt.phuongan_id
                            left join category.dm_loai_thientai dm on dm.id = pt.loai_thientai_id
                            where {condition}
                            group by {tableAlias}.province_code, dm.mo_ta
                        )
                        select
                            {Sql.Entity<Province>(x => x.area_id):TC} as ma_vung, 
                            ST_X(ST_Centroid(geom)) as center_lng, ST_Y(ST_Centroid(geom)) as center_lat, 
                            {Sql.Entity<Province>(x => x.name_vn):TC} ten_vung,
                            gs.ten_loai loai_thientai,
                            gs.tong
                            from {Sql.Entity<Province>():T} left join summary_info gs on {Sql.Entity<Province>(x => x.area_id):TC} = gs.ma_vung
                            where gs.tong > 0
                            order by {Sql.Entity<Province>(x => x.area_id):TC}";

                var regionInfoList = (await session.QueryAsync<TonghopVungSummaryInfo>(sql, withParams))
                .GroupBy(x => x.ten_vung)
                .OrderBy(x => x.Key)
                .Select(x =>
                {
                    var province = x.FirstOrDefault();
                    return new
                    {
                        province?.ma_vung,
                        province?.center_lat,
                        province?.center_lng,
                        province?.ten_vung,
                        thongke_loai_thientai = x.OrderBy(y => y.loai_thientai).Select(y => new
                        {
                            y.loai_thientai,
                            y.tong
                        })
                    };
                });
                return new RestData
                {
                    data = regionInfoList
                };
            }
            else
            {
                sql = @$"with summary_info as (
                            select count({tableAlias}.id) tong, {tableAlias}.province_code ma_vung
                            from {Sql.Entity<PanUngphoThientai>():T} {tableAlias}
                            inner join regional.provinces on {Sql.Entity<Province>(x => x.area_id):TC} = {tableAlias}.province_code
                            left join regional.districts on {Sql.Entity<District>(x => x.area_id):TC} = {tableAlias}.district_code
                            left  join regional.communes on {Sql.Entity<Commune>(x => x.area_id):TC} = {tableAlias}.commune_code
                            where {condition}
                            group by {tableAlias}.province_code
                        )
                        select
                            {Sql.Entity<Province>(x => x.area_id):TC} as ma_vung, ST_X(ST_Centroid(geom)) as center_lng, ST_Y(ST_Centroid(geom)) as center_lat, gs.tong, {Sql.Entity<Province>(x => x.name_vn):TC} ten_vung
                            from {Sql.Entity<Province>():T} left join summary_info gs on {Sql.Entity<Province>(x => x.area_id):TC} = gs.ma_vung
                            where gs.tong > 0
                            order by {Sql.Entity<Province>(x => x.area_id):TC}";

                var regionInfoList = await session.QueryAsync<TonghopVungSummaryInfo>(sql, withParams);
                return new RestData
                {
                    data = regionInfoList
                };
            }
        }
        [HttpPost("public/chart")]
        [AllowAnonymous]
        public RestBase PublicChart([FromBody] PanUngPhoChartViewModel model)
        {
            var condition = $"1=1";

            if (model?.listProvinceCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<District>(x => x.parent_id):TC} = ANY(@listProvinceCode)";
            }
            if (model?.listDistrictCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@listDistrictCode)";
            }
            if (model?.listCommuneCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<PanUngphoThientai>(x => x.commune_code):TC} = ANY(@listCommuneCode)";
            }
            if (model?.listYear?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<PanUngphoThientai>(x => x.nam_xaydung):TC} = ANY(@listYear)";
            }
            if (model?.listLoaiThienTai?.Count() > 0)
            {
                condition += $" AND ({Sql.Entity<DmLoaiThientai>(x => x.id):TC} = ANY(@listLoaiThienTai))";
            }

            var leftJoin = new List<string>();
            var groupField = string.Empty;
            leftJoin.Add($@" LEFT JOIN {Sql.Entity<PhuonganThientai>():T} ON {Sql.Entity<PhuonganThientai>(x => x.phuongan_id):TC} = {Sql.Entity<PanUngphoThientai>(x => x.id):TC}
                     LEFT JOIN {Sql.Entity<DmLoaiThientai>():T} ON {Sql.Entity<PhuonganThientai>(x => x.loai_thientai_id):TC} = {Sql.Entity<DmLoaiThientai>(x => x.id):TC}");
            switch (model?.typeChart)
            {
                case (int)EnumTypeChart.HANHCHINH:
                    switch (true)
                    {
                        case true when model?.listDistrictCode?.Count() > 0:
                        case true when model?.listCommuneCode?.Count() > 0:
                            leftJoin.Add($"LEFT JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {Sql.Entity<PanUngphoThientai>(x => x.district_code):TC}");
                            leftJoin.Add($" LEFT JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {Sql.Entity<PanUngphoThientai>(x => x.commune_code):TC}");
                            groupField = $"{Sql.Entity<Commune>(x => x.name_vn):TC}";
                            break;
                        case true when model?.listProvinceCode?.Count() > 0:
                            leftJoin.Add($" LEFT JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {Sql.Entity<PanUngphoThientai>(x => x.district_code):TC}");
                            groupField = $"{Sql.Entity<District>(x => x.name_vn):TC}";
                            break;
                        default:
                            leftJoin.Add($" LEFT JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {Sql.Entity<PanUngphoThientai>(x => x.province_code):TC}");
                            groupField = $"{Sql.Entity<Province>(x => x.name_vn):TC}";
                            break;
                    }
                    break;
                case (int)EnumTypeChart.LOAIHINH:
                    leftJoin.Add($"LEFT JOIN {Sql.Entity<Province>():T} ON {Sql.Entity<Province>(x => x.area_id):TC} = {Sql.Entity<PanUngphoThientai>(x => x.province_code):TC}");
                    leftJoin.Add($"LEFT JOIN {Sql.Entity<District>():T} ON {Sql.Entity<District>(x => x.area_id):TC} = {Sql.Entity<PanUngphoThientai>(x => x.district_code):TC}");
                    leftJoin.Add($"LEFT JOIN {Sql.Entity<Commune>():T} ON {Sql.Entity<Commune>(x => x.area_id):TC} = {Sql.Entity<PanUngphoThientai>(x => x.commune_code):TC}");
                    groupField = $"{Sql.Entity<DmLoaiThientai>(x => x.mo_ta):TC}";
                    break;
                default:
                    return new RestError(400, "Lỗi tham số! Vui lòng thử lại.");
            }
            string sql = $@"SELECT COUNT(DISTINCT {Sql.Entity<PanUngphoThientai>(x => x.id):TC}) as {nameof(ChartViewModel.so_luong)}, {groupField} as {nameof(ChartViewModel.mo_ta)}
                    FROM {Sql.Entity<PanUngphoThientai>():T} 
                    {string.Join(" ", leftJoin)} WHERE {condition} GROUP BY {groupField} ORDER BY {groupField}";
            using var session = OpenSession();
            var data = session.Query<ChartViewModel>(sql, new
            {
                model?.listProvinceCode,
                model?.listDistrictCode,
                model?.listCommuneCode,
                model?.listYear,
                model?.listLoaiThienTai,
            });
            return new RestData { data = data };
        }
        [AllowAnonymous]
        [HttpGet("list-years")]
        public RestBase ListYears()
        {
            using var session = OpenSession();
            return new RestData { data = session.Query<int>($"SELECT DISTINCT {Sql.Entity<PanUngphoThientai>(x => x.nam_xaydung):TC} FROM {Sql.Entity<PanUngphoThientai>():T} ORDER BY {Sql.Entity<PanUngphoThientai>(x => x.nam_xaydung):TC} DESC") };
        }
        [AllowAnonymous]
        [HttpPost("datatable")]
        public async Task<RestBase> ListDatatableAsync([FromBody] PanUngPhoParams dataTb)
        {
            using var session = OpenSession();
            string condition = $"(1=1)";
            string tableAlias = typeof(PanUngphoThientai).Name.ToLower();
            string orderName = $" 1 ASC";
            List<PanUngphoThientai> data;
            int[] filterIds = null;
            var recordsTotal = await session.CountAsync<PanUngphoThientai>(statement => statement
                .WithAlias(tableAlias).Where($"{condition}")
                .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                .WithParameters(dataTb)
            );

            if (string.IsNullOrWhiteSpace(dataTb?.search?.value) == false)
            {
                condition += $" AND ({tableAlias}.search_content @@ to_tsquery(@keyword))";
            }
            if (dataTb?.listProvinceCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<District>(x => x.parent_id):TC} = ANY(@listProvinceCode)";
            }
            if (dataTb?.listDistrictCode?.Count() > 0)
            {
                condition += $" AND {Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@listDistrictCode)";
            }
            if (dataTb?.listCommuneCode?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.commune_code)} = ANY(@listCommuneCode)";
            }
            if (dataTb?.listYear?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.nam_xaydung)} = ANY(@listYear)";
            }
            if (dataTb?.listLoaiPhuongAnId?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.loai_phuongan_id)} = ANY(@listLoaiPhuongAnId)";
            }
            if (dataTb?.listCapPhuongAnId?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.cap_phuongan_id)} = ANY(@listCapPhuongAnId)";
            }
            if (dataTb?.listLoaiThienTai?.Count() > 0)
            {
                condition += $" AND {tableAlias}.{nameof(PanUngphoThientai.id)} IN (SELECT {Sql.Entity<PhuonganThientai>(x => x.phuongan_id):TC} FROM {Sql.Entity<PhuonganThientai>():T} WHERE {Sql.Entity<PhuonganThientai>(x => x.loai_thientai_id):TC} = ANY(@listLoaiThienTai))";
            }
            if (dataTb?.orders != null && dataTb?.orders?.Count() > 0)
            {
                var tableName = typeof(PanUngphoThientai).TableNameMapper();
                var existFields = session.QueryFirstOrDefault<int>(
                    $"select COUNT(1) from information_schema.columns WHERE table_name = @tableName AND column_name = ANY(@sortFields)",
                    new
                    {
                        tableName,
                        sortFields = dataTb?.orders.Select(x => x.sortField).ToArray()
                    });
                if (existFields != dataTb?.orders?.Count())
                {
                    return new RestError(400, "Lỗi tham số orders! Vui lòng kiểm tra lại.");
                }
                orderName = string.Join(", ", dataTb?.orders?.Select(x => $"{tableAlias}.{x.sortField} {(x.sortOrder?.ToLower()?.Equals("desc") == true ? "desc" : "asc")}"));
            }
            if (!string.IsNullOrWhiteSpace(dataTb?.sortField) && !string.IsNullOrWhiteSpace(dataTb?.sortOrder?.ToLower()))
            {
                var tableName = typeof(PanUngphoThientai).TableNameMapper();
                var existField = session.QueryFirstOrDefault<int>(
                    $"select COUNT(1) from information_schema.columns WHERE table_name = @tableName AND column_name = @sortField",
                    new
                    {
                        tableName,
                        dataTb?.sortField
                    });
                if (existField == 0)
                {
                    return new RestError(400, "Lỗi tham số! Vui lòng kiểm tra lại.");
                }
                switch (dataTb?.sortOrder?.ToUpper())
                {
                    case "DESC":
                    case "ASC":
                        orderName = $"{tableAlias}.{dataTb?.sortField} {dataTb?.sortOrder}";
                        break;
                    default:
                        break;
                }
            }
            var withParams = new
            {
                keyword = dataTb?.search?.value?.ToFullTextString(),
                dataTb?.listProvinceCode,
                dataTb?.listDistrictCode,
                dataTb?.listCommuneCode,
                dataTb?.listYear,
                dataTb?.listLoaiPhuongAnId,
                dataTb?.listCapPhuongAnId,
                dataTb?.listLoaiThienTai,
                filterIds,
            };

            if (dataTb?.length == -1)
            {
                data = (await session.FindAsync<PanUngphoThientai>(statement => statement.WithAlias(tableAlias).Where($"{condition}")
                    .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                    .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .WithParameters(withParams)
                    .OrderBy($"{orderName}")
                )).ToList();
            }
            else if (dataTb?.length == 0)
            {
                data = new List<PanUngphoThientai>();
            }
            else
            {
                data = (await session.FindAsync<PanUngphoThientai>(statement => statement
                    .WithAlias(tableAlias).Where($"{condition}")
                    .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                    .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .WithParameters(withParams)
                    .OrderBy($"{orderName}").Skip(dataTb?.start ?? 0)
                    .Top(dataTb?.length ?? 10)
                )).ToList();
            }

            if (data?.Count() > 0)
            {
                var listPhuongAnThienTai = session.Find<PhuonganThientai>(x => x
                .Include<DmLoaiThientai>()
                .Where($"{Sql.Entity<PhuonganThientai>(x => x.phuongan_id):TC} = ANY(@ids)")
                .WithParameters(new
                {
                    ids = data.Select(x => x.id).ToArray()
                }));
                var phuongAnMap = session.Find<PhuongAnMap>(x => x
                .Include<Map>()
                .Where($"{Sql.Entity<PhuongAnMap>(x => x.phuongan_id):TC} = ANY(@ids)")
                .WithParameters(new
                {
                    ids = data.Select(x => x.id).ToArray()
                }));
                foreach (var item in data)
                {
                    item.listPhuongAnThienTai = listPhuongAnThienTai.Where(x => x.phuongan_id == item.id);
                    item.listPhuongAnMap = phuongAnMap.Where(x => x.phuongan_id == item.id);
                }
            }
            return new RestPagedDataTable<IEnumerable<PanUngphoThientai>>
            {
                data = data,
                recordsFiltered = await session.CountAsync<PanUngphoThientai>(statement => statement
                    .WithAlias(tableAlias)
                    .Include<DmLoaiPhuongan>(join => join.LeftOuterJoin())
                    .Include<DmCapPhuongan>(join => join.LeftOuterJoin())
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .Where($"{condition}")
                    .WithParameters(withParams)
                ),
                recordsTotal = recordsTotal,
                draw = dataTb?.draw ?? 1,
            };
        }

        [HttpPost("xay-dung")]
        public async Task<RestBase> XayDungKichBan([FromBody] XayDungPhuongAnUngPhoViewModel model)
        {
            if (model == null || model.map == null || model.phuongAn == null)
            {
                return new RestError(400, "Lỗi tham số!");
            }
            using var session = OpenSession();
            using var uow = new UnitOfWork(DbFactory, session);
            var phuongAnId = await Repository.SaveOrUpdateAsync(model.phuongAn, uow);
            uow.Connection.BulkDelete<PhuonganThientai>(x => x
            .Where($"{nameof(PhuonganThientai.phuongan_id)} = @phuongAnId")
            .WithParameters(new { phuongAnId }));
            if (model.phuongAn?.listPhuongAnThienTai?.Count() > 0)
            {
                foreach (var item in model?.phuongAn?.listPhuongAnThienTai)
                {
                    item.phuongan_id = phuongAnId;
                    uow.Connection.Insert(item);
                }
            }

            var sql = string.Empty;
            var center = string.Empty;
            switch (true)
            {
                case true when !string.IsNullOrWhiteSpace(model?.phuongAn?.commune_code):
                    sql = $"SELECT ST_AsGeoJSON(geom) as {nameof(Map.boundary)}, concat(ST_X(ST_Centroid(geom)), ', ' ,ST_Y(ST_Centroid(geom))) as {nameof(Map.center)} FROM {Sql.Entity<Commune>():T} WHERE {Sql.Entity<Commune>(x => x.area_id):TC} = @commune_code";
                    break;
                case true when !string.IsNullOrWhiteSpace(model?.phuongAn?.district_code):
                    sql = $"SELECT ST_AsGeoJSON(geom) as {nameof(Map.boundary)}, concat(ST_X(ST_Centroid(geom)), ', ' ,ST_Y(ST_Centroid(geom))) as {nameof(Map.center)} FROM {Sql.Entity<District>():T} WHERE {Sql.Entity<District>(x => x.area_id):TC} = @district_code";
                    break;
                case true when !string.IsNullOrWhiteSpace(model?.phuongAn?.province_code):
                    sql = $"SELECT ST_AsGeoJSON(geom) as {nameof(Map.boundary)}, concat(ST_X(ST_Centroid(geom)), ', ' ,ST_Y(ST_Centroid(geom))) as {nameof(Map.center)} FROM {Sql.Entity<Province>():T} WHERE {Sql.Entity<Province>(x => x.area_id):TC} = @province_code";
                    break;
                default:
                    break;
            }
            if (!string.IsNullOrWhiteSpace(sql))
            {
                var mapView = session.QueryFirstOrDefault<Map>(sql, model?.phuongAn);
                if (mapView != null)
                {
                    model.map.center = mapView.center;
                    model.map.boundary = mapView.boundary;
                }
            }
            model.map.defaultzoom = 11;
            model.map.minzoom = 7;
            model.map.maxzoom = 20;
            var mapId = await _mapRepository.SaveOrUpdateAsync(model.map, uow);
            uow.Connection.BulkDelete<PhuongAnMap>(x => x
            .Where($"{nameof(PhuongAnMap.phuongan_id)} = @phuongAnId")
            .WithParameters(new { phuongAnId }));
            uow.Connection.Insert(new PhuongAnMap
            {
                phuongan_id = phuongAnId,
                map_id = mapId
            });
            uow.Connection.BulkDelete<MapBaseLayers>(x => x
            .Where($"{nameof(MapBaseLayers.map_id)} = @mapId")
            .WithParameters(new { mapId }));
            if (model.map.mapBaseLayers != null && model.map.mapBaseLayers.Count() > 0)
            {
                foreach (MapBaseLayers mapLayer in model.map.mapBaseLayers)
                {
                    mapLayer.map_id = mapId;
                    uow.Connection.Insert(mapLayer);
                }
            }
            uow.Connection.BulkDelete<MapLayers>(x => x
            .Where($"{nameof(MapLayers.map_id)} = @mapId")
            .WithParameters(new { mapId }));
            if (model.map.mapLayers != null && model.map.mapLayers.Count() > 0)
            {
                foreach (MapLayers mapLayer in model.map.mapLayers)
                {
                    mapLayer.map_id = mapId;
                    uow.Connection.Insert(mapLayer);
                }
            }
            uow.Connection.BulkDelete<MapTables>(x => x
            .Where($"{nameof(MapTables.map_id)} = @mapId")
            .WithParameters(new { mapId }));
            if (model.map.mapTables != null && model.map.mapTables.Count() > 0)
            {
                foreach (MapTables mapTable in model.map.mapTables)
                {
                    mapTable.map_id = mapId;
                    uow.Connection.Insert(mapTable);
                }
            }
            uow.Connection.BulkDelete<MapRegion>(x => x
            .Where($"{nameof(MapRegion.map_id)} = @mapId")
            .WithParameters(new { mapId }));
            uow.Connection.Insert(new MapRegion
            {
                area_code = model.phuongAn.province_code,
                map_id = mapId,
                area_type = 1,
            });
            if (!string.IsNullOrWhiteSpace(model.phuongAn.district_code))
            {
                uow.Connection.Insert(new MapRegion
                {
                    area_code = model.phuongAn.district_code,
                    map_id = mapId,
                    area_type = 2,
                });
            }
            if (!string.IsNullOrWhiteSpace(model.phuongAn.commune_code))
            {
                uow.Connection.Insert(new MapRegion
                {
                    area_code = model.phuongAn.commune_code,
                    map_id = mapId,
                    area_type = 3,
                });
            }
            return new RestBase(EnumErrorCode.OK);
        }
        /// <summary>
        /// Trả về id của user đang đăng nhập hiện tại
        /// </summary>
        /// <returns></returns>
        protected virtual string? getUserId()
        {
            var principal = HttpContext.User;
            //if (principal?.Claims != null)
            //{
            //    {
            //    foreach (var claim in principal.Claims)
            //    }
            //}
            return principal?.Claims?.FirstOrDefault(p => p.Type == "sub" || p.Type == ClaimTypes.NameIdentifier)?.Value;
        }
    }
}