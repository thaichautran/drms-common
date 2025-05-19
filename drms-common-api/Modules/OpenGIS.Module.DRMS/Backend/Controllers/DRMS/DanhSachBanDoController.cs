using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Repositories.Session;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.DRMS.Models;
using OpenGIS.Module.DRMS.ViewModels;
using System.Collections.Generic;
using Dapper.FastCrud;
using OpenGIS.Module.Core.Helpers;
using Dapper;
using VietGIS.Infrastructure.Helpers;
using OpenGIS.Module.DRMS.Models.Category;
using System.Linq;
using System;
using VietGIS.Infrastructure.Models.Regional;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using OpenGIS.Module.DRMS.Models.DRMS;

namespace OpenGIS.Module.DRMS.Areas.DRMS.Controllers
{
    [Authorize(AuthenticationSchemes = OpenGIS.Module.Core.Constants.Constants.AUTH_SCHEMES)]
    [Route("api/danh-sach-ban-do")]
    public class DanhSachBanDoController : BaseApiCRUDController<INpgsqlSession, DanhSachBanDo, int>
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        public DanhSachBanDoController(IDbFactory dbFactory, IMapper mapper, IRepository<DanhSachBanDo, int> repository, IWebHostEnvironment hostingEnvironment)
        : base(dbFactory, mapper, repository)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        [HttpPost("datatable")]
        public async Task<RestBase> DatatableAsync([FromBody] DanhSachBanDoParams dataTb)
        {
            using var session = OpenSession();
            string condition = $"(1=1)";
            string tableAlias = typeof(DanhSachBanDo).Name.ToLower();
            string order = $" 1 ASC";
            List<DanhSachBanDo> data;
            var recordsTotal = await session.CountAsync<DanhSachBanDo>();
            if (dataTb != null && string.IsNullOrWhiteSpace(dataTb?.search?.value) == false)
            {
                condition += $" AND ({tableAlias}.\"search_content\" @@ to_tsquery(@keyword))";
            }
            if (dataTb != null && dataTb.loaiBanDoId > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.loai_bando_id):C} = @loaiBanDoId)";
            }
            if (dataTb != null && dataTb.listProvinceCode != null && dataTb.listProvinceCode.Count() > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.province_code):C} = ANY(@listProvinceCode))";
            }
            if (dataTb != null && dataTb.listDistrictCode != null && dataTb.listDistrictCode.Count() > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.district_code):C} = ANY(@listDistrictCode))";
            }
            if (dataTb != null && dataTb.listCommuneCode != null && dataTb.listCommuneCode.Count() > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.commune_code):C} = ANY(@listCommuneCode))";
            }
            if (dataTb != null && dataTb.listNamXayDung != null && dataTb.listNamXayDung.Count() > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.nam_xaydung):C} = ANY(@listNamXayDung))";
            }
            if (!string.IsNullOrWhiteSpace(dataTb?.sortField) && !string.IsNullOrWhiteSpace(dataTb?.sortOrder?.ToLower()))
            {
                var tableName = typeof(DanhSachBanDo).TableNameMapper();
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
                        order = $"{tableAlias}.{dataTb?.sortField} {dataTb?.sortOrder}";
                        break;
                    default:
                        break;
                }
            }
            if (dataTb?.columns != null && dataTb?.columns?.Count() > 0)
            {
                if (dataTb?.order != null)
                {
                    if (dataTb.order.Count() > 0 && dataTb.order[0].column != 0)
                    {
                        order = $"{dataTb.columns[dataTb.order[0].column].name} {dataTb.order[0].dir}";
                    }
                }
            }
            var withParams = new
            {
                keyword = dataTb?.search?.value?.ToFullTextString(),
                dataTb?.listNamXayDung,
                dataTb?.loaiBanDoId,
                dataTb?.listProvinceCode,
                dataTb?.listDistrictCode,
                dataTb?.listCommuneCode,
            };

            if (dataTb?.length == -1)
            {
                data = (await session.FindAsync<DanhSachBanDo>(statement => statement
                    .Include<DmLoaiBanDo>(join => join.InnerJoin())
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .WithAlias(tableAlias)
                    .Where($"{condition}")
                    .WithParameters(withParams)
                    .OrderBy($"{order}"))).ToList();
            }
            else
            {
                data = (await session.FindAsync<DanhSachBanDo>(statement => statement
               .Include<DmLoaiBanDo>(join => join.InnerJoin())
               .Include<Province>(join => join.LeftOuterJoin())
                .Include<District>(join => join.LeftOuterJoin())
                .Include<Commune>(join => join.LeftOuterJoin())
               .WithAlias(tableAlias)
               .Where($"{condition}")
               .WithParameters(withParams)
               .OrderBy($"{order}")
               .Skip(dataTb?.start ?? 0)
               .Top(dataTb?.length ?? 10))).ToList();
            }
            var recordsFiltered = await session.CountAsync<DanhSachBanDo>(statement => statement
                    .Include<DmLoaiBanDo>(join => join.InnerJoin())
                    .WithAlias(tableAlias)
                    .Where($"{condition}")
                    .WithParameters(withParams)
                );
            return new RestPagedDataTable<IEnumerable<DanhSachBanDo>>
            {
                data = data,
                recordsFiltered = recordsFiltered,
                recordsTotal = recordsTotal,
                draw = dataTb?.draw ?? 1,
            };
        }

        [HttpPost("public/datatable")]
        [AllowAnonymous]
        public async Task<RestBase> PublicDatatableAsync([FromBody] DanhSachBanDoParams dataTb)
        {
            using var session = OpenSession();
            string condition = $"(1=1)";
            string tableAlias = typeof(DanhSachBanDo).Name.ToLower();
            string order = $" 1 ASC";
            List<DanhSachBanDo> data;
            if (dataTb != null && dataTb.loaiBanDoId > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.loai_bando_id):C} = @loaiBanDoId)";
            }

            var recordsTotal = await session.CountAsync<DanhSachBanDo>(statement => statement
                        .WithAlias(tableAlias)
                        .Where($"{condition}")
                        .WithParameters(new { dataTb?.loaiBanDoId }));

            if (dataTb != null && string.IsNullOrWhiteSpace(dataTb?.search?.value) == false)
            {
                condition += $" AND ({tableAlias}.\"search_content\" @@ to_tsquery(@keyword))";
            }
            if (dataTb != null && dataTb.listNamXayDung != null && dataTb.listNamXayDung.Count() > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.nam_xaydung):C} = ANY(@listNamXayDung))";
            }
            if (dataTb != null && dataTb.listProvinceCode != null && dataTb.listProvinceCode.Count() > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.province_code):C} = ANY(@listProvinceCode))";
            }
            if (dataTb != null && dataTb.listDistrictCode != null && dataTb.listDistrictCode.Count() > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.district_code):C} = ANY(@listDistrictCode))";
            }
            if (dataTb != null && dataTb.listCommuneCode != null && dataTb.listCommuneCode.Count() > 0)
            {
                condition += $" AND ({tableAlias}.{nameof(DanhSachBanDo.commune_code):C} = ANY(@listCommuneCode))";
            }
            if (!string.IsNullOrWhiteSpace(dataTb?.sortField) && !string.IsNullOrWhiteSpace(dataTb?.sortOrder?.ToLower()))
            {
                var tableName = typeof(DanhSachBanDo).TableNameMapper();
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
                        order = $"{tableAlias}.{dataTb?.sortField} {dataTb?.sortOrder}";
                        break;
                    default:
                        break;
                }
            }
            if (dataTb?.columns != null && dataTb?.columns?.Count() > 0)
            {
                if (dataTb?.order != null)
                {
                    if (dataTb.order.Count() > 0 && dataTb.order[0].column != 0)
                    {
                        order = $"{dataTb.columns[dataTb.order[0].column].name} {dataTb.order[0].dir}";
                    }
                }
            }
            var withParams = new
            {
                keyword = dataTb?.search?.value?.ToFullTextString(),
                dataTb?.listNamXayDung,
                dataTb?.loaiBanDoId,
                dataTb?.listProvinceCode,
                dataTb?.listDistrictCode,
                dataTb?.listCommuneCode,
            };

            if (dataTb?.length == -1)
            {
                data = (await session.FindAsync<DanhSachBanDo>(statement => statement
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .Include<DmLoaiBanDo>(join => join.InnerJoin())
                    .WithAlias(tableAlias)
                    .Where($"{condition}")
                    .WithParameters(withParams)
                    .OrderBy($"{order}"))).ToList();
            }
            else
            {
                data = (await session.FindAsync<DanhSachBanDo>(statement => statement
                .Include<Province>(join => join.LeftOuterJoin())
                .Include<District>(join => join.LeftOuterJoin())
                .Include<Commune>(join => join.LeftOuterJoin())
               .Include<DmLoaiBanDo>(join => join.InnerJoin())
               .WithAlias(tableAlias)
               .Where($"{condition}")
               .WithParameters(withParams)
               .OrderBy($"{order}")
               .Skip(dataTb?.start ?? 0)
               .Top(dataTb?.length ?? 10))).ToList();
            }
            var recordsFiltered = await session.CountAsync<DanhSachBanDo>(statement => statement
                    .Include<DmLoaiBanDo>(join => join.InnerJoin())
                    .WithAlias(tableAlias)
                    .Where($"{condition}")
                    .WithParameters(withParams)
                );
            var banDoTheoNam = session.Query<ChartViewModel>(
                $"select count(1) as {nameof(ChartViewModel.so_luong)}, {tableAlias}.nam_xaydung::text as {nameof(ChartViewModel.mo_ta)} FROM {Sql.Entity<DanhSachBanDo>():T} as {tableAlias} where {condition} group by {tableAlias}.nam_xaydung order by {tableAlias}.nam_xaydung desc",
                withParams
                );
            return new RestPagedDataTable<IEnumerable<DanhSachBanDo>>
            {
                data = data,
                recordsFiltered = recordsFiltered,
                recordsTotal = recordsTotal,
                draw = dataTb?.draw ?? 1,
                metadata = new
                {
                    banDoTheoNam
                }
            };
        }

        [HttpGet("{id}/download")]
        [AllowAnonymous]
        public ActionResult Download([FromRoute] int id)
        {
            using var session = OpenSession();
            var attachment = session.Get(new DanhSachBanDo { id = id });
            if (attachment != null)
            {
                if (string.IsNullOrWhiteSpace(attachment.tenfile_luutru) == false)
                {
                    string filePath = string.Empty;

                    if (FileHelper.IsImage(attachment.tenfile_luutru))
                    {
                        var textFind = "media";
                        var fileIndex = attachment.url.IndexOf("media");
                        if (fileIndex > 0)
                        {
                            filePath = Path.Combine(_hostingEnvironment.ContentRootPath, "Data_Stores", "salt", "media", attachment.url.Substring(fileIndex + textFind.Length + 1));
                        }
                    }
                    else
                    {
                        var textFind = "_documents";
                        var fileIndex = attachment.url.IndexOf("_documents");
                        if (fileIndex > 0)
                        {
                            filePath = Path.Combine(_hostingEnvironment.ContentRootPath, "Data_Stores", "documents", attachment.url.Substring(fileIndex + textFind.Length + 1));
                        }
                    }

                    if (!System.IO.File.Exists(filePath))
                    {
                        return NotFound();
                    }

                    byte[] fileBytes = System.IO.File.ReadAllBytes(filePath);
                    return File(fileBytes, "application/force-download", attachment.tenfile_goc);
                }
            }
            return NotFound();
        }
    }
}
