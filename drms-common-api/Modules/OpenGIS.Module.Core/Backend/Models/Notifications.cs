using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models
{
    [Table("notifications", Schema = "public")]
    public class Notifications
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string  description { get; set; }

        public string user_id { get; set; }

        public int created_at { get; set; }
        public  bool is_read  { get; set; }
        public string url { get; set; }
    }
}
