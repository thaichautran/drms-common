using NpgsqlTypes;
using OpenGIS.Module.Core.Models.Entities.Category;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance.TuyNen
{
    [Table("tuynen_phieugiamsatgiaovieckiemtra", Schema = "maintenance")]
    public class PhieuGiamSatKiemTraTuyNen
    {
        public PhieuGiamSatKiemTraTuyNen()
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
        public string? kiemtrachatlieutramden { get; set; }
        public string? kiemtracongsuattheotram { get; set; }
        public string? kiemtracongsuattheotuyen { get; set; }
        public string? kiemtracongsuattheotuyenquanly { get; set; }
        public string? kiemtrakhoidongtu { get; set; }
        public string? kiemtraaptomat { get; set; }
        public string? kiemtrabochuyenmach { get; set; }
        public string? kiemtrathietbidieukhientrungtam { get; set; }
        public string? kiemtradonghohengio { get; set; }
        public string? kiemtraloaicot { get; set; }
        public string? kiemtradaydan { get; set; }
        public string? kiemtrabangdiencuacot { get; set; }
        public string? kiemtrachungloaivoden { get; set; }
        public string? kiemtrachieucaocot { get; set; }
        public string? kiemtrasoluongbaudentrencot { get; set; }
        public string? kiemtratietdientuyencap { get; set; }
        public string? kiemtrachieudaituyencap { get; set; }
        public string? kiemtrachatlieutuyencap { get; set; }
        public string? kiemtrabodieukhientrangtri { get; set; }
        public string? kiemtratudieukhientrangtri { get; set; }
        public string? kiemtraloaidaylenden { get; set; }
        public string? kiemtrachieudaidaylenden { get; set; }
        public string? kiemtrakichthuocdaylenden { get; set; }
        public string? kiemtraloaibong { get; set; }
        public string? kiemtracongsuatbong { get; set; }
        public string? kiemtra_tu_phandoan { get; set; }
        public string? kiemtra_diemsang { get; set; }
        public string? kiemtra_hethong_chieusang { get; set; }
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
        public IEnumerable<AnhMinhHoaKiemTra>? anhMinhHoas { get; set; }
        [NotMapped]
        public IEnumerable<KiemTraBaoDuongCongTrinh>? congTrinhBaoDuongs { get; set; }
        [NotMapped]
        public List<int>? deleteHoSoQuanLyIds { get; set; }
        [NotMapped]
        public List<int>? deleteAnhMinhHoaIds { get; set; }
    }
}
