using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Interfaces;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Entities;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Repositories.Session;
using OpenGIS.Module.Core.Models;
using System;
using OpenGIS.Module.Core.Repositories;
using Microsoft.AspNetCore.Authorization;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure.Models.DTO;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.DbContexts;
using VietGIS.Infrastructure.Identity.Managers;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using EnumRoles = OpenGIS.Module.Core.Enums.EnumRoles;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Abstractions;
using Dapper;
using NetTopologySuite.Index.HPRtree;
using VietGIS.Infrastructure.Models.Regional;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using OpenGIS.Module.Core.Extensions;
using Newtonsoft.Json;
using VietGIS.Infrastructure.Helpers;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_USERS))]
    public class UserController : BaseController
    {
        protected readonly IMapper _mapper;
        protected readonly ApplicationDbContext _dbContext;
        protected readonly ApplicationUserManager _userManager;
        protected readonly ApplicationGroupManager _groupManager;
        protected readonly RoleManager<ApplicationRole> _roleManager;
        protected readonly INotificationsReponsitory _notificationsReponsitory;
        protected readonly IDbFactory _dbFactory;
        protected readonly IWorkContext _wordContext;

        public UserController(IDbFactory dbFactory, IMapper mapper, ApplicationDbContext dbContext,
         UserManager<ApplicationUser> userManager, GroupManager<ApplicationGroup> groupManager,
         RoleManager<ApplicationRole> roleManager, INotificationsReponsitory notificationsReponsitory,
         IWorkContext wordContext)
            : base(dbFactory)
        {
            _mapper = mapper;
            _dbContext = dbContext;
            _userManager = (ApplicationUserManager)userManager;
            _groupManager = (ApplicationGroupManager)groupManager;
            _roleManager = roleManager;
            _notificationsReponsitory = notificationsReponsitory;
            _dbFactory = dbFactory;
            _wordContext = wordContext;
        }

        [HttpGet("")]
        public async Task<RestBase> infoAsync()
        {
            using (var session = OpenSession())
            {
                var user = await _userManager.FindByIdAsync(getUserId());
                if (user != null)
                {
                    return new RestData
                    {
                        data = _mapper.Map<ApplicationUser.View>(user)
                    };
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Thông tin người dùng không tồn tại!" }
                        }
                    };
                }

            }
        }
        [HttpGet("{id}")]
        public async Task<RestBase> getAsync([FromRoute] string id)
        {
            return new RestData
            {
                data = await _userManager.FindByIdAsync(id)
            };
        }
        [HttpGet("list-user-infos")]
        public async Task<RestBase> ListUserInfo([FromQuery] string? q, [FromQuery] int skip, [FromQuery] int take)
        {
            var condition = !string.IsNullOrEmpty(q) ? "search_content @@ to_tsquery(@keyword)" : "1=1";
            var data = new List<UserInfo>();
            using var session = OpenSession();
            if (take > 0)
            {
                data = session.Find<UserInfo>(x => x.Where($"{condition}").WithParameters(new
                {
                    keyword = q?.ToFullTextString()
                }).Skip(skip).Top(take)).ToList();
            }
            else
            {
                data = session.Find<UserInfo>(x => x.Where($"{condition}").WithParameters(new
                {
                    keyword = q?.ToFullTextString()
                })).ToList();
            }
            return new RestData
            {
                data = data
            };
        }
        [HttpPost("create")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_USERS))]
        public async Task<RestBase> create([FromBody] CreateUserExtentDTO dto)
        {
            if (dto == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                ApplicationUser? user;

                if (string.IsNullOrWhiteSpace(dto.PhoneNumber) == false)
                {
                    user = await _userManager.FindByPhoneNumberAsync(dto.PhoneNumber);
                    if (user != null)
                    {
                        return new RestError(-1, "Số diện thoại này đã được sử dụng! Vui lòng nhập số điện thoại khác.");
                    }
                }

                if (string.IsNullOrWhiteSpace(dto.Email) == false)
                {
                    user = await _userManager.FindByEmailAsync(dto.Email);
                    if (user != null)
                    {
                        return new RestError(400, "Địa chỉ email đã được đăng ký! Vui lòng nhập địa chỉ email khác.");
                    }
                }

                user = await _userManager.FindByNameAsync(dto.UserName);
                if (user != null)
                {
                    return new RestError(400, "Thông tin người dùng đã tồn tại!");
                }


                IdentityResult result = await _userManager.CreateAsync(new ApplicationUser
                {
                    UserName = dto.UserName,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    AvatarPath = dto.AvatarPath,
                    PhoneNumberConfirmed = false,
                }, dto.ConfirmPassword);

                if (result == IdentityResult.Success)
                {
                    user = await _userManager.FindByNameAsync(dto.UserName);
                    if (user != null)
                    {
                        await _userManager.SetLockoutEndDateAsync(user, DateTime.Now.AddYears(1000).ToUniversalTime());

                        if (string.IsNullOrWhiteSpace(dto.GroupId) == false)
                        {
                            var groupResult = await _userManager.AddToGroupAsync(user, dto.GroupId);
                        }

                        using (var session = OpenSession())
                        {
                            UserInfo? userInfo = session.Find<UserInfo>(statement => statement
                                .Where($"{nameof(UserInfo.user_id):C} = @Id")
                                .WithParameters(user)
                            ).FirstOrDefault();
                            using (var uow = session.UnitOfWork())
                            {
                                if (userInfo == null)
                                {
                                    userInfo = new UserInfo
                                    {
                                        user_id = user.Id,
                                        full_name = dto.FullName,
                                        unit = dto.Unit,
                                        position = dto.Position,
                                        district_code = dto.DistrictId,
                                        send_sms = dto.SendSms,
                                        send_app = dto.SendApp,
                                        send_mail = dto.SendMail,
                                        bypass_approve = dto.BypassApprove,
                                    };
                                    await AddLayersForNewUserAsync(dto.GroupId, user);
                                    await AddPermissionForNewUserAsync(dto.GroupId, user);
                                    //await AddClaimsForNewUserAsync(dto.GroupId, user);
                                    await uow.InsertAsync(userInfo);
                                }
                                else
                                {
                                    userInfo.full_name = dto.FullName;
                                    userInfo.unit = dto.Unit;
                                    userInfo.position = dto.Position;
                                    userInfo.district_code = dto.DistrictId;
                                    userInfo.send_sms = dto.SendSms;
                                    userInfo.send_app = dto.SendApp;
                                    userInfo.send_mail = dto.SendMail;
                                    userInfo.bypass_approve = dto.BypassApprove;
                                    await uow.UpdateAsync(userInfo);
                                }
                            }
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                {
                    return new RestError(400, result.Errors.FirstOrDefault()?.Description ?? "Đã xảy ra lỗi, vui lòng thử lại!");
                }
            }
        }

        [HttpPost("device-token")]
        public async Task<RestBase> AddUserDeviceTokenAsync([FromBody] DeviceTokenDTO item)
        {
            try
            {
                using (var session = OpenSession())
                {
                    if (item != null)
                    {
                        string userId = _wordContext.GetCurrentUserId();
                        if (string.IsNullOrWhiteSpace(userId))
                        {
                            return new RestError(400, "Không thể lấy thông tin người dùng!");
                        }
                        var itemExisted = (await session.FindAsync<ApplicationUserDeviceToken>(stm => stm
                            .Where($"{Sql.Entity<ApplicationUserDeviceToken>(x => x.UserId):TC} = @userId AND {Sql.Entity<ApplicationUserDeviceToken>(x => x.DeviceToken):TC} = @token")
                            .WithParameters(new { token = item?.device_token, userId }))
                        ).FirstOrDefault();
                        if (itemExisted == null)
                        {
                            // await session.BulkDeleteAsync<ApplicationUserDeviceToken>(stm => stm
                            //     .Where($"{Sql.Entity<ApplicationUserDeviceToken>(x => x.UserId):TC} = @userId AND {Sql.Entity<ApplicationUserDeviceToken>(x => x.Platform):TC} = 'website'")
                            //     .WithParameters(new { userId }));
                            ApplicationUserDeviceToken applicationUserDeviceToken = new ApplicationUserDeviceToken
                            {
                                UserId = userId,
                                Timestamp = DateTimeOffset.UtcNow,
                                DeviceName = item.device_name,
                                DeviceToken = item.device_token,
                                Platform = item.platform
                            };
                            await session.InsertAsync(applicationUserDeviceToken);
                            return new RestBase(EnumErrorCode.OK);
                        }
                        else
                        {
                            return new RestError(-1, "Token đã tồn tại!");
                        }
                        ;
                    }
                    else
                    {
                        return new RestError(400, "Dữ liệu đầu vào không hợp lệ!");
                    }
                    ;
                }
            }
            catch (Exception e)
            {
                return new RestError(-1, e.Message);
            }
        }
        [HttpGet("list/user-tokens")]
        public async Task<RestBase> ListUserToken()
        {
            using var session = OpenSession();
            var data = session.Find<UserInfo>(x => x
            .Where($"{Sql.Entity<UserInfo>(x => x.user_id):TC} IN (SELECT DISTINCT {Sql.Entity<ApplicationUserDeviceToken>(x => x.UserId):TC} FROM {Sql.Entity<ApplicationUserDeviceToken>():T})"));
            return new RestData { data = data };
        }
        [HttpPost("update")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_USERS))]
        public async Task<RestBase> update([FromBody] CreateUserExtentDTO dto)
        {
            if (dto == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                ApplicationUser user = await _userManager.FindByNameAsync(dto.UserName);
                if (user != null)
                {
                    user.Email = dto.Email;
                    user.PhoneNumber = dto.PhoneNumber;
                    user.UserName = dto.UserName;
                    user.AvatarPath = dto.AvatarPath;

                    IdentityResult result = await _userManager.UpdateAsync(user);
                    if (result == IdentityResult.Success)
                    {
                        using (var session = _dbFactory.Create<INpgsqlSession>())
                        {
                            UserInfo? userInfo = session.Find<UserInfo>(statement => statement
                                .Where($"{nameof(UserInfo.user_id):C} = @Id")
                                .WithParameters(user)
                            ).FirstOrDefault();
                            using (var uow = session.UnitOfWork())
                            {

                                if (userInfo == null)
                                {
                                    userInfo = new UserInfo
                                    {
                                        user_id = user.Id,
                                        full_name = dto.FullName,
                                        unit = dto.Unit,
                                        position = dto.Position,
                                        //Address = dto.Position,
                                        district_code = dto.DistrictId,
                                        send_sms = dto.SendSms,
                                        send_app = dto.SendApp,
                                        send_mail = dto.SendMail,
                                        bypass_approve = dto.BypassApprove,
                                    };
                                    await uow.InsertAsync(userInfo);
                                }
                                else
                                {
                                    userInfo.full_name = dto.FullName;
                                    userInfo.position = dto.Position;
                                    userInfo.unit = dto.Unit;
                                    userInfo.district_code = dto.DistrictId;
                                    userInfo.send_sms = dto.SendSms;
                                    userInfo.send_app = dto.SendApp;
                                    userInfo.send_mail = dto.SendMail;
                                    userInfo.bypass_approve = dto.BypassApprove;
                                    await uow.UpdateAsync(userInfo);
                                }
                            }
                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                    else
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                            }
                        };
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_USERS))]
        public async Task<RestBase> delete([FromForm] CreateUserExtentDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserId))
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            else
            {
                ApplicationUser user = await _userManager.FindByIdAsync(dto.UserId);
                if (user != null)
                {
                    if (await _userManager.DeleteAsync(user) == IdentityResult.Success)
                        return new RestBase("OK");
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                        }
                    };
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }

        [HttpPost("move")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_USERS))]
        public async Task<RestBase> move([FromBody] CreateUserExtentDTO dto)
        {
            if (dto == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                ApplicationUser user = await _userManager.FindByNameAsync(dto.UserName);
                if (user != null)
                {
                    IdentityResult result = await _userManager.UpdateAsync(user);
                    if (result == IdentityResult.Success)
                    {
                        using (var session = _dbFactory.Create<INpgsqlSession>())
                        {
                            if (!string.IsNullOrWhiteSpace(dto.GroupId))
                            {
                                var userGroups = await _userManager.GetGroupsAsync(user);
                                if (userGroups != null && userGroups.Count() > 0)
                                {
                                    foreach (var userGroup in userGroups)
                                    {
                                        await _userManager.RemoveFromGroupAsync(user, userGroup.Id);
                                    }
                                }
                                if (dto.GroupId != "Orphan")
                                {
                                    await _userManager.AddToGroupAsync(user, dto.GroupId);
                                }
                            }
                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                    else
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                            }
                        };
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }


        [HttpGet("notifications")]
        public RestData ListNotificastions(string user_id, int page = 1, int pagelength = 9)
        {

            using (var session = OpenSession())
            {
                var rusult = session.Find<Notifications>(stm => stm
                    .Where($"{Sql.Entity<Notifications>(x => x.user_id):TC} = @user_id")
                    .WithParameters(new { user_id = user_id })
                ).OrderByDescending(s => s.created_at);
                return new RestData
                {
                    data = rusult.Skip((page - 1) * pagelength).Take(pagelength)
                };
            }
        }

        [HttpGet("notificationsPageCount")]
        public RestData notificationsPageCount(string user_id)
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                var rusult = session.Find<Notifications>(stm => stm
                    .Where($"{Sql.Entity<Notifications>(x => x.user_id):TC} = @user_id")
                    .WithParameters(new { user_id = user_id })
                );
                return new RestData
                {
                    data = Math.Ceiling((decimal)rusult.Count() / 9)
                };
            }
        }

        [HttpGet("notificationsRead")]
        public RestBase notificationsRead(int id)
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    var notifi = _notificationsReponsitory.GetKey(id, session);
                    notifi.is_read = true;

                    if (_notificationsReponsitory.SaveOrUpdate(notifi, uow) > 0)
                    {
                        return new RestBase(EnumErrorCode.OK);
                    }
                    else
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                            }
                        };
                    }
                }
            }
        }

        [AllowAnonymous]
        [HttpGet("notifNumber")]
        public RestData notifNumber()
        {
            using (var session = DbFactory.Create<INpgsqlSession>())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (string.IsNullOrWhiteSpace(getUserId()) == false)
                    {
                        var numbernotif = session.Find<Notifications>(stm => stm
                            .Where($"user_id='{getUserId()}'")
                            .Top(3)
                        ).OrderByDescending(s => s.created_at);

                        return new RestData
                        {
                            data = numbernotif
                        };
                    }
                    else
                    {
                        return new RestData
                        {
                            data = new object[] { }
                        };
                    }
                }
            }
        }

        [HttpGet("getLayerRoles")]
        public RestBase getLayerRoles([FromQuery] string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    IEnumerable<UserLayer> userLayers = session.Find<UserLayer>(statement => statement
                        .Where($"{nameof(UserLayer.user_id)} = @id")
                        .WithParameters(new { id = id })
                    );
                    return new RestData
                    {
                        data = session.Find<Layer>(statement => statement
                            .Include<TableInfo>().Include<TableSchema>())
                            .GroupBy(x => x.table.table_schema_info.description)
                            .Select(x => new
                            {
                                id = x.Key,
                                text = x.Key,
                                expanded = true,
                                items = x.Select(o => new
                                {
                                    id = $"l_{o.id}",
                                    text = o.name_vn,
                                    selected = userLayers.Any(p => p.layer_id == o.id),
                                    raw = o
                                })
                            }).OrderBy(x => x.text).ToList()
                    };
                }
            }
        }

        [HttpGet("getTableRoles")]
        public RestBase getTableRoles([FromQuery] string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    IEnumerable<UserTable> userTables = session.Find<UserTable>(statement => statement
                        .Where($"{nameof(UserTable.user_id)} = @id")
                        .WithParameters(new { id = id })
                    );
                    return new RestData
                    {
                        data = session.Find<TableInfo>(statement => statement
                            .Include<TableSchema>())
                            .GroupBy(x => x.table_schema_info.description)
                            .Select(x => new
                            {
                                id = x.Key,
                                text = x.Key,
                                expanded = true,
                                items = x.Select(o => new
                                {
                                    id = $"t_{o.id}",
                                    text = o.name_vn,
                                    selected = userTables.Any(p => p.table_id == o.id),
                                    raw = o
                                })
                            }).OrderBy(x => x.text).ToList()
                    };
                }
            }
        }

        [HttpPost("saveLayerRoles")]
        public async Task<RestBase> SaveLayerRolesAsync([FromBody] UpdateUserLayersViewModel? model)
        {
            if (string.IsNullOrWhiteSpace(model?.user_id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                var user = await _userManager.FindByIdAsync(model?.user_id);
                if (user != null)
                {
                    using (var session = OpenSession())
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            await uow.Connection.BulkDeleteAsync<UserLayer>(stm => stm
                                .Where($"{nameof(UserLayer.user_id)} = @id")
                                .WithParameters(new { id = model?.user_id })
                            );
                            if (!string.IsNullOrWhiteSpace(model?.layers))
                            {
                                var layers = JsonConvert.DeserializeObject<IEnumerable<int>>(model.layers);
                                if (layers?.Count() > 0)
                                {
                                    foreach (var item in layers)
                                    {
                                        await uow.Connection.InsertAsync(new UserLayer
                                        {
                                            layer_id = item,
                                            user_id = model?.user_id
                                        });
                                    }
                                }
                            }

                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }

        [HttpPost("saveTableRoles")]
        public async Task<RestBase> saveTableRoles([FromBody] UpdateUserTablesViewModel? model)
        {
            if (string.IsNullOrWhiteSpace(model?.user_id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                            new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                var user = await _userManager.FindByIdAsync(model?.user_id);
                if (user != null)
                {
                    using (var session = OpenSession())
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            await uow.Connection.BulkDeleteAsync<UserTable>(stm => stm
                                .Where($"{nameof(UserLayer.user_id)} = @id")
                                .WithParameters(new { id = model?.user_id })
                            );
                            if (!string.IsNullOrWhiteSpace(model?.tables))
                            {
                                var tables = JsonConvert.DeserializeObject<IEnumerable<int>>(model.tables);
                                if (tables?.Count() > 0)
                                {
                                    foreach (var item in tables)
                                    {
                                        await uow.Connection.InsertAsync(new UserTable
                                        {
                                            table_id = item,
                                            user_id = model?.user_id
                                        });
                                    }
                                }
                            }

                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }

        [HttpGet("getApiGranted")]
        public RestBase getApiGranted([FromQuery] string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    IEnumerable<UserAPI> userApisExist = session.Find<UserAPI>(statement => statement
                        .Where($"{nameof(UserAPI.user_id)} = @id")
                        .WithParameters(new { id = id })
                    );
                    IEnumerable<ApiInfo> apiInfos = session.Find<ApiInfo>();
                    IEnumerable<Layer> layers = session.Find<Layer>(statement => statement.Include<TableInfo>());
                    List<UserAPI> apis = new List<UserAPI>();

                    foreach (var api in apiInfos)
                    {
                        foreach (var layer in layers)
                        {
                            apis.Add(new UserAPI
                            {
                                user_id = id,
                                layer_id = layer.id,
                                api_id = api.id,
                                layer = layer,
                                api = api
                            });
                        }
                    }
                    return new RestData
                    {
                        data = apis
                    };
                }
            }
        }
        [HttpGet("folders")]
        public async Task<RestBase> getGroupFolderAsync([FromQuery] string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                ApplicationUser user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        var userFolders = session.Find<UserFolder>(stm => stm
                            .Where($"{nameof(UserFolder.user_id)} = @Id")
                            .WithParameters(new { user.Id })
                        );

                        var folders = session.Find<ThuMucHoSo>();
                        return new RestData
                        {
                            data = folders.Select(x => new
                            {
                                id = x.id,
                                raw = x,
                                text = x.mo_ta,
                                expanded = true,
                                selected = userFolders.Any(p => p.folder_id.Equals(x.id)),
                            })
                        };
                    }
                }

            }
        }
        [HttpGet("getPermissionCurrentUser")]
        public async Task<RestBase> GetPermissionCurrentUserAsync([FromQuery] string schema)
        {
            var user = await _userManager.FindByNameAsync(User.Identity.Name);
            if (user != null)
            {
                var userClaims = (await _userManager.GetClaimsAsync(user))
                    .Where(x => x.Type == EnumClaimTypes.Permission)
                    .Select(x => x.Value);
                if (!string.IsNullOrWhiteSpace(schema))
                {
                    userClaims = userClaims.Where(x => x.Contains(schema));
                }
                return new RestData { data = userClaims };
            }
            else
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại" }
                    }
                };
            }
        }

        [HttpGet("getPermissionRoles")]
        public async Task<RestBase> getPermissionRolesAsync([FromQuery] string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                ApplicationUser user = await _userManager.FindByIdAsync(id);
                if (user != null)
                {
                    using (var session = OpenSession())
                    {
                        var user_permissions = (await session.FindAsync<ApplicationUserPermission>(stm => stm
                            .Where($"{Sql.Entity<ApplicationUserPermission>(x => x.UserId):TC} = @Id")
                            .WithParameters(user)
                        )).ToList();
                        // List<Claim> userClaims = (await _userManager.GetClaimsAsync(user)).Where(x => x.Type == EnumClaimTypes.Permission).ToList();
                        var permissions = session.Find<Permission>();
                        return new RestData
                        {
                            data = permissions
                                .Where(x => x.parent_id > 0)
                                .GroupBy(x => x.parent_id)
                                .Select(x =>
                                {
                                    var parent = permissions.FirstOrDefault(o => o.id == x.Key);
                                    return new
                                    {
                                        id = x.Key,
                                        text = parent?.permission_name,
                                        raw = parent,
                                        expanded = true,
                                        items = x.Select(o => new
                                        {
                                            id = o.id,
                                            text = o.permission_name,
                                            selected = user_permissions.Any(p => p.Permission.Equals(o.permission_value)),
                                            raw = o
                                        })
                                    };
                                }).Where(x => x.id != -1).ToList()
                        };
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }
        [HttpPost("user-columns")]
        public async Task<RestBase> GetUserColumns([FromBody] UserColumnInfoViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.user_id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                ApplicationUser user = await _userManager.FindByIdAsync(model.user_id);
                if (user != null && model.table_ids?.Length > 0)
                {
                    using (var session = OpenSession())
                    {
                        var userColumns = (await session.FindAsync<UserColumn>(stm => stm
                            .Where($"{Sql.Entity<UserColumn>(x => x.user_id):TC} = @Id")
                            .WithParameters(user)
                        )).ToList();
                        // List<Claim> userClaims = (await _userManager.GetClaimsAsync(user)).Where(x => x.Type == EnumClaimTypes.Permission).ToList();
                        var tableColumns = session.Find<TableColumn>(x => x
                            .Include<TableInfo>()
                            .Include<TableSchema>()
                            .Where($"{Sql.Entity<TableColumn>(x => x.table_id):TC} = ANY(@table_ids)")
                            .WithParameters(model)
                        );
                        return new RestData
                        {
                            data = tableColumns
                                .GroupBy(x => x.table)
                                .GroupBy(x => x.Key.table_schema_info)
                                .Select(x =>
                                {
                                    return new
                                    {
                                        id = $"ts_{x.Key.schema_name}",
                                        text = x.Key?.description,
                                        raw = x.Key,
                                        expanded = true,
                                        items = x.OrderBy(x => x.Key.name_vn).Select(o =>
                                        {
                                            o.Key.columns = null;
                                            return new
                                            {
                                                id = $"t_{o.Key.id}",
                                                text = o.Key?.name_vn,
                                                raw = o.Key,
                                                expanded = false,
                                                items = o.OrderBy(x => x.order).Select(p =>
                                                {
                                                    p.table = null;
                                                    return new
                                                    {
                                                        id = p.id,
                                                        text = p.name_vn,
                                                        selected = userColumns.Any(n => n.column_id.Equals(p.id)),
                                                        raw = p
                                                    };
                                                })
                                            };
                                        })
                                    };
                                })
                        };
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }
        [HttpGet("reports")]
        public async Task<RestBase> GetUserReports([FromQuery] string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                ApplicationUser user = await _userManager.FindByIdAsync(id);
                if (user != null)
                {
                    using (var session = OpenSession())
                    {
                        var userReports = (await session.FindAsync<UserReport>(stm => stm
                            .Where($"{Sql.Entity<UserReport>(x => x.user_id):TC} = @Id")
                            .WithParameters(user)
                        )).ToList();
                        var reports = session.Find<BaoCao>(x => x
                        .Include<TableSchema>());
                        return new RestData
                        {
                            data = reports
                                .GroupBy(x => x.tableSchema)
                                .Select(x =>
                                {
                                    return new
                                    {
                                        id = x?.Key?.schema_name,
                                        text = "Báo cáo " + x?.Key?.description,
                                        expanded = true,
                                        items = x.OrderBy(x => x.order).Select(o => new
                                        {
                                            id = o.id,
                                            text = o.mo_ta,
                                            selected = userReports.Any(p => p.report_id.Equals(o.id)),
                                            raw = o
                                        })
                                    };
                                })
                        };
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }

        [HttpPost("savePermissionRoles")]
        public async Task<RestBase> savePermissionRolesAsync([FromBody] UpdateUserPermissionsViewModel? model)
        {
            if (string.IsNullOrWhiteSpace(model?.user_id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using var session = OpenSession();
                ApplicationUser user = await _userManager.FindByIdAsync(model?.user_id);

                if (user != null)
                {
                    // var deleted = await session.ExecuteAsync($"DELETE FROM {Sql.Entity<ApplicationUserPermission>():T} WHERE {Sql.Entity<ApplicationUserPermission>(x => x.UserId):TC} = @Id", user);

                    using var uow = new UnitOfWork(DbFactory, session);
                    await uow.Connection.BulkDeleteAsync<ApplicationUserPermission>(stm => stm
                                                   .Where($"{Sql.Entity<ApplicationUserPermission>(x => x.UserId):TC} = @id")
                                                   .WithParameters(new { id = model?.user_id }));
                    if (!string.IsNullOrWhiteSpace(model?.permissions))
                    {
                        var permissions = JsonConvert.DeserializeObject<IEnumerable<string>>(model.permissions);
                        if (permissions != null && permissions.Count() > 0)
                        {
                            foreach (var permission in permissions)
                            {
                                await uow.Connection.InsertAsync(new ApplicationUserPermission
                                {
                                    UserId = user.Id,
                                    Permission = permission
                                });
                            }
                        }
                    }

                    //await _userManager.RemoveClaimsAsync(user, (await _userManager.GetClaimsAsync(user)).Where(x => x.Type == EnumClaimTypes.Permission));

                    //if (permissions != null && permissions.Count > 0)
                    //{
                    //    await _userManager.AddClaimsAsync(user, permissions.Select(x => new Claim(EnumClaimTypes.Permission, x)));
                    //}

                    var roles = await _userManager.GetRolesAsync(user);
                    await _userManager.RemoveFromRolesAsync(user, roles);
                    if (!string.IsNullOrWhiteSpace(model?.role))
                    {
                        await _userManager.AddToRoleAsync(user, model.role);
                    }
                    else
                        await _userManager.AddToRoleAsync(user, EnumRoles.USER);
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }

        [HttpGet("getRegionRoles")]
        public RestBase getRegionRoles([FromQuery] string? id, [FromQuery] string? area_code, [FromQuery] int? area_type)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    IEnumerable<UserRegion> userRegions = session.Find<UserRegion>(statement => statement
                        .Where($"{nameof(UserRegion.user_id)} = @id")
                        .WithParameters(new { id = id })
                    );
                    switch (area_type)
                    {
                        case 1:
                            var includesDistrictId = new string[] { };
                            if (userRegions.Count(x => x.area_type == 3) > 0)
                            {
                                var sql = $@"select DISTINCT {Sql.Entity<Commune>(x => x.parent_id):TC} from {Sql.Entity<Commune>():T} 
                                    WHERE {Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@listCommunes)";

                                includesDistrictId = session.Query<string>($"{sql}", new
                                {
                                    listCommunes = userRegions.Where(x => x.area_type == 3).Select(x => x.area_code).ToArray(),
                                }).ToArray();
                            }
                            var districts = session.Find<District>(statement => statement
                                .Where($"{Sql.Entity<District>(x => x.parent_id):TC} = @area_code and {Sql.Entity<District>(x => x.visible):TC} is true")
                                .WithParameters(new { area_code })
                                .OrderBy($"{Sql.Entity<District>(x => x.name_vn):TC}")
                            ).Select(o => new
                            {
                                id = o.area_id,
                                text = o.name_vn,
                                selected = userRegions?.Any(p => p.area_code?.Equals(o.area_id) == true) == true ? true : (includesDistrictId.Any(p => p?.Equals(o.area_id) == true) ? (bool?)null : false),
                                raw = o,
                                parentId = o.parent_id,
                                isParent = true,
                                area_type = 2,
                            });
                            return new RestData
                            {
                                data = districts
                            };
                        case 2:
                            var communes = session.Find<Commune>(statement => statement
                                .Where($"{Sql.Entity<Commune>(x => x.parent_id):TC} = @area_code and {Sql.Entity<Commune>(x => x.visible):TC} is true")
                                .WithParameters(new { area_code })
                                .OrderBy($"{Sql.Entity<Commune>(x => x.name_vn):TC}")
                            ).Select(o => new
                            {
                                id = o.area_id,
                                text = o.name_vn,
                                parentId = o.parent_id,
                                isParent = false,
                                selected = userRegions.Any(p => p.area_code?.Equals(o.area_id) == true),
                                raw = o,
                                area_type = 3,
                            });
                            return new RestData
                            {
                                data = communes
                            };
                        default:
                            var includesProvinceId = new string[] { };
                            if (userRegions.Count(x => x.area_type == 2 || x.area_type == 3) > 0)
                            {
                                var sql = new List<string> { };
                                if (userRegions.Count(x => x.area_type == 2) > 0)
                                {
                                    sql.Add($@"select DISTINCT {Sql.Entity<District>(x => x.parent_id):TC} from {Sql.Entity<District>():T} 
                                    WHERE {Sql.Entity<District>(x => x.area_id):TC} = ANY(@listDistricts)");
                                }
                                if (userRegions.Count(x => x.area_type == 3) > 0)
                                {
                                    sql.Add($@"select DISTINCT {Sql.Entity<Commune>(x => x.proid_2004):TC} from {Sql.Entity<Commune>():T} 
                                    WHERE {Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@listCommunes)");
                                }
                                includesProvinceId = session.Query<string>($"{string.Join(" UNION ", sql)}", new
                                {
                                    listDistricts = userRegions.Where(x => x.area_type == 2).Select(x => x.area_code).ToArray(),
                                    listCommunes = userRegions.Where(x => x.area_type == 3).Select(x => x.area_code).ToArray(),
                                }).ToArray();
                            }
                            var value = includesProvinceId.Contains("01") == true ? (bool?)null : false;
                            var provinces = session.Find<Province>(statement => statement
                                    .Where($"{Sql.Entity<Province>(x => x.visible):TC} is true")
                                    .OrderBy($"{Sql.Entity<Province>(x => x.name_vn):TC}")
                                ).Select(o => new
                                {
                                    id = o.area_id,
                                    text = o.name_vn,
                                    selected = userRegions?.Any(p => p.area_code?.Equals(o.area_id) == true) == true ? true : (includesProvinceId.Any(p => p?.Equals(o.area_id) == true) ? (bool?)null : false),
                                    raw = o,
                                    area_type = 1,
                                    isParent = true,
                                });
                            return new RestData
                            {
                                data = provinces
                            };
                    }
                    // var communes = session.Find<Commune>(statement => statement
                    //    .Include<District>()
                    //    .Where($"{Sql.Entity<Commune>(x => x.visible):TC} = true")
                    // ).ToList();
                    // return new RestData
                    // {
                    //     data = communes
                    //             .GroupBy(x => x.parent_id)
                    //             .Select(x =>
                    //             {
                    //                 var parent = communes.FirstOrDefault(o => o.parent_id == x.Key);
                    //                 return new
                    //                 {
                    //                     id = x.Key,
                    //                     text = parent?.parent_name,
                    //                     raw = parent?.district,
                    //                     // selected = userRegions.Any(p => p.area_code?.Equals(x.Key) == true),
                    //                     expanded = true,
                    //                     items = x.Select(o => new
                    //                     {
                    //                         id = o.area_id,
                    //                         text = o.name_vn,
                    //                         selected = userRegions.Any(p => p.area_code?.Equals(o.area_id) == true),
                    //                         raw = o
                    //                     })
                    //                 };
                    //             }).Where(x => !string.IsNullOrWhiteSpace(x.id)).ToList()
                    // };
                }
            }
        }

        [HttpPost("saveRegionRoles")]
        public async Task<RestBase> SaveRegionRolesAsync([FromBody] UpdateUserRegionsViewModel? model)
        {
            if (string.IsNullOrWhiteSpace(model?.user_id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                var user = await _userManager.FindByIdAsync(model?.user_id);
                if (user != null)
                {
                    using (var session = OpenSession())
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            await uow.Connection.BulkDeleteAsync<UserRegion>(stm => stm
                                .Where($"{nameof(UserRegion.user_id)} = @id")
                                .WithParameters(new { id = model?.user_id })
                            );
                            if (!string.IsNullOrWhiteSpace(model?.regions))
                            {
                                var regions = JsonConvert.DeserializeObject<IEnumerable<UserRegion>>(model.regions);

                                if (regions?.Count() > 0)
                                {
                                    foreach (var item in regions)
                                    {
                                        await uow.Connection.InsertAsync(item);
                                    }
                                }
                            }

                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }
        [HttpPost("save-folders")]
        public async Task<RestBase> SaveFoldersAsync([FromBody] UpdateUserFoldersViewModel? model)
        {
            if (string.IsNullOrWhiteSpace(model?.user_id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                var user = await _userManager.FindByIdAsync(model?.user_id);
                if (user != null)
                {
                    using (var session = OpenSession())
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            await uow.Connection.BulkDeleteAsync<UserFolder>(stm => stm
                                .Where($"{nameof(UserFolder.user_id)} = @id")
                                .WithParameters(new { id = model?.user_id })
                            );
                            if (!string.IsNullOrWhiteSpace(model?.folders))
                            {
                                var folders = JsonConvert.DeserializeObject<IEnumerable<int>>(model.folders);
                                if (folders?.Count() > 0)
                                {
                                    foreach (var item in folders)
                                    {
                                        await uow.Connection.InsertAsync(new UserFolder
                                        {
                                            folder_id = item,
                                            user_id = model?.user_id
                                        });
                                    }
                                }
                            }
                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }
        [HttpPost("save-columns")]
        public async Task<RestBase> SaveColumnsAsync([FromBody] UpdateUserColumnsViewModel? model)
        {
            if (string.IsNullOrWhiteSpace(model?.user_id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                var user = await _userManager.FindByIdAsync(model.user_id);
                if (user != null)
                {
                    using (var session = OpenSession())
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            await uow.Connection.BulkDeleteAsync<UserColumn>(stm => stm
                                .Where($"{nameof(UserColumn.user_id)} = @id")
                                .WithParameters(new { id = model.user_id })
                            );
                            if (!string.IsNullOrWhiteSpace(model.columns))
                            {
                                var columns = JsonConvert.DeserializeObject<IEnumerable<int>>(model.columns);
                                if (columns?.Count() > 0)
                                {
                                    foreach (var item in columns)
                                    {
                                        await uow.Connection.InsertAsync(new UserColumn
                                        {
                                            column_id = item,
                                            user_id = model.user_id
                                        });
                                    }
                                }
                            }

                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }
        [HttpPost("save-reports")]
        public async Task<RestBase> SaveReportsAsync([FromBody] UpdateUserReportsViewModel? model)
        {
            if (string.IsNullOrWhiteSpace(model?.user_id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                var user = await _userManager.FindByIdAsync(model.user_id);
                if (user != null)
                {
                    using (var session = OpenSession())
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            await uow.Connection.BulkDeleteAsync<UserReport>(stm => stm
                                .Where($"{nameof(UserReport.user_id)} = @id")
                                .WithParameters(new { id = model.user_id })
                            );
                            if (!string.IsNullOrWhiteSpace(model.reports))
                            {
                                var reports = JsonConvert.DeserializeObject<IEnumerable<int>>(model.reports);
                                if (reports?.Count() > 0)
                                {
                                    foreach (var item in reports)
                                    {
                                        await uow.Connection.InsertAsync(new UserReport
                                        {
                                            report_id = item,
                                            user_id = model.user_id
                                        });
                                    }
                                }
                            }

                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
                else
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }

        [HttpPost("setLock")]
        public async Task<RestBase> setLock([FromBody] ApplicationUser model)
        {
            if (model == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            var user = await _userManager.FindByIdAsync(model.Id);
            if (user == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!" }
                    }
                };
            }
            var setLock = !model.LockoutEnabled;
            var result = await _userManager.SetLockoutEnabledAsync(user, setLock);
            if (result == IdentityResult.Success)
            {
                if (setLock) result = await _userManager.SetLockoutEndDateAsync(user, DateTime.Now.AddYears(1000).ToUniversalTime());
                return new RestBase(EnumErrorCode.OK);
            }
            else
            {
                return new RestError
                {
                    errors = result.Errors.Select(s => new RestErrorDetail
                    {
                        message = s.Description
                    }).ToArray()
                };
            }
        }

        [HttpGet("getRoles")]
        public RestBase getAllRoles()
        {
            var rolesData = _dbContext.Roles.Where(x => x.Name != "sa").ToList();
            return new RestData
            {
                data = rolesData.Select(x => new DevExprSelectBox()
                {
                    value = x.Id,
                    text = ParseRoleNameVN(x.Name)
                }).OrderBy(x => x.text)
            };
        }

        [HttpGet("getRoles/{role}")]
        public RestBase getAllRoles([FromRoute] string role)
        {
            return new RestData
            {
                data = _dbContext.Roles.Where(x => x.Id == role).ToList().Select(x => new DevExprSelectBox()
                {
                    value = x.Id,
                    text = ParseRoleNameVN(x.Name)
                })
            };
        }

        [HttpPost("saveOfUpdateRole")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_USERS))]
        public async Task<RestBase> saveOfUpdateRoles([FromBody] CreateUserDTO dto)
        {
            if (dto == null)
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            else
            {
                ApplicationUser user = await _userManager.FindByNameAsync(dto.UserName);
                if (user == null)
                {
                    return new RestError(400, "Tên người dùng không tồn tại, vui lòng kiểm tra lại!");
                }
                else
                {
                    if (string.IsNullOrWhiteSpace(dto.GroupId))
                    {
                        //
                    }
                    else
                    {
                        var group = await _groupManager.FindByIdAsync(dto.GroupId);
                        if (group != null)
                        {
                            var role = await _roleManager.FindByIdAsync(group.RoleId);
                            if (role != null)
                            {
                                await saveOrUpdateRole(user, role.Name);
                            }
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPost("saveOrUpdateClaim")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_USERS))]
        public async Task<RestBase> saveOrUpdateClaims([FromBody] CreateUserDTO dto)
        {
            if (dto == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            }
            else
            {
                ApplicationUser user = await _userManager.FindByNameAsync(dto.UserName);
                if (user == null)
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Tên người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                else
                {
                    user = await _userManager.FindByEmailAsync(dto.Email);
                    if (user == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Email người dùng không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    else
                    {
                        if (!string.IsNullOrWhiteSpace(dto.FullName))
                        {
                            await saveOrUpdateClaim(user, ClaimTypes.GivenName, dto.FullName);
                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        [HttpPost]
        [Route("changePassword")]
        public async Task<RestBase> changePassword([FromBody] ChangePasswordUser dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.userName))
                return new RestError();
            if (dto.newPasswd != dto.confirmNewPasswd)
            {
                return new RestError
                {
                    errors = new RestErrorDetail[]
                    {
                         new RestErrorDetail
                         {
                            message = "Mật khẩu xác nhận không trùng khớp! Vui lòng kiểm tra lại"
                         }
                    }
                };
            }
            ApplicationUser user = await _userManager.FindByNameAsync(dto.userName);

            if (user == null)
            {
                return new RestError
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail
                        {
                            message = "Người dùng không tồn tại! Vui lòng kiểm tra lại"
                        }
                    }
                };
            }
            if (!(await _userManager.CheckPasswordAsync(user, dto.newPasswd)))
            {
                var result = await _userManager.ResetPasswordAsync(user, await _userManager.GeneratePasswordResetTokenAsync(user), dto.newPasswd);
                if (result == IdentityResult.Success)
                {
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                {
                    return new RestError(result.Errors.FirstOrDefault().Description);
                }
            }
            else
            {
                return new RestError
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail
                        {
                            message = "Mật khẩu trùng với mật khẩu cũ! Vui lòng kiểm tra lại"
                        }
                    }
                };
            }
        }

        private async Task<IdentityResult> saveOrUpdateRole(ApplicationUser user, string RoleName)
        {
            if (user != null && string.IsNullOrWhiteSpace(RoleName) == false)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Count > 0)
                {
                    await _userManager.RemoveFromRolesAsync(user, roles);
                }
                await _userManager.AddToRoleAsync(user, RoleName);
            }

            return IdentityResult.Failed(new IdentityError[] { });
        }

        private async Task<IdentityResult> saveOrUpdateClaim(ApplicationUser user, string Type, string Value)
        {
            if (user == null || string.IsNullOrWhiteSpace(Value) || string.IsNullOrWhiteSpace(Type))
                return IdentityResult.Failed(new IdentityError[] { });
            var claims = await _userManager.GetClaimsAsync(user);
            if (claims != null)
            {
                if (claims.Any(x => x.Type == Type))
                    await _userManager.RemoveClaimsAsync(user, claims.Where(x => x.Type == Type));
                await _userManager.AddClaimAsync(user, new Claim(Type, Value));
            }
            return IdentityResult.Failed(new IdentityError[] { });
        }

        private async Task<IdentityResult> saveOrUpdatePermission(ApplicationUser user, string Type, string Value)
        {
            using var session = OpenSession();
            if (user == null || string.IsNullOrWhiteSpace(Value) || string.IsNullOrWhiteSpace(Type))
                return IdentityResult.Failed(new IdentityError[] { });
            var user_permission = (await session.FindAsync<ApplicationUserPermission>(stm => stm
                .Where($"{Sql.Entity<ApplicationUserPermission>(x => x.UserId):TC} = @UserId AND {Sql.Entity<ApplicationUserPermission>(x => x.Permission):TC} = @Type")
                .WithParameters(new { UserId = user.Id, Type = Type })
            )).FirstOrDefault();
            if (user_permission != null)
            {
                await session.DeleteAsync(user_permission);
                ApplicationUserPermission newUserPermission = new ApplicationUserPermission
                {
                    UserId = user.Id,
                    Permission = Value
                };
                await session.InsertAsync(newUserPermission);
            }
            return IdentityResult.Failed(new IdentityError[] { });
        }

        private string ParseRoleNameVN(string role)
        {
            var role_vn = string.Empty;
            switch (role)
            {
                case EnumRoles.ADMINISTRATOR:
                    role_vn = "Quản trị viên";
                    break;
                case EnumRoles.SA:
                    role_vn = "Quản trị viên";
                    break;
                case EnumRoles.USER:
                    role_vn = "Người dùng";
                    break;
                case EnumRoles.CHUYEN_VIEN:
                    role_vn = "Chuyên viên";
                    break;
                case EnumRoles.GIAM_DOC:
                    role_vn = "Giám đốc";
                    break;
                case EnumRoles.PHO_GIAM_DOC:
                    role_vn = "Phó giám đốc";
                    break;
                case EnumRoles.TRUONG_PHONG:
                    role_vn = "Trưởng phòng";
                    break;
                case EnumRoles.PHO_PHONG:
                    role_vn = "Phó phòng";
                    break;
                default:
                    role_vn = "Người dùng";
                    break;
            }
            return role_vn;
        }

        private async Task<IdentityResult> AddLayersForNewUserAsync(string groupId, ApplicationUser user)
        {
            using (var session = OpenSession())
            {
                var group = await _groupManager.FindByIdAsync(groupId);
                if (group != null)
                {
                    var layer_ids = session.Find<GroupLayer>(statement => statement
                        .Where($"{nameof(GroupLayer.group_id):C} = @Id")
                        .WithParameters(new { Id = group.Id })
                    ).Select(x => x.layer_id);
                    if (layer_ids.Count() > 0)
                    {
                        foreach (var layer_id in layer_ids)
                        {
                            await session.InsertAsync(new UserLayer
                            {
                                user_id = user.Id,
                                layer_id = layer_id
                            });
                        }
                    }
                }
            }
            return IdentityResult.Success;
        }

        private async Task<IdentityResult> AddClaimsForNewUserAsync(string groupId, ApplicationUser user)
        {
            using (var session = OpenSession())
            {
                var group = await _groupManager.FindByIdAsync(groupId);
                if (group != null)
                {
                    var permissions = session.Find<GroupClaim>(statement => statement
                        .Where($"{nameof(GroupClaim.group_id):C} = @Id AND {nameof(GroupClaim.claim_type)} = @claim_type")
                        .WithParameters(new { Id = group.Id, claim_type = EnumClaimTypes.Permission })
                    ).Select(x => x.claim_value);
                    if (permissions.Count() > 0)
                    {
                        await _userManager.AddClaimsAsync(user, permissions.Select(x => new Claim(EnumClaimTypes.Permission, x)));
                    }
                }
            }
            return IdentityResult.Success;
        }
        private async Task<IdentityResult> AddPermissionForNewUserAsync(string groupId, ApplicationUser user)
        {
            using (var session = OpenSession())
            {
                var group = await _groupManager.FindByIdAsync(groupId);
                if (group != null)
                {
                    var permissions = session.Find<GroupClaim>(statement => statement
                        .Where($"{nameof(GroupClaim.group_id):C} = @Id AND {nameof(GroupClaim.claim_type)} = @claim_type")
                        .WithParameters(new { Id = group.Id, claim_type = EnumClaimTypes.Permission })
                    ).Select(x => x.claim_value);
                    if (permissions.Count() > 0)
                    {
                        foreach (var permission in permissions)
                        {
                            await session.InsertAsync(new ApplicationUserPermission
                            {
                                UserId = user.Id,
                                Permission = permission
                            });
                        }
                        //await _userManager.AddClaimsAsync(user, permissions.Select(x => new Claim(EnumClaimTypes.Permission, x)));
                    }
                }
            }
            return IdentityResult.Success;
        }
    }
}