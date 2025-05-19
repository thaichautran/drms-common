using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Models.DTO.Response;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Helpers;
using Microsoft.AspNetCore.Identity;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.Managers;
using OpenGIS.Module.Core.ViewModels;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_TOKEN))]
    public class TokenController : Controller
    {
        private readonly IAntiforgery _antiforgery;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AuditableSignInManager<ApplicationUser> _signInManager;


        public TokenController(IAntiforgery antiforgery, UserManager<ApplicationUser> userManager,
            AuditableSignInManager<ApplicationUser> signInManager)
        {
            _antiforgery = antiforgery;
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [HttpGet("")]
        [IgnoreAntiforgeryToken]
        public RestData Generate()
        {
            var tokenSet = _antiforgery.GetTokens(HttpContext);

            return new RestData { data = tokenSet.RequestToken };
        }

        [HttpPost("")]
        public RestBase getTokens([FromBody] TokenRequestViewModel tokenRequest)
        {
            if ("guest".Equals(tokenRequest.grant_type))
            {
                string token = _userManager.GenerateNewAuthenticatorKey().ToLower();
                token = StringHelper.MD5Hash(token).ToLower();
                //
                return new RestData
                {
                    data = new
                    {
                        token_type = "guest",
                        guest_token = token
                    }
                };
            }
            else
            {
                return new RestError();
            }
        }
    }
}