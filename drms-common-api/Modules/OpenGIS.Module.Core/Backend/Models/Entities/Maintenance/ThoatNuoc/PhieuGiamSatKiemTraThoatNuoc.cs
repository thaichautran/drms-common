using NpgsqlTypes;
using OpenGIS.Module.Core.Models.Entities.Category;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance.ThoatNuoc
{
    [Table("tn_phieugiamsatgiaovieckiemtra", Schema = "maintenance")]
    public class PhieuGiamSatKiemTraThoatNuoc
    {
        public PhieuGiamSatKiemTraThoatNuoc()
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
        public string? kiemtracaododaycongthoatnuoc { get; set; }
        public string? kiemtracaodomucnuoctronglongcong { get; set; }
        public string? kiemtrahuongtuyenthoatnuoc { get; set; }
        public string? kiemtrachatlieucongthoatnuoc { get; set; }
        public string? kiemtratietdiencongthoatnuoc { get; set; }
        public string? kiemtramucnuocmuongsong { get; set; }
        public string? kiemtrakichthuocmuongsong { get; set; }
        public string? kiemtravesinh { get; set; }
        public string? kiemtracongtacxulybunmuongsong { get; set; }
        public string? kiemtrathoigiannaovetmuongsong { get; set; }
        public string? kiemtramucnuochodieuhoa { get; set; }
        public string? kiemtrathietbidomucnuochodieuhoa { get; set; }
        public string? kiemtralichsuxulychatluongnuoc { get; set; }
        public string? kiemtrathoigiannaovethodieuhoa { get; set; }
        public string? kiemtracaodohodieuhoa { get; set; }
        public string? kiemtrakichthuochoga { get; set; }
        public string? kiemtracongnghexulyhoga { get; set; }
        public string? kiemtracongsuattiepnhanhoga { get; set; }
        public string? kiemtracongsuatthietkehoga { get; set; }
        public string? kiemtrahethongcanhoga { get; set; }
        public string? kiemtrathietbithiconghoga { get; set; }
        public string? kiemtratinhtranghoatdongmaybom { get; set; }
        public string? kiemtracongtacthugomrac { get; set; }
        public string? kiemtratapketrac { get; set; }
        public string? kiemtramucnuocnhamayxlnt { get; set; }
        public string? kiemtratinhtrangmaybomnhamayxlnt { get; set; }
        public string? kiemtradocaoranhthoatnuoc { get; set; }
        public string? kiemtradophangranhthoatnuoc { get; set; }
        public string? kiemtradodocmepviaranhthoatnuoc { get; set; }
        public string? kiemtradientichngapungdiemden { get; set; }
        public string? kiemtradosaudiemngapung { get; set; }
        public string? kiemtramucnuoctrucuuhoa { get; set; }
        public string? kiemtratinhtrangmaybomtrucuuhoa { get; set; }
        public string? kiemtrathietbitrucuuhoa { get; set; }
        public string? kiemtraduongonggantrucuuhoa { get; set; }
        public string? kiemtraapsuatnuoctrucuuhoa { get; set; }
        public string? kiemtravatlieucuuhoa { get; set; }
        public string? kiemtrahethonggscltrucuuhoa { get; set; }
        public string? kiemtracaodomucnuoccuaxa { get; set; }
        public string? kiemtradophangcuaxa { get; set; }
        public string? kiemtrakichthuoccuaxa { get; set; }
        public string? kiemtrathoidiemnaovetcuaxa { get; set; }
        public string? kiemtracongdapmuongsong { get; set; }
        public string? kiemtra_naovet_bun { get; set; }
        public string? kiemtra_longcong { get; set; }
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
