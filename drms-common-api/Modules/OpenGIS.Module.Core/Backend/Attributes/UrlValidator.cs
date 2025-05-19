
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using VietGIS.Infrastructure;

namespace CBRM.Module.Core.Attributes
{
    public class UrlValidator : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (value != null)
            {
                var url = value.ToString();
                if (!string.IsNullOrWhiteSpace(url) && (url.StartsWith(GlobalConfiguration.CDNUrl) || url.StartsWith(GlobalConfiguration.DocumentPath) || url.StartsWith(GlobalConfiguration.ImagePath)))
                {
                    return ValidationResult.Success;
                }
                else
                {
                    return new ValidationResult(ErrorMessage);
                }
            }
            else
            {
                return ValidationResult.Success;
            }
        }
    }
}