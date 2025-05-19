using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmLoaiPhuonganRepository : IRepository<DmLoaiPhuongan, int>
    {

    }

    public class DmLoaiPhuonganRepository : Repository<DmLoaiPhuongan, int>, IDmLoaiPhuonganRepository
    {
        public DmLoaiPhuonganRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}