using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmNhomDulieuRepository : IRepository<DmNhomDulieu, int>
    {

    }

    public class DmNhomDulieuRepository : Repository<DmNhomDulieu, int>, IDmNhomDulieuRepository
    {
        public DmNhomDulieuRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}