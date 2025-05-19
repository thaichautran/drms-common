using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using OpenGIS.Module.DRMS.Models;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface ITaiLieuCapHanhchinhRepository : IRepository<TaiLieu.CapHanhchinh, int>
    {

    }

    public class TaiLieuCapHanhchinhRepository : Repository<TaiLieu.CapHanhchinh, int>, ITaiLieuCapHanhchinhRepository
    {
        public TaiLieuCapHanhchinhRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}