using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IFeatureFileRepository : IRepository<FeatureFile, int>
    {

    }

    public class FeatureFileRepository : Repository<FeatureFile, int>, IFeatureFileRepository
    {
        public FeatureFileRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}