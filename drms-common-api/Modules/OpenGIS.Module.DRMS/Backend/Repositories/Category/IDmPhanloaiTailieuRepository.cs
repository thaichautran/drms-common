using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmPhanloaiTailieuRepository : IRepository<DmPhanloaiTailieu, int>
    {

    }

    public class DmPhanloaiTailieuRepository : Repository<DmPhanloaiTailieu, int>, IDmPhanloaiTailieuRepository
    {
        public DmPhanloaiTailieuRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}