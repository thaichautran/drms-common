using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using OpenGIS.Module.Core.ViewModels.Routing;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Repositories
{
    public interface IRouteRepository : IRepository<RouteSegment, int>
    {
        Task<IEnumerable<RoutingSegment>> GetRoutingResult(double lat1, double lng1, double lat2, double lng2);
        Task<IEnumerable<RouteDirectionArrow>> GetSegmentArrow(string overviewLine, List<DirectionPoint> directionPoints);
    }

    public class RouteRepository : Repository<RouteSegment, int>, IRouteRepository
    {
        public RouteRepository(IDbFactory factory) : base(factory)
        { }

        public async Task<IEnumerable<RoutingSegment>> GetRoutingResult(double lat1, double lng1, double lat2, double lng2)
        {
            using (var session = Factory.Create<INpgsqlSession>())
            {
                return await session.QueryAsync<RoutingSegment>(@"
                    SELECT *
                    FROM public.wrk_fromatob_safe(
                        CAST(@lat1 AS numeric),
                        CAST(@lng1 AS numeric),
                        CAST(@lat2 AS numeric),
                        CAST(@lng2 AS numeric),
                        TRUE
                    )
                    ORDER BY seq;",
    new { lat1, lng1, lat2, lng2 });

            }
        }

        public async Task<IEnumerable<RouteDirectionArrow>> GetSegmentArrow(string overviewLine, List<DirectionPoint> directionPoints)
        {
            var pointsQuery = string.Join(",",
            directionPoints.Select((dp, index) =>
                $"ST_SetSRID(ST_MakePoint({dp.lng}, {dp.lat}), 4326)"
                )
            );
            var directions = directionPoints.Select(dp => dp.direction).ToList();

            var parameters = new DynamicParameters();
            parameters.Add("encoded_route", overviewLine);
            parameters.Add("directions", directions.ToArray());

            using (var session = Factory.Create<INpgsqlSession>())
            {
                return await session.QueryAsync<RouteDirectionArrow>($@"
                    SELECT ST_AsEncodedPolyline(geom,6) encoded_line, direction maneuver
                    FROM split_linestring_by_direction_points(
                        @encoded_route, 
                        ARRAY[{pointsQuery}], 
                        @directions
                    )", parameters);
            }
        }
    }
}

