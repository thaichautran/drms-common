using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmTinhTrangTaiLieuRepository : IRepository<DmTinhTrangTaiLieu, int>
    {

    }

    public class DmTinhTrangTaiLieuRepository : Repository<DmTinhTrangTaiLieu, int>, IDmTinhTrangTaiLieuRepository
    {
        public DmTinhTrangTaiLieuRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}