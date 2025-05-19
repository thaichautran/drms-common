using System.Collections.Generic;
using System.Linq;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Helpers;
using System;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.DTO;

namespace OpenGIS.Module.API.Controllers
{

    [Route("api/[controller]")]
    public class BackupHistoryController : BaseController
    {
        public BackupHistoryController(IDbFactory dbFactory) : base(dbFactory)
        {
        }

        [HttpPost("list")]
        public RestBase listSystemParam([FromBody] BakupHistoryListDxDTO param)
        {
            using (var session = OpenSession())
            {
                var data = new List<BackupHistory>();
                var condition = "1=1";
                if (!string.IsNullOrEmpty(param.searchValue))
                {
                    param.searchValue = param.searchValue?.ToFullTextString();
                    condition += $" AND {Sql.Entity<BackupHistory>():T}.search_content @@ ts_query(@searchValue)";
                }
                if (param.start_date.HasValue)
                {
                    param.start_date = param.start_date.Value.ToUniversalTime();
                    condition += $" AND DATE({Sql.Entity<BackupHistory>(x => x.insert_time):TC}) >= @start_date";
                }
                if (param.end_date.HasValue)
                {
                    param.end_date = param.end_date.Value.ToUniversalTime();
                    condition += $" AND DATE({Sql.Entity<BackupHistory>(x => x.insert_time):TC}) <= @end_date";
                }
                data = session.Find<BackupHistory>(stm => stm.Where($"{condition}")
                              .WithParameters(param)
                              .Skip(param.skip).Top(param.take)
                              .OrderBy($"{Sql.Entity<BackupHistory>(x => x.insert_time):TC} DESC")
                            ).ToList();
                return new RestData()
                {
                    data = data,
                };
            }
        }

        [HttpGet("{id}")]
        public RestBase getSchema([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Get(new BackupHistory { id = id })
                };
            }
        }

        [HttpPost("create")]
        public RestBase save()
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var backupHistory = new BackupHistory
                    {
                        description = "Sao lưu hệ thống",
                        insert_time = DateTime.Now,
                    };
                    uow.Insert(backupHistory);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
    }
}