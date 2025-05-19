using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IFormFieldRepository : IRepository<FormField, int>
    {
    }
    public class FormFieldRepository : Repository<FormField, int>, IFormFieldRepository
    {
        public FormFieldRepository(IDbFactory factory) : base(factory)
        {
        }
    }
}