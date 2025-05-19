using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure;
using System;
using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Database;
using System.Threading.Tasks;
using System.Collections.Generic;
using VietGIS.Infrastructure.Identity.PostgreSQL.Models;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Repositories.Session;
using OpenGIS.Module.Core.Models.DevExtreme;
using System.Net;
using OpenGIS.Module.Core.Models;
using OfficeOpenXml;
using System.IO;

namespace OpenGIS.Module.API.Controllers
{
    //// [Authorize(Policy = nameof(ModuleFunction.READ_TABLE_SCHEMA))]
    public partial class TableController : BaseController
    {
        [HttpPost("history/data")]
        public async Task<RestBase> HistoryData([FromBody] TableHistoryDTO dto)
        {
            if (dto == null)
            {
                return new RestError((int)HttpStatusCode.BadRequest, "Vui lòng kiểm tra lại tham số");
            }
            using var session = OpenSession();
            var condition = "1=1 ";

            if (string.IsNullOrWhiteSpace(dto.searchValue) == false)
            {
                dto.searchValue = dto.searchValue?.ToFullTextString();
                condition += $" AND ({Sql.Entity<TableHistory>():T}.search_content @@ to_tsquery(@searchValue))";
            }
            if (dto?.@params?.from.HasValue == true)
            {
                condition += $" AND DATE({Sql.Entity<TableHistory>(x => x.action_time):TC}) >= @from";
            }
            if (dto?.@params?.to.HasValue == true)
            {
                condition += $" AND DATE({Sql.Entity<TableHistory>(x => x.action_time):TC}) <= @to";
            }
            if (!string.IsNullOrWhiteSpace(dto?.@params?.user_id))
            {
                condition += $" AND {Sql.Entity<TableHistory>(x => x.action_user):TC} = @user_id";
            }
            var withParameters = new
            {
                dto.searchValue,
                dto?.@params?.user_id,
                dto?.@params?.from,
                dto?.@params?.to,
            };
            List<TableHistory> data = new List<TableHistory>();
            if (dto.pageSize > 0)
            {
                data = session.Find<TableHistory>(statement => statement.Where($"{condition}")
                    .WithParameters(withParameters)
                    .Include<TableSchema>(x => x.LeftOuterJoin())
                    .Include<UserInfo>(x => x.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<TableHistory>(x => x.action_time):TC} DESC")
                    .Skip((dto.pageIndex - 1) * dto.pageSize)
                    .Top(dto.pageSize)
                ).ToList();
            }
            else
            {
                data = session.Find<TableHistory>(statement => statement.Where($"{condition}")
                    .WithParameters(withParameters)
                    .Include<TableSchema>(x => x.LeftOuterJoin())
                    .Include<UserInfo>(x => x.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<TableHistory>(x => x.action_time):TC} DESC")
                ).ToList();
            }
            var totalCount = session.Count<TableHistory>(statement => statement
                                .Where($"{condition}")
                                .WithParameters(withParameters));
            // if (data.Count() > 0)
            // {
            //     var userInfos = session.Find<UserInfo>(statement => statement.Where($"{Sql.Entity<UserInfo>(x => x.user_id):TC} = ANY(@userIds)")
            //     .WithParameters(new
            //     {
            //         userIds = data.Select(x => x.action_user).ToArray()
            //     }));
            //     if (userInfos.Count() > 0)
            //     {
            //         foreach (var item in data)
            //         {
            //             item.userInfo = userInfos.FirstOrDefault(x => x.user_id == item.action_user);
            //         }
            //     }
            // }

            var view = await _viewRenderer.RenderViewToStringAsync("~/Views/Shared/ReportView/_BaoCaoBienDongDuLieu.cshtml", new RestPagedDataTable
            {
                data = data,
                recordsTotal = totalCount,
                draw = (dto.pageIndex - 1) * dto.pageSize
            });
            decimal _pageCountCeil = 0;
            if (dto.pageSize > 0)
            {
                _pageCountCeil = Math.Ceiling((decimal)(totalCount / dto.pageSize));
            }


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

        [HttpPost("history/export")]
        public async Task<IActionResult> Export([FromBody] TableHistoryDTO dto)
        {
            using (var session = OpenSession())
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                string fileName = "BaoCaoBienDongDuLieu.xlsx";

                var filePath = Path.Combine(_webHostEnvironment.WebRootPath, "excelTemplate", fileName);
                using (var package = new ExcelPackage(new FileInfo(filePath)))
                {
                    var worksheet = package.Workbook.Worksheets[0];
                    var cell = worksheet.Cells;
                    var condition = "1=1 ";

                    if (string.IsNullOrWhiteSpace(dto.searchValue) == false)
                    {
                        dto.searchValue = dto.searchValue?.ToFullTextString();
                        condition += $" AND ({Sql.Entity<TableHistory>():T}.search_content @@ to_tsquery(@searchValue))";
                    }
                    if (dto?.@params?.from.HasValue == true)
                    {
                        condition += $" AND DATE({Sql.Entity<TableHistory>(x => x.action_time):TC}) >= @from";
                    }
                    if (dto?.@params?.to.HasValue == true)
                    {
                        condition += $" AND DATE({Sql.Entity<TableHistory>(x => x.action_time):TC}) <= @to";
                    }
                    if (!string.IsNullOrWhiteSpace(dto?.@params?.user_id))
                    {
                        condition += $" AND {Sql.Entity<TableHistory>(x => x.action_user):TC} = @user_id";
                    }
                    var withParameters = new
                    {
                        dto.searchValue,
                        dto?.@params?.user_id,
                        dto?.@params?.from,
                        dto?.@params?.to,
                    };
                    var data = session.Find<TableHistory>(statement => statement.Where($"{condition}")
                   .WithParameters(withParameters)
                   .Include<TableSchema>(x => x.LeftOuterJoin())
                   .Include<UserInfo>(x => x.LeftOuterJoin())
                   .OrderBy($"{Sql.Entity<TableHistory>(x => x.action_time):TC} DESC")).ToList();

                    int rowIndex = 4;
                    int STT = 1;

                    foreach (var item in data)
                    {
                        int col = 0;
                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = STT++;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.tableSchema?.description;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.layer_name;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.action_text;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.action_time_str;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.userInfo?.full_name;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.old_data;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        cell = worksheet.Cells[rowIndex, ++col];
                        cell.Value = item.new_data;
                        OfficeHelper.setStyle(ref cell, EnumFormat.NONE | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BORDER);

                        rowIndex++;
                    }

                    return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
        }
    }
}