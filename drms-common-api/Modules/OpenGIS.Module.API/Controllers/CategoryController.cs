using Dapper.FastCrud;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.ViewModels;
using VietGIS.Infrastructure.Interfaces;
using System;
using System.Linq;
using VietGIS.Infrastructure.Enums;
using Dapper;
using OpenGIS.Module.Core.Models.Entities.Category;
using MetadataExtractor.Formats.Xmp;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction._APPROVE))]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_CATEGORY))]
    public class CategoryController : BaseController
    {
        public CategoryController(IDbFactory dbFactory) : base(dbFactory)
        {

        }

        [HttpGet("list")]
        public RestBase List()
        {
            using (var session = OpenSession())
            {
                return new RestData
                {
                    data = session.Find<Category>().OrderBy(x => x.order_id).ToList()
                };
            }
        }

        [HttpGet("trees")]
        public RestBase getTrees()
        {
            using (var session = OpenSession())
            {
                return new RestData
                {
                    data = session.Find<Category>()
                            .GroupBy(x => x.schema)
                            .Select(x => new
                            {
                                id = x.Key,
                                text = x.Key,
                                expanded = true,
                                type = "@schema",
                                items = x.Select(o => new
                                {
                                    id = o.id,
                                    text = o.ten_danhmuc,
                                    raw = o,
                                    type = "@table"
                                })
                            }).ToList()
                };
            }
        }

        [HttpGet("{type_id}/items")]
        [ResponseCache(Duration = 30, VaryByQueryKeys = new string[] { "type_id" })]
        public RestBase items([FromRoute] int type_id)
        {
            using (var session = OpenSession())
            {
                Category? documentCategory = session.Get(new Category { id = type_id });
                if (documentCategory != null)
                {
                    return new RestData()
                    {
                        data = session.Query<DanhMucViewModel>($"SELECT *, {documentCategory.id} AS type_id FROM {documentCategory.schemaAndTable} ORDER BY {nameof(DanhMucViewModel.id)}")
                    };
                }
                else
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Bảng danh mục không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
            }
        }

        // [HttpGet("getMoTaDanhMuc")]
        // public RestBase getMoTaDanhMuc([FromQuery] int id, [FromQuery] int type_id)
        // {
        //     string StringSql = "";
        //     using (var session = OpenSession())
        //     {
        //         DocumentCategory DocumentCategory = session.Find<DocumentCategory>(statement => statement.Where($"{nameof(DocumentCategory.id)} = {type_id}")).FirstOrDefault();
        //         if (DocumentCategory == null)
        //         {
        //             return new RestError
        //             {
        //                 errors = new RestErrorDetail[]
        //                    {
        //                         new RestErrorDetail
        //                         {
        //                             message = "Loại danh mục không tồn tại. Xin vui lòng kiểm tra lại!"
        //                         }
        //                    }
        //             };
        //         }
        //         StringSql += $"SELECT * FROM category.{DocumentCategory.ten_bang} WHERE id ={id}";
        //         var item = session.Query<DanhMucViewModel>(StringSql).First();
        //         return new RestData
        //         {
        //             data = item
        //         };
        //     }
        // }

        [HttpPost("createOrUpdate")]
        //// [Authorize(Policy = nameof(ModuleFunction.EDIT_CATEGORY))]
        public RestBase CreateOrUpdate([FromBody] DanhMucViewModel item)
        {
            var stringSql = string.Empty;
            if (!ModelState.IsValid)
            {
                return new RestError
                {
                    errors = new RestErrorDetail[]
                    {
                        new RestErrorDetail { code = -1, message = "Lỗi dữ liệu!" }
                    }
                };
            }
            using (var session = OpenSession())
            {
                Category? documentCategory = session.Get(new Category { id = item.type_id });
                if (documentCategory == null)
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Loại danh mục không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                if (isItemExisted(documentCategory.schemaAndTable, item.mo_ta, item.id))
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Danh mục đã tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                if (item.id == 0)
                {
                    stringSql = $"INSERT INTO {documentCategory.schemaAndTable}(mo_ta, mo_ta_en) VALUES (@mo_ta, @mo_ta_en)";
                }
                else
                {
                    stringSql = $"UPDATE {documentCategory.schemaAndTable} SET mo_ta = @mo_ta, mo_ta_en = @mo_ta_en WHERE id = @id";
                }
                if (session.Execute(stringSql, item) > 0)
                {
                    return new RestBase(EnumErrorCode.OK);
                }
            }
            return new RestError
            {
                errors = new RestErrorDetail[]
                {
                    new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại" }
                }
            };
        }

        // [HttpPost("update")]
        // public RestBase UpDateDanhMuc([FromBody] DanhMucViewModel item)
        // {
        //     string StringSql = "";
        //     if (!ModelState.IsValid)
        //     {
        //         return new RestError
        //         {
        //             errors = new RestErrorDetail[]
        //                 {
        //                     new RestErrorDetail
        //                     {

        //                     }
        //                 }
        //         };
        //     }

        //     using (var session = OpenSession())
        //     {
        //         DocumentCategory loaiDM = session.Find<DocumentCategory>(statement => statement.Where($"{nameof(DocumentCategory.id)} = {item.type_id}")).FirstOrDefault();
        //         if (loaiDM == null)
        //         {
        //             return new RestError
        //             {
        //                 errors = new RestErrorDetail[]
        //                    {
        //                         new RestErrorDetail
        //                         {
        //                             message = "Loại danh mục không tồn tại. Xin vui lòng kiểm tra lại!"
        //                         }
        //                    }
        //             };
        //         }

        //         if (isItemExisted(loaiDM.ten_bang, item.name, item.id))
        //         {
        //             return new RestError
        //             {
        //                 errors = new RestErrorDetail[]
        //                 {
        //                 new RestErrorDetail
        //                 {
        //                     message = "Danh mục đã tồn tại. Xin vui lòng kiểm tra lại!"
        //                 }
        //                 }
        //             };
        //         }

        //         StringSql += $"UPDATE category.{loaiDM.ten_bang} SET  name = '{item.name}',  description = '{item.description}'  WHERE id ={item.id}";
        //         if (session.Execute(StringSql) > 0)
        //         {
        //             return new RestBase(EnumErrorCode.OK);
        //         }
        //     }


        //     return new RestError
        //     {
        //         errors = new RestErrorDetail[]
        //             {
        //                 new RestErrorDetail
        //                 {
        //                     message = "Có lỗi xảy ra khi cập nhật . Xin vui lòng kiểm tra lại!"
        //                 }
        //             }
        //     };
        // }

        [HttpPost("delete")]
        //// [Authorize(Policy = nameof(ModuleFunction.DELETE_CATEGORY))]
        public RestBase deleteDanhMuc([FromForm] DanhMucViewModel item)
        {
            using (var session = OpenSession())
            {
                Category? documentCategory = session.Get(new Category { id = item.type_id });
                if (documentCategory == null)
                {
                    return new RestError
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Loại danh mục không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }

                if (session.Execute($"DELETE FROM {documentCategory.schemaAndTable} WHERE id = @id", item) > 0)
                {
                    return new RestBase(EnumErrorCode.OK);
                }
            }
            return new RestError
            {
                errors = new RestErrorDetail[]
                {
                    new RestErrorDetail { message = "Đã xảy ra lỗi, vui lòng thử lại!" }
                }
            };
        }

        private bool isItemExisted(string tableName, string mo_ta, int id = 0)
        {
            bool isExisted = false;
            var sqlCheck = $"SELECT COUNT(id) FROM {tableName} WHERE (lower(mo_ta) = @mo_ta) OR (lower(mo_ta_en) = @mo_ta)";
            if (id > 0)
            {
                sqlCheck += $" AND id <> @id";
            }
            using (var session = OpenSession())
            {
                isExisted = session.ExecuteScalar<int>(sqlCheck, new
                {
                    mo_ta = mo_ta?.ToLower(),
                    id = id
                }) > 0;
            }
            return isExisted;
        }
    }
}