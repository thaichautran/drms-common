using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.API.Repositories
{
    public interface IAPIShareRepository : IRepository<APIShare, int>
    {

    }

    public class APIShareRepository : Repository<APIShare, int>, IAPIShareRepository
    {
        public APIShareRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}
