using System.Linq;
using System.Threading.Tasks;
using Dapper.FastCrud;
using OpenGIS.Module.DRMS.Models.Category;
using OpenGIS.Module.DRMS.Models.DRMS;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDanhSachBanDoRepository : IRepository<DanhSachBanDo, int>
    {

    }

    public class DanhSachBanDoRepository : Repository<DanhSachBanDo, int>, IDanhSachBanDoRepository
    {
        public DanhSachBanDoRepository(IDbFactory factory) : base(factory)
        {
        }
        public override async Task<DanhSachBanDo> GetKeyAsync(int key, ISession session)
        {
            return (await session.FindAsync<DanhSachBanDo>(x => x
            .Where($"{Sql.Entity<DanhSachBanDo>(x => x.id):TC} = @key")
            .Include<Province>(join => join.LeftOuterJoin())
            .Include<District>(join => join.LeftOuterJoin())
            .Include<Commune>(join => join.LeftOuterJoin())
            .Include<DmLoaiBanDo>(join => join.InnerJoin())
            .WithParameters(new { key }))).FirstOrDefault();
        }
    }
}