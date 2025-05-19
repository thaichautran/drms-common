using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Controllers
{
    [Route("[controller]")]
    public class SystemController : _BaseController
    {
        public SystemController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [HttpGet("tables")]
        public IActionResult Tables()
        {
            return View();
        }

        [HttpGet("layers")]
        public IActionResult Layers()
        {
            return View();
        }

        [HttpGet("users")]
        public IActionResult Users()
        {
            return View();
        }

        [HttpGet("faq")]
        public IActionResult FAQ()
        {
            return View();
        }

        [HttpGet("contacts")]
        public IActionResult Contacts()
        {
            return View();
        }

        [HttpGet("sliders")]
        public IActionResult Sliders()
        {
            return View();
        }

        [HttpGet("posts")]
        public IActionResult Posts()
        {
            return View();
        }

        [HttpGet("documents")]
        public IActionResult Documents()
        {
            return View();
        }

        [HttpGet("home-items")]
        public IActionResult HomeItems()
        {
            return View();
        }

        [HttpGet("widget")]
        public IActionResult Widget()
        {
            return View();
        }

        [HttpGet("params")]
        public IActionResult Params()
        {
            return View();
        }

        [HttpGet("user-logs")]
        public IActionResult UserLogs()
        {
            return View();
        }

        [HttpGet("backup")]
        public IActionResult Backup()
        {
            return View();
        }

        [HttpGet("forms")]
        public IActionResult Forms([FromQuery] string? tableSchema, [FromQuery] string? returnUrl)
        {
            ViewBag.returnUrl = returnUrl;
            return View();
        }

        [HttpGet("category")]
        public IActionResult Category()
        {
            return View();
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet("maintenance")]
        public IActionResult Maintenance()
        {
            return View();
        }

        [HttpGet("map-config")]
        public IActionResult MapConfig()
        {
            return View();
        }
        [HttpGet("hdsd")]
        public IActionResult HDSD()
        {
            return View();
        }

        [HttpGet("home")]
        public IActionResult Home()
        {
            return View();
        }
    }
}