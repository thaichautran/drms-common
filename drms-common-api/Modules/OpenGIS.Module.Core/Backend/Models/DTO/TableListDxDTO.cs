using System.Collections.Generic;
using OpenGIS.Module.Core.Models.DevExtreme;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class TableListDxDTO : DxGridDTO
    {
        public List<string> tableSchema { get; set; } = new List<string>();
    }
}