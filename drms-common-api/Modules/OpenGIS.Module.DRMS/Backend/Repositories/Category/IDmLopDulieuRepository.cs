using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmLopDulieuRepository : IRepository<DmLopDulieu, int>
    {

    }

    public class DmLopDulieuRepository : Repository<DmLopDulieu, int>, IDmLopDulieuRepository
    {
        public DmLopDulieuRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}