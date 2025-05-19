using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using OpenGIS.Module.DRMS.Models;
using OpenGIS.Module.DRMS.Models.DRMS;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface ISanphamUAVFileRepository : IRepository<SanphamUAV.File, int>
    {

    }

    public class SanphamUAVFileRepository : Repository<SanphamUAV.File, int>, ISanphamUAVFileRepository
    {
        public SanphamUAVFileRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}