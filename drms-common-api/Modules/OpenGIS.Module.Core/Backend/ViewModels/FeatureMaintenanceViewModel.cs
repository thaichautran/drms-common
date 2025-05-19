using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.Models
{
    public class FeatureMaintenanceViewModel
    {
        public int id { get; set; }
        public string? thoitiet { get; set; }
        public string? thietbi { get; set; }
        public int? sonhancong { get; set; }
        public string? vitri { get; set; }
        public string? diadiem { get; set; }
        public string? tencongtrinh { get; set; }
        public string? nhathau { get; set; }
        public string? donvithicong { get; set; }
        public DateTime ngaythuchien { get; set; }
        public DateTime ngayketthuc { get; set; }
        public string? anhminhhoa { get; set; }
        public string? ghichu { get; set; }
        public int phuongthuckiemtraid { get; set; }
        public int congcukiemtraid { get; set; }
        public string? phuongthuckiemtra { get; set; }
        public string? congcukiemtra { get; set; }
        public string? kiemtracongtacatld { get; set; }
        public string? kiemtracongtacatgt { get; set; }
        public string? kiemtractvsmtkhuvuctc { get; set; }
    }
}
