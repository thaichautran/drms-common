using System;
using System.Collections.Generic;
using System.Linq;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Helpers;
using Dapper.FastCrud;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Extensions;
using OpenGIS.Module.Core.Extensions;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IMapLayersRepository : IRepository<MapLayers, int>
    {
        IEnumerable<Layer> getLayersWithTableAndColumn(string schema = "", string keyword = "", int mapId = 0, bool returnFullInfo = true);
    }

    public class MapLayersRepository : Repository<MapLayers, int>, IMapLayersRepository
    {
        protected readonly IWorkContext _workContext;
        public MapLayersRepository(IDbFactory factory, IWorkContext workContext)
           : base(factory)
        {
            _workContext = workContext;
        }
        public IEnumerable<Layer> getLayersWithTableAndColumn(string schema = "", string keyword = "", int mapId = 0, bool returnFullInfo = true)
        {
            using (var session = Factory.Create<INpgsqlSession>())
            {
                List<string> conditions = new List<string>() { "1=1" };
                List<UserLayer> userLayers = new List<UserLayer>();
                List<UserTable> userTables = new List<UserTable>();
                List<UserColumn> userColumns = new List<UserColumn>();
                if (_workContext.IsUserInRole(EnumRoles.SA) == false && _workContext.IsUserInRole(EnumRoles.ADMINISTRATOR) == false)
                {
                    userLayers = session.Find<UserLayer>(statement => statement
                        .Where($"{nameof(UserLayer.user_id)}=@userId")
                        .WithParameters(new { userId = _workContext.GetCurrentUserId() })
                    ).ToList();
                    conditions.Add($"{Sql.Entity<Layer>(o => o.id):TC} = ANY(@userLayers)");

                    if (returnFullInfo)
                    {
                        userTables = session.Find<UserTable>(statement => statement
                            .Where($"{nameof(UserTable.user_id)}=@userId")
                            .WithParameters(new { userId = _workContext.GetCurrentUserId() })
                        ).ToList();
                        userColumns = session.Find<UserColumn>(statement => statement
                            .Where($"{nameof(UserColumn.user_id)}=@userId")
                            .WithParameters(new { userId = _workContext.GetCurrentUserId() })
                        ).ToList();

                        conditions.Add($"{Sql.Entity<TableInfo>(o => o.id):TC} = ANY(@userTables)");
                        conditions.Add($"({Sql.Entity<TableColumn>(o => o.id):TC} = ANY(@userColumns) OR {Sql.Entity<TableColumn>(o => o.is_identity):TC} = TRUE OR {Sql.Entity<TableColumn>(o => o.is_key):TC} = TRUE OR {Sql.Entity<TableColumn>(o => o.is_label):TC} = TRUE)");
                    }
                }
                if (string.IsNullOrWhiteSpace(schema) && mapId == 0)
                {
                    if (returnFullInfo)
                    {
                        return session.Find<Layer>(statement => statement
                            .Include<LayerGroup>(join => join.LeftOuterJoin())
                            .Include<TableInfo>()
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                            .Include<LayerClassify>()
                            .Where($"{String.Join(" AND ", conditions)}")
                            .WithParameters(new
                            {
                                userLayers = userLayers.Select(x => x.layer_id).ToArray(),
                                userTables = userTables.Select(x => x.table_id).ToArray(),
                                userColumns = userColumns.Select(x => x.column_id).ToArray()
                            })
                            .OrderBy(@$"{Sql.Entity<LayerGroup>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.order):TC}, 
                                {Sql.Entity<Layer>(x => x.name_vn):TC}, {Sql.Entity<TableColumn>(x => x.order):TC}, 
                                {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).ToList();
                    }
                    else
                    {
                        return session.Find<Layer>(statement => statement
                            .Where($"{String.Join(" AND ", conditions)}")
                            .WithParameters(new
                            {
                                userLayers = userLayers.Select(x => x.layer_id).ToArray(),
                            })
                            .OrderBy(@$"{Sql.Entity<Layer>(x => x.order):TC}")
                        ).ToList();
                    }
                }
                else
                {
                    if (!string.IsNullOrEmpty(schema))
                    {
                        var condition = $"{Sql.Entity<TableInfo>(x => x.table_schema):TC} = @schema ";

                        if (!string.IsNullOrEmpty(keyword))
                        {
                            condition += $"AND {Sql.Entity<TableInfo>()}.search_content @@ to_tsquery(@keyword)";
                        }

                        return session.Find<Layer>(statement => statement
                            .Include<LayerGroup>(join => join.LeftOuterJoin())
                            .Include<TableInfo>()
                            .Include<TableSchema>()
                            .Include<TableColumn>()
                            .Include<LayerClassify>()
                            .Where($"{condition} AND {string.Join(" AND ", conditions)}")
                            .WithParameters(new
                            {
                                schema = schema,
                                keyword = keyword?.ToFullTextString(),
                                userLayers = userLayers.Select(x => x.layer_id).ToArray(),
                                userTables = userTables.Select(x => x.table_id).ToArray(),
                                userColumns = userColumns.Select(x => x.column_id).ToArray()
                            })
                            .OrderBy(@$"{Sql.Entity<LayerGroup>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.order):TC}, 
                                {Sql.Entity<Layer>(x => x.name_vn):TC}, {Sql.Entity<TableColumn>(x => x.order):TC}, 
                                {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                        ).ToList();
                    }
                    else
                    {
                        List<int> layerIds = session.Find<MapLayers>(statement => statement
                            .Where($"{nameof(MapLayers.map_id)} = @mapId")
                            .WithParameters(new { mapId })
                        ).Select(x => x.layer_id).ToList();
                        string? condition = "(1 = 1)";
                        if (layerIds.Count() > 0)
                        {
                            condition += $" AND {Sql.Entity<Layer>(x => x.id):TC} IN ({string.Join(",", layerIds)})";
                        }
                        if (!string.IsNullOrEmpty(keyword))
                        {
                            condition += $" AND {Sql.Entity<TableInfo>()}.search_content @@ to_tsquery(@keyword)";
                        }
                        if (returnFullInfo)
                        {
                            return session.Find<Layer>(statement => statement
                                .Where($"{condition} AND {string.Join(" AND ", conditions)}")
                                .WithParameters(new
                                {
                                    mapId = mapId,
                                    keyword = keyword?.ToFullTextString(),
                                    userLayers = userLayers.Select(x => x.layer_id).ToArray(),
                                    userTables = userTables.Select(x => x.table_id).ToArray(),
                                    userColumns = userColumns.Select(x => x.column_id).ToArray()
                                })
                                .Include<LayerClassify>()
                                .Include<TableInfo>()
                                .Include<TableSchema>()
                                .Include<TableColumn>()
                                .OrderBy(@$"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC}, 
                                    {Sql.Entity<TableColumn>(x => x.order):TC}, {Sql.Entity<TableColumn>(x => x.name_vn):TC}")
                            ).ToList();
                        }else {
                            return session.Find<Layer>(statement => statement
                                .Where($"{condition} AND {string.Join(" AND ", conditions)}")
                                .WithParameters(new
                                {
                                    mapId = mapId,
                                    keyword = keyword?.ToFullTextString(),
                                    userLayers = userLayers.Select(x => x.layer_id).ToArray(),
                                })
                                .OrderBy(@$"{Sql.Entity<Layer>(x => x.order):TC}, {Sql.Entity<Layer>(x => x.name_vn):TC}")
                            ).ToList();
                        }
                    }
                }
            }
        }
    }
}
