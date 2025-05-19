using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using Dapper.FastCrud;
using OpenGIS.Module.DRMS.Models;
using OpenGIS.Module.DRMS.ViewModels;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface IHuongDanSuDungRepository : IRepository<HuongDanSuDung, int>
    {
        Task<IEnumerable<HuongDanSuDungViewModel>> LayTheoChaHoacTukhoa(int parent_id, string? keyword);
    }

    public class HuongDanSuDungRepository : Repository<HuongDanSuDung, int>, IHuongDanSuDungRepository
    {
        public HuongDanSuDungRepository(IDbFactory factory) : base(factory)
        {
        }

        public async Task<IEnumerable<HuongDanSuDungViewModel>> LayTheoChaHoacTukhoa(int parent_id, string? keyword)
        {
            using (var session = Factory.Create<INpgsqlSession>())
            {
                var condition = $"1=1";
                if (!string.IsNullOrWhiteSpace(keyword))
                {
                    keyword = keyword.ToFullTextStringProximity();
                    condition += $" AND search_content @@ to_tsquery(@keyword)";
                }
                else
                {
                    if (parent_id == 0)
                    {
                        condition += $" AND {nameof(HuongDanSuDung.parent_id)} IS NULL";
                    }
                    else
                    {
                        condition += $" AND {nameof(HuongDanSuDung.parent_id)} = @parent_id";
                    }
                }
                var sql = $"SELECT {nameof(HuongDanSuDungViewModel.id)}, {nameof(HuongDanSuDungViewModel.tieu_de)}, {nameof(HuongDanSuDungViewModel.order_id)}, {nameof(HuongDanSuDungViewModel.title_level)}, {nameof(HuongDanSuDungViewModel.parent_id)} FROM {Sql.Entity<HuongDanSuDung>():T} WHERE {condition} ORDER BY {nameof(HuongDanSuDung.order_id)}";
                return await session.QueryAsync<HuongDanSuDungViewModel>(sql, new
                {
                    keyword,
                    parent_id
                });
            }
        }
    }

}