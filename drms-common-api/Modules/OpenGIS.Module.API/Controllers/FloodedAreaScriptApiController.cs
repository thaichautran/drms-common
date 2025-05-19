using Dapper.FastCrud;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Interfaces;
using System;
using System.IO;
using System.Linq;
using VietGIS.Infrastructure.Enums;
using OpenGIS.Module.Core.Models.DevExtreme;
using VietGIS.Infrastructure.Helpers;
using VietGIS.Infrastructure;
using System.Threading.Tasks;
using System.IO.Compression;
using Microsoft.AspNetCore.Hosting;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using OpenGIS.Module.API.Helpers;
using System.Net;
using VietGIS.Infrastructure.Models.Regional;
using VietGIS.Infrastructure.Abstractions;
using VietGIS.Infrastructure.Repositories.Session;
using AutoMapper;
using OpenGIS.Module.Core.Repositories;
using VietGIS.Infrastructure.Models.DTO.Response;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities.Maintenance.ThoatNuoc;
using Dapper;
using NetTopologySuite.IO;
using NetTopologySuite.Geometries;


namespace OpenGIS.Module.API.Controllers
{
    [Route("api/flooded-area-script")]
    public class FloodedAreaScriptApiController : BaseApiCRUDController<INpgsqlSession, FloodedAreaScript, int>
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        public FloodedAreaScriptApiController(IDbFactory dbFactory, IMapper mapper, IFloodedAreaScriptRepository repository,
        IWebHostEnvironment hostingEnvironment) : base(dbFactory, mapper, repository)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        [HttpPost("list-data")]
        public RestBase ListData([FromBody] FloodedAreaScriptParams @params)
        {
            using (var session = OpenSession())
            {
                var condition = $"(1=1)";

                if (!string.IsNullOrWhiteSpace(@params.keyword))
                {
                    @params.keyword = @params.keyword?.ToPGFulltext();
                    condition += $" AND ({Sql.Entity<FloodedAreaScript>():T}.search_content @@ to_tsquery(@keyword))";
                }
                if (!string.IsNullOrEmpty(@params.province_code))
                {
                    condition += $" AND ({Sql.Entity<FloodedAreaScript>(x => x.province_code):TC} = @province_code)";
                }
                if (!string.IsNullOrEmpty(@params.district_code))
                {
                    condition += $" AND ({Sql.Entity<FloodedAreaScript>(x => x.district_code):TC} = @district_code)";
                }
                if (!string.IsNullOrEmpty(@params.commune_code))
                {
                    condition += $" AND ({Sql.Entity<FloodedAreaScript>(x => x.commune_code):TC} = @commune_code)";
                }
                if (@params.from_value > 0)
                {
                    condition += $" AND ({Sql.Entity<FloodedAreaScript>(x => x.luong_mua):TC} >= @from_value)";
                }
                if (@params.to_value > 0)
                {
                    condition += $" AND ({Sql.Entity<FloodedAreaScript>(x => x.luong_mua):TC} <= @to_value)";
                }

                var totalCount = session.Count<FloodedAreaScript>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@params)
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                );

                var data = session.Find<FloodedAreaScript>(stm => stm
                    .Where($"{condition}")
                    .WithParameters(@params)
                    .Include<Province>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .OrderBy($"{Sql.Entity<FloodedAreaScript>(x => x.ngay_tao):TC} DESC")
                ).Skip(@params.skip).Take(@params.take).ToList();

                foreach (var item in data)
                {
                    item.attachments = session.Find<FloodedAreaScriptAttachment>(stm => stm
                        .Where($"{nameof(FloodedAreaScriptAttachment.kichban_id)} = @id")
                        .WithParameters(item)
                        .OrderBy($"{Sql.Entity<FloodedAreaScriptAttachment>(x => x.id):TC}")
                    );
                    item.district = session.Get<District>(new District { area_id = item.district_code });
                    item.commune = session.Get<Commune>(new Commune { area_id = item.commune_code });
                }
                var pageCount = Math.Ceiling((double)totalCount / @params.take);

                return new RestData
                {
                    data = new
                    {
                        data = data,
                        totalCount = totalCount,
                        pageCount = pageCount,
                    }
                };
            }
        }

        [HttpGet("{id}")]
        public override async Task<RestBase> GetKeyAsync([FromRoute] int id)
        {
            using (var session = OpenSession())
            {
                var exitedItem = session.Find<FloodedAreaScript>(stm => stm
                    .Where($"{Sql.Entity<FloodedAreaScript>(x => x.id):TC} = @id")
                    .WithParameters(new { id = id })
                    .Include<Commune>(join => join.LeftOuterJoin())
                    .Include<District>(join => join.LeftOuterJoin())
                    .Include<Province>(join => join.LeftOuterJoin())
                ).FirstOrDefault();
                if (exitedItem != null)
                {
                    exitedItem.attachments = session.Find<FloodedAreaScriptAttachment>(stm => stm
                        .Where($"{nameof(FloodedAreaScriptAttachment.kichban_id)} = @id")
                        .WithParameters(exitedItem)
                        .OrderBy($"{Sql.Entity<FloodedAreaScriptAttachment>(x => x.id):TC}")
                    );
                    exitedItem.geom = (await session.QueryAsync<string>($"SELECT ST_AsGeoJson(geom) FROM {Sql.Entity<FloodedAreaScript>():T} WHERE {Sql.Entity<FloodedAreaScript>(x => x.id):TC}=@id", exitedItem)).FirstOrDefault();
                    return new RestData
                    {
                        data = exitedItem
                    };
                }
                else
                {
                    return new RestError((int)HttpStatusCode.NotFound, "Không tìm thấy hồ sơ!");
                }
            }
        }

        [HttpPost("")]
        public override async Task<RestBase> InsertAsync([FromBody] FloodedAreaScript entity)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (entity == null)
                    {
                        return new RestError(400, "Dữ liệu đầu vào không hợp lệ");
                    }

                    entity.ngay_tao = DateTime.Now;
                    await Repository.SaveOrUpdateAsync(entity, uow);

                    var condition = $" {nameof(FloodedAreaScriptAttachment.kichban_id)} = @kichban_id";
                    var deletedIds = new int[] { };
                    if (entity.attachments != null && entity.attachments.Count() > 0)
                    {
                        deletedIds = entity.attachments.Where(x => x.id > 0).Select(x => x.id).ToArray();

                        if (deletedIds.Count() > 0)
                        {
                            condition += $" AND {nameof(FloodedAreaScriptAttachment.id)} <> ALL(@deletedIds)";
                        }
                    }
                    await uow.Connection.BulkDeleteAsync<FloodedAreaScriptAttachment>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(new
                        {
                            kichban_id = entity.id,
                            deletedIds = deletedIds
                        })
                    );
                    if (entity.files != null && entity.files.Count() > 0)
                    {
                        foreach (var file in entity.files)
                        {
                            var attachment = new FloodedAreaScriptAttachment()
                            {
                                kichban_id = entity.id,
                                tenfile_goc = file.FileName,
                                mime_type = file.ContentType,
                                url = file.url,
                            };
                            uow.Connection.Insert(attachment);
                        }
                    }
                    if (!string.IsNullOrEmpty(entity.geom))
                    {
                        GeoJsonReader reader = new GeoJsonReader();
                        Geometry geometry = reader.Read<Geometry>(entity.geom);
                        GeoJsonWriter writer = new GeoJsonWriter();
                        string gson = writer.Write(geometry);
                        var sql = $"UPDATE {Sql.Entity<FloodedAreaScript>():T} SET geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326) WHERE {Sql.Entity<FloodedAreaScript>(x => x.id):TC}=@id;";
                        uow.Connection.Execute(sql, new { entity.id });
                    }

                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpPut("")]
        public override async Task<RestBase> UpdateAsync([FromBody] FloodedAreaScript entity)
        {
            using (var session = OpenSession())
            {
                using (var uow = new UnitOfWork(DbFactory, session))
                {
                    if (entity == null)
                    {
                        return new RestError(400, "Dữ liệu đầu vào không hợp lệ");
                    }

                    var existedItem = session.Get(new FloodedAreaScript { id = entity.id });

                    if (existedItem == null)
                    {
                        return new RestError((int)HttpStatusCode.NotFound, "Không tìm thấy kịch bản");
                    }

                    entity.ngay_tao = existedItem.ngay_tao;
                    await Repository.SaveOrUpdateAsync(entity, uow);
                    var condition = $" {nameof(FloodedAreaScriptAttachment.kichban_id)} = @kichban_id";
                    var deletedIds = new int[] { };
                    if (entity.attachments != null && entity.attachments.Count() > 0)
                    {
                        deletedIds = entity.attachments.Where(x => x.id > 0).Select(x => x.id).ToArray();

                        if (deletedIds.Count() > 0)
                        {
                            condition += $" AND {nameof(FloodedAreaScriptAttachment.id)} <> ALL(@deletedIds)";
                        }
                    }
                    await uow.Connection.BulkDeleteAsync<FloodedAreaScriptAttachment>(stm => stm
                        .Where($"{condition}")
                        .WithParameters(new
                        {
                            kichban_id = entity.id,
                            deletedIds = deletedIds
                        })
                    );

                    if (entity.files != null && entity.files.Count() > 0)
                    {
                        foreach (var file in entity.files)
                        {
                            var attachment = new FloodedAreaScriptAttachment()
                            {
                                kichban_id = entity.id,
                                tenfile_goc = file.FileName,
                                mime_type = file.ContentType,
                                url = file.url,
                            };
                            uow.Connection.Insert(attachment);
                        }
                    }
                    if (!string.IsNullOrEmpty(entity.geom))
                    {
                        GeoJsonReader reader = new GeoJsonReader();
                        Geometry geometry = reader.Read<Geometry>(entity.geom);
                        GeoJsonWriter writer = new GeoJsonWriter();
                        string gson = writer.Write(geometry);
                        var sql = $"UPDATE {Sql.Entity<FloodedAreaScript>():T} SET geom = ST_SetSRID(ST_GeomFromGeoJSON('{gson}'), 4326) WHERE {Sql.Entity<FloodedAreaScript>(x => x.id):TC}=@id;";
                        uow.Connection.Execute(sql, new { entity.id });
                    }
                    return new RestBase(EnumErrorCode.OK);
                }
            }
        }

        [HttpGet("{kichBanId}/download")]
        public async Task<ActionResult> AttachDownload([FromRoute] int kichBanId)
        {
            using (var session = OpenSession())
            {
                var attachments = (await session.FindAsync<FloodedAreaScriptAttachment>(stm => stm
                    .Where($"{Sql.Entity<FloodedAreaScriptAttachment>(x => x.kichban_id):TC} = @kichban_id")
                    .WithParameters(new { kichban_id = kichBanId })
                )).ToList();
                MemoryStream memoryStream = new MemoryStream();
                ZipArchive zipArchive = new ZipArchive(memoryStream, ZipArchiveMode.Create);
                using (var ms = new MemoryStream())
                {
                    using (var archive =
                        new ZipArchive(ms, ZipArchiveMode.Create, true))
                    {
                        foreach (var attachment in attachments)
                        {
                            var store_file_name = attachment.url.ToString().Substring(attachment.url.ToString().LastIndexOf("/") + 1);
                            var filePath = Path.Combine(_hostingEnvironment.ContentRootPath, "Data_Stores", "documents", store_file_name);

                            if (System.IO.File.Exists(filePath))
                            {
                                using (FileStream fileStream = System.IO.File.OpenRead(filePath))
                                {
                                    MemoryStream memStream = new MemoryStream();
                                    memStream.SetLength(fileStream.Length);
                                    fileStream.CopyTo(memStream);
                                    var zipEntry = archive.CreateEntry(attachment.tenfile_goc, CompressionLevel.Fastest);
                                    using (var zipStream = zipEntry.Open())
                                    {
                                        zipStream.Write(memStream.ToArray(), 0, (int)fileStream.Length);
                                    }
                                }
                            }
                        }
                    }
                    return File(ms.ToArray(), "application/zip", "attachments.zip");
                }
            }
        }

        [HttpPost("upload")]
        public async Task<RestBase> Upload([FromForm] IFormFile[] files)
        {
            var fileViewList = new List<FileView>();
            if (files != null && files.Count() > 0)
            {
                foreach (var file in files)
                {
                    var fileView = new FileView();
                    var store_file_name = await FileHelper.PostDocumentAsync(file, file.FileName, file.ContentType);
                    fileView.FileName = file.FileName;
                    fileView.ContentType = file.ContentType;
                    fileView.url = Path.Combine(GlobalConfiguration.DocumentPath, store_file_name).Replace("\\", "/");
                    fileViewList.Add(fileView);
                }
            }
            return new RestData()
            {
                data = fileViewList
            };
        }
    }
}