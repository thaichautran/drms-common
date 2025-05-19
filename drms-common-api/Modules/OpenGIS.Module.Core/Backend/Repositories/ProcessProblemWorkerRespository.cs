using VietGIS.Infrastructure.Repositories;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using VietGIS.Infrastructure.Repositories.Session;
using Dapper.FastCrud;
using System.Linq;

namespace OpenGIS.Module.Core.Repositories
{
    public interface IProcessProblemWorkerRepository : IRepository<ProcessProblemWorker, int>
    {
        public bool isExistItem(ProcessProblemWorker processProblemWorker);
    }
    public class ProcessProblemWorkerRepository : Repository<ProcessProblemWorker, int>, IProcessProblemWorkerRepository
    {
        public ProcessProblemWorkerRepository(IDbFactory factory) : base(factory)
        {
        }

        public bool isExistItem(ProcessProblemWorker processProblemWorker)
        {
            using var session = Factory.Create<INpgsqlSession>();
            ProcessProblemWorker? existItem = session.Find<ProcessProblemWorker>(stm => stm
                .Where($@"{Sql.Entity<ProcessProblemWorker>(x => x.process_problem_id):TC} = @process_problem_id 
                        AND {Sql.Entity<ProcessProblemWorker>(x => x.nhanvien_id):TC} = @nhanvien_id")
                .WithParameters(processProblemWorker)
            ).FirstOrDefault();
            if (existItem == null)
                return false;
            return true;
        }
    }
}