using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.CMS.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.CMS.Controllers
{
    [Route("[area]/[controller]")]
    public class MapController : _BaseController
    {
        public MapController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [HttpGet("")]
        public IActionResult Index([FromQuery] int? id)
        {
            ViewBag.mapId = id;
            return View();
        }

        [HttpGet("bao-cao")]
        public IActionResult Report([FromRoute] string schema, [FromQuery] int? mapId)
        {
            ViewBag.mapId = mapId;
            return View();
        }
    }
}