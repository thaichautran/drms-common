using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IFormRepository : IRepository<Form, int>
    {
    }

    public class FormRepository : Repository<Form, int>, IFormRepository
    {
        public FormRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}