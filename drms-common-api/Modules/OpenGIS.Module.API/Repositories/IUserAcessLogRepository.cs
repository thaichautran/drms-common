using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.API.Repositories
{
    public interface IUserAccessLogRepository : IRepository<UserAccessLog, int>
    {

    }

    public class UserAccessLogRepository : Repository<UserAccessLog, int>, IUserAccessLogRepository
    {
        public UserAccessLogRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}
