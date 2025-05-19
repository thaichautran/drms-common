using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IProblemRepository : IRepository<Problem, int>
    {
    }
    public class ProblemRepository : Repository<Problem, int>, IProblemRepository
    {
        public ProblemRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}