using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using OpenGIS.Module.DRMS.Models;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IPhuonganThientaiRepository : IRepository<PhuonganThientai, int>
    {

    }

    public class PhuonganThientaiRepository : Repository<PhuonganThientai, int>, IPhuonganThientaiRepository
    {
        public PhuonganThientaiRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}