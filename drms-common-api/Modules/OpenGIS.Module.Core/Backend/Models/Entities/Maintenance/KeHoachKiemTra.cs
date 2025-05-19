using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("kehoachkiemtra", Schema = "maintenance")]
    public class KeHoachKiemTra
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? tenkehoach { get; set; }
        public string? noidung { get; set; }
        public DateTime? ngaylapkehoach { get; set; }
        public string? nguoilapkehoach { get; set; }
        public DateTime? ngaybatdau { get; set; }
        public DateTime? ngayketthuc { get; set; }
        public string? loaikehoach { get; set; }
        public string? diadiemthuchien { get; set; }
        public string? ghichu { get; set; }
        public string? magoithau { get; set; }
        public string? mahopdong { get; set; }
        public virtual List<KeHoachKiemTraCongTrinh>? congTrinhs { get; set; }
        public virtual List<KeHoachKiemTraNhanVien>? nhanViens { get; set; }
        public virtual List<DinhKem>? attachments { get; set; }
        public virtual List<CongViec>? listCongViec { get; set; }

        [Table("kehoach_kiemtra_dinhkem", Schema = "maintenance")]
        public sealed class DinhKem
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int id { get; set; }
            public string? file_name { get; set; }
            public string? mime_type { get; set; }
            public string? extension { get; set; }
            public long? size { get; set; }
            public string? url { get; set; }
            [ForeignKey(nameof(keHoach))]
            public int? kehoach_id { get; set; }
            [NotMapped]
            public IFormFile? raw { get; set; }
            public KeHoachKiemTra? keHoach { get; set; }
        }

        [Table("kehoachkiemtra_congviec", Schema = "maintenance")]
        public sealed class CongViec
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int id { get; set; }
            [ForeignKey(nameof(keHoach))]
            public int kehoach_id { get; set; }
            [ForeignKey(nameof(dmHangMucCongViec))]
            public int congviec_id { get; set; }
            public int? nhathau { get; set; }
            public DateTime thoigian_thuchien { get; set; }
            public double khoiluong_thuchien { get; set; }
            public double khoiluong_kehoach { get; set; }
            public double dutoan { get; set; }
            public string? donvi { get; set; }

            public DmHangMucCongViec? dmHangMucCongViec { get; set; }
            public KeHoachKiemTra? keHoach { get; set; }
        }
    }
}