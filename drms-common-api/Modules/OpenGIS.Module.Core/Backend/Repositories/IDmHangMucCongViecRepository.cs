using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IDmHangMucCongViecRepository : IRepository<DmHangMucCongViec, int>
    {

    }

    public class DmHangMucCongViecRepository : Repository<DmHangMucCongViec, int>, IDmHangMucCongViecRepository
    {
        public DmHangMucCongViecRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}