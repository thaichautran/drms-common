using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using OpenGIS.Module.API.Repositories;
using OpenGIS.Module.Core.ViewModels.Routing;
using OpenGIS.Module.Core.Helpers;
using System.Linq;
using OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat;
using Dapper;

namespace OpenGIS.Module.API.Services
{
    public interface IRouteService
    {
        Task<IEnumerable<RoutingSegment>> GetDirectionResult(string origin, string destination, int num = 1);
    }

    public class RouteService : IRouteService
    {
        private readonly IRouteRepository _routeRepository;

        public RouteService(IRouteRepository routeRepository)
        {
            _routeRepository = routeRepository;
        }

        public async Task<IEnumerable<RoutingSegment>> GetDirectionResult(string origin, string destination, int num = 1)
        {
            if (string.IsNullOrWhiteSpace(origin) || string.IsNullOrWhiteSpace(destination))
            {
                return new List<RoutingSegment>();
            }

            float lng1, lat1, lng2, lat2;
            if (StringUtils.ParseCoordinateFromStringGoogleFormat(origin, out lng1, out lat1) &&
                StringUtils.ParseCoordinateFromStringGoogleFormat(destination, out lng2, out lat2))
            {
                var segmentList = await _routeRepository.GetRoutingResult(lat1, lng1, lat2, lng2);
                return segmentList.ToList();
            }
            else
            {
                return new List<RoutingSegment>();
            }

        }

        private async Task<IEnumerable<RouteDirectionArrow>> GetSegmentArrow(string overviewLine, List<StepGoogleFormat> steps)
        {
            var directionPoints = new List<DirectionPoint>();
            foreach (var step in steps)
            {
                if (step.start_location != null && step.maneuver != "Kết thúc")
                {
                    directionPoints.Add(new DirectionPoint
                    {
                        lng = step.start_location.lng,
                        lat = step.start_location.lat,
                        direction = step.maneuver
                    });
                }
            }
            var directionArrow = await _routeRepository.GetSegmentArrow(overviewLine, directionPoints);
            return directionArrow;
        }

    }
}
