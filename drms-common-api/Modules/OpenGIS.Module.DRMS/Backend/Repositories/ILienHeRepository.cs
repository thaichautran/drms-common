using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using OpenGIS.Module.DRMS.Models;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface ILienHeRepository : IRepository<LienHe, int>
    {

    }

    public class LienHeRepository : Repository<LienHe, int>, ILienHeRepository
    {
        public LienHeRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}