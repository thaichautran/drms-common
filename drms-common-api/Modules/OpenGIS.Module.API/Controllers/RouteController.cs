using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Services;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models.DevExtreme;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using OpenGIS.Module.Core.ViewModels.Routing;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/route")]
    public class RouteController : BaseViewController<INpgsqlSession>
    {
        private readonly IRouteService _routeService;
        public RouteController(IDbFactory dbFactory, IMapper mapper, IRouteService routeService)
            : base(dbFactory, mapper)
        {
            _routeService = routeService;
        }

        [HttpGet("directions")]
        public async Task<RestBase> GetRouting([FromQuery] string origin, [FromQuery] string destination)
        {
            return new RestData
            {
                data = await _routeService.GetDirectionResult(origin, destination)
            };
        }



        [HttpPost("update-state-ways")]
        public async Task<RestBase> UpdateWay([FromBody] UpdateWayDTO dto)
        {
            using var session = OpenSession();
            using var uow = new UnitOfWork(DbFactory, session);
            await uow.Connection.ExecuteAsync($"UPDATE routing.ways SET enabled = @enabled WHERE ST_Intersects(geom, ST_GeomFromGeoJSON(@geojson))", new
            {
                enabled = dto.enabled,
                geojson = dto.boundary,
            });
            return new RestBase(EnumErrorCode.OK);
        }
    }

    public class UpdateWayDTO
    {
        public string? boundary { get; set; }
        public bool enabled { get; set; }
    }
}
