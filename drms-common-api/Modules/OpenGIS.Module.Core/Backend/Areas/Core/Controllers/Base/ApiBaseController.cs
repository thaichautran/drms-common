using AutoMapper;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Module.Core.Areas.Core.Controllers.Base
{
    [Area(nameof(Module.Core))]
    [ApiController]
    [AllowAnonymous]
    public class ApiBaseController : ControllerBase
    {
        protected IDbFactory DbFactory { get; }
        protected IMapper Mapper;
        public ApiBaseController(IDbFactory dbFactory, IMapper mapper)
        {
            DbFactory = dbFactory;
            Mapper = mapper;
        }

        protected ISession OpenSession()
        {
            return DbFactory.Create<INpgsqlSession>();
        }

        protected string? UserId => HttpContext.User.Claims.FirstOrDefault(x => x.Type == "sub")?.Value;

        protected ApplicationUserInfo? getUserInfo()
        {
            using (var session = OpenSession())
            {
                if (string.IsNullOrWhiteSpace(UserId) == false)
                {
                    var userInfo = session.Find<ApplicationUserInfo>(statement => statement
                        .Include<ApplicationUser>(join => join.InnerJoin())
                        .Where($"{Sql.Entity<ApplicationUser>(x => x.Id):TC}=@Id")
                        .WithParameters(new { Id = UserId })
                    ).FirstOrDefault();
                    return userInfo;
                }

                return null;
            }
        }

        protected string getGuestToken()
        {
            HttpContext.Request.Headers.TryGetValue("x-guest-token", out var guestToken);
            return (guestToken.Count > 0) ? guestToken.FirstOrDefault() : string.Empty;
        }

        protected string getLangCode()
        {
            HttpContext.Request.Headers.TryGetValue("x-lang-code", out var langCode);
            string lang = (langCode.Count > 0) ? langCode.FirstOrDefault() : "vi";
            if (lang != "en" && lang != "vi")
            {
                lang = "vi";
            }
            return lang;
        }

        protected async Task<string> getAccessToken()
        {
            return await HttpContext.GetTokenAsync("access_token");
        }

        protected IEnumerable<TableRelation> getAllRelations()
        {
            using (var session = OpenSession())
            {
                string sss = $@"
                    SELECT * FROM {Sql.Entity<TableRelation>():T} AS tr 
                    INNER JOIN {Sql.Entity<TableColumn>():T} AS c
                        ON tr.{Sql.Entity<TableRelation>(x => x.table_column_id):TC} = c.{Sql.Entity<TableColumn>(x => x.id):TC}
                    INNER JOIN {Sql.Entity<TableColumn>():T} AS rc
                        ON tr.{Sql.Entity<TableRelation>(x => x.relation_table_column_id):TC} = rc.{Sql.Entity<TableColumn>(x => x.id):TC}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS t
                        ON tr.{Sql.Entity<TableRelation>(x => x.table_id):TC} = t.{Sql.Entity<TableInfo>(x => x.id):TC}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS m
                        ON tr.{Sql.Entity<TableRelation>(x => x.mediate_table_id):TC} = m.{Sql.Entity<TableInfo>(x => x.id):TC}
                    INNER JOIN {Sql.Entity<TableInfo>():T} AS rt
                        ON tr.{Sql.Entity<TableRelation>(x => x.relation_table_id):TC} = rt.{Sql.Entity<TableInfo>(x => x.id):TC}";

                IEnumerable<TableRelation> relations = session.Query<TableRelation, TableColumn, TableColumn, TableInfo, TableInfo, TableInfo, TableRelation>(sss, (r, c, rc, t, m, rt) =>
                {
                    r.table_column = c;
                    r.relation_column = rc;
                    r.table = t;
                    r.mediate_table = m;
                    r.relation_table = rt;
                    return r;
                },
                    splitOn: $"{Sql.Entity<TableColumn>(x => x.id):TC}, {Sql.Entity<TableColumn>(x => x.id):TC}, {Sql.Entity<TableInfo>(x => x.id):TC}, {Sql.Entity<TableInfo>(x => x.id):TC}, {Sql.Entity<TableInfo>(x => x.id):TC}");
                foreach (var relation in relations)
                {
                    relation.extra_fields = session.Find<TableColumn>(statement => statement
                        .Where($"{Sql.Entity<TableColumn>(x => x.id):TC} NOT IN ({relation.table_column_id}, {relation.relation_table_column_id}) AND {Sql.Entity<TableColumn>(x => x.table_id):TC} = {relation.mediate_table_id}")
                    );
                }
                return relations;
            }
        }

        private object[] parseJArray(JArray jArray) => jArray.Select(item => item.Value<object>()).ToArray();

        protected string getConditions(TableInfo table, IDictionary<string, object> parameter)
        {
            if (parameter == null)
            {
                return "(1=1)";
            }

            var conditions = new List<string>
            {
                "(1=1)"
            };
            var columns = table.columns;
            foreach (var _key in parameter.Keys)
            {
                var attr_name = _key.Replace("_start", "").Replace("_dateStart", "").Replace("_end", "").Replace("_dateEnd", "");
                if (!string.IsNullOrEmpty(parameter[_key]?.ToString()) && columns.Select(x => x.column_name).Contains(attr_name))
                {
                    var col = columns.Where(x => x.column_name == attr_name).FirstOrDefault();
                    if (col.column_name == "district_id" || col.column_name == "commune_id" || col.column_name == "province_id")
                    {
                        var areaIds = parseJArray((JArray)parameter[col.column_name]);
                        conditions.Add($"{table.table_name}.{col.column_name} IN ({string.Join(",", areaIds.Select(o => $"'{o}'"))})");
                    }
                    else if (col.lookup_table_id > 0)
                    {
                        conditions.Add($"{table.table_name}.{col.column_name} IN ({parameter[_key]})");
                    }
                    else if (col.data_type == EnumPgDataType.Integer || col.data_type == EnumPgDataType.Double)
                    {
                        var subCons = new List<string>();

                        if (parameter.ContainsKey(attr_name + "_start"))
                        {
                            subCons.Add($@"{table.table_name}.{col.column_name} >= {parameter[col.column_name + "_start"]}");
                        }
                        if (parameter.ContainsKey(attr_name + "_end"))
                        {
                            subCons.Add($@"{table.table_name}.{col.column_name} <= {parameter[col.column_name + "_end"]}");
                        }

                        if (subCons.Count() > 0)
                        {
                            conditions.Add($"({string.Join(" AND ", subCons)})");
                        }
                    }
                    else if (col.data_type == EnumPgDataType.Boolean)
                    {
                        conditions.Add($"{table.table_name}.{col.column_name} IN ({parameter[_key]})");
                    }
                    else if (col.data_type == EnumPgDataType.Date || col.data_type == EnumPgDataType.DateTime)
                    {
                        var subCons = new List<string>();

                        if (parameter.ContainsKey(attr_name + "_dateStart"))
                        {
                            var dateStart = DateTime.Parse(parameter[attr_name + "_dateStart"].ToString());
                            if (col.data_type == EnumPgDataType.DateTime)
                                subCons.Add($@"{table.table_name}.{col.column_name} >= to_timestamp('{dateStart.ToString("dd-MM-yy HH:mm:ss")}','DD-MM-YY HH24:mi:SS')");
                            else if (col.data_type == EnumPgDataType.Date)
                                subCons.Add($@"{table.table_name}.{col.column_name} >= to_timestamp('{dateStart.ToString("dd-MM-yy")}','DD-MM-YY')");
                        }
                        if (parameter.ContainsKey(attr_name + "_dateEnd"))
                        {
                            var dateEnd = DateTime.Parse(parameter[attr_name + "_dateEnd"].ToString());
                            if (col.data_type == EnumPgDataType.DateTime)
                                subCons.Add($@"{table.table_name}.{col.column_name} <= to_timestamp('{dateEnd.ToString("dd-MM-yy HH:mm:ss")}','DD-MM-YY HH24:mi:SS')");
                            else if (col.data_type == EnumPgDataType.Date)
                                subCons.Add($@"{table.table_name}.{col.column_name} <= to_timestamp('{dateEnd.ToString("dd-MM-yy")}','DD-MM-YY')");
                        }

                        if (subCons.Count() > 0)
                        {
                            conditions.Add($"({string.Join(" AND ", subCons)})");
                        }
                    }
                    else if (col.data_type == EnumPgDataType.Text || col.data_type == EnumPgDataType.String)
                    {
                        //var cleanKw = parameter[_key].ToString().ToFullTextString();
                        conditions.Add($"lower({table.table_name}.{col.column_name}) like '%{parameter[_key].ToString().ToLower()}%'");
                    }
                }
                else if (_key == "textSearch" && !string.IsNullOrEmpty(parameter[_key].ToString()))
                {
                    var cleanKw = parameter[_key].ToString().ToFullTextString();
                    conditions.Add($"{table.table_name}.search_content @@ to_tsquery('{cleanKw}')");
                }
                else if (_key == "geomSearch" && !string.IsNullOrEmpty(parameter[_key].ToString()))
                {
                    conditions.Add($"ST_Intersects({table.table_name}.geom, ST_SetSRID(ST_GeomFromGeoJSON('{parameter[_key]}'),4326))");
                }
                else if (_key == "capQuanLy" && !string.IsNullOrWhiteSpace(parameter[_key].ToString()))
                {
                    if (columns.Any(o => o.column_name == "madonviquanly"))
                    {
                        if (parameter[_key].ToString() == "1")
                        {
                            conditions.Add($"(madonviquanly::TEXT = '1' OR madonviquanly IS NULL OR madonviquanly::TEXT = '')");
                        }
                        else
                        {
                            conditions.Add($"(madonviquanly IS NOT NULL AND madonviquanly::TEXT <> '1')");
                        }
                    }
                }
            }
            return string.Join(" AND ", conditions);
        }

        protected string getConditionsSearchByLogic(TableInfo table, IDictionary<string, object> parameter)
        {
            if (parameter == null)
            {
                return "(1=1)";
            }

            var conditions = new List<string>
            {
                "(1=1)"
            };
            var columns = table.columns;
            foreach (var _key in parameter.Keys)
            {
                var attr_name = _key.Replace("_start", "").Replace("_dateStart", "");
                if (parameter[_key] != null && columns.Select(x => x.column_name).Contains(attr_name))
                {
                    var col = columns.Where(x => x.column_name == attr_name).FirstOrDefault();
                    if (col.lookup_table_id > 0)
                    {
                        if (parameter[_key] is JArray)
                        {
                            if ((parameter[_key] as JArray).Count > 0)
                            {
                                conditions.Add($"{table.table_name}.{col.column_name} IN ({String.Join(",", parameter[_key] as JArray)})");
                            }
                        }
                        else
                        {
                            conditions.Add($"{table.table_name}.{col.column_name} IN ({parameter[_key]})");
                        }
                    }
                    else if (col.lookup_table_id > 0 || col.column_name == "province_id" || col.column_name == "district_id" || col.column_name == "commune_id")
                    {
                        if (parameter[_key] is JArray)
                        {
                            if ((parameter[_key] as JArray).Count > 0)
                            {
                                conditions.Add($"{table.table_name}.{col.column_name} IN ({String.Join(",", (parameter[_key] as JArray).Select(o => $"'{o}'"))})");
                            }
                        }
                        else
                        {
                            conditions.Add($"{table.table_name}.{col.column_name} IN ({parameter[_key]})");
                        }
                    }
                    else if ((col.data_type == EnumPgDataType.Integer || col.data_type == EnumPgDataType.Double) && col.lookup_table_id == 0)
                    {
                        conditions.Add($@"({table.table_name}.{col.column_name} >= {parameter[col.column_name + "_start"]} 
                                        AND {table.table_name}.{col.column_name} <= {parameter[col.column_name + "_end"]})");
                    }
                    else if (col.data_type == EnumPgDataType.Boolean)
                    {
                        conditions.Add($"{table.table_name}.{col.column_name} IN ({parameter[_key]})");
                    }
                    else if (col.data_type == EnumPgDataType.Date || col.data_type == EnumPgDataType.DateTime)
                    {
                        var dateStart = DateTime.Parse(parameter[attr_name + "_dateStart"]?.ToString());
                        var dateEnd = DateTime.Parse(parameter[attr_name + "_dateEnd"]?.ToString());
                        if (col.data_type == EnumPgDataType.DateTime)
                            conditions.Add($@"({table.table_name}.{col.column_name} >= to_timestamp('{dateStart.ToString("dd-MM-yy HH:mm:ss")}','DD-MM-YY HH24:mi:SS') AND 
                                                {table.table_name}.{col.column_name} <= to_timestamp('{dateEnd.ToString("dd-MM-yy HH:mm:ss")}','DD-MM-YY HH24:mi:SS'))");
                        else if (col.data_type == EnumPgDataType.Date)
                            conditions.Add($@"({table.table_name}.{col.column_name} >= to_timestamp('{dateStart.ToString("dd-MM-yy")}','DD-MM-YY') AND 
                                                {table.table_name}.{col.column_name} <= to_timestamp('{dateEnd.ToString("dd-MM-yy")}','DD-MM-YY'))");
                    }
                    else if (col.data_type == EnumPgDataType.String || col.data_type == EnumPgDataType.Text)
                    {
                        if (string.IsNullOrWhiteSpace(parameter[_key]?.ToString()) == false)
                        {
                            conditions.Add($"search_content @@ to_tsquery(remove_vietnamese_signs('{parameter[_key]?.ToString().Replace(" ", " & ")}'))");
                        }
                    }
                }
                else if (_key == "textSearch" && !string.IsNullOrEmpty(parameter[_key]?.ToString()))
                {
                    var cleanKw = parameter[_key]?.ToString().ToFullTextString();
                    conditions.Add($"{table.table_name}.search_content @@ '{cleanKw}'");
                }
                else if (_key == "geomSearch" && parameter[_key] != null)
                {
                    conditions.Add($"ST_Intersects({table.table_name}.geom,st_setsrid(ST_GeomFromGeoJSON('{parameter[_key]}'),4326))");
                }
            }
            return string.Join(" AND ", conditions);
        }

        protected TableInfo getTable(int id)
        {
            using (var session = OpenSession())
            {
                return session.Find<TableInfo>(statement =>
                    statement.Where($"{nameof(TableInfo.id):TC}={id}")).FirstOrDefault();
            }
        }

        protected TableColumn getColumn(int id)
        {
            using (var session = OpenSession())
            {
                return session.Find<TableColumn>(statement =>
                    statement.Where($"{nameof(TableColumn.id):TC}={id}")
                        .Include<TableInfo>(join => join.InnerJoin())
                ).FirstOrDefault();
            }
        }

        protected TableInfo getTableAndColumns(int id, string keyword = "")
        {
            using (var session = OpenSession())
            {
                var condition = $"{Sql.Entity<TableInfo>(x => x.id):TC} = @id";

                if (!string.IsNullOrEmpty(keyword))
                {
                    condition += $" AND {Sql.Entity<TableColumn>():T}.search_content @@ to_tsquery(@keyword)";
                }
                return session.Find<TableInfo>(statement => statement
                              .Include<TableColumn>(join => join.LeftOuterJoin())
                              .Where($"{condition}")
                              .WithParameters(new { id = id, keyword = keyword?.ToFullTextString() })
                              .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}")).FirstOrDefault();
            }
        }
        protected IDictionary<string, IEnumerable<IDictionary<string, object>>> domainValueForLookup(TableInfo table)
        {
            var columns_lookup = getTableAndColumns(table.id)?.columns.Where(x => x.lookup_table_id > 0);
            using (var session = OpenSession())
            {
                IDictionary<string, IEnumerable<IDictionary<string, object>>> domains_values =
                                    new Dictionary<string, IEnumerable<IDictionary<string, object>>>();
                foreach (var column_lookup in columns_lookup)
                {
                    var table_domain = getTableAndColumns(column_lookup.lookup_table_id);
                    if (table_domain != null)
                    {
                        var label_column = table_domain.columns.Where(x => x.is_label).FirstOrDefault();

                        if (label_column != null)
                        {
                            domains_values.Add(
                                    table.columns.FirstOrDefault(x => x.id == column_lookup.id)?.column_name ?? "",
                                    session.Query($"SELECT id,{label_column.column_name} as mo_ta FROM {table_domain.table_schema}.{table_domain.table_name} ORDER BY id").Select(x => (IDictionary<string, object>)x)
                                );
                        }
                        else
                        {
                            var values = session.Query($"SELECT {string.Join(", ", table_domain.columns.Where(x => !x.column_name.Equals("geom")).Select(x => x.column_name))} FROM {table_domain.table_schema}.{table_domain.table_name} ORDER BY id").Select(x => (IDictionary<string, object>)x);

                            domains_values.Add(
                                table.columns.FirstOrDefault(x => x.id == column_lookup.id)?.column_name ?? "",
                                values
                            );
                        }
                    }
                }
                return domains_values;
            }
        }

        // protected List<BaseCategory> getCategoryByTableId(int id)
        // {
        //     var data = new List<BaseCategory>();
        //     using (var session = OpenSession())
        //     {
        //         if (id > 0)
        //         {
        //             var tableInfo = session.Find<TableInfo>(statement => statement
        //                                     .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = @id")
        //                                     .WithParameters(new { id })
        //                                 ).FirstOrDefault();

        //             if (tableInfo != null)
        //             {
        //                 string sql = $" SELECT * FROM {tableInfo.table_schema}.{tableInfo.table_name} ORDER BY {tableInfo.table_schema}.{tableInfo.table_name}.id";
        //                 data = session.Query<BaseCategory>(sql).ToList();
        //                 return data;
        //             }
        //         };
        //         return data;
        //     }

        // }
        protected string getUserId()
        {
            var principal = HttpContext.User;
            //if (principal?.Claims != null)
            //{
            //    foreach (var claim in principal.Claims)
            //    {
            //    }
            //}
            return principal?.Claims?.FirstOrDefault(p => p.Type == "sub")?.Value;
        }

        protected IEnumerable<TableInfo> getTablesAndColumns(string schema)
        {
            using (var session = OpenSession())
            {
                if (string.IsNullOrWhiteSpace(schema))
                {
                    return session.Find<TableInfo>(statement =>
                    statement.Include<TableColumn>(join => join.LeftOuterJoin())
                        .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}")
                    );
                }
                else
                {
                    return session.Find<TableInfo>(statement =>
                    statement.Where($"{nameof(TableInfo.table_schema):TC}='{schema}'")
                        .Include<TableColumn>(join => join.LeftOuterJoin())
                        .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}")
                    );
                }
            }
        }
    }
}
