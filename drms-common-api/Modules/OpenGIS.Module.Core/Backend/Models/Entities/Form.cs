using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("forms", Schema = "public")]
    public class Form
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? name { get; set; } = string.Empty;
        public string? description { get; set; } = string.Empty;
        public int created_at { get; set; }
        public int updated_at { get; set; }
        public string? code { get; set; }
        public string? user_id { get; set; }
        public string? created_by { get; set; }
        public int source_id { get; set; }
        [ForeignKey(nameof(tableInfo))]
        public int table_id { get; set; }
        [ForeignKey(nameof(map))]
        public int map_id { get; set; }
        [NotMapped]
        public bool include_data { get; set; } = false;
        [NotMapped]
        public int layer_id { get; set; }
        public bool is_enabled { get; set; }

        public virtual IEnumerable<FormField>? form_fields { get; set; }
        public virtual TableInfo? tableInfo { get; set; }
        public virtual Layer? layer { get; set; }
        public virtual Map? map { get; set; }

        [Table("form_action", Schema = "public")]
        public sealed class Action
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int id { get; set; }
            [ForeignKey(nameof(form))]
            public int form_id { get; set; }
            public Form? form { get; set; }
            public string? user_action { get; set; }
            public int? fail_counter { get; set; }
            public int? success_counter { get; set; }
            public DateTime? action_at { get; set; }
        }
        [Table("form_feature", Schema = "public")]
        public sealed class Feature
        {
            [Key]
            [ForeignKey(nameof(form))]
            public int form_id { get; set; }
            public Form? form { get; set; }
            [Key]
            [ForeignKey(nameof(table))]
            public int table_id { get; set; }
            public TableInfo? table { get; set; }
            [Key]
            public int feature_id { get; set; }
        }

    }
}