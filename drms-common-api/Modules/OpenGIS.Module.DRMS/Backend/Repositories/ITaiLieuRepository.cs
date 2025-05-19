using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.HttpLogging;
using OpenGIS.Module.DRMS.Models;
using OpenGIS.Module.DRMS.Models.Category;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface ITaiLieuRepository : IRepository<TaiLieu, int>
    {

    }

    public class TaiLieuRepository : Repository<TaiLieu, int>, ITaiLieuRepository
    {
        public TaiLieuRepository(IDbFactory factory) : base(factory)
        {
        }
        public override async Task<TaiLieu> GetKeyAsync(int key, ISession session)
        {
            return (await session.FindAsync<TaiLieu>(x => x
            .Where($"{Sql.Entity<TaiLieu>(x => x.id):TC} = @key")
            .Include<TaiLieu.CapHanhchinh>(x => x.LeftOuterJoin())
            .Include<Province>(x => x.LeftOuterJoin())
            .Include<District>(x => x.LeftOuterJoin())
            .Include<Commune>(x => x.LeftOuterJoin())
            .Include<DmLinhVuc>(x => x.LeftOuterJoin())
            .Include<DmPhanloaiTailieu>(x => x.LeftOuterJoin())
            .Include<DmDonViPhatHanh>(x => x.LeftOuterJoin())
            .Include<DmTinhTrangTaiLieu>(x => x.LeftOuterJoin())
            .WithParameters(new { key }))).FirstOrDefault();
        }
        public override async Task<int> SaveOrUpdateAsync(TaiLieu entity, IUnitOfWork uow)
        {
            var key = await base.SaveOrUpdateAsync(entity, uow);
            if (entity.listCapHanhChinh != null)
            {
                var condition = $"{Sql.Entity<TaiLieu.CapHanhchinh>(x => x.tailieu_id):TC} = @key";
                if (entity.listCapHanhChinh.Count(x => x.id > 0) > 0)
                {
                    condition += $" AND {Sql.Entity<TaiLieu.CapHanhchinh>(x => x.id):TC} <> ALL(@keepedIds)";
                }
                uow.Connection.BulkDelete<TaiLieu.CapHanhchinh>(x => x
                .Where($"{condition}")
                .WithParameters(new
                {
                    key,
                    keepedIds = entity.listCapHanhChinh.Where(x => x.id > 0).Select(x => x.id).ToArray(),
                }));
                if (entity.listCapHanhChinh.Count() > 0)
                {
                    foreach (var item in entity.listCapHanhChinh)
                    {
                        item.tailieu_id = key;
                        if (item.id > 0)
                        {
                            uow.Connection.Update(item);
                        }
                        else
                        {
                            uow.Connection.Insert(item);
                        }
                    }
                }
            }
            return key;
        }
    }
}