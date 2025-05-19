using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmCapPhuonganRepository : IRepository<DmCapPhuongan, int>
    {

    }

    public class DmCapPhuonganRepository : Repository<DmCapPhuongan, int>, IDmCapPhuonganRepository
    {
        public DmCapPhuonganRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}