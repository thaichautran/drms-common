using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.API.Repositories
{
    public interface IUserNotificationRepository : IRepository<UserNotification, int>
    {

    }

    public class UserNotificationRepository : Repository<UserNotification, int>, IUserNotificationRepository
    {
        public UserNotificationRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}
