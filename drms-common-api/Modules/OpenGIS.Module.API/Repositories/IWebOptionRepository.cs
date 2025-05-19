/*
 * Created on Tue Apr 16 2024
 *
 * Copyright (c) 2024 VietGIS
 */

using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.API.Repositories;

public interface IWebOptionRepository : IRepository<WebOption, string>
{

}

public class WebOptionRepository : Repository<WebOption, string>, IWebOptionRepository
{
    public WebOptionRepository(IDbFactory factory) : base(factory)
    {
    }
}