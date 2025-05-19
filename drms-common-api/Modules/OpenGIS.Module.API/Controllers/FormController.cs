using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using CsvHelper;
using Dapper;
using Dapper.FastCrud;
using ICSharpCode.SharpZipLib.Core;
using ICSharpCode.SharpZipLib.Zip;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using NetTopologySuite.IO.Streams;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.DevExtreme;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;
using System.Net;
using Newtonsoft.Json;
using Humanizer;
using OpenGIS.Module.Core.Extensions;
using OpenGIS.Module.Core.ViewModels;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    public class FormController : BaseController
    {
        protected readonly IFormRepository _formRepository;
        protected readonly IFormFieldRepository _formFieldRepository;
        protected readonly IWorkContext _workContext;
        public FormController(IDbFactory dbFactory, IFormRepository formRepository,
            IFormFieldRepository formFieldRepository, IWorkContext workContext)
            : base(dbFactory)
        {
            _formRepository = formRepository;
            _workContext = workContext;
            _formFieldRepository = formFieldRepository;
        }

        [HttpGet]
        public RestBase get([FromQuery] int id)
        {
            using (var session = OpenSession())
            {
                // var data = _formRepository.GetKey(id, session);
                // data.layer = getLayerWithTableInfo(data.table_id);
                // data.form_fields = session.Find<FormField>(stm => stm.Where($"{Sql.Entity<FormField>(x => x.form_id):TC} = {data.id}")).ToList();
                // data.tableInfo = session.Find<TableInfo>(stm => stm.Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = {data.table_id}")).FirstOrDefault();
                var data = session.Find<Form>(statement => statement
                         .Include<FormField>(join => join.InnerJoin())
                         .Include<Map>(join => join.LeftOuterJoin())
                         .Include<TableInfo>(join => join.InnerJoin())
                         .Where($"{Sql.Entity<Form>(x => x.id):TC} = @id")
                         .WithParameters(new { id })).FirstOrDefault();
                if (data != null)
                {
                    data.layer = getLayerWithTableInfo(data.table_id);
                }
                return new RestData()
                {
                    data = data
                };
            }
        }

        [HttpGet]
        [Route("listBySchema")]
        public RestBase listBySchema([FromQuery] string schema = "")
        {
            using (var session = OpenSession())
            {
                if (string.IsNullOrWhiteSpace(schema))
                    return new RestError((int)HttpStatusCode.NotModified, "Lỗi tham số!");
                return new RestData()
                {
                    data = session.Find<Form>(statement => statement
                        .Include<FormField>(join => join.InnerJoin())
                        // .Include<Layer>(join => join.InnerJoin())
                        .Include<TableInfo>(join => join.InnerJoin())
                        .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema")
                        .WithParameters(new { schema = schema })
                    )
                };
            }
        }

        [HttpGet]
        [Route("listAll")]
        public RestBase listAll([FromQuery] int? excludeFormId, [FromQuery] string? schema = "")
        {
            using (var session = OpenSession())
            {
                string condition = $"1=1";
                var table_id = 0;
                if (!string.IsNullOrWhiteSpace(schema))
                {
                    condition += $" AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema";
                }
                if (excludeFormId.HasValue)
                {
                    var form = session.Get<Form>(new Form { id = excludeFormId.Value });

                    if (form != null)
                    {
                        table_id = form.table_id;
                        condition += $" AND {Sql.Entity<Form>(x => x.id):TC} <> @excludeFormId AND {Sql.Entity<Form>(x => x.table_id):TC} = @table_id";
                    }
                }
                var data = session.Find<Form>(statement => statement
                        .Include<FormField>(join => join.InnerJoin())
                        //.Include<Layer>(join => join.InnerJoin())
                        .Include<TableInfo>(join => join.InnerJoin())
                        .Where($"{condition}")
                        .WithParameters(new
                        {
                            table_id,
                            schema,
                            excludeFormId
                        })
                    );
                foreach (var item in data)
                {
                    item.layer = getLayerWithTableInfo(item.table_id);
                }
                return new RestData()
                {
                    data = data
                };
            }
        }
        [HttpGet]
        [Route("actions")]
        public RestBase ActionHistories([FromQuery] int form_id = 0)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<Form.Action>(statement => statement
                    .Where($"{Sql.Entity<Form.Action>(x => x.form_id):TC} = @form_id")
                    .OrderBy($"{Sql.Entity<Form.Action>(x => x.action_at):TC} DESC")
                    .WithParameters(new { form_id }))
                };
            }
        }

        [HttpGet]
        [Route("list")]
        public RestBase list([FromQuery] int layer_id = 0, [FromQuery] int form_id = 0)
        {
            using (var session = OpenSession())
            {
                if (form_id == 0)
                {
                    return new RestData()
                    {
                        data = session.Find<Form>(statement => statement
                            .Include<FormField>(s => s.LeftOuterJoin())
                            //.Where($"{Sql.Entity<Form>(x => x.layer_id):TC} = @layer_id")
                            .WithParameters(new { layer_id = layer_id })
                            .OrderBy($"{Sql.Entity<FormField>(x => x.order):TC}")
                        )
                    };
                }
                return new RestData()
                {
                    data = session.Find<Form>(statement => statement
                        .Include<FormField>(s => s.LeftOuterJoin())
                        //.Where($"{Sql.Entity<Form>(x => x.layer_id):TC} = @layer_id AND {Sql.Entity<FormField>(x => x.form_id):TC} = @form_id")
                        .WithParameters(new { layer_id = layer_id, form_id = form_id })
                        .OrderBy($"{nameof(FormField.order)}")
                    )
                };
            }
        }

        [HttpGet]
        [Route("listField")]
        public RestBase listField([FromQuery] int form_id = 0)
        {
            using (var session = OpenSession())
            {
                if (form_id == 0)
                    return new RestError((int)HttpStatusCode.NotModified, "Lỗi tham số!");
                return new RestData()
                {
                    data = session.Find<FormField>(statement => statement
                        .Include<TableColumn>(s => s.LeftOuterJoin())
                        .Where($"{Sql.Entity<FormField>(x => x.form_id):TC} = @form_id")
                        .WithParameters(new { form_id = form_id })
                        .OrderBy($"{Sql.Entity<FormField>(x => x.order):TC}")
                    )
                };
            }
        }
        [HttpPost]
        [Route("copy/data")]
        public RestBase CopyDataAsync([FromBody] CopyDataFormModel model)
        {
            using var session = OpenSession();
            var sourceForm = session.Get<Form>(new Form { id = model.source_id });
            if (sourceForm == null)
            {
                return new RestError(404, "Không có thông tin biểu mẫu! Vui lòng kiểm tra lại");
            }
            var sql = $"{Sql.Entity<Form.Feature>(x => x.table_id):TC} = @table_id AND {Sql.Entity<Form.Feature>(x => x.form_id):TC} = @id"
            // * lọc những dữ liệu trùng của 2 biểu mẫu
            + $" AND {Sql.Entity<Form.Feature>(x => x.feature_id):TC} NOT IN (SELECT {Sql.Entity<Form.Feature>(x => x.feature_id):TC} FROM {Sql.Entity<Form.Feature>():T} WHERE {Sql.Entity<Form.Feature>(x => x.table_id):TC} = @table_id AND {Sql.Entity<Form.Feature>(x => x.form_id):TC} = @form_id)";
            var features = session.Find<Form.Feature>(x => x
                                .Where($"{sql}")
                                .WithParameters(new
                                {
                                    sourceForm.table_id,
                                    sourceForm.id,
                                    model.form_id
                                }));
            if (features.Count() > 0)
            {
                using var uow = new UnitOfWork(DbFactory, session);
                foreach (var feature in features)
                {
                    feature.form_id = model.form_id;
                    uow.Connection.Insert(feature);
                }
            }
            return new RestBase(EnumErrorCode.OK);
        }
        [HttpPost]
        [Route("copy/fields")]
        public RestBase CopyFieldsAsync([FromBody] CopyDataFormModel model)
        {
            using var session = OpenSession();
            var sourceFields = session.Find<FormField>(statement => statement
                        .Include<TableColumn>(s => s.LeftOuterJoin())
                        .Where($"{Sql.Entity<FormField>(x => x.form_id):TC} = @form_id")
                        .WithParameters(new { form_id = model.source_id })
                        .OrderBy($"{Sql.Entity<FormField>(x => x.order):TC}")
                    );
            if (sourceFields == null)
            {
                return new RestError(404, "Không có thông tin biểu mẫu! Vui lòng kiểm tra lại");
            }
            using var uow = new UnitOfWork(DbFactory, session);
            uow.Connection.BulkDelete<FormField>(x => x
                                .Where($"{Sql.Entity<FormField>(x => x.form_id):TC} = @form_id")
                                .WithParameters(new
                                {
                                    model.form_id
                                }));
            if (sourceFields.Count() > 0)
            {
                foreach (var field in sourceFields)
                {
                    field.form_id = model.form_id;
                    uow.Connection.Insert(field);
                }
            }
            return new RestBase(EnumErrorCode.OK);
        }
        [HttpPost]
        [Route("create")]
        public RestBase create([FromForm] string dataForm)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var form = JsonConvert.DeserializeObject<Form>(dataForm);
                    if (form != null)
                    {
                        Layer? layer = getLayerWithTableAndColumn(form.layer_id);
                        form.table_id = layer?.table_info_id ?? 0;
                        form.created_at = (int)(DateTimeOffset.Now).ToUnixTimeSeconds();
                        int id = _formRepository.SaveOrUpdate(form, uow);
                        if (id > 0)
                        {
                            foreach (var field in form.form_fields)
                            {
                                if (field.label != "id")
                                {
                                    field.form_id = id;
                                    uow.Connection.Insert<FormField>(field);
                                }
                            }

                            return new RestBase(EnumErrorCode.OK);
                        }
                        else
                            return new RestError(-1, "Đã xảy ra lỗi khi lưu bản ghi, vui lòng kiểm tra lại!");
                    }
                    else
                        return new RestError(-1, "Không tìm thấy dữ liệu!");
                }
            }
        }

        [HttpPost]
        [Route("update")]
        public RestBase update([FromForm] string dataForm)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var form = JsonConvert.DeserializeObject<Form>(dataForm);
                    if (form != null)
                    {
                        form.updated_at = (int)(DateTimeOffset.Now).ToUnixTimeSeconds();
                        int id = _formRepository.SaveOrUpdate(form, uow);
                        if (id > 0)
                        {
                            var columns = session.Find<TableColumn>().ToList();

                            uow.Connection.BulkDelete<FormField>(statement => statement
                                .Where($"{nameof(FormField.form_id)} = @id")
                                .WithParameters(form)
                            );

                            foreach (var field in form.form_fields)
                            {
                                field.column = columns.FirstOrDefault(x => x.id == field.table_column_id);
                                field.form_id = id;
                                uow.Connection.Insert(field);
                            }

                            return new RestBase(EnumErrorCode.OK);
                        }
                        else
                            return new RestError(-1, "Đã xảy ra lỗi khi lưu bản ghi, vui lòng kiểm tra lại!");
                    }
                    else
                        return new RestError(-1, "Không tìm thấy dữ liệu!");
                }
            }
        }

        [HttpPost]
        [Route("delete")]
        public RestBase delete([FromBody] Form form)
        {
            if (form == null || ModelState.IsValid == false)
                return new RestError((int)HttpStatusCode.NotModified, "Lỗi tham số!");

            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var formFields = session.Find<FormField>(stm => stm
                        .Where($"{nameof(FormField.form_id)} = @id")
                        .WithParameters(form)
                    ).ToList();
                    foreach (FormField field in formFields)
                    {
                        if (!uow.Connection.Delete<FormField>(field))
                        {
                            return new RestError();
                        }
                    }
                    if (_formRepository.Delete(form, uow))
                        return new RestBase(EnumErrorCode.OK);
                    else
                        return new RestError(-1, "Đã xảy ra lỗi khi xóa bản ghi, vui lòng kiểm tra lại!");
                }
            }
        }

        [HttpPost]
        [Route("{form_id}/fields/add")]
        public RestBase addField([FromRoute] int form_id, [FromBody] FormField formField)
        {
            using (var session = OpenSession())
            {
                var form = _formRepository.GetKey(form_id, session);

                if (form == null || ModelState.IsValid == false)
                    return new RestError((int)HttpStatusCode.NotModified, "Lỗi tham số!");
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    int id = _formFieldRepository.SaveOrUpdate(formField, uow);
                    if (id > 0)
                        return new RestBase(EnumErrorCode.OK);
                    else
                        return new RestError(-1, "Đã xảy ra lỗi khi lưu bản ghi, vui lòng kiểm tra lại!");
                }
            }
        }

        [HttpPost]
        [Route("{form_id}/fields/update")]
        public RestBase updateField([FromRoute] int form_id, [FromBody] FormField formField)
        {
            using (var session = OpenSession())
            {
                var form = _formRepository.GetKey(form_id, session);
                if (form == null || ModelState.IsValid == false)
                    return new RestError((int)HttpStatusCode.NotModified, "Lỗi tham số!");
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    int id = _formFieldRepository.SaveOrUpdate(formField, uow);
                    if (id > 0)
                        return new RestBase(EnumErrorCode.OK);
                    else
                        return new RestError(-1, "Đã xảy ra lỗi khi lưu bản ghi, vui lòng kiểm tra lại!");
                }
            }
        }

        [HttpPost]
        [Route("{form_id}/fields/delete")]
        public RestBase deleteField([FromRoute] int form_id, [FromBody] FormField formField)
        {
            using (var session = OpenSession())
            {
                var form = _formRepository.GetKey(form_id, session);
                if (form == null || ModelState.IsValid == false)
                    return new RestError((int)HttpStatusCode.NotModified, "Lỗi tham số!");
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (_formFieldRepository.Delete(formField, uow))
                        return new RestBase(EnumErrorCode.OK);
                    else
                        return new RestError(-1, "Đã xảy ra lỗi khi xóa bản ghi, vui lòng kiểm tra lại!");
                }
            }
        }

        [HttpPost]
        [Route("{form_id}/deleteAll")]
        public RestBase deleteAllField([FromRoute] int form_id)
        {
            using (var session = OpenSession())
            {
                var form = _formRepository.GetKey(form_id, session);
                if (form == null || ModelState.IsValid == false)
                    return new RestError((int)HttpStatusCode.NotModified, "Lỗi tham số!");
                var formFields = session.Find<FormField>(stm => stm.Where($"{nameof(FormField.form_id)} = {form_id}"));
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    foreach (var field in formFields)
                    {
                        if (!_formFieldRepository.Delete(field, uow))
                            return new RestError(-1, "Đã xảy ra lỗi khi xóa bản ghi, vui lòng kiểm tra lại!");
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost]
        [Route("{layer_id}/AddAll/{form_id}")]
        public RestBase AddAll([FromRoute] int layer_id, [FromRoute] int form_id)
        {
            using (var session = OpenSession())
            {
                var form = _formRepository.GetKey(form_id, session);
                if (form == null || ModelState.IsValid == false)
                {
                    return new RestError((int)HttpStatusCode.NotModified, "Lỗi tham số!");
                }

                Layer? layer = getLayerWithTableAndColumn(layer_id);
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (layer == null)
                        return new RestError(-1, "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    if (form.form_fields == null)
                    {
                        foreach (var item in layer.table.columns)
                        {

                            var id = _formFieldRepository.SaveOrUpdate(new FormField()
                            {
                                id = 0,
                                table_column_id = item.id,
                                form_id = form_id,
                                label = item.name_vn,
                            }, uow);
                            if (id <= 0)
                            {
                                return new RestError(-1, "Đã xảy ra lỗi khi lưu bản ghi, vui lòng kiểm tra lại!");
                            }
                        }
                    }
                    else
                    {
                        foreach (var item in layer.table.columns)
                        {
                            if (form.form_fields.FirstOrDefault(s => s.table_column_id == item.id) == null)
                            {
                                var id = _formFieldRepository.SaveOrUpdate(new FormField()
                                {
                                    id = 0,
                                    table_column_id = item.id,
                                    form_id = form_id,
                                    label = item.name_vn,
                                }, uow);
                                if (id <= 0)
                                {
                                    return new RestError(-1, "Đã xảy ra lỗi khi lưu bản ghi, vui lòng kiểm tra lại!");
                                }
                            }
                        }
                    }
                    return new RestBase("OK");
                }
            }
        }

        [HttpPost]
        [Route("parseData")]
        public async System.Threading.Tasks.Task<RestBase> importAsync()
        {
            if (Request.Form.Files.Count > 0)
            {
                IFormFile[] files = Request.Form.Files.ToArray();
                IFormFile? formFile = files.FirstOrDefault();
                string f = "";
                if (formFile != null)
                {
                    if (formFile.ContentType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    {
                        f = "xlsx";
                    }
                    else if (formFile.ContentType == "text/csv")
                    {
                        f = "csv";
                    }
                    else if (formFile.ContentType == "application/zip" || formFile.ContentType == "application/octet-stream")
                    {
                        f = "zip";
                    }
                }
                return await parseDataAsync(f, files);
            }
            else
            {
                return new RestError();
            }
        }

        private async System.Threading.Tasks.Task<RestBase> parseDataAsync(string f,
            params IFormFile[] files)
        {
            switch (f)
            {
                case "xlsx":
                    return await parseXlsxAsync(files.FirstOrDefault());
                case "csv":
                    return parseCsv(files.FirstOrDefault());
                //                case "mdb":
                //                    return parseMdb(files.FirstOrDefault());
                case "shp":
                    return parseShp(files);
                // case "gdb":
                //     return parseGDB(files);
                default:
                    return new RestError(); ;
            }
        }

        private async System.Threading.Tasks.Task<RestBase> parseXlsxAsync(IFormFile f)
        {

            using (var session = OpenSession())
            {
                var insertedId = new List<int>();
                try
                {
                    ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                    using (var package = new ExcelPackage(f.OpenReadStream()))
                    {
                        var workbook = package.Workbook;
                        var worksheet = workbook.Worksheets.First();
                        int formId = worksheet.Cells[1, 2].GetValue<int>();
                        var form = session.Find<Form>(statement => statement
                            .Where($"{Sql.Entity<Form>(x => x.id):TC} = @formId")
                            .WithParameters(new { formId = formId })
                            .Include<FormField>(join => join.LeftOuterJoin().OrderBy($"{Sql.Entity<FormField>(x => x.id):TC}"))
                            .Include<TableColumn>()
                        ).FirstOrDefault();
                        if (form == null)
                        {
                            return new RestError(-1, "Không tìm thấy mã biểu mẫu trong CSDL");
                        }
                        //var layer = getLayerWithTableAndColumn(form.layer_id);
                        Layer layer = getLayerWithTableInfo(form.table_id);
                        var tables = getTablesAndColumns(layer.table.table_schema);
                        if (layer.table.key_column == null && layer.table.identity_column == null)
                        {
                            return new RestError(-1, "Lớp dữ liệu chưa cấu hình Khóa chính, không thể cập nhật dữ liệu!");
                        }
                        //if (worksheet.Dimension.Columns != form.form_fields.Count() + 1)
                        //    return new RestError();
                        IDictionary<int, List<DevExtremeBaseModel>> lookup = new Dictionary<int, List<DevExtremeBaseModel>>();
                        for (int i = 0; i < form.form_fields.Count(); i++)
                        {
                            var field = form.form_fields.ElementAt(i);
                            string cellField = StringHelper.RemoveVietNameseSign(worksheet.Cells[3, i + 2]
                                .GetValue<string>()?.Trim().ToLower().Replace(" ", "_"));
                            string formField = StringHelper.RemoveVietNameseSign(field.label
                                ?.Trim().ToLower().Replace(" ", "_"));
                            if (field.column.lookup_table_id > 0)
                            {
                                var table = tables.FirstOrDefault(x => x.id == field.column.lookup_table_id);
                                if (table != null)
                                {
                                    var keyColumn = table.key_column ?? table.identity_column;
                                    var labelColumn = table.label_column ?? keyColumn;
                                    lookup.Add(field.column.lookup_table_id, session.Query<DevExtremeBaseModel>($@"SELECT {keyColumn.column_name} AS id,{labelColumn.column_name} AS text FROM {table.table_schema}.{table.table_name}").ToList());
                                }
                            }
                            if (!cellField.Equals(formField))
                            {
                                return new RestData()
                                {
                                    status = "ERROR",
                                    data = "Vui lòng dùng thứ tự trường thông tin theo biểu mẫu tải về"
                                };
                            }
                        }

                        int rowIdx = worksheet.Dimension.End.Row;
                        int colIdx = worksheet.Dimension.End.Column;
                        if (layer.geometry == "Point")
                            colIdx -= 2;
                        List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                        List<IDictionary<string, object>> recordInserts = new List<IDictionary<string, object>>();
                        List<Form.Feature> features = new List<Form.Feature>();
                        List<string> colnames = form.form_fields.Select(s => s.column.column_name).ToList();
                        var districts = session.Find<District>(x => x.Where($"{Sql.Entity<District>(x => x.visible):TC}"));
                        var communes = session.Find<Commune>(x => x.Where($"{Sql.Entity<Commune>(x => x.visible):TC}"));
                        var check = true;
                        var message_err = string.Empty;
                        for (int rIdx = 4; rIdx <= rowIdx; rIdx++)
                        {
                            IDictionary<string, object> values = new Dictionary<string, object>();
                            IDictionary<string, object> valuesInsert = new Dictionary<string, object>();
                            // if (worksheet.Cells[rIdx, 1].Value != null) // check for STT Is NUll?
                            // {
                            for (int cIdx = 2; cIdx <= colIdx; cIdx++)
                            {
                                if (cIdx - 2 <= form.form_fields.Count() - 1)
                                {
                                    var field = form.form_fields.ElementAt(cIdx - 2);
                                    var cell = worksheet.Cells[rIdx, cIdx];
                                    if (field.column.require == true && cell.GetValue<object>() == null)
                                    {
                                        check = false;
                                        message_err = $"Trường {field.column.name_vn} không được để trống";
                                        break;
                                    }
                                    else
                                    {
                                        if (field.column.column_name == "district_code")
                                        {
                                            var excel_value = cell.GetValue<string>();
                                            if (string.IsNullOrWhiteSpace(excel_value))
                                            {
                                                return new RestData
                                                {
                                                    status = "ERROR",
                                                    data = $"Không để trống quận huyện"
                                                };
                                            }
                                            var entity = districts.FirstOrDefault(x => x.name_vn?.Replace("Quận", "").Replace("Huyện", "").ToLower().Trim() == excel_value.Replace("Quận", "").Replace("Huyện", "").ToLower().Trim());
                                            if (entity != null)
                                            {
                                                values.Add(field.column.column_name, entity.name_vn);
                                                valuesInsert.Add(field.column.column_name, entity.area_id);
                                            }
                                            else
                                            {
                                                return new RestData
                                                {
                                                    status = "ERROR",
                                                    data = $"Không tìm thấy {excel_value} trong CSDL"
                                                };
                                            }
                                        }
                                        else if (field.column.column_name == "commune_code")
                                        {
                                            var excel_value = cell.GetValue<string>();
                                            if (string.IsNullOrWhiteSpace(excel_value))
                                            {
                                                return new RestData
                                                {
                                                    status = "ERROR",
                                                    data = $"Không để trống xã phường"
                                                };
                                            }
                                            var entity = communes.FirstOrDefault(x => x.name_vn?.Replace("Phường", "").Replace("Xã", "").ToLower().Trim() == excel_value.Replace("Phường", "").Replace("Xã", "").ToLower().Trim());
                                            if (entity != null)
                                            {
                                                values.Add(field.column.column_name, entity.name_vn);
                                                valuesInsert.Add(field.column.column_name, entity.area_id);
                                            }
                                            else
                                            {
                                                return new RestData
                                                {
                                                    status = "ERROR",
                                                    data = $"Không tìm thấy {excel_value} trong CSDL"
                                                };
                                            }
                                        }
                                        else if (field.column.lookup_table_id > 0)
                                        {
                                            var excel_value = cell.GetValue<string>();

                                            var table = tables.FirstOrDefault(x => x.id == field.column.lookup_table_id);
                                            if (table != null && lookup.ContainsKey(table.id))
                                            {
                                                var lookupData = lookup[table.id];
                                                var item = lookupData.FirstOrDefault(x => x.text?.ToString().Trim().ToLower() == excel_value.Trim().ToLower());
                                                if (item != null)
                                                {
                                                    values.Add(field.column.column_name, excel_value);
                                                    valuesInsert.Add(field.column.column_name, item.id);
                                                }
                                                else
                                                {
                                                    check = false;
                                                    message_err = $"Danh mục {excel_value} không tồn tại trong bảng {table.name_vn}";
                                                    break;
                                                }
                                            }

                                        }
                                        else if (field.column.data_type == EnumPgDataType.String || field.column.data_type == EnumPgDataType.Text)
                                        {
                                            values.Add(field.column.column_name, cell.GetValue<string>());
                                            valuesInsert.Add(field.column.column_name, cell.GetValue<string>());
                                        }
                                        else if (field.column.data_type == EnumPgDataType.DateTime || field.column.data_type == EnumPgDataType.DateTimeTZ)
                                        {
                                            try
                                            {
                                                DateTime date = cell.GetValue<DateTime>();
                                                if (date.Year < 1974)
                                                    date = new DateTime(1973, 12, 31);
                                                values.Add(field.column.column_name, date);
                                                valuesInsert.Add(field.column.column_name, date);
                                            }
                                            catch
                                            {
                                                values.Add(field.column.column_name, DateTime.Now);
                                                valuesInsert.Add(field.column.column_name, DateTime.Now);
                                            }
                                        }
                                        else if (field.column.data_type == EnumPgDataType.Time)
                                        {
                                            try
                                            {
                                                DateTime date = cell.GetValue<DateTime>();
                                                if (date.Year < 1974)
                                                    date = new DateTime(1973, 12, 31);
                                                values.Add(field.column.column_name, date);
                                                valuesInsert.Add(field.column.column_name, date);
                                            }
                                            catch
                                            {
                                                values.Add(field.column.column_name, DateTime.Now);
                                                valuesInsert.Add(field.column.column_name, DateTime.Now);
                                            }
                                        }
                                        else if (field.column.data_type == EnumPgDataType.Date)
                                        {
                                            try
                                            {
                                                DateTime date = cell.GetValue<DateTime>();
                                                if (date.Year < 1974)
                                                    date = new DateTime(1973, 12, 31);
                                                values.Add(field.column.column_name, date);
                                                valuesInsert.Add(field.column.column_name, date);
                                            }
                                            catch
                                            {
                                                values.Add(field.column.column_name, DateTime.Now);
                                                valuesInsert.Add(field.column.column_name, DateTime.Now);
                                            }
                                        }
                                        //else if (field.column.data_type == EnumPgDataType.SmallInt || field.column.data_type == EnumPgDataType.Integer)
                                        else if (field.column.data_type == EnumPgDataType.Integer)
                                        {
                                            try
                                            {
                                                values.Add(field.column.column_name, cell.GetValue<int>());
                                                valuesInsert.Add(field.column.column_name, cell.GetValue<int>());
                                            }
                                            catch
                                            {
                                                values.Add(field.column.column_name, 0);
                                            }
                                        }
                                        else if (field.column.data_type == EnumPgDataType.Double)
                                        {
                                            try
                                            {
                                                values.Add(field.column.column_name, cell.GetValue<float>());
                                                valuesInsert.Add(field.column.column_name, cell.GetValue<float>());
                                            }
                                            catch
                                            {
                                                values.Add(field.column.column_name, 0.0);
                                                valuesInsert.Add(field.column.column_name, 0.0);
                                            }
                                        }
                                        else if (field.column.data_type == EnumPgDataType.Boolean)
                                        {
                                            try
                                            {
                                                values.Add(field.column.column_name, cell.GetValue<bool>());
                                                valuesInsert.Add(field.column.column_name, cell.GetValue<bool>());
                                            }
                                            catch
                                            {
                                                values.Add(field.column.column_name, false);
                                                valuesInsert.Add(field.column.column_name, false);
                                            }
                                        }
                                        else
                                        {
                                            values.Add(field.column.column_name, cell.GetValue<string>());
                                            valuesInsert.Add(field.column.column_name, cell.GetValue<string>());
                                        }
                                    }
                                }
                            }
                            if (check)
                            {
                                if (layer.geometry == "Point")
                                {
                                    var toado_x = worksheet.Cells[rIdx, form.form_fields.Count() + 2].GetValue<string>();
                                    var toado_y = worksheet.Cells[rIdx, form.form_fields.Count() + 3].GetValue<string>();

                                    values.Add("tmp_lng", toado_x);
                                    values.Add("tmp_lat", toado_y);
                                }
                                else
                                {
                                    var lnglatLists = worksheet.Cells[rIdx, form.form_fields.Count() + 2].GetValue<string>();
                                    values.Add("lnglat", lnglatLists.Split(";").ToList());
                                }
                                //
                                records.Add(values);
                                recordInserts.Add(valuesInsert);
                            }
                            else
                                break;
                            // }
                        }
                        var action = new Form.Action
                        {
                            id = 0,
                            action_at = DateTime.Now,
                            user_action = _workContext.GetCurrentUserId(),
                            form_id = form.id,
                            success_counter = 0,
                            fail_counter = 0
                        };
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                            GeoJsonWriter geoJsonWriter = new GeoJsonWriter();
                            for (int i = 0; i < recordInserts.Count(); i++)
                            {
                                var record = records.ElementAt(i);
                                var recordInsert = recordInserts.ElementAt(i);
                                try
                                {
                                    var keyColumn = layer.table.key_column ?? layer.table.identity_column;
                                    var labelColumn = layer.table.label_column ?? keyColumn;
                                    string sql = @$"INSERT INTO {layer.table.table_schema}.{layer.table.table_name} ({string.Join(",", colnames.Select(x => @$"{x}"))}) VALUES ({string.Join(",", recordInsert.Select(x => $"@{x.Key}"))}) RETURNING {keyColumn?.column_name};";
                                    var id = (await uow.Connection.QueryAsync<int>(sql, recordInsert)).FirstOrDefault();
                                    if (id > 0)
                                    {
                                        if (layer.geometry == "Point")
                                        {
                                            if (double.TryParse(record["tmp_lng"]?.ToString(), out double lng) && double.TryParse(record["tmp_lat"]?.ToString(), out double lat))
                                            {
                                                if (layer.dimension == 2)
                                                {
                                                    uow.Connection.Execute($"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_MakePoint({lng},{lat}),4326) WHERE {keyColumn?.column_name} = {id}");
                                                }
                                                else if (layer.dimension == 3)
                                                {
                                                    uow.Connection.Execute($"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_Force3D(ST_SetSRID(ST_MakePoint({lng},{lat}),4326)) WHERE {keyColumn?.column_name} = {id}");
                                                }
                                            }

                                        }
                                        else if (layer.geometry == "Polygon" || layer.geometry == "MultiPolygon")
                                        {
                                            if (record["lnglat"] is List<string>)
                                            {
                                                List<string> latlng = record["lnglat"] as List<string>;
                                                latlng.Add(latlng.FirstOrDefault());
                                                var polygon = geometryFactory.CreatePolygon(latlng.Select(x => x.Split(",")).Select(o =>
                                                {
                                                    try
                                                    {
                                                        return new NetTopologySuite.Geometries.Coordinate(Double.Parse(o[0]), Double.Parse(o[1]));
                                                    }
                                                    catch
                                                    {
                                                        return new NetTopologySuite.Geometries.Coordinate();
                                                    }
                                                }).ToArray());
                                                uow.Connection.Execute($"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_GeomFromGeoJSON('{geoJsonWriter.Write(polygon)}'), 4326) WHERE {keyColumn?.column_name} = {id}");
                                            }
                                        }
                                        else if (layer.geometry == "LineString" || layer.geometry == "MultiLineString")
                                        {
                                            if (record["lnglat"] is List<string>)
                                            {
                                                List<string> latlng = record["lnglat"] as List<string>;
                                                var polygon = geometryFactory.CreateLineString(latlng.Select(x => x.Split(",")).Select(o =>
                                                {
                                                    try
                                                    {
                                                        return new NetTopologySuite.Geometries.Coordinate(Double.Parse(o[0]), Double.Parse(o[1]));
                                                    }
                                                    catch
                                                    {
                                                        return new NetTopologySuite.Geometries.Coordinate();
                                                    }
                                                }).ToArray());
                                                uow.Connection.Execute($"UPDATE {layer.table.table_schema}.{layer.table.table_name} SET geom = ST_SetSRID(ST_GeomFromGeoJSON('{geoJsonWriter.Write(polygon)}'), 4326) WHERE {keyColumn?.column_name} = {id}");
                                            }
                                        }
                                        if (layer.table.columns.Any(x => x.column_name == "commune_code") && layer.table.columns.Any(x => x.column_name == "district_code"))
                                        {
                                            uow.Connection.Execute(@$"UPDATE {layer.table.table_schema}.{layer.table.table_name} AS t SET commune_code = r.area_id, district_code = r.parent_id, province_code = SUBSTRING(r.parent_id::TEXT, 1, 3)::INTEGER FROM (SELECT {Sql.Entity<Commune>(x => x.area_id):TC} as area_id, {Sql.Entity<Commune>(x => x.parent_id):TC} parent_id, geom FROM regional.communes) AS r WHERE ST_WithIn(t.geom, r.geom) AND {keyColumn?.column_name} = {id};");
                                        }
                                        insertedId.Add(id);
                                        action.success_counter++;
                                    }
                                    features.Add(new Form.Feature
                                    {
                                        form_id = form.id,
                                        table_id = form.table_id,
                                        feature_id = id
                                    });
                                    if (record.ContainsKey(keyColumn?.column_name) == false)
                                    {
                                        record.Add(keyColumn?.column_name, id);
                                    }
                                    else
                                    {
                                        record[keyColumn?.column_name] = id;
                                    }
                                }
                                catch (Exception er)
                                {
                                    action.fail_counter++;
                                    if (record.ContainsKey("errors") == false)
                                    {
                                        record.Add("error", er.Message);
                                    }
                                }
                            }
                        }
                        if (!check)
                        {
                            return new RestError(-1, message_err);
                        }

                        IDictionary<string, IEnumerable<IDictionary<string, object>>> data =
                            new Dictionary<string, IEnumerable<IDictionary<string, object>>>();
                        data.Add(layer.table.table_name, records);
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            uow.Connection.Insert<Form.Action>(action);
                            foreach (var feature in features)
                            {
                                uow.Connection.Insert<Form.Feature>(feature);
                            }
                        }

                        return new RestData
                        {
                            data = new
                            {
                                items = data,
                                table = layer.table,
                            },
                        };
                    }
                }
                catch (Exception err)
                {
                    return new RestError(-1, err.Message);
                }
            }
        }

        private RestBase parseCsv(IFormFile f)
        {
            using (var session = OpenSession())
            {
                using (TextReader tr = new StreamReader(f.OpenReadStream()))
                {
                    CsvReader csv = new CsvReader(tr);
                    csv.Read();
                    int formId = csv.GetField<int>(0);
                    Form? form = session.Find<Form>(statement => statement
                        .Where($"{Sql.Entity<Form>(x => x.id):TC} = @formId")
                        .WithParameters(new { formId = formId })
                        .Include<FormField>(join => join.LeftOuterJoin().OrderBy($"{Sql.Entity<FormField>(x => x.order):TC}"))
                        .Include<TableColumn>(join => join.LeftOuterJoin())
                    ).FirstOrDefault();
                    if (form == null)
                    {
                        return new RestError();
                    }

                    //Layer? layer = getLayerWithTableAndColumn(form.layer_id);
                    Layer? layer = getLayerWithTableInfo(form.table_id);

                    List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                    while (csv.Read())
                    {
                        records.Add(csv.GetRecord<dynamic>() as IDictionary<string, object>);
                    }

                    IDictionary<string, IEnumerable<IDictionary<string, object>>> data =
                        new Dictionary<string, IEnumerable<IDictionary<string, object>>>();
                    data.Add(layer.table.table_name, records);
                    return new RestData
                    {
                        data = data
                    };
                }
            }
        }

        private RestBase parseShp(params IFormFile[] files)
        {
            IFormFile? shp = files.FirstOrDefault(x => Path.GetExtension(x.FileName) == ".shp");
            IFormFile? shx = files.FirstOrDefault(x => Path.GetExtension(x.FileName) == ".shx");
            IFormFile? dbf = files.FirstOrDefault(x => Path.GetExtension(x.FileName) == ".dbf");
            if (shp == null || shx == null || dbf == null)
            {
                return new RestError();
            }
            else
            {
                List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
                string baseName = Path.GetFileNameWithoutExtension(shp.FileName);
                using (var session = OpenSession())
                {
                    Layer? layer = session.Find<Layer>(statement => statement
                        .Where($"{nameof(Layer.table.table_name)}='{baseName}'")
                    ).FirstOrDefault();
                    if (layer == null)
                    {
                        new List<Dictionary<string, object>>();
                    }
                    else
                    {
                        using (var shpStream = shp.OpenReadStream())
                        {
                            IStreamProvider shapeStream = new ByteStreamProvider(StreamTypes.Shape, shpStream);
                            using (var dbfStream = dbf.OpenReadStream())
                            {
                                IStreamProvider dataStream = new ByteStreamProvider(StreamTypes.Data, dbfStream);
                                using (var shxStream = shx.OpenReadStream())
                                {
                                    IStreamProvider idxStream = new ByteStreamProvider(StreamTypes.Index, shxStream);
                                    //
                                    IStreamProviderRegistry streamProviderRegistry =
                                        new ShapefileStreamProviderRegistry(shapeStream, dataStream, idxStream);
                                    GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                                    ShapefileDataReader shapeFileDataReader =
                                        new ShapefileDataReader(streamProviderRegistry, geometryFactory);
                                    WKTWriter wktWriter = new WKTWriter();
                                    try
                                    {
                                        DbaseFileHeader header = shapeFileDataReader.DbaseHeader;
                                        shapeFileDataReader.Reset();

                                        IList<IFeature> features = new List<IFeature>();

                                        while (shapeFileDataReader.Read())
                                        {
                                            IDictionary<string, object> record = new Dictionary<string, object>();
                                            Geometry geometry = shapeFileDataReader.Geometry;
                                            for (int i = 0; i < header.NumFields; i++)
                                            {
                                                //DbaseFieldDescriptor fldDescriptor = header.Fields[i];
                                                //if (fldDescriptor.Name == nameof(GeoPoint.lng))
                                                //{
                                                //    record.Add(header.Fields[i].Name, geometry?.Coordinate?.X);
                                                //}
                                                //else if (fldDescriptor.Name == nameof(GeoPoint.lat))
                                                //{
                                                //    record.Add(header.Fields[i].Name, geometry?.Coordinate?.Y);
                                                //}
                                                //else if (fldDescriptor.Name == nameof(GeoShape.geom_text))
                                                //{
                                                //    record.Add(header.Fields[i].Name, geometry?.AsText());
                                                //}
                                                //else if (header.Fields[i].Type == typeof(string))
                                                //    record.Add(header.Fields[i].Name,
                                                //        shapeFileDataReader.GetString(i + 1).DecodeFromUtf8());
                                                //else
                                                //    record.Add(header.Fields[i].Name,
                                                //        shapeFileDataReader.GetValue(i + 1));
                                            }

                                            records.Add(record);
                                        }
                                    }
                                    catch (Exception e)
                                    {
                                        return new RestError(-1, e.Message);
                                    }
                                    finally
                                    {
                                        shapeFileDataReader.Close();
                                        shapeFileDataReader.Dispose();
                                    }
                                }
                            }
                        }
                    }
                }

                IDictionary<string, IEnumerable<IDictionary<string, object>>> data =
                    new Dictionary<string, IEnumerable<IDictionary<string, object>>>();
                data.Add(baseName, records);
                return new RestData
                {
                    data = data
                };
            }
        }

        //        private IDictionary<string, IEnumerable<IDictionary<string, object>>> parseMdb(IFormFile f)
        //        {
        //            using (var s = f.OpenReadStream())
        //            {
        //                string tmpMdb = Path.GetTempFileName();
        //                IDictionary<string, IEnumerable<IDictionary<string, object>>> data =
        //                    new Dictionary<string, IEnumerable<IDictionary<string, object>>>();
        //                try
        //                {
        //                    using (var fs = new FileStream(tmpMdb, FileMode.OpenOrCreate, FileAccess.ReadWrite))
        //                    {
        //                        s.CopyTo(fs);
        //                    }
        //
        //                    //
        //                    OdbcConnectionStringBuilder builder = new OdbcConnectionStringBuilder();
        //                    builder.Driver = "Microsoft Access Driver (*.mdb, *.accdb)";
        //                    builder.Add("Dbq", tmpMdb);
        //                    string conStr = builder.ConnectionString;
        //                    //
        //                    using (OdbcConnection con = new OdbcConnection(conStr))
        //                    {
        //                        try
        //                        {
        //                            con.Open();
        //                            //
        //                            using (var session = OpenSession())
        //                            {
        //                                DataTable dtTables = con.GetSchema("Tables");
        //                                foreach (DataRow tbl in dtTables.Rows)
        //                                {
        //                                    string tableName = tbl["TABLE_NAME"]?.ToString();
        //                                    Layer layer = session.Find<Layer>(statement =>
        //                                        statement.Where($"{nameof(Layer.TableName)}='{tableName}'")
        //                                            .Include<column>(join => join.LeftOuterJoin())).FirstOrDefault();
        //                                    if (layer == null)
        //                                    {
        //                                        continue;
        //                                    }
        //                                    else
        //                                    {
        //                                        DataTable dt = new DataTable();
        //                                        OdbcCommand cmd = new OdbcCommand($"SELECT * FROM {layer.TableName};", con);
        //                                        OdbcDataReader dr = cmd.ExecuteReader();
        //                                        dt.Load(dr);
        //                                        IGeometryFactory geometryFactory =
        //                                            new GeometryFactory(new PrecisionModel(), 4326);
        //                                        List<IDictionary<string, object>> records =
        //                                            new List<IDictionary<string, object>>();
        //                                        foreach (DataRow row in dt.Rows)
        //                                        {
        //                                            IDictionary<string, object> record = new Dictionary<string, object>();
        //                                            foreach (DataColumn col in dt.Columns)
        //                                            {
        //                                                if (layer.columns.Any(x =>
        //                                                    x.column_name.ToLower().Equals(col.ColumnName.ToLower())))
        //                                                    record.Add(col.ColumnName, row[col.ColumnName]);
        //                                            }
        //
        //                                            records.Add(record);
        //                                        }
        //
        //                                        data.Add(tableName, records);
        //                                    }
        //                                }
        //                            }
        //                        }
        //                        catch (Exception e)
        //                        {
        //                            throw e;
        //                        }
        //                        finally
        //                        {
        //                            con.Close();
        //                        }
        //                    }
        //                }
        //                catch (Exception)
        //                {
        //                }
        //                finally
        //                {
        //                    try
        //                    {
        //                        System.IO.File.Delete(tmpMdb);
        //                    }
        //                    catch
        //                    {
        //                    }
        //                }
        //
        //                //
        //                return data;
        //            }
        //        }

        //        private RestBase importData(IDictionary<string, IEnumerable<IDictionary<string, object>>> data)
        //        {
        //            using (var session = OpenSession())
        //            {
        //                IDictionary<int, bool> results = new Dictionary<int, bool>();
        //                int c = 0;
        //
        //                foreach (var key in data.Keys)
        //                {
        //                    Layer layer = session
        //                        .Find<Layer>(statement => statement.Where($"{nameof(Layer.TableName)}='{key}'"))
        //                        .FirstOrDefault();
        //                    if (layer == null)
        //                        continue;
        //                    foreach (var values in data[key])
        //                    {
        //                        int id = 0;
        //                        string sql = string.Empty;
        //                        //
        //                        if (int.TryParse(values["id"]?.ToString(), out id))
        //                        {
        //                            if (id > 0)
        //                            {
        //                                string[] pair = values.Where(x => x.Key != "id").Select(x => $"{x.Key}=@{x.Key}")
        //                                    .ToArray();
        //                                sql = $"UPDATE dbo.{layer?.TableName} SET {string.Join(',', pair)} WHERE id=@id;";
        //                            }
        //                            else if (id == 0)
        //                            {
        //                                sql =
        //                                    $"INSERT INTO dbo.{layer?.TableName} ({String.Join(',', values.Where(x => x.Key != "id").Select(x => x.Key))}) VALUES (@{String.Join(",@", values.Where(x => x.Key != "id").Select(x => x.Key))});";
        //                            }
        //                        }
        //
        //                        if (string.IsNullOrWhiteSpace(sql) == false)
        //                        {
        //                            try
        //                            {
        //                                session.Query<int>(sql, values);
        //                                results.Add(new SaveResult(true, ++c));
        //                            }
        //                            catch (Exception ex)
        //                            {
        //                                results.Add(new SaveResult(false, ++c) {errors = new string[] {ex.Message}});
        //                            }
        //                        }
        //                    }
        //                }
        //
        //                return new ImportResult(true)
        //                {
        //                    Results = results
        //                };
        //            }
        //        }

        // private IDictionary<string, IEnumerable<IDictionary<string, object>>> parseGDB(IFormFile file)
        // {
        //     using (var session = OpenSession())
        //     {
        //         using (var uow = new UnitOfWork(DbFactory, session))
        //         {
        //             IDictionary<string, IEnumerable<IDictionary<string, object>>> data = new Dictionary<string, IEnumerable<IDictionary<string, object>>>();
        //             if (file.ContentType == "application/zip" || file.ContentType == "application/x-zip-compressed")
        //             {
        //                 string fullName = Directory.CreateDirectory("temp").FullName;
        //                 string fullPath = Path.GetFullPath(Path.Combine(fullName, file.FileName));
        //                 using (Stream fileStream = System.IO.File.Open(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        //                 {
        //                     file.CopyTo(fileStream);
        //                 }
        //                 string baseName = Path.GetFileNameWithoutExtension(file.FileName);
        //                 using (var mem = new MemoryStream())
        //                 {
        //                     OGR.Ogr.RegisterAll();
        //                     var fileGdbDriver = OGR.Ogr.GetDriverByName("OpenFileGDB");
        //                     using (var dataSource = fileGdbDriver.Open(fullPath, 0))
        //                     {
        //                         if (dataSource == null)
        //                         {
        //                             throw new Exception("Không đọc được dữ liệu file, vui lòng kiểm tra lại!");
        //                         }
        //                         if (dataSource.GetLayerCount() == 0)
        //                         {
        //                             throw new Exception("File GDB không tồn tại lớp dữ liệu, vui lòng kiểm tra lại!");
        //                         }
        //                         for (int i = 0; i < dataSource.GetLayerCount(); i++)
        //                         {
        //                             List<IDictionary<string, object>> records = new List<IDictionary<string, object>>();
        //                             var layer = dataSource.GetLayerByIndex(i);
        //                             if (layer == null)
        //                             {
        //                                 throw new Exception("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
        //                             }
        //                             var spatialReference = layer.GetSpatialRef();
        //                             var shapeType = layer.GetGeomType().ToString("G").Substring(3);

        //                             var layerDefinition = layer.GetLayerDefn();

        //                             IDictionary<string, object> recordHeader = new Dictionary<string, object>();
        //                             IDictionary<string, object> recordAlias = new Dictionary<string, object>();
        //                             recordHeader.Add("geom", shapeType);
        //                             recordAlias.Add("geom", "geom");
        //                             for (var j = 0; j < layerDefinition.GetFieldCount(); j++)
        //                             {
        //                                 var field = layerDefinition.GetFieldDefn(j);
        //                                 var alias = field.GetAlternativeName();
        //                                 var aliasRef = field.GetAlternativeNameRef();
        //                                 recordAlias.Add(field.GetName().ToLower(), alias);
        //                                 switch (field.GetFieldType())
        //                                 {
        //                                     case OGR.FieldType.OFTBinary:
        //                                         break;
        //                                     case OGR.FieldType.OFTDateTime:
        //                                     case OGR.FieldType.OFTTime:
        //                                     case OGR.FieldType.OFTDate:
        //                                         recordHeader.Add($"{field.GetName().ToLower()}", EnumPgDataType.DateTime);
        //                                         break;
        //                                     case OGR.FieldType.OFTInteger:
        //                                         recordHeader.Add($"{field.GetName().ToLower()}", EnumPgDataType.Integer);
        //                                         break;
        //                                     case OGR.FieldType.OFTReal:
        //                                         recordHeader.Add($"{field.GetName().ToLower()}", EnumPgDataType.Double);
        //                                         break;
        //                                     default:
        //                                         recordHeader.Add($"{field.GetName().ToLower()}", $"{EnumPgDataType.String}_{field.GetWidth()}");
        //                                         break;
        //                                 }
        //                             }
        //                             records.Add(recordHeader);
        //                             records.Add(recordAlias);
        //                             OGR.Feature feature;
        //                             while ((feature = layer.GetNextFeature()) != null)
        //                             {
        //                                 if (feature != null)
        //                                 {
        //                                     IDictionary<string, object> record = new Dictionary<string, object>();
        //                                     OGR.Geometry gdalGeometry = feature.GetGeometryRef();
        //                                     Geometry? geometry = null;
        //                                     if (gdalGeometry != null)
        //                                     {
        //                                         try
        //                                         {
        //                                             string geoJson = gdalGeometry.ExportToJson(null);
        //                                             GeoJsonReader reader = new GeoJsonReader();
        //                                             geometry = reader.Read<Geometry>(geoJson);
        //                                             record.Add("geom", geometry);
        //                                         }
        //                                         catch (Exception e)
        //                                         {
        //                                             // Console.WriteLine(e.Message);
        //                                         }
        //                                     }
        //                                     for (int k = 0; k < layerDefinition.GetFieldCount(); k++)
        //                                     {
        //                                         var field = layerDefinition.GetFieldDefn(k);
        //                                         if (field.GetName().ToLower() == nameof(GeoPoint.toado_y))
        //                                         {
        //                                             record.Add(field.GetName().ToLower(), geometry?.Coordinate?.X);
        //                                         }
        //                                         else if (field.GetName().ToLower() == nameof(GeoPoint.toado_x))
        //                                         {
        //                                             record.Add(field.GetName().ToLower(), geometry?.Coordinate?.Y);
        //                                         }
        //                                         else if (field.GetName().ToLower() == nameof(GeoShape.geom_text))
        //                                         {
        //                                             record.Add(field.GetName().ToLower(), geometry?.AsText());
        //                                         }
        //                                         else
        //                                         {
        //                                             switch (field.GetFieldType())
        //                                             {
        //                                                 case OGR.FieldType.OFTBinary:
        //                                                     break;
        //                                                 case OGR.FieldType.OFTDateTime:
        //                                                 case OGR.FieldType.OFTTime:
        //                                                 case OGR.FieldType.OFTDate:
        //                                                     DateTime dateValue;
        //                                                     var dateString = feature.GetFieldAsString(field.GetName());
        //                                                     if (dateString.IndexOf("+") > 0)
        //                                                     {
        //                                                         dateString = dateString.Substring(0, dateString.IndexOf("+"));
        //                                                     }
        //                                                     if (DateTime.TryParseExact(dateString, "yyyy/MM/dd hh:mm:ss", CultureInfo.CurrentCulture, DateTimeStyles.None, out dateValue))
        //                                                     {
        //                                                         record.Add(field.GetName().ToLower(), dateValue);
        //                                                     }
        //                                                     else
        //                                                     {
        //                                                         record.Add(field.GetName().ToLower(), null);
        //                                                     }
        //                                                     break;
        //                                                 case OGR.FieldType.OFTInteger:
        //                                                     record.Add(field.GetName().ToLower(), feature.GetFieldAsInteger(field.GetName()));
        //                                                     break;
        //                                                 case OGR.FieldType.OFTReal:
        //                                                     record.Add(field.GetName().ToLower(), feature.GetFieldAsDouble(field.GetName()));
        //                                                     break;
        //                                                 case OGR.FieldType.OFTString:
        //                                                     record.Add(field.GetName().ToLower(), feature.GetFieldAsString(field.GetName()));
        //                                                     break;
        //                                                 default:
        //                                                     record.Add(field.GetName().ToLower(), feature.GetFieldAsString(field.GetName()));
        //                                                     break;
        //                                             }
        //                                         }
        //                                     }
        //                                     records.Add(record);
        //                                 }
        //                                 feature.Dispose();
        //                             }
        //                             data.Add(layer.GetName().ToLower(), records);
        //                         }
        //                     }
        //                     if (System.IO.File.Exists(fullPath))
        //                     {
        //                         System.IO.File.Delete(fullPath);
        //                     }
        //                     return data;
        //                 }
        //             }
        //             else
        //             {
        //                 throw new Exception("File import không hợp lệ, vui lòng kiểm tra lại!");
        //             }
        //         }
        //     }
        // }


        [Route("export")]
        [HttpPost]
        public IActionResult export([FromQuery] int? id, [FromQuery] string f = "xlsx")
        {
            if (id.HasValue == false || id.Value == 0)
                return NotFound();
            using (var session = OpenSession())
            {
                var form = session.Find<Form>(statement => statement
                    .Where($"{Sql.Entity<Form>(x => x.id):TC} = @id")
                    .WithParameters(new { id = id })
                    .Include<FormField>(join => join.InnerJoin().OrderBy($"{Sql.Entity<FormField>(x => x.id):TC}"))
                    .Include<TableColumn>(join => join.InnerJoin())).FirstOrDefault();
                if (form == null)
                    return NotFound();
                //Layer layer = getLayerWithTableAndColumn(form.layer_id);
                Layer layer = getLayerWithTableInfo(form.table_id);
                if (layer == null)
                    return NotFound();
                switch (f)
                {
                    case "xlsx":
                        return toXlsx(form, layer);
                    case "csv":
                        return toCsv(form, layer);
                    case "shp":
                        return toShp(form, layer);
                    //                    case "mdb":
                    //                        return toMdb(form, layer);
                    default:
                        break;
                }
                return NotFound();
            }
        }

        private FileContentResult toXlsx(Form form, Layer layer)
        {
            ExcelWorksheet sheet;
            ExcelRange cell;
            using (var session = OpenSession())
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using (ExcelPackage excelPackage = new ExcelPackage())
                {
                    sheet = excelPackage.Workbook.Worksheets.Add(form.name);
                    sheet.Workbook.Properties.Author = "VietGIS";
                    sheet.Workbook.Properties.Title = form.name;
                    sheet.Cells.Style.Font.Size = 8;
                    sheet.Cells.Style.Font.Name = "Verdana";

                    //Tạo tiêu đề
                    cell = sheet.Cells[1, 1];
                    OfficeHelper.setStyle(ref cell, EnumFormat.BOLD | EnumFormat.CENTER | EnumFormat.MIDDLE);
                    cell.Value = "Mã biểu mẫu: ";

                    cell = sheet.Cells[1, 2];
                    OfficeHelper.setStyle(ref cell, EnumFormat.LEFT);
                    cell.Value = form.id;

                    cell = sheet.Cells[2, 1];
                    OfficeHelper.setStyle(ref cell, EnumFormat.BOLD | EnumFormat.CENTER | EnumFormat.MIDDLE);
                    cell.Value = "Tên biểu mẫu: ";

                    cell = sheet.Cells[2, 2];
                    OfficeHelper.setStyle(ref cell, EnumFormat.LEFT);
                    cell.Value = form.name;

                    cell = sheet.Cells[3, 1];
                    OfficeHelper.setStyle(ref cell,
                        EnumFormat.BOLD | EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                    cell.Value = "STT";

                    for (int i = 0; i < form.form_fields.Count(); i++)
                    {
                        cell = sheet.Cells[3, i + 2];
                        var formField = form.form_fields.ElementAt(i);
                        if (formField.column.require)
                        {
                            Color colFromHex = System.Drawing.ColorTranslator.FromHtml("#FF0000");
                            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                            cell.Style.Fill.BackgroundColor.SetColor(colFromHex);
                            cell.Style.Font.Color.SetColor(ColorTranslator.FromHtml("#FFFFFF"));
                        }

                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BOLD | EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                        cell.Value = string.IsNullOrWhiteSpace(formField.label)
                            ? formField.column.name_vn
                            : formField.label;
                    }

                    if (layer.geometry == "Point")
                    {
                        cell = sheet.Cells[3, form.form_fields.Count() + 2];
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BOLD | EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                        cell.Value = "Tọa độ X";

                        cell = sheet.Cells[3, form.form_fields.Count() + 3];
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BOLD | EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                        cell.Value = "Tọa độ Y";
                    }
                    else
                    {
                        cell = sheet.Cells[3, form.form_fields.Count() + 2];
                        OfficeHelper.setStyle(ref cell,
                            EnumFormat.BOLD | EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                        cell.Value = "Kinh độ,Vĩ độ";
                    }

                    if (form.include_data)
                    {
                        string queryField = string.Join(",", form.form_fields.Select(x => x.column.column_name));
                        SQLService sqlService = new SQLService(DbFactory);
                        string sql = $"SELECT {queryField} FROM {layer.table.table_schema}.{layer.table.table_name}";

                        var tables = getTablesAndColumns(layer.table.table_schema);
                        IDictionary<int, List<DevExtremeBaseModel>> lookup = new Dictionary<int, List<DevExtremeBaseModel>>();
                        for (int i = 0; i < form.form_fields.Count(); i++)
                        {
                            var field = form.form_fields.ElementAt(i);
                            if (field.column.lookup_table_id > 0)
                            {
                                var table = tables.FirstOrDefault(x => x.id == field.column.lookup_table_id);
                                if (table != null)
                                {
                                    var keyColumn = table.key_column ?? table.identity_column;
                                    var labelColumn = table.label_column ?? keyColumn;
                                    lookup.Add(field.column.lookup_table_id, session.Query<DevExtremeBaseModel>($@"SELECT {keyColumn.column_name} AS id,{labelColumn.column_name} AS text FROM {table.table_schema}.{table.table_name}").ToList());
                                }
                            }
                        }
                        if (layer.geometry == "Point")
                        {
                            sql = $"SELECT {queryField}, ST_X(geom) AS lng, ST_Y(geom) AS lat FROM {layer.table.table_schema}.{layer.table.table_name}";
                        }
                        var rows = sqlService.QueryToDictationary(sql);

                        for (int j = 0; j < rows.Count(); j++)
                        {
                            cell = sheet.Cells[4 + j, 1];
                            OfficeHelper.setStyle(ref cell, EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                            cell.Value = j + 1;
                            //
                            for (int i = 0; i < form.form_fields.Count(); i++)
                            {
                                var field = form.form_fields.ElementAt(i).column;
                                cell = sheet.Cells[4 + j, i + 2];
                                object val = null;
                                if (rows.ElementAt(j).TryGetValue(field.column_name, out val) == false)
                                {
                                    continue;
                                }

                                if (val == null)
                                    continue;
                                if (field.lookup_table_id > 0)
                                {
                                    var lookup_data = lookup.FirstOrDefault(x => x.Key == field.lookup_table_id);
                                    if (lookup_data.Value != null)
                                    {
                                        var item = lookup_data.Value.Where(x => x.id.ToString() == val.ToString()).FirstOrDefault();
                                        if (item != null)
                                        {
                                            OfficeHelper.setStyle(ref cell,
                                            EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                            cell.Value = item.text.ToString();
                                        }
                                    }
                                    else
                                    {
                                        OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                        cell.Value = val.ToString();
                                    }
                                }
                                else if (field.data_type == EnumPgDataType.String || field.data_type == EnumPgDataType.Text)
                                {
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                    cell.Value = val.ToString();
                                }
                                //else if (field.data_type == EnumPgDataType.SmallInt || field.data_type == EnumPgDataType.Integer || field.data_type == EnumPgDataType.Double)
                                else if (field.data_type == EnumPgDataType.Integer || field.data_type == EnumPgDataType.Double)
                                {
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                    int value = 0;
                                    if (int.TryParse(val.ToString(), out value))
                                    {
                                        cell.Value = value;
                                    }
                                }
                                else if (field.data_type == EnumPgDataType.Date || field.data_type == EnumPgDataType.DateTime || field.data_type == EnumPgDataType.DateTimeTZ
                                    || field.data_type == EnumPgDataType.Time)
                                {
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.CENTER | EnumFormat.MIDDLE);
                                    cell.Style.Numberformat.Format = field.data_type == EnumPgDataType.Date ? "dd/MM/yyyy" : field.data_type == EnumPgDataType.DateTime ? "dd/MM/yyyy HH:mm:ss" : "HH:mm:ss";
                                    DateTime d = DateTime.Today;
                                    if (DateTime.TryParse(val.ToString(), out d))
                                    {
                                        cell.Value = d;
                                    }
                                }
                                else
                                {
                                    OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                    cell.Value = val.ToString();
                                }
                            }
                            //
                            if (layer.geometry == "Point")
                            {
                                cell = sheet.Cells[4 + j, form.form_fields.Count() + 2];
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                cell.Value = rows.ElementAt(j).GetValueOrDefault("lng");
                                cell = sheet.Cells[4 + j, form.form_fields.Count() + 3];
                                OfficeHelper.setStyle(ref cell,
                                        EnumFormat.BORDER | EnumFormat.LEFT | EnumFormat.MIDDLE);
                                cell.Value = rows.ElementAt(j).GetValueOrDefault("lat");
                            }
                        }
                    }

                    if (sheet.Dimension != null)
                        sheet.Cells[sheet.Dimension.Address].AutoFitColumns();
                    return File(excelPackage.GetAsByteArray(),
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        string.Format("{0}.xlsx", StringHelper.RemoveVietNameseSign(form.name?.Replace(" ", "_"))));
                }

            }
        }
        private const int DoubleLength = 18;
        private const int DoubleDecimals = 8;
        private const int IntLength = 10;
        private const int IntDecimals = 0;
        private const int StringLength = 254;
        private const int StringDecimals = 0;
        private const int BoolLength = 1;
        private const int BoolDecimals = 0;
        private const int DateLength = 8;
        private const int DateDecimals = 0;

        private FileContentResult toShp(Form form, Layer layer)
        {
            var geojsonWriter = new GeoJsonWriter();
            var geojsonReader = new GeoJsonReader();
            using (var session = OpenSession())
            {
                IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T} 
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {nameof(LayerDomain.table_id):C} = {Sql.Entity<TableInfo>(x => x.id):TC}
                    WHERE {nameof(LayerDomain.layer_id):C} = {layer.id}", (d, t) =>
                {
                    d.table = t;
                    return d;
                },
                    splitOn: $"{nameof(LayerDomain.table_id)}");

                List<TableColumn> tableColumns = session.Find<TableColumn>(stm => stm
                    .Where($"{nameof(TableColumn.table_id)} = {layer.table.id}")
                    .OrderBy($"{nameof(TableColumn.order)} ASC")).ToList();
                string sql =
                    $"SELECT {String.Join(',', form.form_fields.Where(x => "geom".Equals(x.column.column_name) == false).Select(x => x.column.column_name))}, ST_AsGeoJSON(geom) AS geom FROM \"{layer.table.table_schema}\".\"{layer.table.table_name}\"";
                var result = session
                    .Query(sql)
                    .ToList();

                string shpName = Path.GetTempFileName();
                shpName = Path.ChangeExtension(shpName, "shp");
                string shxName = Path.GetTempFileName();
                shxName = Path.ChangeExtension(shxName, "shx");
                string dbfName = Path.GetTempFileName();
                dbfName = Path.ChangeExtension(dbfName, "dbf");

                IStreamProvider shapeStream = new FileStreamProvider(StreamTypes.Shape, shpName);
                IStreamProvider dataStream = new FileStreamProvider(StreamTypes.Data, dbfName);
                IStreamProvider idxStream = new FileStreamProvider(StreamTypes.Index, shxName);
                //
                IStreamProviderRegistry streamProviderRegistry =
                    new ShapefileStreamProviderRegistry(shapeStream, dataStream, idxStream);
                GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);


                List<IFeature> features = new List<IFeature>();
                DbaseFileHeader header = new DbaseFileHeader();
                header.NumRecords = result.Count;
                foreach (var row in result)
                {
                    var items = row as IDictionary<string, object>;
                    var attributes = new AttributesTable();
                    if (items != null)
                    {
                        foreach (string key in items.Keys)
                        {
                            int countChar = 1;

                            var name = key?.ToLower().Trim();
                            if (!string.IsNullOrWhiteSpace(name) && name.Length > 11)
                            {
                                name = name.Substring(0, 11);
                                if (attributes.Exists(name))
                                {
                                    name = key?.Substring(0, 11 - countChar);
                                    countChar++;
                                }
                            }

                            object value = items.FirstOrDefault(s => s.Key == key).Value;

                            var tableColumn = tableColumns.FirstOrDefault(s => s.column_name == key);
                            if (tableColumn != null)
                            {
                                switch (tableColumn.data_type)
                                {
                                    case EnumPgDataType.BigInt:
                                    case EnumPgDataType.SmallInt:
                                    case EnumPgDataType.Integer:
                                        header.AddColumn(name, 'N', IntLength, IntDecimals);
                                        break;
                                    case EnumPgDataType.Boolean:
                                        header.AddColumn(name, 'L', BoolLength, BoolDecimals);
                                        break;
                                    case EnumPgDataType.Double:
                                        header.AddColumn(name, 'N', DoubleLength, DoubleDecimals);
                                        break;
                                    case EnumPgDataType.String:
                                    case EnumPgDataType.Text:
                                        header.AddColumn(name, 'C', StringLength, StringDecimals);
                                        break;
                                    case EnumPgDataType.Date:
                                    case EnumPgDataType.Time:
                                    case EnumPgDataType.DateTime:
                                    case EnumPgDataType.DateTimeTZ:
                                        header.AddColumn(name, 'D', DateLength, DateDecimals);
                                        break;
                                    default:
                                        break;
                                }
                            }
                            attributes.Add(name, items.FirstOrDefault(s => s.Key == key).Value);
                        }

                        if (items.ContainsKey(nameof(GeoPoint.toado_x)) && items.ContainsKey(nameof(GeoPoint.toado_y)))
                        {
                            if (string.IsNullOrWhiteSpace(items.FirstOrDefault(s => s.Key == nameof(GeoPoint.toado_x)).Value
                                    ?.ToString()) || string.IsNullOrWhiteSpace(items
                                    .FirstOrDefault(s => s.Key == nameof(GeoPoint.toado_y)).Value?.ToString()))
                                features.Add(new Feature(geometryFactory.CreatePoint(), attributes));
                            else
                                features.Add(new Feature(
                                    geometryFactory.CreatePoint(new Coordinate(
                                        double.Parse(items.FirstOrDefault(s => s.Key == nameof(GeoPoint.toado_x)).Value
                                            ?.ToString()),
                                        double.Parse(items.FirstOrDefault(s => s.Key == nameof(GeoPoint.toado_y)).Value
                                            ?.ToString()))), attributes));
                        }
                    }
                }

                ShapefileDataWriter shpWriter =
                    new ShapefileDataWriter(streamProviderRegistry, geometryFactory, Encoding.UTF8);
                shpWriter.Header = new DbaseFileHeader(Encoding.UTF8) { NumRecords = features.Count };


                foreach (var field in header.Fields)
                {
                    shpWriter.Header.AddColumn(field.Name, field.DbaseType, field.Length, field.DecimalCount);
                }

                shpWriter.Write(features);

                using (var ms = new MemoryStream())
                {
                    ZipOutputStream zipStream = new ZipOutputStream(ms);
                    zipStream.SetLevel(3); //0-9, 9 being the highest level of compression

                    using (var sShape = new FileStream(shpName, FileMode.OpenOrCreate))
                    {
                        ZipEntry shpEntry =
                            new ZipEntry(
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.shp")
                            {
                                Size = sShape.Length,
                                DateTime = DateTime.Now
                            };

                        zipStream.PutNextEntry(shpEntry);
                        StreamUtils.Copy(sShape, zipStream, new byte[4096]);
                        zipStream.CloseEntry();
                    }

                    using (var sData = new FileStream(dbfName, FileMode.OpenOrCreate))
                    {
                        ZipEntry dbfEntry =
                            new ZipEntry(
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.dbf")
                            {
                                Size = sData.Length,
                                DateTime = DateTime.Now
                            };

                        zipStream.PutNextEntry(dbfEntry);
                        StreamUtils.Copy(sData, zipStream, new byte[4096]);
                        zipStream.CloseEntry();
                    }

                    using (var sIdx = new FileStream(shxName, FileMode.OpenOrCreate))
                    {
                        ZipEntry shxEntry =
                            new ZipEntry(
                                $"{StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")}.shx")
                            {
                                Size = sIdx.Length,
                                DateTime = DateTime.Now
                            };

                        zipStream.PutNextEntry(shxEntry);
                        StreamUtils.Copy(sIdx, zipStream, new byte[4096]);
                        zipStream.CloseEntry();
                    }

                    zipStream.IsStreamOwner = false;
                    zipStream.Close();

                    if (System.IO.File.Exists(shpName))
                    {
                        System.IO.File.Delete(shpName);
                    }
                    if (System.IO.File.Exists(dbfName))
                    {
                        System.IO.File.Delete(dbfName);
                    }
                    if (System.IO.File.Exists(shxName))
                    {
                        System.IO.File.Delete(shxName);
                    }

                    ms.Position = 0;
                    return File(ms.ToArray(), "application/zip",
                        string.Format("{0}.zip",
                            StringHelper.RemoveVietNameseSign(layer.name_vn).Replace(" ", "_")));
                }
            }
        }

        private FileContentResult toCsv(Form form, Layer layer)
        {
            //
            string queryField = string.Join(",", form.form_fields.Select(x => x.column.column_name));
            SQLService sqlService = new SQLService(DbFactory);
            var rows = sqlService.QueryToDictationary($"SELECT {queryField} FROM {layer.table.table_schema}.{layer.table.table_name}");
            //
            using (var ms = new MemoryStream())
            {
                using (var tw = new StreamWriter(ms))
                {
                    using (var csv = new CsvWriter(tw))
                    {
                        csv.WriteField(form.id);
                        csv.NextRecord();
                        foreach (var key in rows?.FirstOrDefault().Keys)
                        {
                            csv.WriteField(key);
                        }

                        csv.NextRecord();
                        foreach (var row in rows)
                        {
                            foreach (var key in row.Keys)
                            {
                                csv.WriteField(row[key]);
                            }

                            //
                            csv.NextRecord();
                        }
                    }
                    return File(ms.ToArray(), "text/csv",
                        string.Format("{0}.csv", StringHelper.RemoveVietNameseSign(form.name?.Replace(" ", "_"))));
                }
            }
        }

        //        private FileContentResult toMdb(Form form, Layer layer)
        //        {
        //            if (System.IO.File.Exists(EMPTY_MDB))
        //            {
        //                string tmpMdb = Path.GetTempFileName();
        //                //
        //                using (FileStream fs = new FileStream(EMPTY_MDB, FileMode.Open, FileAccess.Read))
        //                {
        //                    using (FileStream fsTemp = new FileStream(tmpMdb, FileMode.OpenOrCreate, FileAccess.ReadWrite))
        //                    {
        //                        fs.CopyTo(fsTemp);
        //                    }
        //                }
        //
        //                //
        //                OdbcConnectionStringBuilder builder = new OdbcConnectionStringBuilder();
        //                if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        //                    builder.Driver = "Microsoft Access Driver (*.mdb, *.accdb)";
        //                else if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        //                    builder.Driver = "MDBTools";
        //                builder.Add("DBQ", tmpMdb);
        //                string conStr = builder.ConnectionString;
        //                //
        //                using (OdbcConnection con = new OdbcConnection(conStr))
        //                {
        //                    try
        //                    {
        //                        List<string> fields = new List<string>()
        //                        {
        //                            "FID AUTOINCREMENT"
        //                        };
        //                        foreach (var field in form.form_fields)
        //                        {
        //                            switch (field.column.data_type)
        //                            {
        //                                case "nvarchar":
        //                                case "nchar":
        //                                case "varchar":
        //                                    fields.Add($"{field.column.column_name} LONGTEXT");
        //                                    break;
        //                                case "datetime":
        //                                case "datetime2":
        //                                    fields.Add($"{field.column.column_name} DATETIME");
        //                                    break;
        //                                case "decimal":
        //                                    fields.Add($"{field.column.column_name} LONGTEXT");
        //                                    break;
        //                                case "float":
        //                                    fields.Add($"{field.column.column_name} LONGTEXT");
        //                                    break;
        //                                case "int":
        //                                    fields.Add($"{field.column.column_name} LONGTEXT");
        //                                    break;
        //                                case "smallint":
        //                                    fields.Add($"{field.column.column_name} YESNO");
        //                                    break;
        //                                default:
        //                                    fields.Add($"{field.column.column_name} LONGTEXT");
        //                                    break;
        //                            }
        //                        }
        //
        //                        con.Open();
        //                        con.Execute($"CREATE TABLE {layer.TableName} ({string.Join(",", fields)});");
        //                        //
        //                        SQLService SQLService = new SQLService(DbFactory);
        //                        string queryField = string.Join(",", form.form_fields.Select(x => x.column.column_name));
        //                        var rows = SQLService.QueryToDictationary($"SELECT {queryField} FROM {layer.TableName}");
        //                        string insertSql = $"INSERT INTO {layer.TableName} ({queryField}) " +
        //                                           $"VALUES ({string.Join(",", new String('?', form.form_fields.Count()).ToArray())})";
        //                        foreach (var row in rows)
        //                        {
        //                            OdbcCommand cmd = new OdbcCommand(insertSql, con);
        //                            foreach (var key in row.Keys)
        //                            {
        //                                cmd.Parameters.Add(new OdbcParameter($"@{key}", row[key]));
        //                            }
        //
        //                            try
        //                            {
        //                                cmd.ExecuteNonQuery();
        //                            }
        //                            catch (Exception e)
        //                            {
        //                            }
        //                            finally
        //                            {
        //                                cmd.Dispose();
        //                            }
        //                        }
        //                    }
        //                    catch (Exception e)
        //                    {
        //                        throw e;
        //                    }
        //                    finally
        //                    {
        //                        con.Close();
        //                    }
        //                }
        //
        //                using (var ms = new MemoryStream())
        //                {
        //                    try
        //                    {
        //                        using (FileStream fsTemp = new FileStream(tmpMdb, FileMode.Open, FileAccess.Read))
        //                        {
        //                            fsTemp.CopyTo(ms);
        //                        }
        //                    }
        //                    catch
        //                    {
        //                    }
        //                    finally
        //                    {
        //                        try
        //                        {
        //                            System.IO.File.Delete(tmpMdb);
        //                        }
        //                        catch
        //                        {
        //                        }
        //                    }
        //
        //                    return File(ms.ToArray(), "application/vnd.msaccess",
        //                        string.Format("{0}.mdb", StringHelper.RemoveVietNameseSign(form.FormName?.Replace(" ", "_"))));
        //                }
        //            }
        //            else
        //            {
        //                throw new FileNotFoundException("Empty mdb not found!");
        //            }
        //        }

        // public FileContentResult toGdb(Form form, Layer layer)
        // {
        //     var geojsonWriter = new GeoJsonWriter();
        //     var geojsonReader = new GeoJsonReader();

        //     using (var session = OpenSession())
        //     {
        //         IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
        //             SELECT * FROM {Sql.Entity<LayerDomain>():T} 
        //             INNER JOIN {Sql.Entity<TableInfo>():T}
        //                 ON {nameof(LayerDomain.table_id):C} = {Sql.Entity<TableInfo>(x => x.id):TC}
        //             WHERE {nameof(LayerDomain.layer_id):C} = {layer.id}", (d, t) =>
        //         {
        //             d.table = t;
        //             return d;
        //         },
        //             splitOn: $"{nameof(LayerDomain.table_id):C}");

        //         var conditions = getConditions(layer.table, dto.@params);
        //         var selectedColumns = layer.table.columns.Where(x => "geom".Equals(x.column_name) == false).ToList();
        //         string sql =
        //             $"SELECT {String.Join(',', selectedColumns.Select(x => x.column_name))}, ST_AsGeoJSON(geom) AS geom FROM \"{layer.table.table_schema}\".\"{layer.table.table_name}\" WHERE {conditions}";
        //         var result = session.Query(sql).ToList();
        //         //Tạo thư mục gdb
        //         string gdbFolderName = layer.table.table_name;
        //         string tempFolderName = Directory.CreateDirectory("temp").FullName;
        //         string gdbFolderPath = Path.GetFullPath(Path.Combine(tempFolderName, gdbFolderName));
        //         Directory.CreateDirectory(gdbFolderPath);
        //         //Lấy tên file zip
        //         string gdbFolderZipPath = Path.GetFullPath(Path.Combine(tempFolderName, gdbFolderName));
        //         gdbFolderZipPath = Path.ChangeExtension(gdbFolderZipPath, "zip");
        //         // Lấy tên file gdb
        //         string gdbFileName = Path.GetFullPath(Path.Combine(gdbFolderPath, gdbFolderName));
        //         gdbFileName = Path.ChangeExtension(gdbFileName, "gdb");

        //         OGR.wkbGeometryType geometryType;
        //         switch (layer.geometry)
        //         {
        //             case EnumGeometryType.Point:
        //                 geometryType = OGR.wkbGeometryType.wkbPoint;
        //                 break;
        //             case EnumGeometryType.LineString:
        //                 geometryType = OGR.wkbGeometryType.wkbLineString;
        //                 break;
        //             case EnumGeometryType.Polygon:
        //                 geometryType = OGR.wkbGeometryType.wkbPolygon;
        //                 break;
        //             case EnumGeometryType.MultiPoint:
        //                 geometryType = OGR.wkbGeometryType.wkbMultiPoint;
        //                 break;
        //             case EnumGeometryType.MultiLineString:
        //                 geometryType = OGR.wkbGeometryType.wkbMultiLineString;
        //                 break;
        //             case EnumGeometryType.MultiPolygon:
        //                 geometryType = OGR.wkbGeometryType.wkbMultiPolygon;
        //                 break;
        //             default:
        //                 geometryType = OGR.wkbGeometryType.wkbMultiPoint;
        //                 break;
        //         }
        //         OSGeo.OGR.Ogr.RegisterAll();

        //         string proj = $"GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]]";
        //         var srs = new OSR.SpatialReference(proj);
        //         using (var fileGdbDriver = OGR.Ogr.GetDriverByName("OpenFileGDB"))
        //         {
        //             using (OGR.DataSource dataSource = fileGdbDriver.CreateDataSource(gdbFileName, null))
        //             {
        //                 dataSource.CreateLayer(layer.table.table_name, srs, geometryType, null);
        //                 var ogrLayer = dataSource.GetLayerByName(layer.table.table_name);
        //                 OGR.FeatureDefn featureDefn = new OGR.FeatureDefn(layer.table.table_name);
        //                 OGR.GeomFieldDefn geomFieldDefn = new OGR.GeomFieldDefn("geom", geometryType);
        //                 featureDefn.AddGeomFieldDefn(geomFieldDefn);
        //                 for (int i = 0; i < selectedColumns.Count(); i++)
        //                 {
        //                     OGR.FieldType fieldType;
        //                     switch (selectedColumns[i].data_type)
        //                     {
        //                         case EnumPgDataType.Serial:
        //                         //case EnumPgDataType.SmallInt:
        //                         case EnumPgDataType.Integer:
        //                             fieldType = OGR.FieldType.OFTInteger;
        //                             break;
        //                         case EnumPgDataType.Double:
        //                             fieldType = OGR.FieldType.OFTReal;
        //                             break;
        //                         case EnumPgDataType.DateTime:
        //                         case EnumPgDataType.DateTimeTZ:
        //                             fieldType = OGR.FieldType.OFTDateTime;
        //                             break;
        //                         case EnumPgDataType.Date:
        //                             fieldType = OGR.FieldType.OFTDate;
        //                             break;
        //                         case EnumPgDataType.Time:
        //                             fieldType = OGR.FieldType.OFTTime;
        //                             break;
        //                         case EnumPgDataType.String:
        //                             fieldType = OGR.FieldType.OFTString;
        //                             break;
        //                         case EnumPgDataType.Boolean:
        //                             fieldType = OGR.FieldType.OFTBinary;
        //                             break;
        //                         default:
        //                             fieldType = OGR.FieldType.OFTString;
        //                             break;
        //                     }
        //                     OGR.FieldDefn fieldDefn = new OGR.FieldDefn(selectedColumns[i].column_name, fieldType);
        //                     fieldDefn.SetAlternativeName(selectedColumns[i].name_vn);
        //                     fieldDefn.SetWidth(selectedColumns[i].character_max_length);
        //                     featureDefn.AddFieldDefn(fieldDefn);
        //                     ogrLayer.CreateField(fieldDefn, 0);
        //                 }

        //                 GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        //                 var wktReader = new WKTReader(geometryFactory);

        //                 List<IFeature> features = new List<IFeature>();
        //                 foreach (var row in result)
        //                 {
        //                     var items = row as IDictionary<string, object>;
        //                     OGR.Feature feature = new OGR.Feature(featureDefn);
        //                     foreach (string key in items?.Keys)
        //                     {
        //                         string? name = key?.ToLower().Trim();
        //                         object value = items.FirstOrDefault(s => s.Key == key).Value;

        //                         var tableColumn = selectedColumns.FirstOrDefault(s => s.column_name == key);
        //                         if (tableColumn != null)
        //                         {
        //                             switch (tableColumn.data_type)
        //                             {
        //                                 case EnumPgDataType.Serial:
        //                                 //case EnumPgDataType.SmallInt:
        //                                 case EnumPgDataType.Integer:
        //                                     if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
        //                                     {
        //                                         feature.SetField(tableColumn.column_name, 0);
        //                                     }
        //                                     else
        //                                     {
        //                                         feature.SetField(tableColumn.column_name, int.Parse(value.ToString()));
        //                                     }
        //                                     break;
        //                                 case EnumPgDataType.DateTime:
        //                                 case EnumPgDataType.DateTimeTZ:
        //                                 case EnumPgDataType.Date:
        //                                 case EnumPgDataType.Time:
        //                                     DateTime dateValue;
        //                                     if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
        //                                     {
        //                                         dateValue = DateTime.MinValue;
        //                                     }
        //                                     else
        //                                     {
        //                                         if (DateTime.TryParseExact(value.ToString(), "dd/MM/yyyy", CultureInfo.CurrentCulture, DateTimeStyles.None, out dateValue))
        //                                         { }
        //                                         else
        //                                         {
        //                                             dateValue = DateTime.MinValue;
        //                                         }
        //                                     }
        //                                     feature.SetField(tableColumn.column_name, dateValue.Year, dateValue.Month, dateValue.Day, dateValue.Hour, dateValue.Minute, dateValue.Second, 0);
        //                                     break;
        //                                 default:
        //                                     if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
        //                                     {
        //                                         feature.SetField(tableColumn.column_name, "");
        //                                     }
        //                                     else
        //                                     {
        //                                         feature.SetField(tableColumn.column_name, value.ToString());
        //                                     }
        //                                     break;
        //                             }
        //                         }
        //                     }
        //                     if (items.ContainsKey("geom"))
        //                     {
        //                         if (!string.IsNullOrWhiteSpace(items.FirstOrDefault(s => s.Key == "geom").Value?.ToString()))
        //                         {
        //                             GeoJsonReader reader = new GeoJsonReader();
        //                             Geometry geometry = reader.Read<Geometry>(items.FirstOrDefault(s => s.Key == "geom").Value.ToString());

        //                             WKTWriter writer = new WKTWriter();
        //                             string wktJson = writer.Write(geometry);

        //                             OGR.Geometry gdalGeometry = OGR.Geometry.CreateFromWkt(wktJson);
        //                             feature.SetGeomField("geom", gdalGeometry);
        //                         }
        //                     }
        //                     ogrLayer.CreateFeature(feature);
        //                 }
        //             }
        //         }
        //         DirectoryInfo folderInfo = new DirectoryInfo(gdbFolderPath);
        //         DirectoryInfo[] directoryInfos = folderInfo.GetDirectories();
        //         FileInfo[] fileInfos = folderInfo.GetFiles();

        //         using (var ms = new MemoryStream())
        //         {
        //             System.IO.Compression.ZipFile.CreateFromDirectory(gdbFolderPath, gdbFolderZipPath);
        //             using (var fileStream = new FileStream(gdbFolderZipPath, FileMode.Open))
        //             {
        //                 fileStream.CopyTo(ms);
        //             }
        //             removeDirectory(tempFolderName);
        //             string fileName = string.Format("{0}.gdb.zip", StringHelper.RemoveVietNameseSign(layer.table.table_name).Replace(" ", "_"));
        //             return File(ms.ToArray(), "application/zip", fileName);
        //         }
        //     }
        // }

    }
}