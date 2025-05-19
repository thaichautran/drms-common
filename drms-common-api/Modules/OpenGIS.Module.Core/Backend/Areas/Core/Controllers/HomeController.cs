using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Controllers
{
    [Route("core/home")]
    public class HomeController : _BaseController
    {
        public HomeController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [AllowAnonymous]
        [HttpGet("error-with-code/{code}")]
        public IActionResult ErrorWithCode([FromRoute] int code)
        {
            return View($"~/Views/Shared/{code}.cshtml");
        }
    }
}