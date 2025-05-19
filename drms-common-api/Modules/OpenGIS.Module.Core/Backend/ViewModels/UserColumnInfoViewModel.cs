using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.ViewModels
{
    public class UserColumnInfoViewModel
    {
        public string? user_id { get; set; }
        public int[]? table_ids { get; set; }
    }
    public class UpdateUserTablesViewModel
    {
        public string? user_id { get; set; }
        public string? tables { get; set; }
    }
    public class UpdateUserLayersViewModel
    {
        public string? user_id { get; set; }
        public string? layers { get; set; }
    }
    public class UpdateUserColumnsViewModel
    {
        public string? user_id { get; set; }
        public string? columns { get; set; }
    }
    public class UpdateUserReportsViewModel
    {
        public string? user_id { get; set; }
        public string? reports { get; set; }
    }
    public class UpdateUserFoldersViewModel
    {
        public string? user_id { get; set; }
        public string? folders { get; set; }
    }
    public class UpdateUserRegionsViewModel
    {
        public string? user_id { get; set; }
        public string? regions { get; set; }
    }
    public class UpdateUserPermissionsViewModel
    {
        public string? user_id { get; set; }
        public string? permissions { get; set; }
        public string? role { get; set; }
    }
}
