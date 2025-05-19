using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmLoaiThientaiRepository : IRepository<DmLoaiThientai, int>
    {

    }

    public class DmLoaiThientaiRepository : Repository<DmLoaiThientai, int>, IDmLoaiThientaiRepository
    {
        public DmLoaiThientaiRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}