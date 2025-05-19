using System.Threading.Tasks;
using AspNetCore.Proxy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/martin")]
    public class MartinController : BaseController
    {
        private readonly IConfiguration _configurationManager;
        public MartinController(IDbFactory dbFactory, IConfiguration configurationManager) : base(dbFactory)
        {
            _configurationManager = configurationManager;
        }

        [HttpGet("{**rest}")]
        [AllowAnonymous]
        public Task ProxyCatchAll(string rest)
        {
            // If you don't need the query string, then you can remove this.
            var queryString = this.Request.QueryString.Value;
            return this.HttpProxyAsync($"{_configurationManager.GetValue<string>("Hosts:Martin")}/{rest}{queryString}");
        }
    }
}