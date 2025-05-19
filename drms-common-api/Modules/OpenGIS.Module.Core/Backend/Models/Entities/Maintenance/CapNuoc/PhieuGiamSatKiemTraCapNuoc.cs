using OpenGIS.Module.Core.Models.Entities.Category;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance.CapNuoc
{
    [Table("capnuoc_phieugiamsatgiaovieckiemtra", Schema = "maintenance")]
    public class PhieuGiamSatKiemTraCapNuoc
    {
        public PhieuGiamSatKiemTraCapNuoc()
        {
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(phuongThucKiemTra))]
        public int phuongthuckiemtraid { get; set; }
        [ForeignKey(nameof(congCuKiemTra))]
        public int congcukiemtraid { get; set; }
        public string? thoitiet { get; set; }
        public string? thietbi { get; set; }
        public int? sonhancong { get; set; }
        public string? vitri { get; set; }
        public string? diadiem { get; set; }
        public string? tencongtrinh { get; set; }
        public int? goithauso { get; set; }
        public string? nhathau { get; set; }
        public string? donvithicong { get; set; }
        public DateTime? ngaythuchien { get; set; }
        public DateTime? ngayketthuc { get; set; }
        public string? anhminhhoa { get; set; }
        public string? ghichu { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public virtual CongCuKiemTra? congCuKiemTra { get; set; }
        public virtual PhuongThucKiemTra? phuongThucKiemTra { get; set; }

        public string? kiemtra_nhamay_nuoc { get; set; }
        public string? kiemtra_trambom { get; set; }
        public string? kiemtra_ho_thamdo { get; set; }
        public string? kiemtra_benuoc { get; set; }
        public string? kiemtra_giengthu { get; set; }
        public string? kiemtra_duongong { get; set; }
        public string? kiemtra_vanchan { get; set; }
        public string? kiemtra_van_xacan { get; set; }
        public string? kiemtra_van_xakhi { get; set; }
        public string? kiemtra_duongong_truyendan { get; set; }
        public string? kiemtra_dongho_tong { get; set; }
        public string? kiemtra_dongho_apluc { get; set; }
        public string? kiemtra_dongho_dichvu { get; set; }
        public string? kiemtra_vantuyen_dichvu { get; set; }
        public string? kiemtra_diem_daunoi { get; set; }
        [NotMapped]
        public IEnumerable<GiaoViecNhanVien>? giaoViecNhanViens { get; set; }
        [NotMapped]
        public IEnumerable<ThongTinTraoDoiKiemTra>? thongTinTraoDois { get; set; }
        [NotMapped]
        public IEnumerable<HoSoQuanLyKiemTra>? hoSoQuanLys { get; set; }
        [NotMapped]
        public IEnumerable<AnhMinhHoaKiemTra>? anhMinhHoas { get; set; }
        [NotMapped]
        public IEnumerable<KiemTraBaoDuongCongTrinh>? congTrinhBaoDuongs { get; set; }
        [NotMapped]
        public List<int>? deleteHoSoQuanLyIds { get; set; }
        [NotMapped]
        public List<int>? deleteAnhMinhHoaIds { get; set; }
    }
}
