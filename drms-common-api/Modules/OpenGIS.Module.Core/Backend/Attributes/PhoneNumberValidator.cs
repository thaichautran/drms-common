
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using OpenGIS.Module.Core.Helpers;
using VietGIS.Infrastructure;

namespace OpenGIS.Module.Core.Attributes
{
    public class PhoneNumberValidator : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (value != null)
            {
                var phọneNumber = value.ToString();
                if (!string.IsNullOrWhiteSpace(phọneNumber) && StringUtils.isValidPhone(phọneNumber))
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