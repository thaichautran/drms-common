using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("yeucaukiemtra", Schema = "maintenance")]
    public class YeuCauKiemTraSuaChua
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? tenyeucau { get; set; }
        public string? loaiyeucau { get; set; }
        public string? noidung { get; set; }
        public string? tennguoitao { get; set; }
        public DateTime? ngaykhoitao { get; set; }
        public DateTime? ngaycapnhat { get; set; }
        public string? phongban { get; set; }
    }
}