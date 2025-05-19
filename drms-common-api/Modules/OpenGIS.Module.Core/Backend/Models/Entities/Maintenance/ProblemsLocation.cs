using System;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("vitrisuco", Schema = "csdl_suco_phanhoi")]
    public class ProblemsLocation
    {
        public int objectid { get; set; }
        public string? mavitrisuco { get; set; }
        public string? diachi { get; set; }
        public string? vitri { get; set; }
        public string? field { get; set; }
        public string? ghichu { get; set; }
        public string? hientrangid { get; set; }
        public string? phanloaiid { get; set; }
        public string? sohieuduong { get; set; }
        public string? loaisuco { get; set; }
        [NotMapped]
        public string? geom { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        [ForeignKey(nameof(district))]
        public string? district_code { get; set; }
        [ForeignKey(nameof(commune))]
        public string? commune_code { get; set; }
        public string? province_code { get; set; }
        public string? loaicongtrinh_id { get; set; }
        public int? layer_id { get; set; }
        public virtual District? district { get; set; }
        public virtual Commune? commune { get; set; }
    }
}