using OpenGIS.Module.Core.Models;
using System;
using System.Collections.Generic;
using System.Text;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories;

namespace OpenGIS.Module.Core.Repositories
{
    public interface INotificationsReponsitory : IRepository<Notifications, int>
    {

    }

    public class NotificationsReponsitory : Repository<Notifications, int>, INotificationsReponsitory
    {
        public NotificationsReponsitory(IDbFactory dbFactory) : base(dbFactory)
        {

        }

    }
   
}
