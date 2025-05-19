/*
 * Created on Tue Apr 16 2024
 *
 * Copyright (c) 2024 VietGIS
 */

using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/web-option")]
    public class WebOptionApiController : BaseApiCRUDController<INpgsqlSession, WebOption, string>
    {
        public WebOptionApiController(IDbFactory dbFactory, IMapper mapper, IRepository<WebOption, string> repository) 
            : base(dbFactory, mapper, repository)
        {
        }
    }
}