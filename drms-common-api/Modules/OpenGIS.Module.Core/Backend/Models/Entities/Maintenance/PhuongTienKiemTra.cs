using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("phuongtienkiemtra", Schema = "maintenance")]
    public class PhuongTienKiemTra
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? tenphuongtien { get; set; }
        public string? tinhtrang { get; set; }
        public string? ghichu { get; set; }
        public string? loaikiemtra { get; set; }
    }
}