using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using Dapper;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Identity.DbContexts;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.Entities;
using Dapper.FastCrud;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Extensions;
using Microsoft.AspNetCore.Authorization;
using OpenGIS.Module.Core.Models.DevExtreme;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/permission-group")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_GROUPS))]
    public class PermissionGroupController : BaseController
    {
        protected readonly IMapper _mapper;
        protected readonly ApplicationDbContext _dbContext;
        protected readonly RoleManager<ApplicationRole> _roleManager;
        protected readonly INotificationsReponsitory _notificationsReponsitory;
        protected readonly IDbFactory _dbFactory;

        public PermissionGroupController(IDbFactory dbFactory,
            IMapper mapper, ApplicationDbContext dbContext,
            RoleManager<ApplicationRole> roleManager,
            INotificationsReponsitory notificationsReponsitory)
            : base(dbFactory)
        {
            _mapper = mapper;
            _dbContext = dbContext;
            _roleManager = roleManager;
            _notificationsReponsitory = notificationsReponsitory;
            _dbFactory = dbFactory;
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] DxGridDTO dto)
        {
            using (var session = OpenSession())
            {
                List<PermissionGroup> data = new List<PermissionGroup>();
                if (dto.take == 0)
                {
                    data = (await session.FindAsync<PermissionGroup>()).OrderBy(x => x.id).ToList();
                }
                else
                {
                    data = (await session.FindAsync<PermissionGroup>()).OrderBy(x => x.id).Skip(dto.skip).Take(dto.take).ToList();
                }
                return new RestData
                {
                    data = new
                    {
                        data = data,
                        totalCount = await session.CountAsync<PermissionGroup>()
                    }
                };
            }
        }

        [HttpPost("saveOrUpdate")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_GROUPS))]
        public async Task<RestBase> saveOrUpdate([FromBody] PermissionGroup item)
        {
            using (var session = OpenSession())
            {
                if (item == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm quyền này không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    if (item.id == 0)
                    {
                        await session.InsertAsync(item);
                        return new RestBase(EnumErrorCode.OK);
                    }
                    else
                    {
                        PermissionGroup? existItem = session.Get(new PermissionGroup { id = item.id });
                        if (existItem == null)
                        {
                            return new RestError
                            {
                                errors = new RestErrorDetail[]
                                {
                                    new RestErrorDetail {  message = "Nhóm quyền này không tồn tại, vui lòng kiểm tra lại!" }
                                }
                            };
                        }
                        else
                        {
                            await session.UpdateAsync(item);
                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                }
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_GROUPS))]
        public RestBase Delete([FromForm] PermissionGroup item)
        {
            using (var session = OpenSession())
            {
                PermissionGroup? existItem = session.Get(new PermissionGroup { id = item.id });
                if (existItem == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Nhóm quyền này không tồn tại, vui lòng kiểm tra lại!" }
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

        [HttpGet("getLayerRoles")]
        public async Task<RestBase> getLayerRoles([FromQuery] int id)
        {
            if (id == 0)
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
                using (var session = OpenSession())
                {
                    var group = session.Get(new PermissionGroup { id = id });
                    if (group == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Nhóm quyền không tồn tại, vui lòng kiểm tra lại!"}
                            }
                        };
                    IEnumerable<PermissionGroupLayer> groupLayers = session.Find<PermissionGroupLayer>(stm => stm
                        .Where($"{nameof(PermissionGroupLayer.permission_group_id)} = @id")
                        .WithParameters(new { id = group.id })
                    );
                    return new RestData
                    {
                        data = session.Find<Layer>(statement => statement
                            .Include<TableInfo>()
                            .Include<TableSchema>()
                            )
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
                                    selected = groupLayers.Any(p => p.layer_id == o.id),
                                    raw = o
                                })
                            }).ToList()
                    };
                }
            }
        }

        [HttpPost("saveLayerRoles")]
        public async Task<RestBase> saveLayerRoles([FromForm] int id, [FromForm] List<int> layers)
        {
            if (id == 0)
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
                    var group = await session.GetAsync(new PermissionGroup { id = id });
                    if (group == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Nhóm quyền không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    var oldLayerIds = session.Find<PermissionGroupLayer>(stm => stm
                        .Where($"{nameof(PermissionGroupLayer.permission_group_id)} = @id")
                        .WithParameters(new { id = id })
                    ).Select(x => x.layer_id).ToList();

                    session.Execute($"DELETE FROM {Sql.Entity<PermissionGroupLayer>():T} WHERE {Sql.Entity<PermissionGroupLayer>(x => x.permission_group_id):TC}=@id", new { id = id });

                    if (layers != null && layers.Count > 0)
                    {
                        foreach (var layerId in layers)
                        {
                            session.Query<PermissionGroupLayer>($"INSERT INTO {Sql.Entity<PermissionGroupLayer>():T} ({nameof(PermissionGroupLayer.permission_group_id)}, {nameof(PermissionGroupLayer.layer_id)}) VALUES (@id, @layerId)", new { id = id, layerId = layerId });
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpGet("getPermissionRoles")]
        public async Task<RestBase> getPermissionRolesAsync([FromQuery] int id)
        {
            if (id == 0)
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
                    var group = await session.GetAsync(new PermissionGroup { id = id });
                    if (group == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Nhóm quyền không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    var groupClaims = session.Find<PermissionGroupClaims>(stm => stm
                        .Where($"{nameof(PermissionGroupClaims.claim_type)} = @claim_type AND {nameof(PermissionGroupClaims.permission_group_id)} = @permission_group_id")
                        .WithParameters(new { claim_type = EnumClaimTypes.Permission, permission_group_id = id })
                    ).ToList();

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

        [HttpGet("getClaimValuesById")]
        public RestBase GetClaimValuesById([FromQuery] int id)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<PermissionGroupClaims>(stm => stm
                        .Where($"{Sql.Entity<PermissionGroupClaims>(x => x.claim_type):TC} = @claim_type AND {Sql.Entity<PermissionGroupClaims>(x => x.permission_group_id):TC} = @permission_group_id")
                        .WithParameters(new { claim_type = EnumClaimTypes.Permission, permission_group_id = id })
                        .OrderBy($@"{Sql.Entity<PermissionGroupClaims>(x => x.id):TC}")
                    ).Select(x => x.claim_value).ToList()
                };
            }
        }

        [HttpGet("getLayerRoleById")]
        public RestBase GetLayerRoleById([FromQuery] int id)
        {
            using (var session = OpenSession())
            {
                return new RestData()
                {
                    data = session.Find<PermissionGroupLayer>(stm => stm
                        .Where($"{Sql.Entity<PermissionGroupLayer>(x => x.permission_group_id):TC} = @permission_group_id")
                        .WithParameters(new { permission_group_id = id })
                        .OrderBy($@"{Sql.Entity<PermissionGroupLayer>(x => x.layer_id):TC}")
                    ).Select(x => x.layer_id).ToList()
                };
            }
        }

        [HttpPost("savePermissionRoles")]
        public async Task<RestBase> savePermissionRolesAsync([FromForm] int id, [FromForm] List<string> permissions)
        {
            if (id == 0)
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
                using (var session = OpenSession())
                {
                    var group = session.Get(new PermissionGroup { id = id });
                    if (group == null)
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Nhóm người dùng không tồn tại, vui lòng kiểm tra lại"}
                            }
                        };
                    string deleteQuery = $"DELETE FROM {Sql.Entity<PermissionGroupClaims>()} WHERE {Sql.Entity<PermissionGroupClaims>(x => x.permission_group_id):TC} = @group_id";
                    session.Execute(deleteQuery, new { group_id = group.id });
                    if (permissions != null && permissions.Count > 0)
                    {
                        foreach (var item in permissions)
                        {
                            var groupClaim = new PermissionGroupClaims()
                            {
                                permission_group_id = id,
                                claim_type = EnumClaimTypes.Permission,
                                claim_value = item
                            };
                            await session.InsertAsync<PermissionGroupClaims>(groupClaim);
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }
    }
}
