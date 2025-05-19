using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Linq;
using Dapper;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Identity.Managers;
using VietGIS.Infrastructure.Identity.Entities;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Identity.DbContexts;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.Entities;
using Dapper.FastCrud;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Extensions;
using OpenGIS.Module.Core.ViewModels;
using Microsoft.AspNetCore.Authorization;
using OpenGIS.Module.Core.Models.DevExtreme;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;
using System.Net;
using Aspose.Cells;
using VietGIS.Infrastructure.Models.Regional;
using SharpKml.Dom;
using Humanizer;
using OpenGIS.Module.Core.Models.Entities.QLHS;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_GROUPS))]
    public class GroupController : BaseController
    {
        protected readonly IMapper _mapper;
        protected readonly ApplicationDbContext _dbContext;
        protected readonly ApplicationUserManager _userManager;
        protected readonly ApplicationGroupManager _groupManager;
        protected readonly RoleManager<ApplicationRole> _roleManager;
        protected readonly INotificationsReponsitory _notificationsReponsitory;
        protected readonly IDbFactory _dbFactory;

        public GroupController(IDbFactory dbFactory,
            IMapper mapper, ApplicationDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            GroupManager<ApplicationGroup> groupManager,
            RoleManager<ApplicationRole> roleManager,
            INotificationsReponsitory notificationsReponsitory)
            : base(dbFactory)
        {
            _mapper = mapper;
            _dbContext = dbContext;
            _userManager = (ApplicationUserManager)userManager;
            _groupManager = (ApplicationGroupManager)groupManager;
            _roleManager = roleManager;
            _notificationsReponsitory = notificationsReponsitory;
            _dbFactory = dbFactory;
        }

        [HttpGet("{id}/users")]
        public async Task<RestBase> listGroupAsync([FromRoute] string id = "")
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError((int)HttpStatusCode.NotModified, "Vui lòng kiểm tra lại tham số!");
            }
            else
            {
                ApplicationGroup group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError((int)HttpStatusCode.NotFound, "Nhóm người dùng không tồn tại!");
                }
                else
                {
                    return new RestData
                    {
                        data = await toViewsAsync(await _userManager.GetUsersInGroupAsync(group))
                    };
                }
            }
        }

        [HttpGet("users")]
        public async Task<RestBase> List([FromQuery] DxGridDTO param)
        {

            using (var session = OpenSession())
            {
                var users = _userManager.Users.ToList();
                if (param.skip > 0)
                {
                    users = _userManager.Users.Skip(param.skip).Take(param.take).ToList();
                }
                return new RestData
                {
                    data = await toViewsAsync(users)
                };
            }
        }

        [HttpGet("orphanUsers")]
        public async Task<RestBase> listOrphanUsers()
        {
            List<ApplicationUser> users = new List<ApplicationUser>();
            foreach (var user in _userManager.Users)
            {
                if ((await _userManager.GetGroupsAsync(user)).Count() == 0)
                {
                    users.Add(user);
                }
            }
            return new RestData
            {
                data = await toViewsAsync(users)
            };
        }

        [HttpGet("list")]
        public RestBase listGroup()
        {
            return new RestData()
            {
                data = _groupManager.Groups.OrderBy(x => x.Name).ToList()
            };
        }

        [HttpPost("saveOrUpdate")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_GROUPS))]
        public async Task<RestBase> saveOrUpdateGroupAsync([FromBody] ApplicationGroup dto)
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
                IdentityResult result = IdentityResult.Failed(null);

                dto.Code = _dbContext.Roles.Where(x => x.Id == dto.RoleId).FirstOrDefault().Name;

                if (string.IsNullOrWhiteSpace(dto.Id))
                {
                    result = await _groupManager.CreateAsync(new ApplicationGroup
                    {
                        Code = dto.Code,
                        Name = dto.Name,
                        Description = dto.Description,
                        LockoutEnabled = false,
                        RoleId = dto.RoleId
                    });
                }
                else
                {
                    ApplicationGroup g = await _groupManager.FindByIdAsync(dto.Id);
                    if (g != null)
                    {
                        g.Name = dto.Name;
                        g.Code = dto.Code;
                        g.Description = dto.Description;
                        g.LockoutEnabled = false;
                        g.RoleId = dto.RoleId;

                        result = await _groupManager.UpdateAsync(g);
                    }
                    else
                    {
                        result = await _groupManager.CreateAsync(new ApplicationGroup
                        {
                            Code = dto.Code,
                            Name = dto.Name,
                            Description = dto.Description,
                            LockoutEnabled = false,
                            RoleId = dto.RoleId
                        });
                    }
                }

                if (result == IdentityResult.Success)
                    return new RestBase(EnumErrorCode.OK);
                else
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng kiểm tra lại!" }
                        }
                    };
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_GROUPS))]
        public async Task<RestBase> deleteGroupAsync([FromForm] ApplicationGroup dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Id))
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!" }
                    }
                };
            var group = await _groupManager.FindByIdAsync(dto.Id);
            if (group == null)
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại" }
                    }
                };
            IEnumerable<ApplicationUser> users = await _userManager.GetUsersInGroupAsync(group);
            foreach (var user in users)
            {
                await _userManager.DeleteAsync(user);
            }
            if (await _groupManager.DeleteAsync(group) == IdentityResult.Success)
                return new RestBase(EnumErrorCode.OK);
            return new RestError(EnumErrorCode.ERROR)
            {
                errors = new RestErrorDetail[]
                {
                    new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                }
            };
        }

        [HttpGet("getLayerRoles")]
        public async Task<RestBase> getLayerRoles([FromQuery] string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!"}
                    }
                };
            }
            else
            {
                var group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại!"}
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        IEnumerable<GroupLayer> groupLayers = session.Find<GroupLayer>(stm => stm
                            .Where($"{nameof(GroupLayer.group_id)} = @id")
                            .WithParameters(new { id = group.Id })
                        );
                        return new RestData
                        {
                            data = session.Find<Layer>(statement => statement.Include<TableInfo>())
                                .GroupBy(x => x.table.table_schema)
                                .Select(x => new
                                {
                                    id = x.Key,
                                    text = x.Key,
                                    expanded = true,
                                    items = x.Select(o => new
                                    {
                                        id = $"l_{o.id}",
                                        text = o.name_vn,
                                        selected = groupLayers.Any(p => p.layer_id == o.id),
                                        raw = o
                                    })
                                }).ToList()
                        };
                    }
                }
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
                var group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        var groupClaims = session.Find<GroupClaim>(stm => stm
                            .Where($"{nameof(GroupClaim.claim_type)} = @claim_type AND {nameof(GroupClaim.group_id)} = @group_id")
                            .WithParameters(new { claim_type = EnumClaimTypes.Permission, group_id = id })
                        );

                        var permissions = session.Find<Permission>();
                        return new RestData
                        {
                            data = permissions
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
                                            selected = groupClaims.Any(p => p.claim_value.Equals(o.permission_value)),
                                            raw = o
                                        })
                                    };
                                }).Where(x => x.id != -1).ToList()
                        };
                    }
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
                var group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        var groupFolders = session.Find<GroupFolder>(stm => stm
                            .Where($"{nameof(GroupFolder.group_id)} = @group_id")
                            .WithParameters(new { group_id = id })
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
                                selected = groupFolders.Any(p => p.folder_id.Equals(x.id)),
                            })
                        };
                    }
                }

            }
        }

        [HttpGet("getRegionRoles")]
        public async Task<RestBase> getRegionRolesAsync([FromQuery] string id)
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
                var group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        var groupRegions = session.Find<GroupRegion>(stm => stm
                            .Where($"{nameof(GroupRegion.group_id)} = @group_id")
                            .WithParameters(new { group_id = id })
                        ).ToList();

                        var visibleProvinces = session.Find<Province>(statement => statement
                            .Where($"{nameof(Province.visible)}")
                        ).ToList();
                        var districts = session.Find<District>(statement => statement
                            .Include<Province>()
                            .Where($"{Sql.Entity<District>(x => x.parent_id):TC} = ANY(@visible_province_ids)")
                            .WithParameters(new { visible_province_ids = visibleProvinces.Select(x => x.area_id).ToArray() })
                        ).ToList();

                        return new RestData
                        {
                            data = districts
                                .GroupBy(x => x.parent_id)
                                .Select(x =>
                                {
                                    var parent = districts.FirstOrDefault(o => o.parent_id == x.Key);
                                    return new
                                    {
                                        id = x.Key,
                                        text = parent?.parent_name,
                                        raw = parent?.province,
                                        expanded = true,
                                        items = x.Select(o => new
                                        {
                                            id = o.area_id,
                                            text = o.name_vn,
                                            selected = groupRegions.Any(p => p.district_code.Equals(o.area_id)),
                                            raw = o
                                        })
                                    };
                                }).Where(x => !string.IsNullOrWhiteSpace(x.id)).ToList()
                        };
                    }
                }

            }
        }

        [HttpGet("getUserRoles")]
        public async Task<RestBase> getUserRolesAsync([FromQuery] string id)
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
                var group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        var userInGroups = await toViewsAsync(await _userManager.GetUsersInGroupAsync(group));

                        var users = await toViewsAsync(_userManager.Users.ToList());
                        return new RestData
                        {
                            data = users.Select(x => new
                            {
                                id = x.id,
                                text = !string.IsNullOrWhiteSpace(x.user_info?.full_name) ? x.user_info?.full_name : x.user_name,
                                selected = userInGroups.Any(p => p.id.Equals(x.id)),
                                raw = x
                            }).Where(x => !string.IsNullOrWhiteSpace(x.id)).ToList()
                        };
                    }
                }
            }
        }

        [HttpGet("getClaimValuesById")]
        public RestBase GetClaimValuesById([FromQuery] string groupId)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<GroupClaim>(stm => stm
                        .Where($"{nameof(GroupClaim.claim_type)} = @claim_type AND {nameof(GroupClaim.group_id)} = @group_id")
                        .WithParameters(new { claim_type = EnumClaimTypes.Permission, group_id = groupId })
                    ).Select(x => x.claim_value).ToList()
                };
            }
        }

        [HttpGet("getLayerRoleById")]
        public RestBase GetLayerRoleById([FromQuery] string groupId)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<GroupLayer>(stm => stm
                        .Where($"{nameof(GroupLayer.group_id)} = @group_id")
                        .WithParameters(new { group_id = groupId })
                    ).Select(x => x.layer_id).ToList()
                };
            }
        }

        [HttpGet("getRegionRoleById")]
        public RestBase getRegionRoleById([FromQuery] string groupId)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<GroupRegion>(stm => stm
                        .Where($"{nameof(GroupRegion.group_id)} = @group_id")
                        .WithParameters(new { group_id = groupId })
                    ).Select(x => x.district_code).ToList()
                };
            }
        }

        [HttpPost("save-folders")]
        public async Task<RestBase> saveFolders([FromForm] string id, [FromForm] List<int> folders)
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
                    ApplicationGroup group = await _groupManager.FindByIdAsync(id);
                    if (group == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                    new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        var oldFolderIds = session.Find<GroupFolder>(stm => stm
                            .Where($"{nameof(GroupFolder.group_id)} = @id")
                            .WithParameters(new { id = id })
                        ).Select(x => x.folder_id).ToList();
                        var userInGroup = await _userManager.GetUsersInGroupAsync(group);
                        if (oldFolderIds.Count() > 0 && userInGroup.Count() > 0)
                        {
                            string deleteQueryUserLayers = $"DELETE FROM {Sql.Entity<UserFolder>():T} " +
                                $"WHERE {Sql.Entity<UserFolder>(x => x.user_id):TC} = ANY(@userIds) " +
                                $"AND {Sql.Entity<UserFolder>(x => x.folder_id):TC} = ANY(@oldFolderIds)";
                            session.Execute(deleteQueryUserLayers, new { userIds = userInGroup.Select(x => x.Id).ToArray(), oldFolderIds = oldFolderIds.ToArray() });
                        }
                        session.Execute($"DELETE FROM {Sql.Entity<GroupFolder>():T} WHERE {Sql.Entity<GroupFolder>(x => x.group_id):TC}=@id", new { id = id });

                        if (folders != null && folders.Count > 0)
                        {
                            foreach (var folderId in folders)
                            {
                                session.Query<GroupFolder>($"INSERT INTO {Sql.Entity<GroupFolder>():T} ({nameof(GroupFolder.group_id)}, {nameof(GroupFolder.folder_id)}) VALUES (@id, @folderId)", new { id, folderId });
                                if (userInGroup.Count() > 0)
                                {
                                    foreach (var user in userInGroup)
                                    {
                                        var count = session.Count<UserFolder>(stm => stm
                                            .Where($"{nameof(UserFolder.folder_id)} = @folderId AND {nameof(UserLayer.user_id)} = @userId")
                                            .WithParameters(new { folderId, userId = user.Id })
                                        );
                                        if (count == 0)
                                        {
                                            session.Query<UserFolder>($"INSERT INTO {Sql.Entity<UserFolder>():T} ({nameof(UserFolder.user_id)}, {nameof(UserFolder.folder_id)}) VALUES (@userId, @folderId)", new { userId = user.Id, folderId });
                                        }
                                    }
                                }
                            }
                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }
        [HttpPost("saveLayerRoles")]
        public async Task<RestBase> saveLayerRoles([FromForm] string id, [FromForm] List<int> layers)
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
                    ApplicationGroup group = await _groupManager.FindByIdAsync(id);
                    if (group == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                    new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        var oldLayerIds = session.Find<GroupLayer>(stm => stm
                            .Where($"{nameof(GroupLayer.group_id)} = @id")
                            .WithParameters(new { id = id })
                        ).Select(x => x.layer_id).ToList();
                        var userInGroup = await _userManager.GetUsersInGroupAsync(group);
                        if (oldLayerIds.Count() > 0 && userInGroup.Count() > 0)
                        {
                            string deleteQueryUserLayers = $"DELETE FROM {Sql.Entity<UserLayer>():T} " +
                                $"WHERE {Sql.Entity<UserLayer>(x => x.user_id):TC} = ANY(@userIds) " +
                                $"AND {Sql.Entity<UserLayer>(x => x.layer_id):TC} = ANY(@oldLayerIds)";
                            session.Execute(deleteQueryUserLayers, new { userIds = userInGroup.Select(x => x.Id).ToArray(), oldLayerIds = oldLayerIds.ToArray() });
                        }
                        session.Execute($"DELETE FROM {Sql.Entity<GroupLayer>():T} WHERE {Sql.Entity<GroupLayer>(x => x.group_id):TC}=@id", new { id = id });

                        if (layers != null && layers.Count > 0)
                        {
                            foreach (var layerId in layers)
                            {
                                session.Query<GroupLayer>($"INSERT INTO {Sql.Entity<GroupLayer>():T} ({nameof(GroupLayer.group_id)}, {nameof(GroupLayer.layer_id)}) VALUES (@id, @layerId)", new { id = id, layerId = layerId });
                                if (userInGroup.Count() > 0)
                                {
                                    foreach (var user in userInGroup)
                                    {
                                        var count = session.Count<UserLayer>(stm => stm
                                            .Where($"{nameof(UserLayer.layer_id)} = @layerId AND {nameof(UserLayer.user_id)} = @userId")
                                            .WithParameters(new { layerId = layerId, userId = user.Id })
                                        );
                                        if (count == 0)
                                        {
                                            session.Query<UserLayer>($"INSERT INTO {Sql.Entity<UserLayer>():T} ({nameof(UserLayer.user_id)}, {nameof(UserLayer.layer_id)}) VALUES (@userId, @layerId)", new { userId = user.Id, layerId = layerId });
                                        }
                                    }
                                }
                            }
                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        [HttpPost("savePermissionRoles")]
        public async Task<RestBase> savePermissionRolesAsync([FromForm] string id, [FromForm] List<string> permissions)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!"}
                    }
                };
            }
            else
            {
                ApplicationGroup group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại"}
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        string deleteQuery = $"DELETE FROM {Sql.Entity<GroupClaim>()} WHERE {Sql.Entity<GroupClaim>(x => x.group_id):TC} = @group_id";
                        session.Execute(deleteQuery, new { group_id = group.Id });
                        var userInGroup = await _userManager.GetUsersInGroupAsync(group);
                        if (permissions != null && permissions.Count > 0)
                        {
                            foreach (var item in permissions)
                            {
                                var groupClaim = new GroupClaim()
                                {
                                    group_id = id,
                                    claim_type = EnumClaimTypes.Permission,
                                    claim_value = item
                                };
                                await session.InsertAsync<GroupClaim>(groupClaim);
                            }
                            // if (userInGroup.Count > 0)
                            // {
                            //     foreach (var user in userInGroup)
                            //     {
                            //         await _userManager.RemoveClaimsAsync(user, (await _userManager.GetClaimsAsync(user)).Where(x => x.Type == EnumClaimTypes.Permission));
                            //         await _userManager.AddClaimsAsync(user, permissions.Select(x => new Claim(EnumClaimTypes.Permission, x)));
                            //     }
                            // }
                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        [HttpPost("saveRegionRoles")]
        public async Task<RestBase> saveRegionRolesAsync([FromForm] string id, [FromForm] List<string> regions)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!"}
                    }
                };
            }
            else
            {
                ApplicationGroup group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại"}
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        string deleteQuery = @$"DELETE FROM {Sql.Entity<GroupRegion>()} WHERE {Sql.Entity<GroupRegion>(x => x.group_id):TC} = @group_id";
                        session.Execute(deleteQuery, new { group_id = group.Id });
                        var userInGroup = await _userManager.GetUsersInGroupAsync(group);
                        if (regions != null && regions.Count > 0)
                        {
                            foreach (var item in regions)
                            {
                                var groupRegion = new GroupRegion()
                                {
                                    group_id = id,
                                    district_code = item
                                };
                                await session.InsertAsync<GroupRegion>(groupRegion);
                            }
                            if (userInGroup.Count > 0)
                            {
                                foreach (var user in userInGroup)
                                {
                                    session.Execute(@$"DELETE FROM {Sql.Entity<UserRegion>()} WHERE {Sql.Entity<UserRegion>(x => x.user_id):TC} = @user_id", new { user_id = user.Id });
                                    foreach (var item in regions)
                                    {
                                        var groupRegion = new UserRegion()
                                        {
                                            user_id = user.Id,
                                            area_code = item
                                        };
                                        await session.InsertAsync<UserRegion>(groupRegion);
                                    }
                                }
                            }
                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        [HttpPost("saveUserRoles")]
        public async Task<RestBase> saveUserRolesAsync([FromForm] string id, [FromForm] List<string> users)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!"}
                    }
                };
            }
            else
            {
                ApplicationGroup group = await _groupManager.FindByIdAsync(id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại"}
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        string deleteQuery = @$"DELETE FROM {Sql.Entity<GroupRegion>()} WHERE {Sql.Entity<GroupRegion>(x => x.group_id):TC} = @group_id";
                        session.Execute(deleteQuery, new { group_id = group.Id });
                        var usersInGroup = await _userManager.GetUsersInGroupAsync(group);
                        if (usersInGroup.Count() > 0)
                        {
                            foreach (var user in usersInGroup)
                            {
                                await _userManager.RemoveFromGroupAsync(user, group.Id);
                            }
                        }
                        if (users.Count() > 0)
                        {
                            foreach (var userId in users)
                            {
                                var user = await _userManager.FindByIdAsync(userId);
                                if (user != null)
                                {
                                    await _userManager.AddToGroupAsync(user, group.Id);
                                }
                            }

                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        [HttpPost("setLock")]
        public async Task<RestBase> setLock([FromBody] ApplicationGroup model)
        {
            if (model == null)
            {
                return new RestError(EnumErrorCode.ERROR)
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { message = "Vui lòng kiểm tra lại tham số!"}
                    }
                };
            }
            else
            {
                var group = await _groupManager.FindByIdAsync(model.Id);
                if (group == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại!"}
                        }
                    };
                }
                else
                {
                    using (var session = OpenSession())
                    {
                        var usersInGroup = await _userManager.GetUsersInGroupAsync(group);
                        if (usersInGroup != null && usersInGroup.Count() > 0)
                        {
                            foreach (var user in usersInGroup)
                            {
                                if (user == null)
                                {
                                    return new RestError(EnumErrorCode.ERROR)
                                    {
                                        errors = new RestErrorDetail[]
                                        {
                                            new RestErrorDetail { message = "Người dùng không tồn tại, vui lòng kiểm tra lại!"}
                                        }
                                    };
                                }
                                var setLock = model.LockoutEnabled;
                                var result = await _userManager.SetLockoutEnabledAsync(user, setLock);
                                if (result == IdentityResult.Success)
                                {
                                    if (setLock) result = await _userManager.SetLockoutEndDateAsync(user, DateTime.Now.AddYears(1000).ToUniversalTime());
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
                        }
                        session.Query<ApplicationGroup>(@$"UPDATE identity.groups SET lockout_enabled = @lockou_enabled WHERE id = @group_id", new { group_id = group.Id, lockou_enabled = model.LockoutEnabled });
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        [HttpGet("getDataChartUser")]
        public async Task<RestBase> getDataChartUser([FromQuery] string? groupBy)
        {

            using (var session = OpenSession())
            {
                List<UserGroupByViewModel> data = new List<UserGroupByViewModel>();
                if (!String.IsNullOrWhiteSpace(groupBy))
                {
                    if (groupBy == "DISTRICT")
                    {
                        var userGroupByDistricts = (await toViewsAsync(_userManager.Users.ToList())).GroupBy(stm => stm.user_info.district_code);
                        if (userGroupByDistricts.Count() > 0)
                        {
                            foreach (var userGroupByDistrict in userGroupByDistricts)
                            {
                                if (!string.IsNullOrWhiteSpace(userGroupByDistrict.Key))
                                {
                                    var district = session.Get(new District { area_id = userGroupByDistrict.Key });
                                    data.Add(new UserGroupByViewModel
                                    {
                                        id = userGroupByDistrict.Key,
                                        key = district.name_vn,
                                        count = userGroupByDistrict.Count()
                                    });
                                }
                                else
                                {
                                    data.Add(new UserGroupByViewModel
                                    {
                                        id = "Orphan",
                                        key = "Không xác định",
                                        count = userGroupByDistrict.Count()
                                    });
                                }
                            }
                        }

                    }
                    else if (groupBy == "GROUP")
                    {
                        var groups = _groupManager.Groups.OrderBy(x => x.Name).ToList();
                        if (groups.Count() > 0)
                        {
                            foreach (var group in groups)
                            {
                                var userInGroups = await _userManager.GetUsersInGroupAsync(group);
                                if (userInGroups.Count() > 0)
                                {
                                    data.Add(new UserGroupByViewModel
                                    {
                                        id = group.Id,
                                        key = group.Name,
                                        count = userInGroups.Count()
                                    });
                                }
                            }
                        }

                        // Không thuộc nhóm nào
                        int count = 0;
                        foreach (var user in _userManager.Users)
                        {
                            if ((await _userManager.GetGroupsAsync(user)).Count() == 0)
                            {
                                count++;
                            }
                        }
                        data.Add(new UserGroupByViewModel
                        {
                            id = "Orphan",
                            key = "Không thuộc nhóm nào",
                            count = count
                        });
                    }
                }
                return new RestData
                {
                    data = data
                };
            }
        }

        private async Task<IEnumerable<UserInfoViewModel>> toViewsAsync(IEnumerable<ApplicationUser> users)
        {
            List<UserInfoViewModel> views = new List<UserInfoViewModel>();
            foreach (var user in users)
            {
                var view = await toViewAsync(user);
                if (view != null)
                {
                    views.Add(view);
                }
            }
            return views;
        }

        private async Task<UserInfoViewModel> toViewAsync(ApplicationUser user)
        {
            if (user == null) return null;
            ApplicationUser.View userView = _mapper.Map<ApplicationUser.View>(user);
            var view = _mapper.Map<UserInfoViewModel>(userView);
            if (view != null)
            {
                if (view.groups == null || view.groups.Count() == 0)
                {
                    view.groups.AsList().Add(new ApplicationGroup.View
                    {
                        id = "Orphan",
                        name = "Người dùng không thuộc nhóm nào"
                    });
                }
                ;
                //var claims = await _userManager.GetClaimsAsync(user);
                //view.FullName = claims.FirstOrDefault(x => x.Type == ClaimTypes.GivenName)?.Value;
                var roles = await _userManager.GetRolesAsync(user);
                //view.role = roles.FirstOrDefault();

            }
            return view;
        }
    }
}
