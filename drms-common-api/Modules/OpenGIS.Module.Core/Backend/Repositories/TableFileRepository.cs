using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Repositories
{
    public interface ITableFileRepository : IRepository<TableFiles, int>
    {

    }

    public class TableFileRepository : Repository<TableFiles, int>, ITableFileRepository
    {
        public TableFileRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}