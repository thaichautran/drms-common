using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Controllers
{
    [Route("/api/poi")]
    public class POIController : BaseController
    {
        public POIController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [HttpGet("reverse")]
        public RestBase Reverse([FromQuery] double lng, [FromQuery] double lat)
        {
            return new RestData
            {
                data = new
                {
                    buaname = ""
                }
            };
        }
    }
}
