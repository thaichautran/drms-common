using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("thongtintraodoi", Schema = "maintenance")]
    public class ThongTinTraoDoiKiemTra
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? user_id { get; set; }
        public string? message { get; set; }
        public DateTime? user_cr_dtime { get; set; }
        public int? phieugiamsat_id { get; set; }
        public string? image_url { get; set; }
        public string? loaikiemtra { get; set; }
        [NotMapped]
        public IFormFile? file { get; set; }
        [NotMapped]
        public string? user_name { get; set; }
        [NotMapped]
        public string? time_create_txt => user_cr_dtime?.ToString("HH:mm");
        [NotMapped]
        public string? date_create_txt => user_cr_dtime?.ToString("dd/MM/yyyy");
        [NotMapped]
        public string? datetime_create_txt => user_cr_dtime?.ToString("dd//MM/yyyy HH:mm");
    }
}