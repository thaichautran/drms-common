using System;
using System.Collections.Generic;
using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Models.Database;
using System.Threading.Tasks;

namespace OpenGIS.Module.API.Controllers
{
    //// [Authorize(Policy = nameof(ModuleFunction.READ_TABLE_RELATION))]
    public partial class TableController : BaseController
    {
        [HttpGet("relation/list")]
        public RestBase listTableRelations()
        {
            using (var session = OpenSession())
            {
                string sss = $@"
                    SELECT  tr.*, 
                            c.{nameof(TableColumn.id)}, c.{nameof(TableColumn.name_vn)},
                            rc.{nameof(TableColumn.id)}, rc.{nameof(TableColumn.name_vn)},
                            t.{nameof(TableInfo.id)}, t.{nameof(TableInfo.name_vn)}, 
                            m.{nameof(TableInfo.id)}, m.{nameof(TableInfo.name_vn)}, 
                            rt.{nameof(TableInfo.id)}, rt.{nameof(TableInfo.name_vn)}
                        FROM {Sql.Entity<TableRelation>():T} AS tr 
                    LEFT JOIN {Sql.Entity<TableColumn>():T} AS c
                        ON tr.{nameof(TableRelation.table_column_id)} = c.{nameof(TableColumn.id)}
                    LEFT JOIN {Sql.Entity<TableColumn>():T} AS rc
                        ON tr .{nameof(TableRelation.relation_table_column_id)} = rc.{nameof(TableColumn.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS t
                        ON tr.{nameof(TableRelation.table_id)} = t.{nameof(TableInfo.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS m
                        ON tr.{nameof(TableRelation.mediate_table_id)} = m.{nameof(TableInfo.id)}
                    LEFT JOIN {Sql.Entity<TableInfo>():T} AS rt
                        ON tr.{nameof(TableRelation.relation_table_id)} = rt.{nameof(TableInfo.id)}";
                IEnumerable<TableRelation> relations = session.Query<TableRelation, TableColumn, TableColumn, TableInfo, TableInfo, TableInfo, TableRelation>(sss, (tr, c, rc, t, m, rt) =>
                {
                    tr.table_column = c;
                    tr.relation_column = rc;
                    tr.table = t;
                    tr.mediate_table = m;
                    tr.relation_table = rt;
                    return tr;
                },
                    splitOn: $"{nameof(TableColumn.id)}, {nameof(TableColumn.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}");

                foreach (var relation in relations)
                {
                    relation.extra_fields = session.Find<TableColumn>(statement => statement
                        .Where($"{nameof(TableColumn.id)} NOT IN ({relation.table_column_id}, {relation.relation_table_column_id}) AND {nameof(TableColumn.table_id)} = {relation.mediate_table_id}")
                    );
                }
                return new RestData()
                {
                    data = relations
                };
            }
        }

        [HttpGet("relation/{id}")]
        public RestBase getRelation([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                string sss = $@"
                    SELECT * FROM {Sql.Entity<TableRelation>():T} AS tr 
                    INNER JOIN {Sql.Entity<TableColumn>():T} AS c
                        ON tr.{nameof(TableRelation.table_column_id)} = c.{nameof(TableColumn.id)}
                    INNER JOIN {Sql.Entity<TableColumn>():T} AS rc
                        ON tr.{nameof(TableRelation.relation_table_column_id)} = rc.{nameof(TableColumn.id)}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS t
                        ON tr.{nameof(TableRelation.table_id)} = t.{nameof(TableInfo.id)}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS m
                        ON tr.{nameof(TableRelation.mediate_table_id)} = m.{nameof(TableInfo.id)}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS rt
                        ON tr.{nameof(TableRelation.relation_table_id)} = rt.{nameof(TableInfo.id)} WHERE {Sql.Entity<TableColumn>(x => x.id):TC} = $@id";
                IEnumerable<TableRelation> relations = session.Query<TableRelation, TableColumn, TableColumn, TableInfo, TableInfo, TableInfo, TableRelation>(sss, (tr, c, rc, t, m, rt) =>
                {
                    tr.table_column = c;
                    tr.relation_column = rc;
                    tr.table = t;
                    tr.mediate_table = m;
                    tr.relation_table = rt;
                    return tr;
                },
                    splitOn: $"{nameof(TableColumn.id)}, {nameof(TableColumn.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}");
                foreach (var relation in relations)
                {
                    relation.extra_fields = session.Find<TableColumn>(statement => statement
                        .Where($"{nameof(TableColumn.id)} NOT IN ({relation.table_column_id}, {relation.relation_table_column_id}) AND {nameof(TableColumn.table_id)} = {relation.mediate_table_id}")
                    );
                }
                return new RestData()
                {
                    data = relations
                };
            }
        }

        [HttpPost("relation/save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_TABLE_RELATION))]
        public RestBase save([FromBody] TableRelation tableRelation)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (tableRelation.id > 0)
                    {
                        uow.Connection.Update(tableRelation);
                    }
                    else
                    {
                        var existRelation = session.Find<TableRelation>(statement => statement
                            .Where($"{nameof(TableRelation.table_id)} = @table_id AND {nameof(TableRelation.relation_table_id)} = @relation_table_id")
                            .WithParameters(tableRelation)
                        ).FirstOrDefault();
                        if (existRelation == null)
                        {
                            uow.Connection.Insert(tableRelation);
                        }
                        else
                        {
                            return new RestError()
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail() { message = "Quan hệ đã tồn tại!" }
                                }
                            };
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("relation/delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_TABLE_RELATION))]
        public RestBase deleteRelation([FromForm] TableRelation tableRelation)
        {
            using (var session = OpenSession())
            {
                var relation = session.Get(new TableRelation { id = tableRelation.id });
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (relation != null && uow.Connection.Delete(relation))
                        return new RestBase(EnumErrorCode.OK);
                    else
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

        [HttpGet("listRelations")]
        public RestBase listRelations()
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = getAllRelations()
                };
            }
        }

        [HttpGet("relations")]
        public async Task<RestBase> getRelationTableAsync([FromQuery] int table_id, bool? isBacktracking = false)
        {
            using (var session = OpenSession())
            {
                var table = getTableAndColumns(table_id);
                if (table == null)
                {
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail() { message = "Bảng dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    return new RestData
                    {
                        data = getRelations(table, isBacktracking)
                    };
                }
            }
        }

        [HttpPost("deleteRelation")]
        public RestBase deleteRelation(int id)
        {
            using (var session = OpenSession())
            {
                var relation = session.Get(new TableRelation { id = id });
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (relation != null && uow.Connection.Delete(relation))
                        return new RestBase(EnumErrorCode.OK);
                    else
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng kiểm tra lại!" }
                            }
                        };
                }
            }
        }
    }
}