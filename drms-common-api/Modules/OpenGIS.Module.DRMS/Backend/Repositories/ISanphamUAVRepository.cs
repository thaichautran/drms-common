using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.HttpLogging;
using OpenGIS.Module.DRMS.Models;
using OpenGIS.Module.DRMS.Models.Category;
using OpenGIS.Module.DRMS.Models.DRMS;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.DRMS.Repositories
{
    public interface ISanphamUAVRepository : IRepository<SanphamUAV, int>
    {

    }

    public class SanphamUAVRepository : Repository<SanphamUAV, int>, ISanphamUAVRepository
    {
        public SanphamUAVRepository(IDbFactory factory) : base(factory)
        {
        }
        public override async Task<SanphamUAV> GetKeyAsync(int key, ISession session)
        {
            return (await session.FindAsync<SanphamUAV>(x => x
            .Where($"{Sql.Entity<SanphamUAV>(x => x.id):TC} = @key")
            .Include<Commune>(x => x.LeftOuterJoin())
            .Include<District>(x => x.LeftOuterJoin())
            .Include<SanphamUAV.File>(x => x.LeftOuterJoin())
            .Include<DmLoaiSanphamUAV>(x => x.LeftOuterJoin())
            .WithParameters(new { key }))).FirstOrDefault();
        }
        public override async Task<int> SaveOrUpdateAsync(SanphamUAV entity, IUnitOfWork uow)
        {
            var key = await base.SaveOrUpdateAsync(entity, uow);
            if (entity.listFiles != null)
            {
                var condition = $"{Sql.Entity<SanphamUAV.File>(x => x.sanpham_id):TC} = @key";
                if (entity.listFiles.Count(x => x.id > 0) > 0)
                {
                    condition += $" AND {Sql.Entity<SanphamUAV.File>(x => x.id):TC} <> ALL(@keepedIds)";
                }
                uow.Connection.BulkDelete<SanphamUAV.File>(x => x
                .Where($"{condition}")
                .WithParameters(new
                {
                    key,
                    keepedIds = entity.listFiles.Where(x => x.id > 0).Select(x => x.id).ToArray(),
                }));
                if (entity.listFiles.Count() > 0)
                {
                    foreach (var item in entity.listFiles)
                    {
                        item.sanpham_id = key;
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