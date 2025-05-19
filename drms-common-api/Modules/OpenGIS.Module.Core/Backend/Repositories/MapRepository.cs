using Dapper;
using System;
using System.Linq;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Helpers;
using Dapper.FastCrud;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IMapRepository : IRepository<Map, int>
    {
        byte[] GetTile(string layerName, string schemaName, string viewName, string fieldNames, Rect rect, int x, int y, int z, string filter = " AND (1=1)");
        byte[] GetTile(string layerName, string schemaName, string viewName, string fieldNames, double xmin, double ymin, double xmax, double ymax, int x, int y, int z, string filter = " AND (1=1)");
        bool Save(Map map);
    }

    public class MapRepository : Repository<Map, int>, IMapRepository
    {
        public MapRepository(IDbFactory factory)
           : base(factory)
        {

        }

        public byte[] GetTile(string layerName, string schemaName, string viewName, string fieldNames, Rect rect, int x, int y, int z, string filter = " AND (1=1)")
        {
            if (string.IsNullOrWhiteSpace(viewName))
            {
                throw new Exception("Layer must have view name");
            }

            var sql = $@"SELECT ST_AsMVT(q,'{layerName}', 4096, 'geom')
                FROM (
                    SELECT
                        {fieldNames},
                        ST_AsMVTGeom(
                            geom,
                            TileBBox({z}, {x}, {y}, 4326),
                            4096,
                            0,
                            false
                        ) geom
                    FROM {schemaName}.{viewName}
                    WHERE (ST_Intersects(geom, ST_MakeEnvelope(@left, @bottom, @right, @top, 4326)) {filter})
                ) q";
            using (var session = Factory.Create<INpgsqlSession>())
            {
                return session.Query<byte[]>(sql, new { left = rect.Left, bottom = rect.Bottom, right = rect.Right, top = rect.Top }).FirstOrDefault();
            }
        }

        public byte[] GetTile(string layerName, string schemaName, string viewName, string fieldNames, double xmin, double ymin, double xmax, double ymax, int x, int y, int z, string filter = " AND (1=1)")
        {
            if (string.IsNullOrWhiteSpace(viewName))
            {
                throw new Exception("Layer must have view name");
            }

            var sql = $@"SELECT ST_AsMVT(q,'{layerName}', 4096, 'geom')
                FROM (
                    SELECT
                        {fieldNames},
                        ST_AsMVTGeom(
                            geom,
                            TileBBox({z}, {x}, {y}, 4326),
                            4096,
                            0,
                            false
                        ) geom
                    FROM {schemaName}.{viewName}
                    WHERE (ST_Intersects(geom, ST_MakeEnvelope({xmin},{ymin},{xmax},{ymax}, 4326)) {filter})
                ) q";
            using (var session = Factory.Create<INpgsqlSession>())
            {
                return session.Query<byte[]>(sql).FirstOrDefault();
            }
        }

        public bool Save(Map map)
        {
            using (var session = Factory.Create<INpgsqlSession>())
            {
                using (var uow = new UnitOfWork(Factory, session))
                {
                    if (map.id == 0)
                    {
                        map.id = SaveOrUpdate(map, uow);
                        if (map.id == 0)
                        {
                            return false;
                        }
                    }
                    else
                    {
                        Map? existMap = session.Get(new Map { id = map.id });
                        if (existMap == null)
                            return false;

                        existMap.name = map.name;
                        existMap.description = map.description;
                        existMap.center = map.center;
                        existMap.defaultzoom = map.defaultzoom;
                        existMap.minzoom = map.minzoom;
                        existMap.maxzoom = map.maxzoom;

                        map.id = SaveOrUpdate(existMap, uow);
                        // Xóa lớp nền, lớp dữ liệu cũ
                        session.Execute($"DELETE FROM {Sql.Entity<MapLayers>():T} WHERE {nameof(MapLayers.map_id)} = @id", existMap);
                        session.Execute($"DELETE FROM {Sql.Entity<MapBaseLayers>():T} WHERE {nameof(MapBaseLayers.map_id)} = @id", existMap);
                    }
                    // Lưu lớp nền , lớp dữ liệu của bản đồ mới
                    
                    if (map.mapBaseLayers != null && map.mapBaseLayers.Count() > 0)
                    {
                        foreach (MapBaseLayers mapBaseLayer in map.mapBaseLayers)
                        {
                            uow.Connection.Insert(new MapBaseLayers
                            {
                                base_layer_id = mapBaseLayer.base_layer_id,
                                map_id = map.id
                            });
                        }
                    }
                    return true;
                }
            }
        }
    }
}
