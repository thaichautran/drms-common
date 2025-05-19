using System;
using OpenGIS.Module.Core.Models.DevExtreme;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class FeatureMaintenanceListDxDTO : DxGridDTO
    {
        public string? loaikiemtra { get; set; }
        public int? table_id { get; set; } = 0;
        public int? layer_id { get; set; } = 0;
        public string? feature_id { get; set; } = "";
    }
}