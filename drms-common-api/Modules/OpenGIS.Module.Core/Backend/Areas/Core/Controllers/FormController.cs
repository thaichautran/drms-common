using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Controllers
{
    [Route("bieu-mau")]
    public class FormController : _BaseController
    {
        public FormController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        public IActionResult Index([FromQuery] string? tableSchema, [FromQuery] string? returnUrl)
        {
            ViewBag.returnUrl = returnUrl;
            return View();
        }
    }
}