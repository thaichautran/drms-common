using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.CMS.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.CMS.Controllers
{
    [Route("bao-cao-thong-ke")]
    public class StatisticReportController : _BaseController
    {
        public StatisticReportController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }
    }
}