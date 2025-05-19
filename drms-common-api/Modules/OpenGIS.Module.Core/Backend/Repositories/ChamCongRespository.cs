using Dapper.FastCrud;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System.Linq;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IChamCongRepository : IRepository<ChamCong, int>
    {
        public bool isExistItem(ChamCong item);
    }
    public class ChamCongRepository : Repository<ChamCong, int>, IChamCongRepository
    {
        public ChamCongRepository(IDbFactory factory) : base(factory)
        {
        }
        public bool isExistItem(ChamCong item)
        {
            using var session = Factory.Create<INpgsqlSession>();
            ChamCong? existItem = session.Find<ChamCong>(stm => stm
                .Where($@"{Sql.Entity<ChamCong>(x=> x.nhanvien_id):TC} = @nhanvien_id 
                        AND {Sql.Entity<ChamCong>(x => x.ngay):TC} = @ngay")
                .WithParameters(item)
            ).FirstOrDefault();
            if (existItem == null)
                return false;
            return true;
        }
    }
}