using NpgsqlTypes;
using OpenGIS.Module.Core.Models.Entities.Category;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance.KhuDoThi
{
    [Table("kdc_phieugiamsatgiaovieckiemtra", Schema = "maintenance")]
    public class PhieuGiamSatKiemTraKhuDoThi
    {
        public PhieuGiamSatKiemTraKhuDoThi()
        {
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
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
        [ForeignKey(nameof(phuongThucKiemTra))]
        public int phuongthuckiemtraid { get; set; }
        [ForeignKey(nameof(congCuKiemTra))]
        public int congcukiemtraid { get; set; }
        public string? kiemtracongtacatld { get; set; }
        public string? kiemtracongtacatgt { get; set; }
        public string? kiemtractvsmtkhuvuctc { get; set; }
        public string? kiemtravesinhcayxanh { get; set; }
        public string? kiemtrachatluongcayxanh { get; set; }
        public string? kiemtratinhtrangcayxanh { get; set; }
        public string? kiemtratinhhinhsaubenhcayxanh { get; set; }
        public string? kiemtrachieucaocayxanh { get; set; }
        public string? kiemtratancayxanh { get; set; }
        public string? kiemtramausaclacayxanh { get; set; }
        public string? kiemtraloaicot { get; set; }
        public string? kiemtracanden { get; set; }
        public string? kiemtradaydan { get; set; }
        public string? kiemtrabangdiencuacot { get; set; }
        public string? kiemtrabeden { get; set; }
        public string? kiemtrasoluongden { get; set; }
        public string? kiemtrachungloaivoden { get; set; }
        public string? kiemtrasocanden { get; set; }
        public string? kiemtrachieucaocot { get; set; }
        public string? kiemtrasoluongbauden { get; set; }
        public string? kiemtravesinhthoatnuoc { get; set; }
        public string? kiemtracongtacthugomrac { get; set; }
        public string? kiemtratapketrac { get; set; }
        public string? kiemtraduongkinhcong { get; set; }
        public string? kiemtratietdiencong { get; set; }
        public string? kiemtrachatlieucong { get; set; }
        public string? kiemtrachieudaicong { get; set; }
        public string? kiemtracaododaycong { get; set; }
        public string? kiemtradodoccong { get; set; }
        public string? kiemtracaodomucnuoctronglongcong { get; set; }
        public string? kiemtrahuongtuyenthoatnuoc { get; set; }
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
