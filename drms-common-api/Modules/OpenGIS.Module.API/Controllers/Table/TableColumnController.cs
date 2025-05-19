using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Models.DTO.Request;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Controllers
{
    public partial class TableController
    {
        [HttpGet("columns")]
        public RestBase allColumns()
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<TableColumn>()
                };
            }
        }

        [HttpGet("columns/sync")]
        public async Task<RestBase> syncColumnAsync([FromQuery] string tableSchema = "")
        {
            if (string.IsNullOrWhiteSpace(tableSchema))
            {
                return new RestError(400, "Vui lòng chọn schema muốn đồng bộ!");
            }
            using var session = OpenSession();
            var tables = getTablesAndColumns(tableSchema);
            if (tables == null || tables.Count() == 0)
            {
                return new RestError(-1, "Bảng không tồn tại!");
            }
            //
            foreach (var table in tables)
            {
                await _tableColumnRepository.AddRegionColumnAsync(table, false);
                await _tableColumnRepository.AddSearchContentAsync(table);
                await _tableColumnRepository.AddTimeColumnAsync(table);
                await _tableColumnRepository.SyncColumnsAsync(table);
            }
            //
            return new RestData
            {
                data = true
            };
        }

        [HttpGet("{id}/columns")]
        public RestBase tableColumns([FromRoute] int id, [FromQuery] bool? isGroup = false)
        {
            if (id == 0)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            using (var session = OpenSession())
            {
                var table = getTableAndColumns(id, isGroup, true);
                if (table == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                return new RestData()
                {
                    data = table.columns.OrderBy(s => s.order)
                };
            }
        }

        [HttpGet("column/{id}")]
        public RestBase columnInfo([FromRoute] int id)
        {
            if (id == 0)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Get(new TableColumn { id = id })
                };
            }
        }

        // [HttpGet("columns/sync")]
        // public async Task<RestBase> syncColumnAsync([FromQuery] string? tableSchema)
        // {
        //     using var session = OpenSession();
        //     //
        //     var tables = getTablesAndColumns(tableSchema);

        //     foreach (var table in tables)
        //     {
        //         await _tableColumnRepository.AddRegionColumnAsync(table, false);
        //         await _tableColumnRepository.AddSearchContentAsync(table);
        //         await _tableColumnRepository.AddTimeColumnAsync(table);
        //         await _tableColumnRepository.AddApproveColumnAsync(table);
        //         await _tableColumnRepository.SyncColumnsAsync(table);
        //     }
        //     //
        //     return new RestData
        //     {
        //         data = true
        //     };
        // }

        [HttpGet("{id}/columns/sync")]
        public async Task<RestBase> syncColumnAsync([FromRoute] int id)
        {
            using var session = OpenSession();
            var table = getTable(id);
            if (table == null)
            {
                return new RestError(-1, "Bảng không tồn tại!");
            }
            //
            await _tableColumnRepository.AddRegionColumnAsync(table, false);
            await _tableColumnRepository.AddSearchContentAsync(table);
            await _tableColumnRepository.AddTimeColumnAsync(table);
            await _tableColumnRepository.AddApproveColumnAsync(table);
            await _tableColumnRepository.SyncColumnsAsync(table);
            //
            return new RestData
            {
                data = true
            };
        }

        [HttpPost("{id}/columns/add")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_TABLE_COLUMN))]
        public RestBase addColumn([FromRoute] int id, [FromBody] AddColumnRequest dto)
        {
            if (dto == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            using (var session = OpenSession())
            {
                var table = getTableAndColumns(id);
                if (table == null)
                {
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                                new RestErrorDetail() { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                if (table.columns.Where(s => s.column_name == dto.column_name).Count() > 0)
                {
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                                new RestErrorDetail()
                                {
                                    message = "Trường dữ liệu đã tồn tại, vui lòng kiểm tra lại!"
                                }
                        }
                    };
                }
                string sql = $"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" ADD COLUMN \"{dto.column_name}\" ";

                string data_type = "";
                switch (dto.data_type)
                {
                    case EnumPgDataType.Serial:
                        data_type = EnumPgDataType.Serial;
                        break;
                    case EnumPgDataType.BigInt:
                        data_type = EnumPgDataType.BigInt;
                        break;
                    case EnumPgDataType.SmallInt:
                        data_type = EnumPgDataType.SmallInt;
                        break;
                    case EnumPgDataType.Boolean:
                        data_type = EnumPgDataType.Boolean;
                        break;
                    case EnumPgDataType.Date:
                        data_type = EnumPgDataType.Date;
                        break;
                    case EnumPgDataType.Double:
                        data_type = EnumPgDataType.Double;
                        break;
                    case EnumPgDataType.Integer:
                        data_type = EnumPgDataType.Integer;
                        break;
                    case EnumPgDataType.String:
                        data_type = EnumPgDataType.String;
                        break;
                    case EnumPgDataType.Text:
                        data_type = EnumPgDataType.Text;
                        break;
                    case EnumPgDataType.Time:
                        data_type = EnumPgDataType.Time;
                        break;
                    case EnumPgDataType.DateTime:
                    case EnumPgDataType.DateTimeTZ:
                        data_type = EnumPgDataType.DateTime;
                        break;
                    default:
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Kiểu dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                }

                if (string.IsNullOrWhiteSpace(data_type) == false)
                    sql += $"{data_type}";
                else
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Kiểu dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                if (data_type.Equals(EnumPgDataType.String))
                {
                    // Nếu không chọn độ dài chuỗi mặc định là 255
                    if (!dto.character_max_length.HasValue || dto.character_max_length.Value == 0)
                    {
                        dto.character_max_length = 255;
                    }

                    sql += $" ({dto.character_max_length})";
                }

                if (dto.is_nullable == false)
                    sql += $" NOT NULL";
                if (dto.default_value != null)
                {
                    switch (data_type)
                    {
                        case EnumPgDataType.Date:
                        case EnumPgDataType.DateTime:
                        case EnumPgDataType.DateTimeTZ:
                        case EnumPgDataType.Time:
                        case EnumPgDataType.String:
                        case EnumPgDataType.Text:
                            sql += $" DEFAULT '{dto.default_value}'";
                            break;
                        default:
                            sql += $" DEFAULT {dto.default_value}";
                            break;
                    }
                }
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    uow.Connection.Execute(sql);
                    var tableColumn = new TableColumn
                    {
                        has_category = dto.has_category.HasValue ? dto.has_category.Value : false,
                        name_en = dto.name_vn,
                        name_vn = dto.name_vn,
                        column_name = dto.column_name,
                        data_type = data_type,
                        character_max_length = dto.character_max_length.HasValue ? dto.character_max_length.Value : 0,
                        is_identity = dto.is_identity.HasValue ? dto.is_identity.Value : false,
                        is_nullable = dto.is_nullable.HasValue ? dto.is_nullable.Value : false,
                        is_searchable = dto.is_searchable.HasValue ? dto.is_searchable.Value : false,
                        is_label = dto.is_label.HasValue ? dto.is_label.Value : false,
                        permanent = false,
                        require = dto.require.HasValue ? dto.require.Value : false,
                        table_id = table.id,
                        order = dto.order.HasValue ? dto.order.Value : 0,
                        visible = dto.visible.HasValue ? dto.visible.Value : false,
                        formula = dto.formula,
                    };
                    //if (data_type.Equals(EnumPgDataType.Serial))
                    //{
                    //    uow.Connection.Execute($"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" ADD PRIMARY KEY ({dto.column_name})");
                    //}
                    uow.Connection.Insert(tableColumn);
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }

        [HttpPost("{id}/columns/update")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_TABLE_COLUMN))]
        public RestBase updateColunmn([FromRoute] int id, [FromBody] TableColumn column)
        {
            if (column == null)
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số" }
                    }
                };
            var table = getTable(id);
            if (table == null)
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                    }
                };
            using (var session = OpenSession())
            {
                var existed = session.Find<TableColumn>(statement => statement
                    .Where($"{nameof(TableColumn.id):C} = @column_id AND {nameof(TableColumn.table_id):C} = @table_id")
                    .WithParameters(new { column_id = column.id, table_id = id })
                ).FirstOrDefault();
                if (existed == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Trường thông tin không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        if (existed.data_type != column.data_type)
                        {
                            string sql = $"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" ALTER COLUMN \"{column.column_name}\" ";

                            string data_type = "";
                            switch (column.data_type)
                            {
                                case EnumPgDataType.BigInt:
                                    data_type = EnumPgDataType.BigInt;
                                    break;
                                case EnumPgDataType.SmallInt:
                                    data_type = EnumPgDataType.SmallInt;
                                    break;
                                case EnumPgDataType.Boolean:
                                    data_type = EnumPgDataType.Boolean;
                                    break;
                                case EnumPgDataType.Date:
                                    data_type = EnumPgDataType.Date;
                                    break;
                                case EnumPgDataType.Double:
                                    data_type = EnumPgDataType.Double;
                                    break;
                                case EnumPgDataType.Integer:
                                    data_type = EnumPgDataType.Integer;
                                    break;
                                case EnumPgDataType.String:
                                    data_type = EnumPgDataType.String;
                                    break;
                                case EnumPgDataType.Text:
                                    data_type = EnumPgDataType.Text;
                                    break;
                                case EnumPgDataType.Time:
                                    data_type = EnumPgDataType.Time;
                                    break;
                                case EnumPgDataType.DateTime:
                                case EnumPgDataType.DateTimeTZ:
                                    data_type = EnumPgDataType.DateTime;
                                    break;
                                default:
                                    return new RestError(EnumErrorCode.ERROR)
                                    {
                                        errors = new RestErrorDetail[]
                                        {
                                        new RestErrorDetail { message = "Kiểu dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                                        }
                                    };
                            }
                            var sql_type = ""; var sql_is_null = "";
                            if (!string.IsNullOrWhiteSpace(data_type))
                            {
                                sql_type += $" TYPE {data_type}  USING {column.column_name}::{data_type} ";
                            }
                            else
                            {
                                return new RestError(EnumErrorCode.ERROR)
                                {
                                    errors = new RestErrorDetail[]
                                    {
                                    new RestErrorDetail { message = "Kiểu dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                                    }
                                };
                            }
                            if (data_type.Equals(EnumPgDataType.String))
                            {
                                if (column.character_max_length == 0)
                                    return new RestError(EnumErrorCode.ERROR)
                                    {
                                        errors = new RestErrorDetail[]
                                        {
                                        new RestErrorDetail { message = "Độ dài của kiểu chuỗi không được để trống, vui lòng kiểm tra lại!" }
                                        }
                                    };
                                sql_type += $"({column.character_max_length})";
                            }

                            if (column.is_nullable == false)
                            {
                                sql_is_null += $" SET NOT NULL";
                            }
                            else
                            {
                                sql_is_null += $" DROP NOT NULL";
                            }
                            uow.Connection.Execute(sql + sql_type);
                            uow.Connection.Execute(sql + sql_is_null);
                        }

                        existed.order = column.order;
                        existed.name_en = column.name_vn;
                        existed.name_vn = column.name_vn;
                        existed.is_nullable = column.is_nullable;
                        existed.is_searchable = column.is_searchable;
                        existed.is_label = column.is_label;
                        existed.visible = column.visible;
                        existed.@readonly = column.@readonly;
                        existed.is_identity = column.is_identity;
                        existed.is_key = column.is_key;
                        existed.data_type = column.data_type;
                        existed.character_max_length = column.character_max_length;
                        existed.lookup_table_id = column.lookup_table_id;
                        existed.require = column.require;
                        existed.has_category = column.has_category;
                        existed.formula = column.formula;
                        existed.unit = column.unit;
                        existed.summary_count = column.summary_count;
                        existed.summary_percent = column.summary_percent;
                        existed.summary_total = column.summary_total;
                        existed.data_in_radius_of_layer = column.data_in_radius_of_layer;

                        uow.Connection.Update(existed);
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpGet("columns/{id}/distinct-values")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_TABLE_COLUMN))]
        public RestBase distinctValues([FromRoute] int id, [FromQuery] string? q = "", [FromQuery] int? page = 1, [FromQuery] int? pageSize = 25)
        {
            using var session = OpenSession();
            var column = session.Get(new TableColumn { id = id });
            if (column == null)
            {
                return new RestError(404, "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!");
            }
            var table = session.Get(new TableInfo { id = column.table_id });
            if (table == null)
            {
                return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
            }
            else
            {
                List<string> where = new List<string> { "1=1" };
                // if (page < 1)
                // {
                //     page = 1;
                // }
                // if (pageSize < 1)
                // {
                //     pageSize = 25;
                // }
                if (string.IsNullOrWhiteSpace(q) == false)
                {
                    where.Add($"search_content @@ to_tsquery('{q.ToFullTextStringProximity()}')");
                }
                if (!User.IsInRole(EnumRoles.SA))
                {
                    var userRegions = session.Find<UserRegion>(statement => statement
                       .Where($"{nameof(UserRegion.user_id)} = @id")
                       .WithParameters(new { id = getUserId() })
                    ).ToList();
                    // if (userRegions != null && userRegions.Count() > 0)
                    // {
                    //     where.Add(@$"(district_code IN ({string.Join(",", userRegions.Select(x => $"'{x.district_code}'"))}) OR district_code IS NULL OR district_code = '')");
                    // }
                    if (table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                    {
                        where.Add(@$"(district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(x => $"'{x.area_code}'"))}) OR district_code IS NULL OR district_code = '')");
                    }
                    if (table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                    {
                        where.Add(@$"(commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(x => $"'{x.area_code}'"))}) OR commune_code IS NULL OR commune_code = '')");
                    }
                }
                if (column.lookup_table_id > 0)
                {
                    var lookupTable = getTableAndColumns(column.lookup_table_id);
                    if (lookupTable == null)
                        return new RestError(404, "Bảng dữ liệu danh mục không tồn tại, vui lòng kiểm tra lại!");
                    else
                    {
                        var suggestionColumn = lookupTable.columns.Where(x => x.id == column.suggestion_column_id).FirstOrDefault();
                        if (suggestionColumn == null)
                            return new RestError(404, "Trường dữ liệu danh mục không tồn tại, vui lòng kiểm tra lại!");
                        StringBuilder builder = new StringBuilder();
                        builder.Append(@$"SELECT DISTINCT {suggestionColumn.column_name}::TEXT FROM {lookupTable.table_schema}.{lookupTable.table_name}");
                        builder.Append(@$" WHERE {string.Join(" AND ", where)}");
                        builder.Append(@$" ORDER BY 1");
                        if (page >= 1 && pageSize >= 1)
                        {
                            builder.Append(@$" OFFSET {--page * pageSize} LIMIT {pageSize};");
                        }

                        return new RestPagedDataTable
                        {
                            data = session.Query<string>(builder.ToString()),
                            recordsTotal = session.Query<int>(@$"SELECT COUNT(DISTINCT {column.column_name}) FROM {table.table_schema}.{table.table_name} WHERE {string.Join(" AND ", where)};").FirstOrDefault(),
                        };
                    }
                }
                else
                {
                    StringBuilder builder = new StringBuilder();
                    builder.Append(@$"SELECT DISTINCT {column.column_name}::TEXT FROM {table.table_schema}.{table.table_name}");
                    builder.Append(@$" WHERE {string.Join(" AND ", where)} AND {column.column_name} IS NOT NULL");
                    builder.Append(@$" ORDER BY 1");
                    if (page >= 1 && pageSize >= 1)
                    {
                        builder.Append(@$" OFFSET {--page * pageSize} LIMIT {pageSize};");
                    }
                    return new RestPagedDataTable
                    {
                        data = session.Query<string>(builder.ToString()),
                        recordsTotal = session.Query<int>(@$"SELECT COUNT(DISTINCT {column.column_name}) FROM {table.table_schema}.{table.table_name} WHERE {string.Join(" AND ", where)};").FirstOrDefault(),
                    };
                }

            }
        }
        [HttpPost("columns/data-by-name")]
        public RestBase DataColumnByName([FromBody] ColumnDataViewModel? model)
        {
            using var session = OpenSession();
            if (model == null)
            {
                return new RestError(404, "Lỗi tham số, vui lòng kiểm tra lại!");
            }
            var column = session.Find<TableColumn>(x => x
            .Include<TableInfo>()
            .Where($"{Sql.Entity<TableColumn>(x => x.column_name):TC} = @column_name AND {Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name")
            .WithParameters(model)).FirstOrDefault();
            if (column == null)
            {
                return new RestError(404, "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!");
            }
            else
            {
                List<string> where = new List<string> { "1=1" };
                var table = getTableAndColumns(column.table_id);
                // if (page < 1)
                // {
                //     page = 1;
                // }
                // if (pageSize < 1)
                // {
                //     pageSize = 25;
                // }
                if (string.IsNullOrWhiteSpace(model?.q) == false)
                {
                    where.Add($"search_content @@ to_tsquery('{model?.q.ToFullTextStringProximity()}')");
                }
                if (!User.IsInRole(EnumRoles.SA))
                {
                    var userRegions = session.Find<UserRegion>(statement => statement
                       .Where($"{nameof(UserRegion.user_id)} = @id")
                       .WithParameters(new { id = getUserId() })
                    ).ToList();
                    // if (userRegions != null && userRegions.Count() > 0)
                    // {
                    //     where.Add(@$"(district_code IN ({string.Join(",", userRegions.Select(x => $"'{x.district_code}'"))}) OR district_code IS NULL OR district_code = '')");
                    // }
                    if (table.columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                    {
                        where.Add(@$"(district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(x => $"'{x.area_code}'"))}) OR district_code IS NULL OR district_code = '')");
                    }
                    if (table.columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                    {
                        where.Add(@$"(commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(x => $"'{x.area_code}'"))}) OR commune_code IS NULL OR commune_code = '')");
                    }
                }
                StringBuilder builder = new StringBuilder();
                builder.Append(@$"SELECT DISTINCT {column.column_name}::TEXT FROM {column.table.table_schema}.{column.table.table_name}");
                builder.Append(@$" WHERE {string.Join(" AND ", where)} AND {column.column_name} IS NOT NULL");
                builder.Append(@$" ORDER BY 1");
                if (model?.page >= 1 && model?.page_size >= 1)
                {
                    builder.Append(@$" OFFSET {--model.page * model.page_size} LIMIT {model.page_size};");
                }
                return new RestPagedDataTable
                {
                    data = session.Query<string>(builder.ToString()),
                    recordsTotal = session.Query<int>(@$"SELECT COUNT(DISTINCT {column.column_name}) FROM {column.table.table_schema}.{column.table.table_name} WHERE {string.Join(" AND ", where)};").FirstOrDefault(),
                };
            }
        }

        [HttpPost("{id}/columns/delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_TABLE_COLUMN))]
        public RestBase deleteColumn([FromRoute] int id, [FromForm] TableColumn column)
        {
            var table = getTable(id);
            if (table == null)
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                    }
                };
            using (var session = OpenSession())
            {
                var existed = session.Find<TableColumn>(statement => statement
                        .Where($"{nameof(TableColumn.id):C} = @column_id AND {nameof(TableColumn.table_id):C} = @table_id")
                        .WithParameters(new { column_id = column.id, table_id = id })).FirstOrDefault();
                if (existed == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Trường thông tin không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    if (existed.permanent)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Trường thông tin không được phép xóa!" }
                            }
                        };
                    }
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        uow.Connection.Delete(existed);
                        string sql = $"ALTER TABLE \"{table.table_schema}\".\"{table.table_name}\" DROP COLUMN \"{existed.column_name}\" CASCADE;";
                        uow.Connection.Execute(sql);
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("{id}/columns/moveDown")]
        public RestBase moveDown([FromRoute] int id, [FromBody] TableColumn column)
        {
            using (var session = OpenSession())
            {
                var table = getTableAndColumns(id);
                if (table == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                                new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                var existColumn = table.columns.FirstOrDefault(x => x.id == column.id);
                if (existColumn == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                                new RestErrorDetail { message = "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!"}
                        }
                    };
                var columnIndex = table.columns.ToList().IndexOf(existColumn);
                if (columnIndex < table.columns.Count() - 1)
                {
                    var nextColumn = table.columns.ElementAt(columnIndex + 1);
                    int tempIndex = 0;
                    if (existColumn != null)
                    {
                        tempIndex = existColumn.order;
                        if (existColumn.order == nextColumn.order)
                        {
                            existColumn.order += 1;
                        }
                        else
                        {
                            existColumn.order = nextColumn.order;
                            nextColumn.order = tempIndex;
                        }
                    }
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        uow.Connection.Update(existColumn);
                        uow.Connection.Update(nextColumn);
                    }
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }

        [HttpPost("{id}/columns/moveUp")]
        public RestBase moveUp([FromRoute] int id, [FromBody] TableColumn column)
        {
            using (var session = OpenSession())
            {
                var table = getTableAndColumns(id);
                if (table == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                var existColumn = table.columns.FirstOrDefault(x => x.id == column.id);
                if (existColumn == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!"}
                        }
                    };
                var columnIndex = table.columns.ToList().IndexOf(existColumn);
                if (columnIndex > 0)
                {
                    var prevColumn = table.columns.ElementAt(columnIndex - 1);
                    int tempIndex = 0;
                    if (existColumn != null)
                    {
                        tempIndex = column.order;
                        existColumn.order = prevColumn.order;
                        prevColumn.order = tempIndex;
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            uow.Connection.Update(existColumn);
                            uow.Connection.Update(prevColumn);
                        }
                    }
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }
    }
}