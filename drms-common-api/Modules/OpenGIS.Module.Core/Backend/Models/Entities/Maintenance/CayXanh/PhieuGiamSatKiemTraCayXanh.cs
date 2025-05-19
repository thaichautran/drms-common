using OpenGIS.Module.Core.Models.Entities.Category;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance.CayXanh
{
    [Table("cx_phieugiamsatgiaovieckiemtra", Schema = "maintenance")]
    public class PhieuGiamSatKiemTraCayXanh
    {
        public PhieuGiamSatKiemTraCayXanh()
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
        public string? kiemtracongtacatld { get; set; }
        public string? kiemtracongtacatgt { get; set; }
        public string? kiemtractvsmtkhuvuctc { get; set; }
        public string? kiemtramatdochephuthamco { get; set; }
        public string? kiemtrachieucaothamco { get; set; }
        public string? kiemtradophangthamco { get; set; }
        public string? kiemtradodocmepviathamco { get; set; }
        public string? kiemtravesinhthamco { get; set; }
        public string? kiemtratinhhinhsaubenhcaydaithamco { get; set; }
        public string? kiemtrahinhkhoimanghoaluunien { get; set; }
        public string? kiemtramatdochephuhoaluunien { get; set; }
        public string? kiemtramausachoaluunien { get; set; }
        public string? kiemtravesinhgoccayhoaluunien { get; set; }
        public string? kiemtratinhhinhsaubenhhoaluunien { get; set; }
        public string? kiemtratinhhinhrahoaluunien { get; set; }
        public string? kiemtradocaocaydonle { get; set; }
        public string? kiemtratancaydonle { get; set; }
        public string? kiemtramausaclacaydonle { get; set; }
        public string? kiemtratinhhinhsaubenhcaydonle { get; set; }
        public string? kiemtravesinhcaydonle { get; set; }
        public string? kiemtravanggoccaydonle { get; set; }
        public string? kiemtraanhhuongtamnhincaydonle { get; set; }
        public string? kiemtrahinhkhoibonnamhoa { get; set; }
        public string? kiemtradotoixopcuadathoathoivu { get; set; }
        public string? kiemtravesinhhoathoivu { get; set; }
        public string? kiemtratylecaycohoa { get; set; }
        public string? kiemtratinhhinhsaubenhhoathoivu { get; set; }
        public string? kiemtramausachoathoivu { get; set; }
        public string? kiemtradocaocaycanh { get; set; }
        public string? kiemtratancaycanh { get; set; }
        public string? kiemtramausaclacaycanh { get; set; }
        public string? kiemtratinhhinhsaubenhcaycanh { get; set; }
        public string? kiemtrachatluongchaucaycanh { get; set; }
        public string? kiemtravesinhchaucaycanh { get; set; }
        public string? kiemtravesinhchaugoccaycanh { get; set; }
        public string? kiemtravesinhduongdao { get; set; }
        public string? danhgiachatluongthugomrac { get; set; }
        public string? kiemtratinhtrangcaybongmat { get; set; }
        public string? kiemtravesinhgoccaybongmat { get; set; }
        public string? kiemtravanggoccaybongmat { get; set; }
        public string? kiemtravieccatmamnhanhgoccaybongmat { get; set; }
        public string? kiemtraquetvoicaybongmat { get; set; }
        public string? kiemtrabonphancaybongmat { get; set; }
        public string? kiemtracocchongcaybongmat { get; set; }
        public string? kiemtra_tuoinuoc { get; set; }
        public string? kiemtra_congtac_phatco { get; set; }
        public string? kiemtra_congtac_xenle { get; set; }
        public string? kiemtra_congtac_lamcotap { get; set; }
        public string? kiemtra_congtac_trongdamco { get; set; }
        public string? anhminhhoa { get; set; }
        public string? ghichu { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public virtual CongCuKiemTra? congCuKiemTra { get; set; }
        public virtual PhuongThucKiemTra? phuongThucKiemTra { get; set; }
        [NotMapped]
        public IEnumerable<GiaoViecNhanVien>? giaoViecNhanViens { get; set; }
        [NotMapped]
        public IEnumerable<ThongTinTraoDoiKiemTra>? thongTinTraoDois { get; set; }
        [NotMapped]
        public IEnumerable<HoSoQuanLyKiemTra>? hoSoQuanLys { get; set; }
        [NotMapped]
        public List<int>? deleteHoSoQuanLyIds { get; set; }
        [NotMapped]
        public IEnumerable<AnhMinhHoaKiemTra>? anhMinhHoas { get; set; }
        [NotMapped]
        public List<int>? deleteAnhMinhHoaIds { get; set; }
        [NotMapped]
        public IEnumerable<KiemTraBaoDuongCongTrinh>? congTrinhBaoDuongs { get; set; }
    }
}
