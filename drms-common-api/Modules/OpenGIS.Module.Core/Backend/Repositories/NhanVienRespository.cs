using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;

namespace OpenGIS.Module.Core.Repositories
{
    public interface INhanVienRepository : IRepository<NhanVien, int>
    {
    }
    public class NhanVienRepository : Repository<NhanVien, int>, INhanVienRepository
    {
        public NhanVienRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}