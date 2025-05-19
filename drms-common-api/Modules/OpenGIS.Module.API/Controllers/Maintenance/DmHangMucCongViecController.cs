using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Controllers
{
    [Route("/api/ke-hoach/cong-viec")]
    public class DmHangMucCongViecController : BaseApiCRUDController<INpgsqlSession, DmHangMucCongViec, int>
    {
        public DmHangMucCongViecController(IDbFactory dbFactory, IMapper mapper, IRepository<DmHangMucCongViec, int> repository) 
            : base(dbFactory, mapper, repository)
        {
        }
    }
}