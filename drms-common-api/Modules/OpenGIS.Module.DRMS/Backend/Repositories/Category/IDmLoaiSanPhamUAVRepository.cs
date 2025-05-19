using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmLoaiSanphamUAVRepository : IRepository<DmLoaiSanphamUAV, int>
    {

    }

    public class DmLoaiSanphamUAVRepository : Repository<DmLoaiSanphamUAV, int>, IDmLoaiSanphamUAVRepository
    {
        public DmLoaiSanphamUAVRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}