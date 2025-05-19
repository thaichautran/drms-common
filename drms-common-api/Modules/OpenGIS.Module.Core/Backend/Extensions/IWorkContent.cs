using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Extensions
{
    public interface IWorkContext
    {
        Task<ApplicationUser?> GetCurrentUser();
        string? GetCurrentUserId();
        UserInfo? GetCurrentUserInfo();
        Task<bool> SendNotification(PushNotificationViewModel data);
        Task ClearSearchCacheAsync(TableInfo? table);
        Task ClearCacheKeysByPrefixAsync(string? cacheKey);
        bool UserInSARole();
        bool IsUserInRole(string role);
        T? GetCache<T>(string key) where T : class;
        long? GetCache(string key);
        void SetCache<T>(string key, T value, TimeSpan timeSpan) where T : class;
        void SetCache(string key, long value, TimeSpan timeSpan);
        Task<List<string>> ListNotifyUserIds();
    }
}
