using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance.ThoatNuoc;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IFloodedAreaScriptRepository : IRepository<FloodedAreaScript, int>
    {
    }
    public class FloodedAreaScriptRepository : Repository<FloodedAreaScript, int>, IFloodedAreaScriptRepository
    {
        public FloodedAreaScriptRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}