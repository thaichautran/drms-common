using Backend.Models;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.API.Repositories
{
    public interface ITichHopDuLieuRepository : IRepository<TichHopDuLieu, int>
    {

    }

    public class TichHopDuLieuRepository : Repository<TichHopDuLieu, int>, ITichHopDuLieuRepository
    {
        public TichHopDuLieuRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}
