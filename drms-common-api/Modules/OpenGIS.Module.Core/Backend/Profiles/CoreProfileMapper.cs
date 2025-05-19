using AutoMapper;
using Dapper.FastCrud;
using OpenGIS.Module.Core.Models;
using OpenGIS.Module.Core.ViewModels;
using Microsoft.AspNetCore.Identity;
using VietGIS.Infrastructure.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.Managers;
using VietGIS.Infrastructure.Repositories.Session;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.Core.Profiles
{
    public class CoreMapperProfile : Profile
    {
        public CoreMapperProfile()
        {
            CreateMap<ApplicationUser.View, UserInfoViewModel>()
               .ForMember(dst => dst.userInfo, opts => opts.MapFrom<UserInfoResolver>());
        }
        sealed class UserInfoResolver : IValueResolver<ApplicationUser.View, UserInfoViewModel, UserInfo>
        {
            private readonly IDbFactory _dbFactory;

            public UserInfoResolver(IDbFactory dbFactory)
            {
                _dbFactory = dbFactory;
            }

            public UserInfo Resolve(ApplicationUser.View source, UserInfoViewModel destination, UserInfo destMember, ResolutionContext context)
            {
                if (source == null)
                {
                    return new UserInfo();
                }

                using (var session = _dbFactory.Create<INpgsqlSession>())
                {
                    return session.Find<UserInfo>(statement => statement
                       .Include<Province>(x => x.LeftOuterJoin())
                       .Include<District>(x => x.LeftOuterJoin())
                       .Include<Commune>(x => x.LeftOuterJoin())
                       .Where($"{nameof(UserInfo.user_id)}=@user_id")
                       .WithParameters(new
                       {
                           user_id = source.id
                       })).FirstOrDefault();
                }
            }
        }

        //sealed class UserRoleResolver : IValueResolver<ApplicationUser.UserView, UserInfoView, string>
        //{
        //    private readonly ApplicationUserManager _userManager;

        //    public UserRoleResolver(UserManager<ApplicationUser> userManager)
        //    {
        //        _userManager = (ApplicationUserManager)userManager;
        //    }

        //    public string Resolve(ApplicationUser.UserView source, UserInfoView destination, string destMember, ResolutionContext context)
        //    {
        //        if (source == null)
        //        {
        //            return string.Empty;
        //        }
        //        Task<ApplicationUser> getUserTask = _userManager.FindByIdAsync(source.id);
        //        getUserTask.Wait();
        //        ApplicationUser user = getUserTask.Result;
        //        if (user != null)
        //        {
        //            Task<IList<string>> getRolesTask = _userManager.GetRolesAsync(user);
        //            getRolesTask.Wait();
        //            IList<string> roles = getRolesTask.Result;

        //            return roles?.FirstOrDefault() ?? string.Empty;
        //        }

        //        return string.Empty;
        //    }
        //}
    }
}