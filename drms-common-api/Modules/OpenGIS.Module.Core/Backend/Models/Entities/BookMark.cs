using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("bookmark", Schema = "public")]

    public class BookMark
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? key { get; set; }
        public string? extent { get; set; }
        public DateTime created_time { get; set; }
        public string? user_id { get; set; }
        public string? note { get; set; }
        public string? url { get; set; }
    }
}