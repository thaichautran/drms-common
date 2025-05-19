using NpgsqlTypes;
using OpenGIS.Module.Core.Models.Entities.Category;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.ThoatNuoc
{
    [Table("tn_diemdenngaplut", Schema = "csdl_thoatnuoc")]
    public class ViTriNgapUng
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(phanLoai))]
        public int phanloaiid { get; set; }
        public virtual PhanLoaiNgapLut? phanLoai { get; set; }
        [ForeignKey(nameof(tinhTrang))]
        public int tinhtrang_id { get; set; }
        public virtual TinhTrangNgapLut? tinhTrang { get; set; }
        public string? tendiem { get; set; }
        public string? diachi { get; set; }
        public DateTime? ngaycapnhat { get; set; }
        public string? thoigianngap { get; set; }
        public string? kichbanngap { get; set; }
        public float? dientichvungngap { get; set; }
        public float? luongmua { get; set; }
        public float? dosaungap { get; set; }
        public string? sohieuduong { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public string? district_code { get; set; }
        public string? commune_code { get; set; }
        public string? province_code { get; set; }
        [NotMapped]
        public string? namcapnhat => ngaycapnhat.HasValue ? ngaycapnhat.Value.Year.ToString() : "Không xác định";
    }
}