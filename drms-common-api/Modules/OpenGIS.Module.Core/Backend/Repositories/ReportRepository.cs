using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IReportRepository : IRepository<SynthesisReport, int>
    {
    }

    public class ReportRepository : Repository<SynthesisReport, int>, IReportRepository
    {
        public ReportRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}