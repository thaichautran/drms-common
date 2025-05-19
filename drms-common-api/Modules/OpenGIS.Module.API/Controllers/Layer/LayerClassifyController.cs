using System;
using System.Linq;
using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Models.DTO.Response;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Extensions;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Database;
using System.Threading.Tasks;

namespace OpenGIS.Module.API.Controllers
{
    public partial class LayerController
    {

        [HttpGet("{id}/classify")]
        public RestBase listClassify([FromRoute] int id)
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
                var layer = getLayer(id);
                if (layer == null)
                {
                    return new RestError(EnumErrorCode.ERROR)
                    {
                        errors = new RestErrorDetail[]
                        {
                            new RestErrorDetail { message = "Lớp dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                        }
                    };
                }
                else
                {
                    return new RestData
                    {
                        data = layer.layer_classify
                    };
                }
            }
        }

        [HttpGet("{layer_id}/list-classify-values")]
        public RestBase filterClassifyValue([FromRoute] int layer_id, [FromQuery] int column_id = 0)
        {
            if (layer_id == 0 && column_id == 0)
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
                    var column = getColumn(column_id);
                    if (column == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        return new RestData
                        {
                            data = session.Find<LayerClassify>(statement => statement
                                .Where($"{Sql.Entity<LayerClassify>(x => x.layer_id):TC} = @layer_id AND {Sql.Entity<LayerClassify>(x => x.table_column_id):TC} = @column_id")
                                .WithParameters(new { layer_id = layer_id, column_id = column_id })
                                .OrderBy($"{nameof(LayerClassify.id)}")
                            ).ToList()
                        };
                    }
                }
            }
        }

        [HttpPost("classify/{classify_id}/set-style")]
        public RestBase setClassifyStyle([FromRoute] int classify_id, [FromForm] string style)
        {
            using (var session = OpenSession())
            {
                if (classify_id == 0 || string.IsNullOrWhiteSpace(style))
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
                    var classify = session.Find<LayerClassify>(statement => statement
                        .Where($"{nameof(LayerClassify.id)} = @classify_id")
                        .WithParameters(new { classify_id = classify_id })
                    ).FirstOrDefault();
                    if (classify == null)
                    {
                        return new RestError(EnumErrorCode.ERROR)
                        {
                            errors = new RestErrorDetail[]
                            {
                                new RestErrorDetail { message = "Giá trị classify không tồn tại, vui lòng kiểm tra lại!" }
                            }
                        };
                    }
                    else
                    {
                        classify.style = style;
                        using (var uow = new UnitOfWork(DbFactory, session))
                        {
                            uow.Update(classify);
                        }
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        /// <summary>
        /// Create classify for layer
        /// </summary>
        /// <param name="layer_id"></param>
        /// <param name="column_id"></param>
        /// <returns></returns>
        [HttpPost("{layer_id}/initial-classify-values")]
        public RestBase initialClassifyValues([FromRoute] int layer_id, [FromForm] int column_id = 0)
        {
            if (column_id == 0 || layer_id == 0)
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            else
            {
                using (var session = OpenSession())
                {
                    var column = getColumn(column_id);
                    if (column == null)
                    {
                        return new RestError(404, "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    else
                    {
                        session.Execute($"DELETE FROM {Sql.Entity<LayerClassify>():T} WHERE {nameof(LayerClassify.layer_id)}=@layer_id AND {nameof(LayerClassify.table_column_id)}=@table_column_id", new
                        {
                            layer_id = layer_id,
                            table_column_id = column_id
                        });
                        if (column.lookup_table_id > 0)
                        {
                            TableInfo? domainTable = getTableAndColumns(column.lookup_table_id);
                            TableColumn? keyColumn = domainTable?.key_column ?? domainTable?.identity_column;
                            TableColumn? labelColumn = domainTable?.label_column ?? keyColumn;

                            session.Execute(
                                $@"INSERT INTO {Sql.Entity<LayerClassify>():T} 
                                    (
                                        {nameof(LayerClassify.layer_id)},
                                        {nameof(LayerClassify.table_column_id)},
                                        {nameof(LayerClassify.value)},
                                        {nameof(LayerClassify.description)},
                                        {nameof(LayerClassify.style)}
                                    )
                                    SELECT DISTINCT 
                                        {layer_id} AS {nameof(LayerClassify.layer_id)}
                                        ,{column_id} AS {nameof(LayerClassify.table_column_id)}
                                        ,{keyColumn?.column_name}::TEXT AS value
                                        ,COALESCE({labelColumn?.column_name}::TEXT, 'Khác') AS description
                                        ,'{"{}"}' AS style
                                    FROM {domainTable?.table_schema}.{domainTable?.table_name} AS tbl
                                "
                            );
                        }
                        else
                        {
                            session.Execute(
                                $@"INSERT INTO {Sql.Entity<LayerClassify>():T} 
                                    (
                                        {nameof(LayerClassify.layer_id)},
                                        {nameof(LayerClassify.table_column_id)},
                                        {nameof(LayerClassify.value)},
                                        {nameof(LayerClassify.description)}
                                    )
                                    SELECT DISTINCT 
                                        {layer_id} AS {nameof(LayerClassify.layer_id)}
                                        ,{column_id} AS {nameof(LayerClassify.table_column_id)}
                                        ,{column.column_name}::TEXT AS value
                                        ,COALESCE({column.column_name}::TEXT, 'Khác') AS description
                                    FROM {column.table.table_schema}.{column.table.table_name} AS tbl
                                "
                            );
                        }
                        // session.Execute(
                        //     $@"UPDATE {Sql.Entity<Layer>():T} 
                        //         SET {nameof(Layer.classify_column_id)} = {column_id}
                        //         WHERE {nameof(Layer.id)} = {layer_id}
                        //     "
                        // );
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        /// <summary>
        /// Delete all classify for layer
        /// </summary>
        /// <param name="layer_id"></param>
        /// <param name="column_id"></param>
        /// <returns></returns>
        [HttpPost("{layer_id}/delete-classify-values")]
        public RestBase DeleteClassifyValues([FromRoute] int layer_id, [FromForm] int column_id = 0)
        {
            if (column_id == 0 || layer_id == 0)
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            else
            {
                using (var session = OpenSession())
                {
                    var column = getColumn(column_id);
                    if (column == null)
                    {
                        return new RestError(404, "Trường dữ liệu không tồn tại, vui lòng kiểm tra lại!");
                    }
                    else
                    {
                        using var uow = new UnitOfWork(DbFactory, session);
                        uow.Connection.Execute($"DELETE FROM {Sql.Entity<LayerClassify>():T} WHERE {nameof(LayerClassify.layer_id)}=@layer_id AND {nameof(LayerClassify.table_column_id)}=@table_column_id", new
                        {
                            layer_id = layer_id,
                            table_column_id = column_id
                        });
                        return new RestBase(EnumErrorCode.OK);
                    }
                }
            }
        }

        [HttpPost("classify")]
        public async Task<RestBase> CreateClassifyAsync([FromBody] LayerClassify dto)
        {
            if (dto == null)
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            using var session = OpenSession();
            using var uow = new UnitOfWork(DbFactory, session);
            long inserted = await _layerClassifyRepository.SaveOrUpdateAsync(dto, uow);
            if (inserted > 0)
            {
                return new RestBase(EnumErrorCode.OK);
            }
            return new RestError(202, "Cập nhật bản ghi thất bại, vui lòng thử lại sau");
        }

        [HttpPut("classify")]
        public async Task<RestBase> UpdateClassifyAsync([FromBody] LayerClassify dto)
        {
            if (dto == null || dto.id == 0)
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            using var session = OpenSession();
            var classify = _layerClassifyRepository.GetKey(dto.id, session);
            if (classify == null)
            {
                return new RestError(404, "Bản ghi không tồn tại!");
            }
            using var uow = new UnitOfWork(DbFactory, session);
            long updated = await _layerClassifyRepository.SaveOrUpdateAsync(dto, uow);
            if (updated > 0)
            {
                return new RestBase(EnumErrorCode.OK);
            }
            return new RestError(202, "Cập nhật bản ghi thất bại, vui lòng thử lại sau");
        }

        [HttpDelete("classify/{id}")]
        public async Task<RestBase> DeleteClassifyAsync([FromRoute] int id)
        {
            if (id == 0)
            {
                return new RestError(400, "Vui lòng kiểm tra lại tham số!");
            }
            using var session = OpenSession();
            var classify = _layerClassifyRepository.GetKey(id, session);
            if (classify == null)
            {
                return new RestError(404, "Bản ghi không tồn tại!");
            }
            using var uow = new UnitOfWork(DbFactory, session);
            bool deleted = await _layerClassifyRepository.DeleteAsync(classify, uow);
            if (deleted)
            {
                return new RestBase(EnumErrorCode.OK);
            }
            return new RestError(202, "Xóa bản ghi thất bại, vui lòng thử lại sau");
        }
    }
}
