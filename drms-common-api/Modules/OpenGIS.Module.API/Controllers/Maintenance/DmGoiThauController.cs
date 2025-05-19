using AutoMapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Controllers
{
    [Route("/api/ke-hoach/goi-thau")]
    public class DmGoiThauController : BaseController
    {
        public DmGoiThauController(IDbFactory dbFactory) : base(dbFactory)
        {
        }
        [HttpGet("list")]
        public RestBase List([FromQuery] string loaiKeHoach)
        {
            using var session = OpenSession();
            var condition = string.IsNullOrWhiteSpace(loaiKeHoach) ? "1=1" : "loaikehoach = @loaiKeHoach";
            return new RestData
            {
                data = session.Find<DmGoiThauViewModel>(x => x.Where($"{condition}").WithParameters(new
                {
                    loaiKeHoach
                }))
            };
        }
    }
}