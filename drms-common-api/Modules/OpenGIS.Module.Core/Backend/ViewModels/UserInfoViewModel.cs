using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Module.Core.ViewModels
{
    public class UserInfoViewModel : ApplicationUser.View
    {
        public UserInfo? userInfo { get; set; }
    }
}