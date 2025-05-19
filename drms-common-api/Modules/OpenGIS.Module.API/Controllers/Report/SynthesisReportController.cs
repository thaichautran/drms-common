using Dapper;
using Dapper.FastCrud;
using Humanizer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.DTO;
using OpenGIS.Module.Core.Models.Entities;
using SharpKml.Dom;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.DTO.Response;
using static Microsoft.Extensions.Logging.EventSource.LoggingEventSource;

namespace OpenGIS.Module.API.Controllers
{
    public partial class ReportController
    {
        [HttpPost("get-reports")]
        public RestBase listReport([FromBody] SearchReportListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                string condition = "1 = 1";
                List<SynthesisReport> data = new List<SynthesisReport>();
                if (dto == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lỗi tham số!" }
                        }
                    };
                if (dto.map_id.HasValue && dto.map_id.Value > 0)
                {
                    condition += @$" AND {Sql.Entity<SynthesisReport>(x => x.map_id):TC} = @map_id";
                }
                if (!string.IsNullOrWhiteSpace(dto.report_name))
                {
                    dto.report_name = dto.report_name.ToFullTextString();
                    condition += $@" AND {Sql.Entity<SynthesisReport>():T} @@ to_tsquery(@report_name)";
                }
                if (dto.layer_id.HasValue && dto.layer_id.Value > 0)
                {
                    condition += $@" AND {Sql.Entity<SynthesisReport>(x => x.layer_id):TC} = @layer_id";
                }
                if(dto.take > 0)
                {
                    data = session.Find<SynthesisReport>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .Include<ReportField>(x => x.LeftOuterJoin())
                        .Skip(dto.skip).Top(dto.take)
                    ).OrderBy(x => x.created_at).ToList();

                } else
                {
                    data = session.Find<SynthesisReport>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .Include<ReportField>(x => x.LeftOuterJoin())
                    ).OrderBy(x => x.created_at).ToList();
                }
                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = session.Count<SynthesisReport>(stm => stm.Where($"{condition}").WithParameters(dto))
                };
            }
        }

        [HttpGet("{id}")]
        public RestBase getReport([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                return new RestData
                {
                    data = session.Get(new SynthesisReport { id = id })
                };
            }
        }

        [HttpPost("save")]
        public async Task<RestBase> saveReportAsync([FromBody] SynthesisReport report)
        {
            using (var session = OpenSession())
            {
                using (var uow = OpenSession().UnitOfWork())
                {
                    if (report == null || !report.layer_id.HasValue || report.layer_id.Value == 0 || string.IsNullOrWhiteSpace(report.report_name))
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Lỗi tham số!" }
                            }
                        };
                    var layer = getLayerWithTableAndColumn(report.layer_id.Value);
                    if (layer == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        if (report.id > 0)
                        {
                            var existReport = uow.Connection.Get(new SynthesisReport { id = report.id });
                            if (layer != null && report != null)
                            {
                                report.report_name = report.report_name;
                                report.visible_columns = report.visible_columns;
                                report.filter_params = report.filter_params;
                                uow.Connection.Update(report);
                                return new RestBase(EnumErrorCode.OK);
                            }
                            else
                            {
                                return new RestError(EnumErrorCode.ERROR)
                                {
                                    errors = new RestErrorDetail[]
                                    {
                                        new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                                    }
                                };
                            }
                        }
                        else
                        {
                            report.created_at = DateTime.Now;
                            var user = _userManager.FindByIdAsync(getUserId()).Result;
                            if (user != null)
                            {
                                var userInfo = session.Find<UserInfo>(x => x
                                    .Where($"{nameof(UserInfo.user_id)} = @user_id")
                                    .WithParameters(new { user_id = user.Id })
                                ).FirstOrDefault();
                                if (userInfo != null)
                                {
                                    report.created_by = userInfo.full_name;
                                }
                                if (string.IsNullOrWhiteSpace(report.created_by))
                                {
                                    report.created_by = user.UserName;
                                }
                            }
                            uow.Connection.Insert(report);
                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
            }
        }

        [HttpPost("update-report")]
        public RestBase reportUpdate([FromBody] SearchReportDTO dto)
        {
            using (var uow = OpenSession().UnitOfWork())
            {
                if (dto == null
                    || !dto.report_id.HasValue || dto.report_id.Value == 0
                    || !dto.layer_id.HasValue || dto.layer_id.Value == 0
                    || string.IsNullOrWhiteSpace(dto.report_name))
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lỗi tham số!" }
                        }
                    };
                var layer = getLayerWithTableAndColumn(dto.layer_id.Value);
                var report = uow.Connection.Get(new SynthesisReport { id = dto.report_id.Value });
                if (layer != null && report != null)
                {
                    report.report_name = dto.report_name;
                    uow.Connection.Update(report);
                    uow.Connection.BulkDelete<ReportField>(x => x
                        .Where($"{nameof(ReportField.report_id)} = @id")
                        .WithParameters(report)
                    );
                    var fields = getReportField(layer, dto.param, report.id, dto.selectedFields.ToList());
                    foreach (var field in fields)
                    {
                        uow.Connection.Insert(field);
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                        }
                    };
                }
            }
        }

        [HttpPost("delete")]
        public RestBase reportDelete([FromBody] SynthesisReport report)
        {
            using (var session = OpenSession())
            {
                var exsistItem = session.Get(new SynthesisReport{ id = report.id });
                if (exsistItem != null)
                {
                    session.Delete(exsistItem);
                    return new RestBase(EnumErrorCode.OK);
                }
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                    }
                };
            }
        }

        [HttpGet("get-by-layer-id")]
        public async Task<JsonResult> getLayerAsync([FromQuery] int? map_id, [FromQuery] int? layer_id)
        {
            using (var session = OpenSession())
            {
                var ExprTreeView = new List<DevTreeView>();
                string condition = $@" 1 = 1 ";
                if (layer_id.HasValue && layer_id.Value > 0)
                {
                    if (map_id.HasValue && map_id.Value > 0)
                    {
                        condition += @$" AND {Sql.Entity<SynthesisReport>(x => x.map_id):TC} = @map_id";
                    }
                    var reports = session.Find<SynthesisReport>(stm => stm
                        .Where($"{condition} AND {Sql.Entity<SynthesisReport>(x => x.layer_id):TC} = @layer_id")
                        .WithParameters(new { map_id = map_id, layer_id = layer_id })
                    ).ToList();
                    reports.ForEach(x =>
                    {
                        ExprTreeView.Add(new DevTreeView
                        {
                            id = x.id,
                            text = x.report_name,
                            hasItems = false,
                            parentId = layer_id,
                            isExpanded = false
                        });
                    });
                }
                else
                {
                    List<int> layerIds = session.Find<MapLayers>(stm => stm
                            .Where($"{Sql.Entity<MapLayers>(x => x.map_id):TC} = @map_id")
                            .WithParameters(new { map_id = map_id })
                        ).Select(x => x.layer_id).ToList();
                    if (layerIds.Count() > 0)
                    {
                        condition = $"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layerIds)";
                    }

                    var layerHasReportIds = session.Query<int>($@"SELECT DISTINCT(layer_id) FROM {Sql.Entity<SynthesisReport>():T} 
                        WHERE {Sql.Entity<SynthesisReport>(x => x.layer_id):TC} =  ANY(@layerIds)", new { layerIds = layerIds.ToArray() }).ToList();

                    List<Layer> layers = session.Find<Layer>(stm => stm
                        .Where($@"{condition}")
                        .WithParameters(new { layerIds = layerHasReportIds.ToArray() })
                        .OrderBy(@$"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC}")
                    ).ToList();

                    layers.ForEach(x =>
                    {
                        ExprTreeView.Add(new DevTreeView
                        {
                            id = x.id,
                            text = x.name_vn,
                            hasItems = true,
                            parentId = 0,
                            isExpanded = true
                        });
                    });
                }

                return new JsonResult(ExprTreeView);
            }
        }

        [HttpGet("get-trees")]
        public async Task<RestBase> getReportTreeAsync([FromQuery] int? map_id)
        {
            using (var session = OpenSession())
            {
                List<IDictionary<string, object>> treeItems = new List<IDictionary<string, object>>();
                List<IDictionary<string, object>> layerChildren = new List<IDictionary<string, object>>();

                string condition = $@" 1 = 1 ";
                List<int> layerIds = session.Find<MapLayers>(stm => stm
                            .Where($"{Sql.Entity<MapLayers>(x => x.map_id):TC} = @map_id")
                            .WithParameters(new { map_id = map_id })
                        ).Select(x => x.layer_id).ToList();
                if (layerIds.Count() > 0)
                {
                    condition = $"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@layerIds)";
                }

                var layerHasReportIds = session.Query<int>($@"SELECT DISTINCT(layer_id) FROM {Sql.Entity<SynthesisReport>():T} 
                        WHERE {Sql.Entity<SynthesisReport>(x => x.layer_id):TC} =  ANY(@layerIds)", new { layerIds = layerIds.ToArray() }).ToList();

                List<Layer> layers = session.Find<Layer>(stm => stm
                    .Where($@"{condition}")
                    .WithParameters(new { layerIds = layerHasReportIds.ToArray() })
                    .OrderBy(@$"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC}")
                ).ToList();

                layers.ForEach(layer =>
                {
                   
                    List<IDictionary<string, object>> reportChilren = new List<IDictionary<string, object>>();
                    var reports = session.Find<SynthesisReport>(stm => stm
                       .Where($"{Sql.Entity<SynthesisReport>(x => x.map_id):TC} = @map_id AND {Sql.Entity<SynthesisReport>(x => x.layer_id):TC} = @layer_id")
                       .WithParameters(new { map_id = map_id, layer_id = layer.id })
                    ).ToList();
                    if (reports.Count() > 0)
                    {
                        reports.ForEach(report =>
                        {
                            IDictionary<string, object> reportChild = new Dictionary<string, object>
                            {
                                {"id", $"rp_{report.id}" },
                                {"text", report.report_name },
                                {"raw", report },
                                {"type", "@report" },
                            };
                            reportChilren.Add(reportChild);
                        });
                    }
                    if(reportChilren.Count() > 0)
                    {
                        layerChildren.Add(new Dictionary<string, object>
                        {
                            { "id", $"l_{layer.id}" },
                            { "text", $"{layer.name_vn}" },
                            { "raw", layer },
                            { "type", "@layer" },
                            { "items", reportChilren }
                        });
                    }
                });
                //treeItems.Add(new Dictionary<string, object>
                //{
                //    { "id", "root" },
                //    { "text", "Danh sách báo cáo" },
                //    { "type", "@group" },
                //    { "items", layerChildren },
                //    { "expanded" , true }
                //});
                return new RestData()
                {
                    data = layerChildren
                };
            }
        }

        private bool checkExistKeyAndValue(List<IDictionary<string, object>> dictionaries, string key, string value)
        {
            foreach (var dic in dictionaries)
            {
                if (dic.FirstOrDefault(s => s.Key == key).Value.ToString() == value)
                {
                    return true;
                }
            }
            return false;
        }
        private List<ReportField> getReportField(Layer layer, IDictionary<string, string> parameter, int report_id, List<TableColumn> selectedItems)
        {
            var columns = layer.table.columns;
            var listFields = new List<ReportField>();
            foreach (var col in layer.table.columns)
            {
                ReportField item = new ReportField();
                if (parameter.ContainsKey(col.column_name)
                        || parameter.ContainsKey(col.column_name + "_start")
                        || parameter.ContainsKey(col.column_name + "_dateStart"))
                {
                    item = new ReportField();
                    item.is_searchable = true;
                    item.column_id = col.id;
                    item.report_id = report_id;
                    if (col.lookup_table_id > 0 || col.column_name == "district_code" || col.column_name == "commune_code")
                    {
                        item.content_search = parameter.ToList().Find(x => x.Key == col.column_name).Value;
                    }
                    else if ((col.data_type == EnumPgDataType.SmallInt || col.data_type == EnumPgDataType.Integer || col.data_type == EnumPgDataType.Double))
                    {
                        item.content_search = $"{parameter.ToList().Find(x => x.Key == col.column_name + "_start").Value}_{parameter.ToList().Find(x => x.Key == col.column_name + "_end").Value}";
                    }
                    else if (col.data_type == EnumPgDataType.Boolean || col.data_type == EnumPgDataType.String || col.data_type == EnumPgDataType.Text)
                    {
                        item.content_search = parameter[col.column_name];
                    }
                    else if (col.data_type == EnumPgDataType.Date || col.data_type == EnumPgDataType.DateTime)
                    {
                        var dateStart = DateTime.Parse(parameter.ToList().Find(x => x.Key == col.column_name + "_dateStart").Value);
                        var dateEnd = DateTime.Parse(parameter.ToList().Find(x => x.Key == col.column_name + "_dateEnd").Value);
                        if (col.data_type == EnumPgDataType.DateTime)
                            item.content_search = $"{dateStart.ToString("yyyy MM dd HH:mm:ss")}_{dateEnd.ToString("yyyy mm dd HH:mm:ss")}";
                        else if (col.data_type == EnumPgDataType.Date)
                            item.content_search = $"{dateStart.ToString("yyyy MM dd")}_{dateEnd.ToString("yyyy MM dd")}";
                    }
                }
                if (selectedItems.Select(x => x.column_name).Contains(col.column_name))
                {
                    item = item == null ? new ReportField() : item;
                    item.is_showable = true;
                    item.column_id = col.id;
                    item.report_id = report_id;
                }
                if (item != null)
                    listFields.Add(item);
            }
            foreach (var relation in getRelations(layer.table))
            {
                if (parameter.ContainsKey(relation.mediate_table.table_name) && parameter[relation.mediate_table.table_name] != null)
                {
                    ReportField item = new ReportField();
                    item.is_showable = false;
                    item.is_searchable = true;
                    item.content_search = parameter[relation.mediate_table.table_name];
                    item.column_id = relation.relation_column.id;
                    item.report_id = report_id;
                    item.table_mediate_name = relation.mediate_table.table_name;
                    listFields.Add(item);
                }
            }
            return listFields;
        }
    }
}
