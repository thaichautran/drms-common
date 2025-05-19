using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IThongTinTraoDoiKiemTraRepository : IRepository<ThongTinTraoDoiKiemTra, int>
    {
    }
    public class ThongTinTraoDoiKiemTraRepository : Repository<ThongTinTraoDoiKiemTra, int>, IThongTinTraoDoiKiemTraRepository
    {
        public ThongTinTraoDoiKiemTraRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}