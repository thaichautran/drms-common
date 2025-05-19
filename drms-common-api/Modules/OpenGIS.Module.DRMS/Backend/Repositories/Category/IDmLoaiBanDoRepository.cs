using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IDmLoaiBanDoRepository : IRepository<DmLoaiBanDo, int>
    {

    }

    public class DmLoaiBanDoRepository : Repository<DmLoaiBanDo, int>, IDmLoaiBanDoRepository
    {
        public DmLoaiBanDoRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}