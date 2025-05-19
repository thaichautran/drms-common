using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories.Session;
using Newtonsoft.Json.Linq;
using OpenGIS.Module.Core.Models;
using VietGIS.Infrastructure.Enums;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure.Identity.PostgreSQL.Models;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Models.Regional;
using System.Security.Claims;
using System.Dynamic;
using System.Text;
using VietGIS.Infrastructure.Abstractions;
using OpenIddict.Validation.AspNetCore;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Module.API.Controllers.Base
{
    [Authorize(AuthenticationSchemes = AuthSchemes)]
    [ApiController]
    public class BaseController : ControllerBase
    {
        private const string AuthSchemes = "Identity.Application" + "," + JwtBearerDefaults.AuthenticationScheme + "," + OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;

        protected virtual IDbFactory DbFactory { get; }

        public BaseController(IDbFactory dbFactory)
        {
            DbFactory = dbFactory;
        }

        protected virtual ISession OpenSession()
        {
            return DbFactory.Create<INpgsqlSession>();
        }

        protected virtual UnitOfWork CreateUnitOfWork()
        {
            using var session = OpenSession();
            return new UnitOfWork(DbFactory, session);
        }

        protected virtual IEnumerable<InformationIndex> getLayerIndexes(Layer layer)
        {
            using (var session = OpenSession())
            {
                IEnumerable<InformationIndex> indexes = session.Query<InformationIndex>($@"
                        SELECT n.nspname AS table_schema
                            ,t.relname AS table_name
                            ,i.relname AS index_name
                            ,a.attname AS column_name
                        FROM pg_catalog.pg_namespace n
                            ,pg_class t
                            ,pg_class i
                            ,pg_index ix
                            ,pg_attribute a
                        WHERE n.oid = t.relnamespace
                            AND t.oid = ix.indrelid
                            AND i.oid = ix.indexrelid
                            AND a.attrelid = t.oid
                            AND a.attnum = ANY (ix.indkey)
                            AND t.relkind = 'r'
                            AND t.relname = '{layer.table.table_name}'
                            AND n.nspname = '{layer.table.table_schema}'
                        ORDER BY t.relname
                            ,a.attname;
                    ");
                foreach (var index in indexes)
                {
                    if (index.column_name == "geom" || index.column_name == "search_content")
                        index.deletable = false;
                    else if (index.index_name.Contains("pk"))
                        index.deletable = false;
                    else if (index.column_name == layer.table.identity_column?.column_name)
                        index.deletable = false;
                }
                return indexes;
            }
        }

        protected virtual Layer? getLayerWithTable(int id)
        {
            using (var session = OpenSession())
            {
                return session.Find<Layer>(statement => statement
                    .Where($"{Sql.Entity<Layer>(x => x.id):TC}=@id").WithParameters(new { id = id })
                    .Include<TableInfo>(join => join.InnerJoin())
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                ).FirstOrDefault();
            }
        }

        protected virtual Layer? getLayerWithTableAndColumn(int id, string? keyword = "", bool? bypassFilter = false)
        {
            using (var session = OpenSession())
            {
                ExpandoObject withParams = new ExpandoObject();
                withParams.TryAdd("id", id);
                withParams.TryAdd("keyword", keyword?.ToFullTextString());
                var condition = $"{Sql.Entity<Layer>(x => x.id):TC} = @id";
                if (!string.IsNullOrWhiteSpace(keyword))
                {
                    condition += $" AND {Sql.Entity<TableColumn>():T}.search_content @@ to_tsquery(@keyword)";
                }
                if ((User.IsInRole(EnumRoles.SA) == false && User.IsInRole(EnumRoles.ADMINISTRATOR) == false) && bypassFilter == false)
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
                return session.Find<Layer>(statement => statement.Where($"{condition}")
                    .Include<TableInfo>(join => join.InnerJoin())
                    .Include<TableColumn>(join => join.InnerJoin())
                    .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .WithParameters(withParams)
                ).FirstOrDefault();
            }
        }

        protected virtual Layer? getLayerWithTableInfo(int table_id, string? keyword = "")
        {
            using (var session = OpenSession())
            {
                var condition = $"{Sql.Entity<Layer>(x => x.table_info_id):TC} = @table_id";
                if (!string.IsNullOrWhiteSpace(keyword))
                {
                    condition += $" AND {Sql.Entity<TableColumn>():T}.search_content @@ to_tsquery(@keyword)";
                }
                return session.Find<Layer>(statement => statement.Where($"{condition}")
                    .Include<TableInfo>(join => join.InnerJoin())
                    .Include<TableColumn>(join => join.InnerJoin())
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                    .WithParameters(new
                    {
                        table_id,
                        keyword = keyword?.ToFullTextString(),
                    })
                ).FirstOrDefault();
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        protected virtual Layer? getLayer(int id)
        {
            using (var session = OpenSession())
            {
                return session.Find<Layer>(statement => statement
                    .Where($"{Sql.Entity<Layer>(x => x.id):TC}=@id")
                    .WithParameters(new { id = id })
                    .Include<LayerClassify>(join => join.LeftOuterJoin())
                ).FirstOrDefault();
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="ids"></param>
        /// <returns></returns>
        protected virtual List<Layer> getLayers(int[] ids)
        {
            using (var session = OpenSession())
            {
                return session.Find<Layer>(statement => statement
                        .Where($"{Sql.Entity<Layer>(x => x.id):TC} = ANY(@ids)")
                        .WithParameters(new { ids = ids })
                        .Include<LayerClassify>(join => join.LeftOuterJoin())
                        .Include<TableInfo>(join => join.InnerJoin())
                        .Include<TableColumn>(join => join.InnerJoin())
                        .OrderBy($"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.order):TC}")
                ).ToList();
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        /// <returns></returns>
        protected virtual IEnumerable<LayerDomain> getDomains(Layer layer)
        {
            using (var session = OpenSession())
            {
                var lookup = new Dictionary<int, LayerDomain>();
                session.Query<LayerDomain, TableInfo, TableColumn, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T} 
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {Sql.Entity<LayerDomain>(x => x.table_id):TC} = {Sql.Entity<TableInfo>(x => x.id):TC}
                    INNER JOIN {Sql.Entity<TableColumn>():T}
                        ON {Sql.Entity<LayerDomain>(x => x.table_id):TC} = {Sql.Entity<TableColumn>(x => x.table_id):TC}
                    WHERE {nameof(LayerDomain.layer_id):TC} = {layer.id} AND ({Sql.Entity<TableColumn>(x => x.is_label):TC} = TRUE OR {Sql.Entity<TableColumn>(x => x.is_identity):TC} = TRUE)
                    ", (d, t, c) =>
                    {
                        LayerDomain? domain;
                        if (!lookup.TryGetValue(t.id, out domain))
                        {
                            domain = d;
                            domain.table = t;
                            lookup.Add(t.id, domain);
                        }

                        if (domain.table.columns == null)
                        {
                            domain.table.columns = new List<TableColumn>();
                        }

                        domain.table.columns.ToList().Add(c);
                        return d;
                    },
                    splitOn: $"{nameof(TableInfo.id)}, {nameof(TableColumn.id)}");
                return lookup.Values;
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer_id"></param>
        /// <returns></returns>
        protected virtual IEnumerable<LayerDomain> getDomains(int layer_id)
        {
            Layer? layer = getLayerWithTableAndColumn(layer_id);
            if (layer == null)
                return new List<LayerDomain>();
            return getDomains(layer);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        /// <returns></returns>
        protected virtual IDictionary<string, IEnumerable<IDictionary<string, object>>> getDomainValues(Layer layer)
        {
            using (var session = OpenSession())
            {
                IEnumerable<LayerDomain> domains = session.Query<LayerDomain, TableInfo, LayerDomain>($@"
                    SELECT * FROM {Sql.Entity<LayerDomain>():T} 
                    INNER JOIN {Sql.Entity<TableInfo>():T}
                        ON {nameof(LayerDomain.table_id):TC} = {Sql.Entity<TableInfo>(x => x.id):TC}
                    WHERE {nameof(LayerDomain.layer_id):TC} = {layer.id}", (d, t) =>
                    {
                        d.table = t;
                        return d;
                    },
                    splitOn: $"{nameof(LayerDomain.table_id)}");
                IDictionary<string, IEnumerable<IDictionary<string, object>>> domains_values =
                    new Dictionary<string, IEnumerable<IDictionary<string, object>>>();
                foreach (var domain in domains)
                {
                    domains_values.Add(
                        layer.table.columns.FirstOrDefault(x => x.id == domain.column_id)?.column_name ?? "",
                        session.Query(@$"SELECT * FROM {domain.table.table_schema}.{domain.table.table_name} ORDER BY id")
                            .Select(x => (IDictionary<string, object>)x)
                    );
                }
                return domains_values;
            }
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
                                var domainData = session.Query<DomainViewModel>(@$"SELECT {keyColummn.column_name} AS id, {labelColumn.column_name} AS mo_ta 
                                                FROM {table_domain.table_schema}.{table_domain.table_name} ORDER BY {keyColummn.column_name}").ToList();
                                domains_values.Add(
                                        table.columns.FirstOrDefault(x => x.id == column_lookup.id)?.column_name ?? "",
                                        domainData
                                    );
                            }
                            else
                            {
                                var domainData = session.Query<DomainViewModel>($"SELECT * FROM {table_domain.table_schema}.{table_domain.table_name} ORDER BY {keyColummn.column_name}").ToList();
                                domains_values.Add(
                                    table.columns.FirstOrDefault(x => x.id == column_lookup.id)?.column_name ?? "",
                                    domainData
                                );
                            }
                        }
                    }
                }
                return domains_values;
            }
        }

        /// <summary>
        /// Get domains of the field
        /// </summary>
        /// <param name="column"></param>
        /// <returns></returns>
        protected virtual IEnumerable<DomainViewModel> getTableShortData(int table_id, string? q = "", string[]? district_codes = null, int skip = 0, int take = 0)
        {
            using (var session = OpenSession())
            {
                var table = getTableAndColumns(table_id, false, true);
                if (table != null)
                {
                    TableColumn? keyColumn = table.key_column ?? table.identity_column;
                    TableColumn? labelColumn = table.label_column ?? keyColumn;
                    string condition = $"{keyColumn?.column_name} IS NOT NULL";
                    if (!string.IsNullOrWhiteSpace(q) && table.columns.Count(x => x.column_name.Equals("search_content")) > 0)
                    {
                        condition += $" AND search_content @@ to_tsquery(@q)";
                    }
                    if (district_codes?.Length > 0 && table.columns.Count(x => x.column_name.Equals("district_code")) > 0)
                    {
                        condition += $" AND district_code = ANY(@district_codes)";
                    }
                    if (keyColumn != null && labelColumn != null)
                    {
                        string sql = @$"
                            SELECT {keyColumn?.column_name} AS {nameof(DomainViewModel.id)}, 
                                   {labelColumn.column_name} AS {nameof(DomainViewModel.mo_ta)} 
                            FROM {table.table_schema}.{table.table_name} WHERE {condition}
                            ORDER BY {labelColumn?.column_name}";
                        if (take > 0)
                        {
                            sql += @$" LIMIT {take} OFFSET {skip}";
                        }
                        return session.Query<DomainViewModel>(sql, new
                        {
                            q = q?.ToFullTextString(),
                            district_codes
                        });
                    }
                }
                return new List<DomainViewModel>();
            }
        }

        /// <summary>
        /// Get domains of the field
        /// </summary>
        /// <param name="column"></param>
        /// <returns></returns>
        protected virtual int CountTableShortData(int table_id, string? q = "", string[]? district_codes = null)
        {
            using (var session = OpenSession())
            {
                var table = getTableAndColumns(table_id, false, true);
                if (table != null)
                {
                    TableColumn? keyColumn = table.key_column ?? table.identity_column;
                    TableColumn? labelColumn = table.label_column ?? keyColumn;
                    string condition = $"{keyColumn?.column_name} IS NOT NULL";
                    if (!string.IsNullOrWhiteSpace(q) && table.columns.Count(x => x.column_name.Equals("search_content")) > 0)
                    {
                        condition += $" AND search_content @@ to_tsquery(@q)";
                    }
                    if (district_codes?.Length > 0 && table.columns.Count(x => x.column_name.Equals("district_code")) > 0)
                    {
                        condition += $" AND district_code = ANY(@district_codes)";
                    }
                    if (keyColumn != null && labelColumn != null)
                    {
                        string sql = @$"
                            SELECT COUNT({keyColumn?.column_name}) AS total
                            FROM {table.table_schema}.{table.table_name} WHERE {condition}";
                        return session.Query<int>(sql, new
                        {
                            q = q?.ToFullTextString(),
                            district_codes
                        }).FirstOrDefault();
                    }
                }
                return 0;
            }
        }

        protected virtual RelationviewModel getDataRelation(Layer layer, TableRelation relation)
        {
            using (var session = OpenSession())
            {
                if (layer != null)
                {
                    var sql = "";
                    if (relation.mediate_table != null)
                    {
                        sql = $@"SELECT ctg.*,tb.id AS row_id from {relation.relation_table.table_schema}.{relation.relation_table.table_name} AS ctg
                            LEFT JOIN {relation.mediate_table.table_schema}.{relation.mediate_table.table_name} AS md 
                                ON ctg.id = md.{relation.relation_column.column_name}
                            LEFT JOIN {relation.table.table_schema}.{relation.table.table_name} as tb 
                                ON tb.id = md.{relation.table_column.column_name}";
                    }
                    else
                    {
                        sql = $@"SELECT rtb.*, tb.{relation.table_column.column_name} AS row_id from {relation.relation_table.table_schema}.{relation.relation_table.table_name} AS rtb
                            LEFT JOIN {relation.table.table_schema}.{relation.table.table_name} as tb 
                                ON tb.{relation.table_column.column_name} = rtb.{relation.relation_column.column_name}";
                    }
                    var on_select = session.Query<RelationSelected>(sql);

                    var list = session.Query<CategoryBaseEntity>(@$"
                        SELECT * FROM {relation.relation_table.table_schema}.{relation.relation_table.table_name} 
                        WHERE id != 0");
                    return new RelationviewModel()
                    {
                        items = list,
                        selected = on_select
                    };
                }
                return new RelationviewModel();
            }
        }

        /// <summary>
        /// Get relations of table
        /// </summary>
        /// <param name="table"></param>
        /// <param name="isBacktracking">Does get backwards relations</param>
        /// <returns></returns>
        protected virtual IEnumerable<TableRelation> getRelations(TableInfo table, bool? isBacktracking = false)
        {
            using (var session = OpenSession())
            {
                if (table != null)
                {
                    string condition = @$"tr.{nameof(TableRelation.table_id)} = {table.id}";
                    if (isBacktracking.HasValue && isBacktracking.Value)
                    {
                        condition += $@" OR tr.{nameof(TableRelation.relation_table_id)} = {table.id}";
                    }
                    string sss = $@"SELECT 
                            tr.*, 
                            c.{nameof(TableColumn.id)}, c.{nameof(TableColumn.name_vn)}, c.{nameof(TableColumn.column_name)},
                            rc.{nameof(TableColumn.id)}, rc.{nameof(TableColumn.name_vn)}, rc.{nameof(TableColumn.column_name)}, 
                            t.{nameof(TableInfo.id)}, t.{nameof(TableInfo.name_vn)}, t.{nameof(TableInfo.table_name)}, t.{nameof(TableInfo.table_schema)}, 
                            m.{nameof(TableInfo.id)}, m.{nameof(TableInfo.name_vn)}, 
                            rt.{nameof(TableInfo.id)}, rt.{nameof(TableInfo.name_vn)},  rt.{nameof(TableInfo.table_name)}, rt.{nameof(TableInfo.table_schema)}
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
                        ON tr.{nameof(TableRelation.relation_table_id)} = rt.{nameof(TableInfo.id)} WHERE {condition}";
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
                        //relation.relation_data = getDataRelation(layer, relation);
                    }
                    return relations.OrderBy(x => x.extra_fields.Count());
                }
                return new List<TableRelation>();
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        protected virtual IEnumerable<TableRelation> getAllRelations()
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
                        ON tr.{nameof(TableRelation.relation_table_id)} = rt.{nameof(TableInfo.id)}";

                IEnumerable<TableRelation> relations = session.Query<TableRelation, TableColumn, TableColumn, TableInfo, TableInfo, TableInfo, TableRelation>(sss, (r, c, rc, t, m, rt) =>
                {
                    r.table_column = c;
                    r.relation_column = rc;
                    r.table = t;
                    r.mediate_table = m;
                    r.relation_table = rt;
                    return r;
                },
                    splitOn: $"{nameof(TableColumn.id)}, {nameof(TableColumn.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}, {nameof(TableInfo.id)}");
                foreach (var relation in relations)
                {
                    relation.extra_fields = session.Find<TableColumn>(statement => statement
                        .Where($"{nameof(TableColumn.id)} NOT IN ({relation.table_column_id}, {relation.relation_table_column_id}) AND {nameof(TableColumn.table_id)} = {relation.mediate_table_id}")
                    );
                }
                return relations;
            }
        }

        /// <summary>
        ///  Get relations of layer
        /// </summary>
        /// <param name="layer_id"></param>
        /// <returns></returns>
        protected virtual IEnumerable<TableRelation> getRelations(int layer_id)
        {
            Layer? layer = getLayerWithTableAndColumn(layer_id);
            if (layer == null)
                return new List<TableRelation>();
            return getRelations(layer.table);
        }

        private object?[] parseJArray(JArray jArray) => jArray.Select(item => item.Value<object>()).ToArray();

        /// <summary>
        /// 
        /// </summary>
        /// <param name="table"></param>
        /// <param name="parameter"></param>
        /// <returns></returns>
        protected virtual string getConditions(TableInfo table, IDictionary<string, object>? parameter, bool byPassFilter = false)
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
                var attr_name = _key.Replace("_start", "").Replace("_dateStart", "")
                    .Replace("_end", "").Replace("_dateEnd", "");
                if (columns.Select(x => x.column_name).Contains(attr_name))
                {
                    // parameter[_key] != null && !string.IsNullOrWhiteSpace(parameter[_key]?.ToString()) &&
                    var col = columns.Where(x => x.column_name == attr_name).FirstOrDefault();
                    if (col != null)
                    {
                        if (parameter[_key] == null)
                        {
                            conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IS NULL");
                        }
                        else if (string.IsNullOrWhiteSpace(parameter[_key]?.ToString()))
                        {
                            conditions.Add($"\"{table.table_name}\".\"{col.column_name}\"::TEXT = ''");
                        }
                        else if (col.column_name == "district_code" || col.column_name == "commune_code" || col.column_name == "province_code")
                        {
                            if (parameter[col.column_name] is JArray)
                            {
                                if ((parameter[col.column_name] as JArray).Count > 0)
                                {
                                    var areaIds = parseJArray((JArray)parameter[col.column_name]);
                                    if (areaIds != null && areaIds.Count() > 0)
                                    {
                                        conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({string.Join(",", areaIds.Select(o => $"'{o}'"))})");
                                    }
                                }
                            }
                            else if (parameter[col.column_name]?.ToString()?.Split(",").Length > 0)
                            {
                                var areaIds = parameter[col.column_name]?.ToString()?.Split(",");
                                if (areaIds != null && areaIds.Count() > 0)
                                {
                                    conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({string.Join(",", areaIds.Select(o => $"'{o}'"))})");
                                }
                            }
                        }
                        else if (col.lookup_table_id > 0)
                        {
                            if (col.data_type == EnumPgDataType.Text || col.data_type == EnumPgDataType.String)
                            {
                                if (parameter[_key] is JArray)
                                {
                                    if ((parameter[_key] as JArray).Count > 0)
                                    {
                                        var ids = parseJArray((JArray)parameter[_key]);
                                        if (ids != null && ids.Count() > 0)
                                        {
                                            conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({string.Join(",", ids.Select(o => $"'{o}'"))})");
                                        }
                                    }
                                }
                                else
                                {
                                    var categories = parameter[_key].ToString().Split(",").ToList();
                                    if (categories.Count() > 0)
                                    {
                                        conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({String.Join(",", categories.Select(o => $"'{o}'"))})");
                                    }
                                }
                            }
                            else
                            {
                                conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({parameter[_key]})");
                            }
                        }
                        else if (col.data_type == EnumPgDataType.SmallInt || col.data_type == EnumPgDataType.Integer || col.data_type == EnumPgDataType.Double)
                        {
                            string rangeCondition = "(1=1";
                            if (parameter.ContainsKey(col.column_name + "_start") && parameter[col.column_name + "_start"].ToString() != "0")
                            {
                                rangeCondition += $" AND \"{table.table_name}\".\"{col.column_name}\" >= {parameter[col.column_name + "_start"]}";
                            }
                            if (parameter.ContainsKey(col.column_name + "_end") && parameter[col.column_name + "_end"].ToString() != "0")
                            {
                                rangeCondition += $" AND \"{table.table_name}\".\"{col.column_name}\" <= {parameter[col.column_name + "_end"]}";
                            }
                            rangeCondition += ")";
                            conditions.Add(rangeCondition);
                        }
                        else if (col.data_type == EnumPgDataType.Boolean)
                        {
                            conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({parameter[_key]})");
                        }
                        else if (col.data_type == EnumPgDataType.Date || col.data_type == EnumPgDataType.DateTime || col.data_type == EnumPgDataType.DateTimeTZ)
                        {
                            var subCons = new List<string>();

                            if (parameter.Keys.Contains(attr_name + "_dateStart") && DateTime.TryParse(parameter[attr_name + "_dateStart"]?.ToString(), out DateTime dateStart))
                            {
                                if (col.data_type == EnumPgDataType.DateTime || col.data_type == EnumPgDataType.DateTimeTZ)
                                {
                                    subCons.Add($"\"{table.table_name}\".\"{col.column_name}\" >= to_timestamp('{dateStart:dd-MM-yy HH:mm:ss}','DD-MM-YY HH24:mi:SS')");
                                }
                                else if (col.data_type == EnumPgDataType.Date)
                                {
                                    subCons.Add($"\"{table.table_name}\".\"{col.column_name}\" >= to_timestamp('{dateStart:dd-MM-yy}','DD-MM-YY')");
                                }
                            }
                            if (parameter.Keys.Contains(attr_name + "_dateEnd") && DateTime.TryParse(parameter[attr_name + "_dateEnd"]?.ToString(), out DateTime dateEnd))
                            {
                                if (col.data_type == EnumPgDataType.DateTime || col.data_type == EnumPgDataType.DateTimeTZ)
                                {
                                    subCons.Add($"\"{table.table_name}\".\"{col.column_name}\" <= to_timestamp('{dateEnd:dd-MM-yy HH:mm:ss}','DD-MM-YY HH24:mi:SS')");
                                }
                                else if (col.data_type == EnumPgDataType.Date)
                                {
                                    subCons.Add($"\"{table.table_name}\".\"{col.column_name}\" <= to_timestamp('{dateEnd:dd-MM-yy}','DD-MM-YY')");
                                }
                            }
                            if (subCons.Count() > 0)
                            {
                                conditions.Add($"({string.Join(" AND ", subCons)})");
                            }
                        }
                        else if (col.data_type == EnumPgDataType.Text || col.data_type == EnumPgDataType.String)
                        {
                            var cleanKw = parameter[_key].ToString()?.ToLower();
                            conditions.Add($"LOWER(\"{table.table_name}\".\"{col.column_name}\") = '{cleanKw}'");
                            // var searchKw = parameter[_key].ToString().ToFullTextStringProximity();
                            // conditions.Add($"{table.table_name}.search_content @@ to_tsquery('{searchKw}')");
                        }
                    }
                }
                else if (_key == "textSearch" && parameter[_key] != null && string.IsNullOrWhiteSpace(parameter[_key].ToString()) == false)
                {
                    string kw = parameter[_key].ToString();
                    string cleanKw = kw.ToFullTextStringProximity();
                    if (kw.Contains(" "))
                    {
                        conditions.Add($"\"{table.table_name}\".search_content @@ to_tsquery('{cleanKw}')");
                    }
                    else
                    {
                        conditions.Add($"\"{table.table_name}\".search_content @@ phraseto_tsquery('{kw.RemoveVietNameseSign()}')");
                    }
                }
                else if (_key == "geomSearch" && !string.IsNullOrWhiteSpace(parameter[_key].ToString()))
                {
                    conditions.Add($"ST_Intersects(\"{table.table_name}\".geom, ST_SetSRID(ST_GeomFromGeoJSON('{parameter[_key]}'), 4326))");
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
            if (!(User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)) && byPassFilter == false)
            {
                using (var session = OpenSession())
                {
                    var userRegions = session.Find<UserRegion>(statement => statement
                       .Where($"{nameof(UserRegion.user_id)} = @id")
                       .WithParameters(new { id = getUserId() })
                       .Include<District>(x => x.LeftOuterJoin())
                    ).ToList();
                    if (userRegions != null && userRegions.Count() > 0)
                    {
                        if (columns.Where(x => x.column_name == "district_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 2) > 0)
                        {
                            conditions.Add($"(\"{table.table_name}\".district_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 2).Select(o => $"'{o.area_code}'"))}) OR \"{table.table_name}\".district_code IS NULL OR \"{table.table_name}\".district_code = '')");
                        }
                        if (columns.Where(x => x.column_name == "commune_code").FirstOrDefault() != null && userRegions.Count(x => x.area_type == 3) > 0)
                        {
                            conditions.Add($"(\"{table.table_name}\".commune_code IN ({string.Join(",", userRegions.Where(x => x.area_type == 3).Select(o => $"'{o.area_code}'"))}) OR \"{table.table_name}\".commune_code IS NULL OR \"{table.table_name}\".commune_code = '')");
                        }
                    }
                    else
                    {
                        conditions.Add("(1=0)");
                    }

                    if (User.IsInRole(EnumRoles.ADMINISTRATOR) == false)
                    {
                        var user = session.Find<ApplicationUser>(statement => statement
                            .Where($"{Sql.Entity<ApplicationUser>(p => p.Id):TC}=@id")
                            .WithParameters(new { id = getUserId() })
                        ).FirstOrDefault();
                        if (columns.Any(o => o.column_name == "is_approved") && columns.Any(o => o.column_name == "created_by"))
                        {
                            conditions.Add($"(is_approved = TRUE OR created_by = '{user?.UserName}')");
                        }
                    }
                }
            }
            return string.Join(" AND ", conditions);
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
                                        conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({String.Join(",", (parameter[_key] as JArray).Select(o => $"'{o}'"))})");
                                    }
                                    else
                                    {
                                        conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({String.Join(",", parameter[_key] as JArray)})");
                                    }
                                }
                            }
                            else
                            {
                                conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ('{parameter[_key]}')");
                            }
                        }
                        else if (col.column_name == "province_code" || col.column_name == "district_code" || col.column_name == "commune_code")
                        {
                            if (parameter[_key] is JArray)
                            {
                                if ((parameter[_key] as JArray).Count > 0)
                                {
                                    conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({String.Join(",", (parameter[_key] as JArray).Select(o => $"'{o}'"))})");
                                }
                            }
                            else
                            {
                                conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ('{parameter[_key]}')");
                            }
                        }
                        else if ((col.data_type == EnumPgDataType.SmallInt || col.data_type == EnumPgDataType.Integer || col.data_type == EnumPgDataType.Double) && col.lookup_table_id == 0)
                        {
                            conditions.Add($"(\"{table.table_name}\".\"{col.column_name}\" >= {parameter[col.column_name + "_start"]} AND \"{table.table_name}\".\"{col.column_name}\" <= {parameter[col.column_name + "_end"]})");
                        }
                        else if (col.data_type == EnumPgDataType.Boolean)
                        {
                            conditions.Add($"\"{table.table_name}\".\"{col.column_name}\" IN ({parameter[_key]})");
                        }
                        else if (col.data_type == EnumPgDataType.Date || col.data_type == EnumPgDataType.DateTime)
                        {
                            var dateStart = DateTime.Parse(parameter[attr_name + "_dateStart"]?.ToString());
                            var dateEnd = DateTime.Parse(parameter[attr_name + "_dateEnd"]?.ToString());
                            if (col.data_type == EnumPgDataType.DateTime)
                                conditions.Add($"(\"{table.table_name}\".\"{col.column_name}\" >= to_timestamp('{dateStart.ToString("dd-MM-yy HH:mm:ss")}','DD-MM-YY HH24:mi:SS') AND \"{table.table_name}\".\"{col.column_name}\" <= to_timestamp('{dateEnd.ToString("dd-MM-yy HH:mm:ss")}','DD-MM-YY HH24:mi:SS'))");
                            else if (col.data_type == EnumPgDataType.Date)
                                conditions.Add($"(\"{table.table_name}\".\"{col.column_name}\" >= to_timestamp('{dateStart.ToString("dd-MM-yy")}','DD-MM-YY') AND \"{table.table_name}\".\"{col.column_name}\" <= to_timestamp('{dateEnd.ToString("dd-MM-yy")}','DD-MM-YY'))");
                        }
                        else if (col.data_type == EnumPgDataType.String || col.data_type == EnumPgDataType.Text)
                        {
                            if (string.IsNullOrWhiteSpace(parameter[_key]?.ToString()) == false)
                            {
                                var cleanKw = parameter[_key].ToString().ToLower();
                                conditions.Add($"LOWER(\"{table.table_name}\".\"{col.column_name}\") = '{cleanKw}'");
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

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        protected virtual TableInfo? getTable(int id)
        {
            using (var session = OpenSession())
            {
                return session.Find<TableInfo>(statement => statement
                    .Where($"{Sql.Entity<TableInfo>(x => x.id):TC} = @id")
                    .WithParameters(new { id = id })
                ).FirstOrDefault();
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        protected virtual TableColumn? getColumn(int id)
        {
            using (var session = OpenSession())
            {
                return session.Find<TableColumn>(statement => statement
                    .Where($"{Sql.Entity<TableColumn>(x => x.id):TC} = @id")
                    .WithParameters(new { id = id })
                    .Include<TableInfo>(join => join.InnerJoin())
                ).FirstOrDefault();
            }
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
        /// 
        /// </summary>
        /// <param name="schema"></param>
        /// <param name="mapId"></param>
        /// <param name="keyword"></param>
        /// <param name="hasLayer"></param>
        /// <param name="filterIds"></param>
        /// <returns></returns>
        protected virtual IEnumerable<TableInfo> getTablesAndColumns(string? schema, int? mapId = 0, string? keyword = "", bool? hasLayer = false, int[]? filterIds = null)
        {
            using (var session = OpenSession())
            {
                string condition = "1=1";
                if (string.IsNullOrWhiteSpace(schema) == false)
                {
                    condition += $@" AND {Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema";
                }
                if (string.IsNullOrEmpty(keyword) == false)
                {
                    condition += $"AND {Sql.Entity<TableInfo>()}.search_content @@ to_tsquery(@keyword)";
                }
                if (mapId.HasValue && mapId.Value > 0)
                {
                    List<int> tableIds = session.Find<MapTables>(statement => statement
                            .Where($"{nameof(MapLayers.map_id)} = @mapId")
                            .WithParameters(new { mapId })
                        ).Select(x => x.table_id).ToList();
                    List<int> tableHasLayerIds = new List<int>();
                    if (hasLayer.HasValue && hasLayer.Value)
                    {
                        string sql = $@"SELECT {Sql.Entity<TableInfo>(x => x.id):TC} FROM {Sql.Entity<TableInfo>():T}  
                                        LEFT JOIN {Sql.Entity<Layer>():T} ON {Sql.Entity<TableInfo>(x => x.id):TC} = {Sql.Entity<Layer>(x => x.table_info_id):TC} 
                                        LEFT JOIN {Sql.Entity<MapLayers>():T} ON {Sql.Entity<Layer>(x => x.id):TC} = {Sql.Entity<MapLayers>(x => x.layer_id):TC}
                                        WHERE {Sql.Entity<MapLayers>(x => x.map_id):TC} = @mapId";
                        tableHasLayerIds = session.Query<int>(sql, new { mapId = mapId }).ToList();
                    }
                    if (tableIds.Count() > 0)
                    {
                        condition += $" AND {Sql.Entity<TableInfo>(x => x.id):TC} IN ({string.Join(",", tableIds.Concat(tableHasLayerIds))})";
                    }
                    else
                    {
                        condition += $" AND FALSE";
                    }
                }
                if (filterIds?.Length > 0)
                {
                    condition += $" AND {Sql.Entity<TableInfo>(x => x.id):TC} = ANY(@filterIds)";
                }
                return session.Find<TableInfo>(statement => statement
                        .Where($"{condition}")
                        .WithParameters(new
                        {
                            schema = schema,
                            mapId = mapId,
                            keyword = keyword.ToFullTextString(),
                            filterIds
                        })
                        .Include<TableColumn>(join => join.LeftOuterJoin())
                        .OrderBy($"{Sql.Entity<TableColumn>(x => x.order):TC}")
                    );
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="table"></param>
        /// <param name="param"></param>
        /// <returns></returns>
        protected virtual IDictionary<string, string> getJoinTableRelation(TableInfo table, IDictionary<string, object>? param = null)
        {
            var relations = getRelations(table);
            param = param == null ? new Dictionary<string, object>() : param;
            string leftJoin = string.Empty;
            var where = new List<string>();
            where.Add("(1=1)");
            var result = new Dictionary<string, string>();
            foreach (var relation in relations)
            {
                if (relation.mediate_table != null)
                {
                    if (param.ContainsKey(relation.mediate_table.table_name))
                    {
                        var keyColumn = table.key_column ?? table.identity_column;
                        leftJoin += $@"INNER JOIN {relation.mediate_table.table_schema}.{relation.mediate_table.table_name} 
                                ON {relation.mediate_table.table_schema}.{relation.mediate_table.table_name}.{relation.table_column.column_name} = {table.table_schema}.{table.table_name}.{keyColumn.column_name} 
                               INNER JOIN {relation.relation_table.table_schema}.{relation.relation_table.table_name} 
                                ON {relation.relation_table.table_schema}.{relation.relation_table.table_name}.id = {relation.mediate_table.table_schema}.{relation.mediate_table.table_name}.{relation.relation_column.column_name} ";
                        where.Add($"{relation.relation_table.table_name}.id IN ({param[relation.mediate_table.table_name]})");
                    }
                }
            }
            result.Add("leftJoin", leftJoin);
            result.Add("searchWhere", string.Join(" AND ", where));
            return result;
        }

        protected virtual List<UserColumn> ListUserColumns(ISession session)
        {
            List<UserColumn> userColumns = session.Find<UserColumn>(statement => statement
                .Where($"{nameof(UserColumn.user_id)}=@userId")
                .WithParameters(new { userId = getUserId() })
            ).ToList();
            return userColumns;
        }
    }
}
