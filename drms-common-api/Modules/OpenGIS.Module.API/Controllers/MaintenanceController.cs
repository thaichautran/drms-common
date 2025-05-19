using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using Microsoft.AspNetCore.Hosting;
using OpenGIS.Module.Core.Models;
using OfficeOpenXml;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.ViewModels;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using VietGIS.Infrastructure.Identity.Entities;
using OpenGIS.Module.API.Helpers;
using OpenGIS.Module.Core.Enums;
using VietGIS.Infrastructure;
using Microsoft.AspNetCore.Identity;
using VietGIS.Infrastructure.Identity.Managers;
using HeyRed.Mime;
using VietGIS.Infrastructure.Helpers;
using Microsoft.AspNetCore.Authorization;
using System.Net;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_MAINTENANCE))]
    public class MaintenanceController : BaseController
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        protected readonly IFeatureFileRepository _featureFileRepository;
        protected readonly ApplicationUserManager _userManager;
        protected readonly IWorderRepository _worderRepository;
        protected readonly IThongTinTraoDoiKiemTraRepository _thongTinTraoDoiKiemTraRepository;
        public MaintenanceController(IDbFactory dbFactory, IWebHostEnvironment hostingEnvironment,
                                UserManager<ApplicationUser> userManager,
                                IFeatureFileRepository featureFileRepository,
                                IThongTinTraoDoiKiemTraRepository thongTinTraoDoiKiemTraRepository
        ) : base(dbFactory)
        {
            _featureFileRepository = featureFileRepository;
            _hostingEnvironment = hostingEnvironment;
            _userManager = (ApplicationUserManager)userManager;
            _thongTinTraoDoiKiemTraRepository = thongTinTraoDoiKiemTraRepository;
        }

        [HttpPost("list")]
        public async Task<RestBase> listWorder([FromForm] MaintenanceParameters param)
        {
            if (param == null)
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            using (var session = OpenSession())
            {
                var condition = " 1= 1";
                if (param.org_id > 0)
                {
                    condition += @$" AND w.{nameof(Worder.org_id)} = @org_id";
                }
                if (param.worg_id > 0)
                {
                    condition += @$" AND w.{nameof(Worder.worg_id)} = @worg_id";
                }
                if (param.obj_type_id > 0)
                {
                    condition += @$" AND w.{nameof(Worder.obj_type_id)} = @obj_type_id";
                }
                if (param.wtype_id > 0)
                {
                    condition += @$" AND w.{nameof(Worder.obj_type_id)} = @wtype_id";
                }
                if (param.wstatus_id_all > 0)
                {
                    condition += @$" AND w.{nameof(Worder.wstatus_id_all)} = @wstatus_id_all";
                }
                if (param.wkind_id > 0)
                {
                    condition += @$" AND w.{nameof(Worder.wkind_id)} = @wkind_id";
                }
                if (param.start_date != null && param.start_date != DateTime.MinValue)
                {
                    param.start_date = param.start_date.Value.ToUniversalTime();
                    condition += @$" AND w.{nameof(Worder.user_cr_dtime)} >= @start_date";
                }
                if (param.end_date != null && param.end_date != DateTime.MinValue)
                {
                    param.end_date = param.end_date.Value.ToUniversalTime();
                    condition += @$" AND w.{nameof(Worder.user_cr_dtime)} <= @end_date";
                }
                if (!String.IsNullOrWhiteSpace(param.key))
                {
                    param.key = param.key.ToFullTextString();
                    condition += $@" AND w.search_content @@ to_tsquery(@key)";
                }
                if (!string.IsNullOrWhiteSpace(param.is_processExist))
                {
                    if (param.is_processExist == "yes")
                    {
                        condition += $@" AND (SELECT COUNT(spe.PROCESS_EXISTID) 
	                                    FROM maintenance.W_WORDER wor LEFT JOIN maintenance.S_PROCESS_EXISTS spe ON wor.WORDERID = spe.OBJID 
	                                    WHERE wor.WORDERID= {nameof(Worder.worder_id)}) > 0 ";
                    }
                    else if (param.is_processExist == "no")
                    {
                        condition += $@" AND (SELECT COUNT(spe.PROCESS_EXISTID) 
	                                    FROM maintenance.w_worder wor LEFT JOIN maintenance.s_process_exists spe ON wor.worder_id = spe.obj_id 
	                                    WHERE wor.worder_id = {nameof(Worder.worder_id)}) = 0 ";
                    }
                }
                var sql = @$"SELECT *, org.mo_ta AS org_name, worg.mo_ta AS worg_name, objtype.mo_ta AS obj_type_name, wtype.mo_ta AS wtype_name, 
                                 wkin.mo_ta AS wkind_name, wstatus.mo_ta AS wstatus_all, wtype_result.mo_ta AS wtype_result_name 
                                 FROM {Sql.Entity<Worder>():T} w
                                 LEFT JOIN category.dm_donvi_quanly org ON w.org_id = org.id 
                                 LEFT JOIN category.dm_donvi_quanly worg ON w.worg_id = worg.id 
                                 LEFT JOIN category.dm_loai_congviec objtype ON w.obj_type_id = objtype.id 
                                 LEFT JOIN category.dm_kieu_congviec wtype ON w.wtype_id = wtype.id 
                                 LEFT JOIN category.dm_hinhthuc_kiemtra wkin ON w.wkind_id = wkin.id 
                                 LEFT JOIN category.dm_trangthai_congviec wstatus ON w.wstatus_id_all = wstatus.id 
                                 LEFT JOIN category.dm_ketqua_thuchien wtype_result ON w.wtype_result_id = wtype_result.id  
                                 WHERE {condition} ORDER BY {nameof(Worder.actual_finish_date)} DESC LIMIT {param.take} OFFSET {param.skip}";
                var data = session.Query<WorderInfoViewModel>(sql, param).ToList();
                int totalCount = session.Query<int>($"SELECT COUNT({nameof(Worder.worder_id)}) FROM {Sql.Entity<Worder>():T} w WHERE {condition}", param).FirstOrDefault();
                return new RestPagedDataTable
                {
                    data = data,
                    recordsFiltered = data.Count(),
                    recordsTotal = totalCount,
                };
            }
        }

        [HttpPost("export")]
        public IActionResult ExportBaoDuongExcelAsync([FromForm] MaintenanceParameters param)
        {
            using (var session = OpenSession())
            {
                var condition = " 1= 1";
                if (param.org_id > 0)
                {
                    condition += @$" AND {nameof(Worder.org_id)} = @org_id";
                }
                if (param.worg_id > 0)
                {
                    condition += @$" AND {nameof(Worder.worg_id)} = @worg_id";
                }
                if (param.obj_type_id > 0)
                {
                    condition += @$" AND {nameof(Worder.obj_type_id)} = @obj_type_id";
                }
                if (param.wtype_id > 0)
                {
                    condition += @$" AND {nameof(Worder.wtype_id)} = @wtype_id";
                }
                if (param.wstatus_id_all > 0)
                {
                    condition += @$" AND {nameof(Worder.wstatus_id_all)} = @wstatus_id_all";
                }
                if (param.wkind_id > 0)
                {
                    condition += @$" AND {nameof(Worder.wkind_id)} = @wkind_id";
                }
                if (param.start_date != null && param.start_date != DateTime.MinValue)
                {
                    param.start_date = param.start_date.Value.ToUniversalTime();
                    condition += @$" AND {nameof(Worder.user_cr_dtime)} >= @start_date";
                }
                if (param.end_date != null && param.end_date != DateTime.MinValue)
                {
                    param.end_date = param.end_date.Value.ToUniversalTime();
                    condition += @$" AND {nameof(Worder.user_cr_dtime)} <= @end_date";
                }
                if (!String.IsNullOrWhiteSpace(param.key))
                {
                    param.key = param.key.ToFullTextString();
                    condition += $@" AND {Sql.Entity<Worder>():T}.search_content @@ to_tsquery(@key)";
                }
                var sql = @$"SELECT * FROM {Sql.Entity<Worder>():T} WHERE {condition} ORDER BY {nameof(Worder.actual_finish_date)} DESC";
                var data = session.Query<Worder>(sql, param).ToList();
                int totalCount = session.Query<int>($"SELECT COUNT({nameof(Worder.worder_id)}) FROM {Sql.Entity<Worder>():T}  WHERE {condition}", param).FirstOrDefault();

                ExcelWorksheet sheet;
                ExcelRange cell;
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (ExcelPackage p = new ExcelPackage())
                {
                    int row = 1;
                    var col = 0;

                    sheet = p.Workbook.Worksheets.Add($"Danh sách công việc kiểm tra");
                    cell = sheet.Cells[sheet.Cells[row, 1] + ":" + sheet.Cells[row, 20]];
                    cell.Merge = true;
                    cell.Style.Font.Size = 14;
                    cell.Style.Font.Name = "Times New Roman";

                    cell.Value = "Danh sách công việc kiểm tra";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    row++;

                    cell = sheet.Cells[sheet.Cells[row, 1] + ":" + sheet.Cells[row, 20]];
                    cell.Merge = true;
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = $"Tổng cộng: {totalCount}";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                    row++;
                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "STT";
                    cell.Style.WrapText = true;
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Mô tả";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Đơn vị quản lý";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Đơn vị thực hiện";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Loại thực hiện";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Kiểu công việc";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Hình thức kiểm tra";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Kết quả thực hiện";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Ngày bắt đầu dự báo";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Ngày kết thúc dự báo";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Ngày bắt đầu kế hoạch";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Ngày kết thúc kế hoạch";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Ngày bắt đầu thực hiện";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Ngày kết thúc thực hiện";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Trạng thái";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Mô tả tóm tắt công việc";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Mô tả chi tiết công việc";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Mô tả chi tiết kết quả thực hiện công việc";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Người cập nhật";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    cell = sheet.Cells[row, ++col];
                    cell.Style.Font.Size = 11;
                    cell.Style.Font.Name = "Times New Roman";
                    cell.Value = "Ngày cập nhật";
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE | EnumFormat.BOLD);

                    if (data.Count() > 0)
                    {
                        var count = 0;
                        foreach (var item in data)
                        {
                            col = 0;
                            row++;
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = ++count;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.wdesc;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            var org_name = session.Query<string>(@$"SELECT mo_ta FROM category.dm_donvi_quanly WHERE id = @org_id", new { org_id = item.org_id }).FirstOrDefault();
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = org_name;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            var worg_name = session.Query<string>(@$"SELECT mo_ta FROM category.dm_donvi_quanly WHERE id = @worg_id", new { worg_id = item.worg_id }).FirstOrDefault();
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = worg_name;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            var obj_type_name = session.Query<string>(@$"SELECT mo_ta FROM category.dm_loai_congviec WHERE id = @obj_type_id", new { obj_type_id = item.obj_type_id }).FirstOrDefault();
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = obj_type_name;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            var wtype_name = session.Query<string>(@$"SELECT mo_ta FROM category.dm_kieu_congviec WHERE id = @wtype_id", new { wtype_id = item.wtype_id }).FirstOrDefault();
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = wtype_name;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            var wkind_name = session.Query<string>(@$"SELECT mo_ta FROM category.dm_hinhthuc_kiemtra WHERE id = @wkind_id", new { wkind_id = item.wkind_id }).FirstOrDefault();
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = wkind_name;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            var wtype_result_name = session.Query<string>(@$"SELECT mo_ta FROM category.dm_ketqua_thuchien WHERE id = @wtype_result_id", new { wtype_result_id = item.wtype_result_id }).FirstOrDefault();
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = wtype_result_name;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.fc_start_date?.ToString("dd/MM/yyyy");
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.fc_finish_date?.ToString("dd/MM/yyyy");
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.plan_start_date?.ToString("dd/MM/yyyy");
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.plan_finish_date?.ToString("dd/MM/yyyy");
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.actual_start_date?.ToString("dd/MM/yyyy");
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.actual_finish_date?.ToString("dd/MM/yyyy");
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);

                            var status = session.Query<string>(@$"SELECT mo_ta FROM category.dm_trangthai_congviec WHERE id = @wstatus_id", new { wstatus_id = item.wstatus_id_all }).FirstOrDefault();
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = status;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.wdesc_info;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.wdesc_more;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.a_result_sum;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);

                            var user_name = session.Query<string>($"SELECT {nameof(UserInfo.full_name)} FROM {Sql.Entity<UserInfo>():T} WHERE {nameof(UserInfo.user_id)} = @user_id", new { user_id = item.user_mdf_id }).FirstOrDefault();
                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = user_name;
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.MIDDLE);

                            cell = sheet.Cells[row, ++col];
                            cell.Style.Font.Size = 11;
                            cell.Style.Font.Name = "Times New Roman";
                            cell.Value = item.user_mdf_dtime?.ToString("dd/MM/yyyy");
                            cell.Style.WrapText = true;
                            OfficeHelper.setStyle(ref cell,
                                EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                        }
                    }
                    sheet.Cells.AutoFitColumns();
                    return File(p.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           "DanhSachCongViecKiemTra.xlsx");
                }
            }
        }

        [HttpGet("{id}")]
        public async Task<RestBase> getItemMaintenance([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                var sql = @$"SELECT *, org.mo_ta AS org_name, worg.mo_ta AS worg_name, objtype.mo_ta AS obj_type_name, wtype.mo_ta AS wtype_name, 
                                 wkin.mo_ta AS wkind_name, wstatus.mo_ta AS wstatus_all, wtype_result.mo_ta AS wtype_result_name 
                                 FROM {Sql.Entity<Worder>():T} w
                                 LEFT JOIN category.dm_donvi_quanly org ON w.org_id = org.id 
                                 LEFT JOIN category.dm_donvi_quanly worg ON w.worg_id = worg.id 
                                 LEFT JOIN category.dm_loai_congviec objtype ON w.obj_type_id = objtype.id 
                                 LEFT JOIN category.dm_kieu_congviec wtype ON w.wtype_id = wtype.id 
                                 LEFT JOIN category.dm_hinhthuc_kiemtra wkin ON w.wkind_id = wkin.id 
                                 LEFT JOIN category.dm_trangthai_congviec wstatus ON w.wstatus_id_all = wstatus.id 
                                 LEFT JOIN category.dm_ketqua_thuchien wtype_result ON w.wtype_result_id = wtype_result.id  
                                 WHERE {nameof(Worder.worder_id)} = @worder_id";

                var data = session.Query<WorderInfoViewModel>(sql, new { worder_id = id }).FirstOrDefault();
                if (data != null)
                {
                    data.maintenanceWorkers = session.Find<MaintenanceWorker>(stm => stm
                        .Where($"{nameof(MaintenanceWorker.maintenance_id)}= @worder_id")
                        .WithParameters(new { worder_id = id })
                    ).ToList();
                    data.worderAssets = session.Find<WorderAsset>(stm => stm
                        .Where($"{nameof(WorderAsset.worder_id)}= @worder_id")
                        .WithParameters(new { worder_id = id })
                    ).ToList();
                    data.processExists = session.Find<ProcessExist>(stm => stm
                        .Where($"{nameof(ProcessExist.obj_id)} = @worder_id")
                        .WithParameters(new { worder_id = data.worder_id })
                    ).ToList();
                    if (data.processExists != null && data.processExists.Count() > 0)
                    {
                        data.is_processExist = true;
                    }

                    data.maintenanceFiles = session.Find<MaintenanceFile>(stm => stm
                        .Where($"{nameof(MaintenanceFile.maintenance_id)}= @worder_id")
                        .WithParameters(new { worder_id = id })
                    ).OrderBy(p => p.file_name).ToList();
                    data.maintenanceChats = session.Find<ThongTinTraoDoiKiemTra>(stm => stm
                        .Where($"{nameof(ThongTinTraoDoiKiemTra.phieugiamsat_id)}= @worder_id")
                        .WithParameters(new { worder_id = id })
                    ).OrderBy(p => p.user_cr_dtime).ToList();
                    if (data.maintenanceChats != null)
                    {
                        var userId = getUserId();
                        if (data.maintenanceChats.Count() > 0)
                        {
                            foreach (var maintenanceChat in data.maintenanceChats)
                            {
                                if (userId != maintenanceChat.user_id)
                                {
                                    var user = await _userManager.FindByIdAsync(maintenanceChat.user_id);
                                    if (user != null)
                                    {
                                        var userInfo = session.Find<UserInfo>(x => x
                                            .Where($"{nameof(UserInfo.user_id)} = @user_id")
                                            .WithParameters(new { user_id = user.Id })
                                        ).FirstOrDefault();
                                        if (userInfo != null)
                                        {
                                            maintenanceChat.user_name = userInfo.full_name;
                                        }
                                        else
                                        {
                                            maintenanceChat.user_name = user.UserName;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return new RestData
                {
                    data = data,
                };
            }
        }

        [HttpGet("feature/maintainHistories")]
        public RestBase getMaintenanceAssetHistories([FromQuery] ParameterKiemTraThietBi param)
        {
            using (var session = OpenSession())
            {
                if (string.IsNullOrWhiteSpace(param.maThietBi))
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                        }
                    };
                }
                else
                {
                    string condition = $"{Sql.Entity<WorderAsset>(x => x.asset_id):TC}  = @maThietBi";
                    var sql = "";
                    if (param.is_complete)
                    {
                        condition += $" AND {Sql.Entity<Worder>(x => x.wstatus_id_all):TC} = 'COMPLETE'";
                    }
                    if (param.isVanHanh && param.isThiNghiem)
                    {
                        condition += $" AND {Sql.Entity<Worder>(x => x.obj_type_id):TC} IN ('LABASSET', 'OP')";
                    }
                    else
                    {
                        if (param.isThiNghiem)
                        {
                            condition += $" AND {Sql.Entity<Worder>(x => x.obj_type_id):TC} = 'LABASSET'";
                        }
                        if (param.isVanHanh)
                        {
                            condition += $" AND {Sql.Entity<Worder>(x => x.obj_type_id):TC} = 'OP'";
                        }
                    }
                    var rowIndex = (param.pageIndex - 1) * param.pageSize;

                    if (param.pageSize > 0)
                    {
                        sql = @$"SELECT * FROM {Sql.Entity<Worder>():T} JOIN {Sql.Entity<WorderAsset>():T} 
                                     ON {Sql.Entity<Worder>(x => x.worder_id):TC} = {Sql.Entity<WorderAsset>(x => x.worder_id):TC} 
                                     WHERE {condition} ORDER BY {Sql.Entity<Worder>(x => x.actual_finish_date):TC} DESC OFFSET {rowIndex} ROWS FETCH NEXT {param.pageSize} ROWS ONLY";
                    }
                    else
                    {
                        sql = @$"SELECT * FROM {Sql.Entity<Worder>():T} JOIN {Sql.Entity<WorderAsset>():T} 
                                     ON {Sql.Entity<Worder>(x => x.worder_id):TC} = {Sql.Entity<WorderAsset>(x => x.worder_id):TC} 
                                     WHERE {condition} ORDER BY {Sql.Entity<Worder>(x => x.actual_finish_date):TC} DESC";
                    }
                    var data = session.Query<Worder>(sql, param).ToList();
                    foreach (var item in data)
                    {
                        item.processExists = session.Find<ProcessExist>(stm => stm
                            .Where($"{nameof(ProcessExist.obj_id)} = @worder_id")
                            .WithParameters(new { worder_id = item.worder_id })
                        ).ToList();
                    }
                    int totalCount = session.Query<int>($"SELECT COUNT({Sql.Entity<Worder>(x => x.worder_id):TC}) " +
                                                        $"FROM {Sql.Entity<Worder>():T} JOIN {Sql.Entity<WorderAsset>():T} " +
                                                        $"ON {Sql.Entity<Worder>(x => x.worder_id):TC} = {Sql.Entity<WorderAsset>(x => x.worder_id):TC} " +
                                                        $"WHERE {condition}", param).FirstOrDefault();
                    return new RestTablePagedData
                    {
                        data = data,
                        total_count = totalCount,
                    };
                }
            }
        }

        [HttpGet("feature/maintainChats")]
        public async Task<RestBase> getMaintenanceChats([FromQuery] string maThietBi = "", [FromQuery] int layer_id = 0)
        {
            using (var session = OpenSession())
            {
                var userId = getUserId();
                IEnumerable<ThongTinTraoDoiKiemTra> maintenanceChats = new List<ThongTinTraoDoiKiemTra>();
                var worderAssets = session.Find<WorderAsset>(p => p
                    .Where($"{nameof(WorderAsset.asset_id)} = @asset_id")
                    .WithParameters(new { asset_id = maThietBi })
                ).ToList();
                foreach (var worderAsset in worderAssets)
                {
                    var featureMaintanceChats = session.Find<ThongTinTraoDoiKiemTra>(p => p
                        .Where($"{nameof(ThongTinTraoDoiKiemTra.phieugiamsat_id)} = @worder_id")
                        .WithParameters(new { worder_id = worderAsset.worder_id })
                    ).ToList();
                    if (featureMaintanceChats != null)
                    {
                        if (featureMaintanceChats.Count() > 0)
                        {
                            maintenanceChats = maintenanceChats.Concat(featureMaintanceChats);
                        }
                    }
                }
                if (maintenanceChats != null)
                {
                    if (maintenanceChats.Count() > 0)
                    {
                        foreach (ThongTinTraoDoiKiemTra maintenanceChat in maintenanceChats)
                        {
                            if (maintenanceChat.user_id != userId)
                            {
                                var user = await _userManager.FindByIdAsync(maintenanceChat.user_id);
                                if (user != null)
                                {
                                    var userInfo = session.Find<UserInfo>(x => x
                                        .Where($"{nameof(UserInfo.user_id)} = @user_id")
                                        .WithParameters(new { user_id = user.Id })
                                    ).FirstOrDefault();
                                    if (userInfo != null)
                                    {
                                        maintenanceChat.user_name = userInfo.full_name;
                                    }
                                    else
                                    {
                                        maintenanceChat.user_name = user.UserName;
                                    }
                                }
                            }
                        }
                    }
                }
                return new RestData
                {
                    data = maintenanceChats,
                };
            }
        }

        [HttpPost("save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_MAINTENANCE))]
        public async Task<RestBase> createOrUpdateMaintenance([FromForm] Worder item)
        {
            var restData = new RestBase(EnumErrorCode.OK);
            using (var session = OpenSession())
            {
                using var uow = new UnitOfWork(DbFactory, session);
                var userId = getUserId();
                var dataReturn = new RestBase(EnumErrorCode.OK);
                if (item.worder_id == 0)
                {
                    item.user_cr_dtime = DateTime.Now;
                    item.user_cr_id = userId;
                    item.user_mdf_dtime = DateTime.Now;
                    item.user_mdf_id = userId;
                    session.Insert(item);
                    dataReturn = new RestData { data = item };
                }
                else
                {
                    var existItem = session.Get(new Worder { worder_id = item.worder_id });
                    var deleteProcessItem = session.Find<ProcessExist>(p => p
                        .Where($"{nameof(ProcessExist.obj_id)} = @worder_id")
                        .WithParameters(new { worder_id = item.worder_id })
                    ).ToList();
                    if (existItem == null)
                    {
                        dataReturn = new RestError
                        {
                            errors = new RestErrorDetail[]
                            {
                                    new RestErrorDetail { message = "Kế hoạch kiểm tra này không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        item.user_mdf_dtime = DateTime.Now;
                        item.user_cr_dtime = existItem.user_cr_dtime;
                        item.user_cr_id = existItem.user_cr_id;
                        item.user_mdf_id = userId;
                        session.Update(item);

                        session.Execute($"DELETE FROM {Sql.Entity<WorderAsset>():T} WHERE {nameof(WorderAsset.worder_id)} = @worder_id", item);
                        if (item.worderAssets != null)
                        {
                            if (item.worderAssets.Count() > 0)
                            {
                                foreach (WorderAsset asset in item.worderAssets)
                                {
                                    asset.user_cr_id = userId;
                                    asset.user_cr_dtime = DateTime.Now;
                                    asset.worder_id = item.worder_id;
                                    await uow.Connection.InsertAsync(asset);
                                }
                            }
                        }

                        session.Execute($"DELETE FROM {Sql.Entity<MaintenanceWorker>():T} WHERE {nameof(MaintenanceWorker.maintenance_id)} = @worder_id", item);
                        if (item.maintenanceWorkers != null)
                        {
                            if (item.maintenanceWorkers.Count() > 0)
                            {
                                foreach (GiaoViecNhanVien maintenanceWoker in item.maintenanceWorkers)
                                {
                                    maintenanceWoker.phieugiamsat_id = item.worder_id;
                                    await uow.Connection.InsertAsync(maintenanceWoker);
                                }
                            }
                        }

                        if (item.deleteProcessExists != null && item.deleteProcessExists.Count() > 0)
                        {
                            session.Execute($"DELETE FROM {Sql.Entity<ProcessExist>():T} WHERE {nameof(ProcessExist.process_exist_id)} = ANY(@process_exist_ids)", new { process_exist_ids = item.deleteProcessExists.Select(x => x.process_exist_id).ToArray() });
                        }
                        if (item.processExists != null)
                        {
                            if (item.processExists.Count() > 0)
                            {
                                foreach (ProcessExist processExist in item.processExists)
                                {
                                    if (processExist.process_exist_id > 0)
                                    {
                                        var processExistItem = session.Get(new ProcessExist { process_exist_id = processExist.process_exist_id });
                                        if (processExistItem != null)
                                        {
                                            processExistItem.user_mdf_id = userId;
                                            processExistItem.user_mdf_dtime = DateTime.Now;
                                            processExistItem.obj_id = item.worder_id;
                                            processExistItem.status_id = processExist.status_id;
                                            processExistItem.obj_type_id = processExist.obj_type_id;
                                            processExistItem.solution_exist = processExist.solution_exist;
                                            processExistItem.date_solution_exist = processExist.date_solution_exist;
                                            await uow.Connection.UpdateAsync(processExistItem);
                                        }
                                    }
                                    else
                                    {
                                        processExist.user_cr_id = userId;
                                        processExist.user_cr_dtime = DateTime.Now;
                                        processExist.obj_id = item.worder_id;
                                        await uow.Connection.InsertAsync(processExist);
                                    }
                                }
                            }
                        }

                        if (item.deleteMaintenanceFileIds != null && item.deleteMaintenanceFileIds.Count() > 0)
                        {
                            var maintenance_ids = item.deleteMaintenanceFileIds.Split(",").Select(x => int.Parse(x)).ToArray();
                            session.Execute($"DELETE FROM {Sql.Entity<MaintenanceFile>():T} WHERE {nameof(MaintenanceFile.id)} = ANY(@maintenance_ids)", new { maintenance_ids = maintenance_ids });
                        }

                        if (item.maintenanceChats != null)
                        {
                            if (item.maintenanceChats.Count() > 0)
                            {
                                foreach (ThongTinTraoDoiKiemTra maintenanceChat in item.maintenanceChats)
                                {
                                    if (maintenanceChat.id == 0)
                                    {
                                        maintenanceChat.phieugiamsat_id = item.worder_id;
                                        maintenanceChat.user_id = userId;
                                        maintenanceChat.user_cr_dtime = DateTime.Now;
                                        await uow.Connection.InsertAsync(maintenanceChat);
                                    }
                                }
                            }
                        }
                        dataReturn = new RestData { data = item };
                    }
                }
                return dataReturn;
            }
        }

        [HttpPost("upload")]
        public async Task<RestBase> uploadAsync([FromForm] MaintenanceFileViewModel maintenanceFileViewModel)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (maintenanceFileViewModel == null)
                        return new RestError();
                    if (maintenanceFileViewModel.files == null || maintenanceFileViewModel.files.Count() == 0) return new RestError();
                    var userId = getUserId();
                    foreach (var file in maintenanceFileViewModel.files)
                    {
                        var maintenanceFile = new MaintenanceFile
                        {
                            file_name = file.FileName,
                            mime_type = file.ContentType,
                            extension = MimeTypesMap.GetExtension(file.ContentType) ?? "unknow",
                            size = file.Length,
                            maintenance_id = maintenanceFileViewModel.worder_id,
                            url = await FileHelper.PostDocumentAsync(file, file.FileName, file.ContentType)
                        };
                        await session.InsertAsync(maintenanceFile);
                    }
                    ;
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("chatFile/upload")]
        public async Task<RestBase> uploadChatFileAsync([FromForm] MaintenanceFileViewModel maintenanceChatFileViewModel)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (maintenanceChatFileViewModel == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                    new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                            }
                        };
                    if (maintenanceChatFileViewModel.files == null || maintenanceChatFileViewModel.files.Count() == 0) return new RestError();
                    var userId = getUserId();
                    foreach (var file in maintenanceChatFileViewModel.files)
                    {
                        var maintenanceChat = new ThongTinTraoDoiKiemTra
                        {
                            phieugiamsat_id = maintenanceChatFileViewModel.worder_id,
                            user_cr_dtime = DateTime.Now,
                            user_id = userId,
                            image_url = await FileHelper.PostFileAsync(file, file.FileName, file.ContentType)
                        };
                        await session.InsertAsync(maintenanceChat);
                    }
                    ;
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_MAINTENANCE))]
        public async Task<RestBase> deleteMaintenance([FromForm] Worder item)
        {
            var restData = new RestBase(EnumErrorCode.OK);
            using (var session = OpenSession())
            {
                var existItem = session.Get(new Worder { worder_id = item.worder_id });
                if (existItem == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                                new RestErrorDetail { message = "Kế hoạch điều tra không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    await session.DeleteAsync(existItem);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpGet("danh-muc/{type}")]
        public async Task<RestBase> getDanhMucAsync([FromRoute] string type)
        {
            using (var session = OpenSession())
            {

                string tableName = "";
                switch (type)
                {
                    case EnumMaintenanceCategory.DONVI:
                        tableName = @$"category.dm_donvi_quanly";
                        break;
                    case EnumMaintenanceCategory.TRANGTHAICONGVIEC:
                        tableName = @$"category.dm_trangthai_congviec";
                        break;
                    case EnumMaintenanceCategory.LOAICONGVIEC:
                        tableName = @$"category.dm_loai_congviec";
                        break;
                    case EnumMaintenanceCategory.KIEUCONGVIEC:
                        tableName = @$"category.dm_kieu_congviec";
                        break;
                    case EnumMaintenanceCategory.HINHTHUCKIEMTRA:
                        tableName = @$"category.dm_hinhthuc_kiemtra";
                        break;
                    case EnumMaintenanceCategory.DANHMUCKETQUA:
                        tableName = @$"category.dm_ketqua_thuchien";
                        break;
                    default:
                        return new RestError((int)HttpStatusCode.NotFound, "Không tìm thấy kiểu danh mục");

                }
                string sql = $"SELECT id, mo_ta from {tableName}";
                List<DanhMucViewModel> data = (await session.QueryAsync<DanhMucViewModel>(sql)).ToList();
                return new RestData
                {
                    data = data
                };
            }
        }
    }
}