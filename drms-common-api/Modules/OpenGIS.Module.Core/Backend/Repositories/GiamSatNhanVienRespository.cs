using Dapper.FastCrud;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System.Linq;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IWorkerSupervisionRepository : IRepository<GiamSatNhanVien, int>
    {
    }
    public class GiamSatNhanVienRepository : Repository<GiamSatNhanVien, int>, IWorkerSupervisionRepository
    {
        public GiamSatNhanVienRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}