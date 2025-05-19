using Dapper.FastCrud;
using System.Linq;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.Core.Repositories
{
    public interface ICategoryRepository<TEntity> : IRepository<TEntity, int> where TEntity : CategoryBaseEntity
    {
        TEntity GetCategoryByDescription(string description);

        bool IsExistCategory(string description, int categoryId = 0);
    }

    public class CategoryRepository<TEntity> : Repository<TEntity, int>, ICategoryRepository<TEntity> where TEntity : CategoryBaseEntity
    {
        public CategoryRepository(IDbFactory dbFactory) : base(dbFactory)
        {

        }

        public TEntity GetCategoryByDescription(string description)
        {
            using (var session = Factory.Create<INpgsqlSession>())
            {
                return session.Find<TEntity>(stm => stm
                    .Where($"{Sql.Table<TEntity>()}.mo_ta = @description")
                    .WithParameters(new { description  = description })
                ).FirstOrDefault();
            }
        }

        public bool IsExistCategory(string description, int categoryId = 0)
        {
            using (var session = Factory.Create<INpgsqlSession>())
            {
                var existItem = session.Find<TEntity>(stm => stm
                    .Where($"{Sql.Table<TEntity>()}.mo_ta = @description")
                    .WithParameters(new { description = description })
                ).ToList();
                if (existItem.Count() == 0)
                {
                    return true;
                }

                return false;
            }
        }
    }
}
