using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IKeHoachKiemTraRepository : IRepository<KeHoachKiemTra, int>
    {
    }
    public class KeHoachKiemTraRepository : Repository<KeHoachKiemTra, int>, IKeHoachKiemTraRepository
    {
        public KeHoachKiemTraRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}