using AutoMapper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Identity.DbContexts;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.Managers;
using VietGIS.Infrastructure.Identity.Services;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Options;
using VietGIS.Infrastructure.Web;
using OpenGIS.Module.Core.Areas.Core.Controllers.Base;
using VietGIS.Infrastructure.Identity.ViewModels;
using VietGIS.Infrastructure.Identity.Models;

namespace OpenGIS.Module.Core.Areas.Core.Controllers.Api
{
    [Area(nameof(OpenGIS.Module.Core))]
    [Route("api/auth")]
    public class AuthController : ApiBaseController
    {
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly ApplicationDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AuditableSignInManager<ApplicationUser> _auditableSignInManager;
        private readonly IAuthenticationSchemeProvider _schemeProvider;
        private readonly IOptions<EmailOptions> _emailOptions;
        private readonly ISmsSender _smsSender;
        private readonly IEmailSender _emailSender;
        private readonly IRazorViewRenderer _razorViewRenderer;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

        public AuthController(
            IDbFactory dbFactory,
            IMapper mapper,
            ApplicationDbContext dbContext,
            IOptions<EmailOptions> emailOptions,
            UserManager<ApplicationUser> userManager,
            IWebHostEnvironment hostEnvironment,
            AuditableSignInManager<ApplicationUser> signInManager,
            IAuthenticationSchemeProvider schemeProvider,
            Microsoft.Extensions.Configuration.IConfiguration configuration,
            ISmsSender smsSender, IEmailSender emailSender, IRazorViewRenderer razorViewRenderer) : base(dbFactory, mapper)
        {
            _hostEnvironment = hostEnvironment;
            _dbContext = dbContext;
            _userManager = userManager;
            _auditableSignInManager = signInManager;
            _schemeProvider = schemeProvider;
            _emailOptions = emailOptions;
            _smsSender = smsSender;
            _emailSender = emailSender;
            _razorViewRenderer = razorViewRenderer;
            _configuration = configuration;
        }
        [HttpPost]
        [Route("change-password")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IdentityResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            if (ModelState.IsValid)
            {
                if (model.ConfirmNewPasswd.Equals(model.NewPasswd) == false)
                    return IdentityResult.Failed(new IdentityError()
                    { Code = "password_not_valid", Description = "Mật khẩu mới không trùng nhau" });
                var user = await _userManager.FindByNameAsync(HttpContext.User.Identity?.Name);
                if (user == null)
                    return IdentityResult.Failed(new IdentityError()
                    { Code = "user_not_found", Description = "Tài khoản không tồn tại" });
                if (await _userManager.CheckPasswordAsync(user, model.OldPasswd))
                {
                    return await _userManager.ChangePasswordAsync(user, model.OldPasswd, model.NewPasswd);
                }
                else
                {
                    return IdentityResult.Failed(new IdentityError()
                    { Code = "password_not_match", Description = "Mật khẩu cũ không trùng khớp" });
                }
            }

            //
            return IdentityResult.Failed(new IdentityError()
            { Code = "missing_parameters", Description = "Vui lòng nhập đầy đủ thông tin" });
        }
        [HttpGet("user")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<RestBase> Info()
        {
            try
            {
                if (User.Identity?.IsAuthenticated == false)
                {
                    return new RestError(-1, "Không tìm thấy thông tin tài khoản");
                }
                var name = User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Name);

                if (name == null)
                {
                    return new RestError(-1, "Không tìm thấy thông tin tài khoản");
                }

                var user = await _userManager.FindByNameAsync(name.Value);
                var userView = Mapper.Map<ApplicationUser.View>(user);
                return new RestData() { data = userView };
            }
            catch (Exception e)
            {
                return new RestError(e);
            }

        }

        /// <summary>
        /// Handle postback from username/password login
        /// </summary>
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<RestBase> Login([FromBody] LoginViewModel model)
        {
            if (ModelState.IsValid)
            {
                ApplicationUser user;
                //
                if (StringHelper.isEmail(model.username))
                {
                    user = await _userManager.FindByEmailAsync(model.username);
                }
                else if (StringHelper.isNumber(model.username))
                {
                    string phone = PhoneHelper.NormalizeWithZero(model.username);
                    user = await _userManager.FindByNameAsync(phone);
                }
                else
                {
                    user = await _userManager.FindByNameAsync(model.username);
                }

                if (user != null)
                {
                    var result = await _auditableSignInManager.PasswordSignInAsync(user.UserName, model.password,
                        model.rememberLogin, lockoutOnFailure: true);
                    if (result.Succeeded)
                    {
                        var tokenHandler = new JwtSecurityTokenHandler();
                        var key = Encoding.ASCII.GetBytes("x81xvo6u6w862ycvd2tt1qe1fr62uvsd");
                        var tokenDescriptor = new SecurityTokenDescriptor
                        {
                            Subject = new ClaimsIdentity(new Claim[]
                            {
                                new Claim(ClaimTypes.Name, user.UserName),
                                new Claim(ClaimTypes.NameIdentifier, user.Id),
                                new Claim(ClaimTypes.Role, (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? EnumRoles.USER),
                                // new Claim(ClaimTypes.NameIdentifier,userInfo.LoaiTaiKhoan.ToString()),
                                // new Claim("user_id",userInfo.Id.ToString())
                            }),
                            Expires = DateTime.UtcNow.AddDays(7),
                            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                        };
                        JwtSecurityToken token = tokenHandler.CreateToken(tokenDescriptor) as JwtSecurityToken;

                        // discover endpoints from metadata
                        // var client = new HttpClient();
                        // var disco = await client.GetDiscoveryDocumentAsync(new DiscoveryDocumentRequest
                        // {
                        //     Address = _configuration["Authentication:OIDC:Authority"],
                        //     Policy =
                        //     {
                        //         RequireHttps = false
                        //     }
                        // });
                        // if (disco.IsError)
                        // {
                        //     return new RestError(-1, disco.Error);
                        // }

                        // IDictionary<string, string> parameters = new Dictionary<string, string>();

                        // parameters.Add("username", model.username);
                        // parameters.Add("password", model.password);

                        // // request token
                        // var tokenResponse = await client.RequestPasswordTokenAsync(new PasswordTokenRequest
                        // {
                        //     Address = "http://localhost:7096/connect/token", // disco.TokenEndpoint,    //     ClientId = _configuration["Authentication:OIDC:ClientId"],
                        //     ClientSecret = _configuration["Authentication:OIDC:ClientSecret"],    //     UserName = model.username,
                        //     Password = model.password,
                        // });

                        // if (tokenResponse.IsError)
                        // {
                        //     return new RestError(-1, tokenResponse.Error);
                        // }

                        // return new RestData
                        // {
                        //     data = Mapper.Map<UserInfoView>(Mapper.Map<ApplicationUser.View>(user))
                        // };

                        return new RestData
                        {
                            data = new
                            {
                                access_token = token.RawData
                            }
                        };
                    }
                    else if (result.IsLockedOut)
                    {
                        return new RestError(400, "Tài khoản bị khoá!");
                    }
                    else
                    {
                        return new RestError();
                    }
                }

                // await _events.RaiseAsync(new UserLoginFailureEvent(model.username, "invalid credentials"));

                return new RestError(-1, "Thông tin đăng nhập không hợp lệ.");
            }

            return new RestError();
        }

        [HttpGet("logout")]
        public async Task<JsonResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            // await HttpContext.SignOutAsync("oidc");
            return new JsonResult(new RestBase(EnumErrorCode.OK));
        }
    }
}
