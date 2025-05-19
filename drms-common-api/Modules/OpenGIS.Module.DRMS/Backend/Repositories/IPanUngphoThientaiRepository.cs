using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using OpenGIS.Module.DRMS.Models;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IPanUngphoThientaiRepository : IRepository<PanUngphoThientai, int>
    {

    }

    public class PanUngphoThientaiRepository : Repository<PanUngphoThientai, int>, IPanUngphoThientaiRepository
    {
        public PanUngphoThientaiRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}