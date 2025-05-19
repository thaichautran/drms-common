using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.CMS.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.CMS.Controllers
{
    [Route("ho-so-goi-thau")]
    public class HoSoGoiThauController : _BaseController
    {
        public HoSoGoiThauController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet("thu-muc")]
        public IActionResult Folder()
        {
            return View();
        }
        [HttpGet("ho-so")]
        public IActionResult Document()
        {
            return View();
        }
        [HttpGet("ban-do")]
        public IActionResult Map()
        {
            return View();
        }

        [HttpGet("bao-cao")]

        public IActionResult CommonReport()
        {
            return View();
        }

        [HttpGet("van-hanh")]

        public IActionResult Monitoring()
        {
            return View();
        }
    }
}