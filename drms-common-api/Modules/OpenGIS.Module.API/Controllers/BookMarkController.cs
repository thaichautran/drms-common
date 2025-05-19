using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure.Interfaces;
using System;
using System.Linq;
using VietGIS.Infrastructure.Enums;
using Dapper;
using VietGIS.Infrastructure.Helpers;
using Microsoft.AspNetCore.Authorization;
using OpenGIS.Module.Core.Models.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models.DTO;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_BOOKMARK))]
    public class BookmarkController : BaseController
    {
        public BookmarkController(IDbFactory dbFactory)
                                : base(dbFactory)
        {

        }

        [HttpPost("add")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_BOOKMARK))]
        public RestBase addBookmarkSync([FromBody] BookMark bookMark)
        {
            using (var session = OpenSession())
            {
                BookMark newBookMark = new BookMark();
                newBookMark.extent = bookMark.extent;
                newBookMark.user_id = User.Claims.First().Value;
                newBookMark.created_time = DateTime.Now;
                newBookMark.note = bookMark.note;
                newBookMark.url = bookMark.url;
                newBookMark.key = StringHelper.MD5Hash(Guid.NewGuid().ToString());
                session.Insert(newBookMark);
                return new RestBase(EnumErrorCode.OK);
            }
        }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_BOOKMARK))]
        public RestBase deleteBookmarkSync([FromForm] BookMark bookMark)
        {
            using (var session = OpenSession())
            {
                if (session.Execute($"DELETE FROM {Sql.Entity<BookMark>()} WHERE id = @id", bookMark) > 0)
                {
                    return new RestBase(EnumErrorCode.OK);
                }
                else
                {
                    return new RestError()
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                        }
                    };
                }
            }
        }

        [HttpGet("{key}")]
        public RestBase getBookMark([FromRoute] string key)
        {
            using (var session = OpenSession())
            {
                return new RestData
                {
                    data = session.Find<BookMark>(stm => stm
                        .Where($"{Sql.Entity<BookMark>(x => x.key):TC} = @key")
                        .WithParameters(new {key})
                    ).FirstOrDefault()
                };
            }
        }

        [HttpPost("list")]
        public async Task<RestBase> List([FromForm] BookMarkListDxDTO dto)
        {
            using (var session = OpenSession())
            {
                List<BookMark> data = new List<BookMark>();
                dto.user_id = User.Claims.First().Value;
                string condition = $"{Sql.Entity<BookMark>(x => x.user_id)} = @user_id";
                if(!string.IsNullOrWhiteSpace(dto.path_name))
                {
                    condition += $" AND {Sql.Entity<BookMark>(x => x.url):TC} = @path_name";
                }
                if (dto.take == 0)
                {
                    data = (await session.FindAsync<BookMark>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                    )).OrderByDescending(x => x.created_time).ToList();
                }
                else
                {
                    data = (await session.FindAsync<BookMark>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                    )).OrderByDescending(x => x.created_time).Skip(dto.skip).Take(dto.take).ToList();
                }
                return new RestPagedDataTable
                {
                    data = data ,
                    recordsTotal = await session.CountAsync<BookMark>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(dto)
                    )
                };
            }
        }
    }
}