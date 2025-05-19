using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace OpenGIS.Module.DRMS.Areas.DRMS.Controllers
{
    [Authorize]
    [Area(nameof(Module.DRMS))]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("drms")]
    public class DRMSController : Controller
    {
        [Route("kich-ban")]
        public IActionResult KichBan()
        {
            return View("KichBan");
        }
        // [Route("tai-lieu")]
        // public IActionResult TaiLieu()
        // {
        //     return View("TaiLieu");
        // }
        // [Route("ban-do")]
        // public IActionResult BanDo()
        // {
        //     return View("BanDo");
        // }
    }
}