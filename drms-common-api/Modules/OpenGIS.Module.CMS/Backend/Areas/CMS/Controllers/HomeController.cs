using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.CMS.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.CMS.Controllers
{
    [Route("[controller]")]
    public class HomeController : _BaseController
    {
        private readonly IAuthenticationSchemeProvider _authenticationSchemeProvider;

        public HomeController(IDbFactory dbFactory, IAuthenticationSchemeProvider authenticationSchemeProvider)
            : base(dbFactory)
        {
            _authenticationSchemeProvider = authenticationSchemeProvider;
        }

        [HttpGet("/")]
        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet("accessDenied")]
        public IActionResult AccessDenied()
        {
            return View();
        }

        [HttpGet("logout")]
        public async Task Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }
    }
}
