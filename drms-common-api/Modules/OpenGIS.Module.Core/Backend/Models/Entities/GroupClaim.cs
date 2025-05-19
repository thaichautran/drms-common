using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("group_claims", Schema = "public")]
    public class GroupClaim
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string group_id { get; set; }
        public string claim_type { get; set; }
        public string claim_value { get; set; }
    }
}

