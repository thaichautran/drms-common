using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("p_problem", Schema = "maintenance")]
    public class Problem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public int? trangthai_id { get; set; }
        public DateTime? thoigian_capnhat_trangthai { get; set; }
        public string? dienbien { get; set; }
        public string? chitiet_suco { get; set; }
        public DateTime? thoigian_xayra_suco { get; set; }
        [NotMapped]
        public string? year => $"{thoigian_xayra_suco?.ToString("yyyy")}";
        public int? loai_suco_id { get; set; }
        public string? nguyennhan { get; set; }
        public string? bienphap_khacphuc { get; set; }
        public string? ghichu { get; set; }
        public DateTime? created_at { get; set; }
        public string? created_by { get; set; }
        public DateTime? updated_at { get; set; }
        public string? updated_by { get; set; }
        public int? donvi_quanly_id { get; set; }
        public string? asset_id { get; set; }
        [NotMapped]
        public string? trangthai
        {
            get
            {
                switch (trangthai_id)
                {
                    case 0:
                        return "Chưa xử lý";
                    case 1:
                        return "Đang xử lý";
                    case 2:
                        return "Đã xử lý";
                    default: return "Không xác định";
                }
            }
        }
        [NotMapped]
        public IEnumerable<ProblemAsset>? assets { get; set; }
    }
}