using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.CMS.Controllers.Base
{
    [Authorize]
    [Area(nameof(Module.CMS))]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class _BaseController : Controller
    {
        private readonly IDbFactory _dbFactory;

        public _BaseController(IDbFactory dbFactory)
        {
            _dbFactory = dbFactory;

            using var session = _dbFactory.Create<INpgsqlSession>();

            VietGIS.Infrastructure.GlobalConfiguration.ApplicationName = session.Get(new WebOption { option_name = "site_name" })?.option_value ?? "";
            VietGIS.Infrastructure.GlobalConfiguration.ApplicationLogo = session.Get(new WebOption { option_name = "site_logo" })?.option_value ?? "";
            VietGIS.Infrastructure.GlobalConfiguration.ApplicationDescription = session.Get(new WebOption { option_name = "site_description" })?.option_value ?? "";
        }
    }
}
