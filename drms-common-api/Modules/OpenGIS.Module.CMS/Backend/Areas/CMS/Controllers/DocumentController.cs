using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.CMS.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.CMS.Controllers
{
    [Route("van-ban-phap-luat")]
    public class DocumentController : _BaseController
    {
        public DocumentController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }
    }
}