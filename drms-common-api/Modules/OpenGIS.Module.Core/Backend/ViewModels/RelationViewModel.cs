using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities;

namespace OpenGIS.Module.Core.Models
{
    public class RelationviewModel
    {
        public IEnumerable<CategoryBaseEntity> items { get; set; }
        public IEnumerable<RelationSelected> selected { get; set; }
    }

    public class RelationSelected
    {
        public int id { get; set; }
        public string mo_ta { get; set; }
        public int row_id { get; set; }
    }
}