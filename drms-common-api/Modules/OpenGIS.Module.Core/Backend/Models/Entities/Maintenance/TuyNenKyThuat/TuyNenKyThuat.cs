using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("tuynenkythuat", Schema = "csdl_tuynenkythuat")]
    public class TuyNenKyThuat
    {
        public int objectid { get; set; }
        public double? tuynenkythuat { get; set; }
        public string? matuynen { get; set; }
        public string? diachi { get; set; }
        public double? kichthuoc { get; set; }
        public DateTime? ngayvanhanh { get; set; }
        public string? donvivanhanh { get; set; }
        public string? dungluongthietke { get; set; }
        public string? caododay { get; set; }
        public string? caododinh { get; set; }
        public string? hethongcongbe { get; set; }
        public string? vitriganivo { get; set; }
        public string? donviquanlyid { get; set; }
        public string? hientrangid { get; set; }
        public string? anhminhhoa { get; set; }
        public DateTime? ngaycapnhat { get; set; }
        // public string geom { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        [ForeignKey(nameof(district))]
        public string? district_code { get; set; }
        [ForeignKey(nameof(commune))]
        public string? commune_code { get; set; }
        [ForeignKey(nameof(province))]
        public string? province_code { get; set; }
        [NotMapped]
        [JsonIgnore]
        public District district { get; set; }
        [NotMapped]
        [JsonIgnore]
        public Commune commune { get; set; }
        [NotMapped]
        [JsonIgnore]
        public Province province { get; set; }
    }
}