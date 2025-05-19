using Dapper.FastCrud;
using EasyCaching.Core;
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.ViewModels;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.Managers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.Core.Extensions
{
    public class WorkContext : IWorkContext
    {
        private const string UserGuidCookiesName = "SimplUserGuid";
        private const long GuestRoleId = 3;

        private ApplicationUser? _currentUser;
        private UserManager<ApplicationUser> _userManager;
        private HttpContext? _httpContext;
        private readonly IConfiguration _configuration;
        private readonly FirebaseApp? _fbApp;
        private readonly FirebaseMessaging _fbMess;
        private readonly IDbFactory _dbFactory;
        private readonly IEasyCachingProvider _cacheProvider;
        private readonly ILogger<WorkContext> _logger;

        public WorkContext(UserManager<ApplicationUser> userManager,
                           IHttpContextAccessor contextAccessor,
                           IConfiguration configuration,
                           IDbFactory dbFactory,
                            ILogger<WorkContext> logger,
                           IEasyCachingProviderFactory factory)
        {
            _userManager = (ApplicationUserManager)userManager;
            _httpContext = contextAccessor.HttpContext;
            _configuration = configuration;
            _dbFactory = dbFactory;
            _cacheProvider = factory.GetCachingProvider("redis1");
            _logger = logger;
            if (FirebaseApp.DefaultInstance == null)
            {
                var MockCredential = GoogleCredential.FromFile(Path.Combine("SecretKeys", "opengis-27f76-firebase-adminsdk-pp7m0-67647d4e81.json"));
                try
                {
                    FirebaseApp.Create(new AppOptions { Credential = MockCredential });
                }
                catch (Exception e)
                {
                    var message = e.Message;
                }
            }
            _fbApp = FirebaseApp.DefaultInstance;
            _fbMess = FirebaseMessaging.DefaultInstance;
        }
        public bool UserInSARole()
        {
            return _httpContext?.User != null ? _httpContext.User.IsInRole(EnumRoles.SA) : false;
        }

        public bool IsUserInRole(string role)
        {
            return _httpContext?.User != null ? _httpContext.User.IsInRole(role) : false;
        }
        public long? GetCache(string key)
        {
            var cacheValue = _cacheProvider.Get<long>(key);
            return cacheValue.HasValue ? cacheValue.Value : null;
        }
        public void SetCache(string key, long value, TimeSpan timeSpan)
        {
            _cacheProvider.Set(key, value, timeSpan);
        }
        public T? GetCache<T>(string key) where T : class
        {
            var cacheValue = _cacheProvider.Get<T>(key);
            return cacheValue.HasValue ? cacheValue.Value : default;
        }
        public void SetCache<T>(string key, T value, TimeSpan timeSpan) where T : class
        {
            _cacheProvider.Set(key, value, timeSpan);
        }
        public async Task<ApplicationUser?> GetCurrentUser()
        {
            if (_currentUser != null)
            {
                return _currentUser;
            }

            var contextUser = _httpContext?.User;
            _currentUser = await _userManager.GetUserAsync(contextUser);

            if (_currentUser != null)
            {
                return _currentUser;
            }

            var userGuid = GetUserGuidFromCookies();
            // if (userGuid.HasValue)
            // {
            //     _currentUser = _userRepository.Query().Include(x => x.Roles).FirstOrDefault(x => x.UserGuid == userGuid);
            // }

            // if (_currentUser != null && _currentUser.Roles.Count == 1 && _currentUser.Roles.First().RoleId == GuestRoleId)
            // {
            //     return _currentUser;
            // }

            // userGuid = Guid.NewGuid();
            // var dummyEmail = string.Format("{0}@guest.webhost.com", userGuid);
            // _currentUser = new ApplicationUser
            // {
            //     Id = userGuid,
            //     Email = dummyEmail,
            //     UserName = dummyEmail,
            // };
            // var abc = await _userManager.CreateAsync(_currentUser, "1qazZAQ!");
            // await _userManager.AddToRoleAsync(_currentUser, "guest");
            // SetUserGuidCookies();
            return _currentUser;
        }
        public UserInfo? GetCurrentUserInfo()
        {
            var session = _dbFactory.Create<INpgsqlSession>();
            return session.Get(new UserInfo { user_id = GetCurrentUserId() });
        }
        public async Task ClearSearchCacheAsync(TableInfo? table)
        {
            await ClearCacheKeysByPrefixAsync("advanced-search-" + "_" + table?.id + "_");
        }
        public async Task ClearCacheKeysByPrefixAsync(string? cacheKey)
        {
            var cache = await _cacheProvider.GetAllKeysByPrefixAsync(cacheKey);
            if (cache?.Count() > 0)
            {
                await _cacheProvider.RemoveAllAsync(cache);
            }
        }
        // public T? GetCache<T>(string cacheKey) where T : class
        // {
        //     var oldCache = _cacheProvider.Get<T>(cacheKey);

        //     if (oldCache.HasValue)
        //     {
        //         return oldCache.Value;
        //     }

        //     return null;
        // }
        // public void SetCache<T>(string cacheKey, T value) where T : class
        // {
        //     _cacheProvider.Set<T>(cacheKey, value, TimeSpan.FromMinutes(1));
        // }

        private Guid? GetUserGuidFromCookies()
        {
            if (_httpContext?.Request.Cookies.ContainsKey(UserGuidCookiesName) == true)
            {
                return Guid.Parse(_httpContext?.Request.Cookies[UserGuidCookiesName] ?? "");
            }

            return null;
        }
        private void SetUserGuidCookies()
        {
            // _httpContext.Response.Cookies.Append(UserGuidCookiesName, _currentUser.UserGuid.ToString(), new CookieOptions
            // {
            //     Expires = DateTime.UtcNow.AddYears(5),
            //     HttpOnly = true,
            //     IsEssential = true,
            //     SameSite = SameSiteMode.Strict
            // });
        }
        public string? GetCurrentUserId()
        {
            var principal = _httpContext?.User;
            //if (principal?.Claims != null)
            //{
            //    foreach (var claim in principal.Claims)
            //    {
            //    }
            //}
            return principal?.Claims?.FirstOrDefault(p => p.Type == "sub" || p.Type == ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        }
        public async Task<bool> SendNotification(PushNotificationViewModel data)
        {
            using (var session = _dbFactory.Create<INpgsqlSession>())
            {

                try
                {
                    var devicesToken = new List<string>();

                    string condition = $"(1=1)";
                    //Gửi thông báo cho các thiết bị đã lựa chọn
                    if (data?.user_id?.Count > 0)
                    {
                        condition += $" AND {Sql.Entity<ApplicationUserDeviceToken>(x => x.UserId):TC} = ANY(@user_id)";
                    }
                    var userDevices = (await session.FindAsync<ApplicationUserDeviceToken>(stm => stm
                                                  .Where($"{condition}")
                                                  .WithParameters(data)
                                                  .OrderBy($"{Sql.Entity<ApplicationUserDeviceToken>(x => x.Timestamp):TC} DESC")))
                                                  .ToList();

                    using var uow = new UnitOfWork(_dbFactory, session);
                    data.tokenMessIds = new List<TokenMessageIdViewModel>();
                    if (userDevices != null)
                    {
                        devicesToken.AddRange(userDevices.Select(x => x.DeviceToken));
                        foreach (var device in userDevices)
                        {
                            UserNotification item = new UserNotification
                            {
                                name = data?.title ?? "Thông báo",
                                content = data?.content,
                                url = "/notification",
                                type = data?.type ?? "notificaion",
                                app_url = "/notification",
                                data = data?.data ?? "{}",
                                icon_type = 1,
                                user_id = device.UserId,
                                sent_at = DateTime.Now,
                                device_received = device.DeviceToken
                            };
                            uow.Connection.Insert(item);
                            data.tokenMessIds.Add(new TokenMessageIdViewModel
                            {
                                token = device.DeviceToken,
                                messageId = item.id
                            });
                        }
                    }

                    //Gửi thông báo
                    return PushMultiNotification(data);
                }
                catch (Exception e)
                {
                    _logger.LogError(e.Message);
                    _logger.LogError(e.StackTrace);
                    return false;
                }
            }
        }
        public bool PushMultiNotification(PushNotificationViewModel model)
        {
            try
            {
                if (model.tokenMessIds != null && model.tokenMessIds.Count() > 0)
                {
                    var messages = new List<Message>();
                    foreach (var tokenMessId in model.tokenMessIds)
                    {
                        var data = new Dictionary<string, string>();
                        data["click_action"] = "FLUTTER_NOTIFICATION_CLICK";
                        data["sound"] = "default";
                        data["exist_condition"] = "";
                        data["same_procedure_condition"] = "";
                        data["message_id"] = tokenMessId.messageId.ToString();
                        messages.Add(new Message
                        {
                            Token = tokenMessId.token,
                            Notification = new Notification
                            {
                                Title = model.title,
                                Body = model.content,
                                // ImageUrl = "https://hanoi.vggisopen.com/_images/media/20240819_130625.jpg",
                            },
                            Data = data
                        });
                    }
                    Task<BatchResponse> task = _fbMess.SendEachAsync(messages);
                    task.Wait();
                    var response = task.Result;
                    if (response.FailureCount == model.tokenMessIds.Count)
                    {
                        return false;
                    }
                    return true;
                }
                return false;
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message);
                _logger.LogError(e.StackTrace);
                return false;
            }
        }

        public async Task<List<string>> ListNotifyUserIds()
        {
            return _userManager.Users.Where(o => o.Notification == true).Select(p => p.Id).ToList();
        }
    }
}
