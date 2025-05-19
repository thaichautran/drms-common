using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IWorderRepository : IRepository<Worder, int>
    {
    }
    public class WorderRepository : Repository<Worder, int>, IWorderRepository
    {
        public WorderRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}