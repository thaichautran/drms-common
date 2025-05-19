using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IProcessProblemRepository : IRepository<ProcessProblem, int>
    {
    }
    public class ProcessProblemRepository : Repository<ProcessProblem, int>, IProcessProblemRepository
    {
        public ProcessProblemRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}