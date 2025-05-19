using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    public class LichChamSocCayXanh
    {
        public int id { get; set; }
        public string? macay { get; set; }
        public string? loaicay { get; set; }
        public string? diachi { get; set; }
        public string? vitri { get; set; }
        public string? chieucao { get; set; }
        public string? duongkinh { get; set; }
        public string? hientrangid { get; set; }
        public string? lichcat { get; set; }
        public string? tuyenduong { get; set; }
    }
}