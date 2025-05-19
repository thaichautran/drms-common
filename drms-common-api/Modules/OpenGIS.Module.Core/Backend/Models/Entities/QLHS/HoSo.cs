using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.Models.Entities.Category;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using System.Text;
using VietGIS.Infrastructure;

namespace OpenGIS.Module.Core.Models.Entities.QLHS
{
    [Table("ho_so", Schema = "qlhs")]
    public class HoSo
    {
        public HoSo()
        {
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? title { get; set; }
        public string? code { get; set; }
        public string? short_description { get; set; }
        public string? description { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public bool? visible { get; set; }
        public string? attachment_url { get; set; }
        public string? nguoiky { get; set; }
        public DateTime? ngay_banhanh { get; set; }
        public DateTime? ngay_hieuluc { get; set; }
        public string? ghi_chu { get; set; }
        [ForeignKey(nameof(loai_hoso))]
        public int loai_hoso_id { get; set; }
        [ForeignKey(nameof(nhom_hoso))]
        public int nhom_hoso_id { get; set; }
        [NotMapped]
        public LoaiHoSo? loai_hoso { get; set; }
        [NotMapped]
        public NhomHoSo? nhom_hoso { get; set; }
        [ForeignKey(nameof(trangthai_hoso))]
        public int? trangthai_id { get; set; }
        [ForeignKey(nameof(loai_nha))]
        public int? loainha_id { get; set; }
        [ForeignKey(nameof(loai_taisan))]
        public int? loaicongtrinh_id { get; set; }
        [ForeignKey(nameof(coquan_banhanh))]
        public int? coquan_banhanh_id { get; set; }
        [NotMapped]
        public TinhTrangHoSo? trangthai_hoso { get; set; }
        [NotMapped]
        public CoQuanBanHanh? coquan_banhanh { get; set; }
        [NotMapped]
        public LoaiTaiSan? loai_taisan { get; set; }
        [NotMapped]
        public LoaiNha? loai_nha { get; set; }
        [NotMapped]
        public IEnumerable<Attachment>? attachments { get; set; }
        [NotMapped]
        public IEnumerable<IFormFile>? files { get; set; }
        [NotMapped]
        public string? extension
        {
            get
            {
                if (!string.IsNullOrEmpty(attachment_url))
                {
                    if (attachment_url.Contains(GlobalConfiguration.DocumentPath))
                    {
                        return Path.GetExtension(attachment_url.Replace(GlobalConfiguration.DocumentPath, ""));
                    }
                }
                return string.Empty;
            }
        }
    }
}
