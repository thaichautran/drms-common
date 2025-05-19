using AutoMapper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Identity.DbContexts;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.Managers;
using VietGIS.Infrastructure.Identity.Models;
using VietGIS.Infrastructure.Identity.Providers;
using VietGIS.Infrastructure.Identity.Services;
using VietGIS.Infrastructure.Identity.ViewModels;
using VietGIS.Infrastructure.Models.DTO;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Options;
using VietGIS.Infrastructure.Web;
using System.Net;
using System.Collections.Specialized;
using System.Text.RegularExpressions;
using System.Runtime.Versioning;
using System.Runtime.InteropServices;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using VietGIS.Infrastructure.Repositories.Session;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Controllers.Base;
using Microsoft.Extensions.Caching.Memory;
using OpenGIS.Module.Core.Extensions;

namespace OpenGIS.Module.Core.Controllers
{
    [Authorize]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("[controller]")]
    public class AccountController : _BaseController
    {
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly ApplicationDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AuditableSignInManager<ApplicationUser> _auditableSignInManager;
        private readonly IAuthenticationSchemeProvider _schemeProvider;
        private readonly IOptions<EmailOptions> _emailOptions;
        private readonly IEmailSender _emailSender;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
        private readonly IRazorViewRenderer _razorViewRenderer;
        private readonly IWorkContext _workContext;

        public AccountController(
            IDbFactory dbFactory,
            IMapper mapper,
            ApplicationDbContext dbContext,
            IOptions<EmailOptions> emailOptions,
            UserManager<ApplicationUser> userManager,
            IWebHostEnvironment hostEnvironment,
            AuditableSignInManager<ApplicationUser> signInManager,
            IAuthenticationSchemeProvider schemeProvider,
            Microsoft.Extensions.Configuration.IConfiguration configuration,
            IWorkContext workContext,
            IEmailSender emailSender, IRazorViewRenderer razorViewRenderer)
            : base(dbFactory)
        {
            _mapper = mapper;
            _hostEnvironment = hostEnvironment;
            _dbContext = dbContext;
            _userManager = userManager;
            _auditableSignInManager = signInManager;
            _schemeProvider = schemeProvider;
            _emailOptions = emailOptions;
            _emailSender = emailSender;
            _configuration = configuration;
            _razorViewRenderer = razorViewRenderer;
            _workContext = workContext;
        }

        [HttpGet("info")]
        public async Task<JsonResult> Info()
        {
            if (User.Identity?.IsAuthenticated == false)
            {
                return Json(new RestError(-1, "Không tìm thấy thông tin tài khoản"));
            }
            var user = await _userManager.FindByNameAsync(User.Identity?.Name);
            var userView = _mapper.Map<ApplicationUser.View>(user);
            // userView.role = ResolveRoleName((await _userManager.GetRolesAsync(user)).FirstOrDefault());

            if (userView.avatar_path.IsNull())
            {
                userView.avatar_path = "/public/user/no_image_user.png";
            }
            else
            {
                userView.avatar_path = Path.Combine(GlobalConfiguration.CDNUrl, "cache/240x240", userView.avatar_path);
            }
            return Json(new RestData() { data = userView });
        }

        /// <summary>
        /// Show login page
        /// </summary>
        [AllowAnonymous]
        [HttpGet("Login")]
        public async Task<IActionResult> Login(string? returnUrl)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                return Redirect("/");
            }
            // build a model so we know what to show on the login page
            var vm = await BuildLoginViewModelAsync(returnUrl ?? "");

            if (vm.isExternalLoginOnly)
            {
                // we only have one option for logging in and it's an external provider
                return await ExternalLogin(vm.ExternalLoginScheme!, returnUrl ?? "");
            }

            return View(vm);
        }

        /// <summary>
        /// Handle postback from username/password login
        /// </summary>
        [AllowAnonymous]
        [HttpPost("Login")]
        // [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login([FromBody] LoginInputViewModel model)
        {
            string guestToken = getGuestToken();
            // if (string.IsNullOrWhiteSpace(guestToken) == false)
            // {
            //     long attemp = _workContext.GetCache($"{guestToken}_attemp") ?? 0;
            //     long endTimestamp = _workContext.GetCache($"{guestToken}_endblock") ?? 0;
            //     if (endTimestamp > 0 && attemp >= 5)
            //     {
            //         if (DateTimeOffset.Now.ToUnixTimeSeconds() >= endTimestamp)
            //         {
            //             _workContext.SetCache($"{guestToken}_attemp", 0, TimeSpan.FromHours(1));
            //             _workContext.SetCache($"{guestToken}_endblock", 0, TimeSpan.FromHours(1));
            //         }
            //         else
            //         {
            //             return new JsonResult(new RestError(223, $"Đăng nhập sai quá nhiều. Vui lòng thử lại sau ít phút."));
            //         }
            //     }
            // }
            // else
            // {
            //     return new JsonResult(new RestError(224, $"Thông tin đăng nhập không hợp lệ."));
            // }

            if (ModelState.IsValid)
            {
                ApplicationUser? user = null;
                //
                model.username = StringHelper.Normalize(model.username, "_");
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
                        // _workContext.SetCache($"{guestToken}_attemp", 0, TimeSpan.FromHours(1));
                        // _workContext.SetCache($"{guestToken}_endblock", 0, TimeSpan.FromHours(1));
                        //
                        await _userManager.ResetAccessFailedCountAsync(user);

                        return new JsonResult(new RestData
                        {
                            data = new
                            {
                                returnUrl = "/"
                            }
                        });
                    }
                    else if (result.IsLockedOut)
                    {
                        return new JsonResult(new RestError(218, "Tài khoản đã bị khóa. Vui lòng liên hệ với quản trị viên!"));
                    }
                    else if (result.IsNotAllowed)
                    {
                        return new JsonResult(new RestError(219, "Tài khoản không được phép truy cập. Vui lòng liên hệ với quản trị viên!"));
                    }
                    else if (result.RequiresTwoFactor)
                    {
                        return new JsonResult(new RestError(220, "Vui lòng xác thực 2FA trước khi đăng nhập!"));
                    }
                    else
                    {
                        if (user.AccessFailedCount == _userManager.Options.Lockout.MaxFailedAccessAttempts - 1)
                        {
                            // await _userManager.SetLockoutEnabledAsync(user, true);
                            // await _userManager.SetLockoutEndDateAsync(user, DateTime.Now.AddMinutes(_userManager.Options.Lockout.DefaultLockoutTimeSpan.TotalMinutes));
                            return new JsonResult(new RestError(221, $"Tài khoản đã bị khóa do đăng nhập sai quá {_userManager.Options.Lockout.MaxFailedAccessAttempts} lần. Vui lòng thử lại sau {_userManager.Options.Lockout.DefaultLockoutTimeSpan.TotalMinutes} phút"));
                        }
                        else
                        {
                            await _userManager.AccessFailedAsync(user);
                            return new JsonResult(new RestError(400, $"{AccountOptions.InvalidCredentialsErrorMessage}"));
                        }
                    }
                }
            }

            // if (string.IsNullOrWhiteSpace(guestToken) == false)
            // {
            //     long attemp = _workContext.GetCache($"{guestToken}_attemp") ?? 0;
            //     _workContext.SetCache($"{guestToken}_attemp", attemp + 1, TimeSpan.FromHours(1));
            //     if (attemp + 1 >= 5)
            //     {
            //         _workContext.SetCache($"{guestToken}_endblock", DateTimeOffset.Now.AddMinutes(5).ToUnixTimeSeconds(), TimeSpan.FromHours(1));
            //     }
            // }

            return new JsonResult(new RestError(400, $"{AccountOptions.InvalidCredentialsErrorMessage}"));
        }

        // [AllowAnonymous]
        // [HttpGet("getToken")]
        // public async Task<RestBase> getToken(LoginInputModel model)
        // {
        //     var client = new HttpClient();
        //     var disco = await client.GetDiscoveryDocumentAsync(new DiscoveryDocumentRequest
        //     {
        //         Address = _configuration["Authentication:OIDC:Authority"],
        //         Policy =
        //                 {
        //                     RequireHttps = false
        //                 }
        //     });
        //     if (disco.IsError)
        //     {
        //         return new RestError(-1, disco.Error);
        //     }

        //     IDictionary<string, string> parameters = new Dictionary<string, string>();

        //     parameters.Add("username", model.username);
        //     parameters.Add("password", model.password);

        //     // request token
        //     var tokenResponse = await client.RequestPasswordTokenAsync(new PasswordTokenRequest
        //     {
        //         Address = disco.TokenEndpoint,

        //         ClientId = _configuration["Authentication:OIDC:ClientId"],
        //         ClientSecret = _configuration["Authentication:OIDC:ClientSecret"],

        //         UserName = model.username,
        //         Password = model.password,
        //     });

        //     if (tokenResponse.IsError)
        //     {
        //         return new RestError(-1, tokenResponse.Error);
        //     }

        //     return new RestData
        //     {
        //         data = tokenResponse.TokenType + " " + tokenResponse.AccessToken
        //     };
        // }
        /// <summary>
        /// Login callback
        /// </summary>
        [HttpGet]
        public IActionResult LoggedIn()
        {
            return View();
        }

        [HttpGet("lockOut")]
        public IActionResult LockOut()
        {
            return View();
        }
        public IActionResult Index()
        {
            return View();
        }
        /// <summary>
        /// initiate roundtrip to external authentication provider
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ExternalLogin(string provider, string returnUrl)
        {
            if (AccountOptions.WindowsAuthenticationSchemeName == provider)
            {
#if Windows
                // windows authentication needs special handling
                return await ProcessWindowsLoginAsync(returnUrl);
#else
                return await Task.FromResult(NotFound());
#endif
            }
            else
            {
                // start challenge and roundtrip the return URL and 
                var props = new AuthenticationProperties()
                {
                    RedirectUri = Url.Action("ExternalLoginCallback"),
                    Items =
                    {
                        {"returnUrl", returnUrl},
                        {"scheme", provider},
                    }
                };
                return Challenge(props, provider);
            }
        }

        /// <summary>
        /// Show logout page
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> Logout(string logoutId)
        {
            // build a model so the logout page knows what to display
            var vm = await BuildLogoutViewModelAsync(logoutId);

            if (vm.ShowLogoutPrompt == false)
            {
                // if the request for logout was properly authenticated from IdentityServer, then
                // we don't need to show the prompt and can just log the user out directly.
                return await Logout(vm);
            }

            return View(vm);
        }

        /// <summary>
        /// Handle logout page postback
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout(LogoutInputModel model)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                // delete local authentication cookie
                await _auditableSignInManager.SignOutAsync();
            }

            return View("LoggedOut");
        }

        [HttpPost("forgot-password")]
        [ValidateAntiForgeryToken]
        [AllowAnonymous]
        public async Task<RestBase> ForgotPassword([FromForm] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return new RestError(-1, "Không được để trống email");
            }
            else
            {
                ApplicationUser? user = null;
                if (StringHelper.isEmail(email))
                {
                    user = await _userManager.FindByEmailAsync(email);
                }
                if (user != null)
                {
                    var token = await _userManager.GenerateUserTokenAsync(user, TokenOptions.DefaultEmailProvider, "Change_Passwd");
                    var links = HttpContext.RequestServices.GetRequiredService<LinkGenerator>();
                    var serviceUrl = links.GetUriByAction(HttpContext, nameof(AccountController.ResetPassword), "Account", new { Email = user.Email, Token = token });
                    await _emailSender.SendEmailAsync(user.Email, "Cài lại mật khẩu", await _razorViewRenderer.RenderViewToStringAsync("_ForgotPasswordEmail", new VietGIS.Infrastructure.Identity.ViewModels.ResetPasswordViewModel
                    {
                        Email = user.Email,
                        Url = serviceUrl
                    }), GlobalConfiguration.ApplicationName);
                }

                return new RestData
                {
                    data = "Đã gửi email, vui lòng kiếm tra hộp thư"
                };
            }
        }

        [HttpGet]
        [AllowAnonymous]
        [Route("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromQuery] string Token, [FromQuery] string Email)
        {
            if (string.IsNullOrWhiteSpace(Token) || string.IsNullOrWhiteSpace(Email))
                return NotFound();

            ApplicationUser? user = null;
            if (StringHelper.isEmail(Email))
            {
                user = await _userManager.FindByEmailAsync(Email);
            }
            if (user == null)
            {
                return NotFound();
            }
            if (await _userManager.VerifyUserTokenAsync(user, TokenOptions.DefaultEmailProvider, "Change_Passwd", Token) == false)
            {
                return NotFound();
            }
            ViewBag.Token = Token;
            ViewBag.Email = Email;
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        [Route("reset-password")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword([FromForm] string Token, [FromForm] string Email,
            [FromForm] string NewPassword, [FromForm] string ConfirmNewPassword)
        {
            if (string.IsNullOrWhiteSpace(Token) || string.IsNullOrWhiteSpace(Email))
            {
                return Json(new RestError(-1, "Dữ liệu đầu vào không hợp lệ!"));
            }
            if (string.IsNullOrWhiteSpace(NewPassword) || string.IsNullOrWhiteSpace(ConfirmNewPassword))
            {
                return Json(new RestError(-1, "Dữ liệu đầu vào không hợp lệ!"));
            }
            if (NewPassword.Equals(ConfirmNewPassword) == false)
            {
                return Json(new RestError(-1, "Mật khẩu mới không trùng khớp!"));
            }
            var user = await _userManager.FindByEmailAsync(Email);
            if (user == null)
            {
                return Json(new RestError(-1, "Dữ liệu đầu vào không hợp lệ!"));
            }
            if (await _userManager.CheckPasswordAsync(user, NewPassword))
            {
                return Json(new RestError(400, "Mật khẩu trùng với mật khẩu cũ! Vui lòng nhập lại."));
            }
            Token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, Token, NewPassword);
            if (result == IdentityResult.Success)
            {
                return Json(new RestBase(EnumErrorCode.OK));
            }
            else
            {
                return Json(new RestError(-1, "Thay đổi mật khẩu thất bại!"));
            }
        }

        [HttpPost]
        [Route("change-password")]
        [Authorize]
        public async Task<IdentityResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            if (ModelState.IsValid)
            {
                if (model.ConfirmNewPasswd.Equals(model.NewPasswd) == false)
                    return IdentityResult.Failed(new IdentityError()
                    { Code = "password_not_valid", Description = "Mật khẩu mới không trùng nhau" });
                var user = await _userManager.FindByNameAsync(User.Identity?.Name);
                if (user == null)
                    return IdentityResult.Failed(new IdentityError()
                    { Code = "user_not_found", Description = "Tài khoản không tồn tại" });
                if (await _userManager.CheckPasswordAsync(user, model.OldPasswd))
                {
                    if (!(await _userManager.CheckPasswordAsync(user, model.NewPasswd)))
                    {
                        return await _userManager.ChangePasswordAsync(user, model.OldPasswd, model.NewPasswd);
                    }
                    else
                    {
                        return IdentityResult.Failed(new IdentityError()
                        { Code = "duplicate_password", Description = "Mật khẩu mới trùng với mật khẩu cũ! Kiểm tra lại." });
                    }
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

        [HttpGet("accessDenied")]
        public IActionResult AccessDenied(string? ReturnUrl)
        {
            return View();
        }

        /*****************************************/
        /* helper APIs for the AccountController */
        /*****************************************/
        private async Task<ViewModels.LoginViewModel> BuildLoginViewModelAsync(string returnUrl)
        {
            return new ViewModels.LoginViewModel
            {
                allowRememberLogin = AccountOptions.AllowRememberLogin,
                returnUrl = returnUrl,
            };
        }

        private async Task<ViewModels.LoginViewModel> BuildLoginViewModelAsync(LoginInputViewModel model)
        {
            var vm = await BuildLoginViewModelAsync(model.returnUrl);
            vm.accessFailedCount = model.accessFailedCount;
            vm.username = model.username;
            vm.rememberLogin = model.rememberLogin;
            return vm;
        }

        private async Task<LogoutViewModel> BuildLogoutViewModelAsync(string logoutId)
        {
            var vm = new LogoutViewModel { LogoutId = logoutId, ShowLogoutPrompt = AccountOptions.ShowLogoutPrompt };

            if (User.Identity?.IsAuthenticated != true)
            {
                // if the user is not authenticated, then just show logged out page
                vm.ShowLogoutPrompt = false;
                return vm;
            }

            // show the logout prompt. this prevents attacks where the user
            // is automatically signed out by another malicious web page.
            return vm;
        }

        [HttpGet]
        [Route("Logout")]
        public async Task<IActionResult> LogOut()
        {
            if (User.Identity?.IsAuthenticated == false || User.Identity == null)
            {
                return RedirectToAction(nameof(Login), "Account");
            }

            var user = await _userManager.FindByNameAsync(User.Identity?.Name);
            // await _userManager.RemoveClaimsAsync(user, await _userManager.GetClaimsAsync(user));
            await _userManager.UpdateSecurityStampAsync(user);
            await _auditableSignInManager.SignOutAsync();
            if (Request.Cookies != null)
            {
                Request.Cookies.ToList().ForEach(cookie =>
                {
                    Response.Cookies.Delete(cookie.Key);
                });
            }
            //_logger.LogInformation(4, "User logged out.");
            //HttpContext.Session.SetString("RolePermissionUser", "");
            //AuthHelper.refresh();
            return Redirect("/");
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                // return RedirectToAction(nameof(HomeController.Index), "Home");
                return Redirect("/");
            }
        }

        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO model)
        {
            if (User.Identity == null)
            {
                return new JsonResult(new RestError(-1, "Người dùng không tồn tại!"));
            }

            var user = await _userManager.FindByNameAsync(User.Identity?.Name);
            if (!await _userManager.CheckPasswordAsync(user, model.password))
            {
                ModelState.AddModelError("OldPassword-Confirm", "Mật khẩu cũ không đúng!");
            }
            if (ModelState.IsValid)
            {
                if (!await _userManager.CheckPasswordAsync(user, model.password))
                {
                    return Json(new RestError(400, "Mật khẩu trùng với mật khẩu cũ! Vui lòng nhập lại."));
                }
                else
                {
                    var result = await _userManager.ChangePasswordAsync(user, model.password, model.confirm_password);
                    if (result.Succeeded)
                    {
                        return Json(new RestError(EnumErrorCode.OK));
                    }
                    else
                    {
                        foreach (var item in result.Errors)
                        {
                            if (item.Code == "PasswordTooShort")
                            {
                                item.Description = "Mật khẩu phải có ít nhất 8 ký tự.";
                            }
                            if (item.Code == "PasswordRequiresLower")
                            {
                                item.Description = "Mật khẩu phải có ít nhất một chữ thường ('a' - 'z').";
                            }
                            if (item.Code == "PasswordRequiresUpper")
                            {
                                item.Description = "Mật khẩu phải có ít nhất một chữ hoa ('A' - 'Z').";
                            }
                            if (item.Code == "PasswordRequiresDigit")
                            {
                                item.Description = "Mật khẩu phải có ít nhất một chữ số ('0' - '9').";
                            }
                            if (item.Code == "PasswordMismatch")
                            {
                                item.Description = "Mật khẩu cũ không đúng";
                            }
                        }
                        //ModelState.AddModelError("", "Mật khẩu không hợp lệ\nMật khẩu phải có cả chữ hoa, chữ thường và số");
                        return Json(new
                        {
                            status = EnumErrorCode.ERROR,
                            errors = result.Errors.Select(s => new RestErrorDetail()
                            {
                                message = s.Description
                            }).ToArray()
                        });
                    }
                }
            }
            else
            {
                var errors = new List<RestErrorDetail>();
                foreach (var item in ModelState.Values.Where(y => y.Errors.Count() > 0))
                {
                    errors.AddRange(item.Errors.Select(x => new RestErrorDetail { message = x.ErrorMessage }).ToList());
                }
                return Json(new RestError
                {
                    errors = errors.ToArray()
                });
            }
        }
        private static string ResolveRoleName(string name)
        {
            switch (name)
            {
                case EnumRoles.USER:
                    return "Người dùng";
                case EnumRoles.ADMINISTRATOR:
                    return "Quản trị viên";
                case EnumRoles.SA:
                    return "Quản trị cấp cao";
                default: return "";
            }
        }

        // private async Task<RestBase> AddUserDeviceTokenAsync(string userName, string token)
        // {
        //     try
        //     {
        //         using (var session = OpenSession())
        //         {
        //             if (!string.IsNullOrEmpty(token))
        //             {
        //                 var user = await _userManager.FindByNameAsync(userName);
        //                 string userId = user.Id;
        //                 if (string.IsNullOrEmpty(userId))
        //                     return new RestError(-1, "Người dùng không tồn tại!");
        //                 var itemExisted = (await session.FindAsync<ApplicationUserDeviceToken>(stm => stm.Where($"{Sql.Entity<ApplicationUserDeviceToken>(x => x.UserId):TC} = @userId AND {Sql.Entity<ApplicationUserDeviceToken>(x => x.DeviceToken):TC} = @token")
        //                                                 .WithParameters(new { token = token, userId }))).FirstOrDefault();
        //                 if (itemExisted == null)
        //                 {
        //                     await session.BulkDeleteAsync<ApplicationUserDeviceToken>(stm => stm
        //                                 .Where($"{Sql.Entity<ApplicationUserDeviceToken>(x => x.UserId):TC} = @userId AND {Sql.Entity<ApplicationUserDeviceToken>(x => x.Platform):TC} = 'website'").WithParameters(new { userId }));

        //                     var item = new ApplicationUserDeviceToken()
        //                     {
        //                         UserId = userId,
        //                         Platform = "website",
        //                         DeviceName = "website_device",
        //                         Timestamp = DateTime.Now,
        //                         DeviceToken = token
        //                     };

        //                     await session.InsertAsync(item);
        //                     return new RestBase(EnumErrorCode.OK);
        //                 }
        //                 else
        //                 {
        //                     return new RestError(-1, "Token đã tồn tại!");
        //                 };

        //             }
        //             else
        //             {
        //                 return new RestError(-1, "Không tìm thấy bản ghi!");
        //             };
        //         }
        //     }
        //     catch (Exception e)
        //     {
        //         return new RestError(-1, e.Message);
        //     }
        // }

    }
}
