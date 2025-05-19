using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.DevExtreme;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class BakupHistoryListDxDTO : DxGridDTO
    {
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
    }
}