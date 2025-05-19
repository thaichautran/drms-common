using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Models.Entities.Maintenance.ThoatNuoc;

namespace OpenGIS.Module.Core.Models
{
    [Table("dulieu_mua", Schema = "csdl_thoatnuoc")]
    public class DuLieuMua
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? luuvuc { get; set; }
        public double? lon { get; set; }
        public double? lat { get; set; }
        public string? tensong { get; set; }
        public string? station_name { get; set; }
        public string? station_id { get; set; }
        public string? source_name { get; set; }
        public string? source_name_map { get; set; }
        public double? total { get; set; }
        public string? tinh { get; set; }
        public string? phuongxa { get; set; }
        public string? quanhuyen { get; set; }
        public double? h0 { get; set; }
        public double? h1 { get; set; }
        public double? h2 { get; set; }
        public double? h3 { get; set; }
        public double? h4 { get; set; }
        public double? h5 { get; set; }
        public double? h6 { get; set; }
        public double? h7 { get; set; }
        public double? h8 { get; set; }
        public double? h9 { get; set; }
        public double? h10 { get; set; }
        public double? h11 { get; set; }
        public double? h12 { get; set; }
        public double? h13 { get; set; }
        public double? h14 { get; set; }
        public double? h15 { get; set; }
        public double? h16 { get; set; }
        public double? h17 { get; set; }
        public double? h18 { get; set; }
        public double? h19 { get; set; }
        public double? h20 { get; set; }
        public double? h21 { get; set; }
        public double? h22 { get; set; }
        public double? h23 { get; set; }
        public DateTime? daterain { get; set; }
        [NotMapped]
        public IEnumerable<FloodedAreaScript>? listKichBan { get; set; }
    }
}