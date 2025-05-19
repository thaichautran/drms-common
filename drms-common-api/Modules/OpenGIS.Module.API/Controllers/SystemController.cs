using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using OpenGIS.Module.Core.Enums;
using OpenGIS.Module.Core.Models.DTO;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Identity.Entities;
using VietGIS.Infrastructure.Identity.Managers;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    public class SystemController : BaseController
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ApplicationUserManager _userManager;

        public SystemController(IDbFactory dbFactory, IWebHostEnvironment webHostEnvironment, UserManager<ApplicationUser> userManager)
                                        : base(dbFactory)
        {
            _webHostEnvironment = webHostEnvironment;
            _userManager = (ApplicationUserManager)userManager;
        }

        [HttpGet("configs")]
        [AllowAnonymous]
        public async Task<RestBase> ConfigAsync()
        {
            using var session = OpenSession();
            var webOption = await session.FindAsync<WebOption>(statement => statement
            .Where($"{nameof(WebOption.option_name)} = ANY(@option_ids)")
            .WithParameters(new
            {
                option_ids = new string[] {
                    EnumWebOption.SITE_DESCRIPTION,
                    EnumWebOption.SITE_NAME,
                }
            }));

            if (User.Identity != null && User.Identity.IsAuthenticated == true)
            {
                var user = await _userManager.FindByNameAsync(User.Identity.Name);
                var user_permissions = new List<string>();
                if (user != null)
                {
                    user_permissions = (await session.FindAsync<ApplicationUserPermission>(stm => stm
                                    .Where($"{Sql.Entity<ApplicationUserPermission>(x => x.UserId):TC} = @Id")
                                    .WithParameters(user))
                                ).Select(x => x.Permission).ToList();
                }
                return new RestData
                {
                    data = new
                    {
                        isSA = User.IsInRole(Core.Enums.EnumRoles.SA),
                        isAdmin = User.IsInRole("administrator"),
                        CDNUrl = GlobalConfiguration.CDNUrl,
                        ImagePath = GlobalConfiguration.ImagePath,
                        ImageUploadPath = GlobalConfiguration.ImageUploadPath,
                        DocumentUploadPath = GlobalConfiguration.DocumentUploadPath,
                        DocumentPath = GlobalConfiguration.DocumentPath,
                        Permissions = user_permissions,
                        siteName = webOption.Where(stm => stm.option_name == EnumWebOption.SITE_NAME).Select(x => x.option_value).FirstOrDefault(),
                        siteDescription = webOption.Where(stm => stm.option_name == EnumWebOption.SITE_DESCRIPTION).Select(x => x.option_value).FirstOrDefault(),
                    }
                };
            }
            else
            {
                return new RestData
                {
                    data = new
                    {
                        CDNUrl = GlobalConfiguration.CDNUrl,
                        ImagePath = GlobalConfiguration.ImagePath,
                        ImageUploadPath = GlobalConfiguration.ImageUploadPath,
                        DocumentUploadPath = GlobalConfiguration.DocumentUploadPath,
                        DocumentPath = GlobalConfiguration.DocumentPath,
                        siteName = webOption.Where(stm => stm.option_name == EnumWebOption.SITE_NAME).Select(x => x.option_value).FirstOrDefault(),
                        siteDescription = webOption.Where(stm => stm.option_name == EnumWebOption.SITE_DESCRIPTION).Select(x => x.option_value).FirstOrDefault(),
                    }
                };
            }
        }
        [HttpPost("param/data-grid")]
        public RestBase DataGrid([FromBody] WebOptionDxDTO @params)
        {
            using (var session = OpenSession())
            {
                var totalCount = session.Count<WebOption>();
                var condition = $"1=1";
                if (@params?.options?.Length > 0)
                {
                    condition += $" AND {Sql.Entity<WebOption>(x => x.option_name):TC} = ANY(@options)";
                }
                var data = session.Find<WebOption>(x => x
                .Where($"{condition}")
                .WithParameters(new { @params?.options })
                .Skip(@params?.skip).Top(@params?.take));

                var pageCount = Math.Ceiling((double)totalCount / @params.take);

                return new RestPagedDataTable()
                {
                    data = data,
                    recordsTotal = session.Count<WebOption>(statement => statement
                        .Where($"{condition}")
                       .WithParameters(new { @params?.options }))
                };
            }
        }

        [HttpGet("param/{id}")]
        public RestBase Get([FromRoute] string id)
        {
            try
            {
                using (var session = OpenSession())
                {
                    var item = session.Get(new WebOption { option_name = id });
                    if (item == null)
                    {
                        return new RestError(-1, "Không tìm thấy bản ghi");
                    }
                    else
                    {
                        return new RestData { data = item };
                    }
                }
            }
            catch (System.Exception e)
            {
                return new RestError(e);
            }
        }

        [HttpPost("param/save")]
        public RestBase Save([FromBody] WebOption model)
        {
            try
            {
                using (var session = OpenSession())
                {
                    using (var uow = new UnitOfWork(DbFactory, session))
                    {
                        var existedItem = session.Get(new WebOption { option_name = model.option_name });
                        if (existedItem == null)
                        {
                            uow.Connection.Insert(model);
                        }
                        else
                        {
                            uow.Connection.Update(model);
                        }
                        return new RestBase(EnumErrorCode.OK);

                    }
                }
            }
            catch (System.Exception e)
            {
                return new RestError(e);
            }
        }
        [HttpPost("webOption/update")]
        public async Task<RestBase> WebOptionUpdate([FromForm] WebOptionViewModel model)
        {
            try
            {
                if (model != null)
                {
                    if (model.logo != null)
                    {
                        string path = _webHostEnvironment.WebRootPath;
                        string filePath = Path.Combine(path, "images", "front", "logo-kiem-lam.png");
                        using (Stream fileStream = new FileStream(filePath, FileMode.OpenOrCreate, FileAccess.ReadWrite))
                        {
                            await model.logo.CopyToAsync(fileStream);
                        }
                    }
                    if (model.background != null)
                    {
                        string path = _webHostEnvironment.WebRootPath;
                        string filePath = Path.Combine(path, "images", "front", "bg_home.png");
                        using (Stream fileStream = new FileStream(filePath, FileMode.OpenOrCreate, FileAccess.ReadWrite))
                        {
                            await model.background.CopyToAsync(fileStream);
                        }
                    }
                    using (var session = OpenSession())
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            var site_options = session.Find<WebOption>(stm => stm
                            .Where($"{nameof(WebOption.option_name)} = ANY(@option_ids)")
                            .WithParameters(new
                            {
                                option_ids = new string[] { EnumWebOption.SITE_DESCRIPTION, EnumWebOption.SITE_NAME, EnumWebOption.BACKUP_FREQUENCY, EnumWebOption.BACKUP_SAVE_PATH, }
                            }));
                            var site_name = site_options.FirstOrDefault(x => x.option_name == EnumWebOption.SITE_NAME);
                            if (!string.IsNullOrEmpty(model.siteName))
                            {
                                if (site_name == null)
                                {
                                    uow.Connection.Insert(new WebOption
                                    {
                                        option_name = EnumWebOption.SITE_NAME,
                                        option_value = model.siteName
                                    });
                                }
                                else
                                {
                                    site_name.option_value = model.siteName;
                                    uow.Connection.Update(site_name);
                                }
                            }
                            var site_description = site_options.FirstOrDefault(x => x.option_name == EnumWebOption.SITE_DESCRIPTION);
                            if (!string.IsNullOrEmpty(model.siteDescription))
                            {
                                if (site_description == null)
                                {
                                    uow.Connection.Insert(new WebOption
                                    {
                                        option_name = EnumWebOption.SITE_DESCRIPTION,
                                        option_value = model.siteDescription
                                    });
                                }
                                else
                                {
                                    site_description.option_value = model.siteDescription;
                                    uow.Connection.Update(site_description);
                                }
                            }
                            var backup_frequency = site_options.FirstOrDefault(x => x.option_name == EnumWebOption.BACKUP_FREQUENCY);
                            if (!string.IsNullOrEmpty(model.backupFrequency))
                            {
                                if (backup_frequency == null)
                                {
                                    uow.Connection.Insert(new WebOption
                                    {
                                        option_name = EnumWebOption.BACKUP_FREQUENCY,
                                        option_value = model.backupFrequency
                                    });
                                }
                                else
                                {
                                    backup_frequency.option_value = model.backupFrequency;
                                    uow.Connection.Update(backup_frequency);
                                }
                            }
                            var backup_save_path = site_options.FirstOrDefault(x => x.option_name == EnumWebOption.BACKUP_SAVE_PATH);
                            if (!string.IsNullOrEmpty(model.backupSavePath))
                            {
                                if (backup_save_path == null)
                                {
                                    uow.Connection.Insert(new WebOption
                                    {
                                        option_name = EnumWebOption.BACKUP_SAVE_PATH,
                                        option_value = model.backupSavePath
                                    });
                                }
                                else
                                {
                                    backup_save_path.option_value = model.backupSavePath;
                                    uow.Connection.Update(backup_save_path);
                                }
                            }
                        }
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                {
                    return new RestError(-1, "Lỗi tham số! Vui lòng thử lại sau");
                }
            }
            catch (System.Exception e)
            {
                return new RestError(e);
            }
        }

        [HttpDelete("param/{id}")]
        public RestBase Delete([FromRoute] string id)
        {
            try
            {
                using (var session = OpenSession())
                {
                    var existedItem = session.Get(new WebOption { option_name = id });
                    if (existedItem != null)
                    {
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            uow.Connection.Delete(existedItem);
                            return new RestBase(EnumErrorCode.OK);
                        }
                    }
                    else
                        return new RestError(-1, "Không tìm thấy hồ sơ.");
                }
            }
            catch (System.Exception e)
            {
                return new RestError(e);
            }
        }
        [HttpGet("webOption")]
        public RestBase WebOptionInfo()
        {
            try
            {
                using (var session = OpenSession())
                {
                    var site_options = session.Find<WebOption>(stm => stm
                                                .Where($"{nameof(WebOption.option_name)} = ANY(@option_ids)")
                                                .WithParameters(new
                                                {
                                                    option_ids = new string[] {
                                                         EnumWebOption.SITE_DESCRIPTION,
                                                          EnumWebOption.SITE_NAME,
                                                           EnumWebOption.BACKUP_FREQUENCY,
                                                            EnumWebOption.BACKUP_SAVE_PATH,
                                                            }
                                                }));
                    return new RestData
                    {
                        data = new WebOptionViewModel
                        {
                            siteName = site_options.FirstOrDefault(x => x.option_name == EnumWebOption.SITE_NAME)?.option_value,
                            siteDescription = site_options.FirstOrDefault(x => x.option_name == EnumWebOption.SITE_DESCRIPTION)?.option_value,
                            backupFrequency = site_options.FirstOrDefault(x => x.option_name == EnumWebOption.BACKUP_FREQUENCY)?.option_value,
                            backupSavePath = site_options.FirstOrDefault(x => x.option_name == EnumWebOption.BACKUP_SAVE_PATH)?.option_value,
                        }
                    };
                }
            }
            catch (System.Exception e)
            {
                return new RestError(e);
            }
        }

    }
}