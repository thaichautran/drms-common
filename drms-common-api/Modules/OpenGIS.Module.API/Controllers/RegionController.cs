using Dapper;
using Dapper.FastCrud;
using Microsoft.AspNetCore.Mvc;
using VietGIS.Infrastructure.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using OpenGIS.Module.API.Controllers.Base;
using VietGIS.Infrastructure.Models.DTO.Response;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models;
using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Models.Regional;
using System.Net;
using OpenGIS.Module.Core.Enums;
using VietGIS.Infrastructure.Helpers;

namespace OpenGIS.Module.API.Controllers
{
    [Route("api/[controller]")]
    //// [Authorize(Policy = nameof(ModuleFunction.READ_REGION))]
    public class RegionController : BaseController
    {
        public RegionController(IDbFactory dbFactory)
            : base(dbFactory)
        {
        }

        [ResponseCache(Duration = 300, VaryByQueryKeys = new string[] { "id" })]
        [HttpGet("{id}")]
        [AllowAnonymous]
        public RestBase get([FromRoute] string? id = "")
        {
            if (string.IsNullOrWhiteSpace(id) == false)
            {
                using (var session = OpenSession())
                {
                    if (id.ToString().Length == 2)
                    {
                        return new RestData
                        {
                            data = session.Find<Province>(statement => statement
                                .Where($"{nameof(Province.area_id):C} = @id")
                                .WithParameters(new { id = id })
                            ).FirstOrDefault()
                        };
                    }
                    else if (id.ToString().Length == 3)
                    {
                        return new RestData
                        {
                            data = session.Find<District>(statement => statement
                                .Where($"{nameof(District.area_id):C} = @id")
                                .WithParameters(new { id = id })
                            ).FirstOrDefault()
                        };
                    }
                    else if (id.ToString().Length == 5)
                    {
                        return new RestData
                        {
                            data = session.Find<Commune>(statement => statement
                                .Where($"{nameof(Commune.area_id):C} = @id")
                                .WithParameters(new { id = id })
                            ).FirstOrDefault()
                        };
                    }
                }
            }
            return new RestError((int)HttpStatusCode.NotModified, "Mã hành chính không hợp lệ, vui lòng kiểm tra lại tham số!");
        }

        [ResponseCache(Duration = 300, VaryByQueryKeys = new string[] { "parent_id", "q" })]
        [HttpGet("provinces")]
        [AllowAnonymous]
        public RestBase listProvinces([FromQuery] string? parent_id, [FromQuery] string? q, [FromQuery] bool checkPermission = false)
        {
            using (var session = OpenSession())
            {
                var condition = string.IsNullOrWhiteSpace(q) ? "1=1" : $"{Sql.Entity<Province>():T}.search_content @@ to_tsquery(@q)";
                condition += $" AND {Sql.Entity<Province>(x => x.visible):TC} = true";
                IEnumerable<Province> data = new List<Province>();
                //if (parent_id.HasValue)
                //    data = session.Find<EntityProvince>(statement => statement.Where($"{nameof(EntityProvince.parent_id)}={parent_id}"));

                if (!(User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)) && checkPermission == true)
                {
                    var regionCodes = session.Find<UserRegion>(x => x.Where($"{Sql.Entity<UserRegion>(x => x.user_id):TC} = @id")
                    .WithParameters(new
                    {
                        id = getUserId()
                    }));
                    if (regionCodes.Count() > 0)
                    {
                        var provinceCodes = regionCodes.Where(x => x.area_type == 1).Select(x => x.area_code).ToArray();
                        var districtCodes = regionCodes.Where(x => x.area_type == 2).Select(x => x.area_code).ToArray();
                        var communeCodes = regionCodes.Where(x => x.area_type == 3).Select(x => x.area_code).ToArray();
                        var query = new List<string>();

                        if (provinceCodes.Count() > 0)
                        {
                            query.Add($"select {Sql.Entity<Province>(x => x.area_id):TC} {nameof(Province.area_id)}, {Sql.Entity<Province>(x => x.name_vn):TC} {nameof(Province.name_vn)}, {Sql.Entity<Province>(x => x.visible):TC} from {Sql.Entity<Province>():T} WHERE {condition} AND {Sql.Entity<Province>(x => x.area_id):TC} = ANY(@provinceCodes)");
                        }
                        if (districtCodes.Count() > 0)
                        {
                            query.Add($"select {Sql.Entity<Province>(x => x.area_id):TC} {nameof(Province.area_id)}, {Sql.Entity<Province>(x => x.name_vn):TC} {nameof(Province.name_vn)}, {Sql.Entity<Province>(x => x.visible):TC} from {Sql.Entity<Province>():T} WHERE {condition} AND {Sql.Entity<Province>(x => x.area_id):TC} IN (SELECT DISTINCT {Sql.Entity<District>(x => x.parent_id):TC} FROM {Sql.Entity<District>():T} WHERE {Sql.Entity<District>(x => x.area_id):TC} = ANY(@districtCodes))");
                        }
                        if (communeCodes.Count() > 0)
                        {
                            query.Add($"select {Sql.Entity<Province>(x => x.area_id):TC} {nameof(Province.area_id)}, {Sql.Entity<Province>(x => x.name_vn):TC} {nameof(Province.name_vn)}, {Sql.Entity<Province>(x => x.visible):TC} from {Sql.Entity<Province>():T} WHERE {condition} AND {Sql.Entity<Province>(x => x.area_id):TC} IN (SELECT DISTINCT {Sql.Entity<Commune>(x => x.proid_2004):TC} FROM {Sql.Entity<Commune>():T} WHERE {Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@communeCodes))");
                        }
                        if (query.Count() > 0)
                        {
                            data = session.Query<Province>(string.Join(" UNION ALL ", query), new
                            {
                                q = q.ToFullTextStringProximity(),
                                provinceCodes,
                                districtCodes,
                                communeCodes,
                            });
                        }
                    }
                }
                else
                {
                    data = session.Find<Province>(statement => statement
                       .Where($"{condition}")
                       .WithParameters(new
                       {
                           q = q.ToFullTextStringProximity(),
                       })
                       .OrderBy($"{Sql.Entity<Province>(p => p.name_vn):TC} ASC")
                   );
                }

                return new RestData()
                {
                    data = data
                };
            }
        }

        [ResponseCache(Duration = 300, VaryByQueryKeys = new string[] { "parent_id", "q" })]
        [HttpGet("districts")]
        [AllowAnonymous]
        public RestBase listDistricts([FromQuery] string? q, [FromQuery] string? parent_id = "", [FromQuery] bool checkPermission = false)
        {
            using (var session = OpenSession())
            {
                IEnumerable<District> data = new List<District>();
                var condition = string.IsNullOrWhiteSpace(q) ? "1=1" : $"{Sql.Entity<District>():T}.search_content @@ to_tsquery(@q)";
                condition += $" AND {Sql.Entity<District>(x => x.visible):TC} = true";
                var parent_ids = new string[] { };
                if (string.IsNullOrWhiteSpace(parent_id) == false)
                {
                    condition += $" AND {Sql.Entity<District>(x => x.parent_id):TC} = ANY(@parent_ids)";
                    parent_ids = parent_id.Split(",");
                }
                if (!(User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)) && checkPermission)
                {
                    var regionCodes = session.Find<UserRegion>(x => x.Where($"{Sql.Entity<UserRegion>(x => x.user_id):TC} = @id")
                    .WithParameters(new
                    {
                        id = getUserId()
                    }));
                    if (regionCodes.Count() > 0)
                    {
                        var provinceCodes = regionCodes.Where(x => x.area_type == 1).Select(x => x.area_code).ToArray();
                        var districtCodes = regionCodes.Where(x => x.area_type == 2).Select(x => x.area_code).ToArray();
                        var communeCodes = regionCodes.Where(x => x.area_type == 3).Select(x => x.area_code).ToArray();
                        var query = new List<string>();

                        if (provinceCodes.Count() > 0)
                        {
                            query.Add($"select {Sql.Entity<District>(x => x.area_id):TC} {nameof(District.area_id)}, {Sql.Entity<District>(x => x.name_vn):TC} {nameof(District.name_vn)}, {Sql.Entity<District>(x => x.visible):TC} from {Sql.Entity<District>():T} WHERE {condition} AND {Sql.Entity<District>(x => x.parent_id):TC} = ANY(@provinceCodes)");
                        }
                        if (districtCodes.Count() > 0)
                        {
                            query.Add($"select {Sql.Entity<District>(x => x.area_id):TC} {nameof(District.area_id)}, {Sql.Entity<District>(x => x.name_vn):TC} {nameof(District.name_vn)}, {Sql.Entity<District>(x => x.visible):TC} from {Sql.Entity<District>():T} WHERE {condition} AND {Sql.Entity<District>(x => x.area_id):TC} = ANY(@districtCodes)");
                        }
                        if (communeCodes.Count() > 0)
                        {
                            query.Add($"select {Sql.Entity<District>(x => x.area_id):TC} {nameof(District.area_id)}, {Sql.Entity<District>(x => x.name_vn):TC} {nameof(District.name_vn)}, {Sql.Entity<District>(x => x.visible):TC} from {Sql.Entity<District>():T} WHERE {condition} AND {Sql.Entity<District>(x => x.area_id):TC} IN (SELECT DISTINCT {Sql.Entity<Commune>(x => x.parent_id):TC} FROM {Sql.Entity<Commune>():T} WHERE {Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@communeCodes))");
                        }
                        if (query.Count() > 0)
                        {
                            data = session.Query<District>(string.Join(" UNION ALL ", query), new
                            {
                                q = q.ToFullTextStringProximity(),
                                provinceCodes,
                                districtCodes,
                                communeCodes,
                                parent_ids
                            });
                        }

                    }
                }
                else
                {
                    var visibleProvinces = session.Find<Province>(statement => statement
                        .Where($"{nameof(Province.visible)}")
                    ).ToList();
                    data = session.Find<District>(statement => statement
                        .Where($"{Sql.Entity<District>(x => x.parent_id):TC} = ANY(@visible_province_ids) AND {condition}")
                        .WithParameters(new { visible_province_ids = visibleProvinces.Select(x => x.area_id).ToArray(), q = q?.ToFullTextStringProximity(), parent_ids })
                        .OrderBy($"{Sql.Entity<District>(p => p.name_vn):TC} ASC")
                    );
                }
                return new RestData()
                {
                    data = data
                };
            }
        }

        [ResponseCache(Duration = 300, VaryByQueryKeys = new string[] { "parent_id", "q", "provinceCode" })]
        [HttpGet("communes")]
        [AllowAnonymous]
        public RestBase listCommunes([FromQuery] string? parent_id, [FromQuery] string? provinceCode, [FromQuery] string? q, [FromQuery] bool checkPermission)
        {
            using (var session = OpenSession())
            {
                IEnumerable<Commune> data = new List<Commune>();
                var condition = string.IsNullOrWhiteSpace(q) ? "1=1" : $"{Sql.Entity<Commune>():T}.search_content @@ to_tsquery(@q)";
                condition += $" AND {Sql.Entity<Commune>(x => x.visible):TC} = true";
                if (string.IsNullOrWhiteSpace(provinceCode) == false)
                {
                    condition += $"{Sql.Entity<Commune>(x => x.proid_2004):TC} = @provinceCode";
                }
                if (!string.IsNullOrWhiteSpace(parent_id) && parent_id == "-1")
                {
                    var visibleProvinces = session.Find<Province>(statement => statement
                        .Where($"{nameof(Province.visible)}")
                    );
                    var visibleDistricts = session.Find<District>(statement => statement
                        .Where($"{Sql.Entity<District>(x => x.parent_id):TC} = ANY(@visible_province_ids)")
                        .WithParameters(new { visible_province_ids = visibleProvinces.Select(x => x.area_id).ToArray() })
                    );
                    data = session.Find<Commune>(statement => statement
                        .Where($"{Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@visible_district_ids) AND {condition}")
                        .WithParameters(new { visible_district_ids = visibleDistricts.Select(x => x.area_id).ToArray(), q = q?.ToFullTextStringProximity(), provinceCode })
                        .OrderBy($"{Sql.Entity<Commune>(p => p.name_vn):TC} ASC")
                    );
                }
                else
                {
                    var parent_ids = new string[] { };
                    if (string.IsNullOrWhiteSpace(parent_id) == false && parent_id != "-1")
                    {
                        condition += $" AND {Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@parent_ids)";
                        parent_ids = parent_id.Split(",");
                    }
                    if (!(User.IsInRole(EnumRoles.SA) || User.IsInRole(EnumRoles.ADMINISTRATOR)) && checkPermission == true)
                    {
                        var regionCodes = session.Find<UserRegion>(x => x.Where($"{Sql.Entity<UserRegion>(x => x.user_id):TC} = @id")
                    .WithParameters(new
                    {
                        id = getUserId()
                    }));
                        if (regionCodes.Count() > 0)
                        {
                            var provinceCodes = regionCodes.Where(x => x.area_type == 1).Select(x => x.area_code).ToArray();
                            var districtCodes = regionCodes.Where(x => x.area_type == 2).Select(x => x.area_code).ToArray();
                            var communeCodes = regionCodes.Where(x => x.area_type == 3).Select(x => x.area_code).ToArray();
                            var query = new List<string>();

                            if (provinceCodes.Count() > 0)
                            {
                                query.Add($"select {Sql.Entity<Commune>(x => x.area_id):TC} {nameof(Commune.area_id)}, {Sql.Entity<Commune>(x => x.name_vn):TC} {nameof(Commune.name_vn)}, {Sql.Entity<Commune>(x => x.visible):TC} from {Sql.Entity<Commune>():T} WHERE {condition} AND {Sql.Entity<Commune>(x => x.proid_2004):TC} = ANY(@provinceCodes)");
                            }
                            if (districtCodes.Count() > 0)
                            {
                                query.Add($"select {Sql.Entity<Commune>(x => x.area_id):TC} {nameof(Commune.area_id)}, {Sql.Entity<Commune>(x => x.name_vn):TC} {nameof(Commune.name_vn)}, {Sql.Entity<Commune>(x => x.visible):TC} from {Sql.Entity<Commune>():T} WHERE {condition} AND {Sql.Entity<Commune>(x => x.parent_id):TC} = ANY(@districtCodes)");
                            }
                            if (communeCodes.Count() > 0)
                            {
                                query.Add($"select {Sql.Entity<Commune>(x => x.area_id):TC} {nameof(Commune.area_id)}, {Sql.Entity<Commune>(x => x.name_vn):TC} {nameof(Commune.name_vn)}, {Sql.Entity<Commune>(x => x.visible):TC} from {Sql.Entity<Commune>():T} WHERE {condition} AND {Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@communeCodes)");
                            }
                            if (query.Count() > 0)
                            {
                                data = session.Query<Commune>(string.Join(" UNION ALL ", query), new
                                {
                                    q = q.ToFullTextStringProximity(),
                                    provinceCodes,
                                    districtCodes,
                                    communeCodes,
                                    provinceCode,
                                    parent_ids
                                });
                            }

                        }
                    }
                    else
                    {
                        data = session.Find<Commune>(statement => statement
                        .Where($"{condition}")
                        .WithParameters(new { parent_ids, q = q?.ToFullTextStringProximity(), provinceCode })
                        .OrderBy($"{Sql.Entity<Commune>(p => p.name_vn):TC} ASC")
                    );
                    }
                }
                return new RestData()
                {
                    data = data
                };
            }
        }

        [ResponseCache(Duration = 300, VaryByQueryKeys = new string[] { "area_id", "f" })]
        [HttpGet("shape")]
        public async Task<RestBase> shape([FromQuery] string? area_id = "", [FromQuery] string? f = "json")
        {
            if (string.IsNullOrWhiteSpace(area_id) && (f?.ToLower()?.Equals("json") == false || f?.ToLower()?.Equals("wkt") == false))
            {
                return new RestError("MISSING_PARAMETER")
                {
                    errors = new RestErrorDetail[]{
                        new RestErrorDetail(){
                            code = 400,
                            message = "missing params"
                        }
                    }
                };
            }
            else
            {
                using (var session = OpenSession())
                {
                    var data = string.Empty;
                    //if (area_id.ToString().Length == 1)
                    //    data = (await session.QueryAsync<string>($"SELECT ST_AsGeoJson(geom) FROM {Sql.Entity<Region>():T} WHERE {Sql.Entity<EntityRegion>(x => x.area_id):TC}= @area_id", new { area_id = area_id })).FirstOrDefault();
                    if (area_id.ToString().Length == 2)
                        data = (await session.QueryAsync<string>($"SELECT ST_AsGeoJson(geom) FROM {Sql.Entity<Province>():T} WHERE {Sql.Entity<Province>(x => x.area_id):TC}=@area_id", new { area_id = area_id })).FirstOrDefault();
                    else if (area_id.ToString().Length == 3)
                        data = (await session.QueryAsync<string>($"SELECT ST_AsGeoJson(geom) FROM {Sql.Entity<District>():T} WHERE {Sql.Entity<District>(x => x.area_id):TC}=@area_id", new { area_id = area_id })).FirstOrDefault();
                    else if (area_id.ToString().Length == 5)
                        data = (await session.QueryAsync<string>($"SELECT ST_AsGeoJson(geom) FROM {Sql.Entity<Commune>():T} WHERE {Sql.Entity<Commune>(x => x.area_id):TC}=@area_id", new { area_id = area_id })).FirstOrDefault();
                    return new RestData()
                    {
                        data = data
                    };
                }
            }
        }

        [HttpPost("check-geometry")]
        public RestBase checkgeometry([FromForm] string? geojson, [FromForm] string? type)
        {
            using (var session = OpenSession())
            {
                string sql = string.Empty;
                var region = new Commune();
                var check = new EmptyEntity();
                // Kiểm tra geometry có thuộc vùng cho phép không
                if (!string.IsNullOrWhiteSpace(geojson))
                {
                    sql = $@"select count(*) as id from {Sql.Entity<Province>():T} 
                             where ST_Intersects(geom,st_setsrid(ST_GeomFromGeoJSON('{geojson}'),4326)) and visible = true";
                    check = session.Query<EmptyEntity>(sql).FirstOrDefault();
                    if (check != null && check.id > 0)
                    {
                        region = session.Find<Commune>(stm => stm
                            .Where($"ST_Intersects({Sql.Entity<Commune>():T}.geom,st_setsrid(ST_GeomFromGeoJSON('{geojson}'),4326))")
                            .Include<District>()
                        ).FirstOrDefault();
                    }
                }
                return new RestData()
                {
                    data = new
                    {
                        checkOut = check,
                        region = region
                    }
                };
            }
        }

        [HttpGet("get-by-id")]
        [AllowAnonymous]
        public async Task<JsonResult> getRegionAsync([FromQuery] string? id)
        {
            using (var session = OpenSession())
            {
                var ExprTreeView = new List<DevTreeView>();
                if (string.IsNullOrWhiteSpace(id) == false)
                {
                    if (id.Length == 3)
                    {
                        string condition = @$"{Sql.Entity<Commune>(x => x.parent_id):TC} = @id";
                        List<string> commune_ids = new List<string>();
                        if (!User.IsInRole(EnumRoles.SA))
                        {
                            var userRegions = session.Find<UserRegion>(statement => statement
                               .Where($"{nameof(UserRegion.user_id)} = @id AND {nameof(UserRegion.area_type)} = 3")
                               .WithParameters(new { id = getUserId() })
                            ).ToList();

                            if (userRegions != null && userRegions.Count(x => x.area_type == 2) > 0)
                            {
                                condition += $@" AND {Sql.Entity<Commune>(x => x.area_id):TC} = ANY(@commune_ids) AND {Sql.Entity<Commune>(x => x.visible):TC} = TRUE";
                                commune_ids = userRegions?.Select(x => x.area_code).ToList();
                            }
                        }
                        var communes = (await session.FindAsync<Commune>(x => x
                            .Where($"{condition}")
                            .WithParameters(new { id = id })
                        )).ToList();

                        communes.ForEach(x =>
                        {
                            ExprTreeView.Add(new DevTreeView
                            {
                                id = x.area_id,
                                text = x.name_vn,
                                hasItems = false,
                                parentId = id,
                                isExpanded = false
                            });
                        });
                    }
                    else if (id.Length == 2)
                    {
                        string condition = @$"{Sql.Entity<District>(x => x.parent_id):TC} = @id";
                        List<string> district_ids = new List<string>();
                        if (!User.IsInRole(EnumRoles.SA))
                        {
                            var userRegions = session.Find<UserRegion>(statement => statement
                               .Where($"{nameof(UserRegion.user_id)} = @id and {nameof(UserRegion.area_type)} = 2")
                               .WithParameters(new { id = getUserId() })
                            ).ToList();

                            if (userRegions != null && userRegions.Count(x => x.area_type == 2) > 0)
                            {
                                condition += $@" AND {Sql.Entity<District>(x => x.area_id):TC} = ANY(@district_ids) AND {Sql.Entity<District>(x => x.visible):TC} = TRUE";
                                district_ids = userRegions.Select(x => x.area_code).ToList();
                            }
                        }

                        var districts = (await session.FindAsync<District>(x => x
                            .Where($"{condition} AND {Sql.Entity<District>(x => x.visible):TC} = TRUE")
                            .WithParameters(new { id = id, district_ids = district_ids.ToArray() })
                        )).ToList();
                        districts.ForEach(x =>
                        {
                            ExprTreeView.Add(new DevTreeView
                            {
                                id = x.area_id,
                                text = x.name_vn,
                                hasItems = true,
                                parentId = id,
                                isExpanded = false
                            });
                        });
                    }
                    else
                    {
                        var provinces = (await session.FindAsync<Province>(statement => statement
                            .Where($"{nameof(Province.visible)}")
                        )).ToList();
                        provinces.ForEach(x =>
                        {
                            ExprTreeView.Add(new DevTreeView
                            {
                                id = x.area_id,
                                text = x.name_vn,
                                hasItems = true,
                                parentId = 0,
                                isExpanded = false
                            });
                        });
                    }
                }
                else
                {
                    var provinces = (await session.FindAsync<Province>(statement => statement
                        .Where($"{nameof(Province.visible)}")
                    )).ToList();
                    provinces.ForEach(x =>
                    {
                        ExprTreeView.Add(new DevTreeView
                        {
                            id = x.area_id,
                            text = x.name_vn,
                            hasItems = true,
                            parentId = 0,
                            isExpanded = false
                        });
                    });
                }
                return new JsonResult(ExprTreeView);
            }
        }
    }
}