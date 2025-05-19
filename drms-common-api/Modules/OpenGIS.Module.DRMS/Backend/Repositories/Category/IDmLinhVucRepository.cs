using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmLinhVucRepository : IRepository<DmLinhVuc, int>
    {

    }

    public class DmLinhVucRepository : Repository<DmLinhVuc, int>, IDmLinhVucRepository
    {
        public DmLinhVucRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}