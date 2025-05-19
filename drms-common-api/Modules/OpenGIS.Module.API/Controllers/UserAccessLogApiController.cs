using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using AutoMapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.DevExtreme;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/user/access-log")]
    public class UserAccessLogApiController : BaseApiCRUDController<INpgsqlSession, UserAccessLog, int>
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
        public UserAccessLogApiController(IDbFactory dbFactory, IMapper mapper, IRepository<UserAccessLog, int> repository, IWebHostEnvironment webHostEnvironment)
            : base(dbFactory, mapper, repository)
        {
            _webHostEnvironment = webHostEnvironment;
        }
        [HttpPost("data-grid")]
        public RestBase DataGrid([FromBody] UserAccessLogGridParams dto)
        {
            if (dto == null)
            {
                return new RestError((int)HttpStatusCode.BadRequest, "Vui lòng kiểm tra lại tham số");
            }
            using var session = OpenSession();
            var condition = "1=1 ";
            if (string.IsNullOrWhiteSpace(dto.searchValue) == false)
            {
                condition += $" AND {Sql.Entity<UserAccessLog>():T}.search_content @@ to_tsquery(@keyword)";
            }
            if (string.IsNullOrWhiteSpace(dto.user_name) == false)
            {
                condition += $" AND {Sql.Entity<UserAccessLog>(x => x.user_name):TC} = @user_name";
            }
            if (dto?.from > DateTime.MinValue)
            {
                condition += $" AND {Sql.Entity<UserAccessLog>(x => x.timestamp):TC} >= @from";
            }
            if (dto?.to > DateTime.MinValue)
            {
                condition += $" AND {Sql.Entity<UserAccessLog>(x => x.timestamp):TC} <= @to";
            }
            if (dto?.timestamp > DateTime.MinValue)
            {
                condition += $" AND date_trunc('day',{Sql.Entity<UserAccessLog>(x => x.timestamp):TC}) = date_trunc('day',@timestamp)";
            }
            List<UserAccessLog> data = new List<UserAccessLog>();
            var withParams = new
            {
                keyword = dto.searchValue?.ToFullTextString(),
                dto.user_name,
                dto.from,
                dto.to,
                dto.timestamp,
            };
            if (dto.take > 0)
            {
                data = session.Find<UserAccessLog>(statement => statement.Where($"{condition}")
                    .WithParameters(withParams)
                    .OrderBy($"{Sql.Entity<UserAccessLog>(x => x.timestamp):TC} DESC")
                    .Skip(dto.skip)
                    .Top(dto.take)
                ).ToList();
            }
            else
            {
                data = session.Find<UserAccessLog>(statement => statement.Where($"{condition}")
                    .WithParameters(withParams)
                    .OrderBy($"{Sql.Entity<UserAccessLog>(x => x.timestamp):TC} DESC")
                ).ToList();
            }
            return new RestPagedDataTable()
            {
                data = data,
                recordsTotal = session.Count<UserAccessLog>(statement => statement
                    .Where($"{condition}")
                    .WithParameters(withParams)
                )
            };
        }
        [HttpPost("export")]
        public ActionResult Export([FromBody] UserAccessLogGridParams dto)
        {
            if (dto == null)
            {
                return NotFound();
            }
            using var session = OpenSession();
            var condition = "1=1 ";
            if (string.IsNullOrWhiteSpace(dto.searchValue) == false)
            {
                condition += $" AND {Sql.Entity<UserAccessLog>():T}.search_content @@ to_tsquery(@keyword)";
            }
            if (string.IsNullOrWhiteSpace(dto.user_name) == false)
            {
                condition += $" AND {Sql.Entity<UserAccessLog>(x => x.user_name):TC} = @user_name";
            }
            if (dto?.from > DateTime.MinValue)
            {
                condition += $" AND {Sql.Entity<UserAccessLog>(x => x.timestamp):TC} >= @from";
            }
            if (dto?.to > DateTime.MinValue)
            {
                condition += $" AND {Sql.Entity<UserAccessLog>(x => x.timestamp):TC} <= @to";
            }
            if (dto?.timestamp > DateTime.MinValue)
            {
                condition += $" AND date_trunc('day',{Sql.Entity<UserAccessLog>(x => x.timestamp):TC}) = date_trunc('day',@timestamp)";
            }
            var withParams = new
            {
                keyword = dto.searchValue?.ToFullTextString(),
                dto.user_name,
                dto.from,
                dto.to,
                dto.timestamp,
            };

            var data = session.Find<UserAccessLog>(statement => statement.Where($"{condition}")
                    .WithParameters(withParams)
                    .OrderBy($"{Sql.Entity<UserAccessLog>(x => x.timestamp):TC} DESC")
                ).ToList();

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            var filePath = Path.Combine(_webHostEnvironment.WebRootPath, "excelTemplate", "user_log.xlsx");
            using (var package = new ExcelPackage(new FileInfo(filePath)))
            {
                var sheet = package.Workbook.Worksheets[0];

                var cell = sheet.Cells[1, 1];

                if (data.Count > 0)
                {
                    int rowIndex = 4;
                    int index = 0;
                    foreach (var item in data)
                    {
                        int col = 0;
                        cell = sheet.Cells[rowIndex, ++col];
                        cell.Style.WrapText = true;
                        cell.Value = ++index;
                        OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                        cell = sheet.Cells[rowIndex, ++col];
                        cell.Style.WrapText = true;
                        cell.Value = item.user_name;
                        OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.LEFT);

                        cell = sheet.Cells[rowIndex, ++col];
                        cell.Style.WrapText = true;
                        cell.Value = item.url;
                        OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.LEFT);

                        cell = sheet.Cells[rowIndex, ++col];
                        cell.Style.WrapText = true;
                        cell.Value = item.ip_address;
                        OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.LEFT);

                        cell = sheet.Cells[rowIndex, ++col];
                        cell.Style.WrapText = true;
                        cell.Value = item.method;
                        OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.LEFT);

                        cell = sheet.Cells[rowIndex, ++col];
                        cell.Style.WrapText = true;
                        cell.Value = item.timestamp?.ToString("dd/MM/yyyy hh:mm");
                        OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.LEFT);
                        rowIndex++;
                    }
                }
                return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"QuanTriLog_{DateTime.Now.ToString("ddMMyyyyhhmmss")}.xlsx");
            }
        }
    }
}