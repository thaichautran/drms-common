using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json.Linq;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.Core.Controllers.Base
{
    [Authorize]
    [Area(nameof(Module.Core))]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class _BaseController : Controller
    {
        private readonly IDbFactory _dbFactory;

        public _BaseController(IDbFactory dbFactory)
        {
            _dbFactory = dbFactory;

            using var session = _dbFactory.Create<INpgsqlSession>();

            VietGIS.Infrastructure.GlobalConfiguration.ApplicationName = session.Get(new WebOption { option_name = "site_name" })?.option_value ?? "";
            VietGIS.Infrastructure.GlobalConfiguration.ApplicationLogo = session.Get(new WebOption { option_name = "site_logo" })?.option_value ?? "";
            VietGIS.Infrastructure.GlobalConfiguration.ApplicationDescription = session.Get(new WebOption { option_name = "site_description" })?.option_value ?? "";
        }
        protected virtual ISession OpenSession()
        {
            return _dbFactory.Create<INpgsqlSession>();
        }
        protected string getGuestToken()
        {
            HttpContext.Request.Headers.TryGetValue("x-guest-token", out StringValues guestToken);
            return (guestToken.Count > 0) ? (guestToken.FirstOrDefault() ?? string.Empty) : string.Empty;
        }
        /// <summary>
        /// Lấy thông tin bảng kèm theo các cột của bảng
        /// </summary>
        /// <param name="id"></param>
        /// <param name="isGroup"></param>
        /// <param name="byPassFilter"></param>
        /// <returns>typeof(TableInfo) Đối tượng TableInfo</returns>
        protected virtual TableInfo? getTableAndColumns(int id, bool? isGroup = false, bool? byPassFilter = false)
        {
            using (var session = OpenSession())
            {
                ExpandoObject withParams = new ExpandoObject();
                withParams.TryAdd("id", id);

                string condition = $@"{Sql.Entity<TableInfo>(x => x.id):TC} = @id";
                if (isGroup.HasValue && isGroup.Value)
                {
                    condition += $@" AND {Sql.Entity<TableColumn>():T}.allow_group IS TRUE";
                }
                if (byPassFilter == false && (User.IsInRole(EnumRoles.SA) == false && User.IsInRole(EnumRoles.ADMINISTRATOR) == false))
                {
                    List<UserColumn> userColumns = ListUserColumns(session);
                    StringBuilder builder = new StringBuilder();
                    builder.AppendLine(" AND (");
                    builder.AppendLine($"{Sql.Entity<TableColumn>(x => x.id):TC} = ANY(@userColumns)");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.is_key):TC} = TRUE");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.is_identity):TC} = TRUE");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.is_label):TC} = TRUE");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.column_name):TC} = 'province_code'");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.column_name):TC} = 'district_code'");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.column_name):TC} = 'commune_code'");
                    builder.AppendLine($"OR {Sql.Entity<TableColumn>(x => x.column_name):TC} = 'geom'");
                    builder.AppendLine(")");
                    condition += builder.ToString();
                    withParams.TryAdd("userColumns", userColumns.Select(o => o.column_id).ToArray());
                }
                return session.Find<TableInfo>(statement => statement
                    .Where($"{condition}")
                    .WithParameters(withParams)
                    .Include<TableColumn>(join => join.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                ).FirstOrDefault();
            }
        }

        private List<UserColumn> ListUserColumns(ISession session)
        {
            List<UserColumn> userColumns = session.Find<UserColumn>(statement => statement
               .Where($"{nameof(UserColumn.user_id)}=@userId")
               .WithParameters(new { userId = getUserId() })
           ).ToList();
            return userColumns;
        }
        /// <summary>
        /// Trả về id của user đang đăng nhập hiện tại
        /// </summary>
        /// <returns></returns>
        protected virtual string? getUserId()
        {
            var principal = HttpContext.User;
            //if (principal?.Claims != null)
            //{
            //    {
            //    foreach (var claim in principal.Claims)
            //    }
            //}
            return principal?.Claims?.FirstOrDefault(p => p.Type == "sub" || p.Type == ClaimTypes.NameIdentifier)?.Value;
        }
        /// <summary>
        /// Get the entire list of domains of the table
        /// </summary>
        /// <param name="table"></param>
        /// <returns></returns>
        protected virtual IDictionary<string, List<DomainViewModel>> domainValueForLookup(TableInfo table)
        {

            var columns_lookup = table.columns.Where(x => x.lookup_table_id > 0);
            using (var session = OpenSession())
            {
                IDictionary<string, List<DomainViewModel>> domains_values =
                                    new Dictionary<string, List<DomainViewModel>>();
                if (columns_lookup != null)
                {
                    foreach (var column_lookup in columns_lookup)
                    {
                        var table_domain = getTableAndColumns(column_lookup.lookup_table_id);
                        if (table_domain != null)
                        {
                            var keyColummn = table_domain.key_column ?? table_domain.identity_column;
                            var labelColumn = table_domain.label_column ?? keyColummn;
                            if (labelColumn != null)
                            {
                                domains_values.Add(
                                        table.columns.FirstOrDefault(x => x.id == column_lookup.id)?.column_name ?? "",
                                        session.Query<DomainViewModel>(@$"SELECT {keyColummn.column_name} AS id, {labelColumn.column_name} AS mo_ta 
                                                FROM {table_domain.table_schema}.{table_domain.table_name} ORDER BY {keyColummn.column_name}").ToList()
                                    );
                            }
                            else
                            {
                                domains_values.Add(
                                    table.columns.FirstOrDefault(x => x.id == column_lookup.id)?.column_name ?? "",
                                    session.Query<DomainViewModel>($"SELECT * FROM {table_domain.table_schema}.{table_domain.table_name} ORDER BY {keyColummn.column_name}").ToList()
                                );
                            }
                        }
                    }
                }
                return domains_values;
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="table"></param>
        /// <param name="parameter"></param>
        /// <returns></returns>
        protected virtual string getConditionsSearchByLogic(TableInfo table, IDictionary<string, object>? parameter)
        {
            if (parameter == null)
            {
                return "(1=1)";
            }

            var conditions = new List<string>();
            conditions.Add("(1=1)");
            var columns = table.columns;
            foreach (var _key in parameter.Keys)
            {
                var attr_name = _key.Replace("_start", "").Replace("_dateStart", "");
                if (parameter[_key] != null && columns.Select(x => x.column_name).Contains(attr_name))
                {
                    var col = columns.Where(x => x.column_name == attr_name).FirstOrDefault();
                    if (col != null)
                    {
                        if (col.lookup_table_id > 0)
                        {
                            if (parameter[_key] is JArray)
                            {
                                if ((parameter[_key] as JArray).Count > 0)
                                {
                                    if (col.data_type == EnumPgDataType.String)
                                    {
                                        conditions.Add($"{table.table_name}.{col.column_name} IN ({String.Join(",", (parameter[_key] as JArray).Select(o => $"'{o}'"))})");
                                    }
                                    else
                                    {
                                        conditions.Add($"{table.table_name}.{col.column_name} IN ({String.Join(",", parameter[_key] as JArray)})");
                                    }
                                }
                            }
                            else
                            {
                                conditions.Add($"{table.table_name}.{col.column_name} IN ('{parameter[_key]}')");
                            }
                        }
                        else if (col.column_name == "province_code" || col.column_name == "district_code" || col.column_name == "commune_code")
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
                                conditions.Add($"{table.table_name}.{col.column_name} IN ('{parameter[_key]}')");
                            }
                        }
                        else if ((col.data_type == EnumPgDataType.SmallInt || col.data_type == EnumPgDataType.Integer || col.data_type == EnumPgDataType.Double) && col.lookup_table_id == 0)
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
                                var cleanKw = parameter[_key].ToString().ToLower();
                                conditions.Add($"LOWER({table.table_name}.{col.column_name}) = '{cleanKw}'");
                                //var cleanKw = parameter[_key].ToString().ToFullTextStringProximity();
                                //conditions.Add($"search_content @@ to_tsquery('{cleanKw}')");
                            }
                        }
                    }
                }
                else if (_key == "textSearch" && !string.IsNullOrWhiteSpace(parameter[_key]?.ToString()))
                {
                    var cleanKw = parameter[_key]?.ToString().ToFullTextString();
                    conditions.Add($"{table.table_name}.search_content @@ to_tsquery('{cleanKw}')");
                }
                else if (_key == "geomSearch" && parameter[_key] != null)
                {
                    conditions.Add($"ST_Intersects({table.table_name}.geom,st_setsrid(ST_GeomFromGeoJSON('{parameter[_key]}'),4326))");
                }
            }
            return string.Join(" AND ", conditions);
        }
    }
}
