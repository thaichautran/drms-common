using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IReportFieldRepository : IRepository<ReportField, int>
    {
    }
    public class ReportFieldRepository : Repository<ReportField, int>, IReportFieldRepository
    {
        public ReportFieldRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}