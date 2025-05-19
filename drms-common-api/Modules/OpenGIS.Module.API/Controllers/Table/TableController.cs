using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models.DevExtreme;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Extensions;
using OpenGIS.Module.Core.Models.DTO;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Repositories.Implements;
using OpenGIS.Module.Core.Repositories;
using System.Net;
using Humanizer;
using VietGIS.Infrastructure.Models.Database.Map;
using OpenGIS.Module.Core.ViewModels;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models;
using System.Text;
using VietGIS.Infrastructure.Web;
using Microsoft.AspNetCore.Hosting;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/table")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_TABLE))]
    public partial class TableController : BaseController
    {
        private readonly ITableRepository _tableRepository;
        private readonly ITableColumnRepository _tableColumnRepository;
        private readonly IMapLayersRepository _mapLayersRepository;
        private readonly IRazorViewRenderer _viewRenderer;
        private readonly IWebHostEnvironment _webHostEnvironment;
        public TableController(
            IDbFactory dbFactory,
            ITableRepository tableRepository,
            ITableColumnRepository tableColumnRepository,
            IMapLayersRepository mapLayersRepository,
            IRazorViewRenderer viewRenderer,
            IWebHostEnvironment webHostEnvironment) : base(dbFactory)
        {
            _tableRepository = tableRepository;
            _tableColumnRepository = tableColumnRepository;
            _mapLayersRepository = mapLayersRepository;
            _viewRenderer = viewRenderer;
            _webHostEnvironment = webHostEnvironment;
        }

        [HttpGet("listSchema")]
        public RestBase listSchema()
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Query<string>($"SELECT DISTINCT {nameof(TableInfo.table_schema)} FROM {Sql.Entity<TableInfo>():T}")
                };
            }
        }
        [HttpGet("category/tree")]
        public RestBase CategoryTableTree()
        {
            using (var session = OpenSession())
            {
                var tables = session.Find<TableInfo>(x => x
                .Include<TableGroup>(x => x.InnerJoin())
                .Include<TableColumn>(x => x.LeftOuterJoin())
                .Where($"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema")
                .WithParameters(new { schema = "category" }))
                .GroupBy(x => x.table_group_id)
                .Select(x =>
                {
                    var group = x.FirstOrDefault()?.table_group;
                    return new
                    {
                        id = $"g_{x.Key}",
                        text = group?.name_vn,
                        expanded = true,
                        type = "@schema",
                        items = x.Select(o => new
                        {
                            id = $"t_{o.id}",
                            text = o.name_vn,
                            raw = o,
                            type = "@table"
                        })
                    };
                });

                return new RestData { data = tables };
            }
        }
        [HttpGet("listTableWithoutGeometry")]
        public RestBase listTableWithoutGeometry([FromQuery] string schema = "")
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = getTablesAndColumns(schema).Where(x => x.columns.Any(o => o.column_name == "geom") == false).OrderBy(x => x.name_vn)
                };
            }
        }

        [HttpGet("getTables")]
        public RestBase getTables([FromQuery] string? schema = "", int? mapId = 0, string? keyword = "", bool? hasLayer = false)
        {
            var data = getTablesAndColumns(schema, mapId, keyword, hasLayer).ToList();
            List<UserTable> userLayers = new List<UserTable>();
            if (User.IsInRole(EnumRoles.SA) == false)
            {
                using var session = OpenSession();
                userLayers = session.Find<UserTable>(statement => statement.Where($"{nameof(UserTable.user_id)}=@userId").WithParameters(new { userId = getUserId() })).ToList();
                data = data.Where(x => userLayers.Any(o => o.table_id == x.id)).ToList();
            }
            return new RestData()
            {
                data = data
            };
        }

        [HttpGet("{id}")]
        public RestBase get([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = getTableAndColumns(id)
                };
            }
        }

        [HttpPost("move")]
        public RestBase moveTable([FromBody] MoveTableDTO dto)
        {
            if (dto == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!"}
                    }
                };
            }
            using (var session = OpenSession())
            {
                TableInfo table = _tableRepository.GetKey(dto.table_id, session);
                if (table == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!"}
                        }
                    };
                }
                if (table.table_schema != dto.table_schema)
                {
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        uow.Connection.Execute($"ALTER TABLE {table.table_schema}.{table.table_name} SET SCHEMA {dto.table_schema};");
                        table.table_schema = dto.table_schema;
                        uow.Connection.Update(table);
                    }
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }

        [HttpPost("drop")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_TABLE))]
        public RestBase dropTable([FromForm] DropTableDTO dto)
        {
            if (dto == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!"}
                    }
                };
            }
            using (var session = OpenSession())
            {
                TableInfo table = _tableRepository.GetKey(dto.table_id, session);
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
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    uow.Connection.Execute($"DROP TABLE IF EXISTS {table.table_schema}.{table.table_name};");
                    uow.Connection.Delete(table);
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }

        [HttpPost("{id}/records")]
        public RestBase GetRecords([FromRoute] int id, [FromBody] SearchByLogicDTO dto)
        {
            using (var session = OpenSession())
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
                else
                {

                    TableInfo? table = getTableAndColumns(id);
                    if (table == null)
                    {
                        return new RestError(404, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    string conditions = string.Empty;

                    // var domains = domainValueForLookup(table);
                    // IEnumerable<TableRelation> relations = getRelations(table);

                    string select = string.Empty;
                    select = @$"SELECT {String.Join(',', table.columns.Where(x => "geom".Equals(x.column_name) == false && "search_content".Equals(x.column_name) == false).Select(x => @$"{table.table_schema}.{table.table_name}.{x.column_name}"))} ";
                    //
                    string tables = @$" FROM {table.table_schema}.{table.table_name} ";

                    conditions = getConditions(table, dto.@params);

                    string wheres = $" WHERE {conditions}";

                    string orderby = string.Empty;

                    TableColumn? orderColumn = table.label_column ?? table.key_column ?? table.identity_column;
                    if (!string.IsNullOrWhiteSpace(dto.orderby))
                    {
                        orderby = @$" ORDER BY " + dto.orderby;
                    }
                    else if (orderColumn != null)
                    {
                        orderby = @$" ORDER BY " + orderColumn.column_name;
                    }
                    string sql = select + tables + wheres + orderby + $" LIMIT {dto.take} OFFSET {dto.skip}";
                    var result = session.Query(sql).ToList();

                    var records = result.Select(x => (IDictionary<string, object>)x).ToList();

                    int totalCount = session.Query<int>(@$"SELECT COUNT(1) FROM {table.table_schema}.{table.table_name} {wheres}").FirstOrDefault();

                    var response = new RestData()
                    {
                        data = new
                        {
                            dataSearch = new DevExprGridData
                            {
                                data = records,
                                totalCount = totalCount,
                            },
                        }
                    };

                    return response;
                }
            }
        }
        [HttpGet("count-data/{id}")]
        public RestBase count([FromRoute] int id)
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
                return new RestData()
                {
                    data = session.QueryFirstOrDefault<int>($"SELECT COUNT(1) FROM {table.table_schema}.{table.table_name}")
                };
            }
        }

        [HttpPost("short-data")]
        public RestBase shortData([FromBody] ShortDataListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                if (dto == null ||
                    ((!dto.table_id.HasValue || dto.table_id.Value == 0)
                    && string.IsNullOrWhiteSpace(dto.table_name) && string.IsNullOrWhiteSpace(dto.table_schema)))
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lỗi tham số!" }
                        }
                    };
                }
                if (dto.table_id.HasValue && dto.table_id.Value > 0)
                {
                    return new RestPagedDataTable()
                    {
                        data = getTableShortData(dto.table_id.Value, dto.q, dto.district_codes, dto.skip, dto.take),
                        recordsTotal = CountTableShortData(dto.table_id.Value, dto.q, dto.district_codes)
                    };
                }
                else
                {
                    var table = session.Find<TableInfo>(stm => stm
                        .Where($"{Sql.Entity<TableInfo>(x => x.table_name):TC} = @table_name AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = @table_schema")
                        .WithParameters(dto)
                    ).FirstOrDefault();
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
                    return new RestPagedDataTable()
                    {
                        data = getTableShortData(table.id, dto.q, dto.district_codes),
                        recordsTotal = CountTableShortData(table.id, dto.q, dto.district_codes)
                    };
                }
            }
        }

        [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "id", "oid" })]
        [HttpGet("short-data/{id}/{oid}")]
        public RestBase shortDataRecord([FromRoute] int id, [FromRoute] string oid)
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
                else
                {
                    var keyColumn = table.key_column ?? table.identity_column;
                    var labelColumn = table.label_column ?? keyColumn;
                    if (keyColumn != null && labelColumn != null)
                    {
                        object withParams = new { };

                        switch (keyColumn.data_type)
                        {
                            case EnumPgDataType.Integer:
                                if (int.TryParse(oid.ToString(), out int value))
                                {
                                    withParams = new { oid = value };
                                }
                                else
                                {
                                    withParams = new { oid = 0 };
                                }
                                break;
                            case EnumPgDataType.Double:
                                if (double.TryParse(oid.ToString(), out double doubleValue))
                                {
                                    withParams = new { oid = doubleValue };
                                }
                                else
                                {
                                    withParams = new { oid = 0 };
                                }
                                break;
                            case EnumPgDataType.String:
                            default:
                                withParams = new { oid = oid.ToString() };
                                break;
                        }

                        return new RestData()
                        {
                            data = session.Query<DomainViewModel>(@$"SELECT {keyColumn.column_name} AS {nameof(DomainViewModel.id)}, {labelColumn.column_name} AS {nameof(DomainViewModel.mo_ta)} FROM {table.table_schema}.{table.table_name} WHERE {keyColumn.column_name} = @oid", withParams).FirstOrDefault()
                        };
                    }
                    return new RestData<DomainViewModel>()
                    {
                        data = new DomainViewModel()
                    };
                }
            }
        }

        [HttpGet("list")]
        public RestBase list([FromQuery] string? schema = "", string? keyword = "")
        {
            using (var session = OpenSession())
            {
                var condition = "1=1 ";
                if (!string.IsNullOrWhiteSpace(schema))
                {
                    condition += $"AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema";
                }
                if (!string.IsNullOrWhiteSpace(keyword))
                {
                    condition += $"AND {Sql.Entity<TableInfo>():T}.search_content @@ to_tsquery(@keyword)";
                }
                return new RestData()
                {
                    data = session.Find<TableInfo>(statement => statement
                        .Where($"{condition}")
                        .Include<TableSchema>(x => x.LeftOuterJoin())
                        .WithParameters(new { schema = schema, keyword = keyword?.ToFullTextString() })
                        .OrderBy($"{Sql.Entity<TableInfo>(x => x.table_schema):TC}, {Sql.Entity<TableInfo>(x => x.order):TC}")
                    )
                };
            }
        }

        [HttpPost("list")]
        public RestBase ListAsync([FromBody] TableListDxDTO dto)
        {
            if (dto == null)
            {
                return new RestError((int)HttpStatusCode.BadRequest, "Vui lòng kiểm tra lại tham số");
            }
            using var session = OpenSession();
            var condition = "1=1 ";
            if (dto.tableSchema.Count > 0)
            {
                condition += $"AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = ANY(@schema)";
            }
            if (string.IsNullOrWhiteSpace(dto.searchValue) == false)
            {
                condition += $"AND {Sql.Entity<TableInfo>():T}.search_content @@ to_tsquery(@keyword)";
            }
            List<TableInfo> data = new List<TableInfo>();
            if (dto.take > 0)
            {
                data = session.Find<TableInfo>(statement => statement.Where($"{condition}")
                    .WithParameters(new { schema = dto.tableSchema, keyword = dto.searchValue?.ToFullTextString() })
                    .Include<TableSchema>(x => x.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<TableInfo>(x => x.order):TC}, {Sql.Entity<TableInfo>(x => x.name_vn):TC}")
                    .Skip(dto.skip)
                    .Top(dto.take)
                ).ToList();
            }
            else
            {
                data = session.Find<TableInfo>(statement => statement.Where($"{condition}")
                    .WithParameters(new { schema = dto.tableSchema, keyword = dto.searchValue?.ToFullTextString() })
                    .Include<TableSchema>(x => x.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<TableInfo>(x => x.order):TC}, {Sql.Entity<TableInfo>(x => x.name_vn):TC}")
                ).ToList();
            }
            return new RestPagedDataTable()
            {
                data = data,
                recordsTotal = session.Count<TableInfo>(statement => statement
                    .Where($"{condition}")
                    .WithParameters(new { schema = dto.tableSchema, keyword = dto.searchValue?.ToFullTextString() })
                )
            };
        }

        [HttpPost("create")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_TABLE))]
        public async Task<RestBase> CreateAsync([FromBody] TableInfo dto)
        {
            using var session = OpenSession();
            using var uow = new UnitOfWork(DbFactory, session);
            if (dto == null)
            {
                return new RestError(400, "Đầu vào không hợp lệ!");
            }

            TableInfo table = new TableInfo
            {
                order = dto.order,
                name_en = dto.name_en,
                name_vn = dto.name_vn,
                table_schema = dto.table_schema,
                table_name = StringHelper.Normalize(dto.table_name, "_"),
            };


            table.id = await _tableRepository.SaveOrUpdateAsync(table, uow);

            if (table.id > 0)
            {
                uow.Connection.Query($"CREATE TABLE IF NOT EXISTS \"{table.table_schema}\".\"{table.table_name}\" (id SERIAL PRIMARY KEY);");

                await _tableColumnRepository.AddSearchContentAsync(table);
                await _tableColumnRepository.AddTimeColumnAsync(table);
                await _tableColumnRepository.SyncColumnsAsync(table);

                return new RestData
                {
                    data = table
                };
            }

            return new RestError((int)HttpStatusCode.Accepted, "Tạo bảng dữ liệu không thành công!");
        }

        [HttpPost("update")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_TABLE))]
        public async Task<RestBase> UpdateAsync([FromBody] TableInfo dto)
        {
            using var session = OpenSession();
            using var uow = new UnitOfWork(DbFactory, session);
            if (dto == null)
            {
                return new RestError((int)HttpStatusCode.BadRequest, "Vui lòng kiểm tra lại tham số!");
            }
            var table = uow.Find<TableInfo>(statement => statement.Where($"{nameof(TableInfo.id)} = {dto.id}")).FirstOrDefault();
            if (table == null)
            {
                return new RestError((int)HttpStatusCode.NotFound, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại");
            }
            table.order = dto.order;
            table.name_en = dto.name_en;
            table.name_vn = dto.name_vn;
            if (await _tableRepository.SaveOrUpdateAsync(table, uow) > 0)
            {
                return new RestBase(EnumErrorCode.OK);
            }
            else
            {
                return new RestError((int)HttpStatusCode.Accepted, "Lưu thông tin không thành công");
            }
        }

        [HttpGet("data")]
        public RestBase getData([FromQuery] int id)
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
                return new RestData()
                {
                    data = session.Query(
                        $"SELECT {string.Join(",", table.columns.Select(x => x.column_name))} FROM {table.table_schema}.{table.table_name}")
                };
            }
        }

        [HttpGet("{id}/data")]
        public RestBase tableData([FromRoute] int id)
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
                return new RestData()
                {
                    data = session.Query(
                        $"SELECT {string.Join(",", table.columns.Select(x => x.column_name))} FROM {table.table_schema}.{table.table_name} ORDER BY 1")
                };
            }
        }

        [HttpPost("{id}/insert")]
        public RestBase insert([FromRoute] int id, [FromBody] IDictionary<string, object> dto)
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
            using (var session = OpenSession())
            {
                List<string> fields = new List<string>();
                TableColumn? keyColumn = table.key_column ?? table.identity_column;
                foreach (var column in table.columns)
                {
                    if (dto.ContainsKey(column.column_name))
                        fields.Add(column.column_name);
                }
                string sql = $@"INSERT INTO {table.table_schema}.{table.table_name} 
                    ({String.Join(",", fields)}) VALUES 
                    ({String.Join(",", fields.Select(x => $"@{x}"))})
                    RETURNING {keyColumn.column_name};
                ";
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    int newId = uow.Connection.Query<int>(sql, dto).FirstOrDefault();
                    if (newId > 0)
                        return new RestBase("OK");
                    else
                    {
                        return new RestError()
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail{ message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                            }
                        };
                    }
                }
            }
        }

        [HttpPost("{id}/update")]
        public RestBase update([FromRoute] int id, [FromBody] IDictionary<string, object> dto)
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
            using (var session = OpenSession())
            {
                List<string> fields = new List<string>();
                TableColumn? keyColumn = table.key_column ?? table.identity_column;
                foreach (var column in table.columns)
                {
                    if (dto.ContainsKey(column.column_name))
                        fields.Add($"{column.column_name} = @{column.column_name}");
                }
                string sql = $@"UPDATE {table.table_schema}.{table.table_name} SET {String.Join(", ", fields)} WHERE {keyColumn.column_name} = @{keyColumn.column_name};";

                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    uow.Connection.Execute(sql, dto);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("{id}/delete/{oid}")]
        public RestBase delete([FromRoute] int id, [FromRoute] int oid)
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

            using (var session = OpenSession())
            {
                TableColumn? keyColumn = table.key_column ?? table.identity_column;

                string sql = $@"DELETE FROM {table.table_schema}.{table.table_name} WHERE {keyColumn.column_name} = @id;";

                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    uow.Connection.Execute(sql, new { id = oid });
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpGet("{id}/record/{oid}")]
        public RestBase record([FromRoute] int id, [FromRoute] string oid)
        {
            var table = getTableAndColumns(id);
            if (table == null)
            {
                return new RestError((int)HttpStatusCode.NotFound, "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!");
            }

            using (var session = OpenSession())
            {
                TableColumn? keyColumn = table.key_column ?? table.identity_column;
                object withParams = new { };

                string sql = @$"SELECT * FROM {table.table_schema}.{table.table_name} WHERE {keyColumn.column_name} = @oid;";

                switch (keyColumn.data_type)
                {
                    case EnumPgDataType.Integer:
                        if (int.TryParse(oid.ToString(), out int value))
                        {
                            withParams = new { oid = value };
                        }
                        else
                        {
                            withParams = new { oid = 0 };
                        }
                        break;
                    case EnumPgDataType.Double:
                        if (double.TryParse(oid.ToString(), out double doubleValue))
                        {
                            withParams = new { oid = doubleValue };
                        }
                        else
                        {
                            withParams = new { oid = 0 };
                        }
                        break;
                    case EnumPgDataType.String:
                    default:
                        withParams = new { oid = oid.ToString() };
                        break;
                }

                return new RestData
                {
                    data = session.Query(sql, withParams).Select(x => (IDictionary<string, object>)x).FirstOrDefault()
                };
            }
        }
    }
}