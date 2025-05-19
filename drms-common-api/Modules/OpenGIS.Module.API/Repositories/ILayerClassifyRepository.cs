using Dapper.FastCrud;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Extensions;

namespace VietGIS.Infrastructure.Repositories.Implements
{
    public interface ILayerClassifyRepository : IRepository<LayerClassify, long>
    {
    }

    public class LayerRepository : Repository<LayerClassify, long>, ILayerClassifyRepository
    {
        public LayerRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}