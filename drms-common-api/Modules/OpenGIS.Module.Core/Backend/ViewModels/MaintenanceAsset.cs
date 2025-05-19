using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.ViewModels
{
    public class WorderAssetViewModel
    {
        public int id { get; set; }
        public int asset_id { get; set; }
        public int maintenance_id { get; set; }
        public int layer_id { get; set; }
        public string ghi_chu { get; set; }
        public string text { get; set; }
        public Worder worder { get; set; }
    }
}