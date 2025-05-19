using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmDonViPhatHanhRepository : IRepository<DmDonViPhatHanh, int>
    {

    }

    public class DmDonViPhatHanhRepository : Repository<DmDonViPhatHanh, int>, IDmDonViPhatHanhRepository
    {
        public DmDonViPhatHanhRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}