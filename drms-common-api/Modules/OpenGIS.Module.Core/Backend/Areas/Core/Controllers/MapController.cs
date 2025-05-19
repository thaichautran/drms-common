using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Controllers
{
    [Route("[area]/[controller]")]
    public class MapController : _BaseController
    {
        public MapController(IDbFactory dbFactory) : base(dbFactory)
        {
        }
    }
}