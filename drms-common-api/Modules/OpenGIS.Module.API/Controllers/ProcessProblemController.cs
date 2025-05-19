using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Models.DTO;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Extensions;
using Microsoft.AspNetCore.Http;
using NetTopologySuite.Index.HPRtree;
using Humanizer;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/xu-ly-su-co")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_PROBLEM))]
    public class ProcessProblemController : BaseController
    {
        protected readonly IProcessProblemRepository _processProblemRepository;
        protected readonly IProcessProblemWorkerRepository _processProblemWorkerRepository;
        public ProcessProblemController(
            IDbFactory dbFactory, 
            IProcessProblemRepository processProblemRepository,
            IProcessProblemWorkerRepository processProblemWorkerRepository
        ): base(dbFactory)
        {
            _processProblemRepository = processProblemRepository;
            _processProblemWorkerRepository = processProblemWorkerRepository;
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] ProblemListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                List<ProcessProblem> data = new List<ProcessProblem>();
                var condition = "1 = 1";
                if (dto.status != null && !string.IsNullOrWhiteSpace(dto.status))
                {
                    condition += @$" AND {Sql.Entity<Problem>(x => x.trangthai_id):TC} = @status";
                }
                if (dto.start_date.HasValue && dto.start_date != DateTime.MinValue)
                {
                    condition += @$" AND {Sql.Entity<Problem>(x => x.thoigian_xayra_suco):TC} >= @start_date";
                }
                if (dto.end_date.HasValue && dto.end_date != DateTime.MinValue)
                {
                    condition += @$" AND {Sql.Entity<Problem>(x => x.thoigian_xayra_suco):TC} >= @end_date";
                }
                if (dto.years != null && dto.years.Count() > 0)
                {
                    dto.years = dto.years.ToArray();
                    condition += @$" AND DATE_PART('year', {Sql.Entity<Problem>(x => x.thoigian_xayra_suco):TC}) = ANY(@years)";
                }
                if (dto.take == 0)
                {
                    data = (await session.FindAsync<ProcessProblem>(stm => stm
                        .Include<Problem>(x => x.LeftOuterJoin())
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .OrderBy($@"{Sql.Entity<ProcessProblem>(x => x.thoigian_yeucau):TC} DESC")
                    )).ToList();
                }
                else
                {
                    data = (await session.FindAsync<ProcessProblem>(stm => stm
                        .Include<Problem>(x => x.LeftOuterJoin())
                        .Where($"{condition}")
                        .WithParameters(dto)
                        .OrderBy($@"{Sql.Entity<ProcessProblem>(x => x.thoigian_yeucau):TC} DESC")
                    )).Skip(dto.skip).Take(dto.take).ToList();
                }
                return new RestPagedDataTable
                {
                    data = data,
                    recordsTotal = await session.CountAsync<ProcessProblem>(stm => stm
                        .Include<Problem>(x => x.LeftOuterJoin())
                        .Where($"{condition}")
                        .WithParameters(dto)
                    )
                };
            }
        }

        [HttpPost("save")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_PROBLEM))]
        public async Task<RestBase> save([FromForm] ProcessProblem item)
        {
            using var session = OpenSession();
            using var uow = new UnitOfWork(DbFactory, session);
            if (item == null)
            {
                return new RestError
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Lỗi tham số!" }
                    }
                };
            }
            else
            {
                if (item.id == 0)
                {
                    item.thoigian_yeucau = DateTime.Now;
                    item.id = _processProblemRepository.SaveOrUpdate(item, uow);
                }
                else
                {
                    var existItem = session.Get(new ProcessProblem { id = item.id });
                    if (existItem == null)
                    {
                        return new RestError
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail {  message = "Yêu cầu xử lý sự cố này không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        _processProblemRepository.SaveOrUpdate(item, uow);
                    }
                }
                if (item.processProblemWorkers != null && item.processProblemWorkers.Count() > 0)
                {
                    foreach (var worker in item.processProblemWorkers)
                    {
                        worker.process_problem_id = item.id;
                        if (!_processProblemWorkerRepository.isExistItem(worker))
                        {
                            uow.Insert(worker);
                        }
                    }
                }
                return new RestBase(EnumErrorCode.OK);
            }
        }

        [HttpGet("{id}")]
        public RestBase Get([FromRoute] int id)
        {
            using (var con = OpenSession())
            {
                using var session = OpenSession();
                var processProblem = session.Find<ProcessProblem>(stm => stm
                        .Include<Problem>(x => x.LeftOuterJoin())
                        .Where($"{Sql.Entity<ProcessProblem>(x => x.id):TC} = @id")
                        .WithParameters(new {id = id })
                    ).FirstOrDefault();
                if (processProblem != null)
                {
                    processProblem.processProblemWorkers = session.Find<ProcessProblemWorker>(stm => stm
                        .Where($@"{Sql.Entity<ProcessProblemWorker>(x => x.process_problem_id):TC} = @id")
                        .WithParameters(processProblem)
                   ).ToList();
                }
                return new RestData
                {
                    data = processProblem
                };
            }
        }

        [HttpDelete("{id}")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_PROBLEM))]
        public RestBase Delete([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                var existItem = session.Get(new ProcessProblem { id = id });
                if (existItem == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Yêu cầu xử lý sự cố này không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    session.Delete(existItem);
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
    }
}
