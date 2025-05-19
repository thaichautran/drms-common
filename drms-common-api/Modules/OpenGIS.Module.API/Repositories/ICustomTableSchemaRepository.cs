using Backend.Models;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.API.Repositories
{
    public interface ICustomTableSchemaRepository : IRepository<CustomTableSchema, string>
    {

    }

    public class CustomTableSchemaRepository : Repository<CustomTableSchema, string>, ICustomTableSchemaRepository
    {
        public CustomTableSchemaRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}
